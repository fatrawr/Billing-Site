import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import AuthShell from "../components/Authshell.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !newPassword || !confirmPassword)
      return setError("Please fill in all fields.");
    if (newPassword.length < 6 || newPassword.length > 15)
      return setError("Password must be 6–15 characters.");
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");

    try {
      await api.forgotPassword({ userId: userId.trim(), newPassword, confirmPassword });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset Password"
      footer={<Link className="back-link" to="/">Click here to go back</Link>}
    >
      {error && <div className="flash error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>User ID</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>

        <div className="field">
          <label>New Password (6–15 chars)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            maxLength={15}
            required
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
          <button type="submit" className="btn btn-primary">Reset Password</button>
        </div>
      </form>
    </AuthShell>
  );
}