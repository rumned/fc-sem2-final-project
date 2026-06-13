import { timeToAngle } from "./clockMath";

// Split any event that crosses noon into two segments
export const splitCrossRingEvents = (events) => {
  const result = [];
  for (const ev of events) {
    const crossesNoon = ev.startHour < 12 && ev.endHour >= 12;
    if (crossesNoon) {
      // AM segment: start → 11:59
      result.push({
        ...ev,
        id: ev.id + "_am",
        originalId: ev.id,
        endHour: 11,
        endMinute: 59,
        isSplit: true,
        splitPart: "am",
      });
      // PM segment: 12:00 → end
      result.push({
        ...ev,
        id: ev.id + "_pm",
        originalId: ev.id,
        startHour: 12,
        startMinute: 0,
        isSplit: true,
        splitPart: "pm",
        opacity: 0.5, // continuation arc is dimmer
      });
    } else {
      result.push({ ...ev, originalId: ev.id });
    }
  }
  return result;
};

export const assignArcOffsets = (events, outerR, innerR, arcWidth, gap) => {
  const expanded = splitCrossRingEvents(events);

  const amEvents = expanded.filter((e) => e.startHour < 12);
  const pmEvents = expanded.filter((e) => e.startHour >= 12);

  const offsetGroup = (group, baseR) => {
    const sorted = [...group].sort((a, b) =>
      timeToAngle(a.startHour, a.startMinute) - timeToAngle(b.startHour, b.startMinute)
    );
    const layers = [];
    return sorted.map((ev) => {
      const evStart = timeToAngle(ev.startHour, ev.startMinute);
      let layer = 0;
      while (layers[layer]) {
        const lEnd = timeToAngle(layers[layer].endHour, layers[layer].endMinute);
        if (lEnd > evStart) layer++;
        else break;
      }
      layers[layer] = ev;
      return { ...ev, radius: baseR - layer * (arcWidth + gap), layer };
    });
  };

  return [
    ...offsetGroup(amEvents, outerR),
    ...offsetGroup(pmEvents, innerR),
  ];
};