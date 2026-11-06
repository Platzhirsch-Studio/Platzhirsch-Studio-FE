"""PH Beratungsvorlage – Gesprächsleitfaden je Raumtyp (Küche, Wohnen, Bad, Hotelzimmer …).
Wird in PH Beratungsgespraech über „Vorlage übernehmen“ (vorlage_anwenden) als Checkliste eingefügt."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHBeratungsvorlage(Document):
    def validate(self):
        self.vorlage_name = (self.vorlage_name or "").strip()
        if not self.fragen:
            frappe.throw(_("Mindestens eine Frage ist nötig."))
        gesehen = set()
        for f in self.fragen:
            f.frage = (f.frage or "").strip()
            schluessel = (f.raum, f.frage.lower())
            if schluessel in gesehen:
                frappe.throw(_("Frage „{0}“ ({1}) ist doppelt.").format(f.frage, _(f.raum)))
            gesehen.add(schluessel)
        if not self.raumtyp:
            self.raumtyp = self.fragen[0].raum
