"""PH Social Beitrag – Claim-Guard: Freigabe nur mit eigenem oder schriftlich freigegebenem Herstellerbild.

Bildrechte (Pinterest-Konzept §9, src/components/Preview/pinterest/data.js): nur Ezarri (Vertragshändler), eigene Fotos,
Haralds Material. Keine Minotti-/Poliform-/Custom-Line-Bilder, keine KI-Räume. Die Freigabe-Referenz zeigt auf PH Marke
(ph_sortiment, nicht in required_apps) – deshalb Dynamic Link und Prüfung nur, wenn der DocType existiert.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

GESPERRTE_MARKEN = ("minotti", "poliform", "custom line", "custom-line", "navetta")


class PHSocialBeitrag(Document):
    def validate(self):
        self.titel = (self.titel or "").strip()
        if self.kanal == "Pinterest" and self.format in ("Reel", "Story"):
            frappe.throw(_("Pinterest kennt Pin, Board und Video."))
        if self.bild and self.bildquelle_freigabe == "offen" and self.status in ("Freigegeben", "Geplant", "Veroeffentlicht"):
            frappe.throw(_("Claim-Guard: Bildquelle ist „offen“. Freigabe nur mit eigenem oder schriftlich freigegebenem Herstellerbild."))
        if self.bildquelle_freigabe == "Hersteller freigegeben":
            marke = (self.marke_name or "").lower()
            if any(g in marke for g in GESPERRTE_MARKEN):
                frappe.throw(_("Für {0} gilt keine Bildfreigabe für Social Media (Pinterest-Konzept §9).").format(self.marke_name))
            if not self.bild_credit:
                frappe.throw(_("Herstellerbild braucht einen Bildnachweis (Credit)."))
        if self.status in ("Freigegeben", "Geplant", "Veroeffentlicht") and self.bild and not self.alt_text:
            frappe.throw(_("Alt-Text fehlt (Barrierefreiheit)."))
        if self.status == "Veroeffentlicht" and not self.veroeffentlicht_am:
            self.veroeffentlicht_am = now_datetime()
        if self.has_value_changed("status") and self.status == "Freigegeben":
            self.freigegeben_von = frappe.session.user
            self.freigegeben_am = now_datetime()

    def bild_freigabe_pruefen_intern(self):
        """→ (status_text, ok). Liest PH Marke.bildfreigabe_status, wenn ph_sortiment installiert ist."""
        if self.bildquelle_freigabe == "eigen":
            return "eigen (kein Herstellerbild)", True
        if not self.bildfreigabe_referenz:
            return "keine Marke verknüpft", False
        dt = self.bildfreigabe_doctype or "PH Marke"
        if not frappe.db.exists("DocType", dt):
            return f"{dt} nicht installiert (ph_sortiment)", False
        if not frappe.db.exists(dt, self.bildfreigabe_referenz):
            return "Marke nicht gefunden", False
        status = frappe.db.get_value(dt, self.bildfreigabe_referenz, "bildfreigabe_status") if frappe.db.has_column(dt, "bildfreigabe_status") else None
        return status or "unbekannt", status == "schriftlich erteilt"

    # ── Buttons (ph_social_beitrag.js) ───────────────────────────────────
    @frappe.whitelist()
    def bild_freigabe_pruefen(self):
        self.check_permission("write")
        status, ok = self.bild_freigabe_pruefen_intern()
        self.db_set({"bildfreigabe_status": status, "bildfreigabe_geprueft_am": now_datetime()}, update_modified=False)
        if ok and self.bildquelle_freigabe == "offen" and status == "schriftlich erteilt":
            self.db_set("bildquelle_freigabe", "Hersteller freigegeben", update_modified=False)
        return {"status": status, "ok": ok}

    @frappe.whitelist()
    def freigeben(self):
        """Button „Freigeben“ (Leitung) – Claim-Guard; setzt Status und Workflow-Zustand."""
        self.check_permission("write")
        if "PH Marketing Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Leitung gibt Beiträge frei."))
        if self.bildquelle_freigabe == "offen":
            frappe.throw(_("Bildquelle offen – keine Freigabe. Zuerst „Bild-Freigabe prüfen“ oder Bildquelle „eigen“ wählen."))
        if self.bildquelle_freigabe == "Hersteller freigegeben":
            status, ok = self.bild_freigabe_pruefen_intern()
            if not ok and frappe.db.exists("DocType", self.bildfreigabe_doctype or "PH Marke"):
                frappe.throw(_("PH Marke meldet Bildfreigabe „{0}“ – keine Freigabe.").format(status))
        if not self.bild:
            frappe.throw(_("Ohne Bild keine Freigabe."))
        if not self.alt_text:
            frappe.throw(_("Alt-Text fehlt (Barrierefreiheit)."))
        # db_set statt save(): Freigabe aus „Idee“ ist im Workflow kein Übergang, die Prüfungen oben ersetzen ihn.
        self.db_set({"status": "Freigegeben", "workflow_state": "PH Freigegeben", "freigegeben_von": frappe.session.user, "freigegeben_am": now_datetime()})
        self.add_comment("Info", _("Freigegeben (Claim-Guard geprüft: {0})").format(self.bildquelle_freigabe))
        return "Freigegeben"

    @frappe.whitelist()
    def als_veroeffentlicht(self, url=None):
        self.check_permission("write")
        if self.status not in ("Freigegeben", "Geplant"):
            frappe.throw(_("Nur freigegebene oder geplante Beiträge können veröffentlicht werden."))
        self.db_set({"status": "Veroeffentlicht", "workflow_state": "PH Veroeffentlicht", "veroeffentlicht_am": now_datetime(), "veroeffentlicht_url": (url or "")[:300] or None})
        return "Veroeffentlicht"

    @frappe.whitelist()
    def kennzahlen_erfassen(self, reichweite=0, likes=0, saves=0, klicks=0, kommentare=0):
        self.check_permission("write")
        self.db_set({"reichweite": reichweite, "likes": likes, "saves": saves, "klicks": klicks, "kommentare": kommentare, "kennzahlen_stand": frappe.utils.nowdate()})
        return "ok"
