import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

function ProfilePage() {
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const data = await apiGet("/author");
        setAuthor(data);
      } catch (err) {
        if (err.message === "Unauthorized") {
          logout();
          navigate("/login");
        } else {
          setError("Помилка завантаження профілю");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAuthor();
  }, [logout, navigate]);

  if (loading) return <div>Завантаження...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="profile-card">
      <h2>Профіль: {author.nickname}</h2>
      <div className="profile-meta">
        <p><b>ID:</b> {author.id}</p>
        <p><b>Email:</b> {author.email}</p>
        <p><b>Роль:</b> {author.role}</p>
        <p><b>Створений:</b> {formatDate(author.created_at)}</p>
        <p><b>Оновлений:</b> {formatDate(author.updated_at)}</p>
      </div>

      <h3>Задачі</h3>
      {author.Jobs?.length > 0 ? (
        author.Jobs.map((job) => (
          <div className="job-card" key={job.id}>
            <Link to={`/jobs/${job.id}`} className="job-title">
              {job.title}
            </Link>
            <div className="job-meta">
              Статус: <b>{job.status}</b> | Створено: {formatDate(job.created_at)}
            </div>
            <div className="job-content">{job.content}</div>
          </div>
        ))
      ) : (
        <p>Немає задач</p>
      )}

      <h3>Воркспейси</h3>
      {author.Workspaces?.length > 0 ? (
        author.Workspaces.map((ws) => (
          <div className="workspace-card" key={ws.id}>
            <Link to={`/workspaces/${ws.id}`} className="workspace-title">
              {ws.name}
            </Link>
            <div className="workspace-meta">
              Статус: <b>{ws.status}</b> | Створено: {formatDate(ws.created_at)}
            </div>
            <div className="workspace-description">
              <b>Опис:</b> {ws.description}
            </div>
          </div>
        ))
      ) : (
        <p>Немає воркспейсів</p>
      )}
    </div>
  );
}

export default ProfilePage;
