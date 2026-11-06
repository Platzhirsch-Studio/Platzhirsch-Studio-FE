"""A14 DSGVO-Löschfristen des Marketings: Katalog utils/datenschutz.LOESCHFRISTEN anwenden und berichten.

Täglich 03:45 (tasks.datenschutz_aufraeumen). Kategorien mit eigenem Lauf bleiben dort:
newsletter_unbestaetigt/einwilligung_offen → newsletter.unbestaetigte_loeschen (03:30), event_anmeldung →
events.anmeldedaten_loeschen (08:00), mail_ereignis → mail_ereignisse.aufraeumen. Gesetzliche Aufbewahrung geht vor:
Empfehlungen mit ausgegebenem Gutschein werden nie hier gelöscht (§ 132 BAO).
"""

import frappe
from frappe.utils import add_days, now_datetime

from ph_marketing.utils.datenschutz import ANONYM_EMAIL, LOESCHFRISTEN

EIGENER_LAUF = {"newsletter_unbestaetigt": "newsletter.unbestaetigte_loeschen", "einwilligung_offen": "newsletter.unbestaetigte_loeschen", "event_anmeldung": "events.anmeldedaten_loeschen", "mail_ereignis": "mail_ereignisse.aufraeumen", "ideenboard": "ideenboard.abgelaufene_loeschen"}

FILTER = {
    "newsletter_beendet": {"status": ("in", ("Abgemeldet", "Bounce", "Beschwerde"))},
    "einwilligung_widerrufen": {"status": "Widerrufen"},
    "newsletter_versand": {"email": ("!=", ANONYM_EMAIL)},
    "reise_versand": {"empfaenger": ("!=", ANONYM_EMAIL)},
    "kampagne_kontaktpunkt": {"email": ("is", "set")},
    "empfehlung_ohne_gutschein": {"gutschein_ausgegeben_am": ("is", "not set")},
    "newsletter_unbestaetigt": {"status": "Angemeldet unbestaetigt"},
    "einwilligung_offen": {"status": "Offen"},
    "event_anmeldung": {"status": ("in", ("Durchgefuehrt", "Abgesagt")), "anmeldungen_geloescht_am": ("is", "not set")},
    "mail_ereignis": {},
    "ideenboard": {},
    "bewertung_direkt": {"quelle": ("!=", "Google"), "status": ("!=", "Veroeffentlicht"), "email": ("is", "set")},
}
ANONYM = {
    "newsletter_versand": {"email": ANONYM_EMAIL, "abo": None, "nachricht_id": None},
    "reise_versand": {"empfaenger": ANONYM_EMAIL, "kontext_json": None, "referenz_doctype": None, "referenz_name": None},
    "kampagne_kontaktpunkt": {"email": None, "kontakt": None, "klick_id": None},
    "bewertung_direkt": {"autor_name": None, "email": None, "kontakt": None, "ip_hash": None, "autor_anzeige": "Kundin/Kunde"},
}


def _faellig(kategorie, limit=None):
    doctype, tage, _aktion, feld, _g = LOESCHFRISTEN[kategorie]
    if not frappe.db.exists("DocType", doctype):
        return []
    f = dict(FILTER.get(kategorie, {}))
    f[feld] = ("<", add_days(now_datetime(), -tage))
    return frappe.get_all(doctype, filters=f, pluck="name", limit=limit or 0)


def anwenden(limit=2000):
    """→ {kategorie: anzahl}. Nur Kategorien ohne eigenen Lauf."""
    erg = {}
    for k, (doctype, _t, aktion, _f, _g) in LOESCHFRISTEN.items():
        if k in EIGENER_LAUF:
            continue
        n = 0
        for name in _faellig(k, limit):
            try:
                if aktion == "loeschen":
                    frappe.delete_doc(doctype, name, ignore_permissions=True, force=True)
                elif aktion == "anonymisieren":
                    frappe.db.set_value(doctype, name, ANONYM[k], update_modified=False)
                n += 1
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Marketing Löschfrist {k} {name}")
        frappe.db.commit()
        erg[k] = n
    return erg


def uebersicht():
    """Für Report/Verarbeitungsverzeichnis: Kategorie, DocType, Frist, Aktion, Grundlage, derzeit fällig."""
    zeilen = []
    for k, (doctype, tage, aktion, feld, grundlage) in LOESCHFRISTEN.items():
        zeilen.append({"kategorie": k, "doctype": doctype, "frist_tage": tage, "aktion": aktion, "bezug": feld, "grundlage": grundlage, "faellig": len(_faellig(k, 10000)), "lauf": EIGENER_LAUF.get(k, "loeschfristen.anwenden")})
    return zeilen
