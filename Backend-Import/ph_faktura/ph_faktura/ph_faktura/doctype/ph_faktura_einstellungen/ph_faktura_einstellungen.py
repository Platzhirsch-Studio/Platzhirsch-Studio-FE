import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class PHFakturaEinstellungen(Document):
    def validate(self):
        if cint(self.kleinbetragsgrenze_cent) <= 0:
            self.kleinbetragsgrenze_cent = 40000
        if cint(self.uid_pflicht_ab_cent) <= 0:
            self.uid_pflicht_ab_cent = 1000000
        if self.oss_aktiv and not self.oss_registrierung:
            frappe.throw(_("OSS nur mit vorliegender Registrierung aktivieren (Feld OSS-Registrierung)."))
        for f in ("berater_nr", "mandanten_nr"):
            if self.get(f) and not str(self.get(f)).isdigit():
                frappe.throw(_("{0} nur Ziffern.").format(self.meta.get_label(f)))

    def on_update(self):
        from ph_faktura.einstellungen import cache_leeren

        cache_leeren()
