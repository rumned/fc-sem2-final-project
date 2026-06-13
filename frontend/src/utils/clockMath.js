export const timeToAngle = (hours, minutes) => {
  const h = hours % 12;
  return ((h + minutes / 60) / 12) * 360;
};

export const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

export const describeArc = (cx, cy, r, startAngle, endAngle) => {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  const large = diff > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

// No longer needs windowStart — angle is purely based on hour % 12
export const angleToTime = (angleDeg, isPM) => {
  const norm = ((angleDeg % 360) + 360) % 360;
  const totalMins = (norm / 360) * 720;
  const h = Math.floor(totalMins / 60) + (isPM ? 12 : 0);
  const m = Math.round(totalMins % 60);
  return { hour: h % 24, minute: m };
};

export const formatTime = (h, m) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
};

// ─── LOCAL-DATE HELPERS ──────────────────────────────────────────────────
// Use these instead of new Date().toISOString() / new Date("YYYY-MM-DD").
// toISOString() returns UTC, so near midnight it can report the wrong day,
// and new Date("YYYY-MM-DD") parses as UTC midnight (shifts the day in many
// timezones). These helpers stay in the user's local timezone.

// Date object → "YYYY-MM-DD" using local time
export const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Today as "YYYY-MM-DD" in local time
export const todayStr = () => toDateStr(new Date());

// Parse "YYYY-MM-DD" → local Date (midnight local, not UTC)
export const parseDateLocal = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Shift a "YYYY-MM-DD" string by N days, staying in local time
export const shiftDateStr = (dateStr, days) => {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};