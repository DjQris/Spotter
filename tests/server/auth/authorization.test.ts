import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";
import { staffCan } from "@/server/auth/authorization";

describe("staffCan", () => {
  it("denies when there is no session", () => {
    expect(
      staffCan(null, PERMISSIONS.STAFF_DASHBOARD_ACCESS)
    ).toBe(false);
  });

  it("allows a permission held by the session", () => {
    expect(
      staffCan(
        { permissions: [PERMISSIONS.MEMBER_NUMBER_RESERVE] },
        PERMISSIONS.MEMBER_NUMBER_RESERVE
      )
    ).toBe(true);
  });

  it("denies a permission the session does not hold", () => {
    expect(
      staffCan(
        { permissions: [PERMISSIONS.MEMBER_NUMBER_RESERVE] },
        PERMISSIONS.STAFF_DASHBOARD_ACCESS
      )
    ).toBe(false);
  });
});
