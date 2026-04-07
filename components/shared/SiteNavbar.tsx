"use client";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCart } from "@/features/cart/CartContext";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "My Orders", href: "/orders" },
];

type NavUser = { name: string | null; image: string | null; href: string } | null;

type SiteNavbarProps = {
  showAdmin?: boolean;
  user?: NavUser;
};

export default function SiteNavbar({ showAdmin = false, user = null }: SiteNavbarProps) {
  const { cart } = useCart();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerHoveredRef = useRef(false);
  const menuHoveredRef = useRef(false);
  const items = showAdmin
    ? [...navItems, { label: "Admin", href: "/admin" }]
    : navItems;

  const accountMenuOpen = Boolean(accountAnchor);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const cancelAccountClose = () => {
    if (!closeTimerRef.current) {
      return;
    }

    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const scheduleAccountClose = () => {
    cancelAccountClose();
    closeTimerRef.current = setTimeout(() => {
      if (!triggerHoveredRef.current && !menuHoveredRef.current) {
        setAccountAnchor(null);
      }
    }, 80);
  };

  const handleTriggerEnter = (target: HTMLElement) => {
    triggerHoveredRef.current = true;
    cancelAccountClose();
    setAccountAnchor(target);
  };

  const handleTriggerLeave = () => {
    triggerHoveredRef.current = false;
    scheduleAccountClose();
  };

  const handleMenuEnter = () => {
    menuHoveredRef.current = true;
    cancelAccountClose();
  };

  const handleMenuLeave = () => {
    menuHoveredRef.current = false;
    scheduleAccountClose();
  };

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
            {items.map((item) => (
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

            {user ? (
              <>
                <Box
                  component={Link}
                  href={user.href}
                  onMouseEnter={(event) => handleTriggerEnter(event.currentTarget)}
                  onMouseLeave={handleTriggerLeave}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    ml: 1,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Avatar
                    src={user.image ?? undefined}
                    alt={user.name ?? "You"}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.name ?? "Account"}
                  </Typography>
                </Box>
                <Popper
                  open={accountMenuOpen}
                  anchorEl={accountAnchor}
                  placement="bottom-end"
                  disablePortal
                  modifiers={[{ name: "offset", options: { offset: [0, 0] } }]}
                >
                  <Paper
                    elevation={3}
                    onMouseEnter={handleMenuEnter}
                    onMouseLeave={handleMenuLeave}
                    sx={{ minWidth: 150, p: 0.75 }}
                  >
                    <Button
                      fullWidth
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setAccountAnchor(null);
                        void signOut({ callbackUrl: "/" });
                      }}
                    >
                      Sign out
                    </Button>
                  </Paper>
                </Popper>
              </>
            ) : (
              <Button
                variant="text"
                size="small"
                startIcon={<PersonOutlineIcon />}
                sx={{ ml: 1 }}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-welcome-modal"))
                }
              >
                Sign in
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
