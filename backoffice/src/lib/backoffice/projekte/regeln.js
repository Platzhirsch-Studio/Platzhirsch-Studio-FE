// Fachregeln ohne eigenes Modul (10-konzept-projekte.md § 7.5). Reines Modul.

/** Erlaubte Übergänge PH Fremdgewerk `status_setzen` – exakt wie der Controller. */
export const FREMDGEWERK_UEBERGAENGE = Object.freeze({
  Offen: ["Angefragt", "Geplant", "Abgesagt"],
  Angefragt: ["Geplant", "Offen", "Abgesagt"],
  Geplant: ["In Arbeit", "Angefragt", "Abgesagt"],
  "In Arbeit": ["Erledigt", "Geplant"],
  Erledigt: ["In Arbeit"],
  Abgesagt: ["Offen"],
});

export function fremdgewerkErlaubt(von, nach) {
  return (FREMDGEWERK_UEBERGAENGE[von] || []).includes(nach);
}

/** Konflikt Fremdgewerk ↔ Montage: Gewerk endet nach Montagebeginn (utils/montageplan.abhaengigkeit_konflikt). */
export function gewerkKonflikte(gewerke = [], montagen = []) {
  const out = [];
  for (const g of gewerke) {
    if (["Erledigt", "Abgesagt"].includes(g.status)) continue;
    const ende = String(g.termin_bis || g.termin_von || "").slice(0, 16);
    if (!ende) continue;
    for (const m of montagen) {
      if (m.projekt !== g.projekt || ["Abgebrochen", "Abgenommen", "Erledigt"].includes(m.status)) continue;
      const start = String(m.start || "").slice(0, 16);
      if (start && ende > start) out.push({ gewerk: g.name, montage: m.name, gewerkName: g.gewerk, ende, start });
    }
  }
  return out;
}

/** Prüfliste Referenz (§ 5.18) – die Server-Regeln der App als lesbare Zeilen. → [{ id, titel, ok }] */
export function referenzPruefung(ref, { andereAktiv = 0, projektFotos = [] } = {}) {
  const bilder = ref.bilder || [];
  const fotoIds = new Set(projektFotos.map((f) => f.name));
  const ortOk = !/\d{4,5}|straße|strasse|gasse|weg\s\d/i.test(ref.anzeige_ort || "");
  return [
    { id: "eine", titel: "Eine aktive Freigabe je Projekt", ok: andereAktiv === 0 },
    { id: "vorname", titel: "Nur Vorname", ok: ref.anzeige_art === "anonym" || !/\s\S+\s\S+/.test(` ${ref.anzeige_vorname || ""}`) },
    { id: "ort", titel: "Ort ohne Straße/PLZ", ok: ortOk },
    { id: "titel", titel: "Titel ohne Adresse", ok: !/\d|straße|strasse|gasse/i.test(ref.titel || "") },
    { id: "anzahl", titel: "1–12 Fotos", ok: bilder.length >= 1 && bilder.length <= 12 },
    { id: "skizze", titel: "Keine Handskizze und kein Modell", ok: !bilder.some((b) => ["skizze", "modell"].includes(b.phase)) },
    { id: "projekt", titel: "Fotos gehören zum Projekt", ok: bilder.every((b) => !fotoIds.size || fotoIds.has(b.foto)) },
    { id: "text", titel: "Einwilligungstext freigegeben", ok: ref.einwilligung_textstatus === "freigegeben" },
  ];
}

/** Prüfliste PA8 „Projekt abschließen“ (§ 6.8). Jede Zeile { id, titel, ok, href? }. */
export function abschlussPruefliste(m) {
  const enc = encodeURIComponent;
  const p = m.projekt || {};
  const abn = m.abnahmen || [];
  const mon = m.montagen || [];
  const pos = (m.positionen || []).filter((x) => x.lieferstatus !== "storniert");
  const z = [];
  z.push({ id: "abnahmen", titel: "Alle Abnahmen abgeschlossen, keine offenen Mängel", ok: abn.length > 0 && abn.every((a) => a.status === "Abgeschlossen"), href: abn[0] ? `/projekte/abnahmen/${enc(abn[0].name)}` : null });
  z.push({ id: "montagen", titel: "Alle Montageaufträge abgenommen oder abgebrochen", ok: mon.every((x) => ["Abgenommen", "Abgebrochen"].includes(x.status)), href: `/projekte/${enc(p.name)}?tab=montage` });
  z.push({ id: "gewerke", titel: "Fremdgewerk-Abnahmen erledigt", ok: (m.gewerke || []).every((g) => g.status === "Abgesagt" || ["abgenommen"].includes(g.abnahme_status) || Number(g.vertrag_direkt_kunde)), href: "/projekte/fremdgewerke" });
  z.push({ id: "nachtraege", titel: "Nachträge entschieden und in die AB übernommen", ok: (m.nachtraege || []).every((n) => ["Abgelehnt", "Storniert"].includes(n.status) || (n.status === "Freigegeben" && Number(n.uebernommen))), href: `/projekte/${enc(p.name)}?tab=positionen` });
  const schluss = (m.rechnungen || []).find((r) => r.art === "Schlussrechnung" && r.status !== "Storniert");
  z.push({ id: "schlussrechnung", titel: "Schlussrechnung gestellt und bezahlt", ok: !!schluss && schluss.status === "Bezahlt", href: `/projekte/${enc(p.name)}?tab=belege`, hinweis: m.bezug?.rechnungen && m.bezug.rechnungen !== "ok" ? "Belege in Faktura prüfen" : "" });
  z.push({ id: "produktpaesse", titel: "Produktpässe für gelieferte Positionen", ok: pos.filter((x) => ["geliefert", "montiert"].includes(x.lieferstatus)).every((x) => x.produktpass), href: `/projekte/${enc(p.name)}?tab=montage` });
  z.push({ id: "rueckmeldungen", titel: "Rückmeldungen beantwortet", ok: !(m.feedback_offen || []).length && !(m.nachrichten || []).some((n) => n.richtung === "eingehend" && n.status === "Ungelesen"), href: `/projekte/rueckmeldungen?projekt=${enc(p.name)}` });
  z.push({ id: "aufgaben", titel: "Aufgaben erledigt oder verworfen", ok: !(m.aufgaben || []).some((a) => ["Offen", "In Arbeit"].includes(a.status)), href: "/projekte/aufgaben" });
  z.push({ id: "zeiten", titel: "Abrechenbare Zeiten abgerechnet", ok: !(m.zeiten || []).some((t) => Number(t.abrechenbar) && t.status === "Offen"), href: "/projekte/zeiten" });
  return z;
}
