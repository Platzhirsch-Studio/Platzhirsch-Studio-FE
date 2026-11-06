"""Whitelisted Methoden von ph_service für Website und Kundenportal (Token des Benutzers website@platzhirsch.studio,
Decorator ph_core.api.ph_api; Portal-Methoden prüfen zusätzlich kunde_token gegen PH Kontakt.portal_token_hash).

  Portal (src/lib/portal/adapters/frappe.js, Abschnitt „Service“):
    portal_service_cases(kontakt, kunde_token)                       → Liste eigener Servicefälle
    portal_service_case(kontakt, kunde_token, referenz)              → Detail mit Verlauf, Einsätzen, Fotos
    portal_create_service_case(kontakt, kunde_token, …, fotos[])     → „Servicefall melden“ mit Fotos (base64)
    portal_add_photo(kontakt, kunde_token, referenz, foto)           → Foto nachreichen
    portal_rate_service_case(kontakt, kunde_token, referenz, …)      → Zufriedenheit
    portal_service_file(kontakt, kunde_token, referenz, datei)       → private Datei streamen
    portal_care_subscriptions(kontakt, kunde_token)                  → Pflege-/Wartungsverträge (src/lib/service/pflege/portal.js)
  Website ohne Portal:
    create_service_case(**d)                                         → Reklamationsformular (findet/erzeugt PH Kontakt per E-Mail)
    get_service_status(referenz, email)                              → Status abfragen (Referenz + E-Mail)
    add_service_photo(referenz, email, foto_base64, mime, dateiname) → Foto nachreichen ohne Login (≤ 14 Tage, ≤ 10 Dateien)
    get_fehlerkatalog()                                              → Bereiche und Codes für Formulare

Antworten: flache dicts, Zeiten ISO 8601, Beträge Cent, keine Telefon-/E-Mail-Klartexte außer maskiert.
Fehlercodes: invalid 400, forbidden 403, not_found/invalid_token 404, conflict 409, unavailable 503.
"""

import base64
import hashlib
import hmac
import re

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PORTAL_STATUS = {
    "Gemeldet": "gemeldet",
    "Geprueft": "geprueft",
    "Entscheidung": "entscheidung",
    "In Bearbeitung": "in_bearbeitung",
    "Einsatz geplant": "einsatz_geplant",
    "Erledigt": "erledigt",
    "Geschlossen": "geschlossen",
    "Abgelehnt": "abgelehnt",
}
ARTEN_PORTAL = {"mangel": "Mangel", "transportschaden": "Transportschaden", "montagefehler": "Montagefehler", "garantie": "Garantie", "pflegefrage": "Pflegefrage", "kulanz": "Kulanz"}
WUNSCH_PORTAL = {"verbesserung": "Verbesserung", "austausch": "Austausch", "preisminderung": "Preisminderung", "wandlung": "Wandlung", "beratung": "Beratung"}


# ── Helfer ──────────────────────────────────────────────────────────────────


def _iso(wert):
    if not wert:
        return None
    return get_datetime(wert).isoformat() if hasattr(wert, "hour") or " " in str(wert) else str(wert)


def _maskiert(email):
    if not email or "@" not in email:
        return None
    lokal, dom = email.split("@", 1)
    return f"{lokal[:1]}…@{dom}"


def _kontakt_pruefen(kontakt, kunde_token):
    """Portal-Zugriff: zentrale Prüfung ph_core.api.portal_kontakt_pruefen (invalid 400, unavailable 503,
    not_found 404, invalid_token 404) – identisch für ph_projekte, ph_faktura, ph_service."""
    from ph_core.api import portal_kontakt_pruefen

    return portal_kontakt_pruefen(kontakt, kunde_token)


def _eigener_fall(kontakt, referenz):
    name = frappe.db.get_value("PH Servicefall", {"name": referenz, "kontakt": kontakt}, "name")
    if not name:
        raise ApiFehler("not_found", 404, _("Servicefall nicht gefunden."))
    return frappe.get_doc("PH Servicefall", name)


