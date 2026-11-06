"""Whitelisted Methoden von ph_personal.

Website (platzhirsch.studio):
  karriere_data()                      GET, guest, lesend – gleiches Rückgabeformat wie heute
                                       platzhirsch_studio…karriere.api.karriere_data (src/lib/api/fetchKarrierData.js):
                                       message = [ {title, status, posted, type, positions, salary, stellenbeschreibung,
                                       job_description_en, description_de_lemploi, jobs_description_it, category_<l>,
                                       responsibilities_<l>[{responsibility}], requirement_<l>[{anforderungen}],
                                       benefits_<l>[{benefit}], title_<l>, job_status_<l>, start_<l>, working_hours_<l>,
                                       slug, entgelt{kvMindestBrutto, zeitraum, ueberzahlung, kollektivvertrag},
                                       valid_through, salary_unit, ausmass, start, experience, creation, modified} ]
                                       Nur Aktiv + entgelt_vollstaendig + im Zeitfenster (§ 9 Abs 2 GlBG, glbg.js).
  get_stellen(sprache=None)            dasselbe, optional nur eine Sprache reduziert (Token oder guest).
  create_bewerbung(**d)                POST, Token (PH Website Integration), idempotent – Website-Bewerbungsformular.
  attach_unterlage(referenz, …)        POST, Token – private Datei an eine Bewerbung hängen (Base64, ≤ 10 MB).

Desk / Selbstservice / Backoffice:
  stempeln()                           Kommen/Gehen (eigener Datensatz; fremde nur Personal-Rollen; Doppeltipp-Schutz 60 s).
  monatsuebersicht(mitarbeiter, jahr, monat)   Soll/Ist/Saldo nach Modell, Feiertagen, Gutschrift-Matrix.
  anzahl_heute_abwesend()              Number Card (Custom) – nur Anzahl.
  abwesenheiten_kalender(start, end)   Kalenderansicht (= teamkalender).
  teamkalender(start, end)             Teamkalender; Krankenstand/Pflege/Sonderurlaub für Nicht-Leitung nur „abwesend“.
  vertretung_vorschlaege(mitarbeiter, von, bis)   Namen + verfügbar, gleiches Team zuerst.
  zeitnachweis_pdf(mitarbeiter, jahr, monat)      PDF ohne Schreiben am Mitarbeiter (AZG § 26 Abs 8).
  korrektur_beantragen(buchung, kommen, gehen, pause_min, grund)
  urlaubskonto(mitarbeiter, stichtag)  UrlG: je Urlaubsjahr Anspruch/Verbrauch/Rest/Verjährung.
  krank_melden(von, bis_voraussichtlich, mitarbeiter, meldeweg, arbeitsunfall)
  mein_dienstplan(von, bis, mitarbeiter)          Schichten aus veröffentlichten Dienstplänen.
  monat_abschliessen(mitarbeiter, jahr, monat) / monate_abschliessen(jahr, monat)   PH Zeitabschluss (Leitung).
  azg_pruefung(mitarbeiter, von, bis)  AZG/ARG-Befunde (Höchstarbeitszeit, Pause, Ruhezeit, Wochenruhe, 17-Wochen-Schnitt).
  datenauskunft(doctype, name)         Art. 15 DSGVO für PH Bewerbung / PH Mitarbeiter (Leitung/GF).
"""

import base64
import re

import frappe
from frappe import _
from frappe.utils import add_days, cint, get_datetime, getdate, now_datetime, nowdate

from ph_core.api import ApiFehler, gast_rate_limit, ip_hash, pflicht, ph_api, text
from ph_personal.logik import (
    AUSMASS,
    BESCHREIBUNG_FELD,
    KATEGORIE,
    SPRACHEN,
    START,
    ueberzahlung_fuer_website,
    uebersetze,
    veroeffentlichbar,
)

CACHE_KARRIERE = "ph_personal:karriere_data"
CACHE_SEKUNDEN = 300
MAX_UNTERLAGE_BYTES = 10 * 1024 * 1024
ERLAUBTE_ENDUNGEN = (".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx")
DATEINAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


# ── Website: Stellen ───────────────────────────────────────────────────────────

def _zeilen(doc, feld, schluessel):
    return [{schluessel: (z.get(schluessel) or "").strip()} for z in (doc.get(feld) or []) if (z.get(schluessel) or "").strip()]


def _arbeitszeiten(wert):
    return [{"working_hours": z.strip()} for z in str(wert or "").splitlines() if z.strip()]


