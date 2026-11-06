"""Projektnachkalkulation (Frappe-Teil): Daten sammeln → utils.kalkulation.kalkulation_v2, Cache am Projekt,
Budget vorbelegen/einfrieren, Warnungen, Snapshot bei Abschluss, Protokoll.

Quellen (fremde Apps nur, wenn installiert – ph_faktura, ph_logistik, ph_kassa, ph_service sind keine required_apps):
  Ist     PH Eingangsrechnung Zuordnung (ph_faktura, maßgeblich; Gutschriften negativ; Abgelehnt zählt nicht)
          Altbestand: ER mit Kopf-Projekt ohne Zuordnungszeilen (Hinweis „nicht zugeordnet“)
          PH Lagerbewegung Verkauf/Ausbuchung mit Bezug Projekt × Einstandswert (ph_logistik); Kommissionsware des
            Projekts zählt nicht (kommt über Herstellerbestellung/ER)
          PH Projektzeit × Kostensatz zum Leistungsdatum (PH Projekte Einstellungen.kostensaetze)
          PH Kassenbuch „Barausgabe“ mit Projektnummer im Grund (ph_kassa) → Material
          PH Servicefall Kosten (ohne verknüpfte ER) → nach Übergabe „Nachlauf“, sonst „Sonstiges“;
            PH Lieferantenregress erhalten (ohne ER-Gutschrift) → Nachlauf negativ
  Obligo  PH Herstellerbestellung (Bezug Projekt oder Kommission) AB-Wert, PH Speditionsauftrag Preis,
          PH Fremdgewerk kosten_cent (beauftragt, nicht Vertrag direkt mit Kunde) – je minus zugeordnete ER
  Erlös   PH Auftragsbestaetigung netto + freigegebene Nachträge bzw. PH Rechnung netto (ohne Anzahlungsrechnung),
          − PH Gutschrift, − gewährte Skonti, + Kassa-Verkäufe zum Auftrag ohne Rechnung
"""

import json
import re

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime, nowdate

from ph_projekte.utils import kalkulation as kalk

LEITUNG = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"}
LAUFEND = ("Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe")
# (Kostenart, Bezeichnung, DB-Stufe, Reihenfolge, zeitbasiert, Beschreibung) – Katalog laut Inhaber-Wunsch 04.11.
KOSTENARTEN_STANDARD = [
    ("Ware", "Ware (Wareneinsatz)", "DB1", 10, 0, "Einkauf Ware je Projekt (Herstellerbestellungen, Lieferantenrechnungen, Lagerentnahmen)."),
    ("Fracht", "Fracht/Spedition", "DB1", 20, 0, "Fracht der Ware: Spediteur, Paket, Zustellung."),
    ("Montage eigen", "Montage eigen (Zeit)", "DB2", 30, 1, "Eigene Montage- und Fahrzeiten × Kostensatz."),
    ("Montage extern", "Montage extern", "DB2", 40, 0, "Fremdmonteure, Subunternehmer Montage."),
    ("Fremdgewerk", "Fremdgewerk", "DB2", 50, 0, "Tischler, Elektriker, Installateur, Steinmetz … (über das Studio beauftragt)."),
    ("Material", "Material/Kleinteile", "DB2", 60, 0, "Befestigung, Silikon, Kleinteile, Kassa-Barausgaben."),
    ("Entsorgung", "Entsorgung", "DB2", 70, 0, "Verpackung, Altmöbel, Container."),
    ("Sonstiges", "Sonstiges", "DB2", 80, 0, "Alles andere Projektbezogene."),
    ("Planung extern", "Planung extern", "DB3", 90, 0, "Externe Planer, Statik, Visualisierung."),
    ("Planung intern", "Planung/Beratung/Projektleitung (Zeit)", "DB3", 100, 1, "Eigene Planungs-, Beratungs-, Aufmaß- und Koordinationszeiten × Kostensatz."),
    ("Nachlauf", "Nachlaufkosten (Service/Gewährleistung)", "DB3", 110, 0, "Kosten nach Übergabe aus Servicefällen, abzüglich Regress-Gutschriften."),
]
TAETIGKEITEN_PLATZHALTER = ("Montage", "Fahrt", "Planung", "Beratung", "Projektleitung", "Aufmass", "Service")


# ── Hilfen ──────────────────────────────────────────────────────────────────────────────────────

def darf_sehen(user=None):
    return bool(LEITUNG & set(frappe.get_roles(user)))


def pruefe_leitung():
    if not darf_sehen():
        frappe.throw(_("Die Kalkulation sieht nur die Leitung."), frappe.PermissionError)


def _da(doctype):
    return bool(frappe.db.exists("DocType", doctype))


def _hat(doctype, feld):
    try:
        return frappe.get_meta(doctype).has_field(feld)
    except Exception:  # noqa: BLE001
        return False


def form_link(doctype, name):
    return f"/app/{frappe.scrub(doctype).replace('_', '-')}/{name}" if doctype and name else None


def protokoll(bereich, referenz_doctype, referenz_name, feld, alt, neu, begruendung=None, projekt=None):
    """PH Kalkulation Protokoll: wer, wann, alt → neu. Nie werfen."""
    try:
        def txt(v):
            return v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, default=str)

        frappe.get_doc({
            "doctype": "PH Kalkulation Protokoll", "zeitpunkt": now_datetime(), "user": frappe.session.user, "bereich": bereich,
            "referenz_doctype": referenz_doctype, "referenz_name": referenz_name, "projekt": projekt, "feld": (feld or "")[:140],
            "alt": txt(alt), "neu": txt(neu), "begruendung": begruendung,
        }).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Kalkulation Protokoll")


