"use server";

import { signOut } from "@/auth";

/**
 * Server action to sign out a user
 * Always clears all session data and cookies (NextAuth default behavior)
 */
export async function signOutAction(redirectTo: string = "/") {
  await signOut({ redirectTo });
}
