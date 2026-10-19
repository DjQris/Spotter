import { NextResponse, type NextRequest } from "next/server";
import { getMemberSessionFromRequest } from "@/server/auth/session";

const PROTECTED_PATH_PREFIXES: string[] = [];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const session = await getMemberSessionFromRequest(request);

  if (!session && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const headers = new Headers(request.headers);
  headers.delete("x-member-id");
  headers.delete("x-member-name");

  if (session) {
    headers.set("x-member-id", session.memberId);
    headers.set("x-member-name", encodeURIComponent(session.name));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
