"""Fehlercode-Statistik (SHD resy): Fälle je Bereich → Code als Baum mit Anteil, Bestätigungsquote, Ø Durchlaufzeit und Kosten."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    bedingungen = {"gemeldet_am": ("between", [von, bis])}
    if filters.get("marke"):
        bedingungen["marke"] = filters.marke
    if filters.get("bereich"):
        bedingungen["fehlerbereich"] = filters.bereich

    faelle = frappe.get_all("PH Servicefall", filters=bedingungen, fields=["fehlerbereich", "fehlercode", "mangel_bestaetigt", "dauer_tage", "kosten_gesamt_cent", "status"])
    bereiche = {b.name: b for b in frappe.get_all("PH Fehlerbereich", fields=["name", "bezeichnung", "sortierung"])}
    codes = {c.name: c for c in frappe.get_all("PH Fehlercode", fields=["name", "bezeichnung", "gruppe", "lieferantenrelevant"])}

    baum = {}
    gesamt = len(faelle)
    for f in faelle:
        b = f.fehlerbereich or "–"
        c = f.fehlercode or "–"
        kb = baum.setdefault(b, {"n": 0, "best": 0, "dauer": 0, "dn": 0, "kosten": 0, "codes": {}})
        kc = kb["codes"].setdefault(c, {"n": 0, "best": 0, "dauer": 0, "dn": 0, "kosten": 0})
        for k in (kb, kc):
            k["n"] += 1
            if f.mangel_bestaetigt in ("Ja", "Teilweise"):
                k["best"] += 1
            if f.dauer_tage is not None:
                k["dauer"] += cint(f.dauer_tage)
                k["dn"] += 1
            k["kosten"] += cint(f.kosten_gesamt_cent)

    def zeile(key, k, indent, bezeichnung, gruppe="", lr=None):
        return {
            "code": key,
            "bezeichnung": bezeichnung,
            "gruppe": gruppe,
            "lieferantenrelevant": lr,
            "anzahl": k["n"],
            "anteil": round(100 * k["n"] / gesamt, 1) if gesamt else 0,
            "bestaetigt_quote": round(100 * k["best"] / k["n"], 1) if k["n"] else 0,
            "dauer": round(k["dauer"] / k["dn"], 1) if k["dn"] else None,
            "kosten": k["kosten"] / 100,
            "indent": indent,
        }

    data = []
    for b, kb in sorted(baum.items(), key=lambda kv: (bereiche.get(kv[0], frappe._dict(sortierung=999)).sortierung or 999, -kv[1]["n"])):
        data.append(zeile(b, kb, 0, bereiche[b].bezeichnung if b in bereiche else _("ohne Bereich")))
        for c, kc in sorted(kb["codes"].items(), key=lambda kv: -kv[1]["n"]):
            cd = codes.get(c)
            data.append(zeile(c, kc, 1, cd.bezeichnung if cd else _("ohne Code"), cd.gruppe if cd else "", cd.lieferantenrelevant if cd else None))

    columns = [
        {"fieldname": "code", "label": _("Bereich / Code"), "fieldtype": "Data", "width": 130},
        {"fieldname": "bezeichnung", "label": _("Bezeichnung"), "fieldtype": "Data", "width": 240},
        {"fieldname": "gruppe", "label": _("Gruppe"), "fieldtype": "Data", "width": 110},
        {"fieldname": "lieferantenrelevant", "label": _("Lieferant"), "fieldtype": "Check", "width": 80},
        {"fieldname": "anzahl", "label": _("Fälle"), "fieldtype": "Int", "width": 70},
        {"fieldname": "anteil", "label": _("Anteil %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "bestaetigt_quote", "label": _("Bestätigt %"), "fieldtype": "Percent", "width": 100},
        {"fieldname": "dauer", "label": _("Ø Tage"), "fieldtype": "Float", "width": 80},
        {"fieldname": "kosten", "label": _("Kosten €"), "fieldtype": "Currency", "width": 110},
    ]
    top = [d for d in data if d["indent"] == 0][:10]
    chart = {"data": {"labels": [d["bezeichnung"] for d in top], "datasets": [{"name": _("Fälle"), "values": [d["anzahl"] for d in top]}]}, "type": "bar", "colors": ["#8a7a66"]}
    summary = [
        {"value": gesamt, "label": _("Fälle"), "datatype": "Int"},
        {"value": len(baum), "label": _("Bereiche betroffen"), "datatype": "Int"},
        {"value": sum(d["kosten"] for d in data if d["indent"] == 0), "label": _("Kosten €"), "datatype": "Currency", "indicator": "Red"},
    ]
    return columns, data, None, chart, summary
