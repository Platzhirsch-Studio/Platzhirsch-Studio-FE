// Bereich Marketing – welches Band eine Seite zeigt (§ 2.0.2): höchstens eines, Testmodus > Fehler > Hinweis.
// Im Mock zeigt die Shell schon das Testband („Beispieldaten im Speicher“) – das Marketing-Testband (Mails an die
// Testadresse) erscheint dort nicht zusätzlich, damit oben nur eine Zeile steht. Reines Modul (Unit-Test).

import { ALLG } from "./texte.js";

export function bandFuer(ctx = {}, band = null) {
  if (ctx.testmodus && !ctx.mock && ctx.client?.modus !== "mock") return { ton: "test", inhalt: ALLG.testmodus(ctx.einst?.test_empfaenger) };
  return band || null;
}

