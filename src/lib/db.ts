import "server-only";
import "dotenv/config";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __habitPool?: Pool };

export function getPool(): Pool {
  const existing = globalForDb.__habitPool;
  if (existing) return existing;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env file (see README.md) or pass it via the environment."
    );
  }

  const pool = new Pool({ connectionString, max: 10 });
  globalForDb.__habitPool = pool;
  return pool;
}