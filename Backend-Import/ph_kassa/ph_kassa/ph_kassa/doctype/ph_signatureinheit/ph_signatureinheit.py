"""PH Signatureinheit – SEE-Stammdaten, Zertifikat abrufen, Verbindung prüfen, Testschlüssel (WP10a)."""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_kassa.rksv import see as see_modul
from ph_kassa.rksv.signer import SignaturFehler, SoftwareSigner


class PHSignatureinheit(Document):
    def validate(self):
        self.bezeichnung = (self.bezeichnung or "").strip()
        self.vda_id = (self.vda_id or ("AT0" if self.art == "Test" else "AT1")).strip().upper()
        if not re.fullmatch(r"AT[0-9]+", self.vda_id):
            frappe.throw(_("VDA-Kennung muss AT + Ziffern sein (A-Trust: AT1)."))
        if self.art == "Test":
            self.test_schluessel_name = f"ph_kassa_test_see_key_{frappe.scrub(self.bezeichnung)}"
            if self.env == "produktiv":
                frappe.throw(_("Test-SEE darf nicht produktiv sein."))
        else:
            self.test_schluessel_name = None
        if self.art == "Test" and self.vda_id == "AT1":
            frappe.msgprint(_("Test-SEE mit AT1: Belege sehen echt aus, sind aber NICHT RKSV-gültig (kein A-Trust-Zertifikat)."), indicator="orange")
        if self.finanzonline_registriert_am and self.status == "Angelegt":
            self.status = "Registriert"

    def on_trash(self):
        if frappe.db.exists("PH Kassenbeleg", {"zertifikat_seriennummer": self.zertifikat_seriennummer}) and self.zertifikat_seriennummer:
            frappe.throw(_("SEE mit signierten Belegen kann nicht gelöscht werden (DEP-Zertifikat)."))

    # ── Buttons (ph_signatureinheit.js) ────────────────────────────────────

    @frappe.whitelist()
    def zertifikat_abrufen(self):
        """A-Trust: GET Certificate; Test: aus Testschlüssel. Füllt Seriennummer/PEM/Kette."""
        self.check_permission("write")
        try:
            signer = see_modul.signer_fuer(self)
            if hasattr(signer, "zertifikat_abrufen") and not getattr(frappe.flags, "ph_kassa_test_signer", None):
                signer.zertifikat_abrufen()
        except SignaturFehler as e:
            self.db_set({"letzte_pruefung": now_datetime(), "letzte_pruefung_ergebnis": _("Fehler: {0}").format(e)}, update_modified=False)
            frappe.throw(_("Zertifikat nicht abrufbar: {0}").format(e))
        werte = see_modul.zertifikat_uebernehmen(self, signer)
        if self.status in ("Angelegt", "Registriert") and self.finanzonline_registriert_am:
            self.db_set("status", "Aktiv", update_modified=False)
        return {"seriennummer": werte["zertifikat_seriennummer"], "vda_id": werte["vda_id"], "gueltig_bis": str(werte["zertifikat_gueltig_bis"])}

    @frappe.whitelist()
    def verbindung_pruefen(self):
        """Signiert einen Prüf-Input (kein Beleg, keine Kettenwirkung)."""
        self.check_permission("read")
        from ph_kassa.rksv.beleg import JWS_HEADER_B64URL, b64url
        from ph_kassa.rksv.signer import verifiziere

        try:
            signer = see_modul.signer_fuer(self)
            probe = f"{JWS_HEADER_B64URL}.{b64url(b'PH Kassa Verbindungstest')}".encode("ascii")
            sig = signer.sign(probe)
            ok = len(sig) == 64
            zert = see_modul.zertifikat_fuer_pruefung(self)
            if zert is not None:
                ok = verifiziere(f"{probe.decode()}.{b64url(sig)}", zert)
            text = _("OK – Signatur {0}").format(_("gegen gespeichertes Zertifikat geprüft") if zert is not None else _("erhalten (kein Zertifikat gespeichert)"))
        except SignaturFehler as e:
            ok, text = False, _("Fehler: {0}").format(e)
        self.db_set({"letzte_pruefung": now_datetime(), "letzte_pruefung_ergebnis": text}, update_modified=False)
        return {"ok": ok, "text": text}

    @frappe.whitelist()
    def testschluessel_erzeugen(self):
        """Nur art=Test: neuen EC-P-256-Schlüssel (PEM) für site_config erzeugen – wird nicht gespeichert."""
        self.check_permission("write")
        if self.art != "Test":
            frappe.throw(_("Testschlüssel nur für SEE der Art „Test“."))
        if frappe.conf.get(self.test_schluessel_name):
            frappe.throw(_("Unter „{0}“ ist bereits ein Schlüssel hinterlegt.").format(self.test_schluessel_name))
        return {"schluesselname": self.test_schluessel_name, "pem": SoftwareSigner.neuer_schluessel_pem()}

    @frappe.whitelist()
    def ausfall_melden(self, notiz=None):
        self.check_permission("write")
        from ph_kassa.rksv.buchung import see_ausfall_melden

        return see_ausfall_melden(self.name, notiz=notiz)

    @frappe.whitelist()
    def ausfall_beenden(self, notiz=None):
        self.check_permission("write")
        from ph_kassa.rksv.buchung import see_ausfall_beenden

        return see_ausfall_beenden(self.name, notiz=notiz)
