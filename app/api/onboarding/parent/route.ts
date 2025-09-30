// /app/api/onboarding/parent/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { User } from "@/models/User";
import { auth } from "@/auth"; // next-auth helper (v5) to read server session
import { Types } from "mongoose";

const Body = z.object({
  isParent: z.boolean(),
  magicBudgetCents: z.number().int().min(0).optional(),
  giftSettings: z.object({
    minGifts: z.number().int().min(0).max(999),
    maxGifts: z.number().int().min(0).max(999),
    perGiftCapCents: z.number().int().min(0),
  }).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { isParent, magicBudgetCents = 0, giftSettings } = parsed.data;

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!isParent) {
    user.isParentOnboarded = true; // they’re not a parent, but onboarding complete
    await user.save();
    return NextResponse.json({ ok: true });
  }

  if (user.parentId) {
    // already onboarded as parent
    user.isParentOnboarded = true;
    await user.save();
    return NextResponse.json({ ok: true, parentId: user.parentId.toString() });
  }

  const parent = await Parent.create({
    userId: user._id,
    name: user.name ?? "",
    email: user.email,
    magicBudgetCents,
    giftSettings: giftSettings ?? undefined,
    // other defaults in schema will fill in
  });

  user.parentId = new Types.ObjectId(parent._id.toString());
  user.isParentOnboarded = true;
  await user.save();

  return NextResponse.json({ ok: true, parentId: parent._id.toString() });
}
