import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/projects">Projetos</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}
