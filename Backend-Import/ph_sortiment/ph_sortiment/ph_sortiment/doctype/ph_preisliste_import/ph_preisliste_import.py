"""PH Preisliste Import – Herstellerpreisliste (CSV, DataNorm 4, IDM/XML) mit Mapping und Vorschau prüfen
und als Preise mit Stand übernehmen (VK/UVP/Herstellerpreis → PH Produkt Preis, Einkaufspreis → PH Produkt
Einkaufspreis, optional VK-Vorschlag aus dem Kalkulationsfaktor der Marke – unfreigegeben).

Formate/Parser: ph_sortiment/logik/preislisten_format.py (DataNorm und IDM-Preset mit echter Datei verifizieren).
"""

import html
import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime

from ph_sortiment.logik.kalkulation import faktor_fuer, gueltiger_ek, rabatt_fuer, vk_aus_ek
from ph_sortiment.logik.preise import preisliste_zeilen_pruefen
from ph_sortiment.logik.preislisten_format import FormatFehler, lesen, zuordnen

LEITUNG = {"PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"}
VORSCHAU_ZEILEN = 25


def _ist_leitung():
    return bool(LEITUNG & set(frappe.get_roles()))


class PHPreislisteImport(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Hochgeladen"

    def validate(self):
        self.titel = f"{self.marke} · {self.preisart} · Stand {frappe.utils.formatdate(self.stand)}"[:140]
        if not self.schwelle_prozent:
            from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

            self.schwelle_prozent = einstellungen()["preisliste_schwelle_prozent"]
        if not self.lieferant and self.marke:
            self.lieferant = frappe.db.get_value("PH Marke", self.marke, "lieferant")
        if self.mapping_json:
            try:
                json.loads(self.mapping_json)
            except ValueError:
                frappe.throw(_("Mapping ist kein gültiges JSON."))
        if self.preisart == "Einkaufspreis" and self.zeilen and not _ist_leitung():
            frappe.throw(_("Einkaufspreislisten darf nur die Leitung einlesen (EK ist vertraulich)."))
        self.zeilen_anzahl = len(self.zeilen)
        self.zeilen_auffaellig = sum(1 for z in self.zeilen if z.abweichung_prozent is not None and abs(z.abweichung_prozent) > self.schwelle_prozent)
        self.zeilen_ohne_produkt = sum(1 for z in self.zeilen if not z.produkt)

    # ── Einlesen ──────────────────────────────────────────────────────────

    def _vorlage_vom_lieferanten(self):
        if not self.lieferant:
            return
        v = frappe.db.get_value("PH Lieferant", self.lieferant, ["preisliste_format", "preisliste_trennzeichen", "preisliste_kodierung", "preisliste_mapping_json"], as_dict=True) or {}
        if (not self.format or self.format == "Auto") and v.get("preisliste_format"):
            self.format = v.preisliste_format
        if not self.trennzeichen and v.get("preisliste_trennzeichen"):
            self.trennzeichen = v.preisliste_trennzeichen
        if (not self.kodierung or self.kodierung == "Auto") and v.get("preisliste_kodierung"):
            self.kodierung = v.preisliste_kodierung
        if not self.mapping_json and v.get("preisliste_mapping_json"):
            self.mapping_json = v.preisliste_mapping_json

    def _lesen(self):
        if not self.datei:
            frappe.throw(_("Keine Datei angehängt."))
        self._vorlage_vom_lieferanten()
        inhalt = frappe.get_doc("File", {"file_url": self.datei}).get_content()
        mapping = json.loads(self.mapping_json) if self.mapping_json else None
        try:
            return lesen(inhalt, self.format or "Auto", mapping=mapping, trennzeichen=self.trennzeichen or None, kodierung=self.kodierung or None, dezimal=self.dezimal or None)
        except FormatFehler as e:
            frappe.throw(_("Datei nicht lesbar: {0}").format(str(e)))

    def _indizes(self):
        """Zuordnungs-Indizes der Marke: Artikelnr., EAN, Ausführungs-SKU (nie Minotti-Daten verändern – nur lesen)."""
        produkte = frappe.get_all("PH Produkt", filters={"marke": self.marke}, fields=["name", "hersteller_artikelnr", "ean"])
        nach_nr = {p.hersteller_artikelnr: p.name for p in produkte if p.hersteller_artikelnr}
        nach_ean = {p.ean: p.name for p in produkte if p.ean}
        nach_sku = {}
        if produkte:
            for a in frappe.get_all("PH Produkt Ausfuehrung", filters={"produkt": ("in", [p.name for p in produkte]), "sku": ("is", "set")}, fields=["name", "produkt", "sku"]):
                nach_sku[a.sku] = (a.produkt, a.name)
        return nach_nr, nach_ean, nach_sku

    @frappe.whitelist()
    def vorschau(self):
        """Button „Vorschau“: Datei lesen, Mapping anwenden, erste Zeilen mit Zuordnungsstatus – ohne zu speichern."""
        self.check_permission("read")
        e = self._lesen()
        zeilen = e["zeilen"]
        stat = zuordnen(zeilen, *self._indizes())
        return {"format": e["format"], "kodierung": e["kodierung"], "mapping": e.get("mapping"), "trennzeichen": e.get("trennzeichen"), "dezimal": e.get("dezimal"), "hinweise": e["hinweise"], "fehler": e["fehler"][:50], "zeilen": len(zeilen), "zugeordnet": stat["zugeordnet"], "ohne": stat["ohne"], "beispiel": zeilen[:VORSCHAU_ZEILEN], "html": vorschau_html(zeilen, e)}

    @frappe.whitelist()
    def datei_einlesen(self):
        """Button „Datei einlesen“: alle Zeilen übernehmen, zuordnen, prüfen. Formate: CSV/DataNorm/IDM-XML/XML (Auto erkennt)."""
        self.check_permission("write")
        if self.preisart == "Einkaufspreis" and not _ist_leitung():
            frappe.throw(_("Einkaufspreislisten darf nur die Leitung einlesen."))
        e = self._lesen()
        zuordnen(e["zeilen"], *self._indizes())
        self.set("zeilen", [])
        for z in e["zeilen"]:
            self.append("zeilen", {"hersteller_artikelnr": z["artikelnr"][:140], "neu_cent": z["preis_cent"], "bezeichnung": (z.get("bezeichnung") or "")[:140], "ean": z.get("ean") or None, "produkt": z.get("produkt"), "ausfuehrung": z.get("ausfuehrung_name"), "zuordnung": z.get("zuordnung") or "", "preiskennzeichen": z.get("preiskennzeichen") or ""})
        hinweise = list(e["hinweise"]) + [_("Zeile {0}: {1}").format(n, t) for n, t in e["fehler"][:30]]
        if len(e["fehler"]) > 30:
            hinweise.append(_("… {0} weitere Fehlerzeilen").format(len(e["fehler"]) - 30))
        self.hinweise = "\n".join(hinweise)[:5000] or None
        if e["format"] != self.format and (not self.format or self.format == "Auto"):
            self.format = "IDM-XML" if e["format"] == "IDM-XML" else e["format"]
        self.pruefen(speichern=False)
        self.save()
        return len(self.zeilen)

    @frappe.whitelist()
    def pruefen(self, speichern=True):
        """Button „Prüfen“: Produkte zuordnen (Artikelnr./EAN/SKU der Marke), Altpreis holen, Abweichung > Schwelle markieren,
        bei Einkaufspreis optional VK-Vorschlag aus dem Kalkulationsfaktor."""
        self.check_permission("write")
        nach_nr, nach_ean, nach_sku = self._indizes()
        roh_zuordnung = [{"artikelnr": z.hersteller_artikelnr or "", "ean": z.ean or "", "produkt": z.produkt, "ausfuehrung_name": z.ausfuehrung} for z in self.zeilen]
        zuordnen([r for r in roh_zuordnung if not r["produkt"]], nach_nr, nach_ean, nach_sku)
        marke = frappe.db.get_value("PH Marke", self.marke, ["kalkulationsfaktor_promille", "vk_rundung"], as_dict=True) or {}
        overrides = [o.as_dict() for o in frappe.get_doc("PH Marke", self.marke).kalkulation_kategorien] if self.vk_vorschlag else []
        rohe = []
        for z, r in zip(self.zeilen, roh_zuordnung):
            if not z.produkt and r.get("produkt"):
                z.produkt, z.ausfuehrung, z.zuordnung = r["produkt"], r.get("ausfuehrung_name"), r.get("zuordnung")
            if z.produkt:
                p = frappe.db.get_value("PH Produkt", z.produkt, ["titel", "aktueller_preis_cent", "kategorie"], as_dict=True) or {}
                z.bezeichnung = z.bezeichnung or p.get("titel")
                if self.preisart == "Einkaufspreis":
                    ek = gueltiger_ek([e.as_dict() for e in frappe.get_doc("PH Produkt", z.produkt).einkaufspreise], self.stand, self.lieferant)
                    z.alt_cent = ek.get("netto_ek_cent") if ek else None
                    if self.vk_vorschlag:
                        faktor, rundung = faktor_fuer(marke.get("kalkulationsfaktor_promille"), p.get("kategorie"), overrides)
                        try:
                            z.vk_vorschlag_cent = vk_aus_ek(z.neu_cent, faktor, rundung or marke.get("vk_rundung") or "keine")
                        except ValueError:
                            z.vk_vorschlag_cent = None
                else:
                    z.alt_cent = p.get("aktueller_preis_cent")
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
    def mapping_speichern(self):
        """Button „Als Vorlage beim Lieferanten speichern“: Format, Trennzeichen, Kodierung, Mapping."""
        self.check_permission("write")
        if not self.lieferant:
            frappe.throw(_("Kein Lieferant gewählt."))
        frappe.get_doc("PH Lieferant", self.lieferant).check_permission("write")
        frappe.db.set_value("PH Lieferant", self.lieferant, {"preisliste_format": self.format or "Auto", "preisliste_trennzeichen": self.trennzeichen, "preisliste_kodierung": self.kodierung or "Auto", "preisliste_mapping_json": self.mapping_json})
        return self.lieferant

    @frappe.whitelist()
    def uebernehmen(self):
        """Button „Übernehmen“ (Leitung): je markierter Zeile ein Preis mit Stand (VK/UVP) bzw. Einkaufspreis mit Gültigkeit;
        VK-Vorschläge als unfreigegebener Verkaufspreis (Quelle Eigen)."""
        self.check_permission("write")
        if not _ist_leitung():
            frappe.throw(_("Übernehmen darf nur die Leitung."))
        if self.status not in ("Geprueft",):
            frappe.throw(_("Erst prüfen, dann übernehmen."))
        n = 0
        staffeln, standard_rabatt = [], 0
        if self.preisart == "Einkaufspreis" and self.lieferant:
            lf = frappe.get_doc("PH Lieferant", self.lieferant)
            staffeln, standard_rabatt = [r.as_dict() for r in lf.rabattstaffeln], lf.standard_rabatt_promille or 0
        for z in self.zeilen:
            if not (z.uebernehmen and z.produkt and z.neu_cent):
                continue
            p = frappe.get_doc("PH Produkt", z.produkt)
            if self.preisart == "Einkaufspreis":
                for alt in p.einkaufspreise:
                    if (alt.lieferant or None) == (self.lieferant or None) and (alt.ausfuehrung or None) == (z.ausfuehrung or None) and not alt.bis and str(alt.ab) < str(self.stand):
                        alt.bis = add_days(self.stand, -1)
                p.append("einkaufspreise", {"lieferant": self.lieferant, "listen_cent": int(z.neu_cent), "rabatt_promille": 0 if z.preiskennzeichen == "netto" else rabatt_fuer(staffeln, standard_rabatt, self.marke, p.kategorie), "ab": self.stand, "waehrung": self.waehrung or "EUR", "quelle": "DataNorm" if self.format == "DataNorm" else ("IDM" if self.format == "IDM-XML" else "Herstellerliste"), "preisliste": self.name, "ausfuehrung": z.ausfuehrung, "hinweis": _("Nettopreis lt. Datei") if z.preiskennzeichen == "netto" else None})
                schon = any(str(x.ab) == str(self.stand) and x.preisart == "Verkaufspreis" and (x.ausfuehrung or None) == (z.ausfuehrung or None) for x in p.preise)
                if self.vk_vorschlag and z.vk_vorschlag_cent and not schon:
                    p.append("preise", {"ab": self.stand, "stand": self.stand, "brutto_cent": int(z.vk_vorschlag_cent), "preisart": "Verkaufspreis", "waehrung": self.waehrung or "EUR", "quelle": "Eigen", "freigegeben": 0, "ausfuehrung": z.ausfuehrung, "sku": z.hersteller_artikelnr})
            else:
                p.append("preise", {"ab": self.stand, "stand": self.stand, "brutto_cent": int(z.neu_cent), "preisart": self.preisart, "waehrung": self.waehrung or "EUR", "quelle": "Herstellerliste", "quelle_url": self.quelle if str(self.quelle or "").startswith("http") else None, "beleg": self.datei, "freigegeben": 1, "sku": z.hersteller_artikelnr, "ausfuehrung": z.ausfuehrung})
            p.import_quelle = "preisliste"
            p.import_stand = now_datetime()
            p.save()
            n += 1
        self.db_set({"status": "Uebernommen", "uebernommen_von": frappe.session.user, "uebernommen_am": now_datetime(), "protokoll": (self.protokoll or "") + "\n" + _("{0} Preise übernommen.").format(n)})
        if frappe.db.exists("Workflow State", "PH Uebernommen"):
            self.db_set("workflow_state", "PH Uebernommen")
        self.add_comment("Info", _("{0} Preise mit Stand {1} übernommen").format(n, frappe.utils.formatdate(self.stand)))
        return n


def vorschau_html(zeilen, ergebnis):
    """Kleine Vorschautabelle (escaped) für das HTML-Feld/den Dialog."""
    kopf = "".join(f"<th>{html.escape(t)}</th>" for t in ("Zeile", "Artikelnr.", "Bezeichnung", "Preis", "EAN", "Ausführung", "Zuordnung"))
    reihen = []
    for z in zeilen[:VORSCHAU_ZEILEN]:
        preis = "–" if z.get("preis_cent") is None else f"{z['preis_cent'] / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        zuo = z.get("zuordnung") or "ohne Produkt"
        farbe = "#15803d" if z.get("zuordnung") else "#b45309"
        werte = (z.get("zeile"), z.get("artikelnr"), z.get("bezeichnung"), preis, z.get("ean"), z.get("ausfuehrung"))
        reihen.append("<tr>" + "".join(f"<td>{html.escape(str(v or ''))}</td>" for v in werte) + f'<td style="color:{farbe}">{html.escape(zuo)}</td></tr>')
    hinweis = "".join(f'<p style="color:#b45309">{html.escape(h)}</p>' for h in ergebnis.get("hinweise") or [])
    return f'{hinweis}<p>{html.escape(str(ergebnis.get("format")))} · {len(zeilen)} Zeilen · {len(ergebnis.get("fehler") or [])} Fehler</p><table class="table table-bordered table-sm"><thead><tr>{kopf}</tr></thead><tbody>{"".join(reihen)}</tbody></table>'
