import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { redirect } from "next/navigation";
import type { IChild } from "@/types/childType";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { FaHeart, FaGift, FaShare } from "react-icons/fa";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function submitDonation(formData: FormData) {
  "use server";
  
  const childId = String(formData.get("childId") ?? "");
  const donationAmount = Number(formData.get("donationAmount") ?? 0);
  const donorName = String(formData.get("donorName") ?? "").trim();
  const donorEmail = String(formData.get("donorEmail") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!childId || donationAmount < 1 || donationAmount > 100 || !donorName) {
    return; // Add proper error handling later
  }

  await dbConnect();
  const child = await Child.findById(childId);
  if (!child || !child.donationsEnabled) return;

  // For now, just add the magic points directly (in real app, this would involve Stripe)
  const magicPointsToAdd = donationAmount; // 1:1 ratio for demo

  // Add neighbor ledger entry using the method
  const childDoc = child as unknown as { addNeighborLedgerEntry: (entry: { type: string; amountCents: number; fromName?: string; fromEmail?: string; message?: string; status?: string }) => void };
  childDoc.addNeighborLedgerEntry({
    type: "DONATION",
    amountCents: donationAmount * 100, // Convert to cents
    fromName: donorName,
    fromEmail: donorEmail || undefined,
    message: message || undefined,
    status: "SUCCEEDED", // Demo mode - mark as succeeded immediately
  });

  // Update totals and magic score
  child.donorTotals = child.donorTotals || { count: 0, totalCents: 0 };
  child.donorTotals.count += 1;
  child.donorTotals.totalCents += donationAmount * 100;
  child.score365 = Math.min(365, child.score365 + magicPointsToAdd);

  // Mark the ledger entry as succeeded (in real app, this would be after Stripe confirms)
  const entries = child.neighborLedger as unknown as Array<{ status: string }>;
  if (entries.length > 0) {
    entries[entries.length - 1].status = "SUCCEEDED";
  }

  const childDoc2 = child as unknown as { recomputeNeighborBalance: () => void };
  childDoc2.recomputeNeighborBalance();
  await child.save();

  redirect(`/share/${child.shareSlug}?success=true`);
}

export default async function SharePage({ params }: PageProps) {
  const { slug } = await params;

  await dbConnect();
  const child = await Child.findOne({ shareSlug: slug }).lean<IChild | null>();

  if (!child || !child.donationsEnabled) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-evergreen to-santa flex items-center justify-center p-4">
        <Container>
          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-santa mb-4">Page Not Found</h1>
            <p className="text-gray-600">This donation page is not available.</p>
          </div>
        </Container>
      </main>
    );
  }

  const donorCount = child.donorTotals?.count || 0;
  const totalDonated = (child.donorTotals?.totalCents || 0) / 100;
  const magicPercentage = Math.round((child.score365 / 365) * 100);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-evergreen to-santa p-4">
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image
                src="/images/santa.png"
                alt="Spirit of Santa"
                width={120}
                height={120}
                className="mx-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Spirit of Santa</h1>
            <p className="text-white/80 text-lg">Help {child.displayName} earn Christmas magic!</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="text-center mb-6">
              {child.avatarUrl ? (
                <Image
                  src={child.avatarUrl}
                  alt={child.displayName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto object-cover mb-4"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-evergreen text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {child.displayName[0]?.toUpperCase()}
                </div>
              )}
              <h2 className="text-2xl font-bold text-evergreen">{child.displayName}</h2>
              <p className="text-gray-600">is working hard to be on Santa&apos;s nice list!</p>
            </div>

            {/* Magic Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Christmas Magic Progress</span>
                <span className="text-sm text-gray-600">{child.score365}/365</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-santa to-evergreen h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(magicPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{magicPercentage}% complete</p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-evergreen/10 rounded-lg">
                <FaHeart className="text-santa text-xl mx-auto mb-1" />
                <div className="text-lg font-bold text-evergreen">{donorCount}</div>
                <div className="text-xs text-gray-600">Community Helpers</div>
              </div>
              <div className="text-center p-3 bg-santa/10 rounded-lg">
                <FaGift className="text-evergreen text-xl mx-auto mb-1" />
                <div className="text-lg font-bold text-santa">${totalDonated.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Magic Donated</div>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-evergreen mb-4 text-center">
              <FaHeart className="inline mr-2" />
              Spread Christmas Magic
            </h3>
            
            <form action={submitDonation} className="space-y-4">
              <input type="hidden" name="childId" value={String(child._id)} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  name="donorName"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  name="donorEmail"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magic Amount ($1 = 1 magic point) *
                </label>
                <select
                  name="donationAmount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen"
                >
                  <option value="">Select amount</option>
                  <option value="1">$1 - Small Magic</option>
                  <option value="5">$5 - Good Magic</option>
                  <option value="10">$10 - Great Magic</option>
                  <option value="25">$25 - Amazing Magic</option>
                  <option value="50">$50 - Incredible Magic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encouraging Message (optional)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen"
                  placeholder="Write a nice message for the child..."
                  maxLength={500}
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-santa text-white py-3 text-lg font-semibold"
              >
                <FaGift className="mr-2" />
                Give Christmas Magic
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                This is a demo. In a real implementation, this would process payments securely.
              </p>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
            <h3 className="text-lg font-bold text-evergreen mb-4 text-center">
              <FaShare className="inline mr-2" />
              Share This Page
            </h3>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Help {child.displayName} by sharing this page with others!
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button className="bg-blueberry text-white text-sm">
                  Share on Facebook
                </Button>
                <Button className="bg-evergreen text-white text-sm">
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}