def kostenarten_anlegen():
    """Standard-Kostenarten (idempotent, bestehende werden nicht verändert)."""
    for ka, bez, stufe, reihe, zeit, beschr in KOSTENARTEN_STANDARD:
        if not frappe.db.exists("PH Kostenart", ka):
            frappe.get_doc({"doctype": "PH Kostenart", "kostenart": ka, "bezeichnung": bez, "db_stufe": stufe, "reihenfolge": reihe,
                            "zeitbasiert": zeit, "aktiv": 1, "beschreibung": beschr}).insert(ignore_permissions=True)


def platzhalter_anlegen():
    """Vorbelegung als markierte Platzhalter: Kostensätze 0 €/h je Tätigkeit (Ziel-DB bleibt leer = keine Ampel)."""
    e = frappe.get_single("PH Projekte Einstellungen")
    if e.get("kostensaetze"):
        return
    for t in TAETIGKEITEN_PLATZHALTER:
        e.append("kostensaetze", {"taetigkeit": t, "satz_cent": 0, "gueltig_ab": "2026-01-01", "platzhalter": 1, "notiz": _("Platzhalter – Satz vom Inhaber offen (90-inhaber-fragen.md)")})
    e.flags.ph_system = True
    e.save(ignore_permissions=True)


def projektarten():
    try:
        return [x for x in (frappe.get_meta("PH Projekt").get_field("projektart").options or "").split("\n") if x]
    except Exception:  # noqa: BLE001
        return []


def _null(v):
    return flt(v) if flt(v) else None


def einstellungen_daten():
    """Kalkulationsparameter aus PH Projekte Einstellungen (0 in Ziel/Schwellen-Zeilen = nicht gesetzt)."""
    e = frappe.get_single("PH Projekte Einstellungen")
    saetze = [z.as_dict() for z in e.get("kostensaetze") or []]
    alt_satz = cint(e.get("montage_kostensatz_cent"))
    if alt_satz and not any(cint(z.get("satz_cent")) for z in saetze if z.get("taetigkeit") in ("Montage", "Fahrt")):
        # Rückfall auf den bisherigen Einzelsatz (Kalkulation v1), bis Sätze gepflegt sind
        saetze += [{"taetigkeit": t, "satz_cent": alt_satz, "gueltig_ab": "2000-01-01"} for t in ("Montage", "Fahrt")]
    ziel = []
    for z in e.get("ziel_db") or []:
        d = z.as_dict()
        for f in ("ziel_db1", "ziel_db2", "ziel_db3", "ampel_rot_unter", "budget_gelb", "budget_rot"):
            d[f] = _null(d.get(f))
        d["ampel_gelb_unter"] = flt(d.get("ampel_gelb_unter")) if d.get("ampel_gelb_unter") else None
        ziel.append(d)
    return {
        "kostensaetze": saetze, "ziel_db": ziel, "gemeinkosten": [z.as_dict() for z in e.get("gemeinkosten_regeln") or []],
        "budget_gelb": flt(e.get("budget_gelb_prozent")) or 90.0, "budget_rot": flt(e.get("budget_rot_prozent")) or 100.0,
        "ampel_gelb_unter": flt(e.get("ampel_gelb_unter")), "ampel_rot_unter": flt(e.get("ampel_rot_unter")) or 5.0,
        "schwelle_prozent": flt(e.get("abweichung_kommentar_prozent")) or 10.0,
        "warnung_aktiv": cint(e.get("kalkulation_warnung_aktiv")), "budget_vorbelegen": cint(e.get("budget_bei_auftrag_vorbelegen")),
        "richtwerte": {r.kategorie: cint(r.minuten_je_stueck) for r in e.get("montage_richtwerte") or [] if r.kategorie},
        "standard_min": cint(e.get("montage_standard_min")),
    }


def eingerichtet(e=None):
    e = e or frappe.get_single("PH Projekte Einstellungen")
    satz = any(cint(z.satz_cent) > 0 for z in e.get("kostensaetze") or [])
    ziel = any(flt(z.ziel_db1) or flt(z.ziel_db2) or flt(z.ziel_db3) for z in e.get("ziel_db") or [])
    return bool(satz and ziel)


def abweichung_von(p):
    return {"aktiv": cint(p.get("kalk_abweichung_aktiv")), "ziel_db1": _null(p.get("kalk_ziel_db1")), "ziel_db2": _null(p.get("kalk_ziel_db2")),
            "ziel_db3": _null(p.get("kalk_ziel_db3")), "gemeinkosten_art": p.get("kalk_gemeinkosten_art"),
            "gemeinkosten_prozent": p.get("kalk_gemeinkosten_prozent"), "gemeinkosten_je_h_cent": p.get("kalk_gemeinkosten_je_h_cent")}


# ── Datensammlung ───────────────────────────────────────────────────────────────────────────────

def _ab_namen(projekt):
    if not _da("PH Auftragsbestaetigung"):
        return []
    return frappe.get_all("PH Auftragsbestaetigung", filters={"projekt": projekt, "status": ("!=", "Storniert")}, pluck="name")


