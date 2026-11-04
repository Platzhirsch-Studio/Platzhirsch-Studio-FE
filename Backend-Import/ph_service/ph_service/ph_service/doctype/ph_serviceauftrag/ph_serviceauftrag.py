import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, nowdate


class PHServiceauftrag(Document):
    def validate(self):
        if self.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
            try:
                k = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "firma", "strasse", "plz", "ort", "land"], as_dict=True)
            except Exception:  # noqa: BLE001
                k = None
            if k:
                self.kunde_name = (" ".join(x for x in (k.vorname, k.nachname) if x) or k.firma or self.kontakt)[:140]
                if not self.strasse and not self.ort:
                    self.strasse, self.plz, self.ort, self.land = k.strasse, k.plz, k.ort, k.land or self.land
        if self.status in ("Abgeholt", "Eingelagert") and not self.positionen:
            frappe.throw(_("Übernahmeliste (Stücke) ist leer."))
        if self.has_value_changed("status"):
            if self.status == "Eingelagert":
                self.einlagerung_von = self.einlagerung_von or nowdate()
                if self.art == "Winterlager" and not self.lagerort:
                    frappe.msgprint(_("Lagerort für das Winterlager fehlt."), indicator="orange")
            if self.status == "Zurueckgebracht":
                self.einlagerung_bis = self.einlagerung_bis or nowdate()
        if self.uebernahme_unterschrift and not self.uebernahme_am:
            self.uebernahme_am = now_datetime()
        if self.rueckgabe_unterschrift and not self.rueckgabe_am_unterschrift:
            self.rueckgabe_am_unterschrift = now_datetime()
        self.titel = f"{_(self.art)}: {self.kunde_name or self.kontakt} ({len(self.positionen or [])} Stk.)"[:140]
