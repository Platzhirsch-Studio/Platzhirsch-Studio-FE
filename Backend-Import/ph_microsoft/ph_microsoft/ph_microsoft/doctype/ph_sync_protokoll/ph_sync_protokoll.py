"""PH Sync Protokoll – nur anlegen; nie Token, Mailinhalt oder Betreff (ph_microsoft/ph_microsoft/protokoll.py)."""

from frappe.model.document import Document


class PHSyncProtokoll(Document):
    def before_insert(self):
        self.titel = " · ".join(x for x in (self.bereich, self.aktion, self.ergebnis) if x)[:140]
