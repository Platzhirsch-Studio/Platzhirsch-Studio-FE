"""Kassa/Packtisch-Logik der Kundenkarte OHNE ph_api-Decorator – für direkte Python-Aufrufe aus ph_kassa/ph_logistik
im selben Request (z. B. in page.beleg_buchen nach dem Buchen).

Unterschied zu den HTTP-Methoden in ph_kundenkarte.api (lookup_card, redeem_benefit, cancel_redemption, hand_over_card):
diese Funktionen committen NICHT, rollen NICHT zurück und schreiben nichts in frappe.local.response – die Transaktion
gehört dem Aufrufer. Fehler kommen als ph_core.api.ApiFehler (Attribute .code, .http_status, .meldung, .daten);
der Aufrufer fängt sie ab und zeigt z. B. „Pflegetermin: Limit erreicht – nicht eingelöst“ (Beleg bleibt gültig).

Rechte: Rolle aus KASSA_ROLLEN (PH Kassa Mitarbeiter/Leitung, PH Logistik Mitarbeiter/Leitung, PH Kundenkarte
Mitarbeiter/Leitung, System Manager, Administrator). Schreibzugriffe laufen mit ignore_permissions nach dieser Prüfung.

  karte_pruefen(kartennummer) → {kartennummer, status, code, hinweis, weitergeleitet_von, name, stufe, stufe_farbe, stufe_seit, vorteile[]}
  einloesen(kartennummer, vorteil, bezug_doctype=None, bezug=None, kommentar=None, ort="Kassa")
      → {referenz, vorteil, titel, verbleibend, bereits_eingeloest, kartennummer, weitergeleitet_von}
  einloesung_zuruecknehmen(referenz=None, bezug_doctype=None, bezug=None, grund=None) → {storniert: [namen]}
  karte_uebergeben(kartennummer, ort="Kassa") → {kartennummer, status}
"""

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_core.api import ApiFehler, pflicht, text
from ph_kundenkarte.utils.karte import kartennummer_gueltig, normalisiere_kartennummer
from ph_kundenkarte.utils.kartenregeln import kassa_bewertung

# Packtisch (Logistik) scannt Karten bei Bestellungen (Konzept §7.3/§9.2)
KASSA_ROLLEN = ("PH Kassa Mitarbeiter", "PH Kundenkarte Mitarbeiter", "PH Kundenkarte Leitung", "PH Kassa Leitung", "PH Logistik Mitarbeiter", "PH Logistik Leitung")
ORTE = ("Kassa", "Packtisch", "Showroom", "Service", "Event", "Backoffice")


def kassa_rolle_pruefen():
    rollen = set(frappe.get_roles())
    if frappe.session.user != "Administrator" and not (rollen & set(KASSA_ROLLEN)) and "System Manager" not in rollen:
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung für Kartenabfragen."))


def karte_laden(kartennummer):
    nr = normalisiere_kartennummer(kartennummer)
    if not kartennummer_gueltig(nr):
        raise ApiFehler("invalid", 400, _("Kartennummer hat nicht das Format KK-XXXXXX."), {"field": "kartennummer"})
    if not frappe.db.exists("PH Kundenkarte", nr):
        raise ApiFehler("not_found", 404, _("Karte unbekannt."))
    return nr


def karte_fuer_kassa(kartennummer):
    """Normalisieren, laden, Dublette auf Hauptkarte leiten. → (nr, weitergeleitet_von, code, hinweis)."""
    from ph_kundenkarte.ph_kundenkarte.kette import hauptkarte

    nr = karte_laden(kartennummer)
    k = frappe.db.get_value("PH Kundenkarte", nr, ["status", "sperrgrund_art", "zusammengefuehrt_in"], as_dict=True)
    code, weiter, hinweis = kassa_bewertung(k.status, k.sperrgrund_art, k.zusammengefuehrt_in)
    if code == "card_merged" and weiter:
        ziel = hauptkarte(nr)
        z = frappe.db.get_value("PH Kundenkarte", ziel, ["status", "sperrgrund_art", "zusammengefuehrt_in"], as_dict=True)
        code2, _w, hinweis2 = kassa_bewertung(z.status, z.sperrgrund_art, z.zusammengefuehrt_in)
        return ziel, nr, code2, hinweis2 or hinweis
    return nr, None, code, hinweis


def karte_pruefen(kartennummer):
    """Name, Status, Stufe, verfügbare Vorteile – keine Kontaktdaten, kein Umsatz. Gesperrt/ersetzt/beantragt: vorteile=[]."""
    kassa_rolle_pruefen()
    pflicht({"kartennummer": kartennummer}, "kartennummer")
    nr, weitergeleitet_von, code, hinweis = karte_fuer_kassa(kartennummer)
    from ph_kundenkarte.ph_kundenkarte import umsatz

    u = umsatz.karten_uebersicht(nr)
    return {
        "kartennummer": u["kartennummer"],
        "status": u["status"],
        "code": code,
        "hinweis": hinweis or None,
        "weitergeleitet_von": weitergeleitet_von,
        "name": u["name_auf_karte"],
        "stufe": u["stufe"],
        "stufe_farbe": u["stufe_farbe"],
        "stufe_seit": u["stufe_seit"],
        "vorteile": [{k: v[k] for k in ("vorteil", "titel", "art", "hinweis", "einloesbar_pro_jahr", "genutzt_im_jahr", "verbleibend", "verfuegbar")} for v in u["vorteile"]] if code == "ok" else [],
    }


def _verbleibend(nr, vorteil):
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einloesung.ph_kundenkarte_einloesung import anzahl_im_jahr
    from ph_kundenkarte.utils.vorteile import verbleibend

    limit = frappe.db.get_value("PH Kundenkarte Vorteil", vorteil, "einloesbar_pro_jahr")
    return verbleibend(limit, anzahl_im_jahr(nr, vorteil, now_datetime().year))


