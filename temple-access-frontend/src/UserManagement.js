import React, { useState, useEffect } from "react";

export default function UserManagement({ pendingUID, onRegistered }) {
  const [form, setForm] = useState({
    uid: pendingUID || "",
    name: "",
    aadhar: "",
    journeyTime: "", // in hours
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, uid: pendingUID || "" }));
  }, [pendingUID]);

  const handleRegister = async () => {
    if (!form.name) {
      alert("⚠️ Please enter name");
      return;
    }
    if (!/^\d{12}$/.test(form.aadhar)) {
      alert("⚠️ Aadhaar number must be 12 digits");
      return;
    }
    if (!form.journeyTime || isNaN(form.journeyTime)) {
      alert("⚠️ Please enter valid journey time (hours)");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/registerUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === "ok") {
        alert("✅ User registered successfully!");
        onRegistered();
      } else {
        alert("❌ Registration failed: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ Error during registration");
    }
  };

  return (
    <div className="card">
      <h2>🆕 Pending Registration</h2>
      <p><b>UID:</b> {form.uid}</p>

      <input
        placeholder="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="form-input"
      />
      <input
        placeholder="Aadhaar (12 digits)"
        value={form.aadhar}
        onChange={(e) => setForm({ ...form, aadhar: e.target.value })}
        className="form-input"
        maxLength="12"
      />
      <input
        placeholder="Journey Time (hours)"
        value={form.journeyTime}
        onChange={(e) => setForm({ ...form, journeyTime: e.target.value })}
        className="form-input"
        type="number"
      />

      <div className="form-buttons">
        <button className="btn primary" onClick={handleRegister}>
          ✅ Register User
        </button>
      </div>
    </div>
  );
}
