"use client";
// Demo „Overlays“ (Team P0-4) für /einstellungen?tab=system&baustein=overlay – nur Admin, nur Mock
// (Prüfung im demo-register). Zeigt G-06 Popover/Menü/Kontextmenü/Tooltip/Dialog, G-07 Sheet + Peek,
// G-08 Lightbox im Lounge-Stil. Musterdaten aus dem freigegebenen Lounge-Entwurf (keine echten Kunden),
// Bilder aus public/entwurf/lounge. Keine Server Actions: „Speichern“ und „Stornieren“ wirken nur hier.

import { useEffect, useState } from "react";
import Knopf, { RundKnopf } from "../Knopf";
import Kachel from "../Kachel";
import { Pille } from "../StatusBadge";
import Avatar from "../Avatar";
import Schalter from "../Schalter";
import { Icon } from "../icons";
import cx from "../cx";
import Bestaetigen from "../Bestaetigen";
import { Dialog, Kontextmenue, Lightbox, Menue, MenueGruppe, MenuePunkt, MenueTrenner, Peek, Popover, Sheet, Tooltip, useListenPeek, usePanel } from "../Overlay";

const TEXTE = {
  team: "Baustein von Team P0-4",
  titel: "Overlays",
  einleitung: "Alles, was über der Arbeit schwebt: Menüs und Popover aus Material mit Unschärfe, Tooltips als Tinte-Pille, Dialoge und Sheets mit Griff und Feder, die Vorschau neben der Liste und die Lightbox für Bilder und Dokumente.",
  abschnitte: {
    popover: { titel: "Menü, Popover und Kontextmenü", unter: "Material mit Unschärfe, Flip am Fensterrand, unter 640 px Bottom-Sheet mit Griff. Pfeiltasten, Pos1/Ende und Anfangsbuchstaben im Menü." },
    tooltip: { titel: "Tooltip", unter: "Nach 400 ms, in einer Gruppe sofort. Nie interaktiv, im Kiosk aus." },
    dialog: { titel: "Dialog und Bestätigen", unter: "Titel als Frage, Fakten darunter. Rote Aktion: Fokus auf Abbrechen. Während der Ausführung wirkt Esc nicht." },
    sheet: { titel: "Sheet und Vorschau", unter: "Leertaste auf einer Zeile öffnet die Vorschau, J/K blättert, Esc schließt. Die Liste bleibt bedienbar." },
    lightbox: { titel: "Lightbox", unter: "Bilder und PDFs eines Objekts mit Quelle und Freigabe. Herunterladen nur mit Recht." },
  },
  menue: { ausloeser: "Aktionen", bearbeiten: "Bearbeiten", duplizieren: "Duplizieren", teilen: "Link kopieren", drucken: "Angebot drucken", export: "An DATEV übergeben", exportGrund: "Noch nicht verfügbar – Export über die Faktura", stornieren: "Stornieren", gruppe: "Ansicht", liste: "Liste", karten: "Karten" },
  filter: { ausloeser: "Filter", titel: "Anfragen filtern", neu: "Nur neue Anfragen", meine: "Nur meine", ruhend: "Ruhende einblenden", anwenden: "Anwenden", zuruecksetzen: "Zurücksetzen" },
  kontext: { hinweis: "Rechtsklick, langes Drücken oder Umschalt+F10 auf einer Karte", oeffnen: "Öffnen", termin: "Beratung vereinbaren", zuweisen: "Zuweisen …", ablegen: "Ruhend setzen" },
  tooltips: { suche: "Suchen · Strg+K", glocke: "Benachrichtigungen", plus: "Neu anlegen", kennzahl: "Bis zum ersten Rückruf, Durchschnitt der letzten 30 Tage", kennzahlTitel: "Bis Erstkontakt" },
  dialog: {
    normal: "Termin bestätigen",
    normalTitel: "Beratung am Mittwoch bestätigen?",
    normalText: "Familie Brändle bekommt eine Terminbestätigung per E-Mail.",
    normalJa: "Bestätigen",
    gefahr: "Angebot stornieren",
    gefahrTitel: "AN-2026-0012 stornieren?",
    gefahrText: "Das Angebot wird ungültig. Die Nummer bleibt vergeben und erscheint im Protokoll.",
    gefahrJa: "Stornieren",
    fakten: [
      { label: "Kunde", wert: "Katharina & Paul Stadler" },
      { label: "Angebot vom", wert: "28.10.2026" },
      { label: "Positionen", wert: "14" },
    ],
    gross: "Großer Dialog",
    grossTitel: "Was ist neu im Backoffice?",
    grossText: "Dialoge gibt es in drei Breiten: 400, 560 und 800 px. Am Telefon kommen sie von unten.",
    grossInhalt: ["Menüs und Kontextmenüs schweben als Material über der Arbeit.", "Vorschau neben der Liste: Leertaste, J und K.", "Bilder und Dokumente öffnen in der Lightbox."],
    verstanden: "Verstanden",
    erledigt: "Erledigt (nur in dieser Demo)",
  },
  sheet: {
    oeffnen: "Notiz anlegen",
    titel: "Notiz zu A-1187",
    unter: "Katharina & Paul Stadler",
    feld: "Notiz",
    platzhalter: "Was wurde besprochen?",
    speichern: "Speichern",
    hinweis: "Tippe etwas und schließe dann – es kommt eine Rückfrage.",
    gespeichert: "Gespeichert (nur in dieser Demo)",
  },
  peek: { spalten: { kunde: "Kunde", bereich: "Bereich", budget: "Budget", berater: "Berater", status: "Status" }, wunsch: "Wunsch", flaeche: "Fläche", zeitraum: "Zeitraum", quelle: "Quelle", betreut: "Betreut von", primaer: "Beratung vereinbaren", hinweis: "Zeile anklicken oder mit Tab wählen und Leertaste drücken." },
  lightbox: { recht: "Herunterladen erlaubt", rechtText: "Simuliert das Recht aus dem Freigabe-Umfang im Sortiment.", titel: "Haus am See · Bilder und Dokumente", pdf: "Aufmaß.pdf" },
};

