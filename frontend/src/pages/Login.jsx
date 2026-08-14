import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../components/AuthContext.jsx";
import { DoodleWave } from "../components/Doodles.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

export default function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await api.login({ userId: userId.trim(), password });
      await refresh(); // refresh user info
      notifySuccess("Welcome back!");
      navigate("/menu");
    } catch (err) {
      setError(err.message);
      notifyError("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card__shell">
        <div className="auth-card__inner">
          <div className="auth-card__header">
            <div className="auth-shell__eyebrow">Member Access</div>
            <h1 className="auth-card__title">Log In</h1>
            <DoodleWave className="auth-shell__wave" />
            <p className="auth-card__subtitle">Sign in to manage bills, readings, and payments.</p>
          </div>

          {error && <div className="flash error">{error}</div>}

          <form onSubmit={submit} className="auth-card__form">
            <div className="icon-field">
              <User className="icon-field__icon" size={16} />
              <input
                className="icon-field__input"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="icon-field">
              <Lock className="icon-field__icon" size={16} />
              <input
                className="icon-field__input icon-field__input--pr"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <Link className="link" to="/forgot-password" style={{ marginTop: 18 }}>
            Forgot Password?
          </Link>
        </div>

        <div className="auth-card__footer">
          <p>
            New here?{" "}
            <Link className="auth-card__footer-link" to="/signup">Create an account</Link>
          </p>
          <Link className="back-link" to="/" style={{ marginTop: 6 }}>
            Click here to go back
          </Link>
        </div>
      </div>
    </div>
  );
}
