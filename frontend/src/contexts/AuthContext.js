import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true); // нове

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await apiGet("/author");
        const nick = data.nickname || data.user?.nickname || "";
        if (!mounted) return;
        if (nick) {
          setUsername(nick);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUsername("");
        }
      } catch (err) {
        // якщо 401 — пробуємо refresh потім повторити запит
        if (err.status === 401 || err.message === "Unauthorized") {
          try {
            await apiPost("/refresh", {});
            const data2 = await apiGet("/author");
            const nick2 = data2.nickname || data2.user?.nickname || "";
            if (!mounted) return;
            if (nick2) {
              setUsername(nick2);
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              setUsername("");
            }
          } catch (e2) {
            if (!mounted) return;
            setIsAuthenticated(false);
            setUsername("");
          }
        } else {
          if (!mounted) return;
          setIsAuthenticated(false);
          setUsername("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (user) => {
    const nick = typeof user === "string" ? user : user?.nickname || "";
    setUsername(nick);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiPost("/logout", {});
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    setUsername("");
    // повне перезавантаження щоб очистити UI/state
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}