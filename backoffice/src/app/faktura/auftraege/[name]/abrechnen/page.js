import { notFound } from "next/navigation";
import { fakturaKontext, ladeBeleg, alle, kontaktVon } from "@/lib/backoffice/faktura/daten";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import AbrechnenAblauf from "@/components/Backoffice/Faktura/AbrechnenAblauf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abrechnen · Faktura" };

// /faktura/auftraege/[name]/abrechnen?art=teil|schluss (§ 5.9/§ 5.10).
export default async function Abrechnen({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const art = sp?.art === "teil" ? "teil" : "schluss";
  const ctx = await fakturaKontext(`/faktura/auftraege/${roh}/abrechnen`);
  const beleg = await ladeBeleg(ctx.client, "PH Auftragsbestaetigung", name, ctx.rolle);
  if (!beleg) notFound();
  const a = beleg.doc;
  const [anz, kontakt] = await Promise.all([alle(ctx.client, "PH Rechnung", { fields: ["name", "art", "brutto_cent", "bezahlt_cent", "docstatus", "status"], filters: [["auftrag", "=", a.name], ["art", "=", "Anzahlungsrechnung"]] }), kontaktVon(ctx.client, a.kontakt)]);
  const titel = art === "teil" ? "Teilrechnung" : "Schlussrechnung";
  return (
    <FakturaSeite ctx={ctx} titel={`${titel} zu ${a.name}`} krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Aufträge", href: "/faktura/auftraege" }, { titel: a.name, href: `/faktura/auftraege/${encodeURIComponent(a.name)}` }]} untertitel={`${a.kunde_name} · ${a.titel || ""}`}>
      <AbrechnenAblauf auftrag={a} art={art} anzahlungen={anz.filter((x) => Number(x.docstatus) === 1 && x.status !== "Storniert")} leitung={ctx.rolle.leitung} restAufloesen={ctx.schalter.restAufloesen} email={kontakt.email || ""} />
    </FakturaSeite>
  );
}
