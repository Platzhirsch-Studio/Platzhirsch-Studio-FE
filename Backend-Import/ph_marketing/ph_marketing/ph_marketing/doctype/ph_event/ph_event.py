"""PH Event – Plätze, Anmeldungen (Kindtabelle), Erinnerung, Teilnehmerliste. Status über Workflow + events.py."""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime, nowdate

from ph_marketing.ph_marketing import events
from ph_marketing.utils.token import email_normalisieren, email_plausibel

ID_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{2,60}$")


class PHEvent(Document):
    def validate(self):
        self.event_id = (self.event_id or "").strip().lower()
        if not ID_RE.match(self.event_id):
            frappe.throw(_("Kennung nur Kleinbuchstaben, Ziffern und Bindestrich (z. B. adventsabend-2026)."))
        if self.uhrzeit_bis and self.uhrzeit_von and str(self.uhrzeit_bis) <= str(self.uhrzeit_von):
            frappe.throw(_("Ende muss nach dem Beginn liegen."))
        if self.status in ("Offen", "Ausgebucht") and not self.uhrzeit_von:
            frappe.throw(_("Veröffentlichen erst mit bestätigter Uhrzeit (Website: event.js startTime)."))
        if self.kapazitaet is not None and cint(self.kapazitaet) < 0:
            frappe.throw(_("Plätze dürfen nicht negativ sein."))
        gesehen = set()
        for a in self.anmeldungen:
            a.email = email_normalisieren(a.email)
            if not email_plausibel(a.email):
                frappe.throw(_("Zeile {0}: E-Mail ungültig.").format(a.idx))
            if a.status in events.BELEGT_STATUS + ("warteliste",):
                if a.email in gesehen:
                    frappe.throw(_("Zeile {0}: {1} ist bereits angemeldet.").format(a.idx, a.email))
                gesehen.add(a.email)
            if not a.angemeldet_am:
                a.angemeldet_am = now_datetime()
            if (cint(a.personen) or 1) > (cint(self.max_personen_je_anmeldung) or 10):
                frappe.throw(_("Zeile {0}: höchstens {1} Personen je Anmeldung.").format(a.idx, self.max_personen_je_anmeldung or 10))
        events.plaetze_aktualisieren(self)
        if self.kapazitaet and events.belegte_plaetze(self) > cint(self.kapazitaet) and not self.flags.ignore_validate:
            frappe.throw(_("Mehr Personen angemeldet ({0}) als Plätze ({1}). Letzte Anmeldung auf Warteliste setzen.").format(events.belegte_plaetze(self), self.kapazitaet))

    def on_update(self):
        # Offen ↔ Ausgebucht automatisch nach Plätzen – per db_set am Workflow vorbei (Website-Benutzer/Scheduler haben keine Transition).
        events.status_nach_plaetzen(self)
        # neue Zeilen aus dem Desk: Bestätigung senden (Website-Anmeldungen senden in events.anmelden)
        for a in self.anmeldungen:
            if a.quelle != "website" and not a.bestaetigung_gesendet_am and a.status in ("angemeldet", "bestaetigt", "warteliste") and a.email and not str(a.email).endswith(".invalid"):
                try:
                    events.bestaetigung_senden(self, a)
                except Exception:  # noqa: BLE001
                    frappe.log_error(title=f"PH Event Bestätigung {self.name}")

    # ── Buttons (ph_event.js) ─────────────────────────────────────────────
    @frappe.whitelist()
    def anmeldung_hinzufuegen(self, name_person, email, personen=1, telefon=None, quelle="telefon", nachricht=None):
        self.check_permission("write")
        return events.anmelden(self.name, name_person, email, personen=personen, telefon=telefon, nachricht=nachricht, quelle=quelle if quelle in ("telefon", "showroom", "email", "backoffice") else "backoffice")

    @frappe.whitelist()
    def erinnerung_senden(self, alle=0):
        self.check_permission("write")
        n = events.erinnerung_senden(self, nur_fehlende=not cint(alle))
        self.add_comment("Info", _("Erinnerung an {0} Teilnehmer gesendet").format(n))
        return n

    @frappe.whitelist()
    def teilnehmer_status(self, zeile, status):
        """Check-in am Abend: erschienen / nicht erschienen."""
        self.check_permission("write")
        if status not in ("erschienen", "nicht erschienen", "bestaetigt", "abgesagt"):
            frappe.throw(_("Ungültiger Status."))
        frappe.db.set_value("PH Event Anmeldung", zeile, "status", status)
        self.reload()
        events.status_nach_plaetzen(self)
        return status

    @frappe.whitelist()
    def als_durchgefuehrt(self):
        self.check_permission("write")
        if getdate(self.datum) > getdate(nowdate()):
            frappe.throw(_("Das Event liegt noch in der Zukunft."))
        self.db_set({"status": "Durchgefuehrt", "workflow_state": "PH Durchgefuehrt"})
        return "Durchgefuehrt"

    @frappe.whitelist()
    def teilnehmerliste(self):
        self.check_permission("read")
        rows = [a for a in self.anmeldungen if a.status in ("angemeldet", "bestaetigt", "erschienen", "warteliste")]
        return {
            "zeilen": [{"name": a.name_person, "email": a.email, "telefon": a.telefon, "personen": a.personen, "status": a.status, "nachricht": a.nachricht} for a in sorted(rows, key=lambda r: (r.status == "warteliste", (r.name_person or "").lower()))],
            "personen": sum(cint(a.personen) or 1 for a in rows if a.status != "warteliste"),
            "warteliste": sum(cint(a.personen) or 1 for a in rows if a.status == "warteliste"),
        }
