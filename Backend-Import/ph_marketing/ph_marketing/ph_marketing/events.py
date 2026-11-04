"""Events (PH Event): Anmeldung über Website/Backoffice, Plätze, Bestätigungs- und Erinnerungsmail, Löschfrist.

Website heute: Adventsabend-Formular sendet { name, email_address, telefon, ihre_nachricht (mit Personenzahl) } an
/api/kontakt (src/app/[locale]/adventsabend/AdventsabendForm.js). Neu: ph_marketing.api.register_event mit eigenen Feldern.
"""

import frappe
from frappe import _
from frappe.utils import add_days, add_months, cint, escape_html, getdate, now_datetime, nowdate

from ph_core.api import ApiFehler
from ph_marketing.ph_marketing import einwilligung as ew
from ph_marketing.ph_marketing import versand
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils.token import email_normalisieren, email_plausibel, hash_token, neuer_token

BELEGT_STATUS = ("angemeldet", "bestaetigt", "erschienen")


def belegte_plaetze(event):
    return sum(cint(a.personen) or 1 for a in event.anmeldungen if a.status in BELEGT_STATUS)


def plaetze_aktualisieren(event):
    belegt = belegte_plaetze(event)
    event.plaetze_belegt = belegt
    event.plaetze_frei = max(cint(event.kapazitaet) - belegt, 0) if event.kapazitaet else None


def ist_ausgebucht(event, personen=1):
    return bool(event.kapazitaet) and belegte_plaetze(event) + cint(personen) > cint(event.kapazitaet)


def status_nach_plaetzen(event):
    """Offen → Ausgebucht, wenn voll; Ausgebucht → Offen, wenn wieder frei. db_set, damit kein Workflow-Übergang nötig ist."""
    plaetze_aktualisieren(event)
    neu = None
    if event.status == "Offen" and event.kapazitaet and event.plaetze_frei == 0:
        neu = ("Ausgebucht", "PH Ausgebucht")
    elif event.status == "Ausgebucht" and (not event.kapazitaet or event.plaetze_frei > 0):
        neu = ("Offen", "PH Offen")
    werte = {"plaetze_belegt": event.plaetze_belegt, "plaetze_frei": event.plaetze_frei}
    if neu:
        werte.update(status=neu[0], workflow_state=neu[1])
    event.db_set(werte, update_modified=False)


def anmelden(event_id, name_person, email, personen=1, telefon="", nachricht="", quelle="website", textversion="", kontakt=None, anfrage=None, idempotency_key=None):
    """Anmeldung anlegen. → dict für API/Button. Fehler als ApiFehler (API) – der Decorator mappt sie."""
    if not frappe.db.exists("PH Event", event_id):
        raise ApiFehler("not_found", 404, _("Event nicht gefunden."))
    event = frappe.get_doc("PH Event", event_id)
    email = email_normalisieren(email)
    if not email_plausibel(email) or len((name_person or "").strip()) < 2:
        raise ApiFehler("invalid", 400, _("Name und gültige E-Mail sind nötig."))
    personen = cint(personen) or 1
    if personen < 1 or personen > (cint(event.max_personen_je_anmeldung) or 10):
        raise ApiFehler("invalid", 400, _("Personenzahl außerhalb des erlaubten Bereichs."))
    if event.status not in ("Offen", "Ausgebucht") and quelle == "website":
        raise ApiFehler("outside_window", 422, _("Anmeldung ist derzeit nicht möglich."))
    if event.status in ("Durchgefuehrt", "Abgesagt"):
        raise ApiFehler("expired", 410, _("Das Event liegt in der Vergangenheit oder wurde abgesagt."))

    bestehend = next((a for a in event.anmeldungen if a.email == email and a.status in BELEGT_STATUS + ("warteliste",)), None)
    if bestehend:
        # neutral: gleiche Antwort, keine zweite Anmeldung
        return {"success": True, "status": bestehend.status, "event": event.name, "personen": bestehend.personen, "bereits_angemeldet": True}

    status = "angemeldet"
    if ist_ausgebucht(event, personen):
        if not event.warteliste:
            raise ApiFehler("conflict", 409, _("Das Event ist ausgebucht."), {"ausgebucht": True})
        status = "warteliste"

    token = neuer_token()
    einw = ew.protokollieren(
        email,
        "einladungen",
        textversion or event.einwilligung_textversion or "event-2026-10",
        quelle=f"event:{event.name}",
        kanal="website" if quelle == "website" else "backoffice",
        bestaetigt=True,  # Anmeldung = Vertrag/Teilnahme (Art. 6 Abs. 1 lit. b), kein DOI; nur Nachweis des Hinweistextes
        bestaetigt_kanal=quelle,
        referenz=("PH Event", event.name),
        daten={"personen": personen, "art": "event_anmeldung"},
    )
    zeile = event.append(
        "anmeldungen",
        {
            "name_person": escape_html((name_person or "").strip())[:140],
            "email": email,
            "telefon": (telefon or "").strip()[:40],
            "personen": personen,
            "status": status,
            "quelle": quelle if quelle in ("website", "telefon", "showroom", "email", "backoffice") else "website",
            "angemeldet_am": now_datetime(),
            "kontakt": kontakt,
            "anfrage": anfrage,
            "einwilligung": einw.name,
            "textversion": einw.textversion,
            "nachricht": escape_html((nachricht or "").strip())[:500],
            "anmelde_token_hash": hash_token(token),
        },
    )
    event.flags.ignore_permissions = True
    event.save()  # on_update → status_nach_plaetzen (db_set)
    try:
        bestaetigung_senden(event, zeile, token)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Event Bestätigung {event.name} → {email}")
    return {"success": True, "status": status, "event": event.name, "personen": personen, "plaetze_frei": event.plaetze_frei, "bereits_angemeldet": False}


