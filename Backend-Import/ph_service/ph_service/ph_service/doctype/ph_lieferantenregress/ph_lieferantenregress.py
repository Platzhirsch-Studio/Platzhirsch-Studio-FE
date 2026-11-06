"""PH Lieferantenregress – Controller: Frist nach § 933b ABGB, Beträge je Status, Spiegel in den Servicefall (ereignisse.py)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, getdate, nowdate


from ph_service.ph_service import fristen as fr
from ph_service.utils import regress as rg

OFFEN = ("Offen", "Gemeldet", "Anerkannt")


class PHLieferantenregress(Document):
    def validate(self):
        sf = frappe.db.get_value("PH Servicefall", self.servicefall, ["kunde_name", "erledigt_am", "lieferung_an_haendler", "lieferant", "marke", "kosten_gesamt_cent"], as_dict=True)
        if sf:
            self.lieferant = self.lieferant or sf.lieferant
            self.marke = self.marke or sf.marke
            moeglich, hinweis = fr.regress_moeglich(getdate(sf.erledigt_am) if sf.erledigt_am else None, sf.lieferung_an_haendler)
            self.frist_bis = fr.monate_dazu(getdate(sf.erledigt_am), fr.REGRESS_MONATE) if sf.erledigt_am else None
            self.frist_hinweis = hinweis[:140]
            if self.status == "Gemeldet" and self.has_value_changed("status") and not moeglich and sf.erledigt_am and not self.flags.frist_ignorieren:
                frappe.msgprint(_("Achtung: {0}").format(hinweis), indicator="red")
        self._kosten_summieren()
        if cint(self.betrag_gefordert_cent) < 0:
            frappe.throw(_("Forderung darf nicht negativ sein."))
        if self.status == "Anerkannt" and not cint(self.betrag_anerkannt_cent):
            frappe.throw(_("Anerkannt nur mit anerkanntem Betrag (ggf. Ersatzlieferung bewerten)."))
        if self.status == "Abgelehnt" and not self.ablehnungsgrund:
            self.ablehnungsgrund = "Sonstiges"
        if self.status == "Verrechnet":
            if not cint(self.betrag_erhalten_cent) and not self.ausgebucht_grund:
                # Workflow „Regress verrechnet“ (Leitung) ohne erfasste Gutschrift = anerkannter Betrag voll erhalten
                # (auch Ersatzlieferung/Reparatur durch Hersteller). Teilbeträge über „Gutschrift erfassen“.
                self.betrag_erhalten_cent = cint(self.betrag_anerkannt_cent)
            self.verrechnet_am = self.verrechnet_am or nowdate()
        if self.status == "Gemeldet" and not self.gemeldet_am:
            self.gemeldet_am = nowdate()
        self._abgleichen()
        self.titel = f"{self.lieferant}: {self.servicefall}{' – ' + sf.kunde_name if sf and sf.kunde_name else ''}"[:140]

    def _kosten_summieren(self):
        """Kostenaufstellung: Zeile = Menge × Satz; Summe = Forderung (sobald Zeilen vorhanden sind)."""
        if not self.kosten:
            return
        for z in self.kosten:
            if z.satz_cent is not None and z.menge is not None:
                z.betrag_cent = rg.zeilenbetrag(z.menge, z.satz_cent)
        self.betrag_gefordert_cent = sum(cint(z.betrag_cent) for z in self.kosten)

    @frappe.whitelist()
    def kosten_uebernehmen(self, ersetzen=1):
        """Regressfähige Kosten des Servicefalls (Arbeitszeit/Anfahrt der Einsätze, Ersatzteile, Fremdleistung) in die
        Kostenaufstellung übernehmen; Kulanz/Preisminderung nie. ersetzen=1 ersetzt übernommene Zeilen, eigene bleiben."""
        self.check_permission("write")
        kosten = frappe.get_all("PH Servicefall Kosten", filters={"parenttype": "PH Servicefall", "parent": self.servicefall}, fields=["name", "art", "beschreibung", "betrag_cent", "regressfaehig", "einsatz"], order_by="idx asc")
        namen = [k.einsatz for k in kosten if k.einsatz]
        einsaetze = {e.name: e for e in frappe.get_all("PH Serviceeinsatz", filters={"name": ("in", namen)}, fields=["name", "zeit_arbeit_min", "zeit_anfahrt_min", "stundensatz_cent", "anfahrt_km"])} if namen else {}
        zeilen = rg.belastungszeilen(kosten, einsaetze)
        if cint(ersetzen):
            self.kosten = [z for z in self.kosten or [] if not z.quelle_zeile]
        vorhanden = {z.quelle_zeile for z in self.kosten or [] if z.quelle_zeile}
        for z in zeilen:
            if z["quelle_zeile"] not in vorhanden:
                self.append("kosten", z)
        self.save()
        return {"zeilen": len(self.kosten or []), "betrag_gefordert_cent": cint(self.betrag_gefordert_cent)}

    @frappe.whitelist()
    def belastung_senden(self, empfaenger=None, zusatz=None):
        """Belastungsanzeige (Druckformat „PH Lieferantenregress Belastungsanzeige“) mit Fotos an den Lieferanten;
        setzt Gutschriftfrist (zahlungsfrist_tage) und Status Gemeldet."""
        self.check_permission("write")
        if not cint(self.betrag_gefordert_cent):
            frappe.throw(_("Forderung ist 0 – zuerst Kosten übernehmen oder eintragen."))
        empfaenger = empfaenger or self._lieferant_email()
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt."))
        from ph_core.utils.mail import sende

        from ph_service.ph_service import kommunikation as kom

        frist = add_days(nowdate(), cint(self.zahlungsfrist_tage) or 30)
        anhaenge = []
        pdf = kom.pdf_anhang(self.doctype, self.name, "PH Lieferantenregress Belastungsanzeige", f"Belastungsanzeige-{self.name}")
        if pdf:
            anhaenge.append(pdf)
        try:
            fall = frappe.get_doc("PH Servicefall", self.servicefall)
            anhaenge += kom.datei_anhaenge(fall.fotos_urls(nur_lieferant=True))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Lieferantenregress {self.name}: Fotos")
        html = _("<p>Sehr geehrte Damen und Herren,</p><p>zur Reklamation {0}{1} belasten wir Sie gemäß beiliegender Aufstellung mit <b>{2} €</b>. Bitte schreiben Sie den Betrag bis <b>{3}</b> gut.</p><p>{4}</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>").format(
            frappe.utils.escape_html(self.servicefall),
            frappe.utils.escape_html(f" (Ihr Auftrag {self.herstellerauftrag})" if self.herstellerauftrag else ""),
            f"{cint(self.betrag_gefordert_cent) / 100:.2f}",
            frappe.utils.formatdate(frist),
            frappe.utils.escape_html(zusatz or ""),
        )
        sende(empfaenger, _("Belastungsanzeige {0} – Reklamation {1}").format(self.name, self.servicefall), html, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        self.belastung_gesendet_am = nowdate()
        self.zahlungsfrist_bis = frist
        if self.status == "Offen":
            self._status_setzen("Gemeldet")
        self.save()
        self.add_comment("Info", _("Belastungsanzeige an {0} gesendet, Frist {1}").format(empfaenger, frappe.utils.formatdate(frist)))
        return str(frist)

    @frappe.whitelist()
    def mahnen(self, empfaenger=None):
        """Anmahnung der Gutschrift (nach Fristablauf, Stufe +1, höchstens regress_max_mahnstufe)."""
        self.check_permission("write")
        from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

        stufe = cint(self.mahnstufe) + 1
        if stufe > cint(einstellungen()["regress_max_mahnstufe"]):
            frappe.throw(_("Höchste Mahnstufe erreicht – Verrechnung mit offenen Lieferantenrechnungen oder Eskalation an die Geschäftsführung."))
        empfaenger = empfaenger or self._lieferant_email()
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt."))
        from ph_core.utils.mail import sende

        offen = (cint(self.betrag_anerkannt_cent) or cint(self.betrag_gefordert_cent)) - cint(self.betrag_erhalten_cent)
        html = _("<p>Sehr geehrte Damen und Herren,</p><p>{0}. Mahnung: Zu unserer Belastungsanzeige {1} (Reklamation {2}) vom {3} ist der Betrag von <b>{4} €</b> noch offen (Frist {5}). Wir bitten um Gutschrift innerhalb von 7 Tagen.</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>").format(
            stufe, self.name, frappe.utils.escape_html(self.servicefall), frappe.utils.formatdate(self.belastung_gesendet_am or self.gemeldet_am), f"{max(0, offen) / 100:.2f}", frappe.utils.formatdate(self.zahlungsfrist_bis)
        )
        sende(empfaenger, _("{0}. Mahnung Belastungsanzeige {1}").format(stufe, self.name), html, referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set({"mahnstufe": stufe, "letzte_mahnung": nowdate(), "letzte_erinnerung": nowdate(), "mahnung_faellig": 0})
        self.add_comment("Info", _("{0}. Mahnung an {1}").format(stufe, empfaenger))
        return stufe

    @frappe.whitelist()
    def abholung_anfordern(self, empfaenger=None, frist_tage=None, lagerplatz=None):
        """Rücksendung an den Hersteller: Abholaufforderung (Ware liegt bei uns), Frist, danach Anmahnung (S12)."""
        self.check_permission("write")
        from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

        empfaenger = empfaenger or self._lieferant_email()
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt."))
        stufe = cint(self.abholung_mahnstufe) + 1 if self.abholung_angefordert_am else 0
        frist = add_days(nowdate(), cint(frist_tage) or cint(einstellungen()["abholung_frist_tage"]) or 14)
        from ph_core.utils.mail import sende

        titel = _("Abholaufforderung") if not stufe else _("{0}. Erinnerung Abholung").format(stufe)
        html = _("<p>Sehr geehrte Damen und Herren,</p><p>{0}: Die reklamierte Ware zu {1}{2} liegt zur Abholung bereit{3}. Bitte holen Sie sie bis <b>{4}</b> ab bzw. senden Sie uns ein Abholetikett. Nach Ablauf berechnen wir Lagerkosten bzw. entsorgen nach Rücksprache.</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>").format(
            titel, frappe.utils.escape_html(self.servicefall), frappe.utils.escape_html(f" (Ihr Auftrag {self.herstellerauftrag})" if self.herstellerauftrag else ""), frappe.utils.escape_html(f" (Lagerplatz {lagerplatz or self.ruecksendung_lagerplatz})" if (lagerplatz or self.ruecksendung_lagerplatz) else ""), frappe.utils.formatdate(frist)
        )
        sende(empfaenger, _("{0} – Reklamation {1}").format(titel, self.servicefall), html, referenz_doctype=self.doctype, referenz_name=self.name)
        werte = {"ruecksendung_noetig": 1, "abholung_frist": frist, "abholung_mahnstufe": stufe}
        if not self.abholung_angefordert_am:
            werte["abholung_angefordert_am"] = nowdate()
        if lagerplatz:
            werte["ruecksendung_lagerplatz"] = lagerplatz[:140]
        self.db_set(werte)
        self.add_comment("Info", _("{0} an {1}, Frist {2}").format(titel, empfaenger, frappe.utils.formatdate(frist)))
        return str(frist)

    @frappe.whitelist()
    def abholung_bestaetigen(self, datum=None):
        self.check_permission("write")
        self.db_set({"abgeholt_am": datum or nowdate()})
        self.add_comment("Info", _("Ware vom Hersteller abgeholt"))
        return str(self.abgeholt_am)

    def _lieferant_email(self):
        if frappe.db.exists("DocType", "PH Lieferant"):
            try:
                return frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            except Exception:  # noqa: BLE001
                return None
        return None

    def _abgleichen(self):
        """Gutschrift-Abgleich Soll (anerkannt) ↔ Ist (erhalten) – utils/regress.py."""
        from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

        a = rg.abgleich(self.betrag_gefordert_cent, self.betrag_anerkannt_cent, self.betrag_erhalten_cent, einstellungen()["regress_toleranz_cent"], ausgebucht=bool(self.ausgebucht_grund))
        if self.status in ("Offen", "Gemeldet", "Abgelehnt") and not cint(self.betrag_erhalten_cent):
            a["status"] = rg.OFFEN
        self.abgleich_status = a["status"]
        self.differenz_cent = a["differenz_cent"]
        self.quote_promille = a["quote_promille"]

    @frappe.whitelist()
    def gutschrift_erfassen(self, betrag_cent, nummer=None, datum=None, beleg=None, eingangsrechnung=None):
        """Gutschrift/Zahlung des Lieferanten buchen (Teilbeträge addieren sich). Bei Abgleich „Ausgeglichen“ → Verrechnet;
        Unter-/Überdeckung bleibt sichtbar (Leitung: Differenz ausbuchen bzw. klären)."""
        self.check_permission("write")
        betrag = cint(betrag_cent)
        if betrag <= 0:
            frappe.throw(_("Betrag muss größer 0 sein."))
        if self.status not in ("Gemeldet", "Anerkannt", "Verrechnet"):
            frappe.throw(_("Gutschrift erst nach Meldung an den Lieferanten erfassen."))
        self.betrag_erhalten_cent = cint(self.betrag_erhalten_cent) + betrag
        if not cint(self.betrag_anerkannt_cent):
            self.betrag_anerkannt_cent = self.betrag_erhalten_cent  # Lieferant zahlt ohne vorherige Anerkennung
        if nummer:
            self.gutschrift_nummer = (f"{self.gutschrift_nummer}, {nummer}" if self.gutschrift_nummer and nummer not in self.gutschrift_nummer else nummer)[:140]
        self.gutschrift_datum = datum or nowdate()
        if beleg:
            self.gutschrift_beleg = beleg
        if eingangsrechnung:
            self.eingangsrechnung = eingangsrechnung
        self._abgleichen()
        if self.abgleich_status in (rg.AUSGEGLICHEN, rg.UEBERDECKUNG) and self.status != "Verrechnet":
            self._status_setzen("Verrechnet")
        elif self.status == "Gemeldet":
            self._status_setzen("Anerkannt")
        self.save()
        self.add_comment("Info", _("Gutschrift {0} über {1} € erfasst – Abgleich: {2}").format(nummer or "–", f"{betrag / 100:.2f}", _(self.abgleich_status)))
        return {"abgleich_status": self.abgleich_status, "differenz_cent": cint(self.differenz_cent), "status": self.status}

    @frappe.whitelist()
    def differenz_ausbuchen(self, grund):
        """Leitung: Unterdeckung (Lieferant zahlt weniger als anerkannt/gefordert) abschließen → Verrechnet/Ausgebucht."""
        self.check_permission("write")
        from ph_service.ph_service.doctype.ph_servicefall.ph_servicefall import ist_leitung

        if not ist_leitung():
            frappe.throw(_("Differenzen ausbuchen darf nur die Service-Leitung."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Grund angeben."))
        self.ausgebucht_grund = grund[:500]
        self.ausgebucht_von = frappe.session.user
        self._abgleichen()
        self._status_setzen("Verrechnet")
        self.save()
        return self.abgleich_status

    def _status_setzen(self, status):
        self.status = status
        if self.meta.has_field("workflow_state"):
            self.workflow_state = {"Offen": "PH Regress offen", "Gemeldet": "PH Regress gemeldet", "Anerkannt": "PH Regress anerkannt", "Abgelehnt": "PH Regress abgelehnt", "Verrechnet": "PH Regress verrechnet"}[status]

    @frappe.whitelist()
    def erinnern(self, empfaenger=None):
        """Button „Lieferant erinnern“: kurze Erinnerung per Mail mit Referenz."""
        self.check_permission("write")
        if not empfaenger and frappe.db.exists("DocType", "PH Lieferant"):
            try:
                empfaenger = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            except Exception:  # noqa: BLE001
                empfaenger = None
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt."))
        from ph_core.utils.mail import sende

        html = f"<p>Sehr geehrte Damen und Herren,</p><p>wir erinnern an unsere Reklamation/Regressmeldung <b>{self.servicefall}</b> (Ihre Referenz: {frappe.utils.escape_html(self.lieferant_referenz or '–')}) vom {frappe.utils.formatdate(self.gemeldet_am) if self.gemeldet_am else '–'} über {cint(self.betrag_gefordert_cent) / 100:.2f} €. Bitte um Rückmeldung.</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>"
        sende(empfaenger, _("Erinnerung Regress {0}").format(self.servicefall), html, referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set("letzte_erinnerung", nowdate())
        return empfaenger


def summen_je_servicefall(servicefall):
    rows = frappe.get_all("PH Lieferantenregress", filters={"servicefall": servicefall}, fields=["status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "modified"], order_by="modified desc")
    gefordert = sum(cint(r.betrag_gefordert_cent) for r in rows if r.status != "Abgelehnt")
    erhalten = sum(cint(r.betrag_erhalten_cent) for r in rows if r.status in ("Anerkannt", "Verrechnet"))  # Teilgutschriften zählen
    status = rows[0].status if rows else "Kein Regress"
    return gefordert, erhalten, status
