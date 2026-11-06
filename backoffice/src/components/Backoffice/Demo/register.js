// Demo „Register“ (Team P0-1) für /einstellungen?tab=system&baustein=register – nur Admin, nur Mock
// (Prüfung im demo-register). Zeigt G-04 Fähigkeit (drei Zustände + Kern-Fähigkeiten), G-02 Kürzel-Register
// (Dialog, Belegung, Einzeltasten), G-01 Register (Bereiche, Arbeitsplätze, Betrieb, Prüfbefunde) und
// G-22 Code-Erkennung an Beispielwerten. Server Component; alle Zahlen kommen aus den Registern selbst.
// Gestaltung Lounge (lounge.md): Kacheln Radius 28 ohne Rahmen, eingelassene Karten (20) statt Kästen,
// Tabellen in der Kachel mit Haarlinie oben und Zeilen-Hover als Fläche, keine Versalien-Etiketten.

import Knopf from "../Knopf";
import Faehigkeit from "../Faehigkeit";
import FaehigkeitHinweis from "../FaehigkeitHinweis";
import KuerzelKnopf from "../Kuerzel/KuerzelKnopf";
import { Icon } from "../icons";
import cx from "../cx";
import { BEREICHE, ROUTEN, navigationFuer, pruefeBereiche } from "@/lib/backoffice/bereiche/index";
import { NUMMERNMUSTER, SCHNELLAKTIONEN } from "@/lib/backoffice/suche/register";
import { pruefeSuche } from "@/lib/backoffice/suche/index";
import { beispielAusSerie } from "@/lib/backoffice/suche/muster";
import { ANZAHL, SEED_BEREICHE, pruefeSeed } from "@/lib/backoffice/mock/seed/index";
import { KUERZEL, anzeigeText, eintraegeFuer, pruefeRegister } from "@/lib/backoffice/kuerzel/index";
import { ARBEITSPLAETZE, pruefeArbeitsplaetze } from "@/lib/backoffice/arbeitsplaetze";
import { BETRIEB } from "@/lib/backoffice/config";
import { KERN_FAEHIGKEITEN, faehigkeiten } from "@/lib/backoffice/faehigkeiten";
import { erkenneCode } from "@/lib/backoffice/codes";
import { doctypeLabel } from "@/lib/backoffice/labels";

