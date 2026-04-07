import { NextResponse } from "next/server";
import { createOrder, getAllOrders } from "@/lib/orders-store";
import type { CreateOrderInput } from "@/features/checkout/checkout.types";

function isCreateOrderInput(value: unknown): value is CreateOrderInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CreateOrderInput>;
  return Boolean(candidate.form) && Array.isArray(candidate.orders) && typeof candidate.totalPrice === "number";
}

export async function GET() {
  return NextResponse.json(getAllOrders());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isCreateOrderInput(body)) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const order = createOrder(body);
  return NextResponse.json(order, { status: 201 });
}