"""Meldebestand und Nachbestellvorschlag (Frappe). Rechenregeln in nachbestellung_logik.py.

Ablauf: PH Meldebestand (Regel je Produkt/Ausführung/Lagerort) → täglich 05:45 `vorschlaege_erzeugen` (Kennzahlen je Regel,
PH Bestellvorschlag „Offen“ bei verfuegbar ≤ Meldebestand, „Erledigt“ wenn wieder darüber, Aufgabe an die Leitung) →
Listen-Button „Herstellerbestellung aus Vorschlägen“ (`bestellungen_aus_vorschlaegen`) → `ph_sortiment.api.bestellungen_sammeln`
(Entwurf je Lieferant, Position.bezug_zeile = Vorschlag) → Vorschlag „Bestellt“.
Ausstellungsstücke werden nie nachbestellt; Ersatzteile disponiert ph_service.
"""

import json

import frappe
from frappe import _
from frappe.utils import add_days, cint, now_datetime, nowdate

from . import nachbestellung_logik as NL
from .helfer import einstellungen

HB_OFFEN = ("Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert")
ROLLEN_BESTELLEN = {"PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"}


def _bestandszeilen(produkt, ausfuehrung, lagerort):
    filt = {"produkt": produkt, "lagerort": lagerort, "status": ("not in", ["Ausgeschieden", "Verkauft"])}
    if ausfuehrung:
        filt["ausfuehrung"] = ausfuehrung
    return frappe.get_all("PH Lagerbestand", filt, ["menge", "reserviert", "kommission", "gesperrt", "ausstellungsstueck"])


def _offen_bestellt(produkt, ausfuehrung, lagerort, regeln_je_produkt, e):
    if not frappe.db.exists("DocType", "PH Herstellerbestellung"):
        return 0
    H = frappe.qb.DocType("PH Herstellerbestellung")
    P = frappe.qb.DocType("PH Herstellerbestellung Position")
    q = (frappe.qb.from_(P).join(H).on(P.parent == H.name)
         .select(P.menge, P.menge_erhalten, P.kommission, H.lieferadresse)
         .where((P.parenttype == "PH Herstellerbestellung") & (P.produkt == produkt) & (H.status.isin(list(HB_OFFEN)))
                & (P.status.isnull() | P.status.notin(["Geliefert", "Storniert"]))))
    if ausfuehrung:
        q = q.where(P.ausfuehrung == ausfuehrung)
    rows = q.run(as_dict=True)
    return NL.offene_menge(rows, lagerort, regeln_je_produkt, e.get("standard_lagerort"), e.get("showroom_lagerort"))


def _wbz(regel, lieferant):
    """(tage, quelle) aus Regel, PH Lieferant Lieferzeit (Marke/Kategorie), Produkt, Lieferant-Standard."""
    from ph_sortiment.logik.bestellung import lieferzeit_fuer

    lief_bis = std = None
    if lieferant and frappe.db.exists("PH Lieferant", lieferant):
        regeln = frappe.get_all("PH Lieferant Lieferzeit", {"parent": lieferant, "parenttype": "PH Lieferant"}, ["marke", "kategorie", "wochen_von", "wochen_bis"])
        std = frappe.db.get_value("PH Lieferant", lieferant, "lieferzeit_wochen_standard")
        lief_bis = lieferzeit_fuer(regeln, regel.get("marke"), regel.get("kategorie"), None)[1]
    prod_bis = frappe.db.get_value("PH Produkt", regel.get("produkt"), "lieferzeit_wochen_bis") if regel.get("produkt") else None
    return NL.wiederbeschaffung_tage(regel.get("wiederbeschaffung_tage"), lief_bis, prod_bis, std)


def lieferant_fuer(regel):
    if regel.get("lieferant"):
        return regel.get("lieferant")
    marke = regel.get("marke") or frappe.db.get_value("PH Produkt", regel.get("produkt"), "marke")
    return frappe.db.get_value("PH Marke", marke, "lieferant") if marke else None


def _abgang(produkt, ausfuehrung, lagerort, tage):
    filt = {"produkt": produkt, "art": "Verkauf", "status": "Gebucht", "lagerort_von": lagerort, "datum": (">=", add_days(nowdate(), -int(tage or 90)))}
    if ausfuehrung:
        filt["ausfuehrung"] = ausfuehrung
    return sum(cint(r.menge) for r in frappe.get_all("PH Lagerbewegung", filt, ["menge"]))


