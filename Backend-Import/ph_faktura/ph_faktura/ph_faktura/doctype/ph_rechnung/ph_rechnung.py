"""PH Rechnung – Anzahlungs-, Teil-, Schluss-, Einzel- und Barverkaufsrechnung.

Grundsätze (PLAN.md WP6): submittable; Entwürfe heißen ENTW-JJJJ-#####, die lückenlose Nummer
RE-JJJJ-##### wird erst beim Stellen vergeben (before_submit, Nummernkreis in derselben Transaktion –
schlägt das Stellen fehl, wird kein Zähler verbraucht). Kein Cancel/Amend: Storno nur per PH Gutschrift.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_faktura import einstellungen, journal, versand, zahlung
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk import anzahlung as A
from ph_faktura.rechenwerk import skonto as SK
from ph_faktura.rechenwerk import steuer as S

OFFEN = ("Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt")
LEISTUNGSARTEN = ("Rechnung", "Teilrechnung", "Schlussrechnung", "Barverkauf")


class PHRechnung(BelegMixin, Document):
    def onload(self):
        self.set_onload("kontakt_email", self.kontakt_email())
        if self.auftrag and self.docstatus == 0 and self.art in ("Teilrechnung", "Schlussrechnung"):
            self.set_onload("offene_anzahlungen", frappe.get_doc("PH Auftragsbestaetigung", self.auftrag).offene_anzahlungen(ausser=self.name))

    def before_insert(self):
        self.status = "Entwurf"
        self.workflow_state = "PH Entwurf"

    def validate(self):
        if getattr(self, "_action", None) == "update_after_submit":
            # Nachträgliche Speicherungen (Zahlung, Export, Nachweise) ändern nur allow_on_submit-Felder.
            self.nachweis_status = nachweis_status(self)
            self.titel = self.titel_bilden()
            return
        e = einstellungen.faktura()
        self.kontakt_uebernehmen()
        self.produkt_uebernehmen()
        self.positionen_pruefen()
        self.steuerfall_setzen()
        self.positionen_berechnen()
        if not self.zahlungsziel_tage:
            self.zahlungsziel_tage = e["zahlungsziel_tage"]
        if not self.faellig:
            self.faellig = add_days(self.datum, cint(self.zahlungsziel_tage))
        if self.art == "Anzahlungsrechnung":
            self.ust_faelligkeit = "nicht faellig"
            self.ust_faellig_am = None
            self.uva_monat = None
            if not (self.leistungszeitraum_von or self.leistungsdatum):
                self.leistungszeitraum_von = self.datum
        else:
            if not self.leistungsdatum and not (self.leistungszeitraum_von and self.leistungszeitraum_bis):
                self.leistungsdatum = self.datum
            self.ust_faelligkeit = "faellig"
            self.ust_faellig_am = self.datum
            self.uva_monat = getdate(self.datum).strftime("%Y-%m")
        if self.art in ("Teilrechnung", "Schlussrechnung") and not self.auftrag:
            frappe.throw(_("Teil-/Schlussrechnung braucht eine Auftragsbestätigung."))
        if self.art not in ("Teilrechnung", "Schlussrechnung"):
            self.set("anzahlungen_verrechnet", [])
        self.anzahlungen_summieren()
        if not self.schluss and self.art != "Anzahlungsrechnung":
            self.schluss = e.get("rechnung_schluss")
        self.skonto_setzen()
        self.nachweis_status = nachweis_status(self)
        self.titel = self.titel_bilden()

    def skonto_setzen(self):
        """Skonto aus der Zahlungsbedingung des Auftrags (sonst Standard-Zahlungsbedingung) übernehmen."""
        if self.art in ("Anzahlungsrechnung", "Barverkauf") or self.skonto_bis:
            return
        zb = (frappe.db.get_value("PH Auftragsbestaetigung", self.auftrag, "zahlungsbedingung") if self.auftrag else None) or einstellungen.faktura().get("standard_zahlungsbedingung")
        if not zb:
            return
        promille, tage = frappe.db.get_value("PH Zahlungsbedingung", zb, ["skonto_promille", "skonto_tage"]) or (0, 0)
        if cint(promille) and cint(tage):
            self.skonto_promille = cint(promille)
            self.skonto_bis = SK.skonto_bis(getdate(self.datum), cint(tage))

    def titel_bilden(self):
        return f"{_(self.art)} {self.nummer or self.name}: {self.kunde_name or self.kontakt}"[:140]

    # ── Anzahlungen ──────────────────────────────────────────────────────────
    def anzahlungen_summieren(self):
        self.anzahlung_netto_cent = sum(cint(a.netto_cent) for a in self.anzahlungen_verrechnet)
        self.anzahlung_ust_cent = sum(cint(a.ust_cent) for a in self.anzahlungen_verrechnet)
        self.anzahlung_brutto_cent = sum(cint(a.brutto_cent) for a in self.anzahlungen_verrechnet)
        if self.anzahlung_brutto_cent > cint(self.brutto_cent):
            frappe.throw(_("Verrechnete Anzahlungen ({0}) übersteigen den Rechnungsbetrag ({1}) – Überhang per Gutschrift erstatten.").format(self.anzahlung_brutto_cent, self.brutto_cent))
        self.zahlbar_cent = cint(self.brutto_cent) - cint(self.anzahlung_brutto_cent)
        self.bezahlt_cent = sum(cint(z.betrag_cent) for z in self.zahlungen)
        self.offen_cent = self.zahlbar_cent - self.bezahlt_cent

    @frappe.whitelist()
    def anzahlungen_verrechnen(self, speichern=False):
        """Button „Anzahlungen verrechnen“ (Teil-/Schlussrechnung): offene Anzahlungen des Auftrags je
        USt-Satz abziehen – Schlussrechnung vollständig, Teilrechnung anteilig nach Wert."""
        if self.docstatus != 0:
            frappe.throw(_("Nur im Entwurf möglich."))
        if not self.auftrag or self.art not in ("Teilrechnung", "Schlussrechnung"):
            return 0
        ab = frappe.get_doc("PH Auftragsbestaetigung", self.auftrag)
        offen = ab.offene_anzahlungen(ausser=self.name)
        anteil = A.wertanteil(self.netto_cent, ab.netto_cent) if self.art == "Teilrechnung" else 1
        leistung = [{"ust_satz_promille": a.ust_satz_promille, "netto_cent": a.netto_cent, "ust_cent": a.ust_cent, "brutto_cent": a.brutto_cent} for a in self.ust_aufteilung]
        v = A.verrechnen(leistung, offen, anteil)
        self.set("anzahlungen_verrechnet", [])
        for z in v["verrechnet"]:
            self.append("anzahlungen_verrechnet", {"anzahlungsrechnung": z["anzahlungsrechnung"], "datum": z.get("datum"), "ust_satz_promille": z["ust_satz_promille"], "netto_cent": z["netto_cent"], "ust_cent": z["ust_cent"], "brutto_cent": z["brutto_cent"]})
        self.anzahlungen_summieren()
        if speichern:
            self.save()
        return len(v["verrechnet"])

    # ── Stellen (Submit) ─────────────────────────────────────────────────────
    def before_submit(self):
        self.pflichtangaben_pruefen()
        if self.export_status == "exportiert":
            frappe.throw(_("Beleg wurde bereits exportiert."))
        self.nummer_vergeben()
        self.status = "Gestellt"
        self.workflow_state = "PH Gestellt"
        self.gestellt_am = now_datetime()
        self.zahlungsreferenz = self.nummer
        self.bezahlt_cent = sum(cint(z.betrag_cent) for z in self.zahlungen)
        self.offen_cent = cint(self.zahlbar_cent) - cint(self.bezahlt_cent)
        if self.offen_cent <= 0:
            self.status = "Bezahlt"
            self.workflow_state = "PH Bezahlt"
            self.bezahlt_am = nowdate()
        self.titel = self.titel_bilden()

    def pflichtangaben_pruefen(self):
        if not [p for p in self.positionen if p.art not in ("Text", "Zwischensumme")]:
            frappe.throw(_("Rechnung ohne Positionen kann nicht gestellt werden."))
        fehlt = self._pflichtangaben_fehlt()
        if fehlt:
            frappe.throw(_("Pflichtangaben nach § 11 UStG fehlen: {0}").format(", ".join(fehlt)))

    def _pflichtangaben_fehlt(self):
        firma = einstellungen.firma()
        e = einstellungen.faktura()
        return S.pflichtangaben_pruefen({
            "kunde_name": self.kunde_name, "strasse": self.strasse, "ort": self.ort, "datum": self.datum, "positionen": self.positionen,
            "leistungsdatum": self.leistungsdatum, "leistungszeitraum_von": self.leistungszeitraum_von, "leistungszeitraum_bis": self.leistungszeitraum_bis,
            "brutto_cent": self.brutto_cent, "uid_empfaenger": self.uid_empfaenger, "ust_fall": self.ust_fall, "ust_hinweistext": self.ust_hinweistext,
            "kleinbetrag": bool(self.kleinbetragsrechnung), "firma_uid": firma.get("uid"), "uid_grenze_cent": e["uid_pflicht_ab_cent"],
        })

    def nummer_vergeben(self):
        if self.name.startswith("ENTW-"):
            neu = make_autoname(self.naming_series)
            frappe.rename_doc(self.doctype, self.name, neu, force=True, show_alert=False, rebuild_search=False)
            self.name = neu
            for ch in self.get_all_children():
                ch.parent = neu
        self.nummer = self.name

    def on_submit(self):
        journal.schreibe("Gestellt", self, self.zahlbar_cent, f"{self.art}, brutto {self.brutto_cent}, Anzahlungen {self.anzahlung_brutto_cent}, USt-Fall {self.ust_fall}")
        if self.auftrag:
            self.auftrag_fortschreiben()
        if self.bestellung and frappe.db.exists("DocType", "PH Bestellung") and frappe.get_meta("PH Bestellung").has_field("ph_faktura_rechnung"):
            frappe.db.set_value("PH Bestellung", self.bestellung, "ph_faktura_rechnung", self.name, update_modified=False)
        if einstellungen.faktura().get("pdf_bei_stellen") and not frappe.flags.in_test:
            versand.pdf_fixieren(self)
        if self.korrektur_von:
            self._guthaben_aus_korrektur()

    def _guthaben_aus_korrektur(self):
        """Rechnungskorrektur: Zahlungen der stornierten Ursprungsrechnung als Verrechnung übernehmen."""
        alt = frappe.db.get_value("PH Rechnung", self.korrektur_von, ["bezahlt_cent", "nummer"], as_dict=True)
        betrag = min(cint(alt.bezahlt_cent) if alt else 0, cint(self.zahlbar_cent))
        frappe.db.set_value("PH Rechnung", self.korrektur_von, "korrigiert_durch", self.name, update_modified=False)
        if betrag > 0:
            zahlung.zahlung_auf_rechnung(self, betrag, "Verrechnung", nowdate(), zahlung_name=None, hinweis=_("Guthaben aus {0}").format(alt.nummer or self.korrektur_von))

    def auftrag_fortschreiben(self):
        ab = frappe.get_doc("PH Auftragsbestaetigung", self.auftrag)
        if self.art in ("Teilrechnung", "Schlussrechnung", "Rechnung"):
            for p in self.positionen:
                if p.ab_position:
                    frappe.db.sql("update `tabPH Beleg Position` set rechnung_menge = ifnull(rechnung_menge, 0) + %s where name = %s", (p.menge, p.ab_position))
            art_plan = "Teilzahlung" if self.art == "Teilrechnung" else "Schlusszahlung"
            zeile = next((z for z in ab.zahlungsplan if z.art == art_plan and not z.rechnung), None)
            if zeile:
                frappe.db.set_value("PH Zahlungsplan", zeile.name, {"rechnung": self.name, "status": "In Rechnung"}, update_modified=False)
        ab.reload()
        ab.stand_aktualisieren(speichern=True)

    def before_cancel(self):
        frappe.throw(_("Gebuchte Rechnungen werden nicht storniert, sondern per Gutschrift ausgeglichen (Button „Gutschrift“)."))

    def on_trash(self):
        if self.docstatus == 1 or self.nummer:
            frappe.throw(_("Gestellte Rechnungen können nicht gelöscht werden."))
        if self.anzahlungsplan_zeile and frappe.db.exists("PH Zahlungsplan", self.anzahlungsplan_zeile):
            frappe.db.set_value("PH Zahlungsplan", self.anzahlungsplan_zeile, {"rechnung": None, "status": "Offen"}, update_modified=False)

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def stellen(self):
        """Button „Rechnung stellen“: speichern, Nummer vergeben, buchen (submit). → neue Nummer"""
        self.check_permission("submit")
        if self.docstatus != 0:
            frappe.throw(_("Rechnung ist bereits gestellt."))
        self.save()
        self.submit()
        return self.name

    @frappe.whitelist()
    def zahlung_erfassen(self, betrag_cent, kanal="Ueberweisung", datum=None, hinweis=None, skonto=0):
        """Button „Zahlung erfassen“: PH Zahlung (ph_shop) buchen und der Rechnung zuordnen.
        skonto=1: Differenz zum offenen Betrag als Skonto ausbuchen, wenn innerhalb Frist und Höhe (§ 16 UStG)."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Zahlungen nur auf gestellte Rechnungen."))
        betrag_cent = cint(betrag_cent)
        if betrag_cent <= 0:
            frappe.throw(_("Betrag muss größer 0 sein."))
        if betrag_cent > cint(self.offen_cent) + 1 and kanal != "Verrechnung":
            frappe.msgprint(_("Hinweis: Zahlung übersteigt den offenen Betrag – Überzahlung wird als Guthaben vermerkt."), indicator="orange")
        sk = None
        if cint(skonto):
            sk = SK.skonto_pruefen(cint(self.offen_cent), betrag_cent, cint(self.zahlbar_cent), cint(self.skonto_promille), getdate(self.skonto_bis) if self.skonto_bis else None, getdate(datum or nowdate()))
            if not sk["zulaessig"]:
                frappe.throw(_("Skonto nicht zulässig: {0}").format(sk["grund"]))
        name = zahlung.buche("Eingang", kanal, betrag_cent, "PH Rechnung", self.name, zeitpunkt=datum, kontakt=self.kontakt, zahlungsreferenz=self.zahlungsreferenz, notiz=hinweis)
        zahlung.zahlung_auf_rechnung(self, betrag_cent, kanal, datum, zahlung_name=name, hinweis=hinweis)
        if sk:
            self.skonto_buchen(sk["skonto_cent"], datum)
        return name

    def skonto_buchen(self, skonto_cent, datum=None):
        """Skonto als OP-Ausgleich (Kanal „Skonto“, keine PH Zahlung); UVA mindert Bemessung und USt im Monat der Zahlung."""
        re = frappe.get_doc("PH Rechnung", self.name)
        zahlung.zahlung_auf_rechnung(re, cint(skonto_cent), "Skonto", datum, zahlung_name=None, hinweis=_("Skonto {0} ‰").format(cint(self.skonto_promille)))
        frappe.db.set_value("PH Rechnung", self.name, "skonto_cent", cint(re.skonto_cent) + cint(skonto_cent), update_modified=False)
        journal.schreibe("Korrektur", re, cint(skonto_cent), "Skonto (Entgeltsminderung § 16 UStG)")

    # ── Lesende Methoden (Konzept 10-faktura §12 Nr. 1) ──────────────────────
    @frappe.whitelist()
    def pflichtangaben_vorschau(self):
        """Pflichtangaben § 11 UStG prüfen, ohne zu stellen → {ok, fehlt[]}."""
        self.check_permission("read")
        fehlt = self._pflichtangaben_fehlt()
        if not [p for p in self.positionen if p.art not in ("Text", "Zwischensumme")]:
            fehlt.append(_("Positionen"))
        return {"ok": not fehlt, "fehlt": fehlt}

    @frappe.whitelist()
    def nummer_vorschau(self):
        """Nächste Nummer der Serie (nur Anzeige, nicht reserviert – vergeben wird beim Stellen in der Transaktion)."""
        self.check_permission("read")
        return naechste_nummer(self.naming_series or "RE-.YYYY.-.#####")

    @frappe.whitelist()
    def mahnvorschau(self, stufe=None, stichtag=None):
        """Gebühr, Verzugszinsen, Frist der nächsten Mahnstufe ohne Anlage."""
        self.check_permission("read")
        from ph_faktura.rechenwerk import mahnen as M

        einst = einstellungen.mahnwesen()
        stichtag = getdate(stichtag or nowdate())
        stufe = cint(stufe) or min(cint(self.mahnstufe) + 1, 3)
        tage = M.verzugstage(getdate(self.faellig), stichtag, 0) if self.faellig else 0
        bereits = bool(frappe.db.exists("PH Mahnung", {"rechnung": self.name, "pauschale_cent": (">", 0), "status": ("!=", "Storniert")}))
        b = M.mahnbetrag(cint(self.offen_cent), stufe, tage, einst, unternehmer=bool(self.firma or self.uid_empfaenger), pauschale_bereits=bereits)
        return {"stufe": stufe, "verzugstage": tage, "frist": add_days(stichtag, cint(einst.get("frist_tage") or 7)), "mahnsperre": bool(self.mahnsperre), **b}

    @frappe.whitelist()
    def als_gesendet_markieren(self, kanal="Post"):
        """Versand außerhalb des Systems (Post, persönlich, Portal) dokumentieren."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Nur gestellte Rechnungen."))
        self.db_set({"gesendet_am": now_datetime(), "versandkanal": kanal})
        self.add_comment("Info", _("Als gesendet markiert ({0})").format(kanal))
        return True

    @frappe.whitelist()
    def korrigieren(self, grund):
        """Rechnungskorrektur (§ 11 Abs 14 UStG analog Storno + Neuausstellung): Storno-Gutschrift stellen und eine
        neue Rechnung als Entwurf mit gleichen Daten anlegen; bezahlte Beträge werden beim Stellen verrechnet."""
        self.check_permission("write")
        if self.docstatus != 1 or self.status == "Storniert":
            frappe.throw(_("Nur gestellte, nicht stornierte Rechnungen können korrigiert werden."))
        if not (grund or "").strip():
            frappe.throw(_("Grund der Korrektur angeben."))
        gu_name = self.gutschrift_erstellen(art="Storno", grund=_("Korrektur: {0}").format(grund), erstattung_art="Keine (Kulanz ohne Zahlung)")
        gu = frappe.get_doc("PH Gutschrift", gu_name)
        gu.stellen()
        neu = frappe.copy_doc(self)
        for f in ("nummer", "gestellt_am", "gesendet_am", "pdf", "storno_durch", "storniert_am", "export_lauf", "zahlungsreferenz", "bezahlt_am", "erechnung_datei", "korrigiert_durch", "idempotency_key", "letzte_mahnung", "kassenbeleg"):
            neu.set(f, None)
        neu.update({"datum": nowdate(), "faellig": None, "status": "Entwurf", "mahnstufe": 0, "export_status": "offen", "korrektur_von": self.name, "skonto_cent": 0})
        neu.set("zahlungen", [])
        neu.insert()
        self.add_comment("Info", _("Korrektur: Storno {0}, neuer Entwurf {1} – {2}").format(gu.name, neu.name, grund))
        return {"gutschrift": gu.name, "rechnung": neu.name}

    # ── E-Rechnung ───────────────────────────────────────────────────────────
    def erechnung_daten(self):
        f = einstellungen.firma()
        b = einstellungen.bankkonto()
        land = (self.land or "AT")[:2].upper()
        return {
            "art": "Rechnung", "nummer": self.nummer or self.name, "datum": getdate(self.datum), "faellig": getdate(self.faellig) if self.faellig else None,
            "leistungsdatum": getdate(self.leistungsdatum) if self.leistungsdatum else None,
            "leistung_von": getdate(self.leistungszeitraum_von) if self.leistungszeitraum_von else None, "leistung_bis": getdate(self.leistungszeitraum_bis) if self.leistungszeitraum_bis else None,
            "waehrung": self.waehrung or "EUR", "ust_fall": self.ust_fall, "ust_hinweistext": self.ust_hinweistext, "bestellreferenz": self.bestellreferenz or self.auftrag,
            "leitweg_id": self.leitweg_id, "lieferantennummer": self.lieferantennummer, "bund": bool(self.erechnung_bund), "zahlungsreferenz": self.zahlungsreferenz,
            "verkaeufer": {"name": f.get("firmenname"), "strasse": f.get("strasse"), "plz": f.get("plz"), "ort": f.get("ort"), "land": (f.get("land") or "AT")[:2].upper(), "uid": f.get("uid"), "email": f.get("email"), "iban": b.get("iban"), "bic": b.get("bic")},
            "kaeufer": {"name": self.kunde_name, "strasse": self.strasse, "plz": self.plz, "ort": self.ort, "land": land, "uid": self.uid_empfaenger, "email": self.kontakt_email()},
            "positionen": [{"pos": p.pos or p.idx, "bezeichnung": p.bezeichnung, "menge": p.menge, "einheit": p.einheit, "einzel_netto_cent": p.einzel_netto_cent, "netto_cent": p.netto_cent, "ust_satz_promille": p.ust_satz_promille, "bestellposition": p.get("bestellposition")} for p in self.positionen if p.art not in ("Text", "Zwischensumme") and not p.alternativ],
            "steuer": [{"ust_satz_promille": a.ust_satz_promille, "netto_cent": a.netto_cent, "ust_cent": a.ust_cent} for a in self.ust_aufteilung],
            "netto_cent": self.netto_cent, "ust_cent": self.ust_cent, "brutto_cent": self.brutto_cent, "anzahlung_brutto_cent": self.anzahlung_brutto_cent, "zahlbar_cent": self.zahlbar_cent,
            "skonto_promille": self.skonto_promille, "skonto_bis": getdate(self.skonto_bis) if self.skonto_bis else None,
        }

    @frappe.whitelist()
    def erechnung_erzeugen(self, format=None):
        """E-Rechnung als XML-Datei anhängen (ebInterface 6.1 / ZUGFeRD EN16931 / XRechnung). Rechnungen an den Bund
        werden über e-rechnung.gv.at (USP) oder PEPPOL eingebracht – Upload macht die Buchhaltung, nicht ph_faktura."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("E-Rechnung nur für gestellte Rechnungen."))
        from ph_faktura.rechenwerk import erechnung as ER

        fmt = format or self.erechnung_format or "ebInterface 6.1"
        try:
            dateiname, xml = ER.erzeuge(fmt, self.erechnung_daten())
        except ER.ERechnungFehler as e:
            frappe.throw(str(e))
        datei = frappe.get_doc({"doctype": "File", "file_name": dateiname, "content": xml.encode("utf-8"), "is_private": 1, "attached_to_doctype": self.doctype, "attached_to_name": self.name}).insert(ignore_permissions=True)
        self.db_set({"erechnung_datei": datei.file_url, "erechnung_format": fmt})
        journal.schreibe("Export", self, 0, f"E-Rechnung {fmt} {dateiname}")
        return {"datei": datei.file_url, "format": fmt, "hinweis": _("Bund: Upload über e-rechnung.gv.at (USP) oder PEPPOL-Zugangspunkt.") if self.erechnung_bund else None}

    @frappe.whitelist()
    def gutschrift_erstellen(self, art="Storno", grund=None, erstattung_art=None):
        """Button „Gutschrift“/„Storno“: PH Gutschrift (Entwurf) mit Bezug auf diese Rechnung."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Gutschrift nur zu gestellten Rechnungen."))
        if self.status == "Storniert":
            frappe.throw(_("Rechnung ist bereits storniert."))
        gu = frappe.new_doc("PH Gutschrift")
        gu.update({"rechnung": self.name, "art": art, "grund": grund or _("Storno von {0}").format(self.name), "datum": nowdate(), "erstattung_art": erstattung_art or ("Rückzahlung" if self.bezahlt_cent else "Verrechnung mit offener Rechnung")})
        gu.insert()
        return gu.name

    @frappe.whitelist()
    def mahnen(self, stufe=None):
        """Button „Mahnen“: nächste Mahnstufe als Entwurf anlegen."""
        self.check_permission("write")
        if self.docstatus != 1 or cint(self.offen_cent) <= 0:
            frappe.throw(_("Nur offene, gestellte Rechnungen können gemahnt werden."))
        if self.mahnsperre:
            frappe.throw(_("Mahnsperre gesetzt: {0}").format(self.mahnsperre_grund or ""))
        stufe = cint(stufe) or min(cint(self.mahnstufe) + 1, 3)
        ma = frappe.get_doc({"doctype": "PH Mahnung", "rechnung": self.name, "stufe": stufe, "datum": nowdate()}).insert()
        return ma.name

    @frappe.whitelist()
    def senden(self, empfaenger, betreff=None, nachricht=None):
        """Button „Als PDF senden“ (nur gestellte Rechnungen – Entwürfe tragen keine Nummer)."""
        self.check_permission("email")
        if self.docstatus != 1:
            frappe.throw(_("Bitte zuerst stellen – Entwürfe werden nicht versendet."))
        return versand.senden(self, empfaenger, betreff, nachricht)

    @frappe.whitelist()
    def zahlungslink(self):
        """Button „Zahlungslink senden“: PH Anzahlung (ph_shop) für Stripe-Link über den offenen Betrag."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Anzahlung"):
            frappe.throw(_("DocType PH Anzahlung (ph_shop) ist noch nicht installiert."))
        if cint(self.offen_cent) <= 0:
            frappe.throw(_("Nichts offen."))
        az = frappe.get_doc({"doctype": "PH Anzahlung", "auftrag_referenz": self.name, "kontakt": self.kontakt, "kunde_email": self.kontakt_email(), "betrag_cent": self.offen_cent, "status": "offen", "erstellt_von": frappe.session.user}).insert()
        return az.name

    @frappe.whitelist()
    def uneinbringlich(self, grund):
        self.check_permission("cancel")
        if self.docstatus != 1 or cint(self.offen_cent) <= 0:
            frappe.throw(_("Nur offene Rechnungen."))
        self.db_set({"status": "Uneinbringlich", "workflow_state": "PH Uneinbringlich", "uneinbringlich_grund": grund})
        journal.schreibe("Korrektur", self, self.offen_cent, f"Uneinbringlich: {grund}")
        return True

    @frappe.whitelist()
    def pdf_neu_rendern(self):
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("PDF wird beim Stellen fixiert."))
        if self.gesendet_am or self.export_status == "exportiert":
            frappe.throw(_("PDF ist fixiert (gesendet/exportiert) und wird nicht neu gerendert."))
        return versand.pdf_fixieren(self)


