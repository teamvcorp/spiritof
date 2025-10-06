import { Parent } from "@/models/Parent";
import { dbConnect } from "@/lib/db";

export async function hasCompletedWelcomePacket(parentId: string): Promise<boolean> {
  await dbConnect();
  
  const parent = await Parent.findById(parentId).lean();
  if (!parent) return false;
  
  // Check if parent has any completed welcome packet orders
  return Boolean(
    parent.welcomePacketOrders?.some(order => order.status === 'completed')
  );
}

export async function canAddChildren(parentId: string): Promise<{
  canAdd: boolean;
  reason?: string;
  hasWelcomePacket: boolean;
}> {
  const hasWelcomePacket = await hasCompletedWelcomePacket(parentId);
  
  if (!hasWelcomePacket) {
    return {
      canAdd: false,
      reason: "Must complete welcome packet setup before adding children",
      hasWelcomePacket: false
    };
  }
  
  return {
    canAdd: true,
    hasWelcomePacket: true
  };
}

export function generateShareSlug() {
  const rand = Array.from({ length: 8 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return rand.toUpperCase();
}

export function clampInt(n: number, min = 0, max = 100) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}