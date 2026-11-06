"""PH Fremdgewerk – Koordination eines Partnerbetriebs (Termin, Leistung) ohne Bauleitungs-Haftung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime

from ph_projekte.utils.montageplan import abhaengigkeit_konflikt, termine_spanne
from ph_projekte.utils.portal import gewerk_uebergang_erlaubt

ABNAHME = ("abgenommen", "mit Maengeln", "verweigert")


class PHFremdgewerk(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Offen"

    def validate(self):
        if self.termine:
            von, bis = termine_spanne([t.as_dict() for t in self.termine])
            if von:
                self.termin_von = von
            if bis:
                self.termin_bis = bis
        if self.termin_von and self.termin_bis and get_datetime(self.termin_bis) < get_datetime(self.termin_von):
            frappe.throw(_("Termin bis liegt vor Termin von."))
        if self.abhaengig_von == self.name:
            frappe.throw(_("Ein Gewerk kann nicht von sich selbst abhängen."))
        if self.partnerbetrieb and not self.partner_text and frappe.db.exists("DocType", "PH Lieferant"):
            self.partner_text = frappe.db.get_value("PH Lieferant", self.partnerbetrieb, "firmenname") or self.partnerbetrieb
        partner = self.partner_text or _("Partnerbetrieb (Name folgt)")
        self.titel = f"{self.gewerk}: {partner}"[:140]
        self.abhaengigkeit_hinweis = ""
        if self.abhaengig_von:
            v = frappe.db.get_value("PH Fremdgewerk", self.abhaengig_von, ["status", "termin_bis", "titel"], as_dict=True)
            hinweis = abhaengigkeit_konflikt(v.status, v.termin_bis, self.termin_von) if v else None
            if hinweis:
                self.abhaengigkeit_hinweis = f"{v.titel}: {_(hinweis)}"
                frappe.msgprint(self.abhaengigkeit_hinweis, title=_("Abhängigkeit prüfen"), indicator="orange")
        if not self.haftungshinweis:
            self.haftungshinweis = frappe.db.get_single_value("PH Projekte Einstellungen", "haftungshinweis_fremdgewerke")

    @frappe.whitelist()
    def status_setzen(self, status):
        """Button „Status setzen“ mit erlaubten Übergängen (reine Koordination)."""
        self.check_permission("write")
        if not gewerk_uebergang_erlaubt(self.status, status):
            frappe.throw(_("Übergang {0} → {1} ist nicht vorgesehen.").format(_(self.status), _(status)))
        if status == "Geplant" and not self.termin_von:
            frappe.throw(_("Bitte zuerst einen Termin eintragen."))
        self.db_set("status", status)
        self.add_comment("Info", _("Status {0}").format(_(status)))
        return status

    @frappe.whitelist()
    def termin_anlegen(self):
        """PH Termin (ph_crm) für die Koordination anlegen, wenn installiert."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Termin"):
            frappe.throw(_("DocType PH Termin ist noch nicht installiert (Arbeitspaket ph_crm)."))
        if not self.termin_von:
            frappe.throw(_("Bitte zuerst Termin von eintragen."))
        kontakt = frappe.db.get_value("PH Projekt", self.projekt, "kontakt")
        t = frappe.get_doc({"doctype": "PH Termin", "kontakt": kontakt, "start": self.termin_von, "ende": self.termin_bis, "modus": "Vor Ort", "thema": self.titel, "quelle": "backoffice", "status": "Bestaetigt"})
        t.flags.ignore_mandatory = True
        t.insert()
        self.db_set("termin", t.name)
        return t.name

    @frappe.whitelist()
    def termin_hinzufuegen(self, art, von, bis=None, notiz=None):
        self.check_permission("write")
        self.append("termine", {"art": art, "von": von, "bis": bis, "notiz": notiz, "status": "geplant"})
        if self.status in ("Offen", "Angefragt"):
            self.status = "Geplant" if gewerk_uebergang_erlaubt(self.status, "Geplant") else self.status
        self.save()
        return len(self.termine)

    @frappe.whitelist()
    def abnehmen(self, ergebnis, notiz=None, maengel=None):
        """Abnahme der Fremdleistung durch das Studio (Koordination, keine Bauleitung): abgenommen | mit Maengeln | verweigert.
        maengel = [{beschreibung, frist}] → Kindtabelle (verantwortlich = Fremdgewerk)."""
        self.check_permission("write")
        if ergebnis not in ABNAHME:
            frappe.throw(_("Unbekanntes Abnahmeergebnis."))
        maengel = frappe.parse_json(maengel) if maengel else []
        if ergebnis == "mit Maengeln" and not maengel and not self.maengel:
            frappe.throw(_("Bitte mindestens einen Mangel erfassen."))
        for m in maengel or []:
            if (m.get("beschreibung") or "").strip():
                self.append("maengel", {"beschreibung": m["beschreibung"][:140], "frist": m.get("frist"), "status": "offen", "verantwortlich": "Fremdgewerk", "verantwortlich_ref": self.name})
        self.abnahme_status = ergebnis
        self.abnahme_notiz = notiz
        self.abgenommen_am = now_datetime()
        self.abgenommen_von = frappe.session.user
        if ergebnis == "abgenommen" and self.status in ("Geplant", "In Arbeit"):  # Abnahme heißt: Leistung fertig
            self.status = "Erledigt"
        for t in self.termine:
            if t.art == "Abnahme" and t.status in ("geplant", "bestaetigt"):
                t.status = "erledigt"
        self.save()
        self.add_comment("Info", _("Abnahme: {0}").format(_(ergebnis)) + (f" – {notiz}" if notiz else ""))
        return self.abnahme_status
