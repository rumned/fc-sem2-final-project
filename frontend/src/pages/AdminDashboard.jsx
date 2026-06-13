import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import * as usersApi     from "../api/users";
import * as calendarsApi from "../api/calendars";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState("users");
  const [users,     setUsers]     = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, cRes] = await Promise.all([
          usersApi.getUsers(),
          calendarsApi.getCalendars(),
        ]);
        setUsers(uRes.data);
        setCalendars(cRes.data);
      } catch (err) {
        setError(err.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleRole = async (id, currentRole) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await usersApi.updateUser(id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to toggle role:", err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err.message);
    }
  };

  const deleteCalendar = async (id) => {
    if (!window.confirm("Delete this calendar and all its events permanently?")) return;
    try {
      await calendarsApi.deleteCalendar(id);
      setCalendars((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Failed to delete calendar:", err.message);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-header__eyebrow">System Control</div>
            <div className="page-header__title page-header__title--sm">Admin Console</div>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${tab === "users" ? "tab--active" : ""}`}
            onClick={() => setTab("users")}
          >
            Users ({users.length})
          </button>
          <button
            className={`tab ${tab === "calendars" ? "tab--active" : ""}`}
            onClick={() => setTab("calendars")}
          >
            Calendars ({calendars.length})
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {loading && <div className="event-list__empty">Loading administrative records…</div>}

        {!loading && tab === "users" && (
          <div>
            <div className="section-label">Registered Users</div>
            {users.map((u) => (
              <div key={u._id} className="card">
                <div className="avatar">
                  {u.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="card__body">
                  <div className="card__title card__title--sm">{u.name}</div>
                  <div className="card__sub">{u.email}</div>
                </div>
                <span className={`badge ${u.role === "admin" ? "badge--admin" : "badge--user"}`}>
                  {u.role}
                </span>
                <button className="btn btn--sm" onClick={() => toggleRole(u._id, u.role)}>
                  Toggle Role
                </button>
                <button className="btn--sm-danger" onClick={() => deleteUser(u._id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "calendars" && (
          <div>
            <div className="section-label">All Calendars ({calendars.length})</div>
            {calendars.map((cal) => (
              <div
                key={cal._id}
                className="card card--calendar"
                style={{ "--theme-color": cal.color }}
              >
                <div className="card__dot" />
                <div className="card__body">
                  <div className="card__title card__title--sm">{cal.name}</div>
                  <div className="card__sub">Owner: {cal.owner?.name} · {cal.members?.length ?? 0} members</div>
                </div>
                <button className="btn btn--sm" onClick={() => navigate(`/calendars/${cal._id}`)}>
                  Manage
                </button>
                <button className="btn--sm-danger" onClick={() => deleteCalendar(cal._id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;