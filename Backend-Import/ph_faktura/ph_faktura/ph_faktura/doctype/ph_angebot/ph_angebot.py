"""PH Angebot – Controller. Status setzt der Workflow „PH Angebot“ (Entwurf → Gesendet → Angenommen/Abgelehnt/Abgelaufen)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, getdate, now_datetime, nowdate

from ph_faktura import einstellungen, versand
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk.anzahlung import zahlungsplan_betraege

GESPERRT = ("Angenommen", "Abgelehnt", "Abgelaufen", "Ersetzt")


class PHAngebot(BelegMixin, Document):
    def onload(self):
        self.set_onload("kontakt_email", self.kontakt_email())

    def before_insert(self):
        self.status = self.status or "Entwurf"
        self.version = self.version or 1

    def validate(self):
        e = einstellungen.faktura()
        self.kontakt_uebernehmen()
        self.produkt_uebernehmen()
        self.positionen_pruefen()
        if not self.gueltig_bis:
            self.gueltig_bis = add_days(self.datum or nowdate(), e["angebot_gueltig_tage"])
        if getdate(self.gueltig_bis) < getdate(self.datum):
            frappe.throw(_("„Gültig bis“ liegt vor dem Angebotsdatum."))
        if not self.zahlungsbedingung and e.get("standard_zahlungsbedingung"):
            self.zahlungsbedingung = e["standard_zahlungsbedingung"]
        if self.zahlungsbedingung and not self.anzahlung_prozent:
            self.anzahlung_prozent = frappe.db.get_value("PH Zahlungsbedingung", self.zahlungsbedingung, "anzahlung_prozent") or 0
        if self.zahlungsbedingung and not self.zahlungstext:
            self.zahlungstext = self.zahlungsbedingung_text()
        self.steuerfall_setzen()
        self.positionen_berechnen()
        if not self.einleitung:
            self.einleitung = e.get("angebot_einleitung")
        if not self.schluss:
            self.schluss = e.get("angebot_schluss")
        self.titel = f"{self.kunde_name or self.kontakt}: {self.kurz()}"[:140]
        self.aenderung_gesperrt_pruefen()

    def aenderung_gesperrt_pruefen(self):
        alt = self.get_doc_before_save()
        if not alt or alt.status not in GESPERRT or self.flags.ph_system:
            return
        for f in ("positionen", "netto_cent", "brutto_cent", "kontakt", "gueltig_bis", "zahlungsbedingung"):
            if str(alt.get(f)) != str(self.get(f)) and f != "positionen":
                frappe.throw(_("Angebot {0} ist {1} und kann nicht mehr geändert werden – bitte „Neue Version“.").format(self.name, _(alt.status)))
        if len(alt.positionen) != len(self.positionen) or any(a.netto_cent != n.netto_cent or a.bezeichnung != n.bezeichnung for a, n in zip(alt.positionen, self.positionen)):
            frappe.throw(_("Positionen eines {0} Angebots sind gesperrt – bitte „Neue Version“.").format(_(alt.status).lower()))

    def status_setzen(self, status, **werte):
        self.db_set({"status": status, "workflow_state": f"PH {status}", **werte}, update_modified=True)

    # ── Buttons ──────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def als_gesendet_markieren(self, kanal="Post"):
        """Versand außerhalb des Systems (Post, persönlich, Portal) dokumentieren (Konzept 10-faktura §12 Nr. 5)."""
        self.check_permission("write")
        self.db_set({"gesendet_am": now_datetime(), "versandkanal": kanal})
        self.add_comment("Info", _("Als gesendet markiert ({0})").format(kanal))
        return True

    @frappe.whitelist()
    def senden(self, empfaenger, betreff=None, nachricht=None):
        """Button „Senden“/„Als PDF senden“: PDF per Mail, Status Gesendet (einmalig)."""
        self.check_permission("write")
        versand.senden(self, empfaenger, betreff, nachricht)
        if self.status == "Entwurf":
            self.status_setzen("Gesendet", gesendet_am=now_datetime())
        return True

    @frappe.whitelist()
    def annehmen(self, unterschrift=None):
        self.check_permission("write")
        if self.status not in ("Entwurf", "Gesendet"):
            frappe.throw(_("Nur Entwürfe oder gesendete Angebote können angenommen werden."))
        werte = {"angenommen_am": now_datetime()}
        if unterschrift:
            werte["unterschrift_kunde"] = unterschrift
        self.status_setzen("Angenommen", **werte)
        return True

    @frappe.whitelist()
    def ablehnen(self, grund=None):
        self.check_permission("write")
        self.status_setzen("Abgelehnt", abgelehnt_grund=grund or "Sonstiges")
        return True

    @frappe.whitelist()
    def auftrag_erstellen(self):
        """Button „Als AB übernehmen“: Auftragsbestätigung aus dem Angebot, Angebot → Angenommen."""
        self.check_permission("write")
        if self.auftragsbestaetigung:
            return self.auftragsbestaetigung
        if self.status in ("Abgelehnt", "Abgelaufen", "Ersetzt"):
            frappe.throw(_("Aus einem {0} Angebot kann keine AB erzeugt werden.").format(_(self.status).lower()))
        if not [p for p in self.positionen if p.art not in ("Text", "Zwischensumme") and not p.alternativ]:
            frappe.throw(_("Das Angebot hat keine Hauptpositionen."))
        ab = frappe.new_doc("PH Auftragsbestaetigung")
        ab.kopf_kopieren(self)
        ab.update(
            {
                "angebot": self.name,
                "datum": nowdate(),
                "zugewiesen_an": self.zugewiesen_an,
                "vertragsort": self.vertragsort,
                "fagg_belehrung_beigelegt": self.fagg_belehrung_beigelegt,
                "zahlungsbedingung": self.zahlungsbedingung,
                "anzahlung_prozent": self.anzahlung_prozent,
                "lieferbedingung_text": self.lieferbedingung_text,
                "einleitung": self.einleitung,
                "schluss": einstellungen.faktura().get("ab_schluss"),
                "quelle": "backoffice",
            }
        )
        ab.positionen_kopieren(self)
        ab.flags.ph_system = True
        ab.insert()
        self.flags.ph_system = True
        self.status_setzen("Angenommen", auftragsbestaetigung=ab.name, angenommen_am=self.angenommen_am or now_datetime())
        self.add_comment("Info", _("Auftragsbestätigung {0} erzeugt").format(ab.name))
        return ab.name

    @frappe.whitelist()
    def neue_version(self):
        """Button „Neue Version“: Kopie als Entwurf, dieses Angebot → Ersetzt."""
        self.check_permission("write")
        neu = frappe.copy_doc(self)
        neu.status = "Entwurf"
        neu.workflow_state = "PH Entwurf"
        neu.version = (self.version or 1) + 1
        neu.vorgaenger = self.name
        neu.datum = nowdate()
        neu.gueltig_bis = None
        for f in ("gesendet_am", "angenommen_am", "abgelehnt_grund", "unterschrift_kunde", "auftragsbestaetigung", "nachfolger", "pdf", "idempotency_key"):
            neu.set(f, None)
        neu.insert()
        self.flags.ph_system = True
        if self.status != "Angenommen":
            self.status_setzen("Ersetzt", nachfolger=neu.name)
        else:
            self.db_set("nachfolger", neu.name)
        return neu.name

    @frappe.whitelist()
    def anzahlungslink(self, betrag_cent=None):
        """Button „Anzahlungslink“: PH Anzahlung (ph_shop) für Stripe-Zahlungslink."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Anzahlung"):
            frappe.throw(_("DocType PH Anzahlung (ph_shop) ist noch nicht installiert."))
        betrag = int(betrag_cent or 0) or int(self.brutto_cent * (self.anzahlung_prozent or 0) / 100)
        if betrag <= 0:
            frappe.throw(_("Kein Anzahlungsbetrag (Anzahlung % oder Betrag angeben)."))
        az = frappe.get_doc({"doctype": "PH Anzahlung", "auftrag_referenz": self.name, "kontakt": self.kontakt, "kunde_email": self.kontakt_email(), "betrag_cent": betrag, "status": "offen", "erstellt_von": frappe.session.user}).insert()
        self.add_comment("Info", _("Anzahlungslink {0} über {1} Cent angelegt").format(az.name, betrag))
        return az.name

    @frappe.whitelist()
    def zahlungsplan_vorschau(self):
        """Für das Formular: Zahlungsplan aus Zahlungsbedingung und Brutto."""
        if not self.zahlungsbedingung:
            return []
        zb = frappe.get_cached_doc("PH Zahlungsbedingung", self.zahlungsbedingung)
        plan = plan_aus_bedingung(zb)
        zahlungsplan_betraege(self.brutto_cent, plan)
        return plan


