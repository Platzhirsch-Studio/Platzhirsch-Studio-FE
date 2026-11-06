"""Kundenakte 360°: Bezüge aller installierten Apps, Zeitleiste, Kundenakte-Aggregat, Hook-Aufrufe.

Fremde Apps werden NICHT importiert: alle DocTypes mit Link-Feld auf PH Kontakt werden zur Laufzeit über
DocField/Custom Field gefunden (`frappe.db.exists("DocType", …)`, CONVENTIONS 10). Apps können über
Hooks eigene Ereignisse/Abschnitte liefern (Vertrag in README „Hook-Vertrag Kundenakte“):
  ph_kontakt_zeitleiste            fn(kontakt, vor=None, limit=30) -> [ereignis]
  ph_kontakt_zeitleiste_ersetzt    [DocType] – generische „angelegt“-Ereignisse dieser DocTypes weglassen
  ph_kontakt_datenauskunft         fn(kontakt) -> [{abschnitt, doctype, name, daten}]
  ph_kontakt_anonymisieren         fn(kontakt, ausfuehren=False) -> [{doctype, name, aktion, grund, frist_bis}]
  ph_kontakt_zusammengefuehrt      fn(alt, neu) -> None
"""

import json

import frappe
from frappe import _

from ph_crm.utils import zeitleiste as zl
from ph_crm.utils.zeit import iso as _iso_dt


def iso(wert):
    """datetime/str → ISO mit Site-Offset; reines Datum → YYYY-MM-DD."""
    from datetime import date, datetime

    if isinstance(wert, date) and not isinstance(wert, datetime):
        return wert.isoformat()
    if isinstance(wert, str) and len(wert) == 10:
        return wert
    if isinstance(wert, str) and ("+" in wert[10:] or wert.endswith("Z")):
        return wert
    return _iso_dt(wert)

DATUMSFELDER = ("eingang", "start", "datum", "belegdatum", "rechnungsdatum", "bestelldatum", "posting_date", "lieferdatum", "gueltig_ab", "creation")
ENDZUSTAENDE = {"Gewonnen", "Verloren", "Spam", "Erledigt", "Storniert", "Abgelehnt", "Nicht erschienen", "Abgeschlossen", "Bezahlt", "Geliefert", "Zugestellt", "Verworfen", "Abgemeldet", "Widerrufen", "Inaktiv", "Gesperrt", "Archiviert", "Beendet", "Gekuendigt", "Eingeloest", "Abgelaufen", "Cancelled", "Closed", "Completed"}
APP_ZEITLEISTE_ART = {"PH Anfrage": "Anfrage", "PH Termin": "Termin", "PH Beratungsgespraech": "Gespräch", "PH Aufgabe": "Aufgabe"}


def hooks_aufrufen(name, *args, **kwargs):
    """Alle registrierten Hook-Funktionen aufrufen; Fehler einzelner Apps nur protokollieren.
    → Liste (app_pfad, ergebnis)."""
    ergebnisse = []
    for pfad in frappe.get_hooks(name) or []:
        try:
            ergebnisse.append((pfad, frappe.get_attr(pfad)(*args, **kwargs)))
        except Exception:  # noqa: BLE001 – eine App darf die Kundenakte nicht blockieren
            frappe.log_error(title=f"PH CRM Hook {name}: {pfad} fehlgeschlagen")
    return ergebnisse


def _app_von(pfad):
    return str(pfad).split(".", 1)[0]


