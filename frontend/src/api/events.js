import { get, post, put, del } from "./client";

// GET /events?date=YYYY-MM-DD&calendarId=...&isAllDay=...
export const getEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/events${query ? `?${query}` : ""}`);
};

// GET /events/:id
export const getEvent = (id) => get(`/events/${id}`);

// POST /events
export const createEvent = (data) => post("/events", data);

// PUT /events/:id
export const updateEvent = (id, data) => put(`/events/${id}`, data);

// DELETE /events/:id
export const deleteEvent = (id) => del(`/events/${id}`);
