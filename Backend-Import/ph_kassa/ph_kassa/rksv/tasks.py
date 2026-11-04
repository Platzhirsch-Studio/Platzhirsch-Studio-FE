"""Scheduler des RKSV-Kerns (hooks.py, Block „WP10a“). Alle Funktionen idempotent, Fehler → frappe.log_error.

    monats_und_jahresbelege()  täglich 23:50: am Monatsletzten Monatsbeleg (Dezember: Jahresbeleg) je aktiver Kasse;
                               verpasste Monate werden am Folgetag nachgeholt (Ereignis „Monatsbeleg nachgeholt“ + Aufgabe).
    erinnerungen()             täglich 08:00: Startbeleg prüfen, Jahresbeleg bis 15.02. prüfen, DEP-Export > 90 Tage,
                               SEE-Ausfall > 48 h (Meldepflicht).
    ausfall_ueberwachen()      stündlich: SEE „Ausgefallen“ → Erreichbarkeit testen → automatisch beenden (Sammelbeleg).
"""

import calendar

import frappe
from frappe import _
from frappe.utils import add_days, getdate, now_datetime, time_diff_in_hours

from . import buchung
from .finanzonline import AUSFALL_MELDEFRIST_H, JAHRESBELEG_PRUEFUNG_BIS
from .signer import SignaturFehler

AKTIVE_STATUS = ("Registriert", "Aktiv", "Ausgefallen")


def _kassen():
    return frappe.get_all("PH Kasse", {"status": ("in", AKTIVE_STATUS), "startbeleg": ("is", "set")}, ["name", "letzter_monatsbeleg", "letzter_jahresbeleg", "startbeleg_geprueft_am", "jahresbeleg_geprueft_am", "startbeleg_erstellt_am", "dep_export_letzter", "see"])


def _monatsletzter(d):
    return d.day == calendar.monthrange(d.year, d.month)[1]


def monats_und_jahresbelege():
    heute = getdate()
    for k in _kassen():
        try:
            monat = heute.strftime("%Y-%m")
            vormonat = add_days(heute.replace(day=1), -1)
            if _monatsletzter(heute) and k.letzter_monatsbeleg != monat:
                buchung.monatsbeleg(k.name)
            elif k.letzter_monatsbeleg != vormonat.strftime("%Y-%m") and (k.letzter_monatsbeleg or "") < vormonat.strftime("%Y-%m"):
                # Monatsende verpasst (Scheduler stand): sofort nachholen, Zeitstempel ist der echte Zeitpunkt.
                art = "Jahresbeleg" if vormonat.month == 12 else "Monatsbeleg"
                doc = buchung.nullbeleg(k.name, belegart=art, quelle="Scheduler", ignore_permissions=True)
                frappe.db.set_value("PH Kasse", k.name, {"letzter_monatsbeleg": vormonat.strftime("%Y-%m"), **({"letzter_jahresbeleg": vormonat.year} if art == "Jahresbeleg" else {})}, update_modified=False)
                buchung._ereignis(k.name, "Monatsbeleg nachgeholt", beleg=doc.name, status="Erledigt", notiz=_("{0} für {1} wurde verspätet erzeugt – Steuerberater informieren.").format(art, vormonat.strftime("%m/%Y")))
                buchung.aufgabe(k.name, _("{0} {1} wurde verspätet erzeugt ({2}) – Hinweis an Steuerberater.").format(art, vormonat.strftime("%m/%Y"), doc.name))
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kassa: Monats-/Jahresbeleg {k.name}")


def erinnerungen():
    heute = getdate()
    for k in _kassen():
        try:
            if not k.startbeleg_geprueft_am and k.startbeleg_erstellt_am and getdate(k.startbeleg_erstellt_am) <= add_days(heute, -1):
                buchung.aufgabe(k.name, _("Startbeleg mit der BMF Belegcheck-App prüfen und in PH Kasse (Checkliste) bestätigen."))
            vorjahr = heute.year - 1
            frist = heute.replace(month=JAHRESBELEG_PRUEFUNG_BIS[0], day=JAHRESBELEG_PRUEFUNG_BIS[1])
            if k.letzter_jahresbeleg == vorjahr and heute <= frist and (not k.jahresbeleg_geprueft_am or getdate(k.jahresbeleg_geprueft_am).year < heute.year):
                buchung.aufgabe(k.name, _("Jahresbeleg {0} bis 15.02. mit der BMF Belegcheck-App prüfen (RKSV).").format(vorjahr))
            if k.dep_export_letzter and getdate(k.dep_export_letzter) < add_days(heute, -90):
                buchung.aufgabe(k.name, _("Letzter DEP-Export liegt über 90 Tage zurück – DEP exportieren und extern sichern."))
            if k.see:
                seit = frappe.db.get_value("PH Signatureinheit", k.see, "ausgefallen_seit")
                if seit and time_diff_in_hours(now_datetime(), seit) > AUSFALL_MELDEFRIST_H:
                    for ev in frappe.get_all("PH Kassa Ereignis", {"see": k.see, "art": "SEE Ausfall Beginn", "status": "Offen"}, pluck="name"):
                        frappe.db.set_value("PH Kassa Ereignis", ev, "meldung_finanzonline_noetig", 1, update_modified=False)
                    buchung.aufgabe(k.name, _("SEE seit über 48 h ausgefallen – Ausfall in FinanzOnline melden (RKSV § 17 Abs 1)."))
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kassa: Erinnerungen {k.name}")


def ausfall_ueberwachen():
    for see in frappe.get_all("PH Signatureinheit", {"status": "Ausgefallen"}, pluck="name"):
        try:
            try:
                signer = buchung.signer_fuer(see)
                if hasattr(signer, "zertifikat_abrufen"):
                    signer.zertifikat_abrufen()
            except SignaturFehler:
                continue  # weiterhin gestört
            buchung.see_ausfall_beenden(see, notiz=_("Automatisch: SEE wieder erreichbar."), automatisch=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kassa: Ausfallüberwachung {see}")
