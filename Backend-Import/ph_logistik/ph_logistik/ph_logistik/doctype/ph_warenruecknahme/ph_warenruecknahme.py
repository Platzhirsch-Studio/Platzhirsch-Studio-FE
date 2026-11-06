"""PH Warenruecknahme – Rücknahme außerhalb des Shop-Widerrufs (PH Retoure in ph_shop deckt nur Shop-Bestellungen mit Widerruf ab).

Anlässe: Projekt-Rücknahme, Falschlieferung, Kundenrückgabe, Abholung beim Kunden, Ausstellungsstück zurück.
Status: Angemeldet → Angenommen (Ware im Haus, Unterschrift/Fotos) → Geprueft (Zustand + Entscheidung je Position, Bestand gebucht)
→ Abgeschlossen (Leitung); Storniert. Buchungsplan: ruecknahme_logik.buchungen.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik import ruecknahme_logik as rl
from ph_logistik.ph_logistik.helfer import setze_status

LEITUNG = {"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"}


class PHWarenruecknahme(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Angemeldet"

    def validate(self):
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position ist nötig."))
        for p in self.positionen:
            f = rl.position_fehler(p.as_dict())
            if f:
                frappe.throw(_("Position {0}: {1}").format(p.idx, _(f)))
        if self.lieferschein and not (self.kontakt or self.kunde_name):
            ls = frappe.db.get_value("PH Lieferschein", self.lieferschein, ["kontakt", "kunde_name", "projekt", "auftrag"], as_dict=True) or {}
            self.kontakt, self.kunde_name = ls.get("kontakt"), ls.get("kunde_name")
            self.projekt, self.auftrag = self.projekt or ls.get("projekt"), self.auftrag or ls.get("auftrag")
        if self.kontakt and not self.kunde_name and frappe.db.exists("DocType", "PH Kontakt"):
            werte = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname"]) or []
            self.kunde_name = " ".join(x for x in werte if x)
        self.alle_gebucht = int(all(p.gebucht or (p.entscheidung == "Ausbuchen" and not p.produkt) for p in self.positionen) and any(p.entscheidung for p in self.positionen))
        self.titel = f"{_(self.anlass)} · {self.kunde_name or self.projekt or ''} ({len(self.positionen)} Pos.)".strip()[:140]

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def annehmen(self, unterschrift=None, unterschrift_name=None):
        """Ware ist im Haus (Abholung/Anlieferung): Zeitpunkt, optional Unterschrift des Kunden bei Abholung."""
        self.check_permission("write")
        if self.status != "Angemeldet":
            frappe.throw(_("Nur angemeldete Rücknahmen werden angenommen."))
        werte = {"eingegangen_am": now_datetime()}
        if unterschrift:
            werte.update(unterschrift_kunde=unterschrift, unterschrift_name=unterschrift_name)
        setze_status(self, "Angenommen", **werte)
        return self.status

    @frappe.whitelist()
    def pruefung_buchen(self):
        """Alle Positionen entschieden → Bestandsbuchungen (idempotent je Position) → Status Geprueft."""
        self.check_permission("write")
        if self.status not in ("Angenommen", "Geprueft"):
            frappe.throw(_("Erst annehmen, dann prüfen."))
        daten = [p.as_dict() for p in self.positionen]
        if not rl.vollstaendig(daten):
            frappe.throw(_("Bitte für jede Position Zustand und Entscheidung festlegen."))
        from ph_logistik.ph_logistik.bestand import buche
        from ph_logistik.ph_logistik.doctype.ph_lagerort.ph_lagerort import standard_lagerort

        lo = self.lagerort or standard_lagerort()
        if not lo:
            frappe.throw(_("Kein Ziel-Lagerort (Einstellungen: Standard-Lagerort)."))
        zeile = {p.name: p for p in self.positionen}
        letzte = {}
        for b in rl.buchungen(daten, lo):
            extra = {"zustand": b["zustand"], "gesperrt": b["gesperrt"]}
            if b["gesperrt"]:
                extra["sperrgrund"] = _("Rücknahme {0}: {1}").format(self.name, zeile[b["position"]].entscheidung)
            if b["art"] == "Retoure":
                bew = buche("Retoure", b["produkt"], b["menge"], lagerort_nach=lo, platz_nach=b.get("platz"), seriennummer=None, bezug_doctype=self.doctype, bezug=self.name, grund=_("Warenrücknahme {0}").format(self.name), idempotency_key=f"wr:{self.name}:{b['position']}", **extra)
                letzte[b["position"]] = bew
            else:
                vorher = letzte.get(b["position"])
                bew = buche("Ausbuchung", b["produkt"], b["menge"], lagerort_von=lo, lagerbestand=vorher.lagerbestand if vorher else None, bezug_doctype=self.doctype, bezug=self.name, grund=_("Warenrücknahme {0}: ausgebucht (defekt)").format(self.name), idempotency_key=f"wr:{self.name}:{b['position']}:aus")
            p = zeile[b["position"]]
            p.gebucht, p.lagerbewegung = 1, bew.name
        self.geprueft_von, self.geprueft_am = frappe.session.user, now_datetime()
        self.save()
        setze_status(self, "Geprueft")
        return {"status": self.status, "gebucht": sum(1 for p in self.positionen if p.gebucht)}

    @frappe.whitelist()
    def servicefall_anlegen(self, beschreibung=None):
        """Defekte Ware / an Lieferant → PH Servicefall (ph_service, nur wenn installiert)."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Servicefall"):
            frappe.throw(_("ph_service ist nicht installiert."))
        defekt = [p for p in self.positionen if p.zustand == "Defekt" or p.entscheidung == "An Lieferant"]
        text = beschreibung or _("Rücknahme {0}: {1}").format(self.name, ", ".join(f"{p.beschreibung} ({p.zustand or '-'})" for p in defekt) or self.grund or "")
        fn = frappe.get_attr("ph_service.ph_service.doctype.ph_servicefall.ph_servicefall.aus_dokument")
        name = fn(self.doctype, self.name, beschreibung=text, art="Mangel", produkt=defekt[0].produkt if defekt else None)
        self.db_set("servicefall_ref", name)
        return name

    @frappe.whitelist()
    def retourenetikett(self, tarif_id=None):
        """Button „Retourenetikett“: Rücksendung per LetMeShip zum Lieferschein dieser Rücknahme (Mengen = Rücknahme)."""
        self.check_permission("write")
        if self.status not in ("Angemeldet", "Angenommen"):
            frappe.throw(_("Retourenetikett nur vor der Prüfung (Angemeldet/Angenommen)."))
        if not self.lieferschein:
            frappe.throw(_("Retourenetikett braucht einen Lieferschein (Lieferadresse) – sonst Abholung per Tour planen."))
        from ph_logistik.letmeship import ShippingError
        from ph_logistik.letmeship.dienst import retourenlabel_erzeugen

        ls = frappe.get_doc("PH Lieferschein", self.lieferschein)
        try:
            s = retourenlabel_erzeugen(ls, warenruecknahme=self.name, menge_zurueck=sum(int(p.menge or 0) for p in self.positionen), tarif_id=tarif_id)
        except ShippingError as e:
            frappe.throw(_("Retourenetikett nicht möglich ({0}{1}).").format(e.code, f": {e.detail}" if e.detail else ""))
        self.db_set("retourenlabel", s.name)
        return s.name

    @frappe.whitelist()
    def gutschrift_erstellen(self):
        """Button „Gutschrift erstellen“ (Leitung): Gutschrift-Entwurf in ph_faktura (gutschrift_hinweis als Grund)."""
        self.check_permission("write")
        if not (LEITUNG & set(frappe.get_roles())):
            frappe.throw(_("Gutschrift aus der Rücknahme erstellt die Leitung."))
        if self.gutschrift and frappe.db.exists("PH Gutschrift", self.gutschrift):
            return self.gutschrift
        fn = frappe.get_attr("ph_faktura.api.create_credit_note_from_return")
        name = fn(self.name)
        self.db_set("gutschrift", name)
        self.add_comment("Info", _("Gutschrift {0} (Entwurf) erstellt.").format(name))
        return name

    @frappe.whitelist()
    def abschliessen(self):
        self.check_permission("write")
        if not (LEITUNG & set(frappe.get_roles())):
            frappe.throw(_("Abschließen darf nur die Leitung (Gutschrift/Wertminderung geprüft)."))
        if self.status != "Geprueft":
            frappe.throw(_("Nur geprüfte Rücknahmen werden abgeschlossen."))
        setze_status(self, "Abgeschlossen", abgeschlossen_am=now_datetime())
        return self.status

    @frappe.whitelist()
    def stornieren(self, grund):
        self.check_permission("write")
        if any(p.gebucht for p in self.positionen):
            frappe.throw(_("Bereits gebuchte Rücknahmen: Bewegungen stornieren (Leitung), dann erneut versuchen."))
        setze_status(self, "Storniert", storno_grund=grund)
        return self.status


def aus_lieferschein(lieferschein):
    """Rücknahme mit den Positionen eines (zugestellten) Lieferscheins anlegen – Mengen/Entscheidungen werden danach angepasst."""
    frappe.has_permission("PH Warenruecknahme", "create", throw=True)
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    doc = frappe.new_doc("PH Warenruecknahme")
    doc.update({"anlass": "Kundenrueckgabe", "lieferschein": ls.name, "kontakt": ls.kontakt, "kunde_name": ls.kunde_name, "projekt": ls.projekt, "auftrag": ls.auftrag})
    for p in ls.positionen:
        doc.append("positionen", {"produkt": p.produkt, "beschreibung": p.beschreibung, "ausfuehrung_text": p.ausfuehrung_text, "seriennummer": p.seriennummer, "menge": int(p.menge or 1), "lieferschein_position": p.name})
    doc.insert()
    return doc.name
