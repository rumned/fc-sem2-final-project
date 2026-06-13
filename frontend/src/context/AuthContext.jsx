import { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");
    if (token && saved) {
      try { setUser(JSON.parse(saved)); }
      catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const _persist = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ── Real API calls ──────────────────────────────────────────────────────
  // Both throw on failure so callers can catch and show error messages.

  const loginWithCredentials = async (email, password) => {
    const { user: u, token } = await authApi.login(email, password);
    _persist({ id: u._id || u.id, name: u.name, email: u.email, role: u.role }, token);
  };

  const registerWithCredentials = async (name, email, password) => {
    const { user: u, token } = await authApi.register(name, email, password);
    _persist({ id: u._id || u.id, name: u.name, email: u.email, role: u.role }, token);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginWithCredentials, registerWithCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
