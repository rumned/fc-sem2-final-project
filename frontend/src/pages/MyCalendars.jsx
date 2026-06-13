import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import * as calendarsApi from "../api/calendars";
import { countMembers } from "../utils/members";

// Simple set of hex colors just for calendars (not tied to event categories)
const CALENDAR_COLORS = [
  "#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#fb923c",
];

const EMPTY_FORM = { name: "", description: "", color: CALENDAR_COLORS[0] };

const MyCalendars = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCalendars } = useNotifications();
  const [calendars,  setCalendars]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [calForm,    setCalForm]    = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await calendarsApi.getCalendars();
        setCalendars(res.data);
      } catch (err) {
        setError(err.message || "Failed to load calendars.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Backend populates owner as an object — compare owner's _id to current user's id
  const owned    = calendars.filter((c) => (c.owner?._id ?? c.owner) === user?.id);
  const membered = calendars.filter((c) => (c.owner?._id ?? c.owner) !== user?.id);

  const handleCreate = async () => {
    if (!calForm.name.trim()) {
      setFormError("Calendar name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await calendarsApi.createCalendar(calForm);
      setCalendars((prev) => [...prev, res.data]);
      refreshCalendars();
      setShowForm(false);
      setCalForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message || "Failed to create calendar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="event-list__empty">Loading calendars…</div>;
  if (error)   return <div className="event-list__empty event-list__empty--error">{error}</div>;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Calendars</div>
          <div className="page-header__title page-header__title--sm">My Calendars</div>
        </div>
        <button className="btn--primary" onClick={() => { setCalForm(EMPTY_FORM); setFormError(""); setShowForm(true); }}>
          + New
        </button>
      </div>

      {/* New Calendar Modal */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="modal">
            <div className="modal__title">New Calendar</div>

            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={calForm.name}
              onChange={(e) => setCalForm({ ...calForm, name: e.target.value })}
              placeholder="e.g. Semester Schedule, Sprint Routine"
              autoFocus
            />

            <label className="form-label">Description (optional)</label>
            <input
              className="form-input"
              value={calForm.description}
              onChange={(e) => setCalForm({ ...calForm, description: e.target.value })}
              placeholder="What is this calendar for?"
            />

            <label className="form-label">Color</label>
            <div className="color-picker">
              {CALENDAR_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${calForm.color === c ? "color-swatch--active" : ""}`}
                  onClick={() => setCalForm({ ...calForm, color: c })}
                  style={{ "--swatch": c }}
                />
              ))}
            </div>

            {formError && (
              <div className="form-error-msg">{formError}</div>
            )}

            <div className="modal__actions">
              <button className="btn btn--secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </button>
              <button
                className="btn cal-submit-btn"
                onClick={handleCreate}
                disabled={saving}
                style={{ "--theme-color": calForm.color }}
              >
                {saving ? "Creating…" : "Create Calendar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owned calendars */}
      <div className="section-label">Owned by you</div>
      {owned.length === 0 && (
        <div className="card__sub card__sub--mb">
          No calendars yet — create one above
        </div>
      )}
      {owned.map((cal) => (
        <div
          key={cal._id}
          className="card card--interactive card--calendar"
          style={{ "--theme-color": cal.color }}
        >
          <div className="card__dot" />
          <div className="card__body">
            <div className="card__title">{cal.name}</div>
            <div className="card__sub">{countMembers(cal)} member{countMembers(cal) !== 1 ? "s" : ""}</div>
          </div>
          <button
            className="btn btn--sm"
            onClick={() => navigate(`/calendars/${cal._id}`)}
          >
            Manage
          </button>
        </div>
      ))}

      {/* Member-of calendars */}
      <div className="section-label section-label--mt">Member of</div>
      {membered.length === 0 && (
        <div className="card__sub">Not a member of any shared calendars</div>
      )}
      {membered.map((cal) => (
        <div
          key={cal._id}
          className="card card--interactive card--calendar"
          style={{ "--theme-color": cal.color }}
        >
          <div className="card__dot" />
          <div className="card__body">
            <div className="card__title">{cal.name}</div>
            <div className="card__sub">{countMembers(cal)} member{countMembers(cal) !== 1 ? "s" : ""}</div>
          </div>
          <button className="btn btn--sm" onClick={() => navigate(`/calendars/${cal._id}`)}>
            View
          </button>
        </div>
      ))}
    </div>
  );
};

export default MyCalendars;