import type { NextAuthOptions } from "next-auth";
import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getCustomerByEmail,
  createCustomer,
} from "@/server/repositories/customers-repository";
import { isRateLimited, getRemainingAttempts } from "@/lib/rate-limiter";
import { consumeEmailVerificationToken } from "@/server/repositories/email-verification-repository";

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

function hashVerificationToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
        verificationToken: { label: "Verification Token", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").trim().toLowerCase();
        if (!email) return null;

        // Rate limit defaults tuned for customer UX; override via env when needed.
        const rateLimitKey = `auth:${email}`;
        const RATE_LIMIT = Math.max(1, Number(process.env.AUTH_RATE_LIMIT_ATTEMPTS ?? "10"));
        const rateWindowSeconds = Math.max(1, Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ?? "15"));
        const RATE_WINDOW_MS = rateWindowSeconds * 1000;

        if (isRateLimited(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS)) {
          const remaining = getRemainingAttempts(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS);
          throw new Error(`RATE_LIMITED:${remaining}`);
        }

        const isAdmin = isAdminEmail(email);
        const password = credentials?.password ?? "";
        const testMode = isTestMode();
        const verificationToken = (credentials?.verificationToken ?? "").trim();

        // In test mode: allow all admin emails with password, skip OAuth check
        if (testMode) {
          if (isAdmin && password) {
            return { id: "admin", email, name: credentials?.name ?? "Admin" };
          }

          if (isAdmin && !password) {
            return null;
          }

          // Non-admin credentials in test mode still require verified email links.
          if (!isAdmin) {
            if (!verificationToken) {
              throw new Error("VERIFICATION_REQUIRED");
            }

            const tokenRow = await consumeEmailVerificationToken(email, hashVerificationToken(verificationToken));
            if (!tokenRow) {
              throw new Error("INVALID_OR_EXPIRED_LINK");
            }

            let customer = await getCustomerByEmail(email);
            if (!customer) {
              const tokenName = tokenRow.name?.trim() ?? "";
              if (!tokenName) {
                throw new Error("ACCOUNT_NOT_FOUND");
              }
              customer = await createCustomer(email, tokenName);
            }

            if (!customer) return null;
            return { id: String(customer.id), email: customer.email, name: customer.name };
          }

          return null;
        }

        // Production mode: block admin credentials, require OAuth
        if (isAdmin) {
          throw new Error("ADMIN_OAUTH_REQUIRED");
        }

        // Customers must verify ownership via one-time email link.
        if (!verificationToken) {
          throw new Error("VERIFICATION_REQUIRED");
        }

        const tokenRow = await consumeEmailVerificationToken(email, hashVerificationToken(verificationToken));
        if (!tokenRow) {
          throw new Error("INVALID_OR_EXPIRED_LINK");
        }

        let customer = await getCustomerByEmail(email);
        if (!customer) {
          const tokenName = tokenRow.name?.trim() ?? "";
          if (!tokenName) {
            throw new Error("ACCOUNT_NOT_FOUND");
          }
          customer = await createCustomer(email, tokenName);
        }

        if (!customer) return null;
        return { id: String(customer.id), email: customer.email, name: customer.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return isAdminEmail(user.email);
      }

      if (account?.provider === "credentials") {
        // In test mode, allow admins via credentials
        if (isTestMode() && isAdminEmail(user.email)) {
          return true;
        }
        // Block admins from regular credentials (must use Google OAuth)
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
      const isAdminViaGoogle = authProvider === "google" && isAdminEmail(token.email);
      const isAdminViaTestMode = isTestMode() && authProvider === "credentials" && isAdminEmail(token.email);
      token.isAdmin = isAdminViaGoogle || isAdminViaTestMode;
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