def einloesen(kartennummer, vorteil, bezug_doctype=None, bezug=None, kommentar=None, ort="Kassa"):
    """Vorteil einlösen. Idempotent je Kartenkette + Vorteil + Bezug (Wiederholung liefert dieselbe Einlösung).
    ApiFehler 409: card_pending | card_blocked | card_replaced | card_transferred | card_cancelled | benefit_inactive |
    tier_too_low | benefit_not_in_tier | limit_reached; 404 not_found; 400 invalid."""
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einloesung.ph_kundenkarte_einloesung import BEZUG_ERLAUBT, MELDUNG, pruefung
    from ph_kundenkarte.ph_kundenkarte.kette import karten_kette

    kassa_rolle_pruefen()
    pflicht({"kartennummer": kartennummer, "vorteil": vorteil}, "kartennummer", "vorteil")
    nr, weitergeleitet_von, kassa_code, hinweis = karte_fuer_kassa(kartennummer)
    if not frappe.db.exists("PH Kundenkarte Vorteil", vorteil):
        raise ApiFehler("not_found", 404, _("Vorteil unbekannt."))
    if bezug_doctype and bezug_doctype not in BEZUG_ERLAUBT:
        raise ApiFehler("invalid", 400, _("Bezugstyp nicht erlaubt."), {"field": "bezug_doctype"})
    if kassa_code != "ok":
        raise ApiFehler(kassa_code, 409, hinweis or str(MELDUNG.get("card_inactive")))
    bezug = text(bezug, 140) or None
    if bezug_doctype and bezug:
        vorhanden = frappe.db.get_value("PH Kundenkarte Einloesung", {"kundenkarte": ("in", karten_kette(nr)), "vorteil": vorteil, "bezug_doctype": bezug_doctype, "bezug": bezug, "status": "Eingeloest"}, ["name", "vorteil_titel"], as_dict=True)
        if vorhanden:
            return {"referenz": vorhanden.name, "vorteil": vorteil, "titel": vorhanden.vorteil_titel, "verbleibend": _verbleibend(nr, vorteil), "bereits_eingeloest": True, "kartennummer": nr, "weitergeleitet_von": weitergeleitet_von}
    ok, code = pruefung(nr, vorteil)
    if not ok:
        raise ApiFehler(code, 409, str(MELDUNG.get(code, code)))
    doc = frappe.get_doc(
        {
            "doctype": "PH Kundenkarte Einloesung",
            "kundenkarte": nr,
            "vorteil": vorteil,
            "bezug_doctype": bezug_doctype or None,
            "bezug": bezug,
            "kommentar": text(kommentar, 500),
            "ort": ort if ort in ORTE else "Kassa",
            "quelle": "api" if frappe.session.user == "website@platzhirsch.studio" else "kassa",
        }
    )
    doc.flags.ignore_permissions = True
    try:
        doc.insert()
    except frappe.ValidationError as e:  # z. B. Bezug existiert nicht
        raise ApiFehler("invalid", 400, str(e)[:300]) from None
    return {"referenz": doc.name, "vorteil": vorteil, "titel": doc.vorteil_titel, "verbleibend": _verbleibend(nr, vorteil), "bereits_eingeloest": False, "kartennummer": nr, "weitergeleitet_von": weitergeleitet_von}


def einloesung_zuruecknehmen(referenz=None, bezug_doctype=None, bezug=None, grund=None):
    """Einlösung(en) stornieren – {referenz} oder alle eines Belegs. Leitung oder einlösende Person am selben Tag.
    Kassen-Stornobeleg braucht diesen Aufruf nicht (doc_events storniert automatisch)."""
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einloesung.ph_kundenkarte_einloesung import BEZUG_ERLAUBT
    from ph_kundenkarte.ph_kundenkarte.lebenszyklus import einloesung_stornieren

    kassa_rolle_pruefen()
    if referenz:
        if not frappe.db.exists("PH Kundenkarte Einloesung", referenz):
            raise ApiFehler("not_found", 404, _("Einlösung unbekannt."))
        namen = [referenz]
    else:
        pflicht({"bezug_doctype": bezug_doctype, "bezug": bezug}, "bezug_doctype", "bezug")
        if bezug_doctype not in BEZUG_ERLAUBT:
            raise ApiFehler("invalid", 400, _("Bezugstyp nicht erlaubt."), {"field": "bezug_doctype"})
        namen = frappe.get_all("PH Kundenkarte Einloesung", filters={"bezug_doctype": bezug_doctype, "bezug": text(bezug, 140), "status": "Eingeloest"}, pluck="name")
    try:
        for n in namen:
            einloesung_stornieren(n, grund=text(grund, 140) or _("an der Kassa zurückgenommen"))
    except frappe.ValidationError as e:
        raise ApiFehler("forbidden", 403, str(e)[:300]) from None
    return {"storniert": namen}


def karte_uebergeben(kartennummer, ort="Kassa"):
    """Beantragte Karte bei physischer Übergabe aktivieren (aktive Karte: idempotent)."""
    from ph_kundenkarte.ph_kundenkarte.lebenszyklus import uebergeben

    kassa_rolle_pruefen()
    pflicht({"kartennummer": kartennummer}, "kartennummer")
    nr = karte_laden(kartennummer)
    try:
        status = uebergeben(nr, ort=ort if ort in ("Kassa", "Showroom", "Packtisch", "Event") else "Kassa")
    except frappe.ValidationError as e:
        raise ApiFehler("conflict", 409, str(e)[:300]) from None
    return {"kartennummer": nr, "status": status}
