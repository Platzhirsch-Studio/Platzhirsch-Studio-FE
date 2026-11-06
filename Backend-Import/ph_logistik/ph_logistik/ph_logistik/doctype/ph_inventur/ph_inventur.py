"""PH Inventur – Zählliste aus Bestand, Zählung, Freigabe (Leitung) erzeugt Inventur-Bewegungen."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik.bestand_logik import inventur_differenzen
from ph_logistik.ph_logistik.inventur_logik import OHNE_PLATZ, geschaeftsjahr, platzliste, vier_augen_verletzt
from ph_logistik.ph_logistik.helfer import setze_status


class PHInventur(Document):
    def validate(self):
        art = self.inventur_art or "Stichtag"
        zusatz = {"Teilinventur": " (Teil)", "Anlass": f" ({self.anlass})" if self.anlass else " (Anlass)"}.get(art, "")
        self.titel = f"Inventur {self.lagerort} {frappe.utils.formatdate(self.datum)}{zusatz}"[:140]
        if art == "Teilinventur" and not platzliste(self.plaetze) and self.status == "Laufend":
            frappe.throw(_("Teilinventur braucht mindestens einen Platz."))
        if self.datum:
            bm = frappe.db.get_single_value("PH Logistik Einstellungen", "geschaeftsjahr_beginn_monat") or 1
            b, e = geschaeftsjahr(self.datum, bm)
            self.geschaeftsjahr = str(b.year) if b.year == e.year else f"{b.year}/{str(e.year)[2:]}"
        for p in self.positionen:
            p.differenz = (int(p.ist or 0) - int(p.soll or 0)) if p.gezaehlt else 0
            if p.gezaehlt and p.differenz and not p.grund:
                p.grund = "Sonstiges"
        n, gez, diff, summe, _bew = inventur_differenzen([p.as_dict() for p in self.positionen])
        self.anzahl_positionen, self.anzahl_gezaehlt, self.differenz_positionen, self.differenz_summe = n, gez, diff, summe

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def zaehlliste_erzeugen(self):
        """Soll-Mengen aus PH Lagerbestand des Lagerorts (nur Geplant)."""
        self.check_permission("write")
        if self.status != "Geplant":
            frappe.throw(_("Zählliste nur im Status Geplant erzeugen."))
        filt = {"lagerort": self.lagerort, "status": ("!=", "Ausgeschieden")}
        if self.nur_ausstellungsstuecke:
            filt["ausstellungsstueck"] = 1
        rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "platz", "seriennummer", "ean", "menge"], order_by="platz, produkt_name")
        if (self.inventur_art or "Stichtag") != "Stichtag" and platzliste(self.plaetze):
            # Teil-/Anlassinventur: nur die genannten Plätze („(ohne Platz)“ = Bestand ohne Platz)
            erlaubt = set(platzliste(self.plaetze))
            rows = [r for r in rows if (r.platz or OHNE_PLATZ) in erlaubt]
        elif (self.inventur_art or "Stichtag") == "Teilinventur":
            frappe.throw(_("Teilinventur: zuerst Plätze eintragen oder „Nächste Plätze vorschlagen“."))
        self.set("positionen", [])
        for r in rows:
            self.append("positionen", {"lagerbestand": r.name, "produkt": r.produkt, "produkt_name": r.produkt_name, "platz": r.platz, "seriennummer": r.seriennummer, "ean": r.ean, "soll": r.menge, "ist": 0, "gezaehlt": 0})
        self.save()
        return len(rows)

    @frappe.whitelist()
    def starten(self):
        self.check_permission("write")
        if not self.positionen:
            self.zaehlliste_erzeugen()
        if not self.gezaehlt_von:
            self.db_set("gezaehlt_von", frappe.session.user)
        setze_status(self, "Laufend")
        return self.status

    @frappe.whitelist()
    def zaehlen(self, lagerbestand, ist):
        """Eine Zeile zählen (auch mobil per Scan des Bestand-QR)."""
        self.check_permission("write")
        if self.status != "Laufend":
            frappe.throw(_("Inventur läuft nicht."))
        for p in self.positionen:
            if p.lagerbestand == lagerbestand:
                p.ist = int(ist)
                p.gezaehlt = 1
                self.save()
                return p.differenz
        frappe.throw(_("Bestand {0} ist nicht in dieser Zählliste.").format(lagerbestand))

    @frappe.whitelist()
    def zaehlen_plus(self, code, anzahl=1):
        """Stückscan: jeder Scan +anzahl (auch −1 zum Korrigieren). Atomar in der Datenbank, damit zwei Zähler am selben
        Bestand sich nicht überschreiben. code = Bestandsname (QR), Seriennummer oder EAN."""
        self.check_permission("write")
        if self.status != "Laufend":
            frappe.throw(_("Inventur läuft nicht."))
        from ph_logistik.ph_logistik.bestand_logik import zaehlen_plus as finde

        zeile, _neu = finde([p.as_dict() for p in self.positionen], code, int(anzahl))
        if not zeile:
            frappe.throw(_("Code {0} ist nicht in dieser Zählliste – „Als Fund erfassen“.").format(code))
        P = frappe.qb.DocType("PH Inventur Position")
        n = int(anzahl)
        frappe.qb.update(P).set(P.ist, P.ist + n).set(P.gezaehlt, 1).where((P.name == zeile) & (P.parent == self.name)).run()
        frappe.qb.update(P).set(P.ist, 0).where((P.name == zeile) & (P.ist < 0)).run()
        self.reload()
        self._summen_speichern()
        p = next(x for x in self.positionen if x.name == zeile)
        return {"position": zeile, "ist": p.ist, "soll": p.soll, "differenz": p.differenz}

    def _summen_speichern(self):
        """Differenzen/Summen nachziehen ohne die Zählstände zu überschreiben (nur abgeleitete Felder)."""
        for p in self.positionen:
            d = (int(p.ist or 0) - int(p.soll or 0)) if p.gezaehlt else 0
            if d != int(p.differenz or 0):
                p.db_set("differenz", d, update_modified=False)
                p.differenz = d
        n, gez, diff, summe, _bew = inventur_differenzen([p.as_dict() for p in self.positionen])
        self.db_set({"anzahl_positionen": n, "anzahl_gezaehlt": gez, "differenz_positionen": diff, "differenz_summe": summe})

    @frappe.whitelist()
    def position_hinzufuegen(self, lagerbestand=None, produkt=None, ist=1, platz=None, seriennummer=None, bemerkung=None):
        """Fund: Artikel, der nicht in der Zählliste steht. Mit Bestand (anderer Platz/Lagerort-Zeile) oder nur Produkt
        (legt eine leere Bestandszeile an diesem Lagerort an; die Freigabe bucht dann +Ist als Inventurdifferenz)."""
        self.check_permission("write")
        if self.status not in ("Geplant", "Laufend"):
            frappe.throw(_("Inventur ist abgeschlossen."))
        if not (lagerbestand or produkt):
            frappe.throw(_("Bestand oder Produkt angeben."))
        if lagerbestand:
            if any(p.lagerbestand == lagerbestand for p in self.positionen):
                frappe.throw(_("Bestand {0} steht bereits in der Zählliste.").format(lagerbestand))
            b = frappe.db.get_value("PH Lagerbestand", lagerbestand, ["name", "lagerort", "produkt", "produkt_name", "platz", "seriennummer", "ean", "menge"], as_dict=True)
            if not b:
                frappe.throw(_("Bestand {0} unbekannt.").format(lagerbestand))
            if b.lagerort != self.lagerort:
                frappe.throw(_("Bestand {0} gehört zu {1} – bitte zuerst umlagern.").format(lagerbestand, b.lagerort))
        else:
            from ph_logistik.ph_logistik.bestand import bestand_finden

            bs = bestand_finden(produkt, self.lagerort, seriennummer=seriennummer, platz=platz, anlegen=True)
            b = frappe._dict(name=bs.name, produkt=bs.produkt, produkt_name=bs.produkt_name, platz=bs.platz, seriennummer=bs.seriennummer, ean=bs.ean, menge=bs.menge)
            if any(p.lagerbestand == b.name for p in self.positionen):
                frappe.throw(_("Bestand {0} steht bereits in der Zählliste – bitte dort zählen.").format(b.name))
        self.append("positionen", {"lagerbestand": b.name, "produkt": b.produkt, "produkt_name": b.produkt_name, "platz": platz or b.platz, "seriennummer": b.seriennummer, "ean": b.ean, "soll": int(b.menge or 0), "ist": int(ist or 0), "gezaehlt": 1, "fund": 1, "grund": "Sonstiges" if int(ist or 0) != int(b.menge or 0) else None, "bemerkung": bemerkung or _("Fund")})
        self.save()
        return b.name

    @frappe.whitelist()
    def freigeben(self):
        """Leitung: Differenzen als Inventur-Bewegungen buchen, Status Abgeschlossen."""
        self.check_permission("write")
        rollen = frappe.get_roles()
        if not ({"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"} & set(rollen)):
            frappe.throw(_("Nur die Leitung gibt eine Inventur frei."))
        if self.status != "Laufend":
            frappe.throw(_("Nur laufende Inventuren können freigegeben werden."))
        vier_augen = frappe.db.get_single_value("PH Logistik Einstellungen", "inventur_vier_augen")
        if vier_augen_verletzt(self.gezaehlt_von, frappe.session.user, True if vier_augen is None else int(vier_augen)):
            frappe.throw(_("Vier-Augen: Die Freigabe erfolgt durch eine andere Person als die zählende ({0}).").format(self.gezaehlt_von))
        from ph_logistik.ph_logistik.bestand import buche

        _n, _gez, _diff, _summe, bew = inventur_differenzen([p.as_dict() for p in self.positionen])
        gebucht = 0
        for b in bew:
            buche("Inventur", b["produkt"], b["menge"], lagerort_nach=self.lagerort, lagerbestand=b["lagerbestand"], bezug_doctype="PH Inventur", bezug=self.name, grund=b.get("grund"), idempotency_key=f"inv:{self.name}:{b['lagerbestand']}", negativ_erlaubt=True)
            gebucht += 1
        # Auch Zeilen ohne Differenz erhalten das Inventurdatum
        for p in self.positionen:
            if p.gezaehlt and p.lagerbestand:
                frappe.db.set_value("PH Lagerbestand", p.lagerbestand, "inventur_am", self.datum, update_modified=False)
        self.db_set({"freigegeben_von": frappe.session.user, "freigegeben_am": now_datetime()})
        self._abdeckung_buchen()
        setze_status(self, "Abgeschlossen")
        return gebucht

    def gezaehlte_plaetze_liste(self):
        """Plätze, die diese Inventur abdeckt: Stichtag = alle aktiven Plätze des Lagerorts + Plätze der Zählliste;
        Teilinventur = eingetragene Plätze; Anlass = Plätze gezählter Positionen."""
        art = self.inventur_art or "Stichtag"
        if art == "Teilinventur":
            return platzliste(self.plaetze)
        aus_pos = [p.platz or OHNE_PLATZ for p in self.positionen if p.gezaehlt]
        if art == "Anlass":
            return platzliste("\n".join(aus_pos))
        if self.nur_ausstellungsstuecke:
            return platzliste("\n".join(aus_pos))
        alle = [r.platz for r in frappe.get_all("PH Lagerort Platz", {"parent": self.lagerort, "parenttype": "PH Lagerort", "aktiv": 1}, ["platz"])]
        return platzliste("\n".join(alle + aus_pos + [OHNE_PLATZ]))

    def _abdeckung_buchen(self):
        """Abdeckung für Bericht „PH Inventur Abdeckung“: zuletzt gezählt je Platz (bzw. Lagerort ohne Platz)."""
        try:
            plaetze = self.gezaehlte_plaetze_liste()
            self.db_set("gezaehlte_plaetze", "\n".join(plaetze), update_modified=False)
            for name, platz in frappe.get_all("PH Lagerort Platz", {"parent": self.lagerort, "parenttype": "PH Lagerort"}, ["name", "platz"], as_list=True):
                if platz in plaetze:
                    frappe.db.set_value("PH Lagerort Platz", name, {"zuletzt_gezaehlt": self.datum, "zuletzt_inventur": self.name}, update_modified=False)
            if OHNE_PLATZ in plaetze:
                frappe.db.set_value("PH Lagerort", self.lagerort, {"zuletzt_gezaehlt": self.datum, "zuletzt_inventur": self.name}, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_logistik: Inventur-Abdeckung {self.name}")

    @frappe.whitelist()
    def plaetze_vorschlagen(self, anzahl=None):
        """Button „Nächste Plätze vorschlagen“ (Teilinventur, Geplant): am längsten nicht gezählte Plätze des Lagerorts."""
        self.check_permission("write")
        if self.status != "Geplant":
            frappe.throw(_("Plätze nur im Status Geplant vorschlagen."))
        from ph_logistik.ph_logistik.inventur_plan import naechste_plaetze

        vorschlag = naechste_plaetze(self.lagerort, anzahl)
        if not vorschlag:
            frappe.throw(_("Lagerort {0} hat keine aktiven Plätze.").format(self.lagerort))
        self.inventur_art = self.inventur_art if self.inventur_art in ("Teilinventur", "Anlass") else "Teilinventur"
        self.plaetze = "\n".join(p["platz"] for p in vorschlag)
        self.set("positionen", [])
        self.save()
        return [p["platz"] for p in vorschlag]

    @frappe.whitelist()
    def verwerfen(self):
        self.check_permission("write")
        if self.status == "Abgeschlossen":
            frappe.throw(_("Abgeschlossene Inventuren bleiben bestehen."))
        setze_status(self, "Verworfen")
        return self.status