def kontakt_bezuege():
    """[{doctype, feld, app_modul, titel_feld, datum_feld, status, submittable}] aller Nicht-Kind-DocTypes
    mit Link auf PH Kontakt (Standard- und Custom Fields). Je Request gecacht."""
    if getattr(frappe.local, "ph_crm_bezuege", None) is not None:
        return frappe.local.ph_crm_bezuege
    paare = {(r.parent, r.fieldname) for r in frappe.get_all("DocField", filters={"fieldtype": "Link", "options": "PH Kontakt", "parenttype": "DocType"}, fields=["parent", "fieldname"])}
    paare |= {(r.dt, r.fieldname) for r in frappe.get_all("Custom Field", filters={"fieldtype": "Link", "options": "PH Kontakt"}, fields=["dt", "fieldname"])}
    erg = []
    for dt, feld in sorted(paare):
        if not frappe.db.exists("DocType", dt):
            continue
        meta = frappe.get_meta(dt)
        if meta.istable or meta.issingle or getattr(meta, "is_virtual", 0):
            continue
        if dt == "PH Kontakt":  # firma_kontakt: Personen der Firma laufen über die Kundenakte, nicht als Vorgang
            continue
        datum = next((f for f in DATUMSFELDER if f == "creation" or meta.has_field(f)), "creation")
        erg.append(frappe._dict(doctype=dt, feld=feld, modul=meta.module, titel_feld=meta.title_field if meta.title_field and meta.has_field(meta.title_field) else None, datum_feld=datum, status=meta.has_field("status"), submittable=bool(meta.is_submittable)))
    frappe.local.ph_crm_bezuege = erg
    return erg


def _zeilen(b, kontakt, felder_extra=(), vor=None, limit=30, mit_rechten=True):
    felder = ["name", "creation", "modified"] + ([b.titel_feld] if b.titel_feld else []) + (["status"] if b.status else []) + ([b.datum_feld] if b.datum_feld != "creation" else []) + (["docstatus"] if b.submittable else []) + list(felder_extra)
    filters = {b.feld: kontakt}
    if vor:
        filters["creation"] = ("<", vor)
    holen = frappe.get_list if mit_rechten else frappe.get_all
    return holen(b.doctype, filters=filters, fields=list(dict.fromkeys(felder)), order_by="creation desc", limit_page_length=limit)


def _darf_lesen(dt):
    try:
        return frappe.has_permission(dt, "read")
    except Exception:  # noqa: BLE001
        return False


# ── Zeitleiste ──────────────────────────────────────────────────────────────


def zeitleiste(kontakt, vor=None, limit=30):
    """Vereinte Zeitleiste (Konzept CRM §3.3 „Kundenakte Zeitleiste“)."""
    limit = max(1, min(int(limit or 30), 100))
    vor_dt = frappe.utils.get_datetime(vor.replace("T", " ")[:19]) if vor else None
    listen = []
    ersetzt = set(frappe.get_hooks("ph_kontakt_zeitleiste_ersetzt") or [])

    # 1. Vorgänge aller Apps (generisch: angelegt + aktueller Status)
    for b in kontakt_bezuege():
        if b.doctype in ersetzt or not _darf_lesen(b.doctype):
            continue
        art = APP_ZEITLEISTE_ART.get(b.doctype) or _(b.doctype).replace("PH ", "")
        eintraege = []
        for z in _zeilen(b, kontakt, vor=vor_dt, limit=limit):
            eintraege.append({"zeit": iso(z.creation), "art": art, "doctype": b.doctype, "name": z.name, "titel": (z.get(b.titel_feld) if b.titel_feld else None) or z.name, "text": _("Status: {0}").format(_(z.status)) if z.get("status") else _("angelegt"), "app": frappe.scrub(b.modul or "")})
        listen.append(eintraege)

    # 2. Kommunikation (Bezug Kontakt oder Timeline-Link auf den Kontakt)
    namen = set(frappe.get_all("Communication", filters={"reference_doctype": "PH Kontakt", "reference_name": kontakt}, pluck="name", limit=500))
    namen |= set(frappe.get_all("Communication Link", filters={"link_doctype": "PH Kontakt", "link_name": kontakt, "parenttype": "Communication"}, pluck="parent", limit=500))
    if namen:
        filt = {"name": ("in", list(namen))}
        if vor_dt:
            filt["communication_date"] = ("<", vor_dt)
        kom = frappe.get_all("Communication", filters=filt, fields=["name", "communication_date", "subject", "sent_or_received", "communication_medium", "reference_doctype", "reference_name"], order_by="communication_date desc", limit=limit)
        listen.append([{"zeit": iso(c.communication_date), "art": "E-Mail" if c.communication_medium in (None, "", "Email") else _(c.communication_medium), "doctype": "Communication", "name": c.name, "titel": c.subject or _("(ohne Betreff)"), "text": _("Eingang") if c.sent_or_received == "Received" else _("Ausgang"), "app": "ph_crm"} for c in kom])

    # 3. Kommentare und Statuswechsel am Kontakt
    filt = {"reference_doctype": "PH Kontakt", "reference_name": kontakt, "comment_type": ("in", ["Comment", "Info", "Attachment", "Edit", "Workflow"])}
    if vor_dt:
        filt["creation"] = ("<", vor_dt)
    kommentare = frappe.get_all("Comment", filters=filt, fields=["name", "creation", "comment_type", "content", "owner"], order_by="creation desc", limit=limit)
    listen.append([{"zeit": iso(c.creation), "art": "Notiz" if c.comment_type == "Comment" else _("Info"), "doctype": "Comment", "name": c.name, "titel": frappe.utils.strip_html(c.content or "")[:120], "text": c.owner, "app": "ph_crm"} for c in kommentare])
    filt = {"ref_doctype": "PH Kontakt", "docname": kontakt}
    if vor_dt:
        filt["creation"] = ("<", vor_dt)
    for v in frappe.get_all("Version", filters=filt, fields=["name", "creation", "data", "owner"], order_by="creation desc", limit=limit):
        try:
            geaendert = [c for c in (json.loads(v.data or "{}").get("changed") or []) if c and c[0] == "status"]
        except ValueError:
            geaendert = []
        if geaendert:
            alt, neu = geaendert[0][1], geaendert[0][2]
            listen.append([{"zeit": iso(v.creation), "art": "Status", "doctype": "Version", "name": v.name, "titel": _("Status {0} → {1}").format(_(alt or "–"), _(neu or "–")), "text": v.owner, "app": "ph_crm"}])

    # 4. Ereignisse der Fach-Apps (Hook)
    for pfad, eintraege in hooks_aufrufen("ph_kontakt_zeitleiste", kontakt, vor=vor, limit=limit):
        listen.append([dict(e, app=e.get("app") or _app_von(pfad), zeit=iso(e.get("zeit")) if e.get("zeit") else None) for e in (eintraege or []) if isinstance(e, dict)])

    return zl.zusammenfuehren(listen, vor=vor, limit=limit)


