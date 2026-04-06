"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { MenuCategory } from "@/features/menu/menu.data";

const categoryEmojis: Record<string, string> = {
  All: "🍽️",
  Appetizers: "🥗",
  Mains: "🍖",
  Seafood: "🦞",
  Vegetarian: "🥦",
  Desserts: "🍰",
  Drinks: "🥂",
};

type CategorySidebarProps = {
  categories: (string | MenuCategory)[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <Stack spacing={2}>
      {categories.map((category) => (
        <Card
          key={category}
          onClick={() => onSelectCategory(category)}
          sx={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: selectedCategory === category ? "2px solid" : "1px solid",
            borderColor: selectedCategory === category ? "primary.main" : "divider",
            backgroundColor: selectedCategory === category ? "action.selected" : "background.paper",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: (theme) => theme.shadows[4],
            },
          }}
        >
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", p: 2 }}>
            <Box sx={{ fontSize: "2rem" }}>
              {categoryEmojis[category as keyof typeof categoryEmojis] || "📌"}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: selectedCategory === category ? 700 : 500,
                color: selectedCategory === category ? "primary.main" : "text.primary",
              }}
            >
              {category}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
