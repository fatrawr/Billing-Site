import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import AuthShell from "../components/Authshell.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

const DEPARTMENTS = ["Electrical Engineering", "Admin", "Misc."];

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", department: "", userId: "",
    password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const clear = () =>
    setForm({ name: "", email: "", department: "", userId: "", password: "", confirmPassword: "" });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // if (form.name.trim().length < 5 || form.name.trim().length > 30)
    //   return setError("Name must be 5–30 characters.");
    // if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
    //   return setError("Enter a valid email (e.g. user@email.com).");
    // if (!form.department)
    //   return setError("Please select a department.");
    // if (form.userId.trim().length < 5 || form.userId.trim().length > 15 || !/^[a-zA-Z0-9]+$/.test(form.userId.trim()))
    //   return setError("User ID must be alphanumeric, 5–15 characters.");
    // if (form.password.length < 6 || form.password.length > 15)
    //   return setError("Password must be 6–15 characters.");
    // if (form.password !== form.confirmPassword)
    //   return setError("Passwords do not match.");

    try {
      await api.signup(form);
      notifySuccess("Account created successfully");
      navigate("/login");
    } catch (err) {
      setError(err.message);
      notifyError("Sign up failed", err.message);
    }
  };

  return (
    <AuthShell
      eyebrow="New Member"
      title="Create Account"
      footer={<Link className="back-link" to="/">Click here to go back</Link>}
    >
      {error && <div className="flash error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Full Name</label>
          <input value={form.name} onChange={update("name")} maxLength={30} required />
        </div>

        <div className="field">
          <label>Email Address</label>
          <input type="email" value={form.email} onChange={update("email")} required />
        </div>

        <div className="field">
          <label>Department</label>
          <select value={form.department} onChange={update("department")} required>
            <option value="" disabled>Select...</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>User ID</label>
          <input value={form.userId} onChange={update("userId")} maxLength={15} required />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            minLength={6}
            maxLength={15}
            required
          />
        </div>

        <div className="field">
          <label>Confirm Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            minLength={6}
            maxLength={15}
            required
          />
        </div>

        <div className="button-row">
          <button type="submit" className="btn btn-primary">Sign Up</button>
          <button type="button" className="btn btn-secondary" onClick={clear}>Clear</button>
        </div>
      </form>
    </AuthShell>
  );
}