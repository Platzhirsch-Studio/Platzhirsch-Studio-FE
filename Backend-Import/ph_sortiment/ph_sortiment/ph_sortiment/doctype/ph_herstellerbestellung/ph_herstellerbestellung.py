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

from ph_sortiment.logik.abgleich import abgleich, bestellstatus_aus_mengen, offen

OFFEN = ("Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert")


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
        self.summen()
        self.titel = f"{self.lieferant} · {self.kommission or self.name or ''}".strip(" ·")[:140]
        if self.lieferadresse != "Kunde direkt" and not self.lieferadresse_text:
            from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

            self.lieferadresse_text = einstellungen()["standard_lieferadresse"]
        if self.lieferadresse == "Kunde direkt" and not self.lieferadresse_text:
            frappe.throw(_("Lieferadresse „Kunde direkt“ braucht die Adresse."))
        if self.status in ("AB erhalten", "AB geprueft") and not self.ab_nummer:
            frappe.throw(_("AB-Nummer fehlt (Button „AB einlesen“)."))
        self.abweichungen_zaehlen()
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
            for k in ("ab_menge", "ab_ek_cent", "bestaetigter_termin", "ab_artikelnr"):
                if z.get(k) not in (None, ""):
                    p.set(k, z.get(k))
        self.ab_abgleich_erzeugen(speichern=False)
        self.save()
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

    @frappe.whitelist()
    def export_schnittstelle(self, format="csv"):
        """Button „Als IWOfurn/pCon exportieren“: CSV-Platzhalter (Schnittstellenpaket folgt). Liefert Dateiname."""
        self.check_permission("read")
        zeilen = ["pos;hersteller_artikelnr;bezeichnung;ausfuehrung;menge;wunschtermin;kommission"]
        for p in self.positionen:
            if p.status != "Storniert":
                zeilen.append(";".join(str(x or "") for x in (p.idx, p.hersteller_artikelnr, p.bezeichnung, p.ausfuehrung_text, p.menge, p.wunschtermin, p.kommission)))
        inhalt = "﻿" + "\r\n".join(zeilen) + "\r\n"
        datei = frappe.get_doc({"doctype": "File", "file_name": f"{self.name}-{format}.csv", "attached_to_doctype": self.doctype, "attached_to_name": self.name, "content": inhalt, "is_private": 1}).insert()
        self.db_set("export_am", now_datetime())
        return datei.file_url

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
