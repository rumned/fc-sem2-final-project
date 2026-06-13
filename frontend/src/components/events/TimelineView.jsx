import React from "react";
import { formatTime, todayStr } from "../../utils/clockMath";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_H = 56; // px per hour — must match .timeline-grid__row height in CSS

// Traditional day-planner: a vertical column of hour rows with events placed
// (and sized) according to their start/end time, like a classic calendar grid.
const TimelineView = ({ events, selectedDate, selectedId, onSelect, onGridClick }) => {
  const timed = events.filter((e) => !e.isAllDay);

  const isToday = selectedDate === todayStr();
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="timeline-grid" style={{ position: "relative" }}>
      {HOURS.map((h) => (
        <div key={h} className="timeline-grid__row">
          <div className="timeline-grid__hour">{formatTime(h, 0)}</div>
          {/* Clicking an empty slot triggers the new event form at that hour */}
          <div 
            className="timeline-grid__slot" 
            onClick={() => {
              if (onGridClick) onGridClick(h);
            }}
            style={{ cursor: "pointer", width: "100%", height: "100%" }}
          />
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

      {/* CRITICAL FIX: pointerEvents: "none" ensures clicks pass THROUGH this invisible 
        absolute container down onto the .timeline-grid__slot rows underneath.
      */}
      <div 
        className="timeline-grid__events" 
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}
      >
        {timed.map((ev) => {
          const startMins = ev.startHour * 60 + ev.startMinute;
          const endMins = ev.endHour * 60 + ev.endMinute;
          const top = (startMins / 60) * ROW_H;
          const height = Math.max(((endMins - startMins) / 60) * ROW_H, 22);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={(e) => {
                // Prevent bubbling up
                e.stopPropagation(); 
                onSelect(ev);
              }}
              className={`timeline-block theme-${ev.category || "other"} ${
                selectedId === ev.id ? "timeline-block--selected" : ""
              }`}
              /* pointerEvents: "auto" makes sure actual events remain clickable! */
              style={{ 
                "--block-top": `${top}px`, 
                "--block-height": `${height}px`,
                pointerEvents: "auto" 
              }}
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