def erloes_daten(p):
    d = {"auftrag_netto_cent": 0, "nachtraege_cent": 0, "rechnungen": [], "gutschriften_netto_cent": 0, "skonto_gewaehrt_cent": 0, "kassa_netto_cent": 0}
    quellen = []
    abs_ = []
    if _da("PH Auftragsbestaetigung"):
        for ab in frappe.get_all("PH Auftragsbestaetigung", filters={"projekt": p.name, "status": ("!=", "Storniert")}, fields=["name", "netto_cent", "datum"]):
            d["auftrag_netto_cent"] += cint(ab.netto_cent)
            abs_.append(ab.name)
            quellen.append({"typ": "erloes", "quelle_doctype": "PH Auftragsbestaetigung", "quelle_name": ab.name, "betrag_cent": cint(ab.netto_cent), "datum": str(ab.datum or "")})
    if not abs_:
        # Ohne AB (Faktura nicht installiert/noch kein Auftrag): Verkaufswert der Projektpositionen (inkl. übernommener Nachträge)
        d["auftrag_netto_cent"] = sum(cint(z.preis_cent) * max(cint(z.menge), 1) for z in p.positionen if (z.lieferstatus or "") != "storniert")
    else:
        d["nachtraege_cent"] = cint(frappe.db.get_value("PH Nachtrag", {"projekt": p.name, "status": "Freigegeben"}, "sum(differenz_cent)") or 0)
    if _da("PH Rechnung"):
        rn = frappe.get_all("PH Rechnung", filters={"projekt": p.name}, fields=["name", "art", "status", "netto_cent", "brutto_cent", "skonto_cent", "bezahlt_cent", "zahlbar_cent", "datum"])
        for r in rn:
            d["rechnungen"].append({"art": r.art, "status": r.status, "netto_cent": cint(r.netto_cent)})
            if r.status == "Bezahlt" and cint(r.skonto_cent) and cint(r.bezahlt_cent) < cint(r.zahlbar_cent) and cint(r.brutto_cent):
                diff = min(cint(r.skonto_cent), cint(r.zahlbar_cent) - cint(r.bezahlt_cent))
                d["skonto_gewaehrt_cent"] += int(round(diff * cint(r.netto_cent) / cint(r.brutto_cent)))
            if r.status not in ("Entwurf", "Storniert") and r.art != "Anzahlungsrechnung":
                quellen.append({"typ": "erloes", "quelle_doctype": "PH Rechnung", "quelle_name": r.name, "betrag_cent": cint(r.netto_cent), "datum": str(r.datum or ""), "text": r.art})
        if _da("PH Gutschrift"):
            gs = {}
            for filt in ({"rechnung": ("in", [r.name for r in rn] or ["-"])}, {"auftrag": ("in", abs_ or ["-"])}):
                for g in frappe.get_all("PH Gutschrift", filters=filt, fields=["name", "netto_cent", "status", "datum"]):
                    gs[g.name] = g
            for g in gs.values():
                if g.status == "Entwurf":
                    continue
                d["gutschriften_netto_cent"] += abs(cint(g.netto_cent))
                quellen.append({"typ": "erloes", "quelle_doctype": "PH Gutschrift", "quelle_name": g.name, "betrag_cent": -abs(cint(g.netto_cent)), "datum": str(g.datum or "")})
    if abs_ and _da("PH Kassenbeleg"):
        for kb in frappe.get_all("PH Kassenbeleg", filters={"auftrag": ("in", abs_), "status": ("in", ("Signiert", "Nachsigniert", "Ausfall")), "trainings": 0}, fields=["name", "rechnung", "barverkauf_rechnung", "datum_uhrzeit"]):
            if kb.rechnung or kb.barverkauf_rechnung:
                continue
            netto = cint(frappe.db.get_value("PH Kassenbeleg Position", {"parent": kb.name, "parenttype": "PH Kassenbeleg", "art": ("in", ("Artikel", "Freitext", "Rabatt"))}, "sum(netto_cent)") or 0)
            if netto:
                d["kassa_netto_cent"] += netto
                quellen.append({"typ": "erloes", "quelle_doctype": "PH Kassenbeleg", "quelle_name": kb.name, "betrag_cent": netto, "datum": str(kb.datum_uhrzeit or "")[:10]})
    return d, quellen


