import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkBreachedPassword } from "@/server/auth/breached-password";

function sha1(value: string): string {
  return createHash("sha1").update(value).digest("hex").toUpperCase();
}

function mockRangeResponse(lines: string[], status = 200) {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response(lines.join("\r\n"), { status });
  });

  vi.stubGlobal("fetch", fetchMock);

  return { fetchMock, calls };
}

describe("checkBreachedPassword", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends only the five character hash prefix", async () => {
    const { fetchMock, calls } = mockRangeResponse([]);

    await checkBreachedPassword("spotter123");

    const digest = sha1("spotter123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(calls[0].input)).toBe(
      `https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`
    );
    expect(String(calls[0].input)).not.toContain(digest.slice(5));

    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["Add-Padding"]).toBe("true");
  });

  it("returns true when the suffix is listed with a count", async () => {
    const suffix = sha1("spotter123").slice(5);
    mockRangeResponse([`${suffix}:42`, "0000000000000000000000000000000000:7"]);

    await expect(checkBreachedPassword("spotter123")).resolves.toBe(true);
  });

  it("returns false when the suffix is not listed", async () => {
    mockRangeResponse(["0000000000000000000000000000000000:7"]);

    await expect(checkBreachedPassword("spotter123")).resolves.toBe(false);
  });

  it("treats a zero count as not breached", async () => {
    const suffix = sha1("spotter123").slice(5);
    mockRangeResponse([`${suffix}:0`]);

    await expect(checkBreachedPassword("spotter123")).resolves.toBe(false);
  });

  it("throws when the service rejects the request", async () => {
    mockRangeResponse([], 503);

    await expect(checkBreachedPassword("spotter123")).rejects.toThrow("503");
  });
});