# ── Kundenakte-Aggregat ─────────────────────────────────────────────────────


def kundenakte(kontakt):
    """Kopf + Übersicht der Kundenakte in einem Aufruf (Konzept CRM §3.3; ersetzt n × getList).
    Rechte: jede Bezugs-DocType nur, wenn der Benutzer sie lesen darf; Beträge nur Leitung/GF/Faktura."""
    doc = frappe.get_doc("PH Kontakt", kontakt)
    doc.check_permission("read")
    kopf = {f: doc.get(f) for f in ("name", "titel", "kontaktart", "status", "vorname", "nachname", "firma", "berater", "sprache", "kommunikation_bevorzugt", "kunde_seit", "nicht_kontaktieren", "portal_aktiv", "plz", "ort", "letzter_kontakt", "letzter_kontakt_art", "wiedervorlage", "wiedervorlage_notiz", "firma_kontakt", "funktion", "anonymisiert_am")}
    kopf["rollen"] = [{"rolle": r.rolle, "bezug_doctype": r.bezug_doctype, "bezug_name": r.bezug_name, "notiz": r.notiz} for r in doc.get("rollen") or []]
    kopf["personen"] = frappe.get_list("PH Kontakt", filters={"firma_kontakt": doc.name}, fields=["name", "titel", "funktion", "email", "status"], limit_page_length=50)
    bereiche, offen_gesamt = [], 0
    for b in kontakt_bezuege():
        if not _darf_lesen(b.doctype):
            continue
        anzahl = frappe.db.count(b.doctype, {b.feld: kontakt})
        if not anzahl:
            continue
        zeilen = _zeilen(b, kontakt, limit=5)
        offen = 0
        if b.status:
            offen = frappe.db.count(b.doctype, {b.feld: kontakt, "status": ("not in", list(ENDZUSTAENDE))})
        offen_gesamt += offen
        bereiche.append({"doctype": b.doctype, "feld": b.feld, "app": frappe.scrub(b.modul or ""), "anzahl": anzahl, "offen": offen, "juengste": [{"name": z.name, "titel": (z.get(b.titel_feld) if b.titel_feld else None) or z.name, "status": z.get("status"), "datum": iso(z.get(b.datum_feld) or z.creation)} for z in zeilen]})
    gespraech = frappe.get_all("PH Beratungsgespraech", filters={"kontakt": kontakt}, fields=["name", "datum", "status", "naechster_schritt", "naechster_schritt_bis", "budget_gesamt_cent"], order_by="datum desc", limit=1)
    zahlen = None
    if set(frappe.get_roles()) & {"PH CRM Leitung", "PH Geschäftsführung", "PH Faktura Leitung", "PH Faktura Mitarbeiter", "System Manager"}:
        zahlen = _zahlen(kontakt)
    return {"kopf": kopf, "offen_gesamt": offen_gesamt, "bereiche": bereiche, "gespraech": gespraech[0] if gespraech else None, "zahlen": zahlen, "pipeline": _pipeline(kontakt), "kanaele": kaufhistorie(kontakt, mit_betraegen=zahlen is not None)}