def er_daten(p, hinweise):
    """Ist aus zugeordneten Eingangsrechnungen + bereits verrechnete Beträge je Bezug (gegen Doppelzählung mit Obligo)."""
    ist, verrechnet, vollstaendig = [], {}, set()
    if not _da("PH Eingangsrechnung"):
        return ist, verrechnet, vollstaendig
    felder = ["name", "status", "belegart", "datum", "lieferant_name", "rechnungsnummer_lieferant", "herstellerbestellung", "netto_cent", "brutto_cent", "ust_fall", "projekt"]
    if _hat("PH Eingangsrechnung", "bestellung_vollstaendig_berechnet"):
        felder.append("bestellung_vollstaendig_berechnet")
    zeilen, parents = [], set()
    if _da("PH Eingangsrechnung Zuordnung"):
        zeilen = frappe.get_all("PH Eingangsrechnung Zuordnung", filters={"projekt": p.name, "parenttype": "PH Eingangsrechnung"},
                                fields=["parent", "kostenart", "betrag_cent", "bezug_doctype", "bezug_name", "bemerkung"])
        parents = {z.parent for z in zeilen}
    kopf = {x.name: x for x in frappe.get_all("PH Eingangsrechnung", filters={"name": ("in", list(parents))}, fields=felder)} if parents else {}

    def buchen(er, kostenart, betrag, bezug, text, ungeprueft=False):
        if er.status == "Abgelehnt":
            return
        betrag = cint(betrag)
        if er.ust_fall == "Keine Vorsteuer" and cint(er.netto_cent) and cint(er.brutto_cent) > cint(er.netto_cent):
            # nicht abziehbare Vorsteuer ist Kostenbestandteil (Annahme, 91-steuerberater-fragen.md Nr. 30)
            betrag = int(round(betrag * cint(er.brutto_cent) / cint(er.netto_cent)))
        betrag = -abs(betrag) if er.belegart == "Gutschrift" else betrag
        ist.append({"kostenart": kostenart or "Sonstiges", "betrag_cent": betrag, "datum": str(er.datum or ""), "quelle_doctype": "PH Eingangsrechnung",
                    "quelle_name": er.name, "status": er.status, "text": text, "nicht_zugeordnet": int(ungeprueft)})
        if bezug and bezug[1]:
            verrechnet[bezug] = verrechnet.get(bezug, 0) + betrag
        if cint(er.get("bestellung_vollstaendig_berechnet")) and er.herstellerbestellung:
            vollstaendig.add(er.herstellerbestellung)

    for z in zeilen:
        er = kopf.get(z.parent)
        if not er:
            continue
        bezug = (z.bezug_doctype, z.bezug_name) if z.bezug_name else (("PH Herstellerbestellung", er.herstellerbestellung) if er.herstellerbestellung else None)
        buchen(er, z.kostenart, z.betrag_cent, bezug, f"{er.lieferant_name} {er.rechnungsnummer_lieferant}" + (f" · {z.bemerkung}" if z.bemerkung else ""))
    # Altbestand/noch nicht zugeordnet: ER mit Kopf-Projekt, aber ohne Zeilen → voll anrechnen, als Hinweis markieren
    filt = {"projekt": p.name, "status": ("!=", "Abgelehnt"), "name": ("not in", list(parents) or ["-"])}
    if _hat("PH Eingangsrechnung", "zuordnung_modus"):
        filt["zuordnung_modus"] = ("is", "not set")  # Gemeinkosten/aliquot auf andere Projekte = bewusst zugeordnet
    alt = frappe.get_all("PH Eingangsrechnung", filters=filt, fields=felder)
    for er in alt:
        buchen(er, "Ware" if er.herstellerbestellung else "Sonstiges", er.netto_cent, ("PH Herstellerbestellung", er.herstellerbestellung) if er.herstellerbestellung else None,
               f"{er.lieferant_name} {er.rechnungsnummer_lieferant} (nicht zugeordnet)", ungeprueft=True)
    if alt:
        hinweise.append(_("{0} Eingangsrechnung(en) mit Projektbezug ohne Kostenzuordnung – vorläufig voll angerechnet.").format(len(alt)))
    return ist, verrechnet, vollstaendig


def obligo_daten(p, vollstaendig):
    best = []
    if _da("PH Herstellerbestellung"):
        hbs = {h.name: h for h in frappe.get_all("PH Herstellerbestellung", filters={"bezug_doctype": "PH Projekt", "bezug_name": p.name}, fields=["name", "status", "datum", "lieferant"])}
        for h in frappe.get_all("PH Herstellerbestellung", filters={"kommission": p.name}, fields=["name", "status", "datum", "lieferant"]):
            hbs.setdefault(h.name, h)
        for h in hbs.values():
            wert = 0
            for z in frappe.get_all("PH Herstellerbestellung Position", filters={"parent": h.name, "parenttype": "PH Herstellerbestellung"}, fields=["menge", "ab_menge", "ek_cent", "ab_ek_cent", "status"]):
                if z.status == "Storniert":
                    continue
                wert += (cint(z.ab_menge) or cint(z.menge)) * (cint(z.ab_ek_cent) or cint(z.ek_cent))
            best.append({"bezug_doctype": "PH Herstellerbestellung", "bezug_name": h.name, "kostenart": "Ware", "wert_cent": wert, "status": h.status,
                         "vollstaendig_berechnet": int(h.name in vollstaendig), "datum": str(h.datum or ""), "text": h.lieferant or ""})
    if _da("PH Speditionsauftrag"):
        spa = {}
        for filt in ({"projekt": p.name}, {"kommission": p.name}):
            for s in frappe.get_all("PH Speditionsauftrag", filters=filt, fields=["name", "status", "preis_bestaetigt_cent", "preis_angefragt_cent", "abhol_datum", "spediteur"]):
                spa[s.name] = s
        for s in spa.values():
            best.append({"bezug_doctype": "PH Speditionsauftrag", "bezug_name": s.name, "kostenart": "Fracht", "wert_cent": cint(s.preis_bestaetigt_cent) or cint(s.preis_angefragt_cent),
                         "status": s.status, "datum": str(s.abhol_datum or ""), "text": s.spediteur or ""})
    for g in frappe.get_all("PH Fremdgewerk", filters={"projekt": p.name, "vertrag_direkt_kunde": 0}, fields=["name", "status", "kosten_cent", "termin_von", "gewerk", "partner_text"]):
        status = "Entwurf" if g.status in ("Offen", "Angefragt") else g.status  # erst ab „Geplant“ beauftragt
        best.append({"bezug_doctype": "PH Fremdgewerk", "bezug_name": g.name, "kostenart": "Fremdgewerk", "wert_cent": cint(g.kosten_cent), "status": status,
                     "datum": str(g.termin_von or "")[:10], "text": f"{g.gewerk or ''} {g.partner_text or ''}".strip()})
    return best


