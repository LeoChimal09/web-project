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
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { useCart } from "@/features/cart/CartContext";
import { formatOrderTimestamp } from "@/features/checkout/order-format";
import type { OrderStatus } from "@/features/checkout/checkout.types";
import { formatOrderEtaMinutes } from "@/features/checkout/order-status";
import { useOrdersApi } from "@/hooks/useOrdersApi";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: "default" | "warning" | "info" | "success" | "error"; description: string }> = {
  pending:     { label: "Pending",     color: "default",  description: "We've received your order and are getting it ready." },
  in_progress: { label: "In Progress", color: "warning",  description: "Your order is being prepared in the kitchen." },
  ready:       { label: "Ready",       color: "info",     description: "Your order is ready! Please come collect it or await delivery." },
  completed:   { label: "Completed",   color: "success",  description: "Your order has been delivered/collected. Enjoy!" },
  cancelled:   { label: "Cancelled",   color: "error",    description: "This order has been cancelled." },
};

export default function OrderDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const { cart, remakeOrder } = useCart();
  const router = useRouter();
  const { order, loading, error, updateOrderStatus } = useOrdersApi({ ref });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: "primary" | "error" | "warning";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    confirmColor: "primary",
    onConfirm: () => {},
  });

  if (loading) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Typography color="text.secondary">Loading order...</Typography>
        </Container>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Stack spacing={3}>
            <Typography variant="h4">Order not found</Typography>
            <Typography color="text.secondary">
              {error ?? "This order may have been cleared from your browser history."}
            </Typography>
            <Button variant="contained" LinkComponent={Link} href="/orders" sx={{ mx: "auto" }}>
              Back to My Orders
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  const { form, orders, totalPrice } = order;
  const status = STATUS_CONFIG[order.status];
  const tax = totalPrice * 0.08;
  const total = totalPrice + tax;
  const isDelivery = form.fulfillment === "delivery";

  const handleRemakeOrder = () => {
    if (cart.totalOrders > 0) {
      setConfirmState({
        open: true,
        title: "Replace current cart?",
        description: "Your current cart will be replaced with this previous order. You can still review and edit it at checkout.",
        confirmLabel: "Replace Cart",
        confirmColor: "warning",
        onConfirm: () => {
          remakeOrder(order.orders);
          router.push("/checkout");
          setConfirmState((prev) => ({ ...prev, open: false }));
        },
      });
      return;
    }

    remakeOrder(order.orders);
    router.push("/checkout");
  };

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={1}>
            <Button
              component={Link}
              href="/orders"
              variant="text"
              size="small"
              sx={{ width: "fit-content", pl: 0 }}
            >
              ← My Orders
            </Button>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {order.ref}
              </Typography>
              <Chip label={status.label} color={status.color} />
            </Stack>
            <Typography color="text.secondary">
              Placed {formatOrderTimestamp(order.placedAt)}
            </Typography>
          </Stack>

          {/* Status card */}
          <Card variant="outlined" sx={{ borderColor: `${status.color}.main` }}>
            <CardContent>
              <Stack spacing={0.5}>
                <Typography variant="body1">{status.description}</Typography>
                {order.status === "in_progress" && order.etaMinutes && (
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                    Estimated time: {formatOrderEtaMinutes(order.etaMinutes)}
                  </Typography>
                )}
                {order.status === "cancelled" && order.cancellationNote?.trim() && (
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                    Restaurant note: {order.cancellationNote}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            {/* Left: items */}
            <Stack spacing={3} sx={{ flex: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Items Ordered
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
            <Button variant="contained" onClick={handleRemakeOrder}>
              Remake Order
            </Button>
            <Button variant="outlined" LinkComponent={Link} href="/menu">
              Browse Menu
            </Button>
            <Button variant="outlined" LinkComponent={Link} href="/orders">
              All Orders
            </Button>
            {order.status === "pending" && (
              <Button
                variant="outlined"
                color="error"
                onClick={() =>
                  setConfirmState({
                    open: true,
                    title: "Cancel this order?",
                    description: "This order is still pending, so it can be cancelled now. It will remain visible in your history.",
                    confirmLabel: "Cancel Order",
                    confirmColor: "error",
                    onConfirm: async () => {
                      await updateOrderStatus(order.ref, "cancelled");
                      setConfirmState((prev) => ({ ...prev, open: false }));
                    },
                  })
                }
              >
                Cancel Order
              </Button>
            )}
          </Stack>

          <ConfirmActionDialog
            open={confirmState.open}
            title={confirmState.title}
            description={confirmState.description}
            confirmLabel={confirmState.confirmLabel}
            confirmColor={confirmState.confirmColor}
            onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
            onConfirm={confirmState.onConfirm}
          />
        </Stack>
      </Container>
    </Box>
  );
}
