"""Gecachte Marketing-Einstellungen (Single PH Marketing Einstellungen) plus Werte aus PH Einstellungen (ph_core)."""

import frappe
from frappe.utils import cint

CACHE = "ph_marketing:einstellungen"
FELDER = ("feld_email", "feld_name", "feld_anrede", "feld_lieferdatum", "feld_berater", "feld_produkt", "feld_storniert", "wert_storniert", "positionen_tabelle", "feld_pflegekategorie", "feld_outdoor", "feld_kontakt")


def einstellungen():
    data = frappe.cache().get_value(CACHE)
    if not data:
        doc = frappe.get_cached_doc("PH Marketing Einstellungen")
        from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen as core

        c = core()
        data = {
            "automatik_aktiv": cint(doc.automatik_aktiv),
            "testmodus": cint(c.get("testmodus")),
            "test_empfaenger": doc.test_empfaenger or c.get("team_email"),
            "team_email": c.get("team_email"),
            "kanzlei_fusszeilen_freigegeben": cint(doc.kanzlei_fusszeilen_freigegeben),
            "kanzlei_b_einladung_bestaetigt": cint(doc.kanzlei_b_einladung_bestaetigt),
            "ecg_abgleich_gueltig_bis": str(doc.ecg_abgleich_gueltig_bis) if doc.ecg_abgleich_gueltig_bis else None,
            "website_url": (doc.website_url or c.get("website_url") or "https://platzhirsch.studio").rstrip("/"),
            "absender_name": doc.absender_name or "Platzhirsch Home Living",
            "absender_gastgeberin_name": doc.absender_gastgeberin_name,
            "absender_gastgeberin": doc.absender_gastgeberin,
            "antwort_an": doc.antwort_an,
            "versandweg": doc.versandweg or "Frappe Email Queue",
            "versand_stapel": cint(doc.versand_stapel) or 200,
            "doi_gueltig_stunden": cint(doc.doi_gueltig_stunden) or 48,
            "doi_erinnerung_nach_stunden": cint(doc.doi_erinnerung_nach_stunden),
            "unbestaetigt_loeschen_tage": cint(doc.unbestaetigt_loeschen_tage) or 30,
            "ip_hash_speichern": cint(doc.ip_hash_speichern),
            "einwilligung_textversion": doc.einwilligung_textversion or "nl-2026-10-29",
            "newsletter_email_group": doc.newsletter_email_group,
            "einladungen_email_group": doc.einladungen_email_group,
            "bestaetigen_pfad": doc.bestaetigen_pfad or "/de/newsletter/bestaetigen",
            "abmelden_pfad": doc.abmelden_pfad or "/de/newsletter/abmelden",
            "werbung_pro_30_tage": cint(doc.werbung_pro_30_tage) or 2,
            "werbung_wochentage": doc.werbung_wochentage or "2,3,4",
            "sperrtage": doc.sperrtage or "12-24,12-25,12-26,12-31,01-01",
            "auftrags_doctype": doc.auftrags_doctype,
            "felder": {k: (doc.get(k) or "") for k in FELDER},
            "empfehlung_gutschein_cent": cint(doc.empfehlung_gutschein_cent),
            "empfehlung_ruecktritt_tage": cint(doc.empfehlung_ruecktritt_tage) or 14,
            "empfehlung_bedingungen_url": doc.empfehlung_bedingungen_url,
            "event_erinnerung_tage": cint(doc.event_erinnerung_tage) or 2,
            "event_loeschfrist_monate": cint(doc.event_loeschfrist_monate) or 3,
        }
        frappe.cache().set_value(CACHE, data)
    return data


def cache_leeren():
    frappe.cache().delete_value(CACHE)


def website_url(pfad=""):
    return einstellungen()["website_url"] + (pfad or "")
