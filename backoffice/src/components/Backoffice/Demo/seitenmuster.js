// Demo „seitenmuster“ (Team P0-5b, MASTER G-09 · G-10 · G-11 · G-13 · G-29) für
// /einstellungen?tab=system&baustein=seitenmuster – nur Admin, nur Mock (Prüfung im demo-register).
// Server-Komponente: Seitenkopf (groß, Akte, Begrüßung), Unternav, Zu tun (Quellen mit Zahl, langsam,
// Fehler, leer), Liste mit Bildern und Avataren, Kanban, Formular mit Speicherleiste, Autosave,
// Zwei-Klick-Knopf, Berichtsseite (Ergebnis und Zeitlimit). Beispieldaten, nichts wird gespeichert.

import Seitenkopf from "../Seitenkopf";
import Knopf from "../Knopf";
import { Bento } from "../Kachel";
import { Pille } from "../StatusBadge";
import ZuTun from "../ZuTun/ZuTun";
import BerichtSeite from "../Bericht/BerichtSeite";
import { Balken } from "../Charts";
import { DemoAutosave, DemoFormular, DemoKanban, DemoSpeicherleiste, DemoTabelle, DemoUnternav, DemoZweiKlick } from "./seitenmuster-teile";

const TEXTE = {
  abschnitt: (t) => t,
  seitenkopf: "Seitenkopf",
  zutun: "Zu tun",
  liste: "Liste in schwebender Kachel",
  kanban: "Kanban",
  formular: "Formular, Speicherleiste, Autosave",
  bericht: "Berichtsseite",
};

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const QUELLEN = [
  { id: "fundament.demo-anfragen", bereich: "fundament", icon: "Inbox", ton: "cognac", rang: 1, satz: (n) => `${n} Anfragen warten auf den Erstkontakt`, unter: "Älteste seit gestern, 8:41", zaehle: async () => 7, knopf: { titel: "Ansehen", href: "/einstellungen?tab=system&baustein=seitenmuster" } },
  { id: "fundament.demo-angebote", bereich: "fundament", icon: "FileText", ton: "eiche", rang: 2, satz: (n) => `${n} Angebote laufen in 7 Tagen ab`, unter: "Nachfassen vor Ablauf", zaehle: async () => 3, knopf: { titel: "Nachfassen", href: "/einstellungen?tab=system&baustein=seitenmuster" } },
  { id: "fundament.demo-montage", bereich: "fundament", icon: "Truck", ton: "salbei", rang: 3, satz: (n) => `${n} Montagen ohne bestätigten Termin`, unter: "Diese Woche", zaehle: async () => { await warte(1200); return 2; }, knopf: { titel: "Planen", href: "/einstellungen?tab=system&baustein=seitenmuster" } },
  { id: "fundament.demo-leer", bereich: "fundament", icon: "Check", satz: (n) => `${n} Rückfragen offen`, zaehle: async () => 0, knopf: { titel: "Öffnen", href: "/einstellungen?tab=system&baustein=seitenmuster" } },
  { id: "fundament.demo-fehler", bereich: "fundament", titel: "Bank-Umsätze", icon: "Banknote", satz: (n) => `${n} Umsätze zuordnen`, zaehle: async () => { throw new Error("Quelle nicht erreichbar"); }, knopf: { titel: "Zuordnen", href: "/einstellungen?tab=system&baustein=seitenmuster" } },
];
const NICHTS = [{ ...QUELLEN[3], id: "fundament.demo-nichts" }];

const B_SPALTEN = [
  { fieldname: "monat", label: "Monat", fieldtype: "Data" },
  { fieldname: "anfragen", label: "Anfragen", fieldtype: "Int" },
  { fieldname: "auftraege", label: "Aufträge", fieldtype: "Int" },
  { fieldname: "umsatz_cent", label: "Umsatz netto", fieldtype: "Int", cent: true },
];
const B_ZEILEN = [
  { name: "2026-06", monat: "Juni", anfragen: 21, auftraege: 5, umsatz_cent: 14200000 },
  { name: "2026-07", monat: "Juli", anfragen: 18, auftraege: 4, umsatz_cent: 15100000 },
  { name: "2026-08", monat: "August", anfragen: 12, auftraege: 3, umsatz_cent: 11800000 },
  { name: "2026-09", monat: "September", anfragen: 26, auftraege: 7, umsatz_cent: 22400000 },
  { name: "2026-10", monat: "Oktober", anfragen: 29, auftraege: 8, umsatz_cent: 26300000 },
];

function Abschnitt({ titel, children, testid }) {
  return (
    <section className="mt-14 min-w-0" data-testid={testid}>
      <h2 className="bo-titel mb-5 px-1">{titel}</h2>
      {children}
    </section>
  );
}

