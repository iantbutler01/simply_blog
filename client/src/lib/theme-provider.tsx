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
  const { data: settings } = useQuery({ 
    queryKey: ["/api/settings"],
    staleTime: 60000, // Refetch after 1 minute
  });

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

  // Effect to handle the primary color and variant
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.setAttribute("data-theme-variant", theme.variant);
    document.documentElement.style.setProperty("--theme-radius", `${theme.radius}px`);
  }, [theme.primary, theme.variant, theme.radius]);

  // Separate effect to handle dark mode
  useEffect(() => {
    const setDarkMode = (isDark: boolean) => {
      document.documentElement.classList.remove('dark');
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    };

    if (theme.appearance === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        setDarkMode(mediaQuery.matches);
      };

      // Initial application
      handleChange();

      // Listen for changes
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Direct application of light/dark mode
      setDarkMode(theme.appearance === "dark");
    }
  }, [theme.appearance]);

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