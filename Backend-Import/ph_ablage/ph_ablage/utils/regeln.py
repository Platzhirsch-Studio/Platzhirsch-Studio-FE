"""Reine Regeln der Ablage – ohne Frappe, getestet in ph_ablage/tests/test_regeln.py.

Schlüssel-Schema (unveränderlich):  <jahr>/<datei-id>/<version>-<sha8>.<endung>
  Der Dateiname steht nur in der Datenbank (PH Datei.dateiname). Umbenennen, Verschieben und Tags
  ändern deshalb nie etwas im Speicher; ein Anbieterwechsel kopiert nur Objekte mit gleichem Schlüssel.
Vorschauen: vorschau/<jahr>/<datei-id>/<version>-<sha8>.<art-endung>

Rechte-Modus je Ordner: intern (alle internen Benutzer mit Leserecht auf den Bezug), team (Ordner-Mitglieder,
Ersteller und Team des Bezugs, z. B. Berater/Planer/Montageleiter/Projektteam), leitung (nur Leitungsrollen
des Bezugs). Unterordner erben den strengsten Modus der Kette – ein Unterordner kann nie lockerer sein.
"""

import base64
import hashlib
import hmac
import mimetypes
import os
import re
import secrets
from datetime import date, datetime, timedelta

# ── Bezüge ──────────────────────────────────────────────────────────────────────────────────────
# Reihenfolge = Installationsreihenfolge (PLAN.md Abschnitt 2); „frei“ = ohne Bezug (allgemeine Ablage).
ERLAUBTE_BEZUEGE = ("PH Kontakt", "PH Projekt", "PH Lieferant", "PH Mitarbeiter", "PH Servicefall")

# Leitungsrollen je Bezug zusätzlich zu den allgemeinen (PERSONAL ersetzt die allgemeinen – Datenminimierung).
ALLGEMEINE_LEITUNG = ("PH Ablage Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin")
BEZUG_LEITUNG = {
    "PH Kontakt": ("PH CRM Leitung",),
    "PH Projekt": ("PH Projekte Leitung",),
    "PH Lieferant": ("PH Sortiment Leitung",),
    "PH Servicefall": ("PH Service Leitung",),
}
# Personalunterlagen: nur Personal-Leitung, Geschäftsführung, System Manager (nicht Ablage-Leitung/Technik).
PERSONAL_LEITUNG = ("PH Personal Leitung", "PH Geschäftsführung", "System Manager")

# Bereichsrollen, die die Ablage im Kontext ihres Bereichs nutzen (DocType-Rechte lesen/schreiben/anlegen).
BEREICHSROLLEN = (
    "PH CRM Mitarbeiter", "PH CRM Leitung", "PH Projekte Mitarbeiter", "PH Projekte Leitung",
    "PH Sortiment Mitarbeiter", "PH Sortiment Leitung", "PH Service Mitarbeiter", "PH Service Leitung",
    "PH Personal Leitung",
)

# Team-Felder je Bezug: (einfache User-Felder, [(Tabellenfeld, User-Feld)])
TEAM_FELDER = {
    "PH Projekt": (("berater", "planer", "montageleiter"), (("team", "user"),)),
    "PH Kontakt": (("berater",), ()),
    "PH Servicefall": (("verantwortlich",), ()),
    "PH Lieferant": ((), ()),
    "PH Mitarbeiter": ((), ()),
}

MODI = ("intern", "team", "leitung")
_STRENGE = {"intern": 0, "team": 1, "leitung": 2}


def effektiver_modus(kette):
    """Strengster Modus einer Ordnerkette (Wurzel → Ordner); leere Einträge erben. Standard intern."""
    best = "intern"
    for m in kette or []:
        m = (m or "").strip().lower()
        if m in _STRENGE and _STRENGE[m] > _STRENGE[best]:
            best = m
    return best


def lockerer(alt, neu):
    """True, wenn `neu` als eigener Modus lockerer ist als `alt` (leer = erben = intern)."""
    return _STRENGE[effektiver_modus([neu])] < _STRENGE[effektiver_modus([alt])]


def leitung_rollen(bezug_doctype):
    if bezug_doctype == "PH Mitarbeiter":
        return set(PERSONAL_LEITUNG)
    return set(ALLGEMEINE_LEITUNG) | set(BEZUG_LEITUNG.get(bezug_doctype or "", ()))


