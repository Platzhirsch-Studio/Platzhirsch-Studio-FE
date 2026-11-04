"""Signaturerstellung ES256 (ECDSA P-256 / SHA-256) über den JWS-Signing-Input.

Schnittstelle, die buchung.py und beleg.erzeuge() erwarten:

    class Signer:
        zda_id: str                       # "AT1" (A-Trust) oder "AT0" (geschlossenes System/Test)
        zertifikat_seriennummer: str      # hex
        def sign(self, signing_input: bytes) -> bytes   # R‖S, 64 Byte
        def zertifikat_der_b64(self) -> str             # für DEP7 „Signaturzertifikat“
        def zertifikatskette_der_b64(self) -> list[str] # für DEP7 „Zertifizierungsstellen“

- SoftwareSigner: eigener EC-P-256-Schlüssel (cryptography) + selbstsigniertes Zertifikat. NUR für Tests
  und die Staging-Site (PH Signatureinheit.art = Test). Erzeugt keine RKSV-gültigen Belege.
- Ausfall: in beleg.erzeuge() wird signer=None übergeben → Signatur „Sicherheitseinrichtung ausgefallen“.
- verifiziere(): prüft eine JWS gegen einen öffentlichen Schlüssel/Zertifikat (Belegcheck-Simulation).

Kein Frappe-Import.
"""

import base64
import datetime as _dt
import hashlib

from cryptography import x509
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature, encode_dss_signature
from cryptography.x509.oid import NameOID

from .beleg import b64url_decode, ist_ausfall_jws, signing_input

SIG_LAENGE = 64  # R (32) ‖ S (32)


class SignaturFehler(Exception):
    """Signatur konnte nicht erstellt werden (SEE nicht erreichbar/abgelehnt) → Ausfallmodus."""


def der_zu_raw(der_sig):
    r, s = decode_dss_signature(der_sig)
    return r.to_bytes(32, "big") + s.to_bytes(32, "big")


def raw_zu_der(raw):
    if len(raw) != SIG_LAENGE:
        raise SignaturFehler("ES256-Signatur muss 64 Byte (R‖S) lang sein.")
    return encode_dss_signature(int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big"))


def seriennummer_hex(zertifikat):
    return format(zertifikat.serial_number, "x")


def zertifikat_aus_pem(pem):
    return x509.load_pem_x509_certificate(pem.encode("utf-8") if isinstance(pem, str) else pem)


def zertifikat_aus_der_b64(wert):
    return x509.load_der_x509_certificate(base64.b64decode(wert))


def zertifikat_der_b64(zertifikat):
    return base64.b64encode(zertifikat.public_bytes(serialization.Encoding.DER)).decode("ascii")


def zertifikat_fingerprint(zertifikat):
    return hashlib.sha256(zertifikat.public_bytes(serialization.Encoding.DER)).hexdigest()


class SoftwareSigner:
    """Test-Signer: EC P-256 im Speicher, optional aus PEM (site_config `ph_kassa_test_see_key_<see>`)."""

    zda_id = "AT0"

    def __init__(self, private_key_pem=None, bezeichnung="PH Kassa Test-SEE", seriennummer=None):
        if private_key_pem:
            pem = private_key_pem.encode("utf-8") if isinstance(private_key_pem, str) else private_key_pem
            self.key = serialization.load_pem_private_key(pem, password=None)
            if not isinstance(self.key, ec.EllipticCurvePrivateKey):
                raise SignaturFehler("Testschlüssel muss ein EC-Schlüssel (P-256) sein.")
        else:
            self.key = ec.generate_private_key(ec.SECP256R1())
        self.zertifikat = self._selbstsigniert(bezeichnung, seriennummer)
        self.zertifikat_seriennummer = seriennummer_hex(self.zertifikat)

    def _selbstsigniert(self, bezeichnung, seriennummer):
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, bezeichnung), x509.NameAttribute(NameOID.COUNTRY_NAME, "AT")])
        jetzt = _dt.datetime.now(_dt.timezone.utc)
        # Seriennummer deterministisch aus dem öffentlichen Schlüssel, damit Neuaufbau aus demselben PEM
        # dieselbe Seriennummer ergibt (Verkettung/DEP bleiben prüfbar).
        if seriennummer is None:
            pub = self.key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
            seriennummer = int.from_bytes(hashlib.sha256(pub).digest()[:8], "big") or 1
        return (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(name)
            .public_key(self.key.public_key())
            .serial_number(int(seriennummer))
            .not_valid_before(jetzt.replace(year=jetzt.year - 1))
            .not_valid_after(jetzt.replace(year=jetzt.year + 10))
            .sign(self.key, hashes.SHA256())
        )

    @staticmethod
    def neuer_schluessel_pem():
        """PEM eines neuen P-256-Schlüssels – nur zum Eintragen in site_config der Staging-Site."""
        k = ec.generate_private_key(ec.SECP256R1())
        return k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode("ascii")

    def sign(self, signing_input_bytes):
        return der_zu_raw(self.key.sign(signing_input_bytes, ec.ECDSA(hashes.SHA256())))

    def zertifikat_pem(self):
        return self.zertifikat.public_bytes(serialization.Encoding.PEM).decode("ascii")

    def zertifikat_der_b64(self):
        return zertifikat_der_b64(self.zertifikat)

    def zertifikatskette_der_b64(self):
        return []  # selbstsigniert: keine Zertifizierungsstellen

    def public_key(self):
        return self.key.public_key()


class KaputterSigner:
    """Simuliert eine SEE, die nicht antwortet (für Ausfalltests)."""

    zda_id = "AT1"
    zertifikat_seriennummer = "1"

    def sign(self, signing_input_bytes):
        raise SignaturFehler("SEE antwortet nicht (Test).")

    def zertifikat_der_b64(self):
        return ""

    def zertifikatskette_der_b64(self):
        return []


def verifiziere(jws, public_key_oder_zertifikat):
    """True, wenn die JWS mit dem Schlüssel gültig ist; False bei falscher Signatur.

    Ausfall-Belege (Signatur = Text) gelten als „nicht signiert“ → False; Aufrufer prüft ist_ausfall_jws.
    """
    if ist_ausfall_jws(jws):
        return False
    teile = jws.split(".")
    if len(teile) != 3:
        return False
    pub = public_key_oder_zertifikat
    if hasattr(pub, "public_key") and not hasattr(pub, "verify"):
        pub = pub.public_key()
    try:
        code = b64url_decode(teile[1]).decode("utf-8")
        pub.verify(raw_zu_der(b64url_decode(teile[2])), signing_input(code), ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, SignaturFehler):
        return False
