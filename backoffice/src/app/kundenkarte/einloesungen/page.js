import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Fehler from "@/components/Backoffice/Fehler";
import EinloesungenListe from "@/components/Backoffice/Kundenkarte/Einloesungen";
import Filter from "@/components/Backoffice/Kundenkarte/Filter";
import Suchfeld from "@/components/Backoffice/Kundenkarte/Suchfeld";
import { darfLeitungBitten } from "@/components/Backoffice/Informieren/server";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { ladeBerater, ladeEinloesungen, ladeFaehigkeiten, ladeVorteile, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { darfSchreiben, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { ORTE } from "@/lib/backoffice/kundenkarte/labels";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einlösungen · Kundenkarte" };

export default async function EinloesungenSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/einloesungen", sp);
  const faehig = await ladeFaehigkeiten(ctx);
  const zugesagt = faehig["kundenkarte.einloesung_zugesagt"]?.an;
  const reiter = ["eingeloest", "storniert", ...(zugesagt ? ["zugesagt"] : [])].includes(sp.reiter) ? sp.reiter : "eingeloest";
  const zeitraum = ["1", "30", "90", "365", "alle"].includes(sp.zeitraum) ? sp.zeitraum : "30";
  const [r, vorteile, berater, darfBitten] = await Promise.all([
    sicher(() => ladeEinloesungen(ctx, { reiter, q: sp.q || "", vorteil: sp.vorteil || "", ort: sp.ort || "", zeitraum, seite: Number(sp.seite) || 1 })),
    ladeVorteile(ctx).catch(() => []),
    ladeBerater(ctx),
    darfLeitungBitten(ctx.session, ctx.client).catch(() => false),
  ]);
  const href = (x) => {
    const p = new URLSearchParams(Object.fromEntries(Object.entries(sp).filter(([k]) => !["reiter", "seite"].includes(k))));
    if (x !== "eingeloest") p.set("reiter", x);
    const s = p.toString();
    return s ? `/kundenkarte/einloesungen?${s}` : "/kundenkarte/einloesungen";
  };
  return (
    <Shell session={ctx.session}>
      <Seitenkopf titel={T.seiten.einloesungen} krumen={[...KRUMEN_BASIS, { titel: T.seiten.einloesungen }]} kennzahlen={r.ok ? [{ wert: r.daten.gesamt, text: zeitraum === "alle" ? "gesamt" : zeitraum === "1" ? "heute" : `in ${T.einloesungen.zeitraum[zeitraum] || "30 Tage"}` }] : []} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segment
          label="Reiter"
          aktiv={reiter}
          testid="kk-einl-reiter"
          optionen={[{ wert: "eingeloest", titel: T.einloesungen.reiter.eingeloest, href: href("eingeloest") }, ...(zugesagt ? [{ wert: "zugesagt", titel: T.einloesungen.reiter.zugesagt, href: href("zugesagt") }] : []), { wert: "storniert", titel: T.einloesungen.reiter.storniert, href: href("storniert") }]}
        />
        <span className="flex-1" />
        <Suchfeld basis="/kundenkarte/einloesungen" params={sp} platzhalter={T.einloesungen.suche} />
        <Filter
          basis="/kundenkarte/einloesungen"
          params={sp}
          felder={[
            { name: "vorteil", label: "Vorteil", optionen: vorteile.map((v) => ({ wert: v.name, titel: v.titel })) },
            { name: "ort", label: "Ort", optionen: ORTE.map((o) => ({ wert: o, titel: o })) },
            { name: "zeitraum", label: "30 Tage", optionen: [{ wert: "1", titel: "Heute" }, { wert: "90", titel: "90 Tage" }, { wert: "365", titel: "12 Monate" }, { wert: "alle", titel: "Alle" }] },
          ]}
        />
      </div>
      {r.ok ? (
        <EinloesungenListe zeilen={r.daten.zeilen} gesamt={r.daten.gesamt} gesamtAlle={r.daten.gesamtAlle} reiter={reiter} arten={Object.fromEntries(vorteile.map((v) => [v.name, v.art]))} user={ctx.user} leitung={istLeitung(ctx.rolle)} darfSchreiben={darfSchreiben(ctx.rolle)} darfBitten={darfBitten} berater={berater} startNeu={sp.einloesen === "1"} jetzt={ctx.jetzt.toISOString()} />
      ) : (
        <Fehler code={r.fehler.code} message={r.fehler.message} />
      )}
    </Shell>
  );
}
