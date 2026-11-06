"""PH Herstellerbestellung – Bestellung beim Lieferanten mit AB-Abgleich (Prüfprotokoll) und Lieferverfolgung.

Status setzt der Workflow „PH Herstellerbestellung“:
Entwurf → Gesendet → AB erhalten → AB geprueft → Teilgeliefert/Geliefert → Abgeschlossen; Storniert.
Übergänge, die Geld/Lieferung auslösen (Senden, AB freigeben bei Abweichung, Stornieren) sind
Leitung-pflichtig oder haben Bedingungen (fixtures/workflow.json).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, getdate, now_datetime, nowdate

from ph_sortiment.logik.abgleich import abgleich, bestellstatus_aus_mengen, klaerung, offen, reklamation_text
from ph_sortiment.logik.bestellung import aenderung_text, terminaenderungen
from ph_sortiment.logik.kalkulation import skonto_cent, zuschlaege_cent
from ph_sortiment.logik.uebermittlung import AdapterFehler, ab_merker, ab_vollstaendig, adapter_fuer_bestellweg, exportieren, uebermittlung_erlaubt

OFFEN = ("Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert")
LEITUNG = {"PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"}


class PHHerstellerbestellung(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"
        if not self.quelle:
            self.quelle = "backoffice"

    def validate(self):
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position ist nötig."))
        self.positionen_pruefen()
        self.wunschtermin_schaetzen()
        self.summen()
        self.konditionen()
        self.terminaenderungen_protokollieren()
        self.titel = f"{self.lieferant} · {self.kommission or self.name or ''}".strip(" ·")[:140]
        if self.lieferadresse != "Kunde direkt" and not self.lieferadresse_text:
            from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

            self.lieferadresse_text = einstellungen()["standard_lieferadresse"]
        if self.lieferadresse == "Kunde direkt" and not self.lieferadresse_text:
            frappe.throw(_("Lieferadresse „Kunde direkt“ braucht die Adresse."))
        if self.status in ("AB erhalten", "AB geprueft") and not self.ab_nummer:
            frappe.throw(_("AB-Nummer fehlt (Button „AB einlesen“)."))
        self.abweichungen_zaehlen()
        self.ab_merker_setzen()
        alt_status = (self.get_doc_before_save() or frappe._dict()).get("status")
        if self.status == "AB geprueft" and alt_status != "AB geprueft" and not self.ab_vollstaendig:
            frappe.throw(_("AB nicht vollständig: Positionen mit AB-Merker „offen“/„abweichung“ zuerst klären."))
        if self.status == "Abgeschlossen" and self.abweichungen_offen:
            frappe.throw(_("Abschließen nicht möglich: {0} Abweichungen sind nicht bewertet.").format(self.abweichungen_offen))
        self.zeitstempel()

    def positionen_pruefen(self):
        for p in self.positionen:
            if (p.menge or 0) <= 0 and p.status != "Storniert":
                frappe.throw(_("Position {0}: Menge muss größer 0 sein.").format(p.idx))
            if p.produkt and not p.bezeichnung:
                p.bezeichnung = frappe.db.get_value("PH Produkt", p.produkt, "titel") or p.produkt
            if p.produkt and not p.hersteller_artikelnr:
                p.hersteller_artikelnr = frappe.db.get_value("PH Produkt", p.produkt, "hersteller_artikelnr")
            if p.ausfuehrung and not p.ausfuehrung_text:
                p.ausfuehrung_text = frappe.db.get_value("PH Produkt Ausfuehrung", p.ausfuehrung, "name_de")
            if not p.wunschtermin and self.wunschtermin:
                p.wunschtermin = self.wunschtermin
            if not p.kommission and self.kommission:
                p.kommission = self.kommission

    def summen(self):
        aktiv = [p for p in self.positionen if p.status != "Storniert"]
        self.summe_ek_cent = sum((p.ek_cent or 0) * (p.menge or 0) for p in aktiv)
        self.summe_vk_cent = sum((p.vk_cent or 0) * (p.menge or 0) for p in aktiv)
        self.menge_bestellt = sum(p.menge or 0 for p in aktiv)
        self.menge_erhalten = sum(p.menge_erhalten or 0 for p in aktiv)
        termine = [getdate(p.bestaetigter_termin) for p in aktiv if p.bestaetigter_termin]
        self.bestaetigter_termin = max(termine) if termine else None

    def wunschtermin_schaetzen(self):
        """Ohne Wunschtermin: Lieferzeit des Lieferanten (je Marke/Kategorie, Betriebsurlaub) ab Bestelldatum."""
        if self.wunschtermin or not self.lieferant or self.status not in (None, "", "Entwurf"):
            return
        from ph_sortiment.ph_sortiment.doctype.ph_lieferant.ph_lieferant import liefertermin_fuer

        erste = self.positionen[0].produkt if self.positionen else None
        kategorie = frappe.db.get_value("PH Produkt", erste, "kategorie") if erste else None
        t = liefertermin_fuer(self.lieferant, self.marke, kategorie, self.datum or nowdate())
        if t.get("termin_spaet"):
            self.wunschtermin = t["termin_spaet"]
            for p in self.positionen:
                p.wunschtermin = p.wunschtermin or self.wunschtermin

    def terminaenderungen_protokollieren(self):
        """Änderungen des bestätigten Termins (Kopf + Positionen) gegen den gespeicherten Stand → Kindtabelle terminaenderungen.
        Quelle über self.flags.termin_quelle (AB/Lieferant/Manuell), Grund über self.flags.termin_grund."""
        alt = self.get_doc_before_save()
        if not alt:
            return
        neu = terminaenderungen(alt.bestaetigter_termin, self.bestaetigter_termin, [p.as_dict() for p in alt.positionen], [p.as_dict() for p in self.positionen])
        if not neu:
            return
        jetzt = now_datetime()
        for a in neu:
            self.append("terminaenderungen", {**a, "geaendert_am": jetzt, "quelle": self.flags.termin_quelle or "Manuell", "grund": (self.flags.termin_grund or "")[:140] or None})
        self.liefertermin_geaendert_am = jetzt
        self.flags.neue_terminaenderungen = neu

    def on_update(self):
        """Neue Terminänderungen: ToDo an den Besteller (ph_projekte informiert Projekt/Kunde über doc_events)."""
        neu = self.flags.neue_terminaenderungen
        self.flags.neue_terminaenderungen = None
        if not neu:
            return
        try:
            nach = {p.idx: p.bezeichnung for p in self.positionen}
            text = "; ".join(aenderung_text(a, nach.get(a.get("position"))) for a in neu)
            empfaenger = self.gesendet_von or self.owner
            if empfaenger and empfaenger not in ("Administrator", "Guest"):
                frappe.get_doc({"doctype": "ToDo", "allocated_to": empfaenger, "reference_type": self.doctype, "reference_name": self.name, "description": _("Liefertermin geändert ({0}): {1}").format(self.kommission or self.name, text)[:1000], "priority": "Medium"}).insert(ignore_permissions=True)
            self.add_comment("Info", _("Liefertermin geändert: {0}").format(text)[:1000])
        except Exception:  # noqa: BLE001 – Nebenwirkung, nie den Speichervorgang stören (CONVENTIONS 3)
            frappe.log_error(title=f"PH Herstellerbestellung {self.name}: Termin-Benachrichtigung")

    def konditionen(self):
        """Zu-/Abschläge und Skonto aus den Lieferantenkonditionen (EK-Sicht, permlevel 1)."""
        if not self.lieferant:
            return
        k = frappe.db.get_value("PH Lieferant", self.lieferant, ["mindestbestellwert_cent", "mindermengenzuschlag_cent", "fracht_pauschale_cent", "frachtfrei_ab_cent", "skonto_promille"], as_dict=True) or {}
        self.zuschlaege_cent = zuschlaege_cent(self.summe_ek_cent, k.get("mindestbestellwert_cent"), k.get("mindermengenzuschlag_cent"), k.get("fracht_pauschale_cent"), k.get("frachtfrei_ab_cent"))
        self.skonto_cent = skonto_cent((self.summe_ek_cent or 0) + self.zuschlaege_cent, k.get("skonto_promille"))

    def ab_merker_setzen(self):
        """AB-Merker je Position aus AB und Prüfprotokoll; ab_vollstaendig, wenn alle aktiven Positionen bestätigt/geklärt."""
        je = {}
        for z in self.ab_abgleich:
            je.setdefault(z.position, []).append(z.as_dict())
        merker = []
        for p in self.positionen:
            if p.status == "Storniert":
                continue
            m = ab_merker(bool(self.ab_nummer), je.get(p.idx, []))
            if p.ab_merker != m:
                p.ab_merker, p.ab_merker_am = m, nowdate()
            merker.append(m)
        self.ab_vollstaendig = 1 if ab_vollstaendig(merker) else 0

    def abweichungen_zaehlen(self):
        self.abweichungen_anzahl = len(self.ab_abgleich)
        self.abweichungen_offen = offen([z.as_dict() for z in self.ab_abgleich])
        for z in self.ab_abgleich:
            if z.bewertung in ("ok", "abgelehnt") and not z.geprueft_am:
                z.geprueft_am, z.geprueft_von = now_datetime(), frappe.session.user

    def zeitstempel(self):
        alt = self.get_doc_before_save()
        alt_status = alt.status if alt else None
        if self.status != alt_status:
            if self.status == "Gesendet" and not self.gesendet_am:
                self.gesendet_am, self.gesendet_von = now_datetime(), frappe.session.user
            if self.status == "AB erhalten" and not self.ab_eingang:
                self.ab_eingang = now_datetime()
            if self.status == "AB geprueft":
                self.ab_geprueft_am, self.ab_geprueft_von = now_datetime(), frappe.session.user
                for p in self.positionen:
                    if p.status == "Offen":
                        p.status = "Bestaetigt"
            if self.status == "Storniert":
                for p in self.positionen:
                    if p.status in ("Offen", "Bestaetigt"):
                        p.status = "Storniert"

    # ── Buttons (ph_herstellerbestellung.js) ─────────────────────────────

    @frappe.whitelist()
    def per_email_senden(self, empfaenger=None, nachricht=None):
        """Button „Per E-Mail senden“: PDF (Druckformat aus Einstellungen) an Bestell-E-Mail; Status → Gesendet."""
        self.check_permission("write")
        from ph_core.utils.mail import sende
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        einst = einstellungen()
        empfaenger = empfaenger or self.gesendet_an or frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
        if not empfaenger:
            frappe.throw(_("Keine Bestell-E-Mail beim Lieferanten hinterlegt."))
        pdf = frappe.attach_print(self.doctype, self.name, print_format=einst["bestell_druckformat"], file_name=f"Bestellung-{self.name}")
        text = nachricht or _("Sehr geehrte Damen und Herren,\n\nanbei unsere Bestellung {0}{1}. Bitte senden Sie uns Ihre Auftragsbestätigung mit Liefertermin.\n\nMit freundlichen Grüßen\nPlatzhirsch Home Living").format(self.name, f" (Kommission {self.kommission})" if self.kommission else "")
        sende([empfaenger], _("Bestellung {0} – Platzhirsch Home Living").format(self.name), text.replace("\n", "<br>"), text=text, anhaenge=[pdf], referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set({"gesendet_an": empfaenger, "gesendet_am": now_datetime(), "gesendet_von": frappe.session.user})
        self.uebermittlung_protokollieren("E-Mail", "Uebermittelt", None, _("PDF an {0}").format(empfaenger), pruefen=False)
        if self.status == "Entwurf":
            self.workflow_setzen("Gesendet")
        self.add_comment("Info", _("Bestellung per E-Mail an {0} gesendet").format(empfaenger))
        return empfaenger

    @frappe.whitelist()
    def ab_einlesen(self, ab_nummer, ab_datum, positionen=None, ab_datei=None):
        """Button „AB einlesen“: Nummer, Datum, Datei und bestätigte Werte je Position; danach Abgleich."""
        self.check_permission("write")
        if isinstance(positionen, str):
            positionen = frappe.parse_json(positionen)
        self.ab_nummer, self.ab_datum = ab_nummer, ab_datum
        if ab_datei:
            self.ab_datei = ab_datei
        if not self.ab_eingang:
            self.ab_eingang = now_datetime()
        nach_idx = {p.idx: p for p in self.positionen}
        for z in positionen or []:
            p = nach_idx.get(int(z.get("idx")))
            if not p:
                continue
            for k in ("ab_menge", "ab_ek_cent", "bestaetigter_termin", "ab_artikelnr", "ab_ausfuehrung_text"):
                if z.get(k) not in (None, ""):
                    p.set(k, z.get(k))
        self.ab_abgleich_erzeugen(speichern=False)
        self.flags.termin_quelle = "AB"
        self.flags.termin_grund = _("AB {0}").format(ab_nummer)
        self.save()
        if self.uebermittlung_status in ("Uebermittelt", "Exportiert"):
            self.uebermittlung_protokollieren(self.uebermittlung_weg or "E-Mail", "Bestaetigt", None, _("AB {0} erhalten").format(ab_nummer), pruefen=False)
        if self.status == "Gesendet":
            self.workflow_setzen("AB erhalten")
        return {"abweichungen": self.abweichungen_anzahl}

    @frappe.whitelist()
    def ab_abgleich_erzeugen(self, speichern=True):
        """Button „AB-Abgleich erzeugen“: Soll/Ist je Position → Prüfprotokoll (bestehende Bewertungen bleiben)."""
        self.check_permission("write")
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        einst = einstellungen()
        protokoll, kennzeichen, spaetester = abgleich([p.as_dict() for p in self.positionen], einst["ab_toleranz_preis_prozent"], einst["ab_toleranz_termin_tage"])
        alte = {(z.position, z.feld): z for z in self.ab_abgleich}
        self.set("ab_abgleich", [])
        for z in protokoll:
            alt = alte.get((z["position"], z["feld"]))
            if alt and alt.bestellt == z["bestellt"] and alt.bestaetigt == z["bestaetigt"]:
                z.update({"bewertung": alt.bewertung, "kommentar": alt.kommentar, "geprueft_von": alt.geprueft_von, "geprueft_am": alt.geprueft_am})
            self.append("ab_abgleich", z)
        for p in self.positionen:
            p.abweichung = kennzeichen.get(p.idx, "keine")
        self.bestaetigter_termin = spaetester
        self.abweichungen_zaehlen()
        if speichern:
            self.save()
        return {"abweichungen": len(protokoll), "offen": self.abweichungen_offen}

    @frappe.whitelist()
    def abweichung_bewerten(self, zeile, bewertung, kommentar=None):
        """Bewertung einer Protokollzeile (ok/pruefen/abgelehnt) – Leitung bei abgelehnt."""
        self.check_permission("write")
        if bewertung == "abgelehnt" and not ({"PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"} & set(frappe.get_roles())):
            frappe.throw(_("Ablehnen darf nur die Leitung."))
        for z in self.ab_abgleich:
            if z.name == zeile or str(z.idx) == str(zeile):
                z.bewertung, z.kommentar = bewertung, kommentar or z.kommentar
                z.geprueft_am, z.geprueft_von = now_datetime(), frappe.session.user
        self.save()
        return self.abweichungen_offen

    @frappe.whitelist()
    def abweichung_klaeren(self, zeile, aktion, text=None):
        """Abweichungsworkflow je Protokollzeile: akzeptieren (→ ok) · lieferant_reklamieren (Mail an Bestell-E-Mail, → pruefen)
        · kunde_rueckfragen (ToDo an Besteller, → pruefen). Ablehnen bleibt abweichung_bewerten (Leitung)."""
        self.check_permission("write")
        try:
            bewertung, vermerk = klaerung(aktion)
        except ValueError:
            frappe.throw(_("Unbekannte Aktion {0}.").format(aktion))
        treffer = [z for z in self.ab_abgleich if z.name == zeile or str(z.idx) == str(zeile)]
        if not treffer:
            frappe.throw(_("Protokollzeile {0} nicht gefunden.").format(zeile))
        if aktion == "akzeptieren" and treffer[0].feld == "Preis" and not (LEITUNG & set(frappe.get_roles())):
            frappe.throw(_("Preisabweichungen akzeptiert nur die Leitung."))
        if aktion == "lieferant_reklamieren":
            from ph_core.utils.mail import sende

            email = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            if not email:
                frappe.throw(_("Keine Bestell-E-Mail beim Lieferanten."))
            inhalt = reklamation_text([z.as_dict() for z in treffer], self.name, self.ab_nummer, text)
            sende([email], _("Abweichung Auftragsbestätigung {0} / Bestellung {1}").format(self.ab_nummer or "", self.name), inhalt.replace("\n", "<br>"), text=inhalt, referenz_doctype=self.doctype, referenz_name=self.name)
        elif aktion == "kunde_rueckfragen":
            empfaenger = self.gesendet_von or self.owner
            frappe.get_doc({"doctype": "ToDo", "allocated_to": empfaenger, "reference_type": self.doctype, "reference_name": self.name, "description": _("Kundenrückfrage zu AB-Abweichung Pos. {0} ({1}): {2} → {3}. {4}").format(treffer[0].position, treffer[0].feld, treffer[0].bestellt, treffer[0].bestaetigt, text or "")[:1000]}).insert(ignore_permissions=True)
        for z in treffer:
            z.bewertung, z.klaerung, z.geklaert_am = bewertung, vermerk, now_datetime()
            z.kommentar = (text or z.kommentar or "")[:140] or None
            z.geprueft_am, z.geprueft_von = now_datetime(), frappe.session.user
        self.save()
        return {"bewertung": bewertung, "klaerung": vermerk, "offen": self.abweichungen_offen}

    @frappe.whitelist()
    def ab_nachfragen(self, nachricht=None):
        """Button „AB nachfragen“ (Status Gesendet): Erinnerung an die Bestell-E-Mail des Lieferanten."""
        self.check_permission("write")
        if self.status != "Gesendet":
            frappe.throw(_("Nachfragen nur bei gesendeten Bestellungen ohne AB."))
        from ph_core.utils.mail import sende

        email = self.gesendet_an or frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
        if not email:
            frappe.throw(_("Keine Bestell-E-Mail beim Lieferanten."))
        text = nachricht or _("Sehr geehrte Damen und Herren,\n\nzu unserer Bestellung {0} vom {1}{2} liegt uns noch keine Auftragsbestätigung vor. Bitte senden Sie uns diese mit verbindlichem Liefertermin.\n\nMit freundlichen Grüßen\nPlatzhirsch Home Living").format(self.name, frappe.utils.formatdate(self.gesendet_am or self.datum), f" (Kommission {self.kommission})" if self.kommission else "")
        sende([email], _("Auftragsbestätigung zu Bestellung {0}").format(self.name), text.replace("\n", "<br>"), text=text, referenz_doctype=self.doctype, referenz_name=self.name)
        self.add_comment("Info", _("AB beim Lieferanten nachgefragt ({0})").format(email))
        return email

    @frappe.whitelist()
    def termin_aendern(self, termin, position=None, grund=None, quelle="Lieferant"):
        """Button „Liefertermin ändern“: neuer bestätigter Termin für eine Position (idx) oder alle offenen Positionen.
        Wird protokolliert (terminaenderungen) und von ph_projekte an Projekt/Kunde weitergegeben."""
        self.check_permission("write")
        if quelle not in ("AB", "Lieferant", "Manuell"):
            frappe.throw(_("Quelle ungültig."))
        if not grund:
            frappe.throw(_("Bitte einen Grund angeben."))
        for p in self.positionen:
            if p.status in ("Storniert", "Geliefert"):
                continue
            if position in (None, "", 0, "0") or str(p.idx) == str(position):
                p.bestaetigter_termin = termin
        self.flags.termin_quelle, self.flags.termin_grund = quelle, grund
        self.ab_abgleich_erzeugen(speichern=False)
        self.save()
        return {"bestaetigter_termin": str(self.bestaetigter_termin) if self.bestaetigter_termin else None, "aenderungen": len(self.terminaenderungen)}

    @frappe.whitelist()
    def wareneingang_anlegen(self):
        """Button „Wareneingang anlegen“: offene Mengen je Position übernehmen."""
        self.check_permission("write")
        if self.status not in ("AB erhalten", "AB geprueft", "Teilgeliefert", "Gesendet"):
            frappe.throw(_("Wareneingang nur für gesendete Bestellungen."))
        positionen = []
        for p in self.positionen:
            if p.status == "Storniert":
                continue
            rest = (p.ab_menge if p.ab_menge not in (None, 0) else p.menge) - (p.menge_erhalten or 0)
            if rest > 0:
                positionen.append({"position": p.idx, "produkt": p.produkt, "bezeichnung": p.bezeichnung, "menge_erwartet": rest, "menge_erhalten": rest, "zustand": "ok"})
        if not positionen:
            frappe.throw(_("Alle Positionen sind bereits vollständig geliefert."))
        we = frappe.get_doc({"doctype": "PH Wareneingang", "herstellerbestellung": self.name, "datum": nowdate(), "positionen": positionen}).insert()
        return we.name

    def _export_daten(self):
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        lf = frappe.db.get_value("PH Lieferant", self.lieferant, ["firmenname", "gln", "kundennummer_bei_lieferant"], as_dict=True) or {}
        einst = einstellungen()
        pos = []
        for p in self.positionen:
            if p.status == "Storniert":
                continue
            ean = frappe.db.get_value("PH Produkt Ausfuehrung", p.ausfuehrung, "ean") if p.ausfuehrung else None
            if not ean and p.produkt:
                ean = frappe.db.get_value("PH Produkt", p.produkt, "ean")
            pos.append({"idx": p.idx, "hersteller_artikelnr": p.hersteller_artikelnr, "ean": ean, "bezeichnung": p.bezeichnung, "ausfuehrung_text": p.ausfuehrung_text, "menge": p.menge, "einheit": p.einheit, "wunschtermin": str(p.wunschtermin) if p.wunschtermin else None, "kommission": p.kommission})
        bestellung = {"name": self.name, "datum": str(self.datum or nowdate()), "wunschtermin": str(self.wunschtermin) if self.wunschtermin else None, "kommission": self.kommission, "waehrung": self.waehrung or "EUR", "lieferadresse_text": self.lieferadresse_text, "notizen_lieferant": self.notizen_lieferant, "positionen": pos}
        absender = {"firma": "Platzhirsch Home Living", "gln": einst.get("eigene_gln")}
        return bestellung, absender, {"firmenname": lf.get("firmenname"), "gln": lf.get("gln"), "kundennummer": lf.get("kundennummer_bei_lieferant")}

    def uebermittlung_protokollieren(self, weg, status, datei=None, hinweis=None, pruefen=True):
        """Übermittlungsstatus setzen und Protokollzeile anhängen (ohne den Beleg neu zu validieren)."""
        if pruefen and not uebermittlung_erlaubt(self.uebermittlung_status, status):
            frappe.throw(_("Übermittlungsstatus {0} → {1} nicht erlaubt.").format(self.uebermittlung_status or "–", status))
        jetzt = now_datetime()
        frappe.get_doc({"doctype": "PH Herstellerbestellung Uebermittlung", "parent": self.name, "parenttype": self.doctype, "parentfield": "uebermittlungen", "idx": len(self.get("uebermittlungen") or []) + 1, "zeitpunkt": jetzt, "weg": weg, "status": status, "datei": datei, "hinweis": (hinweis or "")[:140] or None, "von": frappe.session.user}).db_insert()
        werte = {"uebermittlung_status": status, "uebermittlung_am": jetzt}
        if datei:
            werte["uebermittlung_datei"] = datei
        if not self.uebermittlung_weg:
            werte["uebermittlung_weg"] = weg
        self.db_set(werte)

    @frappe.whitelist()
    def exportieren(self, weg=None):
        """Button „Exportdatei erzeugen“: Bestellung im Format des Übermittlungswegs (CSV/IWOfurn/EDI) als privaten Anhang.
        Keine Direktübertragung – Datei im Lieferantenportal/IWOfurn hochladen, dann „Als übermittelt markieren“."""
        self.check_permission("read")
        bestellweg = frappe.db.get_value("PH Lieferant", self.lieferant, "bestellweg") if self.lieferant else None
        weg = weg or self.uebermittlung_weg or adapter_fuer_bestellweg(bestellweg or self.bestellweg)
        if weg == "E-Mail":
            weg = "CSV"
        try:
            e = exportieren(weg, *self._export_daten())
        except AdapterFehler as f:
            frappe.throw(_("Export nicht möglich: {0}").format(str(f)))
        datei = frappe.get_doc({"doctype": "File", "file_name": e["dateiname"], "attached_to_doctype": self.doctype, "attached_to_name": self.name, "content": e["inhalt"], "is_private": 1}).insert()
        self.db_set("export_am", now_datetime())
        self.uebermittlung_protokollieren(weg, "Exportiert", datei.file_url, e["hinweis"], pruefen=False)
        return {"datei": datei.file_url, "weg": weg, "verifiziert": e["verifiziert"], "hinweis": e["hinweis"]}

    @frappe.whitelist()
    def export_schnittstelle(self, format="csv"):
        """Kompatibel zum bisherigen CSV-Platzhalter: liefert die file_url der Exportdatei."""
        weg = {"csv": "CSV", "iwofurn": "IWOfurn", "edi": "EDI"}.get(str(format).lower(), "CSV")
        return self.exportieren(weg)["datei"]

    @frappe.whitelist()
    def uebermittlung_setzen(self, status, hinweis=None):
        """Button „Übermittlung …“: Uebermittelt (hochgeladen/gesendet), Bestaetigt (Lieferant hat Eingang bestätigt), Fehler."""
        self.check_permission("write")
        if status not in ("Vorbereitet", "Uebermittelt", "Bestaetigt", "Fehler"):
            frappe.throw(_("Status ungültig."))
        self.uebermittlung_protokollieren(self.uebermittlung_weg or "Manuell", status, None, hinweis)
        if status == "Uebermittelt" and self.status == "Entwurf":
            self.workflow_setzen("Gesendet")
        return status

    def workflow_setzen(self, status):
        """Status serverseitig setzen (Workflow-Zustand folgt dem Status-Feld; CONVENTIONS 6)."""
        state = {"Gesendet": "PH Gesendet", "AB erhalten": "PH AB erhalten", "AB geprueft": "PH AB geprueft", "Teilgeliefert": "PH Teilgeliefert", "Geliefert": "PH Geliefert", "Abgeschlossen": "PH Abgeschlossen", "Storniert": "PH Storniert", "Entwurf": "PH Entwurf"}.get(status)
        werte = {"status": status}
        if state and frappe.db.exists("Workflow State", state):
            werte["workflow_state"] = state
        if status == "Gesendet" and not self.gesendet_am:
            werte.update({"gesendet_am": now_datetime(), "gesendet_von": frappe.session.user})
        if status == "AB erhalten" and not self.ab_eingang:
            werte["ab_eingang"] = now_datetime()
        self.db_set(werte)
        self.notify_update()

    def lieferung_verbuchen(self, mengen, datum):
        """Vom Wareneingang gerufen: menge_erhalten je Position erhöhen, Status Teilgeliefert/Geliefert."""
        for p in self.positionen:
            if p.idx in mengen:
                p.menge_erhalten = (p.menge_erhalten or 0) + int(mengen[p.idx])
                soll = p.ab_menge if p.ab_menge not in (None, 0) else p.menge
                p.status = "Geliefert" if p.menge_erhalten >= soll else "Teilgeliefert"
        self.summen()
        neu = bestellstatus_aus_mengen([p.as_dict() for p in self.positionen])
        werte = {}
        if not self.liefertermin_ist:
            werte["liefertermin_ist"] = datum
        if neu == "Geliefert":
            werte["geliefert_am"] = datum
        self.flags.ignore_validate_update_after_submit = True
        self.save(ignore_permissions=True)
        if werte:
            self.db_set(werte)
        if neu and self.status in OFFEN:
            self.workflow_setzen(neu)


def ab_ueberfaellig(tage=None):
    """Gesendete Bestellungen ohne AB nach ab_erwartet_tage des Lieferanten (Scheduler/Report)."""
    out = []
    for r in frappe.get_all("PH Herstellerbestellung", filters={"status": "Gesendet"}, fields=["name", "lieferant", "gesendet_am", "kommission"]):
        frist = tage or frappe.db.get_value("PH Lieferant", r.lieferant, "ab_erwartet_tage") or 5
        if r.gesendet_am and getdate(add_days(r.gesendet_am, frist)) < getdate(nowdate()):
            out.append(r)
    return out
