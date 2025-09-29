// app/parent/dashboard/actions.ts
"use server";

import { cookies } from "next/headers";
import {dbConnect} from "@/lib/db";
import {Parent} from "@/models/Parent";
import bcrypt from "bcryptjs";
import { z } from "zod";

const pinSchema = z
  .string()
  .min(4, "PIN must be at least 4 digits")
  .max(8, "PIN must be at most 8 digits")
  .regex(/^\d+$/, "PIN must be digits only");

export async function setPin(parentId: string, pin: string) {
  await dbConnect();

  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid PIN" };
  }

  const parent = await Parent.findById(parentId);
  if (!parent) return { ok: false, error: "Parent not found" };

  // Don’t allow overwrite if already set (force verify flow instead)
  if (parent.pinIsSet) {
    return { ok: false, error: "PIN already set. Please verify instead." };
  }

  const hash = await bcrypt.hash(pin, 12);
  parent.pinCode = hash;
  parent.pinIsSet = true;
  await parent.save();

  // Set verification cookie right after setting so they go in
  const cookieKey = `parent_pin_ok_${parent._id.toString()}`;
  (await cookies()).set(cookieKey, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/parent",
    maxAge: 60 * 15, // 15 minutes
  });

  return { ok: true };
}

export async function verifyPin(parentId: string, pin: string) {
  await dbConnect();

  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid PIN" };
  }

  const parent = await Parent.findById(parentId).lean();
  if (!parent?.pinIsSet || !parent.pinCode) {
    return { ok: false, error: "PIN not set." };
  }

  const match = await import("bcryptjs").then(({ default: b }) => b.compare(pin, parent.pinCode as string));
  if (!match) {
    // (Optional) Add attempt throttling here
    return { ok: false, error: "Incorrect PIN." };
  }

  const cookieKey = `parent_pin_ok_${parent._id.toString()}`;
  (await cookies()).set(cookieKey, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/parent",
    maxAge: 60 * 15, // 15 minutes
  });

  return { ok: true };
}

export async function clearPinVerification(parentId: string) {
  const cookieKey = `parent_pin_ok_${parentId}`;
  (await cookies()).delete(cookieKey);
  return { ok: true };
}