def stelle_fuer_website(doc, einst=None):
    """Ein PH Stelle-Dokument im heutigen karriere_data-Format (alle Sprachen)."""
    if einst is None:
        from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

        einst = einstellungen()
    cent = int(doc.kv_mindest_brutto_cent or 0)
    betrag = cent / 100
    betrag = int(betrag) if betrag == int(betrag) else round(betrag, 2)
    job = {
        "name": doc.name,
        "title": doc.titel,
        "slug": doc.slug,
        "status": doc.status,
        "posted": str(doc.veroeffentlicht) if doc.veroeffentlicht else None,
        "valid_through": str(doc.gueltig_bis) if doc.gueltig_bis else None,
        "type": doc.beschaeftigungsart,
        "ausmass": doc.beschaeftigungsart,
        "positions": int(doc.positionen_anzahl or 1),
        "start": doc.start,
        "location": doc.standort or einst["standort"],
        "experience": int(doc.erfahrung_jahre or 0) or None,
        "salary": betrag if doc.entgelt_vollstaendig else None,
        "salary_unit": {"Jahr": "YEAR", "Stunde": "HOUR"}.get(doc.entgelt_zeitraum, "MONTH"),
        "entgelt": {
            "kvMindestBrutto": betrag,
            "zeitraum": doc.entgelt_zeitraum or "Monat",
            "ueberzahlung": ueberzahlung_fuer_website(doc.ueberzahlung, doc.ueberzahlung_text),
            "kollektivvertrag": doc.kollektivvertrag or "",
        },
        "bewerbung_email": doc.bewerbung_email or einst["bewerbung_email"],
        "seo_title": doc.seo_title or None,
        "creation": str(doc.creation) if doc.creation else None,
        "modified": str(doc.modified) if doc.modified else None,
    }
    for l in SPRACHEN:
        if l != "de":
            job[f"title_{l}"] = doc.get(f"titel_{l}") or None
        job[BESCHREIBUNG_FELD[l]] = doc.get(BESCHREIBUNG_FELD[l]) or ""
        job[f"category_{l}"] = uebersetze(KATEGORIE, doc.kategorie, l)
        job[f"job_status_{l}"] = uebersetze(AUSMASS, doc.beschaeftigungsart, l)
        job[f"start_{l}"] = uebersetze(START, doc.start, l)
        job[f"responsibilities_{l}"] = _zeilen(doc, f"aufgaben_{l}", "responsibility")
        job[f"requirement_{l}"] = _zeilen(doc, f"anforderungen_{l}", "anforderungen")
        job[f"benefits_{l}"] = _zeilen(doc, f"leistungen_{l}", "benefit")
        job[f"working_hours_{l}"] = _arbeitszeiten(doc.get(f"arbeitszeit_{l}"))
    return job


def _stellen_laden():
    heute = getdate(nowdate())
    namen = frappe.get_all(
        "PH Stelle",
        filters={"status": "Aktiv", "entgelt_vollstaendig": 1, "beispiel": 0},
        pluck="name",
        order_by="veroeffentlicht desc, titel asc",
    )
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    einst = einstellungen()
    ergebnis = []
    for name in namen:
        doc = frappe.get_doc("PH Stelle", name)
        # Doppelte Prüfung der GlBG-Regel unabhängig vom gespeicherten Kennzeichen
        from ph_personal.logik import entgelt_vollstaendig

        ok = entgelt_vollstaendig(doc.kv_mindest_brutto_cent, doc.entgelt_zeitraum, doc.kollektivvertrag, doc.ueberzahlung, doc.ueberzahlung_text)
        if not veroeffentlichbar(doc.status, ok, getdate(doc.veroeffentlicht) if doc.veroeffentlicht else None, getdate(doc.gueltig_bis) if doc.gueltig_bis else None, heute):
            continue
        ergebnis.append(stelle_fuer_website(doc, einst))
    return ergebnis


@frappe.whitelist(allow_guest=True, methods=["GET"])
@gast_rate_limit
def karriere_data():
    """Guest-lesend wie heute. Antwort: Liste (Frappe verpackt sie in message)."""
    cache = frappe.cache()
    daten = None if frappe.flags.in_test else cache.get_value(CACHE_KARRIERE)
    if daten is None:
        daten = _stellen_laden()
        cache.set_value(CACHE_KARRIERE, daten, expires_in_sec=CACHE_SEKUNDEN)
    return daten


@frappe.whitelist(allow_guest=True, methods=["GET"])
@gast_rate_limit
def get_stellen(sprache=None):
    """Wie karriere_data; mit sprache (de/en/fr/it) zusätzlich title/description/category in dieser Sprache als Kurzfelder."""
    daten = karriere_data()
    if not sprache or sprache not in SPRACHEN:
        return daten
    kurz = []
    for j in daten:
        k = dict(j)
        k["title_lokal"] = j.get(f"title_{sprache}") or j["title"]
        k["description_lokal"] = j.get(BESCHREIBUNG_FELD[sprache]) or j.get("stellenbeschreibung")
        k["category_lokal"] = j.get(f"category_{sprache}")
        kurz.append(k)
    return kurz


