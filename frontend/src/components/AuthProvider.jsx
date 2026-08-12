import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(() => { if (!cancelled) setStatus("allowed"); })
      .catch(() => { if (!cancelled) setStatus("denied"); });
    return () => { cancelled = true; };
  }, []); // only runs once, on app load

  return (
    <AuthContext.Provider value={{ status, setStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}