"""Zeitkonto (Frappe-Seite): Feiertagskalender, Arbeitszeitmodell je Tag, Abwesenheitstage, Monatsübersicht,
Monatsabschluss-Sperre. Rechenregeln in ph_personal/utils/arbeitszeit.py (ohne Frappe, getestet).

Fachkritik 21-kritik-fach-personal.md: P4 (Sperre), P5 (Modell mit Gültigkeit), P6 (Feiertage getrennt von
Betriebsruhe), P7 (Gutschrift-Matrix: Zeitausgleich ohne Gutschrift), B12 (Karenz Soll 0), R6/F14/F15.
"""

import calendar
from datetime import date, timedelta

import frappe
from frappe import _
from frappe.utils import getdate

from ph_personal.utils.arbeitszeit import (
    FREI_BETRIEBSRUHE,
    FREI_GESETZLICH,
    FREI_LAND,
    ist_jugendlich,
    modell_am,
    soll_tag,
    standardmodell,
    tag_bewerten,
    urlaubstage,
    wochen_auswerten,
    wochenminuten,
    zeitfenster_minuten,
)
from ph_personal.logik import minuten_text
from ph_personal.utils.dienstplan import uhrzeit_min


def _einst():
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    return einstellungen()


def freie_tage(jahr):
    """dict date → gesetzlich | land | betriebsruhe (ph_core Feiertagskalender + PH Einstellungen.betriebsruhe)."""
    schluessel = f"ph_personal:frei:{jahr}"
    daten = frappe.cache().get_value(schluessel)
    if daten:
        return {date.fromisoformat(k): v for k, v in daten.items()}
    from ph_core.utils.feiertage import feiertage, feiertage_site, gesetzliche_feiertage

    gesetzlich = gesetzliche_feiertage(jahr)
    try:
        bundesland = frappe.get_cached_doc("PH Einstellungen").get("feiertage_bundesland") or "Vorarlberg"
    except Exception:  # noqa: BLE001 – vor Migration von ph_core
        bundesland = "Vorarlberg"
    mit_land = feiertage(jahr, bundesland=bundesland, mit_betriebsruhe=False)
    out = {}
    for d in feiertage_site(jahr):
        out[d] = FREI_GESETZLICH if d in gesetzlich else FREI_LAND if d in mit_land else FREI_BETRIEBSRUHE
    for d in gesetzlich:
        out[d] = FREI_GESETZLICH
    frappe.cache().set_value(schluessel, {k.isoformat(): v for k, v in out.items()}, expires_in_sec=3600)
    return out


def freie_tage_zeitraum(von, bis):
    out = {}
    for j in range(von.year, bis.year + 1):
        out.update(freie_tage(j))
    return out


def modelle(mitarbeiter):
    """(modelle, ersatz) – Zeilen PH Mitarbeiter Arbeitszeit als dict-Liste und Ersatzmodell aus Wochenstunden."""
    ma = frappe.get_cached_doc("PH Mitarbeiter", mitarbeiter) if isinstance(mitarbeiter, str) else mitarbeiter
    zeilen = [z.as_dict() for z in (ma.get("arbeitszeiten") or []) if z.gueltig_ab]
    for z in zeilen:
        z["gueltig_ab"] = getdate(z["gueltig_ab"])
    return zeilen, standardmodell(ma.wochenstunden_effektiv())


def _regel_kwargs():
    e = _einst()
    return {"landesfeiertag_frei": bool(e.get("landesfeiertag_frei", 1)), "betriebsruhe_behandlung": e.get("betriebsruhe_behandlung") or "Bezahlt frei"}


def abwesenheitstage(mitarbeiter, von, bis, halbtags=False):
    """Liste (datum, menge) der Tage, die eine Abwesenheit verbraucht (nach Modell und Feiertagen)."""
    von, bis = getdate(von), getdate(bis)
    m, ersatz = modelle(mitarbeiter)
    return urlaubstage(von, bis, m, freie_tage_zeitraum(von, bis), halbtags=halbtags, ersatz=ersatz, **_regel_kwargs())


def tagessoll(mitarbeiter, datum):
    m, ersatz = modelle(mitarbeiter)
    d = getdate(datum)
    return soll_tag(m, d, freie_tage(d.year), ersatz=ersatz, **_regel_kwargs())[0]


