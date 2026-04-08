import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getCustomerByEmail,
  createCustomer,
} from "@/server/repositories/customers-repository";
import { isRateLimited, getRemainingAttempts } from "@/lib/rate-limiter";

const REQUESTED_ADMIN_TEST_MODE = process.env.ADMIN_TEST_MODE === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && REQUESTED_ADMIN_TEST_MODE) {
  throw new Error("ADMIN_TEST_MODE must never be enabled in production.");
}

function getAdminEmails() {
  // Use TEST_ADMIN_EMAILS when in test mode, otherwise use ADMIN_EMAILS for production
  if (isTestMode()) {
    return (process.env.TEST_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isTestMode() {
  return REQUESTED_ADMIN_TEST_MODE && !IS_PRODUCTION;
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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").trim().toLowerCase();
        if (!email) return null;

        // Rate limit: 5 attempts per 15 minutes per email
        const rateLimitKey = `auth:${email}`;
        const RATE_LIMIT = 5;
        const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

        if (isRateLimited(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS)) {
          const remaining = getRemainingAttempts(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS);
          throw new Error(`RATE_LIMITED:${remaining}`);
        }

        const isAdmin = isAdminEmail(email);
        const password = credentials?.password ?? "";
        const testMode = isTestMode();

        // In test mode: allow all admin emails with password, skip OAuth check
        if (testMode) {
          if (isAdmin && password) {
            return { id: "admin", email, name: credentials?.name ?? "Admin" };
          }

          if (isAdmin && !password) {
            return null;
          }

          // Non-admin credentials in test mode continue through normal flow
          if (!isAdmin) {
            const name = (credentials?.name ?? "").trim();
            let customer = await getCustomerByEmail(email);
            if (customer) {
              return { id: String(customer.id), email: customer.email, name: customer.name };
            }
            if (!name) throw new Error("ACCOUNT_NOT_FOUND");
            customer = await createCustomer(email, name);
            if (!customer) return null;
            return { id: String(customer.id), email: customer.email, name: customer.name };
          }

          return null;
        }

        // Production mode: block admin credentials, require OAuth
        if (isAdmin) {
          throw new Error("ADMIN_OAUTH_REQUIRED");
        }

        // Regular customer login in production
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
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        return isAdminEmail(user.email);
      }

      if (account?.provider === "credentials") {
        // In test mode, allow admins via credentials
        if (isTestMode() && isAdminEmail(user.email)) {
          return true;
        }
        // Block admins from regular credentials (must use GitHub)
        if (isAdminEmail(user.email)) {
          return false;
        }
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
      const isAdminViaGitHub = authProvider === "github" && isAdminEmail(token.email);
      const isAdminViaTestMode = isTestMode() && authProvider === "credentials" && isAdminEmail(token.email);
      token.isAdmin = isAdminViaGitHub || isAdminViaTestMode;
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