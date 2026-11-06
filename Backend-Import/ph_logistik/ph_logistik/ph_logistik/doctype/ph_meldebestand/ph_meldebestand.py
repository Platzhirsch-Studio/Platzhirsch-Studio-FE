"""PH Meldebestand – Meldebestand/Zielbestand je Produkt (Ausführung) und Lagerort für Lagerware (Accessoires/Shop-Artikel).

Ersatzteile disponiert ph_service, Ausstellungsstücke werden nicht nachbestellt. Rechnung: nachbestellung.py / nachbestellung_logik.py.
"""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_logistik.ph_logistik.nachbestellung_logik import pruefe_regel


class PHMeldebestand(Document):
    def validate(self):
        fehler = pruefe_regel(self.meldebestand, self.zielbestand, self.bestellmenge_min, self.verpackungseinheit)
        if fehler:
            frappe.throw(_(fehler))
        if self.produkt and frappe.db.get_value("PH Produkt", self.produkt, "typ") == "Ausstellungsstueck":
            frappe.throw(_("Ausstellungsstücke werden nicht nachbestellt – Regel nur für Lagerware."))
        if self.ausfuehrung and frappe.db.get_value("PH Produkt Ausfuehrung", self.ausfuehrung, "produkt") not in (None, self.produkt):
            frappe.throw(_("Ausführung {0} gehört nicht zu {1}.").format(self.ausfuehrung, self.produkt))
        filt = {"produkt": self.produkt, "ausfuehrung": self.ausfuehrung or ("is", "not set"), "lagerort": self.lagerort, "name": ("!=", self.name or "")}
        doppelt = frappe.db.get_value("PH Meldebestand", filt, "name")
        if doppelt:
            frappe.throw(_("Für dieses Produkt und diesen Lagerort gibt es schon die Regel {0}.").format(doppelt))
        self.titel = f"{self.produkt_name or self.produkt} · {self.lagerort}"[:140]

    @frappe.whitelist()
    def jetzt_pruefen(self):
        """Button „Jetzt prüfen“: Kennzahlen rechnen, Vorschlag anlegen/aktualisieren."""
        self.check_permission("write")
        from ph_logistik.ph_logistik.nachbestellung import regel_pruefen

        v, neu = regel_pruefen(self.name)
        return {"vorschlag": v, "neu": int(neu)}

    @frappe.whitelist()
    def empfehlung_uebernehmen(self):
        """Empfehlung als Meldebestand übernehmen (Zielbestand mindestens Meldebestand)."""
        self.check_permission("write")
        if not self.empfehlung_meldebestand:
            frappe.throw(_("Keine Empfehlung vorhanden (kein Abgang oder keine Wiederbeschaffungszeit)."))
        self.meldebestand = self.empfehlung_meldebestand
        self.zielbestand = max(int(self.zielbestand or 0), self.meldebestand)
        self.save()
        return self.meldebestand
