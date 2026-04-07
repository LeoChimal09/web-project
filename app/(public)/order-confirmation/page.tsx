"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOrdersApi } from "@/hooks/useOrdersApi";

export default function OrderConfirmationPage() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const { order, loading, error } = useOrdersApi({ ref, enabled: Boolean(ref) });

  const notFound = !ref || (!loading && !order);

  if (loading) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Typography color="text.secondary">Loading order...</Typography>
        </Container>
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Stack spacing={3}>
            <Typography variant="h4">Order not found</Typography>
            <Typography color="text.secondary">
              {error ?? "This confirmation link may have expired or is invalid."}
            </Typography>
            <Button variant="contained" LinkComponent={Link} href="/menu" sx={{ mx: "auto" }}>
              Back to Menu
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (!order) return null;

  const { form, orders, totalPrice } = order;
  const tax = totalPrice * 0.08;
  const total = totalPrice + tax;
  const isDelivery = form.fulfillment === "delivery";

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          {/* Status banner */}
          <Card sx={{ backgroundColor: "success.50", borderColor: "success.main" }} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Order Placed!
                  </Typography>
                  <Typography color="text.secondary">
                    Thank you, {form.firstName}. Your order reference is{" "}
                    <strong>{order.ref}</strong>.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            {/* Left: order items */}
            <Stack spacing={3} sx={{ flex: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Your Order
                  </Typography>
                  <Stack spacing={2}>
                    {orders.map((entry, i) => (
                      <Stack key={entry.orderId} spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={`Order ${i + 1}`} size="small" color="primary" />
                        </Stack>
                        {entry.lines.map((line) => (
                          <Stack
                            key={line.id}
                            direction="row"
                            justifyContent="space-between"
                            sx={{ pl: 1 }}
                          >
                            <Typography variant="body2">
                              {line.cartQuantity}× {line.name}
                            </Typography>
                            <Typography variant="body2">
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
                        <Typography variant="body2">${totalPrice.toFixed(2)}</Typography>
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
            </Stack>

            {/* Right: details */}
            <Stack spacing={2} sx={{ width: { xs: "100%", sm: 260 }, flexShrink: 0 }}>
              {/* Fulfillment */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    {isDelivery ? (
                      <DeliveryDiningIcon color="primary" fontSize="small" />
                    ) : (
                      <StorefrontIcon color="primary" fontSize="small" />
                    )}
                    <Typography variant="subtitle2" color="text.secondary">
                      {isDelivery ? "Delivery Address" : "Pickup"}
                    </Typography>
                  </Stack>
                  {isDelivery ? (
                    <Stack>
                      <Typography variant="body2">{form.deliveryAddress.address1}</Typography>
                      <Typography variant="body2">
                        {form.deliveryAddress.city}
                        {form.deliveryAddress.state ? `, ${form.deliveryAddress.state}` : ""}
                        {form.deliveryAddress.postcode ? ` ${form.deliveryAddress.postcode}` : ""}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Ready for in-store pickup
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Payment */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Payment
                  </Typography>
                  <Typography variant="body2">
                    {form.payment === "cash" ? "Cash on Pickup / Delivery" : "Pay by Card"}
                  </Typography>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Contact
                  </Typography>
                  <Typography variant="body2">
                    {form.firstName} {form.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.telephone}
                  </Typography>
                </CardContent>
              </Card>

              {/* Special instructions */}
              {form.comment.trim() && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Special Instructions
                    </Typography>
                    <Typography variant="body2">{form.comment}</Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" LinkComponent={Link} href="/menu">
              Back to Menu
            </Button>
            <Button variant="outlined" LinkComponent={Link} href="/">
              Home
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
