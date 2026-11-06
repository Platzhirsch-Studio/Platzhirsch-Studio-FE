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
        # Lager & Inventur Ergänzung
        if self.geschaeftsjahr_beginn_monat and not 1 <= int(self.geschaeftsjahr_beginn_monat) <= 12:
            frappe.throw(frappe._("Geschäftsjahr-Beginn: Monat 1–12."))
        for r in self.get("abwertung_staffel") or []:
            if not 0 <= int(r.abwertung_promille or 0) <= 1000 or int(r.ab_monate or 0) < 0:
                frappe.throw(frappe._("Abwertungsstaffel Zeile {0}: Abwertung 0–1000 Promille, Alter ≥ 0.").format(r.idx))

    def on_update(self):
        from ph_logistik.ph_logistik.helfer import cache_leeren

        cache_leeren()
