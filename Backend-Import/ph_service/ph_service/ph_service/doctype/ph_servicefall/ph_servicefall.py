"""PH Servicefall – Controller.

validate()      Kundendaten übernehmen, Fehlercode/Bereich abgleichen, Fristen (VGG/ABGB) berechnen, Kosten summieren,
                Entscheidung prüfen (Begründung, Kulanzschwelle), Statuswechsel protokollieren, Titel.
before_insert() Eingang, Reaktionsfrist, Standardwerte.
on_update()     Zuweisung spiegeln, Produktpass/Projekt-Hinweis – nie Fehler werfen.
Dokument-Methoden (Buttons in ph_servicefall.js): einsatz_anlegen, ersatzteile_bestellen, regress_anlegen,
kunde_informieren, lieferant_informieren, gutschrift_erstellen, erledigt_melden, ablehnen, abnahme_erfassen.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, get_datetime, getdate, now_datetime, nowdate, strip_html

from ph_service.ph_service import fristen as fr
from ph_service.ph_service import kommunikation as kom
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

OFFEN = ("Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant")
ABGESCHLOSSEN = ("Erledigt", "Geschlossen", "Abgelehnt")
LEITUNG = ("PH Service Leitung", "PH Geschäftsführung", "System Manager", "Administrator")
ENTSCHEIDUNG_PFLICHT_AB = ("In Bearbeitung", "Einsatz geplant", "Erledigt", "Geschlossen")
UNTERNEHMER_KONTAKTARTEN = ("Geschaeft", "Architekt", "Partner", "Lieferant")

KOSTEN_INTERN = ("Intern Arbeitszeit", "Intern Anfahrt", "Sonstiges")
KOSTEN_EXTERN = ("Ersatzteil", "Extern Fremdleistung", "Extern Transport")
KOSTEN_KULANZ = ("Kulanz", "Preisminderung")


def ist_leitung(user=None):
    user = user or frappe.session.user
    return user == "Administrator" or bool(set(LEITUNG) & set(frappe.get_roles(user)))


class PHServicefall(Document):
    # ── Lebenszyklus ────────────────────────────────────────────────────────

    def before_insert(self):
        einst = einstellungen()
        if not self.gemeldet_am:
            self.gemeldet_am = now_datetime()
        if not self.status:
            self.status = "Gemeldet"
        if not self.prioritaet:
            self.prioritaet = einst["standard_prioritaet"]
        if not self.frist_reaktion:
            self.frist_reaktion = fr.reaktionsfrist(getdate(self.gemeldet_am), einst["reaktion_werktage"])
        if self.portal_sichtbar is None:
            self.portal_sichtbar = cint(einst["portal_sichtbar_standard"])
        if not self.verantwortlich and frappe.session.user not in ("Administrator", "Guest") and "PH Service Mitarbeiter" in frappe.get_roles():
            self.verantwortlich = frappe.session.user
        self.letzte_bewegung = now_datetime()
        kom.verlauf(self, "Status", status="Gemeldet", hinweis=_("Servicefall angelegt ({0})").format(self.kanal or "–"))

    def validate(self):
        self.kunde_email = (self.kunde_email or "").strip().lower() or None
        self._kontakt_uebernehmen()
        self._bezug_uebernehmen()
        self._fehlercode_abgleichen()
        self._fristen_berechnen()
        self._kosten_summieren()
        self._entscheidung_pruefen()
        self._status_pruefen()
        self.titel = self.bilde_titel()
        if not self.is_new():
            self.letzte_bewegung = now_datetime()

    def on_update(self):
        if self.verantwortlich and self.has_value_changed("verantwortlich"):
            try:
                from frappe.desk.form.assign_to import add, clear

                clear(self.doctype, self.name)
                add({"assign_to": [self.verantwortlich], "doctype": self.doctype, "name": self.name, "description": self.titel})
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Servicefall: Zuweisung fehlgeschlagen")

    # ── Teilprüfungen ───────────────────────────────────────────────────────

    def bilde_titel(self):
        produkt = self.produkt_name or self.produkt or (self.fehlercode_bezeichnung or "")
        kunde = self.kunde_name or self.kontakt or "ohne Kunde"
        teile = [f"{self.art}: {kunde}"]
        if produkt:
            teile.append(produkt)
        return " – ".join(teile)[:140]

    def _kontakt_uebernehmen(self):
        """Name, E-Mail, Telefon, Kundentyp und Adresse aus PH Kontakt (ph_crm), ohne vorhandene Werte zu überschreiben."""
        if not self.kontakt or not frappe.db.exists("DocType", "PH Kontakt"):
            return
        try:
            k = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "firma", "email", "telefon", "mobil", "kontaktart", "strasse", "plz", "ort", "land", "sprache"], as_dict=True)
        except Exception:  # noqa: BLE001 – PH Kontakt hat (noch) andere Felder
            k = None
        if not k:
            return
        self.kunde_name = (" ".join(x for x in (k.vorname, k.nachname) if x) or k.firma or self.kontakt)[:140]
        self.kunde_email = self.kunde_email or (k.email or "").lower() or None
        self.kunde_telefon = self.kunde_telefon or k.telefon or k.mobil
        if self.is_new() and k.kontaktart in UNTERNEHMER_KONTAKTARTEN and not self.kundentyp:
            self.kundentyp = "Unternehmer"  # Vorbelegung aus PH Kontakt.kontaktart; manuell gesetzter Wert bleibt
        if not self.einsatz_strasse and not self.einsatz_ort:
            self.einsatz_strasse, self.einsatz_plz, self.einsatz_ort = k.strasse, k.plz, k.ort
            self.einsatz_land = k.land or self.einsatz_land
        if k.sprache in ("de", "en", "fr", "it") and self.is_new():
            self.sprache = k.sprache

    def _bezug_uebernehmen(self):
        """Kauf-/Übergabedatum aus Rechnung bzw. Lieferschein, wenn leer (Felder laut PLAN WP6/WP7)."""
        if not self.kaufdatum:
            for dt, feld, spalte in (("PH Rechnung", "rechnung", "datum"), ("PH Auftragsbestaetigung", "auftrag", "datum"), ("PH Bestellung", "bestellung", "bezahlt_am")):
                if self.get(feld) and frappe.db.exists("DocType", dt):
                    try:
                        wert = frappe.db.get_value(dt, self.get(feld), spalte)
                    except Exception:  # noqa: BLE001
                        wert = None
                    if wert:
                        self.kaufdatum = getdate(wert)
                        break
        if not self.uebergabe_datum:
            for dt, feld, spalte in (("PH Lieferschein", "lieferschein", "zugestellt_am"), ("PH Produktpass", "produktpass", "lieferdatum")):
                if self.get(feld) and frappe.db.exists("DocType", dt):
                    try:
                        wert = frappe.db.get_value(dt, self.get(feld), spalte)
                    except Exception:  # noqa: BLE001
                        wert = None
                    if wert:
                        self.uebergabe_datum = getdate(wert)
                        break
        if self.produkt and not self.produkt_name and frappe.db.exists("DocType", "PH Produkt"):
            try:
                self.produkt_name = frappe.db.get_value("PH Produkt", self.produkt, "name_herstellerbezeichnung") or self.produkt
            except Exception:  # noqa: BLE001
                self.produkt_name = self.produkt

    def _fehlercode_abgleichen(self):
        if self.fehlercode:
            bereich = frappe.db.get_value("PH Fehlercode", self.fehlercode, "bereich")
            if bereich:
                if self.fehlerbereich and self.fehlerbereich != bereich:
                    frappe.throw(_("Fehlercode {0} gehört zum Bereich {1}.").format(self.fehlercode, bereich))
                self.fehlerbereich = bereich
        if self.art == "Transportschaden" and not self.fehlerbereich:
            self.fehlerbereich = "TRA" if frappe.db.exists("PH Fehlerbereich", "TRA") else None
        if self.art == "Pflegefrage" and not self.fehlerbereich:
            self.fehlerbereich = "PFL" if frappe.db.exists("PH Fehlerbereich", "PFL") else None

    def _fristen_berechnen(self):
        einst = einstellungen()
        vermutung = einst["vermutung_verbraucher_monate"] if self.kundentyp == "Verbraucher" else einst["vermutung_unternehmer_monate"]
        f = fr.fristen(
            kaufdatum=self.kaufdatum,
            uebergabe=self.uebergabe_datum,
            kundentyp=self.kundentyp,
            garantie_monate=self.garantie_monate,
            gewaehrleistung_monate=einst["gewaehrleistung_monate"],
            vermutung_monate=vermutung,
            erledigt_am=getdate(self.erledigt_am) if self.erledigt_am else None,
            lieferung_an_haendler=self.lieferung_an_haendler,
        )
        self.gewaehrleistung_bis = f["gewaehrleistung_bis"]
        self.beweislast_bis = f["beweislast_bis"]
        self.verjaehrung_bis = f["verjaehrung_bis"]
        self.garantie_bis = f["garantie_bis"]
        self.regress_frist_bis = f["regress_frist_bis"]
        self.fristen_status = f["status"]
        self.beweislast_bei = {"Unternehmer": _("Platzhirsch (Vermutung)"), "Kunde": _("Kunde")}.get(f["beweislast"], "–")
        hinweis = f["hinweis"]
        if self.kundentyp == "Unternehmer" and f["status"] != fr.STATUS_UNBEKANNT:
            hinweis += " " + _("Unternehmer: Mängelrüge § 377 UGB prüfen.")
        if f["status"] == fr.STATUS_ABGELAUFEN and self.art not in ("Kulanz", "Pflegefrage", "Serviceauftrag"):
            hinweis += " " + _("Art auf Kulanz oder Serviceauftrag (kostenpflichtig) prüfen.")
        self.rechtsgrundlage_hinweis = hinweis

    def _kosten_summieren(self):
        intern = extern = kulanz = 0
        for z in self.kosten or []:
            betrag = cint(z.betrag_cent)
            if z.art in KOSTEN_INTERN:
                intern += betrag
            elif z.art in KOSTEN_EXTERN:
                extern += betrag
            elif z.art in KOSTEN_KULANZ:
                kulanz += betrag
        kulanz += cint(self.kulanz_cent) + cint(self.preisminderung_cent)
        self.kosten_intern_cent = intern
        self.kosten_extern_cent = extern
        self.kosten_kulanz_cent = kulanz
        self.kosten_gesamt_cent = intern + extern + kulanz
        self.netto_kosten_cent = self.kosten_gesamt_cent - cint(self.kosten_kunde_cent) - cint(self.regress_erhalten_cent)
        if self.kosten_kunde_cent and self.fristen_status in (fr.STATUS_VERMUTUNG,) and self.mangel_bestaetigt == "Ja":
            frappe.msgprint(_("Achtung: Kosten an den Kunden trotz bestätigtem Mangel innerhalb der Vermutungsfrist."), indicator="orange")

    def _entscheidung_pruefen(self):
        einst = einstellungen()
        self.kulanz_freigabe_noetig = int(cint(self.kulanz_cent) > cint(einst["kulanz_schwelle_cent"]))
        if self.has_value_changed("entscheidung") and self.entscheidung:
            if not strip_html(self.entscheidung_begruendung or "").strip():
                frappe.throw(_("Jede Entscheidung braucht eine Begründung."))
            self.entschieden_von = frappe.session.user
            self.entschieden_am = now_datetime()
            if self.entscheidung in ("Preisminderung", "Wandlung") and self.kundentyp == "Verbraucher" and self.mangel_bestaetigt == "Ja" and not self.flags.vorrang_bestaetigt:
                frappe.msgprint(_("Hinweis VGG § 12: Preisminderung/Vertragsauflösung erst, wenn Verbesserung/Austausch unmöglich, unverhältnismäßig oder gescheitert ist. Bitte in der Begründung festhalten."), indicator="orange")
        if self.kulanz_freigabe_noetig and not self.kulanz_freigegeben_von and ist_leitung() and self.entscheidung:
            self.kulanz_freigegeben_von = frappe.session.user
        if self.kulanz_freigabe_noetig and not self.kulanz_freigegeben_von and self.status in ENTSCHEIDUNG_PFLICHT_AB:
            frappe.throw(_("Kulanz über {0} € braucht die Freigabe der Service-Leitung.").format(cint(einst["kulanz_schwelle_cent"]) // 100))

    def _status_pruefen(self):
        if not self.has_value_changed("status"):
            return
        alt = self.get_doc_before_save().status if self.get_doc_before_save() else None
        neu = self.status
        if neu == "Geprueft" and not self.fehlercode:
            frappe.throw(_("Vor der Prüfung einen Fehlercode zuordnen."))
        if neu in ENTSCHEIDUNG_PFLICHT_AB and not self.entscheidung:
            frappe.throw(_("Zuerst eine Entscheidung (Verbesserung, Austausch, Preisminderung, Wandlung, Kulanz) treffen."))
        if neu in ("Erledigt", "Abgelehnt") and not strip_html(self.abschlussbericht or "").strip():
            frappe.throw(_("{0} nur mit Abschlussbericht.").format(_(neu)))
        if neu == "Abgelehnt":
            if not strip_html(self.entscheidung_begruendung or "").strip():
                frappe.throw(_("Ablehnung nur mit Begründung."))
            self.entscheidung = "Abgelehnt"
            if not self.ablehnungsgrund:
                self.ablehnungsgrund = "Sonstiges"
        if alt == "Gemeldet" and not self.erstreaktion_am:
            self.erstreaktion_am = now_datetime()
        if neu == "Erledigt":
            self.erledigt_am = self.erledigt_am or now_datetime()
            self.dauer_tage = fr.durchlaufzeit_tage(getdate(self.gemeldet_am), getdate(self.erledigt_am))
            self.regress_frist_bis = fr.monate_dazu(getdate(self.erledigt_am), fr.REGRESS_MONATE)
            offen = [z for z in self.ersatzteile or [] if z.status in ("Benoetigt", "Bestellt")]
            if offen:
                frappe.msgprint(_("{0} Ersatzteil-Zeile(n) sind noch nicht verbaut.").format(len(offen)), indicator="orange")
        if neu == "Geschlossen":
            self.geschlossen_am = now_datetime()
            if not self.erledigt_am and alt != "Abgelehnt":
                self.erledigt_am = now_datetime()
                self.dauer_tage = fr.durchlaufzeit_tage(getdate(self.gemeldet_am), getdate(self.erledigt_am))
        if neu in OFFEN and alt in ABGESCHLOSSEN:
            self.erledigt_am = None
            self.geschlossen_am = None
            self.dauer_tage = None
        kom.verlauf(self, "Status", status=neu, hinweis=_("{0} → {1}").format(alt or "–", neu))

    # ── interne Helfer ──────────────────────────────────────────────────────

    def _status_setzen(self, status, hinweis=None):
        """Status + Workflow-Zustand konsistent setzen (Server-Methoden statt Workflow-Klick)."""
        self.status = status
        if self.meta.has_field("workflow_state"):
            self.workflow_state = f"PH {status}"
        if hinweis:
            kom.verlauf(self, "Notiz", status=status, hinweis=hinweis)
        self.save()

    def _pruefen_schreibrecht(self):
        self.check_permission("write")

    def fotos_urls(self, nur_lieferant=False):
        return [z.bild for z in self.fotos or [] if z.bild and (not nur_lieferant or z.an_lieferant)]

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def fristen_info(self):
        """Für die Fristen-Ampel im Formular (HTML wird im Client gerendert)."""
        f = fr.fristen(self.kaufdatum, self.uebergabe_datum, self.kundentyp, self.garantie_monate, erledigt_am=getdate(self.erledigt_am) if self.erledigt_am else None, lieferung_an_haendler=self.lieferung_an_haendler)
        return {k: (str(v) if hasattr(v, "isoformat") else v) for k, v in f.items()}

    @frappe.whitelist()
    def einsatz_anlegen(self, datum, zeit_von=None, zeit_bis=None, techniker=None, hinweis=None, art="Reparatur"):
        """Button „Einsatz planen“: PH Serviceeinsatz anlegen, Status → Einsatz geplant."""
        self._pruefen_schreibrecht()
        einsatz = frappe.get_doc(
            {
                "doctype": "PH Serviceeinsatz",
                "servicefall": self.name,
                "art": art,
                "techniker": techniker or einstellungen()["techniker_standard"],
                "datum": datum,
                "zeit_von": zeit_von,
                "zeit_bis": zeit_bis,
                "hinweis_intern": hinweis,
            }
        ).insert()
        # Statuswechsel nur, wenn eine Entscheidung vorliegt (sonst Besichtigung/Prüftermin ohne Statuswechsel).
        if self.entscheidung and self.status in ("Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung"):
            self._status_setzen("Einsatz geplant", _("Einsatz {0} am {1}").format(einsatz.name, datum))
        else:
            kom.verlauf(self, "Einsatz", hinweis=_("Einsatz {0} am {1}").format(einsatz.name, datum), speichern=True)
        return einsatz.name

    @frappe.whitelist()
    def ersatzteile_bestellen(self, lieferant=None):
        """Button „Ersatzteile bestellen“: PH Ersatzteilbestellung aus allen benötigten Zeilen ohne Bestellung."""
        self._pruefen_schreibrecht()
        zeilen = [z for z in self.ersatzteile or [] if z.status == "Benoetigt" and not z.bestellung]
        if not zeilen:
            frappe.throw(_("Keine Ersatzteil-Zeile mit Status „Benoetigt“ ohne Bestellung."))
        lieferant = lieferant or self.lieferant
        if not lieferant:
            frappe.throw(_("Lieferant fehlt (am Servicefall oder im Dialog)."))
        best = frappe.get_doc(
            {
                "doctype": "PH Ersatzteilbestellung",
                "lieferant": lieferant,
                "marke": self.marke,
                "servicefall": self.name,
                "kostentraeger": zeilen[0].kostentraeger or "Gewaehrleistung",
                "kommission": f"{self.name} / {self.kunde_name or ''}"[:140],
                "positionen": [
                    {"ersatzteil": z.ersatzteil, "bezeichnung": z.bezeichnung, "hersteller_nr": z.hersteller_nr, "menge": z.menge, "servicefall_zeile": z.name}
                    for z in zeilen
                ],
            }
        ).insert()
        for z in zeilen:
            z.db_set({"status": "Bestellt", "bestellung": best.name})
        kom.verlauf(self, "Ersatzteil", hinweis=_("Ersatzteilbestellung {0} ({1} Positionen)").format(best.name, len(zeilen)), speichern=True)
        return best.name

    @frappe.whitelist()
    def regress_anlegen(self, betrag_cent=None):
        """Button „Regress anlegen“: PH Lieferantenregress (offen) mit regressfähigen Kosten als Forderung."""
        self._pruefen_schreibrecht()
        if not self.lieferant:
            frappe.throw(_("Lieferant fehlt – Regress braucht einen Vormann (§ 933b ABGB)."))
        vorhanden = frappe.db.get_value("PH Lieferantenregress", {"servicefall": self.name, "status": ("not in", ["Abgelehnt", "Verrechnet"])}, "name")
        if vorhanden:
            return vorhanden
        if betrag_cent is None:
            betrag_cent = sum(cint(z.betrag_cent) for z in self.kosten or [] if z.regressfaehig) or self.kosten_gesamt_cent
        regress = frappe.get_doc(
            {
                "doctype": "PH Lieferantenregress",
                "servicefall": self.name,
                "lieferant": self.lieferant,
                "marke": self.marke,
                "betrag_gefordert_cent": cint(betrag_cent),
                "beschreibung": strip_html(self.beschreibung or "")[:2000],
            }
        ).insert()
        kom.verlauf(self, "Regress", hinweis=_("Regress {0} angelegt ({1} Cent)").format(regress.name, cint(betrag_cent)), speichern=True)
        return regress.name

    @frappe.whitelist()
    def kunde_informieren(self, vorlage="eingang", zusatz=""):
        """Button „Kunde informieren“: Email Template (Eingang/Termin/Abschluss) an die Kundenadresse."""
        self._pruefen_schreibrecht()
        if vorlage not in ("eingang", "termin", "abschluss"):
            frappe.throw(_("Unbekannte Vorlage."))
        anhaenge = []
        if vorlage == "abschluss":
            pdf = kom.pdf_anhang(self.doctype, self.name, "PH Servicefall Abnahmebestätigung", f"Abnahme-{self.name}")
            if pdf:
                anhaenge.append(pdf)
        betreff = kom.sende_vorlage(self, vorlage, self.kunde_email, anhaenge=anhaenge, zusatz=zusatz)
        werte = {"kunde_informiert_am": now_datetime()}
        if not self.erstreaktion_am:
            werte["erstreaktion_am"] = now_datetime()
        self.db_set(werte)
        return betreff

    @frappe.whitelist()
    def lieferant_informieren(self, empfaenger=None, zusatz=""):
        """Button „Lieferant informieren“: Reklamationsmeldung (PDF + Fotos) an den Lieferanten; legt Regress an, wenn lieferantenrelevant."""
        self._pruefen_schreibrecht()
        if not self.lieferant:
            frappe.throw(_("Lieferant fehlt."))
        if not empfaenger and frappe.db.exists("DocType", "PH Lieferant"):
            try:
                empfaenger = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            except Exception:  # noqa: BLE001
                empfaenger = None
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt – bitte im Dialog eingeben."))
        anhaenge = kom.datei_anhaenge(self.fotos_urls(nur_lieferant=True))
        pdf = kom.pdf_anhang(self.doctype, self.name, "PH Servicefall Reklamationsmeldung", f"Reklamation-{self.name}")
        if pdf:
            anhaenge.insert(0, pdf)
        regress = None
        if self.lieferantenrelevant or self.art == "Transportschaden":
            regress = self.regress_anlegen()
        kom.sende_vorlage(self, "regress", empfaenger, anhaenge=anhaenge, zusatz=zusatz, regress=regress)
        if regress:
            frappe.db.set_value("PH Lieferantenregress", regress, {"gemeldet_am": nowdate(), "status": "Gemeldet", "workflow_state": "PH Regress gemeldet"} if frappe.get_meta("PH Lieferantenregress").has_field("workflow_state") else {"gemeldet_am": nowdate(), "status": "Gemeldet"})
            self.db_set("regress_status", "Gemeldet")
        return regress

    @frappe.whitelist()
    def gutschrift_erstellen(self):
        """Button „Gutschrift/Kulanz“: Entwurf PH Gutschrift (ph_faktura) zur Rechnung."""
        self._pruefen_schreibrecht()
        if self.gutschrift:
            return self.gutschrift
        if not frappe.db.exists("DocType", "PH Gutschrift"):
            frappe.throw(_("DocType PH Gutschrift ist noch nicht installiert (Arbeitspaket ph_faktura)."))
        if not self.rechnung:
            frappe.throw(_("Gutschrift braucht eine verknüpfte Rechnung."))
        betrag = cint(self.preisminderung_cent) or cint(self.kulanz_cent)
        if betrag <= 0:
            frappe.throw(_("Preisminderung oder Kulanzbetrag eintragen."))
        art = "Wertminderung" if self.entscheidung == "Preisminderung" else "Kulanz"
        gs = frappe.get_doc(
            {
                "doctype": "PH Gutschrift",
                "rechnung": self.rechnung,
                "kontakt": self.kontakt,
                "art": art,
                "grund": _("Servicefall {0}: {1}").format(self.name, strip_html(self.entscheidung_begruendung or "")[:200]),
                "positionen": [{"art": "Leistung", "beschreibung": _("{0} zu Servicefall {1}").format(art, self.name), "menge": 1, "einzel_netto_cent": betrag, "netto_cent": betrag, "brutto_cent": betrag, "ust_satz_promille": 0}],
            }
        )
        gs.flags.ignore_mandatory = True
        gs.insert()
        self.db_set("gutschrift", gs.name)
        kom.verlauf(self, "Notiz", hinweis=_("Gutschrift {0} ({1} Cent) als Entwurf").format(gs.name, betrag), speichern=True)
        return gs.name

    @frappe.whitelist()
    def erledigt_melden(self, abschlussbericht=None):
        """Button „Erledigt + Bericht“: Abschlussbericht setzen, Status Erledigt."""
        self._pruefen_schreibrecht()
        if abschlussbericht:
            self.abschlussbericht = abschlussbericht
        self._status_setzen("Erledigt")
        return self.status

    @frappe.whitelist()
    def ablehnen(self, grund, begruendung):
        """Button „Ablehnen“ (Leitung): Begründung an Kunden, Status Abgelehnt."""
        self._pruefen_schreibrecht()
        if not ist_leitung():
            frappe.throw(_("Ablehnen darf nur die Service-Leitung."))
        self.ablehnungsgrund = grund
        self.entscheidung = "Abgelehnt"
        self.entscheidung_begruendung = begruendung
        if not strip_html(self.abschlussbericht or "").strip():
            self.abschlussbericht = begruendung
        self._status_setzen("Abgelehnt")
        return self.status

    @frappe.whitelist()
    def abnahme_erfassen(self, name, unterschrift, zufriedenheit=None, kommentar=None):
        """Abnahmebestätigung des Kunden (Unterschrift aus Signature-Feld, z. B. Tablet)."""
        self._pruefen_schreibrecht()
        werte = {"abnahme_bestaetigt": 1, "abnahme_am": now_datetime(), "abnahme_name": (name or "")[:140], "abnahme_unterschrift": unterschrift}
        if zufriedenheit is not None:
            werte["zufriedenheit"] = float(zufriedenheit)
        if kommentar:
            werte["zufriedenheit_kommentar"] = kommentar[:500]
        self.db_set(werte)
        kom.verlauf(self, "Notiz", hinweis=_("Abnahme bestätigt von {0}").format(name), speichern=True)
        return True

    @frappe.whitelist()
    def neu_oeffnen(self, grund):
        """Button „Wieder öffnen“ (Leitung)."""
        self._pruefen_schreibrecht()
        if not ist_leitung():
            frappe.throw(_("Wieder öffnen darf nur die Service-Leitung."))
        self._status_setzen("In Bearbeitung", _("Wieder geöffnet: {0}").format(grund))
        return self.status


# ── Modul-Funktionen ────────────────────────────────────────────────────────


@frappe.whitelist()
def aus_dokument(doctype, name, beschreibung=None, art=None, produkt=None, fehlercode=None):
    """„Servicefall anlegen“ aus PH Montageauftrag, PH Abnahme, PH Wareneingang, PH Lieferschein, PH Bestellung, PH Rechnung
    (Client-Script-Fixtures). Liest nur Felder, die laut PLAN dort heißen; fehlende werden übersprungen."""
    frappe.has_permission("PH Servicefall", "create", throw=True)
    quelle = frappe.get_doc(doctype, name)
    werte = {"doctype": "PH Servicefall", "kanal": "Intern", "quelle": "backoffice", "beschreibung": beschreibung or _("Aus {0} {1}").format(doctype, name)}

    def nimm(feld, ziel=None):
        wert = quelle.get(feld)
        if wert:
            werte[ziel or feld] = wert

    nimm("kontakt")
    nimm("projekt")
    nimm("produkt")
    nimm("bestellung")
    nimm("auftrag")
    nimm("rechnung")
    nimm("lieferschein")
    if produkt:
        werte["produkt"] = produkt
    if fehlercode:
        werte["fehlercode"] = fehlercode
    if doctype == "PH Montageauftrag":
        werte.update(montageauftrag=name, art=art or "Montagefehler", kanal="Montage", quelle="montage")
        if quelle.get("projekt") and not werte.get("kontakt") and frappe.db.exists("DocType", "PH Projekt"):
            werte["kontakt"] = frappe.db.get_value("PH Projekt", quelle.projekt, "kontakt")
    elif doctype == "PH Abnahme":
        werte.update(art=art or "Mangel", kanal="Montage", quelle="abnahme")
        if quelle.get("projekt") and not werte.get("kontakt") and frappe.db.exists("DocType", "PH Projekt"):
            werte["kontakt"] = frappe.db.get_value("PH Projekt", quelle.projekt, "kontakt")
    elif doctype == "PH Wareneingang":
        werte.update(wareneingang=name, art=art or "Transportschaden", kanal="Wareneingang", quelle="wareneingang")
        hb = quelle.get("herstellerbestellung")
        if hb and frappe.db.exists("DocType", "PH Herstellerbestellung"):
            werte["lieferant"] = frappe.db.get_value("PH Herstellerbestellung", hb, "lieferant")
    elif doctype == "PH Lieferschein":
        werte.update(lieferschein=name, art=art or "Transportschaden")
    elif doctype == "PH Bestellung":
        werte.update(bestellung=name, art=art or "Mangel")
    elif doctype == "PH Rechnung":
        werte.update(rechnung=name, art=art or "Mangel")
    if not werte.get("kontakt"):
        frappe.throw(_("Kein Kontakt ermittelbar – bitte den Servicefall manuell anlegen."))
    doc = frappe.get_doc(werte).insert()
    if hasattr(quelle, "add_comment"):
        quelle.add_comment("Info", _("Servicefall {0} angelegt").format(doc.name))
    return doc.name


def offene_anzahl():
    return frappe.db.count("PH Servicefall", {"status": ("in", OFFEN)})


def ueberfaellige_reaktion(datum=None):
    return frappe.get_all("PH Servicefall", filters={"status": "Gemeldet", "erstreaktion_am": ("is", "not set"), "frist_reaktion": ("<", datum or nowdate())}, fields=["name", "titel", "verantwortlich", "frist_reaktion"])


def ohne_bewegung(tage):
    grenze = add_days(now_datetime(), -int(tage))
    return frappe.get_all("PH Servicefall", filters={"status": ("in", OFFEN), "letzte_bewegung": ("<", grenze)}, fields=["name", "titel", "verantwortlich", "letzte_bewegung", "eskalationsstufe", "prioritaet"])


def _dt(wert):
    return get_datetime(wert) if wert else None
