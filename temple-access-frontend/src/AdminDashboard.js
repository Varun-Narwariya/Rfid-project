// src/components/Dashboard.js  (or AdminDashboard.js if you prefer)
import React, { useContext, useState } from "react";
import { DataContext } from "../DataContext";
import UserGauges from "./UserGauges";
import UserManagement from "./UserManagement";

export default function Dashboard() {
  const { stats, pending, setPending } = useContext(DataContext);
  const [selectedUID, setSelectedUID] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <h1>🙏 Temple Admin Dashboard</h1>

      {/* Pending registrations */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 20, padding: 10, border: "1px solid orange" }}>
          <h2>Pending Registrations</h2>
          <ul>
            {pending.map((p) => (
              <li key={p.uid}>
                UID: <b>{p.uid}</b> at checkpoint <b>{p.checkpoint}</b>
                <button
                  onClick={() => setSelectedUID(p.uid)}
                  style={{ marginLeft: 10 }}
                >
                  Register
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedUID && (
        <UserManagement
          pendingUID={selectedUID}
          onRegistered={() => {
            setPending((prev) => prev.filter((p) => p.uid !== selectedUID));
            setSelectedUID(null);
          }}
        />
      )}

      {/* Show gauges */}
      <UserGauges stats={stats} />
    </div>
  );
}
