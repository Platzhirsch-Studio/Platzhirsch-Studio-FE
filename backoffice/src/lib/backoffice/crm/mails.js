// Nicht zugeordnete E-Mails (Inhaber-Entscheidung Nr. 52, ph_microsoft.api.mails_unzugeordnet). Reines Modul.
// Regeln: Nur Mails mit eindeutig einem Kontakt zugeordneter Adresse kommen automatisch in die Kundenakte. Alle
// anderen bleiben in Outlook und werden NICHT gespeichert; die Live-Liste zeigt sie mit Grund
// (unbekannt | mehrdeutig | vertraulich). Vertrauliche Mails werden nie automatisch zugeordnet.
// Antwortform des Servers: [{message_id, postfach, richtung, absender, absender_name, gegenadresse, betreff, datum,
//   grund, vertraulich, vorschlaege:[{doctype, name, titel}]}]

import { CRM_TEXTE as T } from "./texte.js";

export const GRUENDE = Object.freeze(["unbekannt", "mehrdeutig", "vertraulich"]);

/** Eintrag der Live-Liste auf die Anzeige normalisieren (fehlende Felder → leer, unbekannter Grund → unbekannt). */
export function normalisiereMail(m = {}) {
  const grund = GRUENDE.includes(m.grund) ? m.grund : m.vertraulich ? "vertraulich" : "unbekannt";
  return {
    id: String(m.message_id || ""),
    postfach: String(m.postfach || ""),
    richtung: m.richtung === "ausgehend" ? "ausgehend" : "eingehend",
    absender: String(m.absender || ""),
    absenderName: String(m.absender_name || ""),
    gegenadresse: String(m.gegenadresse || m.absender || ""),
    betreff: String(m.betreff || "").trim() || "(ohne Betreff)",
    vorschau: String(m.vorschau || m.auszug || ""),
    datum: String(m.datum || ""),
    grund,
    grundText: T.mails.gruende[grund],
    vertraulich: !!m.vertraulich || grund === "vertraulich",
    vorschlaege: Array.isArray(m.vorschlaege) ? m.vorschlaege.filter((v) => v && v.doctype && v.name).map((v) => ({ doctype: v.doctype, name: v.name, titel: v.titel || v.name })) : [],
  };
}

/** Sortiert neueste zuerst und zählt je Grund. */
export function gruppiereMails(liste = []) {
  const mails = liste.map(normalisiereMail).filter((m) => m.id).sort((a, b) => b.datum.localeCompare(a.datum));
  const zaehler = Object.fromEntries(GRUENDE.map((g) => [g, 0]));
  for (const m of mails) zaehler[m.grund] += 1;
  return { mails, zaehler, gesamt: mails.length };
}

/** Filter nach Grund und Postfach (URL-Parameter). */
export function filtereMails(mails = [], { grund, postfach } = {}) {
  return mails.filter((m) => (!grund || grund === "alle" || m.grund === grund) && (!postfach || m.postfach === postfach));
}

/** Darf diese Mail ohne Rückfrage einem Vorschlag zugeordnet werden? Vertraulich nie automatisch, nur von Hand. */
export function zuordnungErlaubt(mail, { vonHand = true } = {}) {
  if (!mail) return false;
  if (mail.vertraulich) return vonHand;
  return true;
}

/** Adresse normalisieren wie ph_microsoft.logik.zuordnung.normalisiere (klein, ohne Leerzeichen). */
export function normalisiereAdresse(a) {
  return String(a || "").trim().toLowerCase();
}

/**
 * Beispiel-Mails für den Mock-Pfad von mails_unzugeordnet (keine echten Personen, @beispiel.invalid).
 * Deterministisch aus den Kontakten des Seeds; Zeit relativ zu `jetzt`.
 * @param {{kontakte?:object[], postfaecher?:string[], jetzt?:Date}} p
 */
