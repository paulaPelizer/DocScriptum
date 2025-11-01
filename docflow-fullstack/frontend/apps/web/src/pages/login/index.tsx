// src/pages/login/index.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login, finishLogin } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("admin@docflow");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // faz login e tenta obter token (JWT ou fluxo cookie)
      const token = await login(username, password);

      // finaliza login e redireciona:
      // - se veio returnTo na URL (ex: /login?returnTo=/projects/new)
      // - senão usa rota salva em storage
      // - senão /projects
      finishLogin(token ?? undefined, navigate);
    } catch (err: any) {
      setError(err?.message ?? "Falha ao autenticar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* camada de contraste sobre o vídeo */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/60" />

      {/* conteúdo principal */}
      <div className="relative z-10 flex w-full max-w-sm items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl text-white"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login DocScriptum
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Acesse sua conta
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@docflow"
                className="bg-white/70 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/70 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-10 w-full text-base"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
