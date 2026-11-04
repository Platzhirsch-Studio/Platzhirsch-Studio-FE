"""Server-Methoden der Desk-Page „ph-kassa“ (WP10b).

Alle Methoden sind nur für angemeldete Benutzer mit Rolle PH Kassa Mitarbeiter/Leitung (oder System
Manager). Beträge in Cent. Die Belegerzeugung läuft über ph_kassa.schnittstellen → WP10a
`ph_kassa.rksv.beleg.erzeuge_beleg(...)`; Zahlungen bucht der Kern (PLAN.md WP10a on_submit).
Fremde DocTypes (PH Kontakt, PH Produkt, PH Auftragsbestaetigung, PH Rechnung, PH Bestellung, PH Gutschein)
werden nur verwendet, wenn sie installiert sind – Felder werden gegen das Meta geprüft, weil die
Nachbar-Apps parallel entstehen.
"""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import getdate, now_datetime, nowdate

from ph_kassa import schnittstellen
from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen
from ph_kassa.ph_kassa.doctype.ph_kassenabschluss.ph_kassenabschluss import ist_gesperrt, oeffnen_oder_holen
from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import buchen as kassenbuch_buchen_fn
from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import letzter_bestand
from ph_kassa.ph_kassa.doctype.ph_terminal.ph_terminal import reader_fuer_kasse, zahlung_merken
from ph_kassa.druck.bon import bon_text
from ph_kassa.druck.drucker import druckauftrag, firma_dict
from ph_kassa.logik.betraege import STEUERSAETZE, KassenFehler, beleg_pruefen as logik_beleg_pruefen, stueckelung

# PH Produkt.ust_klasse (ph_sortiment) → Kassa-Steuersatz (Select); Rechenskala intern wie ph_shop/ph_faktura: Int×100 (STEUERSAETZE)
UST_KLASSE_STEUERSATZ = {"normal": "Normal 20", "ermaessigt": "Ermaessigt-1 10"}
from ph_kassa.terminal import TerminalFehler, dienst

ROLLEN = ("PH Kassa Mitarbeiter", "PH Kassa Leitung", "System Manager")
LEITUNG = ("PH Kassa Leitung", "System Manager")


def _rollen(leitung=False):
    rollen = set(frappe.get_roles())
    if frappe.session.user == "Guest" or not rollen & set(LEITUNG if leitung else ROLLEN):
        frappe.throw(_("Keine Berechtigung für die Kassa.") if not leitung else _("Nur die Kassa-Leitung darf das."), frappe.PermissionError)
    return bool(rollen & set(LEITUNG))


def _json(x):
    return json.loads(x) if isinstance(x, str) else (x or [])


def _hat(doctype, feld):
    return frappe.db.exists("DocType", doctype) and frappe.get_meta(doctype).has_field(feld)


def _felder(doctype, wunsch):
    if not frappe.db.exists("DocType", doctype):
        return []
    meta = frappe.get_meta(doctype)
    return [f for f in wunsch if f == "name" or meta.has_field(f)]


# ── Kontext ────────────────────────────────────────────────────────────────

@frappe.whitelist()
def kontext(kasse=None):
    leitung = _rollen()
    einst = einstellungen()
    kassen = []
    if frappe.db.exists("DocType", "PH Kasse"):
        kassen = frappe.get_all("PH Kasse", fields=_felder("PH Kasse", ["name", "bezeichnung", "standort", "status", "trainings_modus", "bon_drucker", "kundendisplay", "aktiver_abschluss"]), order_by="name")
    kasse = kasse or einst["standard_kasse"] or (kassen[0]["name"] if kassen else None)
    aktuelle = next((k for k in kassen if k["name"] == kasse), None)
    return {
        "user": frappe.session.user,
        "user_name": frappe.db.get_value("User", frappe.session.user, "full_name"),
        "leitung": leitung,
        "einstellungen": einst,
        "kassen": kassen,
        "kasse": kasse,
        "kasse_doc": aktuelle,
        "trainings": int((aktuelle or {}).get("trainings_modus") or 0),
        "gesperrt": ist_gesperrt(kasse, nowdate()) if kasse else False,
        "bargeld_bestand_cent": letzter_bestand(kasse) if kasse else 0,
        "terminals": reader_fuer_kasse(kasse) if frappe.db.exists("DocType", "PH Terminal") else [],
        "steuersaetze": list(STEUERSAETZE.keys()),
        "letzter_beleg": letzter_beleg(kasse) if kasse else None,
        "kern_vorhanden": schnittstellen._kern() is not None,
        "mock_erlaubt": schnittstellen.mock_erlaubt(),
        "firma": firma_dict(),
        "doctypes": {dt: bool(frappe.db.exists("DocType", dt)) for dt in ("PH Kontakt", "PH Produkt", "PH Auftragsbestaetigung", "PH Rechnung", "PH Bestellung", "PH Gutschein", "PH Kassenbeleg", "PH Kasse")},
        "heute_umsatz_cent": _heute_umsatz(kasse) if kasse else 0,
    }


