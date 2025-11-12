import React, { useEffect, useState } from "react";

export default function Devices({ user }) {
  const [devices, setDevices] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  useEffect(() => {
    async function loadDevices() {
      try {
        const devRes = await fetch("http://localhost:8080/devices");
        const devData = await devRes.json();

        const shareRes = await fetch("http://localhost:8080/deviceShares");
        const shareData = await shareRes.json();

        // ✅ Filter for Local Admin’s checkpoint
        if (isLocalAdmin) {
          const filteredDevices = devData.filter(
            (d) => Number(d.checkpointNumber) === Number(user.checkpoint)
          );

          const filteredShares = shareData.filter(
            (s) =>
              filteredDevices.some(
                (d) =>
                  d.deviceId === s.fromDevice || d.deviceId === s.toDevice
              )
          );

          setDevices(filteredDevices);
          setShares(filteredShares);
        } else {
          // Admin sees everything
          setDevices(devData);
          setShares(shareData);
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to load devices:", err);
        setLoading(false);
      }
    }

    loadDevices();
  }, [isLocalAdmin, isAdmin, user]);

  if (loading) return <div style={{ padding: 20 }}>⏳ Loading devices...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-3">
        {isAdmin
          ? "📡 All Registered Devices"
          : `📡 Devices for Checkpoint ${user.checkpoint}`}
      </h1>

      {devices.length === 0 ? (
        <p className="text-gray-600">
          {isLocalAdmin
            ? "No devices registered under your checkpoint yet."
            : "No devices registered in the system."}
        </p>
      ) : (
        <table
          className="min-w-full border text-sm"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th className="border px-3 py-2">Device ID</th>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Location</th>
              <th className="border px-3 py-2">Checkpoint</th>
              <th className="border px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={i} className="text-center">
                <td className="border px-3 py-2">{d.deviceId}</td>
                <td className="border px-3 py-2">{d.name}</td>
                <td className="border px-3 py-2">{d.location}</td>
                <td className="border px-3 py-2">{d.checkpointNumber}</td>
                <td className="border px-3 py-2">
                  {d.active ? (
                    <span style={{ color: "green", fontWeight: 600 }}>🟢 Active</span>
                  ) : (
                    <span style={{ color: "red", fontWeight: 600 }}>🔴 Revoked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ====================================== */}
      {/* 🔁 Data Transfer History Section */}
      {/* ====================================== */}
      <h2 className="text-lg font-bold mt-6 mb-3">Recent Data Transfers</h2>
      {shares.length === 0 ? (
        <p className="text-gray-600">No data transfers recorded yet.</p>
      ) : (
        <ul className="text-sm">
          {shares.map((s, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              <b>{s.fromDevice}</b> ➜ <b>{s.toDevice}</b>{" "}
              <span style={{ color: "#555" }}>
                (UID: {s.uid}, Data: {s.dataURI})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
