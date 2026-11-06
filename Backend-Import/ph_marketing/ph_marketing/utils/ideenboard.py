"""Geteiltes Ideenboard – reine Logik ohne Frappe-Import (Tests ohne Site: tests/test_ideenboard.py).

Spiegel von src/lib/ideenboard/config.js (CARD_TYPES, LIMITS, TOKEN_RE, safeImage, safeHref) und model.js
(cardKey, sanitizeCard, sanitizeBoard, createRecord, publicView, ownerView). Die Website bleibt Herrin der Kennungen:
boardId, shareId und adminSecret erzeugt sie (ids.js); hier kommen nur boardId und die SHA-256-Hashes von shareId und
adminSecret an. Der Klartext von shareId/adminSecret erreicht das Backend nie.

Datensatz (model.js createRecord, Schnittstelle localStore.js create/get/getByShare/update/remove/sweep):
    {v: 1, boardId, shareHash, adminHash, status: "aktiv"|"widerrufen", createdAt, updatedAt, expiresAt, cards[]}
"""

import hashlib
import re
from datetime import datetime, timedelta, timezone

CARD_TYPES = ("moebel", "raumbild", "ezarri", "ezarriMix", "stil", "projekt", "notiz")
LIMITS = {"cards": 60, "title": 140, "subtitle": 140, "note": 500, "quelle": 60, "room": 60, "href": 1600, "image": 400}
RETENTION_MONTHS = 12

TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{32}$")
HASH_RE = re.compile(r"^[a-f0-9]{64}$")
ID_RE = re.compile(r"^[a-z0-9-]{4,40}$")
_STEUER_RE = re.compile(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]")
_IMAGE_RE = re.compile(r"^/(?:cmx|cms|Images|ezarri|arbeitsweise|projekte|stil-palette|api/portal/tagebuch/referenz)/[A-Za-z0-9._~%\-/ ()]+$")
_BARE_FILES_RE = re.compile(r"^/files/[A-Za-z0-9._~%\-/ ()]+$")
_HREF_RE = re.compile(r"^/[A-Za-z0-9._~%\-/?=&#,]*$")

# Website „aktiv“/„widerrufen“ ↔ Select-Wert der DocType (Status deutsch, groß, ohne Umlaute)
STATUS_ZU_DOCTYPE = {"aktiv": "Aktiv", "widerrufen": "Widerrufen"}
STATUS_ZU_WEBSITE = {v: k for k, v in STATUS_ZU_DOCTYPE.items()}

# Kartenfelder Website → Kindtabelle PH Ideenboard Karte
KARTEN_FELDER = {
    "id": "karte_id",
    "type": "typ",
    "title": "titel",
    "subtitle": "untertitel",
    "href": "link",
    "image": "bild",
    "quelle": "quelle",
    "room": "raum",
    "note": "notiz",
    "addedAt": "hinzugefuegt_am",
}


class BoardFehler(ValueError):
    """Fachlicher Fehler mit Website-Code (model.js BoardError): invalid, empty."""

    def __init__(self, code, feld=None):
        super().__init__(code)
        self.code = code
        self.feld = feld


def text(wert, laenge):
    """model.js text(): nur Zeichenketten, Steuerzeichen und <> entfernen, trimmen, kürzen."""
    if not isinstance(wert, str):
        return ""
    return _STEUER_RE.sub("", wert).replace("<", "").replace(">", "").strip()[:laenge]


def ist_token(wert):
    return isinstance(wert, str) and bool(TOKEN_RE.match(wert))


def ist_hash(wert):
    return isinstance(wert, str) and bool(HASH_RE.match(wert))


def sha256(wert):
    """ids.js sha256(): Hex-SHA-256 ohne Präfix (gleicher Wert wie auf der Website)."""
    return hashlib.sha256(str(wert).encode("utf-8")).hexdigest()


