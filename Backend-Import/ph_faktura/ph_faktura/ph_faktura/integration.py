"""Integration Runde 3: Gutschriften aus ph_shop/ph_logistik, Angebot aus ph_service Pflegevertrag,
Lieferanten-Gutschrift ↔ Lieferantenregress, Ausbuchung einer Regress-Differenz.

Reine Rechenlogik: ph_faktura/rechenwerk/integration.py (unit-getestet). Feldnamen der Gegenseite geprüft 04.11.:
- ph_shop PH Bestellung Erstattung: art, betrag_cent, ust_cent, satz_json {posten[{satz_promille, brutto_cent,
  ust_cent, netto_cent}], versand, zeilen}, grund, zahlungen, gutschein_gutschrift_cent, gutschrift (Belegnummer)
  – Hook-Signatur fn(bestellung_doc, erstattung_zeile) → Belegnummer (ph_shop hooks.py, PHBestellung._gutschrift_anstossen).
- ph_logistik PH Warenruecknahme: auftrag, lieferschein, kontakt, gutschrift_hinweis, positionen[produkt, beschreibung,
  menge, lieferschein_position, entscheidung]; PH Lieferschein Position.beleg_position = AB-Position.
- ph_service PH Lieferantenregress: gutschrift_erfassen(betrag_cent, nummer, datum, beleg, eingangsrechnung),
  abgleich_status (Ausgebucht), differenz_cent (soll − ist), ausgebucht_grund, ausgebucht_von, lieferant.
- ph_service PH Pflege Abo: art, bereich, kontakt, kunde_name, projekt, strasse/plz/ort/land, intervall_monate,
  leistungen, preis_cent (brutto je Termin), abrechnung, mindestlaufzeit_monate, kuendigungsfrist_monate, stuecke, angebot.
"""

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, nowdate

from ph_faktura import einstellungen, journal
from ph_faktura.rechenwerk import integration as IR

RECHNUNG_ARTEN_WARE = ("Rechnung", "Teilrechnung", "Schlussrechnung", "Barverkauf")


def _fehler(e):
    frappe.throw(str(e), title=_("Faktura"))


# ── Shop-Erstattung → Gutschrift (Hook ph_shop_gutschrift_erstellen) ─────────

def gutschrift_aus_bestellung(bestellung_doc, erstattung_zeile):
    """Gutschrift zur Rechnung der Bestellung je erstattetem USt-Satz; gestellt und als „Erstattet“ markiert
    (das Geld floss bereits über ph_shop). Ohne Rechnung (z. B. Shop ohne Barverkaufsrechnung) → None, Kommentar.
    Idempotent je Erstattungszeile. → Gutschriftnummer"""
    key = f"shop-erstattung:{erstattung_zeile.name}"
    vorhanden = frappe.db.get_value("PH Gutschrift", {"idempotency_key": key}, ["name", "nummer"], as_dict=True)
    if vorhanden:
        return vorhanden.nummer or vorhanden.name
    rechnung = frappe.db.get_value("PH Rechnung", {"bestellung": bestellung_doc.name, "docstatus": 1, "status": ("!=", "Storniert")}, "name", order_by="creation desc")
    if not rechnung:
        bestellung_doc.add_comment("Info", _("Keine Gutschrift erstellt: Bestellung hat keine Rechnung in ph_faktura (Erstattung {0} Cent).").format(cint(erstattung_zeile.betrag_cent)))
        return None
    try:
        positionen = IR.gutschrift_positionen_aus_erstattung(erstattung_zeile.satz_json, erstattung_zeile.art, bestellung_doc.name)
    except IR.IntegrationFehler as e:
        _fehler(e)
    g = frappe.new_doc("PH Gutschrift")
    g.update({"art": IR.gutschrift_art_aus_erstattung(erstattung_zeile.art), "rechnung": rechnung, "datum": nowdate(), "bestellung": bestellung_doc.name,
              "grund": (erstattung_zeile.grund or _("Shop-Erstattung {0}").format(erstattung_zeile.art))[:500], "erstattung_art": "Rückzahlung",
              "quelle": "shop", "idempotency_key": key})
    for p in positionen:
        g.append("positionen", p)
    g.flags.ignore_permissions = True
    g.insert(ignore_permissions=True)
    g.submit()
    werte = {"status": "Erstattet", "erstattet_cent": cint(g.brutto_cent)}
    zahlung = (erstattung_zeile.zahlungen or "").split(",")[0].strip()
    if zahlung and frappe.db.exists("PH Zahlung", zahlung):
        werte["erstattung"] = zahlung
    g.db_set(werte, update_modified=False)
    if cint(g.brutto_cent) != cint(erstattung_zeile.betrag_cent):
        g.add_comment("Info", _("Rundung netto/brutto: Gutschrift {0} Cent, Erstattung {1} Cent.").format(g.brutto_cent, erstattung_zeile.betrag_cent))
    return g.nummer or g.name


