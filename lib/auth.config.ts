import type { NextAuthConfig } from "next-auth";

/**
 * The part of the Auth.js config that is safe to load from proxy.ts.
 *
 * proxy.ts runs on every page request, so it must stay light: no Prisma
 * client, no adapter, no bcrypt, no OAuth providers. With the JWT session
 * strategy, reading the session only needs to decode the cookie, which needs
 * nothing from this file except the callbacks that shape the token/session.
 * lib/auth.ts spreads this config and adds the heavy pieces.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login"
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "READER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
