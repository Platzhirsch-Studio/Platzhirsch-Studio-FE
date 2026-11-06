"""Script Report: Kampagnenkosten vs. Anfragen (ph_crm) und gewonnene Anfragen; Aufträge aus ph_faktura, falls installiert."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    f = {"zeitraum_von": ("<=", bis)}
    if filters.get("kanal"):
        f["kanal"] = filters.kanal
    if filters.get("status"):
        f["status"] = filters.status
    kampagnen = frappe.get_all("PH Kampagne", filters=f, fields=["name", "titel", "kanal", "status", "zeitraum_von", "zeitraum_bis", "budget_cent", "ausgaben_cent", "impressionen_gesamt", "klicks_gesamt", "utm_campaign"])
    kampagnen = [k for k in kampagnen if not k.zeitraum_bis or getdate(k.zeitraum_bis) >= von]
    hat_feld = frappe.db.exists("DocType", "PH Anfrage") and frappe.db.has_column("PH Anfrage", "ph_marketing_kampagne")
    # Anfragebezug: PH Auftragsbestaetigung.angebot → PH Angebot.anfrage (ph_faktura, geprüft 04.11.); Umsatz = brutto_cent
    hat_ab = frappe.db.exists("DocType", "PH Auftragsbestaetigung") and frappe.db.exists("DocType", "PH Angebot")

    # Attribution über Kontaktpunkte (Website-UTM) und Aufträge/Bestellungen – Modell wählbar (First/Last/Linear)
    from ph_marketing.ph_marketing import kampagnen as kam

    modell = filters.get("modell") or None
    attribuiert = kam.auswerten(modell=modell, fenster_tage=filters.get("fenster_tage"), kampagnen=[k.name for k in kampagnen])

    data = []
    for k in kampagnen:
        anfragen = gewonnen = auftraege = umsatz = 0
        if hat_feld:
            rows = frappe.get_all("PH Anfrage", filters={"ph_marketing_kampagne": k.name, "status": ("!=", "Spam")}, fields=["name", "status"])
            anfragen = len(rows)
            gewonnen = sum(1 for r in rows if r.status == "Gewonnen")
            if hat_ab and rows:
                angebote = frappe.get_all("PH Angebot", filters={"anfrage": ("in", [r.name for r in rows])}, pluck="name")
                abs_ = frappe.get_all("PH Auftragsbestaetigung", filters={"angebot": ("in", angebote), "status": ("!=", "Storniert")}, fields=["name", "brutto_cent"]) if angebote else []
                auftraege = len(abs_)
                umsatz = sum(cint(a.get("brutto_cent")) for a in abs_)
        data.append({
            "kampagne": k.name, "titel": k.titel, "kanal": k.kanal, "status": k.status, "zeitraum_von": k.zeitraum_von, "zeitraum_bis": k.zeitraum_bis,
            "budget": cint(k.budget_cent) / 100, "ausgaben": cint(k.ausgaben_cent) / 100, "klicks": cint(k.klicks_gesamt),
            "cpc": round(cint(k.ausgaben_cent) / cint(k.klicks_gesamt) / 100, 2) if k.klicks_gesamt else None,
            "anfragen": anfragen, "cpl": round(cint(k.ausgaben_cent) / anfragen / 100, 2) if anfragen else None,
            "gewonnen": gewonnen, "auftraege": auftraege, "umsatz": umsatz / 100,
            "roi": round(100 * (umsatz - cint(k.ausgaben_cent)) / cint(k.ausgaben_cent), 1) if k.ausgaben_cent and umsatz else None,
            "kontaktpunkte": attribuiert.get(k.name, {}).get("kontaktpunkte", 0),
            "abschluesse_attr": attribuiert.get(k.name, {}).get("abschluesse", 0),
            "umsatz_attr": attribuiert.get(k.name, {}).get("umsatz_cent", 0) / 100,
            "roi_attr": round(100 * (attribuiert.get(k.name, {}).get("umsatz_cent", 0) - cint(k.ausgaben_cent)) / cint(k.ausgaben_cent), 1) if k.ausgaben_cent and attribuiert.get(k.name, {}).get("umsatz_cent") else None,
        })
    data.sort(key=lambda d: -d["ausgaben"])
    columns = [
        {"fieldname": "kampagne", "label": _("Kampagne"), "fieldtype": "Link", "options": "PH Kampagne", "width": 130},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 200},
        {"fieldname": "kanal", "label": _("Kanal"), "fieldtype": "Data", "width": 100},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "zeitraum_von", "label": _("Von"), "fieldtype": "Date", "width": 95},
        {"fieldname": "zeitraum_bis", "label": _("Bis"), "fieldtype": "Date", "width": 95},
        {"fieldname": "budget", "label": _("Budget €"), "fieldtype": "Currency", "options": "EUR", "width": 100},
        {"fieldname": "ausgaben", "label": _("Ausgaben €"), "fieldtype": "Currency", "options": "EUR", "width": 100},
        {"fieldname": "klicks", "label": _("Klicks"), "fieldtype": "Int", "width": 80},
        {"fieldname": "cpc", "label": _("€/Klick"), "fieldtype": "Currency", "options": "EUR", "width": 90},
        {"fieldname": "anfragen", "label": _("Anfragen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "cpl", "label": _("€/Anfrage"), "fieldtype": "Currency", "options": "EUR", "width": 100},
        {"fieldname": "gewonnen", "label": _("Gewonnen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "auftraege", "label": _("Aufträge (AB)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "umsatz", "label": _("Umsatz €"), "fieldtype": "Currency", "options": "EUR", "width": 110},
        {"fieldname": "roi", "label": _("ROI %"), "fieldtype": "Percent", "width": 80},
        {"fieldname": "kontaktpunkte", "label": _("Kontaktpunkte"), "fieldtype": "Int", "width": 100},
        {"fieldname": "abschluesse_attr", "label": _("Abschlüsse (attribuiert)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "umsatz_attr", "label": _("Umsatz attribuiert €"), "fieldtype": "Currency", "options": "EUR", "width": 130},
        {"fieldname": "roi_attr", "label": _("ROI attribuiert %"), "fieldtype": "Percent", "width": 110},
    ]
    chart = {"data": {"labels": [d["titel"][:24] for d in data[:10]], "datasets": [{"name": _("Ausgaben €"), "values": [d["ausgaben"] for d in data[:10]]}, {"name": _("Anfragen"), "values": [d["anfragen"] for d in data[:10]]}]}, "type": "bar", "colors": ["#8a7a66", "#30373e"]}
    ausg = sum(d["ausgaben"] for d in data)
    anf = sum(d["anfragen"] for d in data)
    summary = [
        {"value": ausg, "label": _("Ausgaben €"), "datatype": "Currency", "currency": "EUR"},
        {"value": anf, "label": _("Anfragen"), "datatype": "Int"},
        {"value": round(ausg / anf, 2) if anf else 0, "label": _("€ je Anfrage"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["gewonnen"] for d in data), "label": _("Gewonnen"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["umsatz_attr"] for d in data), "label": _("Umsatz attribuiert €"), "datatype": "Currency", "currency": "EUR"},
    ]
    hinweis = None if hat_feld else _("Hinweis: Custom Field PH Anfrage.ph_marketing_kampagne noch nicht installiert – Anfragen werden erst nach bench migrate zugeordnet.")
    return columns, data, hinweis, chart, summary
