"""PH Projekt – die digitale Auftragsmappe (Controller).

validate(): Titel/Kundenname, Phasenverlauf, Abbruchgrund, Terminlogik.
Buttons (ph_projekt.js): Montageauftrag anlegen, Abnahme anlegen, Produktpässe erzeugen,
Portal-Status senden, Auftragsmappe öffnen (Page), Summen aktualisieren.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime

from ph_projekte.ph_projekte.helfer import kunden_name, phase_protokollieren, portal_url
from ph_projekte.utils.portal import PHASEN

OFFEN = tuple(p for p in PHASEN if p not in ("Abgeschlossen", "Abgebrochen"))


class PHProjekt(Document):
    def before_insert(self):
        if not self.eingang:
            self.eingang = now_datetime()
        if not self.status:
            self.status = "Anfrage"

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

    def on_update(self):
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
