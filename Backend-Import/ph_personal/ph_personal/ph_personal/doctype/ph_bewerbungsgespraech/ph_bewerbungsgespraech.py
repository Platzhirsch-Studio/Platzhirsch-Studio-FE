"""PH Bewerbungsgespraech – Termin zu einer Bewerbung; legt auf Wunsch einen Frappe-Kalendereintrag (Event) an
und spiegelt Ergebnisse in den Bewerbungsstatus (Angebot/Absage über die Dokument-Methoden der Bewerbung)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, cint, get_datetime, now_datetime


class PHBewerbungsgespraech(Document):
    def validate(self):
        self.dauer_min = cint(self.dauer_min) or 60
        if self.dauer_min < 5 or self.dauer_min > 600:
            frappe.throw(_("Dauer muss zwischen 5 und 600 Minuten liegen."))
        self.ende = add_to_date(get_datetime(self.start), minutes=self.dauer_min)
        if not self.bewerber and self.bewerbung:
            self.bewerber = frappe.db.get_value("PH Bewerbung", self.bewerbung, "titel")
        if not self.ort and self.modus == "Vor Ort":
            self.ort = _("Studio Lochau")
        self.titel = f"{self.bewerber or self.bewerbung} · {frappe.format(get_datetime(self.start), {'fieldtype': 'Datetime'})}"[:140]
        if self.status == "Durchgefuehrt" and not self.ergebnis:
            self.ergebnis = "Offen"
        self._ueberschneidung_pruefen()

    def _ueberschneidung_pruefen(self):
        if self.status != "Geplant":
            return
        andere = frappe.get_all(
            "PH Bewerbungsgespraech",
            filters={"name": ("!=", self.name or ""), "verantwortlich": self.verantwortlich, "status": "Geplant", "start": ("<", self.ende), "ende": (">", self.start)},
            fields=["name", "titel"],
            limit=1,
        )
        if andere:
            frappe.msgprint(_("Hinweis: überschneidet sich mit {0} ({1}).").format(andere[0].name, andere[0].titel), indicator="orange")

    def on_update(self):
        alt = self.get_doc_before_save()
        if alt and alt.status == self.status and alt.start == self.start and alt.ende == self.ende:
            return
        if self.status == "Geplant" and self.kalender_event:
            self._event_aktualisieren()
        if self.status in ("Abgesagt", "Nicht erschienen") and self.kalender_event:
            frappe.db.set_value("Event", self.kalender_event, "status", "Cancelled")

    def on_trash(self):
        if self.kalender_event:
            frappe.delete_doc("Event", self.kalender_event, ignore_permissions=True, force=True)

    def _event_aktualisieren(self):
        try:
            ev = frappe.get_doc("Event", self.kalender_event)
            ev.starts_on = self.start
            ev.ends_on = self.ende
            ev.subject = _("Bewerbungsgespräch: {0}").format(self.bewerber)
            ev.save(ignore_permissions=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Bewerbungsgespräch: Kalendereintrag nicht aktualisiert")

    # ── Buttons (ph_bewerbungsgespraech.js) ─────────────────────────────────

    @frappe.whitelist()
    def kalender_eintragen(self):
        """Button „In Kalender eintragen“: privates Event für die Gesprächsführung (ohne Bewerberdaten im Betreff-Detail)."""
        self.check_permission("write")
        if self.kalender_event and frappe.db.exists("Event", self.kalender_event):
            return self.kalender_event
        ev = frappe.get_doc(
            {
                "doctype": "Event",
                "subject": _("Bewerbungsgespräch: {0}").format(self.bewerber),
                "event_type": "Private",
                "event_category": "Meeting",
                "starts_on": self.start,
                "ends_on": self.ende,
                "description": _("{0} · {1} · Bewerbung {2}").format(self.modus, self.ort or "", self.bewerbung),
                "owner": self.verantwortlich,
                "event_participants": [{"reference_doctype": "PH Bewerbung", "reference_docname": self.bewerbung}],
            }
        )
        ev.insert(ignore_permissions=True)
        self.db_set("kalender_event", ev.name)
        return ev.name

    @frappe.whitelist()
    def abschliessen(self, ergebnis="Offen", naechster_schritt=None):
        """Button „Durchgeführt“: Status setzen, Ergebnis in die Bewerbung spiegeln (Angebot → Status Angebot)."""
        self.check_permission("write")
        self.status = "Durchgefuehrt"
        self.ergebnis = ergebnis
        self.naechster_schritt = naechster_schritt
        self.save()
        bew = frappe.get_doc("PH Bewerbung", self.bewerbung)
        if ergebnis == "Angebot" and bew.status in ("Gesichtet", "Gespraech"):
            bew._status_setzen("Angebot", _("Angebot nach Gespräch {0}").format(self.name))
        elif ergebnis == "Absage":
            bew.add_comment("Info", _("Gespräch {0}: Ergebnis Absage – bitte „Absage senden“ ausführen.").format(self.name))
        return self.status


def gespraeche_diese_woche():
    start = frappe.utils.get_first_day_of_week(now_datetime())
    ende = add_to_date(start, days=7)
    return frappe.db.count("PH Bewerbungsgespraech", {"status": "Geplant", "start": ("between", [start, ende])})
