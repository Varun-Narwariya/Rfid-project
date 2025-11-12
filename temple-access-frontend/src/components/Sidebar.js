import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ user, onLogout }) {
  const isAdmin = user?.role === "owner";
  const isLocalAdmin = user?.role === "local_admin";

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not Connected";

  return (
    <aside className="sidebar">
      {/* === Header / Branding === */}
      <div className="brand">
        <div className="logo">VAISHNO</div>
        <div className="subtitle">
          {isAdmin
            ? "Admin"
            : isLocalAdmin
            ? `Local Admin (CP-${user.checkpoint})`
            : "User"}
        </div>
      </div>

      {/* === Navigation Links === */}
      <nav className="nav">
        <NavLink
          to={isAdmin ? "/dashboard" : "/local-dashboard"}
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          end
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/register"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Register User
        </NavLink>

        <NavLink
          to="/revoke"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Revoke User
        </NavLink>

        {/* === Admin-only routes === */}
        {isAdmin && (
          <>

          <NavLink
              to="/register-local-admin"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Register Local Admin
          </NavLink>

            <NavLink
              to="/pending"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Pending
            </NavLink>

            <NavLink
              to="/registered"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Registered UIDs
            </NavLink>

            <NavLink
              to="/RegisteredDevices"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Registered Devices
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* === Footer Section === */}
      <div className="sidebar-footer">
        <small>
          🪙 {shortAddress(user?.address)} <br />
          Role: {isAdmin ? "Admin" : "Local Admin"}
        </small>

        <button
          onClick={onLogout}
          style={{
            marginTop: "10px",
            padding: "6px 12px",
            borderRadius: "6px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>

        <small style={{ display: "block", marginTop: "10px", color: "green" }}>
          Node: Connected
        </small>
      </div>
    </aside>
  );
}
