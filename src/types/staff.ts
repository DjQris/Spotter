export interface StaffLoginActionState {
  error?: string;
}

export interface ReserveMemberNumberActionState {
  status: "idle" | "success" | "error";
  memberNumber?: string;
  error?: string;
}