# ── Warenrücknahme (ph_logistik) → Gutschrift-Entwurf ─────────────────────────

def _rechnungen_zur_ruecknahme(wr):
    namen = []
    if wr.get("lieferschein") and frappe.db.exists("PH Lieferschein", wr.lieferschein):
        ls = frappe.db.get_value("PH Lieferschein", wr.lieferschein, ["teilrechnung", "bestellung", "auftrag"], as_dict=True) or {}
        if ls.get("teilrechnung"):
            namen.append(ls.teilrechnung)
        if ls.get("bestellung"):
            namen += frappe.get_all("PH Rechnung", filters={"bestellung": ls.bestellung, "docstatus": 1}, pluck="name", order_by="creation desc")
    auftrag = wr.get("auftrag")
    if auftrag:
        namen += frappe.get_all("PH Rechnung", filters={"auftrag": auftrag, "docstatus": 1, "art": ("in", RECHNUNG_ARTEN_WARE)}, pluck="name", order_by="creation desc")
    gueltig = []
    for n in dict.fromkeys(namen):
        st = frappe.db.get_value("PH Rechnung", n, ["status", "docstatus"], as_dict=True)
        if st and st.docstatus == 1 and st.status != "Storniert":
            gueltig.append(n)
    return gueltig


def _bereits_gutgeschrieben(rechnung, re_positionen):
    """Menge je Rechnungsposition aus bisherigen (nicht stornierten) Gutschriften dieser Rechnung (Zuordnung AB-Position/Produkt)."""
    out = {}
    gs = frappe.get_all("PH Gutschrift", filters={"rechnung": rechnung, "docstatus": ("<", 2), "art": ("!=", "Storno")}, pluck="name")
    if not gs:
        return out
    for z in frappe.get_all("PH Beleg Position", filters={"parenttype": "PH Gutschrift", "parent": ("in", gs)}, fields=["ab_position", "produkt", "menge"]):
        treffer = next((p for p in re_positionen if (z.ab_position and p["ab_position"] == z.ab_position) or (not z.ab_position and z.produkt and p["produkt"] == z.produkt)), None)
        if treffer:
            out[treffer["name"]] = out.get(treffer["name"], 0) + flt(z.menge)
    return out


def gutschrift_aus_warenruecknahme(warenruecknahme):
    """Gutschrift-Entwurf (Teilgutschrift) zur zugehörigen Rechnung für die zurückgenommenen Positionen.
    Die Leitung prüft und stellt (Button „Stellen“). Idempotent je Warenrücknahme. → Name der Gutschrift"""
    frappe.has_permission("PH Gutschrift", "create", throw=True)
    key = f"warenruecknahme:{warenruecknahme}"
    vorhanden = frappe.db.get_value("PH Gutschrift", {"idempotency_key": key, "docstatus": ("<", 2)}, "name")
    if vorhanden:
        return vorhanden
    wr = frappe.get_doc("PH Warenruecknahme", warenruecknahme)
    if wr.status in ("Angemeldet", "Storniert"):
        frappe.throw(_("Gutschrift erst nach Annahme der Ware (Status {0}).").format(_(wr.status)))
    rueck = []
    for p in wr.positionen:
        ab = frappe.db.get_value("PH Lieferschein Position", p.lieferschein_position, "beleg_position") if p.get("lieferschein_position") and frappe.db.exists("PH Lieferschein Position", p.lieferschein_position) else None
        rueck.append({"produkt": p.produkt, "beschreibung": p.beschreibung, "menge": cint(p.menge), "ab_position": ab, "entscheidung": p.entscheidung})
    rechnungen = _rechnungen_zur_ruecknahme(wr)
    if not rechnungen:
        frappe.throw(_("Keine gestellte Rechnung zu Auftrag/Lieferschein gefunden – Gutschrift manuell anlegen."))
    letzter = None
    for rechnung in rechnungen:
        re_pos = [p.as_dict() for p in frappe.get_doc("PH Rechnung", rechnung).positionen if p.art not in ("Text", "Zwischensumme", "Rabatt")]
        try:
            positionen = IR.ruecknahme_positionen(re_pos, rueck, _bereits_gutgeschrieben(rechnung, re_pos))
        except IR.IntegrationFehler as e:
            letzter = e
            continue
        g = frappe.new_doc("PH Gutschrift")
        grund = wr.gutschrift_hinweis or wr.grund or _("Warenrücknahme {0} ({1})").format(wr.name, _(wr.anlass or ""))
        g.update({"art": "Teilgutschrift", "rechnung": rechnung, "datum": nowdate(), "grund": str(grund)[:500], "warenruecknahme": wr.name,
                  "erstattung_art": "Verrechnung mit offener Rechnung" if cint(frappe.db.get_value("PH Rechnung", rechnung, "offen_cent")) > 0 else "Rückzahlung",
                  "quelle": "backoffice", "idempotency_key": key})
        for p in positionen:
            p.pop("rechnung_position", None)
            g.append("positionen", p)
        g.insert()
        return g.name
    frappe.throw(str(letzter or _("Keine passende Rechnungsposition.")))


