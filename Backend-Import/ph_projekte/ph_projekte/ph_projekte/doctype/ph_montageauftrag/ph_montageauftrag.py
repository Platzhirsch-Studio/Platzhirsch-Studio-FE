"""PH Montageauftrag – Montageeinsatz mit Team, Leistungen, Fotos vorher/nachher, Bericht, Unterschrift.

Status setzt der Workflow „PH Montageauftrag“ (Geplant → Unterwegs → In Arbeit → Erledigt → Abgenommen;
Abgebrochen). Die mobile Nutzung (Unterschrift, Fotos) läuft über die Dokument-Methoden unten.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime

from ph_projekte.ph_projekte.helfer import projekt_kontakt
from ph_projekte.utils.maengel import ist_erledigt
from ph_projekte.utils import montageplan as mp
from ph_projekte.utils.montageplan import kollisionen, kollisionstext

ARBEIT = ("Unterwegs", "In Arbeit")


class PHMontageauftrag(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Geplant"

    def validate(self):
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        if self.ende and get_datetime(self.ende) < get_datetime(self.start):
            frappe.throw(_("Ende liegt vor dem Beginn."))
        if self.status == "Abgebrochen" and not (self.abbruch_grund or "").strip():
            frappe.throw(_("Bitte den Grund des Abbruchs angeben."))
        if self.status == "Abgenommen" and not self.unterschrift_kunde:
            frappe.throw(_("Abnahme ohne Unterschrift des Kunden ist nicht möglich."))
        self.stunden_geplant = sum(float(z.dauer_h_geplant or 0) for z in self.leistungen)
        self.stunden_ist = sum(float(z.dauer_h_ist or 0) for z in self.leistungen) or sum(float(z.stunden_ist or 0) for z in self.team)
        if self.unterschrift_kunde and not self.unterschrift_am:
            self.unterschrift_am = now_datetime()
        vorher = self.get_doc_before_save()
        if vorher and vorher.status != self.status:
            if self.status == "In Arbeit" and not self.tatsaechlich_start:
                self.tatsaechlich_start = now_datetime()
            if self.status in ("Erledigt", "Abgenommen") and not self.tatsaechlich_ende:
                self.tatsaechlich_ende = now_datetime()
            if self.status == "Abgenommen" and not self.abgenommen_am:
                self.abgenommen_am = now_datetime()
        if self.fahrzeug:
            self.fahrzeug = self.fahrzeug.strip().upper()
        self._kollisionen_pruefen()
        self._ware_pruefen(vorher)
        projekt_titel = frappe.db.get_value("PH Projekt", self.projekt, "titel") or self.projekt
        self.titel = f"Montage {frappe.utils.formatdate(get_datetime(self.start).date(), 'dd.MM.yyyy')}: {projekt_titel}"[:140]

    def _kollisionen_pruefen(self):
        """Warnung (kein Fehler) bei Doppelbelegung von Monteuren/Fahrzeug – Monteure, Abwesenheiten, Touren."""
        if self.status in ("Abgebrochen", "Abgenommen", "Erledigt") or not self.start:
            self.kollisionen = ""
            return
        monteure = [z.user for z in self.team if z.user] + ([self.montageleiter] if self.montageleiter else [])
        treffer = kollisionen(
            {"name": self.name, "art": "Montageauftrag", "start": self.start, "ende": self.ende, "stunden": self.stunden_geplant, "monteure": monteure, "fahrzeug": self.fahrzeug},
            belegungen(self.start, self.ende or self.start, ausser=self.name),
        )
        texte = [kollisionstext(k) for k in treffer]
        fehlend = mp.fehlende_qualifikationen([q.qualifikation for q in self.qualifikationen], monteure, quali_map())
        if fehlend:
            texte.append(_("Fehlende Qualifikation im Team: {0}").format(", ".join(_(q) for q in fehlend)))
        self.kollisionen = "\n".join(texte)[:2000]
        if texte:
            frappe.msgprint("<br>".join(frappe.utils.escape_html(t) for t in texte[:10]), title=_("Montageplanung prüfen"), indicator="orange")

    def _ware_pruefen(self, vorher):
        """Montage an „Ware komplett“ koppeln: Hinweis immer, Sperre beim Start nur mit Einstellung."""
        if not self.projekt:
            return
        komplett, fehlt = frappe.db.get_value("PH Projekt", self.projekt, ["ware_komplett", "ware_fehlend"]) or (0, "")
        self.ware_hinweis = "" if komplett else (_("Ware noch nicht komplett:") + "\n" + (fehlt or _("keine bestellpflichtigen Positionen erfasst")))[:2000]
        startet = self.status in ARBEIT and (not vorher or vorher.status not in ARBEIT)
        if startet and not komplett and frappe.db.get_single_value("PH Projekte Einstellungen", "montage_nur_bei_ware_komplett"):
            frappe.throw(_("Montage erst starten, wenn die Ware komplett ist (PH Projekte Einstellungen).") + "<br>" + frappe.utils.escape_html(fehlt or ""))

    def _verschiebung_melden(self):
        vorher = self.get_doc_before_save()
        if not vorher or self.status != "Geplant" or not mp.verschiebung_relevant(vorher.start, self.start):
            return
        p = frappe.db.get_value("PH Projekt", self.projekt, ["titel", "kontakt", "berater", "planer", "montageleiter"], as_dict=True) or {}
        sprache = (frappe.db.get_value("PH Kontakt", p.get("kontakt"), "sprache") if p.get("kontakt") else None) or "de"
        text = mp.kundentext_verschiebung(p.get("titel") or self.projekt, vorher.start, self.start, sprache)
        if frappe.db.get_single_value("PH Projekte Einstellungen", "montage_verschiebung_kunde_automatisch") and p.get("kontakt"):
            frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": p["kontakt"], "projekt": self.projekt, "richtung": "ausgehend", "text": text, "quelle": "system"}).insert(ignore_permissions=True)
        else:
            frappe.get_doc({
                "doctype": "PH Projekt Aufgabe", "projekt": self.projekt, "titel": _("Montage verschoben – Kunde informieren ({0})").format(self.name)[:140],
                "art": "Montage", "prioritaet": "Hoch", "faellig": frappe.utils.nowdate(), "zugewiesen_an": p.get("berater") or p.get("montageleiter") or p.get("planer") or "Administrator",
                "referenz_doctype": self.doctype, "referenz_name": self.name, "beschreibung": text, "abrechenbar": 0,
            }).insert(ignore_permissions=True)
        self.add_comment("Info", _("Montage verschoben: {0} → {1}").format(vorher.start, self.start))

    def on_update(self):
        try:
            self._verschiebung_melden()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Montageauftrag {self.name}: Verschiebung melden")
        # Projekt-Montagezeitraum nachführen (nie werfen).
        try:
            if self.projekt and self.status != "Abgebrochen":
                tag = get_datetime(self.start).date()
                p = frappe.db.get_value("PH Projekt", self.projekt, ["montage_von", "montage_bis"], as_dict=True)
                werte = {}
                if not p.montage_von or tag < p.montage_von:
                    werte["montage_von"] = tag
                if not p.montage_bis or tag > p.montage_bis:
                    werte["montage_bis"] = tag
                if werte:
                    frappe.db.set_value("PH Projekt", self.projekt, werte, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Montageauftrag: Projekt-Termine fehlgeschlagen")

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def abnahme_anlegen(self):
        """Button „Abnahme anlegen“: PH Abnahme zum Projekt mit Bezug auf diesen Montageauftrag; offene Mängel dieses
        Auftrags werden als Positionen „Mangel“ ergänzt. Delegiert an PH Projekt.abnahme_anlegen."""
        self.check_permission("write")
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        name = projekt.abnahme_anlegen(montageauftrag=self.name)
        try:
            abn = frappe.get_doc("PH Abnahme", name)
            vorhandene = {p.bezeichnung for p in abn.positionen}
            geaendert = False
            for m in self.maengel or []:
                if ist_erledigt(m.get("status"), m.get("behoben_am")):  # Optionen sind klein („behoben“)
                    continue
                bez = (m.get("beschreibung") or _("Mangel"))[:140]
                if bez not in vorhandene:
                    abn.append("positionen", {"bezeichnung": bez, "zustand": "Mangel", "beschreibung": m.get("beschreibung"), "foto": m.get("foto"), "frist": m.get("frist"), "verantwortlich": m.get("verantwortlich"), "verantwortlich_ref": m.get("verantwortlich_ref")})
                    geaendert = True
            if geaendert:
                abn.save()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Montageauftrag {self.name}: Mängel in Abnahme übernehmen")
        return name

    def _projekt_positionen(self):
        return [z.as_dict() for z in frappe.get_doc("PH Projekt", self.projekt).positionen] if self.projekt else []

    @frappe.whitelist()
    def montagezeit_vorschlagen(self, uebernehmen=0):
        """Montagezeit aus Projektpositionen × Richtwerten (PH Projekte Einstellungen). uebernehmen=1 legt eine Leistung
        „Montage laut Richtwert“ an, wenn noch keine Leistung geplante Stunden hat."""
        self.check_permission("write")
        e = frappe.get_single("PH Projekte Einstellungen")
        r = mp.montagezeit(self._projekt_positionen(), [z.as_dict() for z in e.get("montage_richtwerte") or []], e.get("montage_standard_min") or 0, e.get("montage_grundzeit_min") or 0)
        self.db_set("stunden_vorschlag", r["stunden"])
        if int(uebernehmen or 0) and not any(float(z.dauer_h_geplant or 0) for z in self.leistungen):
            self.append("leistungen", {"beschreibung": _("Montage laut Richtwert"), "dauer_h_geplant": r["stunden"]})
            self.save()
        return r

    @frappe.whitelist()
    def qualifikationen_vorschlagen(self, uebernehmen=1):
        """Benötigte Qualifikationen aus Projektart, Aufmaß-Anschlüssen und Positionskategorien."""
        self.check_permission("write")
        art = frappe.db.get_value("PH Projekt", self.projekt, "projektart")
        anschluesse = [a.art for a in frappe.get_all("PH Aufmass Anschluss", filters={"parenttype": "PH Aufmass", "parent": ("in", frappe.get_all("PH Aufmass", filters={"projekt": self.projekt}, pluck="name") or [""])}, fields=["art"])]
        kategorien = [f"{z.get('kategorie') or ''} {z.get('bezeichnung') or ''}" for z in self._projekt_positionen()]
        vorschlag = mp.qualifikationen_vorschlagen(art, anschluesse, kategorien)
        if int(uebernehmen or 0):
            vorhanden = {q.qualifikation for q in self.qualifikationen}
            for q in vorschlag:
                if q not in vorhanden:
                    self.append("qualifikationen", {"qualifikation": q})
            self.save()
        return {"vorschlag": vorschlag, "geeignet": mp.geeignete_monteure(vorschlag, quali_map())}

    @frappe.whitelist()
    def geraete_aus_stueckliste(self):
        """E-Geräte aus den Projektpositionen ins Montageprotokoll (E-Nummer = Artikel-/Typnr.); Seriennummer vor Ort."""
        self.check_permission("write")
        vorhanden = {g.projekt_zeile for g in self.geraete}
        n = 0
        for z in self._projekt_positionen():
            if z.get("lieferstatus") == "storniert" or z.get("name") in vorhanden or not mp.ist_geraet(z):
                continue
            self.append("geraete", {"bezeichnung": z.get("bezeichnung"), "marke": z.get("marke"), "e_nummer": z.get("hersteller_artikelnr"), "projekt_zeile": z.get("name")})
            n += 1
        if n:
            self.save()
        return n

    @frappe.whitelist()
    def unterschrift_erfassen(self, unterschrift, name_kunde=None, monteur=None):
        """Mobil: Signature-Daten (data:image/png;base64,…) speichern."""
        self.check_permission("write")
        if not unterschrift or not str(unterschrift).startswith("data:image"):
            frappe.throw(_("Keine gültige Unterschrift."))
        werte = {"unterschrift_kunde": unterschrift, "unterschrift_am": now_datetime()}
        if name_kunde:
            werte["unterschrift_name"] = name_kunde[:140]
        if monteur:
            werte["unterschrift_monteur"] = monteur
        self.db_set(werte)
        return "ok"

    @frappe.whitelist()
    def foto_hinzufuegen(self, bild, art="nachher", hinweis=None, kunde_sichtbar=0):
        self.check_permission("write")
        self.append("fotos", {"art": art, "bild": bild, "hinweis": hinweis, "aufgenommen_am": now_datetime(), "kunde_sichtbar": int(kunde_sichtbar or 0)})
        self.save()
        return len(self.fotos)

    @frappe.whitelist()
    def mangel_an_service(self, zeile):
        """Button „Mängel → Servicefall“: legt PH Servicefall an, wenn ph_service installiert ist."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Servicefall"):
            frappe.throw(_("DocType PH Servicefall ist noch nicht installiert (Arbeitspaket ph_service)."))
        m = next((x for x in self.maengel if x.name == zeile), None)
        if not m:
            frappe.throw(_("Mangelzeile nicht gefunden."))
        if m.servicefall_ref:
            return m.servicefall_ref
        sf = frappe.get_doc({"doctype": "PH Servicefall", "kontakt": self.kontakt, "projekt": self.projekt, "beschreibung": m.beschreibung, "quelle": "montage"})
        sf.flags.ignore_mandatory = True
        sf.insert()
        frappe.db.set_value("PH Montage Mangel", m.name, "servicefall_ref", sf.name, update_modified=False)
        return sf.name

    @frappe.whitelist()
    def bericht_als_dokument(self, print_format="PH Montagebericht"):
        """Bericht-PDF in die Auftragsmappe (PH Projekt Dokument, Kategorie Montagebericht) legen."""
        self.check_permission("write")
        from ph_projekte.ph_projekte.doctype.ph_projekt_dokument.ph_projekt_dokument import dokument_aus_beleg

        pdf = frappe.get_print(self.doctype, self.name, print_format, as_pdf=True)
        datei = frappe.get_doc({"doctype": "File", "file_name": f"{self.name}-Montagebericht.pdf", "is_private": 1, "content": pdf, "attached_to_doctype": self.doctype, "attached_to_name": self.name}).insert(ignore_permissions=True)
        dok = dokument_aus_beleg(self.projekt, f"Montagebericht {self.name}", "Montagebericht", datei.file_url, self.doctype, self.name, kunde_sichtbar=1)
        return dok.name

    @frappe.whitelist()
    def zeit_buchen(self, user, dauer_min, taetigkeit="Montage", beschreibung=None):
        self.check_permission("write")
        z = frappe.get_doc(
            {
                "doctype": "PH Projektzeit",
                "projekt": self.projekt,
                "montageauftrag": self.name,
                "user": user,
                "datum": get_datetime(self.start).date(),
                "dauer_min": int(dauer_min),
                "taetigkeit": taetigkeit,
                "beschreibung": beschreibung,
            }
        ).insert()
        return z.name


