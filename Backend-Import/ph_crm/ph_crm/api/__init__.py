"""Whitelisted Methoden von ph_crm für die Website (ph_crm.api.<name>).

Anfragen (hier):
  create_anfrage / create_contact  – nimmt die drei heutigen Website-Payloads UNVERÄNDERT an
  attach_upload(referenz, file …)  – Datei an PH Anfrage hängen (privat), upload_status pflegen
Termine (ph_crm/api/termin.py, hier re-exportiert, Namen wie src/lib/booking/adapters/frappe.js):
  get_terminarten, get_freie_slots, create_termin, verify_termin, get_termin, cancel_termin,
  reschedule_termin, get_meet_link

create_anfrage-Payloads (src/app/api/{kontakt,beratung_anfrage,anfrage_produkt}/route.js):
  kontakt_form.create_contact     { name, company, email_address, telefon, ihre_nachricht }
  anfrage.create_anfrage          { bei_meiner_anfrage_geht_es_um, das_projekt_soll_verwirklicht_werden,
                                    bitte_beschreiben_sie_ihr_vorhaben, vorname, nachname, email, telefon }
  anfrage_produkt.create_anfrage  { anfrage_type, anfrage_vorname, anfrage_nachname, anfrage_email,
                                    anfrage_phone, anfrage_country, anfrage_city, anfrage_address,
                                    anfrage_beschreibung, anfrage_company, anfrage_fiscal_number, produkte[] }
Zusätzlich optional: art, quelle, sprache, idempotency_key, einwilligung_text_version, upload_erwartet.
Der Herkunftsblock („── Herkunft (automatisch) ──“, src/lib/forms/leadPayload.js) wird aus dem Text
getrennt und in kanal / referenz_website / herkunft_block abgelegt.
Antwort: {"referenz": "<PH Anfrage name>", "status"} – der `name` ist die `ref` des Upload-Tickets.
"""

import re

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
from ph_crm.api.termin import (  # noqa: F401 – re-export: ph_crm.api.get_freie_slots usw.
    cancel_termin,
    create_termin,
    get_freie_slots,
    get_meet_link,
    get_termin,
    get_terminarten,
    reschedule_termin,
    verify_termin,
)

HERKUNFT_TITEL = "── Herkunft (automatisch) ──"
KONTEXT_RE = re.compile(r"^Kontext:\s*(.+)$", re.M)
UPLOAD_MAX_BYTES = 100 * 1024 * 1024  # darüber: S3-Link als File mit file_url (frappeAdapter.js)
UPLOAD_ERLAUBT = {"jpg", "jpeg", "png", "webp", "heic", "heif", "pdf", "mp4", "mov", "m4v", "webm", "dwg", "dxf", "zip"}


def _herkunft_trennen(nachricht):
    """→ (eigener_text, herkunft_block, {kanal, quelle, referenz, sprache})."""
    nachricht = str(nachricht or "")
    if HERKUNFT_TITEL not in nachricht:
        return nachricht.strip(), "", {}
    eigen, block = nachricht.split(HERKUNFT_TITEL, 1)
    werte = {}
    for zeile in block.splitlines():
        if ":" in zeile:
            k, v = zeile.split(":", 1)
            werte[k.strip().lower()] = v.strip()
    return eigen.strip(), (HERKUNFT_TITEL + block).strip(), werte


def _art_erkennen(d):
    if d.get("art"):
        return d["art"]
    if "anfrage_type" in d or "anfrage_email" in d:
        return "Produkt"
    if "bei_meiner_anfrage_geht_es_um" in d:
        return "Beratung"
    kontext = KONTEXT_RE.search(str(d.get("ihre_nachricht") or ""))
    if kontext:
        k = kontext.group(1).lower()
        if "gutschein" in k:
            return "Gutschein"
        if "reservierung" in k or "atelier" in k:
            return "Reservierung"
        if "empfehlung" in k:
            return "Empfehlung"
        if "ezarri" in k or "pool" in k:
            return "Ezarri"
    return "Kontakt"


def _name_teilen(voll):
    teile = str(voll or "").strip().split()
    if not teile:
        return "", ""
    if len(teile) == 1:
        return "", teile[0]
    return " ".join(teile[:-1]), teile[-1]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Anfrage", r["referenz"]))
