import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireAuth() {
  const { status } = useAuth();

  if (status === "checking") {
    return <div className="dashboard dashboard--narrow"><p className="dashboard__subtitle">Checking session…</p></div>;
  }
  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}