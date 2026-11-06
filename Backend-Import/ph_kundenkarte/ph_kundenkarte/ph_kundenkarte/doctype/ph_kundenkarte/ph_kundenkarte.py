"""PH Kundenkarte – Stufe 1 ohne Geldwert. Kartennummer KK-XXXXXX (ph_core.utils.naming.referenz), Status über
Aktionen (sperren/entsperren/kündigen), Umsatz/Stufe über umsatz.py (nur mit Einwilligung zur Auswertung)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_datetime, getdate, now_datetime, nowdate

from ph_core.utils.naming import referenz
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll
from ph_kundenkarte.utils import kartenregeln as kr
from ph_kundenkarte.utils.karte import kartennummer_gueltig, normalisiere_kartennummer
from ph_kundenkarte.utils.wallet_payload import seriennummer

AKTIV = "Aktiv"


def neue_kartennummer():
    for _i in range(20):
        nr = referenz("KK")
        if not frappe.db.exists("PH Kundenkarte", nr):
            return nr
    frappe.throw(_("Keine freie Kartennummer gefunden."))


class PHKundenkarte(Document):
    def autoname(self):
        if not self.kartennummer:
            self.kartennummer = neue_kartennummer()
        self.kartennummer = normalisiere_kartennummer(self.kartennummer)
        self.name = self.kartennummer

    def before_insert(self):
        einst = einstellungen()
        if not self.status:
            self.status = AKTIV
        if not self.stufe:
            self.stufe = einst["startstufe"]
        if not self.stufe_seit:
            self.stufe_seit = nowdate()
        if not self.ausgestellt_am:
            self.ausgestellt_am = nowdate()
        if not self.ausgestellt_durch and frappe.session.user != "Guest":
            self.ausgestellt_durch = frappe.session.user
        if not self.wallet_pass_seriennummer:
            self.wallet_pass_seriennummer = seriennummer(self.kartennummer)
        if frappe.db.exists("PH Kundenkarte", {"kontakt": self.kontakt, "status": ("in", list(kr.OFFENE_STATUS))}):
            frappe.throw(_("Für diesen Kontakt besteht bereits eine Kundenkarte."))

    def validate(self):
        if not kartennummer_gueltig(self.kartennummer):
            frappe.throw(_("Kartennummer {0} hat nicht das Format KK-XXXXXX.").format(self.kartennummer))
        self._kontakt_uebernehmen()
        self._geburtstag_pflegen()
        self._einwilligung_pflegen()
        if not self.persoenlicher_berater:
            self.persoenlicher_berater = self._berater_vorschlag()
        alt = self.get_doc_before_save()
        if alt and alt.stufe != self.stufe:
            self.stufe_seit = nowdate()
            if not self.flags.stufe_automatisch:
                self.stufe_manuell = 1
                self.flags.stufenwechsel = (alt.stufe, self.stufe)
        if not self.qr_svg:
            try:
                from ph_core.utils.druck import ph_qr_svg

                self.qr_svg = ph_qr_svg(self.kartennummer, 22)
            except Exception:  # noqa: BLE001
                self.qr_svg = None
        self.titel = f"{self.kunde_name or self.kontakt} · {self.stufe or ''} · {self.kartennummer}"[:140]

    def after_insert(self):
        protokoll(self.name, "Ausgestellt", neu=self.stufe, hinweis=_("Kanal: {0}").format(self.kanal or "–"))
        self._kontakt_spiegeln()

    def on_update(self):
        try:
            if self.flags.stufenwechsel:
                alt, neu = self.flags.stufenwechsel
                protokoll(self.name, "Stufenwechsel", alt=alt, neu=neu, hinweis=_("manuell festgelegt"))
            if self.flags.einwilligung_geaendert:
                # Konzept §8.1/§9: Erteilung und Widerruf gehören in die Zeitleiste der Karte
                if self.einwilligung_auswertung:
                    protokoll(self.name, "Einwilligung", neu=self.einwilligung_textversion or "–", hinweis=_("Auswertung der Kaufhistorie erteilt"))
                else:
                    protokoll(self.name, "Widerruf", hinweis=_("Auswertung der Kaufhistorie widerrufen – Umsatzfelder geleert"))
            self._kontakt_spiegeln()
        except Exception:  # noqa: BLE001
            frappe.log_error(title="ph_kundenkarte: on_update")

    # ── Helfer ──────────────────────────────────────────────────────────────

    def _kontakt_uebernehmen(self):
        if not self.kontakt or not frappe.db.exists("DocType", "PH Kontakt"):
            return
        k = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "firma", "berater", "geburtstag", "geburtstag_einwilligung"], as_dict=True)
        if not k:
            return
        self.kunde_name = (" ".join(x for x in (k.vorname, k.nachname) if x) or k.firma or self.kontakt)[:140]
        if not self.persoenlicher_berater and k.berater:
            self.persoenlicher_berater = k.berater
        if not self.geburtstag and not self.geburtstag_tag_monat and k.geburtstag and cint(k.geburtstag_einwilligung):
            self.geburtstag = k.geburtstag

    def _geburtstag_pflegen(self):
        """Geburtstag mit Jahr → Tag/Monat ableiten; nur Tag/Monat (Website „--MM-TT“) → normalisieren."""
        if self.geburtstag:
            self.geburtstag_tag_monat = getdate(self.geburtstag).strftime("%m-%d")
        elif self.geburtstag_tag_monat:
            _voll, teil = kr.geburtstag_parsen(self.geburtstag_tag_monat)
            if not teil:
                frappe.throw(_("Geburtstag Tag/Monat bitte als MM-TT angeben."))
            self.geburtstag_tag_monat = teil

    def _berater_vorschlag(self):
        return einstellungen().get("berater_standard")

    def _einwilligung_pflegen(self):
        alt = self.get_doc_before_save()
        if self.einwilligung_auswertung and not self.einwilligung_am:
            self.einwilligung_am = now_datetime()
            self.einwilligung_widerrufen_am = None
        if not self.einwilligung_auswertung and self.einwilligung_am and not self.einwilligung_widerrufen_am:
            self.einwilligung_widerrufen_am = now_datetime()
            # Ohne Einwilligung keine Auswertung: Umsatzfelder leeren, Stufe auf Startstufe (sofern nicht manuell)
            self.jahresumsatz_cent = 0
            self.gesamtumsatz_cent = 0
            self.letzter_einkauf = None
            if not self.stufe_manuell:
                self.flags.stufe_automatisch = True
                self.stufe = einstellungen()["startstufe"] or self.stufe
        if self.einwilligung_auswertung and self.einwilligung_widerrufen_am and get_datetime(self.einwilligung_am) <= get_datetime(self.einwilligung_widerrufen_am):
            self.einwilligung_am = now_datetime()
            self.einwilligung_widerrufen_am = None
        if alt and bool(alt.einwilligung_auswertung) != bool(self.einwilligung_auswertung):
            self.flags.einwilligung_geaendert = True

    def _kontakt_spiegeln(self):
        """Custom Fields am PH Kontakt (fixtures/custom_field.json) nachführen; vor Migration still."""
        if not self.kontakt or not frappe.db.exists("DocType", "PH Kontakt"):
            return
        try:
            meta = frappe.get_meta("PH Kontakt")
            if not meta.has_field("ph_kundenkarte_karte"):
                return
            aktiv = self.status in (AKTIV, "Gesperrt", "Beantragt")
            frappe.db.set_value("PH Kontakt", self.kontakt, {"ph_kundenkarte_karte": self.name if aktiv else None, "ph_kundenkarte_stufe": self.stufe if aktiv else None}, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="ph_kundenkarte: Kontakt spiegeln")

    # ── Buttons (ph_kundenkarte.js) ─────────────────────────────────────────

    @frappe.whitelist()
    def vorteil_einloesen(self, vorteil, bezug_doctype=None, bezug=None, kommentar=None, ort="Backoffice"):
        """Button „Vorteil einlösen“: legt PH Kundenkarte Einloesung an (Prüfung im Controller)."""
        self.check_permission("write")
        doc = frappe.get_doc(
            {
                "doctype": "PH Kundenkarte Einloesung",
                "kundenkarte": self.name,
                "vorteil": vorteil,
                "bezug_doctype": bezug_doctype or None,
                "bezug": bezug or None,
                "kommentar": kommentar,
                "ort": ort or "Backoffice",
                "quelle": "backoffice",
            }
        ).insert()
        return doc.name

    @frappe.whitelist()
    def umsatz_neu_berechnen(self):
        """Button „Umsatz neu berechnen“."""
        self.check_permission("write")
        from ph_kundenkarte.ph_kundenkarte import umsatz

        return umsatz.karte_neu_berechnen(self.name, automatisch=False)

    @frappe.whitelist()
    def wallet_pass_erneuern(self):
        """Button „Wallet-Pass erneuern“: neue Seriennummer-Zeit, Pass wird beim nächsten Abruf neu gebaut."""
        self.check_permission("write")
        jetzt = now_datetime()
        self.db_set({"wallet_pass_aktualisiert": jetzt, "wallet_pass_seriennummer": self.wallet_pass_seriennummer or seriennummer(self.kartennummer)})
        protokoll(self.name, "Pass aktualisiert", hinweis=_("manuell ausgelöst"))
        return str(jetzt)

    @frappe.whitelist()
    def sperren(self, grund=None, sperrgrund_art=None):
        """Button „Karte sperren“: Sperrgrund aus dem Katalog (Pflicht) + Freitext. Ältere Aufrufer mit nur `grund`:
        Katalogwert im Text wird erkannt, sonst „Sonstiges“ mit dem Text als Beschreibung."""
        self.check_permission("write")
        if self.status not in (AKTIV, "Beantragt"):
            frappe.throw(_("Nur aktive oder beantragte Karten können gesperrt werden."))
        art = sperrgrund_art or kr.sperrgrund_aus_text(grund)
        ok, meldung = kr.sperrgrund_pruefen(art, grund)
        if not ok:
            frappe.throw(_(meldung))
        alt = self.status
        hinweis = _(art) + (f" – {grund}" if grund else "")
        self.db_set({"status": "Gesperrt", "gesperrt_am": now_datetime(), "sperrgrund_art": art, "sperrgrund": (grund or "")[:140] or None})
        protokoll(self.name, "Sperrung", alt=alt, neu="Gesperrt", hinweis=hinweis)
        self._kontakt_spiegeln()
        return "Gesperrt"

    @frappe.whitelist()
    def entsperren(self):
        """Button „Karte entsperren“ – nur Leitung."""
        self.check_permission("write")
        if not ({"PH Kundenkarte Leitung", "System Manager", "PH Backoffice-Admin"} & set(frappe.get_roles())):
            frappe.throw(_("Entsperren darf nur die Leitung."))
        if self.status != "Gesperrt":
            frappe.throw(_("Karte ist nicht gesperrt."))
        if not kr.entsperrbar(self.sperrgrund_art):
            frappe.throw(_("Sperrgrund „{0}“ ist endgültig – bitte Ersatzkarte ausstellen oder kündigen.").format(_(self.sperrgrund_art)))
        self.db_set({"status": AKTIV, "gesperrt_am": None, "sperrgrund": None, "sperrgrund_art": None})
        protokoll(self.name, "Entsperrung", alt="Gesperrt", neu=AKTIV)
        self._kontakt_spiegeln()
        return AKTIV

    @frappe.whitelist()
    def kuendigen(self, grund=None):
        """Button „Karte kündigen“ (Kundenwunsch / Ende der Teilnahme); irreversibel, neue Karte möglich."""
        self.check_permission("write")
        if self.status == "Gekuendigt":
            return self.status
        if self.status in kr.END_STATUS:
            frappe.throw(_("Karte ist bereits beendet ({0}).").format(_(self.status)))
        alt = self.status
        self.db_set({"status": "Gekuendigt", "gekuendigt_am": nowdate()})
        protokoll(self.name, "Kuendigung", alt=alt, neu="Gekuendigt", hinweis=grund)
        self._kontakt_spiegeln()
        return "Gekuendigt"

    @frappe.whitelist()
    def aktivieren(self):
        """Beantragte Karte aktivieren (z. B. nach Übergabe im Showroom)."""
        self.check_permission("write")
        if self.status != "Beantragt":
            frappe.throw(_("Nur beantragte Karten können aktiviert werden."))
        self.db_set({"status": AKTIV, "ausgestellt_am": nowdate(), "ausgestellt_durch": frappe.session.user})
        protokoll(self.name, "Hinweis", alt="Beantragt", neu=AKTIV, hinweis=_("aktiviert"))
        self._kontakt_spiegeln()
        return AKTIV

    @frappe.whitelist()
    def karte_uebergeben(self, ort="Showroom"):
        """Physische Übergabe: beantragte Karte wird aktiv (Konzept §9.2)."""
        self.check_permission("read")
        from ph_kundenkarte.ph_kundenkarte import lebenszyklus

        return lebenszyklus.uebergeben(self.name, ort=ort)

    @frappe.whitelist()
    def ersatzkarte_ausstellen(self, sperrgrund_art="Verlust", grund=None):
        """Button „Ersatzkarte“: neue Nummer, alte Karte „Ersetzt“ (Verlust, Diebstahl, Beschädigung)."""
        self.check_permission("write")
        from ph_kundenkarte.ph_kundenkarte import lebenszyklus

        return lebenszyklus.ersatzkarte_ausstellen(self, sperrgrund_art=sperrgrund_art, grund=grund)

    @frappe.whitelist()
    def uebertragen(self, ziel_kontakt, grund_art, grund=None, einwilligung_auswertung=0, einwilligung_textversion=None):
        """Button „Übertragen“ (Leitung): Karte auf anderen Kontakt, neue Nummer, Stufe bleibt."""
        self.check_permission("write")
        from ph_kundenkarte.ph_kundenkarte import lebenszyklus

        return lebenszyklus.uebertragen(self, ziel_kontakt, grund_art, grund=grund, einwilligung_auswertung=einwilligung_auswertung, einwilligung_textversion=einwilligung_textversion)

    @frappe.whitelist()
    def zusammenfuehren_mit(self, andere_karte, nur_plan=0, trotz_verschiedener_kontakte=0):
        """Button „Dublette zusammenführen“ (Leitung). Zielkarte wählt die Regel (aktiv, höhere Stufe, ältere Karte).
        Verschiedene Kontakte: erst in ph_crm zusammenführen (dann automatisch) oder bewusst `trotz_verschiedener_kontakte`."""
        self.check_permission("write")
        from ph_kundenkarte.ph_kundenkarte import lebenszyklus

        andere = normalisiere_kartennummer(andere_karte)
        if andere == self.name or not frappe.db.exists("PH Kundenkarte", andere):
            frappe.throw(_("Bitte eine andere, vorhandene Karte angeben."))
        if frappe.db.get_value("PH Kundenkarte", andere, "kontakt") != self.kontakt and not cint(trotz_verschiedener_kontakte):
            frappe.throw(_("Die Karten gehören zu verschiedenen Kontakten. Bitte zuerst die Kontakte im CRM zusammenführen."))
        if cint(nur_plan):
            return lebenszyklus.zusammenfuehren([self.name, andere], nur_plan=True)
        lebenszyklus.leitung_pruefen(_("Karten zusammenführen"))
        return lebenszyklus.zusammenfuehren([self.name, andere])

    @frappe.whitelist()
    def portal_daten(self):
        """Daten für Formular-Dashboard und Portal (Stufe, nächste Stufe, Vorteile mit Restkontingent)."""
        self.check_permission("read")
        from ph_kundenkarte.ph_kundenkarte import umsatz

        return umsatz.karten_uebersicht(self.name)


def karte_zu_kontakt(kontakt, nur_aktiv=True):
    """Name der Karte eines Kontakts (aktiv/gesperrt) oder None."""
    status = [AKTIV] if nur_aktiv else list(kr.OFFENE_STATUS)
    return frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", status)}, "name")
