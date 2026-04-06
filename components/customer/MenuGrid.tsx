"use client";

import Box from "@mui/material/Box";
import type { MenuItem } from "./MenuCard";
import MenuCard from "./MenuCard";

type MenuGridProps = {
  items: MenuItem[];
};

export default function MenuGrid({ items }: MenuGridProps) {
  return (
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
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </Box>
  );
}
