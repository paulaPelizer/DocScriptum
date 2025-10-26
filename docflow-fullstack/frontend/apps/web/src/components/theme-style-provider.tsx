import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type BgVariant = "default" | "alt";
type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  bgVariant: BgVariant;
  setBgVariant: (b: BgVariant) => void;
};

const ThemeStyleContext = createContext<Ctx | null>(null);

export default function ThemeStyleProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const [bgVariant, setBgVariant] = useState<BgVariant>(
    () => (localStorage.getItem("bgVariant") as BgVariant) || "default"
  );

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("bgVariant", bgVariant);
  }, [bgVariant]);

  const value = useMemo(() => ({ theme, setTheme, bgVariant, setBgVariant }), [theme, bgVariant]);
  return <ThemeStyleContext.Provider value={value}>{children}</ThemeStyleContext.Provider>;
}

export function useThemeStyle() {
  const ctx = useContext(ThemeStyleContext);
  if (!ctx) throw new Error("useThemeStyle must be used inside ThemeStyleProvider");
  return ctx;
}
