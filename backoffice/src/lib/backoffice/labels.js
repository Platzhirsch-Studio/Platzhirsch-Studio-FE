// Anzeige-Texte aus Frappe-Metadaten: technische Umschreibungen → Umlaute,
// DocType-Namen ohne „PH “, Beschreibungen ohne Entwicklertexte.
// NUR für die Anzeige (Labels, Status-Badges, Überschriften, Optionstexte).
// Werte, die zurückgeschrieben werden (Select-Werte, Status, Namen), bleiben unverändert.
// Reines Modul, testbar mit node --test.

// Ausnahmeliste: Wortanfänge, bei denen ae/oe/ue KEIN Umlaut ist (Kleinschreibung).
// Diphthonge (au/eu + e: Dauer, Steuer, Neue), „qu“ und Fremdwort-Endungen deckt die Regel unten ab.
const AUSNAHMEN = [
  "aero", "israel", "michael", "raphael", "rafael", "samuel", "manuel", "joel", "noel", "poet", "poesie", "koeffizient",
  "koexist", "duett", "silhouette", "zuerst", "zuerkenn", "zuende", "zueinander",
];
// Wortteile, die ue als „u + e“ enthalten (aktuell, manuell, Sequenz, Frequenz, Quelle …).
const UE_TEILE = /uell|uenz|uent|que|aue|eue/;

const ERSATZ = { ae: "ä", oe: "ö", ue: "ü", Ae: "Ä", Oe: "Ö", Ue: "Ü", AE: "Ä", OE: "Ö", UE: "Ü" };

function wortUmlaute(wort) {
  if (wort.length < 3) return wort;
  // Abkürzungen in Versalien (AES, UEFA) unverändert.
  if (/^[A-ZÄÖÜ]{2,5}$/.test(wort)) return wort;
  const klein = wort.toLowerCase();
  if (AUSNAHMEN.some((a) => klein === a || klein.startsWith(a))) return wort;
  // Fremdwort-Endungen (…ue, …oe) bleiben.
  let w = wort;
  return w.replace(/(ae|oe|ue)/gi, (treffer, _g, pos) => {
    const vor = klein[pos - 1] || "";
    const umgebung = klein.slice(Math.max(0, pos - 1), pos + 4);
    const amEnde = pos + 2 === klein.length;
    const t = treffer.toLowerCase();
    if (t === "ue") {
      if (/[aeq]/.test(vor) || UE_TEILE.test(umgebung) || amEnde) return treffer;
    } else if (t === "oe") {
      if (amEnde || /o/.test(vor)) return treffer;
    } else if (t === "ae") {
      if (amEnde || /[a]/.test(vor)) return treffer;
    }
    const passend = ERSATZ[treffer] ?? ERSATZ[treffer[0] + treffer[1].toLowerCase()] ?? treffer;
    return passend;
  });
}

/**
 * Anzeige-Label: Umschreibungen (ae/oe/ue) → Umlaute nach Regel + Ausnahmeliste,
 * Unterstriche → Leerzeichen. „Beratungsgespraech“ → „Beratungsgespräch“,
 * „Geprueft“ → „Geprüft“, aber „Steuer“, „Quelle“, „manuell“, „Neue“ bleiben.
 */
export function anzeige(text) {
  if (text === null || text === undefined) return "";
  // Technische Klammerzusätze („Website-Slug (path_field)“, „Referenz (lead_ref)“) entfallen.
  const roh = String(text);
  let s = roh
    .replace(/\s*\((?=[^)]*_)[^)]*\)/g, "")
    .replace(/\s*[/·,]\s*[a-z0-9]+_[a-z0-9_]+\b/g, "")
    .trim();
  if (!s) s = roh;
  s = s.replace(/_/g, " ");
  return s.replace(/[A-Za-zÄÖÜäöüß]+/g, wortUmlaute);
}

/** DocType-Name für die Anzeige: „PH Beratungsgespraech“ → „Beratungsgespräch“. */
// Frappe-Kern-DocTypes mit deutschem Anzeigenamen (Platzhalter „… suchen“, Bezüge, Palette).
const KERN_DOCTYPES = { User: "Benutzer", DocType: "Dokumentart", File: "Datei", Role: "Rolle", Contact: "Kontakt", Address: "Adresse", Currency: "Währung", Country: "Land", Language: "Sprache", Company: "Firma" };

export function doctypeLabel(name) {
  const s = String(name || "");
  if (Object.prototype.hasOwnProperty.call(KERN_DOCTYPES, s)) return KERN_DOCTYPES[s];
  return anzeige(s.replace(/^PH /, ""));
}

/** Rollenname für die Anzeige: „PH CRM Mitarbeiter“ → „CRM Mitarbeiter“. */
export function rollenLabel(rolle) {
  return anzeige(String(rolle || "").replace(/^PH /, ""));
}

// Merkmale technischer Beschreibungen (Entwicklerhinweise in den DocType-JSONs).
const TECHNISCH = [
  /\bdoctype\b/i,
  /\bph_[a-z]/i,
  /\bPH [A-ZÄÖÜ][a-zäöüß]/, // DocType-Namen im Text („PH Termin, PH Projekt …“)
  /path_field/i,
  /\b[a-z0-9]+_[a-z0-9_]+\b/, // snake_case-Bezeichner (utm_campaign, lead_ref, run_doc_method)
  /\b[\w./-]+\.(py|js|mjs|json|md)\b/i,
  /\bsrc\//i,
  /\/lib\//i,
  /\bfrappe\b/i,
  /\bfixture/i,
  /\bmock\b/i,
  /\bagent(en)?\b/i,
  /kanban-spalten/i,
  /\bhook/i,
  /\bapi\b/i,
  /\bendpoint/i,
  /\bwebhook/i,
  /muster-doctype/i,
  /siehe plan\b/i,
  /whitelist/i,
  /\bRolle PH\b/,
  /\bPLAN\b/,
];

/** true, wenn eine Metadaten-Beschreibung interne/technische Hinweise enthält. */
export function istTechnisch(text) {
  const s = String(text || "");
  return TECHNISCH.some((re) => re.test(s));
}

/**
 * Beschreibung für Hilfetext/Tooltip: technische Texte → null, sonst bereinigt
 * (HTML entfernt, Leerraum normalisiert, Umlaute in der Anzeige).
 */
export function hilfetext(text) {
  const s = String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!s || istTechnisch(s)) return null;
  return anzeige(s);
}
