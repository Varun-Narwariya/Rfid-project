import React, { useState } from "react";
import axios from "axios";

function RegisteredDevices() {
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/registerDevice", {
        deviceId,
        name,
        location,
      });
      setMessage("✅ Device registered successfully!");
      console.log(res.data);
    } catch (err) {
      console.error("Error registering device:", err);
      setMessage("❌ Failed to register device");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Register Device</h2>
      <form onSubmit={handleRegister}>
        <input
          className="border p-2 m-1"
          placeholder="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
        <input
          className="border p-2 m-1"
          placeholder="Device Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 m-1"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-2 rounded m-1" type="submit">
          Register
        </button>
      </form>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}

export default RegisteredDevices;
