"use client";

import { useSyncExternalStore } from "react";

/**
 * The light/dark switch, in one place. Every page used to carry its own copy of this logic, which is how
 * the default drifted and why the theme only landed after hydration — the served HTML never had the
 * attribute, so anyone on the non-default theme got a flash on every navigation.
 *
 * THEME_BOOT_SCRIPT sets the attribute in <head> before the first paint; this hook only reflects it.
 * The stored value is external state, so it is read through useSyncExternalStore rather than an effect.
 */
export const THEME_KEY = "syntra-theme";

type Theme = "light" | "dark";

/** Dark unless the visitor explicitly chose light: only the string "light" opts out. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}if(t==="light"){document.documentElement.removeAttribute("data-theme")}else{document.documentElement.setAttribute("data-theme","dark")}`;

// Mirrors the stored value. Also the source of truth when storage is unavailable (private windows,
// blocked site data), so the toggle still works for the session even when nothing can be remembered.
let current: Theme | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  if (current) return current;
  try {
    current = localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    current = "dark";
  }
  return current;
}

/** What the server rendered, and what the boot script falls back to. */
const getServerSnapshot = (): Theme => "dark";

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab switching theme should move this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    current = event.newValue === "light" ? "light" : "dark";
    apply(current);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function apply(theme: Theme) {
  if (theme === "light") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", "dark");
}

export function useTheme(): [light: boolean, setLight: (light: boolean) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLight = (next: boolean) => {
    current = next ? "light" : "dark";
    apply(current);
    try {
      localStorage.setItem(THEME_KEY, current);
    } catch {
      // Not being able to remember it should not stop it applying for this session.
    }
    listeners.forEach((notify) => notify());
  };

  return [theme === "light", setLight];
}
