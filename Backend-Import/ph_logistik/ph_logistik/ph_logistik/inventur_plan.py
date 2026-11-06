"""Permanente/rollierende Teilinventur (Frappe): Plan „jeder Lagerplatz mindestens 1× je Geschäftsjahr“.

Datenbasis: PH Lagerort Platz `zuletzt_gezaehlt`/`zuletzt_inventur` und PH Lagerort (Bestand ohne Platz), gesetzt bei der Freigabe
einer PH Inventur (`_abdeckung_buchen`). Rechenregeln: inventur_logik.abdeckung/plaetze_vorschlagen.
"""

import frappe
from frappe import _
from frappe.utils import cint, nowdate

from . import inventur_logik as IL
from .helfer import einstellungen


def plaetze(lagerort=None):
    """[{lagerort, platz, zuletzt, inventur, bestand_positionen}] – aktive Plätze aktiver Lagerorte (+ Pseudoplatz ohne Platz,
    wenn dort Bestand liegt oder der Lagerort keine Plätze hat). Fahrzeuge/Kunde ausgenommen."""
    filt = {"aktiv": 1, "art": ("in", ["Showroom", "Lager", "Extern"])}
    if lagerort:
        filt["name"] = lagerort
    erg = []
    for lo in frappe.get_all("PH Lagerort", filt, ["name", "zuletzt_gezaehlt", "zuletzt_inventur"]):
        bestand = {}
        for b in frappe.get_all("PH Lagerbestand", {"lagerort": lo.name, "status": ("not in", ["Ausgeschieden", "Verkauft"])}, ["platz"]):
            k = b.platz or IL.OHNE_PLATZ
            bestand[k] = bestand.get(k, 0) + 1
        pl = frappe.get_all("PH Lagerort Platz", {"parent": lo.name, "parenttype": "PH Lagerort", "aktiv": 1}, ["platz", "zuletzt_gezaehlt", "zuletzt_inventur"], order_by="idx")
        for p in pl:
            erg.append({"lagerort": lo.name, "platz": p.platz, "zuletzt": p.zuletzt_gezaehlt, "inventur": p.zuletzt_inventur, "bestand_positionen": bestand.get(p.platz, 0)})
        if not pl or bestand.get(IL.OHNE_PLATZ):
            erg.append({"lagerort": lo.name, "platz": IL.OHNE_PLATZ, "zuletzt": lo.zuletzt_gezaehlt, "inventur": lo.zuletzt_inventur, "bestand_positionen": bestand.get(IL.OHNE_PLATZ, 0)})
        # Bestand auf Plätzen, die nicht (mehr) im Stamm stehen
        bekannt = {p.platz for p in pl} | {IL.OHNE_PLATZ}
        for k, n in bestand.items():
            if k not in bekannt:
                erg.append({"lagerort": lo.name, "platz": k, "zuletzt": None, "inventur": None, "bestand_positionen": n, "nicht_im_stamm": 1})
    return erg


def naechste_plaetze(lagerort, anzahl=None):
    e = einstellungen()
    anzahl = cint(anzahl) or cint(e.get("teilinventur_plaetze_je_lauf")) or 10
    return IL.plaetze_vorschlagen(plaetze(lagerort), nowdate(), cint(e.get("geschaeftsjahr_beginn_monat")) or 1, anzahl)


@frappe.whitelist()
def teilinventur_anlegen(lagerort, anzahl=None):
    """Neue Teilinventur (Geplant) mit den nächsten zu zählenden Plätzen und Zählliste. → Name."""
    frappe.has_permission("PH Inventur", "create", throw=True)
    vorschlag = naechste_plaetze(lagerort, anzahl)
    if not vorschlag:
        frappe.throw(_("Lagerort {0} hat keine zählbaren Plätze.").format(lagerort))
    inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": lagerort, "datum": nowdate(), "inventur_art": "Teilinventur", "plaetze": "\n".join(p["platz"] for p in vorschlag), "quelle": "backoffice"})
    inv.insert()
    inv.zaehlliste_erzeugen()
    return inv.name


@frappe.whitelist()
def abdeckung_uebersicht(lagerort=None):
    """Kennzahlen je Lagerort + gesamt (Bericht, Workspace, Zählmodus)."""
    frappe.has_permission("PH Inventur", "read", throw=True)
    e = einstellungen()
    bm = cint(e.get("geschaeftsjahr_beginn_monat")) or 1
    alle = plaetze(lagerort)
    je = {}
    for p in alle:
        je.setdefault(p["lagerort"], []).append(p)
    heute = nowdate()
    erg = {lo: IL.abdeckung(ps, heute, bm) for lo, ps in je.items()}
    gesamt = IL.abdeckung(alle, heute, bm)
    gesamt["je_woche"] = IL.plaetze_je_woche(gesamt["offen"], heute, bm)
    return {"gesamt": {k: str(v) if k.startswith("gj_") else v for k, v in gesamt.items()}, "lagerorte": {lo: {k: str(v) if k.startswith("gj_") else v for k, v in a.items()} for lo, a in erg.items()}}


def abdeckung_pruefen():
    """Scheduler Montag 07:15 (nur bei aktivierter Teilinventur): Rückstand gegenüber dem linearen Jahresplan → Aufgabe an die Leitung."""
    e = einstellungen()
    if not cint(e.get("teilinventur_aktiv")):
        return None
    try:
        bm = cint(e.get("geschaeftsjahr_beginn_monat")) or 1
        a = IL.abdeckung(plaetze(), nowdate(), bm)
        if a["rueckstand"] > 0:
            from .tasks import _aufgabe

            _aufgabe(_("Teilinventur im Rückstand: {0} von {1} Plätzen im Geschäftsjahr gezählt, {2} hinter Plan – ca. {3} Plätze je Woche zählen.").format(
                a["gezaehlt"], a["gesamt"], a["rueckstand"], IL.plaetze_je_woche(a["offen"], nowdate(), bm)), None, None)
        frappe.db.commit()
        return a
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Inventur-Abdeckung prüfen")
        return None
