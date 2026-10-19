"use client";

import { useState } from "react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import VerifyEmailBanner from "@/components/verify-email-banner";
import { useDeleteAccount, useLogout, type SessionMember } from "@/hooks/use-auth";
import styles from "@/app/page.module.css";

interface MemberPortalProps {
  member: SessionMember;
}

const DEFAULT_QUESTIONS = [
  "What time is the Saturday class?",
  "Can I bring a guest with me?",
  "Why is my card not working before six?",
  "What are the gym access hours?",
  "What is the current subscription price?",
  "How do I pause my membership?",
  "What training plans are available?",
  "Who is the trainer on duty today?",
];

export default function MemberPortal({ member }: MemberPortalProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();

  const handleLogout = () => {
    setLogoutError("");
    logout.mutate(undefined, {
      onError: () => setLogoutError(copy.errors.signOutFailed),
    });
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteAccount.isPending || deletePassword.length === 0) {
      return;
    }

    setDeleteError("");

    deleteAccount.mutate(deletePassword.trim(), {
      onError: (error) => setDeleteError(error.message || copy.deletion.passwordWrong),
    });
  };

  return (
    <section className={styles.dashboardCard} aria-labelledby="member-portal-title">
      <div className={styles.memberHeader}>
        <div>
          <h2 id="member-portal-title" className="text-title-large" style={{ margin: 0 }}>
            {member.name}
          </h2>
          <span className="text-body-small" style={{ color: "var(--color-on-surface-variant)" }}>
            {member.email}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className={`text-label-large ${styles.memberNumberBadge}`}>
            #{member.memberNumber}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className={styles.outlineBtn}
          >
            Sign Out
          </button>
        </div>
      </div>

      {logoutError && (
        <span role="alert" className={`text-body-small ${styles.verifyError}`}>
          {logoutError}
        </span>
      )}

      {!member.emailVerified && <VerifyEmailBanner email={member.email} />}

      {/* 6.2 Status Area: Tier, Expiry, Days trained this month, Balance */}
      <div className={styles.statusTiles}>
        <div className={styles.statusTile}>
          <span className={styles.statusTileLabel}>
            Effective Tier
          </span>
          <span className={styles.statusTileValue}>
            Basic Member
          </span>
        </div>

        <div className={styles.statusTile}>
          <span className={styles.statusTileLabel}>
            Expiry Date
          </span>
          <span className={styles.statusTileValue}>
            Active
          </span>
        </div>

        <div className={styles.statusTile}>
          <span className={styles.statusTileLabel}>
            Attendance
          </span>
          {/* PRD 6.2 Empty State: "0 days this month" */}
          <span className={styles.statusTileValue}>
            {copy.empty.zeroDaysThisMonth}
          </span>
        </div>

        <div className={styles.statusTile}>
          <span className={styles.statusTileLabel}>
            Balance
          </span>
          <span className={styles.statusTileValue}>
            {copy.payments.nothingDue}
          </span>
        </div>
      </div>

      {/* 8 Tappable questions (FR-9) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3 className={styles.questionsHeader}>
          Ask About The Gym
        </h3>
        <span className="text-body-small" style={{ color: "var(--color-on-surface-variant)" }}>
          Tapped questions skip model calls and verify against approved gym records.
        </span>

        <div className={styles.questionsGrid}>
          {DEFAULT_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.questionButton}
              onClick={() => setSelectedQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <p className={styles.srOnly} role="status">
          {selectedQuestion
            ? `${selectedQuestion} ${copy.refusals.records}`
            : ""}
        </p>

        {selectedQuestion && (
          <div className={styles.bannerNotice}>
            <span className="text-label-medium" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>
              {selectedQuestion}
            </span>
            <span className="text-body-small">
              {copy.refusals.records}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-outline-variant)", paddingTop: "1rem" }}>
        <span className="text-body-small" style={{ color: "var(--color-on-surface-variant)" }}>
          Need assistance with personal records or waivers?
        </span>
        <Link href="/auth?view=reset" className={styles.linkReset}>
          Manage Password
        </Link>
      </div>

      <div className={styles.deleteSection}>
        {deleteOpen ? (
          <form
            onSubmit={handleDeleteAccount}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <span className="text-body-small" style={{ color: "var(--color-on-surface-variant)" }}>
              {copy.deletion.warning}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
              <div className={styles.verifyField}>
                <label
                  htmlFor="delete-account-password"
                  className={`text-label-small ${styles.verifyLabel}`}
                >
                  {copy.deletion.confirmPrompt}
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  aria-invalid={deleteError ? true : undefined}
                  aria-describedby={deleteError ? "delete-account-error" : undefined}
                  className={`text-body-medium ${styles.verifyInput}`}
                />
              </div>
              <button
                type="submit"
                disabled={deleteAccount.isPending || deletePassword.length === 0}
                className={`text-label-medium ${styles.deleteConfirmButton}`}
              >
                {deleteAccount.isPending ? copy.deletion.deleting : copy.deletion.confirmButton}
              </button>
              <button
                type="button"
                disabled={deleteAccount.isPending}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className={`text-label-medium ${styles.verifyResendButton}`}
              >
                {copy.deletion.cancelButton}
              </button>
            </div>
            {deleteError && (
              <span
                id="delete-account-error"
                role="alert"
                className={`text-body-small ${styles.verifyError}`}
              >
                {deleteError}
              </span>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`text-label-medium ${styles.deleteLink}`}
          >
            {copy.deletion.openButton}
          </button>
        )}
      </div>
    </section>
  );
}
