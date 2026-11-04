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
