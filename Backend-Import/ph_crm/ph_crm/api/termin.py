"""Website-API der Terminbuchung (ph_crm.api.*) – Namen und Parameter exakt wie
src/lib/booking/adapters/frappe.js und Spec Marktresearch/digital/features/online-termin-video.md B3.

  GET  get_terminarten(sprache)
  GET  get_freie_slots(terminart, modus, von, bis, berater?, zeitzone)      → [{start, ende, berater:[…]}]
  POST create_termin(terminart, modus, thema, start, zeitzone, vorname, nachname, email, telefon,
                     plz_ort, anliegen, sprache, einwilligung_video, einwilligung_text_version,
                     verify_hash, link_version, kundenmail, quelle, idempotency_key)
                                                                            → Termin (Unbestaetigt, reserviert_bis)
  POST verify_termin(referenz, verify_hash)                                 → Termin (+ bereits_bestaetigt)
  GET  get_termin(referenz)                                                 → Termin (mit E-Mail: Server-Aufrufer)
  POST cancel_termin(referenz, link_version)                                → Termin (Storniert)
  POST reschedule_termin(referenz, link_version, neuer_start, berater?)     → Termin (link_version + 1)
  POST get_meet_link(referenz, link_version)                                → {meet_url} | {verfuegbar_ab}

Fehlercodes (Website CODES/DOMAIN): invalid_token 404, slot_taken 409, too_late_to_change 409,
expired/verify_expired/cancelled 410, outside_window 422, rate_limited 429, invalid 400.
Zeiten: Eingang ISO 8601 (UTC oder Offset), Speicherung Site-Zeit, Ausgabe ISO mit Offset.
"""

import hashlib
import time
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_to_date, cint, getdate, now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
from ph_crm.ph_crm.doctype.ph_termin.ph_termin import AKTIV, hash_pruefen
from ph_crm.ph_crm.doctype.ph_termin_einstellungen.ph_termin_einstellungen import einstellungen
from ph_crm.ph_crm.kalender import freie_slots, slot_pruefen, terminart_laden
from ph_crm.utils.zeit import iso, nach_site, parse_iso

TERMIN_FELDER = ["name", "referenz", "status", "start", "verify_hash", "link_version"]


def _termin(referenz):
    """PH Termin per Kundenreferenz; unbekannt → invalid_token 404 (Website: Link ungültig)."""
    name = frappe.db.get_value("PH Termin", {"referenz": text(referenz, 20).upper()}, "name") if referenz else None
    if not name:
        raise ApiFehler("invalid_token", 404, _("Termin unbekannt."))
    return frappe.get_doc("PH Termin", name)


def _link_pruefen(doc, link_version):
    """Verwaltungslink: Version muss passen; unbestätigte Buchungen haben noch keinen Verwaltungslink."""
    if cint(link_version) != cint(doc.link_version or 1) or (doc.status == "Unbestaetigt" and not doc.email_verifiziert):
        raise ApiFehler("invalid_token", 404, _("Link ungültig oder veraltet."))


def _start_parsen(wert):
    dt = parse_iso(wert)
    if not dt:
        raise ApiFehler("outside_window", 422, _("Zeitpunkt ungültig."))
    return nach_site(dt)


def _email_rate_limit(email, grenze=5, fenster_s=300):
    """Zusätzlich zum Decorator: 5 Buchungen je 5 Minuten je E-Mail-Hash (Spec B3)."""
    h = hashlib.sha256(email.encode()).hexdigest()[:16]
    key = f"ph_crm:termin:{h}:{int(time.time() // fenster_s)}"
    cache = frappe.cache()
    n = cache.incr(key) if hasattr(cache, "incr") else None
    if n is None:
        n = cint(cache.get_value(key)) + 1
        cache.set_value(key, n, expires_in_sec=fenster_s * 2)
    elif n == 1:
        cache.expire(key, fenster_s * 2)
    if n > grenze:
        raise ApiFehler("rate_limited", 429, _("Zu viele Buchungen – bitte später erneut versuchen."))


# ── Lesend ───────────────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_terminarten(sprache="de", **_rest):
    arten = frappe.get_all("PH Terminart", filters={"aktiv": 1, "website_sichtbar": 1}, pluck="name", order_by="sortierung asc, titel_de asc")
    return [frappe.get_cached_doc("PH Terminart", a).fuer_website(sprache) for a in arten]


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_freie_slots(terminart=None, modus=None, von=None, bis=None, berater=None, zeitzone=None, ausser=None, **_rest):
    pflicht({"terminart": terminart, "von": von, "bis": bis}, "terminart", "von", "bis")
    art = terminart_laden(terminart)
    modus_intern = art.modus_aufloesen(modus)
    if not modus_intern:
        raise ApiFehler("invalid", 400, _("Modus passt nicht zur Terminart."), {"field": "modus"})
    try:
        von_tag, bis_tag = getdate(von), getdate(bis)
    except Exception as e:  # noqa: BLE001
        raise ApiFehler("invalid", 400, _("Datum ungültig.")) from e
    slots = freie_slots(art, modus_intern, von_tag, bis_tag, berater=berater or None, ausser=ausser or None)
    return [{"start": iso(s["start"]), "ende": iso(s["ende"]), "berater": s["berater"]} for s in slots]


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_termin(referenz=None, link_version=None, **_rest):
    """Zusammenfassung für den Website-Server (Absage-/Umbuchungsmails brauchen die E-Mail).
    Mit link_version wird der Verwaltungslink geprüft; ohne (Server-intern) nur die Referenz."""
    doc = _termin(referenz)
    if link_version is not None and str(link_version) != "":
        _link_pruefen(doc, link_version)
    return doc.antwort(mit_email=True)


