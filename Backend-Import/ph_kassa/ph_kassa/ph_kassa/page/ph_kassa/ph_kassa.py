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

from ph_kassa import dienste, schnittstellen
from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen
from ph_kassa.ph_kassa.doctype.ph_kassenabschluss.ph_kassenabschluss import geschaeftszeitraum, ist_gesperrt, oeffnen_oder_holen
from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import buchen as kassenbuch_buchen_fn
from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import letzter_bestand
from ph_kassa.ph_kassa.doctype.ph_terminal.ph_terminal import reader_fuer_kasse, zahlung_merken
from ph_kassa.druck.bon import bon_text
from ph_kassa.druck.drucker import druckauftrag, firma_dict
from ph_kassa.logik.betraege import STEUERSAETZE, KassenFehler, beleg_pruefen as logik_beleg_pruefen, stueckelung
from ph_kassa.logik.integration import karten_fehler

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
        "offene_kartenzahlungen": dienste.offene_kartenzahlungen(kasse) if kasse else [],
        "schnelltasten": schnelltasten(kasse) if kasse else [],
        "geschaeftstag": str(_heute()),
        "chf": {"aktiv": einst["chf_annahme_aktiv"], "kurs_mikro": einst["chf_kurs_mikro"], "kurs_datum": einst["chf_kurs_datum"]},
    }


