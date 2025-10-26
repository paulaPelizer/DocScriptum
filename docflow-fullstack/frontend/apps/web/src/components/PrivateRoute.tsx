import { Navigate } from "react-router-dom";
import { getToken } from "@/services/auth";

/**
 * Wrapper para proteger rotas privadas.
 * Redireciona para /login se não houver token salvo.
 */
export function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}