# ── Pflege-/Wartungsvertrag (ph_service) → Angebot ───────────────────────────

def angebot_aus_pflege_abo(pflege_abo):
    """Angebot (Entwurf) aus PH Pflege Abo; Rückverweis PH Pflege Abo.angebot. Idempotent: offenes Angebot wird zurückgegeben."""
    frappe.has_permission("PH Angebot", "create", throw=True)
    if not frappe.db.exists("DocType", "PH Pflege Abo"):
        frappe.throw(_("ph_service ist nicht installiert."))
    abo = frappe.get_doc("PH Pflege Abo", pflege_abo)
    if abo.get("angebot") and frappe.db.exists("PH Angebot", {"name": abo.angebot, "status": ("not in", ("Abgelehnt", "Abgelaufen", "Ersetzt"))}):
        return abo.angebot
    if not abo.kontakt:
        frappe.throw(_("Pflegevertrag ohne Kontakt – zuerst Kunden zuordnen."))
    try:
        positionen = IR.pflege_angebot_positionen({**abo.as_dict(), "stuecke": [s.as_dict() for s in (abo.get("stuecke") or [])]})
    except IR.IntegrationFehler as e:
        _fehler(e)
    e = einstellungen.faktura()
    an = frappe.new_doc("PH Angebot")
    an.update({"kontakt": abo.kontakt, "kunde_name": abo.kunde_name, "projekt": abo.get("projekt"), "datum": nowdate(), "gueltig_bis": add_days(nowdate(), e["angebot_gueltig_tage"]),
               "strasse": abo.get("strasse"), "plz": abo.get("plz"), "ort": abo.get("ort"), "land": abo.get("land"), "pflege_abo": abo.name, "quelle": "backoffice",
               "zugewiesen_an": abo.get("berater") or frappe.session.user,
               "einleitung": _("Gerne bieten wir Ihnen den folgenden {0} an.").format(_(abo.art or "Pflegevertrag"))})
    for p in positionen:
        an.append("positionen", p)
    an.insert()
    frappe.db.set_value("PH Pflege Abo", abo.name, "angebot", an.name, update_modified=False)
    abo.add_comment("Info", _("Angebot {0} erstellt.").format(an.name))
    return an.name


# ── Lieferanten-Gutschrift ↔ Lieferantenregress (ph_service) ─────────────────

def regress_pruefen(er):
    """validate der Eingangsrechnung: Regress existiert, Lieferant passt (wenn beide gesetzt)."""
    if not er.get("lieferantenregress"):
        return
    if (er.get("belegart") or "Rechnung") != "Gutschrift":
        frappe.throw(_("Lieferantenregress nur bei Belegart Gutschrift."))
    if not frappe.db.exists("DocType", "PH Lieferantenregress") or not frappe.db.exists("PH Lieferantenregress", er.lieferantenregress):
        frappe.throw(_("Lieferantenregress {0} nicht gefunden.").format(er.lieferantenregress))
    lieferant = frappe.db.get_value("PH Lieferantenregress", er.lieferantenregress, "lieferant")
    if lieferant and er.get("lieferant") and lieferant != er.lieferant:
        frappe.throw(_("Regress {0} gehört zu Lieferant {1}, die Gutschrift zu {2}.").format(er.lieferantenregress, lieferant, er.lieferant))


