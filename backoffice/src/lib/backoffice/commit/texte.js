// Texte des verzögerten Commits, der Toasts und von `Ausstehend` (G-03, Team P0-3).
// Deutsch, kurz, neutral; Umlaute korrekt. Reines Modul (Server und Client).

export const COMMIT_TEXTE = Object.freeze({
  // Toast
  rueckgaengig: "Rückgängig",
  rueckgaengigSekunden: (s) => `Rückgängig (${s} s)`,
  jetztAusfuehren: "Jetzt ausführen",
  schliessen: "Hinweis schließen",
  meldungen: "Meldungen",
  rueckgaengigGemacht: "Rückgängig gemacht.",
  rueckgaengigGemachtMehrere: (n) => `${n} Änderungen rückgängig gemacht.`,
  weitere: (n) => (n === 1 ? "1 weitere Meldung" : `${n} weitere Meldungen`),
  wenigerZeigen: "Weniger zeigen",
  anzahl: (n) => `${n}-mal`,

  // Ausstehend
  ausstehend: (s) => `wird in ${s} s gespeichert`,
  ausstehendAngehalten: "Speichern angehalten",
  ausstehendLaeuft: "wird gespeichert …",
  ausstehendLabel: "Änderung noch nicht gespeichert",

  // Fehlerfälle
  fehlgeschlagen: (titel, grund) => `${titel} hat nicht geklappt – ${grund}`,
  fehlgeschlagenOhneTitel: (grund) => `Die Änderung hat nicht geklappt – ${grund}`,
  schonAusgefuehrt: "Schon gespeichert – Rückgängig ist nicht mehr möglich.",
  schonVerworfen: "Wurde bereits rückgängig gemacht.",
  netz: "Keine Verbindung zum Server. Die Änderung ist dort vorgemerkt und wird automatisch gespeichert.",
  verwerfenNetz: "Rückgängig konnte nicht übermittelt werden. Bitte nachsehen, ob die Änderung gespeichert wurde.",
  sitzungBeendet: "die Anmeldung war beendet",
  unerwartet: "unerwarteter Fehler",
  unbekannt: "Diese Änderung ist nicht mehr bekannt.",
  fremd: "Diese Änderung gehört zu einer anderen Anmeldung.",
  ungueltig: "Ungültige Anfrage.",
  nichtAngemeldet: "Nicht angemeldet.",
  nurMock: "Nur im Testmodus für die Administration verfügbar.",

  // Protokoll (Kommentar am Datensatz bzw. Commit-Protokoll)
  protokollNachlauf: "Automatisch gespeichert, weil die Seite vor dem Speichern geschlossen wurde.",
  protokollBeacon: "Beim Verlassen der Seite gespeichert.",
});

/** Grund aus einem Fehlerergebnis – nie Technikbegriffe, nie leer. */
export function grundAus(r) {
  const m = r && typeof r.message === "string" ? r.message.trim() : "";
  return m ? m.replace(/[.\s]+$/, "") : COMMIT_TEXTE.unerwartet;
}

/** Texte der Baustein-Demo „commit“ (nur Admin, nur Mock). */
export const COMMIT_DEMO_TEXTE = Object.freeze({
  titel: "Rückmeldung und Rückgängig",
  team: "Baustein von Team P0-3",
  einleitung: "Änderungen mit Außenwirkung werden erst nach acht Sekunden gespeichert. Bis dahin lässt sich alles zurücknehmen; wer die Seite verlässt, speichert sofort.",
  liste: "Anfragen",
  listeUnter: "Annehmen speichert verzögert",
  annehmen: "Annehmen",
  annehmenFehler: "Annehmen (scheitert)",
  angenommen: "Anfrage angenommen",
  mehrere: (n) => `${n} Anfragen angenommen`,
  alleAnnehmen: "Alle annehmen",
  arten: "Meldungen",
  artenUnter: "Arten, Zusammenfassen, Stapel",
  gespeichert: "Gespeichert.",
  info: "Die Liste wurde neu sortiert.",
  warnung: "Sitzung endet in 2 Minuten.",
  verlaengern: "Verlängern",
  fehler: "Speichern hat nicht geklappt – keine Verbindung zum Server.",
  gruppe: "Dreimal hintereinander",
  ansicht: "Alle Zustände",
  ansichtUnter: "Ruhende Darstellung zum Vergleich",
  server: "Am Server",
  serverUnter: "Zustand der letzten Vorgänge",
  aktualisieren: "Aktualisieren",
  leer: "Noch keine Vorgänge.",
  zustand: { geplant: "vorgemerkt", laeuft: "läuft", ausgefuehrt: "gespeichert", verworfen: "zurückgenommen", fehlgeschlagen: "nicht geklappt", unbekannt: "unbekannt" },
  quelle: { client: "nach Ablauf", beacon: "beim Verlassen", nachlauf: "Nachlauf" },
  artName: { ok: "Erfolg", info: "Hinweis", warnung: "Warnung", fehler: "Fehler" },
  nurMock: "Diese Demo plant echte Vorgänge und ist nur im Testmodus verfügbar.",
});
