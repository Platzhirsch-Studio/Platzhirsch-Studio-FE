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
from ph_marketing.utils import eventlogik
from ph_marketing.utils.token import email_normalisieren, email_plausibel, hash_token, neuer_token

BELEGT_STATUS = ("angemeldet", "bestaetigt", "erschienen")


def belegte_plaetze(event):
    return sum(cint(a.personen) or 1 for a in event.anmeldungen if a.status in BELEGT_STATUS)


def plaetze_aktualisieren(event):
    belegt = belegte_plaetze(event)
    event.plaetze_belegt = belegt
    event.plaetze_frei = max(cint(event.kapazitaet) - belegt, 0) if event.kapazitaet else None


def _zeilen(event):
    return [{"name": a.name, "status": a.status, "personen": a.personen, "eingeladen": cint(a.get("eingeladen")), "angemeldet_am": a.angemeldet_am} for a in event.anmeldungen]


def ist_eingeladen(event, email):
    return any(e.email == email and e.status in ("gesendet", "angemeldet") for e in (event.get("einladungen") or []))


def ist_ausgebucht(event, personen=1, eingeladen=False):
    """Kontingent für Eingeladene beachten (utils/eventlogik.frei)."""
    f = eventlogik.frei(event.kapazitaet, _zeilen(event), eingeladen=eingeladen, kontingent=event.get("kontingent_einladung"), kontingent_bis=event.get("kontingent_bis"), heute=nowdate())
    return f is not None and cint(personen) > f


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


def anmelden(event_id, name_person, email, personen=1, telefon="", nachricht="", quelle="website", textversion="", kontakt=None, anfrage=None, idempotency_key=None, begleitung="", utm=None):
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
    eingeladen = ist_eingeladen(event, email)
    if ist_ausgebucht(event, personen, eingeladen=eingeladen):
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
            "eingeladen": int(eingeladen),
            "begleitung": escape_html((begleitung or "").strip())[:140] or None,
        },
    )
    for e in event.get("einladungen") or []:
        if e.email == email and e.status == "gesendet":
            e.status = "angemeldet"
    event.flags.ignore_permissions = True
    event.save()  # on_update → status_nach_plaetzen (db_set)
    try:
        bestaetigung_senden(event, zeile, token)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Event Bestätigung {event.name} → {email}")
    if utm or event.kampagne:
        try:
            from ph_marketing.ph_marketing import kampagnen

            kampagnen.kontaktpunkt(utm or {}, "Event-Anmeldung", email=email, kontakt=kontakt, referenz=("PH Event", f"{event.name}/{zeile.name}"), kampagne=None if (utm or {}).get("utm_campaign") else event.kampagne)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Event Kontaktpunkt {event.name}")
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
    event.save()  # on_update → status_nach_plaetzen (db_set) + Nachrücken
    return {"status": "abgesagt", "event": event.name}


