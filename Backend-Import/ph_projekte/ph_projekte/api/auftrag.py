"""Whitelisted Methoden für Planungsfreigabe, Nachträge, Montageplanung, Kalkulation und PDF-Auftragsmappe.
Re-exportiert in ph_projekte.api (Pfade ph_projekte.api.<methode>).

Portal (Token website@platzhirsch.studio + kunde_token, wie die übrigen portal_*):
    portal_plannings(kontakt, kunde_token, projekt)                     → Planning[]
    portal_planning_decide(kontakt, kunde_token, planung, entscheidung freigeben|aendern, kommentar?, idempotency_key?)
    portal_change_orders(kontakt, kunde_token, projekt?)                → ChangeOrder[]   (mit Beträgen, s. README)
    portal_change_order_decide(kontakt, kunde_token, nachtrag, entscheidung freigeben|ablehnen, kommentar?, name?, idempotency_key?)
Desk/Backoffice:
    montage_kollisionen(start, ende?, monteure?, fahrzeug?, ausser?)    → [{art, name, titel, ressource, typ, start, ende, text}]
    montage_plantafel(von, bis)                                         → {montagen, gewerke, auslastung, ueberbucht, tagesstunden}
    projekt_kalkulation(projekt)                                        → Soll/Ist (Leitung)
    auftragsmappe_pdf(projekt, teile?)                                  → {dokument, datei, seiten, teile, uebersprungen}
"""

import json

import frappe
from frappe import _
from frappe.utils import add_days, getdate

from ph_core.api import ApiFehler, ip_hash, ph_api, text
from ph_projekte.api.basis import kunde, projekt_des_kunden
from ph_projekte.ph_projekte.helfer import iso
from ph_projekte.utils import mappe as mappe_logik
from ph_projekte.utils import montageplan
from ph_projekte.utils.nachtrag import portal_status

LEITUNG = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"}


# ── Planungen im Portal ───────────────────────────────────────────────────────

def _planung_payload(r):
    return {
        "id": r.name, "projectId": r.projekt, "title": r.bezeichnung, "version": int(r.version or 1), "status": r.status,
        "presentedAt": iso(r.vorgelegt_am), "approvedAt": iso(r.freigabe_durch_kunde_am), "decision": r.kunde_entscheidung or None,
        "comment": r.kunde_kommentar or "", "documentId": r.vorlage_dokument or None, "preview": r.vorschau or None,
        "awaitingDecision": r.status == "Kunde vorgelegt",
    }


PLANUNG_FELDER = ["name", "projekt", "bezeichnung", "version", "status", "vorgelegt_am", "freigabe_durch_kunde_am", "kunde_entscheidung", "kunde_kommentar", "vorlage_dokument", "vorschau"]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_plannings(kontakt, kunde_token, projekt):
    k = kunde(kontakt, kunde_token)
    projekt = projekt_des_kunden(k["name"], projekt)
    rows = frappe.get_all("PH Planung", filters={"projekt": projekt, "kunde_sichtbar": 1, "status": ("!=", "Verworfen")}, fields=PLANUNG_FELDER, order_by="version desc")
    return [_planung_payload(r) for r in rows]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=20, referenz=lambda r: ("PH Planung", r["id"]))
def portal_planning_decide(kontakt, kunde_token, planung, entscheidung, kommentar=None):
    k = kunde(kontakt, kunde_token)
    planung = text(planung, 80)
    entscheidung = text(entscheidung, 20)
    if entscheidung not in ("freigeben", "aendern"):
        raise ApiFehler("invalid", 400, _("Entscheidung muss „freigeben“ oder „aendern“ sein."), {"field": "entscheidung"})
    projekt = frappe.db.get_value("PH Planung", {"name": planung, "kunde_sichtbar": 1}, "projekt")
    if not projekt:
        raise ApiFehler("not_found", 404, _("Planung nicht gefunden."))
    projekt_des_kunden(k["name"], projekt)
    doc = frappe.get_doc("PH Planung", planung)
    if doc.status != "Kunde vorgelegt":
        raise ApiFehler("conflict", 409, _("Diese Planung wartet nicht auf Ihre Entscheidung."))
    kommentar = text(kommentar, 2000) if kommentar else None
    if entscheidung == "aendern" and not kommentar:
        raise ApiFehler("invalid", 400, _("Bitte beschreiben Sie Ihren Änderungswunsch."), {"field": "kommentar"})
    doc.kunde_entscheidet(entscheidung, kommentar, quelle="portal", ip=ip_hash())
    if kommentar:
        frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": k["name"], "projekt": projekt, "richtung": "eingehend", "text": _("Planung {0}: {1}").format(doc.bezeichnung, kommentar), "quelle": "website", "ip_hash": ip_hash()}).insert(ignore_permissions=True)
    r = frappe.get_all("PH Planung", filters={"name": planung}, fields=PLANUNG_FELDER)[0]
    return _planung_payload(r)


