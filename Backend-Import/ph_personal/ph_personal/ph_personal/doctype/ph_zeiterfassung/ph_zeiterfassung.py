"""PH Zeiterfassung – Tagesbuchung Kommen/Gehen. Stempeln über ph_personal.api.stempeln,
Monatsübersicht für Mitarbeiter-Button, Druckformat und Bericht PH Monatsstunden.

AZG § 26 (richtige Aufzeichnung, Fachkritik R9): Selbstservice ändert nur Buchungen des laufenden Tages;
ältere Korrekturen laufen als Korrekturantrag (korrektur_beantragen → Leitung entscheidet). Automatisch
vorgeschlagene Pausen gelten erst mit pause_bestaetigt. Abgeschlossene Monate (PH Zeitabschluss) sind gesperrt."""

from datetime import timedelta

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_time, getdate, now_datetime, nowdate

from ph_personal.logik import dauer_minuten, minuten_text



PROJEKT_DOCTYPES = ("PH Projekt", "PH Auftragsbestaetigung", "PH Serviceauftrag")


class PHZeiterfassung(Document):
    def validate(self):
        from ph_personal.ph_personal.zeitkonto import sperre_pruefen

        if getdate(self.datum) > getdate(nowdate()):
            frappe.throw(_("Zeitbuchungen in der Zukunft sind nicht möglich."))
        alt = self.get_doc_before_save()
        sperre_pruefen(self.mitarbeiter, self.datum, alt.datum if alt else None)
        self._selbstservice_grenze(alt)
        self.pause_min = max(0, cint(self.pause_min))
        if self.gehen:
            if get_time(self.gehen) <= get_time(self.kommen):
                frappe.throw(_("„Gehen“ muss nach „Kommen“ liegen (Nachtschichten als zwei Buchungen erfassen)."))
            self._pause_vorschlag()
            self.dauer_min = dauer_minuten(get_time(self.kommen), get_time(self.gehen), self.pause_min)
            if self.dauer_min <= 0:
                frappe.throw(_("Netto-Arbeitszeit ist 0 – Pause prüfen."))
            from ph_personal.utils.arbeitszeit import tag_pruefen

            for stufe, text in tag_pruefen(self.dauer_min, jugendlich=self._jugendlich()):
                frappe.msgprint(_("Hinweis: {0} netto – {1}.").format(minuten_text(self.dauer_min), text), indicator="red" if stufe == "verstoss" else "orange")
        else:
            self.dauer_min = 0
        self.dauer_text = minuten_text(self.dauer_min) if self.dauer_min else ""
        self._status()
        self._ueberschneidung_pruefen()
        self._projekt_pruefen()
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        self.titel = f"{name} · {frappe.format(getdate(self.datum), {'fieldtype': 'Date'})} · {self.dauer_text or _('offen')}"[:140]

    def _jugendlich(self):
        from ph_personal.utils.arbeitszeit import ist_jugendlich

        geb = frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "geburtsdatum")
        return ist_jugendlich(geb, getdate(self.datum)) if geb else False

    def _selbstservice_grenze(self, alt):
        """Selbstservice (ohne Personal-Rolle): nur eigene Buchungen des laufenden Tages ändern."""
        rollen = set(frappe.get_roles())
        if rollen & {"PH Personal Leitung", "PH Personal Mitarbeiter", "System Manager"} or frappe.session.user == "Administrator":
            return
        if self.flags.ph_korrektur:
            return
        if alt and getdate(alt.datum) < getdate(nowdate()) and any(alt.get(f) != self.get(f) for f in ("datum", "kommen", "gehen", "pause_min", "art")):
            frappe.throw(_("Buchungen vergangener Tage bitte über „Korrektur beantragen“ ändern (AZG § 26)."))
        if not alt and getdate(self.datum) < getdate(nowdate()) and self.quelle != "Stempel":
            self.korrektur_status = "Beantragt"
            self.korrektur_grund = self.korrektur_grund or _("Nachtrag durch die Person")
            self.korrektur_beantragt_von = frappe.session.user

    def _pause_vorschlag(self):
        from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen
        from ph_personal.utils.arbeitszeit import pause_pflicht_min

        brutto = dauer_minuten(get_time(self.kommen), get_time(self.gehen), 0)
        jugendlich = self._jugendlich()
        pflicht = pause_pflicht_min(brutto, jugendlich)
        if self.pause_min:
            if self.pause_min < pflicht:
                frappe.msgprint(_("Hinweis: Ruhepause unter {0} Minuten ({1}).").format(pflicht, "KJBG § 15" if jugendlich else "AZG § 11"), indicator="orange")
            return
        e = einstellungen()
        if pflicht or brutto > e["pause_ab_minuten"]:
            self.pause_min = max(pflicht, e["pause_minuten"])
            self.pause_bestaetigt = 0
            frappe.msgprint(_("Pause von {0} Minuten vorgeschlagen – bitte bestätigen, wenn sie genommen wurde.").format(self.pause_min), indicator="blue", alert=True)

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

    def _projekt_pruefen(self):
        """Bezug für die Nachkalkulation (Nachtrag Nr. 57): Dynamic Link, nur auf installierte DocTypes."""
        if not self.projekt:
            self.projekt_doctype = self.projekt_doctype or "PH Projekt"
            return
        if self.projekt_doctype not in PROJEKT_DOCTYPES:
            frappe.throw(_("Bezug nur auf {0}.").format(", ".join(PROJEKT_DOCTYPES)))
        if not frappe.db.exists("DocType", self.projekt_doctype):
            frappe.throw(_("{0} ist auf dieser Site nicht installiert.").format(self.projekt_doctype))
        if not frappe.db.exists(self.projekt_doctype, self.projekt):
            frappe.throw(_("{0} {1} gibt es nicht.").format(self.projekt_doctype, self.projekt))
        if not self.projekt_referenz:
            self.projekt_referenz = self.projekt

    def on_update(self):
        """AZG/ARG-Prüfung der Woche (und Ruhezeit zum Vortag) – Hinweis und Protokoll, keine Sperre."""
        if not self.gehen:
            return
        try:
            from ph_personal.ph_personal.zeitkonto import azg_befunde
            from ph_personal.utils.azg import zusammenfassung

            d = getdate(self.datum)
            montag = d - timedelta(days=d.weekday())
            befunde = [b for b in azg_befunde(self.mitarbeiter, montag, montag + timedelta(days=6))]
            z = zusammenfassung(befunde)
            alt = self.azg_verstoesse or 0
            self.db_set({"azg_verstoesse": z["verstoesse"], "azg_befunde": z["text"] or None}, update_modified=False)
            if z["verstoesse"] > alt:
                self.add_comment("Info", _("AZG/ARG-Prüfung: {0} Verstoß/Verstöße in KW {1}").format(z["verstoesse"], d.isocalendar()[1]) + "\n" + z["text"])
            if z["verstoesse"]:
                frappe.msgprint(_("AZG/ARG: {0}").format(z["text"].replace("\n", "<br>")), indicator="orange", alert=True)
        except Exception:  # noqa: BLE001 – Prüfung darf das Speichern nie verhindern
            frappe.log_error(title=f"PH Zeiterfassung {self.name}: AZG-Prüfung fehlgeschlagen")

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
    def korrektur_beantragen(self, kommen=None, gehen=None, pause_min=None, grund=None):
        """Button „Korrektur beantragen“ (Selbstservice): neue Zeiten vormerken; die Buchung bleibt bis zur
        Entscheidung der Leitung unverändert."""
        self.check_permission("read")
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        if self.korrektur_status == "Beantragt":
            frappe.throw(_("Für diese Buchung ist bereits eine Korrektur beantragt."))
        self.update(
            {
                "korrektur_status": "Beantragt",
                "korrektur_grund": grund,
                "korrektur_kommen": kommen or self.kommen,
                "korrektur_gehen": gehen or self.gehen,
                "korrektur_pause_min": cint(pause_min) if pause_min not in (None, "") else self.pause_min,
                "korrektur_beantragt_von": frappe.session.user,
            }
        )
        self.flags.ph_korrektur = True
        self.save(ignore_permissions=True)
        return self.korrektur_status

    @frappe.whitelist()
    def korrektur_entscheiden(self, bestaetigen=1, notiz=None):
        """Button „Korrektur bestätigen/ablehnen“ (Leitung): bei Bestätigung werden die Zeiten übernommen
        (Status Korrigiert, Version zeigt alt/neu)."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung entscheidet über Korrekturen."), frappe.PermissionError)
        if self.korrektur_status != "Beantragt":
            frappe.throw(_("Keine offene Korrektur."))
        if cint(bestaetigen):
            self.kommen = self.korrektur_kommen or self.kommen
            self.gehen = self.korrektur_gehen or self.gehen
            if self.korrektur_pause_min is not None:
                self.pause_min = self.korrektur_pause_min
            self.pause_bestaetigt = 1
            self.korrektur_status = "Bestaetigt"
        else:
            self.korrektur_status = "Abgelehnt"
        self.korrektur_entschieden_von = frappe.session.user
        if notiz:
            self.notiz = ((self.notiz or "") + "\n" + notiz).strip()
        self.save()
        return self.korrektur_status

    @frappe.whitelist()
    def pause_bestaetigen(self, pause_min=None):
        """Button „Pause bestätigen“ (Person am selben Tag oder Leitung): genommene Pause bestätigen/korrigieren."""
        self.check_permission("read")
        if pause_min not in (None, ""):
            self.pause_min = max(0, cint(pause_min))
        self.pause_bestaetigt = 1
        eigener_tag = getdate(self.datum) == getdate(nowdate())
        self.flags.ph_korrektur = eigener_tag
        self.save(ignore_permissions=eigener_tag)
        return self.pause_min

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
    """Soll/Ist/Saldo eines Monats – Arbeitszeitmodell, Feiertage, Gutschrift-Matrix, Vortrag (zeitkonto.py)."""
    from ph_personal.ph_personal.zeitkonto import monatsuebersicht as mu

    return mu(mitarbeiter, int(jahr), int(monat))


def vormonat(d=None):
    d = getdate(d or nowdate()).replace(day=1) - timedelta(days=1)
    return d.year, d.month
