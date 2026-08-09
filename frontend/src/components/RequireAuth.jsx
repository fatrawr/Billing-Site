import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api.js";

export default function RequireAuth({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(() => { if (!cancelled) setStatus("allowed"); })
      .catch(() => { if (!cancelled) setStatus("denied"); });
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div className="dashboard dashboard--narrow">
        <p className="dashboard__subtitle">Checking session…</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}