def karriere_cache_leeren():
    frappe.cache().delete_value(CACHE_KARRIERE)


# ── Website: Bewerbung ────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Bewerbung", r["referenz"]))
def create_bewerbung(**d):
    """Website-Bewerbungsformular. Pflicht: nachname, email, einwilligung_datenschutz. Optional: stelle (Slug),
    vorname, telefon, plz_ort, anschreiben, verfuegbar_ab, sprache, einwilligung_text_version, lead_ref, herkunft,
    gehaltsvorstellung (Freitext ≤ 140 Zeichen; Feld permlevel 1 – nur Personal-Leitung/Geschäftsführung)."""
    pflicht(d, "nachname", "email")
    if not cint(d.get("einwilligung_datenschutz")):
        raise ApiFehler("invalid", 400, _("Datenschutzinformation muss bestätigt sein."), {"field": "einwilligung_datenschutz"})
    stelle = text(d.get("stelle") or d.get("slug"), 140) or None
    if stelle and not frappe.db.exists("PH Stelle", stelle):
        # Website schickt den Slug; Alt-Bewerbungen evtl. den Titel
        stelle = frappe.db.get_value("PH Stelle", {"titel": stelle}, "name")
        if not stelle:
            raise ApiFehler("not_found", 404, _("Stelle nicht gefunden."), {"field": "stelle"})
    anschreiben = frappe.utils.escape_html(text(d.get("anschreiben") or d.get("nachricht"), 20000)).replace("\n", "<br>")
    doc = frappe.get_doc(
        {
            "doctype": "PH Bewerbung",
            "stelle": stelle,
            "quelle": "Website",
            "eingang": now_datetime(),
            "anrede": text(d.get("anrede"), 20) if text(d.get("anrede"), 20) in ("Frau", "Herr", "Divers") else None,
            "vorname": text(d.get("vorname"), 100),
            "nachname": text(d.get("nachname"), 100),
            "email": text(d.get("email"), 254),
            "telefon": text(d.get("telefon"), 40),
            "plz_ort": text(d.get("plz_ort"), 140),
            "verfuegbar_ab": getdate(d["verfuegbar_ab"]) if d.get("verfuegbar_ab") else None,
            "anschreiben": anschreiben or None,
            "sprache": (d.get("sprache") or "de")[:2] if (d.get("sprache") or "de")[:2] in SPRACHEN else "de",
            "einwilligung_datenschutz": 1,
            "einwilligung_text_version": text(d.get("einwilligung_text_version"), 80),
            "einwilligung_zeitpunkt": now_datetime(),
            "referenz_website": text(d.get("lead_ref") or d.get("referenz"), 140),
            "herkunft": text(d.get("herkunft"), 1000),
            "gehaltsvorstellung": text(d.get("gehaltsvorstellung"), 140) or None,
            "ip_hash": ip_hash(),
        }
    )
    # permlevel-1-Feld: die Website-Rolle darf es nicht schreiben, der Wert kommt aus dem Formular → Rechteprüfung
    # für dieses Feld überspringen (Lesen bleibt Personal-Leitung/Geschäftsführung vorbehalten)
    doc.flags.ignore_permlevel_for_fields = ["gehaltsvorstellung"]
    doc.insert()
    if doc.gehaltsvorstellung and not frappe.db.get_value("PH Bewerbung", doc.name, "gehaltsvorstellung"):
        frappe.db.set_value("PH Bewerbung", doc.name, "gehaltsvorstellung", doc.gehaltsvorstellung, update_modified=False)
    return {"referenz": doc.name, "status": doc.status}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=30, referenz=lambda r: ("PH Bewerbung", r["referenz"]))
