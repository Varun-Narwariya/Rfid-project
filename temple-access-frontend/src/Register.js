import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";

const API_URL = "http://localhost:8080";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const uid = queryParams.get("uid");
  const checkpoint = queryParams.get("checkpoint");

  const [name, setName] = useState("");
  const [aadhar, setAadhar] = useState("");

  const handleRegister = async () => {
    if (!name) {
      alert("⚠️ Please enter a name");
      return;
    }
    if (!/^\d{12}$/.test(aadhar)) {
      alert("⚠️ Aadhaar number must be exactly 12 digits");
      return;
    }

    try {
      await axios.post(`${API_URL}/registerUser`, {
        uid,
        name,
        aadhar,
        checkpoint,
      });
      alert(`✅ User ${name} registered successfully!`);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("❌ Error registering user");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Register New User</h2>

        <div className="uid-display">
          <p>
            UID: <span>{uid}</span>
          </p>
          <p>
            Checkpoint: <span>{checkpoint}</span>
          </p>
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          className="form-input"
          placeholder="Enter Aadhaar Number (12 digits)"
          value={aadhar}
          onChange={(e) => setAadhar(e.target.value)}
          maxLength="12"
        />

        <div className="form-buttons">
          <button className="btn primary" onClick={handleRegister}>
            Register
          </button>
          <button className="btn secondary" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
