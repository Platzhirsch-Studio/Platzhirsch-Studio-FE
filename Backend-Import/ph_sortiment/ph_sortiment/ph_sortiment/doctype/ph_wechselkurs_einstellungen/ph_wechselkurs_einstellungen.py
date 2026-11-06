"""PH Wechselkurs Einstellungen (Single) – Richtwerte des Dreiländer-Rechners.

Website: src/components/Labs/Dreilaender/store.server.js getConfig() → ph_sortiment.api.get_wechselkurs_einstellungen
(Schema pricing.js configSchema; Abbildung in ph_sortiment/logik/filterfelder.py wechselkurs_konfiguration).
"""

import frappe
from frappe import _
from frappe.model.document import Document


class PHWechselkursEinstellungen(Document):
    def validate(self):
        if self.kurs_eur_chf and not (0.5 <= float(self.kurs_eur_chf) <= 2):
            frappe.throw(_("Kurs EUR → CHF muss zwischen 0,5 und 2 liegen."))
        if self.kurs_eur_chf and not self.kurs_datum:
            frappe.throw(_("Bitte das Datum des Kurses angeben."))
        gesehen = set()
        for z in self.get("posten") or []:
            if z.posten in gesehen:
                frappe.throw(_("Posten {0} ist doppelt.").format(z.posten))
            gesehen.add(z.posten)
            if (z.min_cent or 0) < 0 or (z.max_cent or 0) < 0:
                frappe.throw(_("Beträge dürfen nicht negativ sein ({0}).").format(z.posten))
            if (z.max_cent or 0) < (z.min_cent or 0):
                frappe.throw(_("„Bis“ ist kleiner als „Von“ ({0}).").format(z.posten))
            if (z.max_cent or 0) > 10000000:
                frappe.throw(_("Betrag zu hoch ({0}).").format(z.posten))

    def on_update(self):
        try:
            from ph_sortiment.ph_sortiment.ereignisse import api_cache_leeren

            api_cache_leeren()
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Wechselkurs Einstellungen: Cache leeren fehlgeschlagen")
