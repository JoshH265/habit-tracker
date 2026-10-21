import { beforeAll } from "vitest";
import { ensureTestDatabase, useTestDatabase } from "./db";

beforeAll(async () => {
  useTestDatabase();
  await ensureTestDatabase();
});
