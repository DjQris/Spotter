import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";

const MEMBER_SESSION_COOKIE = "spotter_session";
const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export interface SessionData {
  memberId: string;
  email: string | null;
  name: string;
  memberNumber: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
}

function signToken(token: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookieValue(value: string): { token: string; signature: string } | null {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  return {
    token: value.slice(0, separator),
    signature: value.slice(separator + 1),
  };
}

function signatureMatches(token: string, signature: string): boolean {
  const expected = Buffer.from(signToken(token));
  const received = Buffer.from(signature);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

function buildCookieValue(token: string): string {
  return `${token}.${signToken(token)}`;
}

function parseSignedCookie(value: string): { token: string; signature: string } | null {
  const parsed = parseCookieValue(value);
  if (!parsed || !signatureMatches(parsed.token, parsed.signature)) {
    return null;
  }

  return parsed;
}

async function lookupSession(token: string) {
  const session = await prisma.memberSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { member: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    session.member.deletionRequestedAt !== null
  ) {
    return null;
  }

  return session;
}

function buildSessionData(session: {
  mustChangePassword: boolean;
  member: {
    id: string;
    email: string | null;
    name: string;
    memberNumber: string;
    emailVerifiedAt: Date | null;
  };
}): SessionData {
  return {
    memberId: session.member.id,
    email: session.member.email,
    name: session.member.name,
    memberNumber: session.member.memberNumber,
    mustChangePassword: session.mustChangePassword,
    emailVerified: session.member.emailVerifiedAt !== null,
  };
}

async function resolveSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(MEMBER_SESSION_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  const parsed = parseSignedCookie(cookie.value);
  if (!parsed) {
    return null;
  }

  const session = await lookupSession(parsed.token);
  if (!session) {
    return null;
  }

  return { session, cookieValue: cookie.value };
}

/**
 * Creates a member session row and sets the signed session cookie.
 */
export async function createMemberSession(
  memberId: string,
  options?: { mustChangePassword?: boolean }
): Promise<void> {
  const token = randomBytes(32).toString("base64url");

  await prisma.memberSession.create({
    data: {
      memberId,
      tokenHash: hashToken(token),
      mustChangePassword: options?.mustChangePassword ?? false,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(MEMBER_SESSION_COOKIE, buildCookieValue(token), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Reads and validates the current member session.
 * This is the ONLY place session data is retrieved.
 */
export async function getMemberSession(): Promise<SessionData | null> {
  const resolved = await resolveSession();
  if (!resolved) {
    return null;
  }

  const { session, cookieValue } = resolved;
  const now = new Date();

  await prisma.memberSession.update({
    where: { id: session.id },
    data: {
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(MEMBER_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return buildSessionData(session);
}

export async function getMemberSessionFromRequest(
  request: NextRequest
): Promise<SessionData | null> {
  const cookie = request.cookies.get(MEMBER_SESSION_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  const parsed = parseSignedCookie(cookie.value);
  if (!parsed) {
    return null;
  }

  const session = await lookupSession(parsed.token);
  if (!session) {
    return null;
  }

  return buildSessionData(session);
}

export async function getCurrentSessionId(): Promise<string | null> {
  const resolved = await resolveSession();
  return resolved?.session.id ?? null;
}

export async function revokeMemberSessions(
  memberId: string,
  exceptSessionId?: string
): Promise<void> {
  await prisma.memberSession.updateMany({
    where: {
      memberId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function clearMustChangePassword(sessionId: string): Promise<void> {
  await prisma.memberSession.update({
    where: { id: sessionId },
    data: { mustChangePassword: false },
  });
}

/**
 * Clears the member session cookie and revokes its session row.
 */
export async function destroyMemberSession(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(MEMBER_SESSION_COOKIE);

  if (cookie?.value) {
    const parsed = parseCookieValue(cookie.value);
    if (parsed && signatureMatches(parsed.token, parsed.signature)) {
      await prisma.memberSession.updateMany({
        where: { tokenHash: hashToken(parsed.token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  cookieStore.delete(MEMBER_SESSION_COOKIE);
}
