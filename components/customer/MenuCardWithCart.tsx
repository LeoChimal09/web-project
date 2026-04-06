"use client";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { MenuItem } from "./MenuCard";

type MenuCardWithCartProps = {
  item: MenuItem;
  onItemAdded?: (item: MenuItem) => void;
};

export default function MenuCardWithCart({ item, onItemAdded }: MenuCardWithCartProps) {
  const handleAddToCart = () => {
    onItemAdded?.(item);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: item.available ? 1 : 0.6,
      }}
    >
      <Box
        sx={{
          height: 180,
          background:
            "linear-gradient(135deg, rgba(143,45,31,0.1) 0%, rgba(42,95,77,0.1) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
        }}
      >
        🍽️
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ flex: 1 }}>
              {item.name}
            </Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
              ${item.price.toFixed(2)}
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Chip label={item.category} size="small" variant="outlined" color="primary" />
            {!item.available && <Chip label="Out of Stock" size="small" color="error" />}
          </Stack>
        </Stack>

        {item.available && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAddToCart}
              sx={{ flex: 1 }}
            >
              Add to Order
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
