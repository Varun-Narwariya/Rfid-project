// src/DataContext.js
import React, { createContext, useState, useEffect } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {
  const [stats, setStats] = useState({});
  const [pending, setPending] = useState([]);
  const [scans, setScans] = useState([]);

  // Persist between page reloads
  useEffect(() => {
    const saved = localStorage.getItem("temple-data");
    if (saved) {
      const { stats, pending, scans } = JSON.parse(saved);
      if (stats) setStats(stats);
      if (pending) setPending(pending);
      if (scans) setScans(scans);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("temple-data", JSON.stringify({ stats, pending, scans }));
  }, [stats, pending, scans]);

  return (
    <DataContext.Provider value={{ stats, setStats, pending, setPending, scans, setScans }}>
      {children}
    </DataContext.Provider>
  );
}
