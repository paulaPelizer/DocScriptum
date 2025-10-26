import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { StyleSwitch } from "@/components/style-switch"

interface MainNavProps {
  className?: string
  /** opcional: se não vier, usamos o pathname atual */
  currentPath?: string
}

export function MainNav({ className, currentPath }: MainNavProps) {
  const location = useLocation()
  const path = currentPath ?? location.pathname

  // itens reais de navegação
  const navItems = [
    { href: "/dashboard",  label: "Dashboard" },
    { href: "/projects",   label: "Projetos" },
    { href: "/planning",   label: "Planejamento" },
    { href: "/clients",    label: "Clientes" },
    { href: "/suppliers",  label: "Fornecedores" },
    { href: "/documents",  label: "Documentos" },
    { href: "/requests",   label: "Solicitações" },
    { href: "/grds",       label: "GRDs" },
  ]

  // se o app estiver servindo em subpasta, usa BASE_URL
  const base = (import.meta as any)?.env?.BASE_URL ?? "/"

  return (
    <header className={cn("glass-nav", className)}>
      {/* aumentei a altura do header para caber a logo maior */}
      <div className="mx-auto max-w-screen-2xl h-20 px-6 flex items-center justify-between">
        {/* Logo (arquivo em: frontend/apps/web/public/docscriptum-logo.png) */}
        <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Ir para início">
          <img
            src={`${base}docscriptum-logo.png`}
            alt="DocScriptum"
            className="h-24 w-auto object-contain select-none drop-shadow-[0_0_8px_#00FFF7]"
            draggable={false}
          />
        </Link>

        {/* Navegação + controles à direita */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  path.startsWith(item.href)
                    ? "text-primary underline underline-offset-4"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Botão para alternar vídeo (A/B) e tema (claro/escuro) */}
          <div className="flex items-center gap-2">
            <StyleSwitch />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
