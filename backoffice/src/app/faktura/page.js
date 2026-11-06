import { redirect } from "next/navigation";
import { fakturaKontext, startDaten, mahnbare } from "@/lib/backoffice/faktura/daten";
import { zuTunBuchhaltung, zuTunVertrieb } from "@/lib/backoffice/faktura/zuTun";
import { altersband, tageZwischen } from "@/lib/backoffice/faktura/betraege";
import { RECHNUNG_REITER, auftragZeile } from "@/lib/backoffice/faktura/zeilen";
import { SEITE } from "@/lib/backoffice/faktura/texte";
import { monatName } from "@/lib/backoffice/faktura/regeln";
import { FAKTURA } from "@/lib/backoffice/faktura/faehigkeiten";
import Kachel from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Segment from "@/components/Backoffice/Segment";
import Faehigkeit from "@/components/Backoffice/Faehigkeit";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import ZuTunListe from "@/components/Backoffice/Faktura/ZuTunListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";
import { AltersBand } from "@/components/Backoffice/Faktura/Bausteine";
import { Hinweis } from "@/components/Backoffice/Faktura/teile";
import { kontaktAuswahl, projektAuswahl, alle } from "@/lib/backoffice/faktura/daten";

export const metadata = { title: "Faktura" };
export const dynamic = "force-dynamic";

