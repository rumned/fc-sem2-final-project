import { get, put, del } from "./client";

// GET /users?name=&email=  (admin only)
export const getUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/users${query ? `?${query}` : ""}`);
};

// GET /users/:id
export const getUser = (id) => get(`/users/${id}`);

// PUT /users/:id
export const updateUser = (id, data) => put(`/users/${id}`, data);

// DELETE /users/:id  (admin only)
export const deleteUser = (id) => del(`/users/${id}`);
