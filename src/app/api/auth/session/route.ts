import { after, NextResponse } from "next/server";
import { ensureEmailVerificationCode } from "@/server/auth/email-verification";
import { getCurrentMember, logoutMember } from "@/server/auth/service";

export async function POST() {
  await logoutMember();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const member = await getCurrentMember();

  if (member?.email && !member.emailVerified) {
    const { memberId, email, name } = member;

    after(async () => {
      try {
        await ensureEmailVerificationCode({ memberId, email, name });
      } catch (error) {
        console.error(
          "Verification email failed:",
          error instanceof Error ? error.message : error
        );
      }
    });
  }

  return NextResponse.json({ member });
}
