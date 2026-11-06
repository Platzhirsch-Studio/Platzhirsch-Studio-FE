"""Script Report „PH Lohnvorbereitung“ (Fachkritik P15/B7): Rohdaten je Person und Monat für die
Lohnverrechnung (Kanzlei) – nur aus **abgeschlossenen** Monaten (PH Zeitabschluss). Keine Zuschlagsberechnung
in Geld; Spalten mit Steuerberatung abstimmen (offene Frage). Export als CSV/Excel über den Report-Export."""

import frappe
from frappe import _
from frappe.utils import cint

from ph_personal.logik import minuten_text


def _h(m):
    return round(int(m or 0) / 60, 2)


def execute(filters=None):
    filters = frappe._dict(filters or {})
    jahr, monat = cint(filters.get("jahr")), cint(filters.get("monat"))
    periode = f"{jahr:04d}-{monat:02d}"
    rows = frappe.get_all("PH Zeitabschluss", filters={"periode": periode, "status": "Abgeschlossen"}, fields=["*"], order_by="mitarbeiter_name asc")
    nr = {m.name: m.lohnverrechnung_personalnummer for m in frappe.get_all("PH Mitarbeiter", fields=["name", "lohnverrechnung_personalnummer"])}
    data = []
    for r in rows:
        data.append({
            "personalnummer": nr.get(r.mitarbeiter), "mitarbeiter": r.mitarbeiter, "name_text": r.mitarbeiter_name,
            "soll_h": _h(r.soll_min), "ist_h": _h(r.ist_min), "normal_h": _h(max(0, (r.ist_min or 0) + (r.gutschrift_min or 0) - (r.mehrarbeit_min or 0) - (r.kv_mehrstunden_min or 0) - (r.ueberstunden_min or 0))),
            "mehrarbeit_h": _h(r.mehrarbeit_min), "kv_mehr_h": _h(r.kv_mehrstunden_min), "ueberstunden_h": _h(r.ueberstunden_min), "abgeltung": r.ueberstunden_abgeltung,
            "za_wert_h": _h(r.za_gutschrift_min), "samstag_h": _h(r.samstag_ab_13_min), "sonntag_h": _h(r.sonntag_min), "feiertag_arbeit_h": _h(r.feiertag_arbeit_min),
            "nacht_h": _h(r.nacht_min), "feiertag_frei_h": _h(r.feiertag_min), "urlaub": r.urlaub_tage, "krank": r.krank_tage, "arbeitsunfall": r.arbeitsunfall_tage,
            "pflege": r.pflege_tage, "sonder": r.sonder_tage, "fortbildung": r.fortbildung_tage, "berufsschule": r.berufsschule_tage, "za_tage": r.za_tage,
            "unbezahlt": r.unbezahlt_tage, "ruhend": r.ruhend_tage, "saldo_kumuliert": minuten_text(r.saldo_kumuliert_min or 0), "abschluss": r.name,
        })
    offen = frappe.db.count("PH Mitarbeiter", {"status": ("!=", "Ausgetreten")}) - len(data)
    F, D, L = "Float", "Data", "Link"
    spalten = [
        ("personalnummer", "Personalnr.", D, 90), ("mitarbeiter", "Mitarbeiter", L, 110), ("name_text", "Name", D, 160),
        ("soll_h", "Soll h", F, 70), ("ist_h", "Ist h", F, 70), ("normal_h", "Normal h (inkl. bezahlter Abwesenheit)", F, 120),
        ("mehrarbeit_h", "Mehrarbeit TZ h", F, 100), ("kv_mehr_h", "über KV-Normal h", F, 100), ("ueberstunden_h", "Überstunden h", F, 100), ("abgeltung", "Abgeltung", D, 100),
        ("za_wert_h", "ZA-Wert h", F, 80), ("samstag_h", "Sa ab 13 h", F, 80), ("sonntag_h", "So h", F, 70), ("feiertag_arbeit_h", "Feiertag gearbeitet h", F, 110),
        ("nacht_h", "Nacht 22–6 h", F, 90), ("feiertag_frei_h", "Feiertagsentgelt h", F, 100), ("urlaub", "Urlaub T", F, 70), ("krank", "Krank T", F, 70),
        ("arbeitsunfall", "davon AU T", F, 80), ("pflege", "Pflegefreist. T", F, 90), ("sonder", "Sonderurlaub T", F, 90), ("fortbildung", "Fortbildung T", F, 90),
        ("berufsschule", "Berufsschule T", F, 90), ("za_tage", "ZA T", F, 60), ("unbezahlt", "unbezahlt T", F, 80), ("ruhend", "Karenz/Dienst T", F, 90),
        ("saldo_kumuliert", "Saldo kumuliert", D, 100), ("abschluss", "Abschluss", L, 160),
    ]
    columns = [{"fieldname": f, "label": _(l), "fieldtype": t, "width": w, **({"options": "PH Mitarbeiter" if f == "mitarbeiter" else "PH Zeitabschluss"} if t == L else {})} for f, l, t, w in spalten]
    message = _("Nur abgeschlossene Monate. Zuschläge (50 % Überstunden, 25 % Mehrarbeit, Sonn-/Feiertag, Nacht) berechnet die Lohnverrechnung nach KV. Noch nicht abgeschlossen: {0} Person(en).").format(max(0, offen))
    return columns, data, message