def safe_image(bild):
    if not isinstance(bild, str) or len(bild) > LIMITS["image"] or ".." in bild:
        return None
    if _IMAGE_RE.match(bild):
        return bild
    if _BARE_FILES_RE.match(bild):
        return f"/cms{bild}"
    return None


def safe_href(href):
    if not isinstance(href, str) or len(href) > LIMITS["href"]:
        return None
    if not _HREF_RE.match(href) or href.startswith("//") or ".." in href:
        return None
    return href


def _imul(a, b):
    return (a * b) & 0xFFFFFFFF


def _base36(n):
    zeichen = "0123456789abcdefghijklmnopqrstuvwxyz"
    if n == 0:
        return "0"
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = zeichen[r] + out
    return out


def card_key(typ, href=None, image=None, title=None):
    """model.js cardKey(): FNV-1a 32 bit zweimal über UTF-16-Codeeinheiten → 16 Zeichen base36."""
    raw = f"{typ}|{href or ''}|{image or ''}|{(title or '') if typ == 'notiz' else ''}"
    daten = raw.encode("utf-16-le")
    h1, h2 = 0x811C9DC5, 0x01000193
    for i in range(0, len(daten), 2):
        c = daten[i] | (daten[i + 1] << 8)
        h1 = _imul(h1 ^ c, 0x01000193)
        h2 = _imul(h2 ^ c, 0x811C9DC5)
    return f"{_base36(h1)}{_base36(h2)}".rjust(8, "0")[:16]


def iso_gueltig(wert):
    if not isinstance(wert, str) or len(wert) > 40 or not wert:
        return False
    try:
        iso_zu_utc(wert)
        return True
    except ValueError:
        return False


