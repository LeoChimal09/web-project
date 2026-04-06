"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";
import CategorySidebar from "@/components/customer/CategorySidebar";
import MenuGrid from "@/components/customer/MenuGrid";
import { MENU_CATEGORIES, menuItems } from "@/features/menu/menu.data";

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    return ["All", ...MENU_CATEGORIES];
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") {
      return menuItems;
    }
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} sx={{ mb: 6 }}>
          <Typography variant="overline" color="secondary.main">
            Our Culinary Collection
          </Typography>
          <Typography variant="h3">Browse Our Menu</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
            Explore our carefully curated selection of dishes, from timeless classics to seasonal specials.
            All items are prepared fresh to order.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ mb: 6 }}>
          {/* Left Sidebar - Categories */}
          <Box sx={{ width: { xs: "100%", md: "280px" }, flexShrink: 0 }}>
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </Box>

          {/* Right Content - Menu Items */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedCategory}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  LinkComponent={Link}
                  href="/reservation"
                >
                  Make a Reservation
                </Button>
              </Stack>
              <MenuGrid items={filteredItems} />
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
