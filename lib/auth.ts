import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      // Entra ID takes an issuer URL (the old `tenantId` option no longer
      // exists). Without a tenant it falls back to the multi-tenant "common".
      issuer: process.env.MICROSOFT_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0`
        : undefined
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // OAuth sign-ins default to READER role unless already elevated in DB.
      // Admin access is granted by manually promoting a user's role in the database
      // (or via an admin-only endpoint), not automatically through OAuth.
      if (account?.provider !== "credentials" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: { email: user.email, name: user.name, role: "READER" }
        });
      }
      return true;
    }
  }
});

export function requireRole(role: string, allowed: string[]) {
  return allowed.includes(role);
}