def plan_aus_bedingung(zb):
    plan = []
    if zb.anzahlung_prozent:
        plan.append({"art": "Anzahlung", "prozent": int(zb.anzahlung_prozent), "faellig_bei": "Auftrag"})
    if zb.teilzahlung_prozent:
        plan.append({"art": "Teilzahlung", "prozent": int(zb.teilzahlung_prozent), "faellig_bei": "Lieferung"})
    rest = 100 - int(zb.anzahlung_prozent or 0) - int(zb.teilzahlung_prozent or 0)
    if rest > 0:
        plan.append({"art": "Schlusszahlung", "prozent": rest, "faellig_bei": "Montage"})
    return plan


def angebote_ablaufen_lassen(stichtag=None):
    """Scheduler: gesendete Angebote mit gueltig_bis < heute → Abgelaufen."""
    stichtag = getdate(stichtag or nowdate())
    n = 0
    for a in frappe.get_all("PH Angebot", filters={"status": ("in", ("Entwurf", "Gesendet")), "gueltig_bis": ("<", stichtag)}, pluck="name"):
        try:
            frappe.db.set_value("PH Angebot", a, {"status": "Abgelaufen", "workflow_state": "PH Abgelaufen"})
            n += 1
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Angebot {a}: Ablauf")
    return n
