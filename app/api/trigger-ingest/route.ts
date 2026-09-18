import { createHash, timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_INGEST_SECRET;
  const token = process.env.GITHUB_TOKEN;
  if (!secret || !token || process.env.VERCEL_ENV !== "production") {
    return Response.json({ error: "Manueller Import hier deaktiviert. Nutze GitHub Actions." }, { status: 503 });
  }
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(provided), digest(secret))) {
    return Response.json({ error: "Admin-Schlüssel ungültig." }, { status: 401 });
  }
  try {
    const res = await fetch(
      "https://api.github.com/repos/johakunath/Koepenick-Kiezradar/actions/workflows/daily-ingest.yml/dispatches",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        body: JSON.stringify({ ref: "main" }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (res.status === 204) return Response.json({ ok: true });
    return Response.json({ error: `GitHub konnte den Import nicht starten (HTTP ${res.status}).` }, { status: 502 });
  } catch {
    return Response.json({ error: "GitHub gerade nicht erreichbar. Bitte später erneut versuchen." }, { status: 502 });
  }
}
