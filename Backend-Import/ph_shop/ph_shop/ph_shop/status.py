"""Statuswechsel durch den Server (Webhook, Buttons, Scheduler) – ohne Workflow-Transition.

Der Workflow (fixtures/workflow.json) deckt nur die händischen Übergänge; Zahlungseingänge,
Erstattungen oder Fristabläufe setzt der Server direkt: status + workflow_state per db_set (keine
Transition-Prüfung) und eine Zeile im Verlauf (PH Bestellung Verlauf), wie verlauf[] der Website.
"""

import frappe
from frappe.utils import now_datetime

BESTELLUNG_STATES = {
    "offen": "PH Offen",
    "zahlung_ausstehend": "PH Zahlung ausstehend",
    "bezahlt": "PH Bezahlt",
    "versandbereit": "PH Versandbereit",
    "versendet": "PH Versendet",
    "reserviert": "PH Reserviert",
    "abholbereit": "PH Abholbereit",
    "abgeholt": "PH Abgeholt",
    "abgeschlossen": "PH Abgeschlossen",
    "fehlgeschlagen": "PH Fehlgeschlagen",
    "abgelaufen": "PH Abgelaufen",
    "storniert": "PH Storniert",
    "widerrufen": "PH Widerrufen",
    "erstattet": "PH Erstattet",
    "teilerstattet": "PH Teilerstattet",
    "checkout_fehler": "PH Checkout-Fehler",
    "pruefen": "PH Pruefen",
}
GUTSCHEIN_STATES = {
    "Erstellt": "PH Erstellt",
    "Aktiv": "PH Aktiv",
    "Teilweise eingeloest": "PH Teilweise eingeloest",
    "Eingeloest": "PH Eingeloest",
    "Gesperrt": "PH Gesperrt",
    "Abgelaufen": "PH Abgelaufen",
    "Erstattet": "PH Erstattet",
}
WORKFLOW_STATES = {"PH Bestellung": BESTELLUNG_STATES, "PH Gutschein": GUTSCHEIN_STATES}


def workflow_state_fuer(doctype, status):
    return WORKFLOW_STATES.get(doctype, {}).get(status)


def setzen(doc, status, hinweis=None, von=None, extra=None):
    """status (+ workflow_state) direkt schreiben, Verlaufszeile anhängen, Kommentar schreiben."""
    werte = dict(extra or {})
    werte["status"] = status
    ws = workflow_state_fuer(doc.doctype, status)
    if ws and frappe.get_meta(doc.doctype).has_field("workflow_state"):
        werte["workflow_state"] = ws
    doc.db_set(werte, update_modified=True)
    verlauf(doc, status, hinweis, von)


def verlauf(doc, status, hinweis=None, von=None):
    """Zeile in `verlauf` (PH Bestellung Verlauf) direkt einfügen – ohne vollständiges save()."""
    if not doc.meta.has_field("verlauf"):
        return
    zeile = doc.append("verlauf", {"zeit": now_datetime(), "status": status, "von": (von or frappe.session.user or "System")[:140], "hinweis": (hinweis or "")[:140]})
    zeile.db_insert()
    try:
        doc.add_comment("Info", f"Status → {status}" + (f": {hinweis}" if hinweis else ""))
    except Exception:  # noqa: BLE001 – Kommentar darf nie den Vorgang stoppen
        pass