def berechnen(regel, e=None):
    """Kennzahlen einer Regel (dict oder Doc) → dict mit allen Feldern für Regel/Vorschlag/Bericht."""
    e = e or einstellungen()
    r = regel.as_dict() if hasattr(regel, "as_dict") else frappe._dict(regel)
    anzahl = frappe.db.count("PH Meldebestand", {"produkt": r.produkt, "status": "Aktiv"}) or 1
    k = NL.disponierbar(_bestandszeilen(r.produkt, r.ausfuehrung, r.lagerort), _offen_bestellt(r.produkt, r.ausfuehrung, r.lagerort, anzahl, e))
    lieferant = lieferant_fuer(r)
    wbz, quelle = _wbz(r, lieferant)
    k.update(
        lieferant=lieferant,
        wiederbeschaffung_tage=wbz,
        wbz_quelle=quelle,
        unter_meldebestand=int(NL.unter_meldebestand(k["verfuegbar"], r.meldebestand, r.zielbestand)),
        vorschlag_menge=NL.vorschlag_menge(k["verfuegbar"], r.meldebestand, r.zielbestand, r.bestellmenge_min, r.verpackungseinheit),
        empfehlung_meldebestand=NL.meldebestand_empfehlung(_abgang(r.produkt, r.ausfuehrung, r.lagerort, e.get("meldebestand_verbrauch_tage") or 90), e.get("meldebestand_verbrauch_tage") or 90, wbz, r.sicherheit_tage),
    )
    return k


def _ek(produkt, ausfuehrung, lieferant):
    try:
        from ph_sortiment.logik.kalkulation import gueltiger_ek

        prod = frappe.get_doc("PH Produkt", produkt)
        z = gueltiger_ek([x.as_dict() for x in prod.einkaufspreise if not x.ausfuehrung or x.ausfuehrung == ausfuehrung], nowdate(), lieferant)
        ek = z.get("netto_ek_cent") if z else prod.einkaufspreis_cent
        if ek is not None and ausfuehrung:
            ek += cint(frappe.db.get_value("PH Produkt Ausfuehrung", ausfuehrung, "ek_aufpreis_cent"))
        return cint(ek) if ek is not None else None
    except Exception:  # noqa: BLE001
        return None


def regel_pruefen(name, e=None, erzeugen=True):
    """Eine Regel neu rechnen, Vorschlag anlegen/aktualisieren/erledigen. → (Vorschlag-Name|None, neu: bool)."""
    regel = frappe.get_doc("PH Meldebestand", name)
    k = berechnen(regel, e)
    werte = {f: k.get(f) for f in ("bestand", "reserviert", "kommission", "gesperrt", "offen_bestellt", "verfuegbar", "unter_meldebestand", "empfehlung_meldebestand", "wbz_quelle")}
    werte["berechnet_am"] = now_datetime()
    regel.db_set(werte, update_modified=False)
    offen = frappe.db.get_value("PH Bestellvorschlag", {"meldebestand_regel": name, "status": "Offen"}, "name")
    if regel.status != "Aktiv" or not k["unter_meldebestand"]:
        if offen:
            v = frappe.get_doc("PH Bestellvorschlag", offen)
            v.db_set({"status": "Erledigt", "verfuegbar": k["verfuegbar"], "bemerkung": ((v.bemerkung or "") + "\n" + _("Verfügbarer Bestand wieder über Meldebestand ({0}).").format(k["verfuegbar"])).strip()})
        return offen, False
    if not erzeugen:
        return offen, False
    felder = {f: k.get(f) for f in ("bestand", "reserviert", "kommission", "gesperrt", "offen_bestellt", "verfuegbar", "wiederbeschaffung_tage")}
    felder.update(meldebestand=regel.meldebestand, zielbestand=regel.zielbestand, bestellmenge_min=regel.bestellmenge_min,
                  voraussichtlich_am=add_days(nowdate(), k["wiederbeschaffung_tage"]) if k.get("wiederbeschaffung_tage") else None)
    ek = _ek(regel.produkt, regel.ausfuehrung, k.get("lieferant"))
    if offen:
        v = frappe.get_doc("PH Bestellvorschlag", offen)
        if not v.menge_manuell:
            felder["vorschlag_menge"] = k["vorschlag_menge"]
        felder["ek_cent"] = ek
        felder["wert_cent"] = (ek or 0) * cint(felder.get("vorschlag_menge", v.vorschlag_menge))
        if not v.lieferant and k.get("lieferant"):
            felder["lieferant"] = k["lieferant"]
        v.db_set(felder)
        return offen, False
    v = frappe.get_doc({"doctype": "PH Bestellvorschlag", "meldebestand_regel": name, "produkt": regel.produkt, "produkt_name": regel.produkt_name, "ausfuehrung": regel.ausfuehrung,
                        "marke": regel.marke, "lagerort": regel.lagerort, "lieferant": k.get("lieferant"), "vorschlag_menge": k["vorschlag_menge"], "ek_cent": ek,
                        "wert_cent": (ek or 0) * k["vorschlag_menge"], "quelle": "scheduler", "idempotency_key": f"bv:{name}:{nowdate()}", **felder})
    if frappe.db.exists("PH Bestellvorschlag", {"idempotency_key": v.idempotency_key}):
        return frappe.db.get_value("PH Bestellvorschlag", {"idempotency_key": v.idempotency_key}, "name"), False
    v.insert(ignore_permissions=True)
    regel.db_set("letzter_vorschlag", v.name, update_modified=False)
    return v.name, True


