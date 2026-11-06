// Montage-Regeln (10-konzept-projekte.md § 5.8, § 6.2, § 7.3). Reines Modul.

/** Leistungsregel § 6.2: nur gelieferte/teilgelieferte Positionen mit Eigenmontage (oder ohne Angabe), nie storniert. */
export function leistungenAusPositionen(positionen = []) {
  const montierbar = [];
  const fehlend = [];
  for (const p of positionen) {
    const art = p.montage_art || "";
    if (art !== "" && art !== "Eigenmontage") continue;
    if (p.lieferstatus === "storniert") continue;
    if (p.lieferstatus === "geliefert" || p.lieferstatus === "teilgeliefert") {
      montierbar.push({ beschreibung: [p.bezeichnung, p.raum].filter(Boolean).join(" · "), position: p.name || p.pos_nr || "", dauer_h_geplant: 0, erledigt: 0 });
    } else if (p.lieferstatus !== "montiert") {
      fehlend.push({ bezeichnung: p.bezeichnung, liefertermin: p.liefertermin || p.nachlieferung_termin || "", lieferstatus: p.lieferstatus || "offen" });
    }
  }
  return { montierbar, fehlend };
}

/** Montagezeitraum fürs Projekt aus Min/Max der nicht abgebrochenen Aufträge (A19b). */
export function montageZeitraum(montagen = []) {
  const aktiv = montagen.filter((m) => m.status !== "Abgebrochen" && m.start);
  if (!aktiv.length) return null;
  const starts = aktiv.map((m) => String(m.start).slice(0, 10)).sort();
  const enden = aktiv.map((m) => String(m.ende || m.start).slice(0, 10)).sort();
  return { von: starts[0], bis: enden[enden.length - 1] };
}

/** Stunden eines Auftrags (geplant oder aus start/ende). */
export function stundenVon(m) {
  if (Number(m.stunden_geplant) > 0) return Number(m.stunden_geplant);
  if (!m.start || !m.ende) return 0;
  const a = new Date(String(m.start).replace(" ", "T"));
  const b = new Date(String(m.ende).replace(" ", "T"));
  const h = (b - a) / 3600000;
  return h > 0 && h <= 24 ? Math.round(h * 4) / 4 : 0;
}

/**
 * Kapazität je Tag (§ 5.8): Summe stunden_geplant ÷ (Monteure verfügbar × montage_tagesstunden).
 * @returns {Array<{tag:string, ist:number, soll:number, prozent:number, ueber:boolean}>}
 */
export function kapazitaet(montagen = [], tage = [], { monteure = 2, tagesstunden = 8 } = {}) {
  const soll = Math.max(0, Number(monteure) || 0) * Math.max(0, Number(tagesstunden) || 0);
  return tage.map((tag) => {
    const ist = montagen.filter((m) => m.status !== "Abgebrochen" && String(m.start || "").slice(0, 10) === tag).reduce((s, m) => s + stundenVon(m) * Math.max(1, (m.team || []).length || 1), 0);
    const prozent = soll ? Math.round((ist / soll) * 100) : 0;
    return { tag, ist, soll, prozent, ueber: soll > 0 && ist > soll };
  });
}

/** Doppelbuchungen: Person in zwei Aufträgen mit überlappender Zeit. → [{user, a, b}] */
export function doppelbuchungen(montagen = []) {
  const out = [];
  const aktiv = montagen.filter((m) => m.status !== "Abgebrochen" && m.start);
  const zeit = (m) => [new Date(String(m.start).replace(" ", "T")).getTime(), new Date(String(m.ende || m.start).replace(" ", "T")).getTime() || 0];
  for (let i = 0; i < aktiv.length; i++) {
    for (let j = i + 1; j < aktiv.length; j++) {
      const a = aktiv[i];
      const b = aktiv[j];
      const [as, ae] = zeit(a);
      const [bs, be] = zeit(b);
      if (!(as < Math.max(be, bs + 1) && bs < Math.max(ae, as + 1))) continue;
      const pa = new Set([a.montageleiter, ...(a.team || []).map((t) => t.user)].filter(Boolean));
      for (const u of new Set([b.montageleiter, ...(b.team || []).map((t) => t.user)].filter(Boolean))) if (pa.has(u)) out.push({ user: u, a: a.name, b: b.name });
    }
  }
  return out;
}

/** Erlaubte Kiosk-Wörter je Status (Wortliste § 8.1). Aktion = Workflow-Aktion. */
export function kioskZustandsknopf(status) {
  switch (status) {
    case "Geplant":
      return { aktion: "Losfahren", wort: "Losfahren" };
    case "Unterwegs":
      return { aktion: "Beginnen", wort: "Beginnen" };
    case "In Arbeit":
      return { aktion: "Erledigt melden", wort: "Fertig" };
    case "Erledigt":
      return { aktion: null, wort: "Abnahme mit Kunde" };
    default:
      return null;
  }
}
