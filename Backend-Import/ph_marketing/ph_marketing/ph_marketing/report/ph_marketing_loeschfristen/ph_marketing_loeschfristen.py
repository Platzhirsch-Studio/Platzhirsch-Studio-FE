"""Script Report A14: Löschfristen je Datenkategorie des Marketings (Vorlage für das Verarbeitungsverzeichnis)."""

from frappe import _


def execute(filters=None):
    from ph_marketing.ph_marketing import loeschfristen

    data = loeschfristen.uebersicht()
    columns = [
        {"fieldname": "kategorie", "label": _("Kategorie"), "fieldtype": "Data", "width": 190},
        {"fieldname": "doctype", "label": _("Daten"), "fieldtype": "Data", "width": 180},
        {"fieldname": "frist_tage", "label": _("Frist (Tage)"), "fieldtype": "Int", "width": 90},
        {"fieldname": "bezug", "label": _("ab Feld"), "fieldtype": "Data", "width": 110},
        {"fieldname": "aktion", "label": _("Aktion"), "fieldtype": "Data", "width": 110},
        {"fieldname": "faellig", "label": _("Derzeit fällig"), "fieldtype": "Int", "width": 100},
        {"fieldname": "grundlage", "label": _("Grundlage"), "fieldtype": "Data", "width": 320},
        {"fieldname": "lauf", "label": _("Lauf"), "fieldtype": "Data", "width": 200},
    ]
    return columns, data, _("Gesetzliche Aufbewahrung (§ 132 BAO) geht vor; Empfehlungen mit Gutschein werden 7 Jahre aufbewahrt.")
