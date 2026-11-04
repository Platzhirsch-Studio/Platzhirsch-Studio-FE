"""Prüfung der Stripe-Webhook-Signatur – reine Logik ohne Frappe und ohne Netz.

Stripe signiert den Rohbody: Header ``Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>…]``,
signierte Nachricht ``f"{t}.{body}"``, HMAC-SHA256 mit dem Webhook-Geheimnis (whsec_…).
Entspricht ``stripe.WebhookSignature.verify_header`` (Toleranz 300 s), wird aber hier selbst
gerechnet, damit Tests ohne das Paket und ohne Netz laufen (src/lib/payments/webhook.js macht es
auf der Website mit dem SDK). Ist das Paket ``stripe`` installiert, kann der Aufrufer zusätzlich
``stripe.Webhook.construct_event`` verwenden – das Ergebnis ist identisch.
"""

import hashlib
import hmac
import time

TOLERANZ_S = 300


class SignaturFehler(ValueError):
    """Signatur fehlt, ist unlesbar, falsch oder zu alt."""


def _header_lesen(header):
    zeit = None
    signaturen = []
    for teil in str(header or "").split(","):
        if "=" not in teil:
            continue
        k, v = teil.strip().split("=", 1)
        if k == "t":
            try:
                zeit = int(v)
            except ValueError:
                zeit = None
        elif k == "v1":
            signaturen.append(v)
    return zeit, signaturen


def signiere(body, secret, zeit=None):
    """Signatur-Header für Tests und den Mock erzeugen (so wie Stripe ihn sendet)."""
    zeit = int(zeit if zeit is not None else time.time())
    daten = body if isinstance(body, bytes) else str(body).encode("utf-8")
    mac = hmac.new(str(secret).encode("utf-8"), f"{zeit}.".encode("utf-8") + daten, hashlib.sha256).hexdigest()
    return f"t={zeit},v1={mac}"


def pruefe(body, header, secret, toleranz_s=TOLERANZ_S, jetzt=None):
    """Wirft SignaturFehler, wenn die Signatur ungültig ist. Gibt den Zeitstempel zurück."""
    if not secret:
        raise SignaturFehler("Webhook-Geheimnis fehlt (site_config ph_stripe_webhook_secret).")
    if not header:
        raise SignaturFehler("Stripe-Signature fehlt.")
    zeit, signaturen = _header_lesen(header)
    if zeit is None or not signaturen:
        raise SignaturFehler("Stripe-Signature unlesbar.")
    daten = body if isinstance(body, bytes) else str(body).encode("utf-8")
    erwartet = hmac.new(str(secret).encode("utf-8"), f"{zeit}.".encode("utf-8") + daten, hashlib.sha256).hexdigest()
    if not any(hmac.compare_digest(erwartet, s) for s in signaturen):
        raise SignaturFehler("Signatur stimmt nicht.")
    jetzt = int(jetzt if jetzt is not None else time.time())
    if toleranz_s and abs(jetzt - zeit) > toleranz_s:
        raise SignaturFehler("Zeitstempel außerhalb der Toleranz.")
    return zeit
