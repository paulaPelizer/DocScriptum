// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/services/auth";
import { apiFetch } from "@/services/api";

export default function ProtectedRoute() {
  const [ok, setOk] = useState<null | boolean>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setOk(true);
      return;
    }
    // sem token: valida cookie no backend
    (async () => {
      try {
        // ajuste o endpoint para o seu (ex: "/auth/me" ou "/users/me")
        await apiFetch("/auth/me", { method: "GET" });
        setOk(true);
      } catch {
        setOk(false);
      }
    })();
  }, []);

  if (ok === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        verificando sessão…
      </div>
    );
  }
  return ok ? <Outlet /> : <Navigate to="/login" replace />;
}
