"""Wallet-Pässe: Apple (.pkpass) und Google Wallet (Save-Link mit JWT) für eine Kundenkarte.

Nutzdaten baut ph_kundenkarte/utils/wallet_payload.py (ohne Frappe). Hier nur:
  * Lesen der Kennungen aus PH Kundenkarte Einstellungen,
  * Prüfung, ob Zertifikat/Schlüssel in site_config.json liegen (frappe.conf.get – Werte werden nie ausgegeben),
  * Signierung über `cryptography` (optional, pyproject extra „wallet“); fehlt etwas → ApiFehler("unavailable", 503).

site_config-Schlüssel:
  ph_wallet_apple_cert             PEM des Pass-Type-Zertifikats
  ph_wallet_apple_key              PEM des privaten Schlüssels (unverschlüsselt)
  ph_wallet_apple_wwdr             PEM des Apple-WWDR-Zwischenzertifikats (optional, empfohlen)
  ph_wallet_google_issuer_id       Issuer-ID der Google-Wallet-Konsole
  ph_wallet_google_service_account JSON des Service-Accounts (client_email, private_key)
"""

import base64
import io
import json
import zipfile

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_core.api import ApiFehler
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen, wallet_konfiguriert
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.utils import vorteile as vt
from ph_kundenkarte.utils import wallet_payload as wp

try:  # optional – nur für die Signierung
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives.serialization import pkcs7

    HAS_CRYPTO = True
except Exception:  # noqa: BLE001
    HAS_CRYPTO = False


def _karte(name):
    k = frappe.db.get_value("PH Kundenkarte", name, ["kartennummer", "kunde_name", "stufe", "stufe_seit", "ausgestellt_am", "status"], as_dict=True)
    if not k:
        raise ApiFehler("not_found", 404, _("Karte unbekannt."))
    if k.status != "Aktiv":
        raise ApiFehler("forbidden", 403, _("Karte ist nicht aktiv."))
    return k


def _stufen_text(stufe):
    zeilen = vt.vorteile_fuer_stufe(stufen_vorteile(), stufen_liste(), stufe)
    return "\n".join(f"• {z.get('titel')}" for z in zeilen if z.get("titel"))


def _farbe(stufe):
    return next((s.get("farbe") for s in stufen_liste() if s["name"] == stufe), None)


def apple_pass_json(karte):
    """pass.json (dict) ohne Signatur – auch ohne Zertifikate aufrufbar (Vorschau, Tests)."""
    k = _karte(karte)
    e = einstellungen()
    return wp.apple_pass_json(
        kartennummer=k.kartennummer,
        name=k.kunde_name,
        stufe=k.stufe,
        seit=str(k.stufe_seit or k.ausgestellt_am or ""),
        pass_type_id=e.get("wallet_pass_type_id") or "",
        team_id=e.get("wallet_team_id") or "",
        organisation=e.get("wallet_organisation") or "Platzhirsch",
        farbe=_farbe(k.stufe),
        stufen_text=_stufen_text(k.stufe),
    )


def google_loyalty_object(karte):
    k = _karte(karte)
    e = einstellungen()
    issuer = frappe.conf.get("ph_wallet_google_issuer_id") or ""
    return wp.google_loyalty_object(issuer_id=issuer, class_suffix=e.get("wallet_google_class_suffix") or "platzhirsch_kundenkarte", kartennummer=k.kartennummer, name=k.kunde_name, stufe=k.stufe, seit=str(k.stufe_seit or k.ausgestellt_am or ""), stufen_text=_stufen_text(k.stufe))


def _pruefe_bereit(plattform):
    e = einstellungen()
    if plattform == "apple" and not (e.get("wallet_pass_type_id") and e.get("wallet_team_id")):
        raise ApiFehler("unavailable", 503, _("Apple Wallet ist nicht eingerichtet (Pass Type ID / Team ID)."))
    if not wallet_konfiguriert(plattform):
        raise ApiFehler("unavailable", 503, _("Wallet-Zertifikate sind nicht hinterlegt."))
    if not HAS_CRYPTO:
        raise ApiFehler("unavailable", 503, _("Signierung nicht verfügbar (Paket cryptography fehlt)."))


