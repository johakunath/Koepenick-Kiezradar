"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto px-5">
      <div
        className="flex items-start gap-3 text-xs px-4 py-3 rounded-lg"
        style={{
          background: "rgba(58, 115, 150, 0.08)",
          border: "1px solid var(--water-light)",
          color: "var(--water-deep)",
        }}
      >
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <p className="flex-1 leading-relaxed">
          Privates Spielzeug zweier Nachbarn. KI-Inhalte können falsch sein — maßgeblich sind
          die verlinkten Originalquellen.
        </p>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Schließen"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
