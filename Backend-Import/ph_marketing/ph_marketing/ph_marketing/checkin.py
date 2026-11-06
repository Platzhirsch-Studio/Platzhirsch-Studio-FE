"""Event-Check-in per QR-Code (Showroom-Tablet/Smartphone im Backoffice).

Code = utils/eventlogik.checkin_code(event, zeile, schluessel): kein Personenbezug im QR, HMAC-signiert.
Schlüssel: HMAC des Frappe-Verschlüsselungsschlüssels der Site (site_config encryption_key) mit festem Zweck –
kein neues Geheimnis, nie in Dateien; ein Schlüsselwechsel macht alte Tickets ungültig (Event-weit vertretbar).
Doppel-Check-in wird erkannt und nicht gezählt (Antwort „bereits“ mit Uhrzeit).
"""

import hashlib
import hmac

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_marketing.utils import eventlogik

ZWECK = b"ph-marketing-event-checkin-v1"


def schluessel():
    from frappe.utils.password import get_encryption_key

    return hmac.new(get_encryption_key().encode("utf-8"), ZWECK, hashlib.sha256).hexdigest()


def code_fuer(event, zeile):
    return eventlogik.checkin_code(event, zeile, schluessel())


def qr_svg(event, zeile, mm=30):
    from ph_core.utils.druck import ph_qr_svg

    return ph_qr_svg(code_fuer(event, zeile), mm)


def einchecken(code=None, event=None, zeile=None, personen=None):
    """Code scannen oder Zeile wählen. → dict(status, event, zeile, name, personen, erschienen_am)."""
    if code:
        try:
            event, zeile = eventlogik.checkin_lesen(code, schluessel())
        except ValueError:
            return {"status": "ungueltig"}
    if not (event and zeile) or not frappe.db.exists("PH Event Anmeldung", {"name": zeile, "parent": event, "parenttype": "PH Event"}):
        return {"status": "ungueltig"}
    ev = frappe.get_doc("PH Event", event)
    ev.check_permission("write")
    a = next(x for x in ev.anmeldungen if x.name == zeile)
    entscheid = eventlogik.checkin_entscheiden(a.status, a.erschienen_am)
    antwort = {"event": ev.name, "zeile": a.name, "name": a.name_person, "personen": cint(a.personen) or 1, "begleitung": a.begleitung, "erschienen_am": str(a.erschienen_am) if a.erschienen_am else None}
    if entscheid != "ok":
        return {**antwort, "status": entscheid}
    jetzt = now_datetime()
    werte = {"status": "erschienen", "erschienen_am": jetzt, "checkin_durch": frappe.session.user}
    if personen and cint(personen) != cint(a.personen):
        # tatsächliche Personenzahl am Abend (z. B. Begleitung kam nicht) – Zähler für Auslastung
        werte["personen"] = max(cint(personen), 1)
    frappe.db.set_value("PH Event Anmeldung", a.name, werte)
    return {**antwort, "status": "ok", "erschienen_am": str(jetzt), "personen": werte.get("personen", antwort["personen"])}


def stand(event):
    """Live-Zähler am Eingang."""
    ev = frappe.get_doc("PH Event", event)
    ev.check_permission("read")
    erwartet = sum(cint(a.personen) or 1 for a in ev.anmeldungen if a.status in ("angemeldet", "bestaetigt", "erschienen"))
    da = sum(cint(a.personen) or 1 for a in ev.anmeldungen if a.status == "erschienen")
    return {"erwartet": erwartet, "erschienen": da, "offen": max(erwartet - da, 0)}


def pruefen_rolle():
    rollen = set(frappe.get_roles())
    if not rollen & {"PH Marketing Mitarbeiter", "PH Marketing Leitung", "System Manager", "PH Backoffice-Admin"}:
        frappe.throw(_("Keine Berechtigung für den Check-in."), frappe.PermissionError)


def ph_event_ticket_qr(event, zeile, mm=28):
    """Jinja-Helfer für das Druckformat „PH Event Ticket“ (hooks.py jinja.methods)."""
    try:
        return qr_svg(event, zeile, mm)
    except Exception:  # noqa: BLE001 – Druck darf nicht scheitern
        frappe.log_error(title=f"PH Event Ticket QR {event}")
        return ""
