import React, { useEffect, useContext, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { DataContext } from "./DataContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Register from "./Register";
import PendingPage from "./components/PendingPage";
import RevokeUser from "./components/RevokeUser";
import RegisteredUsers from "./components/RegisteredUsers";
import BroadcastListener from "./components/BroadcastListener";
import RegisteredDevices from "./RegisteredDevices";
import LoginPage from "./LoginPage";
import LocalDashboard from "./LocalDashboard";
import RegisterLocalAdmin from "./RegisterLocalAdmin";


const API = "http://localhost:8080";

function App() {
  const {
    user,
    login,
    logout,
    setStats,
    setScans,
    setPending,
  } = useContext(DataContext);

  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const navigate = useNavigate();

  // =============================
  // 🧩 SSE Setup (live updates)
  // =============================
  useEffect(() => {
    if (!user) return;

    const es = new EventSource(`${API}/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // 📢 Broadcasts
        if (data.type === "broadcast") {
          setBroadcastMessage(data.message || "⚠️ Emergency Alert!");
          alert(`🚨 ${data.message}`);
          return;
        }

        // 🚫 Revoked
        if (data.status === "revoked") {
          setScans((prev) => prev.filter((s) => s.uid !== data.uid));
          setPending((prev) => prev.filter((p) => p.uid !== data.uid));
          setStats((prev) => {
            const updated = { ...prev };
            for (const cp in updated)
              updated[cp] = Math.max((updated[cp] || 0) - 1, 0);
            return updated;
          });
        }

        // ✅ Registered
        if (data.status === "registered") {
          setStats((prev) => ({
            ...prev,
            [data.checkpoint]: (prev[data.checkpoint] || 0) + 1,
          }));
        }

        // ⏳ Pending
        if (data.status === "not_registered") {
          setPending((prev) => {
            if (prev.find((p) => p.uid === data.uid)) return prev;
            return [data, ...prev].slice(0, 50);
          });
        }

        // 📜 Update scans
        setScans((prev) => [data, ...prev].slice(0, 200));
      } catch (err) {
        console.error("❌ SSE parse error:", err);
      }
    };

    es.onerror = (err) => console.error("⚠️ SSE connection error:", err);
    return () => es.close();
  }, [user, setScans, setStats, setPending]);

  // =============================
  // 📊 Fetch Initial Stats
  // =============================
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, [user, setStats]);

  // =============================
  // 🔐 Login / Logout Handlers
  // =============================
  const handleLogin = (info) => {
    login(info);
    console.log("✅ Logged in:", info);
    if (info.role === "owner") navigate("/dashboard");
    else navigate("/local-dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // =============================
  // 🧭 Routing Logic
  // =============================
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = user.role === "owner";
  const isLocalAdmin = user.role === "local_admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <main style={{ flexGrow: 1, padding: "20px" }}>
        {/* 🔔 Broadcast Banner */}
        {broadcastMessage && (
          <div
            style={{
              backgroundColor: "red",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
              fontWeight: "bold",
              textAlign: "center",
              animation: "pulse 1s infinite alternate",
            }}
          >
            🚨 {broadcastMessage}
          </div>
        )}

        {/* 🧭 Role-based Routing */}
        <Routes>
          {/* ========== 🏛️ ADMIN ROUTES ========== */}
          {isAdmin && (
            <>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending" element={<PendingPage />} />
              <Route path="/revoke" element={<RevokeUser />} />
              <Route path="/registered" element={<RegisteredUsers />} />
              <Route path="/broadcast" element={<BroadcastListener />} />
              <Route path="/RegisteredDevices" element={<RegisteredDevices />} />
              <Route path="/register-local-admin" element={<RegisterLocalAdmin />} />

            </>
          )}

          {/* ========== 🧍 LOCAL ADMIN ROUTES ========== */}
          {isLocalAdmin && (
            <>
              <Route
                path="/"
                element={<LocalDashboard user={user} />}
              />
              <Route
                path="/local-dashboard"
                element={<LocalDashboard user={user} />}
              />
              <Route path="/register" element={<Register />} />
              <Route path="/revoke" element={<RevokeUser />} />
            </>
          )}

          {/* ========== 🚦 Fallback ========== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Optional: Broadcast Listener Visual */}
        <BroadcastListener message={broadcastMessage} />
      </main>
    </div>
  );
}

export default App;
