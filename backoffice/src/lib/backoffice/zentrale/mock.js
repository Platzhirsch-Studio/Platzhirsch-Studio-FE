// Mock-Pfad der Zentrale für Quellen, die der Mock-Client nicht als DocType kennt (MASTER Q-A3):
//   • Frappe-„ToDo“ der Fach-Apps (System-Aufgaben) – im Echtbetrieb aus Frappe, hier eine kleine Liste je Prozess.
// Beispieldaten ohne echte Personen, Bezüge auf Mock-Nummernkreise. Zustand im Prozess (globalThis), damit
// Erledigen/Rückgängig im Mock wirkt und Tests stabil bleiben. Reines Modul.

const G = globalThis;

function heuteIso(jetzt = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(jetzt);
}

function plus(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Beispiel-ToDos (Frappe-Felder exakt: description, status, date, priority, allocated_to, reference_type/_name). */
function startTodos() {
  const h = heuteIso();
  const t = (name, description, tage, allocated_to, reference_type, reference_name, priority = "Medium") => ({
    name,
    description,
    status: "Open",
    date: plus(h, tage),
    priority,
    allocated_to,
    reference_type,
    reference_name,
    modified: `${plus(h, -1)} 09:00:00`,
  });
  return [
    t("TODO-MOCK-0001", "<p>Lieferschein prüfen: Teillieferung ohne Restmenge gebucht</p>", 0, "gf@demo.local", "PH Lieferschein", "LS-2026-00002"),
    t("TODO-MOCK-0002", "<p>Zahlungseingang ohne Zuordnung – Bankumsatz prüfen</p>", -2, "gf@demo.local", "PH Rechnung", "ENTW-2026-00002", "High"),
    t("TODO-MOCK-0003", "<p>Ersatzteil bestellt, Liefertermin beim Hersteller erfragen</p>", 3, "admin@demo.local", "PH Servicefall", "PH-SRV-2026-00013"),
    t("TODO-MOCK-0004", "<p>Monatsbeleg der Kassa nachholen</p>", -1, "admin@demo.local", "PH Kassenbeleg", "KASSE-LOCHAU-01-1000", "High"),
    t("TODO-MOCK-0005", "<p>Newsletter-Abmeldung bestätigen</p>", 1, "marketing@demo.local", "", ""),
    t("TODO-MOCK-0006", "<p>Aufgabe gespiegelt (erscheint nicht doppelt)</p>", 0, "gf@demo.local", "PH Aufgabe", "PH-AUF-2026-00001"),
  ];
}

function speicher() {
  if (!G.__phBoZentraleTodos) G.__phBoZentraleTodos = startTodos();
  return G.__phBoZentraleTodos;
}

/** ToDo-Liste des Mock (Kopien). sicht „meine“ = allocated_to = Benutzer; offen = nur Open. */
export function mockTodos(session, { sicht = "meine", offen = true } = {}) {
  return speicher()
    .filter((t) => (sicht === "meine" ? t.allocated_to === session?.user : true))
    .filter((t) => (offen ? t.status === "Open" : true))
    .map((t) => ({ ...t }));
}

/** ToDo-Status im Mock setzen → { ok, alt } (Open|Closed|Cancelled). */
export function setzeMockTodo(name, status, session) {
  const t = speicher().find((x) => x.name === name);
  if (!t) return { ok: false, code: "not_found", message: "Diese Aufgabe gibt es nicht mehr." };
  if (session && t.allocated_to !== session.user && !(session.roles || []).some((r) => /Admin|System Manager|Geschäftsführung|Leitung/.test(r))) {
    return { ok: false, code: "forbidden", message: "Diese Aufgabe ist einer anderen Person zugewiesen." };
  }
  const alt = t.status;
  t.status = status;
  t.modified = new Date().toISOString().slice(0, 19).replace("T", " ");
  return { ok: true, alt };
}

/** Nur für Tests: Ausgangszustand. */
export function setzeMockZurueck() {
  G.__phBoZentraleTodos = startTodos();
}