# ── Kaufhistorie je Kanal (32-Nachtrag CRM Nr. 1) ───────────────────────────
# (DocType, Bereich, Datumsfelder, Betragsfelder, Zusatzfelder für die Kanal-Regel). Nur wenn installiert.
QUELLEN_KANAL = (
    ("PH Bestellung", "kaeufe", ("bezahlt_am", "angelegt"), ("gesamt_cent",), ("bestellart",)),
    ("PH Kassenbeleg", "kaeufe", ("datum_uhrzeit", "geschaeftstag"), ("gesamt_cent",), ("bestellung", "belegart")),
    ("PH Auftragsbestaetigung", "kaeufe", ("datum",), ("brutto_cent", "auftragswert_cent"), ("projekt", "bestellung", "vertragsort")),
    ("PH Rechnung", "rechnungen", ("datum",), ("brutto_cent",), ("projekt", "bestellung", "offen_cent", "art")),
    ("PH Projekt", "planungen", ("eingang",), ("auftragswert_cent",), ("projektart",)),
    ("PH Servicefall", "reklamationen", ("gemeldet_am",), (), ("projekt", "bestellung", "art", "kanal")),
)


def _projektarten(namen):
    if not namen or not frappe.db.exists("DocType", "PH Projekt") or not frappe.get_meta("PH Projekt").has_field("projektart"):
        return {}
    return {p.name: p.projektart for p in frappe.get_all("PH Projekt", filters={"name": ("in", list(namen))}, fields=["name", "projektart"])}


def kaufhistorie(kontakt, mit_betraegen=False, limit=50):
    """Kaufhistorie, Rechnungen, Planungen und Reklamationen je Kanal (Showroom/Shop/Objekt).
    Jede Quelle nur, wenn die DocType installiert ist, der Benutzer sie lesen darf und das Feld `kontakt` hat;
    PH Planung (ohne Kontaktfeld) über die Projekte des Kontakts. Beträge nur mit `mit_betraegen`."""
    from ph_crm.utils.kanaele import gruppieren, kanal

    eintraege, projekte_des_kontakts = [], []
    for dt, bereich, datumsfelder, betragsfelder, extra in QUELLEN_KANAL:
        if not frappe.db.exists("DocType", dt) or not _darf_lesen(dt):
            continue
        meta = frappe.get_meta(dt)
        if not meta.has_field("kontakt"):
            continue
        datum = next((f for f in datumsfelder if meta.has_field(f)), "creation")
        betrag = next((f for f in betragsfelder if meta.has_field(f)), None)
        felder = ["name", "creation", datum] + [f for f in ("titel", "status", "docstatus") if f == "docstatus" or meta.has_field(f)] + [f for f in extra if meta.has_field(f)] + ([betrag] if betrag else [])
        filters = {"kontakt": kontakt}
        if meta.is_submittable and dt in ("PH Kassenbeleg", "PH Rechnung"):
            filters["docstatus"] = 1  # nur gebuchte Belege zählen als Kauf/Rechnung
        zeilen = frappe.get_list(dt, filters=filters, fields=list(dict.fromkeys(felder)), order_by=f"{datum} desc", limit_page_length=limit)
        arten = _projektarten({z.projekt for z in zeilen if z.get("projekt")})
        for z in zeilen:
            if dt == "PH Projekt":
                projekte_des_kontakts.append((z.name, z.get("projektart")))
            e = {"kanal": kanal(dt, z, arten.get(z.get("projekt"))), "bereich": bereich, "doctype": dt, "name": z.name, "titel": z.get("titel") or z.name, "status": z.get("status"), "datum": iso(z.get(datum) or z.creation)}
            if mit_betraegen and betrag:
                e["betrag_cent"] = int(z.get(betrag) or 0)
                if z.get("offen_cent") is not None:
                    e["offen_cent"] = int(z.get("offen_cent") or 0)
            eintraege.append(e)
    if projekte_des_kontakts and frappe.db.exists("DocType", "PH Planung") and _darf_lesen("PH Planung") and frappe.get_meta("PH Planung").has_field("projekt"):
        art_je = dict(projekte_des_kontakts)
        meta = frappe.get_meta("PH Planung")
        felder = ["name", "creation", "projekt"] + [f for f in ("titel", "status", "vorgelegt_am", "kunde_entscheidung") if meta.has_field(f)]
        for z in frappe.get_list("PH Planung", filters={"projekt": ("in", list(art_je))}, fields=felder, order_by="creation desc", limit_page_length=limit):
            eintraege.append({"kanal": kanal("PH Planung", {"projektart": art_je.get(z.projekt)}), "bereich": "planungen", "doctype": "PH Planung", "name": z.name, "titel": z.get("titel") or z.name, "status": z.get("status"), "datum": iso(z.get("vorgelegt_am") or z.creation), "projekt": z.projekt})
    for e in eintraege:
        e["_sort"] = e["datum"] or ""
    eintraege.sort(key=lambda e: e["_sort"], reverse=True)
    for e in eintraege:
        e.pop("_sort", None)
    return gruppieren(eintraege)


