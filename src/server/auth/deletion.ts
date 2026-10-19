import "server-only";
import { verify } from "@node-rs/argon2";
import { copy } from "@/lib/copy";
import { prisma } from "@/server/db";
import { isIpBlocked, recordIpFailure } from "./rate-limit";
import { revokeMemberSessions } from "./session";

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
}

export async function requestAccountDeletion(
  memberId: string,
  password: string,
  ip?: string
): Promise<AccountDeletionResult> {
  const failure = (): AccountDeletionResult => {
    if (ip) {
      recordIpFailure(ip);
    }
    return { success: false, error: copy.deletion.passwordWrong };
  };

  if (ip && isIpBlocked(ip)) {
    return { success: false, error: copy.login.ipLockout };
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });

  if (!member) {
    return failure();
  }

  if (member.deletionRequestedAt) {
    return { success: true };
  }

  if (!member.passwordHash || !(await verify(member.passwordHash, password))) {
    return failure();
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { deletionRequestedAt: new Date() },
  });

  await revokeMemberSessions(memberId);

  return { success: true };
}
