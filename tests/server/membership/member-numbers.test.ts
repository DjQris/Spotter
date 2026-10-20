import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import {
  getLatestReservation,
  reserveMemberNumber,
} from "@/server/membership/member-numbers";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!hasTestDatabase)("member number reservation", () => {
  beforeEach(async () => {
    await prisma.memberSession.deleteMany();
    await prisma.memberNumberReservation.deleteMany();
    await prisma.staffSession.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.member.deleteMany();
    await prisma.gym.deleteMany();
  });

  async function createGymAndStaff() {
    const gym = await prisma.gym.create({
      data: {
        name: "Test Gym",
        timezone: "Africa/Lagos",
        openingTime: "06:00",
        closingTime: "22:00",
        graceDays: 7,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        gymId: gym.id,
        name: "Reception Staff",
        email: "reception@example.com",
        passwordHash: "not-used-by-this-test",
        role: "STAFF",
      },
    });

    return { gym, staff };
  }

  it("reserves distinct six digit numbers and stamps the staff member", async () => {
    const { gym, staff } = await createGymAndStaff();

    const first = await reserveMemberNumber({
      gymId: gym.id,
      staffId: staff.id,
    });
    const second = await reserveMemberNumber({
      gymId: gym.id,
      staffId: staff.id,
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(first.memberNumber).toMatch(/^\d{6}$/);
    expect(second.memberNumber).toMatch(/^\d{6}$/);
    expect(first.memberNumber).not.toBe(second.memberNumber);

    const reservations = await prisma.memberNumberReservation.findMany({
      where: { gymId: gym.id },
      orderBy: { createdAt: "asc" },
    });

    expect(reservations).toHaveLength(2);
    expect(reservations.every((row) => row.createdByStaffId === staff.id)).toBe(
      true
    );

    const latest = await getLatestReservation({
      gymId: gym.id,
      staffId: staff.id,
    });

    expect([first.memberNumber, second.memberNumber]).toContain(
      latest?.memberNumber
    );
  });
});