def apple_pkpass(karte):
    """Signierter .pkpass als Bytes (ZIP: pass.json, manifest.json, signature; Bilder optional aus public/)."""
    _pruefe_bereit("apple")
    pass_json = json.dumps(apple_pass_json(karte), ensure_ascii=False).encode("utf-8")
    dateien = {"pass.json": pass_json}
    for name in ("icon.png", "icon@2x.png", "logo.png", "logo@2x.png"):
        pfad = frappe.get_app_path("ph_kundenkarte", "public", "wallet", name)
        try:
            with open(pfad, "rb") as f:
                dateien[name] = f.read()
        except OSError:
            pass
    manifest = json.dumps(wp.manifest(dateien)).encode("utf-8")
    signatur = _apple_signieren(manifest)
    puffer = io.BytesIO()
    with zipfile.ZipFile(puffer, "w", zipfile.ZIP_DEFLATED) as z:
        for name, inhalt in dateien.items():
            z.writestr(name, inhalt)
        z.writestr("manifest.json", manifest)
        z.writestr("signature", signatur)
    _pass_protokoll(karte, "apple")
    return puffer.getvalue()


def _apple_signieren(manifest):
    cert = x509.load_pem_x509_certificate(str(frappe.conf.get("ph_wallet_apple_cert")).encode())
    key = serialization.load_pem_private_key(str(frappe.conf.get("ph_wallet_apple_key")).encode(), password=None)
    builder = pkcs7.PKCS7SignatureBuilder().set_data(manifest).add_signer(cert, key, hashes.SHA256())
    wwdr = frappe.conf.get("ph_wallet_apple_wwdr")
    if wwdr:
        builder = builder.add_certificate(x509.load_pem_x509_certificate(str(wwdr).encode()))
    return builder.sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.Binary])


def google_save_url(karte):
    """„In Google Wallet speichern“-Link: https://pay.google.com/gp/v/save/<JWT RS256>."""
    _pruefe_bereit("google")
    e = einstellungen()
    konto = frappe.conf.get("ph_wallet_google_service_account")
    konto = json.loads(konto) if isinstance(konto, str) else dict(konto or {})
    issuer = frappe.conf.get("ph_wallet_google_issuer_id")
    k = _karte(karte)
    objekt = google_loyalty_object(karte)
    klasse = wp.google_loyalty_class(issuer_id=issuer, class_suffix=e.get("wallet_google_class_suffix") or "platzhirsch_kundenkarte", organisation=e.get("wallet_organisation") or "Platzhirsch", farbe=_farbe(k.stufe))
    origins = [o.strip() for o in str(e.get("wallet_origins") or "").splitlines() if o.strip()]
    claims = wp.google_save_jwt_claims(service_account_email=konto.get("client_email", ""), origins=origins, loyalty_objects=[objekt], loyalty_classes=[klasse])
    jwt = _jwt_rs256(claims, konto.get("private_key", ""))
    _pass_protokoll(karte, "google")
    return f"https://pay.google.com/gp/v/save/{jwt}"


def _b64url(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _jwt_rs256(claims, private_key_pem):
    kopf = _b64url(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    nutz = _b64url(json.dumps(claims, separators=(",", ":"), ensure_ascii=False).encode())
    key = serialization.load_pem_private_key(str(private_key_pem).encode(), password=None)
    sig = key.sign(f"{kopf}.{nutz}".encode(), padding.PKCS1v15(), hashes.SHA256())
    return f"{kopf}.{nutz}.{_b64url(sig)}"


def _pass_protokoll(karte, plattform):
    try:
        feld = "wallet_apple_erzeugt_am" if plattform == "apple" else "wallet_google_erzeugt_am"
        frappe.db.set_value("PH Kundenkarte", karte, {feld: now_datetime(), "wallet_pass_aktualisiert": now_datetime()}, update_modified=False)
        protokoll(karte, "Pass aktualisiert", hinweis=plattform, automatisch=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_kundenkarte: Pass-Protokoll")