const ANFRAGEN = [
  { nr: "A-1187", kunde: "Katharina & Paul Stadler", ort: "Lindau", bereich: "Küche", budget: "60–80 T€", berater: "Lena Moosbrugger", status: "Neu", material: "cognac", bild: "/entwurf/lounge/r-kueche-eiche.jpg", wunsch: "Offene Küche mit Kochinsel in Eiche, gerne mit Blick zum Garten. Einzug geplant Frühjahr 2027.", flaeche: "42 m²", zeitraum: "März 2027", quelle: "Newsletter Herbst" },
  { nr: "A-1186", kunde: "Yacht „Aurelia“", ort: "Hafen Lindau", bereich: "Yacht", budget: "auf Anfrage", berater: "Thomas Rhomberg", status: "Neu", material: "cognac", bild: "/entwurf/lounge/r-wohnen-sofa.jpg", wunsch: "Salon neu einrichten, Stoffe salzwasserfest.", flaeche: "28 m²", zeitraum: "Saison 2027", quelle: "Telefon" },
  { nr: "A-1183", kunde: "Dr. Miriam Köhler", ort: "Bregenz", bereich: "Wohnen", budget: "80–100 T€", berater: "Lena Moosbrugger", status: "Beratung", material: "eiche", bild: "/entwurf/lounge/r-hero-essraum.jpg", wunsch: "Wohn- und Essbereich als ein Raum, ruhige Materialien.", flaeche: "64 m²", zeitraum: "Sommer 2027", quelle: "Showroom" },
  { nr: "A-1179", kunde: "Hotel Seeblick", ort: "Lindau", bereich: "Objekt", budget: "400+ T€", berater: "Thomas Rhomberg", status: "Planung", material: "see", bild: "/entwurf/lounge/r-terrasse-hotel.jpg", wunsch: "Terrasse und Lobby, 40 Plätze außen.", flaeche: "220 m²", zeitraum: "Frühjahr 2027", quelle: "E-Mail" },
  { nr: "A-1176", kunde: "Familie Nägele", ort: "Hard", bereich: "Bad", budget: "30–40 T€", berater: "Michael Gasser", status: "Angebot", material: "eiche", bild: "/entwurf/lounge/r-bad.webp", wunsch: "Bad mit freistehender Wanne und Doppelwaschtisch.", flaeche: "14 m²", zeitraum: "Januar 2027", quelle: "Website" },
];

