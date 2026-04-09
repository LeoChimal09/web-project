import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeKeyMode(key: string) {
  if (key.startsWith("sk_test_")) {
    return "test" as const;
  }

  if (key.startsWith("sk_live_")) {
    return "live" as const;
  }

  return "unknown" as const;
}

export function getStripeRuntimeMode() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return "unknown" as const;
  }

  return getStripeKeyMode(key);
}

export function isStripeSandboxMode() {
  return getStripeRuntimeMode() === "test";
}

function assertStripeEnvironmentSafety(secretKey: string) {
  const keyMode = getStripeKeyMode(secretKey);
  if (keyMode === "unknown") {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const allowTestInProduction = process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION === "true";

  if (isProduction && keyMode === "test" && !allowTestInProduction) {
    throw new Error(
      "Refusing to start with Stripe test keys in production. Set STRIPE_ALLOW_TEST_IN_PRODUCTION=true to explicitly allow sandbox mode.",
    );
  }
}

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  assertStripeEnvironmentSafety(key);

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return secret;
}
