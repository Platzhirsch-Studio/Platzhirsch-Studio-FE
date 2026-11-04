"""Anbindung der Registrierkasse (ph_kassa) an Auftrag, Zahlungsplan und Rechnung – Modul ``ph_faktura.ph_faktura.kassa``.

``PH Kassenbeleg.on_submit`` (ph_kassa) ruft ``kassenbeleg_gebucht(beleg)`` nach dem Buchen der PH Zahlungen auf,
wenn der Beleg Positionen der Art Anzahlung/Teilzahlung/Schlusszahlung enthält und auf einen Auftrag
(PH Auftragsbestaetigung) oder eine Rechnung (PH Rechnung) zeigt.

Regeln (nie werfen – wird aus on_submit eines signierten Belegs gerufen, Fehler nur ins Error Log):
- Zahlungen mit Bezug PH Rechnung verbucht bereits ``ereignisse.zahlung_gebucht`` (doc_events PH Zahlung.on_submit);
  hier wird nur nachgezogen, was dort fehlt (Zahlung ohne Rechnungsbezug, aber Beleg mit ``rechnung``).
- Anzahlung an der Kassa ohne Rechnung: passende Zahlungsplan-Zeile (PH Zahlungsplan) der AB finden – zuerst über
  ``PH Kassenbeleg.zahlungsplan_position`` (Zeilenname), sonst erste offene Anzahlungs-/Teilzahlungszeile.
  Hat die Zeile eine Anzahlungsrechnung → Zahlung dort verbuchen; sonst Zeile direkt als bezahlt fortschreiben
  (bezahlt_cent, status) und AB-Stand aktualisieren.
- Idempotent: eine PH Zahlung wird je Rechnung nur einmal eingetragen (PH Rechnung Zahlung.zahlung), die
  Zahlungsplan-Zeile nur bis zur Höhe ihres Betrags fortgeschrieben; Wiederholung erkennt den Kommentar-Marker am Beleg.
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate

from ph_faktura import zahlung as zl

KASSA_ARTEN = ("Anzahlung", "Teilzahlung", "Schlusszahlung")
MARKER = "ph_faktura:kassenbeleg_gebucht"


def kassenbeleg_gebucht(beleg):
    """Kassenbeleg mit Auftrag/Rechnung verknüpfen; Rückgabe dict mit dem, was gebucht wurde (für Tests/Kommentar)."""
    ergebnis = {"beleg": beleg, "rechnung": None, "zahlungsplan": None, "zahlungen": [], "hinweise": []}
    try:
        doc = frappe.get_doc("PH Kassenbeleg", beleg)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_faktura.kassa: Kassenbeleg {beleg} nicht ladbar")
        return ergebnis
    try:
        if _bereits_verarbeitet(doc):
            ergebnis["hinweise"].append("bereits verarbeitet")
            return ergebnis
        arten = {p.art for p in (doc.get("positionen") or [])}
        if not (arten & set(KASSA_ARTEN)):
            return ergebnis
        if doc.get("belegart") == "Stornobeleg":
            ergebnis["hinweise"].append("Stornobeleg: Rückbuchung erfolgt über PH Zahlung.on_cancel/Erstattung")
            _kommentar(doc, ergebnis)
            return ergebnis
        zahlungen = _zahlungen_des_belegs(doc)
        ergebnis["zahlungen"] = [z.name for z in zahlungen]
        betrag = sum(cint(p.brutto_cent) for p in doc.positionen if p.art in KASSA_ARTEN) or cint(doc.gesamt_cent)
        datum = getdate(doc.get("datum_uhrzeit"))

        rechnung = doc.get("rechnung")
        if rechnung and frappe.db.exists("PH Rechnung", rechnung):
            ergebnis["rechnung"] = rechnung
            _auf_rechnung(rechnung, zahlungen, betrag, datum, doc)
        elif doc.get("auftrag") and frappe.db.exists("PH Auftragsbestaetigung", doc.auftrag):
            ergebnis["zahlungsplan"] = _auf_auftrag(doc, zahlungen, betrag, datum, ergebnis)
        else:
            ergebnis["hinweise"].append("weder Auftrag noch Rechnung am Beleg")
        _kommentar(doc, ergebnis)
    except Exception:  # noqa: BLE001 – darf den signierten Beleg nie betreffen
        frappe.log_error(title=f"ph_faktura.kassa: Kassenbeleg {beleg} → Faktura")
    return ergebnis


# ── Hilfen ──────────────────────────────────────────────────────────────────

def _bereits_verarbeitet(doc):
    return bool(frappe.db.exists("Comment", {"reference_doctype": "PH Kassenbeleg", "reference_name": doc.name, "comment_type": "Info", "content": ("like", f"%{MARKER}%")}))


def _kommentar(doc, ergebnis):
    teile = []
    if ergebnis.get("rechnung"):
        teile.append(_("Rechnung {0}").format(ergebnis["rechnung"]))
    if ergebnis.get("zahlungsplan"):
        teile.append(_("Zahlungsplan-Zeile {0}").format(ergebnis["zahlungsplan"]))
    teile.extend(ergebnis.get("hinweise") or [])
    try:
        doc.add_comment("Info", f"{_('Faktura verknüpft')}: {', '.join(teile) or '–'} <!-- {MARKER} -->")
    except Exception:  # noqa: BLE001
        pass


def _zahlungen_des_belegs(doc):
    """Gebuchte PH Zahlungen des Belegs (über PH Kassenbeleg Zahlung.zahlung oder Bezug)."""
    namen = [z.zahlung for z in (doc.get("zahlarten") or []) if z.get("zahlung")]
    if not namen and frappe.db.exists("DocType", "PH Zahlung"):
        namen = [r.name for r in frappe.get_all("PH Zahlung", filters={"bezug_doctype": "PH Kassenbeleg", "bezug": doc.name, "docstatus": 1, "art": "Eingang"}, fields=["name"])]
    out = []
    for n in namen:
        try:
            z = frappe.get_doc("PH Zahlung", n)
            if z.docstatus == 1 and z.art == "Eingang":
                out.append(z)
        except Exception:  # noqa: BLE001
            continue
    return out


def _auf_rechnung(rechnung, zahlungen, betrag, datum, beleg):
    """Zahlungen des Belegs in die OP-Tabelle der Rechnung (idempotent je zahlung_name)."""
    re = frappe.get_doc("PH Rechnung", rechnung)
    if re.docstatus != 1 or re.status == "Storniert":
        return
    if zahlungen:
        for z in zahlungen:
            if any(r.zahlung == z.name for r in re.zahlungen):
                continue  # ereignisse.zahlung_gebucht war schneller
            zl.zahlung_auf_rechnung(re, cint(z.betrag_cent), z.kanal or "Bar", datum, zahlung_name=z.name, hinweis=_("Kassenbeleg {0}").format(beleg.name))
            if z.meta.has_field("ph_faktura_rechnung") and not z.get("ph_faktura_rechnung"):
                z.db_set("ph_faktura_rechnung", rechnung, update_modified=False)
            re = frappe.get_doc("PH Rechnung", rechnung)
    else:
        # ph_shop nicht erreichbar → Beleg selbst als Zahlungsnachweis (Kanal Bar) eintragen
        marker = f"KB:{beleg.name}"
        if not any((r.hinweis or "") == marker for r in re.zahlungen):
            zl.zahlung_auf_rechnung(re, betrag, "Bar", datum, zahlung_name=None, hinweis=marker)


def _zahlungsplan_zeile(ab, doc, betrag):
    """Zahlungsplan-Zeile zum Beleg: explizit (zahlungsplan_position) oder erste offene passende Zeile."""
    wunsch = (doc.get("zahlungsplan_position") or "").strip()
    arten = {p.art for p in doc.positionen if p.art in KASSA_ARTEN}
    for z in ab.zahlungsplan:
        if wunsch and z.name == wunsch:
            return z
    for z in ab.zahlungsplan:
        if z.art in arten and z.status in ("Offen", "In Rechnung") and cint(z.bezahlt_cent) < cint(z.betrag_cent):
            return z
    for z in ab.zahlungsplan:
        if z.art in arten:
            return z
    return None


def _auf_auftrag(doc, zahlungen, betrag, datum, ergebnis):
    ab = frappe.get_doc("PH Auftragsbestaetigung", doc.auftrag)
    zeile = _zahlungsplan_zeile(ab, doc, betrag)
    if zeile is None:
        ergebnis["hinweise"].append(_("kein Zahlungsplan – Zahlung bleibt als Guthaben am Auftrag (PH Zahlung Bezug Kassenbeleg)"))
        _stand(ab)
        return None
    if zeile.rechnung and frappe.db.exists("PH Rechnung", {"name": zeile.rechnung, "docstatus": 1}):
        # Anzahlungsrechnung existiert: dort verbuchen, Stand ergibt sich aus der Rechnung
        ergebnis["rechnung"] = zeile.rechnung
        _auf_rechnung(zeile.rechnung, zahlungen, betrag, datum, doc)
        for z in zahlungen:
            if z.meta.has_field("ph_faktura_rechnung") and not z.get("ph_faktura_rechnung"):
                z.db_set("ph_faktura_rechnung", zeile.rechnung, update_modified=False)
    else:
        bezahlt = cint(zeile.bezahlt_cent) + betrag
        status = "Bezahlt" if bezahlt >= cint(zeile.betrag_cent) else zeile.status
        frappe.db.set_value("PH Zahlungsplan", zeile.name, {"bezahlt_cent": bezahlt, "status": status}, update_modified=False)
        ergebnis["hinweise"].append(_("Zahlungsplan {0} {1} Cent bezahlt (ohne Anzahlungsrechnung – bitte Anzahlungsrechnung erstellen, USt mit Vereinnahmung fällig)").format(zeile.art, bezahlt))
        try:
            frappe.get_doc("PH Auftragsbestaetigung", ab.name).add_comment("Info", _("Kassenbeleg {0}: {1} Cent auf Zahlungsplan {2} ({3})").format(doc.name, betrag, zeile.art, zeile.name))
        except Exception:  # noqa: BLE001
            pass
    if not doc.get("zahlungsplan_position"):
        try:
            doc.db_set("zahlungsplan_position", zeile.name, update_modified=False)
        except Exception:  # noqa: BLE001
            pass
    _stand(ab)
    return zeile.name


def _stand(ab):
    try:
        frappe.get_doc("PH Auftragsbestaetigung", ab.name).stand_aktualisieren(speichern=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_faktura.kassa: Stand {ab.name}")


def offene_anzahlung(auftrag):
    """Für die Kassa-Page: offene Anzahlungs-/Teilzahlungszeilen eines Auftrags (Betrag, Rest, Zeilenname)."""
    ab = frappe.get_doc("PH Auftragsbestaetigung", auftrag)
    out = []
    for z in ab.zahlungsplan:
        if z.art in KASSA_ARTEN:
            out.append({"zeile": z.name, "art": z.art, "betrag_cent": cint(z.betrag_cent), "bezahlt_cent": cint(z.bezahlt_cent), "offen_cent": max(cint(z.betrag_cent) - cint(z.bezahlt_cent), 0), "status": z.status, "rechnung": z.rechnung})
    return out