def regress_gutschrift_buchen(er):
    """Freigegebene Lieferanten-Gutschrift im Regress erfassen (Netto, Belastung ist netto) – einmalig (regress_gebucht).
    → Ergebnis von gutschrift_erfassen oder None; Fehler → Meldung, Freigabe bleibt."""
    if not er.get("lieferantenregress") or cint(er.get("regress_gebucht")) or (er.get("belegart") or "Rechnung") != "Gutschrift":
        return None
    try:
        reg = frappe.get_doc("PH Lieferantenregress", er.lieferantenregress)
        reg.flags.ignore_permissions = True  # Faktura-Leitung bucht, Service-Recht nicht nötig (has_permission → flags)
        r = reg.gutschrift_erfassen(betrag_cent=IR.regress_betrag(er.netto_cent, er.brutto_cent), nummer=er.rechnungsnummer_lieferant, datum=er.datum, beleg=er.datei, eingangsrechnung=er.name)
    except frappe.ValidationError as e:
        frappe.msgprint(_("Gutschrift ist freigegeben, aber nicht im Regress erfasst: {0}").format(str(e)[:200]), indicator="orange")
        return None
    er.db_set("regress_gebucht", 1, update_modified=False)
    er.add_comment("Info", _("Im Lieferantenregress {0} erfasst – Abgleich {1}, Differenz {2} Cent.").format(er.lieferantenregress, _(r.get("abgleich_status") or ""), r.get("differenz_cent")))
    return r


def regress_aktualisiert(doc, method=None):
    """doc_event PH Lieferantenregress.on_update: Ausbuchung einer Unterdeckung (differenz_ausbuchen, Leitung) einmalig ins
    Buchungsjournal (Vorgang „Ausbuchung“) – Grundlage der Export-Zeile im PH Export Lauf. Wirft nie."""
    try:
        if doc.get("abgleich_status") != "Ausgebucht" or cint(doc.get("differenz_cent")) <= 0 or not doc.get("ausgebucht_grund"):
            return
        if frappe.db.exists("PH Buchungsjournal", {"vorgang": "Ausbuchung", "beleg_doctype": doc.doctype, "beleg": doc.name}):
            return
        journal.schreibe("Ausbuchung", doc, -cint(doc.differenz_cent), _("Regress-Differenz ausgebucht ({0}): {1}").format(doc.get("ausgebucht_von") or frappe.session.user, doc.ausgebucht_grund))
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Faktura: Regress-Ausbuchung {doc.name}")


def ausbuchung_zeilen(von, bis, nur_neue, e, kreditor_nr):
    """Export-Zeilen für ausgebuchte Regress-Differenzen im Zeitraum (Journal „Ausbuchung“). nur_neue: ohne bereits übergebene."""
    if not frappe.db.exists("DocType", "PH Lieferantenregress"):
        return []
    zeilen = []
    for j in frappe.get_all("PH Buchungsjournal", filters={"vorgang": "Ausbuchung", "beleg_doctype": "PH Lieferantenregress", "zeitpunkt": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}, fields=["beleg", "betrag_cent", "zeitpunkt", "details"]):
        if nur_neue and frappe.db.exists("PH Export Protokoll", {"beleg_doctype": "PH Lieferantenregress", "beleg": j.beleg, "status": "uebergeben"}):
            continue
        reg = frappe.db.get_value("PH Lieferantenregress", j.beleg, ["lieferant", "ausgebucht_grund"], as_dict=True) or {}
        name = frappe.db.get_value("PH Lieferant", reg.get("lieferant"), "firmenname") if reg.get("lieferant") and frappe.db.exists("DocType", "PH Lieferant") else reg.get("lieferant")
        try:
            zeilen.append(IR.regress_ausbuchung_zeile(j.beleg, name, frappe.utils.getdate(j.zeitpunkt), -cint(j.betrag_cent), kreditor_nr(reg.get("lieferant"), e), e.get("konto_regress_ausbuchung") or "7800", reg.get("ausgebucht_grund")))
        except IR.IntegrationFehler:
            continue
    return zeilen


def inventurbewertung_zeilen(von, bis, nur_neue):
    """Export-Zeilen „Bestandsveränderung“ aus festgeschriebenen PH Inventurbewertungen (ph_logistik) mit Stichtag im Zeitraum.
    Vorschlag für die Kanzlei (Konten aus der Bewertung = PH Logistik Einstellungen, Platzhalter). nur_neue: ohne bereits exportierte."""
    if not frappe.db.exists("DocType", "PH Inventurbewertung"):
        return []
    filt = {"status": "Festgeschrieben", "stichtag": ("between", [von, bis])}
    if nur_neue:
        filt["export_status"] = "offen"
    zeilen = []
    for b in frappe.get_all("PH Inventurbewertung", filters=filt, fields=["name", "stichtag", "lagerort", "bestandsveraenderung_cent", "konto_bestand", "konto_bestandsveraenderung"]):
        try:
            zeilen.append(IR.bestandsveraenderung_zeile(b.name, frappe.utils.getdate(b.stichtag), cint(b.bestandsveraenderung_cent), b.konto_bestand, b.konto_bestandsveraenderung,
                                                        f"Bestandsveränderung Inventur {frappe.utils.formatdate(b.stichtag)} {b.lagerort or 'alle Lagerorte'} ({b.name})"))
        except IR.IntegrationFehler:
            continue
    return zeilen
