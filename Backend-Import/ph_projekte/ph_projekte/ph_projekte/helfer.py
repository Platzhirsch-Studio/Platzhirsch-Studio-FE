"""Gemeinsame Frappe-Helfer der ph_projekte-Controller und der API."""

import datetime

import frappe
from frappe.utils import get_datetime, now_datetime

KONTAKT_FELDER_NAME = ("anrede", "vorname", "nachname", "firma")


def kontakt_feld(kontakt, feld, standard=None):
    """Wert aus PH Kontakt (ph_crm), ohne zu werfen, wenn DocType oder Feld (noch) fehlen."""
    if not kontakt or not frappe.db.exists("DocType", "PH Kontakt"):
        return standard
    try:
        if not frappe.get_meta("PH Kontakt").has_field(feld):
            return standard
        return frappe.db.get_value("PH Kontakt", kontakt, feld) or standard
    except Exception:  # noqa: BLE001 – Fremd-DocType, nie blockieren
        return standard


def kunden_name(kontakt):
    if not kontakt:
        return ""
    vor = kontakt_feld(kontakt, "vorname", "") or ""
    nach = kontakt_feld(kontakt, "nachname", "") or ""
    firma = kontakt_feld(kontakt, "firma", "") or ""
    name = " ".join(x for x in (vor, nach) if x).strip()
    return (name or firma or str(kontakt))[:140]


def projekt_kontakt(projekt):
    return frappe.db.get_value("PH Projekt", projekt, "kontakt") if projekt else None


def iso(wert):
    """Datetime (Site-Zeitzone, naiv) → ISO 8601 mit Offset, z. B. 2026-11-04T09:30:00+01:00."""
    if not wert:
        return None
    if isinstance(wert, datetime.date) and not isinstance(wert, datetime.datetime):
        return wert.isoformat()
    dt = get_datetime(wert)
    if dt.tzinfo is None:
        try:
            import pytz

            tz = pytz.timezone(frappe.utils.get_system_timezone())
            dt = tz.localize(dt)
        except Exception:  # noqa: BLE001
            return dt.isoformat()
    return dt.isoformat()


def jetzt():
    return now_datetime()


def doc_exists(doctype):
    return bool(frappe.db.exists("DocType", doctype))


def privat_datei(datei_url):
    """Metadaten einer (privaten) Datei: name, file_name, file_size, is_private."""
    if not datei_url:
        return None
    return frappe.db.get_value("File", {"file_url": datei_url}, ["name", "file_name", "file_size", "is_private", "file_url"], as_dict=True)


def datei_anhaengen(doctype, docname, dateiname, inhalt, feld=None, privat=True):
    """Bytes als private File an ein Dokument hängen. → File-Doc."""
    file_doc = frappe.get_doc(
        {
            "doctype": "File",
            "file_name": dateiname,
            "attached_to_doctype": doctype,
            "attached_to_name": docname,
            "attached_to_field": feld,
            "is_private": 1 if privat else 0,
            "content": inhalt,
        }
    )
    file_doc.insert(ignore_permissions=True)
    return file_doc


def dateien_loeschen(doctype, docname):
    """Alle an ein Dokument gehängten Files löschen (Widerruf Referenz)."""
    for name in frappe.get_all("File", filters={"attached_to_doctype": doctype, "attached_to_name": docname}, pluck="name"):
        try:
            frappe.delete_doc("File", name, ignore_permissions=True, force=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_projekte: Datei {name} konnte nicht gelöscht werden")


def phase_protokollieren(projekt_doc, phase, notiz=None):
    """Zeile im Phasenverlauf anlegen (idempotent je Phase + Tag)."""
    heute = now_datetime().date()
    for z in projekt_doc.get("phasen_verlauf") or []:
        if z.phase == phase and z.datum and get_datetime(z.datum).date() == heute:
            return
    projekt_doc.append("phasen_verlauf", {"phase": phase, "datum": now_datetime(), "von": frappe.session.user, "notiz": notiz})


def portal_url(pfad=""):
    basis = frappe.db.get_single_value("PH Projekte Einstellungen", "portal_basis_url") or "https://platzhirsch.studio/de/portal"
    return basis.rstrip("/") + "/" + pfad.lstrip("/") if pfad else basis


def ph_einstellungen_projekte():
    """Jinja-Hilfe (hooks.py): PH Projekte Einstellungen als dict für Druckformate."""
    doc = frappe.get_cached_doc("PH Projekte Einstellungen")
    return frappe._dict(
        portal_basis_url=(doc.portal_basis_url or "https://platzhirsch.studio/de/portal").rstrip("/"),
        haftungshinweis_fremdgewerke=doc.haftungshinweis_fremdgewerke or "",
        montagebericht_fusstext=doc.montagebericht_fusstext or "",
        abnahme_fusstext=doc.abnahme_fusstext or "",
    )
