"""PH Lieferschein – Lieferung/Abholung je PH Bestellung (ph_shop) oder PH Auftragsbestaetigung (ph_faktura).

Status (Workflow PH Lieferschein, Packtisch, Tour): Entwurf → Gepackt → Uebergeben → Zugestellt; Storniert (Leitung).
Positionen werden am Packtisch abgehakt/gescannt; Pakete tragen Maße/Gewicht für LetMeShip.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime, nowdate

from ph_logistik.ph_logistik import packtisch_logik as pl
from ph_logistik.ph_logistik.helfer import einstellungen, mail_senden, produkt_info, setze_status

OFFEN = ("Entwurf", "Gepackt", "Uebergeben")


class PHLieferschein(Document):
    def before_insert(self):
        if not self.datum:
            self.datum = nowdate()
        if not self.status:
            self.status = "Entwurf"

    def validate(self):
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position ist nötig."))
        if self.lieferart in ("Versand", "Spedition", "Eigenlieferung") and not (self.liefer_plz and self.liefer_ort):
            frappe.throw(_("Lieferadresse (PLZ, Ort) fehlt."))
        if self.liefer_land:
            self.liefer_land = self.liefer_land.strip().upper()[:2]
        for p in self.positionen:
            if int(p.menge or 0) <= 0:
                frappe.throw(_("Menge der Position {0} muss größer 0 sein.").format(p.idx))
            p.menge_gepackt = min(int(p.menge_gepackt or 0), int(p.menge))
            p.gepackt = int(p.menge_gepackt >= int(p.menge))
            if p.produkt and not (p.ean and p.slug):
                info = produkt_info(p.produkt)
                p.ean = p.ean or info.get("ean")
                p.slug = p.slug or info.get("slug")
                p.marke = p.marke or info.get("marke")
                if not p.beschreibung:
                    p.beschreibung = info.get("beschreibung") or p.produkt
                if info.get("zerbrechlich") and not p.zerbrechlich:
                    p.zerbrechlich = 1
                if not p.paketprofil and info.get("paketprofil"):
                    p.paketprofil = info["paketprofil"]
        for i, pk in enumerate(self.pakete, start=1):
            if not pk.paket_nr:
                pk.paket_nr = i
        self.gesamtgewicht_g = pl.gesamtgewicht_g([pk.as_dict() for pk in self.pakete])
        self.zerbrechlich = int(pl.zerbrechlich_gesamt([p.as_dict() for p in self.positionen]) or any(pk.zerbrechlich for pk in self.pakete))
        if not self.warenwert_cent:
            self.warenwert_cent = pl.warenwert_cent([p.as_dict() for p in self.positionen])
        self._versicherung_ableiten()
        self.titel = f"{self.lieferart} {self.kunde_name or self.liefer_name or ''} · {self.bestellung or self.auftrag or ''}".strip(" ·")[:140]

    def _versicherung_ableiten(self):
        e = einstellungen()
        from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map

        profile = profile_map() if frappe.db.exists("DocType", "PH Paketprofil") else {}
        versichern, wert = pl.versicherung([p.as_dict() for p in self.positionen], profile, bool(e.get("glas_immer_versichern", 1)), int(e.get("versicherung_ab_cent") or 0))
        if versichern and not self.versichern:
            self.versichern = 1
        if self.versichern and not self.versicherungswert_cent:
            self.versicherungswert_cent = wert or self.warenwert_cent

    def on_update(self):
        if self.has_value_changed("status"):
            self._bestellung_spiegeln()

    def _bestellung_spiegeln(self):
        """Status der Shop-Bestellung nachziehen (versandbereit/versendet/abgeholt) – nur, wenn ph_shop die Felder hat."""
        if not self.bestellung or not frappe.db.exists("DocType", "PH Bestellung"):
            return
        ziel = {"Gepackt": "versandbereit" if self.lieferart == "Versand" else "abholbereit", "Uebergeben": "versendet", "Zugestellt": "abgeholt" if self.lieferart == "Abholung" else "versendet"}.get(self.status)
        if not ziel:
            return
        try:
            meta = frappe.get_meta("PH Bestellung")
            if meta.has_field("ph_logistik_lieferschein"):
                frappe.db.set_value("PH Bestellung", self.bestellung, "ph_logistik_lieferschein", self.name, update_modified=False)
            opts = (meta.get_field("status").options or "").split("\n") if meta.has_field("status") else []
            if ziel in opts:
                akt = frappe.db.get_value("PH Bestellung", self.bestellung, "status")
                if akt not in ("storniert", "erstattet", "teilerstattet", "abgeholt") and akt != ziel:
                    frappe.db.set_value("PH Bestellung", self.bestellung, "status", ziel)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Lieferschein: Bestellstatus spiegeln")

    # ── Packtisch / Buttons ───────────────────────────────────────────────
    @frappe.whitelist()
    def position_packen(self, position, anzahl=1):
        """Position abhaken (Packtisch). → {menge_gepackt, vollstaendig, alles_gepackt}"""
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Nur im Status Entwurf packen."))
        for p in self.positionen:
            if p.name == position:
                p.menge_gepackt, voll = pl.abhaken(p.as_dict(), anzahl)
                p.gepackt = int(voll)
                self.save()
                return {"menge_gepackt": p.menge_gepackt, "vollstaendig": voll, "alles_gepackt": pl.alles_gepackt([x.as_dict() for x in self.positionen])}
        frappe.throw(_("Position nicht gefunden."))

    @frappe.whitelist()
    def scan(self, code):
        """Barcode/QR → passende offene Position abhaken. → wie position_packen oder {treffer: null}"""
        self.check_permission("write")
        p = pl.scan_treffer(code, [x.as_dict() for x in self.positionen])
        if not p:
            return {"treffer": None}
        r = self.position_packen(p["name"], 1)
        r["treffer"] = p["name"]
        r["beschreibung"] = p.get("beschreibung")
        return r

    @frappe.whitelist()
    def pakete_vorschlagen(self):
        self.check_permission("write")
        from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map, vorschlag_fuer

        profile = profile_map()
        for p in self.positionen:
            if not p.paketprofil and p.produkt:
                p.paketprofil = vorschlag_fuer(produkt_info(p.produkt))
        self.set("pakete", [])
        for pk in pl.paket_vorschlag([p.as_dict() for p in self.positionen], profile):
            pos = pk.pop("position", None)
            self.append("pakete", pk)
            for p in self.positionen:
                if p.name == pos and not p.paket_nr:
                    p.paket_nr = pk["paket_nr"]
        self.save()
        return [pk.as_dict() for pk in self.pakete]

    @frappe.whitelist()
    def pakete_setzen(self, pakete):
        """Packtisch: Paketliste komplett übernehmen (JSON-Liste mit paket_nr, paketprofil, Maßen, gewicht_g, inhalt)."""
        self.check_permission("write")
        if isinstance(pakete, str):
            pakete = frappe.parse_json(pakete)
        self.set("pakete", [])
        for i, pk in enumerate(pakete or [], start=1):
            self.append("pakete", {k: pk.get(k) for k in ("paketprofil", "laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g", "zerbrechlich", "inhalt")} | {"paket_nr": pk.get("paket_nr") or i})
        if pakete and pakete[0].get("versicherungswert_cent") is not None:
            self.versicherungswert_cent = int(pakete[0]["versicherungswert_cent"])
            self.versichern = int(self.versicherungswert_cent > 0)
        self.save()
        return self.gesamtgewicht_g

    @frappe.whitelist()
    def als_gepackt(self):
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Lieferschein ist nicht im Status Entwurf."))
        if not pl.alles_gepackt([p.as_dict() for p in self.positionen]):
            frappe.throw(_("Es sind noch nicht alle Positionen gepackt."))
        if self.lieferart in ("Versand", "Spedition") and not self.pakete:
            frappe.throw(_("Bitte Pakete (Maße, Gewicht) erfassen."))
        self.db_set({"gepackt_von": frappe.session.user, "gepackt_am": now_datetime()})
        setze_status(self, "Gepackt")
        self._bestand_ausbuchen()
        if self.lieferart == "Abholung":
            self.abholbereit_melden()
        return self.status

    def _bestand_ausbuchen(self):
        """Positionen mit Lagerbestand → Verkauf buchen (einmalig, idempotent über Schlüssel)."""
        from ph_logistik.ph_logistik.bestand import buche

        for p in self.positionen:
            if p.lagerbestand:
                try:
                    lo = frappe.db.get_value("PH Lagerbestand", p.lagerbestand, "lagerort")
                    buche("Verkauf", p.produkt, int(p.menge), lagerort_von=lo, lagerbestand=p.lagerbestand, bezug_doctype="PH Lieferschein", bezug=self.name, idempotency_key=f"ls:{self.name}:{p.name}", quelle="packtisch")
                except Exception:  # noqa: BLE001
                    frappe.log_error(title="PH Lieferschein: Bestand ausbuchen")

    @frappe.whitelist()
    def tarife(self, neu=0):
        """Button „Etikett erzeugen“, Schritt 1: Tarife (LetMeShip oder Mock)."""
        self.check_permission("write")
        from ph_logistik.letmeship import ShippingError
        from ph_logistik.letmeship.dienst import tarife_fuer_lieferschein

        if not self.pakete:
            frappe.throw(_("Bitte zuerst Pakete erfassen."))
        from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map

        ok, grund = pl.versandfaehig([pk.as_dict() for pk in self.pakete], profile_map(nur_aktiv=False))
        if not ok:
            frappe.throw(_("Nicht versandfähig: {0}").format(grund))
        try:
            return tarife_fuer_lieferschein(self, neu=bool(int(neu or 0)))
        except ShippingError as e:
            frappe.throw(_("Keine Tarife ({0}). Rückfall: Abholung anbieten oder Pauschale laut Einstellungen.").format(e.code))

    @frappe.whitelist()
    def etikett_erzeugen(self, tarif_id):
        """Button „Etikett erzeugen“, Schritt 2: Sendung anlegen und buchen → Etikett-PDF. → Sendungsname"""
        self.check_permission("write")
        if self.status not in ("Entwurf", "Gepackt"):
            frappe.throw(_("Etikett nur für Entwurf/Gepackt."))
        offen = frappe.db.get_value("PH Sendung", {"lieferschein": self.name, "richtung": "Ausgang", "status": ("in", ["Angelegt", "Etikett", "Unterwegs"])}, "name")
        if offen:
            frappe.throw(_("Es gibt bereits eine aktive Sendung {0}.").format(offen))
        from ph_logistik.letmeship.dienst import buchen, sendung_anlegen

        s = sendung_anlegen(self, tarif_id)
        buchen(s, service_roh=getattr(s.flags, "service_roh", None))
        if self.status == "Entwurf" and pl.alles_gepackt([p.as_dict() for p in self.positionen]):
            self.als_gepackt()
        return s.name

    @frappe.whitelist()
    def uebergeben(self, an="Dienstleister"):
        self.check_permission("write")
        if self.status != "Gepackt":
            frappe.throw(_("Nur gepackte Lieferscheine werden übergeben."))
        setze_status(self, "Uebergeben", uebergeben_am=now_datetime(), uebergeben_an=an)
        self._auftrag_fortschreiben()
        return self.status

    @frappe.whitelist()
    def als_zugestellt(self, empfaenger_name=None, unterschrift=None):
        """Abholung (Unterschrift am Tresen), Eigenlieferung (Tour) oder manuell."""
        self.check_permission("write")
        if self.status not in ("Gepackt", "Uebergeben"):
            frappe.throw(_("Lieferschein ist nicht gepackt/übergeben."))
        werte = {"zugestellt_am": now_datetime()}
        if empfaenger_name:
            werte["empfaenger_name"] = empfaenger_name
        if unterschrift:
            werte["unterschrift_empfaenger"] = unterschrift
        war_gepackt = self.status == "Gepackt"
        if war_gepackt:
            werte.update(uebergeben_am=now_datetime(), uebergeben_an="Kunde" if self.lieferart == "Abholung" else "Fahrer")
        setze_status(self, "Zugestellt", **werte)
        if war_gepackt:
            self._auftrag_fortschreiben()
        return self.status

    def _auftrag_fortschreiben(self):
        """Beim Verlassen von „Gepackt“ (Übergabe/Zustellung) einmalig: PH Beleg Position.lieferschein_menge der AB
        über die Controller-Methode lieferung_melden() fortschreiben (setzt Teilgeliefert/Geliefert + Stand, ph_faktura)."""
        if not self.auftrag or not frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
            return
        mengen = {}
        for p in self.positionen:
            if p.beleg_position and int(p.menge or 0) > 0:
                mengen[p.beleg_position] = mengen.get(p.beleg_position, 0) + int(p.menge)
        if not mengen:
            return
        try:
            ab = frappe.get_doc("PH Auftragsbestaetigung", self.auftrag)
            ab.flags.ignore_permissions = True
            ab.lieferung_melden(mengen=mengen)
            if frappe.get_meta("PH Auftragsbestaetigung").has_field("ph_logistik_letzter_lieferschein"):
                frappe.db.set_value("PH Auftragsbestaetigung", self.auftrag, "ph_logistik_letzter_lieferschein", self.name, update_modified=False)
            self.add_comment("Info", _("Liefermengen an {0} gemeldet").format(self.auftrag))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Lieferschein {self.name}: Liefermengen an AB melden")

    @frappe.whitelist()
    def stornieren(self, grund=None):
        self.check_permission("write")
        if self.status == "Zugestellt":
            frappe.throw(_("Zugestellte Lieferscheine werden nicht storniert (Retoure anlegen)."))
        for s in frappe.get_all("PH Sendung", {"lieferschein": self.name, "status": ("in", ["Angelegt", "Etikett"])}, pluck="name"):
            from ph_logistik.letmeship.dienst import stornieren

            stornieren(frappe.get_doc("PH Sendung", s), grund)
        setze_status(self, "Storniert", storno_grund=grund)
        return self.status

    @frappe.whitelist()
    def abholbereit_melden(self):
        """Mail an den Kunden: Ware liegt im Showroom bereit (Vorlage aus Einstellungen oder Standardtext)."""
        self.check_permission("write")
        empf = self.kunde_email or self.liefer_email
        if not empf:
            return False
        e = einstellungen()
        html = _vorlage(e.get("abholbereit_vorlage"), self) or f"<p>{_('Guten Tag')} {frappe.utils.escape_html(self.kunde_name or '')},</p><p>{_('Ihre Bestellung {0} liegt im Showroom Lochau zur Abholung bereit.').format(self.bestellung or self.name)}</p>"
        ok = mail_senden(empf, _("Abholbereit: {0}").format(self.bestellung or self.name), html, self.doctype, self.name)
        if ok:
            self.add_comment("Info", _("Abholbereit-Mail gesendet"))
        return ok

    @frappe.whitelist()
    def lieferbestaetigung_senden(self):
        """Mail mit Lieferschein-PDF (Sprache des Kunden; Vorlage je Sprache optional)."""
        self.check_permission("write")
        empf = self.kunde_email or self.liefer_email
        if not empf:
            frappe.throw(_("Keine E-Mail-Adresse hinterlegt."))
        e = einstellungen()
        html = _vorlage(e.get("lieferbestaetigung_vorlage"), self) or _standard_bestaetigung(self)
        anhang = [frappe.attach_print("PH Lieferschein", self.name, print_format="PH Lieferschein Standard", file_name=f"Lieferschein-{self.name}")]
        ok = mail_senden(empf, _("Ihre Lieferung {0}").format(self.name), html, self.doctype, self.name, anhaenge=anhang)
        if ok:
            self.db_set("lieferbestaetigung_gesendet_am", now_datetime())
        return ok

    @frappe.whitelist()
    def teilrechnung_erstellen(self):
        """→ ph_faktura: Teilrechnung aus Lieferschein (Button dort, hier nur Weiterleitung mit Prüfung)."""
        self.check_permission("write")
        if not self.auftrag:
            frappe.throw(_("Teilrechnung nur für Lieferscheine zu einer Auftragsbestätigung."))
        if not frappe.db.exists("DocType", "PH Rechnung"):
            frappe.throw(_("ph_faktura ist nicht installiert."))
        if self.status not in ("Uebergeben", "Zugestellt"):
            frappe.throw(_("Teilrechnung erst nach Übergabe/Zustellung (Liefermengen müssen an der AB gemeldet sein)."))
        try:
            fn = frappe.get_attr("ph_faktura.api.create_partial_invoice")
        except Exception:  # noqa: BLE001
            frappe.throw(_("ph_faktura stellt create_partial_invoice noch nicht bereit."))
        # Mengen dieses Lieferscheins je AB-Position (PH Beleg Position.name)
        mengen = {}
        for p in self.positionen:
            if p.beleg_position and int(p.menge or 0) > 0:
                mengen[p.beleg_position] = mengen.get(p.beleg_position, 0) + int(p.menge)
        r = fn(auftrag=self.auftrag, lieferschein=self.name, positionen=mengen or None, idempotency_key=f"lieferschein:{self.name}")
        name = r.get("rechnung") if isinstance(r, dict) else r
        if name:
            self.db_set("teilrechnung", name)
        return name

    @frappe.whitelist()
    def produktpaesse_erzeugen(self):
        """→ ph_projekte PH Produktpass je Position (nur, wenn installiert)."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Produktpass"):
            frappe.throw(_("ph_projekte (PH Produktpass) ist nicht installiert."))
        try:
            fn = frappe.get_attr("ph_projekte.api.create_product_passes")
        except Exception:  # noqa: BLE001
            frappe.throw(_("ph_projekte stellt create_product_passes noch nicht bereit."))
        positionen = [
            {"produkt": p.produkt, "bezeichnung": p.beschreibung, "menge": int(p.menge or 0), "seriennummer": p.seriennummer, "ausfuehrung_text": p.ausfuehrung_text, "ab_position": p.beleg_position}
            for p in self.positionen
            if p.produkt
        ]
        return fn(lieferschein=self.name, auftrag=self.auftrag, projekt=self.projekt, positionen=positionen, idempotency_key=f"lieferschein:{self.name}")


