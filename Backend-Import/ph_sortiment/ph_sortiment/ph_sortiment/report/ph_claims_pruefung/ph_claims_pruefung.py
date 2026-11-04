"""Script Report: Claims-Prüfung – Marken mit Händlerwörtern/Claims ohne Vertrag, auslaufende Verträge,
Abgleich mit der Website-Liste VERIFIED_DEALER_BRANDS (src/lib/legal/claims.js, Stand 31.10.2026)."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate

from ph_sortiment.ph_sortiment.doctype.ph_marke.ph_marke import HAENDLER_RE, MIT_STATUS, TEXTFELDER

# Spiegel von claims.js VERIFIED_DEALER_BRANDS (nur zum Abgleich; Quelle der Wahrheit bleibt die Website-Datei).
WEBSITE_VERIFIED = {
    "classicon", "ezarri", "minotti", "starpool", "soleum", "fabio-alemanno", "aquavia-spa", "naggura", "dornbracht", "antoniolupi",
    "gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker", "baobab-collection", "riedel", "cire-trudon",
    "flos", "tom-dixon", "zalto", "assouline", "kahler", "lyngby-porcelaen",
}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    marken = frappe.get_all("PH Marke", fields=["name", "slug", "status", "haendlerstatus", "haendler_wortlaut", "haendlervertrag", "haendler_beleg_url", "haendler_notiz", "vertrag_gueltig_bis", "bildfreigabe_status", *TEXTFELDER], order_by="marke asc")
    data = []
    for m in marken:
        claims = frappe.db.count("PH Marke Claim", {"parent": m.name, "parenttype": "PH Marke"})
        woerter = []
        for feld in TEXTFELDER:
            t = frappe.utils.strip_html(m.get(feld) or "")
            hit = HAENDLER_RE.search(t)
            if hit:
                woerter.append(f"{feld}: „{hit.group(0)}“")
        mit_status = m.haendlerstatus in MIT_STATUS
        beleg = bool(m.haendlervertrag or m.haendler_beleg_url)
        befunde = []
        if mit_status and not beleg:
            befunde.append(_("Status ohne Vertrag/Beleg-URL (nur Aktenhinweis)"))
        if not mit_status and (claims or woerter):
            befunde.append(_("Claim/Händlerwort ohne Status"))
        if m.vertrag_gueltig_bis and getdate(m.vertrag_gueltig_bis) < getdate(add_days(nowdate(), 60)):
            befunde.append(_("Vertrag läuft aus/abgelaufen ({0})").format(frappe.utils.formatdate(m.vertrag_gueltig_bis)))
        if (m.slug in WEBSITE_VERIFIED) != mit_status:
            befunde.append(_("Website-Liste weicht ab (claims.js: {0})").format(_("belegt") if m.slug in WEBSITE_VERIFIED else _("nicht belegt")))
        if mit_status and m.bildfreigabe_status != "schriftlich erteilt":
            befunde.append(_("Bildfreigabe nicht schriftlich"))
        if filters.get("nur_befunde") and not befunde:
            continue
        data.append({"marke": m.name, "status": m.status, "haendlerstatus": m.haendlerstatus, "wortlaut": m.haendler_wortlaut, "vertrag": 1 if m.haendlervertrag else 0, "beleg_url": m.haendler_beleg_url, "vertrag_bis": m.vertrag_gueltig_bis, "claims": claims, "woerter": "; ".join(woerter), "website": 1 if m.slug in WEBSITE_VERIFIED else 0, "bildfreigabe": m.bildfreigabe_status, "befund": "; ".join(befunde), "ampel": "rot" if any("ohne Status" in b or "abgelaufen" in b for b in befunde) else ("gelb" if befunde else "grün")})

    columns = [
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 160},
        {"fieldname": "ampel", "label": _("Ampel"), "fieldtype": "Data", "width": 60},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 80},
        {"fieldname": "haendlerstatus", "label": _("Händlerstatus"), "fieldtype": "Data", "width": 120},
        {"fieldname": "wortlaut", "label": _("Wortlaut"), "fieldtype": "Data", "width": 80},
        {"fieldname": "vertrag", "label": _("Vertrag abgelegt"), "fieldtype": "Check", "width": 100},
        {"fieldname": "beleg_url", "label": _("Öffentlicher Beleg"), "fieldtype": "Data", "width": 200},
        {"fieldname": "vertrag_bis", "label": _("Vertrag bis"), "fieldtype": "Date", "width": 100},
        {"fieldname": "claims", "label": _("Claims"), "fieldtype": "Int", "width": 60},
        {"fieldname": "website", "label": _("Website belegt"), "fieldtype": "Check", "width": 100},
        {"fieldname": "bildfreigabe", "label": _("Bildfreigabe"), "fieldtype": "Data", "width": 120},
        {"fieldname": "woerter", "label": _("Händlerwörter in Texten"), "fieldtype": "Data", "width": 220},
        {"fieldname": "befund", "label": _("Befund"), "fieldtype": "Data", "width": 360},
    ]
    summary = [
        {"value": sum(1 for d in data if d["ampel"] == "rot"), "label": _("Rot (Claim ohne Status / Vertrag abgelaufen)"), "datatype": "Int", "indicator": "Red"},
        {"value": sum(1 for d in data if d["ampel"] == "gelb"), "label": _("Gelb (Beleg/Bildfreigabe nachreichen)"), "datatype": "Int", "indicator": "Orange"},
        {"value": sum(1 for d in data if d["ampel"] == "grün"), "label": _("Grün"), "datatype": "Int", "indicator": "Green"},
    ]
    return columns, data, _("Quelle der Website-Spalte: src/lib/legal/claims.js VERIFIED_DEALER_BRANDS (31.10.2026). Jede Abweichung mit dem Inhaber klären, Verträge vor dem Deploy ablegen."), None, summary
