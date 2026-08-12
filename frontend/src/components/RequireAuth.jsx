import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthProvider.jsx";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return <div style={{ padding: 40, textAlign: "center" }}>Checking session…</div>;
  }
  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}