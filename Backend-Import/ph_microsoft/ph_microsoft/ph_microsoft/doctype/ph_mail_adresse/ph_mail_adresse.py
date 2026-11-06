"""PH Mail Adresse – weitere Adressen eines Kontakts/Lieferanten oder Sperrliste („nie zuordnen“)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_microsoft.logik.zuordnung import normalisiere

KONTAKT_DOCTYPES = ("PH Kontakt", "PH Lieferant")


class PHMailAdresse(Document):
    def validate(self):
        a = normalisiere(self.adresse)
        if not a:
            frappe.throw(_("Ungültige E-Mail-Adresse."))
        self.adresse = a
        if self.art == "Sperre":
            self.kontakt_doctype = self.kontakt_name = None
            andere = {"adresse": a, "art": "Sperre", "name": ("!=", self.name or "")}
        else:
            if self.kontakt_doctype not in KONTAKT_DOCTYPES:
                frappe.throw(_("Kontakt-Art muss PH Kontakt oder PH Lieferant sein."))
            if not frappe.db.exists("DocType", self.kontakt_doctype) or not self.kontakt_name or not frappe.db.exists(self.kontakt_doctype, self.kontakt_name):
                frappe.throw(_("Kontakt {0} nicht gefunden.").format(self.kontakt_name or ""))
            andere = {"adresse": a, "art": "Zuordnung", "kontakt_doctype": self.kontakt_doctype, "kontakt_name": self.kontakt_name, "name": ("!=", self.name or "")}
        if frappe.db.exists("PH Mail Adresse", andere):
            frappe.throw(_("Eintrag für {0} existiert bereits.").format(a))
