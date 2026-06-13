import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCalendar } from "../context/CalendarContext";
import { formatTime, todayStr, parseDateLocal } from "../utils/clockMath";

const DayDetail = () => {
  const navigate = useNavigate();
  const { date } = useParams();
  const { events, fetchEventsByDate } = useCalendar();

  // Fall back to today if the route somehow has no date
  const dateStr = date || todayStr();

  useEffect(() => {
    fetchEventsByDate(dateStr);
  }, [dateStr, fetchEventsByDate]);

  // Only this day's events — the context holds events for many dates at once
  const dayEvents = events.filter((e) => e.date === dateStr);

  const timedEvents = dayEvents
    .filter((e) => !e.isAllDay)
    .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute));

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);

  const isToday = dateStr === todayStr();
  const humanReadableDate = parseDateLocal(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="page-container">
      <div className="day-detail__header">
        <div className="page-header__eyebrow">Full Day View</div>
        <div className="page-header__title page-header__title--sm">
          {humanReadableDate}
        </div>
      </div>

      {allDayEvents.length > 0 && (
        <div className="day-detail__allday-section">
          <div className="section-label">All Day</div>
          {allDayEvents.map((ev) => (
            <div key={ev.id} className={`day-timeline__allday-card theme-${ev.category || "other"}`}>
              <span className="day-timeline__title">{ev.title}</span>
              {ev.desc && <div className="card__sub day-timeline__desc--mt">{ev.desc}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="section-label">Scheduled</div>

      {timedEvents.length === 0 ? (
        <div className="event-list__empty day-timeline__empty">
          No events scheduled for {isToday ? "today" : "this day"}
        </div>
      ) : (
        timedEvents.map((ev) => (
          <div key={ev.id} className="day-timeline">
            <div className="day-timeline__time">{formatTime(ev.startHour, ev.startMinute)}</div>
            <div className={`day-timeline__bar theme-${ev.category || "other"}`} />
            <div className="day-timeline__card">
              <div className="day-timeline__title">{ev.title}</div>
              <div className="day-timeline__time-range">
                {formatTime(ev.startHour, ev.startMinute)} → {formatTime(ev.endHour, ev.endMinute)}
              </div>
              {ev.desc && <div className="day-timeline__desc">{ev.desc}</div>}
            </div>
          </div>
        ))
      )}

      <button className="btn btn--secondary timeline-back-btn" onClick={() => navigate(-1)}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default DayDetail;