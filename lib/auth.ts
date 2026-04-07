import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getCustomerByEmail,
  createCustomer,
} from "@/server/repositories/customers-repository";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

type AdminAwareSession = Awaited<ReturnType<typeof getAuthSession>> & {
  isAdmin?: boolean;
};

export function isAdminSession(session: AdminAwareSession | null | undefined) {
  return session?.isAdmin === true;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        if (isAdminEmail(email)) {
          throw new Error("ADMIN_OAUTH_REQUIRED");
        }
        const name = (credentials?.name ?? "").trim();

        let customer = await getCustomerByEmail(email);
        if (customer) {
          return { id: String(customer.id), email: customer.email, name: customer.name };
        }
        if (!name) throw new Error("ACCOUNT_NOT_FOUND");
        customer = await createCustomer(email, name);
        if (!customer) return null;
        return { id: String(customer.id), email: customer.email, name: customer.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        return isAdminEmail(user.email);
      }

      if (account?.provider === "credentials" && isAdminEmail(user.email)) {
        return false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }

      if (account?.provider) {
        token.authProvider = account.provider;
      }

      const authProvider = typeof token.authProvider === "string" ? token.authProvider : undefined;
      token.isAdmin = authProvider === "github" && isAdminEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
        if (token.name) session.user.name = token.name as string;
      }
      (session as AdminAwareSession).isAdmin = token.isAdmin === true;
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}