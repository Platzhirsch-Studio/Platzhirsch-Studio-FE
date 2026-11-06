// Aufgaben aus zwei Quellen in einer Liste (10-konzept-zentrale § 3.6.1, Z-69) und Titel-Parser der Schnellanlage
// (§ 3.7, Z-38). Reines Modul, unit-getestet (tests/unit/zentrale-aufgaben.test.mjs).
//
//   PH Aufgabe (ph_crm): titel, status Offen|In Arbeit|Erledigt|Verworfen, faellig, prioritaet, zugewiesen_an,
//                        referenz_doctype/_name, kontakt, quelle, beschreibung, erledigt_am/_von, ergebnis
//   ToDo (Frappe, Fach-Apps): description (HTML), status Open|Closed|Cancelled, date, priority, allocated_to,
//                        reference_type/_name – Kennzeichen „System“, nur Erledigen

export const AUFGABE_STATUS = ["Offen", "In Arbeit", "Erledigt", "Verworfen"];
export const OFFEN = ["Offen", "In Arbeit"];
const TODO_STATUS = { Open: "Offen", Closed: "Erledigt", Cancelled: "Verworfen" };
const TODO_ZURUECK = { Offen: "Open", "In Arbeit": "Open", Erledigt: "Closed", Verworfen: "Cancelled" };
const TODO_PRIO = { High: "Hoch", Medium: "Normal", Low: "Niedrig" };

/** Status → StatusBadge-Ton (Konzept § 2.3). */
export const STATUS_TON = { Offen: "orange", "In Arbeit": "blau", Erledigt: "gruen", Verworfen: "grau" };

/** HTML eines ToDo → erste Textzeile (ohne Tags/Entities), höchstens 140 Zeichen. */
export function todoTitel(html = "") {
  const text = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
  const zeile = text.split("\n").map((s) => s.trim()).find(Boolean) || "";
  return zeile.length > 140 ? `${zeile.slice(0, 139).replace(/\s+\S*$/, "")} …` : zeile;
}

/** PH Aufgabe → Zeile. */
export function ausAufgabe(a) {
  return {
    id: `aufgabe:${a.name}`,
    quelle: "aufgabe",
    name: a.name,
    titel: a.titel || a.name,
    status: a.status || "Offen",
    faellig: a.faellig ? String(a.faellig).slice(0, 10) : null,
    prioritaet: a.prioritaet || "Normal",
    zustaendig: a.zugewiesen_an || null,
    bezugDoctype: a.referenz_doctype || null,
    bezugName: a.referenz_name || null,
    system: a.quelle && a.quelle !== "manuell",
    beschreibung: a.beschreibung || "",
    modified: a.modified || null,
  };
}

/** ToDo → Zeile (Kennzeichen „System“). */
export function ausTodo(t) {
  return {
    id: `todo:${t.name}`,
    quelle: "todo",
    name: t.name,
    titel: todoTitel(t.description) || t.name,
    status: TODO_STATUS[t.status] || "Offen",
    faellig: t.date ? String(t.date).slice(0, 10) : null,
    prioritaet: TODO_PRIO[t.priority] || "Normal",
    zustaendig: t.allocated_to || null,
    bezugDoctype: t.reference_type || null,
    bezugName: t.reference_name || null,
    system: true,
    beschreibung: "",
    modified: t.modified || null,
  };
}

/** Status einer Zeile → ToDo-Status (für Erledigen/Rückgängig). */
export function todoStatus(status) {
  return TODO_ZURUECK[status] || "Open";
}

/**
 * Zusammenführen (Z-69): ToDos mit reference_type = PH Aufgabe entfallen (die Aufgabe steht selbst in der Liste);
 * ToDos, deren Bezug eine offene Freigabe hat, erscheinen nur als Freigabe.
 * Sortierung: überfällige zuerst, dann Fällig aufsteigend (ohne Datum zuletzt), dann Titel.
 * @param {object[]} aufgaben  PH Aufgabe
 * @param {object[]} todos     ToDo
 * @param {{freigabeObjekte?: Set<string>, heute?: string}} [opt]  freigabeObjekte = „Doctype::Name“
 */
export function fuehreZusammen(aufgaben = [], todos = [], { freigabeObjekte = new Set(), heute = "" } = {}) {
  const zeilen = [...aufgaben.map(ausAufgabe)];
  for (const t of todos) {
    if (t.reference_type === "PH Aufgabe") continue;
    if (t.reference_type && t.reference_name && freigabeObjekte.has(`${t.reference_type}::${t.reference_name}`)) continue;
    zeilen.push(ausTodo(t));
  }
  return sortiere(zeilen, heute);
}

export function sortiere(zeilen, heute = "") {
  const ue = (z) => (z.faellig && heute && z.faellig < heute && OFFEN.includes(z.status) ? 0 : 1);
  return [...zeilen].sort((a, b) => ue(a) - ue(b) || String(a.faellig || "9999").localeCompare(String(b.faellig || "9999")) || String(a.titel).localeCompare(String(b.titel), "de"));
}

