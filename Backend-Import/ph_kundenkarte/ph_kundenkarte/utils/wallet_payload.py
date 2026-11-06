"""Wallet-Pass-Nutzdaten (Apple pass.json, Google LoyaltyObject) – ohne Frappe-Import, ohne Krypto.

Die Signierung übernimmt ph_kundenkarte/ph_kundenkarte/wallet.py (Adapter mit frappe.conf-Prüfung).
Hier nur reine Datenstrukturen, damit sie per unittest ohne Site prüfbar sind.

Kein Geldwert im Pass: keine Punkte, kein Guthaben – nur Name, Stufe, Mitglied seit, Kartennummer (QR).
"""

import hashlib

FARBE_TINTE = "rgb(48, 55, 62)"
FARBE_SAND = "rgb(138, 122, 102)"
FARBE_WEISS = "rgb(255, 255, 255)"


def _hex_zu_rgb(farbe, standard):
    f = str(farbe or "").strip().lstrip("#")
    if len(f) == 6:
        try:
            r, g, b = int(f[0:2], 16), int(f[2:4], 16), int(f[4:6], 16)
            return f"rgb({r}, {g}, {b})"
        except ValueError:
            pass
    return standard


def seriennummer(kartennummer):
    """Stabile Pass-Seriennummer aus der Kartennummer (keine Personendaten, nicht umkehrbar)."""
    return hashlib.sha256(f"ph-kk:{kartennummer}".encode("utf-8")).hexdigest()[:24]


def apple_pass_json(*, kartennummer, name, stufe, seit, pass_type_id, team_id, organisation, beschreibung="Platzhirsch Kundenkarte", farbe=None, web_service_url=None, auth_token=None, stufen_text=None):
    """pass.json für einen Apple-Wallet storeCard-Pass (ohne Signatur).

    seit: ISO-Datum (YYYY-MM-DD) oder leer. farbe: Hex der Stufe (optional).
    web_service_url/auth_token nur, wenn Pass-Aktualisierung über die API eingerichtet ist.
    """
    daten = {
        "formatVersion": 1,
        "passTypeIdentifier": pass_type_id,
        "teamIdentifier": team_id,
        "organizationName": organisation or "Platzhirsch",
        "serialNumber": seriennummer(kartennummer),
        "description": beschreibung,
        "logoText": "PLATZHIRSCH",
        "foregroundColor": FARBE_WEISS,
        "backgroundColor": _hex_zu_rgb(farbe, FARBE_TINTE),
        "labelColor": FARBE_WEISS,
        "barcodes": [
            {"format": "PKBarcodeFormatQR", "message": kartennummer, "messageEncoding": "iso-8859-1", "altText": kartennummer}
        ],
        "barcode": {"format": "PKBarcodeFormatQR", "message": kartennummer, "messageEncoding": "iso-8859-1", "altText": kartennummer},
        "storeCard": {
            "headerFields": [{"key": "stufe", "label": "STUFE", "value": stufe or ""}],
            "primaryFields": [{"key": "name", "label": "KARTE", "value": name or ""}],
            "secondaryFields": [
                {"key": "nummer", "label": "KARTENNUMMER", "value": kartennummer},
                {"key": "seit", "label": "MITGLIED SEIT", "value": seit or "", "textAlignment": "PKTextAlignmentRight"},
            ],
            "backFields": [
                {"key": "vorteile", "label": "Ihre Vorteile", "value": stufen_text or ""},
                {"key": "hinweis", "label": "Hinweis", "value": "Die Karte ist personengebunden und hat keinen Geldwert. Vorteile sind Leistungen laut aktueller Übersicht."},
            ],
        },
    }
    if web_service_url and auth_token:
        daten["webServiceURL"] = web_service_url
        daten["authenticationToken"] = auth_token
    return daten


def google_loyalty_class(*, issuer_id, class_suffix, organisation, programm="Platzhirsch Kundenkarte", farbe=None):
    """LoyaltyClass (einmal je Aussteller; Pflichtfelder laut Google-Wallet-Dokumentation)."""
    return {
        "id": f"{issuer_id}.{class_suffix}",
        "issuerName": organisation or "Platzhirsch",
        "programName": programm,
        "reviewStatus": "UNDER_REVIEW",
        "hexBackgroundColor": "#" + str(farbe or "30373e").lstrip("#"),
    }


def google_loyalty_object(*, issuer_id, class_suffix, kartennummer, name, stufe, seit, stufen_text=None):
    """LoyaltyObject für Google Wallet (ohne JWT). Kein Punktestand (loyaltyPoints) – Stufe 1 ohne Geldwert."""
    objekt_id = f"{issuer_id}.{seriennummer(kartennummer)}"
    return {
        "id": objekt_id,
        "classId": f"{issuer_id}.{class_suffix}",
        "state": "ACTIVE",
        "accountId": seriennummer(kartennummer),
        "accountName": name or "",
        "barcode": {"type": "QR_CODE", "value": kartennummer, "alternateText": kartennummer},
        "textModulesData": [
            {"id": "stufe", "header": "Stufe", "body": stufe or ""},
            {"id": "seit", "header": "Mitglied seit", "body": seit or ""},
            {"id": "vorteile", "header": "Ihre Vorteile", "body": stufen_text or ""},
        ],
    }


def google_save_jwt_claims(*, service_account_email, origins, loyalty_objects, loyalty_classes=None):
    """Claims des „Save to Google Wallet“-JWT (Signierung in wallet.py)."""
    nutzlast = {"loyaltyObjects": loyalty_objects}
    if loyalty_classes:
        nutzlast["loyaltyClasses"] = loyalty_classes
    return {"iss": service_account_email, "aud": "google", "typ": "savetowallet", "origins": list(origins or []), "payload": nutzlast}


def manifest(dateien):
    """Apple-Manifest: Dateiname → SHA-1 des Inhalts (Vorgabe des pkpass-Formats)."""
    return {name: hashlib.sha1(inhalt).hexdigest() for name, inhalt in dateien.items()}  # noqa: S324 – Formatvorgabe Apple
