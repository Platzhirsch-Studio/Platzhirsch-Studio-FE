"""PH Datei – Metadaten einer Ablage-Datei. Inhalte liegen versioniert im Speicher (PH Datei Version.schluessel);
Name, Ordner, Tags und Beschreibung nur hier (Umbenennen/Verschieben ohne Speicherzugriff)."""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

from ph_ablage.utils import regeln


class PHDatei(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Hochladen"
        if not self.aktuelle_version:
            self.aktuelle_version = 0

    def validate(self):
        try:
            self.dateiname = regeln.dateiname_bereinigen(self.dateiname)
        except ValueError:
            frappe.throw(_("Dateiname fehlt."))
        alt = self.get_doc_before_save()
        neue_endung = regeln.endung(self.dateiname)
        if alt and alt.endung and neue_endung != alt.endung and cint(self.aktuelle_version):
            frappe.throw(_("Die Endung „.{0}“ bleibt beim Umbenennen erhalten (Inhalt ist {0}).").format(alt.endung))
        self.endung = neue_endung
        if not self.mime:
            self.mime = regeln.mime_fuer(self.dateiname)
        self.vorschau_art = regeln.vorschau_art(self.endung)
        self.groesse_text = regeln.groesse_text(self.groesse)
        self.tags = regeln.tags_text(self.tags) or None
        if self.aufbewahrungsklasse not in regeln.KLASSEN:
            self.aufbewahrungsklasse = "Allgemein"
        self._ordner_uebernehmen(alt)
        from ph_ablage.ph_ablage.dienste import aufbewahrung_setzen

        aufbewahrung_setzen(self)
        if self.metadaten_json and not isinstance(self.metadaten_json, str):
            self.metadaten_json = json.dumps(self.metadaten_json, ensure_ascii=False)
        self.geloescht = 1 if self.status == "Papierkorb" else 0
        if alt and alt.aufbewahrungsklasse != self.aufbewahrungsklasse and alt.loeschsperre:
            from ph_ablage.ph_ablage.rechte import ist_leitung

            if not ist_leitung(self.bezug_doctype):
                frappe.throw(_("Die Aufbewahrungsklasse einer gesperrten Datei ändert nur die Leitung."))

    def _ordner_uebernehmen(self, alt):
        o = frappe.db.get_value("PH Ordner", self.ordner, ["bezug_doctype", "bezug_name", "bezug_titel", "effektiver_modus", "aufbewahrungsklasse"], as_dict=True)
        if not o:
            frappe.throw(_("Ordner {0} existiert nicht.").format(self.ordner))
        self.bezug_doctype, self.bezug_name, self.bezug_titel = o.bezug_doctype, o.bezug_name, o.bezug_titel
        self.effektiver_modus = o.effektiver_modus or "intern"
        if self.is_new() and o.aufbewahrungsklasse and (not self.aufbewahrungsklasse or self.aufbewahrungsklasse == "Allgemein"):
            self.aufbewahrungsklasse = o.aufbewahrungsklasse
        if not self.is_new() and not self.flags.ph_api:
            # Desk-Änderung: dieselben Regeln wie die API (Check-out, Duplikat-Name ist erlaubt)
            if alt and (alt.ordner != self.ordner or alt.dateiname != self.dateiname):
                from ph_ablage.ph_ablage.dienste import sperre_pruefen

                _desk(sperre_pruefen, self)

    def on_update(self):
        alt = self.get_doc_before_save()
        if not alt or self.flags.ph_api:
            return
        from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll

        if alt.dateiname != self.dateiname:
            protokoll("Umbenannt", datei=self.name, bezug_doctype=self.bezug_doctype, bezug_name=self.bezug_name, hinweis=_("im Desk"))
        if alt.ordner != self.ordner:
            protokoll("Verschoben", datei=self.name, ordner=self.ordner, bezug_doctype=self.bezug_doctype, bezug_name=self.bezug_name, hinweis=_("von {0}").format(alt.ordner))

    def on_trash(self):
        if self.flags.ph_objekte_entfernt:
            return
        from ph_ablage.ph_ablage.dienste import loeschen_pruefen, objekte_entfernen

        if self.status != "Hochladen":
            _desk(loeschen_pruefen, self, endgueltig=True)
        objekte_entfernen(self)
        for link in frappe.get_all("PH Datei Freigabelink", filters={"datei": self.name}, pluck="name"):
            frappe.delete_doc("PH Datei Freigabelink", link, ignore_permissions=True, force=True)

    # ── Desk-Buttons (gleiche Logik wie ph_ablage.api) ─────────────────────────────────────────
    @frappe.whitelist()
    def herunterladen_link(self, version=None):
        self.check_permission("read")
        from ph_ablage.ph_ablage.dienste import download_info

        return _desk(download_info, self, version=version)

    @frappe.whitelist()
    def auschecken(self, stunden=None):
        self.check_permission("write")
        from ph_ablage.ph_ablage.dienste import sperren

        _desk(sperren, self, stunden)
        return self.gesperrt_bis

    @frappe.whitelist()
    def einchecken(self, erzwingen=0):
        self.check_permission("write")
        from ph_ablage.ph_ablage.dienste import entsperren

        _desk(entsperren, self, erzwingen=cint(erzwingen))

    @frappe.whitelist()
    def in_papierkorb(self):
        self.check_permission("write")
        from ph_ablage.ph_ablage.dienste import in_papierkorb

        _desk(in_papierkorb, self)

    @frappe.whitelist()
    def wiederherstellen(self):
        self.check_permission("write")
        from ph_ablage.ph_ablage.dienste import aus_papierkorb

        _desk(aus_papierkorb, self)

    @frappe.whitelist()
    def freigabelink(self, tage=None, passwort=None, max_downloads=None, empfaenger_hinweis=None):
        self.check_permission("write")
        from ph_ablage.ph_ablage.dienste import freigabelink_erstellen

        return _desk(freigabelink_erstellen, self, tage=tage, passwort=passwort, max_downloads=max_downloads, empfaenger_hinweis=empfaenger_hinweis)

    @frappe.whitelist()
    def vorschau_neu(self):
        self.check_permission("write")
        from ph_ablage.ph_ablage.vorschau import einreihen

        einreihen(self.name, cint(self.aktuelle_version), neu=True)
        return "Ausstehend"


def _desk(fn, *args, **kwargs):
    """ApiFehler der Dienste im Desk als normale Meldung zeigen (statt Serverfehler)."""
    from ph_core.api import ApiFehler

    try:
        return fn(*args, **kwargs)
    except ApiFehler as e:
        frappe.throw(e.meldung, title=_("Ablage"))
