"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("kiezradar-theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Tagmodus" : "Nachtmodus"}
      title={dark ? "Tagmodus" : "Nachtmodus"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 15,
        color: "var(--ink-mute)",
        lineHeight: 1,
        padding: "2px 4px",
        borderRadius: 4,
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-mute)")}
    >
      {dark ? "◑" : "◐"}
    </button>
  );
}
