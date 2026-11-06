"""v0.2 – Backoffice-Lücken (52-backend-luecken): bestehende Sites nachziehen, idempotent.

- PH Stripe Einstellungen.ereignistypen: Radar-/Dispute-Ereignisse ergänzen (Default greift nur bei Neuanlage).
- PH Shop Einstellungen: neue Felder mit Standardwerten belegen, wenn leer.
- PH Bestellung: bestellart „Online“ bzw. „Showroom“ (quelle backoffice), offen_cent nachrechnen.
"""

import frappe

NEUE_TYPEN = ["charge.succeeded", "charge.updated", "review.opened", "review.closed", "radar.early_fraud_warning.created", "charge.dispute.updated", "charge.dispute.closed"]


def execute():
    if frappe.db.exists("DocType", "PH Stripe Einstellungen"):
        alt = frappe.db.get_single_value("PH Stripe Einstellungen", "ereignistypen") or ""
        typen = [t.strip() for t in alt.splitlines() if t.strip()]
        neu = typen + [t for t in NEUE_TYPEN if t not in typen]
        if neu != typen:
            frappe.db.set_single_value("PH Stripe Einstellungen", "ereignistypen", "\n".join(neu))
            frappe.cache().delete_value("ph_shop:stripe_einstellungen")
    if frappe.db.exists("DocType", "PH Shop Einstellungen"):
        for feld, wert in (("auto_abschliessen_tage", 30), ("zahlungslink_gueltig_stunden", 24), ("zahlungslink_erfolg_url", "https://platzhirsch.studio/shop/bestellung/{referenz}?bezahlt=1"), ("zahlungslink_abbruch_url", "https://platzhirsch.studio/shop/bestellung/{referenz}")):
            if frappe.db.get_single_value("PH Shop Einstellungen", feld) in (None, "", 0):
                frappe.db.set_single_value("PH Shop Einstellungen", feld, wert)
    if frappe.db.exists("DocType", "PH Bestellung") and frappe.get_meta("PH Bestellung").has_field("bestellart"):
        frappe.db.sql("update `tabPH Bestellung` set bestellart = if(quelle = 'backoffice', 'Showroom', 'Online') where ifnull(bestellart, '') = ''")
        frappe.db.sql("update `tabPH Bestellung` set offen_cent = greatest(ifnull(gesamt_cent, 0) - ifnull(betrag_bezahlt_cent, 0), 0)")
    frappe.db.commit()
