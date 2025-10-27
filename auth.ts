// src/auth.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { handlers, auth, signIn, signOut: nextAuthSignOut } = NextAuth(authConfig);

// Custom signOut that always clears session data
export async function signOut(options?: { redirectTo?: string }) {
  // NextAuth's signOut always clears cookies and session by default
  // This is just a wrapper for consistency
  return nextAuthSignOut(options);
}

// Export all auth functions
export { handlers, auth, signIn };

// If you prefer the explicit GET/POST re-export for the route handler:
export const { GET, POST } = handlers;
