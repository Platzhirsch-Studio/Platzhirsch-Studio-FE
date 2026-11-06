import { redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import NeueKarte from "@/components/Backoffice/Kundenkarte/NeueKarte";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { ladeBerater, ladeEinstellungen, ladeStufen } from "@/lib/backoffice/kundenkarte/daten";
import { darfSchreiben, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Neue Karte · Kundenkarte" };

export default async function NeueKarteSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/karten/neu", sp);
  if (!darfSchreiben(ctx.rolle)) redirect("/kein-zugriff?bereich=kundenkarte&aktion=create");
  const [einst, stufen, berater] = await Promise.all([ladeEinstellungen(ctx).catch(() => ({})), ladeStufen(ctx).catch(() => []), ladeBerater(ctx)]);
  let kontakt = null;
  if (sp.kontakt && /^[\w.@ -]{3,80}$/.test(sp.kontakt)) {
    const k = await ctx.client.getDoc("PH Kontakt", sp.kontakt).catch(() => null);
    if (k) {
      const offen = await ctx.client.getList("PH Kundenkarte", { fields: ["name"], filters: [["kontakt", "=", k.name], ["status", "in", ["Aktiv", "Beantragt", "Gesperrt"]]], limit: 1 }).catch(() => []);
      kontakt = { name: k.name, titel: k.titel, ort: [k.plz, k.ort].filter(Boolean).join(" "), privat: k.kontaktart !== "Geschaeft", karte: offen[0]?.name || null };
    }
  }
  const aktive = stufen.filter((s) => s.aktiv).map((s) => ({ name: s.name, stufenname: s.stufenname, farbe: s.farbe }));
  const start = einst.startstufe ? [...aktive.filter((s) => s.name === einst.startstufe), ...aktive.filter((s) => s.name !== einst.startstufe)] : aktive;
  return (
    <Shell session={ctx.session}>
      <Seitenkopf titel={T.neu.titel} krumen={[...KRUMEN_BASIS, { titel: T.seiten.karten, href: "/kundenkarte/karten" }, { titel: T.seiten.neu }]} zurueck="/kundenkarte/karten" />
      <NeueKarte version={einst.bedingungen_version || ""} kontaktStart={kontakt} stufen={start} berater={berater} leitung={istLeitung(ctx.rolle)} kundenmodus={/^[a-f0-9]{32}$/.test(sp.kundenmodus || "") ? sp.kundenmodus : ""} />
    </Shell>
  );
}
