import React from "react";
import { formatTime } from "../../utils/clockMath";

const EventCard = ({ event, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`event-card theme-${event.category || "other"} ${
      isSelected ? "event-card--selected" : ""
    }`}
  >
    <div className="event-card__bar" />
    <div className="card__body">
      <div className="event-card__title">
        {event.title}
      </div>
      <div className="event-card__time">
        {formatTime(event.startHour, event.startMinute)} → {formatTime(event.endHour, event.endMinute)}
      </div>
    </div>
    <div className="event-card__dot" />
  </div>
);

export default EventCard;