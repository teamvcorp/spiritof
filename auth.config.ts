import type { NextAuthConfig, Session, Account, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensureUser";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/db";
import { Types } from "mongoose";

/** App-specific shapes (no `any`) */
type AppJWT = JWT & {
  uid?: string;
  role?: string;
  accessToken?: string;
  isParentOnboarded?: boolean;
  parentId?: string | null;
};

type AppSession = Session & {
  user?: { id?: string; role?: string };
  accessToken?: string;
  isParentOnboarded?: boolean;
  parentId?: string | null;
};

export const authConfig = {
 

  callbacks: {
    /** Gate protected routes and route new logins */
    authorized({
      request,
      auth,
    }: {
      request: NextRequest;
      auth: Session | null;
    }): boolean | Response | NextResponse | Promise<boolean | Response | NextResponse> {
      const sess = auth as AppSession | null;

      // Treat both /dashboard and /parent as protected areas
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/dashboard") || path.startsWith("/parent");

      if (!isProtected) return true;

      const isLoggedIn = Boolean(sess?.user);
      if (!isLoggedIn) return false;

      // Not onboarded? Send to onboarding.
      if (!sess?.isParentOnboarded) {
        const url = new URL("/onboarding", request.url);
        return NextResponse.redirect(url);
      }

      return true;
    },

  
    /** jwt: attach custom claims to the token (no `any`) */
    async jwt({
      token,
      user,
      account,
    }: {
      token: AppJWT;
      user?: NextAuthUser | undefined;
      account?: Account | null | undefined;
    }): Promise<AppJWT> {
      // On first Google login we ensure a DB user, then read flags from DB.
      if (user?.email) {
        await dbConnect();
        await ensureUser(user.email, user.name ?? undefined, user.image ?? undefined);

        const dbUser = await User.findOne({ email: user.email })
          .select("_id isParentOnboarded parentId")
          .lean<{ _id: Types.ObjectId; isParentOnboarded?: boolean; parentId?: Types.ObjectId | null }>();

        if (dbUser) {
          token.uid = String(dbUser._id);
          token.role = "user";
          token.isParentOnboarded = !!dbUser.isParentOnboarded;
          token.parentId = dbUser.parentId ? String(dbUser.parentId) : null;
        }
      } else if (token.uid) {
        // Subsequent requests: refresh flags
        await dbConnect();
        const dbUser = await User.findById(token.uid)
          .select("isParentOnboarded parentId")
          .lean<{ isParentOnboarded?: boolean; parentId?: Types.ObjectId | null }>();

        if (dbUser) {
          token.isParentOnboarded = !!dbUser.isParentOnboarded;
          token.parentId = dbUser.parentId ? String(dbUser.parentId) : null;
        }
      }

      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },

    /** session: expose a trimmed, typed session to the client (no `any`) */
    async session({
      session,
      token,
    }: {
      session: AppSession;
      token: AppJWT;
    }): Promise<AppSession> {
      session.user = {
        ...session.user,
        id: token.uid,
        role: token.role,
      };
      session.accessToken = token.accessToken;
      session.isParentOnboarded = token.isParentOnboarded ?? false;
      session.parentId = token.parentId ?? null;
      return session;
    },
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw: unknown) {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        });
        const parsed = schema.safeParse(raw);
        if (!parsed.success) return null;

        // TODO: look up user in your DB and return a NextAuth user object, or null
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
