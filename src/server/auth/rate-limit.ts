import "server-only";

const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_FAILURE_LIMIT = 5;
const IP_BLOCK_MS = 60 * 60 * 1000;

interface IpFailureRecord {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

const ipFailures = new Map<string, IpFailureRecord>();

export function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

export function isIpBlocked(ip: string): boolean {
  const entry = ipFailures.get(ip);
  if (!entry) {
    return false;
  }

  const now = Date.now();

  if (entry.blockedUntil > now) {
    return true;
  }

  if (now - entry.windowStart > IP_WINDOW_MS) {
    ipFailures.delete(ip);
  }

  return false;
}

export function recordIpFailure(ip: string): void {
  const now = Date.now();
  const entry = ipFailures.get(ip);

  if (!entry || now - entry.windowStart > IP_WINDOW_MS) {
    ipFailures.set(ip, { count: 1, windowStart: now, blockedUntil: 0 });
    return;
  }

  entry.count += 1;

  if (entry.count >= IP_FAILURE_LIMIT) {
    entry.blockedUntil = now + IP_BLOCK_MS;
  }
}
