import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
}

function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorId, setAuthorId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchAuthorId = async () => {
      try {
        const data = await apiGet("/author");
        setAuthorId(data.id);
      } catch (err) {
        if (err.status === 401 || err.message === "Unauthorized") {
          logout();
          navigate("/login");
        } else {
          setError("Помилка отримання автора");
        }
        setLoading(false);
      }
    };
    fetchAuthorId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authorId) return;
    const fetchWorkspaces = async () => {
      setLoading(true);
      try {
        const data = await apiGet(`/workspaces/authors/${authorId}`);
        setWorkspaces(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.status === 401 || err.message === "Unauthorized") {
          logout();
          navigate("/login");
        } else {
          setError("Помилка отримання воркспейсів");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, [authorId, logout, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) {
      setError("Вкажіть назву воркспейсу");
      return;
    }
    try {
      // Додаємо status щоб задовольнити валідацію бекенду
      const payload = {
        name: newName.trim(),
        description: newDescription.trim(),
        status: "created",
      };
      const created = await apiPost("/workspaces", payload);
      setWorkspaces((s) => [created, ...s]);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
    } catch (err) {
      setError(err.message || "Не вдалося створити воркспейс");
    }
  };

  if (loading) return <div>Завантаження...</div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>Ваші робочі простори</h2>
        <button
          className="create-plus"
          onClick={() => setShowCreate((s) => !s)}
          title="Створити воркспейс"
          aria-label="create-workspace"
        >
          ＋
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate} style={{ marginBottom: 12 }}>
          <input
            placeholder="Назва воркспейсу"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input
            placeholder="Опис (опціонально)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div style={{ marginTop: 8 }}>
            <button type="submit">Створити</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ marginLeft: 8 }}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {workspaces.length === 0 ? (
        <p>У вас немає робочих просторів.</p>
      ) : (
        workspaces.map((ws) => (
          <div className="workspace-card" key={ws.id}>
            <div
              className="workspace-title"
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate(`/jobs/${ws.id}`)}
            >
              {ws.name}
            </div>
            <div className="workspace-meta">
              Статус: <b>{ws.status}</b> | Створено: {formatDate(ws.created_at)}{" "}
              {ws.updated_at && <>| Оновлено: {formatDate(ws.updated_at)}</>}
            </div>
            <div className="workspace-description">
              <b>Опис:</b> {ws.description}
            </div>
            <div className="workspace-authors">
              <b>Автори:</b>{" "}
              {ws.Authors?.length > 0
                ? ws.Authors.map((a) => a.nickname).join(", ")
                : <span style={{ color: "#888" }}>немає авторів</span>}
            </div>
            <div>
              <b>Кількість задач:</b>{" "}
              {ws.Jobs?.length > 0 ? ws.Jobs.length : <span style={{ color: "#888" }}>немає задач</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default WorkspacesPage;