def ist_leitung(rollen, bezug_doctype=None, benutzer=None):
    if benutzer == "Administrator":
        return True
    return bool(set(rollen or ()) & leitung_rollen(bezug_doctype))


def darf_zugreifen(modus, ist_leitung_, ist_team, bezug_lesbar=True, bezug_doctype=None):
    """Zentrale Entscheidung (Lesen = Schreiben im Ordner; Löschen/Endgültig regeln die Aufrufer).

    - Leitung des Bezugs darf immer.
    - Personalunterlagen (PH Mitarbeiter) nur Leitung – unabhängig vom Modus.
    - Sonst muss der Bezug lesbar sein (Frappe-Recht auf PH Projekt/PH Kontakt …), dann nach Modus.
    """
    if ist_leitung_:
        return True
    if bezug_doctype == "PH Mitarbeiter":
        return False
    if not bezug_lesbar:
        return False
    modus = effektiver_modus([modus])
    if modus == "intern":
        return True
    if modus == "team":
        return bool(ist_team)
    return False


def team_aus_werten(werte, tabellen=None):
    """Benutzer aus Feldwerten {feld: user} und Tabellen {tabelle: [user, …]} → set (ohne Leere/Guest)."""
    out = {str(v) for v in (werte or {}).values() if v}
    for liste in (tabellen or {}).values():
        out |= {str(v) for v in liste or [] if v}
    out.discard("Guest")
    return out


