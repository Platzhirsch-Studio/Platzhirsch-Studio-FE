"""PH Datei Freigabelink – zeitlich begrenzter Download für Externe. Token nur als SHA-256 (token_hash),
Passwort als PBKDF2 (passwort_hash); beides verlässt den Server nie. Einlösung: ph_ablage.api.freigabe_aufloesen."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime

from ph_ablage.utils import regeln


class PHDateiFreigabelink(Document):
    def validate(self):
        name = frappe.db.get_value("PH Datei", self.datei, "dateiname") or self.datei
        self.titel = f"{name} · {self.empfaenger_hinweis}"[:200] if self.empfaenger_hinweis else str(name)[:200]
        self.nur_lesen = 1
        if not self.token_hash:
            frappe.throw(_("Freigabelinks werden über die Ablage erstellt (Button „Freigabelink“ an der Datei)."))
        if self.status in ("Aktiv", "Abgelaufen", "Aufgebraucht"):
            zustand = regeln.freigabe_zustand(self.status, get_datetime(self.ablauf) if self.ablauf else None, now_datetime(), self.download_zaehler, self.max_downloads)
            self.status = {"ok": "Aktiv", "abgelaufen": "Abgelaufen", "aufgebraucht": "Aufgebraucht"}.get(zustand, self.status)

    def on_update(self):
        from ph_ablage.ph_ablage.dienste import freigaben_zaehlen

        freigaben_zaehlen(self.datei)

    @frappe.whitelist()
    def widerrufen(self):
        self.check_permission("write")
        if self.status != "Widerrufen":
            self.db_set({"status": "Widerrufen", "widerrufen_am": now_datetime(), "widerrufen_von": frappe.session.user})
            from ph_ablage.ph_ablage.dienste import freigaben_zaehlen
            from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll

            freigaben_zaehlen(self.datei)
            protokoll("Freigabe widerrufen", datei=self.datei, freigabelink=self.name)
        return self.status