def _summe(dt, feld, kontakt):
    """Σ feld der gebuchten Belege (docstatus 1) eines Kontakts über frappe.qb (kein SQL-String)."""
    from frappe.query_builder.functions import Sum

    if not frappe.db.exists("DocType", dt):
        return None
    meta = frappe.get_meta(dt)
    if not (meta.has_field(feld) and meta.has_field("kontakt")):
        return None
    t = frappe.qb.DocType(dt)
    wert = frappe.qb.from_(t).select(Sum(t[feld])).where(t.kontakt == kontakt).where(t.docstatus == 1).run()
    return int((wert[0][0] if wert else 0) or 0)


def _zahlen(kontakt):
    """Umsatz/Offen aus ph_faktura (falls installiert) – Felder werden per Meta geprüft."""
    erg = {}
    for dt, feld, schluessel in (("PH Rechnung", "brutto_cent", "umsatz_cent"), ("PH Rechnung", "offen_cent", "offen_cent"), ("PH Auftragsbestaetigung", "brutto_cent", "auftraege_cent"), ("PH Bestellung", "gesamt_cent", "shop_cent"), ("PH Kassenbeleg", "gesamt_cent", "kassa_cent")):
        try:
            s = _summe(dt, feld, kontakt)
            if s is not None:
                erg[schluessel] = s
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH CRM Kundenakte: Summe {dt}.{feld} fehlgeschlagen")
    return erg


def _pipeline(kontakt):
    zeilen = frappe.get_all("PH Anfrage", filters={"kontakt": kontakt, "status": ("in", ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"])}, fields=["wert_cent", "gewichtet_cent"])
    return {"offen": len(zeilen), "wert_cent": sum(int(z.wert_cent or 0) for z in zeilen), "gewichtet_cent": sum(int(z.gewichtet_cent or 0) for z in zeilen)}


def letzter_kontakt_setzen(kontakt, zeit, art):
    """Feld „Letzter Kontakt“ nur vorwärts setzen (nie Fehler werfen)."""
    try:
        if not kontakt or not frappe.db.exists("PH Kontakt", kontakt):
            return
        alt = frappe.db.get_value("PH Kontakt", kontakt, "letzter_kontakt")
        zeit = frappe.utils.get_datetime(zeit)
        if not alt or zeit > frappe.utils.get_datetime(alt):
            frappe.db.set_value("PH Kontakt", kontakt, {"letzter_kontakt": zeit, "letzter_kontakt_art": art}, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH CRM: letzter Kontakt konnte nicht gesetzt werden")