def _heute_umsatz(kasse):
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return 0
    filters = {"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", [f"{nowdate()} 00:00:00", f"{nowdate()} 23:59:59"])}
    if _hat("PH Kassenbeleg", "trainings"):
        filters["trainings"] = 0
    rows = frappe.get_all("PH Kassenbeleg", filters=filters, fields=["gesamt_cent"])
    return sum(int(r.gesamt_cent or 0) for r in rows)


# ── Suche ──────────────────────────────────────────────────────────────────

@frappe.whitelist()
def suche_kunde(q):
    """Kontakte (ph_crm) mit offenen Aufträgen/Rechnungen/abholbereiten Bestellungen."""
    _rollen()
    q = (q or "").strip()
    if len(q) < 2:
        return []
    out = []
    if frappe.db.exists("DocType", "PH Kontakt"):
        felder = _felder("PH Kontakt", ["name", "titel", "vorname", "nachname", "firma", "email", "telefon", "plz_ort"])
        such = [f for f in ("titel", "vorname", "nachname", "firma", "email", "telefon", "name") if f in felder]
        kontakte = frappe.get_list("PH Kontakt", or_filters=[[f, "like", f"%{q}%"] for f in such], fields=felder, limit=12, order_by="modified desc")
        for k in kontakte:
            out.append({"kontakt": k.name, "titel": k.get("titel") or " ".join(x for x in (k.get("vorname"), k.get("nachname")) if x) or k.get("firma") or k.name, "untertitel": ", ".join(x for x in (k.get("firma"), k.get("plz_ort")) if x), "email": k.get("email"), "auftraege": _auftraege(k.name), "rechnungen": _rechnungen(k.name), "bestellungen": _bestellungen(k.name)})
    # Direkte Auftrags-/Rechnungsnummer
    if frappe.db.exists("DocType", "PH Auftragsbestaetigung") and q.upper().startswith("AB"):
        for a in frappe.get_list("PH Auftragsbestaetigung", filters=[["name", "like", f"%{q}%"]], fields=_felder("PH Auftragsbestaetigung", ["name", "kontakt"]), limit=5):
            out.append({"kontakt": a.get("kontakt"), "titel": a.name, "untertitel": _("Auftrag"), "auftraege": _auftraege(a.get("kontakt"), a.name), "rechnungen": [], "bestellungen": []})
    return out