def lager_daten(p):
    out = []
    if not (_da("PH Lagerbewegung") and _da("PH Lagerbestand")):
        return out
    for b in frappe.get_all("PH Lagerbewegung", filters={"bezug_doctype": "PH Projekt", "bezug": p.name, "art": ("in", ("Verkauf", "Ausbuchung")), "status": "Gebucht"},
                            fields=["name", "menge", "lagerbestand", "datum", "produkt"]):
        lb = frappe.db.get_value("PH Lagerbestand", b.lagerbestand, ["ek_cent", "kommission", "produkt_name"], as_dict=True) if b.lagerbestand else None
        if not lb or (lb.kommission and lb.kommission == p.name):
            continue  # Kommissionsware des Projekts: Kosten kommen über Herstellerbestellung/Eingangsrechnung
        out.append({"kostenart": "Ware", "betrag_cent": abs(cint(b.menge)) * cint(lb.ek_cent), "datum": str(b.datum or "")[:10], "quelle_doctype": "PH Lagerbewegung",
                    "quelle_name": b.name, "text": _("Lagerentnahme {0} × {1} (Einstandswert)").format(abs(cint(b.menge)), lb.produkt_name or b.produkt or "")})
    return out


def zeit_daten(p, einst, hinweise):
    zeiten = frappe.get_all("PH Projektzeit", filters={"projekt": p.name}, fields=["name", "taetigkeit", "datum", "dauer_min", "user"])
    rollen = {u: frappe.get_roles(u) for u in {z.user for z in zeiten if z.user}}
    ist = kalk.zeiten_bewerten(zeiten, einst["kostensaetze"], rollen, p.get("uebergabe_am"))
    ohne = sum(1 for z in ist if z["ohne_satz"] or not z["satz_cent"])
    if ohne:
        hinweise.append(_("{0} Projektzeit(en) ohne Kostensatz (0 €) – Kostensätze in PH Projekte Einstellungen pflegen.").format(ohne))
    stunden = sum(z["stunden"] for z in ist)
    montage_h = sum(z["stunden"] for z in ist if z.get("taetigkeit") == "Montage")
    return ist, stunden, montage_h


def kassa_daten(p):
    if not _da("PH Kassenbuch"):
        return []
    out = []
    for k in frappe.get_all("PH Kassenbuch", filters={"art": "Barausgabe", "status": "Gebucht", "grund": ("like", f"%{p.name}%")}, fields=["name", "betrag_cent", "datum", "grund"]):
        if re.search(rf"(?<![\w-]){re.escape(p.name)}(?![\w-])", k.grund or ""):
            out.append({"kostenart": "Material", "betrag_cent": abs(cint(k.betrag_cent)), "datum": str(k.datum or ""), "quelle_doctype": "PH Kassenbuch",
                        "quelle_name": k.name, "text": (k.grund or "")[:80] + " (brutto)"})
    return out


def service_daten(p):
    if not _da("PH Servicefall"):
        return []
    out = []
    uebergabe = str(p.get("uebergabe_am") or "")
    faelle = frappe.get_all("PH Servicefall", filters={"projekt": p.name}, fields=["name", "gemeldet_am"])
    for f in faelle:
        for k in frappe.get_all("PH Servicefall Kosten", filters={"parent": f.name, "parenttype": "PH Servicefall"}, fields=["art", "betrag_cent", "datum", "eingangsrechnung", "beschreibung"]):
            if k.eingangsrechnung:
                continue  # über die zugeordnete Eingangsrechnung erfasst
            datum = str(k.datum or f.gemeldet_am or "")[:10]
            out.append({"kostenart": "Nachlauf" if uebergabe and datum >= uebergabe else "Sonstiges", "betrag_cent": cint(k.betrag_cent), "datum": datum,
                        "quelle_doctype": "PH Servicefall", "quelle_name": f.name, "text": f"{k.art or ''} {k.beschreibung or ''}".strip()})
    if faelle and _da("PH Lieferantenregress"):
        for r in frappe.get_all("PH Lieferantenregress", filters={"servicefall": ("in", [f.name for f in faelle]), "betrag_erhalten_cent": (">", 0)}, fields=["name", "betrag_erhalten_cent", "gutschrift_datum", "eingangsrechnung", "modified"]):
            if r.eingangsrechnung:
                continue  # Regress-Gutschrift als Lieferanten-Gutschrift (ER) erfasst
            out.append({"kostenart": "Nachlauf", "betrag_cent": -cint(r.betrag_erhalten_cent), "datum": str(r.gutschrift_datum or r.modified or "")[:10],
                        "quelle_doctype": "PH Lieferantenregress", "quelle_name": r.name, "text": _("Regress erhalten")})
    return out


def budget_daten(p):
    out = []
    for b in p.get("kalk_budget") or []:
        out.append({"kostenart": b.kostenart, "budget_auftrag_cent": cint(b.budget_auftrag_cent), "budget_aktuell_cent": cint(b.budget_aktuell_cent),
                    "prognose_rest_manuell_cent": cint(b.prognose_rest_cent) if cint(b.prognose_manuell) else None, "prognose_begruendung": b.prognose_begruendung})
    return out


