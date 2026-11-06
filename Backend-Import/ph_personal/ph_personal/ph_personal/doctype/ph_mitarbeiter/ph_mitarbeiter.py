"""PH Mitarbeiter – Stammdaten. Verknüpfter Benutzer bekommt Selbstservice:
Rolle „PH Personal Selbstservice“ + User Permission auf den eigenen Datensatz (wirkt auf
PH Zeiterfassung.mitarbeiter und PH Abwesenheit.mitarbeiter).

Ergänzt 04.11.2026 (Fachkritik 21-kritik-fach-personal.md):
  P5  Arbeitszeitmodell mit Gültigkeit (Kindtabelle arbeitszeiten) – wochenstunden = aktuell gültiges Modell
  P10 Austritt vollständig: Zugang (User, Rollen, Kassa-PIN, Sitzungen) am Austrittstag entziehen, Arbeitsmittel,
      austritt_konto (Urlaubsersatzleistung § 10 UrlG, kumulierter Saldo)
  P14 Onboarding-Nachweise (ÖGK vor Arbeitsantritt § 33 ASVG, Dienstzettel § 2 AVRAG, Datenschutzinfo, ASchG)
      + Checkliste aus PH Onboarding Vorlage
  Dokumente (Dienstvertrag …) nur privat und nur Leitung/GF (permlevel 1)
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, getdate, now_datetime, nowdate

from ph_personal.utils.arbeitszeit import WOCHENTAGE

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
        if (self.vordienstzeiten_jahre or 0) < 0:
            frappe.throw(_("Vordienstzeiten können nicht negativ sein."))
        self._arbeitszeiten()
        self.team_montage = int(bool(self.team_montage) or self.rolle_intern == "Montage")
        self.team_verkauf = int(bool(self.team_verkauf) or self.rolle_intern == "Verkauf")
        self.team_planung = int(bool(self.team_planung) or self.rolle_intern == "Planung")
        if not self.fahrzeugberechtigung:
            self.fuehrerschein_klassen = None
        if not self.checkliste and (self.flags.in_insert or self.is_new()):
            vorlage = self.onboarding_vorlage or frappe.db.get_value("PH Onboarding Vorlage", {"art": "Onboarding", "standard": 1, "aktiv": 1}, "name")
            if vorlage:
                self._checkliste_aus_vorlage(vorlage)
        self._checkliste_nachweise()
        self._dokumente_privat()
        self._onboarding_hinweise()

    def _arbeitszeiten(self):
        zeilen = sorted(self.arbeitszeiten or [], key=lambda z: str(z.gueltig_ab or ""))
        gesehen = set()
        for z in zeilen:
            if str(z.gueltig_ab) in gesehen:
                frappe.throw(_("Arbeitszeitmodell: „Gültig ab“ {0} ist doppelt.").format(z.gueltig_ab))
            gesehen.add(str(z.gueltig_ab))
            minuten = [int(z.get(f"{t}_min") or 0) for t in WOCHENTAGE]
            if any(m < 0 or m > 12 * 60 for m in minuten):
                frappe.throw(_("Arbeitszeitmodell ab {0}: je Tag 0 bis 720 Minuten (AZG § 9).").format(z.gueltig_ab))
            z.wochenstunden = round(sum(minuten) / 60, 2)
            z.tage_pro_woche = sum(1 for m in minuten if m > 0)
            if z.wochenstunden > 60:
                frappe.throw(_("Arbeitszeitmodell ab {0}: mehr als 60 Wochenstunden.").format(z.gueltig_ab))
        heute = getdate(nowdate())
        gueltig = [z for z in zeilen if getdate(z.gueltig_ab) <= heute]
        if gueltig:
            self.wochenstunden = gueltig[-1].wochenstunden
        elif zeilen:
            self.wochenstunden = zeilen[0].wochenstunden

    def _checkliste_aus_vorlage(self, vorlage):
        v = frappe.get_cached_doc("PH Onboarding Vorlage", vorlage)
        basis = self.austritt if v.art == "Offboarding" else self.eintritt
        vorhanden = {(z.art, z.aufgabe) for z in self.checkliste or []}
        for a in v.aufgaben:
            if (v.art, a.aufgabe) in vorhanden:
                continue
            self.append(
                "checkliste",
                {
                    "art": v.art,
                    "aufgabe": a.aufgabe,
                    "faellig_am": add_days(basis, a.tage_relativ or 0) if basis else None,
                    "verantwortlich": a.verantwortlich,
                    "pflicht": a.pflicht,
                    "rechtsgrundlage": a.rechtsgrundlage,
                    "nachweis_feld": a.nachweis_feld,
                },
            )

    def _checkliste_nachweise(self):
        """Erledigte Aufgabe mit Nachweisfeld → Datum am Mitarbeiter; umgekehrt Häkchen, wenn das Datum schon steht."""
        for z in self.checkliste or []:
            if z.erledigt and not z.erledigt_am:
                z.erledigt_am = nowdate()
                z.erledigt_von = frappe.session.user
            if not z.erledigt:
                z.erledigt_am = z.erledigt_von = None
            feld = z.nachweis_feld
            if feld and self.meta.has_field(feld):
                if z.erledigt and not self.get(feld):
                    self.set(feld, now_datetime() if self.meta.get_field(feld).fieldtype == "Datetime" else z.erledigt_am)
                elif self.get(feld) and not z.erledigt:
                    z.erledigt = 1
                    z.erledigt_am = getdate(self.get(feld))

    def _dokumente_privat(self):
        for z in self.dokumente or []:
            if not z.datei:
                continue
            if not z.hochgeladen_von:
                z.hochgeladen_von = frappe.session.user
            if str(z.datei).startswith("/files/"):
                datei = frappe.db.get_value("File", {"file_url": z.datei}, "name")
                if datei:
                    fd = frappe.get_doc("File", datei)
                    fd.is_private = 1
                    fd.attached_to_doctype = self.doctype
                    fd.attached_to_name = self.name
                    fd.save(ignore_permissions=True)
                    z.datei = fd.file_url

    def _onboarding_hinweise(self):
        if self.status != "Aktiv" or not self.eintritt or self.flags.in_insert:
            return
        heute = getdate(nowdate())
        if getdate(self.eintritt) <= heute and not self.oegk_anmeldung_am:
            frappe.msgprint(_("ÖGK-Anmeldung vor Arbeitsantritt fehlt (§ 33 ASVG)."), indicator="orange", alert=True)
        if getdate(self.eintritt) <= add_days(heute, -7) and not self.dienstzettel_am:
            frappe.msgprint(_("Dienstzettel/Dienstvertrag noch nicht übergeben (§ 2 AVRAG)."), indicator="orange", alert=True)

    def on_update(self):
        if self.user and (self.has_value_changed("user") or self.flags.in_insert):
            self._selbstservice_einrichten()
        alt = self.get_doc_before_save()
        if alt and alt.user and alt.user != self.user:
            _user_permission_entfernen(alt.user, self.name)
        if self.status == "Ausgetreten" and (not alt or alt.status != "Ausgetreten") and not self.zugang_entzogen_am:
            zugang_entziehen(self)

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
        """Jahresanspruch des aktuellen Urlaubsjahres (UrlG) – abweichender Vertragswert hat Vorrang."""
        if self.urlaubsanspruch_tage:
            return int(self.urlaubsanspruch_tage)
        try:
            from ph_personal.ph_personal.urlaubskonto import konto

            return konto(self.name)["anspruch"]
        except Exception:  # noqa: BLE001 – vor Migration
            from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

            return einstellungen()["urlaubsanspruch_tage"]

    # ── Buttons (ph_mitarbeiter.js) ─────────────────────────────────────────

    @frappe.whitelist()
    def monatsuebersicht(self, jahr=None, monat=None):
        """Button „Monatsübersicht“: Soll/Ist/Abwesenheiten eines Monats."""
        self.check_permission("read")
        from ph_personal.ph_personal.zeitkonto import monatsuebersicht

        heute = getdate(nowdate())
        return monatsuebersicht(self.name, int(jahr or heute.year), int(monat or heute.month))

    @frappe.whitelist()
    def urlaubskonto(self, jahr=None):
        """Kurzform (Kalenderjahr) – für Berichte; Button nutzt urlaubskonto_uebersicht."""
        self.check_permission("read")
        from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import urlaubskonto

        return urlaubskonto(self.name, int(jahr or getdate(nowdate()).year))

    @frappe.whitelist()
    def urlaubskonto_uebersicht(self, stichtag=None):
        """Button „Urlaubskonto“: je Urlaubsjahr Anspruch, Verbrauch, Rest, Verjährung (UrlG)."""
        self.check_permission("read")
        from ph_personal.ph_personal.doctype.ph_urlaubsanspruch.ph_urlaubsanspruch import stand_schreiben

        return stand_schreiben(self.name, stichtag)

    @frappe.whitelist()
    def checkliste_anlegen(self, vorlage):
        """Button „Checkliste aus Vorlage“ (Leitung)."""
        self.check_permission("write")
        self._checkliste_aus_vorlage(vorlage)
        self.onboarding_vorlage = self.onboarding_vorlage or vorlage
        self.save()
        return len(self.checkliste)

    @frappe.whitelist()
    def austritt_konto(self, datum=None):
        """Button „Austritt: Konto“: Urlaubsersatzleistung (§ 10 UrlG), kumulierter Saldo, Offenes."""
        self.check_permission("read")
        if "PH Personal Leitung" not in frappe.get_roles() and "PH Geschäftsführung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur Personal-Leitung und Geschäftsführung."), frappe.PermissionError)
        return austritt_konto(self.name, datum or self.austritt or nowdate())

    @frappe.whitelist()
    def austritt_erfassen(self, datum):
        """Button „Austritt erfassen“: Datum setzen, Offboarding-Checkliste anlegen; Zugang wird am Austrittstag
        (Scheduler 00:10 bzw. sofort bei Datum in der Vergangenheit) entzogen."""
        self.check_permission("write")
        self.austritt = datum
        if getdate(datum) < getdate(nowdate()):
            self.status = "Ausgetreten"
        vorlage = frappe.db.get_value("PH Onboarding Vorlage", {"art": "Offboarding", "standard": 1, "aktiv": 1}, "name")
        if vorlage:
            self._checkliste_aus_vorlage(vorlage)
        self.save()
        offen = [z.bezeichnung for z in self.arbeitsmittel or [] if not z.zurueck_am]
        if offen:
            frappe.msgprint(_("Noch nicht zurückgegeben: {0}").format(", ".join(offen)), indicator="orange")
        self.add_comment("Info", _("Austritt erfasst: {0}").format(frappe.format(getdate(datum), {"fieldtype": "Date"})))
        return self.status

    @frappe.whitelist()
    def zugang_jetzt_entziehen(self):
        """Button (Leitung): Zugang sofort entziehen (z. B. Dienstfreistellung)."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung."), frappe.PermissionError)
        zugang_entziehen(self)
        return self.zugang_entzogen_am


