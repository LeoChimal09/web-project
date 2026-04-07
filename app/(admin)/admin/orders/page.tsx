"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { formatOrderTimestamp } from "@/features/checkout/order-format";
import type { OrderEtaMinutes, OrderStatus } from "@/features/checkout/checkout.types";
import { canRemoveOrderFromHistory, canTransitionOrderStatus, formatOrderEtaMinutes, ORDER_ETA_OPTIONS } from "@/features/checkout/order-status";
import { useOrdersApi } from "@/hooks/useOrdersApi";

const HIDDEN_ADMIN_ORDER_HISTORY_KEY = "tablestory_hidden_admin_order_history";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: "default" | "warning" | "info" | "success" | "error" }> = {
  pending: { label: "Pending", color: "default" },
  in_progress: { label: "In Progress", color: "warning" },
  ready: { label: "Ready", color: "info" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

const WORKFLOW: OrderStatus[] = ["pending", "in_progress", "ready", "completed", "cancelled"];

export default function AdminOrdersPage() {
  const { orders, loading, error, updateOrderStatus } = useOrdersApi();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [hiddenOrderRefs, setHiddenOrderRefs] = useState<string[]>([]);
  const [etaDialogOrderRef, setEtaDialogOrderRef] = useState<string | null>(null);
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

  const visibleOrders = orders.filter((order) => !hiddenOrderRefs.includes(order.ref));
  const showOverflowMask = visibleOrders.length > 3;

  const etaDialogOrder = etaDialogOrderRef
    ? visibleOrders.find((order) => order.ref === etaDialogOrderRef) ?? null
    : null;

  const handleChooseEta = (etaMinutes: OrderEtaMinutes) => {
    if (!etaDialogOrderRef) {
      return;
    }

    void updateOrderStatus(etaDialogOrderRef, "in_progress", etaMinutes);
    setEtaDialogOrderRef(null);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_ADMIN_ORDER_HISTORY_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setHiddenOrderRefs(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      localStorage.removeItem(HIDDEN_ADMIN_ORDER_HISTORY_KEY);
    }
  }, []);

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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
        <Typography color="text.secondary">Loading admin orders...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: "center" }}>
        <Stack spacing={3}>
          <Typography variant="h4">Unable to load admin orders</Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button variant="contained" LinkComponent={Link} href="/admin">
            Back to Dashboard
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="overline" color="secondary.main">
          Admin Area
        </Typography>
        <Typography variant="h3">Orders</Typography>
        <Typography color="text.secondary">
          Test-only view for the mock order API. Status changes are kept in server memory and reset when the dev server restarts.
        </Typography>
      </Stack>

      {visibleOrders.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="h6">
                {orders.length === 0 ? "No orders yet" : "No orders are currently visible"}
              </Typography>
              <Typography color="text.secondary">
                {orders.length === 0
                  ? "Place a customer order first, then come back here to move it through the workflow."
                  : "Hidden orders can be shown again by clearing this browser's local storage for admin history."}
              </Typography>
              <Button variant="contained" LinkComponent={Link} href="/menu">
                Open Menu
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ position: "relative" }}>
          <Box
            ref={scrollRef}
            sx={{
              maxHeight: showOverflowMask ? { xs: 520, md: 560 } : "none",
              overflowY: showOverflowMask ? "auto" : "visible",
              pr: showOverflowMask ? 1 : 0,
              scrollbarWidth: "thin",
              overscrollBehavior: "contain",
            }}
          >
            <Stack spacing={2}>
              {visibleOrders.map((order) => {
                const itemCount = order.orders.reduce((sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.cartQuantity, 0), 0);
                const status = STATUS_CONFIG[order.status];
                const canRemove = canRemoveOrderFromHistory(order.status);

                return (
                  <Card key={order.ref} variant="outlined" sx={{ position: "relative" }}>
                    {canRemove && (
                      <IconButton
                        aria-label={`Remove ${order.ref} from admin history`}
                        size="small"
                        sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}
                        onClick={() => {
                          setConfirmState({
                            open: true,
                            title: "Remove order from admin history?",
                            description: "This only hides the order in this admin browser. It does not delete the submitted order.",
                            confirmLabel: "Remove",
                            confirmColor: "error",
                            onConfirm: () => {
                              setHiddenOrderRefs((prev) => {
                                if (prev.includes(order.ref)) {
                                  return prev;
                                }

                                const next = [...prev, order.ref];
                                localStorage.setItem(HIDDEN_ADMIN_ORDER_HISTORY_KEY, JSON.stringify(next));
                                return next;
                              });
                              setConfirmState((prev) => ({ ...prev, open: false }));
                            },
                          });
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                    <CardContent sx={{ pr: canRemove ? 7 : 2 }}>
                      <Stack spacing={2.5}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                          spacing={2}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="h6">{order.ref}</Typography>
                              <Chip size="small" label={status.label} color={status.color} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {formatOrderTimestamp(order.placedAt)} · {order.form.firstName} {order.form.lastName} · {order.form.fulfillment === "delivery" ? "Delivery" : "Pickup"}
                            </Typography>
                            {order.status === "in_progress" && order.etaMinutes && (
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                                ETA: {formatOrderEtaMinutes(order.etaMinutes)}
                              </Typography>
                            )}
                          </Stack>

                          <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.5}>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                              ${order.totalPrice.toFixed(2)} subtotal
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Divider />

                        <Box
                          sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "minmax(0, 1fr) minmax(0, 1.2fr)",
                            },
                          }}
                        >
                          <Stack spacing={0.75}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Customer
                            </Typography>
                            <Typography variant="body2">{order.form.email}</Typography>
                            <Typography variant="body2">{order.form.telephone}</Typography>
                            {order.form.fulfillment === "delivery" && (
                              <Typography variant="body2" color="text.secondary">
                                {order.form.deliveryAddress.address1}, {order.form.deliveryAddress.city}
                              </Typography>
                            )}
                          </Stack>

                          <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Update Status
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {WORKFLOW.map((nextStatus) => (
                                (() => {
                                  const canTransition = canTransitionOrderStatus(order.status, nextStatus);

                                  return (
                                    <Button
                                      key={nextStatus}
                                      size="small"
                                      variant={order.status === nextStatus ? "contained" : "outlined"}
                                      color={STATUS_CONFIG[nextStatus].color === "default" ? "inherit" : STATUS_CONFIG[nextStatus].color}
                                      disabled={!canTransition || order.status === nextStatus}
                                      onClick={() => {
                                        if (nextStatus === "in_progress" && order.status !== "in_progress") {
                                          setEtaDialogOrderRef(order.ref);
                                          return;
                                        }

                                        void updateOrderStatus(order.ref, nextStatus);
                                      }}
                                    >
                                      {STATUS_CONFIG[nextStatus].label}
                                    </Button>
                                  );
                                })()
                              ))}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Orders can only move forward through the workflow, and only pending orders can be cancelled.
                            </Typography>
                          </Stack>
                        </Box>
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
      )}

      <ConfirmActionDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        confirmColor={confirmState.confirmColor}
        onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
      />

      <Dialog
        open={Boolean(etaDialogOrderRef)}
        onClose={() => setEtaDialogOrderRef(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Set Prep Time</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              Choose an estimated preparation time before marking order {etaDialogOrder?.ref ?? ""} as In Progress.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {ORDER_ETA_OPTIONS.map((minutes) => (
                <Button
                  key={minutes}
                  variant="outlined"
                  onClick={() => handleChooseEta(minutes)}
                >
                  {formatOrderEtaMinutes(minutes)}
                </Button>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEtaDialogOrderRef(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}