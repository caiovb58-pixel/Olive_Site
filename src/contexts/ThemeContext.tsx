import { createContext, useContext, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

type ThemeContextValue = ReturnType<typeof useTheme>;
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "light" as const, setTheme: () => {}, toggle: () => {} };
  return ctx;
}
