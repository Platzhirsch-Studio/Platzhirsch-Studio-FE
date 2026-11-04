"""Script Report: Reaktionszeit auf Anfragen (Eingang → erste Reaktion) je Woche / Zuständigem / Quelle / Art.

Reaktion = erster Workflow-Schritt aus „Neu“ (Feld erstreaktion_am) oder, wenn früher, die erste
ausgehende E-Mail (Communication Sent) am Dokument. Anfragen ohne Reaktion zählen mit dem Alter bis jetzt.
"""

import statistics

import frappe
from frappe import _
from frappe.utils import add_months, cint, get_datetime, getdate, now_datetime, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -3))
    bis = getdate(filters.get("bis") or nowdate())
    ziel = cint(filters.get("ziel_h")) or 24
    nach = filters.get("nach") or "Woche"

    bedingungen = {"eingang": ("between", [von, bis]), "status": ("!=", "Spam")}
    if filters.get("zugewiesen_an"):
        bedingungen["zugewiesen_an"] = filters["zugewiesen_an"]
    anfragen = frappe.get_all("PH Anfrage", filters=bedingungen, fields=["name", "eingang", "erstreaktion_am", "zugewiesen_an", "quelle", "art", "status"])
    if not anfragen:
        return spalten(nach), [], None, None, []

    erste_mail = {}
    for c in frappe.get_all(
        "Communication",
        filters={"reference_doctype": "PH Anfrage", "reference_name": ("in", [a.name for a in anfragen]), "sent_or_received": "Sent"},
        fields=["reference_name", "min(communication_date) as erste"],
        group_by="reference_name",
    ):
        erste_mail[c.reference_name] = get_datetime(c.erste)

    jetzt = now_datetime()
    gruppen = {}
    for a in anfragen:
        eingang = get_datetime(a.eingang)
        reaktion = min([x for x in (get_datetime(a.erstreaktion_am) if a.erstreaktion_am else None, erste_mail.get(a.name)) if x], default=None)
        stunden = (reaktion - eingang).total_seconds() / 3600 if reaktion else None
        offen_h = (jetzt - eingang).total_seconds() / 3600 if not reaktion and a.status == "Neu" else None
        key = schluessel(nach, a, eingang)
        g = gruppen.setdefault(key, {"gruppe": key, "anzahl": 0, "beantwortet": 0, "offen": 0, "werte": [], "ueber_ziel": 0, "sort": sortier(nach, eingang, key)})
        g["anzahl"] += 1
        if stunden is not None:
            g["beantwortet"] += 1
            g["werte"].append(stunden)
            if stunden > ziel:
                g["ueber_ziel"] += 1
        elif offen_h is not None:
            g["offen"] += 1
            if offen_h > ziel:
                g["ueber_ziel"] += 1

    data = []
    for g in sorted(gruppen.values(), key=lambda x: x["sort"]):
        w = g["werte"]
        data.append(
            {
                "gruppe": g["gruppe"],
                "anzahl": g["anzahl"],
                "beantwortet": g["beantwortet"],
                "offen": g["offen"],
                "reaktion_h": round(sum(w) / len(w), 1) if w else None,
                "median_h": round(statistics.median(w), 1) if w else None,
                "max_h": round(max(w), 1) if w else None,
                "ueber_ziel": g["ueber_ziel"],
                "quote_im_ziel": round(100 * (g["beantwortet"] - sum(1 for x in w if x > ziel)) / g["beantwortet"], 1) if g["beantwortet"] else 0,
            }
        )

    alle = [x for g in gruppen.values() for x in g["werte"]]
    summary = [
        {"value": len(anfragen), "label": _("Anfragen"), "datatype": "Int"},
        {"value": round(sum(alle) / len(alle), 1) if alle else 0, "label": _("Ø Reaktion (h)"), "datatype": "Float", "indicator": "Green" if alle and sum(alle) / len(alle) <= ziel else "Orange"},
        {"value": round(statistics.median(alle), 1) if alle else 0, "label": _("Median (h)"), "datatype": "Float"},
        {"value": sum(g["offen"] for g in gruppen.values()), "label": _("Noch ohne Reaktion"), "datatype": "Int", "indicator": "Red"},
    ]
    chart = {
        "data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Ø Reaktion (h)"), "values": [d["reaktion_h"] or 0 for d in data]}, {"name": _("Median (h)"), "values": [d["median_h"] or 0 for d in data]}]},
        "type": "line" if nach == "Woche" else "bar",
        "colors": ["#b45309", "#30373e"],
    }
    return spalten(nach), data, None, chart, summary


def schluessel(nach, a, eingang):
    if nach == "Zuständig":
        return a.zugewiesen_an or _("nicht zugewiesen")
    if nach == "Quelle":
        return a.quelle or _("unbekannt")
    if nach == "Art":
        return a.art or "–"
    iso = eingang.isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def sortier(nach, eingang, key):
    return key if nach != "Woche" else eingang.strftime("%Y%W")


def spalten(nach):
    label = {"Woche": _("Woche"), "Zuständig": _("Zuständig"), "Quelle": _("Quelle"), "Art": _("Art")}.get(nach, _("Gruppe"))
    return [
        {"fieldname": "gruppe", "label": label, "fieldtype": "Data", "width": 170},
        {"fieldname": "anzahl", "label": _("Anfragen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "beantwortet", "label": _("Beantwortet"), "fieldtype": "Int", "width": 100},
        {"fieldname": "offen", "label": _("Offen (Neu)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "reaktion_h", "label": _("Ø Reaktion (h)"), "fieldtype": "Float", "width": 120},
        {"fieldname": "median_h", "label": _("Median (h)"), "fieldtype": "Float", "width": 100},
        {"fieldname": "max_h", "label": _("Max (h)"), "fieldtype": "Float", "width": 90},
        {"fieldname": "ueber_ziel", "label": _("Über Ziel"), "fieldtype": "Int", "width": 90},
        {"fieldname": "quote_im_ziel", "label": _("Im Ziel %"), "fieldtype": "Percent", "width": 90},
    ]
