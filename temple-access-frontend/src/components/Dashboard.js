import React, { useEffect, useState } from "react";
import DonutChart from "./DonutChart";
import UserGauges from "./UserGauges";

const API = "http://localhost:8080";

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({});
  const [pending, setPending] = useState([]);

  useEffect(() => {
    // SSE for live events
    const es = new EventSource(`${API}/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setScans(prev => [data, ...prev].slice(0, 200));
        // update stats
        setStats(prev => ({ ...prev, [data.checkpoint]: (prev[data.checkpoint] || 0) + (data.status==="registered"?1:0) }));
        if (data.status === "not_registered") {
          setPending(prev => [data, ...prev].slice(0,50));
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };
    es.onerror = (err) => console.error("SSE error", err);
    return () => es.close();
  }, []);

  // initial stats fetch
  useEffect(()=> {
    fetch(`${API}/stats`).then(r=>r.json()).then(setStats).catch(()=>{});
  }, []);

  return (
    <div className="dashboard-grid">
      <div className="kpis">
        <div className="kpi card">
          <div className="kpi-title">Registered</div>
          <div className="kpi-value">{scans.filter(s=>s.status==="registered").length}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">Pending</div>
          <div className="kpi-value">{pending.length}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">Active Journeys</div>
          <div className="kpi-value">{scans.filter(s=>s.status==="registered").length}</div>
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
          {scans.slice(0,30).map((s, i) => (
            <div key={i} className={`event-row ${s.status==="registered"?"ok":"warn"}`}>
              <div><b>{s.uid}</b> {s.name ? `(${s.name})` : ""}</div>
              <div>{s.checkpoint} — {new Date(s.time).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
