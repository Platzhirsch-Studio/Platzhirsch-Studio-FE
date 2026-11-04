"""PH Newsletter Abo – Status nur über Server-Methoden (newsletter.py), Buttons: DOI erneut senden, Abmelden, Auskunft."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_marketing.ph_marketing import einwilligung as ew
from ph_marketing.ph_marketing import newsletter
from ph_marketing.utils.token import email_normalisieren, email_plausibel


class PHNewsletterAbo(Document):
    def before_insert(self):
        if not self.angemeldet_am:
            self.angemeldet_am = now_datetime()
        if not self.status:
            self.status = "Angemeldet unbestaetigt"

    def validate(self):
        self.email = email_normalisieren(self.email)
        if not email_plausibel(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        self.titel = f"{self.email} · {_(self.status)}"[:140]
        alt = self.get_doc_before_save()
        # Status Aktiv nur mit DOI-Zeitpunkt oder Altbestand-Kennzeichen (nie per Hand „Aktiv“ setzen)
        if self.status == "Aktiv" and not self.doi_bestaetigt_am and not self.altbestand_ohne_doi:
            frappe.throw(_("Aktiv nur nach Double-Opt-in. Nutzen Sie „DOI erneut senden“ oder kennzeichnen Sie Altbestand."))
        if alt and alt.status != self.status and not self.flags.ignore_permissions and frappe.session.user != "Administrator":
            if not (alt.status == "Angemeldet unbestaetigt" and self.status == "Angemeldet unbestaetigt"):
                frappe.throw(_("Der Status wird nur über die Aktionen (Bestätigen per Link, Abmelden) gesetzt."))
        if self.kontakt is None and self.email and frappe.db.exists("DocType", "PH Kontakt"):
            self.kontakt = frappe.db.get_value("PH Kontakt", {"email": self.email}, "name")

    # ── Buttons (ph_newsletter_abo.js) ─────────────────────────────────────
    @frappe.whitelist()
    def doi_erneut_senden(self):
        self.check_permission("write")
        if self.status == "Aktiv":
            frappe.throw(_("Abo ist bereits bestätigt."))
        if self.status in ("Beschwerde",):
            frappe.throw(_("Nach einer Beschwerde wird keine Mail mehr gesendet."))
        newsletter.doi_erneut_senden(self)
        self.add_comment("Info", _("DOI-Mail erneut gesendet"))
        return "ok"

    @frappe.whitelist()
    def abmelden(self, grund=None, kanal="backoffice"):
        """Button „Abmelden (Protokoll)“: z. B. nach Antwort-Mail oder Anruf."""
        self.check_permission("write")
        if self.status == "Abgemeldet":
            return self.status
        newsletter.abmelden(self, kanal=kanal if kanal in ("backoffice", "antwort_mail") else "backoffice", grund=grund)
        return "Abgemeldet"

    @frappe.whitelist()
    def auskunft(self):
        """Button „Auskunft“: alle gespeicherten Daten dieser Adresse (Art. 15 DSGVO) als dict."""
        self.check_permission("read")
        return {
            "abo": {k: self.get(k) for k in ("email", "status", "sprache", "quelle", "quelle_detail", "angemeldet_am", "doi_bestaetigt_am", "abgemeldet_am", "abmelde_kanal", "textversion", "letzte_zustellung", "bounce_count")},
            "interessen": [r.interesse for r in self.interessen],
            "einwilligungen": ew.nachweis(self.email),
            "zustellungen": frappe.get_all("PH Newsletter Versand", filters={"email": self.email}, fields=["ausgabe", "status", "gesendet_am"], order_by="gesendet_am desc", limit=50),
            "reisen": frappe.get_all("PH Reise Versand", filters={"empfaenger": self.email}, fields=["reise", "status", "grundlage", "gesendet_am"], order_by="creation desc", limit=50),
        }

    @frappe.whitelist()
    def loeschen_dsgvo(self):
        """Button „Daten löschen“ (Leitung): Abo löschen; Einwilligungen bleiben als Nachweis mit Widerruf."""
        self.check_permission("delete")
        if self.status not in ("Abgemeldet", "Angemeldet unbestaetigt", "Bounce", "Beschwerde"):
            frappe.throw(_("Zuerst abmelden."))
        ew.widerrufen(self.email, "newsletter", kanal="backoffice", grund="Löschung auf Wunsch")
        frappe.db.delete("PH Newsletter Versand", {"abo": self.name})
        frappe.delete_doc("PH Newsletter Abo", self.name, ignore_permissions=True)
        return "geloescht"
