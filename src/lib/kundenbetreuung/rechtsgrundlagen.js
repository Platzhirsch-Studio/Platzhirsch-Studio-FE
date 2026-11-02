// src/lib/kundenbetreuung/rechtsgrundlagen.js
// Die drei Grundlagen, nach denen die automatische Kundenbetreuung Mails
// schicken darf (Jurist im Team; Quellen: wachstumsrat/crm-wiederkauf.md
// Abschn. 2.3, marketing/email-flows.md Abschn. 0.1). Jede Kundenreise
// (reisen.js) ist genau diesen Kürzeln zugeordnet, die Frappe-App prüft sie
// VOR jedem Versand (engine.py darf_senden).
//
// Österreich kennt bei E-Mail-Werbung auch gegenüber Unternehmen keine
// Ausnahme (§ 174 Abs. 3 TKG 2021). Darum: im Zweifel Einwilligung.
// Diese Datei ist eine Arbeitsgrundlage, keine Rechtsberatung. Fußzeilen und
// die Einordnung der Bewertungsbitte gehen als Vorschlag an die Kanzlei
// (Marktresearch/digital/features/kundenbetreuung.md, Abschn. „Für die Kanzlei“).
// Keine "@/..."-Importe.

export const GRUNDLAGEN = Object.freeze({
  V: Object.freeze({
    kuerzel: "V",
    name: "Vertrag und Service",
    norm: "Art. 6 Abs. 1 lit. b DSGVO",
    darf: "Bestätigungen, Liefer- und Termininfos, Danke, Pflegehinweise zum gekauften Stück.",
    darfNicht: "Jede Neuheit, jedes Angebot, jede Einladung, jeder Gutschein. Ein einziger Werbeblock macht die Mail zu Werbung.",
    pflicht: [],
    werbungErlaubt: false,
  }),
  B: Object.freeze({
    kuerzel: "B",
    name: "Bestandskunde ohne Widerspruch",
    norm: "§ 174 Abs. 4 TKG 2021 (AT), § 7 Abs. 3 UWG (DE), Art. 3 Abs. 1 lit. o UWG (CH); FL bis zur Klärung wie AT",
    darf: "Werbung per E-Mail für EIGENE, ÄHNLICHE Produkte an Käuferinnen und Käufer, die nicht widersprochen haben.",
    darfNicht: "Fremdangebote, Partnerprodukte, Werbung an reine Interessenten, Werbung nach einem Widerspruch.",
    pflicht: [
      "Adresse stammt aus einem Kauf (Auftrag mit Lieferung)",
      "nur eigene, ähnliche Produkte (Einrichtung, Outdoor, Pflege, Accessoires aus dem eigenen Sortiment), eng ausgelegt: passend zum GEKAUFTEN Stück",
      "Hinweis auf die Widerspruchsmöglichkeit schon bei der Erhebung der Adresse NACHWEISBAR (Datum und Quelle im Auftrag, § 174 Abs. 4 Z 3 TKG); fehlt er: Brief statt Mail",
      "Widerspruchsmöglichkeit in JEDER Mail, kostenlos und einfach (Fußzeile B)",
      "Abgleich mit der ECG-Liste der RTR vor jedem Versand",
      "kein Widerspruch im Datensatz (Email Unsubscribe / PH Einwilligung)",
    ],
    werbungErlaubt: true,
  }),
  E: Object.freeze({
    kuerzel: "E",
    name: "Einwilligung mit Double-Opt-in",
    norm: "Art. 6 Abs. 1 lit. a und Art. 7 DSGVO, § 174 Abs. 3 TKG 2021, § 7 Abs. 2 Nr. 2 UWG (DE)",
    darf: "Genau der Zweck, für den eingewilligt wurde (Newsletter, Einladungen, Merkliste-/Planer-Erinnerung).",
    darfNicht: "Den Zweck erweitern ohne neue Einwilligung.",
    pflicht: [
      "Einwilligung je Zweck mit Textversion, Zeitpunkt, Quelle (PH Einwilligung)",
      "per Link bestätigt (Double-Opt-in), Bestätigungszeit gespeichert",
      "Widerruf jederzeit, Abmeldelink in jeder Mail (Fußzeile A)",
    ],
    werbungErlaubt: true,
  }),
});

export const KUERZEL = Object.freeze(Object.keys(GRUNDLAGEN));

// Zwecke einer Einwilligung (PH Einwilligung.zweck). Newsletter und Einladungen
// sind getrennt, damit jemand Einladungen behalten und den Newsletter abbestellen kann.
// "rueckmeldung" (QA Welle 2 P2-9): Bewertungsbitte nur mit eigener Einwilligung,
// bis die Kanzlei klärt, ob sie unter „ähnliche Produkte“ (B) fällt.
export const ZWECKE = Object.freeze(["newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung"]);

/** Nachweis, dass beim Kauf auf das Ablehnungsrecht hingewiesen wurde (§ 174 Abs. 4 Z 3 TKG). */
export function hatWiderspruchshinweis(kontakt = {}) {
  const h = kontakt.widerspruchshinweisBeiErhebung;
  return Boolean(h && String(h.datum ?? "").trim() && String(h.quelle ?? "").trim());
}

// Fußzeilen (mail.js): A = Einwilligung, B = Bestandskunde, V = Service.
export const FUSSZEILE_FUER = Object.freeze({ V: "V", B: "B", E: "A" });

