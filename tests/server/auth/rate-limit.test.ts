import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, isIpBlocked, recordIpFailure } from "@/server/auth/rate-limit";

describe("clientIp", () => {
  it("reads the first forwarded address", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.20, 70.41.3.18" },
    });

    expect(clientIp(request)).toBe("203.0.113.20");
  });

  it("returns undefined when the header is missing", () => {
    const request = new Request("http://localhost/api/auth/login");
    expect(clientIp(request)).toBeUndefined();
  });
});

describe("ip rate limiting", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not block an ip below the limit", () => {
    const ip = "203.0.113.10";

    for (let i = 0; i < 4; i += 1) {
      recordIpFailure(ip);
    }

    expect(isIpBlocked(ip)).toBe(false);
  });

  it("blocks an ip after five failures within the window", () => {
    const ip = "203.0.113.11";

    for (let i = 0; i < 5; i += 1) {
      recordIpFailure(ip);
    }

    expect(isIpBlocked(ip)).toBe(true);
  });

  it("keeps ip counters separate", () => {
    const blocked = "203.0.113.12";
    const other = "203.0.113.13";

    for (let i = 0; i < 5; i += 1) {
      recordIpFailure(blocked);
    }

    expect(isIpBlocked(blocked)).toBe(true);
    expect(isIpBlocked(other)).toBe(false);
  });

  it("forgets failures once the window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T09:00:00Z"));

    const ip = "203.0.113.14";

    for (let i = 0; i < 4; i += 1) {
      recordIpFailure(ip);
    }

    vi.setSystemTime(new Date("2026-10-13T10:01:00Z"));
    recordIpFailure(ip);

    expect(isIpBlocked(ip)).toBe(false);
  });

  it("unblocks an ip after the block expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T09:00:00Z"));

    const ip = "203.0.113.15";

    for (let i = 0; i < 5; i += 1) {
      recordIpFailure(ip);
    }

    expect(isIpBlocked(ip)).toBe(true);

    vi.setSystemTime(new Date("2026-10-13T10:00:01Z"));

    expect(isIpBlocked(ip)).toBe(false);
  });
});