def _datei_anlegen(doc, foto, idx):
    """foto = {"name": "bild.jpg", "content": "<base64>" | "data:image/jpeg;base64,…", "hinweis": "…"}
    → (private File-URL, Medientyp). Der Typ wird am Dateikopf erkannt (ph_service/utils/medien.py), nicht an
    MIME/Endung des Browsers; erlaubt Bild (JPG/PNG/WEBP/HEIC), PDF, Video (MP4/MOV/WEBM) mit eigenen Größengrenzen."""
    from ph_service.utils import medien

    einst = einstellungen()
    inhalt = str(foto.get("content") or foto.get("data") or "")
    if inhalt.startswith("data:"):
        inhalt = inhalt.partition(",")[2]
    try:
        roh = base64.b64decode(inhalt, validate=False)
    except Exception:  # noqa: BLE001
        raise ApiFehler("invalid", 400, _("Datei {0} ist nicht lesbar.").format(idx + 1))
    try:
        endung, typ = medien.pruefen(roh, bild_max_mb=int(einst["portal_foto_max_mb"]), video_max_mb=int(einst["portal_video_max_mb"]))
    except ValueError as e:
        raise ApiFehler("invalid", 400, _("Datei {0}: {1}").format(idx + 1, _(str(e))))
    dateiname = f"{doc.name}-{idx + 1}.{endung}"
    f = frappe.get_doc({"doctype": "File", "file_name": dateiname, "content": roh, "is_private": 1, "attached_to_doctype": doc.doctype, "attached_to_name": doc.name, "attached_to_field": "fotos"})
    f.flags.ignore_permissions = True
    f.insert()
    return f.file_url, typ


def _fotos_anhaengen(doc, fotos, quelle="Kunde"):
    """Fotos/Videos/PDF an den Servicefall (privat). Grenzen: portal_fotos_max (alle Dateien), portal_videos_max (Videos)."""
    einst = einstellungen()
    fotos = fotos or []
    if isinstance(fotos, str):
        fotos = frappe.parse_json(fotos)
    if len(fotos) + len(doc.fotos or []) > int(einst["portal_fotos_max"]):
        raise ApiFehler("invalid", 400, _("Höchstens {0} Dateien je Servicefall.").format(einst["portal_fotos_max"]))
    videos = sum(1 for z in doc.fotos or [] if z.get("medientyp") == "Video")
    urls = []
    for i, foto in enumerate(fotos):
        if not isinstance(foto, dict):
            continue
        url, typ = _datei_anlegen(doc, foto, len(doc.fotos or []) + i)
        if typ == "Video":
            videos += 1
            if videos > int(einst["portal_videos_max"]):
                frappe.delete_doc("File", frappe.db.get_value("File", {"file_url": url}, "name"), ignore_permissions=True, force=True)
                raise ApiFehler("invalid", 400, _("Höchstens {0} Videos je Servicefall.").format(einst["portal_videos_max"]))
        doc.append("fotos", {"bild": url, "medientyp": typ, "hinweis": text(foto.get("hinweis"), 140), "quelle": quelle, "datum": frappe.utils.nowdate(), "an_lieferant": 1})
        urls.append(url)
    return urls



def _fall_kurz(d):
    return {
        "id": d.name,
        "titel": d.titel,
        "art": d.art,
        "status": PORTAL_STATUS.get(d.status, "gemeldet"),
        "statusLabel": d.status,
        "gemeldetAm": _iso(d.gemeldet_am),
        "produkt": d.produkt_name or d.produkt,
        "marke": d.marke,
        "fehler": d.fehlercode_bezeichnung,
        "entscheidung": d.entscheidung,
        "fristenStatus": d.fristen_status,
        "gewaehrleistungBis": str(d.gewaehrleistung_bis) if d.gewaehrleistung_bis else None,
        "erledigtAm": _iso(d.erledigt_am),
        "zufriedenheit": d.zufriedenheit,
        "fotos": len(d.fotos or []) if hasattr(d, "fotos") else None,
    }


def _naechster_einsatz(name):
    e = frappe.get_all("PH Serviceeinsatz", filters={"servicefall": name, "status": ("in", ["Geplant", "Bestaetigt", "Unterwegs"])}, fields=["name", "datum", "zeit_von", "zeit_bis", "status", "art"], order_by="datum asc", limit=1)
    if not e:
        return None
    e = e[0]
    return {"id": e.name, "datum": str(e.datum), "von": str(e.zeit_von)[:5] if e.zeit_von else None, "bis": str(e.zeit_bis)[:5] if e.zeit_bis else None, "status": e.status.lower(), "art": e.art}


