"""Umsatz- und Stufenberechnung je Kundenkarte (nur zur Einstufung – kein Guthaben).

Quellen (nur, was installiert ist; frappe.db.exists("DocType", …)):
  PH Kassenbeleg  docstatus 1, kontakt = Karteninhaber, belegart Standard/Stornobeleg, kein Training,
                  ohne Rechnungsbezug (eine über die Kassa bezahlte Rechnung zählt als Rechnung)
  PH Bestellung   kontakt = Karteninhaber, Zahlung online, Status bezahlt oder später (versendet, abgeholt …),
                  Betrag gesamt_cent − erstattet_cent (Vor-Ort-Zahlungen zählen über den Kassenbeleg)
  PH Rechnung     docstatus 1, kontakt = Karteninhaber, nicht Storniert/Uneinbringlich, ohne Bestellbezug
                  (Shop-Rechnungen zählen über die Bestellung)
Stornos erscheinen als negative Beträge (Stornobeleg) bzw. durch Statuswechsel und werden mitgerechnet.

Ohne Einwilligung zur Auswertung (PH Kundenkarte.einwilligung_auswertung) wird nichts berechnet.
Reine Regeln in ph_kundenkarte/utils/stufen.py (ohne Frappe, unittest).
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate, now_datetime, nowdate

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.utils import stufen as st
from ph_kundenkarte.utils import vorteile as vt

BESTELLUNG_BEZAHLT = ("bezahlt", "versandbereit", "versendet", "reserviert", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")
RECHNUNG_AUSGESCHLOSSEN = ("Entwurf", "Storniert", "Uneinbringlich")


def belege_zu_kontakt(kontakt):
    """Alle umsatzrelevanten Belege eines Kontakts als [{datum, betrag_cent, doctype, name}]."""
    belege = []
    if frappe.db.exists("DocType", "PH Kassenbeleg"):
        for b in frappe.get_all(
            "PH Kassenbeleg",
            filters={"kontakt": kontakt, "docstatus": 1, "belegart": ("in", ["Standard", "Stornobeleg"]), "trainings": 0, "rechnung": ("is", "not set")},
            fields=["name", "datum_uhrzeit", "gesamt_cent"],
        ):
            belege.append({"datum": getdate(b.datum_uhrzeit), "betrag_cent": cint(b.gesamt_cent), "doctype": "PH Kassenbeleg", "name": b.name})
    if frappe.db.exists("DocType", "PH Bestellung"):
        for b in frappe.get_all(
            "PH Bestellung",
            filters={"kontakt": kontakt, "zahlung": "online", "status": ("in", list(BESTELLUNG_BEZAHLT)), "modus": "live"},
            fields=["name", "bezahlt_am", "angelegt", "gesamt_cent", "erstattet_cent"],
        ):
            belege.append({"datum": getdate(b.bezahlt_am or b.angelegt), "betrag_cent": cint(b.gesamt_cent) - cint(b.erstattet_cent), "doctype": "PH Bestellung", "name": b.name})
    if frappe.db.exists("DocType", "PH Rechnung"):
        for b in frappe.get_all(
            "PH Rechnung",
            filters={"kontakt": kontakt, "docstatus": 1, "status": ("not in", list(RECHNUNG_AUSGESCHLOSSEN)), "bestellung": ("is", "not set")},
            fields=["name", "datum", "brutto_cent"],
        ):
            belege.append({"datum": getdate(b.datum), "betrag_cent": cint(b.brutto_cent), "doctype": "PH Rechnung", "name": b.name})
    return belege


def karte_neu_berechnen(karte, automatisch=True):
    """Umsatzfelder und Stufe einer Karte aktualisieren. Rückgabe: dict mit Werten (auch wenn nichts berechnet wurde)."""
    k = frappe.db.get_value("PH Kundenkarte", karte, ["kontakt", "status", "stufe", "stufe_seit", "stufe_manuell", "einwilligung_auswertung"], as_dict=True)
    if not k:
        return {}
    einst = einstellungen()
    heute = getdate(nowdate())
    ergebnis = {"karte": karte, "berechnet": False, "stufe": k.stufe, "jahresumsatz_cent": 0, "gesamtumsatz_cent": 0}
    if not cint(k.einwilligung_auswertung):
        return ergebnis
    belege = belege_zu_kontakt(k.kontakt)
    von = st.zeitraum_beginn(heute, einst["bewertungszeitraum_monate"])
    jahres = st.summe_im_zeitraum(belege, von=von, bis=heute)
    gesamt = st.summe_im_zeitraum(belege)
    letzter = st.letzter_einkauf(belege)
    werte = {"jahresumsatz_cent": jahres, "gesamtumsatz_cent": gesamt, "letzter_einkauf": letzter, "umsatz_berechnet_am": now_datetime()}
    neue_stufe = k.stufe
    if not cint(k.stufe_manuell) and k.status in ("Aktiv", "Gesperrt"):
        stufen = stufen_liste()
        ziel = st.zielstufe(stufen, k.stufe, jahres, getdate(k.stufe_seit) if k.stufe_seit else None, heute, einst["bewertungszeitraum_monate"], bool(cint(einst["herabstufung_erlaubt"])))
        if ziel and ziel != k.stufe:
            werte.update({"stufe": ziel, "stufe_seit": heute})
            neue_stufe = ziel
    frappe.db.set_value("PH Kundenkarte", karte, werte, update_modified=False)
    if neue_stufe != k.stufe:
        protokoll(karte, "Stufenwechsel", alt=k.stufe, neu=neue_stufe, jahresumsatz_cent=jahres, automatisch=automatisch, hinweis=_("Umsatz im Bewertungszeitraum: {0} Cent").format(jahres))
        _kontakt_stufe_spiegeln(k.kontakt, neue_stufe)
        _titel_aktualisieren(karte)
    if not automatisch:
        protokoll(karte, "Umsatz berechnet", jahresumsatz_cent=jahres, hinweis=_("{0} Belege").format(len(belege)))
    ergebnis.update({"berechnet": True, "stufe": neue_stufe, "jahresumsatz_cent": jahres, "gesamtumsatz_cent": gesamt, "letzter_einkauf": str(letzter) if letzter else None, "belege": len(belege)})
    return ergebnis


def _kontakt_stufe_spiegeln(kontakt, stufe):
    try:
        if frappe.db.exists("DocType", "PH Kontakt") and frappe.get_meta("PH Kontakt").has_field("ph_kundenkarte_stufe"):
            frappe.db.set_value("PH Kontakt", kontakt, "ph_kundenkarte_stufe", stufe, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_kundenkarte: Stufe am Kontakt")


def _titel_aktualisieren(karte):
    k = frappe.db.get_value("PH Kundenkarte", karte, ["kunde_name", "kontakt", "stufe", "kartennummer"], as_dict=True)
    if k:
        frappe.db.set_value("PH Kundenkarte", karte, "titel", f"{k.kunde_name or k.kontakt} · {k.stufe or ''} · {k.kartennummer}"[:140], update_modified=False)


def karte_zu_kontakt_neu_berechnen(kontakt, automatisch=True):
    """Für doc_events: Karte des Kontakts finden und neu berechnen (ohne Karte: nichts)."""
    if not kontakt:
        return None
    karte = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt"])}, "name")
    if karte:
        return karte_neu_berechnen(karte, automatisch=automatisch)
    return None


def karten_uebersicht(karte):
    """Stufe, nächste Stufe, zustehende Vorteile mit Restkontingent, Einlösungen – für Desk-Dashboard und Portal."""
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einloesung.ph_kundenkarte_einloesung import anzahl_im_jahr

    k = frappe.get_doc("PH Kundenkarte", karte)
    stufen = stufen_liste()
    einst = einstellungen()
    zuordnung = vt.vorteile_fuer_stufe(stufen_vorteile(), stufen, k.stufe)
    jahr = getdate(nowdate()).year
    vorteile = []
    for z in sorted(zuordnung, key=lambda z: (z.get("reihenfolge", 0), z.get("titel") or "")):
        genutzt = anzahl_im_jahr(karte, z["vorteil"], jahr)  # über die Kartenkette (Ersatz/Übertragung)
        rest = vt.verbleibend(z.get("einloesbar_pro_jahr"), genutzt)
        vorteile.append(
            {
                "vorteil": z["vorteil"],
                "titel": z.get("titel"),
                "art": z.get("art"),
                "beschreibung": z.get("beschreibung_kunde") or "",
                "hinweis": z.get("hinweis") or "",
                "einloesbar_pro_jahr": int(z.get("einloesbar_pro_jahr") or 0),
                "genutzt_im_jahr": genutzt,
                "verbleibend": rest,
                "verfuegbar": k.status == "Aktiv" and (rest is None or rest > 0),
            }
        )
    einloesungen = frappe.get_all("PH Kundenkarte Einloesung", filters={"kundenkarte": karte}, fields=["name", "vorteil", "vorteil_titel", "eingeloest_am", "status", "ort", "bezug_doctype", "bezug"], order_by="eingeloest_am desc", limit=50)
    naechste = st.naechste_stufe(stufen, k.stufe)
    stufe_info = next((s for s in stufen if s["name"] == k.stufe), None)
    return {
        "kartennummer": k.kartennummer,
        "status": k.status,
        "name_auf_karte": k.kunde_name,
        "stufe": k.stufe,
        "stufe_farbe": (stufe_info or {}).get("farbe"),
        "stufe_text": (stufe_info or {}).get("beschreibung_kunde") or "",
        "stufe_seit": str(k.stufe_seit) if k.stufe_seit else None,
        "ausgestellt_am": str(k.ausgestellt_am) if k.ausgestellt_am else None,
        "einwilligung_auswertung": bool(k.einwilligung_auswertung),
        "bewertungszeitraum_monate": int(einst["bewertungszeitraum_monate"]),
        "jahresumsatz_cent": int(k.jahresumsatz_cent or 0) if k.einwilligung_auswertung else None,
        "naechste_stufe": naechste["name"] if naechste else None,
        "fehlt_noch_cent": st.fehlt_noch_cent(stufen, k.stufe, k.jahresumsatz_cent) if (naechste and k.einwilligung_auswertung) else None,
        "vorteile": vorteile,
        "einloesungen": [{"referenz": e.name, "vorteil": e.vorteil, "titel": e.vorteil_titel, "am": str(e.eingeloest_am), "status": e.status, "ort": e.ort, "bezug_doctype": e.bezug_doctype, "bezug": e.bezug} for e in einloesungen],
        "wallet_pass_aktualisiert": str(k.wallet_pass_aktualisiert) if k.wallet_pass_aktualisiert else None,
    }
