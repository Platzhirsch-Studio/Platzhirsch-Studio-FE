// Konstanten der Ablage – exakt aus Backend-Import/ph_ablage (utils/regeln.py, DocType-JSONs).
// Reines Modul (Browser, Server, node --test).

export const DT = Object.freeze({
  datei: "PH Datei",
  ordner: "PH Ordner",
  link: "PH Datei Freigabelink",
  ereignis: "PH Ablage Ereignis",
  einstellungen: "PH Ablage Einstellungen",
});

export const ERLAUBTE_BEZUEGE = Object.freeze(["PH Kontakt", "PH Projekt", "PH Lieferant", "PH Mitarbeiter", "PH Servicefall"]);

/** Bezug → Anzeige + Akte im Backoffice. */
export const BEZUG = Object.freeze({
  "PH Kontakt": { titel: "Kontakt", mehrzahl: "Kontakte", href: (n) => `/kunden/${encodeURIComponent(n)}` },
  "PH Projekt": { titel: "Projekt", mehrzahl: "Projekte", href: (n) => `/projekte/${encodeURIComponent(n)}` },
  "PH Lieferant": { titel: "Lieferant", mehrzahl: "Lieferanten", href: (n) => `/d/ph-lieferant/${encodeURIComponent(n)}` },
  "PH Mitarbeiter": { titel: "Mitarbeiter", mehrzahl: "Mitarbeiter", href: (n) => `/d/ph-mitarbeiter/${encodeURIComponent(n)}` },
  "PH Servicefall": { titel: "Servicefall", mehrzahl: "Servicefälle", href: (n) => `/service/faelle/${encodeURIComponent(n)}` },
});

export const ALLGEMEINE_LEITUNG = Object.freeze(["PH Ablage Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"]);
export const BEZUG_LEITUNG = Object.freeze({
  "PH Kontakt": ["PH CRM Leitung"],
  "PH Projekt": ["PH Projekte Leitung"],
  "PH Lieferant": ["PH Sortiment Leitung"],
  "PH Servicefall": ["PH Service Leitung"],
});
export const PERSONAL_LEITUNG = Object.freeze(["PH Personal Leitung", "PH Geschäftsführung", "System Manager"]);
/** Endgültig löschen: DocType-Recht „delete“ auf PH Datei (Backend-Import permissions). */
export const LOESCH_ROLLEN = Object.freeze(["PH Ablage Leitung", "System Manager", "PH Backoffice-Admin"]);
/** Nur lesend (DocType-Rechte ohne write). */
export const NUR_LESEN = Object.freeze(["PH Geschäftsführung"]);

export const MODI = Object.freeze(["intern", "team", "leitung"]);
export const MODUS = Object.freeze({
  intern: { titel: "Alle intern", text: "Alle mit Zugriff auf den Bezug", icon: "Users" },
  team: { titel: "Team", text: "Team des Bezugs und Mitglieder", icon: "UserCog" },
  leitung: { titel: "Nur Leitung", text: "Nur Leitungsrollen", icon: "Lock" },
});

