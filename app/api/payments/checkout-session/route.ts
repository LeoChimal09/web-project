import { NextResponse } from "next/server";
import type { CreateOrderInput } from "@/features/checkout/checkout.types";
import { calculateOrderSubtotal, calculateTax, toCents } from "@/features/checkout/order-pricing";
import { getAuthSession } from "@/lib/auth";
import { getRestaurantStatus } from "@/lib/restaurant-hours";
import { isRateLimited } from "@/lib/rate-limiter";
import { getStripeClient } from "@/lib/stripe";
import { createOrder, updateOrderPayment } from "@/server/repositories/orders-repository";

export const runtime = "nodejs";

function isCreateOrderInput(value: unknown): value is CreateOrderInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CreateOrderInput>;
  return Boolean(candidate.form) && Array.isArray(candidate.orders) && typeof candidate.totalPrice === "number";
}

function getAppBaseUrl() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(`checkout-session:${clientIp}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!isCreateOrderInput(body)) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  }

  if (body.form.payment !== "card") {
    return NextResponse.json({ error: "Stripe checkout is only available for card payments." }, { status: 400 });
  }

  const restaurantStatus = getRestaurantStatus();
  if (!restaurantStatus.isOpen) {
    return NextResponse.json({ error: restaurantStatus.message }, { status: 409 });
  }

  const subtotal = calculateOrderSubtotal(body.orders);
  const tax = calculateTax(subtotal);
  const amountTotalCents = toCents(subtotal + tax);

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

  try {
    const stripe = getStripeClient();
    const appBaseUrl = getAppBaseUrl();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.form.email,
      success_url: `${appBaseUrl}/order-confirmation?ref=${encodeURIComponent(order.ref)}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/checkout?payment=cancelled&ref=${encodeURIComponent(order.ref)}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountTotalCents,
            product_data: {
              name: `TableStory Order ${order.ref}`,
              description: `${order.form.fulfillment === "delivery" ? "Delivery" : "Pickup"} order`,
            },
          },
        },
      ],
      metadata: {
        orderRef: order.ref,
      },
      payment_intent_data: {
        metadata: {
          orderRef: order.ref,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null;

    await updateOrderPayment(order.ref, {
      paymentStatus: "pending",
      paymentProvider: "stripe",
      stripeCheckoutSessionId: checkoutSession.id,
      stripePaymentIntentId: paymentIntentId,
      paymentCurrency: checkoutSession.currency ?? "usd",
      paymentAmountCents: checkoutSession.amount_total ?? amountTotalCents,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Unable to create Stripe checkout URL." }, { status: 500 });
    }

    return NextResponse.json({
      orderRef: order.ref,
      stripeSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
    });
  } catch {
    await updateOrderPayment(order.ref, {
      paymentStatus: "failed",
      paymentProvider: "stripe",
    });

    return NextResponse.json({ error: "Unable to initialize payment. Please try again." }, { status: 500 });
  }
}