const BILDER = [
  { src: "/entwurf/lounge/r-terrasse-see.jpg", titel: "Terrasse zum See", quelle: "Platzhirsch · eigene Aufnahme", freigabe: { text: "Website freigegeben", ton: "ok" } },
  { src: "/entwurf/lounge/r-garten-lounge.jpg", titel: "Garten-Lounge", quelle: "Hersteller · Pressebild 2026", freigabe: { text: "Nur intern", ton: "warn", download: false } },
  { src: "/entwurf/lounge/r-essen-licht.jpg", titel: "Essplatz mit Leuchte", quelle: "Hersteller · Pressebild 2026", freigabe: { text: "Website freigegeben", ton: "ok" } },
  { src: "/entwurf/lounge/r-schlafen.webp", titel: "Schlafzimmer", freigabe: { text: "Nicht geprüft", ton: "aus" } },
];

// Kleines PDF (eine Seite „Aufmaß“), im Browser als Blob – kein Fremdabruf.
const PDF_TEXT = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 58>>stream\nBT /F1 24 Tf 72 760 Td (Aufmass Haus am See) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";

function Abschnitt({ id, titel, unter, className, children }) {
  return (
    <Kachel as="section" titel={titel} unter={unter} className={cx("min-w-0", className)} testid={`probe-${id}`} aria-labelledby={`${id}-titel`} titelId={`${id}-titel`}>
      <div className="mt-5 min-w-0">{children}</div>
    </Kachel>
  );
}

function Notiz({ text }) {
  return <p className="mt-3 text-[13px] leading-[18px] text-bo-text-faint">{text}</p>;
}

