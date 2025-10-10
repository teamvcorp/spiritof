import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { User } from "@/models/User";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { IParent } from "@/types/parentTypes";
import Vote from "@/components/parents/Vote";
import WalletTopup from "@/components/parents/WalletTopup";
import AddChildFormWrapper from "@/components/parents/AddChildFormWrapper.client";
import ChristmasFinalization from "@/components/parents/ChristmasFinalization";
import { WelcomePacketButton } from "@/components/parents/WelcomePacketButton";
import { hasCompletedWelcomePacket, generateUniqueShareSlug, clampInt } from "@/lib/welcome-packet-helpers";
import DashboardClient from "./DashboardClient";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

// Dynamically import client components
const QRShareButton = dynamic(() => import("@/components/parents/QRShareButton"));

// Server actions
async function createChildWrapper(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await dbConnect();

  // Get user's parentId first
  const user = await User.findById(session.user.id).select("parentId").lean();
  if (!user?.parentId) return { error: "No parent found" };

  const parent = await Parent.findById(user.parentId);
  if (!parent) return { error: "Parent not found" };

  // Check if welcome packet has been completed before allowing child creation
  const hasWelcomePacket = await hasCompletedWelcomePacket(parent._id.toString());
  if (!hasWelcomePacket) {
    return { error: "Welcome packet must be completed before adding children" };
  }

  const displayName = String(formData.get("displayName") || "").trim();
  const percentAllocation = Number(formData.get("percentAllocation") || 0);
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || undefined;

  if (!displayName) return { error: "Display name is required" };

  // Check existing budget allocation
  const existingChildren = await Child.find({ parentId: parent._id });
  const currentTotalAllocation = existingChildren.reduce((sum, child) => sum + (child.percentAllocation || 0), 0);
  const newTotalAllocation = currentTotalAllocation + percentAllocation;
  
  if (newTotalAllocation > 100) {
    return { 
      error: `Budget exceeded! You've already allocated ${currentTotalAllocation}% to existing children. You can only allocate ${100 - currentTotalAllocation}% more.` 
    };
  }

  const shareSlug = await generateUniqueShareSlug();
  const hasCompletedOrder = parent.welcomePacketOrders?.some(order => order.status === 'completed');

  if (hasCompletedOrder && existingChildren.length > 0) {
    // For additional children, return a special response that triggers payment flow
    return {
      requiresPayment: true,
      message: "This child requires a welcome packet purchase. You'll be redirected to payment."
    };
  }

  // For the first child, create normally (welcome packet already handled in setup)
  let newChild;
  try {
    newChild = await Child.create({
      parentId: parent._id,
      displayName,
      avatarUrl,
      percentAllocation: clampInt(percentAllocation, 0, 100),
      score365: 0,
      donationsEnabled: true,
      shareSlug,
      neighborBalanceCents: 0,
      neighborLedger: [],
    });
  } catch (error: any) {
    // Handle the extremely rare case where collision occurs between check and create
    if (error.code === 11000 && error.message.includes('shareSlug')) {
      console.warn('⚠️ Rare shareSlug collision during create, retrying...');
      const retrySlug = await generateUniqueShareSlug();
      newChild = await Child.create({
        parentId: parent._id,
        displayName,
        avatarUrl,
        percentAllocation: clampInt(percentAllocation, 0, 100),
        score365: 0,
        donationsEnabled: true,
        shareSlug: retrySlug,
        neighborBalanceCents: 0,
        neighborLedger: [],
      });
    } else {
      throw error; // Re-throw other errors
    }
  }

  // Create a new welcome packet order for this child based on the original order
  const originalOrder = parent.welcomePacketOrders?.find(order => order.status === 'completed');
  if (originalOrder) {
    // Create a new welcome packet order marked as completed (no payment required for first child)
    if (!parent.welcomePacketOrders) {
      parent.welcomePacketOrders = [];
    }

    parent.welcomePacketOrders.push({
      stripeSessionId: `auto_${newChild._id}_${Date.now()}`,
      selectedItems: originalOrder.selectedItems || [],
      totalAmount: originalOrder.totalAmount || 10,
      status: 'completed', // Auto-complete for first child
      shippingAddress: originalOrder.shippingAddress,
      shipped: false,
      createdAt: new Date(),
      childId: newChild._id,
      childName: displayName
    });

    await parent.save();
  }

  revalidatePath("/parent/dashboard");
  return { success: true };
}

