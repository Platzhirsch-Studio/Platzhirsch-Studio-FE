"""PH Planung – Planungsstand mit Versionen je Projekt."""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class PHPlanung(Document):
    def before_insert(self):
        if not self.version:
            letzte = frappe.db.get_value("PH Planung", {"projekt": self.projekt}, "max(version)") or 0
            self.version = int(letzte) + 1
        if not self.status:
            self.status = "Entwurf"
        if not self.planer:
            self.planer = frappe.session.user

    def validate(self):
        self.titel = f"Planung V{self.version or 1}: {self.bezeichnung}"[:140]
        if self.quelle_planung in ("Handskizze", "Modell") and not self.echt_bestaetigt:
            frappe.throw(_("Handskizze und Modell nur als echtes Original (Inhaber-Entscheidung Nr. 8) – bitte bestätigen."))
        if self.daten_json:
            try:
                json.loads(self.daten_json)
            except ValueError:
                frappe.throw(_("Konfiguration ist kein gültiges JSON."))

    @frappe.whitelist()
    def neue_version(self):
        """Button: Kopie als nächste Version (Vorgänger wird „Verworfen“, wenn noch Entwurf)."""
        self.check_permission("write")
        neu = frappe.copy_doc(self)
        neu.version = None
        neu.status = "Entwurf"
        neu.vorgaenger = self.name
        neu.freigabe_durch_kunde_am = None
        neu.insert()
        if self.status == "Entwurf":
            self.db_set("status", "Verworfen")
        return neu.name

    @frappe.whitelist()
    def kunden_vorlegen(self):
        self.check_permission("write")
        if self.status not in ("Entwurf",):
            frappe.throw(_("Nur Entwürfe können vorgelegt werden."))
        self.db_set({"status": "Kunde vorgelegt", "kunde_sichtbar": 1})
        return "Kunde vorgelegt"

    @frappe.whitelist()
    def freigeben(self, durch_kunde=0):
        self.check_permission("write")
        self.db_set({"status": "Freigegeben", "freigabe_durch_kunde_am": now_datetime() if int(durch_kunde or 0) else self.freigabe_durch_kunde_am})
        # Projektphase Planung → Angebot anstoßen ist Workflow-Sache; nur Positionen übernehmen.
        return "Freigegeben"

    @frappe.whitelist()
    def verwerfen(self):
        self.check_permission("write")
        self.db_set("status", "Verworfen")
        return "Verworfen"

    @frappe.whitelist()
    def positionen_ins_projekt(self):
        """Button: Planungspositionen als Projektpositionen übernehmen (ohne Dubletten nach Bezeichnung)."""
        self.check_permission("write")
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        vorhanden = {p.bezeichnung for p in projekt.positionen}
        n = 0
        for p in self.positionen:
            if p.bezeichnung in vorhanden:
                continue
            projekt.append("positionen", {"bezeichnung": p.bezeichnung, "produkt": p.produkt, "ausfuehrung_text": p.ausfuehrung_text, "menge": p.menge, "raum": p.raum, "status": "geplant"})
            n += 1
        if n:
            projekt.save()
        return n
