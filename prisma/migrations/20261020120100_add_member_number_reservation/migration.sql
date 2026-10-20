-- CreateTable
CREATE TABLE "MemberNumberReservation" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "createdByStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNumberReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberNumberReservation_gymId_memberNumber_key" ON "MemberNumberReservation"("gymId", "memberNumber");

-- CreateIndex
CREATE INDEX "MemberNumberReservation_createdByStaffId_createdAt_idx" ON "MemberNumberReservation"("createdByStaffId", "createdAt");

-- AddForeignKey
ALTER TABLE "MemberNumberReservation" ADD CONSTRAINT "MemberNumberReservation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNumberReservation" ADD CONSTRAINT "MemberNumberReservation_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
