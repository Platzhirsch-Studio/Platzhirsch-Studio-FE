"""PH Portal Sitzung – ein Kunden-Token je Login-Anfrage (Logik: ph_projekte/utils/portal_sitzung.py, API: api/basis.py)."""

from frappe.model.document import Document


class PHPortalSitzung(Document):
    def validate(self):
        self.titel = f"{self.kontakt} · {self.status}"[:140]
