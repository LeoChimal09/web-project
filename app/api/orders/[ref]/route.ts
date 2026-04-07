import { NextResponse } from "next/server";
import { deleteOrder, getOrder, updateOrderStatus } from "@/server/repositories/orders-repository";
import type { CancellationActor, OrderEtaMinutes, OrderStatus } from "@/features/checkout/checkout.types";
import { isValidOrderEtaMinutes } from "@/features/checkout/order-status";

const VALID_ORDER_STATUSES: OrderStatus[] = ["pending", "in_progress", "ready", "completed", "cancelled"];
const VALID_CANCELLATION_ACTORS: CancellationActor[] = ["admin", "customer"];

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
  const order = await getOrder(ref);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;
  const etaMinutes = body && typeof body === "object" ? (body as { etaMinutes?: unknown }).etaMinutes : undefined;
  const cancellationNote =
    body && typeof body === "object" ? (body as { cancellationNote?: unknown }).cancellationNote : undefined;
  const cancelledBy = body && typeof body === "object" ? (body as { cancelledBy?: unknown }).cancelledBy : undefined;

  const existingOrder = await getOrder(ref);
  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  let parsedEtaMinutes: OrderEtaMinutes | null | undefined;
  let parsedCancellationNote: string | null | undefined;
  let parsedCancelledBy: CancellationActor | null | undefined;

  if (etaMinutes !== undefined && etaMinutes !== null) {
    if (!isValidOrderEtaMinutes(etaMinutes)) {
      return NextResponse.json({ error: "Invalid ETA value." }, { status: 400 });
    }

    parsedEtaMinutes = etaMinutes;
  }

  if (status === "in_progress" && existingOrder.status !== "in_progress" && !parsedEtaMinutes) {
    return NextResponse.json({ error: "Please select an ETA when moving an order to In Progress." }, { status: 400 });
  }

  if (cancellationNote !== undefined && cancellationNote !== null) {
    if (typeof cancellationNote !== "string") {
      return NextResponse.json({ error: "Invalid cancellation note." }, { status: 400 });
    }

    parsedCancellationNote = cancellationNote.trim() || null;
  }

  if (parsedCancellationNote && parsedCancellationNote.length > 300) {
    return NextResponse.json({ error: "Cancellation note must be 300 characters or less." }, { status: 400 });
  }

  if (cancelledBy !== undefined && cancelledBy !== null) {
    if (typeof cancelledBy !== "string" || !VALID_CANCELLATION_ACTORS.includes(cancelledBy as CancellationActor)) {
      return NextResponse.json({ error: "Invalid cancellation actor." }, { status: 400 });
    }

    parsedCancelledBy = cancelledBy as CancellationActor;
  }

  if (status === "cancelled" && !parsedCancelledBy) {
    parsedCancelledBy = "customer";
  }

  const order = await updateOrderStatus(ref, status, {
    etaMinutes: parsedEtaMinutes,
    cancellationNote: parsedCancellationNote,
    cancelledBy: parsedCancelledBy,
  });

  if (order === null) {
    return NextResponse.json(
      {
        error:
          status === "cancelled"
            ? "Only pending orders can be cancelled."
            : "This order cannot move to that status from its current state.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json(order);
}

export async function DELETE(_request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  const removed = await deleteOrder(ref);

  if (removed === null) {
    return NextResponse.json(
      { error: "Only completed or cancelled orders can be removed from history." },
      { status: 409 },
    );
  }

  if (!removed) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}