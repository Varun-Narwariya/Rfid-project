// RevokeUser.js
import React, { useState } from "react";

const API = "http://localhost:8080";

export default function RevokeUser() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRevoke(e) {
    e.preventDefault();
    if (!uid.trim()) return setStatus({ type: "error", msg: "Please enter UID" });

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: `User revoked successfully (Tx: ${data.receipt.transactionHash})` });
        setUid("");
      } else {
        setStatus({ type: "error", msg: data.error || "Failed to revoke" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🧾 Revoke User Access</h2>
      <form onSubmit={handleRevoke} style={{ marginTop: 20 }}>
        <label>
          UID:
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter UID to revoke"
            style={{ marginLeft: 10, padding: 5, width: 250 }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginLeft: 15,
            padding: "6px 14px",
            backgroundColor: "#e63946",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loading ? "Revoking..." : "Revoke"}
        </button>
      </form>

      {status && (
        <div
          style={{
            marginTop: 20,
            color: status.type === "success" ? "green" : "red",
            fontWeight: 600,
          }}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