const TEXTE = {
  titel: "Register und Fähigkeiten",
  team: "Baustein von Team P0-1",
  einleitung: "Fundament der Bereiche: Navigation, Palette, Kürzel, Seed, QA-Routen, Arbeitsplätze und Fähigkeiten. Jede Zahl hier wird aus den Registern gezählt.",
  abschnitte: { faehigkeit: "Fähigkeit", kuerzel: "Tastenkürzel", register: "Bereiche", arbeitsplaetze: "Arbeitsplätze", betrieb: "Betrieb", codes: "Code-Erkennung" },
  faehigkeitText: "Fehlt eine Backend-Voraussetzung, bleibt ein fachlich erwarteter Knopf sichtbar, aber gesperrt, mit Ersatzweg darunter. Nicht erwartete Funktionen erscheinen gar nicht.",
  zustaende: { an: "Verfügbar", deaktiviert: "Erwartet, fehlt noch", aus: "Nicht erwartet" },
  ausLeer: "– nichts angezeigt –",
  kernTitel: "Kern-Fähigkeiten im Mock (Probe gegen Backend-Import)",
  spalten: { id: "Fähigkeit", titel: "Bezeichnung", stand: "Stand", quelle: "Quelle" },
  stand: { an: "verfügbar", aus: "nicht verfügbar" },
  quelle: { probe: "Probe", schalter: "Schalter", recht: "Recht", unbekannt: "unbekannt", "ohne-probe": "ohne Probe" },
  schalterText: "Mock-Schalter: BACKOFFICE_MOCK_FAEHIGKEITEN oder Cookie ph_bo_faehigkeiten – „alle“, „keine“ oder „alle,-kassa.retoure“.",
  kuerzelText: "Ein Register für alle Tasten. Strg+/ öffnet die Übersicht, G und ein Buchstabe springt in einen Bereich. Einzeltasten wirken nie in Eingabefeldern und lassen sich abschalten.",
  globalTitel: "Überall",
  registerText: "Reihenfolge der Seitenleiste nach Inhaber-Bestätigung, danach Ablage und E-Mails. Jeder Bereich schreibt nur in seine eigenen Teildateien.",
  bereichSpalten: { bereich: "Bereich", navigation: "Navigation", routen: "Eigene Routen", seed: "Seed-DocTypes", aktionen: "Schnellaktionen", muster: "Nummernmuster", kuerzel: "Kürzel" },
  pruefungOk: "Register in Ordnung – keine doppelten Slugs, Routen, Kürzel oder Nummernmuster.",
  pruefungFehler: (n) => `${n} Befunde im Register`,
  arbeitsplatzSpalten: { ziffer: "Taste", titel: "Arbeitsplatz", route: "Ziel", rollen: "Rollen" },
  alleRollen: "Alle mit Backoffice-Zugang",
  betriebText: "Entscheidungen des Inhabers sind Einstellungen, keine Fähigkeiten. Bis zur Entscheidung gilt der Standard.",
  an: "an",
  aus: "aus",
  codesText: "Was ein Scanner oder eine Eingabe liefert, wird nach den Formaten der Frappe-Apps eingeordnet.",
  codeSpalten: { eingabe: "Eingabe", art: "Erkannt als", ziel: "Ziel" },
  arten: { "event-qr": "Event-Ticket", "kassenbeleg-qr": "RKSV-Code", gutschein: "Gutschein", kundenkarte: "Kundenkarte", beleg: "Belegnummer", kassenbeleg: "Kassenbeleg", ean: "EAN", lageretikett: "Lagerplatz", url: "Website-Link", abholcode: "Abholcode", text: "Freitext" },
  knopf: { retoure: "Zurücknehmen", erstatten: "Erstatten", export: "DATEV-Export" },
};

// Beispiel-Status für die drei Darstellungen (keine echten Fähigkeiten).
const BEISPIELE = [
  { zustand: "an", status: { id: "demo.an", an: true, erwartet: true, grund: null, ersatz: null, titel: TEXTE.knopf.retoure }, knopf: TEXTE.knopf.retoure },
  { zustand: "deaktiviert", status: { id: "demo.erwartet", an: false, erwartet: true, grund: "Noch nicht verfügbar", ersatz: { titel: "An der Kassa kassieren", href: "/kassa" }, titel: TEXTE.knopf.erstatten }, knopf: TEXTE.knopf.erstatten },
  { zustand: "aus", status: { id: "demo.aus", an: false, erwartet: false, grund: "Noch nicht verfügbar", ersatz: null, titel: TEXTE.knopf.export }, knopf: TEXTE.knopf.export },
];

const CODE_BEISPIELE = ["RE-2026-00114", "PH-S-261104-00012", "KK-7K3QX9", "PH-7K3Q-X9MA-2BCD-EFGH", "4006381333931", "Lager Lochau/R1-03", "PHE1.EV-2026-01.Z1.MUSTER", "KASSE-LOCHAU-01-001000", "Sofa grau"];

const DEMO_SESSION = { user: "admin@demo.local", roles: ["System Manager"], bereiche: BEREICHE.map((b) => b.slug) };

