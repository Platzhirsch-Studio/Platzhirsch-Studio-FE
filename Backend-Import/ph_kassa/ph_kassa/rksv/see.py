"""Signer für eine PH Signatureinheit bauen (Frappe-Seite). Zugänge nur aus site_config.

    signer_fuer(see)              → Signer (ATrustSigner | SoftwareSigner) oder SignaturFehler
    zertifikat_uebernehmen(doc, signer)  → Zertifikatsfelder der SEE füllen
    zertifikat_fuer_pruefung(see) → x509-Zertifikat aus gespeichertem PEM (für Belegprüfung/DEP)

Test-Hook: `frappe.flags.ph_kassa_test_signer = SoftwareSigner()` ersetzt in Tests jede SEE.
"""

import json

import frappe
from frappe import _
from frappe.utils import now_datetime

from .atrust import ATrustSigner
from .signer import SignaturFehler, SoftwareSigner, seriennummer_hex, zertifikat_aus_pem, zertifikat_fingerprint

ART_ONLINE = "A-Trust a.sign RK Online"
ART_KARTE = "A-Trust Karte (lokal)"
ART_TEST = "Test"


def _doc(see):
    return see if hasattr(see, "art") else frappe.get_doc("PH Signatureinheit", see)


def signer_fuer(see):
    """Signer zur SEE. Wirft SignaturFehler (→ Ausfallmodus in buchung.py)."""
    test = getattr(frappe.flags, "ph_kassa_test_signer", None)
    if test is not None:
        return test
    doc = _doc(see)
    if doc.art == ART_TEST:
        pem = frappe.conf.get(doc.test_schluessel_name or "")
        if not pem:
            raise SignaturFehler(
                _("Testschlüssel fehlt: PEM unter „{0}“ in site_config eintragen (Button „Testschlüssel erzeugen“).").format(doc.test_schluessel_name)
            )
        s = SoftwareSigner(pem, bezeichnung=doc.name)
        s.zda_id = doc.vda_id or "AT0"
        return s
    if doc.art == ART_ONLINE:
        env = frappe.conf.get("ph_atrust_env") or doc.env or "test"
        s = ATrustSigner(frappe.conf.get("ph_atrust_user"), frappe.conf.get("ph_atrust_password"), env=env)
        if doc.zertifikat_seriennummer:
            s.zertifikat_seriennummer = doc.zertifikat_seriennummer
            s.zda_id = doc.vda_id or "AT1"
        else:
            s.zertifikat_abrufen()
        return s
    raise SignaturFehler(_("A-Trust Karte (lokal) ist im Erstbau nicht angebunden – a.sign RK Online verwenden."))


def zertifikat_von(signer):
    """x509-Zertifikat des Signers (SoftwareSigner.zertifikat, ATrustSigner.zertifikat())."""
    z = getattr(signer, "zertifikat", None)
    return z() if callable(z) else z


def zertifikat_uebernehmen(doc, signer):
    """Zertifikatsfelder der PH Signatureinheit aus dem Signer füllen (db_set, ohne Validierung)."""
    zert = zertifikat_von(signer)
    if zert is None:
        return
    from cryptography.hazmat.primitives import serialization

    sn = signer.zertifikat_seriennummer or seriennummer_hex(zert)
    werte = {
        "zertifikat_seriennummer": sn.lower(),
        "zertifikat_seriennummer_dezimal": str(int(sn, 16)),
        "zertifikat_pem": zert.public_bytes(serialization.Encoding.PEM).decode("ascii"),
        "zertifikat_fingerprint": zertifikat_fingerprint(zert),
        "zertifikatskette_json": json.dumps(signer.zertifikatskette_der_b64()),
        "vda_id": signer.zda_id,
        "letzte_pruefung": now_datetime(),
        "letzte_pruefung_ergebnis": _("Zertifikat abgerufen."),
    }
    try:
        werte["zertifikat_gueltig_bis"] = zert.not_valid_after_utc.date()
    except AttributeError:  # ältere cryptography
        werte["zertifikat_gueltig_bis"] = zert.not_valid_after.date()
    if doc.status == "Angelegt":
        werte["status"] = "Registriert" if doc.finanzonline_registriert_am else "Angelegt"
    doc.db_set(werte, update_modified=True)
    return werte


def zertifikat_fuer_pruefung(see):
    doc = _doc(see)
    return zertifikat_aus_pem(doc.zertifikat_pem) if doc.zertifikat_pem else None


def zertifikat_b64_fuer_dep(see):
    """(Signaturzertifikat Base64-DER, [Zertifizierungsstellen]) aus der SEE für den DEP-Export."""
    doc = _doc(see)
    zert = zertifikat_fuer_pruefung(doc)
    if zert is None:
        return "", []
    from .signer import zertifikat_der_b64

    kette = json.loads(doc.zertifikatskette_json or "[]")
    return zertifikat_der_b64(zert), kette