# ── Portal ──────────────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api()
def portal_service_cases(kontakt, kunde_token):
    _kontakt_pruefen(kontakt, kunde_token)
    rows = frappe.get_all(
        "PH Servicefall",
        filters={"kontakt": kontakt, "portal_sichtbar": 1},
        fields=["name", "titel", "art", "status", "gemeldet_am", "produkt_name", "produkt", "marke", "fehlercode_bezeichnung", "entscheidung", "fristen_status", "gewaehrleistung_bis", "erledigt_am", "zufriedenheit"],
        order_by="gemeldet_am desc",
        limit=200,
    )
    out = []
    for r in rows:
        eintrag = _fall_kurz(r)
        eintrag["naechsterEinsatz"] = _naechster_einsatz(r.name)
        out.append(eintrag)
    return {"faelle": out}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api()
def portal_service_case(kontakt, kunde_token, referenz):
    _kontakt_pruefen(kontakt, kunde_token)
    doc = _eigener_fall(kontakt, referenz)
    if not doc.portal_sichtbar:
        raise ApiFehler("not_found", 404)
    out = _fall_kurz(doc)
    out.update(
        {
            "beschreibung": frappe.utils.strip_html(doc.beschreibung or ""),
            "kundenwunsch": doc.kundenwunsch,
            "entscheidungBegruendung": doc.entscheidung_begruendung if doc.entscheidung else None,
            "abschlussbericht": frappe.utils.strip_html(doc.abschlussbericht or "") if doc.status in ("Erledigt", "Geschlossen", "Abgelehnt") else None,
            "kundeInformiertAm": _iso(doc.kunde_informiert_am),
            "fotos": [{"id": z.name, "hinweis": z.hinweis, "quelle": z.quelle, "datum": str(z.datum) if z.datum else None} for z in doc.fotos or []],
            "verlauf": [{"zeit": _iso(v.zeit), "status": v.status, "ereignis": v.ereignis} for v in doc.verlauf or [] if v.ereignis in ("Status", "Einsatz", "Kommunikation")],
            "einsaetze": [
                {"id": e.name, "datum": str(e.datum), "von": str(e.zeit_von)[:5] if e.zeit_von else None, "bis": str(e.zeit_bis)[:5] if e.zeit_bis else None, "status": e.status.lower(), "art": e.art, "ergebnis": e.ergebnis}
                for e in frappe.get_all("PH Serviceeinsatz", filters={"servicefall": doc.name, "status": ("!=", "Abgebrochen")}, fields=["name", "datum", "zeit_von", "zeit_bis", "status", "art", "ergebnis"], order_by="datum asc")
            ],
            "naechsterEinsatz": _naechster_einsatz(doc.name),
        }
    )
    return out


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Servicefall", r["referenz"]))
def portal_create_service_case(kontakt, kunde_token, beschreibung, art="mangel", kundenwunsch=None, produkt=None, produktpass=None, bestellung=None, projekt=None, rechnung=None, fehlerbereich=None, fehlercode=None, produkt_name=None, seriennummer=None, erstauftreten=None, sprache="de", fotos=None, **rest):
    """„Servicefall melden“ aus dem Kundenportal, mit Fotos (base64). Antwort {referenz, status}."""
    _kontakt_pruefen(kontakt, kunde_token)
    pflicht({"beschreibung": beschreibung}, "beschreibung")
    einst = einstellungen()
    werte = {
        "doctype": "PH Servicefall",
        "kontakt": kontakt,
        "art": ARTEN_PORTAL.get(str(art).lower(), "Mangel"),
        "kundenwunsch": WUNSCH_PORTAL.get(str(kundenwunsch or "").lower(), "Offen"),
        "kanal": "Portal",
        "quelle": "portal",
        "beschreibung": frappe.utils.escape_html(text(beschreibung, 5000)).replace("\n", "<br>"),
        "produkt_name": text(produkt_name, 140),
        "seriennummer": text(seriennummer, 80),
        "sprache": sprache if sprache in ("de", "en", "fr", "it") else "de",
        "ip_hash": ip_hash(),
        "portal_sichtbar": 1,
        "referenz_website": text(rest.get("referenz_website") or rest.get("lead_ref"), 140),
    }
    if erstauftreten:
        werte["erstauftreten"] = frappe.utils.getdate(erstauftreten)
    links = {"produkt": produkt, "produktpass": produktpass, "bestellung": bestellung, "projekt": projekt, "rechnung": rechnung, "fehlerbereich": fehlerbereich, "fehlercode": fehlercode}
    doctypes = {"produkt": "PH Produkt", "produktpass": "PH Produktpass", "bestellung": "PH Bestellung", "projekt": "PH Projekt", "rechnung": "PH Rechnung", "fehlerbereich": "PH Fehlerbereich", "fehlercode": "PH Fehlercode"}
    for feld, wert in links.items():
        dt = doctypes[feld]
        if wert and frappe.db.exists("DocType", dt) and frappe.db.exists(dt, text(wert, 140)):
            werte[feld] = text(wert, 140)
    # Bestellung/Projekt müssen dem Kontakt gehören (Zugriff immer über kontakt filtern).
    for feld, dt in (("bestellung", "PH Bestellung"), ("projekt", "PH Projekt"), ("produktpass", "PH Produktpass"), ("rechnung", "PH Rechnung")):
        if werte.get(feld):
            try:
                if frappe.db.get_value(dt, werte[feld], "kontakt") != kontakt:
                    werte.pop(feld)
            except Exception:  # noqa: BLE001
                werte.pop(feld, None)
    doc = frappe.get_doc(werte)
    doc.flags.ignore_permissions = True
    doc.insert()
    if fotos:
        _fotos_anhaengen(doc, fotos, quelle="Kunde")
        doc.save(ignore_permissions=True)
    if cint(einst["mail_automatisch"]) and doc.kunde_email:
        try:
            from ph_service.ph_service import kommunikation as kom

            kom.sende_vorlage(doc, "eingang", doc.kunde_email)
            doc.db_set({"kunde_informiert_am": now_datetime(), "erstreaktion_am": now_datetime()})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="ph_service: Eingangsbestätigung Portal")
    return {"referenz": doc.name, "status": PORTAL_STATUS[doc.status], "fotos": len(doc.fotos or [])}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api()
