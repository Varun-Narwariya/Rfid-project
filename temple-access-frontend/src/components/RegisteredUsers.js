import React, { useEffect, useState } from "react";

export default function RegisteredUsers() {
  const [users, setUsers] = useState([]);

  // 🧩 Fetch registered users initially
  useEffect(() => {
    fetch("http://localhost:8080/registered")
      .then((res) => res.json())
      .then((data) => {
        const enhanced = data.map((u) => ({
          ...u,
          remainingSeconds: Math.max(
            0,
            Math.floor(u.journeyExpiry - Date.now() / 1000)
          ),
        }));
        setUsers(enhanced);
      })
      .catch((err) => console.error("Error loading registered users:", err));

    // 🛰️ Listen to live updates via SSE
    const eventSource = new EventSource("http://localhost:8080/events");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("🔄 SSE Event:", data);

      if (data.status === "registered") {
        // ✅ Add new user if not already in list
        setUsers((prev) => {
          const exists = prev.find((u) => u.uid === data.uid);
          if (exists) return prev;
          const expiry = data.journeyExpiry || Math.floor(Date.now() / 1000) + 60;
          return [
            ...prev,
            {
              ...data,
              remainingSeconds: expiry - Math.floor(Date.now() / 1000),
            },
          ];
        });
      }

      // ❌ Handle revoked OR auto-revoked OR expired events
      else if (
        data.status === "revoked" ||
        data.status === "auto-revoked" ||
        data.status === "expired"
      ) {
        setUsers((prev) => prev.filter((u) => u.uid !== data.uid));
      }
    };

    return () => eventSource.close();
  }, []);

  // 🕒 Countdown timer for expiry
  useEffect(() => {
    const timer = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => {
          const next = u.remainingSeconds > 0 ? u.remainingSeconds - 1 : 0;
          return { ...u, remainingSeconds: next };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 🧮 Format seconds → d:h:m:s
  const formatTime = (secs) => {
    if (secs <= 0) return "⛔ Expired";
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📜 Registered Users</h2>

      {users.length === 0 ? (
        <p>No registered users yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th>UID</th>
              <th>Name</th>
              <th>Checkpoint</th>
              <th>Journey Expiry</th>
              <th>Remaining Time</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.uid}</td>
                <td>{u.name}</td>
                <td>{u.checkpoint || "N/A"}</td>
                <td>
                  {u.journeyExpiry
                    ? new Date(u.journeyExpiry * 1000).toLocaleString()
                    : "N/A"}
                </td>
                <td
                  style={{
                    color: u.remainingSeconds <= 60 ? "red" : "green",
                    fontWeight: "bold",
                  }}
                >
                  {formatTime(u.remainingSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