/**
 * Regelprüfung einer Kundenreise. Liefert eine Liste von Fehlern (leer = ok).
 * Dieselben Regeln prüft die Frappe-App beim Speichern einer PH Kundenreise
 * (ph_kundenreise.py validate) und vor jedem Versand.
 */
export function pruefeReise(reise) {
  const f = [];
  const g = Array.isArray(reise?.rechtsgrundlage) ? reise.rechtsgrundlage : [];
  if (!g.length) f.push("keine Rechtsgrundlage");
  for (const k of g) if (!KUERZEL.includes(k)) f.push(`unbekannte Grundlage ${k}`);
  if (reise.werbung && g.includes("V")) f.push("Werbung kann nicht auf Vertrag/Service (V) gestützt werden");
  if (!reise.werbung && g.some((k) => k !== "V")) f.push("Service-Mail braucht nur V; B/E nur für Werbung");
  if (reise.werbung && !reise.abmeldelink) f.push("Werbung ohne Abmeldelink");
  if (g.includes("B")) {
    if (!reise.aehnlicheProdukte) f.push("B ohne Begründung 'eigene, ähnliche Produkte'");
    if (!reise.ecgAbgleich) f.push("B ohne ECG-Abgleich");
    if (reise.segment?.oderInteresse && !reise.bNurMitKauf) f.push("B mit Interessen-Segment: Interessenten nur über E (bNurMitKauf fehlt)");
  }
  if (reise.id === "bewertung" && g.some((k) => k !== "E")) f.push("Bewertungsbitte bis zur Klärung durch die Kanzlei nur mit Einwilligung (E)");
  if (g.includes("E")) {
    if (!ZWECKE.includes(reise.zweck)) f.push("E ohne gültigen Zweck");
  }
  if (reise.nurEinwilligung && g.some((k) => k !== "E")) f.push("Reise ist nur mit Einwilligung erlaubt");
  const text = JSON.stringify(reise?.vorlage ?? {});
  if (!reise.werbung && /gutschein|angebot|rabatt|neu im showroom|einladung/i.test(text)) {
    f.push("Service-Mail enthält Werbewörter (Gutschein/Angebot/Rabatt/Neu/Einladung)");
  }
  if (reise.id === "bewertung" && /gutschein|empfehl|gewinn|belohn/i.test(text)) {
    f.push("Bewertungsbitte darf keinen Anreiz und keine Empfehlung enthalten");
  }
  return f;
}

/**
 * Darf an diesen Kontakt jetzt gesendet werden? Spiegel von engine.py
 * darf_senden (für Tests und Doku). kontakt: { widerspruch, ecgListe,
 * nichtKontaktieren, reklamationOffen, anfrageOffen, einwilligungen:
 * { zweck: { doiBestaetigt: true, widerrufen: false } }, hatAuftrag,
 * widerspruchshinweisBeiErhebung: { datum, quelle }, gekaufteSegmente: ["outdoor", …],
 * werblicheMails30Tage }.
 * B gilt nur mit nachweisbarem Widerspruchshinweis bei der Erhebung; ohne ihn
 * → { ok:false, grund:"kein_widerspruchshinweis", ersatz:"brief" }. Verlangt
 * die Reise einen bestimmten Kauf (bNurMitKauf, z. B. Outdoor), gilt B nur
 * für Käufer dieses Segments; reines Interesse läuft nur über E.
 * @returns {{ ok: boolean, grundlage?: string, grund?: string }}
 */
export function darfSenden(reise, kontakt = {}) {
  if (kontakt.nichtKontaktieren && reise.werbung) return { ok: false, grund: "nicht_kontaktieren" };
  if (!reise.werbung) return { ok: true, grundlage: "V" };
  if (kontakt.reklamationOffen) return { ok: false, grund: "reklamation_offen" };
  if (kontakt.anfrageOffen && reise.id !== "bewertung") return { ok: false, grund: "anfrage_offen" };
  if ((kontakt.werblicheMails30Tage ?? 0) >= FREQUENZ.werblichPro30Tage) return { ok: false, grund: "frequenzgrenze" };
  const g = reise.rechtsgrundlage || [];
  const e = kontakt.einwilligungen?.[reise.zweck];
  if (g.includes("E") && e?.doiBestaetigt && !e?.widerrufen) return { ok: true, grundlage: "E" };
  if (g.includes("B") && kontakt.hatAuftrag && !kontakt.widerspruch && !kontakt.ecgListe) {
    if (reise.bNurMitKauf && !(kontakt.gekaufteSegmente || []).includes(reise.bNurMitKauf)) return { ok: false, grund: "b_ohne_passenden_kauf" };
    if (!hatWiderspruchshinweis(kontakt)) return { ok: false, grund: "kein_widerspruchshinweis", ersatz: "brief" };
    return { ok: true, grundlage: "B" };
  }
  return { ok: false, grund: "keine_grundlage" };
}

// Globale Regeln (crm-wiederkauf.md 3.1 „Globale Regeln“).
export const FREQUENZ = Object.freeze({
  werblichPro30Tage: 2, // Newsletter zählt mit
  gesamtPro7Tage: 3,
});
export const SPERRTAGE = Object.freeze(["12-24", "12-25", "12-26", "12-31", "01-01"]);
export const VERSANDFENSTER = Object.freeze({
  persoenlich: "Di–Do 09:00–11:00",
  newsletter: "erster Donnerstag im Monat, 18:00",
  zeitzone: "Europe/Vienna",
});
