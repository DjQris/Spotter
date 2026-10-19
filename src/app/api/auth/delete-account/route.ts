import { NextResponse } from "next/server";
import { copy } from "@/lib/copy";
import { requestAccountDeletion } from "@/server/auth/deletion";
import { clientIp } from "@/server/auth/rate-limit";
import { getCurrentMember, logoutMember } from "@/server/auth/service";
import { deleteAccountSchema } from "@/server/auth/validation";

export async function POST(request: Request) {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json(
      { error: copy.deletion.signInRequired },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: copy.deletion.passwordWrong },
      { status: 400 }
    );
  }

  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: copy.deletion.passwordWrong },
      { status: 400 }
    );
  }

  const result = await requestAccountDeletion(
    member.memberId,
    parsed.data.password,
    clientIp(request)
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logoutMember();

  return NextResponse.json({ success: true });
}