// Server actions (edit & delete)
export async function updateChild(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;

  await dbConnect();

  // Get user's parentId first
  const user = await User.findById(session.user.id).select("parentId").lean();
  if (!user?.parentId) return;

  // find the parent for this user
  const parent = await Parent.findById(user.parentId);
  if (!parent) return;

  const childId = String(formData.get("childId") ?? "");
  if (!Types.ObjectId.isValid(childId)) return;

  // read form values (define the variables!)
  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatarUrl") ?? "").trim();
  const percentAllocationRaw = Number(formData.get("percentAllocation"));
  const donationsEnabledRaw = formData.get("donationsEnabled");
  const donationsEnabled = donationsEnabledRaw === "on" || donationsEnabledRaw === "true";

  // fetch a real doc (no .lean()), so .save() exists
  const child = await Child.findOne({
    _id: new Types.ObjectId(childId),
    parentId: parent._id,
  });
  if (!child) return;

  if (displayName) child.displayName = displayName;
  child.avatarUrl = avatarUrlRaw || undefined;
  child.percentAllocation = clampInt(
    Number.isFinite(percentAllocationRaw) ? percentAllocationRaw : child.percentAllocation,
    0,
    100
  );
  child.donationsEnabled = donationsEnabled;

  await child.save();
  revalidatePath("/parent/dashboard");
  redirect("/parent/dashboard"); // ← forces a fresh render; modal closes
}

async function deleteChild(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;

  await dbConnect();

  // Get user's parentId first
  const user = await User.findById(session.user.id).select("parentId").lean();
  if (!user?.parentId) return;

  const parent = await Parent.findById(user.parentId);
  if (!parent) return;

  const childId = String(formData.get("childId") || "");
  if (!Types.ObjectId.isValid(childId)) return;

  await Child.deleteOne({ _id: new Types.ObjectId(childId), parentId: parent._id });
  revalidatePath("/parent/dashboard");
}

type DashboardProps = {
  searchParams?: {
    payment?: string;
    session_id?: string;
    welcome_packet?: string;
    child_welcome_packet?: string;
    child?: string;
  };
};

