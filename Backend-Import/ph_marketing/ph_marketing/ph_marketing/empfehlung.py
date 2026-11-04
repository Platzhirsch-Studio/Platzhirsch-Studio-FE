"""Empfehlungsprogramm „Unter Freunden“ (Website /[locale]/empfehlen, src/lib/kundenbetreuung/empfehlung.js).

Ablauf (Generator-README): 1. Kunde fordert Code an (PH Anfrage mit „Kontext: Empfehlungsprogramm“) → ToDo. 2. Team prüft
Auftrag, legt PH Empfehlung an → Code; code_senden(). 3. Empfohlene Person meldet sich mit Code UND Einwilligung → Status
„Anfrage eingegangen“. 4. Erster Auftrag → „Auftrag erteilt“, Frist. 5. Frist abgelaufen → „Gutschein faellig“ + ToDo;
Gutschein stellt ph_shop aus, gutschein_senden() schickt die Danke-Mail. Platzhirsch schreibt nie eine nur genannte Person an.
"""

import re
import secrets

import frappe
from frappe import _
from frappe.utils import add_days, cint, escape_html, getdate, now_datetime, nowdate

from ph_core.utils.druck import ph_betrag
from ph_marketing.ph_marketing import versand
from ph_marketing.ph_marketing.einstellungen import einstellungen

ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
CODE_RE = re.compile(r"\bEMP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}\b")


def neuer_code():
    for _i in range(20):
        code = "EMP-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if not frappe.db.exists("PH Empfehlung", code):
            return code
    frappe.throw(_("Kein freier Empfehlungscode gefunden"))


def anfrage_eingang(doc, method=None):
    """doc_events PH Anfrage after_insert: Empfehlungskontext erkennen (Website schreibt ihn ins Anliegen)."""
    text = frappe.utils.strip_html(doc.get("anliegen") or "")
    if "Empfehlungsprogramm" not in text:
        return
    email = (doc.get("email") or "").strip().lower()
    if "Empfehler fordert Code an" in text:
        frappe.get_doc({"doctype": "ToDo", "description": _("Empfehlungscode angefordert ({0}). Eigenen Auftrag prüfen, dann PH Empfehlung anlegen und Code senden.").format(email), "reference_type": doc.doctype, "reference_name": doc.name, "role": "PH Marketing Mitarbeiter"}).insert(ignore_permissions=True)
        return
    m = CODE_RE.search(text)
    if not m or "eingewilligt" not in text:
        return
    code = m.group(0)
    if not frappe.db.exists("PH Empfehlung", code):
        return
    e = frappe.get_doc("PH Empfehlung", code)
    if e.status != "Code ausgegeben" or (e.empfehler_email or "").lower() == email:
        e.add_comment("Comment", _("Weitere Anfrage mit diesem Code: {0}").format(doc.name))
        return
    e.update({"status": "Anfrage eingegangen", "empfohlen_email": email, "empfohlen_name": " ".join(x for x in (doc.get("vorname"), doc.get("nachname")) if x), "einwilligung_empfohlen": 1, "einwilligung_zeit": now_datetime(), "anfrage": doc.name})
    e.save(ignore_permissions=True)


def _wert():
    s = einstellungen()
    return ph_betrag(s["empfehlung_gutschein_cent"]) if s["empfehlung_gutschein_cent"] else ""


def code_senden(e):
    s = einstellungen()
    ctx = {"anrede": versand.anrede_fuer(e.empfehler_name), "code": e.code, "teilen_url": versand.website_url(f"/de/empfehlen?code={e.code}"), "gutschein_wert": _wert(), "bedingungen_url": s["empfehlung_bedingungen_url"] or "", "berater_name": escape_html(frappe.utils.get_fullname(frappe.session.user))}
    betreff, html = versand.rendern("empfehlung_code", ctx)
    versand.sende(e.empfehler_email, betreff, html, referenz_doctype="PH Empfehlung", referenz_name=e.name)
    e.db_set("code_gesendet_am", now_datetime())


def gutschein_senden(e, gutschein_code):
    if e.status != "Gutschein faellig":
        frappe.throw(_("Gutschein erst nach Ablauf der Rücktrittsfrist"))
    ctx = {"anrede": versand.anrede_fuer(e.empfehler_name), "gutschein_code": escape_html(gutschein_code), "gutschein_wert": _wert()}
    betreff, html = versand.rendern("empfehlung_danke", ctx)
    versand.sende(e.empfehler_email, betreff, html, referenz_doctype="PH Empfehlung", referenz_name=e.name)
    e.db_set({"status": "Gutschein ausgegeben", "gutschein_code_letzte4": gutschein_code[-4:], "gutschein_ausgegeben_am": nowdate()})


def empfehlungen_pruefen():
    heute = getdate(nowdate())
    for name in frappe.get_all("PH Empfehlung", filters={"status": "Auftrag erteilt", "ruecktritt_ende": ("<", heute)}, pluck="name"):
        e = frappe.get_doc("PH Empfehlung", name)
        e.db_set("status", "Gutschein faellig")
        frappe.get_doc({"doctype": "ToDo", "description": _("Empfehlung {0}: Rücktrittsfrist vorbei. Auftrag {1} prüfen (nicht storniert?), Gutschein in ph_shop ausstellen und senden.").format(e.code, e.auftrag), "reference_type": "PH Empfehlung", "reference_name": e.name, "role": "PH Marketing Leitung"}).insert(ignore_permissions=True)
    frappe.db.commit()


def frist_setzen(doc):
    if doc.auftrag and doc.auftrag_datum and doc.status in ("Code ausgegeben", "Anfrage eingegangen"):
        if not cint(doc.einwilligung_empfohlen):
            frappe.throw(_("Ohne Einwilligung der empfohlenen Person keine Zuordnung des Auftrags"))
        doc.status = "Auftrag erteilt"
        doc.ruecktritt_ende = add_days(doc.auftrag_datum, einstellungen()["empfehlung_ruecktritt_tage"])
