import React, { useState } from "react";

const API = "http://localhost:8080";

export default function RevokeUser({ user }) {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  async function handleRevoke(e) {
    e.preventDefault();

    if (!uid.trim()) {
      return setStatus({ type: "error", msg: "⚠️ Please enter a valid UID." });
    }

    setLoading(true);
    setStatus(null);

    try {
      // 🔒 Local Admin Validation (optional server-side recheck)
      if (isLocalAdmin) {
        // Verify the UID actually belongs to a user under this checkpoint
        const res = await fetch(`${API}/registered`);
        const users = await res.json();
        const found = users.find((u) => u.uid === uid);

        if (!found) {
          setStatus({
            type: "error",
            msg: "❌ UID not found in registered users.",
          });
          setLoading(false);
          return;
        }

        if (Number(found.checkpoint) !== Number(user.checkpoint)) {
          setStatus({
            type: "error",
            msg: `⛔ You are not authorized to revoke users outside your checkpoint (${user.checkpoint}).`,
          });
          setLoading(false);
          return;
        }
      }

      // ✅ Proceed with revocation
      const res = await fetch(`${API}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();

      if (res.ok) {
        const txHash = data.receipt?.transactionHash || "N/A";
        setStatus({
          type: "success",
          msg: `✅ User ${uid} revoked successfully (Tx: ${txHash})`,
        });
        setUid("");
      } else {
        setStatus({
          type: "error",
          msg: data.error || "❌ Failed to revoke user.",
        });
      }
    } catch (err) {
      setStatus({ type: "error", msg: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>
        🧾 Revoke User Access{" "}
        {isLocalAdmin && (
          <span style={{ fontSize: "0.9em", color: "#777" }}>
            (Checkpoint {user.checkpoint})
          </span>
        )}
      </h2>

      <form onSubmit={handleRevoke} style={{ marginTop: 20 }}>
        <label>
          UID:
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter UID to revoke"
            style={{
              marginLeft: 10,
              padding: 5,
              width: 250,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginLeft: 15,
            padding: "6px 14px",
            backgroundColor: loading ? "#aaa" : "#e63946",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
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
            whiteSpace: "pre-line",
          }}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
