"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/features/cart/CartContext";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import type { CheckoutForm, FulfillmentType, PaymentMethod } from "@/features/checkout/checkout.types";

const FORM_STORAGE_KEY = "tablestory_checkout_form";

function saveFormToSession(form: CheckoutForm) {
  try {
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
  } catch {
    // sessionStorage unavailable — safe to ignore
  }
}

function restoreFormFromSession(): CheckoutForm | null {
  try {
    const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FORM_STORAGE_KEY);
    return JSON.parse(raw) as CheckoutForm;
  } catch {
    return null;
  }
}

const EMPTY_FORM: CheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  telephone: "",
  fulfillment: "pickup",
  deliveryAddress: { address1: "", city: "", state: "", postcode: "" },
  comment: "",
  payment: "cash",
  termsAgreed: false,
};

type FieldErrors = Partial<Record<keyof CheckoutForm | "address1" | "city" | "postcode", string>>;

type RestaurantStatus = {
  isOpen: boolean;
  message: string;
};

function validate(form: CheckoutForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email";
  if (!form.telephone.trim()) errors.telephone = "Phone number is required";
  else if (!/^[0-9\s\-\+\(\)]{7,}$/.test(form.telephone)) errors.telephone = "Enter a valid phone number";
  if (form.fulfillment === "delivery") {
    if (!form.deliveryAddress.address1.trim()) errors.address1 = "Street address is required";
    if (!form.deliveryAddress.city.trim()) errors.city = "City is required";
    if (!form.deliveryAddress.postcode.trim()) errors.postcode = "Postcode is required";
  }
  if (!form.termsAgreed) errors.termsAgreed = "You must agree to the terms";
  return errors;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");
  const cancelledRef = searchParams.get("ref");
  const wasCancelled = paymentParam === "cancelled";
  const { createOrder } = useOrdersApi({ enabled: false });
  const [form, setForm] = useState<CheckoutForm>(() => {
    if (typeof window !== "undefined" && wasCancelled) {
      return restoreFormFromSession() ?? EMPTY_FORM;
    }
    return EMPTY_FORM;
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState<RestaurantStatus>({
    isOpen: true,
    message: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadRestaurantStatus = async () => {
      try {
        const response = await fetch("/api/restaurant-status", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as RestaurantStatus | null;
        if (!mounted || !payload) {
          return;
        }

        setRestaurantStatus({
          isOpen: payload.isOpen === true,
          message: payload.message ?? "",
        });
      } catch {
        // Keep checkout available if status endpoint is temporarily unreachable.
      }
    };

    void loadRestaurantStatus();
    const interval = setInterval(() => {
      void loadRestaurantStatus();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // When returning from a cancelled Stripe session, immediately mark the
  // abandoned order as failed so it doesn't linger as "pending" in the admin view.
  useEffect(() => {
    if (!wasCancelled || !cancelledRef) {
      return;
    }

    // The checkout-session route embeds the Stripe session ID in the cancel_url
    // as the `ref` param. However, to call abandon we need the Stripe session ID,
    // which we stored in sessionStorage alongside the form before redirecting.
    // We re-read it from a separate key preserved for exactly this purpose.
    let stripeSessionId: string | null = null;
    try {
      stripeSessionId = sessionStorage.getItem("tablestory_checkout_stripe_session");
      sessionStorage.removeItem("tablestory_checkout_stripe_session");
    } catch {
      // sessionStorage unavailable — skip cleanup
    }

    if (!stripeSessionId) {
      return;
    }

    void fetch("/api/payments/abandon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: cancelledRef, sessionId: stripeSessionId }),
    }).catch(() => null);
  }, [wasCancelled, cancelledRef]);

  const tax = cart.totalPrice * 0.08;
  const total = cart.totalPrice + tax;

  if (cart.orders.length === 0 && !submitted) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Stack spacing={3}>
            <Typography variant="h4">Nothing to checkout</Typography>
            <Typography color="text.secondary">Add some items to your order first.</Typography>
            <Button variant="contained" LinkComponent={Link} href="/menu" sx={{ mx: "auto" }}>
              Browse Menu
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  function field<K extends keyof CheckoutForm>(key: K) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
      error: !!errors[key as keyof FieldErrors],
      helperText: errors[key as keyof FieldErrors],
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!restaurantStatus.isOpen) {
      setSubmitError(restaurantStatus.message || "We are currently closed.");
      return;
    }

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (form.payment === "card") {
        const response = await fetch("/api/payments/checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form,
            orders: cart.orders,
            totalPrice: cart.totalPrice,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { checkoutUrl?: string; stripeSessionId?: string; error?: string }
          | null;

        if (!response.ok || !payload?.checkoutUrl) {
          throw new Error(payload?.error ?? "Unable to initialize Stripe checkout.");
        }

        saveFormToSession(form);
        try {
          if (payload.stripeSessionId) {
            sessionStorage.setItem("tablestory_checkout_stripe_session", payload.stripeSessionId);
          }
        } catch {
          // sessionStorage unavailable — abandon cleanup will be skipped
        }
        window.location.href = payload.checkoutUrl;
        return;
      }

      const placed = await createOrder({
        form,
        orders: cart.orders,
        totalPrice: cart.totalPrice,
      });

      setSubmitted(true);
      clearCart();
      router.push(`/order-confirmation?ref=${placed.ref}`);
    } catch (submitRequestError) {
      setSubmitError(
        submitRequestError instanceof Error
          ? submitRequestError.message
          : "Unable to place order right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h3" sx={{ mb: 4, fontSize: { xs: "2rem", sm: "2.5rem" } }}>
          Checkout
        </Typography>

        {wasCancelled && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your payment was cancelled. Your cart has been saved — update your details or try again below.
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
            {/* ── Left column: form ── */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                {/* 1. Your Details */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Your Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="First Name" fullWidth required {...field("firstName")} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Last Name" fullWidth required {...field("lastName")} />
                      </Grid>
                      <Grid size={12}>
                        <TextField label="Email" fullWidth required type="email" {...field("email")} />
                      </Grid>
                      <Grid size={12}>
                        <TextField label="Phone Number" fullWidth required type="tel" {...field("telephone")} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* 2. Fulfillment */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Fulfillment
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={form.fulfillment}
                      onChange={(_e, v: FulfillmentType | null) => {
                        if (v) setForm((f) => ({ ...f, fulfillment: v }));
                      }}
                    >
                      <ToggleButton value="pickup">
                        <StorefrontIcon sx={{ mr: 1 }} /> Pickup
                      </ToggleButton>
                      <ToggleButton value="delivery">
                        <DeliveryDiningIcon sx={{ mr: 1 }} /> Delivery
                      </ToggleButton>
                    </ToggleButtonGroup>

                    {form.fulfillment === "delivery" && (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                          label="Street Address"
                          fullWidth
                          required
                          value={form.deliveryAddress.address1}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              deliveryAddress: { ...f.deliveryAddress, address1: e.target.value },
                            }))
                          }
                          error={!!errors.address1}
                          helperText={errors.address1}
                        />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              label="City"
                              fullWidth
                              required
                              value={form.deliveryAddress.city}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  deliveryAddress: { ...f.deliveryAddress, city: e.target.value },
                                }))
                              }
                              error={!!errors.city}
                              helperText={errors.city}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                              label="State"
                              fullWidth
                              value={form.deliveryAddress.state}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  deliveryAddress: { ...f.deliveryAddress, state: e.target.value },
                                }))
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label="Postcode"
                              fullWidth
                              required
                              value={form.deliveryAddress.postcode}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  deliveryAddress: { ...f.deliveryAddress, postcode: e.target.value },
                                }))
                              }
                              error={!!errors.postcode}
                              helperText={errors.postcode}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Special Instructions */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Special Instructions
                    </Typography>
                    <TextField
                      label="Any notes for the kitchen or delivery?"
                      fullWidth
                      multiline
                      rows={3}
                      inputProps={{ maxLength: 500 }}
                      value={form.comment}
                      onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    />
                  </CardContent>
                </Card>

                {/* 4. Payment */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Payment Method
                    </Typography>
                    <RadioGroup
                      value={form.payment}
                      onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value as PaymentMethod }))}
                    >
                      <Stack spacing={1}>
                        {(
                          [
                            {
                              value: "cash",
                              label: "Cash on Pickup / Delivery",
                              description: "Pay when you collect or receive your order",
                            },
                            {
                              value: "card",
                              label: "Pay by Card",
                              description: "Visa, Mastercard, EFTPOS (processed on arrival)",
                            },
                          ] as const
                        ).map((opt) => (
                          <Card
                            key={opt.value}
                            variant="outlined"
                            sx={{
                              borderColor: form.payment === opt.value ? "primary.main" : "divider",
                              backgroundColor:
                                form.payment === opt.value ? "rgba(143,45,31,0.04)" : "transparent",
                              cursor: "pointer",
                            }}
                            onClick={() => setForm((f) => ({ ...f, payment: opt.value }))}
                          >
                            <CardContent sx={{ py: 1.5 }}>
                              <FormControlLabel
                                value={opt.value}
                                control={<Radio size="small" />}
                                label={
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {opt.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {opt.description}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ m: 0, width: "100%" }}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* 5. Terms + Submit */}
                <Stack spacing={1}>
                  {!restaurantStatus.isOpen && (
                    <FormHelperText error>{restaurantStatus.message || "We are currently closed."}</FormHelperText>
                  )}
                  {submitError && <FormHelperText error>{submitError}</FormHelperText>}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.termsAgreed}
                        onChange={(e) => setForm((f) => ({ ...f, termsAgreed: e.target.checked }))}
                      />
                    }
                    label="I confirm my order details are correct and agree to the terms of service"
                  />
                  {errors.termsAgreed && (
                    <FormHelperText error sx={{ ml: 4 }}>
                      {errors.termsAgreed}
                    </FormHelperText>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={isSubmitting || !restaurantStatus.isOpen}
                  >
                    {isSubmitting ? "Placing Order..." : form.payment === "card" ? "Continue to Secure Payment" : "Place Order"}
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* ── Right column: order summary ── */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ position: { md: "sticky" }, top: { md: 100 } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Order Summary
                    </Typography>
                    <Stack spacing={2}>
                      {cart.orders.map((order, i) => (
                        <Stack key={order.orderId} spacing={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            ORDER {i + 1}
                          </Typography>
                          {order.lines.map((line) => (
                            <Stack
                              key={line.id}
                              direction="row"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="body2">
                                {line.cartQuantity}× {line.name}
                              </Typography>
                              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                                ${(line.price * line.cartQuantity).toFixed(2)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ))}

                      <Divider />

                      <Stack spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Subtotal</Typography>
                          <Typography variant="body2">${cart.totalPrice.toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Est. tax (8%)</Typography>
                          <Typography variant="body2">${tax.toFixed(2)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            Total
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                            ${total.toFixed(2)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Button
                  variant="text"
                  LinkComponent={Link}
                  href="/cart"
                  sx={{ mt: 1 }}
                  size="small"
                >
                  ← Edit orders
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </Box>
  );
}
