"use client";

import Box from "@mui/material/Box";
import type { MenuItem } from "./MenuCard";
import MenuCardWithCart from "./MenuCardWithCart";

type MenuGridWithCartProps = {
  items: MenuItem[];
  onItemAdded?: (item: MenuItem) => void;
};

export default function MenuGridWithCart({ items, onItemAdded }: MenuGridWithCartProps) {
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
        <MenuCardWithCart key={item.id} item={item} onItemAdded={onItemAdded} />
      ))}
    </Box>
  );
}
