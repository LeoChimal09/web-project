"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { useCart } from "@/features/cart/CartContext";
import { formatOrderTimestamp } from "@/features/checkout/order-format";
import type { OrderStatus } from "@/features/checkout/checkout.types";
import { canRemoveOrderFromHistory, formatOrderEtaMinutes } from "@/features/checkout/order-status";
import { useOrdersApi } from "@/hooks/useOrdersApi";

const HIDDEN_ORDER_HISTORY_KEY = "tablestory_hidden_order_history";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: "default" | "warning" | "info" | "success" | "error" }> = {
  pending:    { label: "Pending",     color: "default"  },
  in_progress:{ label: "In Progress", color: "warning"  },
  ready:      { label: "Ready",       color: "info"     },
  completed:  { label: "Completed",   color: "success"  },
  cancelled:  { label: "Cancelled",   color: "error"    },
};

export default function OrdersPage() {
  const { cart, remakeOrder } = useCart();
  const { orders, loading, error, updateOrderStatus } = useOrdersApi();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [hiddenOrderRefs, setHiddenOrderRefs] = useState<string[]>([]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_ORDER_HISTORY_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setHiddenOrderRefs(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      localStorage.removeItem(HIDDEN_ORDER_HISTORY_KEY);
    }
  }, []);

  const visibleOrders = orders.filter((order) => !hiddenOrderRefs.includes(order.ref));
  const showOverflowMask = visibleOrders.length > 3;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showOverflowMask) {
      setShowBottomFade(false);
      return;
    }

    const updateFade = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowBottomFade(remaining > 8);
    };

    updateFade();
    el.addEventListener("scroll", updateFade);
    window.addEventListener("resize", updateFade);

    return () => {
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, [showOverflowMask, visibleOrders.length]);

  const handleRemakeOrder = (orderOrders: typeof orders[number]["orders"]) => {
    if (cart.totalOrders > 0) {
      setConfirmState({
        open: true,
        title: "Replace current cart?",
        description: "Your current cart will be replaced with this previous order. You can still review and edit it at checkout.",
        confirmLabel: "Replace Cart",
        confirmColor: "warning",
        onConfirm: () => {
          remakeOrder(orderOrders);
          router.push("/checkout");
          setConfirmState((prev) => ({ ...prev, open: false }));
        },
      });
      return;
    }

    remakeOrder(orderOrders);
    router.push("/checkout");
  };

  if (loading) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Typography color="text.secondary">Loading orders...</Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Stack spacing={3}>
            <Typography variant="h4">Unable to load orders</Typography>
            <Typography color="text.secondary">{error}</Typography>
            <Button variant="contained" LinkComponent={Link} href="/menu" sx={{ mx: "auto" }}>
              Back to Menu
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (visibleOrders.length === 0) {
    return (
      <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
          <Stack spacing={3}>
            <Typography variant="h3" sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}>My Orders</Typography>
            <Typography color="text.secondary">
              {orders.length === 0
                ? "You haven't placed any orders yet."
                : "No orders are currently visible in your browser history."}
            </Typography>
            <Button variant="contained" LinkComponent={Link} href="/menu" sx={{ mx: "auto" }}>
              Start an Order
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Typography variant="h3" sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}>My Orders</Typography>

          <Box sx={{ position: "relative" }}>
            <Box
              ref={scrollRef}
              sx={{
                maxHeight: showOverflowMask ? { xs: 420, md: 452 } : "none",
                overflowY: showOverflowMask ? "auto" : "visible",
                pr: showOverflowMask ? 1 : 0,
                scrollbarWidth: "thin",
                overscrollBehavior: "contain",
              }}
            >
              <Stack spacing={2}>
              {visibleOrders.map((order) => {
                const status = STATUS_CONFIG[order.status];
                const canRemove = canRemoveOrderFromHistory(order.status);
                const itemCount = order.orders.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.cartQuantity, 0), 0);
                const tax = order.totalPrice * 0.08;
                return (
                  <Card
                    key={order.ref}
                    variant="outlined"
                    sx={{
                      position: "relative",
                      display: "block",
                      "&:hover": { borderColor: "primary.main", backgroundColor: "rgba(143,45,31,0.02)" },
                      transition: "border-color 0.15s, background-color 0.15s",
                    }}
                  >
                    {canRemove && (
                      <IconButton
                        aria-label={`Remove ${order.ref} from history`}
                        size="small"
                        sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            title: "Remove order from history?",
                            description: "This only removes the order from your browser history list. It will not affect any submitted order.",
                            confirmLabel: "Remove",
                            confirmColor: "error",
                            onConfirm: () => {
                              setHiddenOrderRefs((prev) => {
                                if (prev.includes(order.ref)) {
                                  return prev;
                                }

                                const next = [...prev, order.ref];
                                localStorage.setItem(HIDDEN_ORDER_HISTORY_KEY, JSON.stringify(next));
                                return next;
                              });
                              setConfirmState((prev) => ({ ...prev, open: false }));
                            },
                          })
                        }
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}

                    <CardContent sx={{ pr: canRemove ? 6 : 2 }}>
                      <Stack spacing={1.5}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          spacing={1}
                        >
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {order.ref}
                              </Typography>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {formatOrderTimestamp(order.placedAt)} &middot;{" "}
                              {itemCount} item{itemCount !== 1 ? "s" : ""} &middot;{" "}
                              {order.form.fulfillment === "delivery" ? "Delivery" : "Pickup"}
                            </Typography>
                            {order.status === "in_progress" && order.etaMinutes && (
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                                Estimated time: {formatOrderEtaMinutes(order.etaMinutes)}
                              </Typography>
                            )}
                          </Stack>
                          <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.25}>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                              ${(order.totalPrice + tax).toFixed(2)}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                            size="small"
                            variant="outlined"
                            LinkComponent={Link}
                            href={`/orders/${order.ref}`}
                          >
                            View Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleRemakeOrder(order.orders)}
                          >
                            Remake Order
                          </Button>
                          {order.status === "pending" && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  title: "Cancel this order?",
                                  description: "This order is still pending, so it can be cancelled now. You will still keep it in your order history.",
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
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
              </Stack>
            </Box>

            {showOverflowMask && showBottomFade && (
              <Box
                sx={{
                  pointerEvents: "none",
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 72,
                  background:
                    "linear-gradient(180deg, rgba(247,241,232,0) 0%, rgba(247,241,232,0.7) 52%, rgba(247,241,232,1) 100%)",
                }}
              />
            )}

            {showOverflowMask && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1, textAlign: "right" }}
              >
                Scroll to view older orders
              </Typography>
            )}
          </Box>

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