# ── Dateinamen und Endungen ─────────────────────────────────────────────────────────────────────
STANDARD_GESPERRT = (
    "exe", "msi", "msp", "bat", "cmd", "com", "scr", "pif", "cpl", "dll", "sys", "ps1", "psm1", "vbs", "vbe",
    "js", "jse", "wsf", "wsh", "hta", "jar", "lnk", "reg", "app", "sh", "apk", "iso", "img", "html", "htm", "svgz",
)
CAD_ENDUNGEN = ("dxf", "dwg", "skp", "3dm", "ifc", "step", "stp", "iges", "igs", "stl", "obj", "fbx", "3ds", "dwf", "rvt", "pln")
BILD_ENDUNGEN = ("jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "heic", "heif", "avif")
OFFICE_ENDUNGEN = ("doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf")
VIDEO_ENDUNGEN = ("mp4", "mov", "m4v", "webm", "avi", "mkv")
AUDIO_ENDUNGEN = ("mp3", "m4a", "wav", "ogg", "aac", "flac")
TEXT_ENDUNGEN = ("txt", "csv", "md", "json", "xml", "log")

MIME_EXTRA = {
    "dwg": "application/acad", "dxf": "image/vnd.dxf", "skp": "application/vnd.sketchup.skp", "3dm": "model/vnd.3dm",
    "ifc": "application/x-step", "step": "model/step", "stp": "model/step", "stl": "model/stl", "obj": "model/obj",
    "heic": "image/heic", "heif": "image/heif", "avif": "image/avif", "webp": "image/webp", "md": "text/markdown",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

_UNERLAUBT = re.compile(r'[\x00-\x1f\x7f<>:"/\\|?*]')
_RESERVIERT = {"con", "prn", "aux", "nul", *(f"com{i}" for i in range(1, 10)), *(f"lpt{i}" for i in range(1, 10))}
MAX_DATEINAME = 180


def endung(dateiname):
    """Kleingeschriebene Endung ohne Punkt; '' ohne Endung. 'Plan.final.DWG' → 'dwg'."""
    base = os.path.basename(str(dateiname or "").replace("\\", "/"))
    if "." not in base.strip("."):
        return ""
    e = base.rsplit(".", 1)[1].strip().lower()
    return e if re.fullmatch(r"[a-z0-9]{1,10}", e) else ""


def dateiname_bereinigen(dateiname):
    """Pfadanteile, Steuer- und Sonderzeichen entfernen, Länge begrenzen (Endung bleibt). Leer → ValueError."""
    s = str(dateiname or "").replace("\\", "/").split("/")[-1]
    s = _UNERLAUBT.sub("_", s)
    s = re.sub(r"\s+", " ", s).strip().strip(".").strip()
    if not s:
        raise ValueError("dateiname_leer")
    stamm, punkt, end = s.rpartition(".")
    if not punkt:
        stamm, end = s, ""
    if stamm.lower() in _RESERVIERT:
        stamm = f"_{stamm}"
    if len(s) > MAX_DATEINAME:
        rest = MAX_DATEINAME - (len(end) + 1 if end else 0)
        stamm = stamm[:max(rest, 1)].rstrip()
    return f"{stamm}.{end}" if end else stamm


def endungen_liste(text):
    """'pdf, .DOCX\\n dwg' → {'pdf', 'docx', 'dwg'}."""
    teile = re.split(r"[\s,;]+", str(text or ""))
    return {t.strip().lstrip(".").lower() for t in teile if re.fullmatch(r"\.?[A-Za-z0-9]{1,10}", t.strip())}


def endung_erlaubt(end, erlaubt=None, gesperrt=None):
    """(ok, grund). erlaubt leer/None = alle außer gesperrt; gesperrt None = STANDARD_GESPERRT."""
    end = (end or "").lower()
    gesperrt = set(STANDARD_GESPERRT) if gesperrt is None else set(gesperrt)
    if end in gesperrt:
        return False, "gesperrt"
    if erlaubt and end not in set(erlaubt):
        return False, "nicht_erlaubt"
    return True, None


def mime_fuer(dateiname, angegeben=None):
    end = endung(dateiname)
    if end in MIME_EXTRA:
        return MIME_EXTRA[end]
    geraten = mimetypes.guess_type(f"x.{end}")[0] if end else None
    if geraten:
        return geraten
    a = str(angegeben or "").split(";")[0].strip().lower()
    return a if re.fullmatch(r"[a-z0-9.+-]+/[a-z0-9.+-]+", a) else "application/octet-stream"


def vorschau_art(end):
    end = (end or "").lower()
    if end in BILD_ENDUNGEN:
        return "bild"
    if end == "pdf":
        return "pdf"
    if end in OFFICE_ENDUNGEN:
        return "office"
    if end in CAD_ENDUNGEN:
        return "cad"
    if end in VIDEO_ENDUNGEN:
        return "video"
    if end in AUDIO_ENDUNGEN:
        return "audio"
    if end in TEXT_ENDUNGEN:
        return "text"
    return "keine"


def groesse_text(n):
    n = int(n or 0)
    for einheit, f in (("GB", 1024 ** 3), ("MB", 1024 ** 2), ("KB", 1024)):
        if n >= f:
            return f"{n / f:.1f} {einheit}".replace(".", ",")
    return f"{n} B"


# ── Speicher-Schlüssel ──────────────────────────────────────────────────────────────────────────
_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
_SHA_RE = re.compile(r"^[0-9a-f]{64}$")
_KEY_RE = re.compile(r"^(?:vorschau/)?(\d{4})/([A-Za-z0-9][A-Za-z0-9._-]{0,79})/(\d{1,6})-([0-9a-f]{8})\.([a-z0-9]{1,10})$")


def schluessel(jahr, datei_id, version, sha256, end):
    """Unveränderlicher Speicher-Schlüssel. Wirft ValueError bei ungültigen Teilen (nie stille Korrektur)."""
    jahr = int(jahr)
    version = int(version)
    sha = str(sha256 or "").lower()
    if not 2000 <= jahr <= 2999:
        raise ValueError("jahr")
    if not _ID_RE.match(str(datei_id or "")) or ".." in str(datei_id):
        raise ValueError("datei_id")
    if version < 1:
        raise ValueError("version")
    if not _SHA_RE.match(sha):
        raise ValueError("sha256")
    end = (end or "").lower()
    if not re.fullmatch(r"[a-z0-9]{1,10}", end):
        end = "bin"
    return f"{jahr}/{datei_id}/{version}-{sha[:8]}.{end}"


def schluessel_zerlegen(s):
    m = _KEY_RE.match(str(s or ""))
    if not m:
        return None
    return {"jahr": int(m.group(1)), "datei_id": m.group(2), "version": int(m.group(3)), "sha8": m.group(4), "endung": m.group(5), "vorschau": str(s).startswith("vorschau/")}


def ist_gueltiger_schluessel(s):
    return schluessel_zerlegen(s) is not None


def vorschau_schluessel(s, art_endung):
    teile = schluessel_zerlegen(s)
    if not teile or teile["vorschau"]:
        raise ValueError("schluessel")
    stamm = str(s).rsplit(".", 1)[0]
    art_endung = (art_endung or "png").lower()
    if not re.fullmatch(r"[a-z0-9]{1,10}", art_endung):
        raise ValueError("art_endung")
    return f"vorschau/{stamm}.{art_endung}"


def mit_praefix(praefix, s):
    """Optionales Präfix (PH Ablage Einstellungen.speicher_praefix, z. B. 'platzhirsch/') vor jedem Schlüssel."""
    p = str(praefix or "").strip().strip("/")
    if p and (not re.fullmatch(r"[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*", p) or any(t in (".", "..") for t in p.split("/"))):
        raise ValueError("praefix")
    return f"{p}/{s}" if p else s


_ENDE_RE = re.compile(r"((?:vorschau/)?\d{4}/[A-Za-z0-9][A-Za-z0-9._-]{0,79}/\d{1,6}-[0-9a-f]{8}\.[a-z0-9]{1,10})$")


def praefix_trennen(voll):
    """'platzhirsch/2026/X/1-ab12cd34.pdf' → ('platzhirsch', '2026/X/1-ab12cd34.pdf'); fremde Schlüssel → (None, None)."""
    m = _ENDE_RE.search(str(voll or ""))
    if not m:
        return None, None
    return str(voll)[: m.start()].rstrip("/") or "", m.group(1)


# ── Aufbewahrung ────────────────────────────────────────────────────────────────────────────────
# Fristen sind Vorschläge (Steuerberater bestätigen): BAO § 132 Abs. 1 – 7 Jahre ab Schluss des Kalenderjahres.
AUFBEWAHRUNG = {
    "Allgemein": {"jahre": 0, "sperre": False, "nur_leitung": False, "hinweis": "keine gesetzliche Frist"},
    "Beleg": {"jahre": 7, "sperre": True, "nur_leitung": True, "hinweis": "BAO § 132: 7 Jahre ab Ende des Kalenderjahres, Löschsperre"},
    "Personal": {"jahre": 7, "sperre": False, "nur_leitung": True, "hinweis": "Lohn-/Personalunterlagen 7 Jahre (BAO), nur Personal-Leitung löscht"},
    "Projekt": {"jahre": 7, "sperre": False, "nur_leitung": False, "hinweis": "Projektunterlagen: Gewährleistung/Schadenersatz – Empfehlung 7 Jahre"},
    "Marketing": {"jahre": 3, "sperre": False, "nur_leitung": False, "hinweis": "Marketingmaterial: Empfehlung 3 Jahre"},
}
KLASSEN = tuple(AUFBEWAHRUNG)


def _als_datum(d):
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if not d:
        return None
    return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()


def aufbewahren_bis(klasse, belegdatum):
    """31.12. des Jahres (Belegjahr + Frist); None ohne Frist/Datum."""
    regel = AUFBEWAHRUNG.get(klasse or "Allgemein") or AUFBEWAHRUNG["Allgemein"]
    d = _als_datum(belegdatum)
    if not regel["jahre"] or not d:
        return None
    return date(d.year + regel["jahre"], 12, 31)


def loeschen_erlaubt(klasse, bis, heute, ist_leitung_=False):
    """(ok, grund) für Papierkorb/endgültiges Löschen."""
    regel = AUFBEWAHRUNG.get(klasse or "Allgemein") or AUFBEWAHRUNG["Allgemein"]
    bis = _als_datum(bis)
    heute = _als_datum(heute)
    if regel["sperre"] and bis and heute <= bis:
        return False, "aufbewahrung"
    if regel["nur_leitung"] and not ist_leitung_:
        return False, "nur_leitung"
    return True, None


def papierkorb_bis(geloescht_am, tage):
    d = _als_datum(geloescht_am)
    return d + timedelta(days=max(int(tage or 30), 1)) if d else None


def papierkorb_faellig(geloescht_am, tage, heute):
    bis = papierkorb_bis(geloescht_am, tage)
    return bool(bis and _als_datum(heute) >= bis)


# ── Ordnervorlagen ──────────────────────────────────────────────────────────────────────────────
# pfad: Unterordner mit " > " (z. B. "07 Fotos > Baustelle"); modus/aufbewahrung leer = erben bzw. Allgemein.
STANDARD_VORLAGEN = {
    "PH Projekt": [
        {"pfad": "01 Aufmaß"},
        {"pfad": "02 Planung & Handzeichnung"},
        {"pfad": "03 Renderings"},
        {"pfad": "04 Angebote & Verträge", "aufbewahrung": "Beleg"},
        {"pfad": "05 Herstellerunterlagen"},
        {"pfad": "06 Montage & Abnahme"},
        {"pfad": "07 Fotos"},
        {"pfad": "08 Service"},
    ],
    "PH Kontakt": [
        {"pfad": "01 Korrespondenz"},
        {"pfad": "02 Angebote & Verträge", "aufbewahrung": "Beleg"},
        {"pfad": "03 Pläne & Fotos"},
    ],
    "PH Lieferant": [
        {"pfad": "01 Verträge & Konditionen", "aufbewahrung": "Beleg"},
        {"pfad": "02 Preislisten & Kataloge"},
        {"pfad": "03 Datenblätter & Zertifikate"},
        {"pfad": "04 Korrespondenz"},
    ],
    "PH Mitarbeiter": [
        {"pfad": "01 Vertrag", "modus": "leitung", "aufbewahrung": "Personal"},
        {"pfad": "02 Lohn & Abrechnung", "modus": "leitung", "aufbewahrung": "Personal"},
        {"pfad": "03 Zeugnisse & Nachweise", "modus": "leitung", "aufbewahrung": "Personal"},
        {"pfad": "04 Schulungen", "modus": "leitung", "aufbewahrung": "Personal"},
    ],
    "PH Servicefall": [
        {"pfad": "01 Fotos & Videos"},
        {"pfad": "02 Herstellerkorrespondenz"},
        {"pfad": "03 Berichte"},
    ],
}
# Modus der Bezugswurzel je Bezug (PH Mitarbeiter immer leitung)
WURZEL_MODUS = {"PH Mitarbeiter": "leitung"}


def pfad_teile(pfad):
    teile = [t.strip() for t in str(pfad or "").split(">")]
    teile = [re.sub(r"\s+", " ", t)[:140] for t in teile if t]
    if not teile:
        raise ValueError("pfad")
    return tuple(teile)


def ordner_plan(vorlage_zeilen, vorhandene=()):
    """Vorlage → anzulegende Ordner in Eltern-zuerst-Reihenfolge (idempotent).

    vorlage_zeilen: [{pfad, modus?, aufbewahrung?, farbe?, reihenfolge?}]; vorhandene: Pfad-Tupel, die es schon gibt.
    → [{"pfad": (…), "titel", "eltern": (…) | (), "modus", "aufbewahrung", "farbe"}]; Zwischenordner werden ergänzt.
    """
    gesehen = {tuple(v) for v in vorhandene or ()}
    plan, geplant = [], set()
    zeilen = sorted(enumerate(vorlage_zeilen or []), key=lambda iz: (int(iz[1].get("reihenfolge") or 0), iz[0]))
    for _i, z in zeilen:
        try:
            teile = pfad_teile(z.get("pfad"))
        except ValueError:
            continue
        for tiefe in range(1, len(teile) + 1):
            p = teile[:tiefe]
            if p in gesehen or p in geplant:
                continue
            letzte = tiefe == len(teile)
            modus = (z.get("modus") or "").strip().lower() if letzte else ""
            plan.append({
                "pfad": p, "titel": p[-1], "eltern": p[:-1],
                "modus": modus if modus in MODI else "",
                "aufbewahrung": (z.get("aufbewahrung") or "") if letzte else "",
                "farbe": (z.get("farbe") or "") if letzte else "",
            })
            geplant.add(p)
    return plan


# ── Tags, Suche, Sortierung ─────────────────────────────────────────────────────────────────────
MAX_TAGS = 20


def tags_normalisieren(tags):
    """Liste/kommagetrennt → eindeutige Tags (≤ 20, je ≤ 40 Zeichen, ohne Komma), Reihenfolge bleibt."""
    if isinstance(tags, str):
        tags = re.split(r"[,;\n]+", tags)
    out, gesehen = [], set()
    for t in tags or []:
        t = re.sub(r"\s+", " ", str(t or "").replace(",", " ")).strip().lstrip("#")[:40]
        if t and t.lower() not in gesehen:
            gesehen.add(t.lower())
            out.append(t)
        if len(out) >= MAX_TAGS:
            break
    return out


def tags_text(tags):
    return ", ".join(tags_normalisieren(tags))


def suchbegriffe(q, max_begriffe=6):
    teile = [t for t in re.split(r"\s+", str(q or "").strip()) if len(t) >= 2]
    return [t[:60] for t in teile[:max_begriffe]]


SORTIERUNG = {
    "name": "dateiname asc", "-name": "dateiname desc",
    "groesse": "groesse asc", "-groesse": "groesse desc",
    "geaendert": "modified asc", "-geaendert": "modified desc",
    "erstellt": "creation asc", "-erstellt": "creation desc",
    "endung": "endung asc, dateiname asc",
}


def sortierung(sort):
    return SORTIERUNG.get(str(sort or "name").strip(), SORTIERUNG["name"])


def seite_und_groesse(seite, groesse, max_groesse=200):
    try:
        seite = max(int(seite or 1), 1)
    except (TypeError, ValueError):
        seite = 1
    try:
        groesse = min(max(int(groesse or 50), 1), max_groesse)
    except (TypeError, ValueError):
        groesse = 50
    return seite, groesse, (seite - 1) * groesse


# ── Token und Passwörter (Freigabelinks, Upload-/Download-Token) ────────────────────────────────
PBKDF2_ITER = 200_000


def neues_token(n=32):
    return secrets.token_urlsafe(n)


def token_hash(token):
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def passwort_hash(passwort, salz=None, iterationen=PBKDF2_ITER):
    """'pbkdf2_sha256$<iter>$<salz-b64>$<hash-b64>' – Passwörter von Freigabelinks verlassen nie den Server."""
    if not passwort:
        raise ValueError("passwort")
    salz = salz or secrets.token_bytes(16)
    roh = hashlib.pbkdf2_hmac("sha256", str(passwort).encode(), salz, iterationen)
    return f"pbkdf2_sha256${iterationen}${base64.b64encode(salz).decode()}${base64.b64encode(roh).decode()}"


def passwort_passt(passwort, gespeichert):
    try:
        verfahren, it, salz, soll = str(gespeichert or "").split("$")
        if verfahren != "pbkdf2_sha256":
            return False
        ist = hashlib.pbkdf2_hmac("sha256", str(passwort or "").encode(), base64.b64decode(salz), int(it))
        return hmac.compare_digest(base64.b64encode(ist).decode(), soll)
    except (ValueError, TypeError):
        return False


def freigabe_zustand(status, ablauf, jetzt, zaehler=0, maximum=0):
    """'ok' | 'widerrufen' | 'abgelaufen' | 'aufgebraucht'."""
    if status == "Widerrufen":
        return "widerrufen"
    if ablauf and jetzt >= ablauf:
        return "abgelaufen"
    if maximum and int(zaehler or 0) >= int(maximum):
        return "aufgebraucht"
    return "ok"


# ── Upload in Teilen ────────────────────────────────────────────────────────────────────────────
def chunk_pruefen(offset, laenge, erhalten, gesamt, max_chunk):
    """Fortlaufender Upload: offset muss = bereits erhalten sein, Teil ≤ max_chunk, Summe ≤ gesamt → (ok, code)."""
    if int(laenge) <= 0:
        return False, "leer"
    if int(laenge) > int(max_chunk):
        return False, "zu_gross"
    if int(offset) != int(erhalten):
        return False, "offset"
    if int(erhalten) + int(laenge) > int(gesamt):
        return False, "ueber_groesse"
    return True, None


def sha256_hex_gueltig(s):
    return bool(_SHA_RE.match(str(s or "").lower()))


def sha256_b64(hexwert):
    """Hex → Base64 (Header x-amz-checksum-sha256)."""
    return base64.b64encode(bytes.fromhex(hexwert)).decode()
