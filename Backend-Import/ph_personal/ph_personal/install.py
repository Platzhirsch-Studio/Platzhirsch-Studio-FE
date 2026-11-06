"""Erstinstallation von ph_personal: Einstellungen, Import der 8 Stellen (Stand 03.11.2026). Idempotent.

Import-Quelle: ph_personal/ph_personal/daten/stellen_import.json = Kopie von
qa-screenshots/karriere/frappe-import.json (Website-Export, Inhaber-Entscheidung Nr. 47: KV-Mindestentgelte).
Erneut ausführbar: bench --site <site> execute ph_personal.install.stellen_importieren
"""

import json
import os

import frappe

from ph_personal.logik import SPRACHEN, slug as mache_slug

IMPORT_KENNUNG = "frappe-import 2026-11-03"
DATEI = os.path.join(os.path.dirname(__file__), "ph_personal", "daten", "stellen_import.json")
BESCHREIBUNG = {"de": "stellenbeschreibung", "en": "job_description_en", "fr": "description_de_lemploi", "it": "jobs_description_it"}
KATEGORIE_DE = {"Planung": "Planung", "Verkauf": "Verkauf", "Montage": "Montage", "Verwaltung": "Verwaltung", "Lehre": "Lehre"}


def after_install():
    einstellungen_anlegen()
    stellen_importieren()
    checklisten_anlegen()
    frappe.db.commit()


# Standard-Checklisten (Fachkritik P14/B8/B10). Rechtsgrundlagen als Hinweis, keine Rechtsberatung.
ONBOARDING = [
    ("ÖGK-Anmeldung vor Arbeitsantritt", -1, "Lohnverrechnung", 1, "§ 33 ASVG", "oegk_anmeldung_am"),
    ("Dienstzettel/Dienstvertrag übergeben", 0, "Leitung", 1, "§ 2 AVRAG", "dienstzettel_am"),
    ("Datenschutzinformation für Beschäftigte übergeben", 0, "Leitung", 1, "Art. 13 DSGVO", "datenschutzinfo_am"),
    ("Sicherheitsunterweisung (Montage, Lager, Fahrzeug)", 0, "Leitung", 1, "§ 14 ASchG", "unterweisung_am"),
    ("Arbeitszeitmodell und Urlaubsanspruch erfassen", 0, "Sachbearbeitung", 0, "", ""),
    ("Benutzer, Kassa-PIN und Geräte einrichten", 0, "Technik", 0, "", ""),
    ("Schlüssel/Arbeitsmittel ausgeben und eintragen", 0, "Leitung", 0, "", ""),
    ("Einschulung Showroom/Kassa/Planungssoftware", 7, "Leitung", 0, "", ""),
    ("Feedbackgespräch Ende Probemonat", 28, "Leitung", 0, "§ 19 AngG", ""),
]
OFFBOARDING = [
    ("Zugang entziehen (Benutzer, Kassa-PIN, Sitzungen)", 1, "Technik", 1, "Art. 32 DSGVO", "zugang_entzogen_am"),
    ("ÖGK-Abmeldung", 7, "Lohnverrechnung", 1, "§ 33 ASVG (binnen 7 Tagen)", "oegk_abmeldung_am"),
    ("Arbeitsmittel zurück (Schlüssel, Fahrzeug, Tablet, Kleidung)", 0, "Leitung", 0, "", ""),
    ("Endabrechnung: Urlaubsersatzleistung und Zeitguthaben an Lohnverrechnung", 0, "Leitung", 1, "§ 10 UrlG, § 19e AZG", ""),
    ("Dienstzeugnis ausstellen (auf Verlangen)", 14, "Leitung", 0, "§ 39 AngG / § 1163 ABGB", "dienstzeugnis_am"),
]


def checklisten_anlegen():
    """Standardvorlagen Onboarding/Offboarding (idempotent, nur wenn nicht vorhanden)."""
    for titel, art, aufgaben in (("Standard Onboarding", "Onboarding", ONBOARDING), ("Standard Offboarding", "Offboarding", OFFBOARDING)):
        if frappe.db.exists("PH Onboarding Vorlage", titel):
            continue
        frappe.get_doc(
            {
                "doctype": "PH Onboarding Vorlage",
                "titel": titel,
                "art": art,
                "standard": 1,
                "aktiv": 1,
                "aufgaben": [
                    {"aufgabe": a, "tage_relativ": t, "verantwortlich": v, "pflicht": pf, "rechtsgrundlage": r, "nachweis_feld": n}
                    for a, t, v, pf, r, n in aufgaben
                ],
            }
        ).insert(ignore_permissions=True)


def einstellungen_anlegen():
    doc = frappe.get_single("PH Personal Einstellungen")
    doc.save(ignore_permissions=True)


