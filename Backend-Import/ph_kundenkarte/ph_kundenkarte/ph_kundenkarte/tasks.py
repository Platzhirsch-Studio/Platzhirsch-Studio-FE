"""Scheduler (hooks.py, Europe/Vienna): Umsatz/Stufen aller aktiven Karten (03:30), Geburtstage → PH Aufgabe (08:00),
beantragte Karten > 7 Tage ohne Übergabe → PH Aufgabe (08:05), am 1. Dezember ungenutzte limitierte Vorteile
(z. B. Pflegetermin) → PH Aufgabe „anbieten“ (08:10).
Idempotent, commit je Einheit, Fehler nur protokolliert (CONVENTIONS 13). Kein automatischer Mailversand."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate

from ph_kundenkarte.ph_kundenkarte import umsatz
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_antrag.ph_kundenkarte_antrag import offene_antraege_veralten
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen
from ph_kundenkarte.utils.kartenregeln import geburtstag_heute


def umsatz_und_stufen_neu_berechnen():
    """Täglich 03:30: alle aktiven/gesperrten Karten mit Einwilligung zur Auswertung."""
    karten = frappe.get_all("PH Kundenkarte", filters={"status": ("in", ["Aktiv", "Gesperrt"]), "einwilligung_auswertung": 1}, pluck="name")
    for karte in karten:
        try:
            umsatz.karte_neu_berechnen(karte, automatisch=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_kundenkarte: Umsatz {karte}")
    try:
        offene_antraege_veralten(30)
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.db.rollback()
        frappe.log_error(title="ph_kundenkarte: Anträge veralten")


def geburtstage_heute():
    """Täglich 08:00: Karten mit Geburtstag heute → PH Aufgabe (ph_crm) für die Beraterin/den Berater.

    Nur Karten mit freiwillig angegebenem Geburtstag; eine Aufgabe je Karte und Jahr (idempotent).
    Der Gruß selbst erfolgt persönlich (Anruf, Karte) – kein automatischer Mailversand ohne freigegebene Vorlage.
    """
    if not frappe.db.exists("DocType", "PH Aufgabe"):
        return
    heute = getdate(nowdate())
    einst = einstellungen()
    karten = frappe.get_all("PH Kundenkarte", filters={"status": "Aktiv", "geburtstag_tag_monat": ("is", "set")}, fields=["name", "kontakt", "kunde_name", "geburtstag_tag_monat", "persoenlicher_berater", "stufe"])
    for k in karten:
        # Tag/Monat genügt (Website liefert ggf. ohne Jahr); 29.02. in Nicht-Schaltjahren am 28.02.
        if not geburtstag_heute(k.geburtstag_tag_monat, heute):
            continue
        try:
            titel = _("Geburtstagsgruß Kundenkarte: {0}").format(k.kunde_name or k.kontakt)[:140]
            if frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Kundenkarte", "referenz_name": k.name, "faellig": heute, "titel": titel}):
                continue
            frappe.get_doc(
                {
                    "doctype": "PH Aufgabe",
                    "titel": titel,
                    "status": "Offen",
                    "prioritaet": "Normal",
                    "faellig": heute,
                    "zugewiesen_an": k.persoenlicher_berater or einst.get("berater_standard"),
                    "referenz_doctype": "PH Kundenkarte",
                    "referenz_name": k.name,
                    "kontakt": k.kontakt,
                    "quelle": "scheduler",
                    "beschreibung": _("Heute hat {0} Geburtstag (Kundenkarte {1}, Stufe {2}). Persönlicher Gruß laut Vorteil „Geburtstagsgruß“ – keine Werbung, kein Rabatt.").format(k.kunde_name or k.kontakt, k.name, k.stufe or "–"),
                }
            ).insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_kundenkarte: Geburtstag {k.name}")


def _aufgabe(titel, faellig, zugewiesen_an, karte, kontakt, beschreibung):
    """PH Aufgabe (ph_crm) idempotent je Karte/Titel/Fälligkeit anlegen."""
    if frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Kundenkarte", "referenz_name": karte, "titel": titel, "status": ("!=", "Erledigt")}):
        return None
    doc = frappe.get_doc({"doctype": "PH Aufgabe", "titel": titel[:140], "status": "Offen", "prioritaet": "Normal", "faellig": faellig, "zugewiesen_an": zugewiesen_an, "referenz_doctype": "PH Kundenkarte", "referenz_name": karte, "kontakt": kontakt, "quelle": "scheduler", "beschreibung": beschreibung})
    doc.insert(ignore_permissions=True)
    return doc.name


def karten_nicht_uebergeben(tage=7):
    """Täglich 08:05: Karte „Beantragt“ seit mehr als `tage` Tagen (Kassa-/Showroom-Antrag ohne Übergabe)
    → PH Aufgabe für den Berater (Konzept §8.2). Eine offene Aufgabe je Karte."""
    if not frappe.db.exists("DocType", "PH Aufgabe"):
        return
    einst = einstellungen()
    grenze = add_days(nowdate(), -int(tage))
    for k in frappe.get_all("PH Kundenkarte", filters={"status": "Beantragt", "creation": ("<", grenze)}, fields=["name", "kontakt", "kunde_name", "persoenlicher_berater", "creation"]):
        try:
            _aufgabe(
                _("Kundenkarte {0} noch nicht übergeben").format(k.name),
                nowdate(),
                k.persoenlicher_berater or einst.get("berater_standard"),
                k.name,
                k.kontakt,
                _("Die Karte für {0} wartet seit {1} Tagen auf die Übergabe. Bei Übergabe „Karte übergeben“ wählen (aktiviert die Karte) – oder Antrag/Karte kündigen.").format(k.kunde_name or k.kontakt, (getdate(nowdate()) - getdate(k.creation)).days),
            )
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_kundenkarte: Übergabe-Erinnerung {k.name}")


def vorteile_ungenutzt_dezember():
    """1. Dezember 08:10: limitierte Vorteile (einloesbar_pro_jahr > 0, z. B. Pflegetermin), die im laufenden
    Jahr nicht genutzt wurden → PH Aufgabe „<Vorteil> anbieten“ für den Berater (Konzept §8.2/§8.3).
    Keine Kundenmail – persönliche Ansprache. Geburtstagsgruß ist ausgenommen (eigener Ablauf)."""
    if not frappe.db.exists("DocType", "PH Aufgabe"):
        return
    from ph_kundenkarte.ph_kundenkarte import umsatz

    einst = einstellungen()
    heute = getdate(nowdate())
    geburtstag_vorteil = frappe.db.get_value("PH Kundenkarte Vorteil", {"titel": "Gruß zum Geburtstag"}, "name")
    for k in frappe.get_all("PH Kundenkarte", filters={"status": "Aktiv"}, fields=["name", "kontakt", "kunde_name", "persoenlicher_berater"]):
        try:
            u = umsatz.karten_uebersicht(k.name)
            offen = [v for v in u["vorteile"] if v.get("verfuegbar") and int(v.get("einloesbar_pro_jahr") or 0) > 0 and not int(v.get("genutzt_im_jahr") or 0) and v["vorteil"] != geburtstag_vorteil]
            for v in offen:
                _aufgabe(
                    _("{0} anbieten: {1}").format(v.get("titel") or v["vorteil"], k.kunde_name or k.kontakt),
                    add_days(heute, 7),
                    k.persoenlicher_berater or einst.get("berater_standard"),
                    k.name,
                    k.kontakt,
                    _("Der Vorteil „{0}“ der Kundenkarte {1} ist {2} noch nicht genutzt und verfällt mit Jahresende. Bitte persönlich anbieten – keine Werbung, kein Rabatt.").format(v.get("titel") or v["vorteil"], k.name, heute.year),
                )
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_kundenkarte: Vorteile ungenutzt {k.name}")