def _heute_umsatz(kasse):
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return 0
    filters = {"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", list(geschaeftszeitraum(_heute())))}
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
    felder = _felder("PH Auftragsbestaetigung", ["name", "status", "datum", "auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "offen_cent", "projekt", "vertragsort", "fagg_frist_ende"])
    filters = {"name": name} if name else {"kontakt": kontakt, "docstatus": ("<", 2)}
    if not name and _hat("PH Auftragsbestaetigung", "status"):
        filters["status"] = ("not in", ("Storniert", "Abgerechnet"))
    rows = frappe.get_all("PH Auftragsbestaetigung", filters=filters, fields=felder, order_by="modified desc", limit=10)
    out = []
    for r in rows:
        soll = int(r.get("anzahlung_soll_cent") or 0)
        ist = int(r.get("anzahlung_ist_cent") or 0)
        out.append({"auftrag": r.name, "status": r.get("status"), "datum": str(r.get("datum") or ""), "auftragswert_cent": int(r.get("auftragswert_cent") or 0), "anzahlung_offen_cent": max(0, soll - ist), "offen_cent": int(r.get("offen_cent") or 0), "steuersatz": _auftrag_steuersatz(r.name),
                    "zahlungsplan": _zahlungsplan(r.name), "vertragsort": r.get("vertragsort"), "fagg_frist_ende": str(r.get("fagg_frist_ende") or "") or None})
    return out


def _zahlungsplan(auftrag):
    """Zahlungsplan-Zeilen des Auftrags (ph_faktura.kassa.offene_anzahlung) – Kassa wählt die Rate (Konzept §9.1)."""
    try:
        from ph_faktura.ph_faktura.kassa import offene_anzahlung

        return offene_anzahlung(auftrag)
    except Exception:  # noqa: BLE001 – ph_faktura fehlt oder Auftrag nicht lesbar
        return []


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
    felder = _felder("PH Rechnung", ["name", "art", "status", "brutto_cent", "offen_cent", "datum", "nummer"])
    filters = {"kontakt": kontakt, "docstatus": 1}
    if _hat("PH Rechnung", "offen_cent"):
        filters["offen_cent"] = (">", 0)
    return [{"rechnung": r.name, "art": r.get("art"), "status": r.get("status"), "offen_cent": int(r.get("offen_cent") or r.get("brutto_cent") or 0), "datum": str(r.get("datum") or ""), "steuersatz": _rechnung_steuersatz(r.name)} for r in frappe.get_all("PH Rechnung", filters=filters, fields=felder, limit=10)]


def _rechnung_steuersatz(rechnung):
    """Teil-/Schlusszahlung bar: Steuersatz der Rechnung für die RKSV-Summe (Fachkritik 21 P-C); gemischt → Normal."""
    if not _hat("PH Beleg Steuer", "ust_satz_promille"):
        return "Normal 20"
    saetze = {int(a.ust_satz_promille or 0) for a in frappe.get_all("PH Beleg Steuer", filters={"parent": rechnung, "parenttype": "PH Rechnung"}, fields=["ust_satz_promille"])}
    umkehr = {v: k for k, v in STEUERSAETZE.items() if k != "Steuerfrei"}
    return umkehr.get(saetze.pop(), "Normal 20") if len(saetze) == 1 else "Normal 20"


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
def beleg_buchen(kasse, positionen, zahlarten, kontakt=None, auftrag=None, rechnung=None, bestellung=None, trainings=0, kundenbeleg_email=None, drucken=None,
                 idempotency_key=None, kunde_name=None, zahlungsplan_position=None, kundenkarte=None, kundenkarte_vorteile=None, freigabe=None,
                 empfaenger=None, rechnung_erstellen=0, identitaet=None, retoure_original=None):
    """Beleg prüfen → WP10a erzeuge_beleg → (optional) drucken → Ergebnis mit Vorschau/Druckauftrag.

    Neu (50-backend-luecken-kassa-faktura.md): idempotency_key (Doppel-F12/Netzabbruch), kunde_name, zahlungsplan_position,
    kundenkarte (+ Vorteile einlösen), Leitungsfreigabe per PIN (freigabe = {email, pin, geraet_token}) für Rabatt/
    Überzahlung/Retoure bar, Rechnungsempfänger (empfaenger = {name|firma, strasse, plz, ort, land, uid, email} →
    PH Kontakt) und Barverkaufsrechnung (ab 400 € automatisch), Identität ab 10.000 € bar (identitaet = {art, nummer, name}),
    Retoure (retoure_original = Originalbeleg), CHF bar (Kurs vom Server), Einzweck-/Mehrzweck-Gutscheine.
    """
    _rollen()
    einst = einstellungen()
    positionen = _json(positionen)
    zahlarten = _json(zahlarten)
    empfaenger = _json(empfaenger) if empfaenger else None
    identitaet = _json(identitaet) if identitaet else None
    if idempotency_key:
        alt = frappe.db.get_value("PH Kassenbeleg", {"idempotency_key": idempotency_key, "docstatus": 1}, "name")
        if alt:
            return {"beleg": alt, "belegnummer": frappe.db.get_value("PH Kassenbeleg", alt, "belegnummer"), "wiederholung": True}
    if ist_gesperrt(kasse, _heute()):
        frappe.throw(_("Kasse {0} ist heute abgeschlossen – Leitung muss den Abschluss öffnen.").format(kasse))
    trainings = int(trainings or 0)
    if not trainings and _hat("PH Kasse", "trainings_modus"):
        trainings = int(frappe.db.get_value("PH Kasse", kasse, "trainings_modus") or 0)

    # Steuersätze, die der Server festlegt (nie dem Client glauben)
    gutscheinart = einst["gutschein_art"]
    for p in positionen:
        if p.get("art") == "Gutschein Verkauf":
            p["steuersatz"] = "Null 0" if gutscheinart == "Mehrzweck" else einst["standard_steuersatz"]
            if float(p.get("menge") or 1) != 1:
                frappe.throw(_("Gutscheine einzeln verkaufen (Menge 1 je Gutschein)."))
        if p.get("art") == "Gutschein Einloesung":
            p["steuersatz"] = einst["standard_steuersatz"]
        if p.get("art") in ("Teilzahlung", "Schlusszahlung") and rechnung:
            p["steuersatz"] = _rechnung_steuersatz(rechnung)
        if p.get("art") == "Anzahlung" and auftrag:
            p["steuersatz"] = _auftrag_steuersatz(auftrag)
    for z in zahlarten:
        if z.get("fremdwaehrung"):
            _chf_pruefen(einst)
            z["kurs_mikro"] = einst["chf_kurs_mikro"]
    gutschein_hinweise = []
    if not any(p.get("art") == "Retoure" for p in positionen):
        positionen, zahlarten, gutschein_hinweise = _gutscheine_nach_art(positionen, zahlarten)
    _ausstellungsstuecke_pruefen(positionen)
    # Retoure: Mengen gegen Originalbeleg, Rückzahlung auf die Originalkarte
    original = None
    if any(p.get("art") == "Retoure" for p in positionen):
        if retoure_original:
            original, zeilen = dienste.retoure_daten(retoure_original)
            nach_zeile = {z["name"]: z for z in zeilen}
            for p in positionen:
                if p.get("art") != "Retoure":
                    continue
                z = nach_zeile.get(p.get("bezug_zeile"))
                if not z or float(p.get("menge") or 1) > float(z["ruecknehmbar"]) + 1e-9:
                    frappe.throw(_("Rücknahme „{0}“ übersteigt die rücknehmbare Menge des Originalbelegs.").format(p.get("bezeichnung")))
                p.update(bezug_doctype="PH Kassenbeleg", bezug=original.name, steuersatz=z.get("steuersatz"), einzel_brutto_cent=-abs(int(z.get("einzel_brutto_cent") or 0)))
            for z in zahlarten:
                if z.get("zahlart") == "Karte Stripe Terminal" and not z.get("terminal_payment_intent"):
                    orig = next((o for o in original.zahlarten if o.zahlart == "Karte Stripe Terminal"), None)
                    if not orig:
                        frappe.throw(_("Originalbeleg wurde nicht mit dem Terminal bezahlt – Rückzahlung bar oder per Überweisung."))
                    z.update(terminal_payment_intent=orig.terminal_payment_intent, erstattung_von_zahlung=orig.zahlung)
            kontakt = kontakt or original.kontakt
    try:
        s = logik_beleg_pruefen(positionen, zahlarten)
    except KassenFehler as e:
        frappe.throw(str(e))

    # Fachregeln (logik/regeln.py) und Leitungsfreigabe
    from ph_kassa.logik import regeln
    from ph_kassa.logik.betraege import rabatt_freigabe_noetig

    auftrag_info = next((a for a in _auftraege(None, auftrag)), None) if auftrag else None
    pruef = regeln.pruefe({
        "positionen": s["positionen"], "zahlarten": s["zahlarten"], "gesamt_cent": s["gesamt_cent"], "kontakt": kontakt, "auftrag": auftrag, "rechnung": rechnung,
        "empfaenger": empfaenger, "identitaet": identitaet, "retoure_original": bool(original),
        "auftrag_offen_cent": auftrag_info["anzahlung_offen_cent"] if auftrag_info and auftrag_info["anzahlung_offen_cent"] else None,
        "vertragsort": (auftrag_info or {}).get("vertragsort"), "fagg_frist_ende": (auftrag_info or {}).get("fagg_frist_ende"),
        "rabatt_freigabe_index": rabatt_freigabe_noetig(positionen, einst["rabatt_freigabe_ab_promille"]),
    }, einst)
    if pruef["fehler"]:
        frappe.throw("<br>".join(pruef["fehler"]))
    freigabe_von = dienste.freigabe_pruefen(freigabe, [regeln.FREIGABE_TEXTE[c] for c in pruef["freigaben"]])

    for z in s["zahlarten"]:
        if z["zahlart"] == "Karte Stripe Terminal" and z["betrag_cent"] > 0:
            if not z.get("terminal_payment_intent"):
                frappe.throw(_("Terminalzahlung wurde nicht gestartet."))
            st = dienst(erzwinge_mock=_mock_terminal()).status(z["terminal_payment_intent"])
            if not st["bezahlt"]:
                frappe.throw(_("Terminalzahlung ist noch nicht bestätigt (Status {0}).").format(st["status"]))
            if int(st["betrag_cent"]) != int(z["betrag_cent"]):
                frappe.throw(_("Terminalbetrag weicht vom Belegbetrag ab."))
        if z["zahlart"] == "Gutschein" and not z.get("gutschein"):
            frappe.throw(_("Gutschein wurde nicht geprüft."))

    # Rechnungsempfänger anlegen (Laufkunde)
    if empfaenger and not kontakt:
        neu = dienste.kunde_anlegen(**{k: empfaenger.get(k) for k in ("name", "vorname", "nachname", "firma", "strasse", "plz", "ort", "land", "uid", "email", "telefon")})
        kontakt = neu["kontakt"]
        if neu.get("bestehend"):
            pruef["hinweise"].append(_("Rechnungsempfänger: bestehender Kontakt {0} verwendet (Dublettenprüfung ph_crm).").format(kontakt))
    if kontakt and not kunde_name and frappe.db.exists("DocType", "PH Kontakt"):
        kunde_name = frappe.db.get_value("PH Kontakt", kontakt, "titel")
    zusatz = {"freigabe_von": freigabe_von, "freigabe_gruende": ", ".join(pruef["freigaben"]) or None}
    if identitaet:
        zusatz.update(id_pruefung_art=identitaet.get("art"), id_pruefung_nummer=identitaet.get("nummer"), id_pruefung_name=identitaet.get("name") or kunde_name, id_pruefung_von=frappe.session.user)

    doc = schnittstellen.erzeuge_beleg(kasse=kasse, positionen=s["positionen"], zahlarten=s["zahlarten"], belegart="Trainingsbeleg" if trainings else "Standard", kontakt=kontakt or None, auftrag=auftrag or None, rechnung=rechnung or None, bestellung=bestellung or None, trainings=bool(trainings), bediener=frappe.session.user, kundenbeleg_email=kundenbeleg_email or None,
                                       idempotency_key=idempotency_key or None, kunde_name=kunde_name or None, zahlungsplan_position=zahlungsplan_position or None, zusatz=zusatz)
    ergebnis = {"beleg": doc.name, "belegnummer": doc.get("belegnummer"), "gesamt_cent": s["gesamt_cent"], "rueckgeld_cent": s["rueckgeld_cent"], "trainings": trainings,
                "hinweise": list(pruef["hinweise"]) + gutschein_hinweise, "freigabe_von": freigabe_von,
                "gutschein_codes": doc.flags.get("ph_gutschein_codes") or [], "faktura": doc.flags.get("ph_faktura"), "erstattungen": doc.flags.get("ph_refunds") or [], "klaerfaelle": doc.flags.get("ph_klaerfaelle") or []}
    for z in s["zahlarten"]:
        if z.get("terminal_payment_intent") and z["betrag_cent"] > 0:
            dienste.vorgang_merken(z["terminal_payment_intent"], status="Verbucht", beleg=doc.name, beendet_am=now_datetime())
    # Kundenkarte (ph_kundenkarte ist optional, nach ph_kassa installiert)
    if kundenkarte:
        ergebnis["kundenkarte"] = _kundenkarte_buchen(doc, kundenkarte, _json(kundenkarte_vorteile) if kundenkarte_vorteile else [])
    # Barverkaufsrechnung (§ 11 UStG über 400 € oder auf Wunsch)
    umsatz = sum(int(p.get("brutto_cent") or 0) for p in s["positionen"] if p.get("art") in ("Artikel", "Freitext", "Gutschein Einloesung", "Retoure", "Rabatt"))
    if not trainings and not rechnung and kontakt and (int(rechnung_erstellen or 0) or umsatz > einst["barverkauf_rechnung_ab_cent"]):
        try:
            from ph_faktura.api import create_invoice_from_receipt

            r = create_invoice_from_receipt(doc.name, kontakt=kontakt)
            frappe.db.set_value("PH Kassenbeleg", doc.name, "barverkauf_rechnung", r["rechnung"], update_modified=False)
            ergebnis["rechnung"] = r
        except Exception as e:  # noqa: BLE001 – Beleg ist gebucht; Rechnung kann die Faktura nachholen
            frappe.log_error(title=f"PH Kassa: Barverkaufsrechnung {doc.name}")
            ergebnis["hinweise"].append(_("Rechnung nicht erstellt ({0}) – in Faktura „Rechnung aus Kassenbeleg“.").format(str(e)[:120]))
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
    # Belegerteilungspflicht (§ 132a Abs 1 BAO): ohne Druck und ohne E-Mail Beleg am Kundendisplay zeigen
    ohne_papier = ergebnis["druck"].get("modus") in ("fehler", "keiner") and not ergebnis.get("email")
    if ohne_papier:
        ergebnis["beleg_aushaendigen"] = _("Beleg nicht gedruckt – QR-Beleg am Kundendisplay zeigen oder per E-Mail senden (Belegerteilungspflicht).")
    _display(kasse, {"zustand": "beleg" if ohne_papier else "fertig", "gesamt_cent": s["gesamt_cent"], "rueckgeld_cent": s["rueckgeld_cent"], "beleg": doc.name, "qr": doc.get("maschinenlesbarer_code") if ohne_papier else None})
    return ergebnis


def _chf_pruefen(einst):
    from frappe.utils import date_diff

    if not einst["chf_annahme_aktiv"]:
        frappe.throw(_("CHF-Annahme ist nicht aktiviert."))
    if not einst["chf_kurs_mikro"] or not einst["chf_kurs_datum"] or date_diff(_heute(), einst["chf_kurs_datum"]) > einst["chf_kurs_max_alter_tage"]:
        frappe.throw(_("CHF-Kurs fehlt oder ist veraltet – Leitung pflegt den Kurs in PH Kassa Einstellungen."))


def _kundenkarte_buchen(doc, kartennummer, vorteile):
    """Kartennummer am Beleg speichern (Custom Field von ph_kundenkarte) und Vorteile einlösen (Bezug = Beleg)."""
    out = {"kartennummer": kartennummer, "vorteile": [], "fehler": []}
    try:
        if _hat("PH Kassenbeleg", "ph_kundenkarte_kartennummer"):
            frappe.db.set_value("PH Kassenbeleg", doc.name, "ph_kundenkarte_kartennummer", kartennummer, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Kassa: Kundenkarte am Beleg {doc.name}")
    if not vorteile:
        return out
    try:
        # Integration Runde 3 (52-…, Abschnitt 8): direkte Python-Funktionen – kein commit/rollback im Kassen-Request,
        # Fehler als ApiFehler (card_*, limit_reached …) → Kassa-Fehlerform; der Beleg bleibt gültig.
        from ph_core.api import ApiFehler
        from ph_kundenkarte.ph_kundenkarte.kassa import einloesen
    except ImportError:
        out["fehler"].append(karten_fehler("unavailable", _("ph_kundenkarte nicht installiert.")))
        return out
    for v in vorteile:
        try:
            out["vorteile"].append(einloesen(kartennummer, v, bezug_doctype="PH Kassenbeleg", bezug=doc.name, ort="Kassa"))
        except ApiFehler as e:
            out["fehler"].append(karten_fehler(e.code, e.meldung, v, e.http_status))
        except Exception as e:  # noqa: BLE001 – unerwartet: protokollieren, Beleg bleibt
            frappe.log_error(title=f"PH Kassa: Kundenkarte {kartennummer} Vorteil {v}")
            out["fehler"].append(karten_fehler("unavailable", str(e)[:120], v, 500))
    out["codes"] = sorted({f["code"] for f in out["fehler"]})
    return out


def _gutscheine_nach_art(positionen, zahlarten):
    """Server prüft jeden Gutschein über ph_shop.gutschein.pruefen (Art, Satz, Restwert) und stellt um:
    Rabatt (mindert_entgelt) → Rabattposition je Steuersatz der Ware statt Gutschein-Zahlung; Einzweck → Satz der Ausgabe;
    Einzweck ohne Satz → klare Meldung (ph_shop bricht ab, bis der Satz nachgetragen ist)."""
    namen = {z.get("gutschein") for z in zahlarten if z.get("zahlart") == "Gutschein" and z.get("gutschein")}
    namen |= {p.get("gutschein") for p in positionen if p.get("art") == "Gutschein Einloesung" and p.get("gutschein")}
    if not namen or not frappe.db.exists("DocType", "PH Gutschein"):
        return positionen, zahlarten, []
    from ph_shop.gutschein import pruefen

    from ph_kassa.logik.integration import EINZWECK_OHNE_SATZ, gutscheine_umstellen

    je = {}
    for g in namen:
        try:
            je[g] = pruefen(g)
        except frappe.DoesNotExistError:
            frappe.throw(_("Gutschein {0} nicht gefunden.").format(g))
        except frappe.ValidationError as e:
            if "Einzweck" in str(e):
                frappe.throw(_(EINZWECK_OHNE_SATZ).format(g), title=_("Gutschein nicht einlösbar"))
            raise
        if not je[g].get("einloesbar"):
            frappe.throw(_("Gutschein {0} ist nicht einlösbar ({1}).").format(g, _(je[g].get("status") or "")))
    try:
        return gutscheine_umstellen(positionen, zahlarten, je)
    except KassenFehler as e:
        frappe.throw(str(e))


def _ausstellungsstuecke_pruefen(positionen):
    """Positionen mit Bezug PH Lagerbestand: Ausstellungsstück, verkäuflich, nicht schon kassiert (Server prüft)."""
    from ph_kassa.logik.integration import ausstellungsstuecke_im_beleg

    try:
        zeilen = ausstellungsstuecke_im_beleg(positionen)
    except KassenFehler as e:
        frappe.throw(str(e))
    if not zeilen:
        return
    if not frappe.db.exists("DocType", "PH Lagerbestand"):
        frappe.throw(_("Ausstellungsstück: ph_logistik ist nicht installiert."))
    for p in zeilen:
        lb = frappe.db.get_value("PH Lagerbestand", p["bezug"], ["name", "ausstellungsstueck", "status"], as_dict=True)
        if not lb or not lb.ausstellungsstueck:
            frappe.throw(_("{0} ist kein Ausstellungsstück.").format(p["bezug"]))
        if lb.status in ("Ausgeschieden", "Gesperrt", "Reserviert"):
            frappe.throw(_("Ausstellungsstück {0} ist {1}.").format(lb.name, _(lb.status)))
        kassiert = frappe.get_all("PH Kassenbeleg Position", filters={"parenttype": "PH Kassenbeleg", "lagerbestand_ref": lb.name}, pluck="parent")
        if kassiert and frappe.db.exists("PH Kassenbeleg", {"name": ("in", kassiert), "docstatus": 1, "belegart": "Standard", "storniert_durch": ("is", "not set")}):
            frappe.throw(_("Ausstellungsstück {0} wurde bereits kassiert.").format(lb.name))
        p["lagerbestand_ref"] = lb.name
        for k in ("ausstellungsstueck", "bereits_gebucht"):
            p.pop(k, None)


@frappe.whitelist()
def ausstellungsstueck(lagerbestand, vk_cent=None):
    """Kassenposition „Ausstellungsstück“ zu PH Lagerbestand (ph_logistik als_ausstellungsstueck_verkaufen / Scan).
    Der Verkauf im Bestand wird beim Buchen des Belegs gebucht (PH Kassenbeleg._ausstellungsstuecke_buchen)."""
    _rollen()
    if not frappe.db.exists("DocType", "PH Lagerbestand"):
        frappe.throw(_("ph_logistik ist nicht installiert."))
    felder = _felder("PH Lagerbestand", ["name", "produkt", "produkt_name", "marke", "seriennummer", "ausstellungsstueck", "status", "verfuegbar", "vk_cent_ausstellung", "zustand"])
    lb = frappe.db.get_value("PH Lagerbestand", lagerbestand, felder, as_dict=True)
    if not lb:
        frappe.throw(_("Lagerbestand {0} nicht gefunden.").format(lagerbestand))
    ust_klasse = frappe.db.get_value("PH Produkt", lb.produkt, "ust_klasse") if lb.get("produkt") and _hat("PH Produkt", "ust_klasse") else None
    from ph_kassa.logik.integration import ausstellungsstueck_position

    try:
        return ausstellungsstueck_position(lb, int(vk_cent) if vk_cent not in (None, "") else None, einstellungen()["standard_steuersatz"], ust_klasse)
    except KassenFehler as e:
        frappe.throw(str(e))


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
    return frappe.get_all("PH Kassenbeleg", filters={"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", list(geschaeftszeitraum(_heute())))}, fields=felder, order_by="datum_uhrzeit desc", limit=int(limit))


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
def storno(beleg, grund, freigabe=None):
    """Storno → WP10a Stornobeleg (Fachkritik 21 P1). Mitarbeiter: eigene Belege von heute bis
    `storno_mitarbeiter_bis_cent`; sonst Leitungsfreigabe per PIN (freigabe = {email, pin, geraet_token}).
    Rückzahlung je Zahlart: Bar aus der Lade (Schublade öffnet), Karte → Stripe-Refund, Gutschein → Restwert zurück."""
    leitung = _rollen()
    if not (grund or "").strip():
        frappe.throw(_("Bitte einen Stornogrund angeben."))
    alt = frappe.db.get_value("PH Kassenbeleg", beleg, _felder("PH Kassenbeleg", ["name", "kasse", "bediener", "datum_uhrzeit", "docstatus", "belegart", "gesamt_cent", "geschaeftstag"]), as_dict=True)
    if not alt or alt.docstatus != 1:
        frappe.throw(_("Beleg nicht gefunden oder nicht signiert."))
    if alt.get("belegart") in ("Stornobeleg", "Nullbeleg", "Startbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg"):
        frappe.throw(_("Dieser Beleg kann nicht storniert werden."))
    if _hat("PH Kassenbeleg", "storno_von") and frappe.db.exists("PH Kassenbeleg", {"storno_von": beleg, "docstatus": 1}):
        frappe.throw(_("Beleg ist bereits storniert."))
    if ist_gesperrt(alt.kasse, _heute()):
        frappe.throw(_("Kasse ist heute abgeschlossen."))
    from ph_kassa.logik import regeln

    tag = getdate(alt.get("geschaeftstag") or alt.get("datum_uhrzeit"))
    noetig = regeln.storno_freigabe({"bediener": alt.get("bediener"), "datum": tag, "gesamt_cent": alt.get("gesamt_cent")}, frappe.session.user, _heute(), leitung, einstellungen()["storno_mitarbeiter_bis_cent"])
    freigabe_von = dienste.freigabe_pruefen(freigabe, [regeln.FREIGABE_TEXTE[c] for c in noetig]) if noetig else None
    doc = schnittstellen.storniere_beleg(beleg, grund, bediener=frappe.session.user, erlaube_mitarbeiter=not noetig, freigabe_von=freigabe_von)
    kundenkarte = _kundenkarte_zuruecknehmen(beleg, grund)
    einst = einstellungen()
    ergebnis = {"beleg": doc.name, "belegnummer": doc.get("belegnummer"), "freigabe_von": freigabe_von, "erstattungen": doc.flags.get("ph_refunds") or [], "klaerfaelle": doc.flags.get("ph_klaerfaelle") or [], "faktura": doc.flags.get("ph_faktura"),
                "rueckzahlung": [{"zahlart": z.zahlart, "betrag_cent": -int(z.betrag_cent or 0)} for z in doc.zahlarten]}
    if kundenkarte:
        ergebnis["kundenkarte"] = kundenkarte
    bar = any(z.zahlart == "Bar" for z in doc.zahlarten)
    if einst["automatisch_drucken"] or bar:
        try:
            ergebnis["druck"] = druckauftrag(doc, schublade=bar)
        except frappe.ValidationError as e:
            ergebnis["druck"] = {"modus": "fehler", "fehler": str(e)}
    return ergebnis


def _kundenkarte_zuruecknehmen(beleg, grund):
    """Einlösungen der Kundenkarte mit Bezug auf den stornierten Beleg zurücknehmen (ph_kundenkarte.kassa, idempotent:
    nur Status „Eingeloest“; der doc_event der Kundenkarte am Stornobeleg darf vorher gelaufen sein)."""
    if not frappe.db.exists("DocType", "PH Kundenkarte Einloesung"):
        return None
    if not frappe.db.exists("PH Kundenkarte Einloesung", {"bezug_doctype": "PH Kassenbeleg", "bezug": beleg, "status": "Eingeloest"}):
        return None
    try:
        from ph_core.api import ApiFehler
        from ph_kundenkarte.ph_kundenkarte.kassa import einloesung_zuruecknehmen
    except ImportError:
        return None
    try:
        return einloesung_zuruecknehmen(bezug_doctype="PH Kassenbeleg", bezug=beleg, grund=_("Kassenstorno: {0}").format(grund)[:140])
    except ApiFehler as e:
        return {"storniert": [], "fehler": [karten_fehler(e.code, e.meldung, None, e.http_status)]}


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


def _abschluss_datum(datum):
    """Heute für alle; frühere Tage (Abschluss nachholen) nur Leitung."""
    tag = getdate(datum) if datum else _heute()
    if tag > _heute():
        frappe.throw(_("Abschluss für zukünftige Tage ist nicht möglich."))
    if tag < _heute():
        _rollen(leitung=True)
    return tag


@frappe.whitelist()
def abschluss_laden(kasse, datum=None):
    _rollen()
    return oeffnen_oder_holen(kasse, _abschluss_datum(datum)).zusammenfassung()


@frappe.whitelist()
def abschluss_zaehlen(kasse, zaehlprotokoll, bargeld_anfang_cent=None, unterschrift=None, unterschrift_name=None, datum=None, anfang_grund=None, chf_ist_cent=None):
    _rollen()
    doc = oeffnen_oder_holen(kasse, _abschluss_datum(datum))
    return doc.zaehlen(zaehlprotokoll=_json(zaehlprotokoll), bargeld_anfang_cent=bargeld_anfang_cent, unterschrift=unterschrift, unterschrift_name=unterschrift_name, anfang_grund=anfang_grund, chf_ist_cent=chf_ist_cent)


@frappe.whitelist()
def abschluss_abschliessen(kasse, differenz_grund=None, unterschrift=None, unterschrift_name=None, datum=None, tresor_entnahme_cent=None):
    """Abschließen (Leitung). tresor_entnahme_cent: vorher Entnahme in den Tresor/Bank buchen (Fachkritik 21 P-G)."""
    _rollen(leitung=True)
    tag = _abschluss_datum(datum)
    if int(tresor_entnahme_cent or 0) > 0:
        kassenbuch_buchen_fn(kasse, "Entnahme", int(tresor_entnahme_cent), _("Entnahme Tresor/Bank beim Tagesabschluss"), quelle="kassa", idempotency_key=f"tresor:{kasse}:{tag}")
    doc = oeffnen_oder_holen(kasse, tag)
    z = doc.abschliessen(differenz_grund=differenz_grund, unterschrift=unterschrift, unterschrift_name=unterschrift_name)
    z["pdf_url"] = f"/api/method/frappe.utils.print_format.download_pdf?doctype=PH%20Kassenabschluss&name={frappe.utils.quote(doc.name)}&format={frappe.utils.quote('PH Kassenabschluss Protokoll')}&no_letterhead=1"
    return z


@frappe.whitelist()
def kassensturz(kasse, zaehlprotokoll=None, chf_ist_cent=None):
    """Kassensturz jederzeit (BAO § 131): Soll-Bestand laut Kassenbuch (enthält alle Bar-Belege) gegen Zählung –
    ohne Abschluss; mit Zählung wird ein Ereignis „Kassensturz“ protokolliert."""
    _rollen()
    from ph_kassa.logik.abschluss import zaehlprotokoll_summe
    from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import letzter_bestand as bestand

    soll = bestand(kasse)
    soll_chf = bestand(kasse, "CHF")
    out = {"soll_cent": soll, "chf_soll_cent": soll_chf, "zeitpunkt": str(now_datetime())}
    if zaehlprotokoll:
        try:
            ist = zaehlprotokoll_summe(_json(zaehlprotokoll))
        except KassenFehler as e:
            frappe.throw(str(e))
        out.update(ist_cent=ist, differenz_cent=ist - soll)
        if chf_ist_cent not in (None, ""):
            out.update(chf_ist_cent=int(chf_ist_cent), chf_differenz_cent=int(chf_ist_cent) - soll_chf)
        from ph_kassa.rksv.buchung import _ereignis

        _ereignis(kasse, "Kassensturz", notiz=_("Kassensturz durch {0}: Soll {1} ct, Ist {2} ct, Differenz {3} ct").format(frappe.session.user, soll, ist, ist - soll), status="Erledigt", automatisch=False)
    return out


@frappe.whitelist()
def lade_oeffnen(kasse, grund):
    """Kassenlade ohne Verkauf öffnen (Wechselgeld) – protokolliert als Ereignis (UX-Kritik 20 Z7)."""
    _rollen()
    if not (grund or "").strip():
        frappe.throw(_("Grund angeben (z. B. Wechselgeld)."))
    from ph_kassa.druck.drucker import schublade_auftrag
    from ph_kassa.rksv.buchung import _ereignis

    _ereignis(kasse, "Lade geoeffnet", notiz=_("{0}: {1}").format(frappe.session.user, grund), status="Erledigt", automatisch=False)
    return schublade_auftrag(kasse)


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
    dienste.vorgang_merken(st["payment_intent"], kasse=kasse, terminal=terminal, betrag_cent=int(betrag_cent), stripe_status=st["status"], status="Gestartet")
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
    dienste.vorgang_status(payment_intent, st["status"])
    # Zeitüberschreitung (UX-Kritik 20 Z2/E3): Hinweis nach terminal_warnung_s, Abbruch nach terminal_timeout_s
    if not st.get("fertig"):
        from ph_kassa.terminal import zeitueberschreitung

        einst = einstellungen()
        zustand = zeitueberschreitung(dienste.vorgang_alter(payment_intent), now_datetime(), einst["terminal_warnung_s"], einst["terminal_timeout_s"])
        st["zeit"] = zustand
        if zustand == "abbruch":
            try:
                st = dienst(erzwinge_mock=_mock_terminal()).abbrechen(payment_intent, terminal)
                st["zeit"] = "abgebrochen"
                dienste.vorgang_merken(payment_intent, status="Zeitueberschreitung", beendet_am=now_datetime(), stripe_status=st["status"])
            except TerminalFehler as e:  # z. B. in letzter Sekunde bezahlt
                st["zeit_hinweis"] = e.meldung
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
    dienste.vorgang_merken(payment_intent, status="Abgebrochen", beendet_am=now_datetime(), stripe_status=st["status"])
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


# ── Neue Endpunkte (50-backend-luecken-kassa-faktura.md) ─────────────────────

def _heute():
    """Geschäftstag jetzt (Tageswechsel-Uhrzeit aus den Einstellungen)."""
    from ph_kassa.logik.abschluss import geschaeftstag

    return geschaeftstag(now_datetime(), einstellungen().get("tageswechsel_uhrzeit"))


@frappe.whitelist()
def code_erkennen(code):
    """Scanner-Code → {art, wert, treffer}: Kundenkarte, Gutschein, Kassenbeleg/RKSV-QR, Auftrag, Rechnung, Bestellung, EAN, Suche."""
    _rollen()
    from ph_kassa.logik.codes import erkennen

    e = erkennen(code)
    art, wert = e["art"], e["wert"]
    try:
        if art == "ean":
            e["treffer"] = suche_produkt(wert)
        elif art == "gutschein":
            e["treffer"] = schnittstellen.gutschein_pruefen(wert)
        elif art == "kundenkarte":
            from ph_core.api import ApiFehler
            from ph_kundenkarte.ph_kundenkarte.kassa import karte_pruefen

            try:
                e["treffer"] = karte_pruefen(wert)
                if e["treffer"].get("code") not in (None, "ok"):
                    e["code"] = e["treffer"]["code"]
            except ApiFehler as ex:
                e["treffer"] = None
                e.update(code=ex.code, fehler=karten_fehler(ex.code, ex.meldung, None, ex.http_status)["meldung"])
        elif art in ("kassenbeleg", "rksv_qr"):
            name = wert if art == "kassenbeleg" else frappe.db.get_value("PH Kassenbeleg", {"maschinenlesbarer_code": wert}, "name")
            e["treffer"] = frappe.db.get_value("PH Kassenbeleg", name, ["name", "belegnummer", "belegart", "gesamt_cent", "datum_uhrzeit", "kontakt"], as_dict=True) if name else None
        elif art == "auftrag":
            e["treffer"] = _auftraege(None, wert)
        elif art == "rechnung":
            e["treffer"] = frappe.db.get_value("PH Rechnung", {"name": wert, "docstatus": 1}, ["name", "kontakt", "offen_cent", "art", "status"], as_dict=True) if frappe.db.exists("DocType", "PH Rechnung") else None
        elif art == "bestellung":
            e["treffer"] = frappe.db.get_value("PH Bestellung", wert, ["name", "status", "gesamt_cent", "kontakt"], as_dict=True) if frappe.db.exists("DocType", "PH Bestellung") else None
        else:
            e["treffer"] = {"produkte": suche_produkt(wert), "kunden": suche_kunde(wert)}
    except Exception as ex:  # noqa: BLE001 – Erkennung liefert trotzdem die Art
        e["treffer"] = None
        e["fehler"] = str(ex)[:160]
    return e


@frappe.whitelist()
def kundenkarte_uebergeben(kartennummer):
    """Beantragte Kundenkarte bei Übergabe an der Kassa aktivieren (ph_kundenkarte.kassa.karte_uebergeben)."""
    _rollen()
    from ph_core.api import ApiFehler

    try:
        from ph_kundenkarte.ph_kundenkarte.kassa import karte_uebergeben
    except ImportError:
        return {"kartennummer": kartennummer, "fehler": karten_fehler("unavailable", _("ph_kundenkarte nicht installiert."), None, 503)}
    try:
        return karte_uebergeben(kartennummer, ort="Kassa")
    except ApiFehler as e:
        return {"kartennummer": kartennummer, "fehler": karten_fehler(e.code, e.meldung, None, e.http_status)}


@frappe.whitelist()
def kunde_anlegen(name=None, firma=None, strasse=None, plz=None, ort=None, land="AT", uid=None, email=None, telefon=None, vorname=None, nachname=None):
    """Schnellanlage Rechnungsempfänger (§ 11 UStG ab 400 €)."""
    _rollen()
    return dienste.kunde_anlegen(name=name, vorname=vorname, nachname=nachname, firma=firma, strasse=strasse, plz=plz, ort=ort, land=land, uid=uid, email=email, telefon=telefon)


@frappe.whitelist()
def retoure_vorbereiten(beleg, auswahl=None, grund=None):
    """Rücknahme: Originalzeilen mit rücknehmbarer Menge; mit auswahl {zeile: menge} + grund fertige Retoure-Positionen
    und Vorschlag der Rückzahlungswege (Karte zuerst auf die Originalkarte, sonst Bar/Gutschein laut Einstellung)."""
    _rollen()
    from ph_kassa.logik.retoure import erstattungsweg_vorschlag, retoure_positionen

    doc, zeilen = dienste.retoure_daten(beleg)
    out = {"beleg": doc.name, "kontakt": doc.kontakt, "kunde_name": doc.kunde_name, "datum": str(doc.datum_uhrzeit), "zeilen": zeilen, "standard": einstellungen()["retoure_standard"]}
    if auswahl:
        try:
            pos = retoure_positionen(doc.name, _json(auswahl), zeilen, grund)
        except KassenFehler as e:
            frappe.throw(str(e))
        betrag = -sum(int(p["einzel_brutto_cent"]) * float(p["menge"]) for p in pos)
        out.update(positionen=pos, betrag_cent=int(round(betrag)), rueckzahlung=erstattungsweg_vorschlag([z.as_dict() for z in doc.zahlarten], int(round(betrag))))
    return out


@frappe.whitelist()
def schnelltasten(kasse=None):
    _rollen()
    if not frappe.db.exists("DocType", "PH Kassa Schnelltaste"):
        return []
    rows = frappe.get_all("PH Kassa Schnelltaste", filters={"aktiv": 1}, fields=["name", "titel", "aktion", "produkt", "bezeichnung", "betrag_cent", "steuersatz", "farbe", "bild", "reihenfolge", "kasse"], order_by="reihenfolge asc, titel asc", limit=200)
    return [r for r in rows if not r.kasse or r.kasse == kasse][:60]


@frappe.whitelist()
def kassen_katalog(stand=None, limit=2000):
    """Offline-Katalog für die Next-Kassa (IndexedDB): Produkte mit Preis/Steuersatz, geändert seit `stand` (ISO)."""
    _rollen()
    if not frappe.db.exists("DocType", "PH Produkt"):
        return {"stand": str(now_datetime()), "produkte": []}
    felder = _felder("PH Produkt", ["name", "titel", "marke", "ean", "hersteller_artikelnr", "aktueller_preis_cent", "preisart", "ust_klasse", "bild_hauptbild", "status", "modified"])
    filters = {"modified": (">", stand)} if stand else {}
    einst = einstellungen()
    rows = frappe.get_all("PH Produkt", filters=filters, fields=felder, order_by="modified asc", limit=int(limit))
    return {"stand": str(now_datetime()), "produkte": [{"produkt": r.name, "bezeichnung": r.get("titel") or r.name, "marke": r.get("marke"), "ean": r.get("ean"), "bild": r.get("bild_hauptbild"), "status": r.get("status"),
                                                         "einzel_brutto_cent": int(r.get("aktueller_preis_cent") or 0) if r.get("preisart") != "Auf Anfrage" else 0, "steuersatz": UST_KLASSE_STEUERSATZ.get(r.get("ust_klasse") or "", einst["standard_steuersatz"])} for r in rows]}


@frappe.whitelist()
def kassen_kunden(stand=None, limit=1000):
    """Offline-Kundencache (nur Name, Ort, Kontakt-ID – keine Telefonnummern/E-Mails, Datenminimierung)."""
    _rollen()
    if not frappe.db.exists("DocType", "PH Kontakt"):
        return {"stand": str(now_datetime()), "kunden": []}
    filters = {"modified": (">", stand)} if stand else {}
    felder = _felder("PH Kontakt", ["name", "titel", "ort", "status", "anonymisiert_am"])
    rows = frappe.get_all("PH Kontakt", filters=filters, fields=felder, order_by="modified asc", limit=int(limit))
    return {"stand": str(now_datetime()), "kunden": [{"kontakt": r.name, "titel": r.get("titel"), "ort": r.get("ort")} for r in rows if not r.get("anonymisiert_am")]}


@frappe.whitelist(methods=["POST"])
def notbelege_einspielen(kasse, belege, geraet_token=None):
    """Nacherfassung von Notbelegen nach Kassenausfall (RKSV § 17) – je Notbeleg ein eigener signierter Beleg."""
    _rollen()
    return dienste.notbelege_einspielen(kasse, _json(belege), geraet_token=geraet_token)


@frappe.whitelist()
def leitung_freigabe_pruefen(email, pin, geraet_token=None):
    """PIN der Leitung vorab prüfen (Oberfläche zeigt Ergebnis, bevor gebucht wird). Bucht nichts."""
    _rollen()
    return {"freigabe_von": dienste.freigabe_pruefen({"email": email, "pin": pin, "geraet_token": geraet_token}, ["Vorabprüfung"])}


@frappe.whitelist()
def zahlungsplan(auftrag):
    """Raten eines Auftrags für die Anzahlungs-Kachel (Konzept §9.1 Lücke „zahlungsplan_position“)."""
    _rollen()
    return _zahlungsplan(auftrag)
