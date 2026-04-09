import { NextResponse } from "next/server";
import { createOrder, getAllOrders, getOrdersByCustomerEmail, getOrdersByRefs } from "@/server/repositories/orders-repository";
import type { CreateOrderInput } from "@/features/checkout/checkout.types";
import { calculateOrderSubtotal } from "@/features/checkout/order-pricing";
import { getAuthSession, isAdminSession } from "@/lib/auth";
import { getRestaurantStatus } from "@/lib/restaurant-hours";
import { isRateLimited } from "@/lib/rate-limiter";
import { sendAdminNewOrderEmail, sendCustomerOrderReceivedEmail } from "@/lib/resend-mailer";

const MAX_GUEST_REFS = 25;
const ORDER_REF_PATTERN = /^TBL-[A-Z0-9-]{6,64}$/;

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
    .filter((value) => Boolean(value) && ORDER_REF_PATTERN.test(value))
    .slice(0, MAX_GUEST_REFS);

  if (refs.length === 0) {
    return NextResponse.json([]);
  }

  return NextResponse.json(await getOrdersByRefs(refs));
}

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(`order-create:${clientIp}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (!isCreateOrderInput(body)) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  const restaurantStatus = getRestaurantStatus();
  if (!restaurantStatus.isOpen) {
    return NextResponse.json({ error: restaurantStatus.message }, { status: 409 });
  }

  const subtotal = calculateOrderSubtotal(body.orders);

  const session = await getAuthSession();
  const order = await createOrder(
    {
      ...body,
      totalPrice: subtotal,
    },
    {
    customerEmail: session?.user?.email ?? null,
    },
  );

  const customerEmail = order.form.email.trim().toLowerCase();
  if (customerEmail && order.paymentStatus === "paid") {
    void sendCustomerOrderReceivedEmail({ email: customerEmail, order }).catch(() => undefined);
  }
  if (order.paymentStatus === "paid") {
    void sendAdminNewOrderEmail({ order }).catch(() => undefined);
  }

  return NextResponse.json(order, { status: 201 });
}