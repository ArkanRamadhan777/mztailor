import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
export function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <LoaderCircle className="animate-spin text-sage-600" />
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/mz-admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  return isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/mz-admin/login" state={{ forbidden: true }} replace />
  );
}