def _vorlage(name, doc):
    if not name or not frappe.db.exists("Email Template", name):
        return None
    try:
        t = frappe.get_doc("Email Template", name)
        return frappe.render_template(t.response_html or t.response, {"doc": doc})
    except Exception:  # noqa: BLE001
        return None


def _standard_bestaetigung(doc):
    texte = {
        "de": ("Guten Tag {0},", "Ihre Lieferung {0} wurde zugestellt bzw. übergeben. Den Lieferschein finden Sie im Anhang.", "Herzliche Grüße, Ihr Platzhirsch-Team"),
        "en": ("Dear {0},", "Your delivery {0} has been delivered. Please find the delivery note attached.", "Kind regards, your Platzhirsch team"),
        "fr": ("Bonjour {0},", "Votre livraison {0} a été effectuée. Vous trouverez le bon de livraison en pièce jointe.", "Cordialement, votre équipe Platzhirsch"),
        "it": ("Buongiorno {0},", "La sua consegna {0} è stata effettuata. In allegato trova la bolla di consegna.", "Cordiali saluti, il team Platzhirsch"),
    }
    a, b, c = texte.get(doc.sprache or "de", texte["de"])
    n = frappe.utils.escape_html(doc.kunde_name or doc.liefer_name or "")
    return f"<p>{a.format(n)}</p><p>{b.format(doc.name)}</p><p>{c}</p>"


