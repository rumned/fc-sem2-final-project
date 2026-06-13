import React from "react";
import { CATEGORIES } from "../../utils/constants";

const EventForm = ({ form, setForm, onSave, onDelete, saving = false, error = "", note = "" }) => {
  if (!form) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}
    >
      <div className="modal">
        <div className="modal__title">
          {form.id ? "Edit Event" : "New Event"}
        </div>

        {/* Ownership note — shown when editing an event the user didn't create */}
        {note && <div className="form-note">{note}</div>}

        {/* Title */}
        <label className="form-label">Title</label>
        <input
          className="form-input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Event title"
        />

        {/* Date */}
        <label className="form-label">Date</label>
        <input
          className="form-input"
          type="date"
          value={form.date || ""}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        {/* All day toggle */}
        <div className="toggle-row">
          <div
            onClick={() => setForm({ ...form, isAllDay: !form.isAllDay })}
            className={`form-toggle ${form.isAllDay ? "form-toggle--active" : ""}`}
          >
            <div className="form-toggle__dot" />
          </div>
          <span className="toggle-label">All-Day Event</span>
        </div>

        {/* Category — drives the arc color automatically */}
        <label className="form-label">Category</label>
        <select
          className="form-input"
          value={form.category || "work"}
          onChange={(e) => {
            const cat = CATEGORIES.find((c) => c.id === e.target.value);
            setForm({ ...form, category: e.target.value, color: cat?.color || "var(--theme-other)" });
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>

        {/* Times */}
        {!form.isAllDay && (
          <div className="form-grid-2">
            <div>
              <label className="form-label">Start Time</label>
              <input
                className="form-input form-input--time"
                type="time"
                value={`${String(form.startHour).padStart(2, "0")}:${String(form.startMinute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setForm({ ...form, startHour: h || 0, startMinute: m || 0 });
                }}
              />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input
                className="form-input form-input--time"
                type="time"
                value={`${String(form.endHour).padStart(2, "0")}:${String(form.endMinute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setForm({ ...form, endHour: h || 0, endMinute: m || 0 });
                }}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <label className="form-label">Notes</label>
        <textarea
          className="form-input form-textarea"
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          placeholder="Optional notes..."
          rows={2}
        />

        {/* API error message */}
        {error && (
          <div className="form-error-msg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={() => setForm(null)} disabled={saving}>
            Cancel
          </button>
          {form.id && (
            <button className="btn btn--danger" onClick={() => onDelete(form.id)} disabled={saving}>
              Delete
            </button>
          )}
          <button
            className={`btn form-submit-btn theme-${form.category || "other"}`}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : form.id ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventForm;