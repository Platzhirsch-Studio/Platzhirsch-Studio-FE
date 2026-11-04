"""PH Einwilligung – Consent-Protokoll. Einträge sind Nachweise: nach dem Anlegen nur Widerruf/Bestätigung über Methoden."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_marketing.ph_marketing import einwilligung as ew
from ph_marketing.utils.regeln import ZWECK_TEXT
from ph_marketing.utils.token import email_normalisieren, email_plausibel

GESCHUETZT = ("email", "zweck", "textversion", "zeitpunkt", "kanal", "quelle", "doi_bestaetigt_am")


class PHEinwilligung(Document):
    def before_insert(self):
        if not self.zeitpunkt:
            self.zeitpunkt = now_datetime()
        if not self.status:
            self.status = "Offen" if self.doi_noetig else "Bestaetigt"
        if self.status == "Bestaetigt" and not self.doi_bestaetigt_am:
            self.doi_bestaetigt_am = self.zeitpunkt
            self.doi_bestaetigt_kanal = self.doi_bestaetigt_kanal or self.kanal

    def validate(self):
        self.email = email_normalisieren(self.email)
        if not email_plausibel(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if self.kanal == "website" and self.is_new() and not self.doi_noetig and self.zweck in ("newsletter", "einladungen") and not self.flags.ignore_permissions:
            frappe.throw(_("Einwilligungen über die Website brauchen Double-Opt-in (Zweck {0}).").format(self.zweck))
        if self.widerrufen_am and self.status != "Widerrufen":
            self.status = "Widerrufen"
        self.titel = f"{ZWECK_TEXT.get(self.zweck, self.zweck)} · {self.email}"[:140]
        alt = self.get_doc_before_save()
        if alt and frappe.session.user != "Administrator":
            for feld in GESCHUETZT:
                if alt.get(feld) and alt.get(feld) != self.get(feld):
                    frappe.throw(_("Nachweisfeld {0} darf nachträglich nicht geändert werden.").format(_(self.meta.get_label(feld))))

    def on_trash(self):
        if self.status == "Bestaetigt" and not self.widerrufen_am and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Wirksame Einwilligungen werden nicht gelöscht, sondern widerrufen (Nachweis)."))

    # ── Buttons (ph_einwilligung.js) ───────────────────────────────────────
    @frappe.whitelist()
    def widerrufen(self, kanal="backoffice", grund=None):
        """Button „Widerruf erfassen“: alle wirksamen Einträge dieses Zwecks + Newsletter-Abo abmelden."""
        self.check_permission("write")
        n = ew.widerrufen(self.email, self.zweck, kanal=kanal, grund=grund)
        if self.zweck == "newsletter" and frappe.db.exists("PH Newsletter Abo", self.email):
            from ph_marketing.ph_marketing import newsletter

            abo = frappe.get_doc("PH Newsletter Abo", self.email)
            if abo.status != "Abgemeldet":
                newsletter.abmelden(abo, kanal=kanal, grund=grund)
        self.add_comment("Info", _("Widerruf erfasst ({0})").format(kanal))
        return n

    @frappe.whitelist()
    def bestaetigen_mit_beleg(self, beleg_hinweis=None):
        """Button „Bestätigung mit Beleg“ (z. B. Antwortmail, unterschriebenes Formular) – nur Leitung."""
        self.check_permission("write")
        if "PH Marketing Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Leitung darf eine Einwilligung ohne Link bestätigen."))
        ew.bestaetigen(self.name, kanal="backoffice")
        self.add_comment("Info", _("Bestätigt mit Beleg: {0}").format(beleg_hinweis or "–"))
        return "Bestaetigt"

    @frappe.whitelist()
    def nachweis(self):
        self.check_permission("read")
        return ew.nachweis(self.email)
