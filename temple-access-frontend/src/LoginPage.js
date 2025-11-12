import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080";

export default function LoginPage({ onLogin }) {
  const [address, setAddress] = useState("");
  const [checkpoint, setCheckpoint] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🧩 Connect MetaMask (force popup)
  const connectWallet = async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        return setError("MetaMask not found! Please install it.");
      }

      // Request permissions
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0];
        setAddress(userAddr);
        await detectRole(userAddr);
      }
    } catch (err) {
      console.error("MetaMask connect error:", err);
      setError(err.message);
    }
  };

  // 🧩 Detect Role from Backend
  const detectRole = async (addr) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/detectRole/${addr}`);
      const { role, checkpoint } = res.data;

      if (role === "unauthorized") {
        setError("❌ Not authorized for access");
        return;
      }

      setRole(role);
      setCheckpoint(checkpoint);
    } catch (err) {
      console.error("Role detection failed:", err);
      setError("Unable to detect role");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Handle Login
  const handleLogin = () => {
    if (!role) return alert("Please connect wallet first!");
    const info = { role, address, checkpoint };
    onLogin(info);
  };

  // 🔄 Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        detectRole(accounts[0]);
      } else {
        setAddress("");
        setRole(null);
        setCheckpoint("");
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () =>
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffcf33 0%, #f7941e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        className="login-box"
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "40px 50px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          textAlign: "center",
          width: "100%",
          maxWidth: "420px",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ marginBottom: "25px" }}>
          <h1
            style={{
              fontSize: "2rem",
              marginBottom: "5px",
              color: "#333",
              fontWeight: "bold",
            }}
          >
            🛕 Temple Access System
          </h1>
          <p style={{ color: "#777" }}>Secure entry via blockchain identity</p>
        </div>

        <button
          onClick={connectWallet}
          className="btn primary"
          disabled={loading}
          style={{
            background: "linear-gradient(90deg, #ffb347, #ffcc33)",
            color: "#333",
            fontWeight: "600",
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.2s ease",
            width: "100%",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
          onMouseOver={(e) =>
            (e.target.style.background = "linear-gradient(90deg, #ffcc33, #ffb347)")
          }
          onMouseOut={(e) =>
            (e.target.style.background = "linear-gradient(90deg, #ffb347, #ffcc33)")
          }
        >
          {loading ? "🔍 Detecting..." : "🔗 Connect MetaMask"}
        </button>

        {address && (
          <div
            className="wallet-info"
            style={{
              marginTop: "25px",
              padding: "15px",
              borderRadius: "12px",
              background:
                role === "owner"
                  ? "linear-gradient(90deg, #4caf50, #8bc34a)"
                  : role === "local_admin"
                  ? "linear-gradient(90deg, #2196f3, #03a9f4)"
                  : "#eee",
              color: "#fff",
              fontWeight: "500",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Connected:</strong>{" "}
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              {role ? role.replace("_", " ").toUpperCase() : "Detecting..."}
            </p>
            {role === "local_admin" && (
              <p>
                <strong>Checkpoint:</strong> {checkpoint}
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{ color: "red", marginTop: "15px", fontWeight: "500" }}>
            {error}
          </p>
        )}

        {role && (
          <button
            className="btn secondary"
            onClick={handleLogin}
            style={{
              marginTop: "25px",
              width: "100%",
              background:
                role === "owner"
                  ? "linear-gradient(90deg, #4caf50, #81c784)"
                  : "linear-gradient(90deg, #2196f3, #64b5f6)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              padding: "12px 20px",
              cursor: "pointer",
              fontWeight: "600",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.03)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            🚀 Continue as{" "}
            {role === "owner" ? "Main Admin" : "Local Admin"}
          </button>
        )}

        <footer style={{ marginTop: "30px", color: "#999", fontSize: "0.8rem" }}>
          Powered by <b>Blockchain + IoT</b> | © 2025 Vaishno Access
        </footer>
      </div>
    </div>
  );
}
