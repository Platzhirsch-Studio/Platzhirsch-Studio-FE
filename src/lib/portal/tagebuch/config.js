// src/lib/portal/tagebuch/config.js — Projekt-Tagebuch im Kundenportal
// (Inhaber-Entscheidung Nr. 13, 29.10.2026). Reines Modul ohne Server-Abhängigkeit:
// Seiten, Client-Komponenten, Route Handler und Unit-Tests lesen dieselben Werte.
//
// Ablauf: Studio-Team und Kunde laden Fotos je Phase (Skizze, Modell, Rendering,
// Lieferung, Montage, Vorher, Nachher). Alles ist privat (nur Kunde des Projekts
// und Team). „Als Referenz freigeben“: Der Kunde wählt Fotos, sieht die Vorschau
// der öffentlichen Projektseite, willigt ein (Version und Zeitpunkt gespeichert),
// das Studio prüft und veröffentlicht. Widerruf jederzeit.

/** Phasen der Zeitleiste in dieser Reihenfolge (Kern-USP Nr. 8: Hand → Modell → 3D → Umsetzung). */
export const PHASEN = Object.freeze([
  { key: "skizze", label: "Handzeichnung", nurTeam: true, echtPflicht: true, text: "Harald Menghin zeichnet Grundriss, Perspektiven und Stimmungen von Hand." },
  { key: "modell", label: "Modell", nurTeam: true, echtPflicht: true, text: "Ein Raummodell im Maßstab, zum Anfassen und gemeinsamen Umstellen." },
  { key: "rendering", label: "Rendering", nurTeam: true, echtPflicht: false, text: "Die 3D-Planung mit exakten Maßen, Produkten und Materialien." },
  { key: "lieferung", label: "Lieferung", nurTeam: false, echtPflicht: false, text: "Die Stücke kommen an." },
  { key: "montage", label: "Montage", nurTeam: false, echtPflicht: false, text: "Aufbau und Feinschliff vor Ort." },
  { key: "vorher", label: "Vorher", nurTeam: false, echtPflicht: false, text: "Der Raum vor dem Projekt." },
  { key: "nachher", label: "Nachher", nurTeam: false, echtPflicht: false, text: "Der Raum, wie Sie darin leben." },
]);
export const PHASEN_KEYS = PHASEN.map((p) => p.key);
export const phase = (key) => PHASEN.find((p) => p.key === key) || null;

/**
 * Phasen, deren Fotos öffentlich als Referenz gezeigt werden dürfen.
 * Handzeichnung und Modell sind AUSGENOMMEN (QA Recht P2, 29.10.2026): ein
 * handgezeichneter Grundriss zeigt öffentlich den Grundriss einer
 * Privatwohnung, und der Einwilligungstext nennt das nicht. Erst wenn Frage T3
 * (service-inhaber-fragen.md) entschieden und der Einwilligungstext ergänzt
 * ist, "skizze"/"modell" wieder aufnehmen (neue EINWILLIGUNG.version).
 */
export const REFERENZ_PHASEN = Object.freeze(["rendering", "lieferung", "montage", "vorher", "nachher"]);
export const referenzTauglich = (foto) => Boolean(foto) && REFERENZ_PHASEN.includes(foto.phase);

export const LIMITS = Object.freeze({
  maxBytes: 25 * 1024 * 1024,
  maxFotosJeProjekt: 120,
  maxFotosJeFreigabe: 12,
  minFotosJeFreigabe: 1,
  titelMax: 120,
  altMax: 200,
});

/** Erzeugte Bildgrößen (Breite in px, längste Kante ≤ 2400). AVIF + WebP je Größe. */
export const BILD_BREITEN = Object.freeze([640, 1280, 1920]);
export const BILD_FORMATE = Object.freeze(["avif", "webp"]);

/** Wie der Kunde auf der öffentlichen Seite genannt wird. Nie mit Adresse. */
export const ANZEIGE = Object.freeze({
  anonym: { label: "Anonym", text: "Ohne Namen. Als Ort steht nur „am Bodensee“." },
  vorname_ort: { label: "Vorname und Ort", text: "Ihr Vorname und Ihre Gemeinde oder Region, ohne Straße und Hausnummer." },
});
export const ANONYM_ORT = "am Bodensee";

/**
 * Einwilligungstext (Art. 6 Abs. 1 lit. a, Art. 7 DSGVO; § 78 UrhG Bildnisschutz).
 * VORSCHLAG für die Kanzlei, NICHT freigegeben (siehe
 * Marktresearch/digital/features/service-recht-vorschlag.md). Solange status
 * nicht "freigegeben" ist, ist die Freigabe in Produktion abgeschaltet
 * (referenzFreigabeAktiv), in Entwicklung/Vorschau mit Hinweis „Entwurf“ nutzbar.
 * Jede Textänderung bekommt eine neue Version; gespeichert wird die Version, die
 * der Kunde gesehen hat, plus Zeitpunkt.
 */