# ── Schreibend ───────────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=30, referenz=lambda r: ("PH Termin", r["name"]))
def create_termin(**d):
    pflicht(d, "terminart", "start", "nachname", "email")
    art = terminart_laden(d["terminart"])
    modus = art.modus_aufloesen(d.get("modus"))
    if not modus:
        raise ApiFehler("invalid", 400, _("Modus passt nicht zur Terminart."), {"field": "modus"})
    email = text(d.get("email"), 254).lower()
    if "@" not in email:
        raise ApiFehler("invalid", 400, _("E-Mail ungültig."), {"field": "email"})
    if modus == "Vor Ort":
        pflicht(d, "telefon", "plz_ort")
    if modus == "Video" and not cint(d.get("einwilligung_video")):
        raise ApiFehler("invalid", 400, _("Einwilligung zur Videoberatung fehlt."), {"field": "einwilligung_video"})
    _email_rate_limit(email)
    start = _start_parsen(d.get("start"))
    e = einstellungen()

    # Sperre + Kollisionsprüfung in einer Transaktion (SELECT … FOR UPDATE auf überlappende Termine).
    berater = slot_pruefen(art, modus, start, berater=d.get("berater") or None, for_update=True)

    doc = frappe.get_doc(
        {
            "doctype": "PH Termin",
            "terminart": art.name,
            "modus": modus,
            "thema": text(d.get("thema"), 40) or None,
            "start": start,
            "dauer_min": art.dauer_min,
            "berater": berater,
            "status": "Unbestaetigt",
            "email_verifiziert": 0,
            "reserviert_bis": add_to_date(now_datetime(), minutes=e["reservierung_min"]),
            "verify_hash": text(d.get("verify_hash"), 128),
            "manage_hash": text(d.get("manage_hash"), 128) or None,
            "link_version": cint(d.get("link_version")) or 1,
            "sequence": 0,
            "vorname": text(d.get("vorname"), 100),
            "nachname": text(d.get("nachname"), 100),
            "email": email,
            "telefon": text(d.get("telefon"), 40),
            "plz_ort": text(d.get("plz_ort"), 140),
            "anliegen": text(d.get("anliegen"), 1000),
            "sprache": (d.get("sprache") or "de")[:2],
            "einwilligung_video": cint(d.get("einwilligung_video")),
            "einwilligung_text_version": text(d.get("einwilligung_text_version"), 80) or None,
            "einwilligung_zeitpunkt": now_datetime() if cint(d.get("einwilligung_video")) else None,
            "kundenmail": "website" if (d.get("kundenmail") or "website") == "website" else "backoffice",
            "quelle": d.get("quelle") if d.get("quelle") in ("website", "agent") else "website",
            "zeitzone": text(d.get("zeitzone"), 40) or e["zeitzone"],
            "ip_hash": ip_hash(),
        }
    )
    if not doc.verify_hash:
        raise ApiFehler("invalid", 400, _("verify_hash fehlt."), {"field": "verify_hash"})
    doc.flags.ignore_permissions = True
    doc.insert()
    return doc.antwort(mit_email=True, name=doc.name)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def verify_termin(referenz=None, verify_hash=None, **_rest):
    """Double-Opt-in: Bestätigungslink aus der Mail. automatisch → Bestaetigt (+ Event, Meet-Raum);
    manuell (Vor Ort) → bleibt Unbestaetigt mit email_verifiziert = 1 und Team-Aufgabe."""
    doc = _termin(referenz)
    if not hash_pruefen(doc.verify_hash, verify_hash):
        raise ApiFehler("invalid_token", 404, _("Bestätigungslink ungültig."))
    if doc.status in ("Storniert", "Abgelehnt"):
        raise ApiFehler("cancelled", 410, _("Termin wurde storniert."))
    if doc.status != "Unbestaetigt" or doc.email_verifiziert:
        return doc.antwort(mit_email=True, bereits_bestaetigt=1)

    jetzt = now_datetime()
    if doc.reserviert_bis and jetzt > doc.reserviert_bis:
        # Reservierung abgelaufen: Uhrzeit nur übernehmen, wenn sie noch frei ist (wie Website-Mock).
        art = terminart_laden(doc.terminart, aktiv_pflicht=False)
        try:
            slot_pruefen(art, doc.modus, doc.start, berater=doc.berater, ausser=doc.name, for_update=True)
        except ApiFehler as e:
            raise ApiFehler("verify_expired", 410, _("Bestätigungslink abgelaufen – bitte neu buchen.")) from e

    from ph_crm.utils.workflow import status_setzen

    if doc.bestaetigung == "manuell":
        doc.db_set({"email_verifiziert": 1, "reserviert_bis": None}, notify=True)
        doc.add_comment("Info", _("E-Mail bestätigt – Anfrage wartet auf Bestätigung durch das Team."))
        _team_aufgabe(doc)
    else:
        status_setzen(doc, "Bestaetigt", _("E-Mail bestätigt (Double-Opt-in)"), email_verifiziert=1, reserviert_bis=None, bestaetigt_am=jetzt)
        doc.reload()
        if einstellungen()["event_anlegen"] and not doc.event:
            try:
                doc.event_anlegen()
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Termin {doc.name}: Event nach verify fehlgeschlagen")
        if doc.modus == "Video" and einstellungen()["meet_aktiv"]:
            frappe.enqueue("ph_crm.ph_crm.tasks.meet_raum_anlegen", termin=doc.name, queue="short", enqueue_after_commit=True)
    doc.reload()
    return doc.antwort(mit_email=True, bereits_bestaetigt=0)