def attach_unterlage(referenz, dateiname, inhalt_base64, art="Lebenslauf"):
    """Private Datei an eine Bewerbung hängen (Website-Upload nach create_bewerbung)."""
    if not frappe.db.exists("PH Bewerbung", referenz):
        raise ApiFehler("not_found", 404, _("Bewerbung nicht gefunden."))
    name = DATEINAME_RE.sub("_", str(dateiname or "")).strip("._")[:120] or "unterlage.pdf"
    if not name.lower().endswith(ERLAUBTE_ENDUNGEN):
        raise ApiFehler("invalid", 400, _("Dateityp nicht erlaubt (PDF, JPG, PNG, DOC, DOCX)."), {"field": "dateiname"})
    try:
        inhalt = base64.b64decode(str(inhalt_base64 or ""), validate=True)
    except Exception as e:  # noqa: BLE001
        raise ApiFehler("invalid", 400, _("Dateiinhalt ist kein gültiges Base64.")) from e
    if not inhalt or len(inhalt) > MAX_UNTERLAGE_BYTES:
        raise ApiFehler("invalid", 400, _("Datei leer oder größer als 10 MB."))
    doc = frappe.get_doc("PH Bewerbung", referenz)
    if doc.pseudonymisiert:
        raise ApiFehler("conflict", 409, _("Bewerbung ist bereits gelöscht."))
    if len(doc.unterlagen or []) >= 10:
        raise ApiFehler("conflict", 409, _("Höchstens 10 Unterlagen je Bewerbung."))
    datei = frappe.get_doc(
        {"doctype": "File", "file_name": name, "content": inhalt, "is_private": 1, "attached_to_doctype": "PH Bewerbung", "attached_to_name": doc.name}
    )
    datei.insert(ignore_permissions=True)
    art = art if art in ("Lebenslauf", "Anschreiben", "Zeugnis", "Portfolio", "Sonstiges") else "Sonstiges"
    doc.append("unterlagen", {"art": art, "bezeichnung": name, "datei": datei.file_url, "hochgeladen_am": now_datetime(), "groesse_kb": int(len(inhalt) / 1024)})
    doc.flags.ignore_permissions = True
    doc.save()
    return {"ok": True, "referenz": doc.name, "datei": datei.name, "anzahl": len(doc.unterlagen)}


# ── Desk: Zeiterfassung / Abwesenheit ─────────────────────────────────────────

LEITUNG_ROLLEN = {"PH Personal Leitung", "PH Geschäftsführung", "System Manager"}
PERSONAL_ROLLEN = LEITUNG_ROLLEN | {"PH Personal Mitarbeiter"}
DOPPELTIPP_SEKUNDEN = 60


def _rollen():
    return set(frappe.get_roles())


def _ist_leitung():
    return frappe.session.user == "Administrator" or bool(_rollen() & LEITUNG_ROLLEN)


def _eigener_oder_personal(mitarbeiter):
    """Zugriff auf Daten einer Person: eigene (Selbstservice) oder Personal-Rollen."""
    from ph_personal.ph_personal.doctype.ph_mitarbeiter.ph_mitarbeiter import mitarbeiter_fuer_user

    eigener = mitarbeiter_fuer_user()
    if mitarbeiter and mitarbeiter != eigener and not (frappe.session.user == "Administrator" or _rollen() & PERSONAL_ROLLEN):
        frappe.throw(_("Keine Berechtigung für andere Mitarbeiter."), frappe.PermissionError)
    mitarbeiter = mitarbeiter or eigener
    if not mitarbeiter:
        frappe.throw(_("Ihrem Benutzer ist kein PH Mitarbeiter zugeordnet."))
    return mitarbeiter


@frappe.whitelist(methods=["POST"])
def stempeln(mitarbeiter=None, art="Arbeit", projekt_referenz=None, projekt=None, projekt_doctype="PH Projekt", taetigkeit=None):
    """Kommen/Gehen: offene Buchung heute schließen, sonst neue öffnen. Ohne Parameter für den eigenen Datensatz.
    Fremde Person nur mit Personal-Rolle (Fachkritik D2); zweiter Aufruf < 60 s → „gerade eben gebucht“."""
    from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import offene_buchung

    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    jetzt = now_datetime()
    letzte = frappe.get_all("PH Zeiterfassung", filters={"mitarbeiter": mitarbeiter, "datum": jetzt.date()}, fields=["name", "modified", "status"], order_by="modified desc", limit=1)
    if letzte and (jetzt - get_datetime(letzte[0].modified)).total_seconds() < DOPPELTIPP_SEKUNDEN:
        return {"ok": False, "status": letzte[0].status, "name": letzte[0].name, "meldung": _("Gerade eben gebucht – bitte kurz warten.")}
    offen = offene_buchung(mitarbeiter, jetzt.date())
    if offen:
        doc = frappe.get_doc("PH Zeiterfassung", offen)
        doc.gehen = jetzt.strftime("%H:%M:%S")
        try:
            doc.save()
            return {"ok": True, "status": doc.status, "name": doc.name, "meldung": _("Gehen gebucht: {0} ({1})").format(jetzt.strftime("%H:%M"), doc.dauer_text), "pause_bestaetigen": bool(doc.pause_min and not doc.pause_bestaetigt)}
        except frappe.ValidationError as e:
            return {"ok": False, "status": "Offen", "name": doc.name, "meldung": str(e)}
    doc = frappe.get_doc(
        {"doctype": "PH Zeiterfassung", "mitarbeiter": mitarbeiter, "datum": jetzt.date(), "kommen": jetzt.strftime("%H:%M:%S"), "art": art if art in ("Arbeit", "Montage", "Fortbildung", "Zeitausgleich") else "Arbeit", "projekt_referenz": text(projekt_referenz, 140), "quelle": "Stempel",
         "projekt": text(projekt, 140) or None, "projekt_doctype": projekt_doctype if projekt else None, "taetigkeit": taetigkeit if taetigkeit in ("Montage", "Planung", "Service", "Showroom", "Fahrt", "Lager", "Verwaltung") else None}
    ).insert()
    return {"ok": True, "status": doc.status, "name": doc.name, "meldung": _("Kommen gebucht: {0}").format(jetzt.strftime("%H:%M"))}


