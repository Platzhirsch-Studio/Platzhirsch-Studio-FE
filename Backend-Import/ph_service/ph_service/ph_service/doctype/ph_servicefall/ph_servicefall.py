"""PH Servicefall – Controller.

validate()      Kundendaten übernehmen, Fehlercode/Bereich abgleichen, Fristen (VGG/ABGB) berechnen, Kosten summieren,
                Entscheidung prüfen (Begründung, Kulanzschwelle), Statuswechsel protokollieren, Titel.
before_insert() Eingang, Reaktionsfrist, Standardwerte.
on_update()     Zuweisung spiegeln, Produktpass/Projekt-Hinweis – nie Fehler werfen.
Dokument-Methoden (Buttons in ph_servicefall.js): einsatz_anlegen, ersatzteile_bestellen, regress_anlegen,
kunde_informieren, lieferant_informieren, gutschrift_erstellen, erledigt_melden, ablehnen, abnahme_erfassen,
erstreaktion_erfassen, kulanz_anfordern, kulanz_freigeben, kulanz_ablehnen, sla_info.
SLA (Reaktion/Lösung je Priorität, Werktage ohne Feiertage): ph_service/utils/sla.py; Kulanzfreigabe: utils/kulanz.py.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, get_datetime, getdate, now_datetime, nowdate, strip_html

from ph_service.ph_service import fristen as fr
from ph_service.ph_service import kommunikation as kom
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen, feiertage, sla_tabellen
from ph_service.utils import kulanz as kul
from ph_service.utils import sla

OFFEN = ("Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant")
ABGESCHLOSSEN = ("Erledigt", "Geschlossen", "Abgelehnt")
LEITUNG = ("PH Service Leitung", "PH Geschäftsführung", "System Manager", "Administrator")
ENTSCHEIDUNG_PFLICHT_AB = ("In Bearbeitung", "Einsatz geplant", "Erledigt", "Geschlossen")
UNTERNEHMER_KONTAKTARTEN = ("Geschaeft", "Architekt", "Partner", "Lieferant")
ERSTREAKTION_KANAELE = ("Telefon", "Showroom")  # Kunde wurde bei der Meldung bereits beraten (Kritik 20-ux-service P1)

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
        self._sla_fristen_setzen(neu=True)
        if self.kanal in ERSTREAKTION_KANAELE and cint(einst["telefon_ist_erstreaktion"]) and not self.erstreaktion_am and self.quelle in (None, "", "backoffice"):
            self.erstreaktion_am = self.gemeldet_am
            self.erstreaktion_kanal = "Telefon" if self.kanal == "Telefon" else "Vor Ort"
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
        self._sla_pruefen()
        self.titel = self.bilde_titel()
        if not self.is_new():
            self.letzte_bewegung = now_datetime()

    def on_update(self):
        if self.kulanz_freigabe_status == kul.ANGEFORDERT and self.has_value_changed("kulanz_freigabe_status"):
            self._kulanz_benachrichtigen()
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
            # Gewährleistung beginnt mit der Übergabe (§ 933 ABGB): Zustellung, Montage-Abnahme, Projektübergabe, Produktpass.
            for dt, feld, spalte in (
                ("PH Lieferschein", "lieferschein", "zugestellt_am"),
                ("PH Montageauftrag", "montageauftrag", "abgenommen_am"),
                ("PH Produktpass", "produktpass", "lieferdatum"),
                ("PH Projekt", "projekt", "uebergabe_am"),
            ):
                if self.get(feld) and frappe.db.exists("DocType", dt):
                    try:
                        wert = frappe.db.get_value(dt, self.get(feld), spalte)
                    except Exception:  # noqa: BLE001
                        wert = None
                    if wert:
                        self.uebergabe_datum = getdate(wert)
                        self.uebergabe_quelle = f"{dt} {self.get(feld)} ({spalte})"[:140]
                        break
        if self.produktpass and not cint(self.garantie_monate) and frappe.db.exists("DocType", "PH Produktpass"):
            try:
                pp = frappe.db.get_value("PH Produktpass", self.produktpass, ["garantie_monate", "seriennummer", "marke"], as_dict=True)
            except Exception:  # noqa: BLE001
                pp = None
            if pp:
                self.garantie_monate = cint(pp.garantie_monate) or self.garantie_monate
                self.seriennummer = self.seriennummer or pp.seriennummer
                self.marke = self.marke or pp.marke
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
            sachart=self.sachart or "Beweglich",
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
        # Freigabe deckt nur den freigegebenen Betrag; Erhöhung → neue Anforderung (utils/kulanz.py).
        alt_status = self.kulanz_freigabe_status
        status = kul.freigabe_status(self.kulanz_cent, einst["kulanz_schwelle_cent"], self.kulanz_freigegeben_cent, self.kulanz_abgelehnt_cent)
        if status == kul.ANGEFORDERT and self.kulanz_freigegeben_von:
            self.kulanz_freigegeben_von = None  # alte Freigabe galt für einen kleineren Betrag
            self.kulanz_freigegeben_am = None
        if status == kul.ANGEFORDERT and alt_status != kul.ANGEFORDERT:
            self.kulanz_angefordert_am = now_datetime()
        self.kulanz_freigabe_status = status
        self.kulanz_freigabe_noetig = int(status != kul.NICHT_NOETIG)  # Schwelle überschritten (Workflow-Bedingung)
        if self.has_value_changed("entscheidung") and self.entscheidung:
            if not strip_html(self.entscheidung_begruendung or "").strip():
                frappe.throw(_("Jede Entscheidung braucht eine Begründung."))
            self.entschieden_von = frappe.session.user
            self.entschieden_am = now_datetime()
            if self.entscheidung in ("Preisminderung", "Wandlung") and self.kundentyp == "Verbraucher" and self.mangel_bestaetigt == "Ja" and not self.flags.vorrang_bestaetigt:
                frappe.msgprint(_("Hinweis VGG § 12: Preisminderung/Vertragsauflösung erst, wenn Verbesserung/Austausch unmöglich, unverhältnismäßig oder gescheitert ist. Bitte in der Begründung festhalten."), indicator="orange")
        if self.kulanz_freigabe_status == kul.ANGEFORDERT and ist_leitung() and self.entscheidung and not self.flags.ohne_selbstfreigabe:
            self._kulanz_freigabe_setzen(_("Freigabe durch Leitung beim Entscheiden"))
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

    # ── SLA ─────────────────────────────────────────────────────────────────

    def _sla_fristen_setzen(self, neu=False):
        """Reaktions-/Lösungsfrist aus der Priorität (Werktage ohne Wochenende/Feiertage, utils/sla.py).
        Beim Anlegen bleibt eine mitgegebene Frist (Import); die Reaktionsfrist ändert sich nach der Erstreaktion nicht mehr."""
        reaktion, loesung = sla_tabellen()
        f = sla.fristen(getdate(self.gemeldet_am or now_datetime()), self.prioritaet or "Normal", reaktion, loesung, feiertage())
        if not (neu and self.frist_reaktion) and not self.erstreaktion_am:
            self.frist_reaktion = f["frist_reaktion"]
        if not (neu and self.frist_loesung):
            # bereits pausierte Werktage („wartet auf Hersteller/Ersatzteil/Kunde“) bleiben hinzugerechnet
            self.frist_loesung = sla.frist_verschieben(f["frist_loesung"], cint(self.sla_pause_werktage), feiertage())

    def _sla_pruefen(self):
        if not self.is_new() and self.has_value_changed("prioritaet"):
            self._sla_fristen_setzen()
            kom.verlauf(self, "SLA", status=self.status, hinweis=_("Priorität {0}: Reaktion bis {1}, Lösung bis {2}").format(_(self.prioritaet), self.frist_reaktion, self.frist_loesung))
        einst = einstellungen()
        erledigt = getdate(self.erledigt_am) if self.erledigt_am else None
        if self.status == "Abgelehnt" and not erledigt:
            erledigt = getdate(nowdate())
        if erledigt and self.sla_pausiert_seit:
            self._sla_pause_beenden(automatisch=True)
        st = sla.status(getdate(nowdate()), self.frist_reaktion, self.frist_loesung, getdate(self.erstreaktion_am) if self.erstreaktion_am else None, erledigt, cint(einst["sla_warn_werktage"]), feiertage(), pausiert_seit=getdate(self.sla_pausiert_seit) if self.sla_pausiert_seit else None)
        self.sla_status = st["status"]
        self.sla_reaktion_verletzt = int(st["reaktion_verletzt"])
        self.sla_loesung_verletzt = int(st["loesung_verletzt"])

    @frappe.whitelist()
    def sla_info(self):
        """Für das SLA-Band im Formular: Fristen, Zustand, Rest-Werktage, Eskalationsstufe."""
        einst = einstellungen()
        heute = getdate(nowdate())
        ft = feiertage()
        erledigt = getdate(self.erledigt_am) if self.erledigt_am else None
        st = sla.status(heute, self.frist_reaktion, self.frist_loesung, getdate(self.erstreaktion_am) if self.erstreaktion_am else None, erledigt, cint(einst["sla_warn_werktage"]), ft, pausiert_seit=getdate(self.sla_pausiert_seit) if self.sla_pausiert_seit else None)
        st.update(
            pause_grund=self.sla_pause_grund or None,
            pausiert_seit=str(self.sla_pausiert_seit) if self.sla_pausiert_seit else None,
            pause_werktage=cint(self.sla_pause_werktage),
            frist_reaktion=str(self.frist_reaktion) if self.frist_reaktion else None,
            frist_loesung=str(self.frist_loesung) if self.frist_loesung else None,
            prioritaet=self.prioritaet,
            eskalationsstufe=sla.eskalationsstufe(heute, self.frist_loesung, erledigt, feiertage=ft),
        )
        return st

    def _sla_pause_beenden(self, automatisch=False):
        """Pause beenden: pausierte Werktage zur Lösungsfrist addieren (utils/sla.py)."""
        if not self.sla_pausiert_seit:
            return 0
        ft = feiertage()
        tage = sla.pause_werktage(getdate(self.sla_pausiert_seit), getdate(nowdate()), ft)
        self.sla_pause_werktage = cint(self.sla_pause_werktage) + tage
        self.frist_loesung = sla.frist_verschieben(self.frist_loesung, tage, ft)
        kom.verlauf(self, "SLA", status=self.status, hinweis=_("SLA fortgesetzt{0} nach Warten auf {1}: +{2} Werktage, Lösung bis {3}").format(_(" (automatisch)") if automatisch else "", _(self.sla_pause_grund or "–"), tage, self.frist_loesung))
        self.sla_pause_grund = None
        self.sla_pausiert_seit = None
        return tage

    @frappe.whitelist()
    def sla_pausieren(self, grund="Hersteller", hinweis=None):
        """SLA-Lösungsfrist anhalten, solange der Fall auf Hersteller, Ersatzteil oder Kunde wartet (Nr. 54, Zendesk „On-hold“).
        Die Reaktionsfrist wird nicht pausiert."""
        self._pruefen_schreibrecht()
        if grund not in ("Hersteller", "Ersatzteil", "Kunde"):
            frappe.throw(_("Grund: Hersteller, Ersatzteil oder Kunde."))
        if self.status not in OFFEN:
            frappe.throw(_("Nur offene Fälle können pausiert werden."))
        if self.sla_pausiert_seit:
            return str(self.sla_pausiert_seit)
        self.sla_pause_grund = grund
        self.sla_pausiert_seit = now_datetime()
        kom.verlauf(self, "SLA", status=self.status, hinweis=_("SLA pausiert – wartet auf {0}{1}").format(_(grund), f": {hinweis}" if hinweis else ""))
        self.save()
        return str(self.sla_pausiert_seit)

    @frappe.whitelist()
    def sla_fortsetzen(self):
        """Pause beenden; die pausierten Werktage verlängern die Lösungsfrist."""
        self._pruefen_schreibrecht()
        tage = self._sla_pause_beenden()
        self.save()
        return {"pause_werktage": tage, "frist_loesung": str(self.frist_loesung) if self.frist_loesung else None}

    @frappe.whitelist()
    def erstreaktion_erfassen(self, kanal="Telefon", notiz=None):
        """Erstreaktion ohne Mail (Telefonat, Rückruf, vor Ort): stoppt die Reaktionsfrist, schließt Reaktions-ToDos.
        Konzept 10-konzept-service.md §12 Priorität 1, Kritik 20-ux-service P1."""
        self._pruefen_schreibrecht()
        if kanal not in ("Telefon", "Vor Ort", "Rückruf", "E-Mail", "Portal"):
            frappe.throw(_("Unbekannter Kanal."))
        if self.erstreaktion_am:
            return str(self.erstreaktion_am)
        self.erstreaktion_am = now_datetime()
        self.erstreaktion_kanal = kanal
        self.erstreaktion_notiz = (notiz or "")[:140] or None
        kom.verlauf(self, "Kommunikation", status=self.status, hinweis=_("Erstreaktion per {0}{1}").format(_(kanal), f": {notiz}" if notiz else ""))
        self.save()
        self._todos_schliessen("Reaktionsfrist")
        return str(self.erstreaktion_am)

    def _todos_schliessen(self, schluessel):
        for todo in frappe.get_all("ToDo", filters={"reference_type": self.doctype, "reference_name": self.name, "status": "Open", "description": ("like", f"%{schluessel}%")}, pluck="name"):
            frappe.db.set_value("ToDo", todo, "status", "Closed")

    # ── Kulanz ──────────────────────────────────────────────────────────────

    def _kulanz_freigabe_setzen(self, kommentar=None):
        self.kulanz_freigegeben_von = frappe.session.user
        self.kulanz_freigegeben_am = now_datetime()
        self.kulanz_freigegeben_cent = cint(self.kulanz_cent)
        self.kulanz_abgelehnt_cent = 0
        self.kulanz_freigabe_kommentar = (kommentar or "")[:500] or None
        self.kulanz_freigabe_status = kul.FREIGEGEBEN
        kom.verlauf(self, "Kulanz", status=self.status, hinweis=_("Kulanz {0} € freigegeben{1}").format(f"{cint(self.kulanz_cent) / 100:.2f}", f": {kommentar}" if kommentar else ""))

    def _kulanz_benachrichtigen(self):
        """ToDo + Benachrichtigung (Glocke) an die Leitung; nie Fehler werfen."""
        try:
            from ph_service.ph_service.tasks import _leitung_benutzer, _todo, benachrichtigen

            text = _("Kulanz-Freigabe: {0} € – {1} ({2})").format(f"{cint(self.kulanz_cent) / 100:.2f}", self.titel, _(self.entscheidung or "–"))
            for u in _leitung_benutzer():
                _todo(u, self.doctype, self.name, text, prioritaet="High", schluessel="Kulanz-Freigabe")
                benachrichtigen(u, self.doctype, self.name, text)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Servicefall: Kulanz-Benachrichtigung")

    @frappe.whitelist()
    def kulanz_anfordern(self):
        """Freigabe erneut an die Leitung senden (z. B. nach Urlaub)."""
        self._pruefen_schreibrecht()
        if self.kulanz_freigabe_status != kul.ANGEFORDERT:
            frappe.throw(_("Für diesen Betrag ist keine Freigabe nötig oder sie liegt bereits vor."))
        self._kulanz_benachrichtigen()
        return self.kulanz_freigabe_status

    @frappe.whitelist()
    def kulanz_freigeben(self, kommentar=None, betrag_cent=None):
        """Leitung gibt den Kulanzbetrag frei (Glocke, ohne das ganze Formular zu speichern).
        betrag_cent = im Client angezeigter Betrag; weicht er ab, wurde inzwischen geändert → Fehler statt Blindfreigabe."""
        self._pruefen_schreibrecht()
        if not ist_leitung():
            frappe.throw(_("Kulanz freigeben darf nur die Service-Leitung."), frappe.PermissionError)
        if betrag_cent not in (None, "") and cint(betrag_cent) != cint(self.kulanz_cent):
            frappe.throw(_("Der Kulanzbetrag wurde inzwischen auf {0} € geändert – bitte neu prüfen.").format(f"{cint(self.kulanz_cent) / 100:.2f}"))
        if self.kulanz_freigabe_status == kul.NICHT_NOETIG:
            return self.kulanz_freigabe_status
        self._kulanz_freigabe_setzen(kommentar)
        self.flags.ohne_selbstfreigabe = True
        self.save()
        self._todos_schliessen("Kulanz-Freigabe")
        return self.kulanz_freigabe_status

    @frappe.whitelist()
    def kulanz_ablehnen(self, grund):
        """Leitung lehnt den Kulanzbetrag ab; neuer Betrag → neue Anforderung."""
        self._pruefen_schreibrecht()
        if not ist_leitung():
            frappe.throw(_("Kulanz ablehnen darf nur die Service-Leitung."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Grund angeben."))
        self.kulanz_abgelehnt_cent = cint(self.kulanz_cent)
        self.kulanz_freigabe_kommentar = grund[:500]
        kom.verlauf(self, "Kulanz", status=self.status, hinweis=_("Kulanz {0} € abgelehnt: {1}").format(f"{cint(self.kulanz_cent) / 100:.2f}", grund))
        self.flags.ohne_selbstfreigabe = True
        self.save()
        self._todos_schliessen("Kulanz-Freigabe")
        if self.verantwortlich:
            try:
                from ph_service.ph_service.tasks import _todo

                _todo(self.verantwortlich, self.doctype, self.name, _("Kulanz abgelehnt: {0} – {1}").format(grund, self.titel), prioritaet="High", schluessel="Kulanz abgelehnt")
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Servicefall: Kulanz abgelehnt ToDo")
        return self.kulanz_freigabe_status

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
    def ersatzteile_bestellen(self, lieferant=None, zeilen=None, lieferadresse=None, wunschtermin=None):
        """Button „Ersatzteile bestellen“: PH Ersatzteilbestellung aus benötigten Zeilen ohne Bestellung
        (zeilen = Namen der Kindzeilen; leer = alle benötigten)."""
        self._pruefen_schreibrecht()
        auswahl = frappe.parse_json(zeilen) if isinstance(zeilen, str) else zeilen
        zeilen = [z for z in self.ersatzteile or [] if z.status == "Benoetigt" and not z.bestellung and (not auswahl or z.name in auswahl)]
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
                "lieferadresse": lieferadresse or "Lager",
                "positionen": [
                    {"ersatzteil": z.ersatzteil, "bezeichnung": z.bezeichnung, "hersteller_nr": z.hersteller_nr, "menge": z.menge, "servicefall_zeile": z.name, "wunschtermin": wunschtermin, "ek_cent": z.ek_cent}
                    for z in zeilen
                ],
            }
        ).insert()
        for z in zeilen:
            z.db_set({"status": "Bestellt", "bestellung": best.name})
        if cint(einstellungen()["sla_pause_bei_ersatzteil"]) and not self.sla_pausiert_seit and self.status in OFFEN:
            self.sla_pause_grund = "Ersatzteil"
            self.sla_pausiert_seit = now_datetime()
            kom.verlauf(self, "SLA", status=self.status, hinweis=_("SLA pausiert – wartet auf Ersatzteil ({0})").format(best.name))
            self.save()

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
        aus_kosten = betrag_cent is None
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
        if aus_kosten and any(z.regressfaehig for z in self.kosten or []):
            try:
                regress.kosten_uebernehmen()  # Kostenaufstellung für die Belastungsanzeige
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Servicefall {self.name}: Kosten in Regress")
        kom.verlauf(self, "Regress", hinweis=_("Regress {0} angelegt ({1} Cent)").format(regress.name, cint(betrag_cent)), speichern=True)
        return regress.name

    @frappe.whitelist()
    def kunde_informieren(self, vorlage="eingang", zusatz="", betreff=None):
        """Button „Kunde informieren“: Email Template (Eingang/Termin/Abschluss/Ablehnung/frei) an die Kundenadresse.
        „frei“ = Vorlage „PH Service Nachricht“ mit eigenem Text (zusatz) und optionalem Betreff."""
        self._pruefen_schreibrecht()
        if vorlage not in ("eingang", "termin", "abschluss", "ablehnung", "frei"):
            frappe.throw(_("Unbekannte Vorlage."))
        if vorlage == "frei" and not strip_html(zusatz or "").strip():
            frappe.throw(_("Nachricht eingeben."))
        anhaenge = []
        if vorlage == "abschluss":
            pdf = kom.pdf_anhang(self.doctype, self.name, "PH Servicefall Abnahmebestätigung", f"Abnahme-{self.name}")
            if pdf:
                anhaenge.append(pdf)
        betreff = kom.sende_vorlage(self, vorlage, self.kunde_email, anhaenge=anhaenge, zusatz=zusatz, betreff_frei=betreff)
        werte = {"kunde_informiert_am": now_datetime()}
        if not self.erstreaktion_am:
            werte["erstreaktion_am"] = now_datetime()
            werte["erstreaktion_kanal"] = "E-Mail"
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
    def ablehnen(self, grund, begruendung, kunde_informieren=0):
        """Button „Ablehnen“ (Leitung): Status Abgelehnt; kunde_informieren=1 sendet „PH Service Ablehnung“ mit Begründung."""
        self._pruefen_schreibrecht()
        if not ist_leitung():
            frappe.throw(_("Ablehnen darf nur die Service-Leitung."))
        self.ablehnungsgrund = grund
        self.entscheidung = "Abgelehnt"
        self.entscheidung_begruendung = begruendung
        if not strip_html(self.abschlussbericht or "").strip():
            self.abschlussbericht = begruendung
        self._status_setzen("Abgelehnt")
        if cint(kunde_informieren) and self.kunde_email:
            self.kunde_informieren("ablehnung", zusatz=begruendung)
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
    """„Servicefall anlegen“ aus PH Montageauftrag, PH Abnahme, PH Wareneingang, PH Lieferschein, PH Bestellung, PH Rechnung,
    PH Produktpass (Scan), PH Projekt (Client-Script-Fixtures). Liest nur Felder, die laut PLAN dort heißen; fehlende werden übersprungen."""
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
    elif doctype == "PH Produktpass":
        # Scan am Stück: Produkt, Marke, Seriennummer; Lieferdatum/Garantie übernimmt validate() aus dem Pass.
        werte.update(produktpass=name, art=art or "Mangel", kanal="Showroom")
        for feld in ("produkt_name", "marke", "seriennummer", "montageauftrag", "ausfuehrung_text"):
            nimm(feld)
    elif doctype == "PH Projekt":
        werte.update(projekt=name, art=art or "Mangel")
        if quelle.get("objekt_ort"):
            werte.update(einsatz_strasse=quelle.get("objekt_strasse"), einsatz_plz=quelle.get("objekt_plz"), einsatz_ort=quelle.get("objekt_ort"), einsatz_land=quelle.get("objekt_land"))
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
