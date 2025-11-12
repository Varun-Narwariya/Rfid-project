// src/components/Dashboard.js

import React, { useContext } from "react";
import { DataContext } from "../DataContext";

export default function Dashboard({ user }) {
  const { scans, stats, pending } = useContext(DataContext);

  // Safety checks
  if (!user) return <div>⚠️ Please log in first.</div>;

  const isAdmin = user.role === "owner";
  const isLocalAdmin = user.role === "local_admin";

  // ================================
  // 🧩 Data Filtering for Local Admin
  // ================================
  const filteredScans = isAdmin
    ? scans
    : scans.filter((s) => Number(s.checkpoint) === Number(user.checkpoint));

  const checkpointCount = isAdmin
    ? Object.keys(stats).length
    : stats[user.checkpoint]
    ? 1
    : 0;

  const registeredCount = filteredScans.filter((s) => s.status === "registered").length;

  const pendingCount = isAdmin
    ? pending.length
    : pending.filter((p) => Number(p.checkpoint) === Number(user.checkpoint)).length;

  // ================================
  // 🧾 Render
  // ================================
  return (
    <div className="dashboard-grid">
      {/* === KPI Cards === */}
      <div className="kpis">
        <div className="kpi card">
          <div className="kpi-title">Registered</div>
          <div className="kpi-value">{registeredCount}</div>
        </div>

        <div className="kpi card">
          <div className="kpi-title">Pending</div>
          <div className="kpi-value">{pendingCount}</div>
        </div>

        <div className="kpi card">
          <div className="kpi-title">Active Journeys</div>
          <div className="kpi-value">{registeredCount}</div>
        </div>

        <div className="kpi card">
          <div className="kpi-title">Checkpoints</div>
          <div className="kpi-value">{checkpointCount}</div>
        </div>
      </div>

      {/* === Recent Events Section === */}
      <div className="card">
        <h3>
          Recent Events{" "}
          {isLocalAdmin && (
            <span style={{ fontSize: "0.8em", color: "#666" }}>
              (Checkpoint {user.checkpoint})
            </span>
          )}
        </h3>
        <div className="events-list">
          {filteredScans.length === 0 ? (
            <p style={{ color: "#888" }}>No events recorded yet.</p>
          ) : (
            filteredScans.slice(0, 30).map((s, i) => (
              <div
                key={i}
                className={`event-row ${
                  s.status === "registered"
                    ? "ok"
                    : s.status === "suspect"
                    ? "warn"
                    : "neutral"
                }`}
              >
                <div>
                  <b>{s.uid}</b> {s.name ? `(${s.name})` : ""}
                </div>
                <div>
                  CP-{s.checkpoint} — {new Date(s.time).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === Optional Admin-Only Pending List === */}
      {isAdmin && pending.length > 0 && (
        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Pending Users</h3>
          {pending.slice(0, 10).map((p, idx) => (
            <div key={idx} className="pending-item">
              <b>{p.uid}</b> at Checkpoint {p.checkpoint} ({p.deviceId})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
