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
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active":"nav-link"} end>
          Dashboard
        </NavLink>
        <NavLink to="/register" className={({isActive}) => isActive ? "nav-link active":"nav-link"}>
          Register User
        </NavLink>
        <a className="nav-link" href="/pending">Pending</a>
      </nav>

      <div style={{flex:1}} />

      <div className="sidebar-footer">
        <small>Node: Connected</small>
      </div>
    </aside>
  );
}
