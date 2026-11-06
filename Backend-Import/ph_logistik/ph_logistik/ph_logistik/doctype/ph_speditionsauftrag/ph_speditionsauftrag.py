"""PH Speditionsauftrag – Großmöbel per Spedition: Abholung beim Hersteller (→ Lager oder direkt zum Kunden) oder Zustellung Lager → Kunde.

Status: Entwurf → Gesendet (Anfrage per Mail mit PDF) → Bestaetigt (Preis/Termin vom Spediteur) → Abgeholt → Zugestellt; Storniert.
Lademeter/Volumen sind Planungsgrößen (spedition_logik); der Spediteur bestätigt. Keine Spediteurs-Schnittstelle – Mail + PDF.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik import spedition_logik as sl
from ph_logistik.ph_logistik.helfer import absender, einstellungen, mail_senden, setze_status

LEITUNG = {"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"}


class PHSpeditionsauftrag(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"
        if not self.spediteur and einstellungen().get("spediteur_standard"):
            self.spediteur = einstellungen().get("spediteur_standard")

    def validate(self):
        if self.spediteur and not self.spediteur_email:
            self.spediteur_email = frappe.db.get_value("PH Lieferant", self.spediteur, "bestell_email")
        self._adressen_vorbelegen()
        for pre in ("abhol", "ziel"):
            land = self.get(f"{pre}_land")
            if land:
                self.set(f"{pre}_land", str(land).strip().upper()[:2])
        s = sl.summen([p.as_dict() for p in self.packstuecke], int(einstellungen().get("ladebreite_cm") or sl.LADEBREITE_CM))
        self.anzahl_packstuecke, self.gewicht_g, self.volumen_m3, self.lademeter = s["anzahl"], s["gewicht_g"], s["volumen_m3"], s["lademeter"]
        if s["fehlende_masse"]:
            frappe.msgprint(_("{0} Packstück(e) ohne vollständige Maße – Lademeter/Volumen unvollständig.").format(s["fehlende_masse"]), indicator="orange", alert=True)
        ziel = self.ziel_name or self.kunde_name or self.ziel_ort or ""
        self.titel = f"{self.richtung}: {self.abhol_ort or '?'} → {self.ziel_ort or '?'} · {ziel}".strip(" ·")[:140]

    def _adressen_vorbelegen(self):
        """Leere Adressen aus Lieferschein (Ziel) / Herstellerbestellung (Abholung: Lieferant) / Absender (Lager)."""
        lager = absender()
        if self.lieferschein and not self.ziel_plz:
            ls = frappe.db.get_value("PH Lieferschein", self.lieferschein, ["kontakt", "kunde_name", "liefer_name", "liefer_strasse", "liefer_hausnr", "liefer_plz", "liefer_ort", "liefer_land", "liefer_telefon", "projekt", "kommission", "warenwert_cent", "lieferhinweis"], as_dict=True)
            if ls:
                self.update({"kontakt": self.kontakt or ls.kontakt, "kunde_name": self.kunde_name or ls.kunde_name, "ziel_name": ls.liefer_name or ls.kunde_name, "ziel_strasse": f"{ls.liefer_strasse or ''} {ls.liefer_hausnr or ''}".strip(), "ziel_plz": ls.liefer_plz, "ziel_ort": ls.liefer_ort, "ziel_land": ls.liefer_land, "ziel_telefon": ls.liefer_telefon, "projekt": self.projekt or ls.projekt, "kommission": self.kommission or ls.kommission})
                if not self.warenwert_cent:
                    self.warenwert_cent = ls.warenwert_cent
                if ls.lieferhinweis and not self.hinweise:
                    self.hinweise = ls.lieferhinweis
        if self.herstellerbestellung and not self.abhol_plz and self.richtung != "Lager an Kunde":
            lief = frappe.db.get_value("PH Herstellerbestellung", self.herstellerbestellung, ["lieferant", "kommission"], as_dict=True)
            if lief and lief.lieferant:
                a = frappe.db.get_value("PH Lieferant", lief.lieferant, ["firmenname", "strasse", "plz", "ort", "land"], as_dict=True) or {}
                self.update({"abhol_name": a.get("firmenname"), "abhol_strasse": a.get("strasse"), "abhol_plz": a.get("plz"), "abhol_ort": a.get("ort"), "abhol_land": a.get("land") or "AT"})
            if lief and lief.kommission and not self.kommission:
                self.kommission = lief.kommission
        if self.richtung == "Lager an Kunde" and not self.abhol_plz:
            self.update({"abhol_name": lager["firma"], "abhol_strasse": f"{lager['strasse']} {lager['hausnr']}".strip(), "abhol_plz": lager["plz"], "abhol_ort": lager["ort"], "abhol_land": lager["land"], "abhol_telefon": lager["telefon"]})
        if self.richtung == "Hersteller an Lager" and not self.ziel_plz:
            self.update({"ziel_name": lager["firma"], "ziel_strasse": f"{lager['strasse']} {lager['hausnr']}".strip(), "ziel_plz": lager["plz"], "ziel_ort": lager["ort"], "ziel_land": lager["land"], "ziel_telefon": lager["telefon"]})

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def per_email_senden(self, an=None, text=None):
        """Anfrage/Auftrag an den Spediteur: Mail mit PDF „PH Speditionsauftrag Standard“ → Status Gesendet."""
        self.check_permission("write")
        if self.status not in ("Entwurf", "Gesendet"):
            frappe.throw(_("Nur Entwürfe werden gesendet (erneut senden: Status Gesendet)."))
        if an:
            self.spediteur_email = an
        fehler = sl.pruefen(self.as_dict(), [p.as_dict() for p in self.packstuecke])
        if fehler:
            frappe.throw(_("Bitte ergänzen: {0}").format("; ".join(fehler)))
        anhang = [frappe.attach_print(self.doctype, self.name, print_format="PH Speditionsauftrag Standard", file_name=f"Speditionsauftrag-{self.name}")]
        html = f"<p>{_('Sehr geehrte Damen und Herren,')}</p><p>{_('anbei unser Speditionsauftrag {0} ({1}). Bitte bestätigen Sie Termin und Preis mit Ihrer Auftragsnummer.').format(self.name, _(self.richtung))}</p>"
        if text:
            html += f"<p>{frappe.utils.escape_html(text)}</p>"
        html += f"<p>{_('Mit freundlichen Grüßen')}<br>{frappe.utils.escape_html(absender()['firma'])}</p>"
        ok = mail_senden(self.spediteur_email, _("Speditionsauftrag {0}: {1} → {2}").format(self.name, self.abhol_ort, self.ziel_ort), html, self.doctype, self.name, anhaenge=anhang)
        if not ok:
            frappe.throw(_("Mail konnte nicht gesendet werden (Fehlerprotokoll)."))
        self.db_set("spediteur_email", self.spediteur_email)
        setze_status(self, "Gesendet", gesendet_am=now_datetime())
        return self.status

    @frappe.whitelist()
    def bestaetigen(self, preis_cent=None, abhol_datum=None, zustell_datum=None, referenz=None):
        """Bestätigung des Spediteurs erfassen (Preis, Termine, Auftragsnummer)."""
        self.check_permission("write")
        if self.status not in ("Gesendet", "Bestaetigt"):
            frappe.throw(_("Erst senden, dann bestätigen."))
        werte = {"bestaetigt_am": now_datetime()}
        if preis_cent is not None:
            werte["preis_bestaetigt_cent"] = int(preis_cent)
        if abhol_datum:
            werte["abhol_datum"] = abhol_datum
        if zustell_datum:
            werte["zustell_datum"] = zustell_datum
        if referenz:
            werte["spediteur_referenz"] = referenz
        setze_status(self, "Bestaetigt", **werte)
        return self.status

    @frappe.whitelist()
    def abgeholt(self):
        """Ware ist beim Spediteur. Lager → Kunde: gepackter Lieferschein gilt als übergeben (an Spedition)."""
        self.check_permission("write")
        if self.status not in ("Gesendet", "Bestaetigt"):
            frappe.throw(_("Abholung nur nach Senden/Bestätigung."))
        setze_status(self, "Abgeholt", abgeholt_am=now_datetime())
        if self.richtung == "Lager an Kunde" and self.lieferschein:
            ls = frappe.get_doc("PH Lieferschein", self.lieferschein)
            if ls.status == "Gepackt":
                ls.uebergeben(an="Spedition")
        return self.status

    @frappe.whitelist()
    def zugestellt(self, empfaenger_name=None, unterschrift=None):
        """Zustellung quittiert. Kunde: Lieferschein Zugestellt. Lager: Aufgabe „Wareneingang erfassen“ an der Herstellerbestellung."""
        self.check_permission("write")
        if self.status not in ("Bestaetigt", "Abgeholt", "Gesendet"):
            frappe.throw(_("Auftrag ist nicht unterwegs."))
        werte = {"zugestellt_am": now_datetime()}
        if empfaenger_name:
            werte["empfaenger_name"] = empfaenger_name
        if unterschrift:
            werte["unterschrift"] = unterschrift
        setze_status(self, "Zugestellt", **werte)
        if self.richtung != "Hersteller an Lager" and self.lieferschein:
            ls = frappe.get_doc("PH Lieferschein", self.lieferschein)
            if ls.status in ("Gepackt", "Uebergeben"):
                ls.als_zugestellt(empfaenger_name=empfaenger_name, unterschrift=unterschrift)
        if self.richtung == "Hersteller an Lager" and self.herstellerbestellung:
            from ph_logistik.ph_logistik.tasks import _aufgabe

            _aufgabe(f"Spedition {self.name} angeliefert – Wareneingang zu {self.herstellerbestellung} erfassen", "PH Herstellerbestellung", self.herstellerbestellung)
        return self.status

    @frappe.whitelist()
    def stornieren(self, grund):
        self.check_permission("write")
        if self.status in ("Abgeholt", "Zugestellt") and not (LEITUNG & set(frappe.get_roles())):
            frappe.throw(_("Nach der Abholung storniert nur die Leitung."))
        if self.status == "Zugestellt":
            frappe.throw(_("Zugestellte Aufträge werden nicht storniert."))
        setze_status(self, "Storniert", storno_grund=grund)
        return self.status

    @frappe.whitelist()
    def leistungen(self):
        return sl.leistungen_text(self.as_dict())


def aus_lieferschein(lieferschein):
    """Speditionsauftrag Lager → Kunde aus einem Lieferschein; Packstücke aus den Paketen, sonst je Position ein Möbelstück."""
    frappe.has_permission("PH Speditionsauftrag", "create", throw=True)
    vorhanden = frappe.db.get_value("PH Speditionsauftrag", {"lieferschein": lieferschein, "status": ("!=", "Storniert")}, "name")
    if vorhanden:
        return vorhanden
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    doc = frappe.new_doc("PH Speditionsauftrag")
    doc.update({"richtung": "Lager an Kunde", "lieferschein": ls.name, "zustell_datum": ls.wunschtermin})
    if ls.pakete:
        for pk in ls.pakete:
            art = {"Palette": "Palette", "Sperrgut": "Moebel lose"}.get(pk.art or "", "Kolli")
            doc.append("packstuecke", {"art": art, "anzahl": 1, "bezeichnung": pk.inhalt, "laenge_cm": pk.laenge_cm, "breite_cm": pk.breite_cm, "hoehe_cm": pk.hoehe_cm, "gewicht_g": pk.gewicht_g, "zerbrechlich": pk.zerbrechlich, "stapelbar": pk.stapelbar})
            if pk.hubwagen:
                doc.hebebuehne = 1
    else:
        for p in ls.positionen:
            doc.append("packstuecke", {"art": "Moebel lose", "anzahl": int(p.menge or 1), "bezeichnung": " · ".join(x for x in (p.beschreibung, p.bereich) if x), "zerbrechlich": p.zerbrechlich})
    doc.insert()
    return doc.name


def aus_herstellerbestellung(herstellerbestellung, richtung="Hersteller an Lager"):
    """Abholung beim Hersteller (Inbound) zu einer PH Herstellerbestellung (ph_sortiment)."""
    frappe.has_permission("PH Speditionsauftrag", "create", throw=True)
    doc = frappe.new_doc("PH Speditionsauftrag")
    doc.update({"richtung": richtung, "herstellerbestellung": herstellerbestellung})
    for p in frappe.get_all("PH Herstellerbestellung Position", {"parent": herstellerbestellung, "parenttype": "PH Herstellerbestellung"}, ["bezeichnung", "menge"], order_by="idx"):
        doc.append("packstuecke", {"art": "Moebel lose", "anzahl": int(p.menge or 1), "bezeichnung": p.bezeichnung})
    doc.insert()
    return doc.name
