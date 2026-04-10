import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendAdminNewOrderEmail, sendCustomerOrderReceivedEmail } from "@/lib/resend-mailer";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import {
  getOrder,
  getOrderByStripeCheckoutSessionId,
  getOrderWithCustomerEmail,
  updateOrderPayment,
} from "@/server/repositories/orders-repository";

export const runtime = "nodejs";

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadataRef = session.metadata?.orderRef?.trim();
  const existingResult = metadataRef
    ? await getOrderWithCustomerEmail(metadataRef)
    : null;
  const existing = existingResult
    ? existingResult.order
    : await getOrderByStripeCheckoutSessionId(session.id);
  const customerEmail = existingResult?.customerEmail ?? null;

  if (!existing) {
    return;
  }

  const wasPaid = existing.paymentStatus === "paid";

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : (existing.stripePaymentIntentId ?? null);

  const updated = await updateOrderPayment(existing.ref, {
    paymentStatus: "paid",
    paymentProvider: "stripe",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    paymentCurrency: session.currency ?? existing.paymentCurrency ?? "usd",
    paymentAmountCents: session.amount_total ?? existing.paymentAmountCents ?? null,
    paidAt: existing.paidAt ?? new Date().toISOString(),
  });

  if (!updated || wasPaid) {
    return;
  }

  const recipientEmails = Array.from(
    new Set([
      updated.form.email.trim().toLowerCase(),
      customerEmail ?? "",
    ].filter(Boolean)),
  );
  if (recipientEmails.length > 0) {
    void sendCustomerOrderReceivedEmail({ email: recipientEmails, order: updated }).catch(() => undefined);
  }
  void sendAdminNewOrderEmail({ order: updated }).catch(() => undefined);
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  const ref = intent.metadata?.orderRef?.trim();
  if (!ref) {
    return;
  }

  await updateOrderPayment(ref, {
    paymentStatus: "failed",
    paymentProvider: "stripe",
    stripePaymentIntentId: intent.id,
    paymentCurrency: intent.currency ?? null,
    paymentAmountCents: typeof intent.amount === "number" ? intent.amount : null,
  });
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const existing = await getOrderByStripeCheckoutSessionId(session.id);
  if (!existing) {
    return;
  }

  await updateOrderPayment(existing.ref, {
    paymentStatus: "failed",
    paymentProvider: "stripe",
    stripeCheckoutSessionId: session.id,
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "payment_intent.payment_failed") {
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === "checkout.session.expired") {
      await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
