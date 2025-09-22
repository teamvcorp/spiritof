// src/auth.config.ts
import type { NextAuthConfig, Session, User, Account } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * NextAuth v5 config (typed).
 * No `any` usage here — session/jwt shapes are typed inline.
 * If you want global augmentation, move the custom types into types/next-auth.d.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },

  callbacks: {
    /**
     * authorized receives exactly:
     *   params: { request: NextRequest; auth: Session | null }
     *
     * It may return boolean | Response | NextResponse | Promise<...>
     * Returning `false` for protected routes signals unauthenticated access.
     */
    authorized({
      request,
      auth,
    }: {
      request: NextRequest;
      auth: Session | null;
    }): boolean | Response | NextResponse | Promise<boolean | Response | NextResponse> {
      const isLoggedIn = Boolean(auth?.user);
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");

      if (isProtected) {
        // For browser navigations we typically return `NextResponse.redirect(...)`
        // or simply `false` and let middleware/consumer handle redirect.
        return isLoggedIn;
      }

      return true;
    },

    /** jwt: attach custom claims to the token */
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT & { uid?: string; role?: string; accessToken?: string };
      user?: (User & { id?: string; role?: string }) | undefined;
      account?: Account | null | undefined;
    }): Promise<JWT & { uid?: string; role?: string; accessToken?: string }> {
      if (user) {
        token.uid = user.id ?? token.sub ?? undefined;
        token.role = user.role ?? "user";
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    /** session: expose a trimmed session to the client */
    async session({
      session,
      token,
    }: {
      session: Session & { user?: { id?: string; role?: string }; accessToken?: string };
      token: JWT & { uid?: string; role?: string; accessToken?: string };
    }): Promise<Session & { accessToken?: string }> {
      session.user = {
        ...session.user,
        id: token.uid,
        role: token.role,
      };
      session.accessToken = token.accessToken;
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

        const { email, password } = parsed.data;

        // TODO: verify against your DB and return user object:
        // const user = await verifyUser(email, password);
        // if (!user) return null;
        // await ensureUser(email, user.name);
        // return { id: user.id, name: user.name, email, role: user.role };

        // placeholder: reject all
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
