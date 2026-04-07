import { NextResponse } from "next/server";
import { deleteOrder, getOrder, updateOrderStatus } from "@/lib/orders-store";
import type { OrderStatus } from "@/features/checkout/checkout.types";

const VALID_ORDER_STATUSES: OrderStatus[] = ["pending", "in_progress", "ready", "completed", "cancelled"];

type OrderRouteContext = {
  params: Promise<{
    ref: string;
  }>;
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && VALID_ORDER_STATUSES.includes(value as OrderStatus);
}

export async function GET(_request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  const order = getOrder(ref);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;

  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  const order = updateOrderStatus(ref, status);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function DELETE(_request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  const removed = deleteOrder(ref);

  if (!removed) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}