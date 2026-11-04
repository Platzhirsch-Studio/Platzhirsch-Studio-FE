"""Newsletter: Abo mit Double-Opt-in, Abmeldung mit Token, Ausgabenversand mit Protokoll.

Ablauf Abo (ersetzt platzhirsch_studio…subscribe_newsletter, src/lib/forms/newsletter.js):
  anmelden()     Abo „Angemeldet unbestaetigt“ + PH Einwilligung (Offen) + DOI-Mail mit Token-Link.
                 Antwort immer neutral (keine Adress-Enumeration, Art. 32 DSGVO).
  bestaetigen()  Token → Abo Aktiv, Einwilligung Bestaetigt, Zeitpunkt gespeichert, Token gelöscht.
  abmelden()     Token (aus jeder Mail) oder Mitarbeiter → Abgemeldet, Einwilligung Widerrufen, Protokoll.
  doi_erinnern() einmalige Erinnerung nach X Stunden; unbestaetigte_loeschen() nach 30 Tagen (DSGVO).
"""

import frappe
from frappe import _
from frappe.utils import add_days, add_to_date, cint, escape_html, get_datetime, now_datetime

from ph_marketing.ph_marketing import einwilligung as ew
from ph_marketing.ph_marketing import versand
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils import regeln
from ph_marketing.utils.token import email_normalisieren, email_plausibel, hash_token, neuer_token, token_plausibel

ABO = "PH Newsletter Abo"
UNBESTAETIGT = "Angemeldet unbestaetigt"


# ── Anmeldung ───────────────────────────────────────────────────────────────
def anmelden(email, sprache="de", interessen=None, textversion=None, quelle="website", quelle_detail="", kanal="website", anrede_name="", idempotency_key=None):
    """→ {"success": True, "doi": True|False}. Wirft nur bei ungültiger E-Mail."""
    email = email_normalisieren(email)
    if not email_plausibel(email):
        frappe.throw(_("E-Mail-Adresse ist ungültig."), frappe.ValidationError)
    e = einstellungen()
    interessen_liste = _interessen(interessen)
    abo = frappe.get_doc(ABO, email) if frappe.db.exists(ABO, email) else None

    if abo and abo.status == "Aktiv":
        # bereits aktiv: nur Interessen ergänzen, keine Mail, gleiche Antwort
        if interessen_liste:
            _interessen_setzen(abo, interessen_liste, anhaengen=True)
            abo.save(ignore_permissions=True)
        return {"success": True, "doi": False}
    if abo and abo.status in ("Bounce", "Beschwerde"):
        # Beschwerde/Bounce: keine erneute DOI-Mail automatisch (Mitarbeiter prüft), Antwort neutral
        return {"success": True, "doi": False}
    if abo and abo.status == UNBESTAETIGT and abo.doi_gesendet_am and get_datetime(abo.doi_gesendet_am) > add_to_date(now_datetime(), hours=-1):
        # innerhalb einer Stunde keine zweite DOI-Mail (Schutz vor Mail-Bombing)
        return {"success": True, "doi": True}

    token = neuer_token()
    jetzt = now_datetime()
    if not abo:
        abo = frappe.get_doc({"doctype": ABO, "email": email, "angemeldet_am": jetzt, "quelle": quelle if quelle in ("website", "showroom", "event", "shop", "portal", "import", "backoffice", "sonstige") else "sonstige"})
    abo.update(
        {
            "status": UNBESTAETIGT,
            "sprache": sprache if sprache in ("de", "en", "fr", "it") else "de",
            "quelle_detail": (quelle_detail or "")[:140],
            "anrede_name": (anrede_name or "")[:140],
            "textversion": (textversion or e["einwilligung_textversion"])[:80],
            "doi_token_hash": hash_token(token),
            "doi_gesendet_am": jetzt,
            "doi_erinnert_am": None,
            "abgemeldet_am": None,
            "abmelde_kanal": None,
            "idempotency_key": (idempotency_key or None),
            "quelle_system": "api" if kanal == "website" else "desk",
        }
    )
    if not abo.angemeldet_am:
        abo.angemeldet_am = jetzt
    _interessen_setzen(abo, interessen_liste)
    abo.flags.ignore_permissions = True
    abo.save() if not abo.is_new() else abo.insert()

    einw = ew.protokollieren(
        email,
        "newsletter",
        abo.textversion,
        quelle=quelle_detail or quelle,
        kanal=kanal,
        sprache=abo.sprache,
        interessen=",".join(interessen_liste),
        doi_token_hash=hash_token(token),
        referenz=(ABO, abo.name),
    )
    abo.db_set("einwilligung", einw.name, update_modified=False)
    _doi_mail(abo, token, erinnerung=False)
    return {"success": True, "doi": True}