// Page
export default async function ParentDashboardPage({ searchParams }: DashboardProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();

  // Get user's parentId first
  const user = await User.findById(session.user.id).select("parentId").lean();
  if (!user?.parentId) redirect("/onboarding");

  const parent = await Parent.findById(user.parentId).lean();
  if (!parent) redirect("/onboarding");

  const children = await Child.find({ parentId: parent._id }).lean();

  // Check if welcome packet has been completed
  const hasWelcomePacket = await hasCompletedWelcomePacket(parent._id.toString());

  return (
    <Container className="min-w-full bg-evergreen">
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8 bg-white">
        {/* Client-side Christmas Setup and Header */}
        <DashboardClient
          parentId={parent._id.toString()}
          hasChristmasSetup={!!parent.christmasSettings?.setupCompleted}
          searchParams={searchParams}
        />

        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
          <Card className="bg-[rgba(70,213,151,0.3)] backdrop-blur-sm rounded-lg p-4" title="Magic Budget (Monthly)">
            <div className="text-2xl font-bold ">{formatCents(parent.magicBudgetCents)}</div>
            <div className="text-xs text-muted-foreground">Source of truth for allocations</div>
          </Card>
          <Card className="bg-[rgba(70,213,151,0.3)] backdrop-blur-sm rounded-lg p-4" title="Wallet Balance">
            <div className="text-2xl font-bold">{formatCents(parent.walletBalanceCents ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Top-ups & adjustments</div>
          </Card>
          <Card className="bg-[rgba(70,213,151,0.3)] backdrop-blur-sm rounded-lg p-4" title="Gift Settings">
            <div className="text-sm">
              <div>Min: {parent.giftSettings?.minGifts ?? 1}</div>
              <div>Max: {parent.giftSettings?.maxGifts ?? 5}</div>
              <div>Per Gift Cap: {formatCents(parent.giftSettings?.perGiftCapCents ?? 0)}</div>
            </div>
          </Card>
        </section>

        {/* Wallet Top-up Section */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Wallet Management</h2>
          <WalletTopup currentBalance={parent.walletBalanceCents ?? 0} />
        </section>

        {/* Christmas List Finalization */}
        {parent.christmasSettings?.setupCompleted && (
          <section>
            <h2 className="text-xl lg:text-3xl ml-3 mb-3">Christmas List Finalization</h2>
            <ChristmasFinalization
              isFinalized={!!parent.christmasSettings?.listsFinalized}
              finalizedAt={parent.christmasSettings?.listsFinalizedAt?.toISOString()}
              listLockDate={parent.christmasSettings?.listLockDate}
              onFinalizationComplete={async () => {
                "use server";
                revalidatePath("/parent/dashboard");
              }}
            />
          </section>
        )}

        {/* Children list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Children</h2>
            {children.length > 0 && (
              <Link href="/parent/vote">
                <Button className="bg-santa hover:bg-red-700 text-white">
                  🗳️ Vote for Good Behavior
                </Button>
              </Link>
            )}
          </div>
          
          {children.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No children added yet. Add your first child below!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {children.map((c) => {
                const id = String(c._id);
                return (
                  <li key={id} className="rounded-lg border p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      {/* Left: avatar + name */}
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <Image src={c.avatarUrl} alt="avatar" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No Avatar</div>
                        )}
                        <div>
                          <div className="font-medium">{c.displayName}</div>
                          <div className="text-xs text-muted-foreground">ID: {id.slice(-6)}</div>
                        </div>
                      </div>

                      {/* Middle: details */}
                      <div className="space-y-1 text-sm">
                        <div className="text-muted-foreground">Allocation: {c.percentAllocation}%</div>
                        <div className="text-muted-foreground">Naughty/Nice: {c.score365}/365</div>
                        <div className="text-muted-foreground">Neighbor Balance: {formatCents(c.neighborBalanceCents ?? 0)}</div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex sm:justify-end gap-2 flex-wrap">
                        {/* QR Share Button */}
                        <QRShareButton
                          childId={String(c._id)}
                          childName={c.displayName}
                          shareSlug={c.shareSlug}
                        />

                        {/* Edit modal toggle */}
                        <input id={`edit-${id}`} type="checkbox" className="peer hidden" />
                        <label htmlFor={`edit-${id}`} className="btn-secondary">Edit</label>

                        {/* Delete confirm (details) */}
                        <details className="[&_summary]:list-none">
                          <summary className="btn-danger">Delete</summary>
                          <div className="mt-2 p-2 rounded border text-sm">
                            <div className="mb-2">This cannot be undone.</div>
                            <form action={deleteChild}>
                              <input type="hidden" name="childId" value={id} />
                              <button type="submit" className="btn-danger">Confirm Delete</button>
                            </form>
                          </div>
                        </details>

                        {/* Modal content controlled by peer checkbox */}
                        <div className="hidden peer-checked:flex fixed inset-0 bg-black/40 items-center justify-center z-50">
                          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl" role="dialog" aria-modal="true">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold">Edit {c.displayName}</h3>
                              <label htmlFor={`edit-${id}`} className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                                ×
                              </label>
                            </div>

                            <form action={updateChild} className="space-y-3">
                              <input type="hidden" name="childId" value={id} />

                              <div className="flex flex-col gap-1">
                                <label className="text-sm">Display Name</label>
                                <input name="displayName" required defaultValue={c.displayName}
                                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-sm">Percent Allocation (0–100)</label>
                                <input name="percentAllocation" type="number" min={0} max={100}
                                  defaultValue={c.percentAllocation}
                                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-sm">Avatar URL</label>
                                <input name="avatarUrl" defaultValue={c.avatarUrl || ""}
                                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                              </div>

                              <div className="flex items-center gap-2">
                                <input id={`donate-${id}`} type="checkbox" name="donationsEnabled" defaultChecked={c.donationsEnabled ?? true} />
                                <label htmlFor={`donate-${id}`} className="text-sm">Allow neighbor donations</label>
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <label htmlFor={`edit-${id}`} className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                                  Cancel
                                </label>
                                <button type="submit" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                                  Save
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Welcome Packet & Add Child Section */}
        <section className="space-y-4">
          {!hasWelcomePacket ? (
            <div>

              <WelcomePacketButton
                hasCompletedWelcomePacket={hasWelcomePacket}
                className="mb-6"
              />
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-paytone-one text-santa">Add a New Child</h2>

              <div className="bg-gradient-to-br from-santa-50 via-evergreen-50 to-blueberry-50 rounded-2xl border-2 border-santa-200 overflow-hidden">
                <div className="bg-white/60 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-center mb-6">

                  </div>

                  <AddChildFormWrapper createChildAction={createChildWrapper} />

                  {/* Tips Section */}
                  <div className="mt-6 bg-blueberry-50 rounded-lg p-4 border-l-4 border-blueberry-400">
                    <h5 className="text-sm font-medium text-blueberry-800 mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      Tips for Setting Up Your Child
                    </h5>
                    <ul className="text-xs text-blueberry-700 space-y-1">
                      <li>• You can always edit their information later</li>
                      <li>• Budget percentages should add up to 100% across all children</li>
                      <li>• Each child gets their own Christmas list and magic score</li>
                      <li>• Profile pictures make the experience more personal and fun!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </Container>
  );
}

// Small presentational helpers
function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 bg-background ${className || ''}`}>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function formatCents(cents: number) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/**
 * Local component-scoped styles via tailwind-compatible classes.
 * If you already have a design system, replace these with your UI primitives.
 */
