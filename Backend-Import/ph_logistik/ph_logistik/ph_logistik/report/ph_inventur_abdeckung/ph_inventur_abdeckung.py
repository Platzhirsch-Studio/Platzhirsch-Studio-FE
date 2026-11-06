"""Script Report: Inventur-Abdeckung je Lagerplatz – wann zuletzt gezählt, im laufenden Geschäftsjahr gezählt (Plan: jeder Platz
mindestens 1× je Geschäftsjahr); Reihenfolge = Vorschlag der nächsten zu zählenden Plätze."""

import frappe
from frappe import _
from frappe.utils import cint, date_diff, nowdate

from ph_logistik.ph_logistik import inventur_logik as IL
from ph_logistik.ph_logistik.helfer import einstellungen
from ph_logistik.ph_logistik.inventur_plan import plaetze


def execute(filters=None):
    f = frappe._dict(filters or {})
    bm = cint(einstellungen().get("geschaeftsjahr_beginn_monat")) or 1
    heute = nowdate()
    alle = plaetze(f.get("lagerort"))
    data = []
    for i, p in enumerate(IL.plaetze_vorschlagen(alle, heute, bm, len(alle)), 1):
        im_gj = IL.im_gj_gezaehlt(p.get("zuletzt"), heute, bm)
        if cint(f.get("nur_offen")) and im_gj:
            continue
        data.append({"rang": i, "lagerort": p["lagerort"], "platz": p["platz"], "zuletzt": p.get("zuletzt"), "inventur": p.get("inventur"),
                     "tage_seit": date_diff(heute, p["zuletzt"]) if p.get("zuletzt") else None, "im_gj": int(im_gj), "bestand_positionen": p.get("bestand_positionen"),
                     "hinweis": _("nicht im Platzstamm") if p.get("nicht_im_stamm") else ""})
    a = IL.abdeckung(alle, heute, bm)
    columns = [
        {"fieldname": "rang", "label": _("Reihenfolge"), "fieldtype": "Int", "width": 90},
        {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 140},
        {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 120},
        {"fieldname": "zuletzt", "label": _("Zuletzt gezählt"), "fieldtype": "Date", "width": 110},
        {"fieldname": "inventur", "label": _("Inventur"), "fieldtype": "Link", "options": "PH Inventur", "width": 140},
        {"fieldname": "tage_seit", "label": _("Tage seit"), "fieldtype": "Int", "width": 80},
        {"fieldname": "im_gj", "label": _("Im GJ gezählt"), "fieldtype": "Check", "width": 100},
        {"fieldname": "bestand_positionen", "label": _("Bestandszeilen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Data", "width": 150},
    ]
    summary = [
        {"value": a["gesamt"], "label": _("Plätze"), "datatype": "Int"},
        {"value": a["gezaehlt"], "label": _("Im GJ gezählt"), "datatype": "Int"},
        {"value": a["quote_promille"] / 10, "label": _("Abdeckung %"), "datatype": "Float", "indicator": "Green" if a["rueckstand"] == 0 else "Orange"},
        {"value": a["soll_promille"] / 10, "label": _("Soll lt. Plan %"), "datatype": "Float"},
        {"value": a["rueckstand"], "label": _("Rückstand Plätze"), "datatype": "Int", "indicator": "Red" if a["rueckstand"] else "Green"},
        {"value": IL.plaetze_je_woche(a["offen"], heute, bm), "label": _("Plätze je Woche nötig"), "datatype": "Int"},
    ]
    msg = _("Geschäftsjahr {0} – {1}. Plan: jeder Lagerplatz mindestens einmal je Geschäftsjahr.").format(frappe.utils.formatdate(a["gj_beginn"]), frappe.utils.formatdate(a["gj_ende"]))
    return columns, data, msg, None, summary
