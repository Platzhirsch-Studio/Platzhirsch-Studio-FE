"""PH Terminal – Stripe Terminal Reader einer Kasse. Zahlungsablauf: ph_kassa/ph_kassa/terminal.py."""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_kassa.terminal import TerminalFehler, dienst

READER_RE = re.compile(r"^tmr_[A-Za-z0-9]{6,}$")
STATUS_MAP = {"online": "Online", "offline": "Offline"}


class PHTerminal(Document):
    def validate(self):
        self.reader_id = (self.reader_id or "").strip()
        if not READER_RE.match(self.reader_id) and not self.reader_id.startswith("tmr_mock"):
            frappe.throw(_("Reader-ID hat das Format tmr_… (Stripe Terminal)."))
        self.standort_id = (self.standort_id or "").strip() or None
        if self.standort_id and not self.standort_id.startswith("tml_"):
            frappe.throw(_("Stripe-Standort hat das Format tml_…"))
        if self.reader_id.startswith("tmr_mock") and not self.testmodus:
            frappe.throw(_("Mock-Reader nur im Testmodus."))
        self.titel = f"{self.bezeichnung} ({self.reader_id})"[:140]
        if not self.aktiv:
            self.status = "Deaktiviert"

    @frappe.whitelist()
    def status_abfragen(self):
        """Button „Status abfragen“: Reader-Zustand aus Stripe/Mock holen und speichern."""
        self.check_permission("read")
        try:
            r = dienst(erzwinge_mock=bool(self.testmodus) and self.reader_id.startswith("tmr_mock")).reader_status(self.reader_id)
        except TerminalFehler as e:
            frappe.throw(_("Terminal-Abfrage fehlgeschlagen: {0}").format(e.meldung))
        status = STATUS_MAP.get(r.get("status"), "Unbekannt")
        aktion = r.get("action") or {}
        if status == "Online" and aktion.get("status") == "in_progress":
            status = "Beschaeftigt"
        self.db_set({"status": status, "geraetetyp": r.get("device_type"), "seriennummer": r.get("serial_number"), "letzter_kontakt": now_datetime()}, update_modified=False)
        return status


def reader_fuer_kasse(kasse: str | None) -> list[dict]:
    """Aktive Reader einer Kasse (oder alle ohne Kasse) für die Kassa-Page."""
    filters = {"aktiv": 1}
    rows = frappe.get_all("PH Terminal", filters=filters, fields=["name", "reader_id", "bezeichnung", "status", "kasse", "testmodus"], order_by="bezeichnung")
    return [r for r in rows if not kasse or not r.kasse or r.kasse == kasse]


def zahlung_merken(reader_id: str, payment_intent: str, status: str):
    try:
        if frappe.db.exists("PH Terminal", reader_id):
            frappe.db.set_value("PH Terminal", reader_id, {"letzte_zahlung_intent": payment_intent, "letzte_zahlung_status": status, "letzter_kontakt": now_datetime()}, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Terminal: letzte Zahlung konnte nicht gemerkt werden")