export const EINWILLIGUNG = Object.freeze({
  version: "tagebuch-referenz-2026-10-29-v2",
  status: "entwurf", // → "freigegeben" erst nach Kanzlei-OK
  absaetze: Object.freeze([
    "Ich bin damit einverstanden, dass die Platzhirsch Home Living die ausgewählten Fotos meines Projekts auf ihrer Website unter /projekte als Referenzprojekt zeigt, zusammen mit einer kurzen Projektbeschreibung, die das Studio verfasst.",
    "Gezeigt werden nur die Fotos, die ich ausgewählt habe, und die Nennung, die ich gewählt habe. Eine Adresse wird nie veröffentlicht. Metadaten wie GPS-Koordinaten sind aus den Bildern entfernt.",
    "Ich habe darauf geachtet, dass auf den Fotos keine Personen, Hausnummern, Autokennzeichen oder Dokumente erkennbar sind, oder dass die abgebildeten Personen ebenfalls zugestimmt haben.",
    "Vor der Veröffentlichung prüft das Studio den Eintrag. Ich kann meine Einwilligung jederzeit ohne Angabe von Gründen im Kundenportal oder per E-Mail an info@platzhirsch.studio widerrufen. Die Seite wird dann entfernt. Der Widerruf berührt nicht die Rechtmäßigkeit der Veröffentlichung bis dahin.",
    "Handzeichnungen und Modellfotos mit dem Grundriss meiner Wohnung werden nicht als Referenz veröffentlicht. Wie das Studio meine Daten verarbeitet, steht in der Datenschutzerklärung.",
  ]),
});

/** Freigabe-Status (Studio prüft vor Veröffentlichung). */
export const FREIGABE_STATUS = Object.freeze({
  eingereicht: { label: "Wartet auf Prüfung durch das Studio", tone: "neutral" },
  veroeffentlicht: { label: "Veröffentlicht", tone: "gold" },
  abgelehnt: { label: "Nicht veröffentlicht", tone: "neutral" },
  widerrufen: { label: "Widerrufen, entfernt", tone: "neutral" },
});

/** Hinweis bei jedem Upload (Gesichter, Hausnummern). */
export const UPLOAD_HINWEIS =
  "Bitte achten Sie darauf, dass keine Gesichter, Hausnummern, Autokennzeichen oder Dokumente zu sehen sind. Standortdaten (GPS) und andere Metadaten entfernen wir beim Hochladen automatisch.";

/**
 * Referenz-Freigabe nur mit freigegebenem Einwilligungstext in Produktion.
 * Entwicklung/Vorschau: aktiv, mit Entwurfs-Hinweis.
 */
export function referenzFreigabeAktiv(env = process.env, adapter = adapterVonEnv(env)) {
  if (EINWILLIGUNG.status === "freigegeben") return true;
  if (env.NODE_ENV !== "production") return true;
  // TAGEBUCH_PREVIEW=1 (Entwurfstext, BEISPIEL-Projekt) NIE mit dem echten
  // Speicher (QA Recht P2): nur mit dem Datei-Adapter einer Vorschau-Instanz.
  return env.TAGEBUCH_PREVIEW === "1" && adapter === "datei";
}

/** Adaptername nur aus der Umgebung (rein; adapter.js entscheidet zur Laufzeit gleich). */
export function adapterVonEnv(env = process.env) {
  const v = String(env.TAGEBUCH_ADAPTER || "").toLowerCase();
  if (v === "datei" || v === "frappe") return v;
  return String(env.PORTAL_ADAPTER || "").toLowerCase() === "frappe" ? "frappe" : "datei";
}

/**
 * Datenschutzerklärung (QA Recht P1-6): Der Abschnitt „Projekt-Tagebuch“ liegt
 * nur als Vorschlag vor (service-recht-vorschlag.md, Tagebuch). Solange er
 * nicht eingefügt ist, bleibt das Tagebuch in PRODUKTION aus.
 */
export const DATENSCHUTZ_TAGEBUCH = "entwurf";

/**
 * Ist das Tagebuch nutzbar? (QA Technik P1-2) Nur mit verbundenem Speicher –
 * der Frappe-Adapter ist ein Platzhalter (verbunden:false), ein Upload endete
 * dort mit 500 – und in Produktion erst mit ergänzter Datenschutzerklärung.
 */
export function tagebuchVerfuegbar({ verbunden }, env = process.env, dse = DATENSCHUTZ_TAGEBUCH) {
  if (!verbunden) return false;
  if (env.NODE_ENV === "production" && dse !== "freigegeben") return false;
  return true;
}
