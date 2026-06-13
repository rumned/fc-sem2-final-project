import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as eventsApi from "../api/events";

const CalendarContext = createContext(null);

// MongoDB returns _id — give every event a frontend-friendly `id` field
const toFrontend = (ev) => ({ ...ev, id: ev._id ?? ev.id });

export const CalendarProvider = ({ children }) => {
  const { user } = useAuth();
  const [events,       setEvents]       = useState([]);
  const [fetchedDates, setFetchedDates] = useState(new Set());
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  // Whenever the logged-in user changes (login, logout, account switch), wipe
  // all cached events so one user never sees another user's schedule. The
  // provider is mounted once for the whole app, so without this the previous
  // user's events would linger in state after a re-login.
  useEffect(() => {
    setEvents([]);
    setFetchedDates(new Set());
    setError(null);
  }, [user?.id]);

  // ── Fetch events for a specific date (cached) ───────────────────────────
  const fetchEventsByDate = useCallback(async (date) => {
    if (!user || fetchedDates.has(date)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await eventsApi.getEvents({ date });
      const fetched = res.data.map(toFrontend);
      setEvents((prev) => {
        // Replace any previously stored events for this date, add new ones
        const others = prev.filter((e) => e.date !== date);
        return [...others, ...fetched];
      });
      setFetchedDates((prev) => new Set([...prev, date]));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, fetchedDates]);

  // ── Fetch events for a date range (used by AnalyticsDashboard) ──────────
  const fetchEventsByRange = useCallback(async (startDate, endDate) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await eventsApi.getEvents({ startDate, endDate });
      const fetched = res.data.map(toFrontend);
      setEvents((prev) => {
        const outsideRange = prev.filter((e) => e.date < startDate || e.date > endDate);
        return [...outsideRange, ...fetched];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── CRUD — optimistic update: update state immediately, revert on error ──

  const addEvent = async (eventData) => {
    const res = await eventsApi.createEvent(eventData);
    const event = toFrontend(res.data);
    setEvents((prev) => [...prev, event]);
    return event;
  };

  const updateEvent = async (id, updated) => {
    const res = await eventsApi.updateEvent(id, updated);
    const event = toFrontend(res.data);
    setEvents((prev) => prev.map((e) => e.id === event.id ? event : e));
    return event;
  };

  const deleteEvent = async (id) => {
    await eventsApi.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Invalidate cache for a date so it's re-fetched next time
  const invalidateDate = (date) => {
    setFetchedDates((prev) => {
      const next = new Set(prev);
      next.delete(date);
      return next;
    });
  };

  // Drop every cached event and clear the fetched-date cache. Used when the set
  // of calendars the user can see changes (e.g. after accepting an invite) so
  // the next visit to a day re-fetches and picks up the newly shared events.
  const clearCache = useCallback(() => {
    setEvents([]);
    setFetchedDates(new Set());
  }, []);

  return (
    <CalendarContext.Provider value={{
      events,
      loading,
      error,
      fetchEventsByDate,
      fetchEventsByRange,
      addEvent,
      updateEvent,
      deleteEvent,
      invalidateDate,
      clearCache,
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => useContext(CalendarContext);