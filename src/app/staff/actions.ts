"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { copy } from "@/lib/copy";
import { PERMISSIONS } from "@/lib/permissions";
import { staffCan } from "@/server/auth/authorization";
import { getStaffSession } from "@/server/auth/session";
import { loginStaff, logoutStaff } from "@/server/auth/staff-service";
import {
  reserveMemberNumberSchema,
  staffLoginSchema,
} from "@/server/auth/validation";
import { sendMemberNumberEmail } from "@/server/email/member-number-email";
import { reserveMemberNumber } from "@/server/membership/member-numbers";
import type {
  ReserveMemberNumberActionState,
  StaffLoginActionState,
} from "@/types/staff";

function requestIp(headerStore: Headers): string | undefined {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

export async function loginStaffAction(
  _previousState: StaffLoginActionState,
  formData: FormData
): Promise<StaffLoginActionState> {
  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: copy.staff.loginFailed };
  }

  let result;

  try {
    const headerStore = await headers();
    result = await loginStaff({
      ...parsed.data,
      ip: requestIp(headerStore),
    });
  } catch {
    return { error: copy.staff.signInUnavailable };
  }

  if (!result.success) {
    return { error: result.error ?? copy.staff.loginFailed };
  }

  redirect("/staff");
}

export async function logoutStaffAction(formData: FormData): Promise<void> {
  void formData;
  await logoutStaff();
  redirect("/staff/login");
}

export async function reserveMemberNumberAction(
  previousState: ReserveMemberNumberActionState,
  formData: FormData
): Promise<ReserveMemberNumberActionState> {
  void previousState;

  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (!staffCan(session, PERMISSIONS.MEMBER_NUMBER_RESERVE)) {
    return { status: "error", error: copy.staff.noPermission };
  }

  const parsed = reserveMemberNumberSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", error: copy.validation.emailInvalid };
  }

  try {
    const result = await reserveMemberNumber({
      gymId: session.gymId,
      staffId: session.staffId,
      email: parsed.data.email,
    });

    if (!result.success || !result.memberNumber) {
      return { status: "error", error: copy.staff.reserveFailed };
    }

    let emailSent = true;

    try {
      await sendMemberNumberEmail({
        to: parsed.data.email,
        memberNumber: result.memberNumber,
      });
    } catch (error) {
      emailSent = false;
      console.error(
        "Member number email failed:",
        error instanceof Error ? error.name : "unknown"
      );
    }

    return {
      status: "success",
      memberNumber: result.memberNumber,
      emailSent,
    };
  } catch {
    return { status: "error", error: copy.staff.reserveUnavailable };
  }
}