function PopoverProbe() {
  const [ansicht, setAnsicht] = useState("liste");
  const [gewaehlt, setGewaehlt] = useState(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menue
        label={TEXTE.menue.ausloeser}
        testid="demo-menue"
        ausloeser={(p) => (
          <Knopf {...p} icon="Ellipsis" iconRechts="ChevronDown" data-testid="demo-menue-knopf">
            {TEXTE.menue.ausloeser}
          </Knopf>
        )}
      >
        <MenuePunkt icon="Pencil" kuerzel="E" onWaehlen={() => setGewaehlt(TEXTE.menue.bearbeiten)}>
          {TEXTE.menue.bearbeiten}
        </MenuePunkt>
        <MenuePunkt icon="Layers" onWaehlen={() => setGewaehlt(TEXTE.menue.duplizieren)}>
          {TEXTE.menue.duplizieren}
        </MenuePunkt>
        <MenuePunkt icon="Share2" kuerzel="⌘L" onWaehlen={() => setGewaehlt(TEXTE.menue.teilen)}>
          {TEXTE.menue.teilen}
        </MenuePunkt>
        <MenuePunkt icon="Printer" kuerzel="⌘P" onWaehlen={() => setGewaehlt(TEXTE.menue.drucken)}>
          {TEXTE.menue.drucken}
        </MenuePunkt>
        <MenuePunkt icon="Download" deaktiviert grund={TEXTE.menue.exportGrund}>
          {TEXTE.menue.export}
        </MenuePunkt>
        <MenueTrenner />
        <MenueGruppe titel={TEXTE.menue.gruppe}>
          <MenuePunkt icon="Rows3" gewaehlt={ansicht === "liste"} onWaehlen={() => setAnsicht("liste")}>
            {TEXTE.menue.liste}
          </MenuePunkt>
          <MenuePunkt icon="Columns3" gewaehlt={ansicht === "karten"} onWaehlen={() => setAnsicht("karten")}>
            {TEXTE.menue.karten}
          </MenuePunkt>
        </MenueGruppe>
        <MenueTrenner />
        <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={() => setGewaehlt(TEXTE.menue.stornieren)}>
          {TEXTE.menue.stornieren}
        </MenuePunkt>
      </Menue>

      <Popover
        label={TEXTE.filter.titel}
        platzierung="unten-start"
        fokusfalle
        breite={300}
        testid="demo-popover"
        ausloeser={(p) => (
          <Knopf {...p} icon="SlidersHorizontal" data-testid="demo-popover-knopf">
            {TEXTE.filter.ausloeser}
          </Knopf>
        )}
      >
        {({ schliessen }) => (
          <div className="grid gap-1">
            <p className="px-1 pb-2 text-[15px] font-semibold leading-[22px]">{TEXTE.filter.titel}</p>
            <div className="rounded-bo-zeile bg-bo-surface shadow-(--bo-sh-card)">
              <Schalter label={TEXTE.filter.neu} standard />
              <Schalter label={TEXTE.filter.meine} />
              <Schalter label={TEXTE.filter.ruhend} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Knopf variant="ghost" onClick={() => schliessen()}>
                {TEXTE.filter.zuruecksetzen}
              </Knopf>
              <Knopf variant="primary" onClick={() => schliessen()}>
                {TEXTE.filter.anwenden}
              </Knopf>
            </div>
          </div>
        )}
      </Popover>

      <span className="text-[13px] text-bo-text-faint" aria-live="polite" data-testid="demo-menue-wahl">
        {gewaehlt ? `${gewaehlt} gewählt` : ""}
      </span>

      <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {ANFRAGEN.slice(0, 3).map((a) => (
          <Kontextmenue
            key={a.nr}
            label={`${a.kunde} – Aktionen`}
            testid={`demo-kontext-${a.nr}`}
            inhalt={
              <>
                <MenuePunkt icon="ArrowUpRight">{TEXTE.kontext.oeffnen}</MenuePunkt>
                <MenuePunkt icon="CalendarPlus">{TEXTE.kontext.termin}</MenuePunkt>
                <MenuePunkt icon="UserPlus">{TEXTE.kontext.zuweisen}</MenuePunkt>
                <MenueTrenner />
                <MenuePunkt icon="Hourglass">{TEXTE.kontext.ablegen}</MenuePunkt>
              </>
            }
          >
            <div tabIndex={0} className="flex min-w-0 select-none items-center gap-3 rounded-bo-karte bg-bo-surface-2 p-3 transition-colors duration-[120ms] hover:bg-bo-fill-2" data-testid={`demo-karte-${a.nr}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Musterbild aus public */}
              <img src={a.bild} alt="" className="size-12 shrink-0 rounded-[14px] object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold leading-[20px]">{a.kunde}</span>
                <span className="block truncate text-[13px] leading-[18px] text-bo-text-soft">
                  {a.ort} · {a.nr}
                </span>
              </span>
            </div>
          </Kontextmenue>
        ))}
      </div>
      <Notiz text={TEXTE.kontext.hinweis} />
    </div>
  );
}

function TooltipProbe() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2">
        <Tooltip text={TEXTE.tooltips.suche} platzierung="unten">
          <button type="button" className="bo-rund" aria-label="Suchen" data-testid="demo-tip-suche">
            <Icon name="Search" className="size-5" />
          </button>
        </Tooltip>
        <Tooltip text={TEXTE.tooltips.glocke} platzierung="unten">
          <button type="button" className="bo-rund" aria-label={TEXTE.tooltips.glocke}>
            <Icon name="Bell" className="size-5" />
          </button>
        </Tooltip>
        <Tooltip text={TEXTE.tooltips.plus} platzierung="unten">
          <button type="button" className="bo-rund" aria-label={TEXTE.tooltips.plus}>
            <Icon name="Plus" className="size-5" />
          </button>
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="bo-zahl-gross tabular-nums">2,4 h</span>
        <Tooltip text={TEXTE.tooltips.kennzahl}>
          <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] text-bo-text-soft hover:bg-bo-fill" data-testid="demo-tip-kennzahl">
            {TEXTE.tooltips.kennzahlTitel}
            <Icon name="Info" className="size-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function DialogProbe() {
  const [offen, setOffen] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState("");
  const zu = () => setOffen(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Knopf icon="CalendarPlus" onClick={() => setOffen("normal")} data-testid="demo-dialog-normal">
        {TEXTE.dialog.normal}
      </Knopf>
      <Knopf variant="danger" icon="Trash2" onClick={() => setOffen("gefahr")} data-testid="demo-dialog-gefahr">
        {TEXTE.dialog.gefahr}
      </Knopf>
      <Knopf icon="Sparkles" onClick={() => setOffen("gross")} data-testid="demo-dialog-gross">
        {TEXTE.dialog.gross}
      </Knopf>
      <span className="text-[13px] text-bo-text-faint" aria-live="polite">
        {meldung}
      </span>

      <Bestaetigen offen={offen === "normal"} titel={TEXTE.dialog.normalTitel} text={TEXTE.dialog.normalText} bestaetigen={TEXTE.dialog.normalJa} symbol="CalendarPlus" onAbbrechen={zu} onBestaetigen={() => (zu(), setMeldung(TEXTE.dialog.erledigt))} testid="demo-bestaetigen-normal" />
      <Bestaetigen
        offen={offen === "gefahr"}
        titel={TEXTE.dialog.gefahrTitel}
        text={TEXTE.dialog.gefahrText}
        fakten={TEXTE.dialog.fakten}
        bestaetigen={TEXTE.dialog.gefahrJa}
        gefaehrlich
        laeuft={laeuft}
        onAbbrechen={zu}
        onBestaetigen={() => {
          setLaeuft(true);
          setTimeout(() => {
            setLaeuft(false);
            zu();
            setMeldung(TEXTE.dialog.erledigt);
          }, 1400);
        }}
        testid="demo-bestaetigen-gefahr"
      />
      <Dialog
        offen={offen === "gross"}
        onSchliessen={zu}
        groesse="md"
        titel={TEXTE.dialog.grossTitel}
        text={TEXTE.dialog.grossText}
        testid="demo-dialog-md"
        fuss={
          <Knopf variant="primary" size="l" onClick={zu}>
            {TEXTE.dialog.verstanden}
          </Knopf>
        }
      >
        <ul className="grid gap-2 pt-4">
          {TEXTE.dialog.grossInhalt.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-bo-zeile bg-bo-surface p-3 text-[15px] leading-[22px] shadow-(--bo-sh-card)">
              <span className="mt-0.5 inline-grid size-6 shrink-0 place-items-center rounded-full bg-bo-salbei-soft text-bo-salbei-text">
                <Icon name="Check" className="size-3.5" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}

function Fakt({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] leading-[18px] text-bo-text-soft">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] leading-[22px]">{children}</dd>
    </div>
  );
}

function SheetProbe() {
  const peek = useListenPeek({ anzahl: ANFRAGEN.length, panel: "vorschau" });
  const [notizOffen, setNotizOffen] = usePanel("notiz");
  const [notiz, setNotiz] = useState("");
  const [meldung, setMeldung] = useState("");
  const S = TEXTE.peek.spalten;
  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Knopf icon="Pencil" onClick={() => setNotizOffen(true)} data-testid="demo-sheet-knopf">
          {TEXTE.sheet.oeffnen}
        </Knopf>
        <span className="text-[13px] text-bo-text-faint" aria-live="polite">
          {meldung}
        </span>
      </div>
      <div className="bo-scroll-x -mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-[15px] leading-[22px]" data-testid="demo-peek-liste">
          <thead className="text-left text-[13px] leading-[18px] text-bo-text-soft">
            <tr>
              <th scope="col" className="px-3 pb-2 font-medium">{S.kunde}</th>
              <th scope="col" className="px-3 pb-2 font-medium">{S.bereich}</th>
              <th scope="col" className="px-3 pb-2 font-medium">{S.budget}</th>
              <th scope="col" className="px-3 pb-2 font-medium">{S.berater}</th>
              <th scope="col" className="px-3 pb-2 font-medium">{S.status}</th>
            </tr>
          </thead>
          <tbody {...peek.listenProps}>
            {ANFRAGEN.map((a, i) => (
              <tr key={a.nr} {...peek.zeilenProps(i)} onClick={() => peek.oeffne(i)} className="group cursor-pointer outline-none focus-visible:[&>td]:bg-bo-fill [&[data-peek-aktiv=true]>td]:bg-bo-selected" data-testid={`demo-zeile-${a.nr}`}>
                <td className="rounded-l-bo-zeile border-t border-bo-line px-3 py-3 transition-colors duration-[120ms] group-hover:bg-bo-fill">
                  <span className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Musterbild aus public */}
                    <img src={a.bild} alt="" className="size-12 shrink-0 rounded-[14px] object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{a.kunde}</span>
                      <span className="block text-[13px] leading-[18px] text-bo-text-soft">
                        {a.ort} · {a.nr}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="border-t border-bo-line px-3 py-3 transition-colors duration-[120ms] group-hover:bg-bo-fill">{a.bereich}</td>
                <td className="border-t border-bo-line px-3 py-3 tabular-nums transition-colors duration-[120ms] group-hover:bg-bo-fill">{a.budget}</td>
                <td className="border-t border-bo-line px-3 py-3 transition-colors duration-[120ms] group-hover:bg-bo-fill">
                  <Avatar name={a.berater} groesse={28} />
                </td>
                <td className="rounded-r-bo-zeile border-t border-bo-line px-3 py-3 transition-colors duration-[120ms] group-hover:bg-bo-fill">
                  <Pille material={a.material}>{a.status}</Pille>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notiz text={TEXTE.peek.hinweis} />

      <Peek
        peek={peek}
        eintraege={ANFRAGEN}
        titel={(a) => a.kunde}
        unter={(a) => `${a.nr} · ${a.ort}`}
        vollseite={(a) => `/crm/anfragen/${a.nr}`}
        fuss={() => (
          <Knopf variant="primary" size="l" icon="CalendarPlus" className="flex-1">
            {TEXTE.peek.primaer}
          </Knopf>
        )}
      >
        {(a) => (
          <div className="grid gap-5">
            <div className="relative overflow-hidden rounded-bo-karte">
              {/* eslint-disable-next-line @next/next/no-img-element -- Musterbild aus public */}
              <img src={a.bild} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className="bo-glas inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold">{a.bereich}</span>
                <span className="bo-glas inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold tabular-nums">{a.budget}</span>
              </div>
            </div>
            <div className="rounded-bo-karte bg-bo-surface p-4 shadow-(--bo-sh-card)">
              <p className="text-[13px] leading-[18px] text-bo-text-soft">{TEXTE.peek.wunsch}</p>
              <p className="mt-1 text-[15px] leading-[22px]">{a.wunsch}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-1">
              <Fakt label={TEXTE.peek.flaeche}>{a.flaeche}</Fakt>
              <Fakt label={TEXTE.peek.zeitraum}>{a.zeitraum}</Fakt>
              <Fakt label={TEXTE.peek.quelle}>{a.quelle}</Fakt>
              <Fakt label={TEXTE.peek.betreut}>
                <span className="inline-flex items-center gap-2">
                  <Avatar name={a.berater} groesse={24} dekorativ />
                  {a.berater.split(" ")[0]}
                </span>
              </Fakt>
            </dl>
          </div>
        )}
      </Peek>

      <Sheet
        offen={notizOffen}
        onSchliessen={() => {
          setNotizOffen(false);
          setNotiz("");
        }}
        titel={TEXTE.sheet.titel}
        unter={TEXTE.sheet.unter}
        ungespeichert={notiz.trim().length > 0}
        vollseite="/crm/anfragen/A-1187"
        testid="demo-sheet"
        fuss={
          <Knopf
            variant="primary"
            size="l"
            disabled={!notiz.trim()}
            onClick={() => {
              setNotizOffen(false);
              setNotiz("");
              setMeldung(TEXTE.sheet.gespeichert);
            }}
          >
            {TEXTE.sheet.speichern}
          </Knopf>
        }
      >
        <label htmlFor="demo-notiz" className="block text-[13px] font-medium leading-[18px] text-bo-text-soft">
          {TEXTE.sheet.feld}
        </label>
        <textarea id="demo-notiz" rows={8} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder={TEXTE.sheet.platzhalter} className="bo-input mt-2 w-full resize-y rounded-bo-zeile bg-bo-surface p-4 text-[15px] leading-[22px] shadow-(--bo-sh-card) outline-none focus-visible:shadow-(--bo-sh-focus)" data-testid="demo-notiz" />
        <Notiz text={TEXTE.sheet.hinweis} />
      </Sheet>
    </div>
  );
}

function LightboxProbe() {
  const [offen, setOffen] = useState(false);
  const [start, setStart] = useState(0);
  const [recht, setRecht] = useState(true);
  const [pdf, setPdf] = useState(null);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([PDF_TEXT], { type: "application/pdf" }));
    setPdf(url); // eslint-disable-line react-hooks/set-state-in-effect
    return () => URL.revokeObjectURL(url);
  }, []);
  const medien = pdf ? [...BILDER, { src: pdf, typ: "pdf", titel: TEXTE.lightbox.pdf, quelle: "Aufmaß vom 21.10.2026", freigabe: { text: "Intern", ton: "aus" } }] : BILDER;
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {medien.map((m, i) => (
          <button
            key={m.src}
            type="button"
            className="bo-druck group relative aspect-[4/3] overflow-hidden rounded-bo-zeile bg-bo-surface-2"
            onClick={() => {
              setStart(i);
              setOffen(true);
            }}
            aria-label={`${m.titel} öffnen`}
            data-testid={`demo-bild-${i}`}
          >
            {m.typ === "pdf" ? (
              <span className="grid size-full place-items-center gap-1 text-bo-text-soft">
                <Icon name="FileText" className="size-8" />
                <span className="text-[13px]">{m.titel}</span>
              </span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- Musterbild aus public */
              <img src={m.src} alt="" className="size-full object-cover transition-transform duration-[620ms] ease-feder group-hover:scale-[1.03]" />
            )}
          </button>
        ))}
      </div>
      <div className="max-w-md rounded-bo-zeile bg-bo-surface-2">
        <Schalter label={TEXTE.lightbox.recht} beschreibung={TEXTE.lightbox.rechtText} an={recht} onWechsel={setRecht} />
      </div>
      <Lightbox offen={offen} onSchliessen={() => setOffen(false)} medien={medien} start={start} titel={TEXTE.lightbox.titel} herunterladen={recht} />
    </div>
  );
}

export default function OverlayDemo() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-overlay">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <Abschnitt id="popover" {...TEXTE.abschnitte.popover} className="lg:col-span-7">
          <PopoverProbe />
        </Abschnitt>
        <div className="grid min-w-0 gap-6 lg:col-span-5">
          <Abschnitt id="tooltip" {...TEXTE.abschnitte.tooltip}>
            <TooltipProbe />
          </Abschnitt>
          <Abschnitt id="dialog" {...TEXTE.abschnitte.dialog}>
            <DialogProbe />
          </Abschnitt>
        </div>
        <Abschnitt id="sheet" {...TEXTE.abschnitte.sheet} className="lg:col-span-12">
          <SheetProbe />
        </Abschnitt>
        <Abschnitt id="lightbox" {...TEXTE.abschnitte.lightbox} className="lg:col-span-12">
          <LightboxProbe />
        </Abschnitt>
      </div>
    </div>
  );
}