def _interessen(interessen):
    if isinstance(interessen, str):
        interessen = [x.strip() for x in interessen.split(",")]
    gueltig = set(frappe.get_all("PH Interesse", filters={"aktiv": 1}, pluck="name"))
    return [i for i in (interessen or []) if i in gueltig][:10]


def _interessen_setzen(abo, liste, anhaengen=False):
    vorhanden = {r.interesse for r in abo.interessen} if anhaengen else set()
    if not anhaengen:
        abo.set("interessen", [])
    for i in liste:
        if i not in vorhanden:
            abo.append("interessen", {"interesse": i})


def _doi_mail(abo, token, erinnerung=False):
    e = einstellungen()
    ctx = {
        "zweck_text": regeln.ZWECK_TEXT["newsletter"],
        "gueltig_stunden": e["doi_gueltig_stunden"],
        "bestaetigen_url": versand.bestaetigen_url(token),
        "anrede": versand.anrede_fuer(abo.anrede_name),
    }
    betreff, html = versand.rendern("doi_erinnerung" if erinnerung else "doi_bestaetigen", ctx)
    versand.sende(abo.email, betreff, html, referenz_doctype=ABO, referenz_name=abo.name)


# ── Bestätigung (DOI) ───────────────────────────────────────────────────────
def bestaetigen(token, kanal="website"):
    """→ {"status": "bestaetigt"|"bereits_bestaetigt"|"abgelaufen"|"ungueltig", "sprache": …}."""
    if not token_plausibel(token):
        return {"status": "ungueltig"}
    h = hash_token(token)
    name = frappe.db.get_value(ABO, {"doi_token_hash": h}, "name")
    if not name:
        return {"status": "ungueltig"}
    abo = frappe.get_doc(ABO, name)
    e = einstellungen()
    if abo.status == "Aktiv":
        return {"status": "bereits_bestaetigt", "sprache": abo.sprache}
    if not abo.doi_gesendet_am or get_datetime(abo.doi_gesendet_am) < add_to_date(now_datetime(), hours=-e["doi_gueltig_stunden"]):
        return {"status": "abgelaufen", "sprache": abo.sprache}
    jetzt = now_datetime()
    abmelde_token = neuer_token()
    abo.db_set({"status": "Aktiv", "doi_bestaetigt_am": jetzt, "doi_token_hash": None, "abmelde_token_hash": hash_token(abmelde_token)}, update_modified=True)
    if abo.einwilligung:
        ew.bestaetigen(abo.einwilligung, kanal=kanal)
    else:
        einw = ew.protokollieren(abo.email, "newsletter", abo.textversion, quelle=abo.quelle_detail or abo.quelle, kanal=kanal, sprache=abo.sprache, bestaetigt=True, bestaetigt_kanal=kanal, referenz=(ABO, abo.name))
        abo.db_set("einwilligung", einw.name, update_modified=False)
    _email_group(abo, hinzufuegen=True)
    abo.add_comment("Info", _("Double-Opt-in bestätigt über {0}").format(kanal))
    return {"status": "bestaetigt", "sprache": abo.sprache}


def doi_erneut_senden(abo):
    """Button „DOI erneut senden“ (Mitarbeiter) – neuer Token, Zähler bleibt."""
    token = neuer_token()
    abo.db_set({"doi_token_hash": hash_token(token), "doi_gesendet_am": now_datetime(), "status": UNBESTAETIGT}, update_modified=True)
    if abo.einwilligung and frappe.db.get_value("PH Einwilligung", abo.einwilligung, "status") == "Offen":
        frappe.db.set_value("PH Einwilligung", abo.einwilligung, {"doi_token_hash": hash_token(token), "doi_gesendet_am": now_datetime()})
    _doi_mail(abo, token)