def _entgelt(hinweise):
    e = (hinweise or {}).get("entgelt") or {}
    betrag = e.get("kvMindestBrutto")
    cent = int(round(float(betrag) * 100)) if isinstance(betrag, (int, float)) and betrag > 0 else 0
    u = e.get("ueberzahlung")
    if u is True:
        ueberzahlung, text = "ja", ""
    elif u is False:
        ueberzahlung, text = "nein", ""
    elif isinstance(u, str) and u.strip():
        ueberzahlung, text = "", u.strip()
    else:
        ueberzahlung, text = "", ""
    return cent, (e.get("zeitraum") if e.get("zeitraum") in ("Monat", "Jahr") else "Monat"), (e.get("kollektivvertrag") or "").strip(), ueberzahlung, text


def stelle_aus_import(job, aktivieren=True):
    """Website-Export (Doctype „Karriere“) → PH Stelle-Dict. Status Aktiv nur mit vollständigem Entgelt (sonst Entwurf)."""
    hinweise = job.get("_hinweise") or {}
    cent, zeitraum, kv, ueberzahlung, utext = _entgelt(hinweise)
    daten = {
        "doctype": "PH Stelle",
        "titel": job["title"],
        "slug": hinweise.get("slug") or mache_slug(job["title"]),
        "kategorie": KATEGORIE_DE.get(job.get("category_de"), "Verwaltung"),
        "beschaeftigungsart": hinweise.get("ausmass") or job.get("type") or "Vollzeit",
        "positionen_anzahl": int(job.get("positions") or 1),
        "start": hinweise.get("start") or job.get("start_de") or "ab sofort",
        "kv_mindest_brutto_cent": cent,
        "entgelt_zeitraum": zeitraum,
        "kollektivvertrag": kv,
        "ueberzahlung": ueberzahlung,
        "ueberzahlung_text": utext,
        "veroeffentlicht": job.get("posted") or None,
        "gueltig_bis": hinweise.get("valid_through") or None,
        "quelle": "Import",
        "sync_quelle": IMPORT_KENNUNG,
    }
    for l in SPRACHEN:
        if l != "de":
            daten[f"titel_{l}"] = job.get(f"title_{l}")
        daten[BESCHREIBUNG[l]] = job.get(BESCHREIBUNG[l]) or ""
        daten[f"aufgaben_{l}"] = [{"responsibility": r.get("responsibility")} for r in job.get(f"responsibilities_{l}") or [] if r.get("responsibility")]
        daten[f"anforderungen_{l}"] = [{"anforderungen": r.get("anforderungen")} for r in job.get(f"requirement_{l}") or [] if r.get("anforderungen")]
        daten[f"leistungen_{l}"] = [{"benefit": r.get("benefit")} for r in job.get(f"benefits_{l}") or [] if r.get("benefit")]
    from ph_personal.logik import entgelt_vollstaendig

    vollstaendig = entgelt_vollstaendig(cent, zeitraum, kv, ueberzahlung, utext)
    daten["status"] = "Aktiv" if (aktivieren and vollstaendig and job.get("status") == "Aktiv") else "Entwurf"
    daten["workflow_state"] = "PH Aktiv" if daten["status"] == "Aktiv" else "PH Entwurf"
    return daten


def stellen_importieren(datei=None, aktivieren=True):
    """Importiert die Stellen aus der JSON-Datei; vorhandene (gleicher Slug) werden nur aktualisiert, wenn sie
    noch aus demselben Import stammen und nicht im Desk verändert wurden (sync_quelle gesetzt)."""
    pfad = datei or DATEI
    if not os.path.exists(pfad):
        frappe.log_error(title="PH Personal: Importdatei fehlt", message=pfad)
        return 0
    with open(pfad, encoding="utf-8") as f:
        inhalt = json.load(f)
    jobs = inhalt.get("docs") if isinstance(inhalt, dict) else inhalt
    anzahl = 0
    for job in jobs or []:
        daten = stelle_aus_import(job, aktivieren=aktivieren)
        name = daten["slug"]
        if frappe.db.exists("PH Stelle", name):
            alt = frappe.get_doc("PH Stelle", name)
            if alt.sync_quelle != IMPORT_KENNUNG:
                continue  # im Desk bearbeitet oder anderer Import → nicht überschreiben
            for k, v in daten.items():
                if k in ("doctype", "slug", "status", "workflow_state", "veroeffentlicht", "gueltig_bis"):
                    continue
                alt.set(k, v)
            alt.flags.ignore_permissions = True
            alt.save()
        else:
            doc = frappe.get_doc(daten)
            doc.flags.ignore_permissions = True
            doc.insert()
        anzahl += 1
    frappe.db.commit()
    try:
        from ph_personal.api import karriere_cache_leeren

        karriere_cache_leeren()
    except Exception:  # noqa: BLE001
        pass
    return anzahl