def iso_zu_utc(wert):
    """ISO 8601 (mit Z oder Offset; ohne Offset = UTC wie Date.parse bei Datumszeit mit Z) → aware UTC-datetime."""
    s = str(wert).strip()
    if s.endswith("Z") or s.endswith("z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def utc_iso(dt):
    """aware datetime → wie Date.toISOString(): 2026-11-04T09:00:00.000Z."""
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def jetzt_iso():
    return utc_iso(datetime.now(timezone.utc))


def add_months(dt, monate):
    """model.js addMonths (setUTCMonth): Tag läuft wie in JS über (31.01. + 1 → 03.03.)."""
    jahr, monat = divmod(dt.month - 1 + monate, 12)
    basis = dt.replace(year=dt.year + jahr, month=monat + 1, day=1)
    return basis + timedelta(days=dt.day - 1)


def sanitize_card(eingabe, jetzt=None):
    """model.js sanitizeCard(): bereinigte Karte oder None."""
    if not isinstance(eingabe, dict):
        return None
    typ = eingabe.get("type") if eingabe.get("type") in CARD_TYPES else None
    if not typ:
        return None
    title = text(eingabe.get("title"), LIMITS["title"])
    note = text(eingabe.get("note"), LIMITS["note"])
    if not title and not (typ == "notiz" and note):
        return None
    karte = {
        "id": "",
        "type": typ,
        "title": title or note[:60],
        "subtitle": text(eingabe.get("subtitle"), LIMITS["subtitle"]) or None,
        "href": None if typ == "notiz" else safe_href(eingabe.get("href")),
        "image": None if typ == "notiz" else safe_image(eingabe.get("image")),
        "quelle": text(eingabe.get("quelle"), LIMITS["quelle"]) or None,
        "room": text(eingabe.get("room"), LIMITS["room"]) or None,
        "note": note,
        "addedAt": eingabe.get("addedAt") if iso_gueltig(eingabe.get("addedAt")) else (jetzt or jetzt_iso()),
    }
    if eingabe.get("nopin") is True:
        karte["nopin"] = True
    kid = eingabe.get("id")
    karte["id"] = kid if isinstance(kid, str) and ID_RE.match(kid) else card_key(typ, karte["href"], karte["image"], karte["title"])
    return karte


def sanitize_board(eingabe):
    """model.js sanitizeBoard(): Karten bereinigt, ohne Dubletten, höchstens LIMITS.cards."""
    if isinstance(eingabe, dict):
        liste = eingabe.get("cards") if isinstance(eingabe.get("cards"), list) else []
    elif isinstance(eingabe, list):
        liste = eingabe
    else:
        liste = []
    gesehen, karten = set(), []
    for roh in liste:
        k = sanitize_card(roh)
        if not k or k["id"] in gesehen:
            continue
        gesehen.add(k["id"])
        karten.append(k)
        if len(karten) >= LIMITS["cards"]:
            break
    return karten


def record_pruefen(record, neu=True):
    """Website-Datensatz prüfen und normalisieren. neu=True: boardId/adminHash/createdAt Pflicht.

    → {board_id, share_hash, admin_hash, status (Website-Wert), created_at, updated_at, expires_at, cards}
    Fehler: BoardFehler("invalid", feld) bzw. BoardFehler("empty").
    """
    if not isinstance(record, dict):
        raise BoardFehler("invalid", "record")
    out = {}
    if neu:
        if not ist_token(record.get("boardId")):
            raise BoardFehler("invalid", "boardId")
        out["board_id"] = record["boardId"]
        if not ist_hash(record.get("adminHash")):
            raise BoardFehler("invalid", "adminHash")
        out["admin_hash"] = record["adminHash"]
    if not ist_hash(record.get("shareHash")):
        raise BoardFehler("invalid", "shareHash")
    out["share_hash"] = record["shareHash"]
    status = record.get("status") or "aktiv"
    if status not in STATUS_ZU_DOCTYPE:
        raise BoardFehler("invalid", "status")
    out["status"] = status
    jetzt = jetzt_iso()
    for feld, ziel in (("createdAt", "created_at"), ("updatedAt", "updated_at"), ("expiresAt", "expires_at")):
        wert = record.get(feld)
        if wert is None and not (feld == "createdAt" and not neu):
            wert = jetzt if feld != "expiresAt" else utc_iso(add_months(iso_zu_utc(record.get("updatedAt") or jetzt), RETENTION_MONTHS))
        if wert is not None:
            if not iso_gueltig(wert):
                raise BoardFehler("invalid", feld)
            out[ziel] = wert
    karten = sanitize_board(record.get("cards"))
    if not karten:
        raise BoardFehler("empty", "cards")
    out["cards"] = karten
    return out


def abgelaufen(expires_at, jetzt=None):
    """model.js isExpired(): ohne Ablauf oder Ablauf ≤ jetzt → True."""
    if not expires_at:
        return True
    jetzt = jetzt or datetime.now(timezone.utc)
    try:
        return iso_zu_utc(expires_at) <= jetzt
    except ValueError:
        return True


def karte_zu_zeile(karte, position):
    zeile = {ziel: karte.get(quelle) for quelle, ziel in KARTEN_FELDER.items()}
    zeile["nopin"] = 1 if karte.get("nopin") else 0
    zeile["position"] = position
    return zeile


def zeile_zu_karte(zeile):
    karte = {quelle: (zeile.get(ziel) if zeile.get(ziel) not in ("",) else None) for quelle, ziel in KARTEN_FELDER.items()}
    karte["note"] = zeile.get("notiz") or ""
    if zeile.get("nopin"):
        karte["nopin"] = True
    return karte


def public_view(record):
    """model.js publicView(): Karten ohne addedAt und Stand – keine Kennungen, keine Hashes."""
    return {"updatedAt": record.get("updatedAt"), "cards": [{k: v for k, v in c.items() if k != "addedAt"} for c in sanitize_board(record.get("cards"))]}


def owner_view(record):
    """model.js ownerView()."""
    return {"status": record.get("status"), "createdAt": record.get("createdAt"), "updatedAt": record.get("updatedAt"), "expiresAt": record.get("expiresAt"), "count": len(record.get("cards") or [])}
