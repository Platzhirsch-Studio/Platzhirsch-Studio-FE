import frappe
from frappe import _
from frappe.model.document import Document

from ph_marketing.ph_marketing import empfehlung
from ph_marketing.utils.token import email_normalisieren, email_plausibel


class PHEmpfehlung(Document):
    def autoname(self):
        if not self.code:
            self.code = empfehlung.neuer_code()
        self.name = self.code

    def validate(self):
        self.empfehler_email = email_normalisieren(self.empfehler_email)
        if not email_plausibel(self.empfehler_email):
            frappe.throw(_("E-Mail der empfehlenden Person ist ungültig."))
        if self.empfohlen_email:
            self.empfohlen_email = email_normalisieren(self.empfohlen_email)
            if self.empfohlen_email == self.empfehler_email:
                frappe.throw(_("Selbstempfehlung ist nicht möglich."))
        empfehlung.frist_setzen(self)
        self.titel = f"{self.code or 'EMP'} · {self.empfehler_name}"[:140]

    @frappe.whitelist()
    def code_senden(self):
        self.check_permission("write")
        empfehlung.code_senden(self)
        self.add_comment("Info", _("Empfehlungscode gesendet"))
        return "ok"

    @frappe.whitelist()
    def gutschein_senden(self, gutschein_code):
        self.check_permission("write")
        if len((gutschein_code or "").strip()) < 4:
            frappe.throw(_("Gutscheincode fehlt."))
        empfehlung.gutschein_senden(self, gutschein_code.strip())
        return "ok"

    @frappe.whitelist()
    def ablehnen(self, grund=None):
        self.check_permission("write")
        self.db_set({"status": "Abgelehnt", "notiz": ((self.notiz or "") + "\n" + (grund or "")).strip()[:500]})
        return "Abgelehnt"