def zugang_entziehen(ma):
    """Austritt (P10/R10): User Permission und Selbstservice-Rolle entfernen, Benutzer deaktivieren (Einstellung),
    Kassa-PIN (ph_core_pin_hash) löschen, Sitzungen beenden. Fehler nur protokollieren."""
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    if isinstance(ma, str):
        ma = frappe.get_doc("PH Mitarbeiter", ma)
    if ma.user:
        try:
            _user_permission_entfernen(ma.user, ma.name)
            user = frappe.get_doc("User", ma.user)
            user.remove_roles(ROLLE_SELBSTSERVICE)
            werte = {}
            if einstellungen().get("benutzer_bei_austritt_deaktivieren", 1):
                werte["enabled"] = 0
            meta = frappe.get_meta("User")
            for feld in ("ph_core_pin_hash", "ph_core_pin_gesetzt_am"):
                if meta.has_field(feld):
                    werte[feld] = None
            if werte:
                frappe.db.set_value("User", ma.user, werte)
            from frappe.sessions import clear_sessions

            clear_sessions(user=ma.user, force=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Mitarbeiter {ma.name}: Zugang nicht vollständig entzogen")
    frappe.db.set_value("PH Mitarbeiter", ma.name, "zugang_entzogen_am", now_datetime(), update_modified=False)
    ma.zugang_entzogen_am = now_datetime()
    ma.add_comment("Info", _("Zugang entzogen (Benutzer, Selbstservice, Kassa-PIN, Sitzungen)"))


def austritt_konto(mitarbeiter, datum):
    """Stand zum Austritt: Urlaubsersatzleistung (Tage), Stundensaldo kumuliert (Vortrag + nicht
    abgeschlossene Monate bis zum Austritt), offene Buchungen, offene Arbeitsmittel."""
    from ph_personal.logik import minuten_text
    from ph_personal.ph_personal.urlaubskonto import ersatzleistung
    from ph_personal.ph_personal.zeitkonto import abschluss, monatsuebersicht

    datum = getdate(datum)
    ma = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    e = ersatzleistung(mitarbeiter, datum)
    saldo = 0
    j, m = datum.year, datum.month
    offen_monate = []
    # rückwärts bis zum letzten Abschluss (max. 24 Monate)
    for _i in range(24):
        name = abschluss(mitarbeiter, j, m)
        if name:
            saldo += int(frappe.db.get_value("PH Zeitabschluss", name, "saldo_kumuliert_min") or 0)
            break
        mu = monatsuebersicht(mitarbeiter, j, m)
        saldo += mu["saldo_min"]
        offen_monate.append(f"{m:02d}/{j}")
        if ma.eintritt and (j, m) <= (getdate(ma.eintritt).year, getdate(ma.eintritt).month):
            break
        j, m = (j, m - 1) if m > 1 else (j - 1, 12)
    return {
        "mitarbeiter": mitarbeiter,
        "datum": str(datum),
        "ersatzleistung_tage": e["tage"],
        "urlaub": e,
        "saldo_kumuliert_min": saldo,
        "saldo_kumuliert_text": minuten_text(saldo),
        "nicht_abgeschlossene_monate": offen_monate,
        "offene_buchungen": frappe.db.count("PH Zeiterfassung", {"mitarbeiter": mitarbeiter, "status": "Offen"}),
        "offene_arbeitsmittel": [{"art": z.art, "bezeichnung": z.bezeichnung, "kennung": z.kennung} for z in ma.arbeitsmittel or [] if not z.zurueck_am],
        "hinweis": _("Zeitguthaben bei Austritt: Abgeltung mit Zuschlag nach § 19e AZG – Lohnverrechnung."),
    }


def _user_permission_entfernen(user, mitarbeiter):
    for up in frappe.get_all("User Permission", {"user": user, "allow": "PH Mitarbeiter", "for_value": mitarbeiter}, pluck="name"):
        frappe.delete_doc("User Permission", up, ignore_permissions=True, force=True)


def mitarbeiter_fuer_user(user=None):
    """Name des PH Mitarbeiter-Datensatzes zum angemeldeten Benutzer (Selbstservice, Stempeln)."""
    user = user or frappe.session.user
    return frappe.db.get_value("PH Mitarbeiter", {"user": user, "status": ("!=", "Ausgetreten")}, "name")


def aktive_mitarbeiter(fields=None):
    return frappe.get_all("PH Mitarbeiter", filters={"status": ("!=", "Ausgetreten")}, fields=fields or ["name", "titel", "wochenstunden", "urlaubsanspruch_tage", "rolle_intern", "eintritt", "austritt"], order_by="nachname asc")
