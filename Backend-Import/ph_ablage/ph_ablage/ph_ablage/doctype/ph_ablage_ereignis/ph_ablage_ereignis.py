"""PH Ablage Ereignis – Protokoll (nur anlegen, nie Inhalte). Helfer `protokoll()` für API, Jobs und Hooks."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class PHAblageEreignis(Document):
    def before_insert(self):
        if not self.zeitpunkt:
            self.zeitpunkt = now_datetime()
        if not self.benutzer and frappe.session.user != "Guest":
            self.benutzer = frappe.session.user

    def validate(self):
        ziel = self.datei or self.ordner or self.freigabelink or ""
        self.titel = f"{_(self.art)}: {ziel}".strip(": ")[:200]
        if self.get_doc_before_save() and frappe.session.user != "Administrator":
            frappe.throw(_("Ereignisse werden nicht geändert (Protokoll)."))

    def on_trash(self):
        if "System Manager" not in frappe.get_roles():
            frappe.throw(_("Ereignisse werden nicht gelöscht (Protokoll)."))


def protokoll(art, datei=None, ordner=None, version=None, freigabelink=None, bezug_doctype=None, bezug_name=None, hinweis=None, automatisch=False):
    """Ereignis anlegen; wirft nie (das Protokoll bricht keinen Fachprozess ab). hinweis: nur Metadaten."""
    try:
        try:
            from ph_core.api import ip_hash

            ip = ip_hash()
        except Exception:  # noqa: BLE001
            ip = None
        doc = frappe.get_doc({
            "doctype": "PH Ablage Ereignis",
            "art": art,
            "zeitpunkt": now_datetime(),
            "datei": datei,
            "ordner": ordner,
            "version": version,
            "freigabelink": freigabelink,
            "bezug_doctype": bezug_doctype if bezug_name else None,
            "bezug_name": bezug_name,
            "hinweis": (hinweis or "")[:1000] or None,
            "ip_hash": ip,
            "automatisch": int(bool(automatisch)),
        })
        doc.flags.ignore_permissions = True
        doc.flags.ignore_links = True
        doc.insert()
        return doc.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_ablage: Ereignis konnte nicht protokolliert werden")
        return None
