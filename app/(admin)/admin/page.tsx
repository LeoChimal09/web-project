"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const modules = [
  "Reservations",
  "Menu",
  "Tables",
  "Staff",
  "Billing",
  "Reports",
  "Kitchen",
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
          <Card key={module} variant="outlined">
            <CardContent>
              <Typography variant="h6">{module}</Typography>
              <Typography variant="body2" color="text.secondary">
                Planned module from the reference workflow.
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
