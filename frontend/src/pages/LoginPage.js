import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { apiPost } from "../services/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Примаємо збережені credentials (якщо користувач дозволив)
  useEffect(() => {
    async function tryGetCredential() {
      try {
        if (!window.navigator || !window.navigator.credentials) return;
        const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
        if (!cred) return;
        if (cred.type === "password") {
          if (cred.id) setEmail(cred.id);
          if (cred.password) setPassword(cred.password);
        }
      } catch (e) {
        console.debug("credential get failed", e);
      }
    }
    tryGetCredential();
  }, []);

  async function tryStoreCredential(id, pwd) {
    try {
      if (!window.navigator || !window.navigator.credentials) return;
      let cred = null;

      // використаємо window.PasswordCredential, щоб уникнути помилок linter
      if (typeof window.PasswordCredential !== "undefined") {
        try {
          cred = new window.PasswordCredential({ id, password: pwd, name: id });
        } catch (e) {
          cred = null;
        }
      }

      if (!cred && navigator.credentials && navigator.credentials.create) {
        try {
          cred = await navigator.credentials.create({ password: { id, password: pwd } });
        } catch (e) {
          cred = null;
        }
      }

      if (cred && navigator.credentials && navigator.credentials.store) {
        await navigator.credentials.store(cred);
        console.debug("Credential stored");
      }
    } catch (e) {
      console.debug("Credential store failed:", e);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiPost("/login", { email, password });
      const user = data.user || data;
      if (!user) throw new Error("Login failed");
      tryStoreCredential(email, password);
      login(user);
      navigate("/workspaces");
    } catch (err) {
      console.error(err);
      setError("Невірний email або пароль");
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin} autoComplete="on">
      <h2>Log in</h2>

      <input
        name="username"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="username"
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      <button type="submit">Log in</button>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}

export default LoginPage;