"""PH Bestellvorschlag – Nachbestellvorschlag für Lagerware unter Meldebestand (täglicher Lauf, nachbestellung.py)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHBestellvorschlag(Document):
    def validate(self):
        self.titel = f"{self.produkt_name or self.produkt} · {self.vorschlag_menge or 0} Stk · {self.lagerort}"[:140]
        if int(self.vorschlag_menge or 0) < 0:
            frappe.throw(_("Bestellmenge darf nicht negativ sein."))
        alt = self.get_doc_before_save()
        if alt and alt.status != "Offen" and (alt.vorschlag_menge != self.vorschlag_menge or alt.lieferant != self.lieferant):
            frappe.throw(_("Nur offene Vorschläge können geändert werden."))
        if alt and alt.vorschlag_menge != self.vorschlag_menge:
            self.menge_manuell = 1
            self.wert_cent = int(self.ek_cent or 0) * int(self.vorschlag_menge or 0)
        if not self.erstellt_am:
            self.erstellt_am = frappe.utils.now_datetime()

    @frappe.whitelist()
    def herstellerbestellung_erstellen(self):
        """Button: nur diesen Vorschlag bestellen (Entwurf beim Lieferanten)."""
        self.check_permission("write")
        from ph_logistik.ph_logistik.nachbestellung import bestellungen_aus_vorschlaegen

        return bestellungen_aus_vorschlaegen([self.name])

    @frappe.whitelist()
    def verwerfen(self, grund=None):
        self.check_permission("write")
        if self.status != "Offen":
            frappe.throw(_("Nur offene Vorschläge können verworfen werden."))
        self.db_set({"status": "Verworfen", "bemerkung": ((self.bemerkung or "") + "\n" + _("Verworfen: {0}").format(grund or "-")).strip()})
        return self.status
