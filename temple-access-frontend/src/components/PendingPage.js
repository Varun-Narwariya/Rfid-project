import React, { useContext, useEffect } from "react";
import { DataContext } from "../DataContext";

export default function PendingPage({ user }) {
  const { pending, setPending } = useContext(DataContext);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/events");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.status === "not_registered") {
        // ✅ Add new pending UID if not already present
        setPending((prev) => {
          const exists = prev.some((p) => p.uid === data.uid);
          return exists ? prev : [...prev, data];
        });
      } else if (data.status === "registered" || data.status === "revoked") {
        // ❌ Remove from pending list
        setPending((prev) => prev.filter((p) => p.uid !== data.uid));
      }
    };

    return () => eventSource.close();
  }, [setPending]);

  // ===============================
  // 🔍 Filter pending for Local Admin
  // ===============================
  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  const visiblePending = isAdmin
    ? pending
    : pending.filter(
        (p) => Number(p.checkpoint) === Number(user?.checkpoint)
      );

  return (
    <div style={{ padding: 20 }}>
      <h2>
        ⏳ Pending Registrations{" "}
        {isLocalAdmin && (
          <span style={{ fontSize: "0.9em", color: "#777" }}>
            (Checkpoint {user.checkpoint})
          </span>
        )}
      </h2>

      {visiblePending.length === 0 ? (
        <p>No pending UIDs at this checkpoint.</p>
      ) : (
        <ul>
          {visiblePending.map((p) => (
            <li key={p.uid}>
              UID: <b>{p.uid}</b> — Checkpoint <b>{p.checkpoint}</b> — Device{" "}
              <b>{p.deviceId || "Unknown"}</b> —{" "}
              <span>{new Date(p.time).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
