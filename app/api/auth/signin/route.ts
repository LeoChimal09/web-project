import { NextRequest, NextResponse } from "next/server";
import { signIn } from "next-auth/react";
import { rateLimitAuthMiddleware } from "@/lib/auth-rate-limit-middleware";

/**
 * POST /api/auth/signin
 * Custom endpoint for rate-limited credential sign-in
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitAuthMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    // The actual sign-in is handled by NextAuth's callback
    // This endpoint just enforces rate limiting before credentials are validated
    // The client will call next-auth's signIn() function which uses this data

    return NextResponse.json(
      { message: "Credentials received. Proceeding with authentication." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }
}