# ── Abmeldung ───────────────────────────────────────────────────────────────
def abmelden_mit_token(token):
    """→ {"status": "abgemeldet"|"bereits_abgemeldet"|"ungueltig"}."""
    if not token_plausibel(token):
        return {"status": "ungueltig"}
    name = frappe.db.get_value(ABO, {"abmelde_token_hash": hash_token(token)}, "name")
    if not name:
        return {"status": "ungueltig"}
    abo = frappe.get_doc(ABO, name)
    if abo.status == "Abgemeldet":
        return {"status": "bereits_abgemeldet", "sprache": abo.sprache}
    abmelden(abo, kanal="link")
    return {"status": "abgemeldet", "sprache": abo.sprache}


def abmelden(abo, kanal="backoffice", grund=None):
    """Abo abmelden, Einwilligung widerrufen, Email Group bereinigen. Token bleibt (Link darf mehrfach geklickt werden)."""
    neuer_status = {"bounce": "Bounce", "beschwerde": "Beschwerde"}.get(kanal, "Abgemeldet")
    abo.db_set({"status": neuer_status, "abgemeldet_am": now_datetime(), "abmelde_kanal": kanal, "abmelde_grund": (grund or "")[:140], "doi_token_hash": None}, update_modified=True)
    ew.widerrufen(abo.email, "newsletter", kanal=kanal, grund=grund)
    _email_group(abo, hinzufuegen=False)
    abo.add_comment("Info", _("Abgemeldet über {0}").format(kanal))


def _email_group(abo, hinzufuegen):
    group = einstellungen()["newsletter_email_group"]
    if not group:
        return
    try:
        if hinzufuegen and not frappe.db.exists("Email Group Member", {"email_group": group, "email": abo.email}):
            frappe.get_doc({"doctype": "Email Group Member", "email_group": group, "email": abo.email}).insert(ignore_permissions=True)
            abo.db_set("email_group", group, update_modified=False)
        elif not hinzufuegen:
            frappe.db.delete("Email Group Member", {"email_group": group, "email": abo.email})
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Newsletter Abo: Email Group")


# ── Scheduler ───────────────────────────────────────────────────────────────
def doi_erinnern():
    """Einmalige Erinnerung an unbestätigte Abos nach X Stunden (0 = aus), solange der Link noch gilt."""
    e = einstellungen()
    if not e["doi_erinnerung_nach_stunden"]:
        return 0
    von = add_to_date(now_datetime(), hours=-e["doi_gueltig_stunden"])
    bis = add_to_date(now_datetime(), hours=-e["doi_erinnerung_nach_stunden"])
    n = 0
    for name in frappe.get_all(ABO, filters={"status": UNBESTAETIGT, "doi_erinnert_am": ("is", "not set"), "doi_gesendet_am": ("between", [von, bis])}, pluck="name", limit=200):
        abo = frappe.get_doc(ABO, name)
        try:
            token = neuer_token()
            # Neuer Token, Gültigkeit läuft ab dem ursprünglichen doi_gesendet_am weiter (kein Verlängern durch Erinnerung).
            abo.db_set({"doi_token_hash": hash_token(token), "doi_erinnert_am": now_datetime()}, update_modified=False)
            if abo.einwilligung:
                frappe.db.set_value("PH Einwilligung", abo.einwilligung, {"doi_token_hash": hash_token(token), "doi_erinnert_am": now_datetime()})
            _doi_mail(abo, token, erinnerung=True)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Newsletter DOI-Erinnerung {name}")
    return n


def unbestaetigte_loeschen():
    """DSGVO: unbestätigte Abos samt offener Einwilligung nach N Tagen löschen (Standard 30)."""
    e = einstellungen()
    grenze = add_days(now_datetime(), -e["unbestaetigt_loeschen_tage"])
    n = 0
    for name in frappe.get_all(ABO, filters={"status": UNBESTAETIGT, "angemeldet_am": ("<", grenze)}, pluck="name", limit=500):
        try:
            frappe.db.delete("PH Einwilligung", {"referenz_doctype": ABO, "referenz_name": name, "status": "Offen"})
            frappe.delete_doc(ABO, name, ignore_permissions=True, force=True)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Newsletter Abo löschen {name}")
    # verwaiste offene Einwilligungen anderer Zwecke (Einladungen etc.) ebenfalls nach Ablauf → Abgelaufen
    for name in frappe.get_all("PH Einwilligung", filters={"status": "Offen", "zeitpunkt": ("<", grenze)}, pluck="name", limit=500):
        ew.abgelaufen_markieren(name)
    frappe.db.commit()
    return n


