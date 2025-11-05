// src/Devices.js
import React, { useEffect, useState } from "react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [shares, setShares] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/devices")
      .then((r) => r.json())
      .then(setDevices);

    fetch("http://localhost:8080/deviceShares")
      .then((r) => r.json())
      .then(setShares);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-3">Registered Devices</h1>
      <table className="min-w-full border">
        <thead>
          <tr><th>Device ID</th><th>Name</th><th>Location</th><th>Status</th></tr>
        </thead>
        <tbody>
          {devices.map((d, i) => (
            <tr key={i}>
              <td>{d.deviceId}</td>
              <td>{d.name}</td>
              <td>{d.location}</td>
              <td>{d.active ? "🟢 Active" : "🔴 Revoked"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-bold mt-6 mb-3">Recent Data Transfers</h2>
      <ul>
        {shares.map((s, i) => (
          <li key={i}>
            {s.fromDevice} ➜ {s.toDevice} for UID {s.uid} ({s.dataURI})
          </li>
        ))}
      </ul>
    </div>
  );
}
