// Schmaler zod-Zugang für Labs-Code, der im Browser landet (R4-portal-labs).
// `import { z } from "zod"` zieht in Turbopack-Builds den ganzen Namensraum mit
// allen ~50 Sprachpaketen der Fehlermeldungen in den Client (gemessen 90 KB gzip
// pro Labs-Route, qa-screenshots/teamleiter/r4-portal-labs/). Hier werden nur
// die tatsächlich genutzten Funktionen benannt re-exportiert; Aufrufer schreiben
// weiter `z.object(...)` usw. (`import * as z from "../zod.js"`). Englisch bleibt
// Standard-Locale (zod registriert es beim ersten Schema selbst), eigene
// deutsche Meldungen stehen wie bisher in den Schemas.
export { array, boolean, literal, number, object, string, union } from "zod";
export { enum } from "zod";

// CSP ohne 'unsafe-eval' (R5-portal-labs): zod 4 prüft beim ersten Parsen eines
// Objekts per `new Function("")`, ob es seinen JIT-Pfad nutzen darf. Der Fehler
// wird zwar abgefangen, der Browser meldet aber trotzdem einen CSP-Verstoß
// (Fund aus r4-release/lauf3-config/csp-console.json, /de/sofaplaner).
// `jitless` überspringt die Probe und nutzt nur den normalen Parser; das
// Ergebnis der Prüfung ist identisch. Die Einstellung gilt global für die
// zod-Instanz, also für alle Labs-Schemas im Browser.
import { config } from "zod";
config({ jitless: true });
