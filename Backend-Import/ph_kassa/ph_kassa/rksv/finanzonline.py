"""FinanzOnline – nur Vorbereitung (keine Schnittstelle im Erstbau; Registrierung macht der Inhaber manuell).

Liefert die Daten, die bei „Registrierkassen → Registrierung einer Registrierkasse / Signaturerstellungseinheit“
in FinanzOnline einzutragen sind, und Hinweise zum Belegcheck (BMF Belegcheck-App: Startbeleg, Jahresbeleg,
Belege nach Ausfall). Rechtsgrundlagen: RKSV §§ 16, 17, 18; § 131b Abs 4 BAO.

Kein Frappe-Import.
"""

from .counter import pruefwert_schluessel

# Registrierkassen-Typ laut FinanzOnline-Formular; Erstbau: Kassen-Software mit externer SEE (A-Trust).
KASSENTYP = "Registrierkasse mit Signaturerstellungseinheit eines Vertrauensdiensteanbieters"
AUSFALL_MELDEFRIST_H = 48  # RKSV § 17 Abs 1 / § 18: Ausfall > 48 h binnen einer Woche melden
JAHRESBELEG_PRUEFUNG_BIS = (2, 15)  # 15. Februar des Folgejahres (BMF-Erlass)


def registrierungsdaten_kasse(kassen_id, aes_key, bezeichnung="", bemerkung=""):
    """Daten für die Kassenregistrierung: Kassen-ID, AES-Schlüssel (Base64 – wird NICHT zurückgegeben,
    nur der Prüfwert), Prüfwert, Kassentyp."""
    return {
        "kassenidentifikationsnummer": kassen_id,
        "bezeichnung": bezeichnung,
        "aes_schluessel_pruefwert": pruefwert_schluessel(aes_key),
        "aes_schluessel_hinweis": "Base64-Schlüssel aus site_config beim Registrieren eingeben; Prüfwert muss übereinstimmen.",
        "kassentyp": KASSENTYP,
        "bemerkung": bemerkung,
    }


def registrierungsdaten_see(zertifikat_seriennummer_hex, vda_id="AT1", art="A-Trust a.sign RK Online"):
    """Daten für die SEE-Registrierung: Art, VDA, Seriennummer (hex + dezimal, FinanzOnline erwartet hex)."""
    sn_hex = (zertifikat_seriennummer_hex or "").lower()
    return {
        "art": art,
        "vertrauensdiensteanbieter": "A-Trust GmbH" if vda_id == "AT1" else vda_id,
        "vda_id": vda_id,
        "zertifikat_seriennummer_hex": sn_hex,
        "zertifikat_seriennummer_dezimal": str(int(sn_hex, 16)) if sn_hex else "",
    }


def belegcheck_hinweis(belegart):
    """Text für die Oberfläche: wann ein Beleg mit der BMF Belegcheck-App zu prüfen ist."""
    if belegart == "Startbeleg":
        return "Startbeleg mit der BMF Belegcheck-App (FinanzOnline-Zugangscode) prüfen – erst danach Kasse auf „Aktiv“ setzen."
    if belegart == "Jahresbeleg":
        return "Jahresbeleg (Dezember) bis spätestens 15. Februar des Folgejahres mit der Belegcheck-App prüfen."
    if belegart == "Sammelbeleg":
        return "Sammelbeleg nach SEE-Ausfall; bei Ausfall > 48 h zusätzlich Ausfall und Wiederinbetriebnahme in FinanzOnline melden."
    if belegart == "Schlussbeleg":
        return "Schlussbeleg: Außerbetriebnahme der Kasse in FinanzOnline melden, DEP vollständig exportieren und archivieren."
    return ""


def ausfall_meldepflichtig(dauer_stunden):
    """RKSV § 17 Abs 1: Ausfall der SEE > 48 Stunden ist über FinanzOnline zu melden (Beginn und Ende)."""
    return float(dauer_stunden or 0) > AUSFALL_MELDEFRIST_H
