import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <span className="header-title">Task Manager</span>
      <div className="header-actions">
        {!isAuthenticated ? (
          <>
            <button className="header-btn" onClick={() => navigate("/login")}>Log in</button>
            <button className="header-btn" onClick={() => navigate("/register")}>Sign up</button>
          </>
        ) : (
          <>
            <span>Вітаю, {username}!</span>
            <button className="header-btn" onClick={logout}>Sign out</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
