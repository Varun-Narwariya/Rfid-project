import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DataContext } from "./DataContext";
import "./App.css";

const API_URL = "http://localhost:8080";

export default function Register() {
  const navigate = useNavigate();
  const { user } = useContext(DataContext);

  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [journeyTime, setJourneyTime] = useState("");
  const [checkpoint, setCheckpoint] = useState(user?.checkpoint || 1);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  // ========== 🧾 Register Function ==========
  const handleRegister = async () => {
    if (!uid.trim() || !name.trim() || !/^\d{12}$/.test(aadhar) || !journeyTime) {
      return alert("Please enter valid UID, name, Aadhaar (12 digits), and journey time (hours).");
    }

    setLoading(true);

    try {
      const payload = {
        uid,
        name,
        aadhar,
        journeyTime: parseInt(journeyTime) * 3600, // convert to seconds
        checkpoint: Number(checkpoint),
        role: user.role,
        address: user.address,
      };

      const res = await axios.post(`${API_URL}/registerUser`, payload);

      if (res.data.status === "ok") {
        alert(`✅ User ${name} registered successfully!`);
        setUid("");
        setName("");
        setAadhar("");
        setJourneyTime("");
        if (isAdmin) setCheckpoint(1);
        navigate("/dashboard");
      } else {
        alert(`⚠️ Registration failed: ${res.data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Registration failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ========== 🧱 UI ==========
  return (
    <div className="register-full">
      <div className="register-card">
        <h2>
          {isAdmin
            ? "Register Devotee (Admin)"
            : `Register Devotee (Checkpoint ${user?.checkpoint})`}
        </h2>

        {/* UID Input */}
        <input
          className="form-input"
          placeholder="UID (auto from scan)"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />

        {/* Name Input */}
        <input
          className="form-input"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Aadhaar Input */}
        <input
          className="form-input"
          placeholder="Aadhaar (12 digits)"
          value={aadhar}
          maxLength={12}
          onChange={(e) => setAadhar(e.target.value)}
        />

        {/* Journey Time Input */}
        <input
          className="form-input"
          placeholder="Journey time (hours)"
          type="number"
          value={journeyTime}
          onChange={(e) => setJourneyTime(e.target.value)}
        />

        {/* Checkpoint Selection */}
        {isAdmin ? (
          <select
            className="form-input"
            value={checkpoint}
            onChange={(e) => setCheckpoint(e.target.value)}
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
            value={`Checkpoint ${checkpoint}`}
            readOnly
            style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
          />
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            className="btn primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <button className="btn secondary" onClick={() => navigate("/dashboard")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
