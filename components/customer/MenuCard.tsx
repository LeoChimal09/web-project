"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
};

type MenuCardProps = {
  item: MenuItem;
};

export default function MenuCard({ item }: MenuCardProps) {
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
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
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
      </CardContent>
    </Card>
  );
}
