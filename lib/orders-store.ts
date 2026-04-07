import type { CreateOrderInput, OrderEtaMinutes, OrderStatus, PlacedOrder } from "@/features/checkout/checkout.types";
import { canRemoveOrderFromHistory, canTransitionOrderStatus } from "@/features/checkout/order-status";

declare global {
  var __tablestoryOrdersStore: Map<string, PlacedOrder> | undefined;
}

const orderStore = globalThis.__tablestoryOrdersStore ?? new Map<string, PlacedOrder>();

if (!globalThis.__tablestoryOrdersStore) {
  globalThis.__tablestoryOrdersStore = orderStore;
}

function generateOrderRef() {
  return `TBL-${Date.now().toString(36).toUpperCase()}`;
}

function sortByPlacedAtDesc(left: PlacedOrder, right: PlacedOrder) {
  return new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime();
}

export function getAllOrders() {
  return Array.from(orderStore.values()).sort(sortByPlacedAtDesc);
}

export function getOrder(ref: string) {
  return orderStore.get(ref);
}

export function createOrder(input: CreateOrderInput) {
  const order: PlacedOrder = {
    ref: generateOrderRef(),
    placedAt: new Date().toISOString(),
    status: "pending",
    etaMinutes: null,
    form: input.form,
    orders: input.orders,
    totalPrice: input.totalPrice,
  };

  orderStore.set(order.ref, order);
  return order;
}

export function updateOrderStatus(ref: string, status: OrderStatus, options?: { etaMinutes?: OrderEtaMinutes | null }) {
  const existing = orderStore.get(ref);
  if (!existing) {
    return undefined;
  }

  if (!canTransitionOrderStatus(existing.status, status)) {
    return null;
  }

  const nextEta =
    status === "in_progress"
      ? (options?.etaMinutes ?? existing.etaMinutes ?? null)
      : existing.etaMinutes ?? null;

  const updated: PlacedOrder = { ...existing, status, etaMinutes: nextEta };
  orderStore.set(ref, updated);
  return updated;
}

export function deleteOrder(ref: string) {
  const existing = orderStore.get(ref);
  if (!existing) {
    return undefined;
  }

  if (!canRemoveOrderFromHistory(existing.status)) {
    return null;
  }

  orderStore.delete(ref);
  return true;
}