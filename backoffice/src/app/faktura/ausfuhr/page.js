import { notFound } from "next/navigation";
import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { paramsAus } from "@/lib/backoffice/faktura/listen";
import { rechnungZeile } from "@/lib/backoffice/faktura/zeilen";
import { LEER, SPALTE } from "@/lib/backoffice/faktura/texte";
import { cent, datum } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";

export const metadata = { title: "Ausfuhrnachweise · Faktura" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { key: "kunde", titel: SPALTE.kunde, typ: "objekt" },
  { key: "land", titel: SPALTE.land, typ: "wort" },
  { key: "betrag", titel: SPALTE.betrag, typ: "betrag" },
  { key: "datum", titel: SPALTE.datum, typ: "wort" },
  { key: "nachweis", titel: SPALTE.nachweis, typ: "wort" },
];

// /faktura/ausfuhr (§ 3.10) – nur mit Fähigkeit „ausfuhr“ (sonst 404 laut § 16.1).
export default async function Ausfuhr({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/ausfuhr");
  if (!ctx.schalter.ausfuhr) notFound();
  const daten = (await alle(ctx.client, "PH Rechnung")).filter((r) => r.ust_fall === "Ausfuhr" && Number(r.docstatus) === 1);
  const zeilen = daten.map((r) => {
    const z = rechnungZeile(r, { heute: ctx.heute, rolle: ctx.rolle });
    return { ...z, zellen: { ...z.zellen, land: r.land || "–", betrag: cent(r.brutto_cent), datum: datum(r.datum), nachweis: r.nachweis_status === "vorhanden" ? "Ausgangsvermerk ✓" : "fehlt" }, aktion: ctx.rolle.schreibt && r.nachweis_status !== "vorhanden" ? { id: "nachweis", titel: "Nachweis erfassen", href: `/faktura/rechnungen/${encodeURIComponent(r.name)}?tab=steuer` } : null };
  });
  return (
    <FakturaSeite ctx={ctx} titel="Ausfuhrnachweise">
      <FakturaListe liste="ausfuhr" spalten={SPALTEN} zeilen={zeilen} basis="/faktura/ausfuhr" params={params} gesamt={zeilen.length} ohneZeitraum leer={{ art: "erledigt", titel: LEER.ausfuhr }} testid="ausfuhr-liste" />
    </FakturaSeite>
  );
}
