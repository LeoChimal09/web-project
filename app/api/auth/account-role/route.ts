import { NextResponse } from "next/server";

function isTestMode() {
  return process.env.ADMIN_TEST_MODE === "true";
}

export async function GET() {
  // Keep response generic to avoid leaking whether an email is an admin account.
  return NextResponse.json({ requiresOAuth: !isTestMode() });
}
