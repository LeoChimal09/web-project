"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

const featuredMenu = [
  { title: "Fire-Grilled Ribeye", detail: "Herb butter, roasted root vegetables" },
  { title: "Citrus Sea Bass", detail: "Lemon emulsion, charred broccolini" },
  { title: "Garden Harvest Bowl", detail: "Seasonal greens, wild rice, tahini drizzle" },
];

export default function HomePage() {
  return (
    <Box sx={{ backgroundColor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={2} sx={{ maxWidth: 720, mb: { xs: 5, md: 8 } }}>
          <Typography variant="overline" color="secondary.main">
            Inspired by our restaurant reference flow
          </Typography>
          <Typography variant="h2">A modern dining experience, rebuilt with MUI.</Typography>
          <Typography variant="h6" color="text.secondary">
            We are implementing the reference project structure with a cleaner customer journey and an admin-ready foundation.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
            <Button variant="contained" size="large" LinkComponent={Link} href="/menu">
              Browse Our Menu
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {featuredMenu.map((dish) => (
            <Card key={dish.title} sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {dish.title}
                </Typography>
                <Typography color="text.secondary">{dish.detail}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
