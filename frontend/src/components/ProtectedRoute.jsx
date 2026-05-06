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
  // TEACHER 는 본사·기관 관리자 전용 메뉴 접근 X — admin 영역은 HQ_ADMIN/ORG_ADMIN 만
  return (
    <ProtectedRoute requiredRoles={["HQ_ADMIN", "ORG_ADMIN"]}>
      {children}
    </ProtectedRoute>
  );
}
