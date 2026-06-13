import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Usage:
//   <ProtectedRoute>              → requires any logged-in user
//   <ProtectedRoute role="admin"> → requires the given role
//   <ProtectedRoute requireAdmin> → requires admin role
const ProtectedRoute = ({ children, role, requireAdmin }) => {
  const { user, loading } = useAuth();

  // Wait for localStorage restore before deciding to redirect
  if (loading) return null;

  if (!user) return <Navigate to="/auth" replace />;

  // requireAdmin is shorthand for role="admin"
  const needsRole = requireAdmin ? "admin" : role;
  if (needsRole && user.role !== needsRole) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;