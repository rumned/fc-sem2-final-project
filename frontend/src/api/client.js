// Base URL comes from .env — create a .env file at project root with:
// VITE_API_URL=http://localhost:5001/api
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const getToken = () => localStorage.getItem("token");

const request = async (method, path, body = null) => {
  const token = getToken();

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  // A 401 on an auth endpoint (login/register) means "bad credentials" — let it
  // bubble up so the page can show the message. Only treat a 401 as an expired
  // session (clear + redirect) when we actually had a token on a protected route.
  const isAuthRoute = path.startsWith("/auth/");
  if (res.status === 401 && token && !isAuthRoute) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
    return;
  }

  // No content response (e.g. DELETE)
  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    // Use server's error message if available
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data;
};

export const get  = (path)        => request("GET",    path);
export const post = (path, body)  => request("POST",   path, body);
export const put  = (path, body)  => request("PUT",    path, body);
export const del  = (path)        => request("DELETE", path);
