"""PH Projekt Nachricht – Nachrichtenfaden Kunde ↔ Studio (Portal /nachrichten)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, strip_html

from ph_projekte.ph_projekte.helfer import projekt_kontakt


class PHProjektNachricht(Document):
    def before_insert(self):
        if not self.gesendet_am:
            self.gesendet_am = now_datetime()
        if self.richtung == "ausgehend":
            self.von_user = self.von_user or frappe.session.user
            self.autor = self.autor or frappe.db.get_value("User", self.von_user, "full_name") or "Platzhirsch"
            self.status = "Ungelesen"  # ungelesen vom Kunden
        else:
            self.status = "Ungelesen"  # ungelesen vom Studio
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)

    def validate(self):
        self.text = (self.text or "").strip()
        if len(self.text) < 2:
            frappe.throw(_("Bitte schreiben Sie eine Nachricht."))
        if len(self.text) > 2000:
            frappe.throw(_("Bitte höchstens 2000 Zeichen."))
        if self.projekt and self.kontakt and projekt_kontakt(self.projekt) != self.kontakt:
            frappe.throw(_("Das Projekt gehört nicht zu diesem Kunden."))
        self.titel = f"{'←' if self.richtung == 'eingehend' else '→'} {strip_html(self.text)[:80]}"[:140]

    @frappe.whitelist()
    def als_gelesen(self):
        self.check_permission("write")
        self.db_set({"status": "Gelesen", "gelesen_am": now_datetime()})
        return "Gelesen"

    @frappe.whitelist()
    def antworten(self, text):
        self.check_permission("write")
        doc = frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": self.kontakt, "projekt": self.projekt, "richtung": "ausgehend", "text": text}).insert()
        if self.richtung == "eingehend" and self.status != "Gelesen":
            self.db_set({"status": "Gelesen", "gelesen_am": now_datetime()})
        return doc.name


def ungelesen_vom_studio():
    return frappe.db.count("PH Projekt Nachricht", {"richtung": "eingehend", "status": "Ungelesen"})
