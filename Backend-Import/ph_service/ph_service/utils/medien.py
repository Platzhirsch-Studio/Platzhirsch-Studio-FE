"""Prüfung hochgeladener Kundendateien (Fotos/Videos/PDF) über den Dateikopf (Magic Bytes) – reine Logik ohne Frappe.

Grund: MIME-Angabe im data:-URL und Dateiendung kommen vom Browser und sind fälschbar. Gespeichert wird nur,
was am Dateikopf als Bild/Video/PDF erkennbar ist; die Endung wird aus dem erkannten Typ gebildet.
"""

BILD = "Bild"
VIDEO = "Video"
PDF = "PDF"

# Endung → Medientyp
ENDUNGEN = {"jpg": BILD, "png": BILD, "webp": BILD, "heic": BILD, "pdf": PDF, "mp4": VIDEO, "mov": VIDEO, "webm": VIDEO}

_FTYP_HEIC = (b"heic", b"heix", b"hevc", b"hevx", b"mif1", b"msf1")
_FTYP_MOV = (b"qt  ",)
_FTYP_MP4 = (b"isom", b"iso2", b"mp41", b"mp42", b"avc1", b"M4V ", b"MSNV", b"dash", b"3gp4", b"3gp5")


def erkennen(roh):
    """Bytes → Endung (jpg/png/webp/heic/pdf/mp4/mov/webm) oder None."""
    if not roh or len(roh) < 12:
        return None
    if roh[:3] == b"\xff\xd8\xff":
        return "jpg"
    if roh[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if roh[:4] == b"RIFF" and roh[8:12] == b"WEBP":
        return "webp"
    if roh[:5] == b"%PDF-":
        return "pdf"
    if roh[:4] == b"\x1a\x45\xdf\xa3":
        return "webm"
    if roh[4:8] == b"ftyp":
        marke = roh[8:12]
        if marke in _FTYP_HEIC:
            return "heic"
        if marke in _FTYP_MOV:
            return "mov"
        if marke in _FTYP_MP4:
            return "mp4"
    return None


def pruefen(roh, bild_max_mb=10, video_max_mb=50, erlaubt=(BILD, VIDEO, PDF)):
    """→ (endung, medientyp) oder ValueError mit deutscher Meldung (API übersetzt in ApiFehler invalid)."""
    if not roh:
        raise ValueError("Datei ist leer.")
    endung = erkennen(roh)
    if not endung:
        raise ValueError("Dateityp nicht erlaubt (JPG, PNG, WEBP, HEIC, PDF, MP4, MOV, WEBM).")
    typ = ENDUNGEN[endung]
    if typ not in erlaubt:
        raise ValueError(f"{typ} ist hier nicht erlaubt.")
    grenze = video_max_mb if typ == VIDEO else bild_max_mb
    if len(roh) > int(grenze) * 1024 * 1024:
        raise ValueError(f"Datei ist größer als {grenze} MB.")
    return endung, typ