# ── Nachträge im Portal ───────────────────────────────────────────────────────

def _nachtrag_payload(name):
    n = frappe.get_doc("PH Nachtrag", name)
    return {
        "id": n.name, "projectId": n.projekt, "number": n.nummer_im_projekt, "title": n.bezeichnung, "status": portal_status(n.status),
        "reason": n.grund, "description": n.beschreibung or "", "scheduleImpact": n.auswirkung_termin or "",
        "presentedAt": iso(n.vorgelegt_am), "deadline": str(n.freigabe_frist) if n.freigabe_frist else None, "decidedAt": iso(n.entscheidung_am),
        # Preise sind hier zwingend: ohne Mehr-/Minderpreis kann der Kunde nicht wirksam freigeben (README „Nachträge“).
        "currency": n.waehrung or "EUR", "totalDeltaCent": int(n.differenz_cent or 0),
        "items": [{"kind": z.art, "room": z.raum or "", "title": z.bezeichnung, "variant": z.ausfuehrung_text or "", "quantity": int(z.menge or 1), "unitCent": int(z.einzel_cent or 0), "amountCent": int(z.betrag_cent or 0)} for z in n.positionen],
    }


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_change_orders(kontakt, kunde_token, projekt=None):
    k = kunde(kontakt, kunde_token)
    filters = {"kontakt": k["name"], "status": ("in", ("Vorgelegt", "Freigegeben", "Abgelehnt"))}
    if projekt:
        filters["projekt"] = projekt_des_kunden(k["name"], projekt)
    return [_nachtrag_payload(n) for n in frappe.get_all("PH Nachtrag", filters=filters, pluck="name", order_by="creation desc", limit=100)]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=20, referenz=lambda r: ("PH Nachtrag", r["id"]))
def portal_change_order_decide(kontakt, kunde_token, nachtrag, entscheidung, kommentar=None, name=None):
    k = kunde(kontakt, kunde_token)
    nachtrag = text(nachtrag, 80)
    entscheidung = text(entscheidung, 20)
    if entscheidung not in ("freigeben", "ablehnen"):
        raise ApiFehler("invalid", 400, _("Entscheidung muss „freigeben“ oder „ablehnen“ sein."), {"field": "entscheidung"})
    if not frappe.db.exists("PH Nachtrag", {"name": nachtrag, "kontakt": k["name"]}):
        raise ApiFehler("not_found", 404, _("Nachtrag nicht gefunden."))
    doc = frappe.get_doc("PH Nachtrag", nachtrag)
    if doc.status != "Vorgelegt":
        raise ApiFehler("conflict", 409, _("Dieser Nachtrag wartet nicht auf Ihre Entscheidung."))
    if entscheidung == "freigeben" and not (name or "").strip():
        raise ApiFehler("invalid", 400, _("Bitte geben Sie Ihren Namen zur Freigabe an."), {"field": "name"})
    doc.kunde_entscheidet(entscheidung, text(kommentar, 2000) if kommentar else None, ip=ip_hash(), name_kunde=text(name, 140) if name else None)
    return _nachtrag_payload(nachtrag)


# ── Montageplanung ────────────────────────────────────────────────────────────

def _liste(v):
    if not v:
        return []
    if isinstance(v, str):
        try:
            v = json.loads(v)
        except ValueError:
            v = [x.strip() for x in v.split(",")]
    return [x for x in v if x]