// /faktura – Bereichsstart (T1, 10-konzept-faktura § 3.1): „Zu tun“ als Hauptelement, 4 Kennzahlen je Cockpit,
// Altersband der offenen Posten. Jede Zahl genau einmal (U-17). StB-Rolle startet im Export (§ 1.1).
export default async function FakturaStart({ searchParams }) {
  const sp = await searchParams;
  const ctx = await fakturaKontext("/faktura");
  const { client, rolle, heute, session } = ctx;
  if (rolle.stb) redirect("/faktura/export");
  const cockpit = sp?.cockpit === "vertrieb" ? "vertrieb" : "buchhaltung";
  const d = await startDaten(client, rolle);
  const mahn = await mahnbare(client, heute, d.rechnungen);
  const vm = `${heute.slice(0, 7)}`;
  const abschlussVormonat = true; // gesperrt_bis fehlt im Backend (P-04) → keine Erinnerung, bis die Sperre existiert
  const auftragDaten = Object.fromEntries(d.auftraege.map((a) => [a.name, auftragZeile(a, { heute, rolle }).daten]));
  const anreichern = (z) => (z.aktion.id === "anzahlung" ? { ...z, aktion: { ...z.aktion, daten: { name: z.aktion.daten.auftrag, ...auftragDaten[z.aktion.daten.auftrag] } } } : z);
  const zeilen = (cockpit === "vertrieb" ? zuTunVertrieb({ heute, angebote: d.angebote, auftraege: d.auftraege }) : zuTunBuchhaltung({ heute, rolle, bank: d.bank, mahnbar: mahn, er: d.er, auftraege: d.auftraege, rechnungen: d.rechnungen, exporte: d.exporte, uva: d.uva, gutschriften: d.gutschriften, abschlussVormonat, kassaFehler: d.auftraege.filter((a) => a.kassa_datenfehler).map((a) => ({ name: a.name, betrag_cent: a.anzahlung_ist_cent })) })).map(anreichern);
  const op = d.rechnungen.filter((r) => RECHNUNG_REITER["offene-posten"](r));
  const ueber = op.filter((r) => tageZwischen(r.faellig, heute) > 0);
  const anz = d.rechnungen.filter((r) => r.art === "Anzahlungsrechnung" && Number(r.docstatus) === 1 && Number(r.offen_cent) > 0);
  const monatsUmsatz = d.rechnungen.filter((r) => Number(r.docstatus) === 1 && String(r.datum).slice(0, 7) === vm && r.art !== "Anzahlungsrechnung" && r.status !== "Storniert").reduce((s, r) => s + (Number(r.netto_cent) || 0), 0);
  const offeneAngebote = d.angebote.filter((a) => ["Entwurf", "Gesendet"].includes(a.status));
  const bestand = d.auftraege.filter((a) => ["Offen", "In Bestellung", "Teilgeliefert", "Geliefert"].includes(a.status));
  const entschieden = d.angebote.filter((a) => ["Angenommen", "Abgelehnt", "Abgelaufen"].includes(a.status));
  const quote = entschieden.length ? Math.round((entschieden.filter((a) => a.status === "Angenommen").length * 100) / entschieden.length) : null;
  const liefer30 = d.auftraege.filter((a) => (a.liefertermin_bestaetigt || a.liefertermin_geplant) && tageZwischen(heute, a.liefertermin_bestaetigt || a.liefertermin_geplant) >= 0 && tageZwischen(heute, a.liefertermin_bestaetigt || a.liefertermin_geplant) <= 30);
  const [kontakte, projekte, bedingungen] = cockpit === "vertrieb" || rolle.schreibt ? await Promise.all([kontaktAuswahl(client), projektAuswahl(client), alle(client, "PH Zahlungsbedingung", { fields: ["name", "titel", "standard"] })]) : [[], [], []];

  return (
    <FakturaSeite
      ctx={ctx}
      titel={SEITE.start.titel}
      krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Faktura" }]}
      ueber={SEITE.start.ueber}
      route="/faktura"
      mahnvorschlag={mahn}
      aktionen={
        <>
          <Segment label={SEITE.cockpit.label} aktiv={cockpit} optionen={[{ wert: "buchhaltung", titel: SEITE.cockpit.buchhaltung, href: "/faktura" }, { wert: "vertrieb", titel: SEITE.cockpit.vertrieb, href: "/faktura?cockpit=vertrieb" }]} testid="cockpit" />
          {rolle.schreibt && (cockpit === "vertrieb" ? <KopfAktion art="angebot" primaer daten={{ kontakte, projekte, bedingungen }} /> : <KopfAktion art="neu" primaer={false} daten={{ kontakte, projekte, bedingungen }} />)}
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Faehigkeit session={session} id="faktura.echtbelege" katalog={FAKTURA}>
          {({ an }) => (an ? null : <Hinweis ton="info" testid="testbetrieb">{SEITE.echtbelegeText}</Hinweis>)}
        </Faehigkeit>
        <Kachel titel={SEITE.zuTun} unter={SEITE.zuTunUnter} titelId="h-zutun" werkzeuge={<span className="text-[13px] tabular-nums text-bo-text-soft">{zeilen.length}</span>} testid="zutun-kachel">
          <ZuTunListe zeilen={zeilen} ersteSchritte={!d.rechnungen.length && !d.angebote.length} />
        </Kachel>
        {cockpit === "buchhaltung" ? (
          <>
            <section aria-label="Kennzahlen" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 [&>*]:min-w-0" data-testid="kennzahlen">
              <Kennzahl titel="Offene Posten" wert={op.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0)} format="cent" zusatz={`${op.length} Rechnungen`} href="/faktura/rechnungen?r=offene-posten" />
              <Kennzahl titel="Überfällig" wert={ueber.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0)} format="cent" zusatz={`${ueber.length} Rechnungen`} href="/faktura/rechnungen?r=ueberfaellig" />
              <Kennzahl titel="Anzahlungen offen" wert={anz.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0)} format="cent" zusatz={`${anz.length} Aufträge · nur gestellte Anzahlungsrechnungen`} href="/faktura/berichte/anzahlungsstand" />
              <Kennzahl titel={`Umsatz ${monatName(heute, false)} (netto)`} wert={monatsUmsatz} format="cent" zusatz={SEITE.keinVergleich} href={`/faktura/rechnungen?r=alle&von=${vm}-01`} />
            </section>
            <Kachel titel={SEITE.altersband} unter="Segment wählen, um die Liste zu filtern" titelId="h-alter">
              <AltersBand segmente={altersband(op, heute)} />
            </Kachel>
          </>
        ) : (
          <section aria-label="Kennzahlen" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 [&>*]:min-w-0" data-testid="kennzahlen">
            <Kennzahl titel="Offene Angebote" wert={offeneAngebote.reduce((s, a) => s + (Number(a.brutto_cent) || 0), 0)} format="cent" zusatz={`${offeneAngebote.length} Angebote`} href="/faktura/angebote?r=offen" />
            <Kennzahl titel="Auftragsbestand" wert={bestand.reduce((s, a) => s + (Number(a.offen_cent) || 0), 0)} format="cent" zusatz={`${bestand.length} Aufträge`} href="/faktura/auftraege" />
            <Kennzahl titel="Angebotsquote" wert={quote} format="prozent" zusatz={quote === null ? SEITE.keinVergleich : `${entschieden.length} entschieden`} href="/faktura/angebote?r=alle" />
            <Kennzahl titel="Liefertermine 30 Tage" wert={liefer30.length} zusatz="Aufträge" href="/faktura/auftraege?r=laufend" />
          </section>
        )}
      </div>
    </FakturaSeite>
  );
}
