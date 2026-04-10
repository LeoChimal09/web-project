import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

declare global {
  var __tablestoryMysqlPool: mysql.Pool | undefined;
}

function getConnectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required to use the orders database.");
  }

  return value;
}

function getPool() {
  if (!globalThis.__tablestoryMysqlPool) {
    globalThis.__tablestoryMysqlPool = mysql.createPool({
      uri: getConnectionString(),
      connectionLimit: 10,
      ssl: { rejectUnauthorized: false },
    });
  }

  return globalThis.__tablestoryMysqlPool;
}

export const db = drizzle(getPool());
