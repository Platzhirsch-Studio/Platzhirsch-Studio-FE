"""PH Krankmeldung – Krankenstand melden (nicht genehmigen).

Recht: AngG § 8 Abs 8 / EFZG § 4 – Mitteilungspflicht der Person, Bestätigung auf Verlangen; der Arbeitgeber
genehmigt keinen Krankenstand und lehnt ihn nicht ab (Fachkritik R3/B3). Gesundheitsdatum (Art. 9 DSGVO):
eigene DocType, damit Sachbearbeitung und Backoffice-Admin keinen Lesezugriff haben (R1/D1); Teamkalender
zeigt „abwesend“. § 5 UrlG: Erkrankung > 3 Kalendertage im genehmigten Urlaub unterbricht den Urlaub.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, date_diff, getdate, now_datetime, nowdate

AKTIV = ("Gemeldet", "Bestaetigt", "Beendet")
UNTERBRECHUNG_AB_KALENDERTAGEN = 4  # „länger als 3 Kalendertage“ (§ 5 Abs 1 UrlG)


class PHKrankmeldung(Document):
    def before_insert(self):
        self.gemeldet_am = now_datetime()
        self.gemeldet_von = frappe.session.user
        self.status = "Gemeldet"

    def validate(self):
        from ph_personal.ph_personal.zeitkonto import abwesenheitstage, sperre_pruefen

        von = getdate(self.von)
        if self.bis_voraussichtlich and getdate(self.bis_voraussichtlich) < von:
            frappe.throw(_("„Voraussichtlich bis“ liegt vor dem ersten Krankenstandstag."))
        if self.bis and getdate(self.bis) < von:
            frappe.throw(_("Der letzte Krankenstandstag liegt vor dem ersten."))
        if self.bis_offen and not self.bis:
            self.bis_voraussichtlich = None
        if not self.is_new() and self.has_value_changed("status") and not self.flags.ph_methode:
            frappe.throw(_("Der Status ändert sich nur über die Aktionen (Bestätigung, Gesundmeldung, Stornieren)."))
        ende = self.ende()
        self.kalendertage = date_diff(ende, von) + 1 if ende else 0
        self.tage = sum(m for _, m in abwesenheitstage(self.mitarbeiter, von, ende)) if ende else 0
        self._ueberschneidung_pruefen(von, ende)
        if self.is_new() or self.has_value_changed("von") or self.has_value_changed("bis"):
            sperre_pruefen(self.mitarbeiter, von, self.bis)
        self._datei_privat()
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        zeitraum = frappe.format(von, {"fieldtype": "Date"}) + " – " + (frappe.format(getdate(self.bis), {"fieldtype": "Date"}) if self.bis else _("offen"))
        self.titel = f"{name} · {_('Krankenstand')} · {zeitraum}"[:140]

    def ende(self):
        """Letzter Tag für Berechnungen: bis, sonst voraussichtlich, sonst heute (bis auf Weiteres)."""
        if self.bis:
            return getdate(self.bis)
        if self.bis_voraussichtlich and not self.bis_offen:
            return getdate(self.bis_voraussichtlich)
        return max(getdate(self.von), getdate(nowdate()))

    def _ueberschneidung_pruefen(self, von, ende):
        if self.status not in AKTIV:
            return
        for k in frappe.get_all(
            "PH Krankmeldung",
            filters={"name": ("!=", self.name or ""), "mitarbeiter": self.mitarbeiter, "status": ("in", AKTIV), "von": ("<=", ende)},
            fields=["name", "von", "bis", "bis_voraussichtlich", "bis_offen"],
        ):
            k_ende = getdate(k.bis or (k.bis_voraussichtlich if not k.bis_offen else None) or nowdate())
            if getdate(k.von) <= ende and von <= max(k_ende, getdate(k.von)):
                frappe.throw(_("Es gibt bereits eine Krankmeldung {0} in diesem Zeitraum.").format(k.name))

    def _datei_privat(self):
        if not self.bestaetigung or not str(self.bestaetigung).startswith("/files/"):
            return
        datei = frappe.db.get_value("File", {"file_url": self.bestaetigung}, "name")
        if datei:
            fd = frappe.get_doc("File", datei)
            fd.is_private = 1
            fd.attached_to_doctype = self.doctype
            fd.attached_to_name = self.name
            fd.save(ignore_permissions=True)
            self.bestaetigung = fd.file_url

    def after_insert(self):
        self._leitung_informieren()

    def on_update(self):
        try:
            self._urlaub_unterbrechen()
        except Exception:  # noqa: BLE001 – Nebenwirkung, nie das Speichern verhindern
            frappe.log_error(title=f"PH Krankmeldung {self.name}: Urlaubsunterbrechung fehlgeschlagen")

    def _leitung_informieren(self):
        """ToDo an die Personal-Leitung – ohne Diagnose, nur Name, Zeitraum, Meldeweg."""
        try:
            from frappe.desk.form.assign_to import add

            leitung = [u for u in frappe.get_all("Has Role", filters={"role": "PH Personal Leitung", "parenttype": "User"}, pluck="parent") if u != frappe.session.user and frappe.db.get_value("User", u, "enabled")]
            if leitung:
                add({"assign_to": leitung[:3], "doctype": self.doctype, "name": self.name, "description": _("Krankmeldung: {0} (gemeldet über {1})").format(self.titel, _(self.meldeweg or "")), "date": nowdate()})
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Krankmeldung {self.name}: Leitung nicht informiert")

    def _urlaub_unterbrechen(self):
        """§ 5 UrlG: Krankenstand > 3 Kalendertage innerhalb eines genehmigten Urlaubs → Urlaubstage dieses
        Zeitraums zählen nicht (Unterbrechung am Urlaubsantrag, keine Doppelung)."""
        if self.status not in AKTIV:
            for a in frappe.get_all("PH Abwesenheit", filters={"unterbrechung_krankmeldung": self.name}, pluck="name"):
                doc = frappe.get_doc("PH Abwesenheit", a)
                doc.unterbrechung_von = doc.unterbrechung_bis = doc.unterbrechung_krankmeldung = None
                doc.flags.ph_unterbrechung = True
                doc.save(ignore_permissions=True)
            return
        von, ende = getdate(self.von), self.ende()
        if (ende - von).days + 1 < UNTERBRECHUNG_AB_KALENDERTAGEN:
            return
        for a in frappe.get_all(
            "PH Abwesenheit",
            filters={"mitarbeiter": self.mitarbeiter, "art": "Urlaub", "status": "Genehmigt", "von": ("<=", ende), "bis": (">=", von)},
            pluck="name",
        ):
            doc = frappe.get_doc("PH Abwesenheit", a)
            u_von, u_bis = max(von, getdate(doc.von)), min(ende, getdate(doc.bis))
            if doc.unterbrechung_krankmeldung == self.name and getdate(doc.unterbrechung_von) == u_von and getdate(doc.unterbrechung_bis) == u_bis:
                continue
            doc.unterbrechung_von, doc.unterbrechung_bis, doc.unterbrechung_krankmeldung = u_von, u_bis, self.name
            doc.flags.ph_unterbrechung = True
            doc.save(ignore_permissions=True)
            doc.add_comment("Info", _("Urlaub durch Krankenstand {0} unterbrochen ({1} – {2}, § 5 UrlG)").format(self.name, u_von, u_bis))
            self.db_set("urlaub_unterbrochen", doc.name, update_modified=False)

    # ── Buttons (ph_krankmeldung.js) ────────────────────────────────────────

    @frappe.whitelist()
    def bestaetigung_erfasst(self, datum=None, datei=None):
        """Button „Bestätigung erfasst“: AU-Bestätigung eingelangt (Datum, optional Datei)."""
        self.check_permission("write")
        if self.status == "Storniert":
            frappe.throw(_("Die Krankmeldung ist storniert."))
        self.bestaetigung_eingelangt_am = getdate(datum or nowdate())
        if datei:
            self.bestaetigung = datei
        if self.status == "Gemeldet":
            self.status = "Bestaetigt"
        self.flags.ph_methode = True
        self.save()
        return self.status

    @frappe.whitelist()
    def gesund_melden(self, bis):
        """Button „Gesundmeldung“: letzter Krankenstandstag; Status Beendet."""
        self.check_permission("write")
        if self.status == "Storniert":
            frappe.throw(_("Die Krankmeldung ist storniert."))
        bis = getdate(bis)
        if bis < getdate(self.von):
            frappe.throw(_("Der letzte Krankenstandstag liegt vor dem ersten."))
        self.bis = bis
        self.bis_offen = 0
        self.status = "Beendet"
        self.flags.ph_methode = True
        self.save()
        self.add_comment("Info", _("Gesundmeldung: letzter Krankenstandstag {0}").format(frappe.format(bis, {"fieldtype": "Date"})))
        return self.status

    @frappe.whitelist()
    def verlaengern(self, bis_voraussichtlich):
        """Button „Verlängern“: neues voraussichtliches Ende."""
        self.check_permission("write")
        self.bis_offen = 0
        self.bis_voraussichtlich = getdate(bis_voraussichtlich)
        self.save()
        return self.bis_voraussichtlich

    @frappe.whitelist()
    def stornieren(self, grund):
        """Button „Stornieren“ (Leitung): Fehlerfassung zurücknehmen; Urlaubsunterbrechung wird aufgehoben."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung kann Krankmeldungen stornieren."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        self.status = "Storniert"
        self.flags.ph_methode = True
        self.save()
        self.add_comment("Info", _("Storniert: {0}").format(grund))
        return self.status


def heute_krank(datum=None):
    """Anzahl Personen im Krankenstand am Tag (für Kennzahlen ohne Namen)."""
    d = getdate(datum or nowdate())
    rows = frappe.get_all("PH Krankmeldung", filters={"status": ("in", AKTIV), "von": ("<=", d)}, fields=["mitarbeiter", "bis", "bis_voraussichtlich", "bis_offen"])
    return len({r.mitarbeiter for r in rows if getdate(r.bis or (r.bis_voraussichtlich if not r.bis_offen else None) or add_days(d, 1)) >= d})
