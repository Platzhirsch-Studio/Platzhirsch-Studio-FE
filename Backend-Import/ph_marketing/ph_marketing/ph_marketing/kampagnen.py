"""Kampagnen: Kontaktpunkte aus Website-UTM erfassen, Abschlüsse attribuieren, ROI berechnen.

Kontaktpunkte entstehen bei: PH Anfrage (ereignisse.anfrage_eingang, UTM aus Herkunftsblock), Newsletter-Anmeldung und
Event-Anmeldung (API-Parameter utm_*). Abschlüsse (Umsatz) aus PH Auftragsbestaetigung (ph_faktura, brutto_cent, datum)
und PH Bestellung (ph_shop, gesamt_cent, angelegt, nur live/bezahlt) – jeweils nur, wenn installiert.
Zuordnung Person ↔ Kontaktpunkt über PH Kontakt, sonst E-Mail. Logik: utils/attribution.py.
"""

import frappe
from frappe.utils import cint, get_datetime, now_datetime

from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils import attribution as attr
from ph_marketing.utils.token import email_normalisieren

KP = "PH Kampagne Kontaktpunkt"
BESTELLUNG_BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")


def _kampagnen():
    return frappe.get_all("PH Kampagne", fields=["name", "utm_campaign", "utm_source", "utm_medium", "status", "zeitraum_von", "zeitraum_bis"], filters={"utm_campaign": ("is", "set")})


def kampagne_fuer(utm, zeit=None):
    return attr.kampagne_waehlen(_kampagnen(), utm, zeit or now_datetime(), einstellungen()["kampagne_nachlauf_tage"])


def kontaktpunkt(utm, art, email=None, kontakt=None, referenz=None, zeit=None, kampagne=None, klick_id=None):
    """Kontaktpunkt anlegen (idempotent je Bezug+Art). → (name, kampagne) oder (None, None) ohne UTM-Kampagne."""
    utm = attr.utm_bereinigen(utm)
    if not utm.get("utm_campaign") and not kampagne:
        return None, None
    zeit = zeit or now_datetime()
    kampagne = kampagne or kampagne_fuer(utm, zeit)
    schluessel = f"{art}:{referenz[0]}:{referenz[1]}" if referenz else None
    if schluessel and frappe.db.exists(KP, {"idempotency_key": schluessel[:140]}):
        return frappe.db.get_value(KP, {"idempotency_key": schluessel[:140]}, "name"), kampagne
    doc = frappe.get_doc({
        "doctype": KP, "kampagne": kampagne, "art": art, "zeit": zeit, "email": email_normalisieren(email) or None, "kontakt": kontakt,
        "referenz_doctype": referenz[0] if referenz else None, "referenz_name": referenz[1] if referenz else None,
        "idempotency_key": schluessel[:140] if schluessel else None, "klick_id": (klick_id or "")[:140] or None, **utm,
    }).insert(ignore_permissions=True)
    return doc.name, kampagne


def _abschluesse(kontakte, emails):
    """→ {schluessel(kontakt|email): [dict(zeit, betrag_cent)]}."""
    erg = {}
    if kontakte and frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
        for a in frappe.get_all("PH Auftragsbestaetigung", filters={"kontakt": ("in", list(kontakte)), "status": ("!=", "Storniert")}, fields=["kontakt", "datum", "brutto_cent"]):
            erg.setdefault(a.kontakt, []).append({"zeit": a.datum, "betrag_cent": cint(a.brutto_cent)})
    if (kontakte or emails) and frappe.db.exists("DocType", "PH Bestellung"):
        felder = ["kontakt", "kunde_email", "angelegt", "gesamt_cent"]
        gesehen = set()
        for filt in ({"kontakt": ("in", list(kontakte))} if kontakte else None, {"kunde_email": ("in", list(emails))} if emails else None):
            if not filt:
                continue
            for b in frappe.get_all("PH Bestellung", filters={**filt, "status": ("in", BESTELLUNG_BEZAHLT), "modus": "live"}, fields=["name", *felder]):
                if b.name in gesehen:
                    continue
                gesehen.add(b.name)
                key = b.kontakt or email_normalisieren(b.kunde_email)
                erg.setdefault(key, []).append({"zeit": b.angelegt, "betrag_cent": cint(b.gesamt_cent)})
    return erg