def portal_add_photo(kontakt, kunde_token, referenz, foto, hinweis=None):
    _kontakt_pruefen(kontakt, kunde_token)
    doc = _eigener_fall(kontakt, referenz)
    if doc.status in ("Geschlossen", "Abgelehnt"):
        raise ApiFehler("conflict", 409, _("Servicefall ist abgeschlossen."))
    if isinstance(foto, str):
        foto = frappe.parse_json(foto)
    if hinweis:
        foto["hinweis"] = hinweis
    urls = _fotos_anhaengen(doc, [foto], quelle="Kunde")
    doc.save(ignore_permissions=True)
    doc.add_comment("Info", _("Kunde hat ein Foto nachgereicht."))
    return {"referenz": doc.name, "fotos": len(doc.fotos or []), "datei": urls[0] if urls else None}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api()
def portal_rate_service_case(kontakt, kunde_token, referenz, zufriedenheit, kommentar=None):
    _kontakt_pruefen(kontakt, kunde_token)
    doc = _eigener_fall(kontakt, referenz)
    if doc.status not in ("Erledigt", "Geschlossen", "Abgelehnt"):
        raise ApiFehler("conflict", 409, _("Bewertung erst nach Abschluss."))
    try:
        wert = float(zufriedenheit)
    except (TypeError, ValueError):
        raise ApiFehler("invalid", 400, _("Zufriedenheit 0–1 (Anteil) oder 1–5 Sterne."))
    if wert > 1:
        wert = wert / 5
    if not 0 <= wert <= 1:
        raise ApiFehler("invalid", 400, _("Zufriedenheit außerhalb des Bereichs."))
    doc.db_set({"zufriedenheit": wert, "zufriedenheit_kommentar": text(kommentar, 500)})
    return {"referenz": doc.name, "zufriedenheit": wert}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api()
def portal_service_file(kontakt, kunde_token, referenz, datei):
    """Private Foto-Datei eines eigenen Servicefalls streamen (datei = Zeilen-ID aus portal_service_case.fotos)."""
    _kontakt_pruefen(kontakt, kunde_token)
    doc = _eigener_fall(kontakt, referenz)
    zeile = next((z for z in doc.fotos or [] if z.name == datei), None)
    if not zeile:
        raise ApiFehler("not_found", 404)
    f = frappe.get_doc("File", {"file_url": zeile.bild})
    frappe.local.response.filename = f.file_name
    frappe.local.response.filecontent = f.get_content()
    frappe.local.response.type = "download"
    return {"datei": f.file_name}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api()
