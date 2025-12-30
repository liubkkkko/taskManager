const API_BASE = "/api";

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    credentials: "include", // <- обов'язково, щоб браузер відправляв HttpOnly cookies
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "API error");
  }

  // Якщо тіло відповіді є пустим, повернемо пустий об'єкт
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    // якщо не JSON — повертаємо як текст
    return text;
  }
}

export function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut(path, body) {
  return apiRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}