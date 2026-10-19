import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { getMemberSessionFromRequest } from "@/server/auth/session";

function requestWithCookie(value: string) {
  return new NextRequest("http://localhost/", {
    headers: { cookie: `spotter_session=${value}` },
  });
}

describe("getMemberSessionFromRequest", () => {
  it("returns null when the cookie is absent", async () => {
    const request = new NextRequest("http://localhost/");

    await expect(getMemberSessionFromRequest(request)).resolves.toBeNull();
  });

  it("returns null when the signature does not match", async () => {
    const request = requestWithCookie("stolen-token.forged-signature");

    await expect(getMemberSessionFromRequest(request)).resolves.toBeNull();
  });
});
