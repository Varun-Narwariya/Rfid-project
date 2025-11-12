import React, { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext";

export default function UserManagement({ pendingUID, onRegistered }) {
  const { user } = useContext(DataContext);
  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  const [form, setForm] = useState({
    uid: pendingUID || "",
    name: "",
    aadhar: "",
    journeyTime: "",
    checkpoint: user?.checkpoint || 1,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, uid: pendingUID || "" }));
  }, [pendingUID]);

  const handleRegister = async () => {
    const { uid, name, aadhar, journeyTime, checkpoint } = form;

    // === 🧾 Basic Validation ===
    if (!name.trim()) return alert("⚠️ Please enter full name");
    if (!/^\d{12}$/.test(aadhar))
      return alert("⚠️ Aadhaar must be exactly 12 digits");
    if (!journeyTime || isNaN(journeyTime))
      return alert("⚠️ Please enter valid journey time (in hours)");
    if (!uid.trim()) return alert("⚠️ Missing UID — scan first");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/registerUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name,
          aadhar,
          journeyTime: parseInt(journeyTime) * 3600, // convert hours → seconds
          checkpoint: Number(checkpoint),
          role: user.role,
          address: user.address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "UID already registered") {
          alert("⚠️ This UID is already registered!");
        } else {
          alert("❌ Registration failed: " + data.error);
        }
        return;
      }

      alert("✅ User registered successfully!");
      onRegistered?.(); // refresh parent list
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20, marginTop: 10 }}>
      <h2>🆕 Register Pending User</h2>
      <p>
        <b>UID:</b> {form.uid || "—"}
      </p>

      {/* Full Name */}
      <input
        placeholder="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="form-input"
      />

      {/* Aadhaar */}
      <input
        placeholder="Aadhaar (12 digits)"
        value={form.aadhar}
        onChange={(e) => setForm({ ...form, aadhar: e.target.value })}
        className="form-input"
        maxLength="12"
      />

      {/* Journey Time */}
      <input
        placeholder="Journey Time (hours)"
        value={form.journeyTime}
        onChange={(e) => setForm({ ...form, journeyTime: e.target.value })}
        className="form-input"
        type="number"
      />

      {/* Checkpoint */}
      {isAdmin ? (
        <select
          className="form-input"
          value={form.checkpoint}
          onChange={(e) => setForm({ ...form, checkpoint: e.target.value })}
        >
          <option value="">Select checkpoint</option>
          <option value="1">Checkpoint 1</option>
          <option value="2">Checkpoint 2</option>
          <option value="3">Checkpoint 3</option>
          <option value="4">Checkpoint 4</option>
        </select>
      ) : (
        <input
          className="form-input"
          value={`Checkpoint ${form.checkpoint}`}
          readOnly
          style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
        />
      )}

      <div className="form-buttons" style={{ marginTop: 10 }}>
        <button
          className="btn primary"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Registering..." : "✅ Register User"}
        </button>
      </div>
    </div>
  );
}
