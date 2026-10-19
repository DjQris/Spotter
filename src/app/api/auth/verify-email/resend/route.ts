import { NextResponse } from "next/server";
import { copy } from "@/lib/copy";
import {
  generateVerificationCode,
  storeEmailVerificationCode,
} from "@/server/auth/email-verification";
import { getCurrentMember } from "@/server/auth/service";
import { sendVerificationEmail } from "@/server/email/verification-email";

export async function POST() {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json(
      { error: copy.verification.signInRequired },
      { status: 401 }
    );
  }

  if (member.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  if (!member.email) {
    return NextResponse.json(
      { error: copy.verification.sendFailed },
      { status: 400 }
    );
  }

  try {
    const code = generateVerificationCode();
    await sendVerificationEmail({ to: member.email, name: member.name, code });
    await storeEmailVerificationCode(member.memberId, code);
  } catch (error) {
    console.error(
      "Verification email failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: copy.verification.sendFailed },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