def _team_aufgabe(doc):
    try:
        empfaenger = einstellungen()["leitung_user"]
        frappe.get_doc(
            {
                "doctype": "PH Aufgabe",
                "titel": _("Vor-Ort-Anfrage {0} bestätigen").format(doc.referenz),
                "beschreibung": _("Kunde {0} {1} hat die E-Mail bestätigt. Termin prüfen, bestätigen oder absagen.").format(doc.vorname or "", doc.nachname or ""),
                "faellig": add_to_date(now_datetime(), days=1).date(),
                "prioritaet": "Hoch",
                "zugewiesen_an": empfaenger,
                "referenz_doctype": "PH Termin",
                "referenz_name": doc.name,
            }
        ).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Termin {doc.name}: Team-Aufgabe fehlgeschlagen")


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def cancel_termin(referenz=None, link_version=None, grund=None, **_rest):
    doc = _termin(referenz)
    _link_pruefen(doc, link_version)
    if doc.status == "Storniert":
        return doc.antwort(mit_email=True, bereits_storniert=1)
    if doc.status not in AKTIV:
        raise ApiFehler("too_late_to_change", 409, _("Termin kann nicht mehr geändert werden."))
    if doc.start <= now_datetime():
        raise ApiFehler("too_late_to_change", 409, _("Termin hat bereits begonnen."))
    from ph_crm.utils.workflow import status_setzen

    status_setzen(doc, "Storniert", _("Vom Kunden über die Website storniert."), storno_grund=text(grund, 300) or _("durch Kunde"), sequence=cint(doc.sequence) + 1, meet_url=None)
    doc.reload()
    doc.event_setzen(status="Cancelled")
    if doc.meet_raum_id:
        frappe.enqueue("ph_crm.ph_crm.tasks.meet_raum_loeschen", termin=doc.name, queue="short", enqueue_after_commit=True)
    return doc.antwort(mit_email=True)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def reschedule_termin(referenz=None, link_version=None, neuer_start=None, berater=None, **_rest):
    doc = _termin(referenz)
    _link_pruefen(doc, link_version)
    if doc.status not in AKTIV or doc.start <= now_datetime():
        raise ApiFehler("too_late_to_change", 409, _("Termin kann nicht mehr verschoben werden."))
    start = _start_parsen(neuer_start)
    art = terminart_laden(doc.terminart, aktiv_pflicht=False)
    frei = slot_pruefen(art, doc.modus, start, berater=berater or doc.berater, ausser=doc.name, for_update=True)
    doc.db_set(
        {
            "start": start,
            "ende": start + timedelta(minutes=doc.dauer_min or art.dauer_min),
            "berater": frei or doc.berater,
            "link_version": cint(doc.link_version) + 1,
            "sequence": cint(doc.sequence) + 1,
            "erinnerung_gesendet": None,
        },
        notify=True,
    )
    doc.reload()
    doc.db_set("titel", doc.bilde_titel(art), update_modified=False)
    doc.event_setzen(starts_on=doc.start, ends_on=doc.ende)
    doc.add_comment("Info", _("Vom Kunden über die Website umgebucht."))
    return doc.antwort(mit_email=True)


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_meet_link(referenz=None, link_version=None, **_rest):
    doc = _termin(referenz)
    _link_pruefen(doc, link_version)
    if doc.status != "Bestaetigt" or doc.modus != "Video":
        raise ApiFehler("not_found", 404, _("Kein Videoraum für diesen Termin."))
    ab = doc.start - timedelta(minutes=einstellungen()["meet_link_ab_min"])
    if now_datetime() < ab:
        return {"meet_url": None, "verfuegbar_ab": iso(ab)}
    if not doc.meet_url:
        return {"meet_url": None, "verfuegbar_ab": None, "hinweis": _("Videoraum nicht verfügbar – wir rufen Sie an.")}
    return {"meet_url": doc.meet_url, "verfuegbar_ab": iso(ab)}
