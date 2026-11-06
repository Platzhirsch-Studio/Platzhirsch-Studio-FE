"""PH Bewertung – direkte Rückmeldung oder Google-Bewertung. Regeln: ph_marketing/utils/bewertung.py.

Status nur über Server-Methoden: Neu → Veroeffentlicht (Leitung; direkte Rückmeldung nur mit Einwilligung) bzw.
→ Ausgeblendet (nur aus festen Gründen, nie wegen der Sternezahl). Google-Bewertungen sind schon öffentlich und
kommen als „Veroeffentlicht“ an (Import im Desk, `externe_id` = Google-Review-ID gegen Dubletten).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_core.api import hat_rolle
from ph_marketing.utils import bewertung as bw


class PHBewertung(Document):
    def before_insert(self):
        self.eingang = self.eingang or now_datetime()
        if self.quelle == "Google":
            self.status = "Veroeffentlicht"
            self.veroeffentlicht_am = self.veroeffentlicht_am or now_datetime()
        else:
            self.status = "Neu"

    def validate(self):
        try:
            self.sterne = bw.sterne_pruefen(self.sterne) or 0
        except ValueError:
            frappe.throw(_("Sterne müssen zwischen 1 und 5 liegen (0 = ohne Sterne)."))
        self.text = bw.text_bereinigen(self.text)
        if not self.text and not self.sterne:
            frappe.throw(_("Bitte Sterne oder einen Text angeben."))
        self.autor_anzeige = bw.autor_maskieren(self.autor_name)
        self.titel = bw.titel(self.sterne, self.autor_anzeige, self.anlass)
        if self.status == "Veroeffentlicht" and self.quelle != "Google" and not cint(self.einwilligung_veroeffentlichung):
            frappe.throw(_("Direkte Rückmeldungen nur mit Einwilligung zur Veröffentlichung veröffentlichen."))
        if self.has_value_changed("antwort") and self.antwort:
            self.beantwortet_am = now_datetime()

    def _leitung(self):
        self.check_permission("write")
        if not hat_rolle("PH Marketing Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"):
            frappe.throw(_("Nur die Marketing-Leitung darf veröffentlichen oder ausblenden."), frappe.PermissionError)

    @frappe.whitelist()
    def veroeffentlichen(self):
        self._leitung()
        self.status = "Veroeffentlicht"
        self.ausgeblendet_grund = None
        self.veroeffentlicht_am = now_datetime()
        self.save()
        return self.status

    @frappe.whitelist()
    def ausblenden(self, grund):
        self._leitung()
        if grund not in bw.AUSBLENDEN_GRUENDE:
            frappe.throw(_("Ausblenden nur aus diesen Gründen: {0}").format(", ".join(bw.AUSBLENDEN_GRUENDE)))
        self.status = "Ausgeblendet"
        self.ausgeblendet_grund = grund
        if grund == "Widerruf der Einwilligung":
            self.einwilligung_veroeffentlichung = 0
        self.save()
        return self.status