def _tage_mit_abwesenheit(mitarbeiter, von, bis):
    """dict date → (art, halbtags, quelle) aus genehmigten Abwesenheiten und Krankmeldungen."""
    out = {}
    for a in frappe.get_all(
        "PH Abwesenheit",
        filters={"mitarbeiter": mitarbeiter, "status": "Genehmigt", "von": ("<=", bis), "bis": (">=", von)},
        fields=["name", "art", "von", "bis", "halbtags", "unterbrechung_von", "unterbrechung_bis"],
    ):
        d = max(getdate(a.von), von)
        while d <= min(getdate(a.bis), bis):
            if not (a.unterbrechung_von and getdate(a.unterbrechung_von) <= d <= getdate(a.unterbrechung_bis or a.unterbrechung_von)):
                out[d] = (a.art, bool(a.halbtags), a.name)
            d += timedelta(days=1)
    if frappe.db.exists("DocType", "PH Krankmeldung"):
        for k in frappe.get_all(
            "PH Krankmeldung",
            filters={"mitarbeiter": mitarbeiter, "status": ("in", ["Gemeldet", "Bestaetigt", "Beendet"]), "von": ("<=", bis)},
            fields=["name", "von", "bis", "bis_voraussichtlich", "bis_offen", "arbeitsunfall"],
        ):
            ende = getdate(k.bis) if k.bis else (bis if k.bis_offen or not k.bis_voraussichtlich else getdate(k.bis_voraussichtlich))
            d = max(getdate(k.von), von)
            while d <= min(ende, bis):
                out[d] = ("Krankenstand", False, k.name, bool(k.arbeitsunfall))
                d += timedelta(days=1)
    return out


