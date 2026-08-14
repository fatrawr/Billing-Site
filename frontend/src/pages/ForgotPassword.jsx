import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import AuthShell from "../components/Authshell.jsx";
import OTPDialog from "../components/OTPDialog.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("email"); // "email" | "code" | "password"
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!email.trim()) return setError("Please enter your email.");

    setLoading(true);
    try {
      await api.sendResetCode({ email: email.trim() });
      setStage("code");
      notifySuccess("Code sent", "Check your email for the verification code.");
    } catch (err) {
      setError(err.message);
      notifyError("Could not send code", err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code) => {
    const data = await api.verifyResetCode({ email: email.trim(), code });
    setResetToken(data.resetToken);
    notifySuccess("Code verified", "Set your new password.");
  };

  const resendCode = async () => {
    await api.sendResetCode({ email: email.trim() });
    notifySuccess("Code resent", "A new code has been sent to your email.");
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
        <p className="welcome-copy">Check the popup to enter your verification code.</p>
      )}

      <OTPDialog
        open={stage === "code"}
        email={email}
        length={6}
        onVerify={verifyCode}
        onResend={resendCode}
        onClose={() => {
          if (resetToken) setStage("password");
        }}
      />

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