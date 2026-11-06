"""Graph-Change-Notifications (ohne Frappe): Validierungs-Handshake, clientState-Prüfung, Abo-Laufzeiten.

Quelle: Microsoft Graph „Receive change notifications through webhooks“
(https://learn.microsoft.com/graph/change-notifications-delivery-webhooks):
  * Beim Anlegen/Erneuern ruft Graph POST <notificationUrl>?validationToken=<text> auf; die Antwort muss
    binnen 10 s 200 mit Content-Type text/plain und genau diesem Text sein.
  * Benachrichtigungen kommen als {"value": [{subscriptionId, clientState, changeType, resource,
    resourceData, lifecycleEvent?, …}]}; Antwort 202 binnen 3 s, Verarbeitung asynchron.
  * clientState (≤ 128 Zeichen) wird bei jeder Benachrichtigung mitgesendet → hier gegen den gespeicherten
    SHA-256-Hash geprüft (das Geheimnis selbst wird nicht gespeichert).
  * Outlook-Ressourcen (Mail, Kalender): höchstens 10 080 min (knapp 7 Tage) Laufzeit.
"""

import hashlib
import hmac
import secrets
from datetime import timedelta

MAX_MINUTEN_OUTLOOK = 10080
LAUFZEIT_MINUTEN = 4320          # 3 Tage – täglich erneuern lässt zwei Tage Reserve
ERNEUERN_UNTER_STUNDEN = 36
LIFECYCLE = {"reauthorizationrequired", "subscriptionremoved", "missed"}


def validierungs_token(args):
    """validationToken aus Query/Form (dict) oder None. Länge begrenzt, nur druckbare Zeichen."""
    wert = (args or {}).get("validationToken")
    if wert is None:
        return None
    wert = str(wert)
    if not wert or len(wert) > 2048 or any(ord(c) < 32 for c in wert):
        return None
    return wert


def neues_client_state():
    return secrets.token_urlsafe(48)[:96]


def client_state_hash(wert):
    return hashlib.sha256(f"ph_ms:{wert or ''}".encode()).hexdigest()


def client_state_passt(gesendet, gespeicherter_hash):
    if not gesendet or not gespeicherter_hash:
        return False
    return hmac.compare_digest(client_state_hash(gesendet), str(gespeicherter_hash))


def benachrichtigungen(body, abo_hash):
    """body = {"value": [...]}; abo_hash(subscription_id) → gespeicherter Hash oder None.
    → (gueltig: [{subscription_id, change_type, resource, lifecycle, ressource_id}], abgelehnt: int)"""
    gueltig, abgelehnt = [], 0
    for n in (body or {}).get("value", []) or []:
        if not isinstance(n, dict):
            abgelehnt += 1
            continue
        sid = str(n.get("subscriptionId") or "")
        if not sid or not client_state_passt(n.get("clientState"), abo_hash(sid)):
            abgelehnt += 1
            continue
        gueltig.append({
            "subscription_id": sid,
            "change_type": str(n.get("changeType") or ""),
            "resource": str(n.get("resource") or "")[:500],
            "lifecycle": str(n.get("lifecycleEvent") or "").lower() or None,
            "ressource_id": str((n.get("resourceData") or {}).get("id") or "")[:300] or None,
        })
    return gueltig, abgelehnt


def ablauf_neu(jetzt_utc, minuten=LAUFZEIT_MINUTEN):
    return jetzt_utc + timedelta(minutes=min(int(minuten), MAX_MINUTEN_OUTLOOK - 60))


def erneuern_noetig(ablauf_utc, jetzt_utc, unter_stunden=ERNEUERN_UNTER_STUNDEN):
    return ablauf_utc is None or ablauf_utc - jetzt_utc < timedelta(hours=unter_stunden)


def iso_utc(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.0000000Z")
