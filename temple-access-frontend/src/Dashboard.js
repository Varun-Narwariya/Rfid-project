import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Dashboard() {
  const [scans, setScans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await axios.get("http://localhost:8080/scans");
        setScans(res.data);

        // Check last scan
        if (res.data.length > 0) {
          const lastScan = res.data[res.data.length - 1];
          if (lastScan.status === "not_registered") {
            navigate("/register", { state: { uid: lastScan.uid } });
          }
        }
      } catch (err) {
        console.error("Error fetching scans", err);
      }
    };

    const interval = setInterval(fetchScans, 2000); // check every 2s
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="container">
      <header>
        <h1>Temple Access Dashboard</h1>
      </header>

      <div className="table-section">
        <h2>Scanned Users</h2>
        <table className="scan-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Name</th>
              <th>Aadhar</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => (
              <tr
                key={i}
                className={scan.status === "registered" ? "registered" : "not-registered"}
              >
                <td>{scan.uid}</td>
                <td>{scan.name || "N/A"}</td>
                <td>{scan.aadhar || "N/A"}</td>
                <td>{scan.status}</td>
                <td>{new Date(scan.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
