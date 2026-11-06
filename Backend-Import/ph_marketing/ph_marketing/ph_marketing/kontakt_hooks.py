"""Anbieter für die Kontakt-Hooks von ph_crm (hooks.py: ph_kontakt_zeitleiste, ph_kontakt_datenauskunft,
ph_kontakt_anonymisieren, ph_kontakt_zusammengefuehrt).

Marketing-Daten hängen an der E-Mail-Adresse (Abo, Einwilligung, Versand) und nur teilweise am PH Kontakt; deshalb
wird immer über beides gesucht: Link `kontakt` und E-Mail des Kontakts. Logik der Aufbewahrung: utils/datenschutz.py.
"""

import frappe
from frappe.utils import cint, get_datetime, now_datetime

from ph_marketing.utils import datenschutz as ds
from ph_marketing.utils.token import email_normalisieren

APP = "ph_marketing"


def _emails(kontakt):
    if not kontakt or not frappe.db.exists("DocType", "PH Kontakt") or not frappe.db.exists("PH Kontakt", kontakt):
        return []
    e = email_normalisieren(frappe.db.get_value("PH Kontakt", kontakt, "email"))
    return [e] if e else []


def _oder(feld_kontakt, feld_email, kontakt, emails):
    """or_filters für get_all: Link oder E-Mail. Nie leer (leere or_filters = alle Zeilen!)."""
    if not kontakt:
        raise ValueError("kontakt fehlt")
    f = [[feld_kontakt, "=", kontakt]]
    if emails:
        f.append([feld_email, "in", emails])
    return f


def _iso(x):
    return get_datetime(x).isoformat() if x else None


