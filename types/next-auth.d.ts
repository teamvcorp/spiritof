// /src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
    accessToken?: string;

    /** App-specific flags */
    isParentOnboarded?: boolean;
    parentId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    accessToken?: string;

    /** App-specific flags */
    isParentOnboarded?: boolean;
    parentId?: string | null;
  }
}
