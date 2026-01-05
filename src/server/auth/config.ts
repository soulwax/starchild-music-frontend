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

console.log("[NextAuth Config] ELECTRON_BUILD:", process.env.ELECTRON_BUILD);
console.log("[NextAuth Config] NODE_ENV:", process.env.NODE_ENV);
console.log("[NextAuth Config] DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Missing");

export const authConfig = {
  trustHost: true,

  basePath: "/api/auth",
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,

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
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
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

        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,
        maxAge: 30 * 24 * 60 * 60,
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

        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,

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

        secure:
          process.env.NODE_ENV === "production" &&
          !process.env.ELECTRON_BUILD,
      },
    },
  },
  callbacks: {

    async signIn({ user, account, profile }) {
      try {
        console.log("[NextAuth signIn] Callback triggered");
        console.log("[NextAuth signIn] Provider:", account?.provider);
        console.log("[NextAuth signIn] User exists:", !!user);
        console.log("[NextAuth signIn] Profile exists:", !!profile);

        if (account?.provider === "discord" && profile && user.id) {
          console.log("[NextAuth signIn] Updating Discord user profile...");

          const updates: { image?: string; name?: string } = {};

          if (profile.image_url) {
            updates.image = profile.image_url as string;
          }

          if (profile.global_name || profile.username) {
            updates.name = (profile.global_name || profile.username) as string;
          }

          if (Object.keys(updates).length > 0) {
            console.log("[NextAuth signIn] Updates to apply:", updates);
            await db
              .update(users)
              .set(updates)
              .where(eq(users.id, user.id));
            console.log("[NextAuth signIn] Profile updated successfully");
          }
        }

        console.log("[NextAuth signIn] Callback completed - allowing sign in");
        return true;
      } catch (error) {
        console.error("[NextAuth signIn] ERROR in callback:");
        console.error(error);

        return true;
      }
    },
    session: ({ session, user }) => {

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

    redirect: ({ url, baseUrl }) => {

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
