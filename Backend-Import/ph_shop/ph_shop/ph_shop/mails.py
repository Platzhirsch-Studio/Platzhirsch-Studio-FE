"""Kundenmails des Shops über Email-Template-Fixtures (fixtures/email_template.json).

Regeln: Versand über ph_core.utils.mail.sende (Testmodus-Umleitung von ph_core); zusätzlich leitet
PH Shop Einstellungen.shop_modus != live an testmodus_mail_an um und setzt [TEST] in den Betreff –
wie src/lib/shop/orderMail.js (test → nur Mock-Mailer). Rechtstexte (AGB, Widerrufsbelehrung,
Gewährleistungs-Mitteilung) kommen aus PH Shop Einstellungen und gehen als Textanhang mit
(§ 11 Abs 1 ECG: speicherbar und wiedergabefähig).
"""

import frappe
from frappe.utils import now_datetime, strip_html

VORLAGEN = {
    "bestellbestaetigung": "PH Shop Bestellbestätigung",
    "abholbereit": "PH Shop Abholbereit",
    "zahlung_fehlgeschlagen": "PH Shop Zahlung fehlgeschlagen",
    "reservierung_abgelaufen": "PH Shop Reservierung abgelaufen",
    "gutschein": "PH Gutschein Versand",
    "widerruf": "PH Widerruf Eingangsbestätigung",
    "anzahlung_erhalten": "PH Anzahlung erhalten",
    "anzahlung_link": "PH Anzahlung Zahlungslink",
    "team_hinweis": "PH Shop Teamhinweis",
}


def shop_einstellungen():
    return frappe.get_cached_doc("PH Shop Einstellungen")


def kontext_basis():
    from ph_core.utils.druck import ph_betrag, ph_datum, ph_firma

    einst = shop_einstellungen()
    return {
        "firma": ph_firma(),
        "einst": einst,
        "ph_betrag": ph_betrag,
        "ph_datum": ph_datum,
        "website": frappe.get_cached_value("PH Einstellungen", None, "website_url") or "https://platzhirsch.studio",
        "test": einst.shop_modus != "live",
    }


def rendern(schluessel, kontext):
    """→ (betreff, html, text) aus der Vorlage; fehlt die Vorlage, wird ein knapper Standardtext gebaut."""
    name = VORLAGEN[schluessel]
    ctx = {**kontext_basis(), **kontext}
    if frappe.db.exists("Email Template", name):
        tpl = frappe.get_cached_doc("Email Template", name)
        betreff = frappe.render_template(tpl.subject or name, ctx)
        html = frappe.render_template(tpl.response_html if tpl.use_html else (tpl.response or ""), ctx)
    else:
        betreff = name
        html = f"<p>{frappe.utils.escape_html(name)}</p>"
    if ctx["test"] and not betreff.startswith("[TEST]"):
        betreff = f"[TEST] {betreff}"
    return betreff, html, strip_html(html.replace("<br>", "\n").replace("</p>", "\n"))


def senden(schluessel, empfaenger, kontext, anhaenge=None, referenz_doctype=None, referenz_name=None):
    """Mail senden. Gibt True/False zurück, wirft nie (Fehler → Error Log)."""
    from ph_core.utils.mail import sende

    try:
        einst = shop_einstellungen()
        betreff, html, text = rendern(schluessel, kontext)
        if einst.shop_modus != "live":
            empfaenger = einst.testmodus_mail_an or frappe.get_cached_value("PH Einstellungen", None, "team_email")
        if not empfaenger:
            return False
        sende(empfaenger, betreff, html, text=text, anhaenge=anhaenge or [], referenz_doctype=referenz_doctype, referenz_name=referenz_name)
        return True
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_shop Mail {schluessel} fehlgeschlagen")
        return False


def rechtstext_anhaenge():
    """AGB, Widerrufsbelehrung (+ Muster-Formular) und Versandbedingungen als .txt (orderMail.js anhaenge)."""
    einst = shop_einstellungen()
    out = []
    if (einst.get("rechtstexte_status") or "kanzlei-offen") != "freigegeben":
        # Slots wie src/lib/shop/legal.js: nur freigegebene Texte gehen an Kunden (die Website blockiert den Checkout ebenso).
        frappe.log_error(title="ph_shop: Rechtstexte nicht freigegeben – Bestellbestätigung ohne Anhänge", message=f"rechtstexte_status={einst.get('rechtstexte_status')}")
        return out
    for fname, feld in (("AGB-Onlineshop.txt", ("agb_text",)), ("Widerrufsbelehrung-und-Formular.txt", ("widerrufsbelehrung_text", "widerrufsformular_text")), ("Versandbedingungen.txt", ("versandbedingungen_text",))):
        roh = "\n\n".join(einst.get(f) or "" for f in feld)
        txt = strip_html(roh.replace("<br>", "\n").replace("</p>", "\n\n"))
        if txt.strip():
            out.append({"fname": fname, "fcontent": txt.encode("utf-8")})
    return out


def team_hinweis(betreff, zeilen, referenz_doctype=None, referenz_name=None):
    """Interner Hinweis an das Team-Postfach (z. B. doppelte Anzahlung, Dispute)."""
    team = frappe.get_cached_value("PH Einstellungen", None, "team_email")
    return senden("team_hinweis", team, {"betreff": betreff, "zeilen": zeilen, "jetzt": now_datetime()}, referenz_doctype=referenz_doctype, referenz_name=referenz_name)


def aufgabe(beschreibung, referenz_doctype=None, referenz_name=None, rolle="PH Shop Leitung", prioritaet="High"):
    """ToDo an alle Benutzer einer Rolle (Dispute, Abweichung beim Abgleich, Prüffälle)."""
    benutzer = [u for u in frappe.get_all("Has Role", {"role": rolle, "parenttype": "User"}, pluck="parent") if u != "Administrator" and frappe.db.get_value("User", u, "enabled")]
    if not benutzer:
        benutzer = ["Administrator"]
    for u in benutzer[:5]:
        try:
            frappe.get_doc({"doctype": "ToDo", "allocated_to": u, "description": beschreibung, "priority": prioritaet, "reference_type": referenz_doctype, "reference_name": referenz_name, "assigned_by": "Administrator"}).insert(ignore_permissions=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="ph_shop Aufgabe konnte nicht angelegt werden")
