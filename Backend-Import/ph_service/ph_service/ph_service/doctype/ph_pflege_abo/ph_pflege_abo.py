"""PH Pflege Abo – Pflege-/Wartungsvertrag. Regeln (aus platzhirsch-frappe-service/pflege übernommen):
kein Preis wird geschätzt (0 = auf Anfrage); der nächste Termin rückt nach jedem Protokoll um das Intervall weiter;
Nachkauf-Hinweise nur mit Einwilligung und ohne Widerruf (tasks.py / pflege_logik.py)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from ph_service.ph_service import pflege_logik as logik
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

AKTIV = ("Aktiv", "Pausiert")


class PHPflegeAbo(Document):
    def validate(self):
        einst = einstellungen()
        if int(self.intervall_monate or 0) <= 0:
            self.intervall_monate = logik.standard_intervall(self.bereich)
        if self.erinnerung_tage_vorher is None:
            self.erinnerung_tage_vorher = einst["erinnerung_tage_vorher"]
        self._kontakt_uebernehmen()
        letztes = self.letztes_protokoll_datum()
        vorher = self.get_doc_before_save()
        alt_letzte = getdate(vorher.letzte_wartung) if vorher and vorher.letzte_wartung else None
        neu_protokolliert = bool(letztes) and letztes != alt_letzte
        self.letzte_wartung = letztes
        if self.art != "Pflege einmalig":
            # Neues Protokoll (auch vorgezogen) oder fälliger Termin erreicht → nächster Termin = letzter + Intervall.
            if letztes and (neu_protokolliert or not self.naechster_termin or getdate(self.naechster_termin) <= letztes):
                self.naechster_termin = logik.naechster_termin_nach(letztes, int(self.intervall_monate))
                self.letzte_erinnerung = None
            elif not self.naechster_termin and self.status == "Aktiv":
                basis = letztes or (getdate(self.startdatum) if self.startdatum else None)
                if basis:
                    self.naechster_termin = logik.naechster_termin_nach(basis, int(self.intervall_monate))
        self.ueberfaellig = int(self.status == "Aktiv" and bool(self.naechster_termin) and logik.ueberfaellig(getdate(nowdate()), getdate(self.naechster_termin), einst["wartung_karenz_tage"]))
        if self.status == "Aktiv" and not self.startdatum:
            self.startdatum = nowdate()
        if self.status == "Gekuendigt" and not self.kuendigung_zum:
            frappe.throw(_("Gekündigt nur mit Datum „Gekündigt zum“."))
        self._einwilligung_pruefen()
        self.titel = self.bilde_titel()

    def bilde_titel(self):
        stuecke = ", ".join(s.bezeichnung for s in (self.stuecke or [])[:2] if s.bezeichnung)
        objekt = stuecke or self.produkt or self.bereich
        return f"{self.kunde_name or self.kontakt} – {_(self.art)} {self.bereich}{' (' + objekt + ')' if objekt and objekt != self.bereich else ''}"[:140]

    def letztes_protokoll_datum(self):
        daten = [getdate(p.datum) for p in (self.protokolle or []) if p.datum]
        return max(daten) if daten else None

    def _kontakt_uebernehmen(self):
        if not self.kontakt or not frappe.db.exists("DocType", "PH Kontakt"):
            return
        try:
            k = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "firma", "email", "strasse", "plz", "ort", "land"], as_dict=True)
        except Exception:  # noqa: BLE001
            k = None
        if not k:
            return
        self.kunde_name = (" ".join(x for x in (k.vorname, k.nachname) if x) or k.firma or self.kontakt)[:140]
        self.kontakt_email = self.kontakt_email or k.email
        if not self.strasse and not self.ort:
            self.strasse, self.plz, self.ort = k.strasse, k.plz, k.ort
            self.land = k.land or self.land

    def _einwilligung_pruefen(self):
        if self.nachkauf_einwilligung and not self.nachkauf_einwilligung_am:
            self.nachkauf_einwilligung_am = now_datetime()
        if not self.nachkauf_einwilligung and self.nachkauf_einwilligung_am and not self.nachkauf_widerrufen_am:
            self.nachkauf_widerrufen_am = now_datetime()
        if self.nachkauf_einwilligung and self.nachkauf_widerrufen_am:
            if getdate(self.nachkauf_einwilligung_am) <= getdate(self.nachkauf_widerrufen_am):
                self.nachkauf_einwilligung_am = now_datetime()
            self.nachkauf_widerrufen_am = None
        if self.nachkauf_einwilligung and not self.nachkauf_textversion:
            frappe.msgprint(_("Bitte die Textversion der Einwilligung eintragen (Nachweis Art. 7 Abs. 1 DSGVO)."), indicator="orange")

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def einsatz_planen(self, datum, zeit_von=None, zeit_bis=None, techniker=None, planschluessel=None):
        """Button „Nächsten Termin planen“: PH Serviceeinsatz (Art Wartung/Pflege). Scheduler
        tasks.wartungseinsaetze_erzeugen ruft mit planschluessel (Idempotenz) auf."""
        self.check_permission("write")
        if planschluessel and frappe.db.exists("PH Serviceeinsatz", {"planschluessel": planschluessel}):
            return frappe.db.get_value("PH Serviceeinsatz", {"planschluessel": planschluessel}, "name")
        einsatz = frappe.get_doc(
            {
                "doctype": "PH Serviceeinsatz",
                "pflege_abo": self.name,
                "art": "Wartung" if self.art == "Wartungsvertrag" else "Pflege",
                "techniker": techniker or self.techniker or einstellungen()["techniker_standard"],
                "datum": datum,
                "zeit_von": zeit_von,
                "zeit_bis": zeit_bis,
                "hinweis_intern": self.leistungen,
                "mitzubringen": ", ".join(s.bezeichnung for s in self.stuecke or [] if s.bezeichnung),
                "planschluessel": planschluessel,
            }
        ).insert()
        self.db_set("naechster_einsatz", einsatz.name, update_modified=False)
        return einsatz.name

    @frappe.whitelist()
    def erinnerung_senden(self):
        """Button „Erinnerung senden“: Wartungserinnerung per Email Template an kontakt_email (Vertragserfüllung, keine Werbung)."""
        self.check_permission("write")
        from ph_service.ph_service import kommunikation as kom

        kom.sende_vorlage(self, "wartung", self.kontakt_email, ereignis="Kommunikation")
        self.db_set("letzte_erinnerung", nowdate())
        return True

    @frappe.whitelist()
    def protokoll_erfassen(self, datum, leistungen, durchgefuehrt_von=None, empfohlene_produkte=None, im_portal=1):
        """Button „Protokoll erfassen“ (ohne Einsatz, z. B. Partnerbetrieb)."""
        self.check_permission("write")
        self.append("protokolle", {"datum": datum, "leistungen": leistungen, "durchgefuehrt_von": durchgefuehrt_von or frappe.session.user, "empfohlene_produkte": empfohlene_produkte, "im_portal": int(im_portal)})
        self.save()
        return self.naechster_termin

    @frappe.whitelist()
    def geplante_termine(self, anzahl=6):
        start = getdate(self.naechster_termin or self.startdatum or nowdate())
        return [str(d) for d in logik.wartungen_im_zeitraum(start, None, int(self.intervall_monate or 12))[: int(anzahl)]]
