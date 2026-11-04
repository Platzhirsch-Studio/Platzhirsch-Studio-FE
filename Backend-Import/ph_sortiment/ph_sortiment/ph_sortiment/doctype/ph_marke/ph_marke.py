"""PH Marke – Hersteller/Marke mit Händlerstatus (Claim-Guard), Bildfreigabe, Lieferant.

Claim-Guard (src/lib/legal/claims.js): Händlerwörter („Händler“, „Vertragshändler“, „offizieller
Partner“) dürfen nur bei Marken mit belegtem Status vorkommen. Hier: Texte der Marke und
freigegebene Claims werden gegen den Händlerstatus geprüft; ohne Status + Beleg kein Claim.
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_sortiment.logik.slug import slug as mk_slug

# Kurzform der Website-Regel (claims.js DEALER_SOURCES), nur die eindeutigen Wörter.
HAENDLER_RE = re.compile(r"(händler|haendler|dealer|retailer|stockist|revendeur|rivenditor|vertragspartner|vertriebspartner|exklusivpartner|offiziell\w* partner|official partner|authori[sz]ed|autorisiert)", re.I)
MIT_STATUS = ("Haendler", "Vertragshaendler", "Exklusiv", "Partner")
TEXTFELDER = [f"{p}_{loc}" for p in ("kurz", "story", "produkte_text") for loc in ("de", "en", "fr", "it")]


class PHMarke(Document):
    def validate(self):
        self.marke = (self.marke or "").strip()
        self.slug = mk_slug(self.slug or self.marke)
        if not self.slug:
            frappe.throw(_("Slug kann nicht gebildet werden."))
        if self.gruendungsjahr and not (1500 <= int(self.gruendungsjahr) <= 2100):
            frappe.throw(_("Gründungsjahr ist unplausibel."))
        self.pruefe_haendlerstatus()
        self.pruefe_claims()
        self.pruefe_bilder()
        self.zaehle_produkte()

    def pruefe_haendlerstatus(self):
        """Händlerstatus nur mit Beleg (Vertrag, öffentlicher Beleg oder Aktenhinweis) – UWG § 2."""
        if self.haendlerstatus in MIT_STATUS and not (self.haendlervertrag or self.haendler_beleg_url or self.haendler_notiz):
            frappe.throw(_("Händlerstatus „{0}“ braucht einen Beleg: Händlervertrag, öffentliche Beleg-URL oder Aktenhinweis.").format(self.haendlerstatus))
        if self.haendlerstatus not in MIT_STATUS:
            self.haendler_wortlaut = ""
        if self.vertrag_gueltig_von and self.vertrag_gueltig_bis and self.vertrag_gueltig_bis < self.vertrag_gueltig_von:
            frappe.throw(_("Vertragsende liegt vor Vertragsbeginn."))

    def pruefe_claims(self):
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        if not einstellungen()["claim_guard_aktiv"]:
            return
        if self.claims_erlaubt and self.haendlerstatus not in MIT_STATUS:
            frappe.throw(_("Freigegebene Claims nur bei Marken mit Händlerstatus (Claim-Guard)."))
        for c in self.claims_erlaubt:
            if not (c.quelle or c.beleg or c.freigegeben_von):
                frappe.throw(_("Claim in Zeile {0}: Quelle, Beleg oder Freigebende Person fehlt.").format(c.idx))
        if self.haendlerstatus not in MIT_STATUS:
            for feld in TEXTFELDER:
                wert = frappe.utils.strip_html(self.get(feld) or "")
                m = HAENDLER_RE.search(wert)
                if m:
                    frappe.throw(_("Claim-Guard: „{0}“ im Feld {1}, aber kein belegter Händlerstatus.").format(m.group(0), self.meta.get_label(feld)))

    def pruefe_bilder(self):
        for b in self.bilder:
            if b.freigabe == "erteilt" and not (b.freigabe_beleg or self.bildfreigabe_beleg or self.bildfreigabe_status == "schriftlich erteilt"):
                frappe.throw(_("Bild {0}: Freigabe „erteilt“ braucht einen Beleg (Zeile oder Marke).").format(b.idx))
            if b.freigabe == "erteilt" and not b.freigabe_datum:
                b.freigabe_datum = frappe.utils.today()

    def zaehle_produkte(self):
        if self.is_new():
            self.produkte_anzahl, self.es_gibt_produkte = 0, 0
            return
        n = frappe.db.count("PH Produkt", {"marke": self.name, "status": "Aktiv", "website_sichtbar": 1})
        self.produkte_anzahl, self.es_gibt_produkte = n, 1 if n else 0

    def on_update(self):
        try:
            from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

            website_aktualisieren("marken")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Marke: Website-Aktualisierung fehlgeschlagen")

    # ── Buttons (ph_marke.js) ─────────────────────────────────────────────

    @frappe.whitelist()
    def produkte_ohne_freigabe(self):
        """Button „Händlerstatus/Claims prüfen“: Produkte dieser Marke ohne freigegebenes Bild."""
        self.check_permission("read")
        rows = frappe.get_all("PH Produkt", filters={"marke": self.name, "bild_freigegeben": 0}, fields=["name", "name_herstellerbezeichnung", "status", "bilder_anzahl"], order_by="status desc, name asc", limit=500)
        return {"anzahl": len(rows), "produkte": rows, "haendlerstatus": self.haendlerstatus, "bildfreigabe_status": self.bildfreigabe_status}

    @frappe.whitelist()
    def bildfreigabe_anfordern(self, empfaenger=None, nachricht=None):
        """Button „Bildfreigabe anfordern“: Mail-Entwurf an den Hersteller (über ph_core.utils.mail, Testmodus-sicher)."""
        self.check_permission("write")
        empfaenger = empfaenger or self.bestell_email or next((a.email for a in self.ansprechpartner if a.email), None)
        if not empfaenger:
            frappe.throw(_("Kein Empfänger: Bestell-E-Mail oder Ansprechpartner mit E-Mail hinterlegen."))
        from ph_core.utils.mail import sende

        firma = frappe.get_cached_doc("PH Firma", frappe.db.get_value("PH Firma", {"standard": 1}, "name")) if frappe.db.exists("PH Firma", {"standard": 1}) else None
        text = nachricht or _(
            "Sehr geehrte Damen und Herren,\n\nwir führen {0} in unserem Studio in Lochau und möchten Ihre offiziellen Produktbilder "
            "auf unserer Website und in Social Media verwenden. Bitte bestätigen Sie uns schriftlich die Nutzungserlaubnis "
            "(Bildmaterial, Umfang, Dauer) oder nennen Sie uns Ihr Presse-/Händlerportal.\n\nMit freundlichen Grüßen\n{1}"
        ).format(self.marke, (firma.kurzname or firma.firmenname) if firma else "Platzhirsch Home Living")
        sende([empfaenger], _("Bildfreigabe {0} – Platzhirsch Home Living").format(self.marke), text.replace("\n", "<br>"), text=text, referenz_doctype=self.doctype, referenz_name=self.name)
        self.add_comment("Info", _("Bildfreigabe angefordert bei {0}").format(empfaenger))
        if self.bildfreigabe_status == "offen":
            self.db_set("bildfreigabe_status", "offen")
        return empfaenger

    @frappe.whitelist()
    def lieferant_anlegen(self):
        """Button „Lieferant anlegen“: PH Lieferant aus der Marke (Hersteller = Lieferant)."""
        self.check_permission("write")
        if self.lieferant:
            return self.lieferant
        name = frappe.db.get_value("PH Lieferant", {"marke": self.name}, "name") or frappe.db.get_value("PH Lieferant", {"firmenname": self.marke}, "name")
        if not name:
            doc = frappe.get_doc({
                "doctype": "PH Lieferant",
                "firmenname": self.marke,
                "marke": self.name,
                "land": self.land,
                "bestellweg": self.bestellweg or "E-Mail",
                "bestell_email": self.bestell_email,
                "kundennummer_bei_lieferant": self.kundennummer_bei_lieferant,
                "lieferzeit_wochen_standard": self.lieferzeit_wochen_standard,
                "ansprechpartner": [{"ansprechpartner": a.ansprechpartner, "rolle": a.rolle, "email": a.email, "telefon": a.telefon} for a in self.ansprechpartner],
            }).insert()
            name = doc.name
        self.db_set({"lieferant": name, "import_stand": now_datetime()})
        return name


def marken_mit_status():
    """Slugs der Marken mit belegtem Händlerstatus (Vergleich mit claims.js VERIFIED_DEALER_BRANDS)."""
    return [r.slug for r in frappe.get_all("PH Marke", filters={"haendlerstatus": ("in", MIT_STATUS)}, fields=["slug"])]
