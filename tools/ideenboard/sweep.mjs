// tools/ideenboard/sweep.mjs — abgelaufene geteilte Ideenboards löschen.
// Für einen täglichen Cron auf dem Server (DSGVO Speicherbegrenzung), auch
// wenn niemand die API aufruft. Der Server selbst räumt zusätzlich beim ersten
// Zugriff nach dem Start und danach alle 6 Std. auf (src/lib/ideenboard/service.js).
//
//   IDEENBOARD_LOCAL_DIR=/srv/platzhirsch/ideenboard node tools/ideenboard/sweep.mjs
//   (ohne Variable: <repo>/.data/ideenboard)
//
// Schreibt nur in diesen Ordner, nie ins Backoffice.
import path from "node:path";
import { createLocalStore } from "../../src/lib/ideenboard/localStore.js";
import { isExpired } from "../../src/lib/ideenboard/model.js";

const root = process.env.IDEENBOARD_LOCAL_DIR
  ? path.resolve(process.env.IDEENBOARD_LOCAL_DIR)
  : path.resolve(import.meta.dirname, "../../.data/ideenboard");

const result = await createLocalStore(root).sweep((r) => isExpired(r));
console.log(JSON.stringify({ root, ...result, at: new Date().toISOString() }));
