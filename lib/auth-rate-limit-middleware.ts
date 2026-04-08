import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isRateLimited, getRemainingAttempts } from "@/lib/rate-limiter";

/**
 * Middleware for rate limiting authentication attempts
 * 5 attempts per 15 minutes per IP
 */
export function rateLimitAuthMiddleware(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `auth:${clientIp}`;
  const RATE_LIMIT = 5;
  const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  if (isRateLimited(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS)) {
    const remaining = getRemainingAttempts(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS);
    return NextResponse.json(
      { error: "Too many authentication attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "900", // 15 minutes in seconds
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  }

  return null; // Allow request to proceed
}
