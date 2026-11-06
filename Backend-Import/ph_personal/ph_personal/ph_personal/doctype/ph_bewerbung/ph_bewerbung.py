"""PH Bewerbung – Controller.

Datenschutz:
  - Unterlagen immer private Dateien (validate erzwingt is_private).
  - Löschfrist = max(Entscheidung, Zugang der Absage – absage_versand_am) + Monate aus PH Personal Einstellungen
    (mind. 6, Standard 7: GlBG § 15 Abs 1 Frist ab Ablehnung + Puffer); mit Einwilligung zur Evidenzhaltung bis
    einwilligung_evidenz_bis (utils/datenschutz.loeschfrist_bewerbung).
  - unterlagen_entfernen() löscht Dateien, Anschreiben, Versionen und Kommunikation und pseudonymisiert
    die Person (Scheduler: ph_personal.ph_personal.tasks.loeschfristen_ausfuehren, Button „Unterlagen jetzt löschen“).
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, date_diff, getdate, now_datetime, nowdate

from ph_personal.logik import BEWERBUNG_ENDE
from ph_personal.utils.datenschutz import loeschfrist_bewerbung

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
OFFEN = ("Eingegangen", "Gesichtet", "Gespraech", "Angebot")
ZEITSTEMPEL = {"Gesichtet": "gesichtet_am", "Gespraech": "gespraech_am", "Angebot": "angebot_am"}
WORKFLOW_STATE = {
    "Eingegangen": "PH Eingegangen", "Gesichtet": "PH Gesichtet", "Gespraech": "PH Gespraech", "Angebot": "PH Angebot",
    "Eingestellt": "PH Eingestellt", "Abgesagt": "PH Abgesagt", "Zurueckgezogen": "PH Zurueckgezogen",
}


class PHBewerbung(Document):
    def before_insert(self):
        if not self.eingang:
            self.eingang = now_datetime()
        if not self.status:
            self.status = "Eingegangen"
        if self.einwilligung_datenschutz and not self.einwilligung_zeitpunkt:
            self.einwilligung_zeitpunkt = now_datetime()

    def validate(self):
        self.email = (self.email or "").strip().lower() or None
        if self.email and not EMAIL_RE.match(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if not self.pseudonymisiert and not self.email and not self.telefon:
            frappe.throw(_("Mindestens E-Mail oder Telefon ist nötig."))
        self.vorname = (self.vorname or "").strip()
        self.nachname = (self.nachname or "").strip()
        self.initiativ = int(not self.stelle)
        self.titel = self.bilde_titel()
        if self.quelle not in (None, "", "Website") and not self.datenschutzinfo_am and not self.pseudonymisiert and self.flags.in_insert:
            frappe.msgprint(_("Bitte die Datenschutzinformation (Art. 13/14 DSGVO) übermitteln und unter „Datenschutz“ erfassen."), indicator="orange", alert=True)
        if self.einwilligung_datenschutz and not self.datenschutzinfo_am:
            self.datenschutzinfo_am = self.einwilligung_zeitpunkt or now_datetime()
            self.datenschutzinfo_art = self.datenschutzinfo_art or "Website-Formular"
        self._unterlagen_privat()
        self._verlauf()
        self._loeschfrist()

    def bilde_titel(self):
        person = " ".join(x for x in (self.vorname, self.nachname) if x) or _("ohne Namen")
        ziel = self.stelle_titel or (frappe.db.get_value("PH Stelle", self.stelle, "titel") if self.stelle else None) or _("Initiativ")
        return f"{person} – {ziel}"[:140]

    def _unterlagen_privat(self):
        for zeile in self.unterlagen or []:
            if not zeile.datei:
                continue
            if not zeile.hochgeladen_am:
                zeile.hochgeladen_am = now_datetime()
            if zeile.datei.startswith("/files/"):
                datei = frappe.db.get_value("File", {"file_url": zeile.datei}, "name")
                if datei:
                    fd = frappe.get_doc("File", datei)
                    fd.is_private = 1
                    fd.attached_to_doctype = self.doctype
                    fd.attached_to_name = self.name
                    fd.save(ignore_permissions=True)
                    zeile.datei = fd.file_url
            if not zeile.groesse_kb:
                groesse = frappe.db.get_value("File", {"file_url": zeile.datei}, "file_size")
                zeile.groesse_kb = int((groesse or 0) / 1024)
            if not zeile.bezeichnung:
                zeile.bezeichnung = zeile.datei.rsplit("/", 1)[-1][:140]

    def _verlauf(self):
        alt = self.get_doc_before_save()
        status_alt = alt.status if alt else None
        if self.status == status_alt and alt is not None:
            return
        jetzt = now_datetime()
        feld = ZEITSTEMPEL.get(self.status)
        if feld and not self.get(feld):
            self.set(feld, jetzt)
        if self.status in BEWERBUNG_ENDE:
            if not self.entschieden_am:
                self.entschieden_am = jetzt
            self.durchlauf_tage = max(0, date_diff(getdate(self.entschieden_am), getdate(self.eingang)))
            if self.status in ("Abgesagt", "Zurueckgezogen") and not self.absage_grund:
                self.absage_grund = "Zurückgezogen" if self.status == "Zurueckgezogen" else "Sonstiges"
        elif status_alt in BEWERBUNG_ENDE:
            # Rückwärts (Leitung): Entscheidung und Frist zurücknehmen
            self.entschieden_am = None
            self.durchlauf_tage = 0
            self.loeschfrist = None

    def _loeschfrist(self):
        if self.status == "Eingestellt":
            self.loeschfrist = None  # wird Personalakt (PH Mitarbeiter)
            return
        if self.einwilligung_evidenz:
            if not self.einwilligung_evidenz_bis:
                frappe.throw(_("Bitte „Evidenz bis“ angeben."))
            if getdate(self.einwilligung_evidenz_bis) < getdate(nowdate()):
                frappe.throw(_("„Evidenz bis“ liegt in der Vergangenheit."))
            self.loeschfrist = self.einwilligung_evidenz_bis
            return
        if self.status in ("Abgesagt", "Zurueckgezogen") and self.entschieden_am:
            from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

            self.loeschfrist = loeschfrist_bewerbung(
                getdate(self.entschieden_am), getdate(self.absage_versand_am) if self.absage_versand_am else None, einstellungen()["loeschfrist_monate"]
            )

    def on_update(self):
        if self.zugewiesen_an and self.has_value_changed("zugewiesen_an"):
            try:
                from frappe.desk.form.assign_to import add, clear

                clear(self.doctype, self.name)
                add({"assign_to": [self.zugewiesen_an], "doctype": self.doctype, "name": self.name, "description": self.titel})
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Bewerbung: Zuweisung fehlgeschlagen")

    def on_trash(self):
        for f in frappe.get_all("File", {"attached_to_doctype": self.doctype, "attached_to_name": self.name}, pluck="name"):
            frappe.delete_doc("File", f, ignore_permissions=True, force=True)

    # ── Status direkt setzen (Buttons; der Workflow bleibt der Normalweg) ───

    def _status_setzen(self, status, kommentar=None):
        self.status = status
        self.workflow_state = WORKFLOW_STATE.get(status)
        self.save()
        if kommentar:
            self.add_comment("Info", kommentar)

    # ── Buttons (ph_bewerbung.js) ───────────────────────────────────────────

    @frappe.whitelist()
    def gespraech_anlegen(self, start, dauer_min=60, modus="Vor Ort", ort=None, verantwortlich=None):
        """Button „Gesprächstermin“: PH Bewerbungsgespraech anlegen, Status → Gespraech."""
        self.check_permission("write")
        if self.status in BEWERBUNG_ENDE:
            frappe.throw(_("Die Bewerbung ist bereits abgeschlossen."))
        g = frappe.get_doc(
            {
                "doctype": "PH Bewerbungsgespraech",
                "bewerbung": self.name,
                "start": start,
                "dauer_min": cint(dauer_min) or 60,
                "modus": modus,
                "ort": ort,
                "verantwortlich": verantwortlich or self.zugewiesen_an or frappe.session.user,
            }
        ).insert()
        if self.status in ("Eingegangen", "Gesichtet"):
            self._status_setzen("Gespraech", _("Gespräch {0} vereinbart").format(g.name))
        return g.name

    @frappe.whitelist()
    def absage_senden(self, grund="Anderer Kandidat", per_mail=1):
        """Button „Absage senden“: Status Abgesagt, Löschfrist setzen, Mail (Vorlage aus Einstellungen) senden."""
        self.check_permission("write")
        if self.status == "Eingestellt":
            frappe.throw(_("Eingestellte Bewerbungen können nicht abgesagt werden."))
        self.absage_grund = grund or "Sonstiges"
        self._status_setzen("Abgesagt")
        if cint(per_mail) and self.email:
            from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

            html = self._brief_html(einstellungen()["absage_text"], _("Ihre Bewerbung bei Platzhirsch"))
            try:
                from ph_core.utils.mail import sende

                sende(self.email, _("Ihre Bewerbung bei Platzhirsch – {0}").format(self.stelle_titel or _("Initiativbewerbung")), html, referenz_doctype=self.doctype, referenz_name=self.name)
                jetzt = now_datetime()
                self.db_set({"absage_gesendet_am": jetzt, "absage_versand": "E-Mail", "absage_versand_am": jetzt})
                self.reload()
                self.save(ignore_permissions=True)  # Löschfrist ab Zugang neu berechnen
                self.add_comment("Info", _("Absage per E-Mail gesendet"))
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Bewerbung: Absage-Mail fehlgeschlagen")
                frappe.msgprint(_("Status gesetzt, aber die E-Mail konnte nicht gesendet werden (siehe Fehlerprotokoll)."), indicator="orange")
        return self.status

    @frappe.whitelist()
    def einstellen(self, eintritt, rolle_intern="Verkauf", stelle_schliessen=0, beschaeftigungsart=None, wochenstunden=None,
                   urlaubsanspruch_tage=None, user=None, arbeitszeit=None):
        """Button „Einstellen“ (Leitung): PH Mitarbeiter anlegen und Status Eingestellt in **einer** Transaktion
        (Fachkritik P2 – vorher konnte ein zweiter Mitarbeiter entstehen). arbeitszeit = dict mo_min … so_min
        (optional, Gültigkeit ab Eintritt)."""
        self.check_permission("write")
        if self.mitarbeiter:
            return self.mitarbeiter
        if self.status not in ("Gespraech", "Angebot"):
            frappe.throw(_("Einstellen ist erst nach Gespräch oder Angebot möglich."))
        daten = {
            "doctype": "PH Mitarbeiter",
            "vorname": self.vorname,
            "nachname": self.nachname,
            "rolle_intern": rolle_intern,
            "eintritt": eintritt,
            "email_dienst": None,
            "telefon_dienst": None,
            "bewerbung": self.name,
            "status": "Aktiv",
        }
        if beschaeftigungsart:
            daten["beschaeftigungsart"] = beschaeftigungsart
        if wochenstunden not in (None, ""):
            daten["wochenstunden"] = float(wochenstunden)
        if urlaubsanspruch_tage not in (None, ""):
            daten["urlaubsanspruch_tage"] = cint(urlaubsanspruch_tage)
        if user:
            daten["user"] = user
        if arbeitszeit:
            if isinstance(arbeitszeit, str):
                arbeitszeit = frappe.parse_json(arbeitszeit)
            daten["arbeitszeiten"] = [{**arbeitszeit, "gueltig_ab": eintritt}]
        savepoint = "ph_einstellen"
        frappe.db.savepoint(savepoint)
        try:
            ma = frappe.get_doc(daten).insert()
            self.mitarbeiter = ma.name
            self.zusage_gesendet_am = self.zusage_gesendet_am or now_datetime()
            self._status_setzen("Eingestellt", _("Eingestellt – Mitarbeiter {0}").format(ma.name))
        except Exception:
            frappe.db.rollback(save_point=savepoint)
            self.mitarbeiter = None
            raise
        if cint(stelle_schliessen) and self.stelle:
            frappe.get_doc("PH Stelle", self.stelle).als_besetzt(self.name)
        return ma.name

    @frappe.whitelist()
    def nichtantritt(self, grund=None):
        """Button „Nicht angetreten“ (Leitung): Zusage zurückgenommen bzw. Person tritt nicht an – Mitarbeiter wird
        Ausgetreten (Austritt = Eintritt), Bewerbung Zurueckgezogen mit Löschfrist. ÖGK-Anmeldung stornieren (Hinweis)."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung."), frappe.PermissionError)
        if self.status != "Eingestellt":
            frappe.throw(_("Nur für eingestellte Bewerbungen."))
        if self.mitarbeiter:
            ma = frappe.get_doc("PH Mitarbeiter", self.mitarbeiter)
            if ma.eintritt and getdate(ma.eintritt) < getdate(nowdate()) and frappe.db.count("PH Zeiterfassung", {"mitarbeiter": ma.name}):
                frappe.throw(_("Die Person hat bereits gearbeitet – Austritt über den Mitarbeiter erfassen."))
            ma.austritt = ma.eintritt or nowdate()
            ma.status = "Ausgetreten"
            ma.save()
        self.absage_grund = "Zurückgezogen"
        self._status_setzen("Zurueckgezogen", _("Nicht angetreten{0}").format(f": {grund}" if grund else ""))
        frappe.msgprint(_("Falls bereits erfolgt: ÖGK-Anmeldung stornieren."), indicator="orange")
        return self.status

    @frappe.whitelist()
    def absage_dokumentieren(self, versand, am=None):
        """Button „Absage dokumentieren“: Übermittlung per Post/Telefon/persönlich festhalten – startet die
        Löschfrist ab Zugang (§ 15 Abs 1 GlBG)."""
        self.check_permission("write")
        if versand not in ("E-Mail", "Post", "Telefon", "Persönlich"):
            frappe.throw(_("Unbekannter Versandweg."))
        if self.status not in ("Abgesagt",):
            frappe.throw(_("Nur für abgesagte Bewerbungen."))
        self.absage_versand = versand
        self.absage_versand_am = am or now_datetime()
        self.save()
        return self.loeschfrist

    @frappe.whitelist()
    def eingang_bestaetigen(self, per_mail=1):
        """Button „Eingang bestätigen“: Eingangsbestätigung mit Datenschutzinformation (Art. 13/14 DSGVO)."""
        self.check_permission("write")
        if self.eingang_bestaetigt_am:
            return self.eingang_bestaetigt_am
        if cint(per_mail) and self.email:
            text = _("<p>vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten und melden uns, sobald wir sie gesichtet haben.</p><p>Informationen zur Verarbeitung Ihrer Daten finden Sie unter https://platzhirsch.studio/datenschutz (Abschnitt Bewerbungen). Ihre Unterlagen löschen wir spätestens sieben Monate nach Abschluss des Verfahrens, sofern Sie keiner längeren Aufbewahrung zustimmen.</p>")
            try:
                from ph_core.utils.mail import sende

                sende(self.email, _("Ihre Bewerbung bei Platzhirsch – Eingangsbestätigung"), self._brief_html(text, ""), referenz_doctype=self.doctype, referenz_name=self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Bewerbung: Eingangsbestätigung fehlgeschlagen")
                frappe.throw(_("Die E-Mail konnte nicht gesendet werden (siehe Fehlerprotokoll)."))
        jetzt = now_datetime()
        self.eingang_bestaetigt_am = jetzt
        if not self.datenschutzinfo_am:
            self.datenschutzinfo_am = jetzt
            self.datenschutzinfo_art = "E-Mail" if cint(per_mail) and self.email else "Post"
        self.save()
        return jetzt

    @frappe.whitelist()
    def unterlagen_loeschen(self):
        """Button „Unterlagen jetzt löschen“ (Leitung): sofortige Löschung und Pseudonymisierung."""
        self.check_permission("delete")
        if self.status in OFFEN:
            frappe.throw(_("Offene Bewerbungen zuerst abschließen (Absage oder Rückzug)."))
        unterlagen_entfernen(self, grund=_("manuell durch {0}").format(frappe.session.user))
        return True

    @frappe.whitelist()
    def evidenz_verlaengern(self, bis):
        """Button „Evidenz bis …“ (nur mit Einwilligung der Person)."""
        self.check_permission("write")
        self.einwilligung_evidenz = 1
        self.einwilligung_evidenz_bis = bis
        self.save()
        self.add_comment("Info", _("Einwilligung zur Evidenzhaltung bis {0} erfasst").format(frappe.format(getdate(bis), {"fieldtype": "Date"})))
        return self.loeschfrist

    def _brief_html(self, text, titel):
        anrede = _("Sehr geehrte Frau {0},").format(self.nachname) if self.anrede == "Frau" else _("Sehr geehrter Herr {0},").format(self.nachname) if self.anrede == "Herr" else _("Guten Tag {0} {1},").format(self.vorname, self.nachname)
        return f"<p>{frappe.utils.escape_html(anrede)}</p>{text}<p>{_('Mit freundlichen Grüßen')}<br>Platzhirsch Home Living</p>"


def unterlagen_entfernen(doc, grund=""):
    """Löscht Unterlagen, Anschreiben, Versionen, Kommunikation; pseudonymisiert Person. Idempotent."""
    for f in frappe.get_all("File", {"attached_to_doctype": "PH Bewerbung", "attached_to_name": doc.name}, pluck="name"):
        frappe.delete_doc("File", f, ignore_permissions=True, force=True, delete_permanently=True)
    frappe.db.delete("Version", {"ref_doctype": "PH Bewerbung", "docname": doc.name})
    frappe.db.delete("Communication", {"reference_doctype": "PH Bewerbung", "reference_name": doc.name})
    frappe.db.delete("Comment", {"reference_doctype": "PH Bewerbung", "reference_name": doc.name, "comment_type": ("in", ["Comment", "Attachment", "Edit"])})
    frappe.db.delete("PH Bewerbung Unterlage", {"parent": doc.name, "parenttype": "PH Bewerbung"})
    # Fachkritik P3/F16: Gespräche, Kalender-Events, Zuweisungen, Mail-Warteschlange
    for g in frappe.get_all("PH Bewerbungsgespraech", {"bewerbung": doc.name}, ["name", "kalender_event"]):
        if g.kalender_event and frappe.db.exists("Event", g.kalender_event):
            frappe.delete_doc("Event", g.kalender_event, ignore_permissions=True, force=True)
        frappe.db.delete("Version", {"ref_doctype": "PH Bewerbungsgespraech", "docname": g.name})
        frappe.db.delete("Comment", {"reference_doctype": "PH Bewerbungsgespraech", "reference_name": g.name})
        frappe.db.set_value(
            "PH Bewerbungsgespraech", g.name,
            {"bewerber": _("Gelöscht"), "bewertung": 0, "notiz": None, "weitere_teilnehmer": None, "ort": None, "kalender_event": None, "naechster_schritt": None, "titel": _("Gelöscht")},
            update_modified=False,
        )
    for referenz in [("PH Bewerbung", doc.name)] + [("PH Bewerbungsgespraech", g) for g in frappe.get_all("PH Bewerbungsgespraech", {"bewerbung": doc.name}, pluck="name")]:
        frappe.db.delete("ToDo", {"reference_type": referenz[0], "reference_name": referenz[1]})
        for q in frappe.get_all("Email Queue", {"reference_doctype": referenz[0], "reference_name": referenz[1]}, pluck="name"):
            frappe.db.delete("Email Queue Recipient", {"parent": q})
            frappe.db.delete("Email Queue", {"name": q})
    werte = {
        "anschreiben": None,
        "vorname": "",
        "nachname": _("Gelöscht"),
        "email": None,
        "telefon": None,
        "plz_ort": None,
        "anrede": None,
        "verfuegbar_ab": None,
        "eindruck": None,
        "notiz_intern": None,
        "gehaltsvorstellung_cent": 0,
        "gehaltsvorstellung": None,
        "herkunft": None,
        "ip_hash": None,
        "referenz_website": None,
        "idempotency_key": None,
        "angebot_brutto_cent": 0,
        "unterlagen_geloescht_am": now_datetime(),
        "pseudonymisiert": 1,
        "titel": f"{_('Gelöscht')} – {doc.stelle_titel or _('Initiativ')}",
    }
    frappe.db.set_value("PH Bewerbung", doc.name, werte, update_modified=True)
    frappe.get_doc("PH Bewerbung", doc.name).add_comment("Info", _("Unterlagen gelöscht und pseudonymisiert ({0})").format(grund or _("Löschfrist")))


def offene_anzahl():
    return frappe.db.count("PH Bewerbung", {"status": ("in", OFFEN)})
