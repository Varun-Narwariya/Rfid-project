// src/components/PendingPage.js
import React, { useContext, useEffect } from "react";
import { DataContext } from "../DataContext";

export default function PendingPage() {
  const { pending, setPending } = useContext(DataContext);

  useEffect(() => {
    // Listen for live updates from server
    const eventSource = new EventSource("http://localhost:8080/events");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.status === "not_registered") {
        // ✅ Add new pending UID if not already in list
        setPending((prev) => {
          const exists = prev.some((p) => p.uid === data.uid);
          return exists ? prev : [...prev, data];
        });
      } 
      else if (data.status === "registered" || data.status === "revoked") {
        // ❌ Remove from pending list when registered or revoked
        setPending((prev) => prev.filter((p) => p.uid !== data.uid));
      }
    };

    // Cleanup when component unmounts
    return () => eventSource.close();
  }, [setPending]);

  return (
    <div style={{ padding: 20 }}>
      <h2>⏳ Pending Registrations</h2>

      {pending.length === 0 ? (
        <p>No pending cards.</p>
      ) : (
        <ul>
          {pending.map((p) => (
            <li key={p.uid}>
              UID: <b>{p.uid}</b> at checkpoint <b>{p.checkpoint}</b> (time:{" "}
              {new Date(p.time).toLocaleString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