def _auftraege(kontakt, name=None):
    if not frappe.db.exists("DocType", "PH Auftragsbestaetigung") or not (kontakt or name):
        return []
    felder = _felder("PH Auftragsbestaetigung", ["name", "status", "datum", "auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "offen_cent", "projekt"])
    filters = {"name": name} if name else {"kontakt": kontakt, "docstatus": ("<", 2)}
    if not name and _hat("PH Auftragsbestaetigung", "status"):
        filters["status"] = ("not in", ("Storniert", "Abgerechnet"))
    rows = frappe.get_all("PH Auftragsbestaetigung", filters=filters, fields=felder, order_by="modified desc", limit=10)
    out = []
    for r in rows:
        soll = int(r.get("anzahlung_soll_cent") or 0)
        ist = int(r.get("anzahlung_ist_cent") or 0)
        out.append({"auftrag": r.name, "status": r.get("status"), "datum": str(r.get("datum") or ""), "auftragswert_cent": int(r.get("auftragswert_cent") or 0), "anzahlung_offen_cent": max(0, soll - ist), "offen_cent": int(r.get("offen_cent") or 0), "steuersatz": _auftrag_steuersatz(r.name)})
    return out


def _auftrag_steuersatz(auftrag):
    """Steuersatz der Anzahlung = Satz der Auftragspositionen (PH Beleg Position.ust_satz_promille, ph_faktura); gemischt → Einstellungen."""
    einst = einstellungen()
    if not frappe.db.exists("DocType", "PH Beleg Position") or not _hat("PH Beleg Position", "ust_satz_promille"):
        return einst["steuersatz_anzahlung"]
    saetze = {int(p.ust_satz_promille or 0) for p in frappe.get_all("PH Beleg Position", filters={"parent": auftrag, "parenttype": "PH Auftragsbestaetigung"}, fields=["ust_satz_promille"])}
    umkehr = {v: k for k, v in STEUERSAETZE.items() if k != "Steuerfrei"}
    if len(saetze) == 1:
        return umkehr.get(saetze.pop(), einst["steuersatz_anzahlung"])
    return einst["steuersatz_anzahlung"]


def _rechnungen(kontakt):
    if not frappe.db.exists("DocType", "PH Rechnung") or not kontakt:
        return []
    felder = _felder("PH Rechnung", ["name", "art", "status", "brutto_cent", "offen_cent", "datum"])
    filters = {"kontakt": kontakt, "docstatus": 1}
    if _hat("PH Rechnung", "offen_cent"):
        filters["offen_cent"] = (">", 0)
    return [{"rechnung": r.name, "art": r.get("art"), "status": r.get("status"), "offen_cent": int(r.get("offen_cent") or r.get("brutto_cent") or 0), "datum": str(r.get("datum") or "")} for r in frappe.get_all("PH Rechnung", filters=filters, fields=felder, limit=10)]


def _bestellungen(kontakt):
    if not frappe.db.exists("DocType", "PH Bestellung") or not kontakt:
        return []
    felder = _felder("PH Bestellung", ["name", "status", "gesamt_cent", "lieferart", "abholcode"])
    filters = {"kontakt": kontakt}
    if _hat("PH Bestellung", "status"):
        filters["status"] = ("in", ("abholbereit", "reserviert", "zahlung_ausstehend"))
    return [{"bestellung": b.name, "status": b.get("status"), "gesamt_cent": int(b.get("gesamt_cent") or 0), "lieferart": b.get("lieferart")} for b in frappe.get_all("PH Bestellung", filters=filters, fields=felder, limit=10)]


@frappe.whitelist()
def suche_produkt(q):
    """Sortiment (ph_sortiment PH Produkt) nach Name/Marke/EAN – mit Bild, Preis falls gepflegt."""
    _rollen()
    q = (q or "").strip()
    if len(q) < 2 or not frappe.db.exists("DocType", "PH Produkt"):
        return []
    # Feldnamen laut ph_sortiment PH Produkt: titel, marke, bild_hauptbild, ean, aktueller_preis_cent (Brutto-VK), ust_klasse (normal|ermaessigt)
    felder = _felder("PH Produkt", ["name", "titel", "name_herstellerbezeichnung", "marke", "bild_hauptbild", "ean", "hersteller_artikelnr", "aktueller_preis_cent", "preisart", "ust_klasse", "status", "slug"])
    such = [f for f in ("titel", "name_herstellerbezeichnung", "marke", "ean", "hersteller_artikelnr", "slug", "name") if f in felder]
    rows = frappe.get_list("PH Produkt", or_filters=[[f, "like", f"%{q}%"] for f in such], fields=felder, limit=16, order_by="modified desc")
    einst = einstellungen()
    out = []
    for r in rows:
        preis = int(r.get("aktueller_preis_cent") or 0) if r.get("preisart") != "Auf Anfrage" else 0
        satz = UST_KLASSE_STEUERSATZ.get(r.get("ust_klasse") or "", einst["standard_steuersatz"])
        out.append({"produkt": r.name, "bezeichnung": r.get("titel") or r.get("name_herstellerbezeichnung") or r.name, "marke": r.get("marke"), "bild": r.get("bild_hauptbild"), "einzel_brutto_cent": preis, "steuersatz": satz, "ean": r.get("ean")})
    return out


@frappe.whitelist()
def gutschein_pruefen(code):
    _rollen()
    return schnittstellen.gutschein_pruefen(code)


# ── Beleg ──────────────────────────────────────────────────────────────────

@frappe.whitelist()
def beleg_vorschau(kasse, positionen, zahlarten=None, kontakt=None):
    """Live-Berechnung + Bon-Textvorschau (rechte Spalte) ohne Buchung."""
    _rollen()
    positionen = _json(positionen)
    zahlarten = _json(zahlarten)
    try:
        if zahlarten:
            s = logik_beleg_pruefen(positionen, zahlarten)
        else:
            from ph_kassa.logik.betraege import summen

            s = summen(positionen)
            s.update(zahlarten=[], rueckgeld_cent=0)
    except KassenFehler as e:
        return {"fehler": str(e)}
    beleg = {"belegnummer": "–", "kassen_id": kasse, "datum_uhrzeit": now_datetime(), "belegart": "Standard", "positionen": s["positionen"], "je_satz": s["je_satz"], "gesamt_cent": s["gesamt_cent"], "zahlarten": s.get("zahlarten") or [], "kunde_name": frappe.db.get_value("PH Kontakt", kontakt, "titel") if kontakt and frappe.db.exists("DocType", "PH Kontakt") else None}
    einst = einstellungen()
    return {"gesamt_cent": s["gesamt_cent"], "netto_cent": s["netto_cent"], "ust_cent": s["ust_cent"], "je_satz": s["je_satz"], "rueckgeld_cent": s.get("rueckgeld_cent", 0), "rueckgeld_stueckelung": stueckelung(s.get("rueckgeld_cent", 0)) if s.get("rueckgeld_cent", 0) > 0 else [], "vorschau": bon_text(beleg, firma_dict(), einst), "positionen": s["positionen"]}


@frappe.whitelist()
def beleg_buchen(kasse, positionen, zahlarten, kontakt=None, auftrag=None, rechnung=None, bestellung=None, trainings=0, kundenbeleg_email=None, drucken=None):
    """Beleg prüfen → WP10a erzeuge_beleg → (optional) drucken → Ergebnis mit Vorschau/Druckauftrag."""
    _rollen()
    einst = einstellungen()
    positionen = _json(positionen)
    zahlarten = _json(zahlarten)
    if ist_gesperrt(kasse, nowdate()):
        frappe.throw(_("Kasse {0} ist heute abgeschlossen – Leitung muss den Abschluss öffnen.").format(kasse))
    trainings = int(trainings or 0)
    if not trainings and _hat("PH Kasse", "trainings_modus"):
        trainings = int(frappe.db.get_value("PH Kasse", kasse, "trainings_modus") or 0)
    try:
        s = logik_beleg_pruefen(positionen, zahlarten)
    except KassenFehler as e:
        frappe.throw(str(e))
    for z in s["zahlarten"]:
        if z["zahlart"] == "Karte Stripe Terminal":
            if not z.get("terminal_payment_intent"):
                frappe.throw(_("Terminalzahlung wurde nicht gestartet."))
            st = dienst(erzwinge_mock=_mock_terminal()).status(z["terminal_payment_intent"])
            if not st["bezahlt"]:
                frappe.throw(_("Terminalzahlung ist noch nicht bestätigt (Status {0}).").format(st["status"]))
            if int(st["betrag_cent"]) != int(z["betrag_cent"]):
                frappe.throw(_("Terminalbetrag weicht vom Belegbetrag ab."))
        if z["zahlart"] == "Gutschein" and not z.get("gutschein"):
            frappe.throw(_("Gutschein wurde nicht geprüft."))
    for p in s["positionen"]:
        if p.get("art") == "Gutschein Verkauf" and einst["gutschein_art"] == "Mehrzweck":
            p["steuersatz"] = "Null 0"  # Mehrzweckgutschein: kein Umsatz beim Verkauf (Steuerberater bestätigt, PLAN.md)

    doc = schnittstellen.erzeuge_beleg(kasse=kasse, positionen=s["positionen"], zahlarten=s["zahlarten"], belegart="Trainingsbeleg" if trainings else "Standard", kontakt=kontakt or None, auftrag=auftrag or None, rechnung=rechnung or None, bestellung=bestellung or None, trainings=bool(trainings), bediener=frappe.session.user, kundenbeleg_email=kundenbeleg_email or None)
    ergebnis = {"beleg": doc.name, "belegnummer": doc.get("belegnummer"), "gesamt_cent": s["gesamt_cent"], "rueckgeld_cent": s["rueckgeld_cent"], "trainings": trainings}
    bar = any(z["zahlart"] == "Bar" for z in s["zahlarten"])
    soll_drucken = einst["automatisch_drucken"] if drucken is None else int(drucken)
    try:
        if soll_drucken:
            ergebnis["druck"] = druckauftrag(doc, schublade=bar)
        else:
            ergebnis["druck"] = {"modus": "keiner", "vorschau": bon_text(_beleg_dict(doc), firma_dict(), einst)}
    except frappe.ValidationError as e:
        ergebnis["druck"] = {"modus": "fehler", "fehler": str(e), "vorschau": bon_text(_beleg_dict(doc), firma_dict(), einst)}
    if kundenbeleg_email:
        try:
            beleg_mailen(doc.name, kundenbeleg_email)
            ergebnis["email"] = kundenbeleg_email
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Kassa: Beleg-Mail fehlgeschlagen")
            ergebnis["email_fehler"] = True
    _display(kasse, {"zustand": "fertig", "gesamt_cent": s["gesamt_cent"], "rueckgeld_cent": s["rueckgeld_cent"], "beleg": doc.name})
    return ergebnis


def _beleg_dict(doc):
    from ph_kassa.druck.drucker import beleg_dict

    return beleg_dict(doc)


@frappe.whitelist()
def beleg_drucken(beleg, modus=None):
    _rollen()
    return druckauftrag(beleg, modus=modus)


@frappe.whitelist()
def letzter_beleg(kasse):
    _rollen()
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return None
    felder = _felder("PH Kassenbeleg", ["name", "belegnummer", "belegart", "datum_uhrzeit", "gesamt_cent", "trainings", "bediener", "storno_von", "kundenbeleg_email", "kontakt"])
    rows = frappe.get_all("PH Kassenbeleg", filters={"kasse": kasse, "docstatus": 1}, fields=felder, order_by="datum_uhrzeit desc, creation desc", limit=1)
    if not rows:
        return None
    r = rows[0]
    r["storniert"] = bool(frappe.db.exists("PH Kassenbeleg", {"storno_von": r.name, "docstatus": 1})) if _hat("PH Kassenbeleg", "storno_von") else False
    return r


@frappe.whitelist()
def belege_heute(kasse, limit=30):
    _rollen()
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return []
    felder = _felder("PH Kassenbeleg", ["name", "belegnummer", "belegart", "datum_uhrzeit", "gesamt_cent", "trainings", "bediener", "storno_von", "kontakt"])
    return frappe.get_all("PH Kassenbeleg", filters={"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", [f"{nowdate()} 00:00:00", f"{nowdate()} 23:59:59"])}, fields=felder, order_by="datum_uhrzeit desc", limit=int(limit))


@frappe.whitelist()
def beleg_mailen(beleg, email):
    """Beleg als A4-PDF per E-Mail (ph_core.utils.mail.sende: Testmodus-Umleitung inklusive)."""
    _rollen()
    from frappe.utils import validate_email_address

    from ph_core.utils.mail import sende
    from ph_kassa.druck.drucker import PRINT_FORMAT_A4, pdf_bytes

    email = (email or "").strip().lower()
    if not validate_email_address(email):
        frappe.throw(_("E-Mail-Adresse ist ungültig."))
    einst = einstellungen()
    firma = firma_dict()
    doc = frappe.get_doc("PH Kassenbeleg", beleg)
    pdf = pdf_bytes(beleg, PRINT_FORMAT_A4)
    text = bon_text(_beleg_dict(doc), firma, einst)
    html = f"<p>Guten Tag,</p><p>anbei Ihr Beleg Nr. {frappe.utils.escape_html(str(doc.get('belegnummer') or doc.name))} vom {frappe.utils.format_datetime(doc.get('datum_uhrzeit'))}.</p><pre style=\"font-family:ui-monospace,Menlo,monospace;font-size:12px;background:#faf8f4;padding:12px\">{frappe.utils.escape_html(text)}</pre><p>Herzliche Grüße<br>{frappe.utils.escape_html(firma.get('firmenname') or 'Platzhirsch')}</p>"
    empfaenger = [email] + ([einst["beleg_email_kopie_an"]] if einst["beleg_email_kopie_an"] else [])
    sende(empfaenger, einst["beleg_email_betreff"], html, text=text, anhaenge=[{"fname": f"Beleg-{doc.get('belegnummer') or doc.name}.pdf", "fcontent": pdf}], referenz_doctype="PH Kassenbeleg", referenz_name=beleg)
    if _hat("PH Kassenbeleg", "kundenbeleg_email"):
        frappe.db.set_value("PH Kassenbeleg", beleg, "kundenbeleg_email", email, update_modified=False)
    return {"gesendet": True}


@frappe.whitelist()
def storno(beleg, grund):
    """Storno (Leitung) → WP10a Stornobeleg. Mitarbeiter dürfen nur eigene Belege desselben Tages stornieren."""
    leitung = _rollen()
    if not (grund or "").strip():
        frappe.throw(_("Bitte einen Stornogrund angeben."))
    alt = frappe.db.get_value("PH Kassenbeleg", beleg, _felder("PH Kassenbeleg", ["name", "kasse", "bediener", "datum_uhrzeit", "docstatus", "belegart"]), as_dict=True)
    if not alt or alt.docstatus != 1:
        frappe.throw(_("Beleg nicht gefunden oder nicht signiert."))
    if not leitung and (alt.get("bediener") != frappe.session.user or getdate(alt.get("datum_uhrzeit")) != getdate()):
        frappe.throw(_("Storno fremder oder älterer Belege nur durch die Kassa-Leitung."), frappe.PermissionError)
    if alt.get("belegart") in ("Stornobeleg", "Nullbeleg", "Startbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg"):
        frappe.throw(_("Dieser Beleg kann nicht storniert werden."))
    if _hat("PH Kassenbeleg", "storno_von") and frappe.db.exists("PH Kassenbeleg", {"storno_von": beleg, "docstatus": 1}):
        frappe.throw(_("Beleg ist bereits storniert."))
    if ist_gesperrt(alt.kasse, nowdate()):
        frappe.throw(_("Kasse ist heute abgeschlossen."))
    doc = schnittstellen.storniere_beleg(beleg, grund, bediener=frappe.session.user)
    einst = einstellungen()
    ergebnis = {"beleg": doc.name, "belegnummer": doc.get("belegnummer")}
    if einst["automatisch_drucken"]:
        try:
            ergebnis["druck"] = druckauftrag(doc)
        except frappe.ValidationError as e:
            ergebnis["druck"] = {"modus": "fehler", "fehler": str(e)}
    return ergebnis


@frappe.whitelist()
def nullbeleg(kasse):
    _rollen()
    doc = schnittstellen.nullbeleg(kasse, bediener=frappe.session.user)
    out = {"beleg": doc.name, "belegnummer": doc.get("belegnummer")}
    try:
        out["druck"] = druckauftrag(doc)
    except frappe.ValidationError as e:
        out["druck"] = {"modus": "fehler", "fehler": str(e)}
    return out


@frappe.whitelist()
def trainingsmodus(kasse, an):
    """Schalter in der Page; wird auf PH Kasse.trainings_modus (WP10a) gespiegelt."""
    _rollen()
    an = int(an or 0)
    if _hat("PH Kasse", "trainings_modus"):
        frappe.db.set_value("PH Kasse", kasse, "trainings_modus", an, update_modified=False)
    frappe.get_doc("PH Kasse", kasse).add_comment("Info", _("Trainingsmodus {0} durch {1}").format(_("ein") if an else _("aus"), frappe.session.user)) if frappe.db.exists("DocType", "PH Kasse") else None
    return an


# ── Kassenbuch / Abschluss ─────────────────────────────────────────────────

@frappe.whitelist()
def kassenbuch_buchen(kasse, art, betrag_cent, grund):
    _rollen()
    if art not in ("Einlage", "Entnahme", "Anfangsbestand"):
        frappe.throw(_("Nur Einlage, Entnahme oder Anfangsbestand über die Kassa."))
    if ist_gesperrt(kasse, nowdate()):
        frappe.throw(_("Kasse ist heute abgeschlossen."))
    doc = kassenbuch_buchen_fn(kasse, art, int(betrag_cent), grund, quelle="kassa")
    return {"name": doc.name, "bestand_danach_cent": doc.bestand_danach_cent}


@frappe.whitelist()
def abschluss_laden(kasse):
    _rollen()
    return oeffnen_oder_holen(kasse, nowdate()).zusammenfassung()


@frappe.whitelist()
def abschluss_zaehlen(kasse, zaehlprotokoll, bargeld_anfang_cent=None, unterschrift=None, unterschrift_name=None):
    _rollen()
    doc = oeffnen_oder_holen(kasse, nowdate())
    return doc.zaehlen(zaehlprotokoll=_json(zaehlprotokoll), bargeld_anfang_cent=bargeld_anfang_cent, unterschrift=unterschrift, unterschrift_name=unterschrift_name)


@frappe.whitelist()
def abschluss_abschliessen(kasse, differenz_grund=None, unterschrift=None, unterschrift_name=None):
    _rollen(leitung=True)
    doc = oeffnen_oder_holen(kasse, nowdate())
    z = doc.abschliessen(differenz_grund=differenz_grund, unterschrift=unterschrift, unterschrift_name=unterschrift_name)
    z["pdf_url"] = f"/api/method/frappe.utils.print_format.download_pdf?doctype=PH%20Kassenabschluss&name={frappe.utils.quote(doc.name)}&format={frappe.utils.quote('PH Kassenabschluss Protokoll')}&no_letterhead=1"
    return z


# ── Terminal ───────────────────────────────────────────────────────────────

def _mock_terminal():
    return bool(einstellungen()["terminal_testmodus"]) and not frappe.conf.get("ph_stripe_secret_key")


@frappe.whitelist()
def terminal_start(kasse, terminal, betrag_cent, beschreibung=None):
    _rollen()
    try:
        st = dienst(erzwinge_mock=_mock_terminal()).zahlung_starten(terminal, int(betrag_cent), beschreibung or f"Platzhirsch Kassa {kasse}", {"art": "kassa", "kasse": kasse, "terminal": terminal, "user": frappe.session.user})
    except TerminalFehler as e:
        frappe.throw(_("Terminal: {0}").format(e.meldung))
    zahlung_merken(terminal, st["payment_intent"], st["status"])
    _display(kasse, {"zustand": "karte", "gesamt_cent": int(betrag_cent)})
    return st


@frappe.whitelist()
def terminal_status(payment_intent, terminal=None):
    _rollen()
    try:
        st = dienst(erzwinge_mock=_mock_terminal()).status(payment_intent)
    except TerminalFehler as e:
        frappe.throw(_("Terminal: {0}").format(e.meldung))
    if terminal:
        zahlung_merken(terminal, payment_intent, st["status"])
    return st


@frappe.whitelist()
def terminal_abbruch(payment_intent, terminal=None):
    _rollen()
    try:
        st = dienst(erzwinge_mock=_mock_terminal()).abbrechen(payment_intent, terminal)
    except TerminalFehler as e:
        frappe.throw(_("Terminal: {0}").format(e.meldung))
    if terminal:
        zahlung_merken(terminal, payment_intent, st["status"])
    return st


@frappe.whitelist()
def terminal_simulieren(terminal, erfolgreich=1):
    """Nur Testmodus: Kartenzahlung am (Mock-/Test-)Reader simulieren."""
    _rollen()
    if not einstellungen()["terminal_testmodus"]:
        frappe.throw(_("Simulation nur im Terminal-Testmodus."))
    try:
        return dienst(erzwinge_mock=_mock_terminal()).simuliere_zahlung(terminal, bool(int(erfolgreich)))
    except TerminalFehler as e:
        frappe.throw(_("Terminal: {0}").format(e.meldung))


# ── Kundendisplay ──────────────────────────────────────────────────────────

@frappe.whitelist()
def display_senden(kasse, zustand):
    """Kassa-Page → Kundendisplay (zweites Fenster /app/ph-kassa?display=1&kasse=…) via frappe.realtime."""
    _rollen()
    _display(kasse, _json(zustand) if isinstance(zustand, str) else zustand)
    return True


def _display(kasse, daten):
    try:
        frappe.publish_realtime(f"ph_kassa_display_{kasse}", daten, after_commit=False)
    except Exception:  # noqa: BLE001
        pass
