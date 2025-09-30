import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";

function parseIntField(v: FormDataEntryValue | null, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : def;
}

function parseDollarToCents(v: FormDataEntryValue | null, def = 0) {
  const dollars = Number(v);
  return Number.isFinite(dollars) ? Math.max(0, Math.round(dollars * 100)) : def;
}

async function submitOnboarding(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/login");

  const isParent = String(formData.get("isParent") ?? "") === "on";
  const magicBudgetCents = parseDollarToCents(formData.get("magicBudget"));
  const minGifts = parseIntField(formData.get("minGifts"), 1);
  const maxGifts = parseIntField(formData.get("maxGifts"), 5);
  const perGiftCapCents = parseDollarToCents(formData.get("perGiftCap"));

  if (!isParent) {
    user.isParentOnboarded = true;
    await user.save();
    redirect("/dashboard");
  }

  // If already has a parent, just mark onboarded
  if (user.parentId) {
    user.isParentOnboarded = true;
    await user.save();
    redirect("/parent/dashboard");
  }

  const parent = await Parent.create({
    userId: user._id,
    name: user.name ?? "",
    email: user.email,
    magicBudgetCents,
    giftSettings: { minGifts, maxGifts, perGiftCapCents },
  });

  user.parentId = parent._id;
  user.isParentOnboarded = true;
  await user.save();

  redirect("/parent/dashboard");
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (user?.isParentOnboarded) redirect("/parent/dashboard");

  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Welcome!</h1>
        <p className="text-sm text-muted-foreground">Let’s get you set up.</p>
      </header>

      <form action={submitOnboarding} className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <input id="isParent" name="isParent" type="checkbox" className="h-4 w-4" />
          <label htmlFor="isParent" className="text-sm">I am a parent/guardian</label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm">Monthly Magic Budget ($)</label>
            <input 
              name="magicBudget" 
              type="number" 
              min={0} 
              step="0.01" 
              defaultValue={0} 
              className="w-full rounded-md border px-3 py-2 text-sm bg-background" 
              placeholder="25.00"
            />
            <p className="text-xs text-muted-foreground">Amount you want to spend monthly on magic points.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm">Min Gifts</label>
            <input name="minGifts" type="number" min={0} defaultValue={1} className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm">Max Gifts</label>
            <input name="maxGifts" type="number" min={0} defaultValue={5} className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm">Per-Gift Cap ($)</label>
            <input 
              name="perGiftCap" 
              type="number" 
              min={0} 
              step="0.01" 
              defaultValue={0} 
              className="w-full rounded-md border px-3 py-2 text-sm bg-background" 
              placeholder="50.00"
            />
            <p className="text-xs text-muted-foreground">Maximum amount per gift. Leave 0 for no limit.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="submit" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Continue</button>
          <button formAction={submitOnboarding} name="isParent" value="" className="text-sm underline">Skip (I’m not a parent)</button>
        </div>
      </form>
    </main>
  );
}
