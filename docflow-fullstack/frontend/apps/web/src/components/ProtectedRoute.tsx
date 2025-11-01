// src/components/ProtectedRoute.tsx
/*import { useEffect, useState } from "react";
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
}*/
// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/services/auth";
import { apiFetch } from "@/services/api";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<null | boolean>(null);
  const location = useLocation();
  const dest = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const token = getToken();
    if (token) { setOk(true); return; }
    (async () => {
      try {
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

  return ok ? <>{children}</> : <Navigate to={`/login?returnTo=${encodeURIComponent(dest)}`} replace />;
}

