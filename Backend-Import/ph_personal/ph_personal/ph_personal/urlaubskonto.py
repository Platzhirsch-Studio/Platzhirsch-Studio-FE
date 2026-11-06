"""Urlaubskonto nach UrlG (Frappe-Seite): PH Urlaubsanspruch je Urlaubsjahr anlegen, Verbrauch FIFO,
Verjährung, Aliquotierung, Ersatzleistung bei Austritt. Rechenregeln: ph_personal/utils/urlaub.py.

Fachkritik 21-kritik-fach-personal.md P8/B4/R2 (kein „Verfall zum Jahresende“ – Verjährung 2 Jahre nach
Ende des Urlaubsjahres, § 4 Abs 5 UrlG).
"""

from datetime import date, timedelta

import frappe
from frappe import _
from frappe.utils import getdate, nowdate

from ph_personal.utils.arbeitszeit import modell_am, modell_minuten
from ph_personal.utils.urlaub import (
    anspruch_urlaubsjahr,
    ersatzleistung_tage,
    tage_pro_woche,
    urlaubsjahr,
    verbrauch_fifo,
    verfuegbar_am,
    verjaehrt_am,
)

RUECKBLICK_JAHRE = 3  # ältere Urlaubsjahre sind verjährt


def _modus():
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    return einstellungen().get("urlaubsjahr") or "Arbeitsjahr"


def tage_pro_woche_am(ma, stichtag):
    from ph_personal.ph_personal.zeitkonto import modelle

    m, ersatz = modelle(ma)
    return tage_pro_woche(modell_minuten(modell_am(m, stichtag) or ersatz)) or 5


def ansprueche_sicherstellen(mitarbeiter, bis=None):
    """Legt fehlende PH Urlaubsanspruch-Datensätze vom Eintritt (max. 3 Jahre zurück) bis zum Urlaubsjahr von
    „bis“ an. Idempotent (Name = UA-<Mitarbeiter>-<Beginn>). Gibt die Namen zurück."""
    ma = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    if not ma.eintritt:
        return []
    eintritt = getdate(ma.eintritt)
    bis = getdate(bis or nowdate())
    if ma.austritt:
        bis = min(bis, getdate(ma.austritt))
    modus = _modus()
    start = max(eintritt, date(bis.year - RUECKBLICK_JAHRE, 1, 1))
    namen = []
    tag = start
    while tag <= bis:
        von, ende = urlaubsjahr(eintritt, tag, modus)
        name = frappe.db.get_value("PH Urlaubsanspruch", {"mitarbeiter": mitarbeiter, "urlaubsjahr_von": von}, "name")
        if not name:
            atpw = tage_pro_woche_am(ma, von)
            a = anspruch_urlaubsjahr(eintritt, von, ende, atpw, ma.get("vordienstzeiten_jahre") or 0, modus)
            anspruch = float(ma.urlaubsanspruch_tage) if ma.urlaubsanspruch_tage else a["anspruch"]
            doc = frappe.get_doc(
                {
                    "doctype": "PH Urlaubsanspruch",
                    "mitarbeiter": mitarbeiter,
                    "urlaubsjahr_von": von,
                    "urlaubsjahr_bis": ende,
                    "wochen": a["wochen"],
                    "arbeitstage_pro_woche": atpw,
                    "anspruch_tage": anspruch,
                    "aliquot_bis": a["aliquot_bis"],
                    "verjaehrt_am": verjaehrt_am(ende),
                    "pflegefreistellung_std": float(ma.wochenstunden_effektiv()),
                    "quelle": "Automatisch" if not ma.urlaubsanspruch_tage else "Vertrag",
                }
            )
            doc.insert(ignore_permissions=True)
            name = doc.name
        namen.append(name)
        tag = ende + timedelta(days=1)
    return namen


def _urlaubs_buchungen(mitarbeiter, status, ausser=None):
    """Liste (datum, menge) aller Urlaubstage einer Person mit Status (tageweise, nach Modell/Feiertagen)."""
    from ph_personal.ph_personal.zeitkonto import abwesenheitstage

    out = []
    for a in frappe.get_all(
        "PH Abwesenheit",
        filters={"mitarbeiter": mitarbeiter, "art": "Urlaub", "status": status, "name": ("!=", ausser or "")},
        fields=["name", "von", "bis", "halbtags", "unterbrechung_von", "unterbrechung_bis"],
    ):
        for d, menge in abwesenheitstage(mitarbeiter, a.von, a.bis, a.halbtags):
            if a.unterbrechung_von and getdate(a.unterbrechung_von) <= d <= getdate(a.unterbrechung_bis or a.unterbrechung_von):
                continue
            out.append((d, menge))
    return out


