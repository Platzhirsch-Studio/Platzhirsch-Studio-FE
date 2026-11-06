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
        # Warteliste automatisch nachrücken, wenn Plätze frei wurden (Absage, Kapazität erhöht)
        if not self.flags.kein_nachruecken:
            try:
                events.nachruecken(self)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Event Nachrücken {self.name}")
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
        if status not in ("erschienen", "nicht erschienen", "bestaetigt", "abgesagt", "angemeldet"):
            frappe.throw(_("Ungültiger Status."))
        a = next((x for x in self.anmeldungen if x.name == zeile), None)
        if not a:
            frappe.throw(_("Anmeldung nicht gefunden."))
        if status == "erschienen":
            from ph_marketing.ph_marketing import checkin

            return checkin.einchecken(event=self.name, zeile=zeile)["status"]
        if status == "angemeldet" and a.status == "warteliste":
            # Nachrücken von Hand (Konzept L19) – Kapazität/Kontingent prüfen
            if events.ist_ausgebucht(self, a.personen, eingeladen=bool(a.get("eingeladen"))):
                frappe.throw(_("Nicht genug freie Plätze für {0} Personen.").format(a.personen))
            frappe.db.set_value("PH Event Anmeldung", zeile, {"status": "angemeldet", "nachgerueckt_am": now_datetime()})
        elif status == "angemeldet":
            frappe.throw(_("„angemeldet“ nur von der Warteliste aus."))
        else:
            frappe.db.set_value("PH Event Anmeldung", zeile, "status", status)
        self.reload()
        events.status_nach_plaetzen(self)
        if status == "abgesagt":
            events.nachruecken(self)
        return status

    @frappe.whitelist()
    def check_in(self, code=None, zeile=None, personen=None):
        """Einlass: QR-Code scannen (code) oder Zeile wählen. Doppel-Check-in → status „bereits“."""
        self.check_permission("write")
        from ph_marketing.ph_marketing import checkin

        if code:
            r = checkin.einchecken(code=code, personen=personen)
            if r.get("event") and r["event"] != self.name:
                return {"status": "anderes_event", "event": r["event"]}
            return r
        return checkin.einchecken(event=self.name, zeile=zeile, personen=personen)

    @frappe.whitelist()
    def checkin_stand(self):
        from ph_marketing.ph_marketing import checkin

        return checkin.stand(self.name)

    @frappe.whitelist()
    def ticket_qr(self, zeile):
        """QR-Code (SVG) einer Anmeldung für Ticket-Druck/Anzeige."""
        self.check_permission("read")
        from ph_marketing.ph_marketing import checkin

        if not any(a.name == zeile for a in self.anmeldungen):
            frappe.throw(_("Anmeldung nicht gefunden."))
        return {"code": checkin.code_fuer(self.name, zeile), "svg": checkin.qr_svg(self.name, zeile)}

    @frappe.whitelist()
    def einladungen_senden(self, trockenlauf=1, limit=500):
        """Einladung an das Segment (Zweck einladungen); trockenlauf=1 zählt nur. Senden nur Leitung."""
        self.check_permission("write")
        if not cint(trockenlauf) and not ({"PH Marketing Leitung", "System Manager"} & set(frappe.get_roles())):
            frappe.throw(_("Nur die Leitung versendet Einladungen."))
        r = events.einladungen_senden(self, trockenlauf=cint(trockenlauf), limit=limit)
        if not cint(trockenlauf):
            self.add_comment("Info", _("Einladungen gesendet: {0}").format(r["gesendet"]))
        return r

    @frappe.whitelist()
    def nachruecken_jetzt(self):
        self.check_permission("write")
        return events.nachruecken(self)

    @frappe.whitelist()
    def absage_senden(self, hinweis=None):
        """Nach Workflow „Absagen“: Teilnehmer per Mail informieren (Leitung)."""
        self.check_permission("write")
        if self.status != "Abgesagt":
            frappe.throw(_("Absage-Mail erst, wenn das Event abgesagt ist."))
        if not ({"PH Marketing Leitung", "System Manager"} & set(frappe.get_roles())):
            frappe.throw(_("Nur die Leitung informiert über die Absage."))
        n = events.absage_an_teilnehmer(self, hinweis)
        self.add_comment("Info", _("Absage an {0} Teilnehmer gesendet").format(n))
        return n

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