export default function DemoSeitenmuster() {
  const basis = "/einstellungen?tab=system&baustein=seitenmuster";
  return (
    <div className="min-w-0" data-testid="demo-seitenmuster">
      <Seitenkopf
        titel="Anfragen"
        ueber="Verkauf"
        kennzahlen={[
          { wert: "7", text: "neu seit gestern" },
          { wert: "2,4 h", text: "bis Erstkontakt, Ø" },
        ]}
        aktionen={
          <Knopf variant="primary" icon="Plus" size="l">
            Neue Anfrage
          </Knopf>
        }
        unternav={<DemoUnternav />}
        testid="demo-kopf-gross"
      />

      <Abschnitt titel={TEXTE.seitenkopf} testid="demo-seitenkopf">
        <div className="flex min-w-0 flex-col gap-8">
          <Seitenkopf
            titel="Haus am See"
            krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Projekte", href: basis }, { titel: "Familie Brändle", href: basis }, { titel: "Haus am See" }]}
            titelZusatz={<Pille material="cognac">Platzhirsch Plus</Pille>}
            untertitel="Küche · Wohnen · Essen · Terrasse"
            aktionen={
              <>
                <Knopf variant="secondary" icon="Phone">
                  Anrufen
                </Knopf>
                <Knopf variant="primary" icon="CalendarPlus">
                  Termin
                </Knopf>
              </>
            }
            testid="demo-kopf-akte"
          />
          <Seitenkopf titel="Guten Morgen, Lena" variante="gruss" ueber="Mittwoch, 4. November · Showroom Lochau" kennzahlen={[{ wert: "7", text: "Neue Anfragen" }, { wert: "5", text: "Termine heute" }, { wert: "186,4 T€", text: "Offene Angebote" }]} testid="demo-kopf-gruss" />
        </div>
      </Abschnitt>

      <Abschnitt titel={TEXTE.zutun} testid="demo-zutun">
        <Bento>
          <div className="md:col-span-8">
            <ZuTun quellen={QUELLEN} alleHref={basis} sicht="alle" sichtBasis={basis} testid="demo-zutun-liste" />
          </div>
          <div className="md:col-span-4">
            <ZuTun quellen={NICHTS} titel="Zu tun · Service" unter="Wenn nichts wartet." testid="demo-zutun-leer" />
          </div>
        </Bento>
      </Abschnitt>

      <Abschnitt titel={TEXTE.liste} testid="demo-liste">
        <DemoTabelle />
      </Abschnitt>

      <Abschnitt titel={TEXTE.kanban} testid="demo-kanban-abschnitt">
        <DemoKanban />
      </Abschnitt>

      <Abschnitt titel={TEXTE.formular} testid="demo-formular-abschnitt">
        <Bento className="mb-(--bo-bento-gap)">
          <div className="md:col-span-5">
            <DemoZweiKlick />
          </div>
          <div className="md:col-span-7">
            <DemoAutosave />
          </div>
          <div className="md:col-span-12">
            <DemoSpeicherleiste />
          </div>
        </Bento>
        <DemoFormular />
      </Abschnitt>

      <Abschnitt titel={TEXTE.bericht} testid="demo-bericht">
        <BerichtSeite
          bericht="anfragen-monat"
          bereich="crm"
          titel="Anfragen und Aufträge"
          untertitel="Je Monat, Beispielwerte"
          krumen={[{ titel: "CRM", href: basis }, { titel: "Berichte", href: basis }, { titel: "Anfragen und Aufträge" }]}
          filter={{ basis, params: { von: "2026-06-01", bis: "2026-10-31" }, felder: [{ name: "bereich", label: "Bereich", optionen: [{ wert: "kueche", titel: "Küche" }, { wert: "wohnen", titel: "Wohnen" }] }] }}
          ergebnis={{ status: "ok", zeilen: B_ZEILEN }}
          spalten={B_SPALTEN}
          diagramme={<Balken className="md:col-span-12" titel="Umsatz" untertitel="Netto je Monat, in T€ (Beispielwerte)" punkte={B_ZEILEN.map((z) => ({ label: z.monat.slice(0, 3), wert: Math.round(z.umsatz_cent / 100000) }))} hervorheben="letzter" hoehe={150} />}
          darfExport
        />
        <div className="mt-10">
          <BerichtSeite bericht="bewegungen" bereich="crm" titel="Alle Bewegungen" ergebnis={{ status: "zeitlimit" }} spalten={B_SPALTEN} filter={{ basis, params: {} }} testid="demo-bericht-zeitlimit" />
        </div>
      </Abschnitt>
    </div>
  );
}
