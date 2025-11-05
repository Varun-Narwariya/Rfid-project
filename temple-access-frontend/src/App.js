// src/App.js
import React, { useEffect, useContext, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DataContext } from "./DataContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Register from "./Register";
import PendingPage from "./components/PendingPage";
import RevokeUser from "./components/RevokeUser";
import RegisteredUsers from "./components/RegisteredUsers";
import BroadcastListener from "./components/BroadcastListener"; // optional visual alert component
import RegisteredDevices from "./RegisteredDevices";

const API = "http://localhost:8080";

function App() {
  const { setScans, setStats, setPending } = useContext(DataContext);
  const [broadcastMessage, setBroadcastMessage] = useState(null);

  useEffect(() => {
    const es = new EventSource(`${API}/events`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("🔔 SSE Event Received:", data);

        // ✅ Handle broadcast messages (disaster, emergency, etc.)
        if (data.type === "broadcast") {
          setBroadcastMessage(data.message || "⚠️ Emergency Alert!");
          alert(`🚨 Broadcast Message: ${data.message}`);
          return; // stop further handling for broadcast events
        }

        // ✅ Handle revocation
        if (data.status === "revoked") {
          setScans((prev) => prev.filter((scan) => scan.uid !== data.uid));
          setPending((prev) => prev.filter((p) => p.uid !== data.uid));

          setStats((prev) => {
            const updated = { ...prev };
            for (const cp in updated) {
              updated[cp] = Math.max((updated[cp] || 0) - 1, 0);
            }
            return updated;
          });
        }

        // ✅ Handle new registration
        if (data.status === "registered") {
          setStats((prev) => ({
            ...prev,
            [data.checkpoint]: (prev[data.checkpoint] || 0) + 1,
          }));
        }

        // ✅ Handle not registered (pending)
        if (data.status === "not_registered") {
          setPending((prev) => {
            if (prev.find((p) => p.uid === data.uid)) return prev;
            return [data, ...prev].slice(0, 50);
          });
        }

        // ✅ Add to recent scans
        setScans((prev) => [data, ...prev].slice(0, 200));
      } catch (err) {
        console.error("❌ SSE parse error:", err);
      }
    };

    es.onerror = (err) => console.error("⚠️ SSE connection error:", err);

    return () => es.close();
  }, [setScans, setStats, setPending]);

  // Fetch initial stats
  useEffect(() => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((err) => console.error("Failed to fetch initial stats:", err));
  }, [setStats]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "20px" }}>
        {/* ✅ Optional Broadcast Banner */}
        {broadcastMessage && (
          <div
            style={{
              backgroundColor: "red",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
              fontWeight: "bold",
              textAlign: "center",
              animation: "pulse 1s infinite alternate",
            }}
          >
            🚨 {broadcastMessage}
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/revoke" element={<RevokeUser />} />
          <Route path="/registered" element={<RegisteredUsers />} />
          <Route path="/broadcast" element={<BroadcastListener />} />
          <Route path="/RegisteredDevices" element={<RegisteredDevices />} />
        </Routes>

        {/* Optional visual listener */}
        <BroadcastListener message={broadcastMessage} />
      </main>
    </div>
  );
}

export default App;
