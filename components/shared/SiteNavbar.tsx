"use client";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    if (!isDesktop) {
      return;
    }

    triggerHoveredRef.current = true;
    cancelAccountClose();
    setAccountAnchor(target);
  };

  const handleTriggerLeave = () => {
    if (!isDesktop) {
      return;
    }

    triggerHoveredRef.current = false;
    scheduleAccountClose();
  };

  const handleMenuEnter = () => {
    if (!isDesktop) {
      return;
    }

    menuHoveredRef.current = true;
    cancelAccountClose();
  };

  const handleMenuLeave = () => {
    if (!isDesktop) {
      return;
    }

    menuHoveredRef.current = false;
    scheduleAccountClose();
  };

  const handleAccountClick = (target: HTMLElement) => {
    if (accountAnchor === target) {
      setAccountAnchor(null);
      return;
    }

    setAccountAnchor(target);
  };

  const handleDrawerNavigate = () => {
    setMobileNavOpen(false);
    setAccountAnchor(null);
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            py: 0.75,
            minHeight: { xs: 56, sm: 64 },
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ color: "text.primary", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              TableStory
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
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
          </Box>

          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <IconButton
              LinkComponent={Link}
              href="/cart"
              color="primary"
              sx={{ ml: { xs: 0, md: 0.5 } }}
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
                  onClick={(event) => {
                    event.preventDefault();
                    handleAccountClick(event.currentTarget);
                  }}
                  onMouseEnter={(event) => handleTriggerEnter(event.currentTarget)}
                  onMouseLeave={handleTriggerLeave}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    ml: 0.5,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Avatar
                    src={user.image ?? undefined}
                    alt={user.name ?? "You"}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, display: { xs: "none", sm: "block" } }}
                  >
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
                  <ClickAwayListener onClickAway={() => setAccountAnchor(null)}>
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
                  </ClickAwayListener>
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

            <IconButton
              sx={{ display: { xs: "inline-flex", md: "none" }, ml: 0.5 }}
              color="inherit"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <IconButton aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ pt: 0 }}>
          {items.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={handleDrawerNavigate}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          <ListItemButton component={Link} href="/cart" onClick={handleDrawerNavigate}>
            <ListItemText primary={`Cart (${cart.totalOrders})`} />
          </ListItemButton>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          {user ? (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setMobileNavOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
            >
              Sign out
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setMobileNavOpen(false);
                window.dispatchEvent(new CustomEvent("open-welcome-modal"));
              }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}
