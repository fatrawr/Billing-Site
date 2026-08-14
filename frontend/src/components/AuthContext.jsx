import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "authed" | "guest"
  const [user, setUser] = useState(null);

  const refresh = async () => {
    try {
      const data = await api.me();
      setUser(data);
      setStatus("authed");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ status, user, isAdmin: user?.role === "Admin", refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

const logout = async () => {
  try { await api.logout(); } catch { /* ignore */ }
  setUser(null);
  setStatus("guest");
};
// add `logout` to the context value:
<AuthContext.Provider value={{ status, user, isAdmin: user?.role === "Admin", refresh, logout }}></AuthContext.Provider>

export function useAuth() {
  return useContext(AuthContext);
}