function Abschnitt({ id, titel, text, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className="bo-kachel">
      <h2 id={`${id}-titel`} className="bo-titel-kachel">
        {titel}
      </h2>
      {text && <p className="bo-unterzeile mt-0.5 max-w-3xl">{text}</p>}
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

function Tabelle({ kopf, zeilen, rechts = [] }) {
  return (
    <div className="bo-scroll-x -mx-2 min-w-0 overflow-x-auto px-2">
      <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-[15px] leading-[22px]">
        <thead className="text-left text-[13px] leading-[18px] text-bo-text-soft">
          <tr>
            {kopf.map((k, i) => (
              <th key={k} scope="col" className={cx("whitespace-nowrap px-3 pb-2 font-medium", rechts.includes(i) && "text-right")}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z, zi) => (
            <tr key={zi} className="group">
              {z.map((c, i) => (
                <td key={i} className={cx("border-t border-bo-line px-3 py-3 align-middle transition-colors duration-[120ms] group-hover:bg-bo-fill first:rounded-l-bo-zeile last:rounded-r-bo-zeile", rechts.includes(i) && "text-right tabular-nums")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kbd({ taste }) {
  return <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-bo-xs bg-bo-fill-2 px-1.5 font-sans text-xs font-medium tabular-nums text-bo-text-soft">{anzeigeText(taste)}</kbd>;
}

/** Liste ohne Trennlinien: Zeilen als Flächen beim Überfahren (Lounge). */
function Zeilen({ children, spalten = false }) {
  return <ul className={cx("-mx-3 grid grid-cols-1", spalten && "sm:grid-cols-2 sm:gap-x-2")}>{children}</ul>;
}

function Zeile({ children }) {
  return <li className="flex min-h-11 items-center justify-between gap-3 rounded-bo-zeile px-3 py-2 text-[15px] leading-[22px] transition-colors duration-[120ms] hover:bg-bo-fill">{children}</li>;
}

export default async function RegisterDemo() {
  const kern = await faehigkeiten(DEMO_SESSION, Object.keys(KERN_FAEHIGKEITEN), { modus: "mock", ueberschreibung: null });
  const befunde = [...pruefeBereiche(), ...pruefeSuche(undefined, beispielAusSerie), ...pruefeSeed(), ...pruefeRegister(), ...pruefeArbeitsplaetze()];
  const global = eintraegeFuer("global").filter((k) => k.gruppe !== "Gehe zu");
  const gehe = eintraegeFuer("global").filter((k) => k.gruppe === "Gehe zu");
  const routenJeBereich = (slug) => [...ROUTEN.values()].filter((r) => r.bereich === slug).length;
  const kuerzelJeBereich = (slug) => KUERZEL.filter((k) => k.bereich === slug).length;
  const seedJeBereich = (slug) => Object.keys(SEED_BEREICHE[slug]?.anzahl || {}).filter((dt) => dt in ANZAHL).length;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-register">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
        <p className={cx("mt-4 inline-flex min-h-7 items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium leading-[18px]", befunde.length ? "bg-bo-danger-soft text-bo-danger-text" : "bg-bo-success-soft text-bo-success-text")} data-testid="register-pruefung">
          <Icon name={befunde.length ? "TriangleAlert" : "CircleCheck"} className="size-4 shrink-0" />
          {befunde.length ? TEXTE.pruefungFehler(befunde.length) : TEXTE.pruefungOk}
        </p>
        {befunde.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-[13px] text-bo-danger-text">
            {befunde.slice(0, 12).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </header>

      <Abschnitt id="faehigkeit" titel={TEXTE.abschnitte.faehigkeit} text={TEXTE.faehigkeitText}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BEISPIELE.map((b) => (
            <div key={b.zustand} className="flex min-h-32 min-w-0 flex-col gap-3 rounded-bo-karte bg-bo-fill p-4" data-testid={`faehigkeit-${b.zustand}`}>
              <p className="text-[13px] font-medium leading-[18px] text-bo-text-soft">{TEXTE.zustaende[b.zustand]}</p>
              <Faehigkeit status={b.status}>
                {({ deaktiviert, grund }) => (
                  <Knopf disabled={deaktiviert} grund={grund} icon="RotateCcw">
                    {b.knopf}
                  </Knopf>
                )}
              </Faehigkeit>
              {b.zustand === "aus" && <p className="text-[13px] text-bo-text-faint">{TEXTE.ausLeer}</p>}
            </div>
          ))}
        </div>
        <h3 className="mb-2 mt-6 text-[13px] font-semibold leading-[18px] text-bo-text-soft">{TEXTE.kernTitel}</h3>
        <Tabelle
          kopf={[TEXTE.spalten.id, TEXTE.spalten.titel, TEXTE.spalten.stand, TEXTE.spalten.quelle]}
          zeilen={Object.values(kern).map((s) => [
            <code key="id" className="font-mono text-[13px]">{s.id}</code>,
            s.titel,
            s.an ? TEXTE.stand.an : <span key="h" className="inline-flex flex-col">{TEXTE.stand.aus}<FaehigkeitHinweis status={s} /></span>,
            TEXTE.quelle[s.quelle] || s.quelle,
          ])}
        />
        <p className="mt-3 text-xs leading-4 text-bo-text-faint">{TEXTE.schalterText}</p>
      </Abschnitt>

      <Abschnitt id="kuerzel" titel={TEXTE.abschnitte.kuerzel} text={TEXTE.kuerzelText}>
        <div className="mb-5">
          <KuerzelKnopf />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="mb-1 text-[13px] font-semibold leading-[18px] text-bo-text-soft">{TEXTE.globalTitel}</h3>
            <Zeilen>
              {global.map((k) => (
                <Zeile key={k.id}>
                  <span className="min-w-0">{k.titel}</span>
                  <Kbd taste={k.taste} />
                </Zeile>
              ))}
            </Zeilen>
          </div>
          <div className="min-w-0">
            <h3 className="mb-1 text-[13px] font-semibold leading-[18px] text-bo-text-soft">Gehe zu</h3>
            <Zeilen spalten>
              {gehe.map((k) => (
                <Zeile key={k.id}>
                  <span className="min-w-0 truncate">{k.titel.replace(/^Gehe zu /, "")}</span>
                  <Kbd taste={k.taste} />
                </Zeile>
              ))}
            </Zeilen>
          </div>
        </div>
      </Abschnitt>

      <Abschnitt id="bereiche" titel={TEXTE.abschnitte.register} text={TEXTE.registerText}>
        <Tabelle
          rechts={[1, 2, 3, 4, 5, 6]}
          kopf={Object.values(TEXTE.bereichSpalten)}
          zeilen={BEREICHE.map((b) => [
            <span key="b" className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="inline-grid size-8 place-items-center rounded-full bg-bo-fill text-bo-text-soft" aria-hidden="true">
                <Icon name={b.icon} className="size-4" />
              </span>
              {b.titel}
            </span>,
            navigationFuer(b).length,
            routenJeBereich(b.slug),
            seedJeBereich(b.slug),
            SCHNELLAKTIONEN.filter((a) => a.bereich === b.slug).length,
            NUMMERNMUSTER.filter((m) => m.bereich === b.slug).length,
            kuerzelJeBereich(b.slug),
          ])}
        />
      </Abschnitt>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <Abschnitt id="arbeitsplaetze" titel={TEXTE.abschnitte.arbeitsplaetze}>
          <Tabelle
            kopf={Object.values(TEXTE.arbeitsplatzSpalten)}
            zeilen={ARBEITSPLAETZE.map((a) => [<Kbd key="z" taste={String(a.ziffer)} />, a.titel, <code key="r" className="font-mono text-[13px]">{a.route}</code>, a.rollen?.length ? a.rollen.map((r) => r.replace(/^PH /, "")).join(", ") : TEXTE.alleRollen])}
          />
        </Abschnitt>
        <Abschnitt id="betrieb" titel={TEXTE.abschnitte.betrieb} text={TEXTE.betriebText}>
          <Zeilen>
            {Object.entries(BETRIEB).map(([k, v]) => (
              <Zeile key={k}>
                <code className="min-w-0 truncate font-mono text-[13px]">{k}</code>
                <span className="tabular-nums text-bo-text-soft">{typeof v === "boolean" ? (v ? TEXTE.an : TEXTE.aus) : String(v)}</span>
              </Zeile>
            ))}
          </Zeilen>
        </Abschnitt>
      </div>

      <Abschnitt id="codes" titel={TEXTE.abschnitte.codes} text={TEXTE.codesText}>
        <Tabelle
          kopf={Object.values(TEXTE.codeSpalten)}
          zeilen={CODE_BEISPIELE.map((c) => {
            const t = erkenneCode(c);
            return [<code key="c" className="font-mono text-[13px]">{c}</code>, TEXTE.arten[t.art], t.doctype ? `${doctypeLabel(t.doctype)} ${t.name}` : t.lagerort ? `${t.lagerort} · ${t.platz || "–"}` : t.event ? `Event ${t.event}` : "–"];
          })}
        />
      </Abschnitt>
    </div>
  );
}
