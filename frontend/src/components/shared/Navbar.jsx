import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";

const NAV_ITEMS = [
  { label: "Schedule",     path: "/" },
  { label: "Calendars", path: "/calendars" },
  { label: "Invites",   path: "/invites" },
  { label: "Analytics", path: "/analytics" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { pendingInviteCount, calendarCount, refreshAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Re-check the badge counts whenever the route changes, so invites received
  // or calendars joined elsewhere show up without a manual refresh.
  useEffect(() => {
    refreshAll();
  }, [location.pathname, refreshAll]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  // Small count badge shown next to a nav item. Returns null when there's
  // nothing to show so the label stays clean.
  const badgeFor = (path) => {
    if (path === "/invites" && pendingInviteCount > 0) {
      return (
        <span className="nav-item__badge nav-item__badge--invite" aria-label={`${pendingInviteCount} pending invites`}>
          {pendingInviteCount}
        </span>
      );
    }
    if (path === "/calendars" && calendarCount > 0) {
      return (
        <span className="nav-item__badge nav-item__badge--calendar" aria-label={`${calendarCount} calendars`}>
          {calendarCount}
        </span>
      );
    }
    return null;
  };

  const navTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
    setMenuOpen(false);
  };

  const items = user?.role === "admin"
    ? [...NAV_ITEMS, { label: "Admin", path: "/admin" }]
    : NAV_ITEMS;

  return (
    <nav className="navbar">
      {/* ── Desktop links ── */}
      <div className="navbar__links">
        {items.map(({ label, path }) => (
          <button
            key={path}
            className={`nav-item ${isActive(path) ? "nav-item--active" : ""}`}
            onClick={() => navTo(path)}
          >
            {label}
            {badgeFor(path)}
          </button>
        ))}
      </div>

      {/* ── Desktop user ── */}
      <div className="navbar__user">
        <span className="navbar__username">{user?.name}</span>
        <button className="navbar__btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      {/* ── Mobile: app title + username + hamburger ── */}
      <div className="navbar__mobile-header">
        <span className="navbar__brand">ClockScheduler</span>
        <div className="navbar__mobile-right">
          <span className="navbar__username">{user?.name}</span>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger__line ${menuOpen ? "hamburger__line--open-1" : ""}`} />
            <span className={`hamburger__line ${menuOpen ? "hamburger__line--open-2" : ""}`} />
            <span className={`hamburger__line ${menuOpen ? "hamburger__line--open-3" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="nav-drawer">
          {items.map(({ label, path }) => (
            <button
              key={path}
              className={`nav-item ${isActive(path) ? "nav-item--active" : ""}`}
              onClick={() => navTo(path)}
            >
              {label}
              {badgeFor(path)}
            </button>
          ))}
          <div className="nav-drawer__divider" />
          <button className="nav-item nav-item--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
