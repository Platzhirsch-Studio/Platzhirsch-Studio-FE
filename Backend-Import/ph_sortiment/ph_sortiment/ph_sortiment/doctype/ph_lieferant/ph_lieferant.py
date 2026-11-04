"""PH Lieferant – Bezugsquelle mit Bestellweg und Konditionen."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PHLieferant(Document):
    def validate(self):
        self.firmenname = (self.firmenname or "").strip()
        self.bestell_email = (self.bestell_email or "").strip().lower() or None
        if self.bestell_email and not EMAIL_RE.match(self.bestell_email):
            frappe.throw(_("Bestell-E-Mail ist ungültig."))
        if self.bestellweg == "E-Mail" and not self.bestell_email and self.status == "Aktiv":
            frappe.msgprint(_("Bestellweg E-Mail ohne Bestell-E-Mail: Bestellungen können nicht gesendet werden."), indicator="orange", alert=True)
        if self.bestellweg == "Portal" and not self.portal_url:
            frappe.msgprint(_("Bestellweg Portal ohne Portal-URL."), indicator="orange", alert=True)
        for k in ("zahlungsziel_tage", "skonto_promille", "skonto_tage", "lieferzeit_wochen_standard", "ab_erwartet_tage"):
            if (self.get(k) or 0) < 0:
                frappe.throw(_("{0} darf nicht negativ sein.").format(self.meta.get_label(k)))
        if (self.skonto_promille or 0) > 100:
            frappe.throw(_("Skonto über 10 % ist unplausibel (Promille-Angabe: 20 = 2 %)."))

    def on_update(self):
        # Marke ↔ Lieferant gegenseitig verknüpfen (ohne Validierung der Marke neu anzustoßen).
        if self.marke and frappe.db.get_value("PH Marke", self.marke, "lieferant") != self.name:
            frappe.db.set_value("PH Marke", self.marke, "lieferant", self.name, update_modified=False)

    @frappe.whitelist()
    def offene_bestellungen(self):
        self.check_permission("read")
        return frappe.get_all(
            "PH Herstellerbestellung",
            filters={"lieferant": self.name, "status": ("in", ["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"])},
            fields=["name", "status", "datum", "kommission", "bestaetigter_termin", "abweichungen_offen"],
            order_by="datum asc",
        )
