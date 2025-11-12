import React, { createContext, useState, useEffect } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {
  // =========================
  // 🧠 Global State Variables
  // =========================
  const [stats, setStats] = useState({});
  const [pending, setPending] = useState([]);
  const [scans, setScans] = useState([]);

  // ✅ New: Logged-in user (Admin or Local Admin)
  const [user, setUser] = useState(null);

  // =========================
  // 💾 Load from localStorage
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("temple-data");
    if (saved) {
      try {
        const { stats, pending, scans, user } = JSON.parse(saved);
        if (stats) setStats(stats);
        if (pending) setPending(pending);
        if (scans) setScans(scans);
        if (user) setUser(user);
      } catch (err) {
        console.warn("⚠️ Failed to load local data:", err);
      }
    }
  }, []);

  // =========================
  // 💽 Persist to localStorage
  // =========================
  useEffect(() => {
    localStorage.setItem(
      "temple-data",
      JSON.stringify({ stats, pending, scans, user })
    );
  }, [stats, pending, scans, user]);

  // =========================
  // 🚀 Auth Handlers
  // =========================
  function login(userInfo) {
    setUser(userInfo);
    localStorage.setItem(
      "temple-data",
      JSON.stringify({ stats, pending, scans, user: userInfo })
    );
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("temple-data");
  }

  // =========================
  // 🌐 Provider Return
  // =========================
  return (
    <DataContext.Provider
      value={{
        stats,
        setStats,
        pending,
        setPending,
        scans,
        setScans,
        user,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
