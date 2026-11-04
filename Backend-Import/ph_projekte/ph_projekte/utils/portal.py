"""Reine Logik des Kundenportals (ohne Frappe-Import, testbar mit unittest).

Quellen auf der Website:
  src/lib/portal/constants.js        PROJECT_STEPS, DOCUMENT_TYPES, APPOINTMENT_KINDS, TRADES
  src/lib/portal/adapters/interface.js  Form der Antworten (Project, Rendering, Message, …)
  src/components/Portal/Planung/schemas.js  feedbackEntrySchema, VOICE_TYPES, VOICE_MAX_BYTES
  src/lib/portal/tagebuch/config.js  PHASEN, LIMITS, REFERENZ_PHASEN
"""

import hashlib
import hmac
import re
import secrets

# PH Projekt.status ↔ Website-Schritt (PROJECT_STEPS). Abgeschlossen zählt als „uebergabe erledigt“.
PHASEN = ["Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen", "Abgebrochen"]
STEP_KEYS = ["anfrage", "planung", "angebot", "auftrag", "bestellung", "lieferung", "montage", "uebergabe"]
PHASE_ZU_STEP = dict(zip(PHASEN[:8], STEP_KEYS))
PHASE_ZU_STEP["Abgeschlossen"] = "uebergabe"
PHASE_ZU_STEP["Abgebrochen"] = "anfrage"

FEEDBACK_ARTEN = ("kommentar", "vorschlag", "annotation", "vote", "freigabe", "sprachnachricht")
VOTES = ("up", "down", "none")
TEXT_MAX = {"kommentar": 2000, "vorschlag": 2000, "annotation": 1000, "freigabe": 1000, "sprachnachricht": 0, "vote": 0}

VOICE_TYPES = {"audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav"}
VOICE_MAX_BYTES = 5 * 1024 * 1024
VOICE_MAX_SECONDS = 180

TAGEBUCH_PHASEN = ("skizze", "modell", "rendering", "lieferung", "montage", "vorher", "nachher")
TAGEBUCH_NUR_TEAM = ("skizze", "modell", "rendering")
TAGEBUCH_ECHT_PFLICHT = ("skizze", "modell")
REFERENZ_PHASEN = ("rendering", "lieferung", "montage", "vorher", "nachher")
REFERENZ_AKTIV = ("Eingereicht", "Veroeffentlicht")  # höchstens eine je Projekt
REFERENZ_STATUS_WEB = {"Eingereicht": "eingereicht", "Veroeffentlicht": "veroeffentlicht", "Abgelehnt": "abgelehnt", "Widerrufen": "widerrufen"}

GEWERK_ZU_TRADE = {"Tischler": "tischler", "Elektriker": "elektriker", "Installateur": "installateur", "Steinmetz": "steinmetz", "Maler": "maler", "Bodenleger": "bodenleger", "Sonstige": "tischler"}
GEWERK_STATUS_WEB = {"Offen": "offen", "Angefragt": "offen", "Geplant": "geplant", "In Arbeit": "in_arbeit", "Erledigt": "erledigt", "Abgesagt": "offen"}

