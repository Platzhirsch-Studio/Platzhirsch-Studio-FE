"""PH Aufmass – Aufmaß vor Ort (Räume, Maße, Anschlüsse, Skizze, Fotos).

Status über Methoden (kein Workflow): Entwurf → Erfasst (erfasst_melden) → Geprueft (pruefen).
Plausibilitätshinweise aus ph_projekte.utils.aufmass blockieren nicht, sie stehen im Feld `plausibilitaet`.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import privat_datei
from ph_projekte.utils.aufmass import flaeche_m2, plausibilitaet, raeume_fuer_projekt


class PHAufmass(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"
        if not self.aufgenommen_von:
            self.aufgenommen_von = frappe.session.user
        if not self.objekt_text and self.projekt:
            p = frappe.db.get_value("PH Projekt", self.projekt, ["objekt_strasse", "objekt_plz", "objekt_ort"], as_dict=True) or {}
            self.objekt_text = ", ".join(x for x in (p.get("objekt_strasse"), " ".join(y for y in (p.get("objekt_plz"), p.get("objekt_ort")) if y)) if x)

    def validate(self):
        for r in self.raeume:
            if not r.hoehe_mm and self.raumhoehe_standard_mm:
                r.hoehe_mm = self.raumhoehe_standard_mm
            r.flaeche_m2 = flaeche_m2(r.laenge_mm, r.breite_mm)
        hinweise = plausibilitaet([r.as_dict() for r in self.raeume], [m.as_dict() for m in self.masse], [a.as_dict() for a in self.anschluesse])
        self.plausibilitaet = "\n".join(hinweise) if hinweise else ""
        projekt_titel = frappe.db.get_value("PH Projekt", self.projekt, "titel") or self.projekt
        self.titel = f"Aufmaß {frappe.utils.formatdate(self.datum, 'dd.MM.yyyy') if self.datum else ''}: {projekt_titel}"[:140]
        if self.status == "Geprueft" and not self.raeume:
            frappe.throw(_("Ein geprüftes Aufmaß braucht mindestens einen Raum."))

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def erfasst_melden(self):
        self.check_permission("write")
        if not self.raeume:
            frappe.throw(_("Bitte mindestens einen Raum erfassen."))
        if self.status == "Entwurf":
            self.db_set("status", "Erfasst")
        return self.status

    @frappe.whitelist()
    def pruefen(self):
        """Prüfung durch Planer/Leitung (zweite Person empfohlen, nicht erzwungen)."""
        self.check_permission("write")
        if self.status not in ("Erfasst", "Entwurf"):
            frappe.throw(_("Das Aufmaß ist bereits geprüft."))
        if not self.raeume:
            frappe.throw(_("Ein geprüftes Aufmaß braucht mindestens einen Raum."))
        self.db_set({"status": "Geprueft", "geprueft_von": frappe.session.user, "geprueft_am": now_datetime()})
        self.add_comment("Info", _("Aufmaß geprüft") + (f" – {_('Hinweise')}: {self.plausibilitaet}" if self.plausibilitaet else ""))
        return self.status

    @frappe.whitelist()
    def zuruecksetzen(self):
        """Geprüft/Erfasst → Entwurf (Korrektur); nur Leitung."""
        self.check_permission("write")
        if not {"PH Projekte Leitung", "System Manager"} & set(frappe.get_roles()):
            frappe.throw(_("Zurücksetzen darf nur die Projekt-Leitung."))
        self.db_set({"status": "Entwurf", "geprueft_von": None, "geprueft_am": None})
        return self.status

    @frappe.whitelist()
    def skizze_hochladen(self, file_url, raum=None):
        """Mobil/Kiosk: hochgeladene Datei als Gesamtskizze oder als Skizze eines Raums setzen (privat)."""
        self.check_permission("write")
        if not privat_datei(file_url):
            frappe.throw(_("Datei nicht gefunden – bitte zuerst hochladen."))
        if raum:
            zeile = next((r for r in self.raeume if r.raum == raum), None)
            if not zeile:
                zeile = self.append("raeume", {"raum": raum})
            zeile.skizze = file_url
        else:
            self.skizze = file_url
        self.save()
        return file_url

    @frappe.whitelist()
    def raeume_ins_projekt(self):
        """Räume (mit Fläche) als PH Projekt Raum übernehmen; vorhandene Raumnamen bleiben unverändert."""
        self.check_permission("read")
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        projekt.check_permission("write")
        neu = raeume_fuer_projekt([r.as_dict() for r in self.raeume], [r.raum for r in projekt.raeume])
        for r in neu:
            projekt.append("raeume", {"raum": r["raum"], "flaeche_m2": r["flaeche_m2"], "status": "geplant", "notiz": _("aus Aufmaß {0}").format(self.name)})
        if neu:
            projekt.save()
        return len(neu)

    @frappe.whitelist()
    def planung_anlegen(self, bezeichnung=None, quelle_planung="CAD"):
        """Neue PH Planung mit Bezug auf dieses Aufmaß."""
        self.check_permission("read")
        doc = frappe.get_doc({"doctype": "PH Planung", "projekt": self.projekt, "aufmass": self.name, "bezeichnung": bezeichnung or _("Planung nach Aufmaß"), "quelle_planung": quelle_planung}).insert()
        return doc.name
