import React, { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, registerRequest, verifyOtpRequest } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("kaintlook_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("kaintlook_user"); }
    }
    setLoading(false);
  }, []);

  const persist = (userData) => {
    setUser(userData);
    localStorage.setItem("kaintlook_user", JSON.stringify(userData));
  };

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    persist(data);
    return data;
  };

  // Register no longer logs the user in — it just sends the signup OTP.
  // The caller (Register page) should route to the OTP screen next.
  const register = async (name, email, password) => {
    return registerRequest(name, email, password);
  };

  // Confirms the signup OTP and logs the user in (backend returns a token).
  const verifyOtp = async (email, otp) => {
    const data = await verifyOtpRequest(email, otp);
    persist(data);
    return data;
  };

  // Merges new fields (e.g. from a profile update) into the stored user
  // without touching the token, which the update response doesn't include.
  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("kaintlook_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kaintlook_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
