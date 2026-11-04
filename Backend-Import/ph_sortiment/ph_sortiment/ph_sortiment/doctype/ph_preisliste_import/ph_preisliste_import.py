"""PH Preisliste Import – Herstellerpreisliste mit Stand prüfen und als Preise mit Stand übernehmen."""

import csv
import io

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_sortiment.logik.preise import preisliste_zeilen_pruefen, to_cent


class PHPreislisteImport(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Hochgeladen"

    def validate(self):
        self.titel = f"{self.marke} · {self.preisart} · Stand {frappe.utils.formatdate(self.stand)}"[:140]
        if not self.schwelle_prozent:
            from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

            self.schwelle_prozent = einstellungen()["preisliste_schwelle_prozent"]
        self.zeilen_anzahl = len(self.zeilen)
        self.zeilen_auffaellig = sum(1 for z in self.zeilen if z.abweichung_prozent is not None and abs(z.abweichung_prozent) > self.schwelle_prozent)

    # ── Buttons ───────────────────────────────────────────────────────────

    @frappe.whitelist()
    def datei_einlesen(self):
        """CSV (Trenner ; oder ,): hersteller_artikelnr;neu[;bezeichnung]. Beträge in Euro oder Cent (Spalte neu_cent)."""
        self.check_permission("write")
        if not self.datei:
            frappe.throw(_("Keine Datei angehängt."))
        inhalt = frappe.get_doc("File", {"file_url": self.datei}).get_content()
        if isinstance(inhalt, bytes):
            inhalt = inhalt.decode("utf-8-sig", errors="replace")
        probe = inhalt[:2000]
        trenner = ";" if probe.count(";") >= probe.count(",") else ","
        reader = csv.DictReader(io.StringIO(inhalt), delimiter=trenner)
        self.set("zeilen", [])
        for r in reader:
            r = {str(k or "").strip().lower(): (v or "").strip() for k, v in r.items()}
            nr = r.get("hersteller_artikelnr") or r.get("artikelnr") or r.get("artikelnummer") or r.get("sku")
            if not nr:
                continue
            neu = to_cent(r.get("neu_cent")) if r.get("neu_cent") else to_cent(r.get("neu") or r.get("preis") or r.get("uvp") or r.get("brutto"))
            self.append("zeilen", {"hersteller_artikelnr": nr, "neu_cent": neu, "bezeichnung": r.get("bezeichnung") or r.get("name") or ""})
        self.pruefen(speichern=False)
        self.save()
        return len(self.zeilen)

    @frappe.whitelist()
    def pruefen(self, speichern=True):
        """Button „Prüfen“: Produkte zuordnen (Artikelnr. der Marke), Altpreis holen, Abweichung > Schwelle markieren."""
        self.check_permission("write")
        produkte = {p.hersteller_artikelnr.strip().upper(): p for p in frappe.get_all("PH Produkt", filters={"marke": self.marke, "hersteller_artikelnr": ("!=", "")}, fields=["name", "hersteller_artikelnr", "titel", "aktueller_preis_cent"]) if p.hersteller_artikelnr}
        rohe = []
        for z in self.zeilen:
            p = produkte.get((z.hersteller_artikelnr or "").strip().upper())
            if p:
                z.produkt = p.name
                z.bezeichnung = z.bezeichnung or p.titel
                z.alt_cent = p.aktueller_preis_cent
            rohe.append({"produkt": z.produkt, "alt_cent": z.alt_cent, "neu_cent": z.neu_cent, "uebernehmen": 1})
        anzahl, auffaellig = preisliste_zeilen_pruefen(rohe, self.schwelle_prozent or 15)
        for z, r in zip(self.zeilen, rohe):
            z.abweichung_prozent, z.hinweis, z.uebernehmen = r["abweichung_prozent"], r["hinweis"], r["uebernehmen"]
        self.protokoll = _("{0} geprüft am {1}: {2} Zeilen, {3} über Schwelle {4} %, {5} ohne Produkt.").format(frappe.session.user, frappe.utils.format_datetime(now_datetime()), anzahl, auffaellig, self.schwelle_prozent, sum(1 for r in rohe if not r["produkt"]))
        self.geprueft_von, self.geprueft_am = frappe.session.user, now_datetime()
        if self.status == "Hochgeladen":
            self.status = "Geprueft"
            if frappe.db.exists("Workflow State", "PH Geprueft"):
                self.workflow_state = "PH Geprueft"
        if speichern:
            self.save()
        return {"zeilen": anzahl, "auffaellig": auffaellig}

    @frappe.whitelist()
    def uebernehmen(self):
        """Button „Übernehmen“ (Leitung): schreibt je markierter Zeile einen Preis mit Stand in PH Produkt."""
        self.check_permission("write")
        if not ({"PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"} & set(frappe.get_roles())):
            frappe.throw(_("Übernehmen darf nur die Leitung."))
        if self.status not in ("Geprueft",):
            frappe.throw(_("Erst prüfen, dann übernehmen."))
        n = 0
        for z in self.zeilen:
            if not (z.uebernehmen and z.produkt and z.neu_cent):
                continue
            p = frappe.get_doc("PH Produkt", z.produkt)
            p.append("preise", {"ab": self.stand, "stand": self.stand, "brutto_cent": int(z.neu_cent), "preisart": self.preisart, "waehrung": self.waehrung or "EUR", "quelle": "Herstellerliste", "quelle_url": self.quelle if str(self.quelle or "").startswith("http") else None, "beleg": self.datei, "freigegeben": 1, "sku": z.hersteller_artikelnr})
            p.import_quelle = "preisliste"
            p.import_stand = now_datetime()
            p.save()
            n += 1
        self.db_set({"status": "Uebernommen", "uebernommen_von": frappe.session.user, "uebernommen_am": now_datetime(), "protokoll": (self.protokoll or "") + "\n" + _("{0} Preise übernommen.").format(n)})
        if frappe.db.exists("Workflow State", "PH Uebernommen"):
            self.db_set("workflow_state", "PH Uebernommen")
        self.add_comment("Info", _("{0} Preise mit Stand {1} übernommen").format(n, frappe.utils.formatdate(self.stand)))
        return n