ID_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,80}$")
FOTO_ID_RE = re.compile(r"^f-[a-z0-9]{10}$")
FREIGABE_ID_RE = re.compile(r"^fg-[a-z0-9]{10}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_ZUFALL = "abcdefghijklmnopqrstuvwxyz0123456789"

# Adress-Erkennung wie src/lib/content/projekte.js istAdresse(): Straßenwörter, 4–5-stellige Zahlen, Hausnummer am Ende.
_ADRESSE_RE = re.compile(r"(stra(ß|ss)e|gasse|weg\b|platz\b|allee|\b\d{4,5}\b|\s\d{1,4}[a-z]?$)", re.I)


def ist_adresse(text):
    return bool(_ADRESSE_RE.search(str(text or "")))


def steps_fuer_phase(status, verlauf=None, termine=None):
    """Immer alle 8 Schritte in Reihenfolge: state erledigt/aktiv/offen, date aus Verlauf oder geplanten Terminen.

    verlauf: {phase: iso}  termine: {step_key: iso} (geplante Daten für offene Schritte)."""
    verlauf = verlauf or {}
    termine = termine or {}
    aktiv = PHASE_ZU_STEP.get(status, "anfrage")
    idx = STEP_KEYS.index(aktiv)
    abgeschlossen = status == "Abgeschlossen"
    steps = []
    for i, key in enumerate(STEP_KEYS):
        if i < idx or (abgeschlossen and i == idx):
            state = "erledigt"
        elif i == idx:
            state = "aktiv"
        else:
            state = "offen"
        phase = PHASEN[i]
        steps.append({"key": key, "state": state, "date": verlauf.get(phase) or termine.get(key)})
    return steps


def pin_gueltig(x, y):
    try:
        x, y = float(x), float(y)
    except (TypeError, ValueError):
        return False
    return 0 <= x <= 100 and 0 <= y <= 100


def feedback_pruefen(eintrag):
    """Validiert einen Feedback-Eintrag nach feedbackEntrySchema. → (ok, fehlertext)."""
    art = eintrag.get("kind") or eintrag.get("art")
    if art not in FEEDBACK_ARTEN:
        return False, "kind"
    if not ID_RE.match(str(eintrag.get("projectId") or "")):
        return False, "projectId"
    rid = eintrag.get("renderingId")
    if rid and not ID_RE.match(str(rid)):
        return False, "renderingId"
    if art in ("annotation", "vote", "freigabe") and not rid:
        return False, "renderingId"
    text = str(eintrag.get("body") or "").strip()
    if art in ("kommentar", "vorschlag", "annotation") and not text:
        return False, "body"
    if TEXT_MAX[art] and len(text) > TEXT_MAX[art]:
        return False, "body"
    if art == "annotation":
        punkt = eintrag.get("point") or {}
        if not pin_gueltig(punkt.get("x"), punkt.get("y")):
            return False, "point"
    if art == "vote" and eintrag.get("vote") not in VOTES:
        return False, "vote"
    if art == "freigabe" and eintrag.get("confirm") is not True:
        return False, "confirm"
    if art == "sprachnachricht":
        try:
            dauer = float(eintrag.get("durationSec") or 0)
        except (TypeError, ValueError):
            return False, "durationSec"
        if not 0.5 <= dauer <= VOICE_MAX_SECONDS:
            return False, "durationSec"
        if eintrag.get("consent") not in ("ja", True):
            return False, "consent"
    return True, ""


def audio_pruefen(mime, groesse, max_bytes=VOICE_MAX_BYTES):
    """→ Dateiendung oder None (Typ nicht erlaubt / zu groß / zu klein)."""
    ext = VOICE_TYPES.get(str(mime or "").split(";")[0].strip().lower())
    if not ext or groesse < 512 or groesse > max_bytes:
        return None
    return ext


def audio_signatur_ok(daten, ext):
    """Containersignatur muss zum Typ passen (wie src/app/api/portal/feedback/voice/route.js)."""
    b = bytes(daten[:12])
    if len(b) < 12:
        return False
    if ext == "webm":
        return b[:4] == b"\x1a\x45\xdf\xa3"
    if ext == "ogg":
        return b[:4] == b"OggS"
    if ext == "m4a":
        return b[4:8] == b"ftyp"
    if ext == "mp3":
        return b[:3] == b"ID3" or (b[0] == 0xFF and (b[1] & 0xE0) == 0xE0)
    if ext == "wav":
        return b[:4] == b"RIFF" and b[8:12] == b"WAVE"
    return False


def neuer_token():
    """Kunden-Token für die Website-Session (nur der Hash wird gespeichert)."""
    return secrets.token_urlsafe(32)


def token_hash(token):
    # Gleiche Konvention wie ph_core.api.token_hash (ph_faktura/ph_service): sha256-Hex des Klartext-Tokens, kein
    # Präfix – ein Portal-Token gilt damit für alle Portal-Methoden der Familie.
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def token_passt(token, gespeicherter_hash):
    if not token or not gespeicherter_hash:
        return False
    return hmac.compare_digest(token_hash(token), str(gespeicherter_hash))


def neue_foto_id(zufall=None):
    return "f-" + (zufall or "".join(secrets.choice(_ZUFALL) for _ in range(10)))


def neue_freigabe_id(zufall=None):
    return "fg-" + (zufall or "".join(secrets.choice(_ZUFALL) for _ in range(10)))


def tagebuch_upload_erlaubt(phase, rolle, echt_bestaetigt):
    """→ (ok, grund). Spec: Skizze/Modell/Rendering nur Team; Skizze/Modell nur echt."""
    if phase not in TAGEBUCH_PHASEN:
        return False, "phase"
    if phase in TAGEBUCH_NUR_TEAM and rolle != "team":
        return False, "nur_team"
    if phase in TAGEBUCH_ECHT_PFLICHT and not echt_bestaetigt:
        return False, "echt"
    return True, ""


def referenz_veroeffentlichbar(ref):
    """Pflichtfelder für „Veröffentlichen“ (projektSchema der Website). → Liste fehlender Felder."""
    fehlt = []
    if ref.get("beispiel"):
        fehlt.append("beispiel")
    for feld in ("slug", "titel", "typologie", "zeitraum_von", "zeitraum_bis", "ausgangslage"):
        if not str(ref.get(feld) or "").strip():
            fehlt.append(feld)
    if ref.get("slug") and not SLUG_RE.match(str(ref["slug"])):
        fehlt.append("slug_format")
    if ist_adresse(ref.get("titel")) or ist_adresse(ref.get("anzeige_ort")):
        fehlt.append("adresse")
    loesung = ref.get("loesung") or []
    if not isinstance(loesung, list) or not 1 <= len(loesung) <= 3:
        fehlt.append("loesung")
    leistungen = ref.get("leistungen") or []
    if not leistungen:
        fehlt.append("leistungen")
    bilder = ref.get("bilder") or []
    if not bilder:
        fehlt.append("bilder")
    if any(not str(b.get("alt") or "").strip() for b in bilder):
        fehlt.append("alt")
    if any(b.get("phase") not in REFERENZ_PHASEN for b in bilder):
        fehlt.append("phase")
    return fehlt


def oeffentlicher_ort(anzeige_art, anzeige_ort):
    return anzeige_ort if anzeige_art == "vorname_ort" and anzeige_ort else "am Bodensee"


def dauer_minuten(start, ende):
    """'08:15:00', '10:45:00' → 150; über Mitternacht erlaubt; None bei Fehler."""
    try:
        def sek(t):
            h, m, *s = str(t).split(":")
            return int(h) * 3600 + int(m) * 60 + int(s[0] if s else 0)
        d = sek(ende) - sek(start)
        if d < 0:
            d += 24 * 3600
        return int(round(d / 60))
    except (TypeError, ValueError):
        return None


def betrag_cent(dauer_min, stundensatz_cent):
    return int(round((dauer_min or 0) * (stundensatz_cent or 0) / 60))


def garantie_bis(lieferdatum, monate):
    """date + Monate (Monatsende-sicher); None ohne Eingaben."""
    import calendar
    import datetime

    if not lieferdatum or not monate:
        return None
    d = lieferdatum if isinstance(lieferdatum, datetime.date) else datetime.date.fromisoformat(str(lieferdatum)[:10])
    m = d.month - 1 + int(monate)
    jahr, monat = d.year + m // 12, m % 12 + 1
    tag = min(d.day, calendar.monthrange(jahr, monat)[1])
    return datetime.date(jahr, monat, tag)


def montage_uebergang_erlaubt(von, nach):
    erlaubt = {
        "Geplant": ("Unterwegs", "In Arbeit", "Abgebrochen"),
        "Unterwegs": ("In Arbeit", "Geplant", "Abgebrochen"),
        "In Arbeit": ("Erledigt", "Abgebrochen"),
        "Erledigt": ("Abgenommen", "In Arbeit"),
        "Abgenommen": (),
        "Abgebrochen": ("Geplant",),
    }
    return nach in erlaubt.get(von, ())


def gewerk_uebergang_erlaubt(von, nach):
    erlaubt = {
        "Offen": ("Angefragt", "Geplant", "Abgesagt"),
        "Angefragt": ("Geplant", "Offen", "Abgesagt"),
        "Geplant": ("In Arbeit", "Angefragt", "Abgesagt"),
        "In Arbeit": ("Erledigt", "Geplant"),
        "Erledigt": ("In Arbeit",),
        "Abgesagt": ("Offen",),
    }
    return nach in erlaubt.get(von, ())


def maskiere_email(email):
    email = str(email or "")
    if "@" not in email:
        return ""
    lokal, domain = email.split("@", 1)
    return (lokal[:1] + "…@" + domain) if lokal else "…@" + domain
