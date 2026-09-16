"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("kiezradar-theme", next ? "dark" : "light"); } catch {}
  }
  return <button type="button" onClick={toggle} aria-label={dark ? "Tagmodus" : "Nachtmodus"}
    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-water transition-colors hover:bg-bg-deep">
    {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>;
}
