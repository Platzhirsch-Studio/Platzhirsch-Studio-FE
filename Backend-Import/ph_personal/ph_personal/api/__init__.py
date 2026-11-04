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

Desk:
  stempeln()                           Kommen/Gehen für den angemeldeten Mitarbeiter (Selbstservice).
  monatsuebersicht(mitarbeiter, jahr, monat)
  anzahl_heute_abwesend()              Number Card (Custom).
  abwesenheiten_kalender(start, end)   Kalenderansicht.
"""

import base64
import re

import frappe
from frappe import _
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
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
        "salary_unit": "YEAR" if doc.entgelt_zeitraum == "Jahr" else "MONTH",
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
def karriere_data():
    """Guest-lesend wie heute. Antwort: Liste (Frappe verpackt sie in message)."""
    cache = frappe.cache()
    daten = None if frappe.flags.in_test else cache.get_value(CACHE_KARRIERE)
    if daten is None:
        daten = _stellen_laden()
        cache.set_value(CACHE_KARRIERE, daten, expires_in_sec=CACHE_SEKUNDEN)
    return daten


@frappe.whitelist(allow_guest=True, methods=["GET"])
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
    vorname, telefon, plz_ort, anschreiben, verfuegbar_ab, sprache, einwilligung_text_version, lead_ref, herkunft."""
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
            "ip_hash": ip_hash(),
        }
    )
    doc.insert()
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

@frappe.whitelist(methods=["POST"])
def stempeln(mitarbeiter=None, art="Arbeit", projekt_referenz=None):
    """Kommen/Gehen: offene Buchung heute schließen, sonst neue öffnen. Ohne Parameter für den eigenen Datensatz."""
    from ph_personal.ph_personal.doctype.ph_mitarbeiter.ph_mitarbeiter import mitarbeiter_fuer_user
    from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import offene_buchung

    eigener = mitarbeiter_fuer_user()
    if mitarbeiter and mitarbeiter != eigener and not frappe.has_permission("PH Zeiterfassung", "create", user=frappe.session.user):
        frappe.throw(_("Keine Berechtigung für andere Mitarbeiter."), frappe.PermissionError)
    mitarbeiter = mitarbeiter or eigener
    if not mitarbeiter:
        frappe.throw(_("Ihrem Benutzer ist kein PH Mitarbeiter zugeordnet."))
    jetzt = now_datetime()
    offen = offene_buchung(mitarbeiter, jetzt.date())
    if offen:
        doc = frappe.get_doc("PH Zeiterfassung", offen)
        doc.gehen = jetzt.strftime("%H:%M:%S")
        try:
            doc.save()
            return {"ok": True, "status": doc.status, "name": doc.name, "meldung": _("Gehen gebucht: {0} ({1})").format(jetzt.strftime("%H:%M"), doc.dauer_text)}
        except frappe.ValidationError as e:
            return {"ok": False, "status": "Offen", "name": doc.name, "meldung": str(e)}
    doc = frappe.get_doc(
        {"doctype": "PH Zeiterfassung", "mitarbeiter": mitarbeiter, "datum": jetzt.date(), "kommen": jetzt.strftime("%H:%M:%S"), "art": art if art in ("Arbeit", "Montage", "Fortbildung", "Zeitausgleich") else "Arbeit", "projekt_referenz": text(projekt_referenz, 140), "quelle": "Stempel"}
    ).insert()
    return {"ok": True, "status": doc.status, "name": doc.name, "meldung": _("Kommen gebucht: {0}").format(jetzt.strftime("%H:%M"))}


@frappe.whitelist(methods=["GET"])
def monatsuebersicht(mitarbeiter, jahr=None, monat=None):
    from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import monatsuebersicht as mu

    if not frappe.has_permission("PH Mitarbeiter", "read", doc=mitarbeiter):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    heute = getdate(nowdate())
    return mu(mitarbeiter, cint(jahr) or heute.year, cint(monat) or heute.month)


@frappe.whitelist(methods=["GET"])
def anzahl_heute_abwesend():
    """Number Card „PH Heute abwesend“ (type Custom)."""
    from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import heute_abwesend

    return {"value": len(heute_abwesend()), "fieldtype": "Int"}


@frappe.whitelist(methods=["GET"])
def abwesenheiten_kalender(start, end, filters=None):
    """Kalenderansicht PH Abwesenheit."""
    farben = {"Urlaub": "#15803d", "Krankenstand": "#b91c1c", "Zeitausgleich": "#1d4ed8", "Fortbildung": "#8a7a66", "Pflegefreistellung": "#b45309", "Sonderurlaub": "#7c3aed", "Unbezahlt": "#6b7280"}
    rows = frappe.get_list(
        "PH Abwesenheit",
        filters={"status": ("in", ["Beantragt", "Genehmigt"]), "von": ("<=", getdate(end)), "bis": (">=", getdate(start))},
        fields=["name", "titel", "von", "bis", "art", "status", "mitarbeiter_name"],
    )
    out = []
    for r in rows:
        out.append(
            {
                "name": r.name,
                "titel": f"{r.mitarbeiter_name}: {r.art}" + (" (?)" if r.status == "Beantragt" else ""),
                "von": str(r.von),
                "bis": str(add_days(r.bis, 1)),  # FullCalendar: Ende exklusiv
                "allDay": 1,
                "color": farben.get(r.art, "#30373e") if r.status == "Genehmigt" else "#d1d5db",
            }
        )
    return out
