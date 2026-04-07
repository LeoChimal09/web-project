import { desc, eq } from "drizzle-orm";
import type {
  CancellationActor,
  CheckoutForm,
  CreateOrderInput,
  OrderEtaMinutes,
  OrderStatus,
  PlacedOrder,
} from "@/features/checkout/checkout.types";
import { canRemoveOrderFromHistory, canTransitionOrderStatus } from "@/features/checkout/order-status";
import type { OrderEntry } from "@/features/cart/cart.types";
import { db } from "@/server/db/client";
import { ordersTable } from "@/server/db/schema";

type DbOrderRow = typeof ordersTable.$inferSelect;

function generateOrderRef() {
  return `TBL-${Date.now().toString(36).toUpperCase()}`;
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function toPlacedOrder(row: DbOrderRow): PlacedOrder {
  return {
    ref: row.ref,
    placedAt: row.placedAt,
    status: row.status as OrderStatus,
    etaMinutes: (row.etaMinutes as OrderEtaMinutes | null) ?? null,
    cancellationNote: row.cancellationNote,
    cancelledBy: row.cancelledBy as CancellationActor | null,
    form: parseJson<CheckoutForm>(row.formJson),
    orders: parseJson<OrderEntry[]>(row.orderEntriesJson),
    totalPrice: row.totalPrice,
  };
}

export async function getAllOrders() {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.placedAt));
  return rows.map(toPlacedOrder);
}

export async function getOrder(ref: string) {
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.ref, ref)).limit(1);
  const row = rows.at(0);
  return row ? toPlacedOrder(row) : undefined;
}

export async function createOrder(input: CreateOrderInput) {
  const order: PlacedOrder = {
    ref: generateOrderRef(),
    placedAt: new Date().toISOString(),
    status: "pending",
    etaMinutes: null,
    cancellationNote: null,
    cancelledBy: null,
    form: input.form,
    orders: input.orders,
    totalPrice: input.totalPrice,
  };

  await db.insert(ordersTable).values({
    ref: order.ref,
    placedAt: order.placedAt,
    status: order.status,
    etaMinutes: order.etaMinutes,
    cancellationNote: order.cancellationNote,
    cancelledBy: order.cancelledBy,
    formJson: JSON.stringify(order.form),
    orderEntriesJson: JSON.stringify(order.orders),
    totalPrice: order.totalPrice,
  });

  return order;
}

export async function updateOrderStatus(
  ref: string,
  status: OrderStatus,
  options?: {
    etaMinutes?: OrderEtaMinutes | null;
    cancellationNote?: string | null;
    cancelledBy?: CancellationActor | null;
  },
) {
  const existing = await getOrder(ref);
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
  const nextCancellationNote = status === "cancelled" ? (options?.cancellationNote ?? null) : null;
  const nextCancelledBy = status === "cancelled" ? (options?.cancelledBy ?? "customer") : null;

  await db
    .update(ordersTable)
    .set({
      status,
      etaMinutes: nextEta,
      cancellationNote: nextCancellationNote,
      cancelledBy: nextCancelledBy,
    })
    .where(eq(ordersTable.ref, ref));

  return {
    ...existing,
    status,
    etaMinutes: nextEta,
    cancellationNote: nextCancellationNote,
    cancelledBy: nextCancelledBy,
  };
}

export async function deleteOrder(ref: string) {
  const existing = await getOrder(ref);
  if (!existing) {
    return undefined;
  }

  if (!canRemoveOrderFromHistory(existing.status)) {
    return null;
  }

  await db.delete(ordersTable).where(eq(ordersTable.ref, ref));
  return true;
}
