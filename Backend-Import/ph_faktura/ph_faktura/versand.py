"""PDF erzeugen/fixieren und Belege per Mail senden (über ph_core.utils.mail.sende, Testmodus-Umleitung)."""

import frappe
from frappe import _
from frappe.utils import now_datetime

PRINT_FORMATS = {
    "PH Angebot": "PH Angebot Standard",
    "PH Auftragsbestaetigung": "PH Auftragsbestaetigung Standard",
    "PH Rechnung": "PH Rechnung Standard",
    "PH Gutschrift": "PH Gutschrift Standard",
    "PH Mahnung": "PH Mahnung Standard",
    "PH Export Lauf": "PH Export Uebergabeprotokoll",
}


def print_format_fuer(doc):
    if doc.doctype == "PH Rechnung" and doc.get("art") == "Anzahlungsrechnung" and frappe.db.exists("Print Format", "PH Rechnung Anzahlung"):
        return "PH Rechnung Anzahlung"
    pf = PRINT_FORMATS.get(doc.doctype)
    return pf if pf and frappe.db.exists("Print Format", pf) else None


def pdf_bytes(doc):
    """PDF des Belegs: fixierte Datei (Feld pdf) bevorzugt, sonst frisch gerendert."""
    if doc.get("pdf"):
        try:
            return frappe.get_doc("File", {"file_url": doc.pdf}).get_content()
        except Exception:  # noqa: BLE001
            pass
    return frappe.get_print(doc.doctype, doc.name, print_format_fuer(doc), as_pdf=True, letterhead="PLATZHIRSCH" if frappe.db.exists("Letter Head", "PLATZHIRSCH") else None)


def pdf_fixieren(doc, feld="pdf"):
    """Rendert das PDF und hängt es unveränderlich an (Rechnung/Gutschrift beim Stellen). Fehler werden
    protokolliert, nie geworfen (wkhtmltopdf kann auf Staging fehlen)."""
    try:
        inhalt = frappe.get_print(doc.doctype, doc.name, print_format_fuer(doc), as_pdf=True)
        datei = frappe.get_doc(
            {
                "doctype": "File",
                "file_name": f"{doc.name}.pdf",
                "attached_to_doctype": doc.doctype,
                "attached_to_name": doc.name,
                "attached_to_field": feld,
                "is_private": 1,
                "content": inhalt,
            }
        )
        datei.flags.ignore_permissions = True
        datei.insert(ignore_permissions=True)
        doc.db_set(feld, datei.file_url, update_modified=False)
        return datei.file_url
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Faktura: PDF für {doc.doctype} {doc.name} konnte nicht fixiert werden")
        return None


def senden(doc, empfaenger, betreff=None, nachricht=None, feld_gesendet="gesendet_am"):
    """Beleg als PDF per Mail senden. Setzt gesendet_am. → True"""
    if not empfaenger:
        frappe.throw(_("Empfängeradresse fehlt."))
    from ph_core.utils.mail import sende

    pdf = pdf_bytes(doc)
    art = _(doc.doctype.replace("PH ", "").replace("Auftragsbestaetigung", "Auftragsbestätigung"))
    betreff = betreff or f"{art} {doc.name} – Platzhirsch"
    anrede = _("Guten Tag") + (f" {doc.get('kunde_name')}" if doc.get("kunde_name") else "") + ","
    text = nachricht or _("anbei erhalten Sie {0} {1} als PDF.").format(art, doc.name)
    html = f"<p>{frappe.utils.escape_html(anrede)}</p><p>{frappe.utils.escape_html(text).replace(chr(10), '<br>')}</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>"
    sende(empfaenger, betreff, html, text=f"{anrede}\n\n{text}", anhaenge=[{"fname": f"{doc.name}.pdf", "fcontent": pdf}], referenz_doctype=doc.doctype, referenz_name=doc.name)
    if doc.meta.has_field(feld_gesendet):
        doc.db_set(feld_gesendet, now_datetime(), update_modified=False)
    doc.add_comment("Info", _("Als PDF gesendet an {0}").format(frappe.utils.escape_html(empfaenger)))
    return True
