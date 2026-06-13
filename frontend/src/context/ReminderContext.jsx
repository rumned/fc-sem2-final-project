import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useCalendar } from "./CalendarContext";
import { CATEGORIES } from "../utils/constants";
import { todayStr } from "../utils/clockMath";
import useReminders from "../hooks/useReminders";
import WhatNextModal from "../components/events/WhatNextModal";

const ReminderContext = createContext(null);

// Derive arc color from category — mirrors the dashboard's helper.
const getCategoryColor = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color || "var(--theme-other)";
};

// Hosts the reminder loop, the toggle state, and the What's-Next modal at the
// app level so reminders keep firing no matter which tab is open. Mounted once
// (above the router's page swap), so the "already alerted" memory and the
// toggle persist across navigation instead of resetting on every page change.
export const ReminderProvider = ({ children }) => {
  const { events, addEvent, fetchEventsByDate } = useCalendar();

  // Toggle is persisted so it survives navigation and full page reloads —
  // same localStorage convention the app uses for the session token/user.
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem("remindersEnabled") === "true");
  // Demo mode reveals test-only affordances (e.g. the "Test reminder" button)
  // that are hidden during normal use. Persisted so it survives navigation and
  // reloads — handy for flipping it on right before a presentation.
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem("demoMode") === "true");
  const [endedEvent,  setEndedEvent]  = useState(null);
  const [reminderMsg, setReminderMsg] = useState("");
  const msgTimer = useRef();

  // The dashboard registers a handler here while it's mounted, so that picking
  // a category opens its editable form instead of creating an event blind. If
  // nothing is registered (modal fired on another page), we fall back to
  // creating the event directly.
  const whatNextHandler = useRef(null);
  const registerWhatNextHandler = useCallback((fn) => {
    whatNextHandler.current = fn;
    return () => { if (whatNextHandler.current === fn) whatNextHandler.current = null; };
  }, []);

  useEffect(() => {
    localStorage.setItem("remindersEnabled", String(remindersEnabled));
  }, [remindersEnabled]);

  useEffect(() => {
    localStorage.setItem("demoMode", String(demoMode));
  }, [demoMode]);

  // When reminders are on, make sure today's events are loaded even if the
  // user never opens the dashboard — otherwise the loop has nothing to check.
  useEffect(() => {
    if (remindersEnabled) fetchEventsByDate(todayStr());
  }, [remindersEnabled, fetchEventsByDate]);

  const { testReminder } = useReminders(events, remindersEnabled, (ev) => {
    setEndedEvent(ev);
  });

  const toggleReminders = useCallback(() => setRemindersEnabled((v) => !v), []);
  const toggleDemoMode  = useCallback(() => setDemoMode((v) => !v), []);

  // Fire a sample alert and leave an in-app status note (alongside the alert)
  // so the user has a record the test ran after dismissing the dialog.
  const runTest = useCallback(async () => {
    const status = await testReminder();
    const messages = {
      sent:        "✅ Test reminder shown — reminders are working.",
      unsupported: "⚠️ This browser doesn't support alerts, so reminders can't be shown here.",
    };
    setReminderMsg(messages[status] || "");
    window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setReminderMsg(""), 6000);
  }, [testReminder]);

  // What's-Next: if the dashboard is open, hand off to its editable form.
  // Otherwise (modal fired on another page) schedule the chosen category for
  // today, starting now, directly.
  const handleWhatNext = async (category) => {
    setEndedEvent(null);
    if (whatNextHandler.current) {
      whatNextHandler.current(category);
      return;
    }
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    let eh = h + 1;
    if (eh >= 24) eh = 23;
    try {
      await addEvent({
        title: category.label,
        date: todayStr(),
        startHour: h,
        startMinute: m,
        endHour: eh,
        endMinute: m,
        isAllDay: false,
        category: category.id,
        color: getCategoryColor(category.id),
        desc: "",
      });
    } catch (err) {
      console.error("Failed to create follow-up event:", err.message);
    }
  };

  return (
    <ReminderContext.Provider value={{ remindersEnabled, toggleReminders, runTest, reminderMsg, registerWhatNextHandler, demoMode, toggleDemoMode }}>
      {children}
      <WhatNextModal endedEvent={endedEvent} onSelect={handleWhatNext} onSkip={() => setEndedEvent(null)} />
    </ReminderContext.Provider>
  );
};

export const useReminderSettings = () => useContext(ReminderContext);