// File: src/server/auth/config.ts

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
// Debug logging for environment variables
console.log("[NextAuth Config] ELECTRON_BUILD:", process.env.ELECTRON_BUILD);
console.log("[NextAuth Config] NODE_ENV:", process.env.NODE_ENV);
console.log("[NextAuth Config] DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Missing");

export const authConfig = {
  trustHost: true, // Allow NextAuth to trust the host from request headers
  // Explicitly set the base URL from environment, with fallback for backward compatibility
  basePath: "/api/auth",
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
      // The callback URL will be automatically determined from the request
      // when trustHost is true, so we don't need to set it explicitly
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production" &&
        !process.env.ELECTRON_BUILD
          ? `__Secure-authjs.session-token`
          : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Disable secure cookies in Electron (runs on localhost HTTP)
        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production" &&
        !process.env.ELECTRON_BUILD
          ? `__Host-authjs.csrf-token`
          : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Disable secure cookies in Electron (runs on localhost HTTP)
        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,
        // Don't set domain explicitly - let it use the request domain
        // This ensures CSRF tokens work across different domains when trustHost is true
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production" &&
        !process.env.ELECTRON_BUILD
          ? `__Secure-authjs.callback-url`
          : `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        // Disable secure cookies in Electron (runs on localhost HTTP)
        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,
      },
    },
  },
  callbacks: {
    // Update user profile data on sign-in to keep Discord avatar fresh
    async signIn({ user, account, profile }) {
      // Only update for Discord OAuth sign-ins
      if (account?.provider === "discord" && profile && user.id) {
        // Update the user's profile picture and name from Discord's latest data
        // Use global_name (display name) if available, otherwise fall back to username
        const updates: { image?: string; name?: string } = {};

        if (profile.image_url) {
          updates.image = profile.image_url as string;
        }

        if (profile.global_name || profile.username) {
          updates.name = (profile.global_name || profile.username) as string;
        }

        // Only update if we have something to update
        if (Object.keys(updates).length > 0) {
          await db
            .update(users)
            .set(updates)
            .where(eq(users.id, user.id));
        }
      }
      return true;
    },
    session: ({ session, user }) => {
      // Ensure proper serialization by converting to plain object
      return {
        expires: session.expires,
        user: {
          id: String(user.id),
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        },
      };
    },
    // Ensure the redirect URL uses the correct domain from the request
    redirect: ({ url, baseUrl }) => {
      // If the URL is relative, make it absolute using the baseUrl from the request
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If the URL is on the same origin, return it as-is
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise, return the baseUrl to prevent redirects to external domains
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
