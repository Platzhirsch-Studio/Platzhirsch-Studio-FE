"""PH Kundenkarte Ereignis – Protokoll (nur anlegen). Helfer `protokoll()` für Controller, Tasks und API."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class PHKundenkarteEreignis(Document):
    def before_insert(self):
        if not self.zeitpunkt:
            self.zeitpunkt = now_datetime()
        if not self.von:
            self.von = frappe.session.user if frappe.session.user != "Guest" else None

    def validate(self):
        teile = [_(self.art)]
        if self.alt or self.neu:
            teile.append(f"{self.alt or '–'} → {self.neu or '–'}")
        self.titel = f"{self.kundenkarte}: {' '.join(teile)}"[:140]
        alt = self.get_doc_before_save()
        if alt and frappe.session.user != "Administrator":
            frappe.throw(_("Ereignisse werden nicht geändert (Protokoll)."))

    def on_trash(self):
        if "System Manager" not in frappe.get_roles():
            frappe.throw(_("Ereignisse werden nicht gelöscht (Protokoll)."))


def protokoll(kundenkarte, art, alt=None, neu=None, hinweis=None, jahresumsatz_cent=None, automatisch=False):
    """Ereignis anlegen; nie Ausnahmen nach außen (Protokoll darf keinen Fachprozess abbrechen)."""
    try:
        doc = frappe.get_doc(
            {
                "doctype": "PH Kundenkarte Ereignis",
                "kundenkarte": kundenkarte,
                "art": art,
                "zeitpunkt": now_datetime(),
                "alt": (str(alt) if alt is not None else None),
                "neu": (str(neu) if neu is not None else None),
                "hinweis": (hinweis or "")[:1000] or None,
                "jahresumsatz_cent": jahresumsatz_cent,
                "automatisch": int(bool(automatisch)),
            }
        )
        doc.flags.ignore_permissions = True
        doc.insert()
        return doc.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_kundenkarte: Ereignis konnte nicht protokolliert werden")
        return None
