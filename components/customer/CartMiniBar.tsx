"use client";

import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCart } from "@/features/cart/CartContext";

export default function CartMiniBar() {
  const { cart } = useCart();

  if (cart.totalOrders === 0) return null;

  return (
    <Box
      sx={{
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        py: 0.75,
        position: "sticky",
        top: 64,
        zIndex: 1099,
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingBagIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {cart.totalOrders} order{cart.totalOrders > 1 ? "s" : ""} &nbsp;·&nbsp; ${cart.totalPrice.toFixed(2)}
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/cart"
            size="small"
            variant="outlined"
            sx={{ color: "inherit", borderColor: "rgba(255,255,255,0.5)", py: 0.25 }}
          >
            View Order
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
