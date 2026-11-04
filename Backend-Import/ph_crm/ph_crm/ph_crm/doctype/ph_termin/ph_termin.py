"""PH Termin – Controller.

Status-Lebenslauf (Workflow „PH Termin“ + Website-API ph_crm.api.termin):
  Unbestaetigt → Bestaetigt (verify_termin / Button „Bestätigen“) → Erledigt / Nicht erschienen
  Unbestaetigt | Bestaetigt → Storniert (Kunde über API, Mitarbeiter)
  Unbestaetigt → Abgelehnt (Leitung, oder Scheduler nach abgelaufener Reservierung)
Buttons (ph_termin.js): Bestätigen, Absagen (Mail), Umbuchen (Dialog), Meet-Link erzeugen,
Erledigt + Gesprächsprotokoll, Nicht erschienen, Kontakt anlegen.
"""

import hashlib
import re
from datetime import timedelta

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, get_datetime, now_datetime

from ph_core.utils.naming import referenz as neue_referenz
from ph_crm.ph_crm.doctype.ph_termin_einstellungen.ph_termin_einstellungen import einstellungen
from ph_crm.ph_crm.doctype.ph_terminart.ph_terminart import MODUS_NACH_WEBSITE
from ph_crm.utils.workflow import status_setzen, vor_speichern_abgleichen
from ph_crm.utils.zeit import iso

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
AKTIV = ("Unbestaetigt", "Bestaetigt")
ENDZUSTAENDE = ("Erledigt", "Storniert", "Abgelehnt", "Nicht erschienen")


def hash_pruefen(gespeichert, geliefert):
    """Konstantzeit-Vergleich zweier Hashes (verify_hash / manage_hash)."""
    a = hashlib.sha256(str(gespeichert or "").encode()).digest()
    b = hashlib.sha256(str(geliefert or "").encode()).digest()
    return bool(gespeichert) and a == b


