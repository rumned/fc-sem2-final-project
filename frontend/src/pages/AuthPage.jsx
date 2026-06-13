import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const { loginWithCredentials, registerWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit a field and clear any visible error, so a stale message never lingers
  // while the user is correcting their input.
  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await loginWithCredentials(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError("Name is required."); setLoading(false); return; }
        await registerWithCredentials(form.name, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="auth-wrapper">
      <div className="auth-logo-wrap">
        <div className="auth-logo">🕐 ClockScheduler</div>
        <div className="auth-tagline">Your day, on the clock.</div>
      </div>

      <div className="auth-card">
        <div className="auth-tab-bar">
          <button className={`auth-tab ${tab === "login"    ? "auth-tab--active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Login</button>
          <button className={`auth-tab ${tab === "register" ? "auth-tab--active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Register</button>
        </div>

        {tab === "register" && (
          <>
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name}
              onChange={setField("name")}
              onKeyDown={handleKey} placeholder="Your name" />
          </>
        )}

        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={form.email}
          onChange={setField("email")}
          onKeyDown={handleKey} placeholder="you@example.com" />

        <label className="form-label">Password</label>
        <input className="form-input" type="password" value={form.password}
          onChange={setField("password")}
          onKeyDown={handleKey} placeholder="••••••••" />

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : tab === "login" ? "Login" : "Create Account"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
