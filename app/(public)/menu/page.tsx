"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Link from "next/link";
import { useMemo, useState } from "react";
import CategorySidebar from "@/components/customer/CategorySidebar";
import type { MenuItem } from "@/components/customer/MenuCard";
import MenuGridWithCart from "@/components/customer/MenuGridWithCart";
import type { PendingLine } from "@/features/cart/CartContext";
import { useCart } from "@/features/cart/CartContext";
import { MENU_CATEGORIES, menuItems } from "@/features/menu/menu.data";

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLines, setPendingLines] = useState<PendingLine[]>([]);
  const { placeOrder } = useCart();

  const categories = useMemo(() => ["All", ...MENU_CATEGORIES], []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const lastAddedItem = pendingLines.at(-1)?.item ?? null;

  const drinkSuggestions = useMemo(() => {
    const hasDrinkPending = pendingLines.some((l) => l.item.category === "Drinks");
    if (hasDrinkPending || lastAddedItem?.category === "Drinks") return [];
    return menuItems
      .filter(
        (item) =>
          item.available &&
          item.category === "Drinks" &&
          !pendingLines.some((l) => l.item.id === item.id),
      )
      .slice(0, 3);
  }, [pendingLines, lastAddedItem]);

  const otherSuggestions = useMemo(() => {
    if (!lastAddedItem || lastAddedItem.category === "Appetizers") return [];
    return menuItems
      .filter(
        (item) =>
          item.available &&
          item.category === "Appetizers" &&
          !pendingLines.some((l) => l.item.id === item.id),
      )
      .slice(0, 2);
  }, [pendingLines, lastAddedItem]);

  const pendingSubtotal = pendingLines.reduce((s, l) => s + l.item.price * l.quantity, 0);

  const handleItemAdded = (item: MenuItem) => {
    setPendingLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { item, quantity: 1 }];
    });
    setModalOpen(true);
  };

  const handleAddSuggested = (item: MenuItem) => {
    setPendingLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleChangePendingQty = (itemId: string, delta: number) => {
    setPendingLines((prev) =>
      prev
        .map((l) => (l.item.id === itemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const handleRemovePending = (itemId: string) => {
    setPendingLines((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  const handlePlaceOrder = () => {
    if (pendingLines.length > 0) placeOrder(pendingLines);
    setPendingLines([]);
    setModalOpen(false);
  };

  return (
    <Box sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={3} sx={{ mb: 6 }}>
          <Typography variant="overline" color="secondary.main">
            Our Culinary Collection
          </Typography>
          <Typography variant="h3">Browse Our Menu</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
            Explore our carefully curated selection of dishes, from timeless classics to seasonal
            specials. All items are prepared fresh to order.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ mb: 6 }}>
          <Box sx={{ width: { xs: "100%", md: "280px" }, flexShrink: 0 }}>
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedCategory}
                </Typography>
                <Button variant="outlined" size="small" LinkComponent={Link} href="/reservation">
                  Make a Reservation
                </Button>
              </Stack>
              <MenuGridWithCart items={filteredItems} onItemAdded={handleItemAdded} />
            </Stack>
          </Box>
        </Stack>

        <Dialog open={modalOpen} onClose={handlePlaceOrder} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1 }}>
            {lastAddedItem ? `${lastAddedItem.name} added` : "Building your order"}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                Add a drink or starter below, then confirm to place this order.
              </Typography>

              {/* Current pending lines */}
              {pendingLines.length > 0 && (
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      This order
                    </Typography>
                    <Stack spacing={0.75}>
                      {pendingLines.map((line) => (
                        <Stack key={line.item.id} direction="row" alignItems="center" spacing={1}>
                          <IconButton size="small" onClick={() => handleChangePendingQty(line.item.id, -1)}>
                            <RemoveIcon fontSize="inherit" />
                          </IconButton>
                          <Typography variant="caption" sx={{ minWidth: 14, textAlign: "center" }}>
                            {line.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => handleChangePendingQty(line.item.id, 1)}>
                            <AddIcon fontSize="inherit" />
                          </IconButton>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {line.item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
                            ${(line.item.price * line.quantity).toFixed(2)}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            sx={{ minWidth: 0, px: 0.5, fontSize: "0.7rem" }}
                            onClick={() => handleRemovePending(line.item.id)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      ))}
                      <Divider sx={{ my: 0.5 }} />
                      <Stack direction="row" justifyContent="flex-end">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Order total: ${pendingSubtotal.toFixed(2)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Drink suggestions */}
              {drinkSuggestions.length > 0 && (
                <Card variant="outlined" sx={{ borderColor: "secondary.main" }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Add a drink to your order
                    </Typography>
                    <Stack spacing={0.75}>
                      {drinkSuggestions.map((drink) => (
                        <Stack
                          key={drink.id}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" color="text.secondary">
                            {drink.name} · ${drink.price.toFixed(2)}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddSuggested(drink)}
                          >
                            Add
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Appetizer suggestions */}
              {otherSuggestions.length > 0 && (
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" color="text.secondary">
                    You might also like
                  </Typography>
                  {otherSuggestions.map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent sx={{ py: 1.25 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={2}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category} · ${item.price.toFixed(2)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddSuggested(item)}
                          >
                            Add
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              variant="text"
              onClick={handlePlaceOrder}
              disabled={pendingLines.length === 0}
            >
              Place &amp; Continue Ordering
            </Button>
            <Button
              variant="contained"
              LinkComponent={Link}
              href="/cart"
              onClick={handlePlaceOrder}
              disabled={pendingLines.length === 0}
            >
              Place Order &amp; View Cart
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
