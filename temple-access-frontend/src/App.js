import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Register from "./Register";
import PendingPage from "./components/PendingPage";
import { DataProvider } from "./DataContext"; // Import DataProvider

export default function App() {
  return (
    <DataProvider> {/* Wrap the entire application with DataProvider */}
      <div className="app-shell">
        <Sidebar />
        <main className="main-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending" element={<PendingPage />} />
          </Routes>
        </main>
      </div>
    </DataProvider>
  );
}