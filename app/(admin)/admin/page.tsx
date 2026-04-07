"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import AdminSignOutButton from "@/components/auth/AdminSignOutButton";

const modules = [
  {
    name: "Orders",
    description: "Review mock orders and move them through the test status workflow.",
    href: "/admin/orders",
    cta: "Open Orders",
  },
  {
    name: "Menu",
    description: "Planned module from the reference workflow.",
  },
  {
    name: "Tables",
    description: "Planned module from the reference workflow.",
  },
  {
    name: "Staff",
    description: "Planned module from the reference workflow.",
  },
  {
    name: "Billing",
    description: "Planned module from the reference workflow.",
  },
  {
    name: "Reports",
    description: "Planned module from the reference workflow.",
  },
  {
    name: "Kitchen",
    description: "Planned module from the reference workflow.",
  },
];

export default function AdminDashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="overline" color="secondary.main">
          Admin Area
        </Typography>
        <Typography variant="h3">Operations Dashboard</Typography>
        <Typography color="text.secondary">
          Initial scaffold for the restaurant staff experience. Each module will be implemented as a dedicated route.
        </Typography>
        <Stack direction="row" justifyContent="flex-start" sx={{ pt: 1 }}>
          <AdminSignOutButton />
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {modules.map((module) => (
          <Card key={module.name} variant="outlined">
            <CardContent>
              <Typography variant="h6">{module.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {module.description}
              </Typography>
            </CardContent>
            {module.href && (
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button variant="contained" LinkComponent={Link} href={module.href}>
                  {module.cta}
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
      </Box>
    </Container>
  );
}
