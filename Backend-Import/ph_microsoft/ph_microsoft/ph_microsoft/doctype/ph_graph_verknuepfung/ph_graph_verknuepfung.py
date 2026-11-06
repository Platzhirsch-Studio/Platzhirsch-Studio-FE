"""PH Graph Verknuepfung – Vorgang ↔ Outlook-Objekt (gepflegt von kalender.py/kontakte.py)."""

from frappe.model.document import Document


class PHGraphVerknuepfung(Document):
    def validate(self):
        if not self.titel:
            self.titel = f"{self.art}: {self.referenz_doctype or ''} {self.referenz_name or ''}".strip()[:140]
