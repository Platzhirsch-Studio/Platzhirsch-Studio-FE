"""Bewertungen: direkte Rückmeldungen von der Website (/de/bewerten, QR-Karte) und Google-Bewertungen fürs Backoffice.

Regeln: ph_marketing/utils/bewertung.py (kein Gating, kein Anreiz, Maskierung). Öffentliche Liste nur mit Status
„Veroeffentlicht“; direkte Rückmeldungen nur mit eigener Einwilligung zur Veröffentlichung.
"""

import frappe
from frappe import _
from frappe.utils import cint, get_datetime

from ph_core.api import ApiFehler, ip_hash
from ph_marketing.utils import bewertung as bw
from ph_marketing.utils.token import email_maskieren, email_normalisieren, email_plausibel

DT = "PH Bewertung"


def anlegen(d, idempotency_key=None):
    """d: {sterne?, text?, name?, email?, anlass?, quelle?, einwilligung_veroeffentlichung?, textversion?, seite?, kontakt?}"""
    try:
        sterne = bw.sterne_pruefen(d.get("sterne") if d.get("sterne") is not None else d.get("rating"))
    except ValueError:
        raise ApiFehler("invalid", 400, _("Sterne müssen zwischen 1 und 5 liegen."), {"field": "sterne"})
    inhalt = bw.text_bereinigen(d.get("text") or d.get("nachricht") or d.get("message"))
    if not inhalt and not sterne:
        raise ApiFehler("invalid", 400, _("Bitte Sterne oder einen Text angeben."), {"field": "text"})
    email = email_normalisieren(d.get("email"))
    if email and not email_plausibel(email):
        raise ApiFehler("invalid", 400, _("E-Mail-Adresse ist ungültig."), {"field": "email"})
    einwilligung = cint(d.get("einwilligung_veroeffentlichung") or d.get("consent_publish"))
    textversion = bw.text_bereinigen(d.get("textversion") or d.get("einwilligung_text_version"), 80)
    if einwilligung and not textversion:
        raise ApiFehler("invalid", 400, _("Textversion der Einwilligung fehlt."), {"field": "textversion"})
    kontakt = bw.text_bereinigen(d.get("kontakt"), 140)
    if kontakt and not (frappe.db.exists("DocType", "PH Kontakt") and frappe.db.exists("PH Kontakt", kontakt)):
        kontakt = ""
    doc = frappe.get_doc({
        "doctype": DT,
        "quelle": bw.quelle_normalisieren(d.get("quelle")),
        "anlass": bw.anlass_normalisieren(d.get("anlass")),
        "sterne": sterne or 0,
        "text": inhalt,
        "autor_name": bw.text_bereinigen(d.get("name"), bw.NAME_MAX),
        "email": email or None,
        "kontakt": kontakt or None,
        "einwilligung_veroeffentlichung": einwilligung,
        "textversion": textversion or None,
        "seite": bw.text_bereinigen(d.get("seite") or d.get("page_path"), 140),
        "idempotency_key": idempotency_key or None,
        "ip_hash": ip_hash(),
    })
    doc.insert(ignore_permissions=True)
    return {"referenz": doc.name, "status": doc.status, "email": email_maskieren(email) if email else None}


def oeffentlich(limit=20, quelle=None):
    """Öffentliche Liste (ReviewSummary): alle veröffentlichten, neueste zuerst, nie nach Sternen gefiltert."""
    filters = {"status": "Veroeffentlicht"}
    if quelle:
        filters["quelle"] = bw.quelle_normalisieren(quelle)
    alle = frappe.get_all(DT, filters=filters, fields=["name", "quelle", "einwilligung_veroeffentlichung", "sterne", "text", "autor_anzeige", "anlass", "bewertet_am", "eingang", "antwort"], order_by="eingang desc", limit=0)
    alle.sort(key=lambda r: get_datetime(r.bewertet_am or r.eingang or "1970-01-01"), reverse=True)
    # Direkte Rückmeldungen nur mit Einwilligung (doppelte Sicherung zum Controller)
    alle = [r for r in alle if r.quelle == "Google" or cint(r.einwilligung_veroeffentlichung)]
    limit = max(1, min(cint(limit) or 20, 100))
    reviews = [
        {
            "id": r.name,
            "author": r.autor_anzeige or "Kundin/Kunde",
            "rating": cint(r.sterne) or None,
            "text": bw.text_oeffentlich(r.text or ""),
            "date": str(get_datetime(r.bewertet_am or r.eingang).date()) if (r.bewertet_am or r.eingang) else None,
            "source": bw.QUELLE_ZU_WEBSITE.get(r.quelle, "direkt"),
            "occasion": r.anlass or None,
            "reply": bw.text_oeffentlich(r.antwort) if r.antwort else None,
        }
        for r in alle[:limit]
    ]
    return {"count": len(alle), "average": bw.durchschnitt([r.sterne for r in alle]), "reviews": reviews}
