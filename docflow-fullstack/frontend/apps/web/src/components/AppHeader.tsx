import React from "react";
import { cn } from "@/lib/utils";
import { MainNav } from "@/components/main-nav";

export default function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn("glass-nav", className)}>
      <div className="mx-auto max-w-screen-2xl h-14 px-4 md:px-6 flex items-center justify-between">
        <MainNav />
      </div>
    </header>
  );
}
