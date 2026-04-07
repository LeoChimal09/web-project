"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import Link from "next/link";
import { useCart } from "@/features/cart/CartContext";

export default function CartPage() {
  const { cart, removeOrder, updateOrderLine, clearCart } = useCart();

  if (cart.orders.length === 0) {
    return (
      <Box
        sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
          <Stack spacing={3} sx={{ textAlign: "center" }}>
            <Typography variant="h3">Your Orders</Typography>
            <Typography color="text.secondary">No orders placed yet</Typography>
            <Button
              variant="contained"
              LinkComponent={Link}
              href="/menu"
              sx={{ width: "fit-content", mx: "auto" }}
            >
              Start an Order
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{ background: "linear-gradient(180deg, rgba(247,241,232,1) 0%, rgba(143,45,31,0.04) 100%)" }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h3">Your Orders</Typography>
            <Typography color="text.secondary">
              {cart.totalOrders} order{cart.totalOrders > 1 ? "s" : ""}
            </Typography>
          </Stack>

          {cart.orders.map((order, index) => (
            <Card key={order.orderId} variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`Order ${index + 1}`} size="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {order.lines.length} item{order.lines.length > 1 ? "s" : ""}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ${order.total.toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeOrder(order.orderId)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack spacing={0.75}>
                  {order.lines.map((line, lineIndex) => (
                    <Stack key={line.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateOrderLine(order.orderId, line.id, line.cartQuantity - 1)
                          }
                        >
                          <RemoveIcon fontSize="inherit" />
                        </IconButton>
                        <Typography variant="caption" sx={{ minWidth: 14, textAlign: "center" }}>
                          {line.cartQuantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateOrderLine(order.orderId, line.id, line.cartQuantity + 1)
                          }
                        >
                          <AddIcon fontSize="inherit" />
                        </IconButton>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {line.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                          {line.category}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${(line.price * line.cartQuantity).toFixed(2)}
                        </Typography>
                      </Stack>
                      {lineIndex < order.lines.length - 1 && <Divider sx={{ mt: 0.75, ml: 10 }} />}
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}

          {/* Order summary */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body1">${cart.totalPrice.toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Est. tax (8%)
                  </Typography>
                  <Typography variant="body1">${(cart.totalPrice * 0.08).toFixed(2)}</Typography>
                </Stack>
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                      ${(cart.totalPrice * 1.08).toFixed(2)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="outlined" LinkComponent={Link} href="/menu" sx={{ flex: 1 }}>
              Add Another Order
            </Button>
            <Button variant="outlined" color="error" onClick={clearCart} sx={{ flex: 1 }}>
              Clear All Orders
            </Button>
            <Button variant="contained" size="large" LinkComponent={Link} href="/checkout" sx={{ flex: 1 }}>
              Proceed to Checkout
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
