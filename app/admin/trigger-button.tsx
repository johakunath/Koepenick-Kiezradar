"use client";

import { useState } from "react";

export default function TriggerButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [secret, setSecret] = useState("");

  async function trigger(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/trigger-ingest", { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
      if (res.ok) { setSecret(""); setState("done"); }
      else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error ?? `HTTP ${res.status}`);
        setState("error");
      }
    } catch { setErrorMsg("Netzwerkfehler"); setState("error"); }
  }

  if (state === "done") return <p role="status" className="text-sm text-forest">Gestartet. Den Fortschritt findest du in GitHub Actions.</p>;

  return <form onSubmit={trigger} className="space-y-3">
    <label className="block text-sm">Admin-Schlüssel
      <input type="password" value={secret} onChange={event => setSecret(event.target.value)} required autoComplete="off"
        className="mt-1 block min-h-11 w-full rounded border border-border bg-bg px-3 text-ink" />
    </label>
    <button disabled={state === "loading"} className="min-h-11 rounded bg-water px-4 py-2 text-sm font-medium text-bg disabled:opacity-50">
      {state === "loading" ? "Wird gestartet…" : "Ingest jetzt starten"}
    </button>
    {state === "error" && <p role="alert" className="text-sm text-brick">{errorMsg}</p>}
  </form>;
}
