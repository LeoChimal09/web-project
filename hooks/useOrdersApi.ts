"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreateOrderInput, OrderStatus, PlacedOrder } from "@/features/checkout/checkout.types";

type UseOrdersApiOptions = {
  ref?: string | null;
  enabled?: boolean;
};

type ApiError = {
  error?: string;
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  const payload = (await response.json().catch(() => null)) as ApiError | null;
  throw new Error(payload?.error ?? "Request failed.");
}

export function useOrdersApi(options: UseOrdersApiOptions = {}) {
  const { ref, enabled = true } = options;
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (ref) {
        const nextOrder = await fetch(`/api/orders/${ref}`, { cache: "no-store" }).then(parseApiResponse<PlacedOrder>);
        setOrder(nextOrder);
        setOrders([]);
      } else {
        const nextOrders = await fetch("/api/orders", { cache: "no-store" }).then(parseApiResponse<PlacedOrder[]>);
        setOrders(nextOrders);
        setOrder(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load orders.");
      setOrder(null);
      if (!ref) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, ref]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    const createdOrder = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(parseApiResponse<PlacedOrder>);

    setOrders((prev) => [createdOrder, ...prev]);
    setOrder((prev) => (prev?.ref === createdOrder.ref ? createdOrder : prev));
    return createdOrder;
  }, []);

  const updateOrder = useCallback((nextOrder: PlacedOrder) => {
    setOrder((prev) => (prev?.ref === nextOrder.ref ? nextOrder : prev));
    setOrders((prev) => prev.map((entry) => (entry.ref === nextOrder.ref ? nextOrder : entry)));
    return nextOrder;
  }, []);

  const updateOrderStatus = useCallback(async (orderRef: string, status: OrderStatus) => {
    const updatedOrder = await fetch(`/api/orders/${orderRef}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(parseApiResponse<PlacedOrder>);

    return updateOrder(updatedOrder);
  }, [updateOrder]);

  const deleteOrder = useCallback(async (orderRef: string) => {
    await fetch(`/api/orders/${orderRef}`, {
      method: "DELETE",
    }).then(parseApiResponse<void>);

    setOrder((prev) => (prev?.ref === orderRef ? null : prev));
    setOrders((prev) => prev.filter((entry) => entry.ref !== orderRef));
  }, []);

  return {
    orders,
    order,
    loading,
    error,
    refetch,
    createOrder,
    updateOrderStatus,
    deleteOrder,
  };
}