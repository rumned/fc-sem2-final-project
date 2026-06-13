import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import ClockFace from "../components/clock/ClockFace";
import AllDayBanner from "../components/clock/AllDayBanner";
import EventList from "../components/events/EventList";
import EventForm from "../components/events/EventForm";
import { CATEGORIES } from "../utils/constants";
import { formatTime, todayStr, shiftDateStr, parseDateLocal } from "../utils/clockMath";
import { getCountedMembers } from "../utils/members";
import { eventOwnershipNote, permissionErrorMessage } from "../utils/permissions";
import * as calendarsApi from "../api/calendars";
import * as eventsApi from "../api/events";
import * as invitesApi from "../api/invites";

const CALENDAR_COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];

const getCategoryColor = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color || "var(--theme-other)";
};

const SharedCalendar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCalendars } = useNotifications();

  const [calendar,      setCalendar]      = useState(null);
  const [events,        setEvents]        = useState([]);
  const [invites,       setInvites]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  const [selectedDate,  setSelectedDate]  = useState(() => todayStr());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionError,   setActionError]   = useState(""); // feedback when a delete is rejected

  // Event form
  const [form,      setForm]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  // Calendar settings modal (admin)
  const [editingCal, setEditingCal] = useState(null);
  const [calSaving,  setCalSaving]  = useState(false);
  const [calError,   setCalError]   = useState("");

  // Invite / assign forms
  const [memberEmail, setMemberEmail] = useState("");
  const [memberMsg,   setMemberMsg]   = useState(null); // { type: "error" | "success", text }
  const [memberBusy,  setMemberBusy]  = useState(false);

  // ── Permissions ──────────────────────────────────────────────────────────
  const isAdmin = user?.role === "admin";
  const ownerId = calendar?.owner?._id ?? calendar?.owner;
  const isOwner = ownerId === user?.id;

  const canManageEvents = isOwner || isAdmin; // add / edit / delete events
  const canInvite       = isOwner && !isAdmin; // owner sends invites
  const canAssign       = isAdmin;             // admin adds members directly
  const canSeeInvites   = isOwner || isAdmin;  // view + cancel pending invites
  const canEditSettings = isOwner || isAdmin;  // rename / recolor
  const canDelete       = isOwner || isAdmin;  // delete the calendar
  const canRemoveMember = isOwner || isAdmin;  // remove a member

  // ── Loading ────────────────────────────────────────────────────────────
  const loadInvites = useCallback(async () => {
    try {
      const res = await invitesApi.getInvites({ calendarId: id });
      setInvites(res.data);
    } catch {
      // non-fatal — invites are a secondary concern
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [calRes, evRes] = await Promise.all([
          calendarsApi.getCalendar(id),
          eventsApi.getEvents({ calendarId: id }),
        ]);
        setCalendar(calRes.data);
        setEvents(evRes.data.map((ev) => ({ ...ev, id: ev._id })));
      } catch (err) {
        setError(err.message || "Failed to load calendar.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Fetch invites once we know the user can manage them
  useEffect(() => {
    if (calendar && canSeeInvites) loadInvites();
  }, [calendar, canSeeInvites, loadInvites]);

  // Clear any "can't delete" feedback when the user moves to a different event.
  useEffect(() => {
    setActionError("");
  }, [selectedEvent?.id]);

  // ── Date navigation ──────────────────────────────────────────────────────
  const changeDate = (amount) => {
    setSelectedDate((d) => shiftDateStr(d, amount));
    setSelectedEvent(null);
    setForm(null);
  };
  const goToToday = () => {
    setSelectedDate(todayStr());
    setSelectedEvent(null);
    setForm(null);
  };

  // ── Event CRUD ─────────────────────────────────────────────────────────
  const openNewEventForm = (hour, minute) => {
    if (!canManageEvents) return;
    const now = new Date();
    const h = hour ?? now.getHours();
    const m = minute ?? 0;
    let endH = h + 1;
    let endM = m;
    if (endH >= 24) { endH = 23; endM = 59; }
    setFormError("");
    setSelectedEvent(null);
    setForm({
      title: "", date: selectedDate,
      startHour: h, startMinute: m, endHour: endH, endMinute: endM,
      isAllDay: false, category: "other", color: getCategoryColor("other"), desc: "",
    });
  };

  const openEdit = (ev) => {
    if (!canManageEvents) return;
    setFormError("");
    setForm({ ...ev });
  };

  const handleSaveEvent = async () => {
    if (!form.title.trim()) { setFormError("Event title is required."); return; }
    if (!form.isAllDay) {
      const start = form.startHour * 60 + form.startMinute;
      const end   = form.endHour * 60 + form.endMinute;
      if (start >= end) { setFormError("End time must be after start time."); return; }
    }
    // Attach this calendar and sync color to category
    const payload = { ...form, calendar: id, color: getCategoryColor(form.category) };

    setSaving(true);
    setFormError("");
    try {
      if (payload.id) {
        const res = await eventsApi.updateEvent(payload.id, payload);
        const updated = { ...res.data, id: res.data._id };
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setSelectedEvent(updated);
      } else {
        const res = await eventsApi.createEvent(payload);
        const created = { ...res.data, id: res.data._id };
        setEvents((prev) => [...prev, created]);
      }
      setForm(null);
    } catch (err) {
      setFormError(payload.id ? permissionErrorMessage(err, "edit") : (err.message || "Couldn’t save the event."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    setActionError("");
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setForm(null);
      setSelectedEvent(null);
    } catch (err) {
      setActionError(permissionErrorMessage(err, "delete"));
      setForm(null);
    }
  };

  // ── Calendar settings (admin) ────────────────────────────────────────────
  const openEditCal = () => {
    setCalError("");
    setEditingCal({
      name: calendar.name,
      description: calendar.description || "",
      color: calendar.color || CALENDAR_COLORS[0],
    });
  };

  const handleSaveCal = async () => {
    if (!editingCal.name.trim()) { setCalError("Calendar name is required."); return; }
    setCalSaving(true);
    setCalError("");
    try {
      const res = await calendarsApi.updateCalendar(id, editingCal);
      setCalendar(res.data);
      setEditingCal(null);
    } catch (err) {
      setCalError(err.message || "Failed to update calendar.");
    } finally {
      setCalSaving(false);
    }
  };

  const handleDeleteCal = async () => {
    if (!window.confirm("Delete this calendar and all of its events? This cannot be undone.")) return;
    try {
      await calendarsApi.deleteCalendar(id);
      refreshCalendars();
      navigate("/calendars");
    } catch (err) {
      setError(err.message || "Failed to delete calendar.");
    }
  };

  // ── Members & invites ────────────────────────────────────────────────────
  const handleAddMember = async () => {
    const email = memberEmail.trim();
    if (!email) return;
    setMemberBusy(true);
    setMemberMsg(null);
    try {
      if (canAssign) {
        const res = await calendarsApi.assignMember(id, email);
        setCalendar(res.data);
        setMemberMsg({ type: "success", text: `${email} added to the calendar.` });
      } else {
        await invitesApi.sendInvite({ calendarId: id, invitedEmail: email });
        await loadInvites();
        setMemberMsg({ type: "success", text: `Invitation sent to ${email}.` });
      }
      setMemberEmail("");
    } catch (err) {
      setMemberMsg({ type: "error", text: err.message || "Action failed." });
    } finally {
      setMemberBusy(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the calendar?")) return;
    try {
      const res = await calendarsApi.removeMember(id, userId);
      setCalendar(res.data);
    } catch (err) {
      setMemberMsg({ type: "error", text: err.message || "Failed to remove member." });
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await invitesApi.deleteInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i._id !== inviteId));
    } catch (err) {
      setMemberMsg({ type: "error", text: err.message || "Failed to cancel invite." });
    }
  };

  if (loading) return <div className="event-list__empty">Loading calendar…</div>;
  if (error)   return <div className="event-list__empty event-list__empty--error">{error}</div>;

  const dayEvents    = events.filter((e) => e.date === selectedDate);
  const timedEvents  = dayEvents.filter((e) => !e.isAllDay);
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);

  const isToday = selectedDate === todayStr();
  const humanReadableDate = parseDateLocal(selectedDate).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  // Members counted/shown here include the calendar owner but exclude any
  // admin users (even an admin who owns the calendar). See utils/members.
  const members      = getCountedMembers(calendar);
  const pendingSent  = invites.filter((i) => i.status === "pending");

  // Note shown when an event was created by someone other than the viewer —
  // e.g. another member's event, or one an admin assigned to this calendar.
  const selectedNote = selectedEvent ? eventOwnershipNote(selectedEvent, user) : "";
  const formNote     = form?.id ? eventOwnershipNote(form, user) : "";

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>◀ Back</button>
      </div>

      {/* ── Calendar info ── */}
      <div className="card card--mb card--calendar" style={{ "--theme-color": calendar.color }}>
        <div className="card__dot" />
        <div className="card__body">
          <div className="card__title">{calendar.name}</div>
          <div className="card__sub">
            Owner: {calendar.owner?.name}
            {calendar.description ? ` · ${calendar.description}` : ""}
          </div>
        </div>
        {(canEditSettings || canDelete) && (
          <div className="card__actions">
            {canEditSettings && (
              <button className="btn btn--sm" onClick={openEditCal}>Edit</button>
            )}
            {canDelete && (
              <button className="btn--sm-danger" onClick={handleDeleteCal}>Delete</button>
            )}
          </div>
        )}
      </div>

      {!canManageEvents && (
        <div className="card__sub shared-calendar-meta">
          Read-only view · {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* ── Day navigation ── */}
      <div className="page-header__date-nav manage-date-nav">
        <button className="btn btn--ghost" onClick={() => changeDate(-1)}>◀</button>
        <div className="page-header__title page-header__title--sm">{humanReadableDate}</div>
        <button className="btn btn--ghost" onClick={() => changeDate(1)}>▶</button>
        <button className="btn btn--ghost btn--today" onClick={goToToday} disabled={isToday}>
          Today
        </button>
        {canManageEvents && (
          <button className="btn--primary manage-new-event" onClick={() => openNewEventForm()}>
            + New Event
          </button>
        )}
      </div>

      <AllDayBanner events={allDayEvents} onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }} />

      <div className="clock-wrapper">
        <ClockFace
          events={timedEvents}
          onClockClick={canManageEvents ? ({ hour, minute }) => openNewEventForm(hour, minute) : () => {}}
          onArcClick={(ev) => { setSelectedEvent(ev); setForm(null); }}
        />
      </div>

      {/* ── Event detail panel ── */}
      {selectedEvent && (
        <div className={`detail-panel theme-${selectedEvent.category || "other"}`}>
          <div className="detail-panel__header">
            <div>
              <div className="detail-panel__title-row">
                <div className="detail-panel__dot" />
                <span className="detail-panel__title">{selectedEvent.title}</span>
              </div>
              {!selectedEvent.isAllDay && (
                <div className="detail-panel__time">
                  {formatTime(selectedEvent.startHour, selectedEvent.startMinute)} → {formatTime(selectedEvent.endHour, selectedEvent.endMinute)}
                </div>
              )}
              {selectedEvent.desc && <div className="detail-panel__desc">{selectedEvent.desc}</div>}
            </div>
            <div className="detail-panel__actions">
              {canManageEvents && (
                <>
                  <button className="btn btn--sm" onClick={() => openEdit(selectedEvent)}>Edit</button>
                  <button className="btn--sm-danger" onClick={() => handleDeleteEvent(selectedEvent.id)}>Delete</button>
                </>
              )}
              <button className="btn--ghost" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
          </div>

          {/* Ownership note + rejection feedback for events the user can't manage */}
          {selectedNote && <div className="detail-panel__note">{selectedNote}</div>}
          {actionError && <div className="detail-panel__action-error">{actionError}</div>}
        </div>
      )}

      <EventList
        events={timedEvents}
        selectedId={selectedEvent?.id}
        onSelect={(ev) => { setSelectedEvent(ev); setForm(null); }}
      />

      {canManageEvents && (
        <EventForm
          form={form}
          setForm={setForm}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          saving={saving}
          error={formError}
          note={formNote}
        />
      )}

      {/* ── Members ── */}
      <div className="section-label section-label--mt">Members ({members.length})</div>
      {members.length === 0 && <div className="card__sub card__sub--mb">No members yet.</div>}
      {members.map((m) => (
        <div key={m._id} className="member-row">
          <div className="member-row__info">
            <div className="card__title card__title--sm">
              {m.name}
              {m.isOwner && <span className="member-row__owner-badge">Owner</span>}
            </div>
            <div className="card__sub">{m.email}</div>
          </div>
          {canRemoveMember && !m.isOwner && (
            <button className="btn--sm-danger" onClick={() => handleRemoveMember(m._id)}>
              Remove
            </button>
          )}
        </div>
      ))}

      {/* ── Add member (invite for owners, assign for admins) ── */}
      {(canInvite || canAssign) && (
        <>
          <div className="section-label section-label--mt">
            {canAssign ? "Assign a member" : "Invite people"}
          </div>
          <div className="inline-form">
            <input
              className="form-input inline-form__input"
              type="email"
              placeholder="person@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
            <button className="btn--primary" onClick={handleAddMember} disabled={memberBusy}>
              {memberBusy ? "Working…" : canAssign ? "Assign" : "Send invite"}
            </button>
          </div>
          {memberMsg && (
            <div className={memberMsg.type === "error" ? "form-error-msg" : "form-success-msg"}>
              {memberMsg.text}
            </div>
          )}
        </>
      )}

      {/* ── Pending invites ── */}
      {canSeeInvites && pendingSent.length > 0 && (
        <>
          <div className="section-label section-label--mt">Pending invites ({pendingSent.length})</div>
          {pendingSent.map((inv) => (
            <div key={inv._id} className="member-row">
              <div className="member-row__info">
                <div className="card__title card__title--sm">{inv.invitedUser?.name || inv.invitedUser?.email}</div>
                <div className="card__sub">{inv.invitedUser?.email} · awaiting response</div>
              </div>
              <button className="btn--sm-danger" onClick={() => handleCancelInvite(inv._id)}>
                Cancel
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── Edit calendar modal (admin) ── */}
      {editingCal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCal(null); }}
        >
          <div className="modal">
            <div className="modal__title">Edit Calendar</div>

            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={editingCal.name}
              onChange={(e) => setEditingCal({ ...editingCal, name: e.target.value })}
              autoFocus
            />

            <label className="form-label">Description</label>
            <input
              className="form-input"
              value={editingCal.description}
              onChange={(e) => setEditingCal({ ...editingCal, description: e.target.value })}
              placeholder="What is this calendar for?"
            />

            <label className="form-label">Color</label>
            <div className="color-picker">
              {CALENDAR_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${editingCal.color === c ? "color-swatch--active" : ""}`}
                  onClick={() => setEditingCal({ ...editingCal, color: c })}
                  style={{ "--swatch": c }}
                />
              ))}
            </div>

            {calError && <div className="form-error-msg">{calError}</div>}

            <div className="modal__actions">
              <button className="btn btn--secondary" onClick={() => setEditingCal(null)} disabled={calSaving}>
                Cancel
              </button>
              <button
                className="btn cal-submit-btn"
                onClick={handleSaveCal}
                disabled={calSaving}
                style={{ "--theme-color": editingCal.color }}
              >
                {calSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCalendar;