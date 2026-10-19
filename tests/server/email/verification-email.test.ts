import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import { buildVerificationEmail } from "@/server/email/verification-email";

describe("buildVerificationEmail", () => {
  it("includes the code in the text and html", () => {
    const email = buildVerificationEmail("Chioma Adeyemi", "123456");

    expect(email.subject).toBe(copy.verificationEmail.subject);
    expect(email.text).toContain("123456");
    expect(email.html).toContain("123456");
  });

  it("states the expiry window", () => {
    const email = buildVerificationEmail("Chioma Adeyemi", "123456");

    expect(email.text).toContain(copy.verificationEmail.expiry);
    expect(email.html).toContain(copy.verificationEmail.expiry);
  });

  it("escapes the member name in the html", () => {
    const email = buildVerificationEmail("<script>alert(1)</script>", "123456");

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
