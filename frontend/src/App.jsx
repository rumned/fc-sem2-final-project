import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CalendarProvider } from "./context/CalendarContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { ReminderProvider } from "./context/ReminderContext";
import Navbar from "./components/shared/Navbar";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import ClockDashboard from "./pages/ClockDashboard";
import DayDetail from "./pages/DayDetail";
import MyCalendars from "./pages/MyCalendars";
import SharedCalendar from "./pages/SharedCalendar";
import InviteManager from "./pages/InviteManager";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

// AppRoutes is inside AuthProvider so it can read useAuth
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="app-loading">
      <span className="app-loading__text">Loading…</span>
    </div>
  );

  return (
    <div className="app-shell">
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* Protected */}
        <Route path="/" element={
          <ProtectedRoute><ClockDashboard /></ProtectedRoute>
        } />
        <Route path="/day/:date" element={
          <ProtectedRoute><DayDetail /></ProtectedRoute>
        } />
        <Route path="/calendars" element={
          <ProtectedRoute><MyCalendars /></ProtectedRoute>
        } />
        <Route path="/calendars/:id" element={
          <ProtectedRoute><SharedCalendar /></ProtectedRoute>
        } />
        <Route path="/invites" element={
          <ProtectedRoute><InviteManager /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <CalendarProvider>
            <ReminderProvider>
              <AppRoutes />
            </ReminderProvider>
          </CalendarProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}