def vorschlaege_erzeugen():
    """Scheduler täglich 05:45: alle aktiven Regeln prüfen (commit je Regel), Aufgabe an die Leitung bei neuen Vorschlägen."""
    e = einstellungen()
    if not cint(e.get("meldebestand_aktiv") if e.get("meldebestand_aktiv") is not None else 1):
        return 0
    neu = []
    for name in frappe.get_all("PH Meldebestand", {"status": "Aktiv"}, pluck="name"):
        try:
            v, ist_neu = regel_pruefen(name, e)
            if ist_neu:
                neu.append(v)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_logistik: Meldebestand {name}")
    # Inaktive Regeln: offene Vorschläge erledigen
    for name in frappe.get_all("PH Bestellvorschlag", {"status": "Offen", "meldebestand_regel": ("in", frappe.get_all("PH Meldebestand", {"status": "Inaktiv"}, pluck="name") or [""])}, pluck="name"):
        frappe.db.set_value("PH Bestellvorschlag", name, "status", "Erledigt")
    if neu and cint(e.get("meldebestand_aufgabe") if e.get("meldebestand_aufgabe") is not None else 1):
        from .tasks import _aufgabe

        _aufgabe(_("{0} neue Nachbestellvorschläge (Lagerware unter Meldebestand) – {1}").format(len(neu), nowdate()), "PH Bestellvorschlag", neu[0])
    frappe.db.commit()
    return len(neu)


@frappe.whitelist()
def jetzt_pruefen(regel=None):
    """Button (Liste/Regel): sofort rechnen. Ohne regel alle aktiven Regeln."""
    frappe.has_permission("PH Meldebestand", "write", throw=True)
    if regel:
        v, neu = regel_pruefen(regel)
        return {"vorschlag": v, "neu": int(neu)}
    return {"neu": vorschlaege_erzeugen()}


@frappe.whitelist(methods=["POST"])
def bestellungen_aus_vorschlaegen(namen, idempotency_key=None):
    """Button „Herstellerbestellung aus Vorschlägen“: offene Vorschläge → ph_sortiment.api.bestellungen_sammeln
    (Entwurf je Lieferant, Lagerware ohne Kommission). Nur Leitung/Admin. → Antwort von bestellungen_sammeln + zugeordnet."""
    if not ROLLEN_BESTELLEN & set(frappe.get_roles()):
        frappe.throw(_("Nur die Logistik-Leitung bestellt aus Vorschlägen."), frappe.PermissionError)
    if isinstance(namen, str):
        namen = json.loads(namen) if namen.strip().startswith("[") else [namen]
    vorschlaege = [frappe.get_doc("PH Bestellvorschlag", n) for n in namen or []]
    offen = [v for v in vorschlaege if v.status == "Offen" and cint(v.vorschlag_menge) > 0]
    if not offen:
        frappe.throw(_("Keine offenen Vorschläge mit Menge ausgewählt."))
    from ph_sortiment.api import bestellungen_sammeln

    positionen = [{"produkt": v.produkt, "ausfuehrung": v.ausfuehrung, "bezeichnung": v.produkt_name, "lieferant": v.lieferant, "menge": cint(v.vorschlag_menge),
                   "wunschtermin": v.voraussichtlich_am, "bezug_zeile": v.name} for v in offen]
    key = idempotency_key or "bv:" + frappe.generate_hash("|".join(sorted(v.name for v in offen)), 12)
    erg = bestellungen_sammeln(positionen, idempotency_key=key)
    je_lieferant = {b["lieferant"]: b["name"] for b in erg.get("bestellungen") or []}
    zugeordnet = []
    for v in offen:
        hb = je_lieferant.get(v.lieferant) or frappe.db.get_value("PH Herstellerbestellung Position", {"bezug_zeile": v.name, "parenttype": "PH Herstellerbestellung"}, "parent")
        if hb:
            v.db_set({"status": "Bestellt", "herstellerbestellung": hb, "bestellt_am": now_datetime(), "bestellt_von": frappe.session.user})
            zugeordnet.append({"vorschlag": v.name, "herstellerbestellung": hb})
    erg["zugeordnet"] = zugeordnet
    return erg


def alle_berechnen(filters=None):
    """Bericht „PH Nachbestellvorschlag“: Live-Rechnung über alle (gefilterten) Regeln, ohne zu schreiben."""
    f = frappe._dict(filters or {})
    filt = {"status": "Aktiv"}
    for k in ("lagerort", "marke", "produkt"):
        if f.get(k):
            filt[k] = f.get(k)
    e = einstellungen()
    zeilen = []
    for r in frappe.get_all("PH Meldebestand", filt, ["name", "produkt", "produkt_name", "ausfuehrung", "marke", "kategorie", "lagerort", "lieferant", "wiederbeschaffung_tage",
                                                     "meldebestand", "zielbestand", "bestellmenge_min", "verpackungseinheit", "sicherheit_tage", "status"]):
        k = berechnen(r, e)
        if f.get("lieferant") and k.get("lieferant") != f.get("lieferant"):
            continue
        if cint(f.get("nur_unter")) and not k["unter_meldebestand"]:
            continue
        zeilen.append({**r, **k, "regel": r.name, "vorschlag": frappe.db.get_value("PH Bestellvorschlag", {"meldebestand_regel": r.name, "status": ("in", ["Offen", "Bestellt"])}, "name", order_by="creation desc")})
    return zeilen