def portal_care_subscriptions(kontakt, kunde_token):
    """Pflege-/Wartungsverträge für „Meine Stücke & Pflege“ (src/lib/service/pflege/portal.js: itemIds, passIds, naechsterTermin)."""
    _kontakt_pruefen(kontakt, kunde_token)
    out = []
    for row in frappe.get_all("PH Pflege Abo", filters={"kontakt": kontakt, "portal_sichtbar": 1, "status": ("in", ["Aktiv", "Pausiert", "Angeboten"])}, fields=["name"]):
        abo = frappe.get_doc("PH Pflege Abo", row.name)
        out.append(
            {
                "id": abo.name,
                "status": "aktiv" if abo.status == "Aktiv" else abo.status.lower(),
                "art": {"Pflege einmalig": "einmalig", "Pflege Jahres-Abo": "abo", "Wartungsvertrag": "wartung"}.get(abo.art, "abo"),
                "bereich": abo.bereich,
                "intervallMonate": abo.intervall_monate,
                "naechsterTermin": str(abo.naechster_termin) if abo.naechster_termin else None,
                "ueberfaellig": bool(abo.ueberfaellig),
                "itemIds": [s.portal_item_id for s in abo.stuecke or [] if s.portal_item_id],
                "passIds": [s.produktpass for s in abo.stuecke or [] if s.produktpass],
                "stuecke": [{"bezeichnung": s.bezeichnung, "material": s.material} for s in abo.stuecke or []],
                "protokolle": [{"datum": str(p.datum), "leistungen": p.leistungen or ""} for p in abo.protokolle or [] if p.im_portal],
            }
        )
    return {"vertraege": out}


# ── Website ohne Portal ─────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Servicefall", r["referenz"]))
def create_service_case(**d):
    """Reklamationsformular der Website (ohne Portal-Login): nachname, email, beschreibung, optional vorname, telefon,
    bestellnummer, produkt_name, marke, kaufdatum, art, kundenwunsch, fotos[]. Findet/erzeugt PH Kontakt per E-Mail."""
    pflicht(d, "nachname", "email", "beschreibung")
    email = text(d.get("email"), 254).lower()
    if not EMAIL_RE.match(email):
        raise ApiFehler("invalid", 400, _("E-Mail ungültig."), {"field": "email"})
    if not frappe.db.exists("DocType", "PH Kontakt"):
        raise ApiFehler("unavailable", 503, _("PH Kontakt ist nicht installiert."))
    kontakt = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if not kontakt:
        k = frappe.get_doc({"doctype": "PH Kontakt", "vorname": text(d.get("vorname"), 100), "nachname": text(d.get("nachname"), 100), "email": email, "telefon": text(d.get("telefon"), 40), "kontaktart": "Privat", "status": "Kunde", "quelle": "website", "sprache": d.get("sprache") if d.get("sprache") in ("de", "en", "fr", "it") else "de"})
        k.flags.ignore_permissions = True
        k.flags.ignore_mandatory = True
        k.insert()
        kontakt = k.name
    bestellung = text(d.get("bestellnummer") or d.get("bestellung"), 40)
    werte = {
        "doctype": "PH Servicefall",
        "kontakt": kontakt,
        "kunde_email": email,
        "kunde_telefon": text(d.get("telefon"), 40),
        "art": ARTEN_PORTAL.get(str(d.get("art") or "").lower(), "Mangel"),
        "kundenwunsch": WUNSCH_PORTAL.get(str(d.get("kundenwunsch") or "").lower(), "Offen"),
        "kanal": "Website",
        "quelle": "website",
        "beschreibung": frappe.utils.escape_html(text(d.get("beschreibung"), 5000)).replace("\n", "<br>"),
        "produkt_name": text(d.get("produkt_name") or d.get("produkt"), 140),
        "seriennummer": text(d.get("seriennummer"), 80),
        "sprache": d.get("sprache") if d.get("sprache") in ("de", "en", "fr", "it") else "de",
        "ip_hash": ip_hash(),
        "referenz_website": text(d.get("lead_ref") or d.get("referenz_website"), 140),
    }
    if d.get("kaufdatum"):
        try:
            werte["kaufdatum"] = frappe.utils.getdate(d["kaufdatum"])
        except Exception:  # noqa: BLE001
            pass
    if d.get("marke") and frappe.db.exists("DocType", "PH Marke") and frappe.db.exists("PH Marke", d["marke"]):
        werte["marke"] = d["marke"]
    if bestellung and frappe.db.exists("DocType", "PH Bestellung") and frappe.db.exists("PH Bestellung", bestellung):
        werte["bestellung"] = bestellung
    doc = frappe.get_doc(werte)
    doc.flags.ignore_permissions = True
    doc.insert()
    if d.get("fotos"):
        _fotos_anhaengen(doc, d.get("fotos"), quelle="Kunde")
        doc.save(ignore_permissions=True)
    if cint(einstellungen()["mail_automatisch"]):
        try:
            from ph_service.ph_service import kommunikation as kom

            kom.sende_vorlage(doc, "eingang", email)
            doc.db_set({"kunde_informiert_am": now_datetime(), "erstreaktion_am": now_datetime()})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="ph_service: Eingangsbestätigung Website")
    return {"referenz": doc.name, "status": PORTAL_STATUS[doc.status]}


