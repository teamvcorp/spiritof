import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import {IUser} from "@/types/user";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";

function parseIntField(v: FormDataEntryValue | null, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : def;
}

async function submitOnboarding(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const user = await User.findById(new Types.ObjectId(session.user.id));
  if (!user) redirect("/login");

  const isParent = String(formData.get("isParent") ?? "") === "on";
  const magicBudgetCents = parseIntField(formData.get("magicBudgetCents"));
  const minGifts = parseIntField(formData.get("minGifts"), 1);
  const maxGifts = parseIntField(formData.get("maxGifts"), 5);
  const perGiftCapCents = parseIntField(formData.get("perGiftCapCents"));

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
  const user = await User.findById(new Types.ObjectId(session.user.id)).lean<IUser>();
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
            <label className="text-sm">Monthly Magic Budget (cents)</label>
            <input name="magicBudgetCents" type="number" min={0} defaultValue={0} className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
            <p className="text-xs text-muted-foreground">Store money in cents for accuracy.</p>
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
            <label className="text-sm">Per-Gift Cap (cents)</label>
            <input name="perGiftCapCents" type="number" min={0} defaultValue={0} className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
            <p className="text-xs text-muted-foreground">0 means no cap.</p>
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
