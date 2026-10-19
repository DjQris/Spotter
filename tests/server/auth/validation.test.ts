import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import {
  loginErrorMessage,
  loginSchema,
  resetPasswordErrorMessage,
  resetPasswordSchema,
  signUpErrorMessage,
  signUpSchema,
  verifyEmailSchema,
} from "@/server/auth/validation";

const validSignUp = {
  name: "Chioma Adeyemi",
  email: "chioma@example.com",
  memberNumber: "100001",
  password: "new-password-123",
  acceptedPrivacy: true,
};

describe("signUpSchema", () => {
  it("trims and lowercases the email", () => {
    const parsed = signUpSchema.safeParse({
      ...validSignUp,
      email: "  Chioma@Example.COM ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("chioma@example.com");
    }
  });

  it("strips unknown fields", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, role: "owner" });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("role");
    }
  });

  it("maps a short name to the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, name: "A" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.validation.nameMinLength);
    }
  });

  it("maps an invalid email to the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, email: "chioma@" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.validation.emailInvalid);
    }
  });

  it("maps a bad member number to the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, memberNumber: "12345" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.validation.memberNumberInvalid);
    }
  });

  it("maps a short password to the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, password: "short" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.signup.passwordMinLength);
    }
  });

  it("maps a missing privacy acceptance to the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, acceptedPrivacy: false });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.validation.acceptTermsRequired);
    }
  });
});

describe("loginSchema", () => {
  it("trims and lowercases the email", () => {
    const parsed = loginSchema.safeParse({
      email: " Member@Example.com ",
      password: "secret",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("member@example.com");
    }
  });

  it("rejects a missing password and keeps the generic message", () => {
    const parsed = loginSchema.safeParse({ email: "member@example.com" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(loginErrorMessage()).toBe(copy.login.failed);
    }
  });
});

describe("resetPasswordSchema", () => {
  it("accepts an empty email for the session based flow", () => {
    const parsed = resetPasswordSchema.safeParse({
      email: "",
      tempPassword: "temp-password",
      newPassword: "new-password-123",
    });

    expect(parsed.success).toBe(true);
  });

  it("maps a short new password to the copy string", () => {
    const parsed = resetPasswordSchema.safeParse({
      email: "member@example.com",
      tempPassword: "temp-password",
      newPassword: "short",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(resetPasswordErrorMessage(parsed.error)).toBe(copy.signup.passwordMinLength);
    }
  });

  it("maps a missing temporary password to the generic message", () => {
    const parsed = resetPasswordSchema.safeParse({
      email: "member@example.com",
      newPassword: "new-password-123",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(resetPasswordErrorMessage(parsed.error)).toBe(copy.login.failed);
    }
  });
});

describe("password trimming", () => {
  it("trims the sign up password before it reaches the service", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, password: "  new-password-123  " });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.password).toBe("new-password-123");
    }
  });

  it("keeps spaces inside a password", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, password: "new pass 123" });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.password).toBe("new pass 123");
    }
  });

  it("rejects a whitespace-only password with the copy string", () => {
    const parsed = signUpSchema.safeParse({ ...validSignUp, password: "        " });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(signUpErrorMessage(parsed.error)).toBe(copy.signup.passwordMinLength);
    }
  });

  it("trims the login password", () => {
    const parsed = loginSchema.safeParse({
      email: "member@example.com",
      password: " secret ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.password).toBe("secret");
    }
  });

  it("trims the temporary and new passwords on reset", () => {
    const parsed = resetPasswordSchema.safeParse({
      email: "member@example.com",
      tempPassword: " temp-password ",
      newPassword: " new-password-123 ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tempPassword).toBe("temp-password");
      expect(parsed.data.newPassword).toBe("new-password-123");
    }
  });
});

describe("verifyEmailSchema", () => {
  it("accepts six digits", () => {
    const parsed = verifyEmailSchema.safeParse({ code: "123456" });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("123456");
    }
  });

  it("rejects anything that is not six digits", () => {
    expect(verifyEmailSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ code: "12a456" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({}).success).toBe(false);
  });
});
