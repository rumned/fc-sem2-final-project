import React from "react";

const AllDayBanner = ({ events, onSelect }) => {
  if (!events.length) return null;

  return (
    <div className="allday-list">
      {events.map((ev) => (
        <div
          key={ev.id}
          className={`allday-item theme-${ev.category || "other"}`}
          onClick={() => onSelect(ev)}
        >
          <div className="allday-item__left">
            <div className="allday-item__dot" />
            <span className="allday-item__title">
              {ev.title}
            </span>
          </div>
          <span className="allday-item__badge">
            ALL DAY
          </span>
        </div>
      ))}
    </div>
  );
};

export default AllDayBanner;