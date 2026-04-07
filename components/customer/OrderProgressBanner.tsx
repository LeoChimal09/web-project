"use client";

import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { getOrderProgressMessage, isActiveOrderStatus } from "@/features/checkout/order-status";
import { useOrdersApi } from "@/hooks/useOrdersApi";

export default function OrderProgressBanner() {
  const { orders, loading, dismissNotification } = useOrdersApi();
  // Optimistic set: refs dismissed this session before the server round-trip completes
  const optimisticDismissed = useRef(new Set<string>());

  const activeOrder = useMemo(() => {
    return orders.find(
      (order) =>
        isActiveOrderStatus(order.status, order.cancelledBy) &&
        !order.notificationDismissedAt &&
        !optimisticDismissed.current.has(order.ref),
    );
  }, [orders]);

  if (loading || !activeOrder) {
    return null;
  }

  const handleDismiss = () => {
    // Instantly hide via optimistic ref so UI responds before API round-trip
    optimisticDismissed.current.add(activeOrder.ref);
    void dismissNotification(activeOrder.ref);
  };

  return (
    <Box sx={{ backgroundColor: "rgba(143,45,31,0.08)", borderTop: "1px solid", borderBottom: "1px solid", borderColor: "rgba(143,45,31,0.18)" }}>
      <Container maxWidth="lg" sx={{ py: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <InfoOutlinedIcon color="primary" fontSize="small" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Order {activeOrder.ref} update
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {getOrderProgressMessage(activeOrder.status, activeOrder.etaMinutes, activeOrder.cancellationNote)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button size="small" variant="outlined" LinkComponent={Link} href={`/orders/${activeOrder.ref}`}>
              View Order
            </Button>
            <IconButton
              size="small"
              aria-label="Dismiss order progress notification"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}