def monatsuebersicht(mitarbeiter, jahr, monat):
    """Soll/Ist/Saldo eines Monats nach Modell, Feiertagen und Gutschrift-Matrix; Wochenaufteilung
    (Mehrarbeit/Überstunden), Zeitfenster für die Lohnvorbereitung, Saldo-Vortrag aus PH Zeitabschluss."""
    ma = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    e = _einst()
    monat_von = date(jahr, monat, 1)
    monat_bis = date(jahr, monat, calendar.monthrange(jahr, monat)[1])
    von, bis = monat_von, monat_bis
    if ma.eintritt and getdate(ma.eintritt) > von:
        von = getdate(ma.eintritt)
    if ma.austritt and getdate(ma.austritt) < bis:
        bis = getdate(ma.austritt)
    buchungen = frappe.get_all(
        "PH Zeiterfassung",
        filters={"mitarbeiter": mitarbeiter, "datum": ("between", [von, bis])},
        fields=["name", "datum", "art", "kommen", "gehen", "pause_min", "dauer_min", "dauer_text", "status", "projekt_referenz", "korrektur_status"],
        order_by="datum asc, kommen asc",
    )
    m, ersatz = modelle(ma)
    frei = freie_tage(jahr)
    regel = _regel_kwargs()
    abw = _tage_mit_abwesenheit(mitarbeiter, von, bis) if von <= bis else {}
    ist_je_tag = {}
    fenster = {"samstag_ab_13": 0, "sonntag": 0, "feiertag": 0, "nacht": 0}
    for b in buchungen:
        d = getdate(b.datum)
        ist_je_tag[d] = ist_je_tag.get(d, 0) + int(b.dauer_min or 0)
        if b.kommen and b.gehen:
            for k, v in zeitfenster_minuten(d, uhrzeit_min(b.kommen), uhrzeit_min(b.gehen), frei).items():
                fenster[k] += v
    summen = {"soll": 0, "gutschrift": 0, "za_verbrauch": 0, "unbezahlt": 0, "feiertag_min": 0}
    zaehler = {"Urlaub": 0.0, "Krankenstand": 0.0, "Arbeitsunfall": 0.0, "Zeitausgleich": 0.0, "Pflegefreistellung": 0.0, "Sonderurlaub": 0.0, "Fortbildung": 0.0, "Berufsschule": 0.0, "Unbezahlt": 0.0, "ruhend": 0.0}
    tagesliste = []
    arbeitstage = 0.0
    d = von
    while d <= bis:
        soll, modell_min, frei_art = soll_tag(m, d, frei, ersatz=ersatz, **regel)
        info = abw.get(d)
        art = info[0] if info else None
        halb = info[1] if info else False
        t = tag_bewerten(soll, art, halb)
        feiertag_min = modell_min if (soll == 0 and modell_min and frei_art) else 0
        if soll > 0:
            arbeitstage += 1
        for k in ("soll", "gutschrift", "za_verbrauch", "unbezahlt"):
            summen[k] += t[k]
        summen["feiertag_min"] += feiertag_min
        if art and soll > 0:
            menge = 0.5 if halb else 1.0
            if art in zaehler:
                zaehler[art] += menge
            elif art in ("Karenz", "Mutterschutz", "Zivil-/Praesenzdienst"):
                zaehler["ruhend"] += menge
            if art == "Krankenstand" and len(info) > 3 and info[3]:
                zaehler["Arbeitsunfall"] += menge
        modell_woche = wochenminuten(modell_am(m, d) or ersatz)
        tagesliste.append({"datum": d, "ist": ist_je_tag.get(d, 0), "gutschrift": t["gutschrift"], "feiertag_min": feiertag_min, "modell_min": modell_min, "modell_woche_min": modell_woche, "soll": t["soll"], "art": art, "frei": frei_art})
        d += timedelta(days=1)
    ist = sum(int(b.dauer_min or 0) for b in buchungen)
    saldo = ist + summen["gutschrift"] - summen["soll"]
    abgeltung = ma.get("ueberstunden_abgeltung") or "Zeitausgleich"
    wochen, aufteilung = wochen_auswerten(tagesliste, int(round(float(e.get("standard_wochenstunden") or 38.5) * 60)), abgeltung=abgeltung)
    vortrag = saldo_vortrag(mitarbeiter, jahr, monat)
    jugendlich = ist_jugendlich(ma.geburtsdatum, monat_bis) if ma.get("geburtsdatum") else False
    return {
        "mitarbeiter": mitarbeiter,
        "name": ma.titel,
        "jahr": jahr,
        "monat": monat,
        "von": von,
        "bis": bis,
        "wochenstunden": ma.wochenstunden_effektiv(),
        "soll_min": summen["soll"],
        "soll_text": minuten_text(summen["soll"]),
        "ist_min": ist,
        "ist_text": minuten_text(ist),
        "gutschrift_min": summen["gutschrift"],
        "gutschrift_text": minuten_text(summen["gutschrift"]),
        "za_verbrauch_min": summen["za_verbrauch"],
        "unbezahlt_min": summen["unbezahlt"],
        "feiertag_min": summen["feiertag_min"],
        "saldo_min": saldo,
        "saldo_text": minuten_text(saldo),
        "saldo_vortrag_min": vortrag,
        "saldo_kumuliert_min": vortrag + saldo,
        "saldo_kumuliert_text": minuten_text(vortrag + saldo),
        "saldo_hinweis": _("Stundensaldo ohne Zuschläge (Zuschläge berechnet die Lohnverrechnung)."),
        "urlaub_tage": zaehler["Urlaub"],
        "krank_tage": zaehler["Krankenstand"],
        "arbeitsunfall_tage": zaehler["Arbeitsunfall"],
        "za_tage": zaehler["Zeitausgleich"],
        "pflege_tage": zaehler["Pflegefreistellung"],
        "sonder_tage": zaehler["Sonderurlaub"],
        "fortbildung_tage": zaehler["Fortbildung"],
        "berufsschule_tage": zaehler["Berufsschule"],
        "unbezahlt_tage": zaehler["Unbezahlt"],
        "ruhend_tage": zaehler["ruhend"],
        "sonstige_tage": zaehler["Zeitausgleich"] + zaehler["Pflegefreistellung"] + zaehler["Sonderurlaub"] + zaehler["Fortbildung"] + zaehler["Berufsschule"] + zaehler["Unbezahlt"],
        "mehrarbeit_min": aufteilung["mehrarbeit"],
        "kv_mehrstunden_min": aufteilung["kv_mehrstunden"],
        "ueberstunden_min": aufteilung["ueberstunden"],
        "za_gutschrift_min": aufteilung["za_wert"],
        "ueberstunden_abgeltung": abgeltung,
        "wochen": wochen,
        "fenster": fenster,
        "jugendschutz": jugendlich,
        "offen": sum(1 for b in buchungen if b.status == "Offen"),
        "korrektur_offen": sum(1 for b in buchungen if b.get("korrektur_status") == "Beantragt"),
        "gesperrt": bool(abschluss(mitarbeiter, jahr, monat)),
        "azg": azg_befunde(mitarbeiter, von, bis) if von <= bis else [],
        "tage": [
            {**b, "datum": str(b.datum), "kommen": str(b.kommen)[:5] if b.kommen else "", "gehen": str(b.gehen)[:5] if b.gehen else ""}
            for b in buchungen
        ],
        "arbeitstage": arbeitstage,
    }


