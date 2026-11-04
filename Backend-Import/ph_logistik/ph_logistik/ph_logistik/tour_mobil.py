"""Server-Methoden der mobilen Desk-Page „ph-tour“ (Tour heute) – Rollen PH Montage / PH Logistik."""

import frappe
from frappe import _
from frappe.utils import nowdate

ROLLEN = {"PH Montage", "PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Backoffice-Admin", "System Manager", "PH Geschäftsführung"}


def _pruefen():
    if not ROLLEN & set(frappe.get_roles()):
        frappe.throw(_("Keine Berechtigung für die Tour-Ansicht."), frappe.PermissionError)


@frappe.whitelist()
def meine_touren(datum=None):
    """Touren des Tages für den angemeldeten Fahrer/Teammitglied (Leitung sieht alle)."""
    _pruefen()
    datum = datum or nowdate()
    user = frappe.session.user
    leitung = bool({"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin", "PH Geschäftsführung"} & set(frappe.get_roles()))
    filt = {"datum": datum, "status": ("in", ["Geplant", "Freigegeben", "Unterwegs", "Abgeschlossen"])}
    rows = frappe.get_all("PH Tour", filt, ["name", "titel", "status", "datum", "fahrzeug", "fahrer", "region", "anzahl_stopps", "anzahl_erledigt", "start_zeit", "route_url"], order_by="start_zeit asc")
    if not leitung:
        team = {t.parent for t in frappe.get_all("PH Tour Team", {"user": user, "parenttype": "PH Tour"}, ["parent"])}
        rows = [r for r in rows if r.fahrer == user or r.name in team]
    return rows


@frappe.whitelist()
def tour(name):
    _pruefen()
    t = frappe.get_doc("PH Tour", name)
    t.check_permission("read")
    stopps = []
    for s in t.stopps:
        d = s.as_dict()
        d["fotos"] = [f.as_dict() for f in t.fotos if int(f.stopp_nr or 0) == int(s.reihenfolge or 0)]
        d["unterlagen"] = []
        if s.lieferschein:
            ls = frappe.db.get_value("PH Lieferschein", s.lieferschein, ["name", "status", "lieferart", "kunde_email", "lieferhinweis", "abholcode"], as_dict=True)
            d["lieferschein_status"] = ls.status
            d["kunde_email"] = ls.kunde_email
            d["unterlagen"].append({"titel": _("Lieferschein {0}").format(ls.name), "url": f"/api/method/frappe.utils.print_format.download_pdf?doctype=PH%20Lieferschein&name={ls.name}&format=PH%20Lieferschein%20Standard&no_letterhead=0"})
            d["positionen"] = frappe.get_all("PH Lieferschein Position", {"parent": s.lieferschein}, ["beschreibung", "menge", "ausfuehrung_text", "marke"], order_by="idx")
        stopps.append(d)
    return {"tour": t.as_dict(), "stopps": stopps, "fahrer_name": frappe.db.get_value("User", t.fahrer, "full_name") if t.fahrer else None, "fahrzeug": frappe.db.get_value("PH Fahrzeug", t.fahrzeug, ["kennzeichen", "bezeichnung"], as_dict=True) if t.fahrzeug else None}


@frappe.whitelist()
def stopp_status(tour, stopp, status, notiz=None, unterschrift=None, unterschrift_name=None):
    _pruefen()
    return frappe.get_doc("PH Tour", tour).stopp_status(stopp, status, notiz, unterschrift, unterschrift_name)


@frappe.whitelist()
def foto(tour, stopp_nr, file_url, art="nachher", hinweis=None):
    _pruefen()
    return frappe.get_doc("PH Tour", tour).foto_hinzufuegen(stopp_nr, file_url, art, hinweis)


@frappe.whitelist()
def lieferbestaetigung(tour, stopp):
    _pruefen()
    return frappe.get_doc("PH Tour", tour).lieferbestaetigung_senden(stopp)


@frappe.whitelist()
def starten(tour, km_start=None):
    _pruefen()
    return frappe.get_doc("PH Tour", tour).starten(km_start)


@frappe.whitelist()
def abschliessen(tour, km_ende=None):
    _pruefen()
    return frappe.get_doc("PH Tour", tour).abschliessen(km_ende)
