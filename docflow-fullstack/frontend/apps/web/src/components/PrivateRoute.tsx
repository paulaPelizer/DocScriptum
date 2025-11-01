// src/components/PrivateRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, LOGIN_PATH, setReturnTo } from "@/services/auth";

/**
 * Wrapper para rotas privadas considerando JWT **ou** cookie-only.
 */
export function PrivateRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const dest = `${location.pathname}${location.search}${location.hash}`;

  if (location.pathname.startsWith(LOGIN_PATH)) return children;

  if (!isAuthenticated()) {
    setReturnTo(dest);
    return <Navigate to={`${LOGIN_PATH}?returnTo=${encodeURIComponent(dest)}`} replace />;
  }

  return children;
}