def auswerten(modell=None, fenster_tage=None, kampagnen=None):
    """→ {kampagne: dict(umsatz_cent, abschluesse, kontaktpunkte)} für alle (oder die genannten) Kampagnen.
    Personen mit Kontaktpunkten zu irgendeiner Kampagne werden vollständig betrachtet (für First/Linear nötig)."""
    e = einstellungen()
    modell = modell or e["attribution_modell"]
    fenster = cint(fenster_tage) or e["attribution_fenster_tage"]
    filt = {"kampagne": ("is", "set")}
    punkte = frappe.get_all(KP, filters=filt, fields=["kampagne", "zeit", "email", "kontakt"])
    personen = {}
    for p in punkte:
        key = p.kontakt or p.email
        if not key:
            continue
        personen.setdefault(key, {"kontaktpunkte": [], "abschluesse": []})["kontaktpunkte"].append({"zeit": p.zeit, "kampagne": p.kampagne})
    kontakte = {p.kontakt for p in punkte if p.kontakt}
    emails = {p.email for p in punkte if p.email and not p.kontakt}
    for key, liste in _abschluesse(kontakte, emails).items():
        if key in personen:
            personen[key]["abschluesse"].extend(liste)
    erg = attr.auswerten(list(personen.values()), modell, fenster)
    zaehler = {}
    for p in punkte:
        zaehler[p.kampagne] = zaehler.get(p.kampagne, 0) + 1
    alle = set(erg) | set(zaehler)
    if kampagnen:
        alle &= set(kampagnen)
    return {k: {"umsatz_cent": erg.get(k, {}).get("umsatz_cent", 0), "abschluesse": erg.get(k, {}).get("abschluesse", 0), "kontaktpunkte": zaehler.get(k, 0)} for k in alle}


ZIEL_ART = {"Abos": "Newsletter-Anmeldung", "Event-Anmeldungen": "Event-Anmeldung", "Termine": "Termin", "Anfragen": "Anfrage"}


def ziel_ist(kampagne):
    """Fortschritt der Zielkennzahl aus Kontaktpunkten (Konzept L10); Klicks/Reichweite aus Kennzahlen-Tabelle."""
    if kampagne.ziel_kennzahl in ZIEL_ART:
        return frappe.db.count(KP, {"kampagne": kampagne.name, "art": ZIEL_ART[kampagne.ziel_kennzahl]})
    if kampagne.ziel_kennzahl == "Klicks":
        return cint(kampagne.klicks_gesamt)
    if kampagne.ziel_kennzahl == "Reichweite":
        return cint(kampagne.impressionen_gesamt)
    return 0


def kampagne_aktualisieren(kampagne):
    """Button „Attribution berechnen“ und täglicher Lauf: Felder an PH Kampagne setzen (db_set)."""
    modell = kampagne.get("attribution_modell") or None
    w = auswerten(modell=modell, kampagnen=[kampagne.name]).get(kampagne.name, {"umsatz_cent": 0, "abschluesse": 0, "kontaktpunkte": 0})
    werte = {
        "umsatz_attribuiert_cent": w["umsatz_cent"],
        "abschluesse_attribuiert": w["abschluesse"],
        "kontaktpunkte_gesamt": w["kontaktpunkte"],
        "roi_promille": attr.roi_promille(w["umsatz_cent"], kampagne.ausgaben_cent),
        "ziel_ist": ziel_ist(kampagne),
        "attribution_am": now_datetime(),
    }
    kampagne.db_set(werte, update_modified=False)
    return werte


def alle_aktualisieren():
    n = 0
    for name in frappe.get_all("PH Kampagne", filters={"status": ("!=", "Entwurf")}, pluck="name"):
        try:
            kampagne_aktualisieren(frappe.get_doc("PH Kampagne", name))
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kampagne Attribution {name}")
    return n


def zeit_oder_jetzt(x):
    return get_datetime(x) if x else now_datetime()
