// tools/tagebuch-team-hash.mjs – Passwort-Hash für ein persönliches Team-Konto
// des Projekt-Tagebuchs (src/lib/portal/tagebuch/konten.js).
//
//   node tools/tagebuch-team-hash.mjs <kennung> <rolle studio|mitarbeit> "<Name>"
//   (Passwort wird verdeckt abgefragt; nie als Argument übergeben)
//
// Ausgabe: ein JSON-Eintrag für TAGEBUCH_TEAM_KONTEN (Server-Env, nicht ins Repo).
import readline from "node:readline";
import { KONTO_ID, ROLLEN, hashPasswort } from "../src/lib/portal/tagebuch/konten.js";

const [id, rolle, ...nameTeile] = process.argv.slice(2);
const name = nameTeile.join(" ").trim();
if (!KONTO_ID.test(String(id || "")) || !ROLLEN[rolle] || !name) {
  console.error('Aufruf: node tools/tagebuch-team-hash.mjs <kennung a-z0-9._-> <studio|mitarbeit> "<Name>"');
  process.exit(1);
}
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => rl.output.write(s.includes("Passwort") ? s : "*");
rl.question("Passwort (mind. 12 Zeichen): ", (pw) => {
  rl.close();
  process.stdout.write("\n");
  if (String(pw).length < 12) {
    console.error("Zu kurz (mind. 12 Zeichen).");
    process.exit(1);
  }
  console.log(JSON.stringify({ id, name, rolle, hash: hashPasswort(pw) }));
});
