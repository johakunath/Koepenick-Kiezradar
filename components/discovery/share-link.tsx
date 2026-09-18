"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
export default function ShareLink() {
  const [message, setMessage] = useState("");
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
      setMessage("Link kopiert");
    } catch { setMessage("Bitte kopiere die Adresse aus der Browserzeile."); }
  }
  return <div className="flex items-center gap-2"><button onClick={share} type="button" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm text-water"><Share2 size={15} />Teilen</button><span role="status" className="text-xs text-ink-soft">{message}</span></div>;
}
