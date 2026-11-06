"""PH Rendering – Visualisierung mit Kundenfeedback. Status setzt der Workflow „PH Rendering“
(Entwurf → Vorgelegt → Feedback offen → Freigegeben / Verworfen); Server-Methoden halten die
Kennzahlen (feedback_anzahl, votes) aktuell und bieten die Button-Ziele."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import portal_url


class PHRendering(Document):
    def before_insert(self):
        if not self.version:
            self.version = 1
        if not self.status:
            self.status = "Entwurf"

    def validate(self):
        self.titel = f"{self.bezeichnung} · Variante {self.variante or 'A'} V{self.version or 1}"[:140]
        if self.bild:
            self._bild_privat_halten()
        if self.status in ("Vorgelegt", "Feedback offen", "Freigegeben"):
            self.kunde_sichtbar = 1
            if not self.vorgelegt_am:
                self.vorgelegt_am = now_datetime()
        if self.status == "Freigegeben" and not self.freigegeben_am:
            self.freigegeben_am = now_datetime()
        if self.status == "Verworfen":
            self.kunde_sichtbar = 0

    def _bild_privat_halten(self):
        """Renderings sind Projektdaten des Kunden: öffentliche Uploads auf privat umstellen."""
        try:
            f = frappe.db.get_value("File", {"file_url": self.bild}, ["name", "is_private"], as_dict=True)
            if f and not f.is_private:
                datei = frappe.get_doc("File", f.name)
                datei.is_private = 1
                datei.save(ignore_permissions=True)
                self.bild = datei.file_url
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Rendering: Bild konnte nicht privat gestellt werden")

    def on_update(self):
        if self.has_value_changed("status") and self.status == "Freigegeben" and self.projekt:
            try:
                projekt = frappe.get_doc("PH Projekt", self.projekt)
                if projekt.ki_generiert_hinweis == 0 and self.ki_generiert:
                    projekt.db_set("ki_generiert_hinweis", 1, update_modified=False)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Rendering: Projekt-Hinweis fehlgeschlagen")

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def kunden_vorlegen(self, nachricht=None):
        """Sichtbar schalten + Nachricht im Portal (Mail über ph_core, wenn E-Mail bekannt)."""
        self.check_permission("write")
        if not self.bild:
            frappe.throw(_("Bitte zuerst ein Bild hochladen."))
        self.db_set({"kunde_sichtbar": 1, "vorgelegt_am": self.vorgelegt_am or now_datetime()})
        if self.status == "Entwurf":
            # status UND workflow_state, sonst bietet der Workflow weiter „Kunden vorlegen“ an (Konzept 10-projekte §Rendering)
            self.db_set({"status": "Vorgelegt", "workflow_state": "PH Vorgelegt"})
        kontakt = frappe.db.get_value("PH Projekt", self.projekt, "kontakt")
        text = (nachricht or "").strip() or _("Ein neues Rendering „{0}“ wartet im Kundenportal auf Ihre Rückmeldung.").format(self.bezeichnung)
        frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": kontakt, "projekt": self.projekt, "richtung": "ausgehend", "text": text}).insert(ignore_permissions=True)
        email = frappe.db.get_value("PH Kontakt", kontakt, "email") if frappe.db.exists("DocType", "PH Kontakt") else None
        if email:
            try:
                from ph_core.utils.mail import sende

                sende(email, _("Neues Rendering zu Ihrem Projekt"), f"<p>{frappe.utils.escape_html(text)}</p><p><a href=\"{portal_url('projekte/' + self.projekt)}\">{_('Zum Kundenportal')}</a></p>", referenz_doctype=self.doctype, referenz_name=self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Rendering: Mail fehlgeschlagen")
        return self.status

    @frappe.whitelist()
    def feedback_uebersicht(self):
        """Für die Vorschau mit Pins und die Feedback-Liste im Formular."""
        self.check_permission("read")
        eintraege = frappe.get_all(
            "PH Rendering Feedback",
            filters={"rendering": self.name},
            fields=["name", "art", "von", "autor", "text", "punkt_x", "punkt_y", "vote", "status", "erstellt_am", "audio", "audio_dauer_s", "antwort_auf"],
            order_by="erstellt_am asc",
        )
        return {"bild": self.bild, "eintraege": eintraege}

    @frappe.whitelist()
    def antworten(self, text, antwort_auf=None):
        """Studio-Antwort als Feedback-Eintrag (von=studio); markiert offene Kundeneinträge als beantwortet."""
        self.check_permission("write")
        text = (text or "").strip()
        if not text:
            frappe.throw(_("Bitte einen Text eingeben."))
        doc = frappe.get_doc(
            {
                "doctype": "PH Rendering Feedback",
                "projekt": self.projekt,
                "rendering": self.name,
                "art": "kommentar",
                "von": "studio",
                "autor": frappe.db.get_value("User", frappe.session.user, "full_name") or "Platzhirsch",
                "text": text,
                "antwort_auf": antwort_auf,
                "status": "Erledigt",
                "gelesen_studio": 1,
            }
        ).insert()
        if antwort_auf:
            frappe.db.set_value("PH Rendering Feedback", antwort_auf, {"status": "Beantwortet", "beantwortet_am": now_datetime()}, update_modified=False)
        kennzahlen_aktualisieren(self.name)
        return doc.name


def kennzahlen_aktualisieren(rendering):
    """Nach jedem Feedback: Anzahl, offene, letzte Rückmeldung, Votes (letzter Vote je Kunde zählt)."""
    if not rendering:
        return
    rows = frappe.get_all("PH Rendering Feedback", filters={"rendering": rendering}, fields=["art", "von", "status", "vote", "erstellt_am", "kontakt"], order_by="erstellt_am asc")
    kunden = [r for r in rows if r.von == "kunde"]
    letzte_votes = {}
    for r in kunden:
        if r.art == "vote":
            letzte_votes[r.kontakt or "kunde"] = r.vote
    werte = {
        "feedback_anzahl": len([r for r in kunden if r.art != "vote"]),
        "feedback_offen": len([r for r in kunden if r.status == "Offen" and r.art != "vote"]),
        "letztes_feedback_am": kunden[-1].erstellt_am if kunden else None,
        "votes_up": sum(1 for v in letzte_votes.values() if v == "up"),
        "votes_down": sum(1 for v in letzte_votes.values() if v == "down"),
    }
    frappe.db.set_value("PH Rendering", rendering, werte, update_modified=False)
    status = frappe.db.get_value("PH Rendering", rendering, "status")
    if status == "Vorgelegt" and werte["feedback_offen"]:
        frappe.db.set_value("PH Rendering", rendering, {"status": "Feedback offen", "workflow_state": "PH Feedback offen"}, update_modified=False)
