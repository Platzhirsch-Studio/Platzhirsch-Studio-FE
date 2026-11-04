"""Patch (PLAN.md Zeile 3 / ph_anfrage_produkt.json): PH Anfrage Produkt.ph_sortiment_produkt (Custom Field) aus produkt_slug füllen,
sobald PH Produkt existiert. Läuft nur, wenn ph_crm installiert ist; idempotent."""

import frappe


def execute():
    if not frappe.db.exists("DocType", "PH Anfrage Produkt") or not frappe.db.exists("DocType", "PH Produkt"):
        return
    if not frappe.db.has_column("PH Anfrage Produkt", "ph_sortiment_produkt"):
        return  # Custom Field kommt mit den Fixtures nach dem Patch; Ereignis-Handler holt es nach
    zeilen = frappe.get_all("PH Anfrage Produkt", filters={"ph_sortiment_produkt": ("in", ["", None]), "produkt_slug": ("!=", "")}, fields=["name", "produkt_slug"], limit=50000)
    n = 0
    for z in zeilen:
        if frappe.db.exists("PH Produkt", z.produkt_slug):
            frappe.db.set_value("PH Anfrage Produkt", z.name, {"ph_sortiment_produkt": z.produkt_slug, "marke": frappe.db.get_value("PH Produkt", z.produkt_slug, "marke")}, update_modified=False)
            n += 1
    frappe.db.commit()
    print(f"ph_sortiment: {n} Anfrage-Produkte verknüpft")
