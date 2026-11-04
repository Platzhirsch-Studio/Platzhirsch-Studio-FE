"""PH Export-Abgleich – exportierte Belege, die danach geändert wurden; Gutschriften zu exportierten Rechnungen ohne Export;
Journalkette prüfen."""

import frappe
from frappe import _

from ph_faktura import journal


def execute(filters=None):
    f = frappe._dict(filters or {})
    data = []
    laeufe = frappe.get_all("PH Export Lauf", filters={"name": f.export_lauf} if f.get("export_lauf") else {"status": ("in", ("Erzeugt", "Uebergeben", "Bestaetigt"))}, fields=["name", "erzeugt_am", "format", "status"])
    for lauf in laeufe:
        for b in frappe.get_all("PH Export Protokoll", filters={"parent": lauf.name, "parenttype": "PH Export Lauf"}, fields=["beleg_doctype", "beleg", "nummer", "brutto_cent", "pruefsumme"]):
            if not frappe.db.exists(b.beleg_doctype, b.beleg):
                data.append({"export_lauf": lauf.name, "beleg_doctype": b.beleg_doctype, "beleg": b.beleg, "nummer": b.nummer, "befund": _("Beleg existiert nicht mehr"), "schwere": "Rot"})
                continue
            d = frappe.db.get_value(b.beleg_doctype, b.beleg, ["modified", "brutto_cent", "status", "export_status"], as_dict=True)
            if d.export_status != "exportiert" and b.beleg_doctype != "PH Eingangsrechnung":
                data.append({"export_lauf": lauf.name, "beleg_doctype": b.beleg_doctype, "beleg": b.beleg, "nummer": b.nummer, "befund": _("export_status ist {0} statt exportiert").format(d.export_status), "schwere": "Orange"})
            if int(d.brutto_cent or 0) != int(b.brutto_cent or 0):
                data.append({"export_lauf": lauf.name, "beleg_doctype": b.beleg_doctype, "beleg": b.beleg, "nummer": b.nummer, "befund": _("Betrag geändert: Export {0} ≠ Beleg {1}").format(b.brutto_cent, d.brutto_cent), "schwere": "Rot"})
            elif lauf.erzeugt_am and d.modified and d.modified > lauf.erzeugt_am and b.beleg_doctype != "PH Rechnung":
                data.append({"export_lauf": lauf.name, "beleg_doctype": b.beleg_doctype, "beleg": b.beleg, "nummer": b.nummer, "befund": _("Nach Export geändert ({0})").format(d.modified), "schwere": "Orange"})
            if b.beleg_doctype == "PH Rechnung":
                for g in frappe.get_all("PH Gutschrift", filters={"rechnung": b.beleg, "docstatus": 1, "export_status": "offen"}, pluck="name"):
                    data.append({"export_lauf": lauf.name, "beleg_doctype": "PH Gutschrift", "beleg": g, "nummer": g, "befund": _("Gutschrift zu exportierter Rechnung {0} noch nicht übergeben").format(b.beleg), "schwere": "Orange"})
    gebrochen = journal.kette_pruefen()
    for n in gebrochen:
        data.append({"export_lauf": "", "beleg_doctype": "PH Buchungsjournal", "beleg": n, "nummer": n, "befund": _("Prüfsummenkette gebrochen"), "schwere": "Rot"})
    columns = [
        {"fieldname": "export_lauf", "label": _("Export-Lauf"), "fieldtype": "Link", "options": "PH Export Lauf", "width": 130},
        {"fieldname": "beleg_doctype", "label": _("Belegart"), "fieldtype": "Data", "width": 140},
        {"fieldname": "beleg", "label": _("Beleg"), "fieldtype": "Dynamic Link", "options": "beleg_doctype", "width": 150},
        {"fieldname": "nummer", "label": _("Nummer"), "fieldtype": "Data", "width": 130},
        {"fieldname": "befund", "label": _("Befund"), "fieldtype": "Data", "width": 420},
        {"fieldname": "schwere", "label": _("Schwere"), "fieldtype": "Data", "width": 80},
    ]
    rot = len([d for d in data if d["schwere"] == "Rot"])
    summary = [{"value": len(data), "label": _("Befunde"), "datatype": "Int", "indicator": "Green" if not data else "Orange"}, {"value": rot, "label": _("kritisch"), "datatype": "Int", "indicator": "Red" if rot else "Green"}, {"value": len(laeufe), "label": _("geprüfte Läufe"), "datatype": "Int"}]
    message = _("Journalkette: {0}.").format(_("intakt") if not gebrochen else _("{0} gebrochene Einträge").format(len(gebrochen)))
    return columns, data, message, None, summary