export function beispielMails({ kontakte = [], postfaecher = ["office@beispiel.invalid", "beratung@beispiel.invalid"], jetzt = new Date() } = {}) {
  const zeit = (stundenZurueck) => {
    const d = new Date(jetzt.getTime() - stundenZurueck * 3600000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
  };
  const k = (i) => kontakte[i % Math.max(kontakte.length, 1)] || null;
  const vorschlag = (x) => (x ? { doctype: "PH Kontakt", name: x.name, titel: x.titel || [x.vorname, x.nachname].filter(Boolean).join(" ") || x.name } : null);
  const pf = (i) => postfaecher[i % postfaecher.length];
  return [
    { message_id: "mock-mail-001", postfach: pf(0), richtung: "eingehend", absender: "anna.neu@beispiel.invalid", absender_name: "Anna Neu", gegenadresse: "anna.neu@beispiel.invalid", betreff: "Frage zu Lieferzeit Esstisch Eiche", vorschau: "Guten Tag, wir haben Ihren Esstisch im Showroom gesehen und würden gern wissen, wie lange die Lieferzeit derzeit ist …", datum: zeit(2), grund: "unbekannt", vertraulich: false, vorschlaege: [] },
    { message_id: "mock-mail-002", postfach: pf(1), richtung: "eingehend", absender: "familie.muster@beispiel.invalid", absender_name: "Familie Muster", gegenadresse: "familie.muster@beispiel.invalid", betreff: "Re: Termin nächste Woche", vorschau: "Danke für die Unterlagen. Passt Ihnen Donnerstag am Vormittag?", datum: zeit(5), grund: "mehrdeutig", vertraulich: false, vorschlaege: [vorschlag(k(0)), vorschlag(k(3))].filter(Boolean) },
    { message_id: "mock-mail-003", postfach: pf(0), richtung: "eingehend", absender: "buero@architektur-beispiel.invalid", absender_name: "Muster Architektur ZT", gegenadresse: "buero@architektur-beispiel.invalid", betreff: "Projekt Seeufer – Möblierungsplan", vorschau: "Anbei der Möblierungsplan für das Erdgeschoss. Wir bitten um ein Angebot für die Lounge-Bereiche.", datum: zeit(26), grund: "unbekannt", vertraulich: false, vorschlaege: [vorschlag(k(5))].filter(Boolean) },
    { message_id: "mock-mail-004", postfach: pf(1), richtung: "ausgehend", absender: "beratung@beispiel.invalid", absender_name: "Beratung", gegenadresse: "jonas.beispiel@beispiel.invalid", betreff: "Ihre Muster sind abholbereit", vorschau: "Die Stoffmuster liegen ab morgen im Showroom für Sie bereit.", datum: zeit(30), grund: "unbekannt", vertraulich: false, vorschlaege: [] },
    { message_id: "mock-mail-005", postfach: pf(0), richtung: "eingehend", absender: "privat.kontakt@beispiel.invalid", absender_name: "Privat", gegenadresse: "privat.kontakt@beispiel.invalid", betreff: "Persönlich", vorschau: "Als vertraulich markiert – Inhalt wird hier nicht angezeigt.", datum: zeit(50), grund: "vertraulich", vertraulich: true, vorschlaege: [vorschlag(k(1))].filter(Boolean) },
    { message_id: "mock-mail-006", postfach: pf(1), richtung: "eingehend", absender: "hotel.demo@beispiel.invalid", absender_name: "Demo Hotel Betriebs GmbH", gegenadresse: "hotel.demo@beispiel.invalid", betreff: "Anfrage Terrassenmöbel 24 Zimmer", vorschau: "Für die Saison 2027 planen wir neue Terrassenmöbel. Können Sie uns einen Termin vor Ort anbieten?", datum: zeit(72), grund: "mehrdeutig", vertraulich: false, vorschlaege: [vorschlag(k(2)), vorschlag(k(4))].filter(Boolean) },
  ];
}
