"""PH Projekt – die digitale Auftragsmappe (Controller).

validate(): Titel/Kundenname, Phasenverlauf, Abbruchgrund, Terminlogik.
Buttons (ph_projekt.js): Montageauftrag anlegen, Abnahme anlegen, Produktpässe erzeugen,
Portal-Status senden, Auftragsmappe öffnen (Page), Summen aktualisieren.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime

from ph_projekte.ph_projekte.helfer import kunden_name, phase_protokollieren, portal_url
from ph_projekte.utils import kalkulation as kalk
from ph_projekte.utils import lieferung as lief
from ph_projekte.utils.portal import PHASEN

OFFEN = tuple(p for p in PHASEN if p not in ("Abgeschlossen", "Abgebrochen"))


class PHProjekt(Document):
    def before_insert(self):
        if not self.eingang:
            self.eingang = now_datetime()
        if not self.status:
            self.status = "Anfrage"
        if not self.planer:
            from ph_projekte.utils.portal_sitzung import planer_standard

            self.planer = planer_standard(frappe.session.user, frappe.get_roles())

    def validate(self):
        self.titel = (self.titel or "").strip() or f"{self.projektart} {kunden_name(self.kontakt)}".strip()
        self.kunde_name = kunden_name(self.kontakt)
        if self.montage_von and self.montage_bis and getdate(self.montage_bis) < getdate(self.montage_von):
            frappe.throw(_("Montage bis liegt vor Montage von."))
        if self.status == "Abgebrochen" and not (self.abgebrochen_grund or "").strip():
            frappe.throw(_("Bitte den Grund des Abbruchs angeben."))
        vorher = self.get_doc_before_save()
        if self.is_new() or (vorher and vorher.status != self.status):
            phase_protokollieren(self, self.status)
            if self.status == "Abgeschlossen" and not self.abgeschlossen_am:
                self.abgeschlossen_am = now_datetime().date()
            if self.status == "Uebergabe" and not self.uebergabe_am:
                self.uebergabe_am = now_datetime().date()
        if self.phasen_verlauf is None:
            self.phasen_verlauf = []
        self._lieferstatus_ableiten()
        from ph_projekte.ph_projekte.lieferung import ware_status_werte

        vorher_komplett = int(self.ware_komplett or 0)
        self.update(ware_status_werte(self))
        if self.ware_komplett and not vorher_komplett and not self.is_new():
            self.add_comment("Info", _("Ware komplett – Montage kann terminiert werden."))
        self._kalkulation_validieren(vorher)

    # Projektnachkalkulation (ph_projekte/ph_projekte/nachkalkulation.py, utils/kalkulation.py v2)
    KALK_PROTOKOLL_FELDER = ("kalk_abweichung_aktiv", "kalk_ziel_db1", "kalk_ziel_db2", "kalk_ziel_db3", "kalk_gemeinkosten_art", "kalk_gemeinkosten_prozent", "kalk_gemeinkosten_je_h_cent")

    def _kalkulation_validieren(self, vorher):
        from ph_projekte.ph_projekte import nachkalkulation as nk

        if not self.meta.has_field("kalk_budget"):
            return
        if self.kalk_abweichung_aktiv and not (self.kalk_abweichung_begruendung or "").strip():
            frappe.throw(_("Abweichende Kalkulationsparameter brauchen eine Begründung."))
        for b in self.kalk_budget or []:
            if b.prognose_manuell and not (b.prognose_begruendung or "").strip():
                frappe.throw(_("Budget {0}: manuelle Restkosten brauchen eine Begründung.").format(b.kostenart))
        if vorher and vorher.get("kalk_budget_eingefroren_am") and not self.flags.ph_system:
            alt = {b.kostenart: cint(b.budget_auftrag_cent) for b in vorher.get("kalk_budget") or []}
            for b in self.kalk_budget or []:
                if b.kostenart in alt and cint(b.budget_auftrag_cent) != alt[b.kostenart]:
                    frappe.throw(_("Budget bei Auftrag ({0}) ist eingefroren – bitte „Anpassung Leitung“ verwenden.").format(b.kostenart))
                if b.kostenart not in alt and cint(b.budget_auftrag_cent):
                    b.anpassung_cent, b.budget_auftrag_cent = cint(b.anpassung_cent) + cint(b.budget_auftrag_cent), 0
            self.kalk_budget_eingefroren_am = vorher.kalk_budget_eingefroren_am
        nk.budget_aktualisieren(self)
        # Protokoll (wer, wann, alt → neu) für Abweichungen und Budget – geschrieben in on_update
        prot = []
        if vorher:
            for f in self.KALK_PROTOKOLL_FELDER:
                if str(vorher.get(f) or "") != str(self.get(f) or ""):
                    prot.append(("Projekt", f, vorher.get(f), self.get(f), self.kalk_abweichung_begruendung))

            def budget(d):
                return {b.kostenart: [cint(b.budget_auftrag_cent), cint(b.anpassung_cent), cint(b.prognose_rest_cent) if b.prognose_manuell else None] for b in d.get("kalk_budget") or []}

            if budget(vorher) != budget(self):
                prot.append(("Budget", "kalk_budget", budget(vorher), budget(self), "; ".join(b.prognose_begruendung for b in self.kalk_budget if b.prognose_begruendung)[:500] or None))
            if not vorher.get("kalk_budget_eingefroren_am") and self.kalk_budget_eingefroren_am:
                prot.append(("Budget", "kalk_budget_eingefroren_am", None, str(self.kalk_budget_eingefroren_am), _("Budget bei Auftrag eingefroren")))
        self.flags.kalk_protokoll = prot

    def _lieferstatus_ableiten(self):
        """Lieferstatus je Position aus den Mengen (manuell gesetztes „storniert“ bleibt)."""
        for pos in self.positionen:
            if (pos.lieferstatus or "offen") == "storniert":
                continue
            if int(pos.menge_montiert or 0) > int(pos.menge or 1) or int(pos.menge_geliefert or 0) > max(int(pos.menge or 1), int(pos.menge_bestellt or 0)):
                frappe.throw(_("Position {0}: geliefert/montiert ist größer als die Menge.").format(pos.idx))
            neu = lief.lieferstatus(pos.menge, pos.menge_bestellt, pos.menge_geliefert, pos.menge_montiert, bestaetigt=pos.lieferstatus == "bestaetigt")
            if neu != "offen" or pos.lieferstatus in (None, "", "offen"):
                pos.lieferstatus = neu
            if pos.lieferstatus in lief.STATUS_AUS_LIEFERSTATUS and pos.status != "montiert":
                pos.status = lief.STATUS_AUS_LIEFERSTATUS[pos.lieferstatus]

    def on_update(self):
        if self.flags.kalk_protokoll:
            from ph_projekte.ph_projekte.nachkalkulation import protokoll

            for bereich, feld, alt, neu, grund in self.flags.kalk_protokoll:
                protokoll(bereich, "PH Projekt", self.name, feld, alt, neu, grund, projekt=self.name)
            self.flags.kalk_protokoll = None
        if self.status == "Auftrag" and self.has_value_changed("status") and not self.flags.ph_budget_lauf:
            # Budget bei Auftrag vorbelegen + einfrieren (eigener Speicherlauf, damit permlevel-1-Felder auch bei
            # Statuswechsel durch Mitarbeiter gesetzt werden); nie werfen
            try:
                from ph_projekte.ph_projekte import nachkalkulation as nk

                if nk.einstellungen_daten()["budget_vorbelegen"] and not frappe.db.get_value("PH Projekt", self.name, "kalk_budget_eingefroren_am"):
                    p = frappe.get_doc("PH Projekt", self.name)
                    nk.budget_einfrieren(p)
                    p.flags.ignore_permissions = True
                    p.flags.ph_budget_lauf = True
                    p.save()
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Projekt {self.name}: Budget bei Auftrag")
        if self.status == "Abgeschlossen" and self.has_value_changed("status"):
            try:
                from ph_projekte.ph_projekte.nachkalkulation import nachkalkulation_erstellen

                nachkalkulation_erstellen(self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Projekt {self.name}: Nachkalkulation bei Abschluss")
        try:
            from ph_projekte.ph_projekte.lieferung import planung_rueckmelden

            planung_rueckmelden(self)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Projekt: Bestellstatus an Planung")
        # Anfrage → Folgedokument spiegeln (PH Anfrage.folgedokument), nie Fehler werfen.
        if self.anfrage and self.has_value_changed("anfrage"):
            try:
                frappe.db.set_value("PH Anfrage", self.anfrage, {"folgedokument_doctype": "PH Projekt", "folgedokument": self.name}, update_modified=False)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Projekt: Anfrage-Verknüpfung fehlgeschlagen")

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def montageauftrag_anlegen(self, start, ende=None, montageleiter=None):
        self.check_permission("write")
        doc = frappe.get_doc(
            {
                "doctype": "PH Montageauftrag",
                "projekt": self.name,
                "start": start,
                "ende": ende,
                "montageleiter": montageleiter or self.montageleiter,
                "strasse": self.objekt_strasse,
                "plz": self.objekt_plz,
                "ort": self.objekt_ort,
                "hinweis_ort": self.objekt_hinweis,
                "kunde_anwesend": self.baustelle_kontakt,
                "telefon_vor_ort": self.baustelle_telefon,
                "leistungen": [
                    {"beschreibung": f"{p.bezeichnung} ({p.marke})" if p.marke else p.bezeichnung, "position": p.name}
                    for p in self.positionen
                    if p.status in ("bestellt", "geliefert")
                ],
            }
        ).insert()
        return doc.name

    @frappe.whitelist()
    def abnahme_anlegen(self, montageauftrag=None):
        self.check_permission("write")
        if self.abnahme and frappe.db.exists("PH Abnahme", self.abnahme):
            return self.abnahme
        doc = frappe.get_doc(
            {
                "doctype": "PH Abnahme",
                "projekt": self.name,
                "montageauftrag": montageauftrag,
                "datum": now_datetime().date(),
                "ort": ", ".join(x for x in (self.objekt_strasse, self.objekt_ort) if x),
                "anwesend_kunde": self.kunde_name,
                "anwesend_studio": frappe.session.user,
                "positionen": [{"bezeichnung": p.bezeichnung, "zustand": "ok"} for p in self.positionen],
            }
        ).insert()
        self.db_set("abnahme", doc.name)
        return doc.name

    @frappe.whitelist()
    def produktpaesse_erzeugen(self, lieferdatum=None):
        """Je Position ohne Produktpass einen PH Produktpass anlegen (Status geliefert/montiert/bestellt).
        Gemeinsame Logik: ph_produktpass.pass_anlegen (auch ph_projekte.api.create_product_passes, ph_logistik)."""
        from ph_projekte.ph_projekte.doctype.ph_produktpass.ph_produktpass import pass_anlegen

        self.check_permission("write")
        neu = []
        for p in self.positionen:
            if p.produktpass or p.status not in ("geliefert", "montiert", "bestellt"):
                continue
            name, ist_neu = pass_anlegen(
                kontakt=self.kontakt, projekt=self.name, position=p.name, produkt=p.produkt, produkt_name=p.bezeichnung,
                marke=p.marke, kategorie=p.kategorie, ausfuehrung_text=p.ausfuehrung_text, lieferdatum=lieferdatum,
            )
            frappe.db.set_value("PH Projekt Position", p.name, "produktpass", name, update_modified=False)
            if ist_neu:
                neu.append(name)
        return neu

    @frappe.whitelist()
    def portal_status_senden(self, text=None):
        """Kurze Statusnachricht an den Kunden (PH Projekt Nachricht, ausgehend) + Mail über ph_core."""
        self.check_permission("write")
        text = (text or "").strip() or _("Ihr Projekt „{0}“ ist jetzt in der Phase „{1}“.").format(self.titel, _(self.status))
        nachricht = frappe.get_doc(
            {"doctype": "PH Projekt Nachricht", "kontakt": self.kontakt, "projekt": self.name, "richtung": "ausgehend", "text": text, "quelle": "backoffice"}
        ).insert()
        email = frappe.db.get_value("PH Kontakt", self.kontakt, "email") if frappe.db.exists("DocType", "PH Kontakt") else None
        if email:
            try:
                from ph_core.utils.mail import sende

                sende(email, _("Neuigkeiten zu Ihrem Projekt {0}").format(self.titel), f"<p>{frappe.utils.escape_html(text)}</p><p><a href=\"{portal_url('projekte/' + self.name)}\">{_('Zum Kundenportal')}</a></p>", referenz_doctype=self.doctype, referenz_name=self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Projekt: Portal-Status-Mail fehlgeschlagen")
        return nachricht.name

    @frappe.whitelist()
    def summen_aktualisieren(self):
        """Auftragswert/bezahlt/offen aus ph_faktura (wenn installiert) und Zeiten aus PH Projektzeit."""
        self.check_permission("write")
        werte = summen(self.name)
        self.db_set(werte, update_modified=False)
        return werte


    # ── Lieferung je Position ───────────────────────────────────────────────

    @frappe.whitelist()
    def herstellerbestellungen_erzeugen(self, positionen=None, wunschtermin=None):
        """Offene Positionen (oder Auswahl `positionen` = Zeilennamen) je Lieferant in PH Herstellerbestellung (Entwurf)
        sammeln – über ph_sortiment.api.bestellungen_sammeln. Nachlieferungen werden als eigene Zeilen bestellt."""
        self.check_permission("write")
        auswahl = set(frappe.parse_json(positionen) or []) if positionen else None
        zeilen = []
        for pos in self.positionen:
            if auswahl is not None and pos.name not in auswahl:
                continue
            if not lief.bestellbar(pos.as_dict()):
                continue
            zeilen.append(lief.bestellzeile(pos.as_dict(), kommission=self.name, wunschtermin=wunschtermin or self.liefertermin_geplant, nachlieferung=bool(pos.nachlieferung_noetig and pos.herstellerbestellung)))
        if not zeilen:
            frappe.throw(_("Keine offenen Positionen zum Bestellen."))
        from ph_sortiment.api import bestellungen_sammeln

        ergebnis = bestellungen_sammeln(zeilen, bezug_doctype="PH Projekt", bezug_name=self.name, kommission=self.name, idempotency_key=None)
        frappe.local.response.pop("http_status_code", None)
        if not isinstance(ergebnis, dict) or "bestellungen" not in ergebnis:
            frappe.throw((ergebnis or {}).get("message") if isinstance(ergebnis, dict) else _("Herstellerbestellungen konnten nicht erzeugt werden."))
        # Positionen bekommen herstellerbestellung/lieferstatus über doc_events (ph_projekte/lieferung.py) per bezug_zeile.
        ohne = set(ergebnis.get("ohne_lieferant") or [])
        for z in zeilen:
            if z["bezug_zeile"] not in ohne:
                frappe.db.set_value("PH Projekt Position", z["bezug_zeile"], "nachlieferung_noetig", 0, update_modified=False)
        self.reload()
        return ergebnis

    @frappe.whitelist()
    def lieferung_buchen(self, zeile, menge, datum=None, montiert=0):
        """Teil-/Restlieferung (oder Montage mit montiert=1) einer Position manuell buchen, z. B. Direktlieferung zum Kunden."""
        self.check_permission("write")
        pos = next((x for x in self.positionen if x.name == zeile), None)
        if not pos:
            frappe.throw(_("Position nicht gefunden."))
        menge = int(menge or 0)
        if menge <= 0:
            frappe.throw(_("Bitte eine Menge größer 0 angeben."))
        if int(montiert or 0):
            pos.menge_montiert = min(int(pos.menge_montiert or 0) + menge, int(pos.menge or 1))
        else:
            pos.menge_geliefert = min(int(pos.menge_geliefert or 0) + menge, int(pos.menge or 1))
            if datum:
                pos.liefertermin = datum
        self.save()
        self.add_comment("Info", _("{0}: {1} Stück {2}").format(pos.bezeichnung, menge, _("montiert") if int(montiert or 0) else _("geliefert")))
        return {"lieferstatus": pos.lieferstatus, "offen": lief.offene_menge(pos.menge, pos.menge_geliefert)}

    @frappe.whitelist()
    def nachlieferung_anlegen(self, zeile, menge, grund, termin=None, bestellen=1):
        """Nachlieferung (fehlend/beschädigt) vormerken und – wenn bestellen=1 – sofort als Herstellerbestellung auslösen."""
        self.check_permission("write")
        pos = next((x for x in self.positionen if x.name == zeile), None)
        if not pos:
            frappe.throw(_("Position nicht gefunden."))
        if not (grund or "").strip():
            frappe.throw(_("Bitte den Grund der Nachlieferung angeben."))
        pos.nachlieferung_noetig = 1
        pos.nachlieferung_menge = max(int(menge or 1), 1)
        pos.nachlieferung_grund = grund[:140]
        pos.nachlieferung_termin = termin
        self.save()
        if int(bestellen or 0) and (pos.lieferant or pos.produkt):
            return self.herstellerbestellungen_erzeugen(positionen=[pos.name])
        return {"vorgemerkt": pos.name}

    @frappe.whitelist()
    def kalkulation(self):
        """Soll/Ist (Einkauf, Verkauf, Montagestunden) – nur Leitung/Geschäftsführung (permlevel 1)."""
        self.check_permission("read")
        if not {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"} & set(frappe.get_roles()):
            frappe.throw(_("Die Kalkulation sieht nur die Leitung."), frappe.PermissionError)
        return kalkulation_daten(self)

    # ── Projektnachkalkulation (v2) ─────────────────────────────────────────

    @frappe.whitelist()
    def kalkulation_v2(self):
        """Budget · Ist · Obligo · Prognose je Kostenart, DB1–DB3(/DB4), Ampel – nur Leitung/GF."""
        from ph_projekte.ph_projekte import nachkalkulation as nk

        self.check_permission("read")
        nk.pruefe_leitung()
        r = nk.berechnen(self)
        nk.cache_schreiben(self.name, r)
        return r

    @frappe.whitelist()
    def budget_vorbelegen(self, ueberschreiben=0):
        from ph_projekte.ph_projekte import nachkalkulation as nk

        self.check_permission("write")
        nk.pruefe_leitung()
        nk.budget_vorbelegen(self, ueberschreiben=cint(ueberschreiben))
        self.save()
        return [b.as_dict() for b in self.kalk_budget]

    @frappe.whitelist()
    def budget_einfrieren(self):
        from ph_projekte.ph_projekte import nachkalkulation as nk

        self.check_permission("write")
        nk.pruefe_leitung()
        if self.kalk_budget_eingefroren_am:
            frappe.throw(_("Budget ist bereits eingefroren."))
        nk.budget_einfrieren(self)
        self.save()
        return str(self.kalk_budget_eingefroren_am)

    @frappe.whitelist()
    def nachkalkulation_anlegen(self):
        """Snapshot PH Projekt Nachkalkulation (sonst automatisch bei „Abgeschlossen“)."""
        from ph_projekte.ph_projekte import nachkalkulation as nk

        self.check_permission("read")
        nk.pruefe_leitung()
        return nk.nachkalkulation_erstellen(self.name, neu_berechnen=1)


def kalkulation_daten(projekt_doc):
    """Daten für utils.kalkulation (auch Report PH Projektkalkulation)."""
    p = projekt_doc
    nachtraege = frappe.get_all("PH Nachtrag", filters={"projekt": p.name, "status": "Freigegeben"}, fields=["name", "differenz_cent", "summe_aenderung_cent"])
    bestellpos = []
    if frappe.db.exists("DocType", "PH Herstellerbestellung"):
        for hb in frappe.get_all("PH Herstellerbestellung", filters={"bezug_doctype": "PH Projekt", "bezug_name": p.name}, fields=["name", "status"]):
            for z in frappe.get_all("PH Herstellerbestellung Position", filters={"parent": hb.name, "parenttype": "PH Herstellerbestellung"}, fields=["menge", "ab_menge", "ek_cent", "ab_ek_cent"]):
                bestellpos.append({**z, "status_hb": hb.status})
    rechnungen = []
    if frappe.db.exists("DocType", "PH Rechnung"):
        try:
            meta = frappe.get_meta("PH Rechnung")
            feld = "netto_cent" if meta.has_field("netto_cent") else ("brutto_cent" if meta.has_field("brutto_cent") else None)
            if feld:
                for r in frappe.get_all("PH Rechnung", filters={"projekt": p.name, "docstatus": 1}, fields=[feld, "art"] if meta.has_field("art") else [feld]):
                    rechnungen.append({"betrag_cent": r.get(feld), "art": r.get("art")})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Projekt: Rechnungen für Kalkulation")
    stunden_soll = float(frappe.db.get_value("PH Montageauftrag", {"projekt": p.name, "status": ("!=", "Abgebrochen")}, "sum(stunden_geplant)") or 0)
    minuten_ist = int(frappe.db.get_value("PH Projektzeit", {"projekt": p.name, "taetigkeit": ("in", ("Montage", "Fahrt"))}, "sum(dauer_min)") or 0)
    satz = int(frappe.db.get_single_value("PH Projekte Einstellungen", "montage_kostensatz_cent") or 0)
    erg = kalk.kalkulation([z.as_dict() for z in p.positionen], nachtraege, bestellpos, rechnungen, stunden_soll, minuten_ist / 60, satz)
    erg["quellen"] = {"herstellerbestellungen": bool(bestellpos), "rechnungen": frappe.db.exists("DocType", "PH Rechnung") is not None, "nachtraege": len(nachtraege)}
    return erg


def summen(projekt):
    """Kennzahlen eines Projekts; ph_faktura ist nicht in required_apps → nur abfragen, wenn vorhanden."""
    w = {"auftragswert_cent": 0, "anzahlung_cent": 0, "bezahlt_cent": 0, "offen_cent": 0, "zeit_min_gesamt": 0}
    w["zeit_min_gesamt"] = int(frappe.db.get_value("PH Projektzeit", {"projekt": projekt}, "sum(dauer_min)") or 0)
    if frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
        try:
            meta = frappe.get_meta("PH Auftragsbestaetigung")
            felder = [f for f in ("auftragswert_cent", "anzahlung_ist_cent", "offen_cent") if meta.has_field(f)]
            for ab in frappe.get_all("PH Auftragsbestaetigung", filters={"projekt": projekt, "docstatus": ("<", 2)}, fields=felder or ["name"]):
                w["auftragswert_cent"] += int(ab.get("auftragswert_cent") or 0)
                w["anzahlung_cent"] += int(ab.get("anzahlung_ist_cent") or 0)
                w["offen_cent"] += int(ab.get("offen_cent") or 0)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Projekt: Summen aus ph_faktura fehlgeschlagen")
    if frappe.db.exists("DocType", "PH Rechnung"):
        try:
            if frappe.get_meta("PH Rechnung").has_field("bezahlt_cent"):
                w["bezahlt_cent"] = int(frappe.db.get_value("PH Rechnung", {"projekt": projekt, "docstatus": 1}, "sum(bezahlt_cent)") or 0)
        except Exception:  # noqa: BLE001
            pass
    return w


def aktive_anzahl():
    return frappe.db.count("PH Projekt", {"status": ("in", OFFEN)})