def lieferschein_aus_bestellung(bestellung, positionen=None, lieferart=None):
    """PH Lieferschein aus PH Bestellung (ph_shop). positionen: optional {zeilenname: menge} für Teillieferung.
    Feldnamen laut ph_shop/ph_faktura, geprüft 04.11.: PH Bestellung kontakt, kunde_name/-email/-telefon, sprache, lieferart
    (versand|abholung), adresse_land/plz/ort/strasse/hausnr/zusatz, waren_cent, zerbrechlich, abholcode;
    PH Bestellung Position produkt, slug, variante, variante_name, bezeichnung, marke, menge, einzel_cent, zerbrechlich."""
    if not frappe.db.exists("DocType", "PH Bestellung"):
        frappe.throw(_("ph_shop (PH Bestellung) ist nicht installiert."))
    b = frappe.get_doc("PH Bestellung", bestellung)
    offen = frappe.db.get_value("PH Lieferschein", {"bestellung": bestellung, "status": ("in", OFFEN)}, "name")
    if offen:
        return frappe.get_doc("PH Lieferschein", offen)
    ls = frappe.get_doc(
        {
            "doctype": "PH Lieferschein",
            "bestellung": bestellung,
            "kontakt": b.kontakt,
            "kunde_name": b.kunde_name,
            "kunde_email": b.kunde_email,
            "kunde_telefon": b.kunde_telefon,
            "sprache": b.sprache or "de",
            "lieferart": lieferart or ("Abholung" if b.lieferart == "abholung" else "Versand"),
            "liefer_name": b.kunde_name,
            "liefer_strasse": b.adresse_strasse,
            "liefer_hausnr": b.adresse_hausnr,
            "liefer_zusatz": b.adresse_zusatz,
            "liefer_plz": b.adresse_plz,
            "liefer_ort": b.adresse_ort,
            "liefer_land": (b.adresse_land or "AT").upper()[:2],
            "liefer_email": b.kunde_email,
            "liefer_telefon": b.kunde_telefon,
            "warenwert_cent": int(b.waren_cent or 0),
            "zerbrechlich": int(b.zerbrechlich or 0),
            "abholcode": b.abholcode,
            "quelle": "backoffice",
        }
    )
    gesamt = 0
    genommen = 0
    for z in b.positionen:
        menge = int(z.menge or 0)
        gesamt += menge
        if positionen is not None:
            menge = int(positionen.get(z.name) or 0)
        if menge <= 0:
            continue
        genommen += menge
        ls.append(
            "positionen",
            {
                "produkt": z.produkt,
                "beschreibung": z.bezeichnung or z.variante_name or z.slug or z.produkt or _("Position"),
                "ausfuehrung_text": z.variante_name or z.variante,
                "marke": z.marke,
                "menge": menge,
                "slug": z.slug,
                "zerbrechlich": int(z.zerbrechlich or 0),
                "einzel_cent": int(z.einzel_cent or 0),
                "beleg_position": z.name,
            },
        )
    ls.teillieferung = int(genommen < gesamt)
    ls.insert()
    return ls