@frappe.whitelist(methods=["GET"])
def monatsuebersicht(mitarbeiter, jahr=None, monat=None):
    from ph_personal.ph_personal.zeitkonto import monatsuebersicht as mu

    if not frappe.has_permission("PH Mitarbeiter", "read", doc=mitarbeiter):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    heute = getdate(nowdate())
    m = mu(mitarbeiter, cint(jahr) or heute.year, cint(monat) or heute.month)
    if not _ist_leitung():
        m.pop("krank_tage", None)
        m.pop("arbeitsunfall_tage", None)
    return m


@frappe.whitelist(methods=["GET"])
def anzahl_heute_abwesend():
    """Number Card „PH Heute abwesend“ (type Custom) – nur Anzahl, ohne Art."""
    from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import heute_abwesend

    return {"value": len({r["mitarbeiter"] for r in heute_abwesend()}), "fieldtype": "Int"}


@frappe.whitelist(methods=["GET"])
def abwesenheiten_kalender(start, end, filters=None):
    """Kalenderansicht PH Abwesenheit – Krankenstand/Pflege/Sonderurlaub nur für Leitung/GF mit Art."""
    return teamkalender(start, end)


FARBEN = {"Urlaub": "#15803d", "Krankenstand": "#b91c1c", "Zeitausgleich": "#1d4ed8", "Fortbildung": "#8a7a66", "Berufsschule": "#8a7a66", "Pflegefreistellung": "#b45309", "Sonderurlaub": "#7c3aed", "Unbezahlt": "#6b7280"}


@frappe.whitelist(methods=["GET"])
def teamkalender(start, end):
    """Teamkalender für alle Personal-Rollen und Selbstservice (Fachkritik P11a/R1):
    Name, Zeitraum und für Nicht-Leitung nur Urlaub/Fortbildung/Berufsschule namentlich, sonst „abwesend“.
    Feste Feldliste, keine Begründung, keine Vertretung, kein Link auf die Akte."""
    from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import art_oeffentlich, darf_art_sehen

    if not (frappe.session.user == "Administrator" or _rollen() & (PERSONAL_ROLLEN | {"PH Personal Selbstservice"})):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    voll = darf_art_sehen()
    von, bis = getdate(start), getdate(end)
    out = []
    for r in frappe.get_all(
        "PH Abwesenheit",
        filters={"status": ("in", ["Beantragt", "Genehmigt"]), "von": ("<=", bis), "bis": (">=", von)},
        fields=["name", "von", "bis", "art", "status", "mitarbeiter", "mitarbeiter_name"],
    ):
        art = art_oeffentlich(r.art, voll)
        out.append({"name": r.name if voll else None, "titel": f"{r.mitarbeiter_name}: {art}" + (" (?)" if r.status == "Beantragt" else ""), "mitarbeiter_name": r.mitarbeiter_name, "art": art,
                    "von": str(r.von), "bis": str(add_days(r.bis, 1)), "allDay": 1, "status": r.status,
                    "color": (FARBEN.get(r.art, "#30373e") if voll or r.art == art else "#8a7a66") if r.status == "Genehmigt" else "#d1d5db"})
    if frappe.db.exists("DocType", "PH Krankmeldung"):
        for k in frappe.get_all("PH Krankmeldung", filters={"status": ("in", ["Gemeldet", "Bestaetigt", "Beendet"]), "von": ("<=", bis)}, fields=["name", "von", "bis", "bis_voraussichtlich", "bis_offen", "mitarbeiter_name"]):
            ende = getdate(k.bis or (k.bis_voraussichtlich if not k.bis_offen else None) or bis)
            if ende < von:
                continue
            art = art_oeffentlich("Krankenstand", voll)
            out.append({"name": k.name if voll else None, "titel": f"{k.mitarbeiter_name}: {art}", "mitarbeiter_name": k.mitarbeiter_name, "art": art, "von": str(k.von), "bis": str(add_days(ende, 1)), "allDay": 1, "status": "Genehmigt", "color": FARBEN["Krankenstand"] if voll else "#8a7a66"})
    return out


