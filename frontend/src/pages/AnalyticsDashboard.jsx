import React, { useState, useEffect } from "react";
import { useCalendar } from "../context/CalendarContext";
import { CATEGORIES } from "../utils/constants";
import { toDateStr } from "../utils/clockMath";

const getDuration = (ev) =>
  (ev.endHour * 60 + ev.endMinute - ev.startHour * 60 - ev.startMinute) / 60;

const sumByCategory = (evs) => {
  const result = {};
  CATEGORIES.forEach((cat) => (result[cat.id] = 0));
  evs.forEach((ev) => {
    if (ev.category && result[ev.category] !== undefined) {
      result[ev.category] += getDuration(ev);
    }
  });
  return result;
};

// Monday (local, midnight) of the week `offset` weeks away from the current
// one. offset 0 = this week, -1 = last week, +1 = next week, etc.
const getWeekMonday = (offset = 0) => {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CategoryBar = ({ cat, hours, maxHours }) => {
  if (hours === 0) return null;
  return (
    <div className={`category-bar theme-${cat.id}`}>
      <div className="category-bar__header">
        <span className="category-bar__label">{cat.icon} {cat.label}</span>
        <span className="category-bar__time">{hours.toFixed(1)}h</span>
      </div>
      <div className="category-bar__track">
        <div 
          className="category-bar__fill" 
          style={{ "--fill-pct": `${(hours / (maxHours || 1)) * 100}%` }} 
        />
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const { events, fetchEventsByRange } = useCalendar();
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekTotals, setWeekTotals] = useState({});
  const [dayTotals, setDayTotals] = useState([]);

  const monday = getWeekMonday(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Load the displayed week's events. Analytics may be the first page a user
  // opens, so we can't assume the events are already cached — fetch the range
  // whenever the week changes. The context keeps events from other ranges.
  useEffect(() => {
    fetchEventsByRange(toDateStr(monday), toDateStr(sunday));
    // monday/sunday are derived from weekOffset; depending on it is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, fetchEventsByRange]);

  useEffect(() => {
    const start = getWeekMonday(weekOffset);
    const endExclusive = new Date(start);
    endExclusive.setDate(start.getDate() + 7);

    const startStr = toDateStr(start);
    const endStr = toDateStr(endExclusive);

    // Compare on the YYYY-MM-DD strings (events store dates that way) so the
    // window matches the user's local week rather than a UTC-shifted one.
    const weekEvents = events.filter((ev) => {
      if (ev.isAllDay) return false;
      return ev.date >= startStr && ev.date < endStr;
    });

    setWeekTotals(sumByCategory(weekEvents));

    const daily = Array.from({ length: 7 }, () => ({}));
    for (let i = 0; i < 7; i++) {
      const dTarget = new Date(start);
      dTarget.setDate(start.getDate() + i);
      const dStr = toDateStr(dTarget);

      const evsForDay = weekEvents.filter((ev) => ev.date === dStr);
      daily[i] = sumByCategory(evsForDay);
    }
    setDayTotals(daily);
  }, [events, weekOffset]);

  const fmtDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekRangeLabel = `${fmtDay(monday)} – ${fmtDay(sunday)}`;
  const weekRelativeLabel =
    weekOffset === 0 ? "This week"
    : weekOffset === -1 ? "Last week"
    : weekOffset === 1 ? "Next week"
    : weekOffset < 0 ? `${-weekOffset} weeks ago`
    : `In ${weekOffset} weeks`;

  const totalWeekHours = Object.values(weekTotals).reduce((a, b) => a + b, 0);
  const maxCatHours = Math.max(...Object.values(weekTotals), 0);

  const dailyAggregates = dayTotals.map((dayMap) =>
    Object.values(dayMap).reduce((a, b) => a + b, 0)
  );
  const maxDayHours = Math.max(...dailyAggregates, 0);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div className="page-header__eyebrow">Performance Metrics</div>
        <div className="page-header__title page-header__title--sm">Time Analytics</div>
      </div>

      {/* Week scroller — move between weeks; "This week" jumps back to today's */}
      <div className="analytics-week-nav">
        <button
          className="btn btn--ghost"
          onClick={() => setWeekOffset((o) => o - 1)}
          aria-label="Previous week"
        >
          ◀
        </button>
        <div className="analytics-week-nav__label">
          <span className="analytics-week-nav__range">{weekRangeLabel}</span>
          <span className="analytics-week-nav__rel">{weekRelativeLabel}</span>
        </div>
        <button
          className="btn btn--ghost"
          onClick={() => setWeekOffset((o) => o + 1)}
          aria-label="Next week"
        >
          ▶
        </button>
        <button
          className="btn btn--ghost btn--today"
          onClick={() => setWeekOffset(0)}
          disabled={weekOffset === 0}
        >
          This week
        </button>
      </div>

      <div className="section-label">Weekly Overview</div>
      <div className="analytics-total">
        Total Time Tracked: {totalWeekHours.toFixed(1)} hours
      </div>

      <div className="chart-container">
        {DAY_NAMES.map((name, idx) => {
          const totalH = dailyAggregates[idx] || 0;
          const heightPct = maxDayHours > 0 ? (totalH / maxDayHours) * 100 : 0;
          const dayMap = dayTotals[idx] || {};

          return (
            <div key={name} className="chart-column">
              <span className="chart-column__value">
                {totalH > 0 ? `${totalH.toFixed(1)}h` : ""}
              </span>
              <div 
                className="chart-bar-bg"
                title={`${name}: ${totalH.toFixed(1)} hours tracked`}
              >
                {CATEGORIES.map((cat) => {
                  const catH = dayMap[cat.id] || 0;
                  if (catH === 0) return null;
                  const segmentPct = totalH > 0 ? (catH / totalH) * heightPct : 0;
                  return (
                    <div
                      key={cat.id}
                      className={`chart-bar-segment theme-${cat.id}`}
                      style={{ "--seg-pct": `${segmentPct}%` }}
                    />
                  );
                })}
              </div>
              <span className="chart-column__label">{name}</span>
            </div>
          );
        })}
      </div>

      <div className="chart-legend">
        {CATEGORIES.filter((cat) => weekTotals[cat.id] > 0).map((cat) => (
          <div key={cat.id} className={`chart-legend__item theme-${cat.id}`}>
            <div className="chart-legend__color" />
            <span className="chart-legend__text">{cat.label}</span>
          </div>
        ))}
      </div>

      <div className="section-label analytics-section--mt">Weekly Totals</div>
      {CATEGORIES.filter((cat) => weekTotals[cat.id] > 0).length === 0 ? (
        <div className="event-list__empty">No categorised events this week</div>
      ) : (
        CATEGORIES.filter((cat) => weekTotals[cat.id] > 0).map((cat) => (
          <div key={cat.id} className="card analytics-card">
            <span className="analytics-card__icon">{cat.icon}</span>
            <div className="analytics-card__body theme-${cat.id}">
              <div className="card__title analytics-card__title">{cat.label}</div>
              <div className="card__sub">
                {((weekTotals[cat.id] / totalWeekHours) * 100).toFixed(0)}% of tracked time
              </div>
            </div>
            <div className={`analytics-card__value theme-${cat.id}`}>
              {weekTotals[cat.id].toFixed(1)}h
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AnalyticsDashboard;