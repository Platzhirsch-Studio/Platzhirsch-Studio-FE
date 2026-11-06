"use client";
// Demo „Akte“ (Team P0-5a, G-14) für /einstellungen?tab=system&baustein=akte – nur Admin, nur Mock
// (Prüfung im demo-register). Baut die Kundenakte des Entwurfs „Lounge“ aus den Fundament-Bausteinen
// nach: AkteKopf, AkteHero mit Glas-Kacheln, AkteTabs (Reiter in der URL als ?reiter=), Vorgangsleiste,
// Band (waehleBand), Slots (ok · leer · Fehler je Abschnitt) und rechte Spalte mit Bezügen.
// Alle Werte sind Beispielwerte; Aktionen führen nirgendwohin (Anker).

import { useSearchParams } from "next/navigation";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band, Bezuege, GlasKnopf, RechteSpalte, Vorgangsleiste, AkteSlotListe } from "../Akte";
import Knopf, { RundKnopf } from "../Knopf";
import Kachel from "../Kachel";
import { Pille } from "../StatusBadge";
import PersonZelle from "../PersonZelle";
import { cent } from "@/lib/backoffice/format";
import { TEXTE as AKTE_TEXTE } from "@/lib/backoffice/akte/texte";
import { aktiverTab, waehleBand } from "@/lib/backoffice/akte/geruest";
import { fortschritt, normalisiereSchritte } from "@/lib/backoffice/akte/vorgang";
import { BEZUEGE, BILD, REISE, TEAM } from "./akte-daten";

const TEXTE = {
  titel: "Akte-Gerüst",
  team: "Baustein von Team P0-5a",
  einleitung: "Kopf, Hero mit Glas-Kacheln, Reiter, Vorgangsleiste, Abschnitte aus anderen Bereichen und die rechte Spalte. So sehen Kundenakte und Auftragsmappe aus. Alle Werte sind Beispiele.",
  zurueck: "Projekte",
  krumen: ["Projekte", "Haus am See"],
  stufe: "Platzhirsch Plus",
  seit: "Kundin seit 2019",
  kunde: "Familie Brändle",
  projekt: "Haus am See",
  bereiche: "Küche · Wohnen · Essen · Terrasse",
  nr: "PRJ-2026-021",
  ort: "Seestraße, Lochau",
  anrufen: "Anrufen",
  mail: "E-Mail",
  termin: "Termin",
  kacheln: {
    wert: "Auftragswert",
    wertUnter: "brutto · 11 Positionen",
    bezahlt: "Bezahlt",
    bezahltLabel: "40 Prozent bezahlt",
    termin: "Nächster Termin",
    terminWann: "Do, 12. Nov · 9:00",
    terminWas: "Feinaufmaß Küche vor Ort",
    lieferung: "Lieferung Küche",
    lieferungWann: "KW 49",
    lieferungWas: "bestätigt",
  },
  tabs: [
    { id: "uebersicht", titel: "Übersicht" },
    { id: "positionen", titel: "Positionen", anzahl: 11 },
    { id: "planung", titel: "Planung", anzahl: 14 },
    { id: "belege-lieferung", titel: "Belege & Lieferung" },
    { id: "montage", titel: "Montage" },
    { id: "dateien", titel: "Dateien", anzahl: 23 },
  ],
  baender: [
    { rang: 3, ton: "info", titel: "Anzahlung eingegangen", text: "Bestellungen beim Hersteller sind frei." },
    { rang: 2, ton: "warnung", titel: "Rücktrittsfrist läuft", text: "bis 18.11. – Bestellungen erst danach auslösen." },
  ],
  bandAktion: "Frist ansehen",
  naechster: "Liefertermin Küche mit Familie Brändle abstimmen",
  naechsterAktion: "Termin vorschlagen",
  slots: {
    verlauf: "Verlauf",
    positionen: "Größte Positionen",
    fremd: "Fremdgewerke",
    fremdLeer: "Noch kein Fremdgewerk beauftragt.",
    montage: "Montageplanung",
  },
  betraege: "Beträge",
  betraegeUnter: "Auftrag AB-2026-0094 · brutto",
  zahlungsplan: "Zahlungsplan: 40 % bezahlt, 50 % vor Lieferung, 10 % nach Abnahme",
  details: [
    ["Beratung", TEAM.LM],
    ["Planung", TEAM.JF],
    ["Montageleitung", TEAM.MG],
  ],
};

const VERLAUF = [
  { zeit: "heute 9:12", titel: "Anzahlung eingegangen", text: "Überweisung · Rechnung RE-2026-0204", wer: TEAM.EK },
  { zeit: "Mo 19:24", titel: "E-Mail von Katharina Brändle", text: "„Die Muster sind angekommen – wir nehmen die geräucherte Eiche.“", wer: null },
  { zeit: "Mo 11:05", titel: "Auftragsbestätigung Hersteller", text: "Liefertermin KW 49 · Spedition", wer: TEAM.DN },
];

const POSITIONEN = [
  { titel: "Küche mit Kochinsel 3,2 m", info: "Eiche geräuchert", bild: "/entwurf/lounge/r-kueche-eiche.jpg", cent: 6480000 },
  { titel: "Sofalandschaft", info: "Leder Cognac", bild: "/entwurf/lounge/r-wohnen-sofa.jpg", cent: 3842000 },
  { titel: "Outdoor-Lounge, 7-teilig", info: "Terrasse Süd", bild: "/entwurf/lounge/r-terrasse-see.jpg", cent: 2154000 },
];

function VerlaufSlot({ daten }) {
  return (
    <ol className="flex flex-col gap-5">
      {daten.map((e) => (
        <li key={e.titel} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
          <p className="text-[15px] font-semibold leading-[22px]">{e.titel}</p>
          <span className="text-[13px] text-bo-text-soft tabular-nums">{e.zeit}</span>
          <p className="col-span-2 text-sm leading-5 text-bo-text-soft">{e.text}</p>
          {e.wer && <PersonZelle person={e.wer} groesse={24} className="col-span-2 mt-1" />}
        </li>
      ))}
    </ol>
  );
}

function PositionenSlot({ daten }) {
  return (
    <ul className="flex flex-col">
      {daten.map((p, i) => (
        <li key={p.titel} className={`grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 py-2.5 ${i ? "shadow-[0_calc(-1*var(--bo-hair))_0_var(--color-bo-line)]" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Demo-Bild aus public/entwurf/lounge */}
          <img src={p.bild} alt="" className="size-14 rounded-[14px] object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{p.titel}</span>
            <span className="block truncate text-[13px] text-bo-text-soft">{p.info}</span>
          </span>
          <span className="text-[15px] font-semibold tabular-nums">{cent(p.cent)}</span>
        </li>
      ))}
    </ul>
  );
}

const SLOTS = [
  { slot: { id: "projekte.verlauf", titel: TEXTE.slots.verlauf, Komponente: VerlaufSlot, breite: "voll" }, ergebnis: { ok: true, daten: VERLAUF } },
  { slot: { id: "faktura.positionen", titel: TEXTE.slots.positionen, Komponente: PositionenSlot, breite: "voll" }, ergebnis: { ok: true, daten: POSITIONEN } },
  { slot: { id: "projekte.fremdgewerke", titel: TEXTE.slots.fremd, Komponente: () => null, breite: "halb", leerText: TEXTE.slots.fremdLeer }, ergebnis: { ok: true, daten: [], leer: true } },
  { slot: { id: "logistik.montage", titel: TEXTE.slots.montage, Komponente: () => null, breite: "halb" }, ergebnis: { ok: false, code: "unavailable" } },
];

function Betraege() {
  return (
    <Kachel titel={TEXTE.betraege} unter={TEXTE.betraegeUnter} testid="demo-akte-betraege">
      <p className="text-[40px] font-normal leading-[44px] tracking-[-0.035em] tabular-nums">{cent(14860000)}</p>
      <div className="mt-5 mb-1 flex h-2.5 gap-[3px]" role="img" aria-label={TEXTE.zahlungsplan}>
        <span className="rounded-pill bg-bo-salbei" style={{ flex: 40 }} />
        <span className="rounded-pill bg-bo-eiche" style={{ flex: 50 }} />
        <span className="rounded-pill bg-bo-line-strong" style={{ flex: 10 }} />
      </div>
    </Kachel>
  );
}

export default function AkteDemo() {
  const sp = useSearchParams();
  const reiter = aktiverTab([...TEXTE.tabs, { id: "seite" }], sp?.get("reiter"));
  const params = { tab: "system", baustein: "akte" };
  const stufen = normalisiereSchritte(REISE);
  const f = fortschritt(stufen);
  const band = waehleBand(TEXTE.baender);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-akte">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>

      <AkteGeruest
        testid="demo-akte-geruest"
        seiteAktiv={reiter === "seite"}
        kopf={
          <AkteKopf
            zurueck={{ href: "#projekte", titel: TEXTE.zurueck }}
            krumen={[{ titel: TEXTE.krumen[0], href: "#projekte" }, { titel: TEXTE.krumen[1] }]}
            rechts={
              <Pille material="cognac" testid="demo-akte-stufe">
                {TEXTE.stufe} <span className="font-normal">· {TEXTE.seit}</span>
              </Pille>
            }
          />
        }
        hero={
          <AkteHero
            ebene={2}
            testid="demo-akte-hero"
            bild={BILD}
            ueber={TEXTE.kunde}
            titel={TEXTE.projekt}
            unter={TEXTE.bereiche}
            chips={[{ icon: "FileText", text: TEXTE.nr }, { icon: "MapPin", text: TEXTE.ort }]}
            aktionen={
              <>
                <GlasKnopf icon="Phone" href="#anrufen">{TEXTE.anrufen}</GlasKnopf>
                <GlasKnopf icon="Mail" href="#mail">{TEXTE.mail}</GlasKnopf>
                <GlasKnopf icon="CalendarDays" href="#termin" hell>{TEXTE.termin}</GlasKnopf>
              </>
            }
            kacheln={[
              { titel: TEXTE.kacheln.wert, wert: cent(14860000).replace(",00", ""), unter: TEXTE.kacheln.wertUnter },
              { titel: TEXTE.kacheln.bezahlt, wert: cent(5944000).replace(",00", ""), balken: { anteil: 0.4, label: TEXTE.kacheln.bezahltLabel } },
              { titel: TEXTE.kacheln.termin, wert: TEXTE.kacheln.terminWann, unter: TEXTE.kacheln.terminWas, person: TEAM.JF, mittel: true },
              { titel: TEXTE.kacheln.lieferung, wert: TEXTE.kacheln.lieferungWann, unter: TEXTE.kacheln.lieferungWas },
            ]}
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} text={band.text} testid="demo-akte-band" aktion={<Knopf variant="ghost" size="s" href="#frist">{TEXTE.bandAktion}</Knopf>} />}
        reiter={
          <AkteTabs
            tabs={TEXTE.tabs}
            aktiv={reiter}
            basis="/einstellungen"
            params={params}
            param="reiter"
            mitSeite
            rechts={<Pille material="eiche">{AKTE_TEXTE.vorgang.stufe(f.nr, f.stufen, stufen[f.aktuell]?.titel)}</Pille>}
          />
        }
        vorgang={
          <Vorgangsleiste
            testid="demo-akte-reise"
            schritte={REISE}
            werkzeuge={
<RundKnopf icon="CalendarDays" groesse="s" label="Termine" href="#termine" />
            }
            naechster={{ titel: TEXTE.naechster, aktion: { titel: TEXTE.naechsterAktion, href: "#termin" } }}
          />
        }
        rechts={
          <RechteSpalte
            details={
              <dl className="grid grid-cols-1 gap-3">
                {TEXTE.details.map(([rolle, person]) => (
                  <div key={rolle} className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-bo-text-soft">{rolle}</dt>
                    <dd className="min-w-0">
                      <PersonZelle person={person} groesse={24} />
                    </dd>
                  </div>
                ))}
              </dl>
            }
            bezuege={<Bezuege gruppen={BEZUEGE} />}
          >
            <Betraege />
          </RechteSpalte>
        }
      >
        <AkteSlotListe eintraege={SLOTS} id="PRJ-2026-021" akte="projekt" tab={reiter} />
      </AkteGeruest>
    </div>
  );
}
