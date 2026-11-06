import Link from "next/link";
import { redirect } from "next/navigation";
import { fakturaKontext, alle, einstellungen } from "@/lib/backoffice/faktura/daten";
import { vormonat, monatName, monatsEnde, folgemonat } from "@/lib/backoffice/faktura/regeln";
import { ABSCHLUSS, LEER, AKTION } from "@/lib/backoffice/faktura/texte";
import { datum } from "@/lib/backoffice/format";
import Kachel from "@/components/Backoffice/Kachel";
import Segment from "@/components/Backoffice/Segment";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import RueckfrageKnopf from "@/components/Backoffice/Faktura/RueckfrageKnopf";
import { FIcon } from "@/components/Backoffice/Faktura/teile";

export const metadata = { title: "Monatsabschluss · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/abschluss (T8, Leitung, § 3.9): Checkliste blockiert nicht, Hinweise stehen in der Rückfrage. Ohne
// Fähigkeit monatsabschluss (gesperrt_bis fehlt, P-04) ist „abschließen“ deaktiviert mit sichtbarem Grund.
export default async function Abschluss({ searchParams }) {
  const sp = await searchParams;
  const ctx = await fakturaKontext("/faktura/abschluss");
  const { client, rolle, heute, schalter } = ctx;
  if (!rolle.leitung && !rolle.gf) redirect("/kein-zugriff?bereich=faktura&aktion=abschluss");
  const monat = /^\d{4}-\d{2}$/.test(sp?.monat || "") ? sp.monat : vormonat(heute);
  const von = `${monat}-01`;
  const bis = monatsEnde(monat);
  const im = (d) => String(d || "").slice(0, 10) >= von && String(d || "").slice(0, 10) <= bis;
  const [re, bank, er, uva, ex, fe] = await Promise.all([alle(client, "PH Rechnung"), alle(client, "PH Bankumsatz"), alle(client, "PH Eingangsrechnung"), alle(client, "PH UVA Auswertung"), alle(client, "PH Export Lauf"), einstellungen(client)]);
  const zahl = {
    entwuerfe: re.filter((r) => Number(r.docstatus) === 0 && im(r.datum)).length,
    bank: bank.filter((b) => ["Offen", "Teilweise"].includes(b.status) && im(b.buchungsdatum)).length,
    er: er.filter((e) => ["Erfasst", "Sachlich geprueft"].includes(e.status) && im(e.datum)).length,
    kosten: er.filter((e) => e.zuordnung_status === "Offen" && e.status !== "Abgelehnt" && im(e.datum)).length,
    ausfuhr: re.filter((r) => r.ust_fall === "Ausfuhr" && Number(r.docstatus) === 1 && r.nachweis_status !== "vorhanden" && im(r.datum)).length,
    kassa: null,
    uva: uva.some((u) => String(u.zeitraum_von).slice(0, 7) === monat && ["Berechnet", "Uebergeben"].includes(u.status)) ? 0 : 1,
    export: ex.some((x) => String(x.zeitraum_bis).slice(0, 7) >= monat && x.status !== "Entwurf") ? 0 : 1,
  };
  const punkte = ABSCHLUSS.punkte.filter((p) => !p.schalter || schalter[p.schalter]);
  const hinweise = punkte.filter((p) => zahl[p.id]).length;
  const gesperrt = fe.gesperrt_bis || null;
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Monatsabschluss"
      untertitel={gesperrt ? ABSCHLUSS.zuletzt(monatName(gesperrt), datum(gesperrt), "–") : LEER.abschluss}
      aktionen={
        <>
          <Segment label="Monat" aktiv={monat} optionen={[vormonat(vormonat(heute)), vormonat(heute), heute.slice(0, 7)].map((m) => ({ wert: m, titel: monatName(m, false), href: `/faktura/abschluss?monat=${m}` }))} />
          {rolle.leitung && (
            <RueckfrageKnopf art="abschliessen" monat={monat} titel={AKTION.abschliessen(monatName(monat, false))} frage={hinweise ? ABSCHLUSS.hinweise(hinweise) : `${monatName(monat)} abschließen?`} text={ABSCHLUSS.frage(datum(bis), monatName(folgemonat(monat), false))} ergebnis={ABSCHLUSS.abgeschlossen(monatName(monat))} deaktiviert={!schalter.monatsabschluss} grund={ABSCHLUSS.sperreFolgt} testid="monat-abschliessen" />
          )}
        </>
      }
    >
      <Kachel titel={`Checkliste ${monatName(monat)}`} unter="Punkte blockieren nicht – sie stehen in der Rückfrage" testid="abschluss-liste">
        <ol className="flex flex-col gap-1">
          {punkte.map((p, i) => {
            const n = zahl[p.id];
            const ok = n === 0;
            const offen = n === null ? "Bericht" : ok ? "erledigt" : String(n);
            return (
              <li key={p.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-bo-zeile px-3 py-3 hover:bg-bo-fill">
                <span className="text-[13px] tabular-nums text-bo-text-faint">{i + 1}</span>
                <span className="text-[15px]">{p.titel}</span>
                <span className={`inline-flex items-center gap-1.5 text-[14px] tabular-nums ${ok ? "text-bo-salbei-text" : n === null ? "text-bo-text-soft" : "text-bo-eiche-text"}`}>
                  <FIcon name={ok ? "Check" : n === null ? "FileText" : "Circle"} className="size-4" />
                  {offen}
                </span>
                <Link className="text-[13px] font-medium text-bo-text-soft hover:underline" href={p.href}>
                  Ansehen →
                </Link>
              </li>
            );
          })}
        </ol>
      </Kachel>
    </FakturaSeite>
  );
}