@frappe.whitelist(methods=["GET"])
def vertretung_vorschlaege(mitarbeiter=None, von=None, bis=None):
    """Mögliche Vertretungen (P11b): aktive Kolleg:innen desselben Teams mit „verfügbar ja/nein“ im Zeitraum –
    nur Name, kein Lesen fremder Akten."""
    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    von, bis = getdate(von or nowdate()), getdate(bis or von or nowdate())
    ich = frappe.db.get_value("PH Mitarbeiter", mitarbeiter, ["team_verkauf", "team_planung", "team_montage"], as_dict=True) or {}
    abwesend = {r.mitarbeiter for r in frappe.get_all("PH Abwesenheit", filters={"status": ("in", ["Beantragt", "Genehmigt"]), "von": ("<=", bis), "bis": (">=", von)}, fields=["mitarbeiter"])}
    if frappe.db.exists("DocType", "PH Krankmeldung"):
        abwesend |= {r.mitarbeiter for r in frappe.get_all("PH Krankmeldung", filters={"status": ("in", ["Gemeldet", "Bestaetigt"]), "von": ("<=", bis)}, fields=["mitarbeiter"])}
    out = []
    for m in frappe.get_all("PH Mitarbeiter", filters={"status": "Aktiv", "name": ("!=", mitarbeiter)}, fields=["name", "titel", "team_verkauf", "team_planung", "team_montage"], order_by="nachname asc"):
        gleiches_team = any(ich.get(t) and m.get(t) for t in ("team_verkauf", "team_planung", "team_montage"))
        out.append({"mitarbeiter": m.name, "name": m.titel, "gleiches_team": gleiches_team, "verfuegbar": m.name not in abwesend})
    out.sort(key=lambda x: (not x["gleiches_team"], not x["verfuegbar"], x["name"]))
    return out


@frappe.whitelist(methods=["GET"])
def zeitnachweis_pdf(mitarbeiter=None, jahr=None, monat=None):
    """Zeitnachweis eines Monats als PDF (P11c, AZG § 26 Abs 8) – ohne den Mitarbeiter-Datensatz zu ändern."""
    from datetime import date as _date

    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    heute = getdate(nowdate())
    doc = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    doc.zeitnachweis_monat = _date(cint(jahr) or heute.year, cint(monat) or heute.month, 1)
    pdf = frappe.get_print("PH Mitarbeiter", mitarbeiter, "PH Mitarbeiter Zeitnachweis", doc=doc, as_pdf=True, no_letterhead=0)
    try:  # Nachweis der Übermittlung (§ 26 Abs 8 AZG) am Monatsabschluss bzw. als Kommentar
        from ph_personal.ph_personal.zeitkonto import abschluss

        z = abschluss(mitarbeiter, doc.zeitnachweis_monat.year, doc.zeitnachweis_monat.month)
        weg = _("Download durch {0}").format(frappe.session.user)
        if z:
            frappe.get_doc("PH Zeitabschluss", z).zeitnachweis_uebermittelt(weg)
        else:
            doc.add_comment("Info", _("Zeitnachweis {0} abgerufen ({1})").format(doc.zeitnachweis_monat.strftime("%m/%Y"), weg))
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Personal: Übermittlung Zeitnachweis nicht protokolliert")
    frappe.local.response.filename = f"Zeitnachweis-{mitarbeiter}-{doc.zeitnachweis_monat.strftime('%Y-%m')}.pdf"
    frappe.local.response.filecontent = pdf
    frappe.local.response.type = "pdf"


@frappe.whitelist(methods=["POST"])
def korrektur_beantragen(buchung, kommen=None, gehen=None, pause_min=None, grund=None):
    """Korrekturantrag für eine eigene Buchung (P11d) – Leitung entscheidet (PH Zeiterfassung.korrektur_entscheiden)."""
    doc = frappe.get_doc("PH Zeiterfassung", buchung)
    _eigener_oder_personal(doc.mitarbeiter)
    return doc.korrektur_beantragen(kommen=kommen, gehen=gehen, pause_min=pause_min, grund=grund)


