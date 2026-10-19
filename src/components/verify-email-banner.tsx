"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import { useResendVerification, useVerifyEmail } from "@/hooks/use-auth";
import styles from "@/app/page.module.css";

interface VerifyEmailBannerProps {
  email: string;
}

export default function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const busy = verify.isPending ? "verify" : resend.isPending ? "resend" : null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (busy || code.length !== 6) {
      return;
    }

    setError("");
    setNotice("");

    verify.mutate(code, {
      onError: (mutationError) =>
        setError(mutationError.message || copy.verification.invalidCode),
    });
  };

  const handleResend = () => {
    if (busy) {
      return;
    }

    setError("");
    setNotice("");

    resend.mutate(undefined, {
      onSuccess: (data) => {
        if (!data.alreadyVerified) {
          setNotice(copy.verification.resendSent(email));
        }
      },
      onError: (mutationError) =>
        setError(mutationError.message || copy.verification.sendFailed),
    });
  };

  return (
    <div className={styles.verifyBanner} aria-labelledby="verify-email-title">
      <span
        id="verify-email-title"
        className="text-label-large"
        style={{ fontWeight: 700, color: "var(--color-on-surface)" }}
      >
        {copy.verification.bannerTitle}
      </span>
      <span className="text-body-small" style={{ color: "var(--color-on-surface-variant)" }}>
        {copy.verification.bannerPrompt(email)}
      </span>

      <form onSubmit={handleVerify} className={styles.verifyForm} noValidate>
        <div className={styles.verifyField}>
          <label htmlFor="verify-email-code" className={`text-label-small ${styles.verifyLabel}`}>
            {copy.verification.codeLabel}
          </label>
          <input
            id="verify-email-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "verify-email-message" : undefined}
            className={`text-body-medium ${styles.verifyInput}`}
          />
        </div>

        <button
          type="submit"
          disabled={busy !== null || code.length !== 6}
          className={`text-label-medium ${styles.verifyButton}`}
        >
          {busy === "verify" ? copy.verification.verifying : copy.verification.verifyButton}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={busy !== null}
          className={`text-label-medium ${styles.verifyResendButton}`}
        >
          {busy === "resend" ? copy.verification.resending : copy.verification.resendButton}
        </button>
      </form>

      {error && (
        <span
          id="verify-email-message"
          role="alert"
          className={`text-body-small ${styles.verifyError}`}
        >
          {error}
        </span>
      )}

      {notice && !error && (
        <span role="status" className={`text-body-small ${styles.verifyMessage}`}>
          {notice}
        </span>
      )}
    </div>
  );
}