# ── Monatsabschluss (PH Zeitabschluss) ─────────────────────────────────────────

def periode(jahr, monat):
    return f"{int(jahr):04d}-{int(monat):02d}"


def abschluss(mitarbeiter, jahr, monat):
    """Name des gültigen (nicht wieder geöffneten) PH Zeitabschluss oder None."""
    if not frappe.db.exists("DocType", "PH Zeitabschluss"):
        return None
    return frappe.db.get_value("PH Zeitabschluss", {"mitarbeiter": mitarbeiter, "periode": periode(jahr, monat), "status": "Abgeschlossen"}, "name")


def monat_gesperrt(mitarbeiter, datum):
    d = getdate(datum)
    return abschluss(mitarbeiter, d.year, d.month)


def sperre_pruefen(mitarbeiter, *daten):
    """frappe.throw, wenn eines der Daten in einem abgeschlossenen Monat liegt (Controller-Validate)."""
    if frappe.flags.ph_personal_abschluss_ignorieren:
        return
    for d in daten:
        if not d:
            continue
        name = monat_gesperrt(mitarbeiter, d)
        if name:
            frappe.throw(_("Der Monat {0} ist abgeschlossen ({1}) – Korrektur nur nach „Wieder öffnen“ durch die Leitung.").format(getdate(d).strftime("%m/%Y"), name))


def saldo_vortrag(mitarbeiter, jahr, monat):
    """Kumulierter Saldo des letzten abgeschlossenen Vormonats (0, wenn keiner)."""
    if not frappe.db.exists("DocType", "PH Zeitabschluss"):
        return 0
    rows = frappe.get_all(
        "PH Zeitabschluss",
        filters={"mitarbeiter": mitarbeiter, "status": "Abgeschlossen", "periode": ("<", periode(jahr, monat))},
        fields=["saldo_kumuliert_min"],
        order_by="periode desc",
        limit=1,
    )
    return int(rows[0].saldo_kumuliert_min or 0) if rows else 0


# ── AZG/ARG-Prüfung (Nachtrag Nr. 57 / A16) ──────────────────────────────────

def azg_befunde(mitarbeiter, von, bis):
    """Befunde utils/azg.pruefen für den Zeitraum; lädt 17 Wochen Vorlauf (Durchschnitt) und den Vortag (Ruhezeit).
    Überstunden gelten als zulässig, außer das Arbeitszeitmodell ist „Fix“ ohne Überstundenabgeltung – die
    Anordnung selbst ist nicht im System (Hinweisstufe)."""
    from ph_personal.utils.azg import pruefen

    von, bis = getdate(von), getdate(bis)
    vorlauf = von - timedelta(weeks=17)
    rows = frappe.get_all(
        "PH Zeiterfassung",
        filters={"mitarbeiter": mitarbeiter, "datum": ("between", [vorlauf, bis]), "status": ("!=", "Offen")},
        fields=["datum", "kommen", "gehen", "pause_min"],
    )
    buchungen = [{"datum": getdate(r.datum), "kommen": r.kommen, "gehen": r.gehen, "pause_min": r.pause_min} for r in rows]
    geb = frappe.db.get_value("PH Mitarbeiter", mitarbeiter, "geburtsdatum")
    jugendlich = ist_jugendlich(geb, bis) if geb else False
    return pruefen(buchungen, jugendlich=jugendlich, ueberstunden_erlaubt=True, von=von, bis=bis)
