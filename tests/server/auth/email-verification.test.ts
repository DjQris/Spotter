import { verify } from "@node-rs/argon2";
import { beforeEach, describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import { prisma } from "@/server/db";
import {
  ensureEmailVerificationCode,
  generateVerificationCode,
  storeEmailVerificationCode,
  storeEmailVerificationCodeIfUnset,
  verifyEmailCode,
} from "@/server/auth/email-verification";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

async function createMember() {
  const gym = await prisma.gym.create({
    data: {
      name: "Test Gym",
      timezone: "Africa/Lagos",
      openingTime: "06:00",
      closingTime: "22:00",
      graceDays: 7,
    },
  });

  return prisma.member.create({
    data: {
      gymId: gym.id,
      name: "Test Member",
      memberNumber: "200001",
      expiryDate: new Date("2027-01-01"),
      email: "verify@example.com",
      accountCreatedAt: new Date("2026-01-01"),
    },
  });
}

describe("generateVerificationCode", () => {
  it("returns six digits", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe.skipIf(!hasTestDatabase)("email verification", () => {
  beforeEach(async () => {
    await prisma.memberSession.deleteMany();
    await prisma.member.deleteMany();
    await prisma.gym.deleteMany();
  });

  it("does not replace a code that is already stored", async () => {
    const member = await createMember();
    const first = generateVerificationCode();
    const second = generateVerificationCode();

    await storeEmailVerificationCode(member.id, first);
    const stored = await storeEmailVerificationCodeIfUnset(member.id, second);

    expect(stored).toBe(false);

    const row = await prisma.member.findUnique({ where: { id: member.id } });
    expect(row?.emailVerificationCodeHash).not.toBeNull();
    await expect(verify(row?.emailVerificationCodeHash as string, first)).resolves.toBe(true);
    await expect(verify(row?.emailVerificationCodeHash as string, second)).resolves.toBe(false);
  });

  it("stores a code when none is stored", async () => {
    const member = await createMember();
    const code = generateVerificationCode();

    const stored = await storeEmailVerificationCodeIfUnset(member.id, code);

    expect(stored).toBe(true);
    await expect(verifyEmailCode(member.id, code)).resolves.toMatchObject({ success: true });
  });

  it("returns success when a consumed code is retried", async () => {
    const member = await createMember();
    const code = generateVerificationCode();

    await storeEmailVerificationCode(member.id, code);

    await expect(verifyEmailCode(member.id, code)).resolves.toMatchObject({ success: true });
    await expect(verifyEmailCode(member.id, code)).resolves.toMatchObject({ success: true });

    const row = await prisma.member.findUnique({ where: { id: member.id } });
    expect(row?.emailVerifiedAt).not.toBeNull();
    expect(row?.emailVerificationCodeHash).toBeNull();
  });

  it("rejects a wrong code and leaves the email unverified", async () => {
    const member = await createMember();
    const stored = generateVerificationCode();
    const wrong = stored === "000000" ? "000001" : "000000";

    await storeEmailVerificationCode(member.id, stored);

    const result = await verifyEmailCode(member.id, wrong);

    expect(result.success).toBe(false);
    expect(result.error).toBe(copy.verification.invalidCode);

    const row = await prisma.member.findUnique({ where: { id: member.id } });
    expect(row?.emailVerifiedAt).toBeNull();
  });

  it("rejects an expired code", async () => {
    const member = await createMember();
    const code = generateVerificationCode();

    await storeEmailVerificationCode(member.id, code);
    await prisma.member.update({
      where: { id: member.id },
      data: { emailVerificationExpiresAt: new Date(Date.now() - 1000) },
    });

    const result = await verifyEmailCode(member.id, code);

    expect(result.success).toBe(false);
    expect(result.error).toBe(copy.verification.invalidCode);
  });

  it("ensure does nothing for a verified member", async () => {
    const member = await createMember();
    await prisma.member.update({
      where: { id: member.id },
      data: { emailVerifiedAt: new Date() },
    });

    await ensureEmailVerificationCode({
      memberId: member.id,
      email: "verify@example.com",
      name: "Test Member",
    });

    const row = await prisma.member.findUnique({ where: { id: member.id } });
    expect(row?.emailVerificationCodeHash).toBeNull();
  });

  it("ensure does nothing when a code is already stored", async () => {
    const member = await createMember();
    const code = generateVerificationCode();
    await storeEmailVerificationCode(member.id, code);

    const before = await prisma.member.findUnique({ where: { id: member.id } });

    await ensureEmailVerificationCode({
      memberId: member.id,
      email: "verify@example.com",
      name: "Test Member",
    });

    const after = await prisma.member.findUnique({ where: { id: member.id } });
    expect(after?.emailVerificationCodeHash).toBe(before?.emailVerificationCodeHash);
    expect(after?.emailVerificationExpiresAt?.toISOString()).toBe(
      before?.emailVerificationExpiresAt?.toISOString()
    );
  });
});
