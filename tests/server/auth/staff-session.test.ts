import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  getMemberSessionFromRequest,
  getStaffSessionFromRequest,
} from "@/server/auth/session";

function staffRequestWithCookie(value: string) {
  return new NextRequest("http://localhost/staff", {
    headers: { cookie: `spotter_staff_session=${value}` },
  });
}

describe("getStaffSessionFromRequest", () => {
  it("returns null when the staff cookie is absent", async () => {
    const request = new NextRequest("http://localhost/staff");

    await expect(getStaffSessionFromRequest(request)).resolves.toBeNull();
  });

  it("returns null when the staff cookie signature does not match", async () => {
    const request = staffRequestWithCookie("stolen-token.forged-signature");

    await expect(getStaffSessionFromRequest(request)).resolves.toBeNull();
  });

  it("does not accept a member session cookie as a staff session", async () => {
    const request = new NextRequest("http://localhost/staff", {
      headers: { cookie: "spotter_session=member-token.forged-signature" },
    });

    await expect(getStaffSessionFromRequest(request)).resolves.toBeNull();
  });

  it("does not accept a staff session cookie as a member session", async () => {
    const request = staffRequestWithCookie("stolen-token.forged-signature");

    await expect(getMemberSessionFromRequest(request)).resolves.toBeNull();
  });
});
