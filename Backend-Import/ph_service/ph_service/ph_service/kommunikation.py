"""Kundenkommunikation und Verlauf: Email Templates (Fixtures „PH Service …“) über ph_core.utils.mail.sende.

sende_vorlage(doc, schluessel, empfaenger, ...) rendert das in PH Service Einstellungen hinterlegte Email Template
(Jinja mit `doc`, `firma`, `zusatz`) und schreibt Verlauf + Kommentar. Im Testmodus (PH Einstellungen) leitet
ph_core jede Mail an das Team-Postfach um.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

VORLAGEN = {
    "eingang": "vorlage_eingang",
    "termin": "vorlage_termin",
    "abschluss": "vorlage_abschluss",
    "wartung": "vorlage_wartung",
    "regress": "vorlage_regress",
}


def vorlage_name(schluessel):
    feld = VORLAGEN.get(schluessel)
    if not feld:
        frappe.throw(_("Unbekannte Vorlage: {0}").format(schluessel))
    name = einstellungen().get(feld)
    if not name or not frappe.db.exists("Email Template", name):
        frappe.throw(_("Email Template „{0}“ fehlt (Fixture ph_service/fixtures/email_template.json).").format(name or schluessel))
    return name


def rendern(vorlage, doc, **kontext):
    """→ (betreff, html). Verwendet Frappe-Standard get_email_template, Kontext um Firma ergänzt."""
    from frappe.email.doctype.email_template.email_template import get_email_template

    try:
        from ph_core.utils.druck import ph_firma

        firma = ph_firma()
    except Exception:  # noqa: BLE001 – ohne Standardfirma trotzdem rendern
        firma = {}
    args = {"doc": doc, "firma": firma, **kontext}
    daten = get_email_template(vorlage, args)
    return daten.get("subject") or vorlage, daten.get("message") or ""


def pdf_anhang(doctype, name, print_format, dateiname=None):
    """Druckformat als PDF-Anhang für frappe.sendmail."""
    try:
        return frappe.attach_print(doctype, name, file_name=dateiname or name, print_format=print_format, lang="de")
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_service: PDF {print_format} für {name}")
        return None


def datei_anhaenge(urls):
    """Attach-URLs (/private/files/… oder /files/…) → Anhänge für frappe.sendmail."""
    out = []
    for url in urls or []:
        if not url:
            continue
        fid = frappe.db.get_value("File", {"file_url": url}, "name")
        if fid:
            out.append({"fid": fid})
    return out


def sende_vorlage(doc, schluessel, empfaenger, anhaenge=None, ereignis="Kommunikation", **kontext):
    """Mail nach Vorlage senden, Verlauf schreiben. Rückgabe: Betreff. Wirft bei fehlendem Empfänger."""
    if not empfaenger:
        frappe.throw(_("Keine E-Mail-Adresse hinterlegt."))
    from ph_core.utils.mail import sende

    vorlage = vorlage_name(schluessel)
    betreff, html = rendern(vorlage, doc, **kontext)
    sende(empfaenger, betreff, html, anhaenge=anhaenge or [], referenz_doctype=doc.doctype, referenz_name=doc.name)
    verlauf(doc, ereignis, hinweis=_("Mail „{0}“ an {1}").format(betreff, _maskiert(empfaenger)), speichern=True)
    doc.add_comment("Info", _("E-Mail gesendet: {0}").format(betreff))
    return betreff


def _maskiert(email):
    if isinstance(email, (list, tuple)):
        return ", ".join(_maskiert(e) for e in email)
    email = str(email or "")
    if "@" not in email:
        return email
    lokal, dom = email.split("@", 1)
    return f"{lokal[:1]}…@{dom}"


def verlauf(doc, ereignis, status=None, hinweis=None, speichern=False):
    """Zeile in der Kindtabelle `verlauf` (nur DocTypes mit diesem Feld)."""
    if not doc.meta.has_field("verlauf"):
        return
    zeile = {
        "zeit": now_datetime(),
        "ereignis": ereignis,
        "status": status or doc.get("status"),
        "von": frappe.session.user,
        "hinweis": (hinweis or "")[:500],
    }
    if speichern and not doc.is_new():
        kind = frappe.get_doc({"doctype": doc.meta.get_field("verlauf").options, "parent": doc.name, "parenttype": doc.doctype, "parentfield": "verlauf", "idx": len(doc.get("verlauf") or []) + 1, **zeile})
        kind.insert(ignore_permissions=True)
        doc.db_set("letzte_bewegung", zeile["zeit"], update_modified=False) if doc.meta.has_field("letzte_bewegung") else None
    else:
        doc.append("verlauf", zeile)
