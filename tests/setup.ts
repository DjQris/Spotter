import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

process.env.STAFF_SESSION_SECRET ??= "test-staff-session-secret";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl) {
  if (testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must point at a disposable database, not DATABASE_URL.");
  }

  process.env.DATABASE_URL = testDatabaseUrl;
}