def daten_sammeln(p, stichtag=None):
    """Eingabe für kalk.kalkulation_v2 (p = PH Projekt-Dokument)."""
    einst = einstellungen_daten()
    hinweise = []
    erl, erl_quellen = erloes_daten(p)
    ist_er, verrechnet, vollstaendig = er_daten(p, hinweise)
    zeiten, stunden, montage_h = zeit_daten(p, einst, hinweise)
    ist = ist_er + lager_daten(p) + zeiten + kassa_daten(p) + service_daten(p)
    obl = [z for z in kalk.obligo(obligo_daten(p, vollstaendig), verrechnet)]
    for z in obl:
        z.update({"quelle_doctype": z["bezug_doctype"], "quelle_name": z["bezug_name"]})
    plan_h = flt(frappe.db.get_value("PH Montageauftrag", {"projekt": p.name, "status": ("!=", "Abgebrochen")}, "sum(stunden_geplant)") or 0)
    if not p.get("kalk_budget"):
        hinweise.append(_("Noch kein Budget je Kostenart – „Budget vorbelegen“ (Leitung)."))
    if not eingerichtet():
        hinweise.append(_("Kalkulation noch nicht eingerichtet (Kostensätze/Ziel-DB) – PH Projekte Einstellungen, Abschnitt Kalkulation."))
    return {
        "erloes": erl, "erloes_quellen": erl_quellen,
        "kostenarten": frappe.get_all("PH Kostenart", fields=["name", "bezeichnung", "db_stufe", "reihenfolge"]),
        "ist": ist, "obligo": obl, "budget": budget_daten(p),
        "fortschritt": {"phase": p.status, "positionen": [z.as_dict() for z in p.positionen], "montage_h_ist": montage_h, "montage_h_plan": plan_h},
        "parameter": kalk.parameter(einst, p.projektart, stichtag or nowdate(), abweichung_von(p)),
        "stunden_ist": stunden, "stunden_prognose": max(stunden, plan_h), "hinweise": hinweise, "einstellungen": einst,
    }


def berechnen(projekt, stichtag=None):
    """Vollständige Struktur (Kopfzahlen, Stufen, Kostenarten, Zeitreihe, Quellen mit Links) für API/Report/Druck."""
    p = projekt if not isinstance(projekt, str) else frappe.get_doc("PH Projekt", projekt)
    e = daten_sammeln(p, stichtag)
    r = kalk.kalkulation_v2(e)
    for q in r["quellen"] + e["erloes_quellen"]:
        q["link"] = form_link(q.get("quelle_doctype"), q.get("quelle_name"))
    r["erloes_quellen"] = e["erloes_quellen"]
    r["projekt"] = {"name": p.name, "titel": p.titel, "status": p.status, "projektart": p.projektart, "berater": p.berater, "kunde_name": p.kunde_name,
                    "budget_eingefroren_am": str(p.get("kalk_budget_eingefroren_am") or "") or None, "link": form_link("PH Projekt", p.name)}
    r["stichtag"] = str(stichtag or nowdate())
    r["eingerichtet"] = eingerichtet()
    return r


def cache_schreiben(projekt, r):
    k = r["kopf"]
    frappe.db.set_value("PH Projekt", projekt, {
        "kalk_ampel": k["ampel"], "kalk_ueber_budget": int(k["ueber_budget"]), "kalk_fertigstellung": k["fertigstellungsgrad"],
        "kalk_erloes_cent": k["erloes_cent"], "kalk_ist_cent": k["kosten_ist_cent"], "kalk_obligo_cent": k["obligo_cent"], "kalk_prognose_cent": k["prognose_kosten_cent"],
        "kalk_db1_prozent": k["db1_prozent_prognose"] or 0, "kalk_db_laufend_prozent": k["db_laufend_prozent"] or 0, "kalk_db_prognose_prozent": k["db_prognose_prozent"] or 0,
        "kalk_aktualisiert_am": now_datetime(),
    }, update_modified=False)


# ── Budget ──────────────────────────────────────────────────────────────────────────────────────

def budget_vorschlag(p):
    """Vorbelegung je Kostenart aus der Angebots-/Auftragskalkulation: Ware = EK der Positionen, Montage eigen =
    geplante Montagestunden × Satz, Fremdgewerk = Kosten der beauftragten Gewerke, Fracht = angefragte Spedition."""
    einst = einstellungen_daten()
    v = {}
    ware = sum(cint(z.ek_cent) * max(cint(z.menge), 1) for z in p.positionen if (z.lieferstatus or "") != "storniert")
    if ware:
        v["Ware"] = (ware, _("EK der Projektpositionen"))
    plan_h = flt(frappe.db.get_value("PH Montageauftrag", {"projekt": p.name, "status": ("!=", "Abgebrochen")}, "sum(stunden_geplant)") or 0)
    if plan_h:
        satz, _z = kalk.kostensatz(einst["kostensaetze"], "Montage", nowdate())
        v["Montage eigen"] = (kalk.kosten_stunden(plan_h, satz), _("{0} h geplant × {1} €").format(round(plan_h, 1), satz / 100))
    fg = cint(frappe.db.get_value("PH Fremdgewerk", {"projekt": p.name, "vertrag_direkt_kunde": 0, "status": ("!=", "Abgesagt")}, "sum(kosten_cent)") or 0)
    if fg:
        v["Fremdgewerk"] = (fg, _("Fremdgewerke"))
    if _da("PH Speditionsauftrag"):
        fr = cint(frappe.db.get_value("PH Speditionsauftrag", {"projekt": p.name, "status": ("!=", "Storniert")}, "sum(preis_angefragt_cent)") or 0)
        if fr:
            v["Fracht"] = (fr, _("Speditionsanfragen"))
    return v


