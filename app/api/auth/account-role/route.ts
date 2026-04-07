import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: isAdminEmail(email) });
}
