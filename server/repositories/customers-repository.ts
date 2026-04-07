import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { customersTable } from "@/server/db/schema";

export async function getCustomerByEmail(email: string) {
  const rows = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, email.trim().toLowerCase()));
  return rows[0] ?? null;
}

export async function createCustomer(email: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await db.insert(customersTable).values({
    email: normalizedEmail,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  });
  return getCustomerByEmail(normalizedEmail);
}
