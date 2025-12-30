import React from "react";
import { NavLink } from "react-router-dom";

function Navigation() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/workspaces" className={({ isActive }) => isActive ? "active" : ""}>
              Workspaces
            </NavLink>
          </li>
          <li>
            <NavLink to="/jobs" className={({ isActive }) => isActive ? "active" : ""}>
              Jobs
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
              Profile
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Navigation;