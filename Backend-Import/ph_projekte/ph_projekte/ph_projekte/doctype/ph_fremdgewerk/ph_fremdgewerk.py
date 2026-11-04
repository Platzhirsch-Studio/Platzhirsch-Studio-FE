"""PH Fremdgewerk – Koordination eines Partnerbetriebs (Termin, Leistung) ohne Bauleitungs-Haftung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime

from ph_projekte.utils.portal import gewerk_uebergang_erlaubt


class PHFremdgewerk(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Offen"

    def validate(self):
        if self.termin_von and self.termin_bis and get_datetime(self.termin_bis) < get_datetime(self.termin_von):
            frappe.throw(_("Termin bis liegt vor Termin von."))
        if self.abhaengig_von == self.name:
            frappe.throw(_("Ein Gewerk kann nicht von sich selbst abhängen."))
        if self.partnerbetrieb and not self.partner_text and frappe.db.exists("DocType", "PH Lieferant"):
            self.partner_text = frappe.db.get_value("PH Lieferant", self.partnerbetrieb, "firmenname") or self.partnerbetrieb
        partner = self.partner_text or _("Partnerbetrieb (Name folgt)")
        self.titel = f"{self.gewerk}: {partner}"[:140]
        if not self.haftungshinweis:
            self.haftungshinweis = frappe.db.get_single_value("PH Projekte Einstellungen", "haftungshinweis_fremdgewerke")

    @frappe.whitelist()
    def status_setzen(self, status):
        """Button „Status setzen“ mit erlaubten Übergängen (reine Koordination)."""
        self.check_permission("write")
        if not gewerk_uebergang_erlaubt(self.status, status):
            frappe.throw(_("Übergang {0} → {1} ist nicht vorgesehen.").format(_(self.status), _(status)))
        if status == "Geplant" and not self.termin_von:
            frappe.throw(_("Bitte zuerst einen Termin eintragen."))
        self.db_set("status", status)
        self.add_comment("Info", _("Status {0}").format(_(status)))
        return status

    @frappe.whitelist()
    def termin_anlegen(self):
        """PH Termin (ph_crm) für die Koordination anlegen, wenn installiert."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Termin"):
            frappe.throw(_("DocType PH Termin ist noch nicht installiert (Arbeitspaket ph_crm)."))
        if not self.termin_von:
            frappe.throw(_("Bitte zuerst Termin von eintragen."))
        kontakt = frappe.db.get_value("PH Projekt", self.projekt, "kontakt")
        t = frappe.get_doc({"doctype": "PH Termin", "kontakt": kontakt, "start": self.termin_von, "ende": self.termin_bis, "modus": "Vor Ort", "thema": self.titel, "quelle": "backoffice", "status": "Bestaetigt"})
        t.flags.ignore_mandatory = True
        t.insert()
        self.db_set("termin", t.name)
        return t.name
