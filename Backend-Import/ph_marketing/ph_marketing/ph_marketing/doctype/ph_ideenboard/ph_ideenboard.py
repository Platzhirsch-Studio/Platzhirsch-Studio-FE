"""PH Ideenboard – Speicher des geteilten Ideenboards der Website (ph_marketing/ph_marketing/ideenboard.py)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_marketing.utils import ideenboard as ib


class PHIdeenboard(Document):
    def validate(self):
        if not ib.ist_token(self.board_id):
            frappe.throw(_("Board-ID ist ungültig."))
        for feld in ("share_hash", "admin_hash"):
            if not ib.ist_hash(self.get(feld)):
                frappe.throw(_("{0} ist kein SHA-256-Hash.").format(self.meta.get_label(feld)))
        if len(self.karten) > ib.LIMITS["cards"]:
            frappe.throw(_("Höchstens {0} Karten.").format(ib.LIMITS["cards"]))
        self.anzahl_karten = len(self.karten)
        erste = next((k.titel for k in sorted(self.karten, key=lambda z: z.position or z.idx) if k.titel), "")
        self.titel = (f"{erste} (+{len(self.karten) - 1})" if len(self.karten) > 1 else erste or _("Ideenboard"))[:140]
