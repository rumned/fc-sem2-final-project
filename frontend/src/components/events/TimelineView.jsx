import React from "react";
import { formatTime, todayStr } from "../../utils/clockMath";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_H = 56; // px per hour — must match .timeline-grid__row height in CSS

// Traditional day-planner: a vertical column of hour rows with events placed
// (and sized) according to their start/end time, like a classic calendar grid.
const TimelineView = ({ events, selectedDate, selectedId, onSelect }) => {
  const timed = events.filter((e) => !e.isAllDay);

  const isToday = selectedDate === todayStr();
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="timeline-grid">
      {HOURS.map((h) => (
        <div key={h} className="timeline-grid__row">
          <div className="timeline-grid__hour">{formatTime(h, 0)}</div>
          <div className="timeline-grid__slot" />
        </div>
      ))}

      {/* "now" line, only for today */}
      {isToday && (
        <div
          className="timeline-grid__now"
          style={{ "--now-top": `${(nowMins / 60) * ROW_H}px` }}
        >
          <span className="timeline-grid__now-dot" />
        </div>
      )}

      {/* Event blocks, absolutely positioned over the grid */}
      <div className="timeline-grid__events">
        {timed.map((ev) => {
          const startMins = ev.startHour * 60 + ev.startMinute;
          const endMins = ev.endHour * 60 + ev.endMinute;
          const top = (startMins / 60) * ROW_H;
          const height = Math.max(((endMins - startMins) / 60) * ROW_H, 22);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => onSelect(ev)}
              className={`timeline-block theme-${ev.category || "other"} ${
                selectedId === ev.id ? "timeline-block--selected" : ""
              }`}
              style={{ "--block-top": `${top}px`, "--block-height": `${height}px` }}
            >
              <span className="timeline-block__title">{ev.title}</span>
              <span className="timeline-block__time">
                {formatTime(ev.startHour, ev.startMinute)} → {formatTime(ev.endHour, ev.endMinute)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
