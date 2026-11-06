"""PH Kundenkarte Antrag – Website-/Showroom-Antrag mit Double-Opt-in.

Neu → (DOI) Bestaetigt → Annehmen (legt PH Kontakt an oder verknüpft per E-Mail, legt PH Kundenkarte an,
protokolliert Einwilligung in ph_marketing, falls installiert) / Ablehnen / Doppelt.
Status wird nur über Dokumentmethoden gesetzt (Annahme erzeugt Dokumente – deshalb kein Workflow-Übergang).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, cint, get_datetime, now_datetime

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen
from ph_kundenkarte.utils.antrag import email_normalisieren, email_plausibel, hash_token, token_gueltig

OFFEN = ("Neu", "Bestaetigt")
ZWECK_AUSWERTUNG = "kundenkarte_auswertung"  # Wunsch an ph_marketing: Zweck in PH Einwilligung ergänzen


class PHKundenkarteAntrag(Document):
    def before_insert(self):
        if not self.eingang:
            self.eingang = now_datetime()
        if not self.status:
            self.status = "Neu"
        einst = einstellungen()
        if self.quelle == "website" and einst["doi_pflicht"]:
            self.doi_noetig = 1
        else:
            # Showroom/Kassa: die Person ist anwesend, Unterschrift/Formular ist der Nachweis
            self.doi_noetig = 0
            if not self.bestaetigt_am:
                self.bestaetigt_am = now_datetime()
                self.bestaetigt_kanal = self.quelle or "backoffice"
                self.status = "Bestaetigt"
        if (self.einwilligung_auswertung or self.einwilligung_newsletter) and not self.einwilligung_zeitpunkt:
            self.einwilligung_zeitpunkt = now_datetime()

    def validate(self):
        self.email = email_normalisieren(self.email)
        if not email_plausibel(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        self.vorname = (self.vorname or "").strip()[:80]
        self.nachname = (self.nachname or "").strip()[:80]
        if not self.vertragsdaten_akzeptiert and self.quelle == "website":
            frappe.throw(_("Die Teilnahmebedingungen müssen akzeptiert sein."))
        if not self.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
            self.kontakt = frappe.db.get_value("PH Kontakt", {"email": self.email}, "name")
        self.titel = f"{self.vorname} {self.nachname} · {self.email} · {_(self.status)}"[:140]
        if self.geburtstag:
            from frappe.utils import getdate

            self.geburtstag_tag_monat = getdate(self.geburtstag).strftime("%m-%d")
        self._nachweis_privat()

    def _nachweis_privat(self):
        """Nachweis (Unterschrift/Formular-Scan) enthält Personendaten → als private Datei führen (Konzept §9.1)."""
        if not self.nachweis or not self.has_value_changed("nachweis"):
            return
        try:
            datei = frappe.db.get_value("File", {"file_url": self.nachweis}, ["name", "is_private"], as_dict=True)
            if datei and not cint(datei.is_private):
                f = frappe.get_doc("File", datei.name)
                f.is_private = 1
                f.flags.ignore_permissions = True
                f.save()
                self.nachweis = f.file_url
        except Exception:  # noqa: BLE001 – Speichern des Antrags nicht verhindern
            frappe.log_error(title="ph_kundenkarte: Nachweis privat setzen")

    # ── DOI ────────────────────────────────────────────────────────────────

    def doi_bestaetigen(self, kanal="website"):
        """Setzt Bestaetigt (Aufruf aus api.confirm_card_application); Rückgabe Status-Code für die Website."""
        if self.status == "Bestaetigt":
            return "bereits_bestaetigt"
        if self.status != "Neu":
            return "ungueltig"
        if not token_gueltig(get_datetime(self.doi_gesendet_am or self.eingang), einstellungen()["doi_gueltig_stunden"], now_datetime()):
            return "abgelaufen"
        self.db_set({"status": "Bestaetigt", "bestaetigt_am": now_datetime(), "bestaetigt_kanal": kanal, "titel": f"{self.vorname} {self.nachname} · {self.email} · {_('Bestaetigt')}"[:140]})
        self.add_comment("Info", _("Double-Opt-in bestätigt ({0})").format(kanal))
        return "bestaetigt"

    # ── Buttons (ph_kundenkarte_antrag.js) ────────────────────────────────

    @frappe.whitelist()
    def kontakt_suchen(self):
        """Button „Kontakt suchen“: Kandidaten per E-Mail oder Name+PLZ (ohne Änderung)."""
        self.check_permission("read")
        if not frappe.db.exists("DocType", "PH Kontakt"):
            return []
        treffer = frappe.get_all("PH Kontakt", filters={"email": self.email}, fields=["name", "titel", "email", "plz", "ort"], limit=5)
        if not treffer and self.nachname:
            filters = {"nachname": self.nachname}
            if self.vorname:
                filters["vorname"] = self.vorname
            treffer = frappe.get_all("PH Kontakt", filters=filters, fields=["name", "titel", "email", "plz", "ort"], limit=10)
        return [{"name": t.name, "titel": t.titel, "email": (t.email or "")[:1] + "***" if t.email else "", "plz": t.plz, "ort": t.ort} for t in treffer]

    @frappe.whitelist()
    def annehmen(self, kontakt=None, stufe=None, aktiv=False, sofort_aktiv=None):
        """Button „Annehmen“: Kontakt finden/anlegen, Karte anlegen, Einwilligungen protokollieren.
        aktiv=True nur aus api.confirm_card_application (automatische Annahme nach DOI): Karte sofort „Aktiv“.
        sofort_aktiv=0 (Showroom/Kassa): Karte „Beantragt“, aktiv erst bei physischer Übergabe
        (PH Kundenkarte.karte_uebergeben / api.hand_over_card; Konzept §9.2)."""
        if not self.flags.ignore_permissions:
            self.check_permission("write")
        if self.status not in OFFEN:
            frappe.throw(_("Antrag ist bereits entschieden ({0}).").format(_(self.status)))
        if self.status == "Neu" and self.doi_noetig:
            if "PH Kundenkarte Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
                frappe.throw(_("Ohne bestätigtes Double-Opt-in darf nur die Leitung annehmen."))
        if not frappe.db.exists("DocType", "PH Kontakt"):
            frappe.throw(_("PH Kontakt (ph_crm) ist nicht installiert."))
        kontakt = kontakt or self.kontakt or self._kontakt_anlegen_oder_finden()
        vorhanden = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt", "Beantragt"])}, "name")  # = kartenregeln.OFFENE_STATUS
        if vorhanden:
            return self.als_doppelt(vorhanden, kontakt=kontakt)
        karte = frappe.get_doc(
            {
                "doctype": "PH Kundenkarte",
                "kontakt": kontakt,
                "status": "Beantragt" if (sofort_aktiv is not None and not cint(sofort_aktiv) and not aktiv) else ("Aktiv" if (aktiv or self.quelle != "website") else "Beantragt"),
                "stufe": stufe or self.startstufe or einstellungen()["startstufe"],
                "kanal": self.quelle if self.quelle in ("website", "showroom", "kassa") else "showroom",
                "antrag": self.name,
                "geburtstag": self.geburtstag,
                "geburtstag_tag_monat": self.geburtstag_tag_monat,
                "einwilligung_auswertung": int(bool(self.einwilligung_auswertung)),
                "einwilligung_am": self.einwilligung_zeitpunkt if self.einwilligung_auswertung else None,
                "einwilligung_textversion": self.einwilligung_textversion,
                "quelle": "website" if self.quelle == "website" else "backoffice",
                "ip_hash": self.ip_hash,
            }
        )
        karte.flags.ignore_permissions = True
        karte.insert()
        einwilligung = self._einwilligungen_protokollieren(kontakt, karte.name)
        if einwilligung:
            karte.db_set("einwilligung", einwilligung, update_modified=False)
        self.db_set({"status": "Angenommen", "kontakt": kontakt, "kundenkarte": karte.name, "entschieden_am": now_datetime(), "entschieden_durch": frappe.session.user, "titel": f"{self.vorname} {self.nachname} · {self.email} · {_('Angenommen')}"[:140]})
        self.add_comment("Info", (_("Automatisch angenommen nach Double-Opt-in – Karte {0}") if aktiv else _("Angenommen – Karte {0}")).format(karte.name))
        return karte.name

    @frappe.whitelist()
    def ablehnen(self, grund=None):
        """Button „Ablehnen“ – mit Begründung (interne Dokumentation, kein Mailversand)."""
        self.check_permission("write")
        if self.status not in OFFEN:
            frappe.throw(_("Antrag ist bereits entschieden."))
        if not (grund or "").strip():
            frappe.throw(_("Bitte eine Begründung angeben."))
        self.db_set({"status": "Abgelehnt", "entscheidung_grund": grund[:500], "entschieden_am": now_datetime(), "entschieden_durch": frappe.session.user, "titel": f"{self.vorname} {self.nachname} · {self.email} · {_('Abgelehnt')}"[:140]})
        return "Abgelehnt"

    @frappe.whitelist()
    def als_doppelt(self, karte=None, kontakt=None):
        """Button „Doppelt“: es gibt bereits eine Karte für diese Person."""
        self.check_permission("write")
        if self.status not in OFFEN:
            frappe.throw(_("Antrag ist bereits entschieden."))
        kontakt = kontakt or self.kontakt or (frappe.db.get_value("PH Kontakt", {"email": self.email}, "name") if frappe.db.exists("DocType", "PH Kontakt") else None)
        if not karte and kontakt:
            karte = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt", "Beantragt"])}, "name")
        self.db_set({"status": "Doppelt", "doppelt_zu": karte, "kontakt": kontakt, "entscheidung_grund": _("Karte bereits vorhanden: {0}").format(karte or "–"), "entschieden_am": now_datetime(), "entschieden_durch": frappe.session.user, "titel": f"{self.vorname} {self.nachname} · {self.email} · {_('Doppelt')}"[:140]})
        return "Doppelt"

    # ── Helfer ──────────────────────────────────────────────────────────────

    def _kontakt_anlegen_oder_finden(self):
        from ph_crm.ph_crm.doctype.ph_kontakt.ph_kontakt import finde_oder_lege_an

        return finde_oder_lege_an(
            {"anrede": self.anrede, "vorname": self.vorname, "nachname": self.nachname, "email": self.email, "telefon": self.telefon, "plz": self.plz, "ort": self.ort, "sprache": self.sprache},
            quelle="website" if self.quelle == "website" else "showroom",
        )

    def _einwilligungen_protokollieren(self, kontakt, karte):
        """PH Einwilligung (ph_marketing) für Auswertung (ohne DOI – Nachweis ist der bestätigte Antrag) und
        Newsletter (eigener DOI über ph_marketing). Rückgabe: Name des Auswertungs-Nachweises oder None."""
        if not frappe.db.exists("DocType", "PH Einwilligung"):
            return None
        name = None
        try:
            from ph_marketing.ph_marketing import einwilligung as ew
            from ph_marketing.utils.regeln import ZWECKE

            kanal = "website" if self.quelle == "website" else ("showroom" if self.quelle in ("showroom", "kassa", "event") else "backoffice")
            # Zweck „kundenkarte_auswertung“ muss ph_marketing in PH Einwilligung.zweck/ZWECKE ergänzen
            # (ANFRAGEN-AN-CORE.md / README). Bis dahin ist der Nachweis der bestätigte Antrag + Kartenfelder.
            if self.einwilligung_auswertung and ZWECK_AUSWERTUNG in ZWECKE:
                e = ew.protokollieren(self.email, ZWECK_AUSWERTUNG, self.einwilligung_textversion or "kundenkarte-auswertung-v1", quelle="kundenkarte", kanal=kanal, sprache=self.sprache or "de", kontakt=kontakt, referenz=("PH Kundenkarte", karte), bestaetigt=True, bestaetigt_kanal="doi" if self.doi_noetig else kanal)
                name = e.name
            if self.einwilligung_newsletter:
                from ph_marketing.ph_marketing import newsletter

                newsletter.anmelden(self.email, sprache=self.sprache or "de", interessen=self.interessen, textversion=self.newsletter_textversion or "newsletter-kundenkarte-v1", quelle_detail="kundenkarte")
        except Exception:  # noqa: BLE001 – Marketing-Protokoll darf die Annahme nicht verhindern
            frappe.log_error(title="ph_kundenkarte: Einwilligung in ph_marketing")
        return name


def antrag_zu_token(token):
    """Antrag per DOI-Token (Hash) finden oder None."""
    h = hash_token(token)
    if not h:
        return None
    return frappe.db.get_value("PH Kundenkarte Antrag", {"doi_token_hash": h}, "name")


def offene_antraege_veralten(tage=30):
    """Scheduler-Hilfe: unbestätigte Website-Anträge nach `tage` Tagen als Abgelehnt (DOI abgelaufen) schließen."""
    grenze = add_to_date(now_datetime(), days=-int(tage))
    for name in frappe.get_all("PH Kundenkarte Antrag", filters={"status": "Neu", "doi_noetig": 1, "eingang": ("<", grenze)}, pluck="name"):
        frappe.db.set_value("PH Kundenkarte Antrag", name, {"status": "Abgelehnt", "entscheidung_grund": _("Double-Opt-in nicht bestätigt (automatisch nach {0} Tagen)").format(tage), "entschieden_am": now_datetime()}, update_modified=False)