FOTO_FALL_LIMIT = 10  # Uploads je Servicefall und 10 Minuten (zusätzlich zum Rate-Limit je Client im Decorator)


def _fall_rate_limit(referenz, grenze=FOTO_FALL_LIMIT, fenster_s=600):
    import time

    key = "ph_service:foto:{0}:{1}".format(hashlib.sha256(referenz.encode()).hexdigest()[:16], int(time.time() // fenster_s))
    cache = frappe.cache()
    n = cache.incr(key) if hasattr(cache, "incr") else None
    if n is None:
        n = cint(cache.get_value(key)) + 1
        cache.set_value(key, n, expires_in_sec=fenster_s * 2)
    elif n == 1:
        cache.expire(key, fenster_s * 2)
    if n > grenze:
        raise ApiFehler("rate_limited", 429, _("Zu viele Uploads – bitte später erneut versuchen."))


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=20, referenz=lambda r: ("PH Servicefall", r["referenz"]))
def add_service_photo(referenz=None, email=None, foto_base64=None, mime=None, dateiname=None, hinweis=None, **_rest):
    """Website-Reklamation ohne Portal-Login: Foto/Video/PDF zu einem Servicefall nachreichen.

    Prüfung: Referenz + E-Mail (sha256, konstanter Vergleich) – unbekannt oder falsche E-Mail → dieselbe 404
    `not_found`; Inhaltstyp am Dateikopf (utils/medien.py), `mime` darf nicht widersprechen; privat gespeichert;
    höchstens 10 Dateien je Fall (und portal_fotos_max); nur innerhalb von 14 Tagen nach `gemeldet_am`
    (sonst 410 `expired`); abgeschlossen → 409 `conflict`; Rate-Limit je Client und je Fall (429).
    → {referenz, fotos, medientyp}. Keine Personendaten in der Antwort."""
    from ph_service.utils import reklamation_foto as RF

    pflicht({"referenz": referenz, "email": email, "foto_base64": foto_base64}, "referenz", "email", "foto_base64")
    referenz = text(referenz, 40)
    _fall_rate_limit(referenz)
    d = frappe.db.get_value("PH Servicefall", referenz, ["name", "kunde_email", "gemeldet_am", "creation", "status"], as_dict=True)
    if not d or not RF.email_passt(d.kunde_email, email):
        raise ApiFehler("not_found", 404, _("Kein Servicefall zu dieser Referenz und E-Mail."))
    if d.status in ("Geschlossen", "Abgelehnt"):
        raise ApiFehler("conflict", 409, _("Servicefall ist abgeschlossen."))
    if not RF.in_frist(get_datetime(d.gemeldet_am or d.creation), now_datetime()):
        raise ApiFehler("expired", 410, _("Fotos können nur innerhalb von {0} Tagen nach der Meldung nachgereicht werden.").format(RF.FRIST_TAGE))
    doc = frappe.get_doc("PH Servicefall", d.name)
    if not RF.platz_frei(len(doc.fotos or [])):
        raise ApiFehler("conflict", 409, _("Höchstens {0} Dateien je Servicefall.").format(RF.MAX_DATEIEN))
    if mime:
        # Vorabprüfung des Browser-MIME gegen den Dateikopf (der Dateikopf entscheidet, MIME darf nur nicht widersprechen)
        from ph_service.utils import medien

        inhalt = str(foto_base64)
        b64 = inhalt.partition(",")[2] if inhalt.startswith("data:") else inhalt
        try:
            kopf = base64.b64decode(b64[:88], validate=False)  # 88 Zeichen = 66 Bytes Dateikopf
        except Exception:  # noqa: BLE001
            kopf = b""
        endung = medien.erkennen(kopf)
        if endung and not RF.mime_passt(mime, medien.ENDUNGEN[endung]):
            raise ApiFehler("invalid", 400, _("Dateityp passt nicht zur Angabe."), {"field": "mime"})
    urls = _fotos_anhaengen(doc, [{"name": text(dateiname, 120), "content": foto_base64, "hinweis": hinweis}], quelle="Kunde")
    doc.save(ignore_permissions=True)
    doc.add_comment("Info", _("Kunde hat über die Website eine Datei nachgereicht."))
    typ = doc.fotos[-1].medientyp if doc.fotos else None
    return {"referenz": doc.name, "fotos": len(doc.fotos or []), "medientyp": typ, "datei": bool(urls)}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=30)
