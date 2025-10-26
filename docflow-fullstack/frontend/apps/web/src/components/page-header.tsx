import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        // empilha no mobile; em >=sm fica na mesma linha, alinhado verticalmente
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold neon-text leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>

      {/* ações (busca/botões) — ocupa a linha toda no mobile,
         e alinha à direita nas telas maiores */}
      <div className="w-full sm:w-auto">
        {children}
      </div>
    </div>
  );
}
