// src/lib/agent/copy.js – deutsche Texte der Seite /de/ki-assistenten und der Bestätigung.
// Stimme laut Design-Bibel: Sie-Form, kurze Sätze, Fakten, kein Ausrufezeichen,
// keine Superlative, keine Preise, keine Händler-Aussagen.
// Rein: Server, Client und node --test.
//
// r1-recht-inhalt P1-1: Die Seite ist indexierbar. Sie sagt nur, was der
// Server wirklich tut: Ohne Terminwunsch-Modus (Produktion ohne Live-Freigabe
// = „off“, config.js) stehen Kopf, Werkzeugliste, Terminkapitel, Regeln und
// FAQ ohne Terminwunsch über Assistenten. Kein „Testbetrieb“-Hinweis.
import { MCP_URL, RATE } from "./config.js";
import { APPOINTMENT_OFFERED, TOOL_DEFS } from "./tools.js";

const OFFERED = APPOINTMENT_OFFERED;
const COUNT_WORDS = ["Null", "Ein", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn"];
const toolCount = COUNT_WORDS[TOOL_DEFS.length] || String(TOOL_DEFS.length);

export const META = {
  title: "Platzhirsch für KI-Assistenten · MCP-Server und WebMCP",
  description: OFFERED
    ? "Claude, ChatGPT und Browser-Agenten fragen Katalog, Showroom in Lochau, Arbeitsweise und Ezarri-Glasmosaik bei uns ab und übergeben Terminwünsche zur Bestätigung."
    : "Claude, ChatGPT und Browser-Agenten fragen Katalog, Showroom mit Café in Lochau, Arbeitsweise und Ezarri-Glasmosaik direkt ab – mit Maßen und Link.",
  ogTitle: "Platzhirsch für KI-Assistenten",
};

export const CRUMBS = [
  { label: "Home", href: "/" },
  { label: "Das Haus", href: "/ueber-uns/platzhirsch" },
  { label: "KI-Assistenten" },
];

export const HERO = {
  overline: "Für KI-Assistenten",
  title: "Fragen Sie Ihren Assistenten. Er fragt bei uns nach.",
  lead: OFFERED
    ? "Claude, ChatGPT und Browser-Agenten fragen unseren Katalog, den Showroom mit Café in Lochau und unsere Arbeitsweise direkt bei uns ab, mit Maßen und Link. Einen Termin wünschen sie für Sie an, gebucht wird nichts ohne Ihre Bestätigung."
    : "Claude, ChatGPT und Browser-Agenten fragen unseren Katalog, den Showroom mit Café in Lochau und unsere Arbeitsweise direkt bei uns ab, mit Maßen und Link. Einen Termin fragen Sie über unsere Terminanfrage an.",
  primary: "Adresse kopieren",
  secondary: { label: "Lieber direkt: Termin anfragen", href: "/beratung?quelle=agent" },
};

export const ENDPOINT = {
  overline: "Die Adresse",
  title: "Eine Adresse für alle Assistenten.",
  url: MCP_URL,
  label: "MCP-Server (Streamable HTTP)",
  facts: ["ohne Anmeldung", OFFERED ? "nur Lesen, außer dem Terminwunsch" : "nur Lesen", "Deutsch, Englisch, Französisch, Italienisch"],
  copied: "Adresse kopiert",
  copyFailed: "Kopieren nicht möglich. Bitte die Adresse markieren und kopieren.",
};

export const CONNECT = {
  overline: "Verbinden",
  title: "So kommt Platzhirsch in Ihren Assistenten.",
  steps: [
    {
      name: "Assistent mit eigenen Verbindungen",
      text: "In Assistenten, die eigene MCP-Server erlauben, fügen Sie einen Remote-Server hinzu und tragen die Adresse ein. Eine Anmeldung ist nicht nötig.",
    },
    {
      name: "Claude Code",
      text: "Im Terminal genügt eine Zeile:",
      code: `claude mcp add --transport http platzhirsch ${MCP_URL}`,
    },
    {
      name: "Konfigurationsdatei",
      text: "Für Clients mit einer mcp.json, etwa Visual Studio Code:",
      code: JSON.stringify({ servers: { platzhirsch: { type: "http", url: MCP_URL } } }, null, 2),
    },
    {
      name: "Browser-Agenten",
      text: "Unterstützt Ihr Browser WebMCP, findet ein Agent die Lese-Werkzeuge direkt auf unseren Seiten. Sie müssen nichts einrichten.",
    },
  ],
  note: "Die Server-Beschreibung für automatische Suche liegt unter /.well-known/mcp.json.",
};

export const TOOLS = {
  overline: "Was Ihr Assistent fragen kann",
  title: `${toolCount} Werkzeuge, eine Quelle.`,
  lead: "Die Antworten kommen aus demselben Katalog wie diese Website. Jede Antwort enthält den Link zur passenden Seite. Preise nennen wir online nicht, sie stehen immer auf Anfrage.",
  readOnly: "nur Lesen",
  write: "mit Ihrer Bestätigung",
  example: "Zum Beispiel",
};

export const DEMO = {
  overline: "Ausprobieren",
  title: "So sieht Ihr Assistent uns.",
  lead: "Wählen Sie eine Frage. Die Seite ruft dasselbe Werkzeug auf wie ein Assistent und zeigt die Antwort, die er bekommt.",
  prompts: [
    { label: "Wann hat der Showroom offen?", tool: "showroom_info", args: {} },
    { label: "Sofas zum Probesitzen", tool: "products_in_category", args: { category_key: "sofas-couches", limit: 3 } },
    { label: "Was gibt es von Flos?", tool: "search_products", args: { query: "Flos", limit: 3 } },
    { label: "Wie plant Platzhirsch?", tool: "arbeitsweise", args: {} },
    { label: "Glasmosaik für den Pool", tool: "ezarri_collections", args: { linie: "Premium" } },
  ],
  request: "Anfrage des Assistenten",
  response: "Antwort von Platzhirsch",
  readable: "Lesbar",
  raw: "JSON",
  loading: "Frage wird gestellt …",
  error: "Die Antwort kam nicht an. Bitte versuchen Sie es noch einmal.",
  rateLimited: "Zu viele Fragen in kurzer Zeit. Bitte warten Sie eine Minute.",
  price: "Preis",
  noDimensions: "Maße auf der Produktseite oder im Gespräch",
  open: "Seite öffnen",
};

export const USP = {
  overline: "Was kein Assistent ersetzt",
  title: "Ihr Raum beginnt auf Papier.",
  text:
    "Ein Assistent findet ein Sofa und unsere Öffnungszeiten. Ihren Raum muss man sehen. Darum kommen wir zu Ihnen, und wenn Ihr Projekt es braucht, bleiben wir ein, zwei Tage. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Raummodell, erst dann folgen 3D-Planung und Rendering.",
  link: { label: "Unsere Arbeitsweise in sieben Schritten", href: "/arbeitsweise" },
};

const TERMIN_OFFERED = {
  overline: "Terminwunsch",
  title: "Ihr Assistent fragt an. Sie entscheiden.",
  steps: [
    { name: "Sie bitten", text: "Sie sagen Ihrem Assistenten, dass Sie eine Beratung möchten, und stimmen der Weitergabe von Name, E-Mail und Telefon zu." },
    { name: "Er übergibt", text: "Der Assistent übergibt Thema, Ort und bis zu drei Wunschzeiten. Er erhält eine Referenz, sonst nichts." },
    { name: "Sie bestätigen", text: "Sie bekommen eine E-Mail mit Ihren Angaben und bestätigen mit einem Klick. Ohne Bestätigung wird nichts gespeichert oder weitergegeben." },
    { name: "Wir melden uns", text: "Erst jetzt sieht unser Team den Wunsch und meldet sich mit einem Terminvorschlag, im Showroom oder bei Ihnen vor Ort." },
  ],
  nothingBooked: "Gebucht oder bestellt wird über einen Assistenten nichts.",
  status: {
    // dryrun gibt es nur in Entwicklung und Test (config.js), nie auf der Website.
    dryrun: "Entwicklungsumgebung: Terminwünsche werden geprüft und nicht an das Team übermittelt.",
    off: "Ihr Assistent übergibt keine Personendaten an uns. Die Terminanfrage senden Sie selbst.",
    live: "Sie bestätigen jeden Terminwunsch selbst per E-Mail.",
  },
};

// Ohne Terminwunsch über Assistenten (Produktion, Modus „off“): der Weg, den es gibt.
const TERMIN_DIRECT = {
  overline: "Termin",
  title: "Ihr Assistent zeigt den Weg. Den Termin fragen Sie an.",
  steps: [
    { name: "Sie fragen", text: "Sie sagen Ihrem Assistenten, dass Sie eine Beratung möchten. Er gibt Ihnen den Link zu unserer Terminanfrage." },
    { name: "Sie wählen", text: "In der Terminanfrage nennen Sie Thema, Ort und Wunschzeiten, im Showroom in Lochau oder bei Ihnen vor Ort." },
    { name: "Wir melden uns", text: "Unser Team meldet sich mit einem Terminvorschlag. Am Telefon geht es auch: +43 5574 46255." },
  ],
  nothingBooked: TERMIN_OFFERED.nothingBooked,
  status: TERMIN_OFFERED.status,
};

export const TERMIN = OFFERED ? TERMIN_OFFERED : TERMIN_DIRECT;

export const RULES = {
  overline: "Spielregeln",
  title: "Was wir zusagen und was nicht.",
  items: [
    ["Daten", "Lesende Anfragen enthalten keine Personendaten. Ihren Inhalt speichern wir nicht, Cookies setzt der Server keine. Zum Schutz vor Missbrauch zählen wir Anfragen je IP-Adresse für höchstens einen Tag."],
    ["Antworten", "Die Werkzeuge liefern Fakten aus unserem Katalog. Formuliert wird die Antwort von Ihrem Assistenten, nicht von uns. Maßgeblich sind die Angaben auf unserer Website und im Gespräch."],
    ["Preise", "Preise, Verfügbarkeit und Lieferzeiten nennen wir nur im Gespräch. In jeder Antwort steht: auf Anfrage."],
    ["Bilder", "Herstellerbilder geben wir nicht weiter. Der Assistent verlinkt die Produktseite."],
    ["Grenzen", OFFERED
      ? `Je IP-Adresse sind ${RATE.burst.max} Anfragen pro Minute und ${RATE.appointmentHour.max} Terminwünsche pro Stunde möglich.`
      : `Je IP-Adresse sind ${RATE.burst.max} Anfragen pro Minute möglich. Aufrufe aus fremden Webseiten im Browser nehmen wir nicht an.`],
  ],
  privacy: { label: "Datenschutzerklärung", href: "/datenschutz" },
};

export const FAQ = [
  ["Was ist MCP?", "Das Model Context Protocol ist ein offener Standard, über den KI-Assistenten Werkzeuge und Daten von außen nutzen. Unser Server spricht die Version 2025-11-25 und ältere Versionen ab 2025-03-26."],
  ["Was ist WebMCP?", "WebMCP ist ein Entwurf, mit dem eine Website Werkzeuge direkt im Browser anbietet. Browser-Agenten nutzen sie, ohne die Seite Schritt für Schritt zu bedienen. Wir melden nur die Lese-Werkzeuge an und nur dann, wenn Ihr Browser WebMCP kennt."],
  ["Kostet das etwas?", "Nein. Der Zugang ist frei und ohne Anmeldung."],
  ["Kann ein Assistent bei Ihnen kaufen?", OFFERED
    ? "Nein. Er kann Produkte finden und einen Terminwunsch übergeben, den Sie per E-Mail bestätigen. Beraten, planen und anbieten tun wir im Gespräch."
    : "Nein. Er kann Produkte finden und Ihnen den Link zur Terminanfrage geben. Beraten, planen und anbieten tun wir im Gespräch."],
  ["Warum steht bei Maßen manchmal nichts?", "Wir geben Maße nur weiter, wenn der Hersteller sie eindeutig angibt. Fehlt die Angabe, klären wir sie im Gespräch."],
];

export const CLOSING = {
  title: "Oder Sie kommen einfach vorbei.",
  text: "Im Showroom in Lochau, bei einem Kaffee im Café.",
  cta: { label: "Termin anfragen", href: "/beratung?quelle=agent" },
};

export const CONFIRM = {
  metaTitle: "Terminwunsch bestätigen · Platzhirsch",
  overline: "Terminwunsch",
  title: "Bitte prüfen und bestätigen Sie Ihren Terminwunsch.",
  lead: "Ihr KI-Assistent hat diesen Wunsch in Ihrem Namen übergeben. Erst wenn Sie bestätigen, sieht unser Team ihn.",
  loading: "Ihre Angaben werden geladen …",
  fields: { name: "Name", email: "E-Mail", phone: "Telefon", topic: "Thema", project: "Vorhaben", property: "Objekt", place: "Ort", times: "Wunschzeiten", message: "Nachricht" },
  none: "keine angegeben",
  reference: "Referenz",
  confirm: "Terminwunsch bestätigen",
  sending: "Wird bestätigt …",
  ignore: "Waren Sie das nicht? Dann schließen Sie diese Seite. Ohne Bestätigung wird nichts gespeichert oder weitergegeben.",
  dryrun: "Probelauf: Diese Bestätigung wird geprüft, aber nicht an unser Team gesendet.",
  done: "Danke. Ihr Terminwunsch ist bei uns angekommen. Wir melden uns mit einem Terminvorschlag.",
  doneDry: "Probelauf abgeschlossen. Im Livebetrieb wäre Ihr Wunsch jetzt bei unserem Team.",
  already: "Dieser Terminwunsch ist bereits bestätigt.",
  invalid: "Dieser Link ist ungültig oder abgelaufen. Bitten Sie Ihren Assistenten, den Terminwunsch neu zu stellen, oder fragen Sie direkt an.",
  missing: "Es fehlt der Bestätigungslink. Bitte öffnen Sie den Link aus der E-Mail vollständig.",
  error: "Die Bestätigung hat nicht geklappt. Bitte versuchen Sie es in ein paar Minuten noch einmal.",
  direct: { label: "Direkt Termin anfragen", href: "/beratung?quelle=agent" },
};
