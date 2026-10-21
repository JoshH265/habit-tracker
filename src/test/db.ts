import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";

const TEST_DB_NAME = "habit_tracker_test";

function baseUrl(): string {
  if (!process.env.DATABASE_URL) {
    try {
      process.loadEnvFile(path.join(process.cwd(), ".env"));
    } catch {
      // No .env file: fall back to the environment.
    }
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env or export it before running tests."
    );
  }
  return url;
}

export function testDatabaseUrl(): string {
  const url = new URL(baseUrl());
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

/**
 * Points the app's connection pool at the throwaway test database.
 * Must run before any query module creates its pool.
 */
export function useTestDatabase(): void {
  process.env.DATABASE_URL = testDatabaseUrl();
}

/** Drops and recreates the test database, then applies the schema + seed. */
export async function ensureTestDatabase(): Promise<void> {
  const adminUrl = new URL(baseUrl());
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  await admin.end();

  const schema = readFileSync(
    path.join(process.cwd(), "docker/init.sql"),
    "utf8"
  );
  const pool = new Pool({ connectionString: testDatabaseUrl() });
  try {
    await pool.query(schema);
  } finally {
    await pool.end();
  }
}

/** Clears logged entries between tests. Seeded habits are left in place. */
export async function resetTestDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: testDatabaseUrl() });
  try {
    await pool.query("TRUNCATE TABLE entries");
  } finally {
    await pool.end();
  }
}
