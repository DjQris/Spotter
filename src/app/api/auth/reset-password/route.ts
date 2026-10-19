import { NextResponse } from "next/server";
import { clientIp } from "@/server/auth/rate-limit";
import { resetPasswordMember } from "@/server/auth/service";
import {
  resetPasswordErrorMessage,
  resetPasswordSchema,
} from "@/server/auth/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: resetPasswordErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const result = await resetPasswordMember({ ...parsed.data, ip: clientIp(request) });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, session: result.session });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
