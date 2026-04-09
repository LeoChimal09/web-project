import type { OrderEntry } from "@/features/cart/cart.types";

export function calculateOrderSubtotal(orders: OrderEntry[]) {
  return orders.reduce(
    (subtotal, order) =>
      subtotal + order.lines.reduce((lineTotal, line) => lineTotal + line.price * line.cartQuantity, 0),
    0,
  );
}

export function calculateTax(subtotal: number, taxRate = 0.08) {
  return subtotal * taxRate;
}

export function toCents(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100);
}
