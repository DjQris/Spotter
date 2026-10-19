import { after, NextResponse } from "next/server";
import { clientIp } from "@/server/auth/rate-limit";
import { signUpMember } from "@/server/auth/service";
import { signUpErrorMessage, signUpSchema } from "@/server/auth/validation";
import { sendWelcomeEmail } from "@/server/email/welcome-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: signUpErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const result = await signUpMember({ ...parsed.data, ip: clientIp(request) });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const session = result.session;
    if (session?.email) {
      const { email, name } = session;

      after(async () => {
        try {
          await sendWelcomeEmail({ to: email, name });
        } catch (error) {
          console.error(
            "Welcome email failed:",
            error instanceof Error ? error.message : error
          );
        }
      });
    }

    return NextResponse.json({ success: true, session: result.session });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
