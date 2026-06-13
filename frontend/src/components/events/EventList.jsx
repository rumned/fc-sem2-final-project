import EventCard from "./EventCard";

const EventList = ({ events, selectedId, onSelect }) => {
  const sorted = [...events].sort(
    (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
  );

  return (
    <div className="event-list">
      <div className="section-label">Today's Schedule</div>
      {sorted.length === 0 ? (
        <div className="event-list__empty">
          No events yet — click the clock to add one
        </div>
      ) : (
        sorted.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            isSelected={selectedId === ev.id}
            onClick={() => onSelect(ev)}
          />
        ))
      )}
    </div>
  );
};

export default EventList;
