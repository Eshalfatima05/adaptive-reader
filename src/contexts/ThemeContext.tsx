import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";

interface ThemeContextType {
  theme: ThemeMode;
  colorBlindMode: ColorBlindMode;
  setTheme: (theme: ThemeMode) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as ThemeMode) || "light";
  });

  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(() => {
    const saved = localStorage.getItem("colorBlindMode");
    return (saved as ColorBlindMode) || "none";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("protanopia", "deuteranopia", "tritanopia");
    if (colorBlindMode !== "none") {
      root.classList.add(colorBlindMode);
    }
    localStorage.setItem("colorBlindMode", colorBlindMode);
  }, [colorBlindMode]);

  const setTheme = (newTheme: ThemeMode) => setThemeState(newTheme);
  const setColorBlindMode = (mode: ColorBlindMode) => setColorBlindModeState(mode);

  return (
    <ThemeContext.Provider value={{ theme, colorBlindMode, setTheme, setColorBlindMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