def absagen_mit_token(token):
    """Absage-Link aus der Bestätigungsmail (über Website → API)."""
    h = hash_token(token)
    if not h:
        return {"status": "ungueltig"}
    zeile = frappe.db.get_value("PH Event Anmeldung", {"anmelde_token_hash": h}, ["name", "parent", "status"], as_dict=True)
    if not zeile:
        return {"status": "ungueltig"}
    if zeile.status == "abgesagt":
        return {"status": "bereits_abgesagt"}
    event = frappe.get_doc("PH Event", zeile.parent)
    for a in event.anmeldungen:
        if a.name == zeile.name:
            a.status = "abgesagt"
    event.flags.ignore_permissions = True
    event.save()  # on_update → status_nach_plaetzen (db_set)
    return {"status": "abgesagt", "event": event.name}


def _event_ctx(event):
    return {
        "event_titel": escape_html(event.titel),
        "event_datum": versand.datum_lang(event.datum),
        "event_uhrzeit": str(event.uhrzeit_von)[:5] + " Uhr" if event.uhrzeit_von else "",
        "event_programm": event.programm or "",
        "event_url": event.url or versand.website_url("/de/adventsabend"),
        "event_ort": escape_html(event.ort or ""),
    }


def bestaetigung_senden(event, zeile, token=None):
    vorlage = event.bestaetigung_vorlage or "event_bestaetigung"
    ctx = {**_event_ctx(event), "anrede": versand.anrede_fuer(zeile.name_person), "personen": zeile.personen, "warteliste": zeile.status == "warteliste", "absagen_url": f"{versand.website_url('/de/adventsabend/absagen')}?token={token}" if token else ""}
    betreff, html = versand.rendern(vorlage, ctx)
    versand.sende(zeile.email, betreff, html, referenz_doctype="PH Event", referenz_name=event.name)
    frappe.db.set_value("PH Event Anmeldung", zeile.name, "bestaetigung_gesendet_am", now_datetime(), update_modified=False)


def erinnerung_senden(event, nur_fehlende=True):
    """Erinnerungsmail an alle angemeldeten/bestätigten Teilnehmer. → Anzahl."""
    vorlage = event.erinnerung_vorlage or "event_erinnerung"
    n = 0
    for a in event.anmeldungen:
        if a.status not in ("angemeldet", "bestaetigt"):
            continue
        if nur_fehlende and a.erinnerung_gesendet_am:
            continue
        try:
            ctx = {**_event_ctx(event), "anrede": versand.anrede_fuer(a.name_person), "personen": a.personen}
            betreff, html = versand.rendern(vorlage, ctx)
            versand.sende(a.email, betreff, html, referenz_doctype="PH Event", referenz_name=event.name)
            frappe.db.set_value("PH Event Anmeldung", a.name, "erinnerung_gesendet_am", now_datetime(), update_modified=False)
            n += 1
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Event Erinnerung {event.name} → {a.email}")
    if n:
        event.db_set("erinnerung_gesendet_am", now_datetime(), update_modified=False)
    return n


# ── Scheduler ───────────────────────────────────────────────────────────────
def erinnerungen_faellig():
    """Täglich: Events, deren Datum in `erinnerung_tage_vorher` Tagen liegt, ohne gesendete Erinnerung."""
    n = 0
    for name in frappe.get_all("PH Event", filters={"status": ("in", ("Offen", "Ausgebucht")), "erinnerung_gesendet_am": ("is", "not set"), "datum": (">=", nowdate())}, pluck="name"):
        ev = frappe.get_doc("PH Event", name)
        tage = cint(ev.erinnerung_tage_vorher) if ev.erinnerung_tage_vorher is not None else einstellungen()["event_erinnerung_tage"]
        if getdate(ev.datum) == getdate(add_days(nowdate(), tage)):
            n += erinnerung_senden(ev)
            frappe.db.commit()
    return n


def vergangene_schliessen():
    """Events nach dem Datum automatisch auf Durchgeführt (Teilnehmer-Status pflegt das Team)."""
    for name in frappe.get_all("PH Event", filters={"status": ("in", ("Offen", "Ausgebucht")), "datum": ("<", nowdate())}, pluck="name"):
        frappe.db.set_value("PH Event", name, {"status": "Durchgefuehrt", "workflow_state": "PH Durchgefuehrt"})
    frappe.db.commit()


def anmeldedaten_loeschen():
    """DSGVO: Löschfrist nach dem Event (Standard 3 Monate, event.js LOESCHFRIST_MONATE) – Personendaten anonymisieren, Zahlen bleiben."""
    n = 0
    for name in frappe.get_all("PH Event", filters={"status": ("in", ("Durchgefuehrt", "Abgesagt")), "anmeldungen_geloescht_am": ("is", "not set")}, pluck="name"):
        ev = frappe.get_doc("PH Event", name)
        monate = cint(ev.loeschfrist_monate) or einstellungen()["event_loeschfrist_monate"]
        if getdate(add_months(ev.datum, monate)) > getdate(nowdate()):
            continue
        for a in ev.anmeldungen:
            a.update({"name_person": "gelöscht", "email": "geloescht@platzhirsch.invalid", "telefon": None, "nachricht": None, "notiz": None, "anmelde_token_hash": None, "kontakt": None, "anfrage": None})
        ev.anmeldungen_geloescht_am = now_datetime()
        ev.flags.ignore_permissions = True
        ev.flags.ignore_validate = True
        ev.save()
        frappe.db.commit()
        n += 1
    return n
