import { get, post, put, del } from "./client";

// GET /invites?status=pending&calendarId=...
export const getInvites = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/invites${query ? `?${query}` : ""}`);
};

// POST /invites  → send invite { calendarId, invitedEmail } (or { calendarId, invitedUserId })
export const sendInvite = (data) => post("/invites", data);

// PUT /invites/:id  → accept or decline { status: "accepted" | "declined" }
export const respondInvite = (id, status) => put(`/invites/${id}`, { status });

// DELETE /invites/:id  → cancel a pending invite
export const deleteInvite = (id) => del(`/invites/${id}`);