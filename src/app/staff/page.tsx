import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StaffDashboard from "@/components/staff/staff-dashboard";
import { getStaffSession } from "@/server/auth/session";
import { getLatestReservation } from "@/server/membership/member-numbers";

export const metadata: Metadata = {
  title: "Reception desk",
};

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getStaffSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role !== "STAFF" && session.role !== "OWNER") {
    redirect("/staff/login");
  }

  const latest = await getLatestReservation({
    gymId: session.gymId,
    staffId: session.staffId,
  });

  return (
    <StaffDashboard
      staff={{ name: session.name, role: session.role }}
      latestMemberNumber={latest?.memberNumber ?? null}
    />
  );
}
