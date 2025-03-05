import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import { useQuery } from "@tanstack/react-query";

interface ThemeSettings {
  themePrimary: string;
  themeVariant: string;
  themeAppearance: string;
  themeRadius: number;
}

interface ThemeContextType {
  settings: ThemeSettings | null;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (!settings) return;

    // Update CSS variables for theme
    document.documentElement.style.setProperty('--primary', settings.themePrimary);
    document.documentElement.style.setProperty('--radius', `${settings.themeRadius}px`);
    
    // Update theme class
    document.documentElement.classList.remove('theme-professional', 'theme-tint', 'theme-vibrant');
    document.documentElement.classList.add(`theme-${settings.themeVariant}`);
    
    // Update color scheme
    if (settings.themeAppearance === 'system') {
      document.documentElement.classList.remove('light', 'dark');
    } else {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(settings.themeAppearance);
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
