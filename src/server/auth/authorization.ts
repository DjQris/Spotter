import "server-only";
import type { PermissionKey } from "@/lib/permissions";
import type { StaffSessionData } from "./session";

export function staffCan(
  session: Pick<StaffSessionData, "permissions"> | null,
  permission: PermissionKey
): boolean {
  return session?.permissions.includes(permission) ?? false;
}
