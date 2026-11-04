"""PH Verfuegbarkeit – Wochenplan je Berater. Wochentag wird als '0 Montag' … '6 Sonntag' gespeichert
(erste Ziffer = Python weekday())."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate

WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]


def wochentag_nr(wert):
    return int(str(wert or "0").split()[0])


class PHVerfuegbarkeit(Document):
    def validate(self):
        if self.von and self.bis and str(self.von) >= str(self.bis):
            frappe.throw(_("„Bis“ muss nach „Von“ liegen."))
        if self.gueltig_von and self.gueltig_bis and getdate(self.gueltig_von) > getdate(self.gueltig_bis):
            frappe.throw(_("„Gültig bis“ liegt vor „Gültig von“."))
        self.titel = f"{frappe.db.get_value('User', self.user, 'full_name') or self.user} · {WOCHENTAGE[wochentag_nr(self.wochentag)]} {str(self.von)[:5]}–{str(self.bis)[:5]}" + (f" · {self.modus}" if self.modus else "")
        self.pruefe_ueberschneidung()

    def pruefe_ueberschneidung(self):
        andere = frappe.get_all(
            "PH Verfuegbarkeit",
            filters={"user": self.user, "wochentag": self.wochentag, "aktiv": 1, "name": ("!=", self.name or ""), "modus": self.modus or ""},
            fields=["name", "von", "bis"],
        )
        for a in andere:
            if str(a.von) < str(self.bis) and str(self.von) < str(a.bis):
                frappe.throw(_("Überschneidung mit Verfügbarkeit {0} ({1}–{2}).").format(a.name, str(a.von)[:5], str(a.bis)[:5]))


def fenster(user, tag, modus=None):
    """[(von, bis)] eines Beraters an einem Datum (aktive Zeilen, Gültigkeit, Modus oder leer)."""
    zeilen = frappe.get_all(
        "PH Verfuegbarkeit",
        filters={"user": user, "aktiv": 1, "wochentag": ("like", f"{tag.weekday()} %")},
        fields=["von", "bis", "modus", "gueltig_von", "gueltig_bis"],
    )
    out = []
    for z in zeilen:
        if z.modus and modus and z.modus != modus:
            continue
        if z.gueltig_von and getdate(z.gueltig_von) > tag:
            continue
        if z.gueltig_bis and getdate(z.gueltig_bis) < tag:
            continue
        out.append((z.von, z.bis))
    return out


def berater_mit_verfuegbarkeit(modus=None):
    filters = {"aktiv": 1}
    zeilen = frappe.get_all("PH Verfuegbarkeit", filters=filters, fields=["user", "modus"], distinct=True)
    return sorted({z.user for z in zeilen if not modus or not z.modus or z.modus == modus})