def budget_vorbelegen(p, ueberschreiben=False):
    """Budget-Zeilen anlegen/ergänzen (nur solange nicht eingefroren). Ändert das Dokument, speichert nicht."""
    if p.get("kalk_budget_eingefroren_am"):
        frappe.throw(_("Das Budget bei Auftrag ist eingefroren – Änderungen über „Anpassung Leitung“."))
    vorhanden = {b.kostenart: b for b in p.get("kalk_budget") or []}
    for ka, (cent, quelle) in budget_vorschlag(p).items():
        if not frappe.db.exists("PH Kostenart", ka):
            continue
        if ka in vorhanden:
            if ueberschreiben or not cint(vorhanden[ka].budget_auftrag_cent):
                vorhanden[ka].budget_auftrag_cent, vorhanden[ka].quelle = cent, quelle
        else:
            p.append("kalk_budget", {"kostenart": ka, "budget_auftrag_cent": cent, "quelle": quelle})
    budget_aktualisieren(p)


def budget_aktualisieren(p):
    """Aktuelles Budget = bei Auftrag + Nachträge (EK-Differenz freigegebener Nachträge nach dem Einfrieren → Ware)
    + Anpassung Leitung. Im validate des Projekts."""
    nachtraege = 0
    if p.get("kalk_budget_eingefroren_am") and not p.is_new():
        nachtraege = cint(frappe.db.get_value("PH Nachtrag", {"projekt": p.name, "status": "Freigegeben", "entscheidung_am": (">=", p.kalk_budget_eingefroren_am)}, "sum(ek_differenz_cent)") or 0)
    if nachtraege and not any(b.kostenart == "Ware" for b in p.get("kalk_budget") or []) and frappe.db.exists("PH Kostenart", "Ware"):
        p.append("kalk_budget", {"kostenart": "Ware", "budget_auftrag_cent": 0, "quelle": _("Nachträge")})
    for b in p.get("kalk_budget") or []:
        b.nachtraege_cent = nachtraege if b.kostenart == "Ware" else 0
        b.budget_aktuell_cent = cint(b.budget_auftrag_cent) + cint(b.nachtraege_cent) + cint(b.anpassung_cent)


def budget_einfrieren(p):
    if not p.get("kalk_budget"):
        budget_vorbelegen(p)
    p.kalk_budget_eingefroren_am = now_datetime()
    budget_aktualisieren(p)


def budget_pruefen(paare):
    """Nach Freigabe einer Eingangsrechnung: paare {(projekt, kostenart)} → Hinweistexte für den Freigebenden,
    wenn die Prognose der Kostenart (oder des Projekts) das Budget überschreitet. Nie werfen."""
    out = []
    for projekt in sorted({pr for pr, _k in paare if pr}):
        try:
            r = berechnen(projekt)
            cache_schreiben(projekt, r)
            for z in r["kostenarten"]:
                if (projekt, z["kostenart"]) in paare and z["budget_cent"] and z["prognose_cent"] > z["budget_cent"]:
                    out.append(_("{0}: {1} über Budget – Prognose {2} € bei Budget {3} € (+{4} €).").format(
                        projekt, z["bezeichnung"], z["prognose_cent"] / 100, z["budget_cent"] / 100, z["abweichung_cent"] / 100))
            if r["kopf"]["ueber_budget"] and not any(o.startswith(projekt) for o in out):
                out.append(_("{0}: Projekt gesamt über Budget (Prognose {1} € bei Budget {2} €).").format(projekt, r["kopf"]["prognose_kosten_cent"] / 100, r["kopf"]["budget_cent"] / 100))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Nachkalkulation: Budgetprüfung {projekt}")
    return out


# ── Warnungen (Scheduler) ───────────────────────────────────────────────────────────────────────

def projektleitung(p):
    for t in p.get("team") or []:
        if t.rolle == "Planer" and t.user:
            return t.user
    return p.get("planer") or p.get("berater") or p.get("montageleiter")


def glocke(user, betreff, doctype, name, text=None):
    if not user:
        return
    try:
        frappe.get_doc({"doctype": "Notification Log", "for_user": user, "type": "Alert", "document_type": doctype, "document_name": name,
                        "subject": betreff, "email_content": text or betreff, "from_user": "Administrator"}).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Nachkalkulation: Glocke")


def warnen(p, r):
    """Rot → PH Projekt Aufgabe an die Projektleitung (einmal offen je Projekt) + Glocke."""
    if r["kopf"]["ampel"] != "rot":
        return False
    titel = _("Kalkulation rot: {0}").format(p.titel)[:140]
    if frappe.db.exists("PH Projekt Aufgabe", {"projekt": p.name, "referenz_doctype": "PH Projekt", "referenz_name": p.name, "status": ("in", ("Offen", "In Arbeit")), "titel": ("like", "Kalkulation rot%")}):
        return False
    rote = [z["bezeichnung"] for z in r["kostenarten"] if z["ampel"] == "rot"]
    k = r["kopf"]
    text = _("Prognose Kosten {0} € bei Budget {1} €; End-DB {2} %. Rote Kostenarten: {3}.").format(
        k["prognose_kosten_cent"] / 100, k["budget_cent"] / 100, k["db_prognose_prozent"], ", ".join(rote) or "–")
    leitung = projektleitung(p) or "Administrator"
    frappe.get_doc({"doctype": "PH Projekt Aufgabe", "projekt": p.name, "titel": titel, "art": "Koordination" if _art_ok("Koordination") else None, "prioritaet": "Hoch",
                    "faellig": nowdate(), "zugewiesen_an": leitung, "beschreibung": text, "referenz_doctype": "PH Projekt", "referenz_name": p.name,
                    "abrechenbar": 0, "quelle": "system"}).insert(ignore_permissions=True)
    glocke(leitung, titel, "PH Projekt", p.name, text)
    return True


