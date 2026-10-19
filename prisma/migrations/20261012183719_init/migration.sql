-- Hand written: pgvector is required by the CardChunk embedding column in rules/schema.md.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('RENEWAL', 'ARREARS');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('IN_APP', 'CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CheckInSource" AS ENUM ('CODE', 'MANUAL');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CardVersionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "CardCategory" AS ENUM ('TIMETABLE', 'PRICES', 'RULES_ACCESS_HOURS', 'GUEST_POLICY', 'PAUSE_CANCELLATION', 'TRAINING_PLAN', 'TRAINER_GUIDANCE');

-- CreateEnum
CREATE TYPE "QuestionIntent" AS ENUM ('SHARED_QUESTION', 'PRIVATE_ATTENDANCE', 'PRIVATE_BALANCE', 'PRIVATE_MEMBERSHIP', 'REFUSED_POLICY', 'UNCLEAR');

-- CreateEnum
CREATE TYPE "QuestionOutcome" AS ENUM ('ANSWERED', 'REFUSED_POLICY', 'REFUSED_NO_RECORD', 'UNCLEAR', 'BLOCKED_UNGROUNDED', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditVerdict" AS ENUM ('CORRECT', 'WRONG');

-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "graceDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "phone" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'BASIC',
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "email" TEXT,
    "passwordHash" TEXT,
    "tempPasswordHash" TEXT,
    "tempPasswordExpiresAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "accountCreatedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MemberSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "whatsappNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeskShift" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeskShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "CardCategory" NOT NULL,
    "minTier" "Tier" NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewIntervalDays" INTEGER NOT NULL,
    "lastConfirmedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardVersion" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CardVersionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardChunk" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardVersionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "embedding" vector(768) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInCode" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "consumedBy" TEXT,

    CONSTRAINT "CheckInCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "CheckInSource" NOT NULL,
    "checkInCodeId" TEXT,
    "recordedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "attemptId" TEXT,
    "reference" TEXT NOT NULL,
    "gatewayReference" TEXT,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "purpose" "PaymentPurpose" NOT NULL,
    "channel" "PaymentChannel" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "recordedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "channel" "PaymentChannel",
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "recordedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipChange" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "oldTier" "Tier",
    "newTier" "Tier",
    "oldExpiryDate" TIMESTAMP(3),
    "newExpiryDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "changedByStaffId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "intent" "QuestionIntent" NOT NULL,
    "outcome" "QuestionOutcome" NOT NULL,
    "topScore" DOUBLE PRECISION,
    "cardId" TEXT,
    "answerText" TEXT,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrongAnswerReport" (
    "id" TEXT NOT NULL,
    "questionLogId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WrongAnswerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerAudit" (
    "id" TEXT NOT NULL,
    "questionLogId" TEXT NOT NULL,
    "auditedById" TEXT NOT NULL,
    "verdict" "AuditVerdict" NOT NULL,
    "auditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateAccessLog" (
    "id" TEXT NOT NULL,
    "sessionMemberId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_gymId_memberNumber_key" ON "Member"("gymId", "memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSession_tokenHash_key" ON "MemberSession"("tokenHash");

-- CreateIndex
CREATE INDEX "MemberSession_memberId_idx" ON "MemberSession"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_tokenHash_key" ON "StaffSession"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_idx" ON "StaffSession"("staffId");

-- CreateIndex
CREATE INDEX "DeskShift_startsAt_endsAt_idx" ON "DeskShift"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_gymId_tier_key" ON "MembershipPlan"("gymId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "Card_currentVersionId_key" ON "Card"("currentVersionId");

-- CreateIndex
CREATE INDEX "Card_status_minTier_idx" ON "Card"("status", "minTier");

-- CreateIndex
CREATE INDEX "CardVersion_cardId_status_idx" ON "CardVersion"("cardId", "status");

-- CreateIndex
CREATE INDEX "CardChunk_cardVersionId_idx" ON "CardChunk"("cardVersionId");

-- CreateIndex
CREATE INDEX "CardChunk_cardId_tier_idx" ON "CardChunk"("cardId", "tier");

-- CreateIndex
CREATE INDEX "CheckInCode_memberId_createdAt_idx" ON "CheckInCode"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckInCode_code_consumedAt_expiresAt_idx" ON "CheckInCode"("code", "consumedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_checkInCodeId_key" ON "CheckIn"("checkInCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_memberId_date_key" ON "CheckIn"("memberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_reference_key" ON "PaymentAttempt"("reference");

-- CreateIndex
CREATE INDEX "PaymentAttempt_memberId_status_idx" ON "PaymentAttempt"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_attemptId_key" ON "Payment"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayReference_key" ON "Payment"("gatewayReference");

-- CreateIndex
CREATE INDEX "Payment_memberId_paidAt_idx" ON "Payment"("memberId", "paidAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_memberId_occurredAt_idx" ON "LedgerEntry"("memberId", "occurredAt");

-- CreateIndex
CREATE INDEX "MembershipChange_memberId_createdAt_idx" ON "MembershipChange"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionLog_outcome_askedAt_idx" ON "QuestionLog"("outcome", "askedAt");

-- CreateIndex
CREATE INDEX "QuestionLog_memberId_askedAt_idx" ON "QuestionLog"("memberId", "askedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WrongAnswerReport_questionLogId_key" ON "WrongAnswerReport"("questionLogId");

-- CreateIndex
CREATE INDEX "AnswerAudit_auditedAt_idx" ON "AnswerAudit"("auditedAt");

-- CreateIndex
CREATE INDEX "PrivateAccessLog_sessionMemberId_targetMemberId_idx" ON "PrivateAccessLog"("sessionMemberId", "targetMemberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeskShift" ADD CONSTRAINT "DeskShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "CardVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardVersion" ADD CONSTRAINT "CardVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardChunk" ADD CONSTRAINT "CardChunk_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardChunk" ADD CONSTRAINT "CardChunk_cardVersionId_fkey" FOREIGN KEY ("cardVersionId") REFERENCES "CardVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInCode" ADD CONSTRAINT "CheckInCode_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_checkInCodeId_fkey" FOREIGN KEY ("checkInCodeId") REFERENCES "CheckInCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_recordedByStaffId_fkey" FOREIGN KEY ("recordedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedByStaffId_fkey" FOREIGN KEY ("recordedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_recordedByStaffId_fkey" FOREIGN KEY ("recordedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_changedByStaffId_fkey" FOREIGN KEY ("changedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipChange" ADD CONSTRAINT "MembershipChange_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLog" ADD CONSTRAINT "QuestionLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongAnswerReport" ADD CONSTRAINT "WrongAnswerReport_questionLogId_fkey" FOREIGN KEY ("questionLogId") REFERENCES "QuestionLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAudit" ADD CONSTRAINT "AnswerAudit_questionLogId_fkey" FOREIGN KEY ("questionLogId") REFERENCES "QuestionLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerAudit" ADD CONSTRAINT "AnswerAudit_auditedById_fkey" FOREIGN KEY ("auditedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand written: no two unconsumed codes may hold the same digits, per rules/checkin.md and rules/schema.md.
CREATE UNIQUE INDEX "CheckInCode_active_code_key" ON "CheckInCode"("code") WHERE "consumedAt" IS NULL;

-- Hand written: the embedding column must be present, per rules/schema.md.
ALTER TABLE "CardChunk" ADD CONSTRAINT "CardChunk_embedding_present" CHECK ("embedding" IS NOT NULL);

