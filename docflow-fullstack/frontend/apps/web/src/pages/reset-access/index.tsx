import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetAccessPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const t = query.get("token");
    setToken(t);
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("Token de redefinição inválido.");
      return;
    }
    if (!newPassword) {
      setError("Informe a nova senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          newUsername: newUsername || null,
        }),
      });

      const text = await res.text();
      let msg = text;
      try {
        const data = JSON.parse(text);
        if (data?.message) msg = data.message;
      } catch {
        // se não for JSON, usa texto puro
      }

      if (!res.ok) {
        throw new Error(msg || "Falha ao redefinir senha.");
      }

      setInfo(msg || "Senha redefinida com sucesso. Você já pode fazer login.");
      setNewPassword("");
      setNewUsername("");
      // se quiser, pode redirecionar depois de alguns segundos
      // setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-6 max-w-md w-full text-center">
          <p className="text-sm">
            Token de redefinição não encontrado. Verifique o link enviado por e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-6 max-w-md w-full">
        <h1 className="text-lg font-semibold mb-4">
          Redefinir acesso ao DocScriptum
        </h1>

        <p className="text-xs text-white/70 mb-4">
          Defina uma nova senha e, se desejar, um novo usuário. Esse link é válido por tempo limitado
          e será invalidado após a redefinição.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs text-white">
              Nova senha
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-username" className="text-xs text-white">
              Novo usuário (opcional)
            </Label>
            <Input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
              placeholder="novo.login (opcional)"
            />
          </div>

          {error && (
            <div className="mt-1 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          {info && (
            <div className="mt-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
              {info}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => navigate("/login")}
              className="h-8 px-3 text-xs"
            >
              Voltar ao login
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-8 px-4 text-xs"
            >
              {loading ? "Aplicando..." : "Redefinir"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
