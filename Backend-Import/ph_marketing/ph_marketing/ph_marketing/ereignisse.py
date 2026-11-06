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


def _utm_der_anfrage(doc):
    """UTM aus den ph_crm-Feldern der Anfrage (utm_source/medium/campaign/content/term), Rückfall per has_field auf
    Herkunftsblock/Referenz-URL (ältere ph_crm-Stände)."""
    from ph_marketing.utils.attribution import UTM_FELDER, utm_aus_text

    utm = {}
    meta = frappe.get_meta(doc.doctype)
    for f in UTM_FELDER:
        if meta.has_field(f) and doc.get(f):
            utm[f] = str(doc.get(f)).strip().lower()
    for f, v in utm_aus_text(" ".join(str(doc.get(x) or "") for x in ("herkunft_block", "referenz_website", "kanal"))).items():
        utm.setdefault(f, v)
    alt = kampagne_aus_text((doc.get("herkunft_block") or "") + "\n" + (doc.get("kanal") or ""))
    if alt and "utm_campaign" not in utm:
        utm["utm_campaign"] = alt.lower()
    return utm


def anfrage_eingang(doc, method=None):
    """after_insert PH Anfrage: UTM-Felder + Kampagne (laufend bzw. im Nachlauf, Konzept L21), Kontaktpunkt, Empfehlung."""
    try:
        from ph_marketing.ph_marketing import kampagnen

        utm = _utm_der_anfrage(doc)
        werte = {}
        name = doc.get("ph_marketing_kampagne") or (kampagnen.kampagne_fuer(utm, doc.get("eingang")) if utm.get("utm_campaign") else None)
        if name and not doc.get("ph_marketing_kampagne"):
            werte["ph_marketing_kampagne"] = name
        if werte:
            doc.db_set(werte, update_modified=False)
        if name:
            kampagnen.kontaktpunkt(utm, "Anfrage", email=doc.get("email"), kontakt=doc.get("kontakt"), referenz=(doc.doctype, doc.name), zeit=doc.get("eingang"), kampagne=name, klick_id=doc.get("klick_id"))
            frappe.get_doc("PH Kampagne", name).anfragen_zaehlen()
        empfehlung.anfrage_eingang(doc)
    except Exception:  # noqa: BLE001 – Ereignis darf das Anlegen der Anfrage nie verhindern
        frappe.log_error(title="PH Marketing: Anfrage-Ereignis")
