"""Script Report: Abos je Monat und Quelle, DOI-Quote, Abmeldungen, Netto-Entwicklung."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -6))
    bis = getdate(filters.get("bis") or nowdate())
    nach_quelle = filters.get("nach") == "Quelle"

    abos = frappe.get_all("PH Newsletter Abo", filters={"angemeldet_am": ("between", [von, bis])}, fields=["quelle", "angemeldet_am", "doi_bestaetigt_am", "status"])
    abmeldungen = frappe.get_all("PH Newsletter Abo", filters={"abgemeldet_am": ("between", [von, bis])}, fields=["quelle", "abgemeldet_am", "abmelde_kanal"])

    agg = {}

    def key(datum, quelle):
        return quelle or _("unbekannt") if nach_quelle else str(datum)[:7]

    for a in abos:
        k = key(a.angemeldet_am, a.quelle)
        r = agg.setdefault(k, {"gruppe": k, "anmeldungen": 0, "bestaetigt": 0, "offen": 0, "abmeldungen": 0, "bounce": 0})
        r["anmeldungen"] += 1
        if a.doi_bestaetigt_am:
            r["bestaetigt"] += 1
        elif a.status == "Angemeldet unbestaetigt":
            r["offen"] += 1
    for a in abmeldungen:
        k = key(a.abgemeldet_am, a.quelle)
        r = agg.setdefault(k, {"gruppe": k, "anmeldungen": 0, "bestaetigt": 0, "offen": 0, "abmeldungen": 0, "bounce": 0})
        if a.abmelde_kanal in ("bounce", "beschwerde"):
            r["bounce"] += 1
        else:
            r["abmeldungen"] += 1

    data = []
    for r in sorted(agg.values(), key=lambda x: x["gruppe"]):
        r["doi_quote"] = round(100 * r["bestaetigt"] / r["anmeldungen"], 1) if r["anmeldungen"] else 0
        r["netto"] = r["bestaetigt"] - r["abmeldungen"] - r["bounce"]
        data.append(r)

    columns = [
        {"fieldname": "gruppe", "label": _("Quelle") if nach_quelle else _("Monat"), "fieldtype": "Data", "width": 140},
        {"fieldname": "anmeldungen", "label": _("Anmeldungen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "bestaetigt", "label": _("Bestätigt (DOI)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "offen", "label": _("Noch offen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "doi_quote", "label": _("DOI-Quote %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "abmeldungen", "label": _("Abmeldungen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "bounce", "label": _("Bounce/Beschwerde"), "fieldtype": "Int", "width": 140},
        {"fieldname": "netto", "label": _("Netto"), "fieldtype": "Int", "width": 90},
    ]
    chart = {"data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Bestätigt"), "values": [d["bestaetigt"] for d in data]}, {"name": _("Abmeldungen"), "values": [d["abmeldungen"] for d in data]}]}, "type": "bar", "colors": ["#15803d", "#b91c1c"]}
    gesamt = sum(d["anmeldungen"] for d in data)
    best = sum(d["bestaetigt"] for d in data)
    summary = [
        {"value": frappe.db.count("PH Newsletter Abo", {"status": "Aktiv"}), "label": _("Aktive Abos gesamt"), "datatype": "Int", "indicator": "Green"},
        {"value": gesamt, "label": _("Anmeldungen im Zeitraum"), "datatype": "Int"},
        {"value": round(100 * best / gesamt, 1) if gesamt else 0, "label": _("DOI-Quote %"), "datatype": "Percent"},
        {"value": sum(d["abmeldungen"] + d["bounce"] for d in data), "label": _("Abgänge"), "datatype": "Int", "indicator": "Red"},
    ]
    return columns, data, None, chart, summary
