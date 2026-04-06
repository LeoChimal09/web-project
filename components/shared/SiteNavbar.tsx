"use client";

import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Reservation", href: "/reservation" },
  { label: "Admin", href: "/admin" },
];

export default function SiteNavbar() {
  return (
    <AppBar position="sticky" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              TableStory
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
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
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
