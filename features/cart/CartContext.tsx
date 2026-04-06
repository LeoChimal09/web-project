"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { MenuItem } from "@/components/customer/MenuCard";
import type { Cart, CartItem, OrderEntry } from "./cart.types";

export type PendingLine = { item: MenuItem; quantity: number };

type CartContextType = {
  cart: Cart;
  placeOrder: (lines: PendingLine[]) => void;
  removeOrder: (orderId: string) => void;
  updateOrderLine: (orderId: string, itemId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderEntry[]>([]);

  const placeOrder = useCallback((lines: PendingLine[]) => {
    const cartItems: CartItem[] = lines.map(({ item, quantity }) => ({
      ...item,
      cartQuantity: quantity,
    }));
    const total = cartItems.reduce((sum, i) => sum + i.price * i.cartQuantity, 0);
    const orderId = Date.now().toString();
    setOrders((prev) => [...prev, { orderId, lines: cartItems, total }]);
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
  }, []);

  const updateOrderLine = useCallback((orderId: string, itemId: string, quantity: number) => {
    setOrders((prev) =>
      prev
        .map((order) => {
          if (order.orderId !== orderId) return order;
          const lines =
            quantity <= 0
              ? order.lines.filter((l) => l.id !== itemId)
              : order.lines.map((l) =>
                  l.id === itemId ? { ...l, cartQuantity: quantity } : l
                );
          const total = lines.reduce((sum, l) => sum + l.price * l.cartQuantity, 0);
          return { ...order, lines, total };
        })
        .filter((o) => o.lines.length > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setOrders([]);
  }, []);

  const cart = useMemo<Cart>(() => {
    const totalPrice = orders.reduce((sum, o) => sum + o.total, 0);
    return { orders, totalOrders: orders.length, totalPrice };
  }, [orders]);

  return (
    <CartContext.Provider value={{ cart, placeOrder, removeOrder, updateOrderLine, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
