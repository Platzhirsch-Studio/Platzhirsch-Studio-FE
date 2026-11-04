"""PH Newsletter Ausgabe – Blöcke prüfen (nur echter Inhalt, nur eigene Bilder), Versandbereitschaft, Versand mit Protokoll."""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_marketing.ph_marketing import newsletter
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils import regeln

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{1,40}$")


class PHNewsletterAusgabe(Document):
    def validate(self):
        self.slug = (self.slug or "").strip().lower()
        if not SLUG_RE.match(self.slug):
            frappe.throw(_("Kennung nur Kleinbuchstaben, Ziffern und Bindestrich (z. B. 2026-11)."))
        self.titel = f"Post aus Lochau · {self.slug}" if not self.nummer else f"Post aus Lochau Nr. {self.nummer} · {self.slug}"
        if self.zielgruppe == "Interesse" and not self.zielgruppe_interesse:
            frappe.throw(_("Zielgruppe „Interesse“ braucht ein Interesse."))
        for b in self.bloecke:
            if b.typ in regeln.SLOT_TYPEN and b.bild and b.bildquelle != "eigen":
                frappe.throw(_("Zeile {0}: Im Newsletter nur eigene Fotos (Design-Bibel §7). Bildquelle „eigen“ setzen oder Bild entfernen.").format(b.idx))
            if b.typ == "termine" and b.event and frappe.db.get_value("PH Event", b.event, "status") not in ("Offen", "Ausgebucht"):
                frappe.throw(_("Zeile {0}: Termine nur, wenn das Event veröffentlicht ist (Status Offen/Ausgebucht).").format(b.idx))
            b.sichtbar = int(regeln.block_sichtbar(b))
        self.versandbereit = int(regeln.versandbereit(self.bloecke))
        self.offene_slots = ", ".join(regeln.offene_slots(self.bloecke)) or None
        self.preheader = regeln.preheader(self.bloecke)
        if self.status in ("Geplant", "Wird versendet") and not self.versandbereit:
            frappe.throw(_("Nicht versandbereit: Brief, ein gefüllter Slot (Neue Stücke oder Skizze) und mindestens zwei Inhaltsblöcke nötig."))
        if self.status == "Geplant" and not self.versand_geplant:
            frappe.throw(_("Geplant braucht einen Versandzeitpunkt."))
        if self.status in ("Versendet", "Wird versendet") and self.get_doc_before_save() and self.get_doc_before_save().status in ("Versendet", "Wird versendet"):
            alt = self.get_doc_before_save()
            if alt.betreff != self.betreff or len(alt.bloecke) != len(self.bloecke):
                frappe.throw(_("Eine versendete Ausgabe wird nicht mehr geändert."))
        if self.has_value_changed("status") and self.status == "Geplant":
            self.freigegeben_von = frappe.session.user
            self.freigegeben_am = now_datetime()
            self.empfaenger_anzahl = len(newsletter.empfaenger_fuer(self))

    # ── Buttons (ph_newsletter_ausgabe.js) ────────────────────────────────
    @frappe.whitelist()
    def vorschau(self):
        self.check_permission("read")
        betreff, html = newsletter.ausgabe_html(self, abmelde_link="#abmelden", anrede="Guten Tag", einwilligung_datum="01.11.2026")
        return {"betreff": betreff, "html": html, "empfaenger": len(newsletter.empfaenger_fuer(self)) if self.zielgruppe != "Testadresse" else 1}

    @frappe.whitelist()
    def testmail(self, empfaenger=None):
        self.check_permission("write")
        from ph_marketing.ph_marketing import versand

        e = einstellungen()
        ziel = empfaenger or e["test_empfaenger"]
        if not ziel:
            frappe.throw(_("Keine Testadresse hinterlegt."))
        betreff, html = newsletter.ausgabe_html(self, abmelde_link=versand.website_url(e["abmelden_pfad"]), anrede="Guten Tag", einwilligung_datum="01.11.2026")
        versand.sende(ziel, f"[Testmail {self.slug}] {betreff}", html, referenz_doctype=self.doctype, referenz_name=self.name)
        self.add_comment("Info", _("Testmail an {0}").format(ziel))
        return ziel

    @frappe.whitelist()
    def jetzt_versenden(self):
        """Button „Jetzt versenden“ (Leitung): Status Geplant → sofort vorbereiten und ersten Stapel senden."""
        self.check_permission("write")
        if "PH Marketing Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Leitung löst den Versand aus."))
        if self.status not in ("Geplant", "Wird versendet"):
            frappe.throw(_("Nur geplante Ausgaben können versendet werden (Workflow: Freigeben → Planen)."))
        if not self.versandbereit:
            frappe.throw(_("Nicht versandbereit."))
        if self.status == "Geplant":
            newsletter.versand_vorbereiten(self)
            self.reload()
        n = newsletter.versand_stapel(self)
        self.add_comment("Info", _("Versand ausgelöst: {0} Mails in diesem Lauf").format(n))
        return n

    @frappe.whitelist()
    def abbrechen(self, grund=None):
        self.check_permission("write")
        if self.status == "Versendet":
            frappe.throw(_("Bereits versendet."))
        frappe.db.set_value("PH Newsletter Versand", {"ausgabe": self.name, "status": "geplant"}, {"status": "uebersprungen", "grund": "abgebrochen"})
        self.db_set({"status": "Abgebrochen", "workflow_state": "PH Abgebrochen", "abbruch_grund": (grund or "")[:140]})
        return "Abgebrochen"
