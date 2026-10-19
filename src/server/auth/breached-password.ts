import "server-only";
import { createHash } from "node:crypto";

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const HIBP_TIMEOUT_MS = 3000;

export async function checkBreachedPassword(password: string): Promise<boolean> {
  const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
    headers: { "Add-Padding": "true" },
    signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Pwned Passwords request failed with status ${response.status}`);
  }

  const body = await response.text();

  for (const line of body.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const entrySuffix = line.slice(0, separator).trim().toUpperCase();
    if (entrySuffix !== suffix) {
      continue;
    }

    const count = Number(line.slice(separator + 1).trim());
    return Number.isFinite(count) && count > 0;
  }

  return false;
}
