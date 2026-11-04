"""PH Projektzeit – Zeiten je Projekt/Aufgabe/Montage für die Abrechnung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import formatdate, nowdate

from ph_projekte.utils.portal import betrag_cent, dauer_minuten


class PHProjektzeit(Document):
    def before_insert(self):
        if not self.user:
            self.user = frappe.session.user
        if not self.datum:
            self.datum = nowdate()
        if not self.status:
            self.status = "Offen" if self.abrechenbar else "Nicht abrechenbar"

    def validate(self):
        if self.start and self.ende and not self.dauer_min:
            self.dauer_min = dauer_minuten(self.start, self.ende)
        if not self.dauer_min or int(self.dauer_min) <= 0:
            frappe.throw(_("Dauer in Minuten ist nötig (oder Von/Bis angeben)."))
        if int(self.dauer_min) > 24 * 60:
            frappe.throw(_("Mehr als 24 Stunden an einem Tag sind nicht plausibel."))
        if self.aufgabe and frappe.db.get_value("PH Projekt Aufgabe", self.aufgabe, "projekt") != self.projekt:
            frappe.throw(_("Die Aufgabe gehört nicht zu diesem Projekt."))
        if self.montageauftrag and frappe.db.get_value("PH Montageauftrag", self.montageauftrag, "projekt") != self.projekt:
            frappe.throw(_("Der Montageauftrag gehört nicht zu diesem Projekt."))
        if self.status == "Abgerechnet" and self.get_doc_before_save() and self.get_doc_before_save().status == "Abgerechnet":
            for feld in ("dauer_min", "datum", "user", "abrechenbar"):
                if self.get(feld) != self.get_doc_before_save().get(feld):
                    frappe.throw(_("Abgerechnete Zeiten sind nicht mehr änderbar."))
        if not self.abrechenbar and self.status == "Offen":
            self.status = "Nicht abrechenbar"
        if self.abrechenbar and self.status == "Nicht abrechenbar":
            self.status = "Offen"
        self.betrag_cent = betrag_cent(self.dauer_min, self.stundensatz_cent)
        voll = frappe.db.get_value("User", self.user, "full_name") or self.user
        self.titel = f"{formatdate(self.datum, 'dd.MM.yyyy')} {voll}: {self.taetigkeit} {int(self.dauer_min)} min"[:140]

    def on_update(self):
        try:
            from ph_projekte.ph_projekte.doctype.ph_projekt_aufgabe.ph_projekt_aufgabe import erfasste_zeit_aktualisieren

            erfasste_zeit_aktualisieren(self.aufgabe)
            summe = frappe.db.get_value("PH Projektzeit", {"projekt": self.projekt}, "sum(dauer_min)") or 0
            frappe.db.set_value("PH Projekt", self.projekt, "zeit_min_gesamt", int(summe), update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Projektzeit: Summen fehlgeschlagen")

    def on_trash(self):
        if self.status == "Abgerechnet":
            frappe.throw(_("Abgerechnete Zeiten können nicht gelöscht werden."))

    @frappe.whitelist()
    def als_abgerechnet(self, beleg_ref=None):
        self.check_permission("write")
        if "PH Projekte Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Abrechnen darf nur die Leitung."))
        self.db_set({"status": "Abgerechnet", "abgerechnet_am": nowdate(), "beleg_ref": (beleg_ref or "")[:80]})
        return "Abgerechnet"


def offene_zeiten(projekt):
    """Für ph_faktura: unabgerechnete, abrechenbare Zeiten eines Projekts (Name, Datum, Minuten, Betrag)."""
    return frappe.get_all("PH Projektzeit", filters={"projekt": projekt, "status": "Offen", "abrechenbar": 1}, fields=["name", "datum", "user", "taetigkeit", "dauer_min", "betrag_cent", "beschreibung"], order_by="datum asc")