def konto(mitarbeiter, stichtag=None, ausser=None):
    """Urlaubskonto zum Stichtag.
    Rückgabe {jahre: [...], anspruch, verfuegbar, genommen, beantragt, rest, rest_nach_antraegen, vorgriff,
    naechste_verjaehrung} – Tage, Verbrauch FIFO (genehmigt), dann offene Anträge."""
    stichtag = getdate(stichtag or nowdate())
    namen = ansprueche_sicherstellen(mitarbeiter, stichtag)
    konten = []
    for n in namen:
        u = frappe.get_doc("PH Urlaubsanspruch", n)
        konten.append(
            {
                "schluessel": n,
                "von": getdate(u.urlaubsjahr_von),
                "bis": getdate(u.urlaubsjahr_bis),
                "anspruch": float(u.anspruch_tage or 0) + float(u.korrektur_tage or 0),
                "uebertrag": 0,
                "verjaehrt_am": getdate(u.verjaehrt_am) if u.verjaehrt_am else None,
                "aliquot_bis": getdate(u.aliquot_bis) if u.aliquot_bis else None,
                "status": u.status,
            }
        )
    ma = frappe.get_cached_doc("PH Mitarbeiter", mitarbeiter)
    genehmigt = _urlaubs_buchungen(mitarbeiter, "Genehmigt", ausser)
    beantragt = _urlaubs_buchungen(mitarbeiter, "Beantragt", ausser)
    stand = verbrauch_fifo(konten, genehmigt)
    mit_antraegen = verbrauch_fifo(konten, genehmigt + beantragt)
    jahre = []
    for k in konten:
        s, s2 = stand[k["schluessel"]], mit_antraegen[k["schluessel"]]
        verjaehrt = bool(k["verjaehrt_am"] and stichtag >= k["verjaehrt_am"])
        jahre.append(
            {
                "name": k["schluessel"],
                "von": str(k["von"]),
                "bis": str(k["bis"]),
                "anspruch": k["anspruch"],
                "verfuegbar": verfuegbar_am(k["anspruch"], getdate(ma.eintritt), k["aliquot_bis"], stichtag) if k["von"] <= stichtag else 0.0,
                "verbraucht": s["verbraucht"],
                "rest": 0.0 if verjaehrt else s["rest"],
                "rest_nach_antraegen": 0.0 if verjaehrt else s2["rest"],
                "vorgriff": s["vorgriff"],
                "verjaehrt_am": str(k["verjaehrt_am"]) if k["verjaehrt_am"] else None,
                "verjaehrt": verjaehrt,
                "verjaehrt_tage": s["rest"] if verjaehrt and s["rest"] > 0 else 0.0,
            }
        )
    aktuell = next((j for j in jahre if getdate(j["von"]) <= stichtag <= getdate(j["bis"])), jahre[-1] if jahre else None)
    offen = [j for j in jahre if not j["verjaehrt"] and j["rest"] > 0]
    return {
        "mitarbeiter": mitarbeiter,
        "stichtag": str(stichtag),
        "jahre": jahre,
        "anspruch": aktuell["anspruch"] if aktuell else 0.0,
        "verfuegbar": aktuell["verfuegbar"] if aktuell else 0.0,
        "genommen": round(sum(m for _, m in genehmigt), 2),
        "beantragt": round(sum(m for _, m in beantragt), 2),
        "rest": round(sum(j["rest"] for j in jahre), 2),
        "rest_nach_antraegen": round(sum(j["rest_nach_antraegen"] for j in jahre), 2),
        "vorgriff": round(sum(j["vorgriff"] for j in jahre), 2),
        "naechste_verjaehrung": min((j["verjaehrt_am"] for j in offen), default=None),
        "hinweis": _("Urlaub verjährt erst 2 Jahre nach Ende des Urlaubsjahres (§ 4 Abs 5 UrlG); kein Verfall zum Jahresende."),
    }


def ersatzleistung(mitarbeiter, austritt):
    """§ 10 UrlG: Tage Urlaubsersatzleistung zum Austrittsdatum (negativ = Vorgriff)."""
    austritt = getdate(austritt)
    k = konto(mitarbeiter, austritt)
    laufend = next((j for j in k["jahre"] if getdate(j["von"]) <= austritt <= getdate(j["bis"])), None)
    if not laufend:
        return {"tage": round(sum(max(0, j["rest"]) for j in k["jahre"]), 2), "konto": k}
    fruehere = [j["rest"] for j in k["jahre"] if j is not laufend and not j["verjaehrt"]]
    tage = ersatzleistung_tage(fruehere, laufend["anspruch"], getdate(laufend["von"]), getdate(laufend["bis"]), austritt, laufend["verbraucht"])
    return {"tage": tage, "laufendes_jahr": laufend, "konto": k}
