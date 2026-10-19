import "server-only";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See rules/env.md and .env.example.`
    );
  }

  return value;
}

function optional(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function optionalPort(name: string, value: string | undefined): number | undefined {
  const raw = optional(value);
  if (raw === undefined) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `Invalid environment variable ${name}: must be a port number. See rules/env.md.`
    );
  }

  return parsed;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL", process.env.DATABASE_URL),
  DIRECT_URL: optional(process.env.DIRECT_URL),

  GEMINI_API_KEY: optional(process.env.GEMINI_API_KEY),

  FLUTTERWAVE_SECRET_KEY: optional(process.env.FLUTTERWAVE_SECRET_KEY),
  FLUTTERWAVE_PUBLIC_KEY: optional(process.env.FLUTTERWAVE_PUBLIC_KEY),
  FLUTTERWAVE_WEBHOOK_HASH: optional(process.env.FLUTTERWAVE_WEBHOOK_HASH),

  SESSION_SECRET: required("SESSION_SECRET", process.env.SESSION_SECRET),
  STAFF_SESSION_SECRET: optional(process.env.STAFF_SESSION_SECRET),
  APP_URL: optional(process.env.APP_URL),
  CRON_SECRET: optional(process.env.CRON_SECRET),

  CHECKIN_SIMULATED: process.env.CHECKIN_SIMULATED === "true",
  CHECKIN_VERIFY_SECRET: optional(process.env.CHECKIN_VERIFY_SECRET),

  SMTP_HOST: optional(process.env.SMTP_HOST),
  SMTP_PORT: optionalPort("SMTP_PORT", process.env.SMTP_PORT),
  SMTP_USER: optional(process.env.SMTP_USER),
  SMTP_PASS: optional(process.env.SMTP_PASS),
  SMTP_FROM: optional(process.env.SMTP_FROM),

  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
