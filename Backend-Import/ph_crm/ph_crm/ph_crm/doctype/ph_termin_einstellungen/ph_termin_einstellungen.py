"""PH Termin Einstellungen (Single) – gecachter Zugriff für API, Scheduler und Slot-Berechnung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate

CACHE = "ph_crm:termin_einstellungen"


class PHTerminEinstellungen(Document):
    def validate(self):
        if (self.reservierung_min or 0) < 5:
            frappe.throw(_("Reservierung mindestens 5 Minuten."))
        if (self.max_abfrage_tage or 0) < 1:
            self.max_abfrage_tage = 31
        if self.meet_aktiv and not self.meet_basis_url:
            frappe.throw(_("Für Meet-Räume ist die Meet-Site-URL nötig."))
        self.meet_basis_url = (self.meet_basis_url or "").rstrip("/")
        gesehen = set()
        for z in self.feiertage:
            if z.datum in gesehen:
                frappe.throw(_("Feiertag {0} ist doppelt.").format(z.datum))
            gesehen.add(z.datum)

    def on_update(self):
        frappe.cache().delete_value(CACHE)

    @frappe.whitelist()
    def meet_verbindung_pruefen(self):
        """Knopf „Verbindung prüfen“ (Tab Videoberatung): Meet-Site erreichbar und Schlüssel gültig?"""
        frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin"))
        if not self.meet_basis_url:
            return {"ok": False, "meldung": _("Keine Meet-Site-URL eingetragen.")}
        token = frappe.conf.get(self.meet_schluesselname or "ph_meet_api_token")
        if not token:
            return {"ok": False, "meldung": _("Schlüssel {0} fehlt in site_config.json.").format(self.meet_schluesselname or "ph_meet_api_token")}
        try:
            from frappe.integrations.utils import make_get_request

            antwort = make_get_request(f"{self.meet_basis_url.rstrip('/')}/api/method/frappe.auth.get_logged_user", headers={"Authorization": f"token {token}"})
            return {"ok": True, "meldung": _("Verbindung ok – angemeldet als {0}.").format((antwort or {}).get("message"))}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "meldung": _("Keine Verbindung: {0}").format(str(e)[:200])}


def _an(wert):
    return 1 if wert is None else int(wert)


def einstellungen():
    data = frappe.cache().get_value(CACHE)
    if not data:
        doc = frappe.get_cached_doc("PH Termin Einstellungen")
        data = {
            "zeitzone": doc.zeitzone or "Europe/Vienna",
            "reservierung_min": int(doc.reservierung_min or 30),
            "max_abfrage_tage": int(doc.max_abfrage_tage or 31),
            "event_anlegen": int(doc.event_anlegen or 0),
            "leitung_user": doc.leitung_user,
            "anfragen_erinnerung_stunden": int(doc.anfragen_erinnerung_stunden or 24),
            "erinnerung_aktiv": int(doc.erinnerung_aktiv or 0),
            "erinnerung_stunden": int(doc.erinnerung_stunden or 24),
            "vorlage_bestaetigung": doc.vorlage_bestaetigung,
            "vorlage_absage": doc.vorlage_absage,
            "vorlage_erinnerung": doc.vorlage_erinnerung,
            "meet_aktiv": int(doc.meet_aktiv or 0),
            "meet_basis_url": doc.meet_basis_url,
            "meet_schluesselname": doc.meet_schluesselname or "ph_meet_api_token",
            "meet_link_ab_min": int(doc.meet_link_ab_min or 15),
            "feiertage": {str(z.datum): z.bezeichnung for z in doc.feiertage},
            # Automationen R1–R8 (Konzept CRM §8.2); ungesetzt = an
            **{k: _an(doc.get(k)) for k in ("auto_wiedervorlage", "auto_ruhend", "auto_termin_abschluss", "auto_no_show", "auto_vortag", "auto_gewonnen", "auto_duplikat")},
            "ruhe_schwellen": {"Neu": 1, "Qualifiziert": int(doc.get("ruhe_qualifiziert_tage") or 7), "Termin vereinbart": int(doc.get("ruhe_termin_tage") or 14), "Angebot": int(doc.get("ruhe_angebot_tage") or 21)},
            "duplikat_tage": int(doc.get("duplikat_tage") or 7),
            "oeffnungszeiten": [(int(str(z.wochentag).split()[0]), str(z.von), str(z.bis)) for z in doc.oeffnungszeiten],
        }
        frappe.cache().set_value(CACHE, data)
    return data


def ist_geschlossen(tag):
    """Feiertag laut Einstellungen; Rückfall auf die österreichischen Feiertage (utils.feiertage)."""
    from ph_crm.utils.feiertage import ist_feiertag

    e = einstellungen()
    if e["feiertage"]:
        return str(getdate(tag)) in e["feiertage"]
    return ist_feiertag(getdate(tag))


def oeffnungsfenster(tag):
    """[(von, bis)] der Studio-Öffnungszeiten an einem Datum (Rückfall ohne Berater)."""
    wd = getdate(tag).weekday()
    return [(von, bis) for w, von, bis in einstellungen()["oeffnungszeiten"] if w == wd]
