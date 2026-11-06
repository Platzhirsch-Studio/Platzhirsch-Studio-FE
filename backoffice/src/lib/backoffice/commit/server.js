import "server-only";
// Verzögerter Commit – Server-Anbindung (G-03, Team P0-3): Store, Aktionen-Register, Sitzung, Nachlauf.
//
// In einer Bereichs-Action (nach Rechte- und Eingabeprüfung):
//
//   "use server";
//   import { planeCommit } from "@/lib/backoffice/commit/server";
//   export async function anfrageAnnehmenAction({ name }) {
//     const session = await requireSession();
//     … darfDoc(session, meta, "write") prüfen …
//     return planeCommit(session, {
//       action: "crm.anfrage-annehmen",                // Teildatei lib/backoffice/commit/aktionen/crm.js
//       args: { name },                                // JSON-fähig, ≤ 16 kB, keine Geheimnisse
//       schluessel: `annehmen:${name}`,                 // Doppelklick plant nicht zweimal
//       objekt: { doctype: "PH Anfrage", name },         // Queue je Datensatz, Ausstehend, Protokoll
//       titel: `Annehmen von ${name}`,                   // Fehlertext „Annehmen von AN-… hat nicht geklappt – …“
//     });                                              // → { ok:true, token, frist, ms, objekt }
//   }
//
// Im Client: const { starte } = useVerzoegerterCommit(); starte("Anfrage angenommen", { token, objekt, … }).

import { revalidatePath } from "next/cache";
import { backofficeMode } from "../config.js";
import { sessionStore } from "../auth/store.js";
import { istAdmin, sichtbareBereiche } from "../auth/rechte.js";
import { backoffice } from "../frappe/index.js";
import { commitAktion } from "./aktionen/index.js";
import { COMMIT_TEXTE } from "./texte.js";
import { erzeugeCommitDienst } from "./kern.js";

const G = globalThis;

function revalidiere(pfad) {
  if (typeof pfad !== "string" || !pfad.startsWith("/")) return;
  try {
    revalidatePath(pfad);
  } catch {
    // Außerhalb einer Anfrage (Nachlauf-Timer) gibt es nichts zu revalidieren.
  }
}

/** Sitzung für den Nachlauf: Momentaufnahme aus der Absicht + Frappe-sid aus dem Store (nie in der Absicht gespeichert). */
async function sitzungFuer(e) {
  let s = null;
  try {
    s = e.sid ? await sessionStore().get(e.sid) : null;
  } catch {
    s = null;
  }
  if (!s && backofficeMode() === "frappe") return null; // ohne Benutzer-Sitzung kein Handeln im Namen des Benutzers
  const basis = { user: e.user, name: e.name, roles: e.roles || [], sid: e.sid, frappeSid: s?.frappeSid || null, standort: e.standort || s?.standort || "" };
  return { ...basis, bereiche: sichtbareBereiche(basis), admin: istAdmin(basis), nachlauf: true };
}

/** Vermerk am Datensatz (Kommentar „Info“), wenn ohne geöffnete Seite gespeichert wurde. */
async function vermerke(e, quelle) {
  if (!e.objekt?.doctype || !e.objekt?.name) return;
  const s = await sitzungFuer(e);
  if (!s) return;
  const text = quelle === "nachlauf" ? COMMIT_TEXTE.protokollNachlauf : COMMIT_TEXTE.protokollBeacon;
  const client = backoffice(s);
  if (typeof client.kommentar === "function") await client.kommentar(e.objekt.doctype, e.objekt.name, text, "Info");
}

/** Der Commit-Dienst dieses Prozesses (Store = Sitzungs-Store, in Produktion Redis). */
export function commitDienst() {
  const store = sessionStore();
  if (G.__phBoCommit?.store === store) return G.__phBoCommit.dienst;
  const dienst = erzeugeCommitDienst({
    store,
    aktion: commitAktion,
    kontext: (c) => ({ ...c, client: backoffice(c.session), revalidiere }),
    sitzungFuer,
    vermerke,
    wecker: (ms) => {
      const t = setTimeout(() => {
        dienst.nachlauf().catch((err) => console.error("[backoffice] Commit-Nachlauf fehlgeschlagen", err?.name || err));
      }, ms);
      t.unref?.();
    },
  });
  G.__phBoCommit = { store, dienst, zuletzt: 0 };
  return dienst;
}

/** Nachlauf gelegentlich anstoßen (höchstens alle 5 s; fängt Prozess-Neustarts und andere Instanzen auf). */
export function nachlaufAnstossen() {
  const d = commitDienst();
  const jetzt = Date.now();
  if (jetzt - (G.__phBoCommit.zuletzt || 0) < 5000) return;
  G.__phBoCommit.zuletzt = jetzt;
  d.nachlauf().catch((err) => console.error("[backoffice] Commit-Nachlauf fehlgeschlagen", err?.name || err));
}

/**
 * Absicht vormerken (aus einer Bereichs-Action, nach Rechteprüfung).
 * @param {object} session
 * @param {{action:string, args?:object, schluessel?:string, objekt?:{doctype:string,name:string,titel?:string}|string, titel?:string, ms?:number}} opts
 */
export async function planeCommit(session, opts) {
  nachlaufAnstossen();
  return commitDienst().plane(session, opts);
}

/** Mehrere Tokens ausführen (Reihenfolge bleibt). */
export async function fuehreCommitsAus(session, tokens, quelle = "client") {
  nachlaufAnstossen();
  const d = commitDienst();
  const aus = [];
  for (const token of tokens) aus.push({ token, ...(await d.fuehreAus(token, { session, quelle })) });
  return aus;
}

export async function verwerfeCommits(session, tokens) {
  const d = commitDienst();
  const aus = [];
  for (const token of tokens) aus.push({ token, ...(await d.verwerfe(token, { session })) });
  return aus;
}

export async function commitStatus(session, tokens) {
  const d = commitDienst();
  return Promise.all(tokens.map(async (token) => ({ token, ...((await d.status(token, { session })) || { zustand: "unbekannt" }) })));
}

/** Für die Glocke (P0-7): fehlgeschlagene Commits des Benutzers. */
export async function commitMeldungen(session) {
  return commitDienst().meldungen(session);
}

export async function commitMeldungQuittieren(session, id) {
  return commitDienst().quittiereMeldung(session, id);
}

/** Für das Protokoll der Zentrale (nur Admin – Aufrufer prüft). */
export async function commitProtokoll(opts) {
  return commitDienst().protokoll(opts);
}