export const STANDARD_GESPERRT = Object.freeze([
  "exe", "msi", "msp", "bat", "cmd", "com", "scr", "pif", "cpl", "dll", "sys", "ps1", "psm1", "vbs", "vbe",
  "js", "jse", "wsf", "wsh", "hta", "jar", "lnk", "reg", "app", "sh", "apk", "iso", "img", "html", "htm", "svgz",
]);
export const CAD_ENDUNGEN = Object.freeze(["dxf", "dwg", "skp", "3dm", "ifc", "step", "stp", "iges", "igs", "stl", "obj", "fbx", "3ds", "dwf", "rvt", "pln"]);
export const BILD_ENDUNGEN = Object.freeze(["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "heic", "heif", "avif"]);
export const OFFICE_ENDUNGEN = Object.freeze(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf"]);
export const VIDEO_ENDUNGEN = Object.freeze(["mp4", "mov", "m4v", "webm", "avi", "mkv"]);
export const AUDIO_ENDUNGEN = Object.freeze(["mp3", "m4a", "wav", "ogg", "aac", "flac"]);
export const TEXT_ENDUNGEN = Object.freeze(["txt", "csv", "md", "json", "xml", "log"]);

export const MIME_EXTRA = Object.freeze({
  dwg: "application/acad", dxf: "image/vnd.dxf", skp: "application/vnd.sketchup.skp", "3dm": "model/vnd.3dm",
  ifc: "application/x-step", step: "model/step", stp: "model/step", stl: "model/stl", obj: "model/obj",
  heic: "image/heic", heif: "image/heif", avif: "image/avif", webp: "image/webp", md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  txt: "text/plain", csv: "text/csv", json: "application/json", xml: "application/xml",
  doc: "application/msword", xls: "application/vnd.ms-excel", ppt: "application/vnd.ms-powerpoint",
  mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg",
});

/** Aufbewahrungsklassen (utils/regeln.py AUFBEWAHRUNG; Fristen = Vorschläge, Steuerberater bestätigt). */
export const AUFBEWAHRUNG = Object.freeze({
  Allgemein: { jahre: 0, sperre: false, nurLeitung: false, hinweis: "Keine gesetzliche Frist" },
  Beleg: { jahre: 7, sperre: true, nurLeitung: true, hinweis: "7 Jahre ab Jahresende (BAO § 132), Löschsperre" },
  Personal: { jahre: 7, sperre: false, nurLeitung: true, hinweis: "7 Jahre, nur Personal-Leitung löscht" },
  Projekt: { jahre: 7, sperre: false, nurLeitung: false, hinweis: "Empfehlung 7 Jahre (Gewährleistung)" },
  Marketing: { jahre: 3, sperre: false, nurLeitung: false, hinweis: "Empfehlung 3 Jahre" },
});
export const KLASSEN = Object.freeze(Object.keys(AUFBEWAHRUNG));

export const SORTIERUNG = Object.freeze({
  name: { titel: "Name", order: "dateiname asc" },
  "-geaendert": { titel: "Zuletzt geändert", order: "modified desc" },
  "-groesse": { titel: "Größe", order: "groesse desc" },
  endung: { titel: "Art", order: "endung asc, dateiname asc" },
  "-erstellt": { titel: "Neueste zuerst", order: "creation desc" },
});
export const SORT_SCHLUESSEL = Object.freeze(["name", "-name", "groesse", "-groesse", "geaendert", "-geaendert", "erstellt", "-erstellt", "endung"]);

/** Filter nach Art (Endungsgruppen) für die Pillen über der Liste. */
export const ART_FILTER = Object.freeze({
  pdf: { titel: "PDF", endungen: ["pdf"] },
  bild: { titel: "Bilder", endungen: BILD_ENDUNGEN },
  office: { titel: "Office", endungen: OFFICE_ENDUNGEN },
  cad: { titel: "CAD", endungen: CAD_ENDUNGEN },
});

export const FREIGABE_STATUS = Object.freeze({
  Aktiv: { titel: "Aktiv", material: "salbei" },
  Abgelaufen: { titel: "Abgelaufen", material: "stein" },
  Aufgebraucht: { titel: "Aufgebraucht", material: "eiche" },
  Widerrufen: { titel: "Widerrufen", material: "ziegel" },
});

/** Ereignis-Arten exakt wie PH Ablage Ereignis.art (Werte ohne Umlaut, Anzeige über anzeige()). */
export const EREIGNIS_ARTEN = Object.freeze([
  "Upload", "Neue Version", "Download", "Vorschau", "Umbenannt", "Verschoben", "Tags", "Gesperrt", "Entsperrt",
  "Version wiederhergestellt", "Geloescht", "Wiederhergestellt", "Endgueltig geloescht", "Freigabe erstellt",
  "Freigabe widerrufen", "Freigabe genutzt", "Portal freigegeben", "Portal zurueckgezogen", "Ordner angelegt",
  "Ordner verschoben", "Ordner umbenannt", "Ordner geloescht", "Bestand verlinkt", "Speicher umgezogen",
  "Pruefsumme abweichend", "Anonymisiert", "Abgelehnt",
]);

export const MB = 1024 * 1024;
