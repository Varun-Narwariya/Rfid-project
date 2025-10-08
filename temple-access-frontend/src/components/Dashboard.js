// src/Dashboard.js - THE SIMPLIFIED DISPLAY COMPONENT

import React, { useContext } from "react";
import DonutChart from "./DonutChart";
import UserGauges from "./UserGauges";
import { DataContext } from "../DataContext"; // 1. Import the context

export default function Dashboard() {
  // 2. Get the state values from the global context
  const { scans, stats, pending } = useContext(DataContext);

  // 3. The entire JSX body can stay exactly the same!
  // It already uses variables named scans, stats, and pending.
  return (
    <div className="dashboard-grid">
      <div className="kpis">
        <div className="kpi card">
          <div className="kpi-title">Registered</div>
          <div className="kpi-value">{scans.filter(s => s.status === "registered").length}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">Pending</div>
          <div className="kpi-value">{pending.length}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">Active Journeys</div>
          <div className="kpi-value">{scans.filter(s => s.status === "registered").length}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">Checkpoints</div>
          <div className="kpi-value">{Object.keys(stats).length}</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="card wide">
          <h3>Checkpoint Distribution</h3>
          <DonutChart data={stats} />
        </div>
        <div className="card">
          <h3>Live People by Checkpoint</h3>
          <UserGauges stats={stats} />
        </div>
      </div>

      <div className="card">
        <h3>Recent Events</h3>
        <div className="events-list">
          {scans.slice(0, 30).map((s, i) => (
            <div key={i} className={`event-row ${s.status === "registered" ? "ok" : "warn"}`}>
              <div><b>{s.uid}</b> {s.name ? `(${s.name})` : ""}</div>
              <div>{s.checkpoint} — {new Date(s.time).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}