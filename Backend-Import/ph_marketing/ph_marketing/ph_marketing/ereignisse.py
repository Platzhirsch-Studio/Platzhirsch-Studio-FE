"""doc_events-Handler (hooks.py): PH Anfrage → Kampagne aus utm_campaign zuordnen, Empfehlungskontext erkennen."""

import re

import frappe

from ph_marketing.ph_marketing import empfehlung

UTM_RE = re.compile(r"utm_campaign\s*[:=]\s*([A-Za-z0-9_\-\.]+)", re.I)
KAMPAGNE_RE = re.compile(r"^Kampagne:\s*(.+)$", re.M | re.I)


def kampagne_aus_text(text):
    """utm_campaign aus Herkunftsblock/Referenz-URL oder Zeile „Kampagne: …“."""
    text = text or ""
    m = UTM_RE.search(text) or KAMPAGNE_RE.search(text)
    return m.group(1).strip() if m else None


def anfrage_eingang(doc, method=None):
    """after_insert PH Anfrage: Custom Field ph_marketing_kampagne füllen, Kampagnenzähler, Empfehlung."""
    try:
        if not doc.get("ph_marketing_kampagne"):
            utm = kampagne_aus_text((doc.get("herkunft_block") or "") + "\n" + (doc.get("kanal") or ""))
            if utm:
                name = frappe.db.get_value("PH Kampagne", {"utm_campaign": utm}, "name")
                if name:
                    doc.db_set("ph_marketing_kampagne", name, update_modified=False)
                    frappe.get_doc("PH Kampagne", name).anfragen_zaehlen()
        empfehlung.anfrage_eingang(doc)
    except Exception:  # noqa: BLE001 – Ereignis darf das Anlegen der Anfrage nie verhindern
        frappe.log_error(title="PH Marketing: Anfrage-Ereignis")
