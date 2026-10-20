"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { copy } from "@/lib/copy";
import { getStaffSession } from "@/server/auth/session";
import { loginStaff, logoutStaff } from "@/server/auth/staff-service";
import { staffLoginSchema } from "@/server/auth/validation";
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
  void formData;

  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "STAFF" && session.role !== "OWNER") {
    return { status: "error", error: copy.staff.noPermission };
  }

  try {
    const result = await reserveMemberNumber({
      gymId: session.gymId,
      staffId: session.staffId,
    });

    if (!result.success || !result.memberNumber) {
      return { status: "error", error: copy.staff.reserveFailed };
    }

    return { status: "success", memberNumber: result.memberNumber };
  } catch {
    return { status: "error", error: copy.staff.reserveUnavailable };
  }
}
