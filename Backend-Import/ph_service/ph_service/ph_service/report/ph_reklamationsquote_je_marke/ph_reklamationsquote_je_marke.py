"""Reklamationsquote je Marke oder Lieferant: Fälle (gesamt, bestätigt, abgelehnt, offen), Ø Durchlaufzeit, Kosten,
Regress erhalten und – wenn ph_faktura installiert ist – ausgelieferte Positionen (gestellte Rechnungen) als Nenner."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    gruppe = "lieferant" if filters.get("nach") == "Lieferant" else "marke"

    faelle = frappe.get_all(
        "PH Servicefall",
        filters={"gemeldet_am": ("between", [von, bis])},
        fields=[gruppe, "status", "mangel_bestaetigt", "dauer_tage", "kosten_gesamt_cent", "regress_erhalten_cent", "netto_kosten_cent", "art"],
    )
    agg = {}
    for f in faelle:
        key = f.get(gruppe) or _("ohne Zuordnung")
        a = agg.setdefault(key, {"gruppe": key, "faelle": 0, "bestaetigt": 0, "abgelehnt": 0, "offen": 0, "transport": 0, "dauer_sum": 0, "dauer_n": 0, "kosten_cent": 0, "regress_cent": 0, "netto_cent": 0})
        a["faelle"] += 1
        if f.mangel_bestaetigt in ("Ja", "Teilweise"):
            a["bestaetigt"] += 1
        if f.status == "Abgelehnt":
            a["abgelehnt"] += 1
        elif f.status not in ("Erledigt", "Geschlossen"):
            a["offen"] += 1
        if f.art == "Transportschaden":
            a["transport"] += 1
        if f.dauer_tage is not None:
            a["dauer_sum"] += cint(f.dauer_tage)
            a["dauer_n"] += 1
        a["kosten_cent"] += cint(f.kosten_gesamt_cent)
        a["regress_cent"] += cint(f.regress_erhalten_cent)
        a["netto_cent"] += cint(f.netto_kosten_cent)

    geliefert = _ausgelieferte_positionen(von, bis, gruppe)

    data = []
    for key, a in sorted(agg.items(), key=lambda kv: -kv[1]["faelle"]):
        n = geliefert.get(key)
        data.append(
            {
                "gruppe": key,
                "faelle": a["faelle"],
                "bestaetigt": a["bestaetigt"],
                "abgelehnt": a["abgelehnt"],
                "offen": a["offen"],
                "transport": a["transport"],
                "geliefert": n,
                "quote": round(100 * a["faelle"] / n, 1) if n else None,
                "dauer": round(a["dauer_sum"] / a["dauer_n"], 1) if a["dauer_n"] else None,
                "kosten": a["kosten_cent"] / 100,
                "regress": a["regress_cent"] / 100,
                "netto": a["netto_cent"] / 100,
            }
        )
    for key, n in geliefert.items():
        if key not in agg and n:
            data.append({"gruppe": key, "faelle": 0, "bestaetigt": 0, "abgelehnt": 0, "offen": 0, "transport": 0, "geliefert": n, "quote": 0, "dauer": None, "kosten": 0, "regress": 0, "netto": 0})

    columns = [
        {"fieldname": "gruppe", "label": _("Lieferant") if gruppe == "lieferant" else _("Marke"), "fieldtype": "Link", "options": "PH Lieferant" if gruppe == "lieferant" else "PH Marke", "width": 200},
        {"fieldname": "faelle", "label": _("Fälle"), "fieldtype": "Int", "width": 70},
        {"fieldname": "bestaetigt", "label": _("Bestätigt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "abgelehnt", "label": _("Abgelehnt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "offen", "label": _("Offen"), "fieldtype": "Int", "width": 70},
        {"fieldname": "transport", "label": _("Transport"), "fieldtype": "Int", "width": 90},
        {"fieldname": "geliefert", "label": _("Gelieferte Positionen"), "fieldtype": "Int", "width": 140},
        {"fieldname": "quote", "label": _("Quote %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "dauer", "label": _("Ø Durchlaufzeit (Tage)"), "fieldtype": "Float", "width": 150},
        {"fieldname": "kosten", "label": _("Kosten €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "regress", "label": _("Regress erhalten €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "netto", "label": _("Netto €"), "fieldtype": "Currency", "width": 110},
    ]
    chart = {
        "data": {"labels": [d["gruppe"] for d in data[:12]], "datasets": [{"name": _("Fälle"), "values": [d["faelle"] for d in data[:12]]}, {"name": _("Bestätigt"), "values": [d["bestaetigt"] for d in data[:12]]}]},
        "type": "bar",
        "colors": ["#30373e", "#b45309"],
    }
    gesamt = sum(d["faelle"] for d in data)
    best = sum(d["bestaetigt"] for d in data)
    gel = sum(d["geliefert"] or 0 for d in data)
    summary = [
        {"value": gesamt, "label": _("Servicefälle"), "datatype": "Int"},
        {"value": best, "label": _("Mangel bestätigt"), "datatype": "Int", "indicator": "Orange"},
        {"value": round(100 * gesamt / gel, 1) if gel else 0, "label": _("Quote % (Fälle / gelieferte Positionen)"), "datatype": "Percent"},
        {"value": sum(d["netto"] for d in data), "label": _("Nettokosten €"), "datatype": "Currency", "indicator": "Red"},
    ]
    message = None if gel else _("Hinweis: Keine gelieferten Positionen gefunden (ph_faktura PH Rechnung/PH Beleg Position) – Quote nur als Fallzahl.")
    return columns, data, message, chart, summary


def _ausgelieferte_positionen(von, bis, gruppe):
    """Positionen gestellter Rechnungen je Marke/Lieferant (Nenner der Quote). Feldnamen laut PLAN WP6/WP3."""
    if not (frappe.db.exists("DocType", "PH Beleg Position") and frappe.db.exists("DocType", "PH Rechnung") and frappe.db.exists("DocType", "PH Produkt")):
        return {}
    try:
        Pos = frappe.qb.DocType("PH Beleg Position")
        Re = frappe.qb.DocType("PH Rechnung")
        Pr = frappe.qb.DocType("PH Produkt")
        q = (
            frappe.qb.from_(Pos)
            .join(Re).on((Pos.parent == Re.name) & (Pos.parenttype == "PH Rechnung"))
            .join(Pr).on(Pos.produkt == Pr.name)
            .where((Re.docstatus == 1) & (Re.datum >= von) & (Re.datum <= bis))
        )
        if gruppe == "lieferant" and frappe.db.exists("DocType", "PH Marke"):
            Ma = frappe.qb.DocType("PH Marke")
            q = q.join(Ma).on(Pr.marke == Ma.name).select(Ma.lieferant.as_("gruppe"), frappe.query_builder.functions.Sum(Pos.menge).as_("n")).groupby(Ma.lieferant)
        else:
            q = q.select(Pr.marke.as_("gruppe"), frappe.query_builder.functions.Sum(Pos.menge).as_("n")).groupby(Pr.marke)
        return {r.gruppe or _("ohne Zuordnung"): cint(r.n) for r in q.run(as_dict=True)}
    except Exception:  # noqa: BLE001 – Felder der Nachbar-Apps weichen ab
        frappe.log_error(title="PH Reklamationsquote: gelieferte Positionen")
        return {}
