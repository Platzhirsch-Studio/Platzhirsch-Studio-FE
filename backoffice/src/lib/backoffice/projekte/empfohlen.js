// „Empfohlen“ – Regeltabelle (10-konzept-projekte.md § 4.3). Erste zutreffende Regel = Primäraktion mit
// Begründungszeile; alle zutreffenden stehen in der Karte „Empfohlen“. Reines Modul (unit-getestet).
//
// Aktion: { art: "workflow", aktion } (verzögerter Commit) · { art: "link", href } · { art: "sheet", sheet }
//         · null (nur Hinweis). `nurLeitung` → für Mitarbeiter nur Hinweis-Text `stattdessen`.

import { istErledigt, offeneAbnahmeMaengel } from "./maengel.js";
import { rueckmeldungen } from "./zaehler.js";

const ISO = (d) => String(d || "").slice(0, 10);

/**
 * @param {object} m   Mappe (siehe daten.js `ladeMappe`)
 * @param {{heute:string, leitung?:boolean, erinnerungTage?:number}} ctx
 * @returns {Array<{id:string, titel:string, weil:string, aktion:object|null, nurLeitung?:boolean, stattdessen?:string, hinweis?:boolean}>}
 */
export function empfehlungen(m, { heute, leitung = false, erinnerungTage = 3 } = {}) {
  const p = m?.projekt || {};
  const r = [];
  const add = (e) => r.push(e);
  const name = p.name;
  const planungen = m.planungen || [];
  const renderings = m.renderings || [];
  const montagen = (m.montagen || []).filter((x) => x.status !== "Abgebrochen");
  const abnahmen = m.abnahmen || [];
  const nachtraege = m.nachtraege || [];
  const pos = (m.positionen || []).filter((x) => x.lieferstatus !== "storniert");
  const eigen = pos.filter((x) => !x.montage_art || x.montage_art === "Eigenmontage");
  const rueck = rueckmeldungen({ feedback: m.feedback_offen || [], nachrichten: m.nachrichten || [], nachtraege, planungen }, { heute, erinnerungTage });

  switch (p.status) {
    case "Anfrage": {
      const termine = (m.termine || []).filter((t) => t.status !== "Abgesagt");
      const vorbei = termine.some((t) => ISO(t.start) < heute);
      if (!termine.length) add({ id: "termin", titel: "Termin vereinbaren", weil: "noch kein Beratungstermin", aktion: { art: "link", href: `/crm?projekt=${encodeURIComponent(name)}` } });
      else if (vorbei) add({ id: "planung-starten", titel: "Planung starten", weil: "der Beratungstermin hat stattgefunden", aktion: { art: "workflow", aktion: "Planung starten" } });
      else add({ id: "planung-starten", titel: "Planung starten", weil: "Beratung ist vereinbart", aktion: { art: "workflow", aktion: "Planung starten" } });
      break;
    }
    case "Planung": {
      const kuecheBad = p.projektart === "Kueche" || p.projektart === "Bad";
      const aufmassGeprueft = (m.aufmasse || []).some((a) => a.status === "Geprueft");
      const aenderung = planungen.find((x) => x.status === "Aenderung gewuenscht" || x.kunde_entscheidung === "aenderung");
      const entwurf = planungen.find((x) => x.status === "Entwurf");
      const renderEntwurf = renderings.find((x) => x.status === "Entwurf" && x.bild);
      const freigegeben = planungen.some((x) => x.status === "Freigegeben") || renderings.some((x) => x.status === "Freigegeben");
      if (freigegeben) add({ id: "angebot", titel: "Angebot erstellen", weil: "eine Planung ist freigegeben", aktion: { art: "workflow", aktion: "Angebot erstellen" } });
      if (rueck.length) {
        const alt = Math.max(...rueck.map((e) => e.alterTage || 0));
        add({ id: "rueckmeldungen", titel: `Rückmeldungen beantworten (${rueck.length})`, weil: alt > erinnerungTage ? `älteste wartet seit ${alt} Tagen` : "der Kunde hat sich gemeldet", aktion: { art: "link", href: `/projekte/rueckmeldungen?projekt=${encodeURIComponent(name)}` } });
      }
      if (aenderung) add({ id: "neue-version", titel: "Neue Version", weil: aenderung.kunde_kommentar ? `Kunde wünscht: „${aenderung.kunde_kommentar}“` : "der Kunde wünscht eine Änderung", aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}/planung/${encodeURIComponent(aenderung.name)}` } });
      if (kuecheBad && !aufmassGeprueft) add({ id: "aufmass", titel: "Aufmaß erfassen", weil: "ohne geprüftes Aufmaß keine Planung", aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}?tab=planung` } });
      if (!planungen.length) add({ id: "planung-hochladen", titel: "Planung hochladen", weil: "noch keine Planung", aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}?tab=planung` } });
      if (entwurf) add({ id: "planung-vorlegen", titel: "Planung vorlegen", weil: `„${entwurf.titel || entwurf.bezeichnung}“ ist ein Entwurf`, aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}/planung/${encodeURIComponent(entwurf.name)}` } });
      if (renderEntwurf) add({ id: "rendering-vorlegen", titel: "Rendering vorlegen", weil: `Variante ${renderEntwurf.variante || ""} hat ein Bild`.trim(), aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}/renderings/${encodeURIComponent(renderEntwurf.name)}` } });
      break;
    }
    case "Angebot": {
      const ab = (m.auftraege || []).find((a) => a.status !== "Storniert" && a.docstatus !== 2);
      if (ab) add({ id: "beauftragen", titel: "Beauftragen", weil: `Auftragsbestätigung ${ab.name} liegt vor`, aktion: { art: "workflow", aktion: "Beauftragen" }, nurLeitung: true, stattdessen: "AB vorhanden – wartet auf Beauftragung durch Leitung" });
      else if ((m.angebote || []).length) {
        const a = m.angebote[0];
        const tage = a.datum ? Math.max(0, Math.round((new Date(`${heute}T12:00:00`) - new Date(`${ISO(a.datum)}T12:00:00`)) / 86400000)) : 0;
        add({ id: "angebot-offen", titel: "Angebot nachfassen", weil: `Angebot seit ${tage} Tagen offen`, aktion: null, hinweis: true });
      } else add({ id: "angebot-faktura", titel: "Angebot in Faktura erstellen", weil: "noch kein Angebot zu diesem Projekt", aktion: { art: "link", href: `/faktura?projekt=${encodeURIComponent(name)}` } });
      break;
    }
    case "Auftrag": {
      const ab = (m.auftraege || []).find((a) => a.status !== "Storniert");
      if (ab?.fagg_frist_ende && ISO(ab.fagg_frist_ende) >= heute) add({ id: "fagg", titel: `Rücktrittsfrist bis ${deutsch(ab.fagg_frist_ende)}`, weil: "Bestellung nur bei Maßanfertigung oder ausdrücklichem Verlangen des Kunden", aktion: null, hinweis: true });
      const anzahlungOffen = ab && Number(ab.anzahlung_soll_cent) > 0 && Number(ab.anzahlung_ist_cent || 0) < Number(ab.anzahlung_soll_cent);
      if (anzahlungOffen) add({ id: "anzahlung", titel: "Anzahlung offen", weil: "Bestellung nach Zahlung", aktion: null, hinweis: true });
      add({ id: "bestellen", titel: "Bestellen", weil: "der Auftrag ist erteilt", aktion: { art: "workflow", aktion: "Bestellen" } });
      break;
    }
    case "Bestellung": {
      const ohneTermin = pos.filter((x) => x.lieferstatus === "bestellt" && !x.liefertermin).length;
      if (ohneTermin) add({ id: "ohne-termin", titel: ohneTermin === 1 ? "1 Bestellung ohne bestätigten Termin" : `${ohneTermin} Bestellungen ohne bestätigten Termin`, weil: "Hersteller haben noch nicht bestätigt", aktion: null, hinweis: true });
      break;
    }
    case "Lieferung": {
      const fehlt = eigen.filter((x) => !["geliefert", "montiert"].includes(x.lieferstatus));
      if (!montagen.length && !fehlt.length && eigen.length) add({ id: "montage-planen", titel: "Montage planen", weil: `${eigen.length} Positionen geliefert, noch keine Montage`, aktion: { art: "sheet", sheet: "montage-planen" } });
      else if (!montagen.length && fehlt.length) add({ id: "teilmontage", titel: "Teilmontage planen", weil: `${fehlt.length} Positionen fehlen noch`, aktion: { art: "sheet", sheet: "montage-planen" } });
      else if (!montagen.length) add({ id: "montage-planen", titel: "Montage planen", weil: "noch keine Montage", aktion: { art: "sheet", sheet: "montage-planen" } });
      break;
    }
    case "Montage": {
      const fertig = montagen.find((x) => x.status === "Erledigt");
      if (fertig && !abnahmen.length) add({ id: "abnahme", titel: "Abnahme mit Kunde", weil: `Montage ${fertig.name} ist fertig`, aktion: { art: "link", href: `/projekte/montagen/${encodeURIComponent(fertig.name)}?ablauf=abnahme` } });
      break;
    }
    case "Uebergabe": {
      const mitMaengeln = abnahmen.find((a) => a.status === "Mit Maengeln");
      if (mitMaengeln) {
        const n = mitMaengeln.maengel_offen ?? offeneAbnahmeMaengel(mitMaengeln);
        add({ id: "maengel", titel: "Mängel bearbeiten", weil: `${n === 1 ? "1 offener Mangel" : `${n} offene Mängel`}`, aktion: { art: "link", href: `/projekte/abnahmen/${encodeURIComponent(mitMaengeln.name)}` } });
      }
      const schluss = (m.rechnungen || []).some((x) => x.art === "Schlussrechnung" && x.status !== "Storniert");
      if (!schluss) add({ id: "schlussrechnung", titel: "Schlussrechnung stellen", weil: "die Abnahme ist unterzeichnet", aktion: { art: "link", href: `/faktura?projekt=${encodeURIComponent(name)}` } });
      const ohnePass = pos.filter((x) => ["geliefert", "montiert"].includes(x.lieferstatus) && !x.produktpass).length;
      if (ohnePass) add({ id: "produktpaesse", titel: "Produktpässe erzeugen", weil: `${ohnePass} gelieferte Positionen ohne Produktpass`, aktion: { art: "sheet", sheet: "produktpaesse" } });
      if (!mitMaengeln) add({ id: "abschliessen", titel: "Abschließen", weil: "Prüfliste durchgehen", aktion: { art: "sheet", sheet: "abschliessen" }, nurLeitung: true, stattdessen: "Bereit zum Abschluss – Leitung informiert" });
      break;
    }
    case "Abgeschlossen": {
      if (!(m.referenzen || []).length) add({ id: "referenz", titel: "Referenz anregen", weil: "das Projekt ist abgeschlossen", aktion: null, hinweis: true });
      break;
    }
    default:
      break;
  }

  // Nachträge (Auftrag … Montage)
  if (["Auftrag", "Bestellung", "Lieferung", "Montage"].includes(p.status)) {
    for (const n of nachtraege) {
      if (n.status === "Vorgelegt" && n.freigabe_frist && ISO(n.freigabe_frist) < heute) add({ id: `nachtrag-${n.name}`, titel: "Nachtrag nachfassen", weil: `Nachtrag ${n.bezeichnung || n.name} wartet seit ${deutsch(n.vorgelegt_am)}`, aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}/nachtraege/${encodeURIComponent(n.name)}` } });
      if (n.status === "Freigegeben" && !Number(n.uebernommen)) add({ id: `ab-${n.name}`, titel: "AB anpassen", weil: "Nachtrag freigegeben – AB noch nicht angepasst", aktion: { art: "link", href: `/projekte/${encodeURIComponent(name)}/nachtraege/${encodeURIComponent(n.name)}` } });
    }
  }
  // Mängel aus Montage (alle laufenden Phasen)
  const offeneMontageMaengel = montagen.reduce((s, x) => s + (x.maengel || []).filter((z) => !istErledigt(z.status)).length, 0);
  if (offeneMontageMaengel && p.status !== "Uebergabe") add({ id: "montage-maengel", titel: "Mängel bearbeiten", weil: `${offeneMontageMaengel} offene Montage-Mängel`, aktion: { art: "link", href: `/projekte/maengel?projekt=${encodeURIComponent(name)}` } });

  // Leitungsregeln für Mitarbeiter in Hinweise umwandeln
  return r.map((e) => (e.nurLeitung && !leitung ? { ...e, titel: e.stattdessen || e.titel, aktion: null, hinweis: true } : e));
}

/** Primär = erste Regel mit Aktion. */
export function primaerEmpfehlung(liste = []) {
  return liste.find((e) => e.aktion) || null;
}

function deutsch(d) {
  const s = ISO(d);
  if (!s) return "";
  const [j, mo, t] = s.split("-");
  return `${t}.${mo}.${j}`;
}
