import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import AuthShell from "../components/Authshell.jsx";
import { useAuth } from "../components/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { setStatus } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { refresh } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await api.login({ userId: userId.trim(), password });
      setStatus("allowed"); // cache auth state so RequireAuth doesn't re-check
      //await refresh(); // refresh user info
      navigate("/menu");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      eyebrow="Member Access"
      title="Log In"
      footer={
        <>
          <Link className="link" to="/forgot-password">Forgot Password?</Link>
          <Link className="back-link" to="/" style={{ marginTop: 10 }}>
            Click here to go back
          </Link>
        </>
      }
    >
      {error && <div className="flash error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>User ID</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="button-row">
          <button type="submit" className="btn btn-primary">Log In</button>
        </div>
      </form>
    </AuthShell>
  );
}