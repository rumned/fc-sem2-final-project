import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as invitesApi from "../api/invites";
import * as calendarsApi from "../api/calendars";

/**
 * Lightweight source of truth for the small count badges shown in the navbar:
 *   • pendingInviteCount — invitations this user has received and not yet answered
 *   • calendarCount      — how many calendars the user owns or belongs to
 *
 * Components can call the refresh functions after they change the underlying
 * data (responding to an invite, creating/deleting a calendar) so the badges
 * stay in sync without a full page reload.
 */
const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [invites,   setInvites]   = useState([]);
  const [calendars, setCalendars] = useState([]);

  const refreshInvites = useCallback(async () => {
    if (!user) { setInvites([]); return; }
    try {
      const res = await invitesApi.getInvites();
      setInvites(res.data);
    } catch {
      // Badge counts are non-critical — fail quietly rather than break the navbar.
    }
  }, [user]);

  const refreshCalendars = useCallback(async () => {
    if (!user) { setCalendars([]); return; }
    try {
      const res = await calendarsApi.getCalendars();
      setCalendars(res.data);
    } catch {
      // Same as above — never let a failed badge fetch surface as an error.
    }
  }, [user]);

  const refreshAll = useCallback(() => {
    refreshInvites();
    refreshCalendars();
  }, [refreshInvites, refreshCalendars]);

  // Load (and reset) counts whenever the logged-in user changes.
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Only invitations addressed to this user that are still awaiting a response.
  const pendingInviteCount = invites.filter(
    (inv) => inv.status === "pending" && String(inv.invitedUser?._id) === String(user?.id)
  ).length;

  const calendarCount = calendars.length;

  return (
    <NotificationsContext.Provider value={{
      pendingInviteCount,
      calendarCount,
      refreshInvites,
      refreshCalendars,
      refreshAll,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
