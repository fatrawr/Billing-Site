import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "../api.js";
import AuthCard from "../components/AuthCard.jsx";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      await api.resetPassword({ email: email.trim(), resetToken, newPassword, confirmPassword });
      notifySuccess("Password reset", "Please log in with your new password.");
      navigate("/login", { state: { notice: "Password reset successfully! Please log in." } });
    } catch (err) {
      setError(err.message);
      notifyError("Reset failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Account Recovery"
      title="Reset Password"
      subtitle={
        stage === "email"
          ? "Enter your email and we'll send a verification code."
          : stage === "code"
          ? "Verifying your identity…"
          : "Choose a new password for your account."
      }
      footer={<a className="back-link" href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Back to Log In</a>}
    >
      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      {stage === "email" && (
        <form onSubmit={sendCode} className="auth-card__form">
          <div className="icon-field">
            <Mail className="icon-field__icon" size={16} />
            <input
              className="icon-field__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Sending…" : "Send Code"}
          </button>
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
        <form onSubmit={resetPasswordSubmit} className="auth-card__form">
          <div className="icon-field">
            <Lock className="icon-field__icon" size={16} />
            <input
              className="icon-field__input icon-field__input--pr"
              type={showPassword ? "text" : "password"}
              placeholder="New Password (6–15 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              maxLength={15}
              required
              autoFocus
            />
            <button type="button" className="icon-field__toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="icon-field">
            <Lock className="icon-field__icon" size={16} />
            <input
              className="icon-field__input icon-field__input--pr"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              maxLength={15}
              required
            />
            <button type="button" className="icon-field__toggle" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle password visibility">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
