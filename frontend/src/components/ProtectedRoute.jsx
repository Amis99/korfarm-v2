import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, requiredRoles }) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => user?.roles?.includes(role));
    if (!hasRole) {
      return <Navigate to="/start" replace />;
    }
  }

  return children;
}

export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={["HQ_ADMIN", "ORG_ADMIN", "TEACHER"]}>
      {children}
    </ProtectedRoute>
  );
}
