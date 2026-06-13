import { get, post, put, del } from "./client";

// GET /calendars?owner=...&member=...&isPublic=...
export const getCalendars = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/calendars${query ? `?${query}` : ""}`);
};

// GET /calendars/:id  → includes members list
export const getCalendar = (id) => get(`/calendars/${id}`);

// POST /calendars
export const createCalendar = (data) => post("/calendars", data);

// PUT /calendars/:id
export const updateCalendar = (id, data) => put(`/calendars/${id}`, data);

// DELETE /calendars/:id
export const deleteCalendar = (id) => del(`/calendars/${id}`);

// POST /calendars/:id/members  → admin assigns a user directly { email }
export const assignMember = (id, email) => post(`/calendars/${id}/members`, { email });

// DELETE /calendars/:id/members/:userId  → admin removes a member
export const removeMember = (id, userId) => del(`/calendars/${id}/members/${userId}`);