import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_URL = "http://localhost:8080";

export default function Register() {
  const navigate = useNavigate();
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [journeyTime, setJourneyTime] = useState("");

  const handleRegister = async () => {
    if (!name || !/^\d{12}$/.test(aadhar) || !journeyTime) {
      return alert("Enter valid name, Aadhaar (12 digits) and journey time (hours).");
    }
    try {
      await axios.post(`${API_URL}/registerUser`, {
        uid, name, aadhar, journeyTime: parseInt(journeyTime) * 3600, // send seconds
      });
      alert("User registered");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };

  return (
    <div className="register-full">
      <div className="register-card">
        <h2>Register Devotee</h2>
        <input className="form-input" placeholder="UID (auto from scan)" value={uid} onChange={e=>setUid(e.target.value)} />
        <input className="form-input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="form-input" placeholder="Aadhaar (12 digits)" value={aadhar} maxLength={12} onChange={e=>setAadhar(e.target.value)} />
        <input className="form-input" placeholder="Journey time (hours)" type="number" value={journeyTime} onChange={e=>setJourneyTime(e.target.value)} />
        <div style={{display:"flex",gap:10}}>
          <button className="btn primary" onClick={handleRegister}>Register</button>
          <button className="btn secondary" onClick={()=>navigate("/")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
