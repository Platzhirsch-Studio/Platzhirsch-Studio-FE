"""PH Projekt Aufgabe – Aufgabe je Projekt (Fälligkeit, Zuständigkeit, erfasste Zeit)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class PHProjektAufgabe(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Offen"
        if not self.zugewiesen_an:
            self.zugewiesen_an = frappe.session.user

    def validate(self):
        self.titel = (self.titel or "").strip()
        if not self.titel:
            frappe.throw(_("Bitte eine Aufgabe eingeben."))
        if self.status == "Erledigt" and not self.erledigt_am:
            self.erledigt_am = now_datetime()
        if self.status != "Erledigt":
            self.erledigt_am = None
        if self.referenz_doctype and self.referenz_name and not frappe.db.exists(self.referenz_doctype, self.referenz_name):
            frappe.throw(_("Bezug {0} {1} existiert nicht.").format(self.referenz_doctype, self.referenz_name))

    def on_update(self):
        if self.zugewiesen_an and self.has_value_changed("zugewiesen_an") and self.status in ("Offen", "In Arbeit"):
            try:
                from frappe.desk.form.assign_to import add, clear

                clear(self.doctype, self.name)
                add({"assign_to": [self.zugewiesen_an], "doctype": self.doctype, "name": self.name, "description": self.titel, "date": self.faellig})
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Projekt Aufgabe: Zuweisung fehlgeschlagen")

    @frappe.whitelist()
    def erledigen(self):
        self.check_permission("write")
        self.status = "Erledigt"
        self.save()
        return "Erledigt"

    @frappe.whitelist()
    def zeit_buchen(self, dauer_min, taetigkeit=None, beschreibung=None, datum=None):
        self.check_permission("write")
        z = frappe.get_doc(
            {
                "doctype": "PH Projektzeit",
                "projekt": self.projekt,
                "aufgabe": self.name,
                "user": frappe.session.user,
                "datum": datum or now_datetime().date(),
                "dauer_min": int(dauer_min),
                "taetigkeit": taetigkeit or (self.art if self.art in ("Planung", "Beratung", "Montage", "Koordination", "Service", "Buero") else "Sonstiges"),
                "beschreibung": beschreibung or self.titel,
                "abrechenbar": self.abrechenbar,
            }
        ).insert()
        return z.name


def erfasste_zeit_aktualisieren(aufgabe):
    if not aufgabe:
        return
    summe = frappe.db.get_value("PH Projektzeit", {"aufgabe": aufgabe}, "sum(dauer_min)") or 0
    frappe.db.set_value("PH Projekt Aufgabe", aufgabe, "erfasst_min", int(summe), update_modified=False)
