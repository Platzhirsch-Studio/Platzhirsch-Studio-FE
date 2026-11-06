"""PH Planung – Planungsstand mit Versionen je Projekt."""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import portal_url
from ph_projekte.utils import kuechenplanung

LEITUNG = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager"}


class PHPlanung(Document):
    def before_insert(self):
        if not self.version:
            letzte = frappe.db.get_value("PH Planung", {"projekt": self.projekt}, "max(version)") or 0
            self.version = int(letzte) + 1
        if not self.status:
            self.status = "Entwurf"
        if not self.planer:
            self.planer = frappe.session.user

    def validate(self):
        self.titel = f"Planung V{self.version or 1}: {self.bezeichnung}"[:140]
        if self.quelle_planung in ("Handskizze", "Modell") and not self.echt_bestaetigt:
            frappe.throw(_("Handskizze und Modell nur als echtes Original (Inhaber-Entscheidung Nr. 8) – bitte bestätigen."))
        if self.daten_json:
            try:
                json.loads(self.daten_json)
            except ValueError:
                frappe.throw(_("Konfiguration ist kein gültiges JSON."))

    @frappe.whitelist()
    def neue_version(self):
        """Button: Kopie als nächste Version (Vorgänger wird „Verworfen“, wenn noch Entwurf)."""
        self.check_permission("write")
        neu = frappe.copy_doc(self)
        neu.version = None
        neu.status = "Entwurf"
        neu.vorgaenger = self.name
        neu.freigabe_durch_kunde_am = None
        neu.insert()
        if self.status == "Entwurf":
            self.db_set("status", "Verworfen")
        return neu.name

    @frappe.whitelist()
    def kunden_vorlegen(self, nachricht=None):
        """Sichtbar schalten, Plan als PH Projekt Dokument (Kategorie Plan, Portal-Freigabe) ablegen,
        Kundennachricht schreiben und mailen. PH Planung hat keinen Workflow – Status nur über diese Methoden."""
        self.check_permission("write")
        if self.status not in ("Entwurf", "Aenderung gewuenscht"):
            frappe.throw(_("Nur Entwürfe oder Planungen mit Änderungswunsch können vorgelegt werden."))
        datei = self.datei or self.vorschau
        if not datei:
            frappe.throw(_("Bitte zuerst den Plan (Datei oder Vorschau) hochladen."))
        from ph_projekte.ph_projekte.doctype.ph_projekt_dokument.ph_projekt_dokument import dokument_aus_beleg

        dok = dokument_aus_beleg(self.projekt, self.titel, "Plan", datei, self.doctype, self.name, kunde_sichtbar=1)
        self.db_set({"status": "Kunde vorgelegt", "kunde_sichtbar": 1, "vorgelegt_am": now_datetime(), "kunde_entscheidung": "offen", "vorlage_dokument": dok.name})
        kontakt = frappe.db.get_value("PH Projekt", self.projekt, "kontakt")
        text = (nachricht or "").strip() or _("Ihre Planung „{0}“ (Version {1}) liegt im Kundenportal zur Freigabe bereit.").format(self.bezeichnung, self.version)
        frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": kontakt, "projekt": self.projekt, "richtung": "ausgehend", "text": text, "quelle": "backoffice"}).insert(ignore_permissions=True)
        email = frappe.db.get_value("PH Kontakt", kontakt, "email") if kontakt and frappe.db.exists("DocType", "PH Kontakt") else None
        if email:
            try:
                from ph_core.utils.mail import sende

                link = portal_url("projekte/" + self.projekt)
                sende(email, _("Ihre Planung wartet auf Freigabe"), f"<p>{frappe.utils.escape_html(text)}</p><p><a href=\"{link}\">{_('Zum Kundenportal')}</a></p>", referenz_doctype=self.doctype, referenz_name=self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Planung: Mail fehlgeschlagen")
        return "Kunde vorgelegt"

    def kunde_entscheidet(self, entscheidung, kommentar=None, quelle="portal", ip=None):
        """Portal/Desk: Kundenentscheidung protokollieren (Zeit, Quelle, IP-Hash). entscheidung = freigeben | aendern."""
        if self.status != "Kunde vorgelegt":
            frappe.throw(_("Diese Planung wartet nicht auf eine Entscheidung."))
        werte = {"kunde_kommentar": (kommentar or "")[:2000], "freigabe_quelle": quelle, "freigabe_ip_hash": ip}
        if entscheidung == "freigeben":
            werte.update(status="Freigegeben", kunde_entscheidung="freigegeben", freigabe_durch_kunde_am=now_datetime())
        elif entscheidung == "aendern":
            werte.update(status="Aenderung gewuenscht", kunde_entscheidung="aenderung")
        else:
            frappe.throw(_("Unbekannte Entscheidung."))
        self.db_set(werte)
        art = _("Freigabe") if entscheidung == "freigeben" else _("Änderung gewünscht")
        self.add_comment("Info", _("Kunde: {0}").format(art) + (f" – {kommentar}" if kommentar else ""))
        return werte["status"]

    @frappe.whitelist()
    def freigeben(self, durch_kunde=0, kommentar=None):
        """Desk-Freigabe; mit durch_kunde=1 als Kundenfreigabe (z. B. im Termin bestätigt) protokolliert."""
        self.check_permission("write")
        if int(durch_kunde or 0) and self.status == "Kunde vorgelegt":
            return self.kunde_entscheidet("freigeben", kommentar, quelle="backoffice")
        self.db_set({"status": "Freigegeben"})
        return "Freigegeben"

    @frappe.whitelist()
    def verwerfen(self):
        self.check_permission("write")
        self.db_set("status", "Verworfen")
        return "Verworfen"

    @frappe.whitelist()
    def verwerfen_zuruecknehmen(self):
        """Verworfen → Entwurf (nur Leitung)."""
        self.check_permission("write")
        if not LEITUNG & set(frappe.get_roles()):
            frappe.throw(_("Nur die Projekt-Leitung kann eine verworfene Planung zurückholen."))
        if self.status != "Verworfen":
            frappe.throw(_("Die Planung ist nicht verworfen."))
        self.db_set("status", "Entwurf")
        return "Entwurf"

    # ── Import Küchenplanung (CARAT/KPS/Winner-Export, CSV/XML) ──────────────

    def _datei_inhalt(self, datei):
        datei = datei or self.datei
        if not datei:
            frappe.throw(_("Bitte eine Exportdatei angeben."))
        name = frappe.db.get_value("File", {"file_url": datei}, "name")
        if not name:
            frappe.throw(_("Datei nicht gefunden."))
        return frappe.get_doc("File", name).get_content()

    @frappe.whitelist()
    def import_formate(self):
        return kuechenplanung.formate()

    @frappe.whitelist()
    def import_vorschau(self, datei=None, format="csv", mapping_json=None):
        self.check_permission("read")
        try:
            return kuechenplanung.vorschau(format, self._datei_inhalt(datei), mapping_json, limit=200)
        except kuechenplanung.ImportFehler as e:
            frappe.throw(str(e))

    @frappe.whitelist()
    def import_uebernehmen(self, datei=None, format="csv", mapping_json=None, ersetzen=0):
        """Positionen aus dem Export übernehmen; Produkt über Hersteller-Artikelnr., Lieferant über Firmenname zuordnen."""
        self.check_permission("write")
        if self.status not in ("Entwurf", "Aenderung gewuenscht"):
            frappe.throw(_("Import nur in Entwürfe – bitte eine neue Version anlegen."))
        try:
            erg = kuechenplanung.vorschau(format, self._datei_inhalt(datei), mapping_json, limit=100000)
        except kuechenplanung.ImportFehler as e:
            frappe.throw(str(e))
        if int(ersetzen or 0):
            self.set("positionen", [])
        zugeordnet = 0
        for p in erg["positionen"]:
            produkt = frappe.db.get_value("PH Produkt", {"hersteller_artikelnr": p["hersteller_artikelnr"]}, "name") if p["hersteller_artikelnr"] else None
            lieferant = p["lieferant"] if p["lieferant"] and frappe.db.exists("PH Lieferant", p["lieferant"]) else None
            zugeordnet += 1 if produkt else 0
            self.append("positionen", {
                "bezeichnung": p["bezeichnung"], "pos_nr": p["pos_nr"], "hersteller_artikelnr": p["hersteller_artikelnr"], "marke": p["marke"],
                "lieferant": lieferant, "kategorie": p["kategorie"], "breite_mm": p["breite_mm"], "hoehe_mm": p["hoehe_mm"], "tiefe_mm": p["tiefe_mm"],
                "produkt": produkt, "ausfuehrung_text": (p["ausfuehrung_text"] or "")[:140], "menge": p["menge"], "raum": p["raum"],
                "preis_cent": p["vk_cent"], "ek_cent": p["ek_cent"],
            })
        protokoll = _("{0} Positionen importiert ({1} Produkte zugeordnet) am {2}.").format(erg["anzahl"], zugeordnet, frappe.utils.format_datetime(now_datetime()))
        if erg["warnungen"]:
            protokoll += "\n" + "\n".join(erg["warnungen"][:20])
        self.import_format = erg["format"]
        self.import_protokoll = protokoll
        self.quelle_planung = "Kuechenplaner"
        self.save()
        return {"importiert": erg["anzahl"], "zugeordnet": zugeordnet, "warnungen": erg["warnungen"], "verifiziert": erg["verifiziert"]}

    @frappe.whitelist()
    def positionen_ins_projekt(self):
        """Button: Planungspositionen als Projektpositionen übernehmen (ohne Dubletten, ohne stornierte);
        merkt je Planungsposition die Projektzeile (projekt_zeile) für Abgleich und Bestellstatus-Rückmeldung."""
        self.check_permission("write")
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        vorhanden = {z.name for z in projekt.positionen}
        bekannt = {p.projekt_zeile for p in self.positionen if p.projekt_zeile in vorhanden}
        texte = {z.bezeichnung for z in projekt.positionen}
        paare = []
        for p in self.positionen:
            if p.storniert or p.projekt_zeile in bekannt or (not p.projekt_zeile and p.bezeichnung in texte):
                continue
            zeile = projekt.append("positionen", {
                "bezeichnung": p.bezeichnung, "produkt": p.produkt, "ausfuehrung_text": p.ausfuehrung_text, "menge": p.menge, "raum": p.raum, "status": "geplant",
                "pos_nr": p.pos_nr, "hersteller_artikelnr": p.hersteller_artikelnr, "marke": p.marke, "kategorie": p.kategorie, "lieferant": p.lieferant,
                "preis_cent": p.preis_cent, "ek_cent": p.ek_cent, "lieferstatus": "offen",
            })
            paare.append((p, zeile))
        if paare:
            projekt.save()
            for p, zeile in paare:
                frappe.db.set_value("PH Planung Position", p.name, "projekt_zeile", zeile.name, update_modified=False)
        return len(paare)

    # ── Änderungsabgleich Re-Import (S1, Nr. 15) ────────────────────────────

    def _neue_positionen(self, datei, format, mapping_json):
        try:
            return kuechenplanung.vorschau(format, self._datei_inhalt(datei), mapping_json, limit=100000)
        except kuechenplanung.ImportFehler as e:
            frappe.throw(str(e))

    @frappe.whitelist()
    def import_abgleich_vorschau(self, datei=None, format="csv", mapping_json=None):
        """Re-Import gegen vorhandene Positionen (Schlüssel Pos.-Nr. + Artikel-/Typnr.) → neu/geändert/entfallen."""
        self.check_permission("read")
        erg = self._neue_positionen(datei, format, mapping_json)
        abgl = kuechenplanung.abgleich([z.as_dict() for z in self.positionen], erg["positionen"])
        abgl.update(verifiziert=erg["verifiziert"], warnungen=erg["warnungen"], im_projekt=any(z.projekt_zeile for z in self.positionen))
        return abgl

    @frappe.whitelist()
    def import_abgleichen(self, datei=None, format="csv", mapping_json=None, nachtrag_vorschlag=1):
        """Abgleich übernehmen: Planungspositionen ändern/ergänzen, entfallene **stornieren** (nicht löschen).
        Ist die Planung schon ins Projekt übernommen, werden Projektpositionen nicht still geändert:
        nachtrag_vorschlag=1 → PH Nachtrag (Entwurf) mit neu/entfall/aenderung; bestellte Positionen → Aufgabe „Hersteller informieren“.
        nachtrag_vorschlag=0 → nicht bestellte Projektpositionen werden direkt storniert/angepasst."""
        self.check_permission("write")
        if self.status == "Verworfen":
            frappe.throw(_("Verworfene Planungen können nicht abgeglichen werden."))
        erg = self._neue_positionen(datei, format, mapping_json)
        abgl = kuechenplanung.abgleich([z.as_dict() for z in self.positionen], erg["positionen"])
        zeilen = {z.name: z for z in self.positionen}
        feld_map = {"vk_cent": "preis_cent"}
        for g in abgl["geaendert"]:
            z = zeilen[g["name"]]
            for f, (_alt, neu) in g["felder"].items():
                z.set(feld_map.get(f, f), (neu or "")[:140] if f == "ausfuehrung_text" and neu else neu)
        for e in abgl["entfallen"]:
            zeilen[e["name"]].storniert = 1
            zeilen[e["name"]].storno_grund = _("Entfallen laut Re-Import {0}").format(frappe.utils.nowdate())
        for p in abgl["neu"]:
            self.append("positionen", {
                "bezeichnung": p["bezeichnung"], "pos_nr": p["pos_nr"], "hersteller_artikelnr": p["hersteller_artikelnr"], "marke": p["marke"],
                "kategorie": p["kategorie"], "breite_mm": p["breite_mm"], "hoehe_mm": p["hoehe_mm"], "tiefe_mm": p["tiefe_mm"],
                "ausfuehrung_text": (p["ausfuehrung_text"] or "")[:140], "menge": p["menge"], "raum": p["raum"], "preis_cent": p["vk_cent"], "ek_cent": p["ek_cent"],
            })
        self.abgleich_protokoll = _("{0}: {1} neu, {2} geändert, {3} storniert, {4} unverändert ({5}).").format(
            frappe.utils.format_datetime(frappe.utils.now_datetime()), len(abgl["neu"]), len(abgl["geaendert"]), len(abgl["entfallen"]), abgl["unveraendert"], erg["format"])
        self.save()
        folgen = self._abgleich_ins_projekt(abgl, int(nachtrag_vorschlag or 0))
        return {**{k: (len(v) if isinstance(v, list) else v) for k, v in abgl.items()}, **folgen}

    def _abgleich_ins_projekt(self, abgl, nachtrag_vorschlag):
        betroffen = [g for g in abgl["geaendert"] if g.get("projekt_zeile")] + [e for e in abgl["entfallen"] if e.get("projekt_zeile")]
        im_projekt = any(z.projekt_zeile for z in self.positionen)
        out = {"nachtrag": None, "aufgabe": None, "direkt": 0}
        if not im_projekt or not (betroffen or abgl["neu"]):
            return out
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        pz = {z.name: z for z in projekt.positionen}
        bestellt = [b for b in betroffen if b.get("bestellt") or (pz.get(b["projekt_zeile"]) and kuechenplanung.ist_bestellt(pz[b["projekt_zeile"]].as_dict()))]
        if nachtrag_vorschlag:
            zeilen = []
            for e in abgl["entfallen"]:
                z = pz.get(e.get("projekt_zeile"))
                if z and z.lieferstatus != "storniert":
                    zeilen.append({"art": "entfall", "bezug_zeile": z.name, "raum": z.raum, "bezeichnung": z.bezeichnung, "menge": z.menge or 1, "einzel_cent": abs(int(z.preis_cent or 0))})
            for g in abgl["geaendert"]:
                z = pz.get(g.get("projekt_zeile"))
                if not z:
                    continue
                neu = g["neu"]
                alt_summe = int(z.preis_cent or 0) * max(int(z.menge or 1), 1)
                neu_summe = int(neu["vk_cent"] if neu["vk_cent"] is not None else (z.preis_cent or 0)) * max(int(neu["menge"] or 1), 1)
                text = ", ".join(f"{f}: {a} → {n}" for f, (a, n) in g["felder"].items())[:140]
                zeilen.append({"art": "aenderung", "bezug_zeile": z.name, "raum": z.raum, "bezeichnung": f"{z.bezeichnung}: {text}"[:140], "menge": 1, "einzel_cent": neu_summe - alt_summe, "ausfuehrung_text": neu.get("ausfuehrung_text") or z.ausfuehrung_text})
            for n in abgl["neu"]:
                zeilen.append({"art": "neu", "raum": n["raum"], "bezeichnung": n["bezeichnung"], "menge": n["menge"], "einzel_cent": abs(int(n["vk_cent"] or 0)), "ausfuehrung_text": n["ausfuehrung_text"], "ek_cent": n["ek_cent"]})
            if zeilen:
                nt = frappe.get_doc({"doctype": "PH Nachtrag", "projekt": self.projekt, "bezeichnung": _("Planungsänderung {0} V{1}").format(self.bezeichnung, self.version)[:140], "grund": "Planungsaenderung", "positionen": zeilen, "quelle": "system"}).insert()
                out["nachtrag"] = nt.name
        else:
            for e in abgl["entfallen"]:
                z = pz.get(e.get("projekt_zeile"))
                if z and not kuechenplanung.ist_bestellt(z.as_dict()):
                    z.lieferstatus = "storniert"
                    out["direkt"] += 1
            for g in abgl["geaendert"]:
                z = pz.get(g.get("projekt_zeile"))
                if z and not kuechenplanung.ist_bestellt(z.as_dict()):
                    for f, (_a, n) in g["felder"].items():
                        z.set({"vk_cent": "preis_cent"}.get(f, f), n)
                    out["direkt"] += 1
            if out["direkt"]:
                projekt.save()
            if abgl["neu"]:
                self.positionen_ins_projekt()
        if bestellt:
            text = "\n".join(f"– {b.get('bezeichnung') or (pz.get(b['projekt_zeile']).bezeichnung if pz.get(b['projekt_zeile']) else '')}: {'entfällt' if b in abgl['entfallen'] else 'geändert'} (HB {pz[b['projekt_zeile']].herstellerbestellung if pz.get(b['projekt_zeile']) else ''})" for b in bestellt)
            auf = frappe.get_doc({
                "doctype": "PH Projekt Aufgabe", "projekt": self.projekt, "titel": _("Planungsänderung an bestellten Positionen – Hersteller informieren/stornieren")[:140],
                "art": "Bestellung", "prioritaet": "Hoch", "faellig": frappe.utils.nowdate(), "zugewiesen_an": projekt.berater or projekt.planer or "Administrator",
                "referenz_doctype": "PH Planung", "referenz_name": self.name, "beschreibung": text, "abrechenbar": 0,
            }).insert(ignore_permissions=True)
            out["aufgabe"] = auf.name
        return out

