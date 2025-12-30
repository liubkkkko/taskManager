import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // поки визначається стан — нічого не робимо (не редіректимо)
  if (loading) return null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}