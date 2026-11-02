// Freigaben für den Livebetrieb beider Planer (Küchenplaner und Sofaplaner).
// R2-Fix, QM-Feedback P2-1 und P2-2. Rein, ohne Pakete, auf Server und Client
// nutzbar und mit node --test prüfbar.
//
// 1) Preise (P2-1): Zahlen erscheinen nur, wenn die Preistabelle ausdrücklich
//    freigegeben ist (`placeholder: false`). Die Beispieltabellen im Repo tragen
//    `placeholder: true`. Solange bleibt jeder Betrag verborgen, auch im
//    Anfragetext. Der Inhaber gibt seine Tabelle (A2) über
//    .data/kuechenplaner/catalog.json bzw. PRICE_CONFIG frei.
// 2) Senden (P2-2): Anfragen, gespeicherte Planungen und Teilen-Links gibt es im
//    Produktions-Build erst, wenn NEXT_PUBLIC_LABS_PLANER_SENDEN=1 beim Build
//    gesetzt ist. Das geschieht erst, wenn die Datenschutzerklärung den Abschnitt
//    „Online-Planer“ enthält (Entwurf in Marktresearch/digital/features/kuechenplaner.md).
//    Im Dev-Server bleibt es beim Testmodus mit ?senden=1 für die e2e-Tests.

/** Dürfen Preise angezeigt werden? Nur bei ausdrücklich freigegebener Tabelle. */
export function pricesPublic(table) {
  return Boolean(table) && table.placeholder === false;
}

// Der Standardwert muss `process.env.NEXT_PUBLIC_…` wörtlich lesen, damit Next.js
// ihn beim Build in das Client-Bundle einsetzt.
/** Ist echtes Senden/Speichern für den Livebetrieb freigegeben? */
export function sendReleased(value = process.env.NEXT_PUBLIC_LABS_PLANER_SENDEN) {
  return value === "1";
}

/** Kurztext, wenn keine Zahlen gezeigt werden dürfen. */
export const PRICE_HIDDEN_TITLE = "Richtpreis im Gespräch";
export const PRICE_HIDDEN_TEXT =
  "Einen Richtpreis für Ihre Planung nennen wir Ihnen persönlich nach Beratung und Aufmaß.";
