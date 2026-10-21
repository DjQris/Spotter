import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import { buildMemberNumberEmail } from "@/server/email/member-number-email";

describe("buildMemberNumberEmail", () => {
  it("includes the member number in the text and html", () => {
    const email = buildMemberNumberEmail("123456");

    expect(email.subject).toBe(copy.memberNumberEmail.subject);
    expect(email.text).toContain("123456");
    expect(email.html).toContain("123456");
  });

  it("tells the member what the number is for", () => {
    const email = buildMemberNumberEmail("123456");

    expect(email.text).toContain(copy.memberNumberEmail.intro);
    expect(email.html).toContain(copy.memberNumberEmail.intro);
  });
});