@frappe.whitelist()
def montage_kollisionen(start, ende=None, monteure=None, fahrzeug=None, ausser=None, qualifikationen=None):
    """Prüfung vor dem Speichern (Plantafel, Dialog „Montage planen“): Doppelbelegung Monteur/Fahrzeug und
    fehlende Qualifikationen (Einträge mit typ „qualifikation“)."""
    frappe.has_permission("PH Montageauftrag", "read", throw=True)
    from ph_projekte.ph_projekte.doctype.ph_montageauftrag.ph_montageauftrag import belegungen, quali_map

    team = _liste(monteure)
    treffer = montageplan.kollisionen({"name": ausser, "art": "Montageauftrag", "start": start, "ende": ende, "monteure": team, "fahrzeug": fahrzeug}, belegungen(start, ende or start, ausser=ausser))
    out = [{**t, "start": iso(t["start"]), "ende": iso(t["ende"]), "text": montageplan.kollisionstext(t)} for t in treffer]
    for q in montageplan.fehlende_qualifikationen(_liste(qualifikationen), team, quali_map()):
        out.append({"art": "Qualifikation", "name": None, "titel": q, "ressource": q, "typ": "qualifikation", "start": None, "ende": None, "text": _("Fehlende Qualifikation im Team: {0}").format(_(q))})
    return out


@frappe.whitelist()
def montage_plantafel(von, bis):
    """Montagen + Fremdgewerk-Termine im Zeitraum (max. 62 Tage) mit Tagesauslastung je Monteur."""
    frappe.has_permission("PH Montageauftrag", "read", throw=True)
    von, bis = getdate(von), getdate(bis)
    if (bis - von).days > 62:
        frappe.throw(_("Zeitraum höchstens 62 Tage."))
    from ph_projekte.ph_projekte.doctype.ph_montageauftrag.ph_montageauftrag import belegungen, quali_map

    alle = belegungen(von, bis)
    qm = quali_map()
    montagen = [b for b in alle if b["art"] == "Montageauftrag" and von <= getdate(b["start"]) <= bis]
    gewerke = frappe.get_all("PH Fremdgewerk", filters={"termin_von": ("between", [von, add_days(bis, 1)]), "status": ("!=", "Abgesagt")}, fields=["name", "titel", "projekt", "gewerk", "status", "termin_von", "termin_bis"], order_by="termin_von asc")
    tagesstunden = float(frappe.db.get_single_value("PH Projekte Einstellungen", "montage_tagesstunden") or 8)
    auslastung = montageplan.tagesauslastung([b for b in alle if b["art"] in ("Montageauftrag", "Abwesenheit")], tagesstunden)
    return {
        "montagen": [{**m, "start": iso(m["start"]), "ende": iso(m["ende"]), "fehlende_qualifikationen": montageplan.fehlende_qualifikationen(m.get("qualifikationen"), m.get("monteure"), qm), "geeignet": montageplan.geeignete_monteure(m.get("qualifikationen"), qm)} for m in montagen],
        "qualifikationen": {u: sorted(q) for u, q in qm.items()},
        "abwesenheiten": [{**b, "start": iso(b["start"]), "ende": iso(b["ende"])} for b in alle if b["art"] == "Abwesenheit"],
        "touren": [{**b, "start": iso(b["start"]), "ende": iso(b["ende"])} for b in alle if b["art"] == "Tour"],
        "gewerke": [{**g, "termin_von": iso(g.termin_von), "termin_bis": iso(g.termin_bis)} for g in gewerke],
        "auslastung": auslastung,
        "ueberbucht": [{"datum": t, "monteur": m, "stunden": h} for t, m, h in montageplan.ueberbucht(auslastung, tagesstunden)],
        "tagesstunden": tagesstunden,
    }


# ── Kalkulation ───────────────────────────────────────────────────────────────

@frappe.whitelist()
def projekt_kalkulation(projekt):
    doc = frappe.get_doc("PH Projekt", projekt)
    return doc.kalkulation()


