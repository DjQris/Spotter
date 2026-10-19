import { NextResponse } from "next/server";
import { copy } from "@/lib/copy";
import { verifyEmailCode } from "@/server/auth/email-verification";
import { clientIp } from "@/server/auth/rate-limit";
import { getCurrentMember } from "@/server/auth/service";
import { verifyEmailSchema } from "@/server/auth/validation";

export async function POST(request: Request) {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json(
      { error: copy.verification.signInRequired },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: copy.verification.invalidCode },
      { status: 400 }
    );
  }

  const parsed = verifyEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: copy.verification.invalidCode },
      { status: 400 }
    );
  }

  const result = await verifyEmailCode(
    member.memberId,
    parsed.data.code,
    clientIp(request)
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
