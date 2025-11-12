import React, { useState } from "react";

const API = "http://localhost:8080";

export default function RegisterLocalAdmin() {
  const [adminAddress, setAdminAddress] = useState("");
  const [checkpoint, setCheckpoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [checkResult, setCheckResult] = useState(null);

  // ✅ Register a new local admin
  const handleRegister = async () => {
    if (!adminAddress || !checkpoint) {
      return setError("Please fill in both fields.");
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API}/addLocalAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminAddress,
          checkpoint: parseInt(checkpoint),
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to register admin");
      setResponse(data);
      setCheckResult(null);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Revoke local admin
  const handleRevoke = async () => {
    if (!adminAddress) return setError("Enter admin address to revoke");

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API}/revokeLocalAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminAddress }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke admin");
      setResponse(data);
      setCheckResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Check admin info
  const handleCheck = async () => {
    if (!adminAddress) return setError("Enter admin address to check");

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API}/getLocalAdmin/${adminAddress}`);
      const data = await res.json();
      setCheckResult(data);
      setResponse(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 700, margin: "auto" }}>
      <h1>👤 Register / Manage Local Admin</h1>
      <p>
        Only the main admin (contract owner) can add, revoke, or check local
        admins.
      </p>

      {/* 🧩 Input fields */}
      <div style={{ marginTop: 20 }}>
        <label>Local Admin Wallet Address:</label>
        <input
          type="text"
          value={adminAddress}
          onChange={(e) => setAdminAddress(e.target.value)}
          placeholder="0x1234..."
          style={{
            width: "100%",
            marginTop: 5,
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Assign Checkpoint (only for adding):</label>
        <input
          type="number"
          value={checkpoint}
          onChange={(e) => setCheckpoint(e.target.value)}
          placeholder="e.g., 1"
          style={{
            width: "100%",
            marginTop: 5,
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </div>

      {/* 🧩 Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#4caf50",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ➕ Add Local Admin
        </button>

        <button
          onClick={handleRevoke}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#f44336",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          🚫 Revoke Local Admin
        </button>

        <button
          onClick={handleCheck}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#2196f3",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          🔍 Check
        </button>
      </div>

      {/* 🧩 Output */}
      {loading && <p>⏳ Processing...</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {response && (
        <div
          style={{
            background: "#f0f0f0",
            padding: 10,
            marginTop: 20,
            borderRadius: 6,
          }}
        >
          <h3>✅ Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      {checkResult && (
        <div
          style={{
            background: "#f9f9f9",
            padding: 10,
            marginTop: 20,
            borderRadius: 6,
          }}
        >
          <h3>📋 Admin Info:</h3>
          <pre>{JSON.stringify(checkResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
