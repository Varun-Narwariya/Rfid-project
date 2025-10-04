// PendingPage.js
import React, { useEffect, useState } from "react";

export default function PendingPage() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/pending")
      .then((res) => res.json())
      .then((data) => setPending(data))
      .catch((err) => console.error("Error loading pending:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>⏳ Pending Registrations</h2>
      {pending.length === 0 ? (
        <p>No pending cards.</p>
      ) : (
        <ul>
          {pending.map((p) => (
            <li key={p.uid}>
              UID: <b>{p.uid}</b> at checkpoint {p.checkpoint} (time: {p.time})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
