import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "./DataContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080";

export default function LocalDashboard() {
  const { user, scans, setScans, stats, setStats } = useContext(DataContext);
  const [localUsers, setLocalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkpointStats, setCheckpointStats] = useState({});
  const navigate = useNavigate();

  // ===============================
  // 🧩 Fetch checkpoint-specific users
  // ===============================
  useEffect(() => {
    async function fetchLocalData() {
      if (!user?.checkpoint) return;

      try {
        const res = await fetch(`${API_URL}/checkpoint/${user.checkpoint}`);
        const data = await res.json();
        setLocalUsers(data);
      } catch (err) {
        console.error("❌ Failed to load local checkpoint data:", err);
      }

      try {
        const statsRes = await fetch(`${API_URL}/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
        setCheckpointStats({ [user.checkpoint]: statsData[user.checkpoint] || 0 });
      } catch (err) {
        console.error("❌ Failed to load stats:", err);
      }

      setLoading(false);
    }

    fetchLocalData();

    // ✅ Live updates through SSE
    const eventSource = new EventSource(`${API_URL}/events`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // Update scans and stats dynamically
        setScans((prev) => [data, ...prev].slice(0, 200));

        if (data.status === "registered" && data.checkpoint === user.checkpoint) {
          setLocalUsers((prev) => [data, ...prev]);
          setCheckpointStats((prev) => ({
            ...prev,
            [user.checkpoint]: (prev[user.checkpoint] || 0) + 1,
          }));
        }

        if (data.status === "revoked") {
          setLocalUsers((prev) => prev.filter((u) => u.uid !== data.uid));
        }
      } catch (err) {
        console.warn("SSE parse error:", err);
      }
    };

    return () => eventSource.close();
  }, [user, setStats, setScans]);

  if (!user) return <div style={{ padding: 20 }}>⚠️ Not logged in.</div>;

  if (loading)
    return <div style={{ padding: 20 }}>⏳ Loading local dashboard...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>🏛️ Local Admin Dashboard</h1>
      <h3>
        Checkpoint: <span style={{ color: "darkblue" }}>{user.checkpoint}</span>
      </h3>
      <p style={{ color: "#666" }}>Role: Local Admin ({user.address})</p>

      {/* ============================ */}
      {/* 🔹 Quick Stats */}
      {/* ============================ */}
      <div className="kpis" style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div className="card">
          <div className="kpi-title">Active Users</div>
          <div className="kpi-value">
            {checkpointStats[user.checkpoint] || 0}
          </div>
        </div>
        <div className="card">
          <div className="kpi-title">Recent Scans</div>
          <div className="kpi-value">
            {scans.filter((s) => s.checkpoint === user.checkpoint).length}
          </div>
        </div>
      </div>

      {/* ============================ */}
      {/* 👥 Users in Checkpoint */}
      {/* ============================ */}
      <div className="card" style={{ marginTop: 30 }}>
        <h3>👥 Users at Checkpoint {user.checkpoint}</h3>

        {localUsers.length === 0 ? (
          <p>No users currently registered at this checkpoint.</p>
        ) : (
          <table
            className="min-w-full border text-sm"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead style={{ backgroundColor: "#f0f0f0" }}>
              <tr>
                <th className="border px-3 py-2">UID</th>
                <th className="border px-3 py-2">Name</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {localUsers.map((u, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2">{u.uid}</td>
                  <td className="border px-3 py-2">{u.name}</td>
                  <td className="border px-3 py-2">
                    {u.status === "revoked" ? (
                      <span style={{ color: "red" }}>Revoked</span>
                    ) : (
                      <span style={{ color: "green" }}>Active</span>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {new Date(u.time).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================ */}
      {/* 🧾 Actions */}
      {/* ============================ */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 30,
          justifyContent: "center",
        }}
      >
        <button
          className="btn primary"
          onClick={() => navigate("/register")}
        >
          ➕ Register New User
        </button>

        <button
          className="btn secondary"
          onClick={() => navigate("/revoke")}
        >
          🚫 Revoke User
        </button>
      </div>
    </div>
  );
}
