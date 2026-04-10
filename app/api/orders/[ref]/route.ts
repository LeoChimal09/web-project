import { NextResponse } from "next/server";
import {
  deleteOrder,
  dismissOrderNotification,
  getOrderWithCustomerEmail,
  updateOrderPayment,
  updateOrderStatus,
} from "@/server/repositories/orders-repository";
import type { CancellationActor, OrderEtaMinutes, OrderStatus } from "@/features/checkout/checkout.types";
import { isValidOrderEtaMinutes } from "@/features/checkout/order-status";
import { getAuthSession, isAdminSession } from "@/lib/auth";
import { isRateLimited, getRemainingAttempts } from "@/lib/rate-limiter";
import { sendCustomerOrderStatusUpdateEmail } from "@/lib/resend-mailer";
import { getStripeClient } from "@/lib/stripe";

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

function getSessionEmail(session: Awaited<ReturnType<typeof getAuthSession>>) {
  return session?.user?.email?.trim().toLowerCase() ?? null;
}

export async function GET(request: Request, context: OrderRouteContext) {
  const { ref } = await context.params;
  
  // Rate limit order lookups: 10 attempts per minute per IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `order-lookup:${clientIp}`;
  const RATE_LIMIT = 10;
  const RATE_WINDOW_MS = 60 * 1000; // 1 minute

  if (isRateLimited(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS)) {
    const remaining = getRemainingAttempts(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  }

  const session = await getAuthSession();
  const orderResult = await getOrderWithCustomerEmail(ref);

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!orderResult) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const isAdmin = isAdminSession(session);
  const sessionEmail = getSessionEmail(session);
  const isOwner = Boolean(sessionEmail && orderResult.customerEmail && sessionEmail === orderResult.customerEmail);

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(orderResult.order);
}

export async function PATCH(request: Request, context: OrderRouteContext) {
  const session = await getAuthSession();
  const { ref } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;
  const etaMinutes = body && typeof body === "object" ? (body as { etaMinutes?: unknown }).etaMinutes : undefined;
  const cancellationNote =
    body && typeof body === "object" ? (body as { cancellationNote?: unknown }).cancellationNote : undefined;
  const cancelledBy = body && typeof body === "object" ? (body as { cancelledBy?: unknown }).cancelledBy : undefined;

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const existingOrderResult = await getOrderWithCustomerEmail(ref);
  if (!existingOrderResult) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const isAdmin = isAdminSession(session);
  const sessionEmail = getSessionEmail(session);
  const isOwner = Boolean(
    sessionEmail &&
      existingOrderResult.customerEmail &&
      sessionEmail === existingOrderResult.customerEmail,
  );

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const existingOrder = existingOrderResult.order;

  // Dismiss notification — separate lightweight operation, no status validation needed
  const notificationDismissed =
    body && typeof body === "object" ? (body as { notificationDismissed?: unknown }).notificationDismissed : undefined;

  if (notificationDismissed === true && !isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (notificationDismissed === true) {
    const dismissed = await dismissOrderNotification(ref);
    if (!dismissed) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(dismissed);
  }

  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  // Backward compatibility: older cash orders may still have pending paymentStatus.
  // Treat cash as paid and normalize stored payment fields.
  if (existingOrder.form.payment === "cash" && existingOrder.paymentStatus !== "paid") {
    await updateOrderPayment(ref, {
      paymentStatus: "paid",
      paidAt: existingOrder.paidAt ?? new Date().toISOString(),
    });
    existingOrder.paymentStatus = "paid";
  }

  const requiresPaidBeforeProgress = existingOrder.form.payment === "card";
  if (status !== "cancelled" && requiresPaidBeforeProgress && existingOrder.paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Payment is not completed for this order yet." },
      { status: 409 },
    );
  }

  if (!isAdmin && status !== "cancelled") {
    return NextResponse.json({ error: "Only admins can set this status." }, { status: 403 });
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

    // Only admins may set cancelledBy — prevent customers spoofing "admin"
    if (isAdmin) {
      parsedCancelledBy = cancelledBy as CancellationActor;
    }
  }

  if (status === "cancelled" && !parsedCancelledBy) {
    parsedCancelledBy = isAdmin ? "admin" : "customer";
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

  if (order === undefined) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Auto-refund paid Stripe card orders when cancelled
  let orderToReturn = order;
  if (
    status === "cancelled" &&
    existingOrder.paymentStatus === "paid" &&
    existingOrder.paymentProvider === "stripe" &&
    existingOrder.stripePaymentIntentId
  ) {
    try {
      const stripe = getStripeClient();
      await stripe.refunds.create({ payment_intent: existingOrder.stripePaymentIntentId });
      await updateOrderPayment(ref, { paymentStatus: "refunded" });
      orderToReturn = { ...orderToReturn, paymentStatus: "refunded" };
    } catch {
      // Refund attempt failed — order is still cancelled.
      // Admin can issue the refund manually via the Stripe dashboard.
    }
  }

  const recipientEmails = Array.from(
    new Set([
      orderToReturn.form.email.trim().toLowerCase(),
      existingOrderResult.customerEmail ?? "",
    ].filter(Boolean)),
  );
  const shouldEmailCustomer =
    recipientEmails.length > 0 &&
    existingOrder.status !== orderToReturn.status &&
    (orderToReturn.status === "in_progress" ||
      orderToReturn.status === "ready" ||
      (orderToReturn.status === "cancelled" && orderToReturn.cancelledBy === "admin"));
  if (shouldEmailCustomer) {
    void sendCustomerOrderStatusUpdateEmail({ email: recipientEmails, order: orderToReturn }).catch(() => undefined);
  }

  return NextResponse.json(orderToReturn);
}

export async function DELETE(_request: Request, context: OrderRouteContext) {
  const session = await getAuthSession();
  const { ref } = await context.params;

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

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