// AdminDashboard.js
import React, { useState, useEffect } from "react";
import UserGauges from "./UserGauges";
import UserManagement from "./UserManagement";

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);   // multiple pending UIDs
  const [selectedUID, setSelectedUID] = useState(null); // admin chooses one UID to register
  const [stats, setStats] = useState({});
  const [scans, setScans] = useState([]);

  // Live SSE feed (single listener)
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/events");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("New event:", data);

      // If card is not registered yet → push to pending
      if (data.status === "not_registered") {
        setPending((prev) => {
          if (prev.find((p) => p.uid === data.uid)) return prev; // avoid duplicates
          return [...prev, data];
        });
      }

      // Update scan logs
      setScans((prev) => [...prev, data]);

      // Update stats
      if (data.checkpoint) {
        setStats((prev) => ({
          ...prev,
          [data.checkpoint]: (prev[data.checkpoint] || 0) + 1,
        }));
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🙏 Temple Admin Dashboard</h1>

      {/* Pending registrations list */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 20, padding: 10, border: "1px solid orange" }}>
          <h2>Pending Registrations</h2>
          <ul>
            {pending.map((p) => (
              <li key={p.uid} style={{ marginBottom: 10 }}>
                UID: <b>{p.uid}</b> at checkpoint <b>{p.checkpoint}</b>
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => setSelectedUID(p.uid)}
                >
                  Register
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show registration form when admin selects UID */}
      {selectedUID && (
        <UserManagement
          pendingUID={selectedUID}
          onRegistered={() => {
            setPending((prev) => prev.filter((p) => p.uid !== selectedUID)); // remove from pending list
            setSelectedUID(null);
          }}
        />
      )}

      {/* Stats + Gauges */}
      <UserGauges stats={stats} />
    </div>
  );
}