# ── Warteliste: automatisch nachrücken (Konzept L6) ─────────────────────────
def nachruecken(event, mail=True):
    """Wartende in Anmeldereihenfolge auf „angemeldet“ setzen, solange Plätze frei sind (Kontingent beachtet).
    db_set statt save (läuft aus on_update). → Anzahl."""
    if not cint(event.get("nachruecken_automatisch")) or event.status in ("Durchgefuehrt", "Abgesagt"):
        return 0
    if event.datum and getdate(event.datum) < getdate(nowdate()):
        return 0
    zeilen = eventlogik.nachruecker(_zeilen(event), event.kapazitaet, event.get("kontingent_einladung"), event.get("kontingent_bis"), nowdate())
    n = 0
    for z in zeilen:
        frappe.db.set_value("PH Event Anmeldung", z["name"], {"status": "angemeldet", "nachgerueckt_am": now_datetime()})
        a = next((x for x in event.anmeldungen if x.name == z["name"]), None)
        if a:
            a.status = "angemeldet"
        n += 1
        if mail and a and a.email and not str(a.email).endswith(".invalid"):
            try:
                vorlage = event.get("nachrueck_vorlage") or "event_nachgerueckt"
                ctx = {**_event_ctx(event), "anrede": versand.anrede_fuer(a.name_person), "personen": a.personen}
                betreff, html = versand.rendern(vorlage, ctx)
                versand.sende(a.email, betreff, html, referenz_doctype="PH Event", referenz_name=event.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Event Nachrücken-Mail {event.name}")
    if n:
        event.add_comment("Info", _("{0} Anmeldung(en) von der Warteliste nachgerückt").format(n))
        status_nach_plaetzen(event)
    return n


def kontingente_freigeben():
    """Täglich: Kontingent abgelaufen (kontingent_bis gestern) → freie Plätze an die Warteliste."""
    n = 0
    for name in frappe.get_all("PH Event", filters={"status": ("in", ("Offen", "Ausgebucht")), "kontingent_bis": add_days(nowdate(), -1)}, pluck="name"):
        n += nachruecken(frappe.get_doc("PH Event", name))
        frappe.db.commit()
    return n


# ── Einladung an ein Segment (Zweck einladungen) mit Kontingent ─────────────
def einladungen_senden(event, trockenlauf=True, limit=500):
    """Empfänger = Segment (Einwilligung „einladungen“ zwingend, utils/segment.py) ohne bereits Eingeladene/Angemeldete.
    trockenlauf → nur zählen. → dict(empfaenger, gesendet, uebersprungen)."""
    if not event.get("einladung_segment"):
        frappe.throw(_("Kein Segment für die Einladung gewählt."))
    if event.status not in ("Offen", "Geplant"):
        frappe.throw(_("Einladungen nur für geplante oder offene Events."))
    from ph_marketing.ph_marketing import segmente

    profile = segmente.empfaenger(event.einladung_segment, "einladungen")
    schon = {e.email for e in event.get("einladungen") or []} | {a.email for a in event.anmeldungen}
    neu = [p for p in profile if p["email"] not in schon][: cint(limit) or 500]
    if cint(trockenlauf):
        return {"empfaenger": len(neu), "gesendet": 0, "uebersprungen": len(profile) - len(neu)}
    vorlage = event.get("einladung_vorlage") or "event_einladung"
    gesendet = 0
    for p in neu:
        zeile = {"email": p["email"], "kontakt": p.get("kontakt"), "status": "geplant", "einwilligung": frappe.db.get_value("PH Einwilligung", {"email": p["email"], "zweck": "einladungen", "status": "Bestaetigt"}, "name")}
        try:
            ctx = {**_event_ctx(event), "anrede": "Guten Tag", "anmelden_url": event.url or versand.website_url("/de/adventsabend"), "abmelde_url": versand.website_url(einstellungen()["abmelden_pfad"]) + "?zweck=einladungen", "kontingent_bis": versand.datum_lang(event.get("kontingent_bis")) if event.get("kontingent_bis") else ""}
            betreff, html = versand.rendern(vorlage, ctx)
            versand.sende(p["email"], betreff, html, referenz_doctype="PH Event", referenz_name=event.name, absender_art="gastgeberin")
            zeile.update(status="gesendet", gesendet_am=now_datetime())
            gesendet += 1
        except Exception as ex:  # noqa: BLE001
            zeile.update(status="fehler", grund=str(ex)[:140])
            frappe.log_error(title=f"PH Event Einladung {event.name}")
        event.append("einladungen", zeile)
    event.einladungen_gesendet = cint(event.get("einladungen_gesendet")) + gesendet
    event.flags.ignore_permissions = True
    event.flags.kein_nachruecken = True
    event.save()
    return {"empfaenger": len(neu), "gesendet": gesendet, "uebersprungen": len(profile) - len(neu)}


# ── Event abgesagt: Teilnehmer informieren (Konzept L7) ─────────────────────
def absage_an_teilnehmer(event, hinweis=""):
    """Mail an alle angemeldeten/wartenden Teilnehmer (einmal je Zeile). → Anzahl."""
    vorlage = event.get("absage_vorlage") or "event_absage"
    n = 0
    for a in event.anmeldungen:
        if a.status not in ("angemeldet", "bestaetigt", "warteliste") or a.get("absage_mail_am") or str(a.email or "").endswith(".invalid"):
            continue
        try:
            ctx = {**_event_ctx(event), "anrede": versand.anrede_fuer(a.name_person), "hinweis": escape_html(hinweis or "")}
            betreff, html = versand.rendern(vorlage, ctx)
            versand.sende(a.email, betreff, html, referenz_doctype="PH Event", referenz_name=event.name, absender_art="gastgeberin")
            frappe.db.set_value("PH Event Anmeldung", a.name, "absage_mail_am", now_datetime(), update_modified=False)
            n += 1
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Event Absage-Mail {event.name}")
    return n


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
    if zeile.status != "warteliste" and zeile.name:
        try:
            from ph_marketing.ph_marketing import checkin

            ctx["checkin_code"] = checkin.code_fuer(event.name, zeile.name)
        except Exception:  # noqa: BLE001 – ohne Schlüssel (Tests) einfach ohne Code
            ctx["checkin_code"] = ""
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
            a.update({"name_person": "gelöscht", "email": "geloescht@platzhirsch.invalid", "telefon": None, "nachricht": None, "notiz": None, "anmelde_token_hash": None, "kontakt": None, "anfrage": None, "begleitung": None, "checkin_durch": None})
        for e in ev.get("einladungen") or []:
            e.update({"email": "geloescht@platzhirsch.invalid", "name_person": None, "kontakt": None})
        ev.anmeldungen_geloescht_am = now_datetime()
        ev.flags.ignore_permissions = True
        ev.flags.ignore_validate = True
        ev.save()
        frappe.db.commit()
        n += 1
    return n