def offene_maengel_anzahl():
    return frappe.db.count("PH Montage Mangel", {"status": ("!=", "behoben"), "parenttype": "PH Montageauftrag"})


def quali_map():
    """{user: {Qualifikationen}} aus PH Projekte Einstellungen.monteur_qualifikationen."""
    zeilen = frappe.get_all("PH Montage Qualifikation", filters={"parenttype": "PH Projekte Einstellungen", "parentfield": "monteur_qualifikationen"}, fields=["user", "qualifikation"])
    return mp.qualifikationen_je_monteur(zeilen)


def belegungen(von, bis, ausser=None):
    """Alle Belegungen im Zeitraum (± 1 Tag): Montageaufträge, Fremdgewerk-Termine sind keine Monteur-Ressource,
    Abwesenheiten (ph_personal) und Touren (ph_logistik) nur, wenn installiert. → Liste für utils.montageplan.kollisionen."""
    from frappe.utils import add_days, getdate

    a, b = add_days(getdate(von), -1), add_days(getdate(bis), 1)
    out = []
    for m in frappe.get_all("PH Montageauftrag", filters={"status": ("not in", ("Abgebrochen",)), "start": ("between", [a, b]), "name": ("!=", ausser or "")}, fields=["name", "titel", "start", "ende", "stunden_geplant", "montageleiter", "fahrzeug"]):
        team = [t.user for t in frappe.get_all("PH Montage Team", filters={"parent": m.name, "parenttype": "PH Montageauftrag"}, fields=["user"])]
        benoetigt = [q.qualifikation for q in frappe.get_all("PH Montage Qualifikation", filters={"parent": m.name, "parenttype": "PH Montageauftrag"}, fields=["qualifikation"])]
        out.append({"art": "Montageauftrag", "name": m.name, "titel": m.titel, "start": m.start, "ende": m.ende, "stunden": m.stunden_geplant, "monteure": team + ([m.montageleiter] if m.montageleiter else []), "fahrzeug": m.fahrzeug, "qualifikationen": benoetigt})
    if frappe.db.exists("DocType", "PH Abwesenheit") and frappe.db.exists("DocType", "PH Mitarbeiter"):
        try:
            for x in frappe.get_all("PH Abwesenheit", filters={"status": ("in", ("Genehmigt", "Beantragt")), "von": ("<=", b), "bis": (">=", a)}, fields=["name", "von", "bis", "mitarbeiter", "art"]):
                user = frappe.db.get_value("PH Mitarbeiter", x.mitarbeiter, "user")
                if user:
                    out.append({"art": "Abwesenheit", "name": x.name, "titel": x.art or _("Abwesenheit"), "start": x.von, "ende": getdate(x.bis), "monteure": [user]})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Montageauftrag: Abwesenheiten lesen")
    if frappe.db.exists("DocType", "PH Tour"):
        try:
            for t in frappe.get_all("PH Tour", filters={"status": ("not in", ("Abgebrochen",)), "datum": ("between", [a, b])}, fields=["name", "titel", "datum", "fahrzeug", "fahrer"]):
                out.append({"art": "Tour", "name": t.name, "titel": t.titel, "start": t.datum, "ende": getdate(t.datum), "monteure": [t.fahrer] if t.fahrer else [], "fahrzeug": t.fahrzeug})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Montageauftrag: Touren lesen")
    return out
