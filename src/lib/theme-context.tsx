"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  theme: "light",
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "crestpath_theme_mode";

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return mode;
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode: ThemeMode =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "light";
    setModeState(initialMode);
    const nextResolved = resolveTheme(initialMode);
    setResolved(nextResolved);
    applyThemeClass(nextResolved);
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const nextResolved = media.matches ? "dark" : "light";
      setResolved(nextResolved);
      applyThemeClass(nextResolved);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode]);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    localStorage.setItem(STORAGE_KEY, nextMode);
    const nextResolved = resolveTheme(nextMode);
    setResolved(nextResolved);
    applyThemeClass(nextResolved);
  };

  const toggle = () => {
    setMode(resolved === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ mode, theme: resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
