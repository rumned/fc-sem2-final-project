import React, { useState, useEffect } from "react";
import { useCalendar } from "../context/CalendarContext";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES } from "../utils/constants";
import ClockFace from "../components/clock/ClockFace";
import AllDayBanner from "../components/clock/AllDayBanner";
import EventForm from "../components/events/EventForm";
import EventList from "../components/events/EventList";
import AgendaView from "../components/events/AgendaView";
import TimelineView from "../components/events/TimelineView";
import { formatTime, todayStr, shiftDateStr, parseDateLocal } from "../utils/clockMath";
import { eventOwnershipNote, permissionErrorMessage } from "../utils/permissions";
import { useReminderSettings } from "../context/ReminderContext";

// Derive arc color directly from category — no manual color picker needed
const getCategoryColor = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color || "var(--theme-other)";
};

const ClockDashboard = () => {
  const { events, loading, fetchEventsByDate, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { user } = useAuth();
  const { remindersEnabled, toggleReminders, runTest, reminderMsg, registerWhatNextHandler, demoMode, toggleDemoMode } = useReminderSettings();
  const [form,             setForm]             = useState(null);
  const [selectedEvent,    setSelectedEvent]    = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [formError,        setFormError]        = useState("");
  const [actionError,      setActionError]      = useState(""); // feedback when a delete is rejected
  const [viewMode,         setViewMode]         = useState("clock"); // clock | agenda | timeline

  const [selectedDate, setSelectedDate] = useState(() => todayStr());

  // Fetch events whenever selectedDate changes — covers first load and navigation
  useEffect(() => {
    fetchEventsByDate(selectedDate);
  }, [selectedDate]);

  // Clear any "can't delete" feedback when the user moves to a different event.
  useEffect(() => {
    setActionError("");
  }, [selectedEvent?.id]);

  // While the dashboard is open, the What's-Next modal should open the
  // editable event form (prefilled for the current day) instead of creating
  // an event directly. Re-register when selectedDate changes so the form lands
  // on the day in view; the cleanup unregisters on unmount so the modal falls
  // back to direct creation on other pages.
  useEffect(() => {
    const prefillForm = (category) => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      let eh = h + 1;
      if (eh >= 24) eh = 23;
      setFormError("");
      setForm({
        title: category.label,
        date: selectedDate,
        startHour: h,
        startMinute: m,
        endHour: eh,
        endMinute: m,
        isAllDay: false,
        category: category.id,
        color: category.color,
        desc: "",
      });
    };
    return registerWhatNextHandler(prefillForm);
  }, [registerWhatNextHandler, selectedDate]);

  const handleDateChange = (amount) => {
    const newDateStr = shiftDateStr(selectedDate, amount);
    setSelectedDate(newDateStr); // useEffect above handles the fetch
    setSelectedEvent(null);
    setForm(null);
  };

  const goToToday = () => {
    setSelectedDate(todayStr());
    setSelectedEvent(null);
    setForm(null);
  };

  const openNewEventForm = (hour, minute) => {
    const now = new Date();
    const h = hour ?? now.getHours();
    const m = minute ?? 0;
    let endH = h + 1;
    let endM = m;
    if (endH >= 24) { endH = 23; endM = 59; }
    setFormError("");
    setSelectedEvent(null);
    setForm({
      title: "",
      date: selectedDate,
      startHour: h,
      startMinute: m,
      endHour: endH,
      endMinute: endM,
      isAllDay: false,
      category: "other",
      color: getCategoryColor("other"),
      desc: "",
    });
  };

  const handleClockClick = ({ hour, minute }) => openNewEventForm(hour, minute);

  const openEdit = (ev) => {
    setFormError("");
    setForm({ ...ev });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError("Event title is required.");
      return;
    }
    if (!form.isAllDay) {
      const start = form.startHour * 60 + form.startMinute;
      const end = form.endHour * 60 + form.endMinute;
      if (start >= end) {
        setFormError("End time must be after start time.");
        return;
      }
    }
    // Always sync color to category before saving
    const payload = { ...form, color: getCategoryColor(form.category) };

    setSaving(true);
    setFormError("");
    try {
      if (payload.id) {
        await updateEvent(payload.id, payload);
        setSelectedEvent(payload);
      } else {
        await addEvent(payload);
      }
      setForm(null);
    } catch (err) {
      setFormError(payload.id ? permissionErrorMessage(err, "edit") : (err.message || "Couldn’t save the event."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    setActionError("");
    try {
      await deleteEvent(id);
      setForm(null);
      setSelectedEvent(null);
    } catch (err) {
      // The server rejects deletes on events the user doesn't own. Tell them
      // why instead of letting the click appear to do nothing.
      setActionError(permissionErrorMessage(err, "delete"));
      setForm(null);
    }
  };

  if (loading) return <div className="event-list__empty">Synchronizing calendar timelines…</div>;

  // Only show events that belong to the day being viewed. The context caches
  // events for every visited date in one array, so without this filter events
  // from other days would appear on whatever date is selected.
  const eventsForDay = events.filter((e) => e.date === selectedDate);
  const timedEvents  = eventsForDay.filter((e) => !e.isAllDay);
  const allDayEvents = eventsForDay.filter((e) => e.isAllDay);

  const isToday = selectedDate === todayStr();

  const humanReadableDate = parseDateLocal(selectedDate).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  // Note shown when the selected/edited event was created by someone else
  // (e.g. assigned by an admin, or sitting in a calendar the user joined).
  const selectedNote = selectedEvent ? eventOwnershipNote(selectedEvent, user) : "";
  const formNote     = form?.id ? eventOwnershipNote(form, user) : "";

  return (
    <div className="app-shell">

      {/* ── Header / banner ── */}
      <div className="page-header page-header--stack">
        <div className="page-header__top">
          <div className="page-header__eyebrow">Personal Dashboard</div>
          <div className="page-header__controls-row">
            <button className="btn--primary" onClick={() => openNewEventForm()}>
              + New Event
            </button>
            <div className="reminder-row">
              <div
                onClick={toggleReminders}
                className={`form-toggle form-toggle--sm ${remindersEnabled ? "form-toggle--active" : ""}`}
              >
                <div className="form-toggle__dot" />
              </div>
              <span className="reminder-label">🔔 Reminders</span>
              {/* Test-only affordance — hidden unless Demo tools is on */}
              {demoMode && (
                <button className="btn btn--sm btn--ghost reminder-test" onClick={runTest}>
                  Test
                </button>
              )}
            </div>
            <div className="reminder-row">
              <div
                onClick={toggleDemoMode}
                className={`form-toggle form-toggle--sm ${demoMode ? "form-toggle--active" : ""}`}
              >
                <div className="form-toggle__dot" />
              </div>
              <span className="reminder-label">🧪 Demo tools</span>
            </div>
          </div>
          {reminderMsg && <div className="reminder-status">{reminderMsg}</div>}
        </div>

        <div className="page-header__date-nav">
          <button className="btn btn--ghost" onClick={() => handleDateChange(-1)}>◀</button>
          <div className="page-header__title">{humanReadableDate}</div>
          <button className="btn btn--ghost" onClick={() => handleDateChange(1)}>▶</button>
          <button
            className="btn btn--ghost btn--today"
            onClick={goToToday}
            disabled={isToday}
          >
            Today
          </button>
        </div>

        {/* View switcher: clock / per-day agenda / traditional timeline */}
        <div className="view-toggle" role="tablist" aria-label="View mode">
          {[
            { id: "clock",    label: "🕐 Clock" },
            { id: "agenda",   label: "📋 Agenda" },
            { id: "timeline", label: "📅 Timeline" },
          ].map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={viewMode === m.id}
              className={`view-toggle__btn ${viewMode === m.id ? "view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Clock view ── */}
      {viewMode === "clock" && (
        <>
          <AllDayBanner events={allDayEvents} onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }} />
          <div className="clock-wrapper">
            <ClockFace
              events={timedEvents}
              onClockClick={handleClockClick}
              onArcClick={(ev) => { setSelectedEvent(ev); setForm(null); }}
            />
          </div>
        </>
      )}

      {/* ── Per-day agenda view ── */}
      {viewMode === "agenda" && (
        <div className="view-panel">
          <AgendaView
            events={eventsForDay}
            selectedId={selectedEvent?.id}
            onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }}
          />
        </div>
      )}

      {/* ── Traditional scheduler view ── */}
      {viewMode === "timeline" && (
        <div className="view-panel">
          <AllDayBanner events={allDayEvents} onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }} />
          <TimelineView
            events={eventsForDay}
            selectedDate={selectedDate}
            selectedId={selectedEvent?.id}
            onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }}
            onGridClick={openNewEventForm}
          />
        </div>
      )}

      {/* ── Event detail panel ── */}
      {selectedEvent && (
        <div className={`detail-panel theme-${selectedEvent.category || "other"}`}>
          <div className="detail-panel__header">
            <div>
              <div className="detail-panel__title-row">
                <div className="detail-panel__dot" />
                <span className="detail-panel__title">{selectedEvent.title}</span>
                {(() => {
                  const cat = CATEGORIES.find((c) => c.id === selectedEvent.category);
                  return cat ? <span className="detail-panel__cat-badge">{cat.icon} {cat.label}</span> : null;
                })()}
              </div>
              {!selectedEvent.isAllDay && (
                <div className="detail-panel__time">
                  {formatTime(selectedEvent.startHour, selectedEvent.startMinute)} → {formatTime(selectedEvent.endHour, selectedEvent.endMinute)}
                </div>
              )}
              {selectedEvent.desc && <div className="detail-panel__desc">{selectedEvent.desc}</div>}
            </div>
            <div className="detail-panel__actions">
              <button className="btn btn--sm" onClick={() => openEdit(selectedEvent)}>Edit</button>
              <button className="btn--sm-danger" onClick={() => handleDelete(selectedEvent.id)}>Delete</button>
              <button className="btn--ghost" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
          </div>

          {/* Ownership note + rejection feedback for events the user can't manage */}
          {selectedNote && <div className="detail-panel__note">{selectedNote}</div>}
          {actionError && <div className="detail-panel__action-error">{actionError}</div>}
        </div>
      )}

      {viewMode === "clock" && (
        <EventList
          events={timedEvents}
          selectedId={selectedEvent?.id}
          onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }}
        />
      )}

      <EventForm
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
        error={formError}
        note={formNote}
      />
    </div>
  );
};

export default ClockDashboard;