def ueberfaellig_setzen(stichtag=None):
    """Scheduler: gestellte/teilbezahlte Rechnungen mit Fälligkeit < Stichtag → Ueberfaellig."""
    stichtag = getdate(stichtag or nowdate())
    n = 0
    for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "status": ("in", ("Gestellt", "Teilbezahlt")), "faellig": ("<", stichtag), "offen_cent": (">", 0)}, pluck="name"):
        frappe.db.set_value("PH Rechnung", r, {"status": "Ueberfaellig", "workflow_state": "PH Ueberfaellig"}, update_modified=False)
        n += 1
    return n


def nachweis_status(doc):
    """Steuerfreie Ausfuhr (§ 7 UStG) / igL (Art. 7 UStG) nur mit Nachweis – sonst Status „fehlt“ (Report/Erinnerung)."""
    if doc.ust_fall == "Ausfuhr":
        return "vorhanden" if (doc.get("ausfuhr_mrn") or doc.get("ausfuhr_nachweis")) else "fehlt"
    if doc.ust_fall == "Innergemeinschaftlich steuerfrei":
        return "vorhanden" if doc.get("gelangensbestaetigung") else "fehlt"
    return "nicht noetig"


def naechste_nummer(serie, datum=None):
    """Vorschau der nächsten Nummer einer Serie wie „RE-.YYYY.-.#####“ (tabSeries), ohne zu reservieren."""
    jahr = getdate(datum or nowdate()).strftime("%Y")
    teile = serie.split(".")
    praefix = "".join(jahr if t == "YYYY" else t for t in teile if t and not t.startswith("#"))
    breite = max((len(t) for t in teile if t.startswith("#")), default=5)
    zeile = frappe.db.sql("select current from `tabSeries` where name = %s", praefix)
    return f"{praefix}{(cint(zeile[0][0]) if zeile else 0) + 1:0{breite}d}"
