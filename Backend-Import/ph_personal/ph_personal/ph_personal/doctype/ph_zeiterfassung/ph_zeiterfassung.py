"""PH Zeiterfassung – Tagesbuchung Kommen/Gehen. Stempeln über ph_personal.api.stempeln,
Monatsübersicht für Mitarbeiter-Button, Druckformat und Bericht PH Monatsstunden."""

import calendar
from datetime import date, timedelta

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_time, getdate, now_datetime, nowdate

from ph_personal.logik import arbeitstage, dauer_minuten, minuten_text, soll_minuten_monat

WARNUNG_AB_MIN = 600  # 10 h netto: Hinweis (AZG § 9 Normalarbeitszeit max. 10 h/Tag)


class PHZeiterfassung(Document):
    def validate(self):
        if getdate(self.datum) > getdate(nowdate()):
            frappe.throw(_("Zeitbuchungen in der Zukunft sind nicht möglich."))
        self.pause_min = max(0, cint(self.pause_min))
        if self.gehen:
            if get_time(self.gehen) <= get_time(self.kommen):
                frappe.throw(_("„Gehen“ muss nach „Kommen“ liegen (Nachtschichten als zwei Buchungen erfassen)."))
            self._pause_vorschlag()
            self.dauer_min = dauer_minuten(get_time(self.kommen), get_time(self.gehen), self.pause_min)
            if self.dauer_min <= 0:
                frappe.throw(_("Netto-Arbeitszeit ist 0 – Pause prüfen."))
            if self.dauer_min > WARNUNG_AB_MIN:
                frappe.msgprint(_("Hinweis: {0} netto – mehr als 10 Stunden (AZG prüfen).").format(minuten_text(self.dauer_min)), indicator="orange")
        else:
            self.dauer_min = 0
        self.dauer_text = minuten_text(self.dauer_min) if self.dauer_min else ""
        self._status()
        self._ueberschneidung_pruefen()
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        self.titel = f"{name} · {frappe.format(getdate(self.datum), {'fieldtype': 'Date'})} · {self.dauer_text or _('offen')}"[:140]

    def _pause_vorschlag(self):
        if self.pause_min:
            return
        from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

        e = einstellungen()
        brutto = dauer_minuten(get_time(self.kommen), get_time(self.gehen), 0)
        if brutto > e["pause_ab_minuten"]:
            self.pause_min = e["pause_minuten"]
            frappe.msgprint(_("Pause von {0} Minuten eingetragen (mehr als 6 Stunden, AZG § 11).").format(self.pause_min), indicator="blue", alert=True)

    def _status(self):
        alt = self.get_doc_before_save()
        if not self.gehen:
            self.status = "Offen"
            return
        if alt and alt.status in ("Erfasst", "Korrigiert") and (alt.kommen != self.kommen or alt.gehen != self.gehen or alt.pause_min != self.pause_min):
            self.status = "Korrigiert"
            self.korrigiert_von = frappe.session.user
            self.korrigiert_am = now_datetime()
        elif self.status != "Korrigiert":
            self.status = "Erfasst"

    def _ueberschneidung_pruefen(self):
        andere = frappe.get_all(
            "PH Zeiterfassung",
            filters={"name": ("!=", self.name or ""), "mitarbeiter": self.mitarbeiter, "datum": self.datum},
            fields=["name", "kommen", "gehen", "status"],
        )
        for a in andere:
            if a.status == "Offen" and not self.gehen:
                frappe.throw(_("Es gibt bereits eine offene Buchung ({0}) für diesen Tag.").format(a.name))
            if a.gehen and self.gehen and get_time(a.kommen) < get_time(self.gehen) and get_time(self.kommen) < get_time(a.gehen):
                frappe.throw(_("Überschneidung mit Buchung {0} ({1}–{2}).").format(a.name, a.kommen, a.gehen))

    @frappe.whitelist()
    def gehen_jetzt(self):
        """Button „Gehen“: offene Buchung mit jetziger Uhrzeit schließen."""
        self.check_permission("write")
        if self.gehen:
            return self.status
        jetzt = now_datetime()
        if getdate(self.datum) != jetzt.date():
            frappe.throw(_("Die Buchung ist von einem anderen Tag – bitte „Gehen“ manuell eintragen."))
        self.gehen = jetzt.strftime("%H:%M:%S")
        self.save()
        return self.status


