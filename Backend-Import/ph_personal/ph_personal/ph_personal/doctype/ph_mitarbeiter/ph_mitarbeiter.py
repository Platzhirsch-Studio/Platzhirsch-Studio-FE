"""PH Mitarbeiter – Stammdaten minimal. Verknüpfter Benutzer bekommt Selbstservice:
Rolle „PH Personal Selbstservice“ + User Permission auf den eigenen Datensatz (wirkt auf
PH Zeiterfassung.mitarbeiter und PH Abwesenheit.mitarbeiter)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate

ROLLE_SELBSTSERVICE = "PH Personal Selbstservice"


class PHMitarbeiter(Document):
    def validate(self):
        self.vorname = (self.vorname or "").strip()
        self.nachname = (self.nachname or "").strip()
        self.titel = f"{self.vorname} {self.nachname}".strip()
        if self.austritt and self.eintritt and getdate(self.austritt) < getdate(self.eintritt):
            frappe.throw(_("Austritt liegt vor dem Eintritt."))
        if self.austritt and getdate(self.austritt) < getdate(nowdate()):
            self.status = "Ausgetreten"
        elif self.status == "Ausgetreten" and not self.austritt:
            frappe.throw(_("Für „Ausgetreten“ bitte das Austrittsdatum eintragen."))
        if self.wochenstunden is not None and self.wochenstunden < 0:
            frappe.throw(_("Wochenstunden können nicht negativ sein."))
        self.team_montage = int(bool(self.team_montage) or self.rolle_intern == "Montage")
        self.team_verkauf = int(bool(self.team_verkauf) or self.rolle_intern == "Verkauf")
        self.team_planung = int(bool(self.team_planung) or self.rolle_intern == "Planung")
        if not self.fahrzeugberechtigung:
            self.fuehrerschein_klassen = None

    def on_update(self):
        if self.user and (self.has_value_changed("user") or self.is_new()):
            self._selbstservice_einrichten()
        alt = self.get_doc_before_save()
        if alt and alt.user and alt.user != self.user:
            _user_permission_entfernen(alt.user, self.name)

    def on_trash(self):
        if self.user:
            _user_permission_entfernen(self.user, self.name)

    def _selbstservice_einrichten(self):
        try:
            user = frappe.get_doc("User", self.user)
            if ROLLE_SELBSTSERVICE not in [r.role for r in user.roles]:
                user.add_roles(ROLLE_SELBSTSERVICE)
            if not frappe.db.exists("User Permission", {"user": self.user, "allow": "PH Mitarbeiter", "for_value": self.name}):
                frappe.get_doc(
                    {"doctype": "User Permission", "user": self.user, "allow": "PH Mitarbeiter", "for_value": self.name, "apply_to_all_doctypes": 1}
                ).insert(ignore_permissions=True)
        except Exception:  # noqa: BLE001 – darf das Speichern nie verhindern
            frappe.log_error(title="PH Mitarbeiter: Selbstservice konnte nicht eingerichtet werden")

    def wochenstunden_effektiv(self):
        if self.wochenstunden:
            return float(self.wochenstunden)
        from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

        return einstellungen()["standard_wochenstunden"]

    def urlaubsanspruch_effektiv(self):
        if self.urlaubsanspruch_tage:
            return int(self.urlaubsanspruch_tage)
        from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

        return einstellungen()["urlaubsanspruch_tage"]

    # ── Buttons (ph_mitarbeiter.js) ─────────────────────────────────────────

    @frappe.whitelist()
    def monatsuebersicht(self, jahr=None, monat=None):
        """Button „Monatsübersicht“: Soll/Ist/Abwesenheiten eines Monats."""
        self.check_permission("read")
        from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import monatsuebersicht

        heute = getdate(nowdate())
        return monatsuebersicht(self.name, int(jahr or heute.year), int(monat or heute.month))

    @frappe.whitelist()
    def urlaubskonto(self, jahr=None):
        """Button „Urlaubskonto“."""
        self.check_permission("read")
        from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import urlaubskonto

        return urlaubskonto(self.name, int(jahr or getdate(nowdate()).year))

    @frappe.whitelist()
    def austritt_erfassen(self, datum):
        """Button „Austritt erfassen“: Datum setzen, Selbstservice-Rechte entziehen, Benutzer bleibt (Admin entscheidet)."""
        self.check_permission("write")
        self.austritt = datum
        if getdate(datum) <= getdate(nowdate()):
            self.status = "Ausgetreten"
        self.save()
        if self.status == "Ausgetreten" and self.user:
            _user_permission_entfernen(self.user, self.name)
        self.add_comment("Info", _("Austritt erfasst: {0}").format(frappe.format(getdate(datum), {"fieldtype": "Date"})))
        return self.status


def _user_permission_entfernen(user, mitarbeiter):
    for up in frappe.get_all("User Permission", {"user": user, "allow": "PH Mitarbeiter", "for_value": mitarbeiter}, pluck="name"):
        frappe.delete_doc("User Permission", up, ignore_permissions=True, force=True)


def mitarbeiter_fuer_user(user=None):
    """Name des PH Mitarbeiter-Datensatzes zum angemeldeten Benutzer (Selbstservice, Stempeln)."""
    user = user or frappe.session.user
    return frappe.db.get_value("PH Mitarbeiter", {"user": user, "status": ("!=", "Ausgetreten")}, "name")


def aktive_mitarbeiter(fields=None):
    return frappe.get_all("PH Mitarbeiter", filters={"status": ("!=", "Ausgetreten")}, fields=fields or ["name", "titel", "wochenstunden", "urlaubsanspruch_tage", "rolle_intern", "eintritt", "austritt"], order_by="nachname asc")
