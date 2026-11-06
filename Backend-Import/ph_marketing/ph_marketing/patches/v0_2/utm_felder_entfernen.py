"""Custom Fields ph_marketing_utm_* an PH Anfrage entfernen – ph_crm führt utm_source/medium/campaign/content/term und
klick_id jetzt selbst. Werte vorher in die ph_crm-Felder übernehmen, soweit dort leer. Idempotent."""

import frappe

FELDER = ("utm_source", "utm_medium", "utm_campaign")


def execute():
    if not frappe.db.exists("DocType", "PH Anfrage"):
        return
    for f in FELDER:
        alt = f"ph_marketing_{f}"
        if frappe.db.has_column("PH Anfrage", alt) and frappe.db.has_column("PH Anfrage", f):
            for name, wert in frappe.get_all("PH Anfrage", filters={alt: ("is", "set"), f: ("is", "not set")}, fields=["name", alt], as_list=True):
                frappe.db.set_value("PH Anfrage", name, f, wert, update_modified=False)
        cf = f"PH Anfrage-{alt}"
        if frappe.db.exists("Custom Field", cf):
            frappe.delete_doc("Custom Field", cf, ignore_permissions=True, force=True)
    frappe.clear_cache(doctype="PH Anfrage")