@frappe.whitelist(methods=["GET"])
def urlaubskonto(mitarbeiter=None, stichtag=None):
    """Urlaubskonto nach UrlG je Urlaubsjahr (Anspruch, Verbrauch, Rest, Verjährung) – eigenes oder Personal-Rolle."""
    from ph_personal.ph_personal.urlaubskonto import konto

    return konto(_eigener_oder_personal(mitarbeiter), stichtag)


@frappe.whitelist(methods=["POST"])
def krank_melden(von=None, bis_voraussichtlich=None, mitarbeiter=None, meldeweg=None, arbeitsunfall=0):
    """Krankmeldung erfassen (Selbstservice für sich, Leitung für andere). Keine Diagnose; Leitung wird informiert."""
    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    if mitarbeiter != _eigener_mitarbeiter() and not _ist_leitung():
        frappe.throw(_("Krankmeldungen für andere erfasst die Personal-Leitung."), frappe.PermissionError)
    doc = frappe.get_doc(
        {
            "doctype": "PH Krankmeldung",
            "mitarbeiter": mitarbeiter,
            "von": getdate(von or nowdate()),
            "bis_offen": 0 if bis_voraussichtlich else 1,
            "bis_voraussichtlich": getdate(bis_voraussichtlich) if bis_voraussichtlich else None,
            "meldeweg": meldeweg if meldeweg in ("Telefon", "Persönlich", "E-Mail", "SMS/Messenger", "Selbstservice", "Sonstiges") else ("Selbstservice" if mitarbeiter == _eigener_mitarbeiter() else "Telefon"),
            "arbeitsunfall": cint(arbeitsunfall),
        }
    ).insert()
    return {"name": doc.name, "status": doc.status, "meldung": _("Gute Besserung – die Leitung ist informiert.")}


def _eigener_mitarbeiter():
    from ph_personal.ph_personal.doctype.ph_mitarbeiter.ph_mitarbeiter import mitarbeiter_fuer_user

    return mitarbeiter_fuer_user()


@frappe.whitelist(methods=["GET"])
def mein_dienstplan(von=None, bis=None, mitarbeiter=None):
    """Eigene Schichten aus veröffentlichten Dienstplänen (Selbstservice) bzw. einer Person (Personal-Rollen)."""
    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    von = getdate(von or nowdate())
    bis = getdate(bis or add_days(von, 13))
    plaene = frappe.get_all("PH Dienstplan", filters={"woche_bis": (">=", von), "woche_von": ("<=", bis), "status": "Veroeffentlicht"}, pluck="name")
    if not plaene:
        return []
    zeilen = frappe.get_all(
        "PH Dienstplan Schicht",
        filters={"parenttype": "PH Dienstplan", "parent": ("in", plaene), "mitarbeiter": mitarbeiter, "datum": ("between", [von, bis])},
        fields=["datum", "beginn", "ende", "pause_min", "netto_min", "bereich", "schicht", "notiz"],
        order_by="datum asc, beginn asc",
    )
    return [{**z, "datum": str(z.datum), "beginn": str(z.beginn)[:5], "ende": str(z.ende)[:5]} for z in zeilen]


@frappe.whitelist(methods=["POST"])
def monat_abschliessen(mitarbeiter, jahr, monat):
    """Monatsabschluss einer Person (Leitung) → PH Zeitabschluss (sperrt den Monat)."""
    if not _ist_leitung():
        frappe.throw(_("Monate schließt die Personal-Leitung ab."), frappe.PermissionError)
    from ph_personal.ph_personal.doctype.ph_zeitabschluss.ph_zeitabschluss import abschliessen

    z = abschliessen(mitarbeiter, jahr, monat)
    return {"name": z.name, "status": z.status, "saldo_kumuliert_min": z.saldo_kumuliert_min, "saldo_text": z.saldo_text}


@frappe.whitelist(methods=["POST"])
def monate_abschliessen(jahr, monat):
    """Sammel-Monatsabschluss aller aktiven Personen (Leitung) – Ergebnis je Person (ok/Fehlertext)."""
    if not _ist_leitung():
        frappe.throw(_("Monate schließt die Personal-Leitung ab."), frappe.PermissionError)
    from ph_personal.ph_personal.doctype.ph_zeitabschluss.ph_zeitabschluss import abschliessen

    out = []
    for ma in frappe.get_all("PH Mitarbeiter", filters={"eintritt": ("<=", f"{cint(jahr)}-{cint(monat):02d}-28")}, fields=["name", "titel", "austritt"]):
        if ma.austritt and getdate(ma.austritt) < getdate(f"{cint(jahr)}-{cint(monat):02d}-01"):
            continue
        try:
            frappe.db.savepoint("ph_abschluss")
            z = abschliessen(ma.name, jahr, monat)
            out.append({"mitarbeiter": ma.name, "name": ma.titel, "ok": True, "abschluss": z.name, "saldo_text": z.saldo_text})
        except frappe.ValidationError as e:
            frappe.db.rollback(save_point="ph_abschluss")
            out.append({"mitarbeiter": ma.name, "name": ma.titel, "ok": False, "meldung": str(e)})
    return out


