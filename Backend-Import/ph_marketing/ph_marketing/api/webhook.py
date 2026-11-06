"""Resend-Webhook: POST /api/method/ph_marketing.api.webhook.resend – die EINZIGE Guest-Methode von ph_marketing.

Muster wie ph_shop.api.stripe.webhook (Anbieter kann kein Frappe-Token senden): Zugriffsschutz ist die Svix-Signatur
(utils/mail_ereignis.signatur_pruefen, Toleranz 5 min). Geheimnis nur in site_config.json: ph_resend_webhook_secret.
Ausgeschaltet, solange PH Marketing Einstellungen.resend_webhook_aktiv = 0 (Antwort 503, Resend wiederholt).
Logs ohne Personendaten. Nichts wird gesendet; es werden nur Status gesetzt.
"""

import json

import frappe

from ph_marketing.ph_marketing import mail_ereignisse
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils.mail_ereignis import SignaturFehler, ereignis_abbilden, signatur_pruefen

MAX_BYTES = 256 * 1024


def _antwort(status, body):
    frappe.local.response["http_status_code"] = status
    return body


@frappe.whitelist(allow_guest=True, methods=["POST"])
def resend():
    if not einstellungen()["resend_webhook_aktiv"]:
        return _antwort(503, {"received": False, "error": "disabled"})
    request = frappe.local.request
    if int(request.headers.get("Content-Length") or 0) > MAX_BYTES:
        return _antwort(413, {"received": False, "error": "too large"})
    roh = request.get_data() or b""
    if len(roh) > MAX_BYTES:
        return _antwort(413, {"received": False, "error": "too large"})
    h = request.headers
    try:
        signatur_pruefen(frappe.conf.get("ph_resend_webhook_secret"), h.get("svix-id"), h.get("svix-timestamp"), h.get("svix-signature"), roh)
    except SignaturFehler:
        frappe.logger("ph_marketing").warning("resend webhook: Signatur ungültig")
        return _antwort(400, {"received": False, "error": "invalid signature"})
    try:
        e = ereignis_abbilden(json.loads(roh.decode("utf-8")))
    except (ValueError, UnicodeDecodeError):
        return _antwort(400, {"received": False, "error": "invalid json"})
    frappe.set_user("Administrator")  # Verarbeitung mit vollen Rechten; der Aufrufer bleibt anonym
    try:
        ergebnis = mail_ereignisse.verarbeiten(h.get("svix-id"), e)
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.db.rollback()
        frappe.log_error(title="PH Marketing: Resend-Webhook")
        return _antwort(500, {"received": False, "error": "processing failed"})
    frappe.logger("ph_marketing").info(f"resend webhook {e['typ']}: {ergebnis}")
    return {"received": True, "result": ergebnis}
