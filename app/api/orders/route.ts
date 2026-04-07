import { NextResponse } from "next/server";
import { createOrder, getAllOrders, getOrdersByCustomerEmail, getOrdersByRefs } from "@/server/repositories/orders-repository";
import type { CreateOrderInput } from "@/features/checkout/checkout.types";
import { getAuthSession, isAdminSession } from "@/lib/auth";

function isCreateOrderInput(value: unknown): value is CreateOrderInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CreateOrderInput>;
  return Boolean(candidate.form) && Array.isArray(candidate.orders) && typeof candidate.totalPrice === "number";
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  const email = session?.user?.email?.trim().toLowerCase();

  if (isAdminSession(session)) {
    return NextResponse.json(await getAllOrders());
  }

  if (email) {
    return NextResponse.json(await getOrdersByCustomerEmail(email));
  }

  const url = new URL(request.url);
  const refsParam = url.searchParams.get("refs") ?? "";
  const refs = refsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (refs.length === 0) {
    return NextResponse.json([]);
  }

  return NextResponse.json(await getOrdersByRefs(refs));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isCreateOrderInput(body)) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const session = await getAuthSession();
  const order = await createOrder(body, {
    customerEmail: session?.user?.email ?? null,
  });
  return NextResponse.json(order, { status: 201 });
}