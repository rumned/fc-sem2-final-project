import { useEffect, useRef, useCallback } from "react";
import { todayStr } from "../utils/clockMath";

// Reminders surface as a blocking browser alert() rather than an OS
// notification toast. Native notifications can be silently suppressed
// (Focus/Do-Not-Disturb, an unfocused tab, a non-https origin) — which is
// why nothing showed before — whereas alert() always appears and needs no
// permission prompt.
const notify = (title, body) => {
  if (typeof window === "undefined" || typeof window.alert !== "function") return false;
  window.alert(`${title}\n\n${body}`);
  return true;
};

// Fires a browser alert shortly before an event starts, and calls
// onEventEnd when an event finishes (for the What's Next modal).
//
// Returns a `testReminder` function so the UI can verify reminders work
// without waiting for a real event to come due.
const useReminders = (events, enabled, onEventEnd) => {
  const notifiedStart = useRef(new Set());
  const notifiedEnd = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      // Use the local date (matching how events store `date`) — toISOString()
      // is UTC and would report the wrong day in non-UTC timezones, so timed
      // reminders could silently never match.
      const today = todayStr();

      events
        .filter((ev) => !ev.isAllDay && ev.date === today)
        .forEach((ev) => {
          const startMins = ev.startHour * 60 + ev.startMinute;
          const endMins = ev.endHour * 60 + ev.endMinute;
          const minsToStart = startMins - currentMins;

          // Within 5 minutes before start (range, not exact match, so a slightly
          // drifted interval or a late-enabled reminder still fires once).
          const startKey = `start-${ev.id}`;
          if (minsToStart > 0 && minsToStart <= 5 && !notifiedStart.current.has(startKey)) {
            notifiedStart.current.add(startKey);
            notify(`Starting soon: ${ev.title}`, `Starts in ${minsToStart} minute${minsToStart === 1 ? "" : "s"}`);
          }

          // At or just past the end of the event.
          const endKey = `end-${ev.id}`;
          if (currentMins >= endMins && currentMins <= endMins + 1 && !notifiedEnd.current.has(endKey)) {
            notifiedEnd.current.add(endKey);
            notify(`${ev.title} has ended`, "Time to choose what's next!");
            onEventEnd?.(ev);
          }
        });
    };

    check(); // run once immediately on mount/change
    const interval = setInterval(check, 30_000); // then twice a minute
    return () => clearInterval(interval);
  }, [events, enabled, onEventEnd]);

  // Fire an immediate sample alert so the user can confirm reminders work.
  // The caller gets one of:
  //   "sent"        – alert fired
  //   "unsupported" – alert() not available (e.g. some embedded webviews)
  const testReminder = useCallback(async () => {
    const ok = notify("🔔 Test reminder", "Reminders are working!");
    return ok ? "sent" : "unsupported";
  }, []);

  return { testReminder };
};

export default useReminders;
