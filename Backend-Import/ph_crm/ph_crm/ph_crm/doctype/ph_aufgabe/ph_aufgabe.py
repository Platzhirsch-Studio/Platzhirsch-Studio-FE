"""PH Aufgabe – Aufgabe mit Fälligkeit; spiegelt die Zuweisung in Frappe-Assignments (Sidebar/„Meine Aufgaben“)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

OFFEN = ("Offen", "In Arbeit")


class PHAufgabe(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Offen"
        if not self.zugewiesen_an and frappe.session.user not in ("Guest", "Administrator"):
            self.zugewiesen_an = frappe.session.user

    def validate(self):
        self.titel = (self.titel or "").strip()[:140]
        if not self.titel:
            frappe.throw(_("Aufgabe braucht einen Titel."))
        if self.referenz_doctype and not self.referenz_name:
            frappe.throw(_("Vorgang auswählen oder Typ leeren."))
        if self.referenz_doctype and self.referenz_name and not self.kontakt:
            self.kontakt_aus_vorgang()
        if self.status in ("Erledigt", "Verworfen"):
            self.erledigt_am = self.erledigt_am or now_datetime()
            self.erledigt_von = self.erledigt_von or frappe.session.user
        else:
            self.erledigt_am = None
            self.erledigt_von = None

    def kontakt_aus_vorgang(self):
        if self.referenz_doctype == "PH Kontakt":
            self.kontakt = self.referenz_name
            return
        if frappe.db.exists("DocType", self.referenz_doctype) and frappe.get_meta(self.referenz_doctype).has_field("kontakt"):
            self.kontakt = frappe.db.get_value(self.referenz_doctype, self.referenz_name, "kontakt")

    def on_update(self):
        try:
            self.zuweisung_spiegeln()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Aufgabe {self.name}: Zuweisung fehlgeschlagen")

    def zuweisung_spiegeln(self):
        from frappe.desk.form.assign_to import add, clear

        if self.status in OFFEN and self.zugewiesen_an:
            if self.has_value_changed("zugewiesen_an") or self.is_new():
                clear(self.doctype, self.name)
                add({"assign_to": [self.zugewiesen_an], "doctype": self.doctype, "name": self.name, "description": self.titel, "date": self.faellig, "priority": {"Hoch": "High", "Niedrig": "Low"}.get(self.prioritaet, "Medium")})
        elif self.status not in OFFEN and self.has_value_changed("status"):
            clear(self.doctype, self.name)

    @frappe.whitelist()
    def status_setzen(self, status, ergebnis=None):
        self.check_permission("write")
        if status not in ("Offen", "In Arbeit", "Erledigt", "Verworfen"):
            frappe.throw(_("Unbekannter Status."))
        self.status = status
        if ergebnis:
            self.ergebnis = ergebnis
        self.save()
        return self.status

    @frappe.whitelist()
    def verschieben(self, tage=1):
        self.check_permission("write")
        from frappe.utils import add_days

        self.faellig = add_days(max(getdate(self.faellig), getdate(nowdate())), int(tage))
        self.save()
        return self.faellig


def offene_fuer(user):
    return frappe.db.count("PH Aufgabe", {"status": ("in", OFFEN), "zugewiesen_an": user})
