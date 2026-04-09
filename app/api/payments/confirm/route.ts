import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limiter";
import { sendAdminNewOrderEmail, sendCustomerOrderReceivedEmail } from "@/lib/resend-mailer";
import { getStripeClient } from "@/lib/stripe";
import { getOrder, updateOrderPayment } from "@/server/repositories/orders-repository";

export const runtime = "nodejs";

type ConfirmBody = {
  ref?: string;
  sessionId?: string;
};

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(`payment-confirm:${clientIp}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as ConfirmBody | null;
  const ref = body?.ref?.trim();
  const sessionId = body?.sessionId?.trim();

  if (!ref || !sessionId) {
    return NextResponse.json({ error: "Missing ref or sessionId." }, { status: 400 });
  }

  const order = await getOrder(ref);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, order });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const orderRefFromSession = session.metadata?.orderRef?.trim();
    if (orderRefFromSession !== ref) {
      return NextResponse.json({ error: "Checkout session does not match order." }, { status: 409 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: true, order, paymentStatus: session.payment_status });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

    const updated = await updateOrderPayment(ref, {
      paymentStatus: "paid",
      paymentProvider: "stripe",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paymentCurrency: session.currency ?? order.paymentCurrency ?? "usd",
      paymentAmountCents: session.amount_total ?? order.paymentAmountCents ?? null,
      paidAt: order.paidAt ?? new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const customerEmail = updated.form.email.trim().toLowerCase();
    if (customerEmail) {
      void sendCustomerOrderReceivedEmail({ email: customerEmail, order: updated }).catch(() => undefined);
    }
    void sendAdminNewOrderEmail({ order: updated }).catch(() => undefined);

    return NextResponse.json({ ok: true, order: updated });
  } catch {
    return NextResponse.json({ error: "Unable to confirm payment status." }, { status: 500 });
  }
}