def offene_buchung(mitarbeiter, datum=None):
    return frappe.db.get_value("PH Zeiterfassung", {"mitarbeiter": mitarbeiter, "datum": datum or nowdate(), "status": "Offen"}, "name")


def monatsuebersicht(mitarbeiter, jahr, monat):
    """Soll/Ist/Saldo eines Monats mit Tagesliste und Abwesenheiten (für Button, Druck, Bericht)."""
    ma = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    von = date(jahr, monat, 1)
    bis = date(jahr, monat, calendar.monthrange(jahr, monat)[1])
    # Zeitraum auf Ein-/Austritt begrenzen
    if ma.eintritt and getdate(ma.eintritt) > von:
        von = getdate(ma.eintritt)
    if ma.austritt and getdate(ma.austritt) < bis:
        bis = getdate(ma.austritt)
    buchungen = frappe.get_all(
        "PH Zeiterfassung",
        filters={"mitarbeiter": mitarbeiter, "datum": ("between", [von, bis])},
        fields=["name", "datum", "art", "kommen", "gehen", "pause_min", "dauer_min", "dauer_text", "status", "projekt_referenz"],
        order_by="datum asc, kommen asc",
    )
    abwesenheiten = frappe.get_all(
        "PH Abwesenheit",
        filters={"mitarbeiter": mitarbeiter, "status": "Genehmigt", "von": ("<=", bis), "bis": (">=", von)},
        fields=["art", "von", "bis", "halbtags"],
    )
    wochenstunden = ma.wochenstunden_effektiv()
    tagessoll_min = int(round(wochenstunden / 5 * 60))
    urlaub = krank = sonstige = 0.0
    for a in abwesenheiten:
        tage = arbeitstage(max(getdate(a.von), von), min(getdate(a.bis), bis), halbtags=bool(a.halbtags))
        if a.art == "Urlaub":
            urlaub += tage
        elif a.art == "Krankenstand":
            krank += tage
        else:
            sonstige += tage
    soll_voll = soll_minuten_monat(wochenstunden, jahr, monat) if (von.day == 1 and bis == date(jahr, monat, calendar.monthrange(jahr, monat)[1])) else int(round(arbeitstage(von, bis) * wochenstunden / 5 * 60))
    gutschrift_min = int(round((urlaub + krank + sonstige) * tagessoll_min))
    ist = sum(b.dauer_min or 0 for b in buchungen)
    saldo = ist + gutschrift_min - soll_voll
    return {
        "mitarbeiter": mitarbeiter,
        "name": ma.titel,
        "jahr": jahr,
        "monat": monat,
        "von": von,
        "bis": bis,
        "wochenstunden": wochenstunden,
        "soll_min": soll_voll,
        "soll_text": minuten_text(soll_voll),
        "ist_min": ist,
        "ist_text": minuten_text(ist),
        "gutschrift_min": gutschrift_min,
        "gutschrift_text": minuten_text(gutschrift_min),
        "saldo_min": saldo,
        "saldo_text": minuten_text(saldo),
        "urlaub_tage": urlaub,
        "krank_tage": krank,
        "sonstige_tage": sonstige,
        "offen": sum(1 for b in buchungen if b.status == "Offen"),
        "tage": [
            {**b, "datum": str(b.datum), "kommen": str(b.kommen)[:5] if b.kommen else "", "gehen": str(b.gehen)[:5] if b.gehen else ""}
            for b in buchungen
        ],
        "arbeitstage": arbeitstage(von, bis),
    }


def vormonat(d=None):
    d = getdate(d or nowdate()).replace(day=1) - timedelta(days=1)
    return d.year, d.month
