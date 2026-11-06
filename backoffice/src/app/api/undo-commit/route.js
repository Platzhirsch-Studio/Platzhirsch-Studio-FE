import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { istAdmin } from "@/lib/backoffice/auth/rechte";
import { backofficeMode } from "@/lib/backoffice/config";
import { pruefeAnfrage } from "@/lib/backoffice/commit/kern";
import { commitStatus, fuehreCommitsAus, nachlaufAnstossen, planeCommit, verwerfeCommits } from "@/lib/backoffice/commit/server";
import { COMMIT_TEXTE } from "@/lib/backoffice/commit/texte";

// Verzögerter Commit (G-03): POST /api/undo-commit – sendBeacon-tauglich (Body text/plain mit JSON).
//   { tokens:[…] }                     ausführen (Standard; pagehide/visibilitychange, Tab schließen)
//   { art:"verwerfen", tokens:[…] }    Rückgängig ohne Server Action (Notweg)
//   { art:"status", tokens:[…] }       Zustand eigener Tokens
//   { art:"demo-plane", daten:{…} }    nur Mock + Admin: Demo-Änderung vormerken (E2E, Baustein-Demo)
// Origin-Prüfung und Sitzung über requireApiSession; fremde Tokens → forbidden je Eintrag.
// Antwort: { ok, ergebnisse:[{ token, ok, status, code?, message? }] } bzw. bei demo-plane { ok, token, frist, ms }.
export const dynamic = "force-dynamic";

const KOPF = { "Cache-Control": "no-store" };

export async function POST(request) {
  nachlaufAnstossen();
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const text = await request.text().catch(() => "");
  const a = pruefeAnfrage(text);
  if (!a.ok) return Response.json({ ok: false, code: a.code, message: a.message }, { status: 400, headers: KOPF });
  if (a.art === "status") return Response.json({ ok: true, ergebnisse: await commitStatus(auth.session, a.tokens) }, { headers: KOPF });
  if (a.art === "demo-plane") {
    if (backofficeMode() !== "mock" || !istAdmin(auth.session)) return Response.json({ ok: false, code: "forbidden", message: COMMIT_TEXTE.nurMock }, { status: 403, headers: KOPF });
    const d = a.daten || {};
    const name = typeof d.name === "string" && /^[\w-]{1,40}$/.test(d.name) ? d.name : "DEMO-1";
    const r = await planeCommit(auth.session, { action: "fundament.demo", args: { fehler: !!d.fehler }, objekt: { doctype: "Demo", name }, titel: `Annehmen von ${name}`, ms: Number(d.ms) || undefined });
    return Response.json(r, { headers: KOPF });
  }
  const ergebnisse = a.art === "verwerfen" ? await verwerfeCommits(auth.session, a.tokens) : await fuehreCommitsAus(auth.session, a.tokens, "beacon");
  return Response.json({ ok: ergebnisse.every((r) => r.ok), ergebnisse }, { headers: KOPF });
}
