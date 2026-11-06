"""Kartenlebenszyklus mit Datenbank: Ersatzkarte, Übertragung, Zusammenführen von Dubletten, Übergabe,
Storno von Einlösungen (manuell und bei Kassen-/Bestell-/Rechnungsstorno).
Regeln ohne Frappe in utils/kartenregeln.py; Entscheidungen dort im Modulkopf und in README „Lebenszyklus“."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, now_datetime, nowdate

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll
from ph_kundenkarte.utils import kartenregeln as kr

LEITUNG = {"PH Kundenkarte Leitung", "System Manager", "PH Backoffice-Admin"}


def ist_leitung():
    return frappe.session.user == "Administrator" or bool(LEITUNG & set(frappe.get_roles()))


def leitung_pruefen(aktion):
    if not ist_leitung():
        frappe.throw(_("{0} darf nur die Leitung.").format(aktion), frappe.PermissionError)


# ── Nachfolgekarte (Ersatz, Übertragung) ─────────────────────────────────────

ERSATZ_FELDER = (
    "persoenlicher_berater", "geburtstag", "geburtstag_tag_monat", "stufe", "stufe_seit", "stufe_manuell",
    "jahresumsatz_cent", "gesamtumsatz_cent", "letzter_einkauf", "umsatz_berechnet_am", "antrag", "kanal",
    "einwilligung_auswertung", "einwilligung_am", "einwilligung_textversion", "einwilligung", "einwilligung_widerrufen_am",
    "notizen_intern",
)


def _nachfolger_anlegen(werte):
    neu = frappe.get_doc({"doctype": "PH Kundenkarte", "status": "Aktiv", "quelle": "backoffice", **werte})
    neu.flags.ignore_permissions = True
    neu.flags.stufe_automatisch = True
    neu.insert()
    return neu


def ersatzkarte_ausstellen(alt, sperrgrund_art="Verlust", grund=None):
    """Alte Karte → Ersetzt (Sperrgrund aus Katalog), neue Nummer mit allen Daten; Jahreslimits zählen über
    `vorgaenger_karte` weiter. Rückgabe: Name der neuen Karte."""
    art = alt.sperrgrund_art if alt.status == "Gesperrt" and alt.sperrgrund_art else sperrgrund_art
    ok, meldung = kr.ersatz_pruefen(alt.status, alt.sperrgrund_art)
    if not ok:
        frappe.throw(_(meldung))
    if not kr.ersatzkarte_vorgesehen(art):
        frappe.throw(_("Ersatzkarte nur bei Verlust, Diebstahl oder Beschädigung."))
    werte = {f: alt.get(f) for f in ERSATZ_FELDER}
    werte.update({"kontakt": alt.kontakt, "vorgaenger_karte": alt.name, "ausgestellt_am": nowdate()})
    jetzt = now_datetime()
    alt_status = alt.status
    alt.db_set({"status": "Ersetzt", "sperrgrund_art": art, "sperrgrund": (grund or alt.sperrgrund or "")[:140] or None, "gesperrt_am": alt.gesperrt_am or jetzt, "beendet_am": jetzt})
    alt._kontakt_spiegeln()
    neu = _nachfolger_anlegen(werte)
    alt.db_set("nachfolger_karte", neu.name, update_modified=False)
    protokoll(alt.name, "Ersatzkarte", alt=alt_status, neu="Ersetzt", hinweis=_("{0} – Ersatzkarte {1}").format(_(art), neu.name))
    protokoll(neu.name, "Ersatzkarte", alt=alt.name, neu=neu.name, hinweis=_("Ersatz für {0} ({1})").format(alt.name, _(art)))
    return neu.name


def uebertragen(alt, ziel_kontakt, grund_art, grund=None, einwilligung_auswertung=0, einwilligung_textversion=None):
    """Karte auf anderen Kontakt übertragen (Leitung): neue Nummer für die neue Person (Karte ist personengebunden,
    Plastik/Wallet der bisherigen Person bleiben im Umlauf). Stufe bleibt; `stufe_seit` = heute, damit eine
    Herabstufung frühestens nach einem vollen Bewertungszeitraum greift. Einwilligung zur Auswertung wird NICHT
    übernommen (personenbezogen) – nur, wenn die neue Person sie hier erklärt. Umsätze werden nicht übertragen."""
    leitung_pruefen(_("Karte übertragen"))
    ziel_hat = frappe.db.exists("PH Kundenkarte", {"kontakt": ziel_kontakt, "status": ("in", list(kr.OFFENE_STATUS))})
    ok, meldung = kr.uebertragung_pruefen(alt.status, alt.sperrgrund_art, alt.kontakt, ziel_kontakt, bool(ziel_hat), grund_art, grund)
    if not ok:
        frappe.throw(_(meldung))
    if not frappe.db.exists("PH Kontakt", ziel_kontakt):
        frappe.throw(_("Kontakt {0} existiert nicht.").format(ziel_kontakt))
    werte = {
        "kontakt": ziel_kontakt,
        "stufe": alt.stufe,
        "stufe_seit": nowdate(),
        "stufe_manuell": alt.stufe_manuell,
        "vorgaenger_karte": alt.name,
        "uebertragung_grund": grund_art,
        "kanal": alt.kanal,
        "ausgestellt_am": nowdate(),
        "einwilligung_auswertung": 1 if cint(einwilligung_auswertung) else 0,
        "einwilligung_am": now_datetime() if cint(einwilligung_auswertung) else None,
        "einwilligung_textversion": einwilligung_textversion if cint(einwilligung_auswertung) else None,
    }
    jetzt = now_datetime()
    alt_status = alt.status
    alt.db_set({"status": "Uebertragen", "uebertragung_grund": grund_art, "beendet_am": jetzt})
    alt._kontakt_spiegeln()
    neu = _nachfolger_anlegen(werte)
    alt.db_set("nachfolger_karte", neu.name, update_modified=False)
    text = _("{0}: {1} → {2}{3}").format(_(grund_art), alt.kontakt, ziel_kontakt, f" – {grund}" if grund else "")
    protokoll(alt.name, "Uebertragung", alt=alt_status, neu="Uebertragen", hinweis=text + _(" · neue Karte {0}").format(neu.name))
    protokoll(neu.name, "Uebertragung", alt=alt.name, neu=neu.name, hinweis=text)
    return neu.name


# ── Zusammenführen ───────────────────────────────────────────────────────────

PLAN_FELDER = (
    "name", "status", "stufe", "stufe_seit", "stufe_manuell", "ausgestellt_am", "persoenlicher_berater", "geburtstag",
    "geburtstag_tag_monat", "einwilligung_auswertung", "einwilligung_am", "einwilligung_widerrufen_am",
    "einwilligung_textversion", "sperrgrund_art", "kontakt",
)


def _stufen_rang():
    return {s.name: cint(s.reihenfolge) for s in frappe.get_all("PH Kundenkarte Stufe", fields=["name", "reihenfolge"])}


def zusammenfuehren(karten, nur_plan=False):
    """Offene Karten einer Person zusammenführen. karten: Liste von Namen (≥ 2).
    Zielkarte nach kartenregeln.ziel_waehlen; Einlösungen werden umgehängt (`umgehaengt_von`), Ereignisse bleiben an
    der Quelle (Protokoll), Quelle → Zusammengefuehrt mit `zusammengefuehrt_in`. → Plan (+ ausgeführt)."""
    daten = frappe.get_all("PH Kundenkarte", filters={"name": ("in", list(karten))}, fields=list(PLAN_FELDER))
    plan = kr.zusammenfuehren_plan([dict(d) for d in daten], _stufen_rang())
    if not plan:
        return {"ziel": None, "quellen": [], "werte": {}, "warnungen": [_("Nichts zusammenzuführen (weniger als zwei offene Karten).")], "ausgefuehrt": False}
    if nur_plan:
        return {**plan, "ausgefuehrt": False}
    ziel = frappe.get_doc("PH Kundenkarte", plan["ziel"])
    alt_stufe = ziel.stufe
    jetzt = now_datetime()
    for quelle in plan["quellen"]:
        for e in frappe.get_all("PH Kundenkarte Einloesung", filters={"kundenkarte": quelle}, fields=["name", "umgehaengt_von"]):
            frappe.db.set_value("PH Kundenkarte Einloesung", e.name, {"kundenkarte": ziel.name, "kontakt": ziel.kontakt, "umgehaengt_von": e.umgehaengt_von or quelle}, update_modified=False)
        # frühere Zusammenführungen in die Quelle zeigen jetzt auf das Ziel
        for alt in frappe.get_all("PH Kundenkarte", filters={"zusammengefuehrt_in": quelle}, pluck="name"):
            frappe.db.set_value("PH Kundenkarte", alt, "zusammengefuehrt_in", ziel.name, update_modified=False)
        q = frappe.get_doc("PH Kundenkarte", quelle)
        q_status = q.status
        q.db_set({"status": "Zusammengefuehrt", "zusammengefuehrt_in": ziel.name, "beendet_am": jetzt})
        if q.kontakt != ziel.kontakt:
            q._kontakt_spiegeln()
        protokoll(quelle, "Zusammenfuehrung", alt=q_status, neu="Zusammengefuehrt", hinweis=_("Dublette – zusammengeführt in {0}").format(ziel.name))
    werte = dict(plan["werte"])
    if werte:
        frappe.db.set_value("PH Kundenkarte", ziel.name, werte, update_modified=True)
    hinweis = _("Übernommen aus {0}").format(", ".join(plan["quellen"]))
    if plan["warnungen"]:
        hinweis += " · " + " · ".join(plan["warnungen"])
    protokoll(ziel.name, "Zusammenfuehrung", alt=", ".join(plan["quellen"]), neu=ziel.name, hinweis=hinweis)
    if werte.get("stufe") and werte["stufe"] != alt_stufe:
        protokoll(ziel.name, "Stufenwechsel", alt=alt_stufe, neu=werte["stufe"], hinweis=_("höhere Stufe der Dublette übernommen"))
    ziel.reload()
    ziel._kontakt_spiegeln()
    try:
        from ph_kundenkarte.ph_kundenkarte import umsatz

        umsatz._titel_aktualisieren(ziel.name)
        if cint(ziel.einwilligung_auswertung):
            umsatz.karte_neu_berechnen(ziel.name, automatisch=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_kundenkarte: Neuberechnung nach Zusammenführung")
    return {**plan, "ausgefuehrt": True}


def offene_karten_des_kontakts(kontakt):
    return frappe.get_all("PH Kundenkarte", filters={"kontakt": kontakt, "status": ("in", list(kr.OFFENE_STATUS))}, pluck="name")


# ── Übergabe ─────────────────────────────────────────────────────────────────

def uebergeben(karte, ort="Kassa"):
    """Beantragte Karte bei physischer Übergabe aktivieren (Kassa/Showroom). Idempotent für aktive Karten."""
    doc = frappe.get_doc("PH Kundenkarte", karte)
    if doc.status == "Aktiv":
        if not doc.uebergeben_am:
            doc.db_set("uebergeben_am", now_datetime())
        return "Aktiv"
    if doc.status != "Beantragt":
        frappe.throw(_("Nur beantragte Karten können übergeben werden."))
    doc.db_set({"status": "Aktiv", "uebergeben_am": now_datetime(), "ausgestellt_am": nowdate(), "ausgestellt_durch": frappe.session.user})
    protokoll(doc.name, "Uebergabe", alt="Beantragt", neu="Aktiv", hinweis=_("übergeben ({0})").format(ort))
    doc._kontakt_spiegeln()
    return "Aktiv"


# ── Einlösungen stornieren ───────────────────────────────────────────────────

def einloesung_stornieren(name, grund=None, automatisch=False):
    """Storno einer Einlösung. Manuell: Leitung oder einlösende Person am selben Tag. Automatisch (Beleg storniert):
    ohne Rollenprüfung. Nachweis bleibt (Status Storniert). → Status."""
    e = frappe.get_doc("PH Kundenkarte Einloesung", name)
    if e.status == "Storniert":
        return e.status
    if not automatisch:
        eigene_heute = e.eingeloest_durch == frappe.session.user and getdate(e.eingeloest_am) == getdate(now_datetime())
        if not ist_leitung() and not eigene_heute:
            frappe.throw(_("Stornieren darf die Leitung oder die einlösende Person am selben Tag."))
    e.db_set({"status": "Storniert", "storniert_am": now_datetime(), "storniert_durch": frappe.session.user, "storno_grund": (grund or "")[:140]})
    e.add_comment("Info", _("Einlösung storniert: {0}").format(grund or "–"))
    protokoll(e.kundenkarte, "Einloesung storniert", alt=e.vorteil, hinweis=f"{e.name}: {grund or '–'}", automatisch=automatisch)
    return "Storniert"


def einloesungen_zu_bezug_stornieren(bezug_doctype, bezug, grund):
    """Beleg storniert (Kassa-Stornobeleg, Bestellung storniert/widerrufen, Rechnung storniert) → Einlösungen mit
    diesem Bezug zurück; die Leistung wurde nicht erbracht und das Jahreslimit wird wieder frei."""
    if not bezug:
        return []
    namen = frappe.get_all("PH Kundenkarte Einloesung", filters={"bezug_doctype": bezug_doctype, "bezug": bezug, "status": "Eingeloest"}, pluck="name")
    for n in namen:
        einloesung_stornieren(n, grund=grund, automatisch=True)
    return namen
