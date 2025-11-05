import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">VAISHNO</div>
        <div className="subtitle">Admin</div>
      </div>

      <nav className="nav">
        <NavLink
          to="/"
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
          to="/revoke"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Revoke User
        </NavLink>
        <NavLink
          to="/RegisteredDevices"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          RegisteredDevices
        </NavLink>
      </nav>

      <div style={{ flex: 1 }} />

      <div className="sidebar-footer">
        <small>Node: Connected</small>
      </div>
    </aside>
  );
}
