// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  isAuthenticated,
  LOGIN_PATH,
  setReturnTo,
  logout,
} from "@/services/auth";

/**
 * Componente de rota protegida:
 * - Exige usuário autenticado (token válido e não expirado)
 * - Armazena a rota atual para redirecionar após login
 * - Se token expirar, faz logout e retorna à tela de login
 */
type Props = {
  children: React.ReactNode;
};

export const PrivateRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();

  // Checa se o token (ou cookie) ainda é válido
  const authed = isAuthenticated();

  if (!authed) {
    // limpa qualquer resquício (em caso de expiração)
    logout();

    // salva o caminho atual para retorno pós-login
    const cur = `${location.pathname}${location.search}${location.hash}`;
    setReturnTo(cur);

    const target = `${LOGIN_PATH}?returnTo=${encodeURIComponent(cur)}`;
    return <Navigate to={target} replace />;
  }

  // se estiver autenticado, renderiza normalmente
  return <>{children}</>;
};
