"""PH Terminart – buchbare Terminart der Website (Spec online-termin-video.md B7, types.js)."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

from ph_crm.utils.slots import Terminregel

MODI = ("Showroom", "Vor Ort", "Video", "Telefon")
# Website-Vokabular (src/lib/booking/types.js MODI) ↔ interne Select-Werte
MODUS_VON_WEBSITE = {"studio": "Showroom", "video": "Video", "vor_ort": "Vor Ort", "telefon": "Telefon"}
MODUS_NACH_WEBSITE = {v: k for k, v in MODUS_VON_WEBSITE.items()}
KEY_RE = re.compile(r"^[a-z][a-z0-9_]{1,40}$")
ZEIT_RE = re.compile(r"^\d{2}:\d{2}$")


def liste(wert):
    return [x.strip() for x in str(wert or "").split(",") if x.strip()]


class PHTerminart(Document):
    def validate(self):
        self.key = (self.key or "").strip().lower()
        if not KEY_RE.match(self.key):
            frappe.throw(_("Schlüssel nur Kleinbuchstaben, Ziffern, Unterstrich (z. B. vor_ort)."))
        if (self.dauer_min or 0) < 15:
            frappe.throw(_("Dauer mindestens 15 Minuten."))
        if not self.modus:
            modi = liste(self.modi_erlaubt)
            if not modi:
                frappe.throw(_("Ohne festen Modus müssen erlaubte Modi angegeben sein (z. B. Showroom,Video)."))
            falsch = [m for m in modi if m not in MODI]
            if falsch:
                frappe.throw(_("Unbekannter Modus: {0}. Erlaubt: {1}").format(", ".join(falsch), ", ".join(MODI)))
        for z in liste(self.feste_startzeiten):
            if not ZEIT_RE.match(z):
                frappe.throw(_("Feste Startzeit {0} nicht im Format HH:MM.").format(z))
        for w in liste(self.wochentage):
            if not w.isdigit() or int(w) > 6:
                frappe.throw(_("Wochentage als Zahlen 0 (Montag) bis 6 (Sonntag)."))
        gesehen = set()
        for z in self.berater:
            if z.user in gesehen:
                frappe.throw(_("Berater {0} ist doppelt eingetragen.").format(z.user))
            gesehen.add(z.user)

    def modi(self):
        return [self.modus] if self.modus else liste(self.modi_erlaubt)

    def modus_aufloesen(self, website_modus):
        """Website-Wert (studio/video/vor_ort) oder interner Wert → interner Modus oder None."""
        intern = MODUS_VON_WEBSITE.get(str(website_modus or "").lower(), website_modus)
        if self.modus:
            return self.modus if not website_modus or intern == self.modus else None
        return intern if intern in self.modi() else None

    def regel(self):
        return Terminregel(
            dauer_min=self.dauer_min,
            puffer_min=self.puffer_min or 0,
            anfahrt_min=self.anfahrt_min or 0,
            vorlauf_stunden=self.vorlauf_stunden or 0,
            max_tage_voraus=self.max_tage_voraus or 60,
            feste_startzeiten=liste(self.feste_startzeiten),
            wochentage=[int(w) for w in liste(self.wochentage)],
        )

    def berater_liste(self):
        return [z.user for z in self.berater if z.aktiv]

    def titel(self, sprache="de"):
        return self.get(f"titel_{(sprache or 'de')[:2]}") or self.titel_de

    def fuer_website(self, sprache="de"):
        """Antwortform get_terminarten (Spec B3 Nr. 1)."""
        return {
            "key": self.key,
            "titel": self.titel(sprache),
            "modus": MODUS_NACH_WEBSITE.get(self.modus) if self.modus else None,
            "modi": [MODUS_NACH_WEBSITE.get(m, m) for m in self.modi()],
            "themen": liste(self.themen),
            "dauer_min": self.dauer_min,
            "puffer_min": self.puffer_min or 0,
            "bestaetigung": "sofort" if self.bestaetigung == "automatisch" else "anfrage",
            "berater": [{"id": z.user, "vorname": z.anzeigename or "", "foto_url": z.foto_url or None} for z in self.berater if z.aktiv],
        }