@frappe.whitelist(methods=["GET"])
def datenauskunft(doctype, name):
    """DSGVO Art. 15: alle Daten einer Bewerbung bzw. eines Mitarbeiters (inkl. Zeit-, Abwesenheits-,
    Krankmeldungs-, Urlaubs- und Abschlussdaten, Dateiliste) als dict – nur Personal-Leitung/GF."""
    if not _ist_leitung():
        frappe.throw(_("Datenauskunft erstellt die Personal-Leitung."), frappe.PermissionError)
    if doctype not in ("PH Bewerbung", "PH Mitarbeiter"):
        frappe.throw(_("Nur für PH Bewerbung oder PH Mitarbeiter."))
    doc = frappe.get_doc(doctype, name)
    ausblenden = {"idempotency_key", "ip_hash", "naming_series", "docstatus", "idx", "_user_tags", "_comments", "_assign", "_liked_by", "_seen"}

    def sauber(d):
        return {k: v for k, v in d.items() if k not in ausblenden and v not in (None, "", [])}

    out = {"art": doctype, "name": name, "erstellt_am": str(now_datetime()), "stammdaten": sauber(doc.as_dict())}
    out["dateien"] = frappe.get_all("File", filters={"attached_to_doctype": doctype, "attached_to_name": name}, fields=["file_name", "file_size", "creation"])
    out["kommentare"] = frappe.get_all("Comment", filters={"reference_doctype": doctype, "reference_name": name, "comment_type": ("in", ["Comment", "Info"])}, fields=["creation", "content", "comment_email"])
    out["kommunikation"] = frappe.get_all("Communication", filters={"reference_doctype": doctype, "reference_name": name}, fields=["creation", "subject", "sent_or_received", "recipients"])
    if doctype == "PH Bewerbung":
        out["gespraeche"] = [sauber(g) for g in frappe.get_all("PH Bewerbungsgespraech", filters={"bewerbung": name}, fields=["name", "start", "modus", "status", "ergebnis", "bewertung", "notiz"])]
    else:
        for dt, feld, felder in (
            ("PH Zeiterfassung", "mitarbeiter", ["datum", "kommen", "gehen", "pause_min", "dauer_min", "art", "status", "projekt_referenz", "einsatzland"]),
            ("PH Abwesenheit", "mitarbeiter", ["art", "von", "bis", "tage", "status", "begruendung"]),
            ("PH Krankmeldung", "mitarbeiter", ["von", "bis", "status", "arbeitsunfall", "bestaetigung_eingelangt_am"]),
            ("PH Urlaubsanspruch", "mitarbeiter", ["urlaubsjahr_von", "urlaubsjahr_bis", "anspruch_tage", "korrektur_tage", "rest_tage", "verjaehrt_am"]),
            ("PH Zeitabschluss", "mitarbeiter", ["periode", "soll_min", "ist_min", "saldo_kumuliert_min", "status"]),
        ):
            if frappe.db.exists("DocType", dt):
                out[dt] = frappe.get_all(dt, filters={feld: name}, fields=felder, order_by="creation asc")
        if doc.bewerbung and frappe.db.exists("PH Bewerbung", doc.bewerbung):
            out["bewerbung"] = doc.bewerbung
    frappe.get_doc(doctype, name).add_comment("Info", _("Datenauskunft (Art. 15 DSGVO) erstellt von {0}").format(frappe.session.user))
    return out


@frappe.whitelist(methods=["GET"])
def azg_pruefung(mitarbeiter=None, von=None, bis=None):
    """AZG/ARG-Prüfung eines Zeitraums (Standard: laufender Monat) – Befunde ohne Sperre."""
    from ph_personal.ph_personal.zeitkonto import azg_befunde
    from ph_personal.utils.azg import zusammenfassung

    mitarbeiter = _eigener_oder_personal(mitarbeiter)
    heute = getdate(nowdate())
    von = getdate(von or heute.replace(day=1))
    bis = getdate(bis or heute)
    befunde = azg_befunde(mitarbeiter, von, bis)
    return {"mitarbeiter": mitarbeiter, "von": str(von), "bis": str(bis), "befunde": [{**b, "datum": str(b["datum"])} for b in befunde], **zusammenfassung(befunde)}
