"""PH Referenz – Freigabe als öffentliches Referenzprojekt (Spec platzhirsch-frappe-service/tagebuch).

Statusregeln (Workflow „PH Referenz“ + Server-Methoden für Website und Buttons):
  Eingereicht → Veroeffentlicht (Leitung, Pflichtfelder, beispiel=0)
  Eingereicht → Abgelehnt (Mitarbeiter, Notiz)
  Veroeffentlicht → Eingereicht („Zurückziehen“)
  Eingereicht/Veroeffentlicht → Widerrufen (Kunde über API oder Studio mit Kanal) – löscht Bildkopien, endgültig.
Höchstens eine Referenz je Projekt in Eingereicht/Veroeffentlicht.
"""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import dateien_loeschen, iso
from ph_projekte.utils.portal import FREIGABE_ID_RE, REFERENZ_AKTIV, REFERENZ_PHASEN, ist_adresse, neue_freigabe_id, referenz_veroeffentlichbar


class PHReferenz(Document):
    def before_insert(self):
        if not self.freigabe_id:
            self.freigabe_id = neue_freigabe_id()
        if not self.eingereicht_am:
            self.eingereicht_am = now_datetime()
        if not self.status:
            self.status = "Eingereicht"
        self._verlauf_anhaengen("eingereicht", "kunde" if self.quelle == "website" else "studio")

    def validate(self):
        if not FREIGABE_ID_RE.match(self.freigabe_id or ""):
            frappe.throw(_("Freigabe-ID muss dem Muster fg-xxxxxxxxxx entsprechen."))
        if self.status in REFERENZ_AKTIV:
            andere = frappe.get_all("PH Referenz", filters={"projekt": self.projekt, "status": ("in", REFERENZ_AKTIV), "name": ("!=", self.name)}, pluck="name")
            if andere:
                frappe.throw(_("Für dieses Projekt gibt es schon eine aktive Freigabe ({0}).").format(andere[0]))
        if self.anzeige_art == "vorname_ort":
            if not self.anzeige_vorname or len(self.anzeige_vorname.split()) > 2:
                frappe.throw(_("Bitte nur den Vornamen angeben."))
            if not self.anzeige_ort or ist_adresse(self.anzeige_ort):
                frappe.throw(_("Bitte nur Gemeinde oder Region angeben, keine Straße und keine Postleitzahl."))
        if self.titel and ist_adresse(self.titel):
            frappe.throw(_("Der Titel darf keine Adresse enthalten."))
        if not self.bilder:
            frappe.throw(_("Mindestens ein Foto ist nötig."))
        if len(self.bilder) > 12:
            frappe.throw(_("Höchstens 12 Fotos je Freigabe."))
        for b in self.bilder:
            if b.foto and not b.phase:
                b.phase = frappe.db.get_value("PH Tagebuch Foto", b.foto, "phase")
            if b.phase and b.phase not in REFERENZ_PHASEN:
                frappe.throw(_("Handzeichnungen und Modellfotos werden nicht als Referenz veröffentlicht ({0}).").format(b.foto))
            if b.foto and frappe.db.get_value("PH Tagebuch Foto", b.foto, "projekt") != self.projekt:
                frappe.throw(_("Foto {0} gehört nicht zu diesem Projekt.").format(b.foto))
        vorher = self.get_doc_before_save()
        if vorher and vorher.status == "Widerrufen" and self.status != "Widerrufen":
            frappe.throw(_("Eine widerrufene Freigabe kann nicht wieder aktiviert werden."))
        if self.status == "Veroeffentlicht":
            fehlt = referenz_veroeffentlichbar(self._als_pruefdict())
            if fehlt:
                frappe.throw(_("Veröffentlichen nicht möglich, es fehlt/stimmt nicht: {0}").format(", ".join(fehlt)))
            if not self.geprueft_von:
                self.geprueft_von = frappe.session.user
                self.geprueft_am = now_datetime()
        if not self.titel:
            self.titel = f"Referenz {self.projekt}"
        if self.leistungen:
            try:
                json.loads(self.leistungen) if isinstance(self.leistungen, str) else None
            except ValueError:
                frappe.throw(_("Leistungen müssen eine JSON-Liste sein."))

    def _als_pruefdict(self):
        leistungen = self.leistungen
        if isinstance(leistungen, str):
            try:
                leistungen = json.loads(leistungen)
            except ValueError:
                leistungen = []
        loesung = self.loesung
        if isinstance(loesung, str):
            try:
                loesung = json.loads(loesung)
            except ValueError:
                loesung = []
        return {
            "beispiel": self.beispiel,
            "slug": self.slug,
            "titel": self.titel,
            "typologie": self.typologie,
            "zeitraum_von": self.zeitraum_von,
            "zeitraum_bis": self.zeitraum_bis,
            "ausgangslage": self.ausgangslage,
            "anzeige_ort": self.anzeige_ort if self.anzeige_art == "vorname_ort" else "",
            "loesung": loesung,
            "leistungen": leistungen,
            "bilder": [{"alt": b.alt, "phase": b.phase} for b in self.bilder],
        }

    def _verlauf_anhaengen(self, was, von):
        verlauf = self.verlauf
        if isinstance(verlauf, str):
            try:
                verlauf = json.loads(verlauf)
            except ValueError:
                verlauf = []
        verlauf = list(verlauf or [])
        verlauf.append({"am": iso(now_datetime()), "was": was, "von": von})
        self.verlauf = verlauf

    def on_update(self):
        if self.has_value_changed("status") and not self.is_new():
            try:
                self._verlauf_anhaengen(self.status.lower(), "studio")
                self.db_set("verlauf", json.dumps(self.verlauf), update_modified=False)
                if self.status == "Widerrufen":
                    bilddateien_loeschen(self)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Referenz: Verlauf/Widerruf-Nebenwirkung fehlgeschlagen")

    # ── Buttons / API ────────────────────────────────────────────────────────

    @frappe.whitelist()
    def veroeffentlichen(self):
        self.check_permission("write")
        if "PH Projekte Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Veröffentlichen darf nur die Leitung."))
        if self.status != "Eingereicht":
            frappe.throw(_("Nur eingereichte Freigaben können veröffentlicht werden."))
        self.status = "Veroeffentlicht"
        self.geprueft_von = frappe.session.user
        self.geprueft_am = now_datetime()
        self.save()
        return self.status

    @frappe.whitelist()
    def ablehnen(self, notiz=None):
        self.check_permission("write")
        if self.status != "Eingereicht":
            frappe.throw(_("Nur eingereichte Freigaben können abgelehnt werden."))
        self.status = "Abgelehnt"
        self.notiz = (notiz or "").strip()[:500] or self.notiz
        self.geprueft_von = frappe.session.user
        self.geprueft_am = now_datetime()
        self.save()
        return self.status

    @frappe.whitelist()
    def zurueckziehen(self, notiz=None):
        self.check_permission("write")
        if self.status != "Veroeffentlicht":
            frappe.throw(_("Nur veröffentlichte Referenzen können zurückgezogen werden."))
        self.status = "Eingereicht"
        self.notiz = (notiz or "").strip()[:500] or self.notiz
        self.save()
        return self.status

    @frappe.whitelist()
    def widerruf_erfassen(self, kanal="E-Mail"):
        """Widerruf des Kunden (Portal: Kanal „Kundenportal“; Studio: E-Mail/Telefon)."""
        self.check_permission("write")
        if self.status not in REFERENZ_AKTIV:
            frappe.throw(_("Diese Freigabe ist nicht aktiv."))
        self.status = "Widerrufen"
        self.widerruf_zeitpunkt = now_datetime()
        self.widerruf_kanal = (kanal or "E-Mail")[:40]
        self.flags.ignore_permissions = True
        self.save()
        return self.status


def bilddateien_loeschen(ref):
    """Widerruf: Kopien der Referenzbilder löschen, Nachweis (Datensatz) bleibt."""
    dateien_loeschen("PH Referenz", ref.name)
    for b in ref.bilder:
        if b.datei:
            frappe.db.set_value("PH Referenz Bild", b.name, "datei", None, update_modified=False)
