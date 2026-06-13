import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Clock",     path: "/" },
  { label: "Calendars", path: "/calendars" },
  { label: "Invites",   path: "/invites" },
  { label: "Analytics", path: "/analytics" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

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
          </button>
        ))}
      </div>

      {/* ── Desktop user ── */}
      <div className="navbar__user">
        <span className="navbar__username">{user?.name}</span>
        <button className="navbar__btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      {/* ── Mobile: username + hamburger ── */}
      <div className="navbar__mobile-header">
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