# ── Ausgabe versenden ───────────────────────────────────────────────────────
def empfaenger_fuer(ausgabe):
    """Aktive Abos passend zur Zielgruppe; nie Altbestand ohne DOI."""
    e = einstellungen()
    if ausgabe.zielgruppe == "Testadresse":
        return [{"name": None, "email": e["test_empfaenger"] or e["team_email"], "abmelde_token_hash": None, "anrede_name": "", "sprache": "de"}]
    filters = {"status": "Aktiv", "altbestand_ohne_doi": 0}
    if ausgabe.zielgruppe == "Sprache":
        filters["sprache"] = ausgabe.sprache
    abos = frappe.get_all(ABO, filters=filters, fields=["name", "email", "anrede_name", "sprache", "abmelde_token_hash"], order_by="angemeldet_am asc")
    if ausgabe.zielgruppe == "Interesse" and ausgabe.zielgruppe_interesse:
        mit = set(frappe.get_all("PH Newsletter Abo Interesse", filters={"interesse": ausgabe.zielgruppe_interesse, "parenttype": ABO}, pluck="parent"))
        abos = [a for a in abos if a.name in mit]
    return abos


def ausgabe_html(ausgabe, abmelde_link="{{ abmelde_url }}", anrede="Guten Tag", einwilligung_datum=""):
    """HTML der Ausgabe aus den sichtbaren Blöcken (Vorlage newsletter_basis)."""
    bloecke = []
    for b in ausgabe.bloecke:
        if not regeln.block_sichtbar(b):
            continue
        d = b.as_dict()
        if b.typ == "termine" and b.event and frappe.db.exists("PH Event", b.event):
            ev = frappe.get_cached_doc("PH Event", b.event)
            d["event_titel"] = ev.titel
            d["event_datum"] = versand.datum_lang(ev.datum)
            d["event_uhrzeit"] = str(ev.uhrzeit_von)[:5] if ev.uhrzeit_von else ""
            d["event_url"] = ev.url or ""
        if d.get("bild"):
            d["bild_abs"] = frappe.utils.get_url(d["bild"]) if str(d["bild"]).startswith("/") else d["bild"]
        bloecke.append(d)
    ctx = {
        "betreff": ausgabe.betreff,
        "preheader": ausgabe.preheader or regeln.preheader(ausgabe.bloecke),
        "inhalt_zeile": regeln.inhalt_zeile(ausgabe.bloecke),
        "bloecke": bloecke,
        "slug": ausgabe.slug,
        "anrede": anrede,
        "abmelde_url": abmelde_link,
        "einwilligung_datum": einwilligung_datum,
        "fusszeile_html": versand.fusszeile_html("E", abmelde_link, einwilligung_datum),
    }
    return versand.rendern("newsletter_basis", ctx)


def versand_vorbereiten(ausgabe):
    """Workflow Geplant → Wird versendet: Protokollzeilen „geplant“ anlegen (idempotent)."""
    vorhanden = set(frappe.get_all("PH Newsletter Versand", filters={"ausgabe": ausgabe.name}, pluck="email"))
    n = 0
    for a in empfaenger_fuer(ausgabe):
        if a["email"] in vorhanden:
            continue
        frappe.get_doc({"doctype": "PH Newsletter Versand", "ausgabe": ausgabe.name, "abo": a["name"], "email": a["email"], "status": "geplant"}).insert(ignore_permissions=True)
        n += 1
    ausgabe.db_set({"status": "Wird versendet", "versand_begonnen": now_datetime(), "empfaenger_anzahl": len(vorhanden) + n, "versandweg": einstellungen()["versandweg"]}, update_modified=True)
    return n


