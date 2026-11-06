"""PH Geraet – registrierte Arbeitsplatz-Geräte des Backoffice (Nr. 49).

Token-Logik ohne Frappe in ph_core/utils/geraete.py; hier nur Persistenz und Dokumentmethoden.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, now_datetime

from ph_core.utils.geraete import ARBEITSPLAETZE, DRUCKER_TYPEN, GERAETE_TYPEN, arbeitsplatz_fuer_typ, neues_token, token_hash

# zuletzt_gesehen höchstens alle 60 s schreiben (Kiosk pingt oft).
BERUEHREN_ABSTAND_SEKUNDEN = 60
MAX_TEXT = 140


class PHGeraet(Document):
    def before_insert(self):
        self.registriert_am = self.registriert_am or now_datetime()
        self.registriert_durch = self.registriert_durch or frappe.session.user
        if self.aktiv is None:
            self.aktiv = 1

    def validate(self):
        self.geraetename = (self.geraetename or "").strip()[:MAX_TEXT]
        if not self.geraetename:
            frappe.throw(_("Gerätename fehlt."))
        if self.typ not in GERAETE_TYPEN:
            frappe.throw(_("Unbekannter Gerätetyp: {0}").format(self.typ))
        self.arbeitsplatz = arbeitsplatz_fuer_typ(self.typ, self.arbeitsplatz)
        if self.arbeitsplatz not in ARBEITSPLAETZE:
            frappe.throw(_("Unbekannter Arbeitsplatz: {0}").format(self.arbeitsplatz))
        self.standort = (self.standort or "").strip()[:MAX_TEXT] or "Showroom Lochau"
        self.kasse = (self.kasse or "").strip()[:MAX_TEXT] or None
        self.drucker = (self.drucker or "").strip()[:MAX_TEXT] or None
        if self.drucker_typ and self.drucker_typ not in DRUCKER_TYPEN:
            frappe.throw(_("Unbekannter Druckertyp: {0}").format(self.drucker_typ))
        if self.typ == "Kassa" and self.drucker and not self.drucker_typ:
            self.drucker_typ = "Bon 80 mm"
        if self.typ != "Kassa":
            self.kasse = None
        self._kasse_pruefen()
        self.token_vorhanden = 1 if self.token_hash else 0
        if self.aktiv:
            self.gesperrt_grund = None
        elif not self.gesperrt_grund:
            self.gesperrt_grund = _("Gesperrt")

    def _kasse_pruefen(self):
        # ph_kassa wird nach ph_core installiert – deshalb Data statt Link (CONVENTIONS 10).
        if not self.kasse or not frappe.db.exists("DocType", "PH Kasse"):
            return
        if not frappe.db.exists("PH Kasse", self.kasse):
            frappe.throw(_("Kasse {0} gibt es nicht (PH Kasse, Kassenidentifikationsnummer).").format(self.kasse))

    # ── Dokumentmethoden (Buttons, API) ───────────────────────────────────────────────────────────

    @frappe.whitelist()
    def registrieren(self):
        """Erstes Token erzeugen. Rückgabe {"token", "geraet"} – der Klartext erscheint genau einmal."""
        self.check_permission("write")
        if self.token_hash:
            frappe.throw(_("Dieses Gerät hat bereits ein Token. „Token erneuern“ macht das alte ungültig."))
        return self._token_setzen()

    @frappe.whitelist()
    def token_erneuern(self):
        """Neues Token, altes wird sofort ungültig (Gerät verloren, Cookie gelöscht)."""
        self.check_permission("write")
        return self._token_setzen()

    def _token_setzen(self):
        token = neues_token()
        self.db_set(
            {"token_hash": token_hash(token), "token_vorhanden": 1, "registriert_am": now_datetime(), "registriert_durch": frappe.session.user},
            notify=True,
        )
        self.add_comment("Info", _("Geräte-Token ausgestellt durch {0}").format(frappe.session.user))
        return {"token": token, "geraet": self.name, "arbeitsplatz": self.arbeitsplatz}

    @frappe.whitelist()
    def sperren(self, grund=None):
        self.check_permission("write")
        self.db_set({"aktiv": 0, "gesperrt_grund": (str(grund or "").strip() or _("Gesperrt"))[:MAX_TEXT]}, notify=True)
        self.add_comment("Info", _("Gerät gesperrt: {0}").format(self.gesperrt_grund))
        return {"geraet": self.name, "aktiv": 0}

    @frappe.whitelist()
    def entsperren(self):
        self.check_permission("write")
        self.db_set({"aktiv": 1, "gesperrt_grund": None}, notify=True)
        self.add_comment("Info", _("Gerät entsperrt"))
        return {"geraet": self.name, "aktiv": 1}


# ── Hilfen für die API (ph_core.api.geraete / bediener) ─────────────────────────────────────────

FELDER_OEFFENTLICH = ["name", "geraetename", "typ", "arbeitsplatz", "standort", "kasse", "drucker", "drucker_typ", "aktiv", "gesperrt_grund", "zuletzt_gesehen"]


def geraet_per_token(token):
    """Gerätedaten (ohne Hash) zu einem Token oder None. Prüft NICHT `aktiv` – das macht der Aufrufer."""
    h = token_hash(token)
    if not h:
        return None
    return frappe.db.get_value("PH Geraet", {"token_hash": h}, FELDER_OEFFENTLICH, as_dict=True)


def beruehren(name, ip_hash=None):
    """zuletzt_gesehen/zuletzt_ip_hash setzen, gedrosselt (ohne Versionseintrag, ohne modified)."""
    jetzt = now_datetime()
    alt = frappe.db.get_value("PH Geraet", name, "zuletzt_gesehen")
    if alt and alt > add_to_date(jetzt, seconds=-BERUEHREN_ABSTAND_SEKUNDEN):
        return alt
    frappe.db.set_value("PH Geraet", name, {"zuletzt_gesehen": jetzt, "zuletzt_ip_hash": ip_hash}, update_modified=False)
    return jetzt


def oeffentlich(zeile):
    """Antwortform der API: Gerätedaten ohne Hashes, Zeiten als ISO 8601."""
    z = dict(zeile or {})
    return {
        "geraet": z.get("name"),
        "geraetename": z.get("geraetename"),
        "typ": z.get("typ"),
        "arbeitsplatz": z.get("arbeitsplatz"),
        "standort": z.get("standort"),
        "kasse": z.get("kasse"),
        "drucker": z.get("drucker"),
        "drucker_typ": z.get("drucker_typ"),
        "aktiv": int(z.get("aktiv") or 0),
        "gesperrt_grund": z.get("gesperrt_grund") if not z.get("aktiv") else None,
        "zuletzt_gesehen": z["zuletzt_gesehen"].isoformat() if z.get("zuletzt_gesehen") else None,
    }
