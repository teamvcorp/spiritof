import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { dbConnect } from "@/lib/db";

export async function hasCompletedWelcomePacket(parentId: string): Promise<boolean> {
  await dbConnect();
  
  const parent = await Parent.findById(parentId).lean();
  if (!parent) {
    return false;
  }
  
  // Check if parent has any completed welcome packet orders
  const hasCompleted = Boolean(
    parent.welcomePacketOrders?.some(order => order.status === 'completed')
  );
  
  return hasCompleted;
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

function generateRandomSlug(length: number = 12): string {
  // Use a larger character set for more entropy
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

export async function generateUniqueShareSlug(maxRetries: number = 10): Promise<string> {
  await dbConnect();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Increase length slightly with each retry for even better uniqueness
    const length = 12 + Math.floor(attempt / 3);
    const slug = generateRandomSlug(length);
    
    // Check if this slug already exists
    const existingChild = await Child.findOne({ shareSlug: slug }).lean();
    
    if (!existingChild) {
      return slug;
    }
    
    // If collision, log it (very rare) and try again
    console.warn(`⚠️ Share slug collision detected: ${slug} (attempt ${attempt + 1}/${maxRetries})`);
  }
  
  // If we somehow get here, generate a very long slug with timestamp
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateRandomSlug(8);
  return `${timestamp}${random}`;
}

export function clampInt(n: number, min = 0, max = 100) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}