def lieferschein_aus_bestellung_hook(doc):
    """hooks.ph_shop_lieferschein_erstellen – ph_shop PH Bestellung.packen ruft fn(doc) → Name des Lieferscheins."""
    return lieferschein_aus_bestellung(doc.name).name


def lieferschein_aus_auftrag(auftrag, positionen=None, lieferart="Eigenlieferung"):
    """PH Lieferschein aus PH Auftragsbestaetigung (ph_faktura); positionen {zeilenname: menge} für Teillieferung.
    Feldnamen laut ph_faktura, geprüft 04.11.: AB kontakt, kunde_name, projekt, firma, strasse, plz, ort, land, lieferadresse
    (Small Text, freie Lieferanschrift), lieferhinweis, liefertermin_bestaetigt/-geplant, sprache;
    PH Beleg Position art, alternativ, produkt, bezeichnung, ausfuehrung_text, marke, menge, lieferschein_menge, einzel_netto_cent."""
    if not frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
        frappe.throw(_("ph_faktura (PH Auftragsbestaetigung) ist nicht installiert."))
    ab = frappe.get_doc("PH Auftragsbestaetigung", auftrag)
    kontakt = {}
    if ab.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
        kontakt = frappe.db.get_value("PH Kontakt", ab.kontakt, ["vorname", "nachname", "firma", "email", "telefon", "mobil", "strasse", "plz", "ort", "land", "sprache"], as_dict=True) or {}
    name_kontakt = " ".join(x for x in (kontakt.get("vorname"), kontakt.get("nachname")) if x)
    hinweis = "\n".join(x for x in (ab.lieferadresse, ab.lieferhinweis) if x) or None
    ls = frappe.get_doc(
        {
            "doctype": "PH Lieferschein",
            "auftrag": auftrag,
            "projekt": ab.projekt,
            "kontakt": ab.kontakt,
            "kunde_name": ab.kunde_name or name_kontakt,
            "kunde_email": kontakt.get("email"),
            "kunde_telefon": kontakt.get("telefon") or kontakt.get("mobil"),
            "sprache": ab.sprache or kontakt.get("sprache") or "de",
            "lieferart": lieferart,
            "liefer_name": ab.kunde_name or name_kontakt,
            "liefer_firma": ab.firma or kontakt.get("firma"),
            "liefer_strasse": ab.strasse or kontakt.get("strasse"),
            "liefer_plz": ab.plz or kontakt.get("plz"),
            "liefer_ort": ab.ort or kontakt.get("ort"),
            "liefer_land": str(ab.land or kontakt.get("land") or "AT")[:2].upper(),
            "liefer_email": kontakt.get("email"),
            "liefer_telefon": kontakt.get("telefon") or kontakt.get("mobil"),
            "lieferhinweis": hinweis,
            "wunschtermin": ab.liefertermin_bestaetigt or ab.liefertermin_geplant,
            "quelle": "backoffice",
        }
    )
    gesamt = genommen = 0
    for z in ab.positionen:
        if z.art not in ("Produkt", "Leistung") or z.alternativ:
            continue
        rest = int(flt(z.menge) - flt(z.lieferschein_menge))
        gesamt += max(rest, 0)
        menge = int(positionen.get(z.name) or 0) if positionen is not None else rest
        if menge <= 0:
            continue
        genommen += menge
        ls.append(
            "positionen",
            {
                "produkt": z.produkt,
                "beschreibung": z.bezeichnung or z.produkt or _("Position"),
                "ausfuehrung_text": z.ausfuehrung_text,
                "marke": z.marke,
                "menge": menge,
                "einzel_cent": int(z.einzel_netto_cent or 0),
                "beleg_position": z.name,
            },
        )
    if not ls.positionen:
        frappe.throw(_("Keine offenen Positionen in {0}.").format(auftrag))
    ls.teillieferung = int(genommen < gesamt)
    ls.insert()
    return ls