def get_service_status(referenz, email):
    """Status abfragen ohne Portal: Referenz + E-Mail müssen zusammenpassen (sonst not_found, keine Rückschlüsse)."""
    pflicht({"referenz": referenz, "email": email}, "referenz", "email")
    email = text(email, 254).lower()
    d = frappe.db.get_value("PH Servicefall", {"name": text(referenz, 40), "kunde_email": email}, ["name", "titel", "art", "status", "gemeldet_am", "produkt_name", "produkt", "marke", "fehlercode_bezeichnung", "entscheidung", "fristen_status", "gewaehrleistung_bis", "erledigt_am", "zufriedenheit", "kunde_informiert_am"], as_dict=True)
    if not d:
        raise ApiFehler("not_found", 404, _("Kein Servicefall zu dieser Referenz und E-Mail."))
    out = _fall_kurz(d)
    out.pop("fotos", None)
    out["email"] = _maskiert(email)
    out["naechsterEinsatz"] = _naechster_einsatz(d.name)
    return out


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_fehlerkatalog():
    from ph_service.ph_service.doctype.ph_fehlercode.ph_fehlercode import katalog

    return {"bereiche": katalog(1), "arten": sorted(ARTEN_PORTAL.keys()), "wuensche": sorted(WUNSCH_PORTAL.keys())}


# ── Backoffice (Benutzer-Token, Rechte der Rolle; keine Website-Methoden) ───


def _fall_zaehler(names):
    """Zähler aus Kindtabellen/Einsätzen/Regress je Fall für utils/schritte.py – eine Abfrage je Quelle."""
    z = {n: {"ersatzteile_benoetigt": 0, "ersatzteile_offen": 0, "einsaetze_offen": 0, "regress_vorhanden": 0, "naechster_einsatz": None, "ersatzteile_erwartet_am": None} for n in names}
    for r in frappe.get_all("PH Servicefall Ersatzteil", filters={"parenttype": "PH Servicefall", "parent": ("in", names)}, fields=["parent", "status", "bestellung"]):
        if r.status == "Benoetigt" and not r.bestellung:
            z[r.parent]["ersatzteile_benoetigt"] += 1
        elif r.status == "Bestellt":
            z[r.parent]["ersatzteile_offen"] += 1
    for e in frappe.get_all("PH Serviceeinsatz", filters={"servicefall": ("in", names), "status": ("in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"])}, fields=["servicefall", "datum"], order_by="datum asc"):
        z[e.servicefall]["einsaetze_offen"] += 1
        z[e.servicefall]["naechster_einsatz"] = z[e.servicefall]["naechster_einsatz"] or e.datum
    for r in frappe.get_all("PH Lieferantenregress", filters={"servicefall": ("in", names)}, fields=["servicefall"]):
        z[r.servicefall]["regress_vorhanden"] = 1
    for b in frappe.get_all("PH Ersatzteilbestellung", filters={"servicefall": ("in", names), "status": ("in", ["Gesendet", "Bestaetigt", "Teilgeliefert"])}, fields=["servicefall", "erwartet_am"], order_by="erwartet_am asc"):
        z[b.servicefall]["ersatzteile_erwartet_am"] = z[b.servicefall]["ersatzteile_erwartet_am"] or b.erwartet_am
    return z


@frappe.whitelist(methods=["GET", "POST"])
def get_next_steps(names):
    """Nächster Schritt je Servicefall mit sortierbarer Fälligkeit (Konzept §9/§12: naechste_schritte).
    names = Liste (max. 200) → {name: {schritt, aktion, faellig, rang}}."""
    from ph_service.utils.schritte import naechster_schritt

    if isinstance(names, str):
        names = frappe.parse_json(names) if names.strip().startswith("[") else [names]
    names = [str(n) for n in (names or [])][:200]
    if not names:
        return {}
    frappe.has_permission("PH Servicefall", "read", throw=True)
    felder = ["name", "status", "erstreaktion_am", "frist_reaktion", "frist_loesung", "fehlercode", "entscheidung", "kulanz_freigabe_status", "lieferantenrelevant", "kunde_informiert_am", "abnahme_bestaetigt", "regress_frist_bis"]
    faelle = frappe.get_list("PH Servicefall", filters={"name": ("in", names)}, fields=felder, limit=len(names))
    zaehler = _fall_zaehler([f.name for f in faelle])
    return {f.name: naechster_schritt({**f, **zaehler.get(f.name, {})}) for f in faelle}


