"""PH Logistik Einstellungen (Single). Geheimnisse nur in site_config.json – hier nur Anzeige ja/nein."""

import frappe
from frappe.model.document import Document


class PHLogistikEinstellungen(Document):
    def validate(self):
        self.letmeship_env = frappe.conf.get("ph_letmeship_env") or "test"
        self.letmeship_konfiguriert = int(bool(frappe.conf.get("ph_letmeship_api_id") and frappe.conf.get("ph_letmeship_api_password")))
        if not self.letmeship_konfiguriert:
            self.letmeship_testmodus = 1  # ohne Zugang nie „live“
        if self.absender_land:
            self.absender_land = self.absender_land.strip().upper()[:2]

    def on_update(self):
        from ph_logistik.ph_logistik.helfer import cache_leeren

        cache_leeren()
