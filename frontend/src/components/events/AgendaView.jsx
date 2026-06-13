import React from "react";
import { formatTime } from "../../utils/clockMath";

// A clean, per-day agenda: all-day items first, then timed events in order.
// Tapping an event selects it (shared detail panel handles the rest).
const AgendaView = ({ events, selectedId, onSelect }) => {
  const allDay = events.filter((e) => e.isAllDay);
  const timed = [...events.filter((e) => !e.isAllDay)].sort(
    (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
  );

  if (events.length === 0) {
    return <div className="event-list__empty">No events for this day.</div>;
  }

  return (
    <div className="agenda-view">
      {allDay.length > 0 && (
        <>
          <div className="section-label">All Day</div>
          {allDay.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onSelect(ev)}
              className={`agenda-row theme-${ev.category || "other"} ${
                selectedId === ev.id ? "agenda-row--selected" : ""
              }`}
            >
              <span className="agenda-row__time agenda-row__time--allday">All day</span>
              <span className="agenda-row__bar" />
              <span className="agenda-row__title">{ev.title}</span>
            </button>
          ))}
        </>
      )}

      <div className="section-label">Scheduled</div>
      {timed.length === 0 ? (
        <div className="event-list__empty">Nothing scheduled.</div>
      ) : (
        timed.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onSelect(ev)}
            className={`agenda-row theme-${ev.category || "other"} ${
              selectedId === ev.id ? "agenda-row--selected" : ""
            }`}
          >
            <span className="agenda-row__time">
              {formatTime(ev.startHour, ev.startMinute)}
            </span>
            <span className="agenda-row__bar" />
            <span className="agenda-row__body">
              <span className="agenda-row__title">{ev.title}</span>
              <span className="agenda-row__range">
                {formatTime(ev.startHour, ev.startMinute)} → {formatTime(ev.endHour, ev.endMinute)}
              </span>
            </span>
          </button>
        ))
      )}
    </div>
  );
};

export default AgendaView;
