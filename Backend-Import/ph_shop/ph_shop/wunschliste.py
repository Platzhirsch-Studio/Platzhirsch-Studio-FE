"""Wunschliste: Datensatz der Website ↔ Felder von PH Wunschliste (reine Logik, ohne Frappe-Import).

Quelle des Datensatzes: src/lib/wunschliste/model.js createRecord() (RECORD_VERSION 1). Die Website bleibt
Herrin der Regeln (Reservieren, Beitrag, Teilen-Link drehen, Widerruf); das Backend speichert den Datensatz
strukturiert, prüft Form und Grenzen und sperrt optimistisch (expected_modified). Gespeichert werden nur
Hashes: shareHash = sha256(shareId), adminHash = sha256(adminSecret), cancelHash je Reservierung
(src/lib/wunschliste/ids.js). Klartext-Schlüssel erreichen das Backend nie.

E-Mail der Beitragenden (giver_email) ist nur fürs Studio: Antworten an die Website tragen sie maskiert
(maske_email). Kommt beim Speichern die maskierte (oder leere) Adresse zurück, bleibt die gespeicherte.

Zeiten: Website ISO 8601 (UTC, „…Z“) ↔ Datetime der Site. Die Umrechnung wird hereingereicht
(zeit_ein: ISO → Wert fürs Feld, zeit_aus: Feldwert → ISO), damit die Tests ohne Site laufen.
"""

import hmac
import re

