import { get, post } from "./client";

// POST /auth/register
export const register = (name, email, password) =>
  post("/auth/register", { name, email, password });

// POST /auth/login  → returns { user, token }
export const login = (email, password) =>
  post("/auth/login", { email, password });

// GET /auth/me  → returns current user from token
export const getMe = () => get("/auth/me");