class PHTermin(Document):
    # ── Lebenszyklus ────────────────────────────────────────────────────────

    def before_insert(self):
        if not self.referenz:
            self.referenz = neue_referenz("PT")
            while frappe.db.exists("PH Termin", {"referenz": self.referenz}):
                self.referenz = neue_referenz("PT")
        if not self.status:
            self.status = "Unbestaetigt"
        self.link_version = self.link_version or 1
        self.sequence = self.sequence or 0
        self.zeitzone = self.zeitzone or einstellungen()["zeitzone"]

    def validate(self):
        art = frappe.get_cached_doc("PH Terminart", self.terminart) if self.terminart else None
        if art:
            if not self.modus:
                self.modus = art.modus or (art.modi()[0] if art.modi() else "Showroom")
            if not self.dauer_min:
                self.dauer_min = art.dauer_min
            if self.puffer_min is None or self.is_new():
                self.puffer_min = art.puffer_min or 0
                self.anfahrt_min = art.anfahrt_min or 0
            self.bestaetigung = art.bestaetigung
        self.dauer_min = int(self.dauer_min or 60)
        self.start = get_datetime(self.start)
        self.ende = self.start + timedelta(minutes=self.dauer_min)
        self.email = (self.email or "").strip().lower() or None
        if self.email and not EMAIL_RE.match(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if self.modus == "Vor Ort" and not (self.plz_ort and self.telefon):
            frappe.throw(_("Vor-Ort-Termine brauchen Telefon und PLZ/Ort."))
        if self.modus == "Video" and self.quelle == "website" and not self.einwilligung_video:
            frappe.throw(_("Videoberatung nur mit Einwilligung."))
        if self.einwilligung_video and not self.einwilligung_zeitpunkt:
            self.einwilligung_zeitpunkt = now_datetime()
        if self.anliegen and len(self.anliegen) > 1000:
            self.anliegen = self.anliegen[:1000]
        if self.status in ("Storniert", "Abgelehnt", "Nicht erschienen") and not self.storno_grund:
            self.storno_grund = _("ohne Angabe")
        if self.status == "Erledigt" and not self.erledigt_am:
            self.erledigt_am = now_datetime()
        if self.status == "Bestaetigt" and not self.bestaetigt_am:
            self.bestaetigt_am = now_datetime()
        self.titel = self.bilde_titel(art)
        vor_speichern_abgleichen(self)

    def bilde_titel(self, art=None):
        name = " ".join(x for x in (self.vorname, self.nachname) if x) or self.email or "–"
        wann = self.start.strftime("%d.%m. %H:%M") if self.start else ""
        titel = art.titel_de if art else (self.terminart or _("Termin"))
        return f"{wann} {titel} · {name}"[:140]

    def on_update(self):
        try:
            if self.status == "Bestaetigt" and not self.event and einstellungen()["event_anlegen"]:
                self.event_anlegen()
            elif self.status in ("Storniert", "Abgelehnt") and self.event:
                self.event_setzen(status="Cancelled")
            elif self.event and (self.has_value_changed("start") or self.has_value_changed("ende")):
                self.event_setzen(starts_on=self.start, ends_on=self.ende)
        except Exception:  # noqa: BLE001 – Kalender darf das Speichern nie verhindern
            frappe.log_error(title=f"PH Termin {self.name}: Event-Abgleich fehlgeschlagen")

    def on_trash(self):
        if self.status in ("Bestaetigt", "Erledigt"):
            frappe.throw(_("Bestätigte oder erledigte Termine werden storniert, nicht gelöscht."))

    # ── Kalender-Event ──────────────────────────────────────────────────────

    def event_anlegen(self):
        ev = frappe.get_doc(
            {
                "doctype": "Event",
                "subject": f"{frappe.db.get_value('PH Terminart', self.terminart, 'titel_de') or self.terminart} {self.referenz}",
                "starts_on": self.start,
                "ends_on": self.ende,
                "event_type": "Private",
                "event_category": "Meeting",
                "status": "Open",
                "description": _("Termin {0} ({1}) – Details im Backoffice.").format(self.referenz, self.modus),
                "event_participants": [{"reference_doctype": "PH Termin", "reference_docname": self.name}],
            }
        )
        ev.flags.ignore_permissions = True
        ev.insert()
        if self.berater and self.berater != ev.owner:
            frappe.db.set_value("Event", ev.name, "owner", self.berater, update_modified=False)
        self.db_set("event", ev.name, update_modified=False)
        return ev.name

    def event_setzen(self, **werte):
        if self.event and frappe.db.exists("Event", self.event):
            frappe.db.set_value("Event", self.event, werte, update_modified=False)

    # ── Mails (nur wenn kundenmail = backoffice; die Website schickt ihre eigenen) ──

    def mail_senden(self, vorlage, erzwingen=False):
        if not self.email or (self.kundenmail == "website" and not erzwingen) or not vorlage:
            return False
        if not frappe.db.exists("Email Template", vorlage):
            frappe.log_error(title=f"PH Termin: E-Mail-Vorlage {vorlage} fehlt")
            return False
        from ph_core.utils.mail import sende

        tpl = frappe.get_doc("Email Template", vorlage)
        kontext = {"doc": self, "terminart": frappe.get_cached_doc("PH Terminart", self.terminart)}
        sende(self.email, frappe.render_template(tpl.subject, kontext), frappe.render_template(tpl.response_html or tpl.response, kontext), referenz_doctype=self.doctype, referenz_name=self.name)
        return True

    # ── Antwortform der Website-API (src/lib/booking/adapters/frappe.js fromFrappe) ──

    def antwort(self, mit_email=True, **extra):
        return {
            "referenz": self.referenz,
            "terminart": self.terminart,
            "modus": MODUS_NACH_WEBSITE.get(self.modus, self.modus),
            "thema": self.thema or None,
            "start": iso(self.start),
            "ende": iso(self.ende),
            "status": self.status,
            "email_verifiziert": int(self.email_verifiziert or 0),
            "reserviert_bis": iso(self.reserviert_bis) if self.status == "Unbestaetigt" and not self.email_verifiziert else None,
            "link_version": int(self.link_version or 1),
            "sequence": int(self.sequence or 0),
            "sprache": self.sprache or "de",
            "vorname": self.vorname or "",
            "nachname": self.nachname or "",
            "email": self.email if mit_email else maskiere_email(self.email),
            "berater": self.berater,
            "meet_url": self.meet_url or None,
            **extra,
        }

    # ── Buttons / Server-Aktionen ───────────────────────────────────────────

    @frappe.whitelist()
    def bestaetigen(self, mail=1):
        self.check_permission("write")
        if self.status != "Unbestaetigt":
            frappe.throw(_("Nur unbestätigte Termine können bestätigt werden."))
        status_setzen(self, "Bestaetigt", _("Termin bestätigt"), bestaetigt_am=now_datetime(), email_verifiziert=1, reserviert_bis=None)
        self.reload()
        if einstellungen()["event_anlegen"] and not self.event:
            self.event_anlegen()
        if int(mail or 0):
            self.mail_senden(einstellungen()["vorlage_bestaetigung"])
        return self.status

    @frappe.whitelist()
    def absagen(self, grund=None, mail=1, abgelehnt=0):
        """Mitarbeiter sagt ab (Storniert) oder Leitung lehnt eine Anfrage ab (Abgelehnt)."""
        self.check_permission("write")
        if self.status not in AKTIV:
            frappe.throw(_("Termin ist bereits {0}.").format(_(self.status)))
        neu = "Abgelehnt" if int(abgelehnt or 0) else "Storniert"
        if neu == "Abgelehnt" and "PH CRM Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Ablehnen ist der Leitung vorbehalten."))
        status_setzen(self, neu, _("{0}: {1}").format(_(neu), grund or "–"), storno_grund=grund or _("durch Platzhirsch"), sequence=int(self.sequence or 0) + 1, meet_url=None)
        self.reload()
        self.event_setzen(status="Cancelled")
        if int(mail or 0):
            self.mail_senden(einstellungen()["vorlage_absage"])
        return neu

    @frappe.whitelist()
    def umbuchen(self, neuer_start, berater=None):
        """Dialog „Umbuchen“: neuen Slot atomar prüfen, Zeit ändern, Link-Version +1."""
        self.check_permission("write")
        from ph_crm.ph_crm.kalender import slot_pruefen, terminart_laden

        if self.status not in AKTIV:
            frappe.throw(_("Nur offene Termine können umgebucht werden."))
        start = get_datetime(neuer_start)
        art = terminart_laden(self.terminart, aktiv_pflicht=False)
        try:
            frei = slot_pruefen(art, self.modus, start, berater=berater or self.berater, ausser=self.name, for_update=True)
        except Exception as e:  # noqa: BLE001 – ApiFehler in Formularfehler übersetzen
            frappe.throw(_("Umbuchung nicht möglich: {0}").format(getattr(e, "meldung", str(e))))
        alt = self.start
        self.db_set(
            {
                "start": start,
                "ende": start + timedelta(minutes=self.dauer_min or art.dauer_min),
                "berater": frei or self.berater,
                "link_version": int(self.link_version or 1) + 1,
                "sequence": int(self.sequence or 0) + 1,
                "erinnerung_gesendet": None,
            }
        )
        self.reload()
        self.titel = self.bilde_titel(art)
        self.db_set("titel", self.titel, update_modified=False)
        self.event_setzen(starts_on=self.start, ends_on=self.ende)
        self.add_comment("Info", _("Umgebucht von {0} auf {1}").format(frappe.format(alt, {"fieldtype": "Datetime"}), frappe.format(self.start, {"fieldtype": "Datetime"})))
        if self.kundenmail == "backoffice":
            self.mail_senden(einstellungen()["vorlage_bestaetigung"])
        return self.antwort()

    @frappe.whitelist()
    def meet_link_erzeugen(self):
        self.check_permission("write")
        if self.modus != "Video":
            frappe.throw(_("Nur Videotermine haben einen Meet-Raum."))
        from ph_crm.ph_crm.tasks import meet_raum_anlegen

        url = meet_raum_anlegen(self.name)
        if not url:
            frappe.msgprint(_("Kein Meet-Raum erzeugt – Meet in PH Termin Einstellungen deaktiviert oder Meet-Site nicht erreichbar (Fehlerprotokoll)."))
        return url

    @frappe.whitelist()
    def erledigt_mit_protokoll(self, protokoll=1):
        """„Erledigt + Gesprächsprotokoll anlegen“: Status Erledigt, PH Beratungsgespraech vorbefüllt."""
        self.check_permission("write")
        if self.status != "Bestaetigt":
            frappe.throw(_("Nur bestätigte Termine können erledigt werden."))
        status_setzen(self, "Erledigt", _("Termin erledigt"), erledigt_am=now_datetime())
        self.event_setzen(status="Completed")
        if not int(protokoll or 0):
            return None
        if not self.kontakt:
            self.kontakt_anlegen()
        bg = frappe.get_doc(
            {
                "doctype": "PH Beratungsgespraech",
                "kontakt": self.kontakt,
                "termin": self.name,
                "datum": self.start.date() if self.start else None,
                "berater": self.berater or frappe.session.user,
                "status": "Offen",
            }
        ).insert()
        self.db_set("beratungsgespraech", bg.name, update_modified=False)
        return bg.name

    @frappe.whitelist()
    def nicht_erschienen(self, grund=None):
        self.check_permission("write")
        if self.status != "Bestaetigt":
            frappe.throw(_("Nur bestätigte Termine können als „Nicht erschienen“ markiert werden."))
        status_setzen(self, "Nicht erschienen", _("Kunde nicht erschienen"), storno_grund=grund or _("nicht erschienen"))
        self.event_setzen(status="Closed")
        return "Nicht erschienen"

    @frappe.whitelist()
    def kontakt_anlegen(self):
        self.check_permission("write")
        if self.kontakt:
            return self.kontakt
        from ph_crm.ph_crm.doctype.ph_kontakt.ph_kontakt import finde_oder_lege_an, plz_ort_teilen

        plz, ort = plz_ort_teilen(self.plz_ort)
        name = finde_oder_lege_an({"anrede": self.anrede, "vorname": self.vorname, "nachname": self.nachname, "email": self.email, "telefon": self.telefon, "plz": plz, "ort": ort, "sprache": self.sprache}, quelle=self.quelle if self.quelle in ("website", "agent", "telefon", "showroom", "email") else "showroom")
        self.db_set("kontakt", name, update_modified=False)
        if self.anfrage and not frappe.db.get_value("PH Anfrage", self.anfrage, "kontakt"):
            frappe.db.set_value("PH Anfrage", self.anfrage, "kontakt", name)
        return name


def maskiere_email(email):
    if not email or "@" not in email:
        return ""
    lokal, domain = email.split("@", 1)
    return f"{lokal[:1]}***@{domain}"


def termine_heute():
    heute = now_datetime().date()
    return frappe.db.count("PH Termin", {"start": ("between", [heute, heute]), "status": ("in", AKTIV)})


def erinnerung_faellig(stunden):
    """Bestätigte Termine, deren Start in `stunden` liegt und noch keine Erinnerung haben."""
    von = now_datetime()
    bis = add_to_date(von, hours=stunden)
    return frappe.get_all("PH Termin", filters={"status": "Bestaetigt", "erinnerung_gesendet": ("is", "not set"), "start": ("between", [von, bis]), "email": ("is", "set")}, pluck="name")