@frappe.whitelist(methods=["GET", "POST"])
def get_service_case_file(name):
    """Akte eines Servicefalls in einem Aufruf (Konzept §12: servicefall_akte): Fall, Einsätze, Ersatzteilbestellungen,
    Regresse, nächster Schritt, Fristen, SLA. Kosten/EK nur mit permlevel-Recht (Leitung)."""
    from ph_service.utils.schritte import naechster_schritt

    doc = frappe.get_doc("PH Servicefall", name)
    doc.check_permission("read")
    daten = doc.as_dict(convert_dates_to_str=True)
    if not frappe.has_permission("PH Servicefall", "write", doc=doc) or "PH Techniker" in frappe.get_roles() and "PH Service Mitarbeiter" not in frappe.get_roles():
        for feld in ("notiz_intern", "kosten", "kosten_intern_cent", "kosten_extern_cent", "netto_kosten_cent"):
            daten.pop(feld, None)
    zaehler = _fall_zaehler([doc.name])[doc.name]
    return {
        "fall": daten,
        "einsaetze": frappe.get_list("PH Serviceeinsatz", filters={"servicefall": doc.name}, fields=["name", "titel", "status", "datum", "zeit_von", "zeit_bis", "techniker", "ergebnis", "bestaetigt_kunde_am", "bericht_gesendet_am"], order_by="datum desc"),
        "ersatzteilbestellungen": frappe.get_list("PH Ersatzteilbestellung", filters={"servicefall": doc.name}, fields=["name", "titel", "status", "erwartet_am", "geliefert_am", "ueberfaellig"], order_by="creation desc"),
        "regresse": frappe.get_list("PH Lieferantenregress", filters={"servicefall": doc.name}, fields=["name", "status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "abgleich_status", "differenz_cent", "frist_bis"], order_by="creation desc"),
        "naechsterSchritt": naechster_schritt({**doc.as_dict(), **zaehler}),
        "fristen": doc.fristen_info(),
        "sla": doc.sla_info(),
    }


@frappe.whitelist(methods=["GET", "POST"])
def get_technician_slots(datum, dauer_min=60, techniker=None):
    """Freie Zeitfenster je Techniker an einem Tag (Konzept §12: freie_slots_techniker): belegte Einsätze + Puffer,
    Technikertag aus PH Service Einstellungen. techniker leer = alle Benutzer mit Rolle PH Techniker."""
    from ph_service.utils.einsatz import freie_fenster

    frappe.has_permission("PH Serviceeinsatz", "read", throw=True)
    einst = einstellungen()
    if techniker:
        liste = [techniker]
    else:
        liste = [r.parent for r in frappe.get_all("Has Role", filters={"role": "PH Techniker", "parenttype": "User"}, fields=["parent"]) if r.parent not in ("Administrator", "Guest")]
    out = {}
    for t in sorted(set(liste)):
        belegt = [(e.zeit_von or "08:00", e.zeit_bis) for e in frappe.get_all("PH Serviceeinsatz", filters={"datum": datum, "status": ("in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"]), "techniker": t}, fields=["zeit_von", "zeit_bis"])]
        belegt += [(e.zeit_von or "08:00", e.zeit_bis) for e in frappe.get_all("PH Serviceeinsatz", filters={"datum": datum, "status": ("in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"]), "techniker_2": t}, fields=["zeit_von", "zeit_bis"])]
        if frappe.db.exists("DocType", "PH Abwesenheit"):
            try:
                ma = frappe.db.get_value("PH Mitarbeiter", {"user": t}, "name")
                if ma and frappe.db.exists("PH Abwesenheit", {"mitarbeiter": ma, "von": ("<=", datum), "bis": (">=", datum), "status": ("in", ["Genehmigt", "Beantragt"])}):
                    out[t] = []
                    continue
            except Exception:  # noqa: BLE001 – Feldnamen ph_personal abweichend
                pass
        out[t] = [{"von": a, "bis": b} for a, b in freie_fenster(belegt, str(einst["techniker_tag_von"])[:5], str(einst["techniker_tag_bis"])[:5], int(dauer_min), 30, int(einst["einsatz_puffer_min"]))]
    return {"datum": str(datum), "dauerMin": int(dauer_min), "techniker": out}
