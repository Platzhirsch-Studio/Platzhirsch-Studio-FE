"""PH Stripe Ereignis – Idempotenz und Audit des Webhooks (stripe_webhook.verarbeite). Protokoll-DocType (in_create)."""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime

AUFBEWAHRUNG_TAGE = 400  # Stripe-Ereignisse ~13 Monate (Abgleich mit Jahresabschluss), Payload wird früher gekürzt


class PHStripeEreignis(Document):
    def validate(self):
        self.titel = self.titel or f"{self.typ} · {self.art or '–'}"

    @frappe.whitelist()
    def erneut_verarbeiten(self):
        """Button: fehlgeschlagenes Ereignis aus dem gespeicherten Payload erneut durch die Verarbeitung schicken."""
        from ph_shop.stripe_webhook import verarbeite

        self.check_permission("write")
        if self.status not in ("fehler", "ignoriert"):
            frappe.throw(_("Nur Ereignisse mit Status „fehler“ oder „ignoriert“ können erneut verarbeitet werden."))
        if not self.payload_json:
            frappe.throw(_("Kein Payload gespeichert."))
        try:
            event = json.loads(self.payload_json)
        except ValueError:
            frappe.throw(_("Payload ist gekürzt/ungültig – Ereignis im Stripe-Dashboard erneut senden."))
        if self.status == "ignoriert":
            self.db_set("status", "fehler", update_modified=False)  # damit verarbeite() nicht „wiederholt“ meldet
        ergebnis, _name = verarbeite(event)
        return ergebnis


def payload_kuerzen():
    """Täglich: Payload nach 90 Tagen leeren, Ereignisse nach AUFBEWAHRUNG_TAGE löschen (Datensparsamkeit)."""
    frappe.db.sql("update `tabPH Stripe Ereignis` set payload_json = NULL where empfangen_am < %s and payload_json is not null", add_days(now_datetime(), -90))
    frappe.db.delete("PH Stripe Ereignis", {"empfangen_am": ("<", add_days(now_datetime(), -AUFBEWAHRUNG_TAGE))})
    frappe.db.commit()