def create_anfrage(**d):
    art = _art_erkennen(d)
    if art == "Produkt":
        pflicht(d, "anfrage_nachname", "anfrage_email")
        vorname, nachname = text(d.get("anfrage_vorname"), 100), text(d.get("anfrage_nachname"), 100)
        email, telefon = text(d.get("anfrage_email"), 254), text(d.get("anfrage_phone"), 40)
        firma = text(d.get("anfrage_company"), 200)
        plz_ort, land = text(d.get("anfrage_city"), 140), text(d.get("anfrage_country"), 100)
        roh = d.get("anfrage_beschreibung") or ""
        zusatz = [f"Kundenart: {text(d.get('anfrage_type'), 50)}", f"Adresse: {text(d.get('anfrage_address'), 300)}"]
        if d.get("anfrage_fiscal_number"):
            zusatz.append(f"UID/Steuernummer: {text(d.get('anfrage_fiscal_number'), 60)}")
    elif art == "Beratung":
        pflicht(d, "nachname", "email", "bitte_beschreiben_sie_ihr_vorhaben")
        vorname, nachname = text(d.get("vorname"), 100), text(d.get("nachname"), 100)
        email, telefon, firma = text(d.get("email"), 254), text(d.get("telefon"), 40), ""
        plz_ort = land = ""
        roh = d.get("bitte_beschreiben_sie_ihr_vorhaben")
        zusatz = []
    else:
        pflicht(d, "name", "email_address", "ihre_nachricht")
        vorname, nachname = _name_teilen(text(d.get("name"), 200))
        email, telefon, firma = text(d.get("email_address"), 254), text(d.get("telefon"), 40), text(d.get("company"), 200)
        plz_ort = land = ""
        roh = d.get("ihre_nachricht")
        zusatz = []

    eigen, block, herkunft = _herkunft_trennen(roh)
    anliegen = frappe.utils.escape_html(eigen)
    if zusatz:
        anliegen += "\n\n" + "\n".join(frappe.utils.escape_html(z) for z in zusatz)

    produkte = []
    for p in d.get("produkte") or []:
        if p is None:
            continue
        produkte.append({"produkt_slug": text(p, 140), "produkt_name": text(p, 140), "menge": 1})
    if len(produkte) > 300:
        raise ApiFehler("invalid", 400, "Zu viele Produkte.")

    doc = frappe.get_doc(
        {
            "doctype": "PH Anfrage",
            "art": art,
            "quelle": herkunft.get("quelle", "").split("/")[0].strip() if "ki-assistent" in herkunft.get("kanal", "").lower() else text(d.get("quelle"), 20) or "website",
            "kanal": text(herkunft.get("kanal"), 140),
            "sprache": (herkunft.get("sprache") or d.get("sprache") or "de")[:2],
            "referenz_website": text(herkunft.get("referenz") or d.get("lead_ref"), 140),
            "eingang": now_datetime(),
            "vorname": vorname,
            "nachname": nachname or "(ohne Nachname)",
            "firma": firma,
            "email": email,
            "telefon": telefon,
            "plz_ort": plz_ort,
            "land": land,
            "anliegen": anliegen.replace("\n", "<br>"),
            "projektart": text(d.get("bei_meiner_anfrage_geht_es_um"), 200),
            "objektart": text(d.get("das_projekt_soll_verwirklicht_werden"), 200),
            "herkunft_block": block,
            "einwilligung_text_version": text(d.get("einwilligung_text_version"), 80),
            "einwilligung_zeitpunkt": now_datetime(),
            "upload_status": "offen" if cint(d.get("upload_erwartet")) else None,
            "ip_hash": ip_hash(),
            "produkte": produkte,
        }
    )
    if doc.quelle not in ("website", "agent", "telefon", "showroom", "email", "empfehlung", "messe", "sonstige"):
        doc.quelle = "agent" if "agent" in doc.quelle else "website"
    doc.flags.ignore_permissions = False
    doc.insert()
    return {"referenz": doc.name, "status": doc.status}


# Alias für die alte Kontaktformular-Route (gleiche Logik, Art wird erkannt).
@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Anfrage", r["referenz"]))
def create_contact(**d):
    return create_anfrage.__wrapped__(**d)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60, referenz=lambda r: ("PH Anfrage", r["referenz"]))
def attach_upload(referenz=None, file_name=None, file_url=None, note=None, content_type=None, size=None, **_rest):
    """Datei der Website an eine PH Anfrage hängen (src/lib/upload/frappeAdapter.js).

    Zwei Wege: (a) multipart `file` im Request (wie frappe `upload_file`), (b) `file_url` (S3-Link für
    große Videos). Immer is_private = 1. Setzt upload_status = eingegangen, zählt upload_anzahl,
    übernimmt `note` in upload_note. Antwort: {referenz, file, upload_anzahl}.
    """
    pflicht({"referenz": referenz}, "referenz")
    if not frappe.db.exists("PH Anfrage", referenz):
        raise ApiFehler("not_found", 404, _("Anfrage unbekannt."))
    datei = frappe.request.files.get("file") if getattr(frappe, "request", None) and frappe.request.files else None
    if not datei and not file_url:
        raise ApiFehler("invalid", 400, _("Datei oder file_url fehlt."), {"field": "file"})
    name = text(file_name or (datei.filename if datei else "") or "upload", 140)
    endung = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if endung and endung not in UPLOAD_ERLAUBT:
        raise ApiFehler("invalid", 400, _("Dateityp nicht erlaubt."), {"field": "file_name"})
    werte = {"doctype": "File", "file_name": name, "is_private": 1, "folder": "Home/Attachments", "attached_to_doctype": "PH Anfrage", "attached_to_name": referenz}
    if datei:
        inhalt = datei.stream.read()
        if len(inhalt) > UPLOAD_MAX_BYTES:
            raise ApiFehler("invalid", 413, _("Datei zu groß – bitte als Link übergeben."))
        werte["content"] = inhalt
    else:
        url = text(file_url, 1000)
        if not url.startswith("https://"):
            raise ApiFehler("invalid", 400, _("file_url muss https sein."), {"field": "file_url"})
        werte["file_url"] = url
    f = frappe.get_doc(werte)
    f.flags.ignore_permissions = True
    f.insert()
    anzahl = cint(frappe.db.get_value("PH Anfrage", referenz, "upload_anzahl")) + 1
    update = {"upload_status": "eingegangen", "upload_anzahl": anzahl}
    if note:
        update["upload_note"] = text(note, 1000)
    frappe.db.set_value("PH Anfrage", referenz, update, update_modified=True)
    frappe.get_doc("PH Anfrage", referenz).add_comment("Attachment", _("Upload der Website: {0}").format(frappe.utils.escape_html(name)))
    return {"referenz": referenz, "file": f.name, "file_url": f.file_url if not datei else None, "upload_anzahl": anzahl}
