import { NextResponse } from "next/server";
import { clientIp } from "@/server/auth/rate-limit";
import { loginMember } from "@/server/auth/service";
import { loginErrorMessage, loginSchema } from "@/server/auth/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: loginErrorMessage() },
        { status: 401 }
      );
    }

    const result = await loginMember({ ...parsed.data, ip: clientIp(request) });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
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
