import { desc, eq, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
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
  return `TBL-${randomBytes(8).toString("hex").toUpperCase()}`;
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
    notificationDismissedAt: row.notificationDismissedAt ?? null,
    form: parseJson<CheckoutForm>(row.formJson),
    orders: parseJson<OrderEntry[]>(row.orderEntriesJson),
    totalPrice: row.totalPrice,
  };
}

export async function getAllOrders() {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.placedAt));
  return rows.map(toPlacedOrder);
}

export async function getOrdersByCustomerEmail(email: string) {
  const rows = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, email.trim().toLowerCase()))
    .orderBy(desc(ordersTable.placedAt));
  return rows.map(toPlacedOrder);
}

export async function getOrdersByRefs(refs: string[]) {
  if (refs.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(ordersTable)
    .where(inArray(ordersTable.ref, refs))
    .orderBy(desc(ordersTable.placedAt));
  return rows.map(toPlacedOrder);
}

export async function getOrder(ref: string) {
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.ref, ref)).limit(1);
  const row = rows.at(0);
  return row ? toPlacedOrder(row) : undefined;
}

export async function getOrderWithCustomerEmail(ref: string) {
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.ref, ref)).limit(1);
  const row = rows.at(0);
  if (!row) {
    return undefined;
  }

  return {
    order: toPlacedOrder(row),
    customerEmail: row.customerEmail?.trim().toLowerCase() ?? null,
  };
}

export async function createOrder(input: CreateOrderInput, options?: { customerEmail?: string | null }) {
  const order: PlacedOrder = {
    ref: generateOrderRef(),
    placedAt: new Date().toISOString(),
    status: "pending",
    etaMinutes: null,
    cancellationNote: null,
    cancelledBy: null,
    notificationDismissedAt: null,
    form: input.form,
    orders: input.orders,
    totalPrice: input.totalPrice,
  };

  await db.insert(ordersTable).values({
    ref: order.ref,
    customerEmail: options?.customerEmail?.trim().toLowerCase() ?? null,
    placedAt: order.placedAt,
    status: order.status,
    etaMinutes: order.etaMinutes,
    cancellationNote: order.cancellationNote,
    cancelledBy: order.cancelledBy,
    notificationDismissedAt: null,
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
      notificationDismissedAt: null, // reset on every status change so banner re-surfaces
    })
    .where(eq(ordersTable.ref, ref));

  return {
    ...existing,
    status,
    etaMinutes: nextEta,
    cancellationNote: nextCancellationNote,
    cancelledBy: nextCancelledBy,
    notificationDismissedAt: null,
  };
}

export async function dismissOrderNotification(ref: string) {
  const existing = await getOrder(ref);
  if (!existing) {
    return undefined;
  }

  const dismissedAt = new Date().toISOString();
  await db
    .update(ordersTable)
    .set({ notificationDismissedAt: dismissedAt })
    .where(eq(ordersTable.ref, ref));

  return { ...existing, notificationDismissedAt: dismissedAt };
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
