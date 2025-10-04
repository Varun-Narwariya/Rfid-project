// DataContext.js
import React, { createContext, useState } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {
  const [stats, setStats] = useState({});
  const [pending, setPending] = useState([]);
  const [scans, setScans] = useState([]);

  return (
    <DataContext.Provider value={{ stats, setStats, pending, setPending, scans, setScans }}>
      {children}
    </DataContext.Provider>
  );
}
