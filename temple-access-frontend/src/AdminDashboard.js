import React, { useContext, useState } from "react";
import { DataContext } from "../DataContext";
import UserGauges from "./UserGauges";
import UserManagement from "./UserManagement";

export default function AdminDashboard({ user }) {
  const { stats, pending, setPending } = useContext(DataContext);
  const [selectedUID, setSelectedUID] = useState(null);

  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  // ✅ Filter pending for local admins
  const visiblePending = isAdmin
    ? pending
    : pending.filter((p) => Number(p.checkpoint) === Number(user?.checkpoint));

  return (
    <div style={{ padding: 20 }}>
      <h1>
        🙏{" "}
        {isAdmin
          ? "Temple Admin Dashboard"
          : `Local Admin Dashboard (Checkpoint ${user.checkpoint})`}
      </h1>

      {/* ========================== */}
      {/* 🔔 Pending Registrations */}
      {/* ========================== */}
      {visiblePending.length > 0 ? (
        <div
          style={{
            marginBottom: 20,
            padding: 10,
            border: "1px solid orange",
            borderRadius: 8,
            backgroundColor: "#fff8e1",
          }}
        >
          <h2>Pending Registrations</h2>
          <ul>
            {visiblePending.map((p) => (
              <li key={p.uid} style={{ marginBottom: 8 }}>
                UID: <b>{p.uid}</b> at checkpoint <b>{p.checkpoint}</b>{" "}
                <button
                  onClick={() => setSelectedUID(p.uid)}
                  style={{
                    marginLeft: 10,
                    backgroundColor: "#0277bd",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Register
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: "#666" }}>
          {isAdmin
            ? "No pending registrations."
            : "No pending registrations at your checkpoint."}
        </p>
      )}

      {/* ========================== */}
      {/* 🧾 User Registration Section */}
      {/* ========================== */}
      {selectedUID && (
        <UserManagement
          user={user} // Pass user info so UserManagement knows role/checkpoint
          pendingUID={selectedUID}
          onRegistered={() => {
            setPending((prev) => prev.filter((p) => p.uid !== selectedUID));
            setSelectedUID(null);
          }}
        />
      )}

      {/* ========================== */}
      {/* 📊 Gauge Stats Section */}
      {/* ========================== */}
      <UserGauges
        stats={
          isAdmin
            ? stats
            : Object.fromEntries(
                Object.entries(stats).filter(
                  ([cp]) => Number(cp) === Number(user.checkpoint)
                )
              )
        }
      />
    </div>
  );
}
