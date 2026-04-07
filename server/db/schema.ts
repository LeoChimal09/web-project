import { double, int, mysqlEnum, mysqlTable, text, tinyint, varchar } from "drizzle-orm/mysql-core";

export const orderStatusValues = [
  "pending",
  "in_progress",
  "ready",
  "completed",
  "cancelled",
] as const;

export const cancellationActorValues = ["admin", "customer"] as const;

export const ordersTable = mysqlTable("orders", {
  ref: varchar("ref", { length: 32 }).primaryKey(),
  customerEmail: varchar("customer_email", { length: 255 }),
  placedAt: varchar("placed_at", { length: 40 }).notNull(),
  status: mysqlEnum("status", orderStatusValues).notNull(),
  etaMinutes: tinyint("eta_minutes", { unsigned: true }),
  cancellationNote: text("cancellation_note"),
  cancelledBy: mysqlEnum("cancelled_by", cancellationActorValues),
  notificationDismissedAt: varchar("notification_dismissed_at", { length: 40 }),
  formJson: text("form_json").notNull(),
  orderEntriesJson: text("order_entries_json").notNull(),
  totalPrice: double("total_price").notNull(),
});

export const customersTable = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: varchar("created_at", { length: 40 }).notNull(),
});
