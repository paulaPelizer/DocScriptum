// src/pages/login/index.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, finishLogin, register } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  // ===== Login =====
  const [username, setUsername] = useState("admin@docflow");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ===== Cadastro =====
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regEmail, setRegEmail] = useState("");     // <- novo (já estava aí)
  const [regToken, setRegToken] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const token = await login(username, password);
      finishLogin(token ?? undefined, navigate);
    } catch (err: any) {
      setError(err?.message ?? "Falha ao autenticar");
    } finally {
      setIsLoading(false);
    }
  };

  // ====== CADASTRO: chamada ao backend ======
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    // <<< inclui validação do e-mail também >>>
    if (
      !regUsername.trim() ||
      !regEmail.trim() ||
      !regPassword ||
      !regConfirm ||
      !regToken.trim()
    ) {
      setRegError("Preencha todos os campos.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("A confirmação de senha não confere.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          email: regEmail.trim(),      // <<< envia o email para o backend
          token: regToken.trim(),
        }),
      });

      if (!res.ok) {
        let msg = "Falha ao cadastrar usuário.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          const txt = await res.text().catch(() => "");
          if (txt) msg = txt;
        }
        throw new Error(msg);
      }

      // sucesso: fecha modal e volta para tela de login
      const novoUsuario = regUsername.trim();
      await res.json().catch(() => ({}));

      closeRegister();
      setUsername(novoUsuario);
      setPassword("");
      setError("");
      setInfoMessage("Cadastro realizado com sucesso. Agora faça login com seu novo usuário.");
    } catch (err: any) {
      setRegError(err?.message ?? "Falha ao cadastrar usuário.");
    } finally {
      setRegLoading(false);
    }
  };

  const closeRegister = () => {
    if (regLoading) return;
    setShowRegister(false);
    setRegError("");
    setRegUsername("");
    setRegPassword("");
    setRegConfirm("");
    setRegEmail("");   // <<< limpa o email também
    setRegToken("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* camada de contraste sobre o vídeo / fundo */}
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

            {infoMessage && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                {infoMessage}
              </div>
            )}

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

            {/* Botão para abrir cadastro */}
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="mt-2 w-full text-xs text-white/80 hover:text-white underline underline-offset-2"
            >
              Cadastrar novo usuário
            </button>
          </div>
        </form>
      </div>

      {/* ===== Modal de Cadastro ===== */}
      {showRegister && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cadastro de novo usuário</h2>
              <button
                type="button"
                onClick={closeRegister}
                className="text-sm text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-xs text-white/70">
              Informe o <strong>token de autorização</strong> recebido e os dados de acesso.
              O perfil (DBA / ADMIN / RESOURCE) será definido automaticamente pelo token.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-token" className="text-xs text-white">
                  Token de autorização
                </Label>
                <Input
                  id="reg-token"
                  type="text"
                  value={regToken}
                  onChange={(e) => setRegToken(e.target.value)}
                  className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="Informe o token fornecido pelo administrador"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-username" className="text-xs text-white">
                  Usuário
                </Label>
                <Input
                  id="reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="login do usuário (ex.: admin@docflow)"
                />
              </div>

              {/* <<< NOVO CAMPO DE EMAIL SEPARADO >>> */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs text-white">
                  E-mail
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs text-white">
                  Senha
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-xs text-white">
                  Confirmar senha
                </Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="bg-white/80 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="Repita a senha"
                />
              </div>

              {regError && (
                <div className="mt-1 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-100">
                  {regError}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={regLoading}
                  onClick={closeRegister}
                  className="h-8 px-3 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={regLoading}
                  className="h-8 px-4 text-xs"
                >
                  {regLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
