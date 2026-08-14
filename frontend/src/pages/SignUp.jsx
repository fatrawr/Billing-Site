import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCircle, Mail, Briefcase, User, Lock, ChevronDown, Eye, EyeOff } from "lucide-react";
import { api } from "../api.js";
import AuthCard from "../components/AuthCard.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

const DEPARTMENTS = ["Electrical Engineering", "Admin", "Misc."];

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", department: "", userId: "",
    password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const clear = () =>
    setForm({ name: "", email: "", department: "", userId: "", password: "", confirmPassword: "" });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.signup(form);
      notifySuccess("Account created successfully");
      navigate("/login");
    } catch (err) {
      setError(err.message);
      notifyError("Sign up failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="New Member"
      title="Create Account"
      subtitle="Register for admin access to the billing system."
      wide
      footer={<Link className="back-link" to="/">Click here to go back</Link>}
    >
      {error && <div className="flash error">{error}</div>}

      <form onSubmit={submit} className="auth-card__form">
        <div className="icon-field">
          <UserCircle className="icon-field__icon" size={16} />
          <input className="icon-field__input" placeholder="Full Name" value={form.name} onChange={update("name")} maxLength={30} required />
        </div>

        <div className="icon-field">
          <Mail className="icon-field__icon" size={16} />
          <input className="icon-field__input" type="email" placeholder="Email Address" value={form.email} onChange={update("email")} required />
        </div>

        <div className="icon-field">
          <Briefcase className="icon-field__icon" size={16} />
          <select className="icon-field__input icon-field__select" value={form.department} onChange={update("department")} required>
            <option value="" disabled>Select Department...</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="icon-field__chevron" size={16} />
        </div>

        <div className="icon-field">
          <User className="icon-field__icon" size={16} />
          <input className="icon-field__input" placeholder="User ID" value={form.userId} onChange={update("userId")} maxLength={15} required />
        </div>

        <div className="icon-field">
          <Lock className="icon-field__icon" size={16} />
          <input
            className="icon-field__input icon-field__input--pr"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={update("password")}
            minLength={6}
            maxLength={15}
            required
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
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            minLength={6}
            maxLength={15}
            required
          />
          <button type="button" className="icon-field__toggle" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle password visibility">
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="button-row" style={{ marginTop: 4 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating…" : "Sign Up"}</button>
          <button type="button" className="btn btn-secondary" onClick={clear}>Clear</button>
        </div>
      </form>
    </AuthCard>
  );
}
