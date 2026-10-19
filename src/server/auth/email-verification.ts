import "server-only";
import type { Algorithm } from "@node-rs/argon2";
import { hash, verify } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { copy } from "@/lib/copy";
import { prisma } from "@/server/db";
import { sendVerificationEmail } from "@/server/email/verification-email";
import { isIpBlocked, recordIpFailure } from "./rate-limit";

const ARGON2ID_ALGORITHM = 2 as Algorithm;
const EMAIL_VERIFICATION_TTL_MS = 2 * 60 * 1000;

export function generateVerificationCode(): string {
  const value = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

async function verificationCodeFields(code: string) {
  return {
    emailVerificationCodeHash: await hash(code, { algorithm: ARGON2ID_ALGORITHM }),
    emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export async function storeEmailVerificationCode(memberId: string, code: string): Promise<void> {
  await prisma.member.update({
    where: { id: memberId },
    data: await verificationCodeFields(code),
  });
}

export async function storeEmailVerificationCodeIfUnset(
  memberId: string,
  code: string
): Promise<boolean> {
  const result = await prisma.member.updateMany({
    where: { id: memberId, emailVerificationCodeHash: null },
    data: await verificationCodeFields(code),
  });

  return result.count > 0;
}

export async function ensureEmailVerificationCode(input: {
  memberId: string;
  email: string;
  name: string;
}): Promise<void> {
  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: { emailVerifiedAt: true, emailVerificationCodeHash: true },
  });

  if (
    !member ||
    member.emailVerifiedAt !== null ||
    member.emailVerificationCodeHash !== null
  ) {
    return;
  }

  const code = generateVerificationCode();
  await sendVerificationEmail({ to: input.email, name: input.name, code });
  await storeEmailVerificationCodeIfUnset(input.memberId, code);
}

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

export async function verifyEmailCode(
  memberId: string,
  code: string,
  ip?: string
): Promise<EmailVerificationResult> {
  const failure = (): EmailVerificationResult => {
    if (ip) {
      recordIpFailure(ip);
    }
    return { success: false, error: copy.verification.invalidCode };
  };

  if (ip && isIpBlocked(ip)) {
    return { success: false, error: copy.login.ipLockout };
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });

  if (!member) {
    return failure();
  }

  if (member.emailVerifiedAt !== null) {
    return { success: true };
  }

  if (
    !member.emailVerificationCodeHash ||
    !member.emailVerificationExpiresAt ||
    member.emailVerificationExpiresAt.getTime() <= Date.now()
  ) {
    return failure();
  }

  const matches = await verify(member.emailVerificationCodeHash, code);
  if (!matches) {
    return failure();
  }

  await prisma.member.update({
    where: { id: memberId },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  return { success: true };
}
