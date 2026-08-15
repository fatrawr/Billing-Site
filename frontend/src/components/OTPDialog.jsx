import { useEffect, useRef, useState } from "react";
import { CheckIcon, MailIcon } from "lucide-react";
import { notifyError } from "../lib/toast.js";

const TIMER_SECONDS = 10 * 60; // 10 minutes

/**
 * Popup OTP dialog. Renders nothing when `open` is false.
 *
 * Props:
 *  - open: boolean
 *  - email: string (shown in copy)
 *  - length: number of digits (default 6)
 *  - onVerify(code): async -> throws on invalid code
 *  - onResend(): async -> called when the timer expires / resend clicked
 *  - onClose(): called on backdrop click / after success "Continue"
 */
export default function OTPDialog({ open, email, length = 6, onVerify, onResend, onClose }) {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const [status, setStatus] = useState("idle"); // idle | verifying | success | error
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const boxRefs = useRef([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(length).fill(""));
    setStatus("idle");
    setSeconds(TIMER_SECONDS);
  }, [open, length]);

  useEffect(() => {
    if (!open || status === "success") return;
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open, status, seconds]);

  if (!open) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const expired = seconds <= 0;

  const handleChange = (i, value) => {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < length - 1) boxRefs.current[i + 1]?.focus();
    if (next.every((d) => d) && !next.includes("")) submit(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxRefs.current[i - 1]?.focus();
  };

  const submit = async (code) => {
    setStatus("verifying");
    try {
      await onVerify(code);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      notifyError("Verification failed", err?.message || "Invalid code. Please try again.");
      setDigits(Array(length).fill(""));
      boxRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setDigits(Array(length).fill(""));
    setStatus("idle");
    setSeconds(TIMER_SECONDS);
    await onResend?.();
  };

  return (
    <div className="confirm-overlay" role="presentation" onClick={onClose}>
      <div className="otp-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`otp-dialog__icon${status === "success" ? " otp-dialog__icon--done" : ""}`}>
          {status === "success" ? <CheckIcon size={18} /> : <MailIcon size={18} />}
        </div>

        <h2 className="confirm-card__title">
          {status === "success" ? "Code Verified" : "Enter Verification Code"}
        </h2>

        {status === "success" ? (
          <>
            <p className="confirm-card__message">Your code was accepted. You may continue.</p>
            <div className="confirm-card__actions">
              <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Continue</button>
            </div>
          </>
        ) : (
          <>
            <p className="confirm-card__message">
              Enter the {length}-digit code sent to <strong>{email}</strong>.
            </p>

            <div className="otp-row" style={{ marginTop: 16 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (boxRefs.current[i] = el)}
                  className="otp-box"
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={i === 0}
                  disabled={status === "verifying" || expired}
                />
              ))}
            </div>

            <p className="otp-dialog__timer">
              {expired ? (
                <span>Code expired.</span>
              ) : (
                <span>Expires in {mm}:{ss}</span>
              )}
            </p>

            <button
              type="button"
              className="link"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={handleResend}
              disabled={status === "verifying"}
            >
              Resend code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
