import type { NextAuthConfig, Session, Account, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { NextRequest, NextResponse } from "next/server";
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
  admin?: boolean;
};

type AppSession = Session & {
  user?: { id?: string; role?: string; admin?: boolean };
  accessToken?: string;
  isParentOnboarded?: boolean;
  parentId?: string | null;
  admin?: boolean;
};

export const authConfig = {
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  trustHost: true, // Important for Vercel deployment
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  // Cookie configuration
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".spiritofsanta.club" : undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".spiritofsanta.club" : undefined,
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
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
      const path = request.nextUrl.pathname;
      
      // Allow onboarding pages to always work
      if (path.startsWith("/onboarding")) return true;

      // Treat both /dashboard and /parent as protected areas
      const isProtected = path.startsWith("/dashboard") || path.startsWith("/parent");

      if (!isProtected) return true;

      const isLoggedIn = Boolean(sess?.user);
      if (!isLoggedIn) return false;

      // For protected routes, check onboarding status
      // BUT don't redirect here - let the page handle it to avoid conflicts
      if (!sess?.isParentOnboarded) {
        return false; // Block access, but don't redirect from middleware
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
      // On first login (Google, Email, OR Credentials) we ensure a DB user, then read flags from DB.
      if (user?.email) {
        await dbConnect();
        
        // Check what provider is being used
        console.log('🔐 JWT callback - provider:', account?.provider, 'email:', user.email);
        
        // For Google OAuth and Email (magic link), ensure user exists (credentials users already exist from signup)
        // Resend provider ID is "resend" or might be "email"
        if (account?.provider === "google" || account?.provider === "resend" || account?.provider === "email") {
          await ensureUser(user.email, user.name ?? undefined, user.image ?? undefined);
        }

        const dbUser = await User.findOne({ email: user.email })
          .select("_id isParentOnboarded parentId admin")
          .lean<{ _id: Types.ObjectId; isParentOnboarded?: boolean; parentId?: Types.ObjectId | null; admin?: boolean }>();

        if (dbUser) {
          console.log('👤 Found user in DB:', dbUser._id, 'isParentOnboarded:', dbUser.isParentOnboarded);
          token.uid = String(dbUser._id);
          token.role = "user";
          token.isParentOnboarded = !!dbUser.isParentOnboarded;
          token.parentId = dbUser.parentId ? String(dbUser.parentId) : null;
          token.admin = !!dbUser.admin;
        } else {
          console.log('❌ No user found in DB for email:', user.email);
        }
      } else if (token.uid) {
        // Subsequent requests: refresh flags from database
        // This is crucial for onboarding status updates
        try {
          await dbConnect();
          const dbUser = await User.findById(token.uid)
            .select("isParentOnboarded parentId admin")
            .lean<{ isParentOnboarded?: boolean; parentId?: Types.ObjectId | null; admin?: boolean }>();

          if (dbUser) {
            token.isParentOnboarded = !!dbUser.isParentOnboarded;
            token.parentId = dbUser.parentId ? String(dbUser.parentId) : null;
            token.admin = !!dbUser.admin;
          }
        } catch (error) {
          console.error('❌ Failed to refresh user data in JWT:', error);
          // Keep existing token values on error
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
        admin: token.admin,
      };
      session.accessToken = token.accessToken;
      session.isParentOnboarded = token.isParentOnboarded ?? false;
      session.parentId = token.parentId ?? null;
      session.admin = token.admin ?? false;
      return session;
    },
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL || "noreply@spiritofsanta.club",
    }),

    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Credentials authorize called");
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          await dbConnect();
          console.log("📦 Database connected");
          
          const user = await User.findOne({ 
            email: credentials.email,
            authProvider: "credentials"
          });

          console.log("👤 User found:", !!user);

          if (!user) {
            console.log("❌ No user found with email:", credentials.email);
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password");
            return null;
          }

          // Compare password
          const isValid = await user.comparePassword(credentials.password as string);
          console.log("🔑 Password valid:", isValid);
          
          if (!isValid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ Authentication successful for:", user.email);
          
          return {
            id: String(user._id),
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          };
        } catch (error) {
          console.error("💥 Auth error:", error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
