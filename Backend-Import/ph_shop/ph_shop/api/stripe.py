"""Stripe-Webhook: POST /api/method/ph_shop.api.stripe.webhook – die EINZIGE Guest-Methode von ph_shop.

Ablauf (src/lib/payments/webhook.js auf Frappe übertragen):
  1. Rohbody lesen (höchstens 256 KB) und Stripe-Signature prüfen (ph_shop.stripe_signatur, Toleranz aus
     PH Stripe Einstellungen, Standard 300 s). Ungültig/fehlend → 400, nichts wird gespeichert.
  2. Ereignis als JSON laden; id/type fehlen → 400.
  3. Verarbeitung als Administrator (stripe_webhook.verarbeite): PH Stripe Ereignis (Idempotenz über event_id),
     Zuordnung über metadata.art + order_id/deposit_id, Buchungen über ph_shop.zahlung.
  4. Antwort {"received": true, "result": …}; Verarbeitungsfehler → 500 (Stripe wiederholt), Ereignis „fehler“.
Logs ohne Personendaten. Signaturgeheimnis nur aus site_config (ph_stripe_webhook_secret).
"""

import json

import frappe

from ph_shop import stripe_client
from ph_shop.stripe_signatur import SignaturFehler, pruefe
from ph_shop.stripe_webhook import verarbeite

MAX_WEBHOOK_BYTES = 256 * 1024


def _antwort(status, body):
    frappe.local.response["http_status_code"] = status
    return body


@frappe.whitelist(allow_guest=True, methods=["POST"])
def webhook():
    request = frappe.local.request
    laenge = int(request.headers.get("Content-Length") or 0)
    if laenge > MAX_WEBHOOK_BYTES:
        return _antwort(413, {"received": False, "error": "too large"})
    roh = request.get_data() or b""
    if len(roh) > MAX_WEBHOOK_BYTES:
        return _antwort(413, {"received": False, "error": "too large"})
    signatur = request.headers.get("Stripe-Signature")
    if not signatur:
        return _antwort(400, {"received": False, "error": "missing signature"})
    try:
        pruefe(roh, signatur, stripe_client.webhook_secret(), toleranz_s=stripe_client.einstellungen()["webhook_toleranz_s"])
    except SignaturFehler:
        frappe.logger("ph_shop").warning("stripe webhook: Signatur ungültig")
        return _antwort(400, {"received": False, "error": "invalid signature"})
    try:
        event = json.loads(roh.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return _antwort(400, {"received": False, "error": "invalid json"})
    if not isinstance(event, dict) or not event.get("id") or not event.get("type"):
        return _antwort(400, {"received": False, "error": "invalid event"})

    frappe.set_user("Administrator")  # Verarbeitung mit vollen Rechten; der Aufrufer bleibt anonym
    try:
        ergebnis, _name = verarbeite(event, roh)
    except Exception:  # noqa: BLE001 – bereits im Ereignis und Error Log vermerkt
        return _antwort(500, {"received": False, "error": "processing failed"})
    frappe.logger("ph_shop").info(f"stripe webhook {event['type']} {event['id']}: {ergebnis}")
    return {"received": True, "result": ergebnis}
