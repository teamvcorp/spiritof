// src/auth.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
// If you prefer the explicit GET/POST re-export for the route handler:
export const { GET, POST } = handlers;
