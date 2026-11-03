// src/lib/legal/barrierefreiheit.js – Daten der Seite /<locale>/barrierefreiheit
// (Rat 9,5, Maßnahme B13; QA Recht −0,2, § 14 BaFG; Design-Bibel § 14).
//
// Regel: Die Seite behauptet nur, was geprüft ist (UWG). PRUEFUNG beschreibt
// die letzte automatische Prüfung so, wie sie gelaufen ist (Werkzeug, Regeln,
// Seiten, Geräte, Ergebnis); Beleg in BELEG. Eine neue Prüfung trägt neue
// Werte ein, nichts wird hochgerechnet. Eine Prüfung von Hand mit Tastatur oder
// Screenreader ist NICHT behauptet, solange keine dokumentiert ist.
// Freiwillige Information: ob die Pflicht nach dem BaFG greift
// (Kleinstunternehmer-Ausnahme), klären Inhaber/Steuerberater; den Wortlaut
// prüft die Kanzlei (Marktresearch/recht/07-dse-ergaenzungen-rat95.md).
// Rein, ohne "@/": tests/unit/rat95-recht-barrierefreiheit.test.mjs.

export const STAND = "2026-11-02";

// Zweite Prüfung (QM-Endabnahme 02.11.2026, Platzhirsch-Status/berichte/
// BERICHT-QM-2026-11-02.md): Bildschirmgrößen, Zoom 200 % und Textvergrößerung,
// automatisiert mit Playwright in Chromium (auch als Ersatz für iPhone/iPad)
// und Firefox. Safari/WebKit war nicht prüfbar (Windows-Anwendungssteuerung
// blockiert den WebKit-Prozess) – das steht ehrlich in EINSCHRAENKUNGEN.
export const PRUEFUNG_QM = Object.freeze({
  datum: "2026-11-02",
  was: "Darstellung und Bedienbarkeit auf zehn Bildschirmgrößen vom kleinen Smartphone bis zum großen Monitor, dazu Browser-Zoom 200 % und vergrößerte Schrift",
  browser: "Chromium-basierten Browsern und Firefox",
  nichtGeprueft: "Safari (iPhone, iPad, Mac)",
  beleg: "Platzhirsch-Status/berichte/BERICHT-QM-2026-11-02.md, Abschnitte 1, 2 und 6",
});

export const PRUEFUNG = Object.freeze({
  datum: "2026-10-30",
  werkzeug: "axe-core",
  version: "4.13.0",
  regeln: "WCAG 2.0, 2.1 und 2.2, Stufen A und AA",
  geraete: "Desktop (1440 Pixel breit) und Smartphone (Pixel 7)",
  seiten: Object.freeze([
    "/de",
    "/de/produkte",
    "/de/kontakt",
    "/de/beratung",
    "/de/ueber-uns/platzhirsch",
    "/de/ueber-uns/team",
    "/de/ueber-uns/presse",
    "/de/ueber-uns/partner",
    "/de/ueber-uns/karriere",
    "/de/datenschutz",
    "/en/datenschutz",
    "/de/impressum",
    "/de/barrierefreiheit",
    "/de/ratgeber",
  ]),
  // Ergebnis der Prüfung: Zahl der gemeldeten Verstöße über alle Seiten und Geräte.
  verstoesse: 0,
  beleg: "qa-screenshots/umsetzung95/t5/axe.json",
});

// Was nachweislich auf der Website umgesetzt ist (Code und Tests im Repo).
export const UMGESETZT = Object.freeze([
  "Die Systemeinstellung „Bewegung reduzieren“ wird beachtet: Animationen laufen dann nicht (automatischer Test tests/e2e/a11y.spec.js).",
  "Der Schalter „Ruhige Ansicht“ im Fuß jeder Seite schaltet Bewegung ab, vergrößert die Schrift und verstärkt die Kontraste.",
  "Ohne Einwilligung lädt die Website keine Karten- und Analysedienste; die Seite funktioniert vollständig ohne sie.",
]);

// Bekannte Einschränkungen (ehrlich, ohne Frist, die niemand zugesagt hat).
// Stand 02.11.2026: Zoom-200-%-Reste „mittel“ und fehlende Safari-Prüfung aus
// dem QM-Bericht (Safari: Inhaber-Entscheidung Nr. 1 vom 02.11., Prüfung offen).
export const EINSCHRAENKUNGEN = Object.freeze([
  "Bei 200 % Vergrößerung im Browser brechen an einzelnen Stellen noch Wörter ungünstig um oder Inhalte werden am Rand abgeschnitten, vor allem in Tabellen, Kachelrastern und im Onlineshop. Die Inhalte bleiben erreichbar; wir arbeiten diese Stellen ab.",
  "Mit Safari auf iPhone, iPad und Mac haben wir die Website noch nicht selbst geprüft, weil unsere Prüfumgebung diesen Browser derzeit nicht ausführen kann. Geprüft sind Chromium-basierte Browser (auch in den Bildschirmgrößen von iPhone und iPad) und Firefox. Wenn Ihnen in Safari etwas auffällt, melden Sie es uns bitte.",
  "Die 3D- und AR-Ansicht, der Sofaplaner und der Küchenplaner arbeiten mit Grafik. Nicht alle Funktionen dort sind mit Screenreader nutzbar. Wir planen gerne im Gespräch mit Ihnen, im Studio, am Telefon oder per E-Mail.",
  "Die eingebettete Karte von Google Maps stammt von Google. Adresse und Routenlink stehen ohne Karte direkt auf der Seite.",
  "Datenblätter und Kataloge der Hersteller (PDF) stammen von den Herstellern und sind nicht immer barrierefrei. Auf Wunsch senden wir die Angaben als Text.",
  "Impressum und Datenschutzerklärung gibt es vollständig nur auf Deutsch; die Datenschutzerklärung hat eine Kurzfassung auf Englisch, Französisch und Italienisch.",
]);

export const MARKTUEBERWACHUNG = Object.freeze({
  name: "Sozialministeriumservice",
  url: "https://www.sozialministeriumservice.gv.at",
});
