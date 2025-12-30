import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
}

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id: workspaceId } = useParams();
  const [authorId, setAuthorId] = useState(null);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [authorWorkspaces, setAuthorWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");

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
  }, [logout, navigate]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        if (!authorId) return;
        const w = await apiGet(`/workspaces/authors/${authorId}`);
        setAuthorWorkspaces(Array.isArray(w) ? w : []);
        if (!workspaceId && Array.isArray(w) && w.length > 0) {
          setSelectedWorkspace(String(w[0].id));
        }
      } catch (e) {
        // ignore
      }
    };
    loadWorkspaces();
  }, [authorId, workspaceId]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let url = "";
        if (workspaceId) {
          url = `/jobs/${workspaceId}`;
        } else if (authorId) {
          url = `/jobs?authorId=${authorId}`;
        } else {
          setJobs([]);
          setLoading(false);
          return;
        }

        const data = await apiGet(url);
        const filtered = authorId ? data.filter((job) => job.author_id === authorId) : data;
        setJobs(Array.isArray(filtered) ? filtered : []);
      } catch (err) {
        if (err.status === 401 || err.message === "Unauthorized") {
          logout();
          navigate("/login");
        } else {
          setError("Помилка отримання задач");
        }
      } finally {
        setLoading(false);
      }
    };

    if (authorId !== null) fetchJobs();
  }, [workspaceId, authorId, logout, navigate]);

  useEffect(() => {
    const fetchAuthor = async (id) => {
      if (!id || authors[id]) return;
      try {
        const data = await apiGet(`/author/${id}`);
        setAuthors((prev) => ({ ...prev, [id]: data }));
      } catch (err) {
        // ignore
      }
    };
    jobs.forEach((job) => fetchAuthor(job.author_id));
  }, [jobs, authors]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!newTitle.trim()) {
      setError("Вкажіть заголовок");
      return;
    }

    // визначаємо workspace id та перетворюємо у number
    const wsRaw = workspaceId ?? selectedWorkspace;
    const wsNum = Number(wsRaw);
    if (!wsNum || Number.isNaN(wsNum)) {
      setError("Оберіть робочий простір (workspace)");
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        content: newContent.trim(),
        workspace_id: wsNum, // обов'язково число
        status: "created",
      };
      const created = await apiPost("/jobs", payload);
      setJobs((s) => [created, ...s]);
      setNewTitle("");
      setNewContent("");
      setShowCreate(false);
    } catch (err) {
      setError(err.message || "Не вдалося створити таску");
    }
  };

  if (loading) return <div>Завантаження...</div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>{workspaceId ? `Ваші задачі у workspace #${workspaceId}` : "Ваші задачі"}</h2>
        <button
          className="create-plus"
          onClick={() => setShowCreate((s) => !s)}
          title="Створити задачу"
          aria-label="create-job"
        >
          ＋
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate} style={{ marginBottom: 12 }}>
          <input
            placeholder="Заголовок"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Опис (опціонально)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          {!workspaceId && authorWorkspaces.length > 0 && (
            <select value={selectedWorkspace} onChange={(e) => setSelectedWorkspace(e.target.value)}>
              <option value="">Оберіть воркспейс</option>
              {authorWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          <div style={{ marginTop: 8 }}>
            <button type="submit">Створити</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ marginLeft: 8 }}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {jobs.length === 0 ? (
        <p>Немає задач для відображення.</p>
      ) : (
        jobs.map((job) => {
          const author = authors[job.author_id];
          return (
            <div className="job-card" key={job.id}>
              <div className="job-title">{job.title}</div>
              <div className="job-meta">
                Статус: <b>{job.status}</b> | Автор:{" "}
                {author ? (
                  <Link to={`/author/${author.id}`}>{author.nickname}</Link>
                ) : (
                  job.author_id
                )}{" "}
                | Створено: {formatDate(job.created_at)}
              </div>
              <div className="job-content">{job.content}</div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default JobsPage;