"""Bestandsbuchung (Frappe): PH Lagerbewegung anlegen und PH Lagerbestand konsistent nachführen.

Einzige Stelle, die `menge`/`reserviert` einer Bestandszeile ändert. Reine Rechenregeln in bestand_logik.py.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, nowdate

from .bestand_logik import BestandsFehler, pruefe_bewegung, status_aus, verfuegbar, wirkung


def bestand_finden(produkt, lagerort, ausfuehrung=None, seriennummer=None, platz=None, anlegen=False, **extra):
    """Bestandszeile zu Produkt/Lagerort (+ Ausführung/Seriennummer). Ausstellungsstücke sind je Seriennummer eigene Zeilen."""
    filt = {"produkt": produkt, "lagerort": lagerort, "status": ("!=", "Ausgeschieden")}
    if ausfuehrung:
        filt["ausfuehrung"] = ausfuehrung
    if seriennummer:
        filt["seriennummer"] = seriennummer
    else:
        filt["ausstellungsstueck"] = 0
    name = frappe.db.get_value("PH Lagerbestand", filt, "name")
    if name:
        return frappe.get_doc("PH Lagerbestand", name)
    if not anlegen:
        return None
    doc = frappe.get_doc(
        {
            "doctype": "PH Lagerbestand",
            "produkt": produkt,
            "ausfuehrung": ausfuehrung,
            "lagerort": lagerort,
            "platz": platz,
            "seriennummer": seriennummer,
            "ausstellungsstueck": int(bool(seriennummer and extra.get("ausstellungsstueck"))),
            "menge": 0,
            "reserviert": 0,
            "eingang_am": nowdate(),
            **{k: v for k, v in extra.items() if k not in ("ausstellungsstueck",)},
        }
    )
    doc.flags.ph_bestand_intern = True
    doc.insert(ignore_permissions=True)
    return doc


def buche(art, produkt, menge, lagerort_von=None, lagerort_nach=None, ausfuehrung=None, seriennummer=None, platz_von=None, platz_nach=None,
          bezug_doctype=None, bezug=None, grund=None, lagerbestand=None, idempotency_key=None, quelle="backoffice", negativ_erlaubt=False, **bestand_extra):
    """Bewegung buchen → PH Lagerbewegung. Idempotent über idempotency_key."""
    if idempotency_key:
        alt = frappe.db.get_value("PH Lagerbewegung", {"idempotency_key": idempotency_key}, "name")
        if alt:
            return frappe.get_doc("PH Lagerbewegung", alt)
    b = {"art": art, "menge": int(menge), "lagerort_von": lagerort_von, "lagerort_nach": lagerort_nach, "platz_von": platz_von, "platz_nach": platz_nach}
    try:
        pruefe_bewegung(b)
    except BestandsFehler as e:
        frappe.throw(str(e))

    if lagerbestand:
        bs = frappe.get_doc("PH Lagerbestand", lagerbestand)
        produkt = produkt or bs.produkt
        ausfuehrung = ausfuehrung or bs.ausfuehrung
        seriennummer = seriennummer or bs.seriennummer
    bestand_name = bestand_anpassen(b, produkt, ausfuehrung, seriennummer, lagerbestand, bezug_doctype, bezug, negativ_erlaubt, bestand_extra)
    doc = frappe.get_doc(
        {
            "doctype": "PH Lagerbewegung",
            "art": art,
            "datum": now_datetime(),
            "produkt": produkt,
            "ausfuehrung": ausfuehrung,
            "lagerbestand": bestand_name,
            "menge": abs(int(menge)) if art != "Inventur" else int(menge),
            "lagerort_von": lagerort_von,
            "platz_von": platz_von,
            "lagerort_nach": lagerort_nach,
            "platz_nach": platz_nach,
            "bezug_doctype": bezug_doctype,
            "bezug": bezug,
            "grund": grund,
            "von_user": frappe.session.user,
            "idempotency_key": idempotency_key,
            "quelle": quelle,
        }
    )
    doc.flags.ph_bestand_intern = True
    doc.insert(ignore_permissions=True)
    return doc


def bestand_anpassen(b, produkt, ausfuehrung=None, seriennummer=None, lagerbestand=None, bezug_doctype=None, bezug=None, negativ_erlaubt=False, bestand_extra=None):
    """Bestandszeilen je Lagerort gemäß Wirkung der Bewegung ändern. → Name der (Ziel-)Bestandszeile."""
    bestand_extra = bestand_extra or {}
    art = b["art"]
    lagerort_von, lagerort_nach, platz_von, platz_nach = b.get("lagerort_von"), b.get("lagerort_nach"), b.get("platz_von"), b.get("platz_nach")
    zeilen = {}
    for ort, dm, dr in wirkung(b):
        bs = zeilen.get(ort)
        if bs is None:
            if lagerbestand and frappe.db.get_value("PH Lagerbestand", lagerbestand, "lagerort") == ort:
                bs = frappe.get_doc("PH Lagerbestand", lagerbestand)
            else:
                bs = bestand_finden(produkt, ort, ausfuehrung, seriennummer, platz=platz_nach if ort == lagerort_nach else platz_von, anlegen=(dm > 0), **bestand_extra)
            if bs is None:
                frappe.throw(_("Kein Bestand von {0} an {1}.").format(produkt, ort))
            zeilen[ort] = bs
        neu_menge = int(bs.menge or 0) + dm
        neu_res = max(int(bs.reserviert or 0) + dr, 0)
        if neu_menge < 0 and not negativ_erlaubt:
            frappe.throw(_("Bestand von {0} an {1} würde negativ ({2}).").format(bs.produkt_name or produkt, ort, neu_menge))
        if neu_res > max(neu_menge, 0) and dr > 0:
            frappe.throw(_("Mehr reserviert als vorhanden ({0}).").format(bs.produkt_name or produkt))
        neu_res = min(neu_res, max(neu_menge, 0))
        werte = {"menge": neu_menge, "reserviert": neu_res, "verfuegbar": verfuegbar(neu_menge, neu_res)}
        verkauft = art == "Verkauf" and neu_menge <= 0
        ausgeschieden = art == "Ausbuchung" and neu_menge <= 0
        werte["status"] = status_aus(neu_menge, neu_res, ausgeschieden=ausgeschieden, verkauft=verkauft)
        if ausgeschieden:
            werte["ausgeschieden_am"] = nowdate()
        if art == "Reservierung" and bezug:
            werte.update(reserviert_fuer_doctype=bezug_doctype, reserviert_fuer=bezug)
        if art == "Freigabe" and neu_res == 0:
            werte.update(reserviert_fuer_doctype=None, reserviert_fuer=None)
        if art == "Inventur":
            werte["inventur_am"] = nowdate()
        if art == "Umlagerung" and ort == lagerort_nach and platz_nach:
            werte["platz"] = platz_nach
        bs.db_set(werte, update_modified=True)

    if len(zeilen) == 1:
        return next(iter(zeilen.values())).name
    if lagerort_nach in zeilen:
        return zeilen[lagerort_nach].name
    return None


def storno(bewegung):
    """Gegenbuchung einer Bewegung (gleiche Art, Orte getauscht bzw. Vorzeichen gedreht)."""
    b = frappe.get_doc("PH Lagerbewegung", bewegung) if isinstance(bewegung, str) else bewegung
    if b.status == "Storniert":
        frappe.throw(_("Bewegung ist bereits storniert."))
    gegen = {
        "Wareneingang": ("Ausbuchung", b.lagerort_nach, None),
        "Retoure": ("Ausbuchung", b.lagerort_nach, None),
        "Verkauf": ("Wareneingang", None, b.lagerort_von),
        "Ausbuchung": ("Wareneingang", None, b.lagerort_von),
        "Umlagerung": ("Umlagerung", b.lagerort_nach, b.lagerort_von),
        "Reservierung": ("Freigabe", b.lagerort_von, None),
        "Freigabe": ("Reservierung", b.lagerort_von, None),
        "Inventur": ("Inventur", None, b.lagerort_nach),
    }[b.art]
    menge = -int(b.menge) if b.art == "Inventur" else int(b.menge)
    neu = buche(gegen[0], b.produkt, menge, lagerort_von=gegen[1], lagerort_nach=gegen[2], ausfuehrung=b.ausfuehrung, lagerbestand=b.lagerbestand,
                bezug_doctype="PH Lagerbewegung", bezug=b.name, grund=_("Storno von {0}").format(b.name), negativ_erlaubt=True)
    neu.db_set({"storno_von": b.name})
    b.db_set({"status": "Storniert"})
    return neu


def bestand_je_lagerort(produkt, ausfuehrung=None):
    filt = {"produkt": produkt, "status": ("!=", "Ausgeschieden")}
    if ausfuehrung:
        filt["ausfuehrung"] = ausfuehrung
    return frappe.get_all("PH Lagerbestand", filters=filt, fields=["name", "lagerort", "platz", "menge", "reserviert", "verfuegbar", "seriennummer", "ausstellungsstueck", "status"])
