import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { Balken, Donut } from "@/components/Backoffice/Charts";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import Leer from "@/components/Backoffice/Leer";
import { Icon } from "@/components/Backoffice/icons";
import { KRUMEN, V, verwaltungsZugang, zeit } from "@/components/Backoffice/Kassa/Verwaltung";
import { uebersicht } from "@/lib/backoffice/kassa/daten";
import { echtbetriebFehlt } from "@/lib/backoffice/kassa/faehigkeiten";
import { darfAnDieKassa } from "@/lib/backoffice/kassa/zugang";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { BELEGART_TITEL, VERWALTUNG, ZAHLART_BACKEND_TITEL } from "@/lib/backoffice/kassa/texte";

export const metadata = { title: "Kassa" };
export const dynamic = "force-dynamic";

// V0 – Übersicht der Kassa-Verwaltung (Team B-KAS, Konzept §4.1, Lounge-Bento): eine Akzentkachel „Heute
// kassiert“, Kennzahlen (Bargeld in der Lade, offene Abschlüsse), Umsatz 14 Tage, Zahlarten heute, letzte
// Belege, Kassen mit Echtbetriebs-Schranke, offene Ereignisse. Eine Hauptaktion: „Kassa öffnen“.
export default async function KassaVerwaltung() {
  const { session, leitung } = await verwaltungsZugang(V);
  const d = await uebersicht(session);
  const kiosk = darfAnDieKassa(session);
  const jeZahlart = Object.entries(d.heute.je_zahlart || {})
    .map(([k, w]) => ({ label: ZAHLART_BACKEND_TITEL[k] || k, wert: Math.max(0, w) }))
    .filter((t) => t.wert > 0);
  const lade = d.kassen.reduce((a, k) => a + (k.bestand_cent || 0), 0);
  const fehlt = echtbetriebFehlt(d.faehig, []);
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={VERWALTUNG.titel}
        untertitel={VERWALTUNG.untertitel}
        krumen={[KRUMEN[0], { titel: "Kassa" }]}
        aktionen={
          kiosk ? (
            <Knopf href="/kassa" variant="primary" icon="Wallet" data-testid="kassa-oeffnen">
              {VERWALTUNG.kassaOeffnen}
            </Knopf>
          ) : null
        }
      />
      <Bento testid="kassa-uebersicht">
        <Akzentkachel className="col-span-12 md:col-span-4" ton="cognac" titel={VERWALTUNG.heuteKassiert} text={`${d.heute.belege} Belege${d.heute.stornos ? ` · ${d.heute.stornos} Storno` : ""}`} zahl={Math.round(d.heute.umsatz_cent / 100)} format="zahl" einheit="€" href={`${V}/belege`} testid="kassa-heute" />
        <Kennzahl className="col-span-6 md:col-span-4" titel={VERWALTUNG.bargeldLade} wert={lade} format="cent" href={`${V}/kassenbuch`} />
        <Kennzahl className="col-span-6 md:col-span-4" titel={VERWALTUNG.offeneAbschluesse} wert={d.offeneAbschluesse.length} href={`${V}/abschluesse`} zusatz={d.mitDifferenz ? `${d.mitDifferenz} mit Differenz` : "Keine Differenz offen"} />
        <Balken className="col-span-12 md:col-span-8" titel={VERWALTUNG.umsatzWoche} punkte={d.tage.map((t) => ({ label: t.label, wert: t.wert }))} format="cent-rund" hervorheben="letzter" laufend="letzter" einblenden />
        <Donut className="col-span-12 md:col-span-4" titel={VERWALTUNG.zahlarten} teile={jeZahlart} format="cent-rund" einblenden />
        <Kachel className="col-span-12 md:col-span-7" titel={VERWALTUNG.letzteBelege} href={`${V}/belege`} oeffnenLabel={VERWALTUNG.alleBelege}>
          {d.letzte.length === 0 ? (
            <Leer titel={VERWALTUNG.leer} groesse="karte" />
          ) : (
            <ul className="-mx-2 flex flex-col" data-testid="kassa-letzte-belege">
              {d.letzte.map((b) => (
                <li key={b.name}>
                  <Link href={`${V}/belege/${encodeURIComponent(b.name)}`} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-2 py-2.5 transition-colors hover:bg-bo-fill">
                    <span className="text-[13px] tabular-nums text-bo-text-soft">{zeit(b.datum_uhrzeit).slice(-5)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{b.kunde_name || BELEGART_TITEL[b.belegart] || b.belegart}</span>
                      <span className="block text-[12px] tabular-nums text-bo-text-soft">
                        Nr. {b.belegnummer} · {zeit(b.datum_uhrzeit, false)}
                      </span>
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{euro(b.gesamt_cent)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
        <Kachel className="col-span-12 md:col-span-5" titel={VERWALTUNG.kassen} href={`${V}/kassen`}>
          <ul className="flex flex-col gap-3" data-testid="kassa-kassen">
            {d.kassen.map((k) => (
              <li key={k.name} className="flex items-center gap-3 rounded-[20px] bg-bo-surface-2 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bo-surface shadow-(--bo-sh-btn)">
                  <Icon name="Store" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`${V}/kassen/${encodeURIComponent(k.name)}`} className="block truncate text-[15px] font-semibold hover:underline">
                    {k.bezeichnung || k.name}
                  </Link>
                  <span className="block truncate text-[13px] text-bo-text-soft">{k.standort || k.name}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  {k.trainings_modus ? <Pille material="messing">{VERWALTUNG.trainingAktiv}</Pille> : <StatusBadge wert={k.status} ton={k.status === "Aktiv" ? "gruen" : "grau"} />}
                  <span className="text-[13px] tabular-nums text-bo-text-soft">{k.bestand_cent === null ? "" : euro(k.bestand_cent)}</span>
                </span>
              </li>
            ))}
          </ul>
          {leitung && fehlt.length > 0 && (
            <div className="mt-4 rounded-[16px] bg-bo-eiche-soft px-4 py-3 text-[13px] text-bo-eiche-text" data-testid="kassa-echtbetrieb">
              <p className="font-semibold">{VERWALTUNG.echtbetriebBraucht}</p>
              <p>{fehlt.join(" · ")}</p>
            </div>
          )}
        </Kachel>
        {d.ereignisse.length > 0 && (
          <Kachel className="col-span-12" titel={VERWALTUNG.ereignisseOffen} href={`${V}/ereignisse`}>
            <ul className="flex flex-col gap-2">
              {d.ereignisse.map((e) => (
                <li key={e.name} className="flex items-center gap-3 rounded-[16px] bg-bo-eiche-soft px-4 py-3 text-bo-eiche-text">
                  <Icon name="ShieldAlert" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 text-[14px]">
                    <b>{e.art}</b> · {e.kasse} · {zeit(e.zeitpunkt)}
                    {e.notiz ? <span className="block truncate text-[13px] opacity-90">{e.notiz}</span> : null}
                  </span>
                  {e.meldung_finanzonline_noetig ? <Pille material="eiche">Meldung nötig</Pille> : null}
                </li>
              ))}
            </ul>
          </Kachel>
        )}
      </Bento>
    </Shell>
  );
}
