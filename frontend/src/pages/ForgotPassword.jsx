import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import AuthShell from "../components/AuthShell.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("email"); // "email" | "code" | "password"
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRefs = useRef([]);

  const sendCode = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!email.trim()) return setError("Please enter your email.");

    setLoading(true);
    try {
      await api.sendResetCode({ email: email.trim() });
      setDigits(Array(6).fill(""));
      setStage("code");
      setNotice("Code sent — check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (i, value) => {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) boxRefs.current[i + 1]?.focus();
  };

  const handleDigitKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      boxRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    while (next.length < 6) next.push("");
    setDigits(next);
    boxRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    const code = digits.join("");
    if (code.length !== 6) return setError("Enter the 6-digit code.");

    setLoading(true);
    try {
      const data = await api.verifyResetCode({ email: email.trim(), code });
      setResetToken(data.resetToken);
      setStage("password");
      setNotice("Code verified — set your new password.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError(""); setNotice("");
    setLoading(true);
    try {
      await api.sendResetCode({ email: email.trim() });
      setDigits(Array(6).fill(""));
      setNotice("A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");

    if (newPassword.length < 6 || newPassword.length > 15)
      return setError("Password must be 6–15 characters.");
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api.resetPassword({
        email: email.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      });
      navigate("/login", { state: { notice: "Password reset successfully! Please log in." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset Password"
      footer={<a className="back-link" href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Back to Log In</a>}
    >
      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      {stage === "email" && (
        <form onSubmit={sendCode}>
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="button-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send Code"}
            </button>
          </div>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verifyCode}>
          <div className="field">
            <label>Enter the 6-digit code sent to {email}</label>
            <div className="otp-row" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (boxRefs.current[i] = el)}
                  className="otp-box"
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>
          <div className="button-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Verifying…" : "Verify Code"}
            </button>
          </div>
          <button type="button" className="link" style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer" }} onClick={resendCode} disabled={loading}>
            Resend code
          </button>
        </form>
      )}

      {stage === "password" && (
        <form onSubmit={resetPasswordSubmit}>
          <div className="field">
            <label>New Password (6–15 chars)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              maxLength={15}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              maxLength={15}
              required
            />
          </div>
          <div className="button-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}