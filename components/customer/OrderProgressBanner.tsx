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
import { useEffect, useMemo, useState } from "react";
import { getOrderProgressMessage, isActiveOrderStatus } from "@/features/checkout/order-status";
import { useOrdersApi } from "@/hooks/useOrdersApi";

const DISMISSED_KEY = "tablestory_dismissed_order_notifications";

export default function OrderProgressBanner() {
  const { orders, loading } = useOrdersApi();
  const [dismissedRefs, setDismissedRefs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setDismissedRefs(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      localStorage.removeItem(DISMISSED_KEY);
    }
  }, []);

  const activeOrder = useMemo(() => {
    return orders.find((order) => isActiveOrderStatus(order.status) && !dismissedRefs.includes(order.ref));
  }, [dismissedRefs, orders]);

  if (loading || !activeOrder) {
    return null;
  }

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
                {getOrderProgressMessage(activeOrder.status, activeOrder.etaMinutes)}
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
              onClick={() => {
                setDismissedRefs((prev) => {
                  if (prev.includes(activeOrder.ref)) {
                    return prev;
                  }

                  const next = [...prev, activeOrder.ref];
                  localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
                  return next;
                });
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}