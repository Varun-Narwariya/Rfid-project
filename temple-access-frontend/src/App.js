// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import Sidebar from "./components/Sidebar";
// import Dashboard from "./components/Dashboard";
// import Register from "./Register";
// import PendingPage from "./components/PendingPage";

// // inside <Routes>



// export default function App() {
//   return (
//     <div className="app-shell">
//       <Sidebar />
//       <main className="main-area">
//         <Routes>
//           <Route path="/" element={<Dashboard />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/pending" element={<PendingPage />} />
//         </Routes>
//       </main>
//     </div>
//   );
// }
// src/App.js - THE NEW LOGIC HUB

// src/App.js
import React, { useEffect, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { DataContext } from "./DataContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Register from "./Register";
import PendingPage from "./components/PendingPage";
import RevokeUser from "./components/RevokeUser";
import RegisteredUsers from "./components/RegisteredUsers";

const API = "http://localhost:8080";

function App() {
  const { setScans, setStats, setPending } = useContext(DataContext);

  useEffect(() => {
    const es = new EventSource(`${API}/events`);
    es.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data);

    if (data.status === "revoked") {
      // ✅ Update global state after revocation
      setScans(prev => prev.filter(scan => scan.uid !== data.uid));
      setPending(prev => prev.filter(p => p.uid !== data.uid));

      // If your stats count registered users per checkpoint, reduce by 1
      setStats(prev => {
        const updated = { ...prev };
        for (const cp in updated) {
          updated[cp] = Math.max((updated[cp] || 0) - 1, 0);
        }
        return updated;
      });
    }

    if (data.status === "registered") {
      setStats(prev => ({
        ...prev,
        [data.checkpoint]: (prev[data.checkpoint] || 0) + 1,
      }));
    }

    if (data.status === "not_registered") {
      setPending(prev => {
        if (prev.find(p => p.uid === data.uid)) return prev;
        return [data, ...prev].slice(0, 50);
      });
    }

    setScans(prev => [data, ...prev].slice(0, 200));
  } catch (err) {
    console.error("SSE parse error", err);
  }
};


    es.onerror = (err) => console.error("SSE error", err);
    return () => es.close();
  }, [setScans, setStats, setPending]);

  useEffect(() => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((err) => console.error("Failed to fetch initial stats", err));
  }, [setStats]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/revoke" element={<RevokeUser />} />
          <Route path="/registered" element={<RegisteredUsers />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
