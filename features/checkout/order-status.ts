import type { OrderEtaMinutes, OrderStatus } from "./checkout.types";

export const ORDER_ETA_OPTIONS: OrderEtaMinutes[] = [15, 30, 45, 60];

export function isValidOrderEtaMinutes(value: unknown): value is OrderEtaMinutes {
  return typeof value === "number" && ORDER_ETA_OPTIONS.includes(value as OrderEtaMinutes);
}

export function formatOrderEtaMinutes(value: OrderEtaMinutes) {
  return value === 60 ? "60+ minutes" : `${value} minutes`;
}

export function isActiveOrderStatus(status: OrderStatus, cancelledBy?: "admin" | "customer" | null) {
  return status === "in_progress" || status === "ready" || (status === "cancelled" && cancelledBy === "admin");
}

export function getOrderProgressMessage(
  status: OrderStatus,
  etaMinutes?: OrderEtaMinutes | null,
  cancellationNote?: string | null,
) {
  if (status === "pending") {
    return "Order received. We are about to start preparing it.";
  }

  if (status === "in_progress") {
    if (etaMinutes) {
      return `Your order is in progress. Estimated time: ${formatOrderEtaMinutes(etaMinutes)}.`;
    }

    return "Your order is in progress in the kitchen.";
  }

  if (status === "ready") {
    return "Your order is ready for pickup or delivery.";
  }

  if (status === "completed") {
    return "This order is completed.";
  }

  if (cancellationNote?.trim()) {
    return `This order was cancelled. Note from restaurant: ${cancellationNote.trim()}`;
  }

  return "This order has been cancelled.";
}

export function canTransitionOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return false;
  }

  if (nextStatus === "cancelled") {
    return currentStatus === "pending";
  }

  if (currentStatus === "pending") {
    return nextStatus === "in_progress";
  }

  if (currentStatus === "in_progress") {
    return nextStatus === "ready";
  }

  if (currentStatus === "ready") {
    return nextStatus === "completed";
  }

  return false;
}

export function canRemoveOrderFromHistory(status: OrderStatus) {
  return status === "completed" || status === "cancelled";
}