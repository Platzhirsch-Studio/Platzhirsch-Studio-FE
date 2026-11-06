"""doc_events (hooks.py): Herstellerbestellung und Wareneingang (ph_sortiment) → Lieferstatus der Projektpositionen.

Verknüpfung: PH Herstellerbestellung.bezug_doctype = "PH Projekt", bezug_name = Projekt; Positionsfeld `bezug_zeile`
= name der PH Projekt Position. Terminänderungen stehen in der Kindtabelle `terminaenderungen`
(PH Herstellerbestellung Terminaenderung, ph_sortiment). Nie Fehler werfen (CONVENTIONS 3/13).
"""

import frappe
from frappe import _
from frappe.utils import nowdate

from ph_projekte.utils import lieferung as lief


def _projekt_der_bestellung(hb):
    if hb.get("bezug_doctype") == "PH Projekt" and hb.get("bezug_name") and frappe.db.exists("PH Projekt", hb.bezug_name):
        return hb.bezug_name
    kommission = hb.get("kommission")
    if kommission and frappe.db.exists("PH Projekt", kommission):
        return kommission
    return None


def _positionen_abgleichen(projekt, hb):
    p = frappe.get_doc("PH Projekt", projekt)
    hb_pos = [z.as_dict() for z in hb.get("positionen") or []]
    aenderungen = lief.abgleich_herstellerbestellung([z.as_dict() for z in p.positionen], hb.name, hb.status, hb_pos)
    for zeile, werte in aenderungen.items():
        frappe.db.set_value("PH Projekt Position", zeile, werte, update_modified=False)
    if aenderungen:
        p.reload()
        termin = lief.spaetester_termin([z.as_dict() for z in p.positionen])
        if termin and str(termin) != str(p.liefertermin_geplant or ""):
            frappe.db.set_value("PH Projekt", projekt, "liefertermin_geplant", termin, update_modified=False)
        ware_status_setzen(p)
        planung_rueckmelden(p)
    return p, aenderungen


def ware_status_werte(p):
    """Felder ware_komplett/ware_komplett_am/ware_fehlend aus den Positionen (S6 „Küche komplett“)."""
    komplett, fehlend = lief.ware_komplett([z.as_dict() for z in p.positionen])
    return {
        "ware_komplett": 1 if komplett else 0,
        "ware_komplett_am": (p.ware_komplett_am or nowdate()) if komplett else None,
        "ware_fehlend": "\n".join(f"{f['bezeichnung']}: {f['offen']}" for f in fehlend[:30]),
    }


def ware_status_setzen(p):
    werte = ware_status_werte(p)
    if int(p.ware_komplett or 0) != werte["ware_komplett"] or (p.ware_fehlend or "") != werte["ware_fehlend"]:
        frappe.db.set_value("PH Projekt", p.name, werte, update_modified=False)
        if werte["ware_komplett"] and not p.ware_komplett:
            p.add_comment("Info", _("Ware komplett – Montage kann terminiert werden."))
    return werte


def planung_rueckmelden(p):
    """Bestellstatus je Projektposition zurück an die Planungspositionen (projekt_zeile)."""
    zeilen = {z.name: z for z in p.positionen}
    if not zeilen:
        return 0
    n = 0
    for pp in frappe.get_all("PH Planung Position", filters={"projekt_zeile": ("in", list(zeilen)), "parenttype": "PH Planung"}, fields=["name", "projekt_zeile", "lieferstatus", "herstellerbestellung", "liefertermin"]):
        z = zeilen[pp.projekt_zeile]
        werte = {"lieferstatus": z.lieferstatus or "offen", "herstellerbestellung": z.herstellerbestellung, "liefertermin": z.liefertermin}
        if any(str(pp.get(k) or "") != str(v or "") for k, v in werte.items()):
            frappe.db.set_value("PH Planung Position", pp.name, werte, update_modified=False)
            n += 1
    return n