/** Fälligkeit relativ: „heute“, „morgen“, „vor 2 Tagen“, sonst „Fr. 7.11.“ → { text, ton: "rot"|"sand"|"grau", ueberfaellig } */
export function faelligAnzeige(faellig, heute) {
  if (!faellig) return { text: "–", ton: "grau", ueberfaellig: false };
  const tage = Math.round((Date.parse(`${faellig}T12:00:00Z`) - Date.parse(`${heute}T12:00:00Z`)) / 86_400_000);
  if (tage === 0) return { text: "heute", ton: "sand", ueberfaellig: false };
  if (tage === 1) return { text: "morgen", ton: "grau", ueberfaellig: false };
  if (tage === -1) return { text: "gestern", ton: "rot", ueberfaellig: true };
  if (tage < 0) return { text: `vor ${-tage} Tagen`, ton: "rot", ueberfaellig: true };
  const d = new Date(`${faellig}T12:00:00Z`);
  const wt = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."][d.getUTCDay()];
  return { text: `${wt} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`, ton: "grau", ueberfaellig: false };
}

/** Zähler für Heute-Chips (Konzept § 6.3): überfällig / heute fällig unter offenen Zeilen. */
export function zaehleFaellig(zeilen = [], heute) {
  let ueber = 0;
  let heu = 0;
  for (const z of zeilen) {
    if (!OFFEN.includes(z.status) || !z.faellig) continue;
    if (z.faellig < heute) ueber++;
    else if (z.faellig === heute) heu++;
  }
  return { ueberfaellig: ueber, heute: heu };
}

/** Filter der Liste (Status, Frist, Suche) – rein, für Server und Client. */
export function filtere(zeilen = [], { status = [], frist = "", q = "", heute = "" } = {}) {
  const s = new Set(status);
  const text = String(q).trim().toLowerCase();
  const wochenende = heute ? addTage(heute, 7 - ((new Date(`${heute}T12:00:00Z`).getUTCDay() + 6) % 7) - 1) : "";
  return zeilen.filter((z) => {
    if (s.size && !s.has(z.status)) return false;
    if (frist === "ueberfaellig" && !(z.faellig && z.faellig < heute && OFFEN.includes(z.status))) return false;
    if (frist === "heute" && z.faellig !== heute) return false;
    if (frist === "woche" && !(z.faellig && z.faellig >= heute && z.faellig <= wochenende)) return false;
    if (text && !`${z.titel} ${z.bezugName || ""} ${z.name}`.toLowerCase().includes(text)) return false;
    return true;
  });
}

/** ISO-Datum + n Tage. */
export function addTage(iso, n) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------ Titel-Parser (§ 3.7, Z-38)

const WOCHENTAGE = { mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6, so: 0 };

/**
 * Erkennt Steuer-Wörter **nur am Titelende** (eines nach dem anderen von hinten): `@name`, `+3`, `heute`, `morgen`,
 * `mo`…`so`, `12.11.` bzw. `12.11.2026`. Datumsangaben mitten im Satz bleiben Text („Lieferung 12.11. bestätigen“).
 * @param {string} eingabe
 * @param {{heute:string, personen?:Array<{user:string, name:string}>}} ctx
 * @returns {{titel:string, faellig:string|null, zustaendig:string|null, zustaendigName:string|null, token:Array<{art:"faellig"|"zustaendig", text:string, wert:string}>}}
 */
export function parseTitel(eingabe = "", { heute, personen = [] } = {}) {
  const woerter = String(eingabe).trim().split(/\s+/).filter(Boolean);
  const token = [];
  let faellig = null;
  let zustaendig = null;
  let zustaendigName = null;
  while (woerter.length > 1) {
    const w = woerter[woerter.length - 1];
    const lw = w.toLowerCase();
    let erkannt = false;
    if (!zustaendig && /^@[\p{L}][\p{L}.-]*$/u.test(w)) {
      const such = lw.slice(1);
      const p = personen.find((x) => x.name.toLowerCase().split(/\s+/)[0] === such || x.user.toLowerCase().split("@")[0] === such) || personen.find((x) => x.name.toLowerCase().startsWith(such));
      if (p) {
        zustaendig = p.user;
        zustaendigName = p.name;
        token.unshift({ art: "zustaendig", text: w, wert: p.user });
        erkannt = true;
      }
    } else if (!faellig && heute) {
      const d = datumAusWort(lw, heute);
      if (d) {
        faellig = d;
        token.unshift({ art: "faellig", text: w, wert: d });
        erkannt = true;
      }
    }
    if (!erkannt) break;
    woerter.pop();
  }
  return { titel: woerter.join(" "), faellig, zustaendig, zustaendigName, token };
}

/** Ein Steuer-Wort → ISO-Datum oder null. */
export function datumAusWort(w, heute) {
  if (w === "heute") return heute;
  if (w === "morgen") return addTage(heute, 1);
  const plus = /^\+(\d{1,3})$/.exec(w);
  if (plus) return addTage(heute, Number(plus[1]));
  if (w in WOCHENTAGE) {
    const jetzt = new Date(`${heute}T12:00:00Z`).getUTCDay();
    let diff = (WOCHENTAGE[w] - jetzt + 7) % 7;
    if (diff === 0) diff = 7;
    return addTage(heute, diff);
  }
  const dm = /^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/.exec(w);
  if (dm) {
    const [j0] = heute.split("-").map(Number);
    const t = Number(dm[1]);
    const m = Number(dm[2]);
    if (t < 1 || t > 31 || m < 1 || m > 12) return null;
    let j = dm[3] ? Number(dm[3]) : j0;
    let iso = `${j}-${String(m).padStart(2, "0")}-${String(t).padStart(2, "0")}`;
    if (!dm[3] && iso < heute) {
      j += 1;
      iso = `${j}-${String(m).padStart(2, "0")}-${String(t).padStart(2, "0")}`;
    }
    const pruef = new Date(`${iso}T12:00:00Z`);
    if (pruef.getUTCDate() !== t) return null;
    return iso;
  }
  return null;
}