# ── Zeitleiste ──────────────────────────────────────────────────────────────
def zeitleiste(kontakt, vor=None, limit=30):
    emails = _emails(kontakt)
    ev = []

    def add(zeit, art, doctype, name, titel, text=""):
        if zeit:
            ev.append({"zeit": _iso(zeit), "art": art, "doctype": doctype, "name": name, "titel": titel, "text": text, "app": APP})

    for a in frappe.get_all("PH Newsletter Abo", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "status", "angemeldet_am", "doi_bestaetigt_am", "abgemeldet_am", "abmelde_kanal"]):
        add(a.angemeldet_am, "newsletter", "PH Newsletter Abo", a.name, "Newsletter angemeldet")
        add(a.doi_bestaetigt_am, "newsletter", "PH Newsletter Abo", a.name, "Newsletter bestätigt (Double-Opt-in)")
        add(a.abgemeldet_am, "newsletter", "PH Newsletter Abo", a.name, f"Newsletter beendet ({a.status})", a.abmelde_kanal or "")
    for e in frappe.get_all("PH Einwilligung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "zweck", "status", "zeitpunkt", "widerrufen_am", "kanal"]):
        add(e.zeitpunkt, "einwilligung", "PH Einwilligung", e.name, f"Einwilligung {e.zweck}", e.kanal or "")
        add(e.widerrufen_am, "einwilligung", "PH Einwilligung", e.name, f"Einwilligung {e.zweck} widerrufen")
    for r in frappe.get_all("PH Event Anmeldung", filters={"parenttype": "PH Event"}, or_filters=_oder("kontakt", "email", kontakt, emails), fields=["parent", "status", "personen", "angemeldet_am", "erschienen_am"]):
        add(r.angemeldet_am, "event", "PH Event", r.parent, f"Event-Anmeldung ({r.status})", f"{cint(r.personen) or 1} Person(en)")
        add(r.erschienen_am, "event", "PH Event", r.parent, "Beim Event eingecheckt")
    if emails:
        for v in frappe.get_all("PH Newsletter Versand", filters={"email": ("in", emails), "gesendet_am": ("is", "set")}, fields=["ausgabe", "status", "gesendet_am"], order_by="gesendet_am desc", limit=50):
            add(v.gesendet_am, "mail", "PH Newsletter Ausgabe", v.ausgabe, "Newsletter erhalten", v.status)
        for v in frappe.get_all("PH Reise Versand", filters={"empfaenger": ("in", emails), "status": "gesendet"}, fields=["reise", "gesendet_am"], order_by="gesendet_am desc", limit=50):
            add(v.gesendet_am, "mail", "PH Kundenreise", v.reise, "Mail der Kundenreise erhalten")
    for p in frappe.get_all("PH Kampagne Kontaktpunkt", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["kampagne", "art", "zeit", "utm_campaign"]):
        add(p.zeit, "kampagne", "PH Kampagne", p.kampagne or "", f"Kampagne: {p.utm_campaign or p.kampagne}", p.art or "")
    for m in frappe.get_all("PH Empfehlung", or_filters=_oder("empfehler_kontakt", "empfehler_email", kontakt, emails), fields=["name", "status", "creation"]):
        add(m.creation, "empfehlung", "PH Empfehlung", m.name, f"Empfehlung ({m.status})")
    for b in frappe.get_all("PH Bewertung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "titel", "status", "eingang"]):
        add(b.eingang, "bewertung", "PH Bewertung", b.name, f"Rückmeldung ({b.status})", b.titel or "")
    if vor:
        grenze = get_datetime(vor)
        ev = [e for e in ev if get_datetime(e["zeit"]) < grenze]
    ev.sort(key=lambda e: e["zeit"], reverse=True)
    return ev[: cint(limit) or 30]


# ── Auskunft (Art. 15) ──────────────────────────────────────────────────────
OHNE = {"doi_token_hash", "abmelde_token_hash", "anmelde_token_hash", "idempotency_key", "ip_hash"}


def _sauber(d):
    return {k: v for k, v in dict(d).items() if k not in OHNE and v not in (None, "")}


def datenauskunft(kontakt):
    emails = _emails(kontakt)
    out = []
    for a in frappe.get_all("PH Newsletter Abo", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "email", "status", "sprache", "quelle", "angemeldet_am", "doi_bestaetigt_am", "abgemeldet_am", "abmelde_kanal", "textversion"]):
        interessen = frappe.get_all("PH Newsletter Abo Interesse", filters={"parent": a.name, "parenttype": "PH Newsletter Abo"}, pluck="interesse")
        out.append({"abschnitt": "Newsletter", "doctype": "PH Newsletter Abo", "name": a.name, "daten": {**_sauber(a), "interessen": interessen}})
    for e in frappe.get_all("PH Einwilligung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "email", "zweck", "status", "zeitpunkt", "kanal", "quelle", "textversion", "doi_bestaetigt_am", "widerrufen_am", "widerruf_kanal"]):
        out.append({"abschnitt": "Einwilligungen", "doctype": "PH Einwilligung", "name": e.name, "daten": _sauber(e)})
    for r in frappe.get_all("PH Event Anmeldung", filters={"parenttype": "PH Event"}, or_filters=_oder("kontakt", "email", kontakt, emails), fields=["parent", "name_person", "email", "telefon", "personen", "begleitung", "status", "angemeldet_am", "erschienen_am", "nachricht"]):
        out.append({"abschnitt": "Events", "doctype": "PH Event", "name": r.parent, "daten": _sauber(r)})
    if emails:
        for v in frappe.get_all("PH Newsletter Versand", filters={"email": ("in", emails)}, fields=["ausgabe", "status", "gesendet_am", "zugestellt_am"], limit=500):
            out.append({"abschnitt": "Erhaltene Newsletter", "doctype": "PH Newsletter Ausgabe", "name": v.ausgabe, "daten": _sauber(v)})
        for v in frappe.get_all("PH Reise Versand", filters={"empfaenger": ("in", emails)}, fields=["reise", "status", "grundlage", "geplant_am", "gesendet_am"], limit=500):
            out.append({"abschnitt": "Kundenreisen", "doctype": "PH Kundenreise", "name": v.reise, "daten": _sauber(v)})
    for p in frappe.get_all("PH Kampagne Kontaktpunkt", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["kampagne", "art", "zeit", "utm_source", "utm_medium", "utm_campaign"]):
        out.append({"abschnitt": "Kampagnen-Herkunft", "doctype": "PH Kampagne", "name": p.kampagne, "daten": _sauber(p)})
    for m in frappe.get_all("PH Empfehlung", or_filters=_oder("empfehler_kontakt", "empfehler_email", kontakt, emails), fields=["name", "code", "status", "empfehler_name", "empfehler_email", "empfohlen_name", "gutschein_ausgegeben_am"]):
        out.append({"abschnitt": "Empfehlungen", "doctype": "PH Empfehlung", "name": m.name, "daten": _sauber(m)})
    for b in frappe.get_all("PH Bewertung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "quelle", "status", "sterne", "text", "autor_name", "email", "anlass", "eingang", "einwilligung_veroeffentlichung", "textversion", "veroeffentlicht_am"]):
        out.append({"abschnitt": "Bewertungen und Rückmeldungen", "doctype": "PH Bewertung", "name": b.name, "daten": _sauber(b)})
    return out


# ── Löschen/Anonymisieren (Art. 17) ─────────────────────────────────────────
def anonymisieren(kontakt, ausfuehren=False):
    """Plan (ausfuehren=False) bzw. Ausführung. Einwilligungsnachweise bleiben minimiert 3 Jahre (Art. 7 Abs. 1),
    Empfehlungen mit Gutschein 7 Jahre (BAO); alles andere wird gelöscht oder anonymisiert."""
    emails = _emails(kontakt)
    plan = []
    ausfuehren = cint(ausfuehren)

    def p(doctype, name, aktion, grund, frist_bis=None):
        plan.append({"doctype": doctype, "name": name, "aktion": aktion, "grund": grund, "frist_bis": frist_bis})

    for a in frappe.get_all("PH Newsletter Abo", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "status", "email"]):
        p("PH Newsletter Abo", a.name, "loeschen", "Abo endet; Widerruf bleibt in PH Einwilligung nachweisbar")
        if ausfuehren:
            from ph_marketing.ph_marketing import einwilligung as ew

            ew.widerrufen(a.email, "newsletter", kanal="backoffice", grund="Löschung Art. 17 DSGVO")
            frappe.delete_doc("PH Newsletter Abo", a.name, ignore_permissions=True, force=True)
    for e in frappe.get_all("PH Einwilligung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "status", "zeitpunkt", "doi_bestaetigt_am", "widerrufen_am"]):
        r = ds.plan_einwilligung(e)
        p("PH Einwilligung", e.name, r["aktion"], r["grund"], r["frist_bis"])
        if ausfuehren:
            if r["aktion"] == "loeschen":
                frappe.delete_doc("PH Einwilligung", e.name, ignore_permissions=True, force=True)
            else:
                werte = {"kontakt": None, "interessen": None, "daten_json": None, "ip_hash": None, "doi_token_hash": None}
                if e.status == "Bestaetigt":
                    werte.update(status="Widerrufen", widerrufen_am=now_datetime(), widerruf_kanal="backoffice", widerruf_grund="Löschung Art. 17 DSGVO")
                frappe.db.set_value("PH Einwilligung", e.name, werte, update_modified=True)
    for r in frappe.get_all("PH Event Anmeldung", filters={"parenttype": "PH Event"}, or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "parent"]):
        p("PH Event Anmeldung", r.name, "anonymisieren", f"Teilnehmerzahl von {r.parent} bleibt, Person nicht")
        if ausfuehren:
            frappe.db.set_value("PH Event Anmeldung", r.name, {"name_person": ds.ANONYM_NAME, "email": ds.ANONYM_EMAIL, "telefon": None, "nachricht": None, "notiz": None, "begleitung": None, "kontakt": None, "anfrage": None, "anmelde_token_hash": None})
    if emails:
        for v in frappe.get_all("PH Newsletter Versand", filters={"email": ("in", emails)}, pluck="name"):
            p("PH Newsletter Versand", v, "anonymisieren", "Versandstatistik bleibt, Adresse nicht")
            if ausfuehren:
                frappe.db.set_value("PH Newsletter Versand", v, {"email": ds.ANONYM_EMAIL, "abo": None, "nachricht_id": None})
        for v in frappe.get_all("PH Reise Versand", filters={"empfaenger": ("in", emails)}, pluck="name"):
            p("PH Reise Versand", v, "anonymisieren", "Doppelversand-Schutz entfällt mit der Person")
            if ausfuehren:
                frappe.db.set_value("PH Reise Versand", v, {"empfaenger": ds.ANONYM_EMAIL, "kontext_json": None, "referenz_doctype": None, "referenz_name": None})
        for m in frappe.get_all("PH Mail Ereignis", filters={"email": ("in", emails)}, pluck="name"):
            p("PH Mail Ereignis", m, "loeschen", "technisches Zustellprotokoll")
            if ausfuehren:
                frappe.delete_doc("PH Mail Ereignis", m, ignore_permissions=True, force=True)
    for k in frappe.get_all("PH Kampagne Kontaktpunkt", or_filters=_oder("kontakt", "email", kontakt, emails), pluck="name"):
        p("PH Kampagne Kontaktpunkt", k, "anonymisieren", "Kampagnenzahl bleibt, Person nicht")
        if ausfuehren:
            frappe.db.set_value("PH Kampagne Kontaktpunkt", k, {"email": None, "kontakt": None})
    for m in frappe.get_all("PH Empfehlung", or_filters=_oder("empfehler_kontakt", "empfehler_email", kontakt, emails), fields=["name", "gutschein_ausgegeben_am"]):
        r = ds.plan_empfehlung(m)
        p("PH Empfehlung", m.name, r["aktion"], r["grund"], r["frist_bis"])
        if ausfuehren:
            if r["aktion"] == "loeschen":
                frappe.delete_doc("PH Empfehlung", m.name, ignore_permissions=True, force=True)
            else:
                frappe.db.set_value("PH Empfehlung", m.name, {"empfohlen_name": None, "empfohlen_email": None, "notiz": None})
    for b in frappe.get_all("PH Bewertung", or_filters=_oder("kontakt", "email", kontakt, emails), fields=["name", "quelle"]):
        p("PH Bewertung", b.name, "loeschen", "Rückmeldung der Person (Art. 17); Google-Bewertung bleibt bei Google")
        if ausfuehren:
            frappe.delete_doc("PH Bewertung", b.name, ignore_permissions=True, force=True)
    return plan


# ── Zusammenführen ──────────────────────────────────────────────────────────
def zusammengefuehrt(alt, neu):
    """Nach dem Zusammenführen (ph_crm PH Kontakt.after_rename mit merge; Frappe hat Link-Felder bereits auf `neu`
    umgehängt, `alt` existiert nicht mehr). Einwilligungen werden nie auf eine andere Adresse übertragen; liegt für
    einen Zweck ein Widerruf vor, der jünger ist als eine Bestätigung auf einer anderen Adresse derselben Person,
    wird diese ebenfalls widerrufen (Widerruf hat Vorrang)."""
    felder = ["name", "zweck", "status", "doi_bestaetigt_am", "widerrufen_am", "email"]
    eintraege = frappe.get_all("PH Einwilligung", or_filters=_oder("kontakt", "email", neu, _emails(neu)), fields=felder)
    for name, _aktion, grund in ds.einwilligungen_abgleichen(eintraege, eintraege):
        frappe.db.set_value("PH Einwilligung", name, {"status": "Widerrufen", "widerrufen_am": now_datetime(), "widerruf_kanal": "backoffice", "widerruf_grund": grund[:140]}, update_modified=True)
        e = next(x for x in eintraege if x.name == name)
        if e.zweck == "newsletter" and e.email and frappe.db.exists("PH Newsletter Abo", e.email):
            from ph_marketing.ph_marketing import newsletter

            abo = frappe.get_doc("PH Newsletter Abo", e.email)
            if abo.status == "Aktiv":
                newsletter.abmelden(abo, kanal="backoffice", grund="Zusammenführung: jüngerer Widerruf")
    # Falls ohne Frappe-Rename aufgerufen (z. B. Skript): Bezüge selbst umhängen
    for dt, feld in (("PH Newsletter Abo", "kontakt"), ("PH Einwilligung", "kontakt"), ("PH Kampagne Kontaktpunkt", "kontakt"), ("PH Empfehlung", "empfehler_kontakt"), ("PH Bewertung", "kontakt")):
        for n in frappe.get_all(dt, filters={feld: alt}, pluck="name"):
            frappe.db.set_value(dt, n, feld, neu, update_modified=False)
    for n in frappe.get_all("PH Event Anmeldung", filters={"parenttype": "PH Event", "kontakt": alt}, pluck="name"):
        frappe.db.set_value("PH Event Anmeldung", n, "kontakt", neu, update_modified=False)
