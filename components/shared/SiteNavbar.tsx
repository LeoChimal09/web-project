"use client";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCart } from "@/features/cart/CartContext";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Reservation", href: "/reservation" },
  { label: "My Orders", href: "/orders" },
  { label: "Admin", href: "/admin" },
];

export default function SiteNavbar() {
  const { cart } = useCart();
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              TableStory
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                LinkComponent={Link}
                href={item.href}
                color="inherit"
              >
                {item.label}
              </Button>
            ))}
            <IconButton
              LinkComponent={Link}
              href="/cart"
              color="primary"
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={cart.totalOrders} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