# ── Auftragsmappe als PDF ─────────────────────────────────────────────────────

def _teil_dokumente(projekt, teil):
    if teil in ("deckblatt", "statusbericht"):
        return [projekt]
    filters = {"projekt": projekt}
    if teil == "aufmass":
        return frappe.get_all("PH Aufmass", filters=filters, pluck="name", order_by="datum asc")
    if teil == "nachtrag":
        return frappe.get_all("PH Nachtrag", filters={**filters, "status": ("in", ("Vorgelegt", "Freigegeben"))}, pluck="name", order_by="nummer_im_projekt asc")
    if teil == "montagebericht":
        return frappe.get_all("PH Montageauftrag", filters={**filters, "status": ("in", ("Erledigt", "Abgenommen"))}, pluck="name", order_by="start asc")
    if teil == "abnahme":
        return frappe.get_all("PH Abnahme", filters={**filters, "status": ("!=", "Entwurf")}, pluck="name", order_by="datum asc")
    if teil == "produktpass":
        return frappe.get_all("PH Produktpass", filters=filters, pluck="name", order_by="creation asc")
    return []


def _datei_bytes(file_url):
    name = frappe.db.get_value("File", {"file_url": file_url}, "name")
    return frappe.get_doc("File", name).get_content() if name else None


@frappe.whitelist()
def auftragsmappe_pdf(projekt, teile=None):
    """Sammeldruck: Deckblatt, Statusbericht, Aufmaße, freigegebene Pläne (PDF-Dateien), Nachträge, Montageberichte,
    Abnahmen, Produktpässe → ein PDF, abgelegt als PH Projekt Dokument (Kategorie Protokoll, nicht kundensichtbar)."""
    p = frappe.get_doc("PH Projekt", projekt)
    p.check_permission("print")
    gewaehlt = mappe_logik.teile_waehlen(frappe.parse_json(teile) if teile and str(teile).startswith("[") else teile)
    pdfs, enthalten = [], []
    for teil in gewaehlt:
        if teil == "planung":
            for pl in frappe.get_all("PH Planung", filters={"projekt": projekt, "status": ("in", ("Freigegeben", "Kunde vorgelegt"))}, fields=["name", "datei", "titel"], order_by="version asc"):
                if pl.datei and pl.datei.lower().endswith(".pdf"):
                    daten = _datei_bytes(pl.datei)
                    if mappe_logik.ist_pdf(daten):
                        pdfs.append(daten)
                        enthalten.append(("planung", pl.titel))
            continue
        doctype, druckformat = mappe_logik.DRUCKFORMAT[teil]
        if not frappe.db.exists("Print Format", druckformat):
            continue
        for name in _teil_dokumente(projekt, teil):
            try:
                pdfs.append(frappe.get_print(doctype, name, druckformat, as_pdf=True))
                enthalten.append((teil, name))
            except Exception:  # noqa: BLE001 – ein fehlerhaftes Teil darf die Mappe nicht verhindern
                frappe.log_error(title=f"Auftragsmappe {projekt}: {doctype} {name}")
    if not pdfs:
        frappe.throw(_("Keine druckbaren Unterlagen gefunden."))
    daten, seiten, uebersprungen = mappe_logik.zusammenfuehren(pdfs)
    from ph_projekte.ph_projekte.doctype.ph_projekt_dokument.ph_projekt_dokument import dokument_aus_beleg

    datei = frappe.get_doc({"doctype": "File", "file_name": f"{projekt}-Auftragsmappe.pdf", "is_private": 1, "content": daten, "attached_to_doctype": "PH Projekt", "attached_to_name": projekt}).insert(ignore_permissions=True)
    dok = dokument_aus_beleg(projekt, _("Auftragsmappe {0}").format(frappe.utils.formatdate(frappe.utils.nowdate(), "dd.MM.yyyy")), "Protokoll", datei.file_url, "PH Projekt", projekt, kunde_sichtbar=0)
    return {"dokument": dok.name, "datei": datei.file_url, "seiten": seiten, "teile": [{"teil": t, "titel": n} for t, n in enthalten], "uebersprungen": uebersprungen}

