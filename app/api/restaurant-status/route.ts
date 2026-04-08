import { NextResponse } from "next/server";
import { getRestaurantStatus } from "@/lib/restaurant-hours";

export async function GET() {
  return NextResponse.json(getRestaurantStatus());
}
