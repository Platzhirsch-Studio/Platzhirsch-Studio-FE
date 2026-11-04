"""PH Beratungsgespraech – Gesprächsprotokoll. Buttons: Aufgabe für nächsten Schritt, Planung beauftragen
(→ PH Projekt, wenn ph_projekte installiert), Angebot (→ ph_faktura), Abschließen, Protokoll drucken."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime, nowdate


class PHBeratungsgespraech(Document):
    def validate(self):
        if not self.datum:
            self.datum = nowdate()
        self.budget_gesamt_cent = sum(int(z.budget_cent or 0) for z in self.raeume)
        if self.status == "Abgeschlossen":
            if not (self.zusammenfassung or self.raeume):
                frappe.throw(_("Zum Abschließen braucht das Protokoll eine Zusammenfassung oder mindestens einen Raum."))
            self.abgeschlossen_am = self.abgeschlossen_am or now_datetime()
        else:
            self.abgeschlossen_am = None
        kontakt = frappe.db.get_value("PH Kontakt", self.kontakt, "titel") if self.kontakt else ""
        self.titel = f"{frappe.utils.formatdate(self.datum, 'dd.MM.yyyy')} · {kontakt}"[:140]

    def on_update(self):
        try:
            if self.termin and frappe.db.get_value("PH Termin", self.termin, "beratungsgespraech") != self.name:
                frappe.db.set_value("PH Termin", self.termin, "beratungsgespraech", self.name, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Beratungsgespraech {self.name}: Termin-Verweis fehlgeschlagen")

    @frappe.whitelist()
    def status_setzen(self, status):
        self.check_permission("write")
        if status not in ("Offen", "Planung beauftragt", "Angebot", "Abgeschlossen"):
            frappe.throw(_("Unbekannter Status."))
        self.status = status
        self.save()
        return self.status

    @frappe.whitelist()
    def aufgabe_anlegen(self):
        """Nächsten Schritt als PH Aufgabe an den Berater."""
        self.check_permission("write")
        if not self.naechster_schritt:
            frappe.throw(_("Bitte zuerst den nächsten Schritt eintragen."))
        doc = frappe.get_doc(
            {
                "doctype": "PH Aufgabe",
                "titel": self.naechster_schritt[:140],
                "faellig": self.naechster_schritt_bis or add_days(nowdate(), 3),
                "zugewiesen_an": self.berater,
                "referenz_doctype": self.doctype,
                "referenz_name": self.name,
                "kontakt": self.kontakt,
            }
        ).insert()
        return doc.name

    @frappe.whitelist()
    def planung_beauftragen(self):
        """→ PH Projekt (ph_projekte). Ohne ph_projekte nur Statuswechsel + Hinweis."""
        self.check_permission("write")
        projekt = None
        if frappe.db.exists("DocType", "PH Projekt"):
            meta = frappe.get_meta("PH Projekt")
            werte = {"doctype": "PH Projekt", "kontakt": self.kontakt}
            if meta.has_field("beratungsgespraech"):
                werte["beratungsgespraech"] = self.name
            if meta.has_field("titel_kunde"):
                werte["titel_kunde"] = self.titel
            try:
                projekt = frappe.get_doc(werte).insert().name
                # Custom Field aus ph_projekte (CONVENTIONS 10): ph_projekte_projekt
                if self.meta.has_field("ph_projekte_projekt"):
                    self.db_set("ph_projekte_projekt", projekt)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Beratungsgespraech {self.name}: Projekt anlegen fehlgeschlagen")
                frappe.msgprint(_("Projekt konnte nicht automatisch angelegt werden – bitte in PH Projekte anlegen (Fehlerprotokoll)."))
        else:
            frappe.msgprint(_("ph_projekte ist nicht installiert – Status gesetzt, Projekt bitte später anlegen."))
        self.status = "Planung beauftragt"
        self.save()
        return projekt