def _terminaenderungen_melden(p, hb):
    offen = lief.offene_terminaenderungen([z.as_dict() for z in hb.get("terminaenderungen") or []])
    if not offen:
        return 0
    titel_je_zeile = {z.name: z.bezeichnung for z in p.positionen}
    hb_bez = {z.idx: z.bezeichnung for z in hb.get("positionen") or []}
    eintraege = []
    for t in offen:
        bez = titel_je_zeile.get(t.get("bezug_zeile")) or hb_bez.get(t.get("position")) or _("Lieferung {0}").format(hb.name)
        eintraege.append({"bezeichnung": bez, "termin_alt": t.get("termin_alt"), "termin_neu": t.get("termin_neu")})
    sprache = (frappe.db.get_value("PH Kontakt", p.kontakt, "sprache") if p.kontakt else None) or "de"
    text = lief.kundentext_liefertermin(p.titel, eintraege, sprache)
    automatisch = frappe.db.get_single_value("PH Projekte Einstellungen", "liefertermin_kunde_automatisch")
    if automatisch and p.kontakt:
        frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": p.kontakt, "projekt": p.name, "richtung": "ausgehend", "text": text, "quelle": "system"}).insert(ignore_permissions=True)
    else:
        verantwortlich = p.berater or p.planer or p.montageleiter or "Administrator"
        frappe.get_doc({
            "doctype": "PH Projekt Aufgabe", "projekt": p.name, "titel": _("Liefertermin geändert – Kunde informieren ({0})").format(hb.name)[:140],
            "art": "Bestellung",
            "prioritaet": "Hoch", "faellig": nowdate(), "zugewiesen_an": verantwortlich, "referenz_doctype": "PH Herstellerbestellung", "referenz_name": hb.name,
            "beschreibung": text, "abrechenbar": 0,
        }).insert(ignore_permissions=True)
    p.add_comment("Info", _("Liefertermin geändert ({0}): {1}").format(hb.name, "; ".join(f"{e['bezeichnung']} → {e['termin_neu']}" for e in eintraege))[:1000])
    for t in offen:
        werte = {"projekt_informiert": 1}
        if automatisch:
            werte["kunde_informiert"] = 1
        frappe.db.set_value("PH Herstellerbestellung Terminaenderung", t.get("name"), werte, update_modified=False)
    return len(offen)


def herstellerbestellung_aktualisiert(doc, method=None):
    try:
        projekt = _projekt_der_bestellung(doc)
        if not projekt:
            return
        p, _aend = _positionen_abgleichen(projekt, doc)
        if frappe.get_meta("PH Herstellerbestellung").has_field("terminaenderungen"):
            _terminaenderungen_melden(p, doc)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_projekte: Herstellerbestellung {doc.name} → Projekt")


def wareneingang_aktualisiert(doc, method=None):
    """Wareneingang: gelieferte Mengen (über die Herstellerbestellung) und Schäden → Nachlieferung vormerken."""
    try:
        if not doc.get("herstellerbestellung"):
            return
        hb = frappe.get_doc("PH Herstellerbestellung", doc.herstellerbestellung)
        projekt = _projekt_der_bestellung(hb)
        if not projekt:
            return
        p, _aend = _positionen_abgleichen(projekt, hb)
        schaeden = lief.schaeden_aus_wareneingang([z.as_dict() for z in doc.get("positionen") or []], [z.as_dict() for z in hb.get("positionen") or []])
        bekannt = {z.name: z for z in p.positionen}
        for zeile, s in schaeden.items():
            pos = bekannt.get(zeile)
            if not pos or pos.nachlieferung_noetig:
                continue
            frappe.db.set_value("PH Projekt Position", zeile, {"nachlieferung_noetig": 1, "nachlieferung_menge": s["menge"], "nachlieferung_grund": _("Wareneingang {0}: {1}").format(doc.name, s["grund"])[:140]}, update_modified=False)
        if schaeden:
            p.add_comment("Info", _("Wareneingang {0}: {1} Position(en) mit Schaden/Fehlmenge – Nachlieferung vorgemerkt").format(doc.name, len(schaeden)))
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_projekte: Wareneingang {doc.name} → Projekt")