def versand_stapel(ausgabe, limit=None):
    """Sendet bis zu `limit` geplante Zeilen; schließt die Ausgabe ab, wenn nichts mehr offen ist. → gesendet in diesem Lauf."""
    e = einstellungen()
    limit = limit or e["versand_stapel"]
    zeilen = frappe.get_all("PH Newsletter Versand", filters={"ausgabe": ausgabe.name, "status": "geplant"}, fields=["name", "abo", "email"], limit=limit, order_by="creation asc")
    gesendet = 0
    for z in zeilen:
        abo = frappe.get_doc(ABO, z.abo) if z.abo and frappe.db.exists(ABO, z.abo) else None
        if abo and abo.status != "Aktiv":
            frappe.db.set_value("PH Newsletter Versand", z.name, {"status": "uebersprungen", "grund": f"Abo {abo.status}"})
            continue
        try:
            token = None
            if abo:
                if not abo.abmelde_token_hash:
                    token = neuer_token()
                    abo.db_set("abmelde_token_hash", hash_token(token), update_modified=False)
                else:
                    # Token nur als Hash gespeichert: für den Link einen frischen Token setzen (alte Links werden ungültig,
                    # die Abmeldung über die Website bleibt per E-Mail möglich).
                    token = neuer_token()
                    abo.db_set("abmelde_token_hash", hash_token(token), update_modified=False)
            link = versand.abmelde_url(token) if token else versand.website_url(e["abmelden_pfad"])
            datum = frappe.utils.formatdate(abo.doi_bestaetigt_am, "dd.MM.yyyy") if abo and abo.doi_bestaetigt_am else ""
            betreff, html = ausgabe_html(ausgabe, abmelde_link=link, anrede=versand.anrede_fuer(abo.anrede_name if abo else ""), einwilligung_datum=datum)
            erg = versand.sende(z.email, betreff, html, referenz_doctype="PH Newsletter Ausgabe", referenz_name=ausgabe.name)
            frappe.db.set_value("PH Newsletter Versand", z.name, {"status": "gesendet", "gesendet_am": now_datetime(), "versandweg": erg["versandweg"], "nachricht_id": erg.get("nachricht_id")})
            if abo:
                abo.db_set("letzte_zustellung", now_datetime(), update_modified=False)
            gesendet += 1
        except Exception as ex:  # noqa: BLE001
            frappe.db.set_value("PH Newsletter Versand", z.name, {"status": "fehler", "grund": str(ex)[:140]})
            frappe.log_error(title=f"PH Newsletter Versand {ausgabe.name} → {z.email}")
        frappe.db.commit()
    _zaehler(ausgabe)
    if not frappe.db.exists("PH Newsletter Versand", {"ausgabe": ausgabe.name, "status": "geplant"}):
        ausgabe.db_set({"status": "Versendet", "versendet_am": now_datetime(), "workflow_state": "PH Versendet"}, update_modified=True)
        if ausgabe.kampagne:
            frappe.get_doc("PH Kampagne", ausgabe.kampagne).add_comment("Info", _("Newsletter {0} versendet ({1} Empfänger)").format(ausgabe.name, ausgabe.empfaenger_anzahl))
    return gesendet


def _zaehler(ausgabe):
    def n(status):
        return frappe.db.count("PH Newsletter Versand", {"ausgabe": ausgabe.name, "status": status})

    ausgabe.db_set({"gesendet": n("gesendet"), "fehler": n("fehler"), "uebersprungen": n("uebersprungen")}, update_modified=False)


def bounce_verarbeiten(email, art="bounce"):
    """Aus Email Queue/Resend-Webhook: Bounce zählt hoch, ab 3 → Status Bounce; Beschwerde sofort."""
    email = email_normalisieren(email)
    if not frappe.db.exists(ABO, email):
        return
    abo = frappe.get_doc(ABO, email)
    if art == "beschwerde":
        abmelden(abo, kanal="beschwerde")
        return
    abo.db_set("bounce_count", cint(abo.bounce_count) + 1, update_modified=False)
    if cint(abo.bounce_count) + 1 >= 3 and abo.status == "Aktiv":
        abmelden(abo, kanal="bounce", grund="3 Bounces")
    frappe.db.set_value("PH Newsletter Versand", {"email": email, "status": "gesendet", "gesendet_am": (">", add_days(now_datetime(), -7))}, "status", "bounce")


def escape(s):
    return escape_html(s or "")
