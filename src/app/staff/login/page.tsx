import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StaffLogin from "@/components/staff/staff-login";
import { getStaffSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Front desk sign in",
};

export const dynamic = "force-dynamic";

export default async function StaffLoginPage() {
  const session = await getStaffSession();

  if (session) {
    redirect("/staff");
  }

  return <StaffLogin />;
}
