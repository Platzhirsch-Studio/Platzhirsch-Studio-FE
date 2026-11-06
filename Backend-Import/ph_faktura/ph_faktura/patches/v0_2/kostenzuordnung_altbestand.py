"""Kostenzuordnung: bestehende Eingangsrechnungen mit Kopf-Projekt → Modus „Ganz einem Projekt“ (Kostenart Ware bei
Herstellerbestellung, sonst offen = Nacharbeit über Report „PH Nicht zugeordnete Eingangsrechnungen“). Idempotent."""

import frappe


def execute():
    if not frappe.db.has_column("PH Eingangsrechnung", "zuordnung_modus"):
        return
    for name in frappe.get_all("PH Eingangsrechnung", filters={"projekt": ("is", "set"), "zuordnung_modus": ("is", "not set")}, pluck="name"):
        er = frappe.get_doc("PH Eingangsrechnung", name)
        er.zuordnung_modus = "Ganz einem Projekt"
        er.flags.ph_system = True
        er.flags.ignore_links = True
        er.flags.ignore_permissions = True
        try:
            er.save()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"Patch Kostenzuordnung {name}")
    frappe.db.commit()