RECORD_VERSION = 1
# src/lib/wunschliste/config.js
OCCASIONS = ("einzug", "hochzeit", "geburtstag", "frei")
LOCALES = ("de", "en", "fr", "it")
LIMIT_ITEMS = 60
LIMIT_TITLE = 90
LIMIT_MESSAGE = 600
LIMIT_NAME = 80
LIMIT_NOTE = 300
LIMIT_EMAIL = 254
LIMIT_CONTRIBUTION_EUR = 5000
LIMIT_CONTRIBUTIONS = 200  # model.js addContribution → too_many
TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{32}$")
HASH_RE = re.compile(r"^[a-f0-9]{64}$")
ITEM_KEY_RE = re.compile(r"^[a-f0-9]{16}$")
REF_RE = re.compile(r"^WL-[2-9A-Z]{4}-[2-9A-Z]{4}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STATUS = {"aktiv": "Aktiv", "widerrufen": "Widerrufen"}
STATUS_ZURUECK = {v: k for k, v in STATUS.items()}
KANAELE = ("anfrage", "stripe")
BEITRAG_STATUS = ("angefragt", "offen", "bezahlt", "erstattet")


class RecordFehler(ValueError):
    """Ungültiger Datensatz; feld = betroffenes Feld (für {"field": …} in der API-Antwort)."""

    def __init__(self, feld, meldung=None):
        super().__init__(meldung or f"Ungültiges Feld: {feld}")
        self.feld = feld


def _t(wert, laenge):
    s = re.sub(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]", "", str(wert if wert is not None else ""))
    return s.strip()[:laenge]


def hash_gleich(a, b):
    """Konstantzeit-Vergleich zweier Hex-Hashes (False bei leer/ungültig)."""
    if not a or not b or not HASH_RE.match(str(a)) or not HASH_RE.match(str(b)):
        return False
    return hmac.compare_digest(str(a), str(b))


def maske_email(email):
    """a***@b***.at – erkennbar fürs Team, unbrauchbar für Dritte."""
    s = str(email or "").strip()
    if "@" not in s:
        return ""
    lokal, domain = s.split("@", 1)
    teile = domain.rsplit(".", 1)
    dom = (teile[0][:1] + "***") if teile[0] else "***"
    return f"{lokal[:1]}***@{dom}" + (f".{teile[1]}" if len(teile) == 2 else "")


def ist_maskiert(email):
    return "***" in str(email or "")


def _euro_zu_cent(wert, feld):
    if wert is None or wert == "":
        return None
    try:
        n = float(wert)
    except (TypeError, ValueError):
        raise RecordFehler(feld)
    if n < 0 or n > LIMIT_CONTRIBUTION_EUR:
        raise RecordFehler(feld)
    return int(round(n * 100))


def _cent_zu_euro(cent):
    if cent is None or cent == "":
        return None
    c = int(cent)
    return c // 100 if c % 100 == 0 else c / 100


def pruefe_record(r, list_id=None):
    """Form und Grenzen prüfen (wie model.js/schemas.js). Wirft RecordFehler."""
    if not isinstance(r, dict):
        raise RecordFehler("record", "Datensatz fehlt.")
    if int(r.get("v") or RECORD_VERSION) != RECORD_VERSION:
        raise RecordFehler("v", "Nur Datensatz-Version 1.")
    if not TOKEN_RE.match(str(r.get("listId") or "")):
        raise RecordFehler("listId")
    if list_id is not None and r["listId"] != list_id:
        raise RecordFehler("listId", "listId passt nicht zur Liste.")
    for f in ("shareHash", "adminHash"):
        if not HASH_RE.match(str(r.get(f) or "")):
            raise RecordFehler(f)
    if r.get("ref") and not REF_RE.match(str(r["ref"])):
        raise RecordFehler("ref")
    if r.get("status", "aktiv") not in STATUS:
        raise RecordFehler("status")
    if r.get("occasion") not in OCCASIONS:
        raise RecordFehler("occasion")
    if (r.get("locale") or "de") not in LOCALES:
        raise RecordFehler("locale")
    if len(_t(r.get("title"), 10 * LIMIT_TITLE)) < 2:
        raise RecordFehler("title")
    if r.get("date") and not DATE_RE.match(str(r["date"])):
        raise RecordFehler("date")
    items = r.get("items")
    if not isinstance(items, list) or not items:
        raise RecordFehler("items", "Mindestens ein Stück.")
    reservierungen = r.get("reservations") or {}
    if not isinstance(reservierungen, dict):
        raise RecordFehler("reservations")
    # syncItems behält reservierte Stücke zusätzlich zur Grenze.
    if len(items) > LIMIT_ITEMS + len(reservierungen):
        raise RecordFehler("items", "Zu viele Stücke.")
    keys = set()
    for it in items:
        k = str((it or {}).get("key") or "")
        if not ITEM_KEY_RE.match(k) or k in keys or not _t(it.get("name"), 160):
            raise RecordFehler("items")
        keys.add(k)
    for k, res in reservierungen.items():
        if k not in keys or not isinstance(res, dict):
            raise RecordFehler("reservations")
        if res.get("cancelHash") and not HASH_RE.match(str(res["cancelHash"])):
            raise RecordFehler("reservations")
    beitraege = r.get("contributions") or []
    if not isinstance(beitraege, list) or len(beitraege) > LIMIT_CONTRIBUTIONS:
        raise RecordFehler("contributions")
    ids = set()
    for b in beitraege:
        bid = _t((b or {}).get("id"), 40)
        if not bid or bid in ids:
            raise RecordFehler("contributions")
        ids.add(bid)
        if b.get("channel", "anfrage") not in KANAELE or b.get("status", "angefragt") not in BEITRAG_STATUS:
            raise RecordFehler("contributions")
        _euro_zu_cent(b.get("amount"), "contributions")
    return True


def record_zu_werten(r, zeit_ein, alte_beitraege=None):
    """Datensatz → dict der Felder von PH Wunschliste (inkl. Kindtabellen positionen/beitraege).

    alte_beitraege: {beitrag_id: schenker_email} der gespeicherten Liste; maskierte/leere E-Mails im
    Datensatz werden daraus ergänzt (die Website kennt nur die maskierte Form)."""
    pruefe_record(r)
    alte_beitraege = alte_beitraege or {}
    res_map = r.get("reservations") or {}
    positionen = []
    for it in r["items"]:
        res = res_map.get(it["key"]) or None
        positionen.append(
            {
                "item_key": it["key"],
                "produkt_name": _t(it.get("name"), 160),
                "marke": _t(it.get("brand"), 120),
                "bild": _t(it.get("image"), 400) or None,
                "href": _t(it.get("href"), 300) or None,
                "reserviert": 1 if res else 0,
                "reserviert_am": zeit_ein(res.get("at")) if res and res.get("at") else None,
                "reserviert_name": _t(res.get("name"), LIMIT_NAME) if res else "",
                "reserviert_notiz": _t(res.get("note"), LIMIT_NOTE) if res else "",
                "storno_hash": (res.get("cancelHash") or None) if res else None,
            }
        )
    beitraege = []
    for b in r.get("contributions") or []:
        bid = _t(b.get("id"), 40)
        email = _t(b.get("email"), LIMIT_EMAIL).lower()
        if not email or ist_maskiert(email):
            email = alte_beitraege.get(bid) or ""
        beitraege.append(
            {
                "beitrag_id": bid,
                "zeitpunkt": zeit_ein(b.get("at")) if b.get("at") else None,
                "betrag_cent": _euro_zu_cent(b.get("amount"), "contributions"),
                "schenker_name": _t(b.get("name"), LIMIT_NAME),
                "schenker_email": email or None,
                "gruss": _t(b.get("message"), LIMIT_MESSAGE),
                "name_anzeigen": 0 if b.get("showName") is False else 1,
                "einwilligung_am": zeit_ein(b.get("consentAt")) if b.get("consentAt") else None,
                "kanal": b.get("channel") or "anfrage",
                "status": b.get("status") or "angefragt",
                "stripe_session": _t(b.get("stripeSession") or b.get("stripe_session"), 120) or None,
                "bezahlt_cent": _euro_zu_cent(b.get("paidAmount"), "contributions") if b.get("paidAmount") is not None else None,
            }
        )
    return {
        "list_id": r["listId"],
        "share_hash": r["shareHash"],
        "share_sealed": _t(r.get("shareSealed"), 400) or None,
        "admin_hash": r["adminHash"],
        "ref": _t(r.get("ref"), 20) or None,
        "status": STATUS[r.get("status") or "aktiv"],
        "sprache": r.get("locale") or "de",
        "anlass": r["occasion"],
        "listen_titel": _t(r.get("title"), LIMIT_TITLE),
        "anlass_datum": r.get("date") or None,
        "nachricht": _t(r.get("message"), LIMIT_MESSAGE),
        "erstellt_am": zeit_ein(r.get("createdAt")) if r.get("createdAt") else None,
        "aktualisiert_am": zeit_ein(r.get("updatedAt")) if r.get("updatedAt") else None,
        "laeuft_ab_am": zeit_ein(r.get("expiresAt")) if r.get("expiresAt") else None,
        "version": RECORD_VERSION,
        "positionen": positionen,
        "beitraege": beitraege,
    }


def werte_zu_record(d, zeit_aus, email_maskieren=True):
    """dict (Dokument als dict, Kindzeilen als Liste von dicts) → Datensatz der Website (model.js)."""
    g = d.get
    items, reservations = [], {}
    for p in g("positionen") or []:
        items.append({"key": p.get("item_key"), "name": p.get("produkt_name") or "", "brand": p.get("marke") or "", "image": p.get("bild") or None, "href": p.get("href") or None})
        if int(p.get("reserviert") or 0):
            reservations[p.get("item_key")] = {"at": zeit_aus(p.get("reserviert_am")), "cancelHash": p.get("storno_hash") or None, "name": p.get("reserviert_name") or "", "note": p.get("reserviert_notiz") or ""}
    contributions = []
    for b in g("beitraege") or []:
        email = b.get("schenker_email") or ""
        eintrag = {
            "id": b.get("beitrag_id"),
            "at": zeit_aus(b.get("zeitpunkt")),
            "amount": _cent_zu_euro(b.get("betrag_cent")),
            "name": b.get("schenker_name") or "",
            "email": maske_email(email) if email_maskieren else email,
            "message": b.get("gruss") or "",
            "showName": bool(int(b.get("name_anzeigen") if b.get("name_anzeigen") is not None else 1)),
            "consentAt": zeit_aus(b.get("einwilligung_am")),
            "channel": b.get("kanal") or "anfrage",
            "status": b.get("status") or "angefragt",
        }
        if b.get("stripe_session"):
            eintrag["stripeSession"] = b.get("stripe_session")
        if b.get("bezahlt_cent") is not None:
            eintrag["paidAmount"] = _cent_zu_euro(b.get("bezahlt_cent"))
        contributions.append(eintrag)
    return {
        "v": RECORD_VERSION,
        "listId": g("list_id"),
        "shareHash": g("share_hash"),
        "shareSealed": g("share_sealed") or None,
        "adminHash": g("admin_hash"),
        "ref": g("ref"),
        "status": STATUS_ZURUECK.get(g("status") or "Aktiv", "aktiv"),
        "locale": g("sprache") or "de",
        "occasion": g("anlass"),
        "title": g("listen_titel") or "",
        "date": str(g("anlass_datum")) if g("anlass_datum") else None,
        "message": g("nachricht") or "",
        "items": items,
        "reservations": reservations,
        "contributions": contributions,
        "createdAt": zeit_aus(g("erstellt_am")),
        "updatedAt": zeit_aus(g("aktualisiert_am")),
        "expiresAt": zeit_aus(g("laeuft_ab_am")),
    }
