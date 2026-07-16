import { createContext, useContext, useState } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize straight from localStorage, so a page refresh doesn't log the user out
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function persistSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function register(email, password) {
    const { data } = await axiosClient.post("/auth/register", { email, password });
    persistSession(data);
  }

  async function login(email, password) {
    const { data } = await axiosClient.post("/auth/login", { email, password });
    persistSession(data);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// A small hook so components just call useAuth() instead of importing
// useContext + AuthContext everywhere
export function useAuth() {
  return useContext(AuthContext);
}