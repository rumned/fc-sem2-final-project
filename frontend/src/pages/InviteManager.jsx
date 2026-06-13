import React, { useState, useEffect } from "react";
import * as invitesApi from "../api/invites";
import { useCalendar } from "../context/CalendarContext";
import { useNotifications } from "../context/NotificationsContext";

const InviteManager = () => {
  const { clearCache } = useCalendar();
  const { refreshInvites, refreshCalendars } = useNotifications();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await invitesApi.getInvites();
        setInvites(res.data);
      } catch (err) {
        setError(err.message || "Failed to load invites.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const respond = async (id, status) => {
    try {
      const res = await invitesApi.respondInvite(id, status);
      setInvites((prev) =>
        prev.map((inv) => (inv._id === id ? { ...inv, status: res.data.status } : inv))
      );

      // Accepting an invite adds this user to the calendar, exposing its
      // existing events. Clearing the cached events forces the Clock dashboard
      // and Agenda to re-fetch and show them right away — no refresh needed.
      if (status === "accepted") {
        clearCache();
        refreshCalendars();
      }
      // Keep the navbar invite badge in sync with the new status.
      refreshInvites();
    } catch (err) {
      console.error("Failed to respond:", err.message);
    }
  };

  const pending   = invites.filter((i) => i.status === "pending");
  const responded = invites.filter((i) => i.status !== "pending");

  if (loading) return <div className="event-list__empty">Loading invites…</div>;
  if (error)   return <div className="event-list__empty event-list__empty--error">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Collaborative Invites</div>
          <div className="page-header__title page-header__title--sm">Shared Requests</div>
        </div>
      </div>

      <div className="section-label">Pending ({pending.length})</div>
      {pending.length === 0 && <div className="event-list__empty">No pending invitations</div>}

      {pending.map((inv) => (
        <div
          key={inv._id}
          className="card card--calendar"
          style={{ "--theme-color": inv.calendar?.color }}
        >
          <div className="card__dot" />
          <div className="card__body">
            <div className="card__title">{inv.calendar?.name || "Shared Schedule"}</div>
            <div className="card__sub">Invited by {inv.invitedBy?.name}</div>
          </div>
          <div className="card__actions">
            <button
              className="btn btn--sm btn--success"
              onClick={() => respond(inv._id, "accepted")}
            >
              Accept
            </button>
            <button className="btn--sm-danger" onClick={() => respond(inv._id, "declined")}>
              Decline
            </button>
          </div>
        </div>
      ))}

      {responded.length > 0 && (
        <>
          <div className="section-label section-label--mt">Responded</div>
          {responded.map((inv) => (
            <div
              key={inv._id}
              className="card card--dimmed card--calendar"
              style={{ "--theme-color": inv.calendar?.color }}
            >
              <div className="card__dot" />
              <div className="card__body">
                <div className="card__title">{inv.calendar?.name}</div>
                <div className="card__sub">From {inv.invitedBy?.name}</div>
              </div>
              <span className={`badge ${inv.status === "accepted" ? "badge--accepted" : "badge--declined"}`}>
                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default InviteManager;