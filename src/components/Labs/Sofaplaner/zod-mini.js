// Tempo-Runde (30.10.2026, Team Sofaplaner): Sofaplaner-Schemas im Browser mit
// zod/mini statt der klassischen zod-API. Die klassische API hängt alle
// Methoden (.min, .trim, .regex …) an jedes Schema und lässt sich darum nicht
// verkleinern (etwa 32 KB gzip im Planer-Bundle, qa-screenshots/konsolidierung/
// tempo.md). zod/mini hat dieselbe Prüflogik (zod/v4/core) als einzelne
// Funktionen; nur die genutzten landen im Bundle. Die Server-Routen nutzen die
// Schemas unverändert (gleicher Kern, auch in klassischen z.object einsetzbar).
//
// Aufrufer schreiben `import * as z from "./zod-mini.js"`. Nur benannte
// Re-Exporte (kein `export *`), damit nichts Ungenutztes mitkommt.
export { _default, array, enum, gte, int, literal, lte, maxLength, minLength, number, object, pipe, regex, string, transform, trim, union } from "zod/mini";

// CSP ohne 'unsafe-eval' (wie src/components/Labs/zod.js): ohne `jitless`
// prüft zod beim ersten Objekt per `new Function("")`, ob es seinen JIT-Pfad
// nutzen darf, und der Browser meldet einen CSP-Verstoß. Gilt global für den
// zod-Kern, das Prüfergebnis ist identisch.
import { config } from "zod/mini";
config({ jitless: true });
