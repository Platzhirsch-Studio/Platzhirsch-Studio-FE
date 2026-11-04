"""PH Rendering Feedback – Kommentar, Vorschlag, Markierung (Pin), Vote, Freigabe, Sprachnotiz."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import projekt_kontakt
from ph_projekte.utils.portal import FEEDBACK_ARTEN, TEXT_MAX, VOTES, pin_gueltig


class PHRenderingFeedback(Document):
    def before_insert(self):
        if not self.erstellt_am:
            self.erstellt_am = now_datetime()
        if not self.status:
            self.status = "Erledigt" if self.von == "studio" else "Offen"
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)

    def validate(self):
        if self.art not in FEEDBACK_ARTEN:
            frappe.throw(_("Unbekannte Art: {0}").format(self.art))
        if self.rendering and frappe.db.get_value("PH Rendering", self.rendering, "projekt") != self.projekt:
            frappe.throw(_("Das Rendering gehört nicht zu diesem Projekt."))
        if self.art in ("annotation", "vote", "freigabe") and not self.rendering:
            frappe.throw(_("{0} braucht ein Rendering.").format(self.art))
        self.text = (self.text or "").strip()
        if self.art in ("kommentar", "vorschlag", "annotation") and not self.text:
            frappe.throw(_("Bitte einen Text eingeben."))
        if TEXT_MAX.get(self.art) and len(self.text) > TEXT_MAX[self.art]:
            frappe.throw(_("Text zu lang (max. {0} Zeichen).").format(TEXT_MAX[self.art]))
        if self.art == "annotation" and not pin_gueltig(self.punkt_x, self.punkt_y):
            frappe.throw(_("Markierung muss zwischen 0 und 100 % liegen."))
        if self.art == "vote" and self.vote not in VOTES:
            frappe.throw(_("Bewertung muss up, down oder none sein."))
        if self.art == "freigabe" and not self.freigabe_bestaetigt:
            frappe.throw(_("Freigabe ohne Bestätigung ist ungültig."))
        if self.art == "sprachnachricht" and not self.audio:
            frappe.throw(_("Sprachnotiz ohne Audiodatei."))
        if self.antwort_auf and frappe.db.get_value("PH Rendering Feedback", self.antwort_auf, "projekt") != self.projekt:
            frappe.throw(_("Antwort bezieht sich auf ein anderes Projekt."))
        self.titel = self.bilde_titel()

    def bilde_titel(self):
        kurz = (self.text or "").replace("\n", " ")[:60]
        if self.art == "vote":
            kurz = {"up": "Daumen hoch", "down": "Daumen runter", "none": "Bewertung zurückgenommen"}.get(self.vote, "")
        elif self.art == "annotation" and self.punkt_x is not None:
            kurz = f"{round(self.punkt_x)} % / {round(self.punkt_y or 0)} %: {kurz}"
        elif self.art == "sprachnachricht":
            kurz = f"{round(self.audio_dauer_s or 0)} s"
        return f"{self.art} ({self.von}): {kurz}"[:140]

    def on_update(self):
        try:
            from ph_projekte.ph_projekte.doctype.ph_rendering.ph_rendering import kennzahlen_aktualisieren

            if self.rendering:
                kennzahlen_aktualisieren(self.rendering)
            if self.art == "freigabe" and self.von == "kunde" and self.rendering and self.has_value_changed("name"):
                frappe.db.set_value("PH Rendering", self.rendering, {"freigabe_feedback": self.name}, update_modified=False)
            if self.art == "vote" and self.has_value_changed("name") and self.von == "kunde":
                # Vote-Einträge sind automatisch erledigt (kein Antwortbedarf).
                self.db_set({"status": "Erledigt", "erledigt_am": now_datetime()}, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Rendering Feedback: Kennzahlen fehlgeschlagen")

    @frappe.whitelist()
    def erledigt(self):
        self.check_permission("write")
        self.db_set({"status": "Erledigt", "erledigt_am": now_datetime(), "erledigt_von": frappe.session.user, "gelesen_studio": 1})
        if self.rendering:
            from ph_projekte.ph_projekte.doctype.ph_rendering.ph_rendering import kennzahlen_aktualisieren

            kennzahlen_aktualisieren(self.rendering)
        return "Erledigt"

    @frappe.whitelist()
    def antworten(self, text):
        self.check_permission("write")
        text = (text or "").strip()
        if not text:
            frappe.throw(_("Bitte einen Text eingeben."))
        antwort = frappe.get_doc(
            {
                "doctype": "PH Rendering Feedback",
                "projekt": self.projekt,
                "rendering": self.rendering,
                "art": "kommentar",
                "von": "studio",
                "autor": frappe.db.get_value("User", frappe.session.user, "full_name") or "Platzhirsch",
                "text": text,
                "antwort_auf": self.name,
                "status": "Erledigt",
                "gelesen_studio": 1,
            }
        ).insert()
        self.db_set({"status": "Beantwortet", "beantwortet_am": now_datetime(), "gelesen_studio": 1})
        return antwort.name


def offene_anzahl():
    return frappe.db.count("PH Rendering Feedback", {"status": "Offen", "von": "kunde", "art": ("!=", "vote")})