def _art_ok(wert):
    try:
        return wert in (frappe.get_meta("PH Projekt Aufgabe").get_field("art").options or "").split("\n")
    except Exception:  # noqa: BLE001
        return False


def kalkulation_pruefen():
    """Täglich (hooks.py): laufende Projekte rechnen, Cache für Number Cards/Listen schreiben, bei Rot warnen."""
    einst = einstellungen_daten()
    for name in frappe.get_all("PH Projekt", filters={"status": ("in", LAUFEND)}, pluck="name"):
        try:
            p = frappe.get_doc("PH Projekt", name)
            r = berechnen(p)
            cache_schreiben(name, r)
            if einst["warnung_aktiv"]:
                warnen(p, r)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Nachkalkulation: tägliche Prüfung {name}")


# ── Snapshot bei Abschluss ──────────────────────────────────────────────────────────────────────

def nachkalkulation_erstellen(projekt, neu_berechnen=None):
    """PH Projekt Nachkalkulation (eingefroren) anlegen bzw. einen Entwurf neu berechnen. → Name"""
    p = frappe.get_doc("PH Projekt", projekt)
    vorhanden = frappe.db.get_value("PH Projekt Nachkalkulation", {"projekt": projekt}, ["name", "status"], as_dict=True, order_by="creation desc")
    if vorhanden and (vorhanden.status == "Abgeschlossen" or not neu_berechnen):
        return vorhanden.name
    r = berechnen(p, stichtag=str(p.get("abgeschlossen_am") or nowdate()))
    einst = einstellungen_daten()
    kommentare = {}
    doc = frappe.get_doc("PH Projekt Nachkalkulation", vorhanden.name) if vorhanden else frappe.new_doc("PH Projekt Nachkalkulation")
    for z in doc.get("kostenarten") or []:
        kommentare[z.kostenart] = z.kommentar
    k, st = r["kopf"], r["stufen_ist"]
    doc.update({
        "projekt": p.name, "projektart": p.projektart, "berater": p.berater, "stichtag": r["stichtag"], "ampel": k["ampel"], "fertigstellungsgrad": k["fertigstellungsgrad"],
        "erloes_cent": k["erloes_cent"], "erloes_basis": k["erloes_basis"], "auftragswert_cent": k["auftragswert_cent"], "kosten_ist_cent": k["kosten_ist_cent"],
        "budget_auftrag_cent": k["budget_auftrag_cent"], "budget_aktuell_cent": k["budget_cent"], "abweichung_cent": k["kosten_ist_cent"] - (k["budget_auftrag_cent"] or k["budget_cent"]),
        "db1_cent": st["db1_cent"], "db1_prozent": st["db1_prozent"] or 0, "db2_cent": st["db2_cent"], "db2_prozent": st["db2_prozent"] or 0,
        "db3_cent": st["db3_cent"], "db3_prozent": st["db3_prozent"] or 0, "gemeinkosten_aktiv": int(r["gemeinkosten_aktiv"]),
        "gemeinkosten_cent": st.get("gemeinkosten_cent") or 0, "db4_cent": st.get("db4_cent") or 0, "db4_prozent": st.get("db4_prozent") or 0,
        "ziel_db1": r["parameter"]["ziel"].get("ziel_db1") or 0, "ziel_db2": r["parameter"]["ziel"].get("ziel_db2") or 0, "ziel_db3": r["parameter"]["ziel"].get("ziel_db3") or 0,
        "schwelle_prozent": einst["schwelle_prozent"], "daten_json": json.dumps(r, ensure_ascii=False, default=str, indent=1),
    })
    doc.set("kostenarten", [])
    stufe = {z["kostenart"]: z["db_stufe"] for z in r["kostenarten"]}
    for a in kalk.abweichungen(r["kostenarten"], einst["schwelle_prozent"]):
        doc.append("kostenarten", {**a, "db_stufe": stufe.get(a["kostenart"]), "abweichung_prozent": a["abweichung_prozent"] or 0, "kommentar": kommentare.get(a["kostenart"])})
    montage_min = cint(frappe.db.get_value("PH Projektzeit", {"projekt": p.name, "taetigkeit": "Montage"}, "sum(dauer_min)") or 0)
    doc.set("lernwerte", [])
    for lw in kalk.lernwerte([z.as_dict() for z in p.positionen], einst["richtwerte"], montage_min, einst["standard_min"]):
        doc.append("lernwerte", lw)
    doc.flags.ignore_permissions = True
    doc.save() if not doc.is_new() else doc.insert()
    frappe.db.set_value("PH Projekt", p.name, "nachkalkulation", doc.name, update_modified=False)
    return doc.name


def ph_nachkalkulation_daten(doc):
    """Jinja (Druckformat PH Projekt Nachkalkulation): eingefrorene Struktur aus daten_json."""
    try:
        return json.loads((doc.get("daten_json") if hasattr(doc, "get") else doc) or "{}")
    except Exception:  # noqa: BLE001
        return {}
