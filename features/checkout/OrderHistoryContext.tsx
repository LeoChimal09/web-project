"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { OrderStatus, PlacedOrder } from "./checkout.types";

const STORAGE_KEY = "tablestory_order_history";

type OrderHistoryContextType = {
  orders: PlacedOrder[];
  addOrder: (order: PlacedOrder) => void;
  getOrder: (ref: string) => PlacedOrder | undefined;
  updateStatus: (ref: string, status: OrderStatus) => void;
  cancelOrder: (ref: string) => boolean;
  removeFromHistory: (ref: string) => void;
};

const OrderHistoryContext = createContext<OrderHistoryContextType | undefined>(undefined);

export function OrderHistoryProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<PlacedOrder[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  const addOrder = useCallback((order: PlacedOrder) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getOrder = useCallback(
    (ref: string) => orders.find((o) => o.ref === ref),
    [orders],
  );

  const updateStatus = useCallback((ref: string, status: OrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.ref === ref ? { ...o, status } : o));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const cancelOrder = useCallback((ref: string) => {
    let cancelled = false;
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.ref === ref && o.status === "pending") {
          cancelled = true;
          return { ...o, status: "cancelled" as const };
        }
        return o;
      });
      if (cancelled) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return cancelled;
  }, []);

  const removeFromHistory = useCallback((ref: string) => {
    setOrders((prev) => {
      const next = prev.filter((order) => order.ref !== ref);
      if (next.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }, []);

  return (
    <OrderHistoryContext.Provider
      value={{ orders, addOrder, getOrder, updateStatus, cancelOrder, removeFromHistory }}
    >
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error("useOrderHistory must be used inside OrderHistoryProvider");
  return ctx;
}
