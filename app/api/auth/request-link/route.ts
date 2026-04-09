import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdminEmail, isAdminTestModeEnabled } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limiter";
import { sendCustomerSignInLinkEmail } from "@/lib/resend-mailer";
import { createEmailVerificationToken, deleteExpiredEmailVerificationTokens } from "@/server/repositories/email-verification-repository";

type RequestBody = {
  email?: string;
  name?: string;
  adminIntent?: boolean;
};

function getAppBaseUrl() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  const name = (body?.name ?? "").trim();
  const adminIntent = body?.adminIntent === true;
  const adminTestMode = isAdminTestModeEnabled();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const emailKey = `magic-link:email:${email}`;
  const ipKey = `magic-link:ip:${ip}`;

  if (isRateLimited(emailKey, 3, 60 * 1000) || isRateLimited(ipKey, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait 1 minute and try again." }, { status: 429 });
  }

  // In production, admin emails must use Google OAuth (no email bypass for admins)
  if (isAdminEmail(email) && !adminTestMode) {
    return NextResponse.json({ error: "ADMIN_OAUTH_REQUIRED" }, { status: 400 });
  }

  // In test mode, admin emails with explicit intent get direct sign-in shortcut
  if (isAdminEmail(email) && adminIntent && adminTestMode) {
    return NextResponse.json({ ok: true, directAdminSignIn: true });
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await createEmailVerificationToken({
    email,
    tokenHash,
    expiresAt,
    name: name || null,
  });

  await deleteExpiredEmailVerificationTokens();

  const url = new URL("/verify-email", getAppBaseUrl());
  url.searchParams.set("email", email);
  url.searchParams.set("token", rawToken);
  if (adminIntent) {
    url.searchParams.set("admin", "1");
  }

  try {
    await sendCustomerSignInLinkEmail({ email, signInUrl: url.toString() });
  } catch {
    return NextResponse.json(
      { error: "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    developmentSignInUrl: process.env.NODE_ENV === "development" ? url.toString() : undefined,
  });
}
