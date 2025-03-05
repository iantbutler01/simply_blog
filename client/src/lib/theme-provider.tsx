import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type ThemeVariant = "professional" | "tint" | "vibrant";
type ThemeAppearance = "light" | "dark" | "system";

interface ThemeSettings {
  primary: string;
  variant: ThemeVariant;
  appearance: ThemeAppearance;
  radius: number;
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useQuery({ queryKey: ["/api/settings"] });
  const [theme, setTheme] = useState<ThemeSettings>({
    primary: "#007ACC",
    variant: "professional",
    appearance: "system",
    radius: 0,
  });

  useEffect(() => {
    if (settings) {
      setTheme({
        primary: settings.themePrimary,
        variant: settings.themeVariant as ThemeVariant,
        appearance: settings.themeAppearance as ThemeAppearance,
        radius: settings.themeRadius,
      });
    }
  }, [settings]);

  useEffect(() => {
    // Apply theme settings
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.setAttribute("data-theme-variant", theme.variant);
    
    const applyAppearance = (appearance: ThemeAppearance) => {
      if (appearance === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", isDark);
      } else {
        document.documentElement.classList.toggle("dark", appearance === "dark");
      }
    };

    applyAppearance(theme.appearance);

    // Listen for system theme changes
    if (theme.appearance === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const updateTheme = (settings: Partial<ThemeSettings>) => {
    setTheme(prev => ({ ...prev, ...settings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
