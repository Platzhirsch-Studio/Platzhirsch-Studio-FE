"""PH Kasse – Stammdaten und Buttons des RKSV-Kerns (WP10a).

Der Kettenstand (Belegnummer, Umsatzzähler, letzter Beleg) wird ausschließlich von
ph_kassa.rksv.buchung fortgeschrieben; hier nur Validierung, Checkliste und Aktionen.
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime

from ph_kassa.rksv import buchung
from ph_kassa.rksv.counter import ZaehlerFehler, neuer_schluessel_b64, pruefwert_schluessel, schluessel_aus_b64
from ph_kassa.rksv.finanzonline import registrierungsdaten_kasse

KASSEN_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.\-]{0,38}$")
CHECKLISTE = (
    "AES-Schluessel erzeugt",
    "SEE bestellt",
    "SEE registriert FinanzOnline",
    "Kasse registriert FinanzOnline",
    "Startbeleg erzeugt",
    "Startbeleg geprueft BMF-App",
    "Jahresbeleg geprueft",
)


class PHKasse(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Angelegt"
        if not self.registrierung:
            for s in CHECKLISTE:
                self.append("registrierung", {"schritt": s, "erledigt": 0})

    def validate(self):
        self.kassen_id = (self.kassen_id or "").strip()
        if not KASSEN_ID_RE.match(self.kassen_id):
            frappe.throw(_("Kassen-ID: 1–39 Zeichen, Buchstaben/Ziffern/Punkt/Bindestrich, kein Unterstrich, kein Leerzeichen."))
        if not self.is_new() and self.has_value_changed("kassen_id") and cint(self.belegnummer_zaehler) > 0:
            frappe.throw(_("Kassen-ID ist nach dem ersten Beleg unveränderlich (Verkettung)."))
        if not self.bezeichnung:
            self.bezeichnung = f"Kasse {self.kassen_id}"
        if not self.firma and frappe.db.exists("PH Firma", {"standard": 1}):
            self.firma = frappe.db.get_value("PH Firma", {"standard": 1}, "name")
        self.aes_schluessel_name = f"ph_kassa_aes_key_{self.kassen_id}"
        self._aes_pruefen()
        self._checkliste_spiegeln()
        if self.has_value_changed("see") and cint(self.belegnummer_zaehler) > 0 and self.get_doc_before_save() and self.get_doc_before_save().see:
            frappe.msgprint(_("SEE-Wechsel: neues Zertifikat → neue Belege-Gruppe im DEP; Wechsel in FinanzOnline melden."), indicator="orange")

    def _aes_pruefen(self):
        wert = frappe.conf.get(self.aes_schluessel_name)
        self.aes_schluessel_vorhanden = 0
        self.aes_pruefwert = None
        if wert:
            try:
                self.aes_pruefwert = pruefwert_schluessel(schluessel_aus_b64(wert))
                self.aes_schluessel_vorhanden = 1
            except ZaehlerFehler as e:
                frappe.msgprint(_("AES-Schlüssel in site_config ungültig: {0}").format(e), indicator="red")

    def _checkliste_spiegeln(self):
        """Checkliste ↔ Felder: Startbeleg geprüft, Jahresbeleg geprüft, Registriert."""
        for z in self.registrierung:
            if z.erledigt and not z.datum:
                z.datum = getdate()
            if z.schritt == "Startbeleg geprueft BMF-App" and z.erledigt and not self.startbeleg_geprueft_am:
                self.startbeleg_geprueft_am = z.datum
            if z.schritt == "Jahresbeleg geprueft" and z.erledigt:
                self.jahresbeleg_geprueft_am = z.datum
            if z.schritt == "Kasse registriert FinanzOnline" and z.erledigt and not self.finanzonline_registriert_am:
                self.finanzonline_registriert_am = z.datum
            if z.schritt == "Startbeleg erzeugt" and self.startbeleg and not z.erledigt:
                z.erledigt, z.datum = 1, getdate(self.startbeleg_erstellt_am)
            if z.schritt == "AES-Schluessel erzeugt" and self.aes_schluessel_vorhanden and not z.erledigt:
                z.erledigt, z.datum = 1, getdate()
        if self.status == "Registriert" and self.startbeleg and self.startbeleg_geprueft_am:
            self.status = "Aktiv"
        elif self.status == "Angelegt" and self.finanzonline_registriert_am and self.see:
            self.status = "Registriert"

    def on_trash(self):
        if cint(self.belegnummer_zaehler) > 0:
            frappe.throw(_("Kasse mit Belegen kann nicht gelöscht werden (Aufbewahrung 7 Jahre) – Schlussbeleg erstellen."))

    # ── Buttons (ph_kasse.js) ──────────────────────────────────────────────

    @frappe.whitelist()
    def aes_schluessel_erzeugen(self):
        """Zeigt EINMALIG einen neuen 256-Bit-Schlüssel (Base64) – wird nirgends gespeichert."""
        self.check_permission("write")
        if self.aes_schluessel_vorhanden:
            frappe.throw(_("Für diese Kasse ist bereits ein Schlüssel in site_config hinterlegt."))
        key = neuer_schluessel_b64()
        return {"schluesselname": self.aes_schluessel_name, "schluessel_b64": key, "pruefwert": pruefwert_schluessel(schluessel_aus_b64(key))}

    @frappe.whitelist()
    def registrierungsdaten(self):
        self.check_permission("read")
        key = buchung.aes_key(self)
        daten = registrierungsdaten_kasse(self.kassen_id, key, self.bezeichnung)
        if self.see:
            from ph_kassa.rksv.finanzonline import registrierungsdaten_see

            see = frappe.get_doc("PH Signatureinheit", self.see)
            daten["see"] = registrierungsdaten_see(see.zertifikat_seriennummer, see.vda_id or "AT1", see.art)
        return daten

    @frappe.whitelist()
    def startbeleg_erstellen(self):
        self.check_permission("write")
        doc = buchung.startbeleg(self.name)
        return doc.name

    @frappe.whitelist()
    def nullbeleg_erstellen(self, belegart="Nullbeleg"):
        self.check_permission("write")
        if belegart == "Jahresbeleg":
            return buchung.jahresbeleg(self.name).name
        return buchung.nullbeleg(self.name, belegart=belegart).name

    @frappe.whitelist()
    def schlussbeleg_erstellen(self):
        self.check_permission("delete")  # Außerbetriebnahme nur Leitung/Admin
        return buchung.schlussbeleg(self.name).name

    @frappe.whitelist()
    def dep_exportieren(self, von=None, bis=None, art="Zeitraum"):
        self.check_permission("write")
        from ph_kassa.ph_kassa.doctype.ph_dep_export.ph_dep_export import exportiere

        return exportiere(self.name, von, bis, art).name

    @frappe.whitelist()
    def see_ausfall_melden(self, notiz=None):
        self.check_permission("write")
        if not self.see:
            frappe.throw(_("Keine SEE zugeordnet."))
        return buchung.see_ausfall_melden(self.see, notiz=notiz, kasse=self.name)

    @frappe.whitelist()
    def see_ausfall_beenden(self, notiz=None):
        self.check_permission("write")
        return buchung.see_ausfall_beenden(self.see, notiz=notiz)

    @frappe.whitelist()
    def startbeleg_geprueft(self, datum=None, nachweis=None):
        """Startbeleg mit BMF Belegcheck-App geprüft (RKSV § 6 Abs 4): Checkliste, Ereignis erledigt, Kasse Aktiv."""
        return self._pruefung_bestaetigen("Startbeleg geprueft BMF-App", "Startbeleg Pruefung", "startbeleg_geprueft_am", datum, nachweis)

    @frappe.whitelist()
    def jahresbeleg_geprueft(self, datum=None, nachweis=None):
        """Jahresbeleg bis 15.02. geprüft (RKSV § 8, Fachkritik 21 P12)."""
        return self._pruefung_bestaetigen("Jahresbeleg geprueft", "Jahresbeleg Pruefung", "jahresbeleg_geprueft_am", datum, nachweis)

    def _pruefung_bestaetigen(self, schritt, ereignis_art, feld, datum, nachweis):
        self.check_permission("write")
        if not set(frappe.get_roles()) & {"PH Kassa Leitung", "System Manager", "PH Backoffice-Admin"}:
            frappe.throw(_("Nur Kassa-Leitung oder Admin bestätigen die BMF-Prüfung."))
        if feld == "startbeleg_geprueft_am" and not self.startbeleg:
            frappe.throw(_("Kein Startbeleg vorhanden."))
        datum = getdate(datum) if datum else getdate()
        zeile = next((z for z in self.registrierung if z.schritt == schritt), None) or self.append("registrierung", {"schritt": schritt})
        zeile.erledigt, zeile.datum = 1, datum
        if nachweis:
            zeile.nachweis = nachweis
        self.set(feld, datum)
        self.save()
        for ev in frappe.get_all("PH Kassa Ereignis", {"kasse": self.name, "art": ereignis_art, "status": "Offen"}, pluck="name"):
            frappe.db.set_value("PH Kassa Ereignis", ev, {"status": "Erledigt", "ende": now_datetime(), "nachweis": nachweis}, update_modified=False)
        return {"status": self.status, feld: str(datum)}

    @frappe.whitelist()
    def kassenausfall_melden(self, notiz=None):
        """Ausfall der Registrierkasse selbst (Server/Netz, nicht nur SEE) – Beginn des Notbetriebs (RKSV § 17)."""
        self.check_permission("write")
        if frappe.db.exists("PH Kassa Ereignis", {"kasse": self.name, "art": "Kasse Ausfall Beginn", "status": "Offen"}):
            frappe.throw(_("Kassenausfall ist bereits gemeldet."))
        return buchung._ereignis(self.name, "Kasse Ausfall Beginn", notiz=notiz or _("Kasse ausgefallen – Notbelege (Papier, fortlaufend nummeriert) ausstellen."), automatisch=False).name

    @frappe.whitelist()
    def kassenausfall_beenden(self, notiz=None):
        """Ende des Kassenausfalls: Dauer, Meldepflicht > 48 h (FinanzOnline binnen einer Woche), danach Notbelege nacherfassen."""
        self.check_permission("write")
        from frappe.utils import time_diff_in_hours

        from ph_kassa.rksv.finanzonline import ausfall_meldepflichtig

        offen = frappe.get_all("PH Kassa Ereignis", {"kasse": self.name, "art": "Kasse Ausfall Beginn", "status": "Offen"}, ["name", "zeitpunkt"], order_by="zeitpunkt asc")
        if not offen:
            frappe.throw(_("Kein offener Kassenausfall."))
        jetzt = now_datetime()
        dauer = time_diff_in_hours(jetzt, offen[0].zeitpunkt)
        melde = ausfall_meldepflichtig(dauer)
        for ev in offen:
            frappe.db.set_value("PH Kassa Ereignis", ev.name, {"status": "Beendet", "ende": jetzt, "dauer_h": dauer, "meldung_finanzonline_noetig": 1 if melde else 0}, update_modified=False)
        buchung._ereignis(self.name, "Kasse Ausfall Ende", notiz=notiz, status="Beendet", automatisch=False)
        if melde:
            buchung.aufgabe(self.name, _("Kassenausfall {0} h: Ausfall und Wiederinbetriebnahme in FinanzOnline melden (RKSV § 17).").format(round(dauer, 1)))
        return {"dauer_h": round(dauer, 2), "meldepflicht": melde}

    @frappe.whitelist()
    def kette_pruefen(self, von_belegnummer=None, bis_belegnummer=None):
        """Belegkette (Signaturen, Verkettung, Zähler) verifizieren – Simulation Belegcheck."""
        self.check_permission("read")
        from ph_kassa.rksv.pruefung import pruefe_kette
        from ph_kassa.rksv.see import zertifikat_fuer_pruefung

        filter_ = {"kasse": self.name, "docstatus": 1}
        if von_belegnummer:
            filter_["belegnummer"] = (">=", cint(von_belegnummer))
        jws = frappe.get_all("PH Kassenbeleg", filter_, ["belegnummer", "jws_compact"], order_by="belegnummer asc")
        if bis_belegnummer:
            jws = [j for j in jws if j.belegnummer <= cint(bis_belegnummer)]
        zert = zertifikat_fuer_pruefung(self.see) if self.see else None
        if zert is None:
            frappe.throw(_("SEE-Zertifikat fehlt – in PH Signatureinheit „Zertifikat abrufen“."))
        erg = pruefe_kette([j.jws_compact for j in jws], zert, aes_key=buchung.aes_key(self), kassen_id=self.kassen_id, erwarteter_start=not von_belegnummer or cint(von_belegnummer) == 1)
        return {"ok": erg["ok"], "anzahl": erg["anzahl"], "fehler": [f"Beleg {jws[i].belegnummer}: {t}" for i, t in erg["fehler"]], "geprueft_am": str(now_datetime())}
