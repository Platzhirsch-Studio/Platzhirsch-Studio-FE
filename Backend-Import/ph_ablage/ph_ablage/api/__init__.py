"""Backoffice-API der Ablage (ph_ablage.api.*) – Grundlage der Drive-Oberfläche im Next.js-Backoffice.

Alle Methoden: @ph_api(intern=True) → Guest 403, Rate-Limit, PH API Protokoll, Fehlerbild {"code", "message", …}.
Rechte: Rolle (PH Ablage Mitarbeiter/Leitung, Bereichsrollen, Geschäftsführung nur lesend) + Bezug + Ordner-Modus
(ph_ablage/ph_ablage/rechte.py). Vollständige Beschreibung: ph_ablage/README.md „Schnittstelle für das Backoffice“.

Fehlercodes: invalid 400 · password_required 401 · forbidden 403 · not_found / invalid_token 404 · conflict 409 ·
expired 410 · too_large 413 · blocked_type 415 · checksum_mismatch 422 · locked 423 · rate_limited 429 ·
unavailable 503 (Speicher nicht konfiguriert / App fehlt).
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate, now_datetime

from ph_ablage.ph_ablage import dienste, rechte, upload
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln
from ph_core.api import ApiFehler, liste, ph_api, pflicht, rolle_pruefen, text

LESEN = ["GET", "POST"]


def _datei_ref(r):
    return ("PH Datei", r.get("datei")) if isinstance(r, dict) and r.get("datei") else (None, None)


def _ordner_ref(r):
    return ("PH Ordner", r.get("ordner")) if isinstance(r, dict) and r.get("ordner") else (None, None)


# ── Allgemein ───────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=LESEN)
@ph_api(intern=True)
def einstellungen_info():
    """Grenzen und Fähigkeiten für die Oberfläche (keine Zugangsdaten)."""
    rechte.pruefe_rolle("read")
    e = einstellungen()
    from ph_ablage.ph_ablage.portal import verfuegbar
    from ph_ablage.ph_ablage.vorschau import soffice_pfad

    return {
        "adapter": e.speicher_adapter, "max_bytes": cint(e.max_groesse_mb) * upload.MB, "chunk_bytes": cint(e.chunk_mb) * upload.MB,
        "erlaubte_endungen": e.erlaubt, "gesperrte_endungen": e.gesperrt, "papierkorb_tage": cint(e.papierkorb_tage),
        "sperre_stunden": cint(e.sperre_stunden), "freigabe_standard_tage": cint(e.freigabe_standard_tage), "freigabe_max_tage": cint(e.freigabe_max_tage),
        "freigabe_passwort_pflicht": cint(e.freigabe_passwort_pflicht), "direkt_upload": e.speicher_adapter == "s3",
        "office_vorschau": bool(cint(e.office_vorschau) and soffice_pfad(e)), "portal": verfuegbar(),
        "aufbewahrungsklassen": [{"klasse": k, **{x: v for x, v in r.items() if x != "nur_leitung"}} for k, r in regeln.AUFBEWAHRUNG.items()],
        "modi": list(regeln.MODI), "bezuege": [dt for dt in regeln.ERLAUBTE_BEZUEGE if frappe.db.exists("DocType", dt)],
    }


# ── Ordner ──────────────────────────────────────────────────────────────────────────────────────
class _Zugriff:
    """Zugriffsprüfung je Ordner mit Cache (Bezug + wirksamer Modus; Team-Ordner einzeln)."""

    def __init__(self):
        self.cache = {}

    def darf(self, o):
        schluessel = (o.bezug_doctype, o.bezug_name, o.effektiver_modus) if o.effektiver_modus != "team" else ("team", o.name)
        if schluessel not in self.cache:
            self.cache[schluessel] = rechte.zugriff_ordner(o.name)
        return self.cache[schluessel]


def _anzahlen(namen):
    if not namen:
        return {}
    rows = frappe.get_all("PH Datei", filters={"ordner": ("in", list(namen)), "status": "Aktiv"}, fields=["ordner", "count(name) as anzahl"], group_by="ordner")
    return {r.ordner: cint(r.anzahl) for r in rows}


FELDER_ORDNER = ["name", "titel", "parent_ph_ordner", "pfad", "bezug_doctype", "bezug_name", "bezug_titel", "rechte_modus", "effektiver_modus", "farbe", "icon", "geschuetzt", "ist_bezugswurzel", "aufbewahrungsklasse", "lft", "rgt"]


def _baum(wurzeln, tiefe):
    """Wurzeln (dicts) + Unterbaum bis `tiefe` → verschachtelte Liste nur zugänglicher Ordner."""
    zugriff = _Zugriff()
    alle = []
    for w in wurzeln:
        alle.append(w)
        if tiefe > 0:
            alle += frappe.get_all("PH Ordner", filters={"lft": (">", w.lft), "rgt": ("<", w.rgt)}, fields=FELDER_ORDNER, order_by="lft asc", limit=5000)
    erlaubt = [o for o in alle if zugriff.darf(o)]
    anzahl = _anzahlen([o.name for o in erlaubt])
    knoten = {o.name: {**dienste.ordner_payload(o, anzahl.get(o.name, 0)), "kinder": []} for o in erlaubt}
    tiefe_von = {}
    ergebnis = []
    for o in erlaubt:
        eltern = o.parent_ph_ordner
        t = tiefe_von.get(eltern, -1) + 1 if eltern in knoten else 0
        tiefe_von[o.name] = t
        if eltern in knoten and t <= tiefe:
            knoten[eltern]["kinder"].append(knoten[o.name])
        elif eltern not in knoten:
            ergebnis.append(knoten[o.name])
    return ergebnis


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True)
def ordner_baum(bezug_doctype=None, bezug_name=None, ordner=None, tiefe=None):
    """Ordnerbaum: zu einem Bezug (legt Stammordner + Vorlage bei Bedarf an), unter einem Ordner oder global
    (oberste Ebene, tiefe Standard 1). → {"wurzeln": [ {ordner, titel, …, anzahl_dateien, kinder: [...]}, … ]}"""
    rechte.pruefe_rolle("read")
    if bezug_doctype or bezug_name:
        pflicht({"bezug_doctype": bezug_doctype, "bezug_name": bezug_name}, "bezug_doctype", "bezug_name")
        if bezug_doctype not in regeln.ERLAUBTE_BEZUEGE:
            raise ApiFehler("invalid", 400, _("Bezugsart nicht vorgesehen."), {"field": "bezug_doctype"})
        if not frappe.db.exists("DocType", bezug_doctype):
            raise ApiFehler("unavailable", 503, _("{0} ist nicht installiert.").format(bezug_doctype))
        if not frappe.db.exists(bezug_doctype, bezug_name):
            raise ApiFehler("not_found", 404, _("{0} {1} nicht gefunden.").format(bezug_doctype, bezug_name))
        if not frappe.has_permission(bezug_doctype, "read", doc=bezug_name) and not rechte.ist_leitung(bezug_doctype):
            raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
        darf_anlegen = frappe.has_permission("PH Ordner", "create")
        wurzel = dienste.wurzel_fuer_bezug(bezug_doctype, bezug_name, anlegen=darf_anlegen)
        if wurzel and darf_anlegen:
            dienste.ordner_aus_vorlage(wurzel, bezug_doctype)
        if not wurzel:
            return {"wurzeln": []}
        wurzeln = frappe.get_all("PH Ordner", filters={"name": wurzel}, fields=FELDER_ORDNER)
        return {"wurzeln": _baum(wurzeln, cint(tiefe) if tiefe is not None else 10)}
    if ordner:
        rechte.pruefe_ordner(ordner)
        wurzeln = frappe.get_all("PH Ordner", filters={"name": ordner}, fields=FELDER_ORDNER)
        return {"wurzeln": _baum(wurzeln, cint(tiefe) if tiefe is not None else 10)}
    wurzeln = frappe.get_all("PH Ordner", filters={"parent_ph_ordner": ("is", "not set")}, fields=FELDER_ORDNER, order_by="titel asc")
    return {"wurzeln": _baum(wurzeln, cint(tiefe) if tiefe is not None else 1)}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, idempotent=True, referenz=_ordner_ref)
def ordner_anlegen(titel, eltern=None, bezug_doctype=None, bezug_name=None, rechte_modus=None, farbe=None, icon=None, mitglieder=None, aufbewahrungsklasse=None):
    """Neuer Ordner. Ohne `eltern` als oberster Ordner (frei oder mit Bezug). → Ordner-Antwort."""
    pflicht({"titel": titel}, "titel")
    if eltern:
        rechte.pruefe_ordner(eltern, "create")
    else:
        rechte.pruefe_rolle("create", "PH Ordner")
        if bezug_doctype and not (bezug_name and frappe.has_permission(bezug_doctype, "write", doc=bezug_name)):
            raise ApiFehler("forbidden", 403, _("Für Ordner mit Bezug ist Schreibrecht auf den Bezug nötig."))
    if rechte_modus and rechte_modus not in regeln.MODI:
        raise ApiFehler("invalid", 400, _("Rechte-Modus intern, team oder leitung."), {"field": "rechte_modus"})
    if aufbewahrungsklasse and aufbewahrungsklasse not in regeln.KLASSEN:
        raise ApiFehler("invalid", 400, _("Unbekannte Aufbewahrungsklasse."), {"field": "aufbewahrungsklasse"})
    d = frappe.get_doc({
        "doctype": "PH Ordner", "titel": text(titel, 140), "parent_ph_ordner": eltern, "bezug_doctype": bezug_doctype, "bezug_name": bezug_name,
        "rechte_modus": rechte_modus, "farbe": text(farbe, 20) or None, "icon": text(icon, 40) or None, "aufbewahrungsklasse": aufbewahrungsklasse, "quelle": "backoffice",
        "mitglieder": [{"user": u} for u in liste(mitglieder) if frappe.db.exists("User", u)],
    })
    d.flags.ignore_permissions = True
    d.insert()
    protokoll("Ordner angelegt", ordner=d.name, bezug_doctype=d.bezug_doctype, bezug_name=d.bezug_name)
    return dienste.ordner_payload(d, 0)


def _ordner_doc(ordner, ptype="write"):
    rechte.pruefe_ordner(ordner, ptype)
    return frappe.get_doc("PH Ordner", ordner)


def _ordner_speichern(d):
    d.flags.ignore_permissions = True
    try:
        d.save()
    except frappe.ValidationError as e:
        if isinstance(e, frappe.DuplicateEntryError):
            raise ApiFehler("conflict", 409, _("Im Zielordner gibt es bereits einen Ordner „{0}“.").format(d.titel))
        raise
    return d


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_ordner_ref)
def ordner_verschieben(ordner, eltern=None):
    """Ordner unter `eltern` hängen (leer = oberste Ebene). Bezug/Modus werden im Unterbaum nachgezogen."""
    d = _ordner_doc(ordner)
    if eltern:
        rechte.pruefe_ordner(eltern, "write")
        if eltern == ordner or frappe.db.get_value("PH Ordner", eltern, "lft") in range(cint(d.lft), cint(d.rgt) + 1):
            raise ApiFehler("invalid", 400, _("Ein Ordner kann nicht in sich selbst verschoben werden."), {"field": "eltern"})
    if d.ist_bezugswurzel and not rechte.ist_leitung(d.bezug_doctype):
        raise ApiFehler("forbidden", 403, _("Stammordner eines Bezugs verschiebt nur die Leitung."))
    d.parent_ph_ordner = eltern or None
    _ordner_speichern(d)
    protokoll("Ordner verschoben", ordner=d.name, bezug_doctype=d.bezug_doctype, bezug_name=d.bezug_name, hinweis=eltern or "oberste Ebene")
    return dienste.ordner_payload(frappe.get_doc("PH Ordner", d.name))


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_ordner_ref)
def ordner_umbenennen(ordner, titel):
    pflicht({"titel": titel}, "titel")
    d = _ordner_doc(ordner)
    d.titel = text(titel, 140)
    _ordner_speichern(d)
    protokoll("Ordner umbenannt", ordner=d.name, bezug_doctype=d.bezug_doctype, bezug_name=d.bezug_name)
    return dienste.ordner_payload(d)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_ordner_ref)
def ordner_einstellen(ordner, rechte_modus=None, farbe=None, icon=None, mitglieder=None, aufbewahrungsklasse=None, beschreibung=None):
    """Modus/Farbe/Symbol/Mitglieder/Aufbewahrungsklasse. Lockern des Modus (strenger → lockerer) nur Leitung."""
    d = _ordner_doc(ordner)
    if rechte_modus is not None:
        if rechte_modus and rechte_modus not in regeln.MODI:
            raise ApiFehler("invalid", 400, _("Rechte-Modus intern, team oder leitung."), {"field": "rechte_modus"})
        if regeln.lockerer(d.rechte_modus, rechte_modus) and not rechte.ist_leitung(d.bezug_doctype):
            raise ApiFehler("forbidden", 403, _("Rechte lockern darf nur die Leitung."))
        d.rechte_modus = rechte_modus or None
    if farbe is not None:
        d.farbe = text(farbe, 20) or None
    if icon is not None:
        d.icon = text(icon, 40) or None
    if beschreibung is not None:
        d.beschreibung = text(beschreibung, 2000) or None
    if aufbewahrungsklasse is not None:
        if aufbewahrungsklasse and aufbewahrungsklasse not in regeln.KLASSEN:
            raise ApiFehler("invalid", 400, _("Unbekannte Aufbewahrungsklasse."), {"field": "aufbewahrungsklasse"})
        d.aufbewahrungsklasse = aufbewahrungsklasse or None
    if mitglieder is not None:
        d.set("mitglieder", [{"user": u} for u in liste(mitglieder) if frappe.db.exists("User", u)])
    _ordner_speichern(d)
    return dienste.ordner_payload(d)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_ordner_ref)
def ordner_loeschen(ordner):
    """Nur leere Ordner (keine Unterordner, keine Dateien – auch nicht im Papierkorb)."""
    d = _ordner_doc(ordner)
    if frappe.db.exists("PH Ordner", {"parent_ph_ordner": ordner}) or frappe.db.exists("PH Datei", {"ordner": ordner}):
        raise ApiFehler("conflict", 409, _("Der Ordner ist nicht leer."))
    if d.geschuetzt and not rechte.ist_leitung(d.bezug_doctype):
        raise ApiFehler("forbidden", 403, _("Vorlagenordner löscht nur die Leitung."))
    d.flags.ph_system = True
    d.delete(ignore_permissions=True)
    protokoll("Ordner geloescht", ordner=ordner, bezug_doctype=d.bezug_doctype, bezug_name=d.bezug_name, hinweis=d.titel)
    return {"ordner": ordner, "geloescht": True}


# ── Dateien: Liste, Detail, Suche ───────────────────────────────────────────────────────────────
FELDER_DATEI = ["name", "dateiname", "ordner", "status", "endung", "mime", "groesse", "aktuelle_version", "sha256", "tags", "beschreibung", "vorschau_art", "vorschau_status", "gesperrt_von", "gesperrt_bis", "portal_freigabe", "portal_ablauf", "freigabelinks_aktiv", "aufbewahrungsklasse", "aufbewahren_bis", "loeschsperre", "geloescht_am", "papierkorb_bis", "bezug_doctype", "bezug_name", "bezug_titel", "hochgeladen_von", "creation", "modified"]


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True)
def dateien(ordner=None, suche=None, tags=None, sort=None, seite=1, groesse=50, papierkorb=0, endung=None):
    """Dateien eines Ordners (oder mit papierkorb=1 ohne Ordner: alle zugänglichen im Papierkorb).
    → {"items": [...], "seite", "groesse", "gesamt", "ordner": {…, "pfad"}}"""
    seite, groesse, start = regeln.seite_und_groesse(seite, groesse)
    status = "Papierkorb" if cint(papierkorb) else "Aktiv"
    filters = {"status": status}
    ordner_info = None
    if ordner:
        rechte.pruefe_ordner(ordner)
        filters["ordner"] = ordner
        ordner_info = dienste.ordner_payload(frappe.get_doc("PH Ordner", ordner))
    elif not cint(papierkorb):
        raise ApiFehler("invalid", 400, _("Ordner fehlt."), {"field": "ordner"})
    else:
        rechte.pruefe_rolle("read")
    if endung:
        filters["endung"] = text(endung, 10).lower().lstrip(".")
    or_filters = None
    if suche:
        q = f"%{text(suche, 100)}%"
        or_filters = {"dateiname": ("like", q), "tags": ("like", q), "beschreibung": ("like", q)}
    tag_liste = regeln.tags_normalisieren(liste(tags) if tags else [])
    if tag_liste:
        filters["tags"] = ("like", f"%{tag_liste[0]}%")
    if ordner and not tag_liste:
        gesamt = len(frappe.get_all("PH Datei", filters=filters, or_filters=or_filters, pluck="name")) if or_filters else frappe.db.count("PH Datei", filters)
        rows = frappe.get_all("PH Datei", filters=filters, or_filters=or_filters, fields=FELDER_DATEI, order_by=regeln.sortierung(sort), limit_start=start, limit_page_length=groesse)
    else:
        rows = frappe.get_all("PH Datei", filters=filters, or_filters=or_filters, fields=FELDER_DATEI, order_by=regeln.sortierung(sort) if ordner else "geloescht_am desc", limit=5000)
        if not ordner:
            zugriff = {}
            rows = [r for r in rows if zugriff.setdefault(r.ordner, rechte.zugriff_ordner(r.ordner))]
        if tag_liste:
            gesucht = {t.lower() for t in tag_liste}
            rows = [r for r in rows if gesucht <= {x.lower() for x in regeln.tags_normalisieren(r.tags)}]
        gesamt = len(rows)
        rows = rows[start: start + groesse]
    return {"items": [dienste.datei_payload(r) for r in rows], "seite": seite, "groesse": groesse, "gesamt": gesamt, "ordner": ordner_info}


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True, referenz=_datei_ref)
def datei(datei):
    """Detail inkl. Versionen, Metadaten (CAD) und aktiven Freigabelinks."""
    doc = rechte.pruefe_datei(datei)
    p = dienste.datei_payload(doc, mit_versionen=True)
    p["metadaten"] = frappe.parse_json(doc.metadaten_json) if doc.metadaten_json else None
    p["freigabelinks"] = [dienste.freigabelink_payload(l) for l in frappe.get_all("PH Datei Freigabelink", filters={"datei": doc.name, "status": "Aktiv"}, fields=["name", "datei", "version", "status", "ablauf", "passwort_gesetzt", "max_downloads", "download_zaehler", "letzter_download", "empfaenger_hinweis", "erstellt_von", "creation"])]
    p["ordner_pfad"] = frappe.db.get_value("PH Ordner", doc.ordner, "pfad")
    return p


def _schnipsel(text_, begriff, breite=60):
    if not text_ or not begriff:
        return None
    i = text_.lower().find(begriff.lower())
    if i < 0:
        return None
    return ("…" if i > breite else "") + text_[max(0, i - breite): i + len(begriff) + breite].replace("\n", " ") + "…"


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True)
def suche(q, bezug_doctype=None, bezug_name=None, endung=None, limit=50):
    """Suche über Dateiname, Tags, Beschreibung, Bezug und (falls extrahiert) Volltext. Alle Begriffe müssen passen.
    → [{…Datei, "treffer_in": [name|tags|beschreibung|bezug|inhalt], "schnipsel"}]"""
    rechte.pruefe_rolle("read")
    begriffe = regeln.suchbegriffe(q)
    if not begriffe:
        raise ApiFehler("invalid", 400, _("Mindestens 2 Zeichen."), {"field": "q"})
    limit = min(max(cint(limit) or 50, 1), 200)
    filters = {"status": "Aktiv"}
    if bezug_doctype:
        filters["bezug_doctype"] = bezug_doctype
    if bezug_name:
        filters["bezug_name"] = bezug_name
    if endung:
        filters["endung"] = text(endung, 10).lower().lstrip(".")
    erster = f"%{begriffe[0]}%"
    felder_suche = {"dateiname": "name", "tags": "tags", "beschreibung": "beschreibung", "bezug_titel": "bezug", "bezug_name": "bezug", "volltext": "inhalt"}
    kandidaten = frappe.get_all("PH Datei", filters=filters, or_filters={f: ("like", erster) for f in felder_suche}, fields=FELDER_DATEI + ["volltext"], order_by="modified desc", limit=1000)
    zugriff = {}
    out = []
    for r in kandidaten:
        texte = {f: str(r.get(f) or "") for f in felder_suche}
        if not all(any(b.lower() in t.lower() for t in texte.values()) for b in begriffe):
            continue
        if not zugriff.setdefault(r.ordner, rechte.zugriff_ordner(r.ordner)):
            continue
        treffer = sorted({felder_suche[f] for f, t in texte.items() if any(b.lower() in t.lower() for b in begriffe)})
        out.append({**dienste.datei_payload(r), "treffer_in": treffer, "schnipsel": _schnipsel(r.volltext, begriffe[0]) if "inhalt" in treffer else None})
        if len(out) >= limit:
            break
    return out


# ── Upload ──────────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def upload_start(ordner, dateiname, groesse, mime=None, sha256=None, kommentar=None):
    """Neue Datei hochladen (Schritt 1). → {token, datei, version, ablauf, ziel: {art: direkt|teile, …}, duplikate}"""
    pflicht({"ordner": ordner, "dateiname": dateiname, "groesse": groesse}, "ordner", "dateiname", "groesse")
    return upload.start(ordner=ordner, dateiname=dateiname, groesse=groesse, mime=mime, sha256=sha256, kommentar=kommentar)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, limit_pro_minute=900)
def upload_chunk(token, offset=0, daten=None):
    """Teil anhängen (Base64 in `daten` oder multipart-Feld `chunk`). → {erhalten, groesse, fertig}"""
    pflicht({"token": token}, "token")
    return upload.chunk(token, offset=offset, daten=daten)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, idempotent=True, referenz=_datei_ref)
def upload_abschliessen(token, sha256, bei_duplikat=None):
    """Schritt 3: Prüfsumme prüfen, Version anlegen. → Datei + {duplikat, verworfen, duplikate}"""
    pflicht({"token": token, "sha256": sha256}, "token", "sha256")
    if bei_duplikat and bei_duplikat not in ("melden", "verwerfen"):
        raise ApiFehler("invalid", 400, _("bei_duplikat: melden oder verwerfen."), {"field": "bei_duplikat"})
    return upload.abschliessen(token, sha256, bei_duplikat=bei_duplikat)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def neue_version(datei, groesse, dateiname=None, mime=None, sha256=None, kommentar=None, einchecken=1):
    """Neue Version einer bestehenden Datei (gleiche Endung) – weiter mit upload_chunk/upload_abschliessen.
    einchecken=1 hebt den eigenen Check-out nach dem Abschluss auf."""
    pflicht({"datei": datei, "groesse": groesse}, "datei", "groesse")
    return upload.start(datei=datei, dateiname=dateiname, groesse=groesse, mime=mime, sha256=sha256, kommentar=kommentar, einchecken=einchecken)


# ── Download ────────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=LESEN)
@ph_api(intern=True, referenz=_datei_ref)
def download_link(datei, version=None, inline=0):
    """Kurzlebiger Link (presign_sekunden). art „direkt“ = Anbieter-URL, „proxy“ = /api/method/ph_ablage.api.herunterladen."""
    doc = rechte.pruefe_datei(datei)
    if doc.status == "Hochladen":
        raise ApiFehler("conflict", 409, _("Upload noch nicht abgeschlossen."))
    return {"datei": doc.name, **dienste.download_info(doc, version=version, inline=cint(inline))}


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True, referenz=_datei_ref)
def vorschau_link(datei, version=None):
    """Link auf das Vorschau-Objekt (PNG/PDF). vorschau_status „Browser“ → Original inline anzeigen (PDF/TXT)."""
    doc = rechte.pruefe_datei(datei)
    if doc.vorschau_status == "Browser":
        return {"datei": doc.name, "vorschau_status": "Browser", **dienste.download_info(doc, version=version, inline=True, art=None)}
    if doc.vorschau_status != "Fertig":
        return {"datei": doc.name, "vorschau_status": doc.vorschau_status, "vorschau_art": doc.vorschau_art, "url": None}
    return {"datei": doc.name, "vorschau_status": "Fertig", **dienste.download_info(doc, version=version, inline=True, art=None, vorschau=True)}


@frappe.whitelist(methods=["GET"])
def herunterladen(dl=None):
    """Proxy-Download (lokal, Google Drive, OneDrive, Bestand): kurzlebiger Token aus download_link, an den
    anfragenden Benutzer gebunden. Antwort: Datei (Content-Disposition mit dem Dateinamen aus der Datenbank)."""
    if frappe.session.user == "Guest":
        raise frappe.PermissionError(_("Anmeldung erforderlich."))
    z = dienste.proxy_token_lesen(dl) if dl else None
    if not z:
        raise frappe.DoesNotExistError(_("Download-Link abgelaufen."))
    if z.get("user") != frappe.session.user:
        raise frappe.PermissionError(_("Download-Link gehört einem anderen Benutzer."))
    doc = frappe.get_doc("PH Datei", z["datei"])
    v = dienste.version_zeile(doc, z.get("version"))
    if cint(z.get("vorschau")):
        name, schluessel, endung = v.vorschau_speicher, v.vorschau_schluessel, (v.vorschau_mime or "image/png").split("/")[-1]
        dateiname = f"{doc.dateiname}.{endung}"
    else:
        name, schluessel, dateiname = v.speicher, v.schluessel, doc.dateiname
    from ph_ablage import speicher

    try:
        inhalt = dienste.inhalt_lesen(name, schluessel)
    except speicher.NichtGefunden:
        raise frappe.DoesNotExistError(_("Inhalt im Speicher nicht gefunden."))
    frappe.local.response.filename = dateiname
    frappe.local.response.filecontent = inhalt
    frappe.local.response.type = "download"
    frappe.local.response.display_content_as = "inline" if cint(z.get("inline")) else "attachment"


# ── Bearbeiten ──────────────────────────────────────────────────────────────────────────────────
def _schreiben(datei):
    doc = rechte.pruefe_datei(datei, "write")
    if doc.status == "Hochladen":
        raise ApiFehler("conflict", 409, _("Upload noch nicht abgeschlossen."))
    return doc


def _speichern(doc):
    doc.flags.ignore_permissions = True
    doc.flags.ph_api = True
    doc.save()
    return dienste.datei_payload(doc)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def umbenennen(datei, dateiname):
    """Nur Datenbank – der Speicher-Schlüssel bleibt. Endung bleibt gleich."""
    pflicht({"dateiname": dateiname}, "dateiname")
    doc = _schreiben(datei)
    dienste.sperre_pruefen(doc)
    alt = doc.dateiname
    try:
        neu = regeln.dateiname_bereinigen(dateiname)
    except ValueError:
        raise ApiFehler("invalid", 400, _("Dateiname fehlt."), {"field": "dateiname"})
    if regeln.endung(neu) != doc.endung:
        neu = f"{neu}.{doc.endung}" if doc.endung and not regeln.endung(neu) else neu
        if regeln.endung(neu) != doc.endung:
            raise ApiFehler("invalid", 400, _("Die Endung „.{0}“ bleibt erhalten.").format(doc.endung), {"field": "dateiname"})
    doc.dateiname = neu
    erg = _speichern(doc)
    protokoll("Umbenannt", datei=doc.name, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=f"{alt} → {neu}"[:300])
    return erg


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def verschieben(datei, ordner):
    """In einen anderen Ordner (Rechte am Ziel nötig). Bezug und Rechte-Modus folgen dem Zielordner."""
    pflicht({"ordner": ordner}, "ordner")
    doc = _schreiben(datei)
    dienste.sperre_pruefen(doc)
    rechte.pruefe_ordner(ordner, "write")
    if doc.bezug_doctype == "PH Mitarbeiter" and frappe.db.get_value("PH Ordner", ordner, "bezug_doctype") != "PH Mitarbeiter":
        raise ApiFehler("forbidden", 403, _("Personalunterlagen bleiben in Personalordnern."))
    von = doc.ordner
    doc.ordner = ordner
    erg = _speichern(doc)
    protokoll("Verschoben", datei=doc.name, ordner=ordner, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("von {0}").format(von))
    return erg


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def tags_setzen(datei, tags=None, beschreibung=None):
    """Tags ersetzen (Liste/kommagetrennt, ≤ 20); optional Beschreibung."""
    doc = _schreiben(datei)
    doc.tags = regeln.tags_text(liste(tags) if tags else [])
    if beschreibung is not None:
        doc.beschreibung = text(beschreibung, 2000) or None
    erg = _speichern(doc)
    protokoll("Tags", datei=doc.name, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name)
    return erg


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def aufbewahrung_setzen(datei, aufbewahrungsklasse, belegdatum=None):
    """Aufbewahrungsklasse (Beleg/Personal/Projekt/Marketing/Allgemein) und Belegdatum. Bei aktiver Sperre nur Leitung."""
    if aufbewahrungsklasse not in regeln.KLASSEN:
        raise ApiFehler("invalid", 400, _("Unbekannte Aufbewahrungsklasse."), {"field": "aufbewahrungsklasse"})
    doc = _schreiben(datei)
    if cint(doc.loeschsperre) and aufbewahrungsklasse != doc.aufbewahrungsklasse and not rechte.ist_leitung(doc.bezug_doctype):
        raise ApiFehler("forbidden", 403, _("Die Klasse einer gesperrten Datei ändert nur die Leitung."))
    doc.aufbewahrungsklasse = aufbewahrungsklasse
    if belegdatum:
        try:
            doc.belegdatum = getdate(belegdatum)
        except Exception:  # noqa: BLE001
            raise ApiFehler("invalid", 400, _("Belegdatum ungültig."), {"field": "belegdatum"})
    return _speichern(doc)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def sperren(datei, stunden=None, hinweis=None):
    """Check-out für die Bearbeitung (Office/CAD): andere können keine neue Version hochladen, umbenennen, verschieben
    oder löschen. → Datei (gesperrt_von, gesperrt_bis)"""
    doc = _schreiben(datei)
    dienste.sperren(doc, stunden, text(hinweis, 200) or None)
    return dienste.datei_payload(frappe.get_doc("PH Datei", doc.name))


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def entsperren(datei, erzwingen=0):
    """Check-in ohne neue Version. Fremde Sperre nur Leitung mit erzwingen=1."""
    doc = _schreiben(datei)
    dienste.entsperren(doc, erzwingen=cint(erzwingen))
    return dienste.datei_payload(frappe.get_doc("PH Datei", doc.name))


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True, referenz=_datei_ref)
def versionen(datei):
    doc = rechte.pruefe_datei(datei)
    return {"datei": doc.name, "aktuell": cint(doc.aktuelle_version), "versionen": [dienste.version_payload(v) for v in sorted(doc.versionen, key=lambda v: -cint(v.version))]}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def version_wiederherstellen(datei, version, kommentar=None):
    """Ältere Version wird zur neuen aktuellen Version (ohne Kopie im Speicher – gleicher Schlüssel)."""
    doc = _schreiben(datei)
    dienste.sperre_pruefen(doc)
    alt = dienste.version_zeile(doc, version)
    if cint(alt.version) == cint(doc.aktuelle_version):
        raise ApiFehler("conflict", 409, _("Das ist bereits die aktuelle Version."))
    neu = cint(doc.aktuelle_version) + 1
    dienste.version_anhaengen(doc, {
        "version": neu, "schluessel": alt.schluessel, "speicher": alt.speicher, "groesse": alt.groesse, "sha256": alt.sha256, "geprueft": alt.geprueft,
        "mime": alt.mime, "endung": alt.endung, "hochgeladen_von": frappe.session.user, "hochgeladen_am": now_datetime(),
        "kommentar": text(kommentar, 500) or _("Wiederhergestellt aus Version {0}").format(alt.version), "wiederhergestellt_aus": alt.version,
        "dateiname_damals": doc.dateiname, "vorschau_speicher": alt.vorschau_speicher, "vorschau_schluessel": alt.vorschau_schluessel, "vorschau_mime": alt.vorschau_mime,
    })
    if alt.vorschau_schluessel:
        frappe.db.set_value("PH Datei", doc.name, "vorschau_status", "Fertig", update_modified=False)
    protokoll("Version wiederhergestellt", datei=doc.name, version=neu, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("aus Version {0}").format(alt.version))
    upload.nach_upload(doc, neu, geprueft=1)
    return dienste.datei_payload(frappe.get_doc("PH Datei", doc.name), mit_versionen=True)


# ── Papierkorb ──────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def loeschen(datei):
    """In den Papierkorb (Frist papierkorb_tage). Belege mit laufender Aufbewahrungsfrist: locked 423."""
    doc = _schreiben(datei)
    dienste.in_papierkorb(doc)
    return dienste.datei_payload(frappe.get_doc("PH Datei", doc.name))


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def wiederherstellen(datei):
    doc = rechte.pruefe_datei(datei, "write")
    dienste.aus_papierkorb(doc)
    return dienste.datei_payload(frappe.get_doc("PH Datei", doc.name))


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def endgueltig_loeschen(datei):
    """Sofort endgültig (nur Leitung, nur aus dem Papierkorb). Speicher-Objekte aller Versionen werden entfernt."""
    doc = rechte.pruefe_datei(datei, "delete")
    if doc.status != "Papierkorb":
        raise ApiFehler("conflict", 409, _("Zuerst in den Papierkorb legen."))
    dienste.endgueltig_loeschen(doc)
    return {"datei": datei, "geloescht": True}


# ── Freigaben ───────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def freigabelink_erstellen(datei, tage=None, passwort=None, max_downloads=None, version=None, empfaenger_hinweis=None):
    """Download-Link für Externe (nur lesen). Das Token erscheint nur in dieser Antwort.
    → {freigabelink, token, url (freigabe_basis_url + token), ablauf, passwort, max_downloads, version}"""
    doc = _schreiben(datei)
    return {"datei": doc.name, **dienste.freigabelink_erstellen(doc, tage=tage, passwort=passwort, max_downloads=max_downloads, version=version, empfaenger_hinweis=empfaenger_hinweis)}


@frappe.whitelist(methods=LESEN)
@ph_api(intern=True, referenz=_datei_ref)
def freigabelinks(datei, alle=0):
    doc = rechte.pruefe_datei(datei)
    f = {"datei": doc.name}
    if not cint(alle):
        f["status"] = "Aktiv"
    rows = frappe.get_all("PH Datei Freigabelink", filters=f, fields=["name", "datei", "version", "status", "ablauf", "passwort_gesetzt", "max_downloads", "download_zaehler", "letzter_download", "empfaenger_hinweis", "erstellt_von", "creation"], order_by="creation desc", limit=200)
    return {"datei": doc.name, "items": [dienste.freigabelink_payload(r) for r in rows]}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True)
def freigabelink_widerrufen(freigabelink):
    pflicht({"freigabelink": freigabelink}, "freigabelink")
    datei = frappe.db.get_value("PH Datei Freigabelink", freigabelink, "datei")
    if not datei:
        raise ApiFehler("not_found", 404, _("Freigabelink nicht gefunden."))
    rechte.pruefe_datei(datei, "write")
    status = frappe.get_doc("PH Datei Freigabelink", freigabelink).widerrufen()
    return {"freigabelink": freigabelink, "status": status}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, limit_pro_minute=30)
def freigabe_aufloesen(token, passwort=None, nur_info=0):
    """Für die öffentliche Freigabeseite des Backoffice (Server-zu-Server mit dem Service-Token; Rolle
    PH Website Integration oder PH Backoffice-Admin). Kein Gast-Zugriff auf Frappe.
    → nur_info=1: {dateiname, groesse, mime, ablauf, passwort_noetig: false}; sonst zusätzlich {url, art, version}
    (zählt einen Download). Fehler: invalid_token 404, expired 410, password_required 401, forbidden 403."""
    rolle_pruefen("PH Website Integration", "PH Backoffice-Admin", "System Manager")
    pflicht({"token": token}, "token")
    l = frappe.db.get_value("PH Datei Freigabelink", {"token_hash": regeln.token_hash(token)}, ["name", "datei", "version", "status", "ablauf", "passwort_hash", "download_zaehler", "max_downloads"], as_dict=True)
    if not l:
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    zustand = regeln.freigabe_zustand(l.status, frappe.utils.get_datetime(l.ablauf) if l.ablauf else None, now_datetime(), l.download_zaehler, l.max_downloads)
    if zustand == "widerrufen":
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    if zustand != "ok":
        if l.status == "Aktiv":
            frappe.db.set_value("PH Datei Freigabelink", l.name, "status", "Abgelaufen" if zustand == "abgelaufen" else "Aufgebraucht", update_modified=False)
        raise ApiFehler("expired", 410, _("Der Link ist abgelaufen."))
    if l.passwort_hash:
        if not passwort:
            raise ApiFehler("password_required", 401, _("Passwort erforderlich."), {"passwort_noetig": True})
        if not regeln.passwort_passt(passwort, l.passwort_hash):
            protokoll("Abgelehnt", datei=l.datei, freigabelink=l.name, hinweis=_("falsches Passwort"))
            frappe.db.commit()
            raise ApiFehler("forbidden", 403, _("Passwort falsch."))
    doc = frappe.get_doc("PH Datei", l.datei)
    if doc.status != "Aktiv":
        raise ApiFehler("expired", 410, _("Die Datei ist nicht mehr verfügbar."))
    v = dienste.version_zeile(doc, cint(l.version) or None)
    basis = {"dateiname": doc.dateiname, "groesse": cint(v.groesse), "mime": v.mime or doc.mime, "ablauf": dienste.iso(l.ablauf), "passwort_noetig": False, "version": cint(v.version)}
    if cint(nur_info):
        return basis
    info = dienste.download_info(doc, version=cint(l.version) or None, art="Freigabe genutzt", freigabelink=l.name)
    frappe.db.set_value("PH Datei Freigabelink", l.name, {"download_zaehler": cint(l.download_zaehler) + 1, "letzter_download": now_datetime()}, update_modified=False)
    return {**basis, "url": info["url"], "art": info["art"], "url_ablauf": info["ablauf"]}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, referenz=_datei_ref)
def portal_freigeben(datei, freigeben=1, projekt=None, kategorie=None, titel=None, bis=None):
    """Ins Kundenportal (ph_projekte: PH Projekt Dokument, kunde_sichtbar) bzw. zurückziehen (freigeben=0).
    projekt Standard = Projekt des Ordners; bis = Ablaufdatum (YYYY-MM-DD, optional)."""
    from ph_ablage.ph_ablage.portal import portal_setzen

    doc = _schreiben(datei)
    if bis:
        try:
            bis = getdate(bis)
        except Exception:  # noqa: BLE001
            raise ApiFehler("invalid", 400, _("Datum ungültig."), {"field": "bis"})
    return {"datei": doc.name, **portal_setzen(doc, cint(freigeben), projekt=text(projekt, 140) or None, kategorie=text(kategorie, 40) or None, titel=text(titel, 140) or None, bis=bis)}


# ── Verwaltung (Leitung) ────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["POST"])
@ph_api(intern=True)
def bestand_uebernehmen(bezug_doctype=None, limit=500):
    """Bestehende Anhänge verlinken (Hintergrundjob). Nur Leitung/Admin. → {eingereiht: true}"""
    rolle_pruefen("PH Ablage Leitung", "PH Backoffice-Admin", "System Manager")
    if bezug_doctype and bezug_doctype not in regeln.ERLAUBTE_BEZUEGE:
        raise ApiFehler("invalid", 400, _("Bezugsart nicht vorgesehen."), {"field": "bezug_doctype"})
    frappe.enqueue("ph_ablage.ph_ablage.bestand.bestand_uebernehmen", queue="long", timeout=7200, bezug_doctype=bezug_doctype, limit=min(max(cint(limit) or 500, 1), 5000))
    return {"eingereiht": True}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True)
def speicher_umziehen(ziel=None, limit=200, bestand_einbeziehen=0, alte_loeschen=0):
    """Anbieterwechsel: Versionen in den Ziel-Adapter kopieren (Hintergrund, in Blöcken). Nur Admin/System Manager."""
    rolle_pruefen("PH Backoffice-Admin", "System Manager")
    from ph_ablage import speicher

    ziel = ziel or einstellungen().speicher_adapter
    if ziel not in speicher.ADAPTER:
        raise ApiFehler("invalid", 400, _("Unbekannter Adapter."), {"field": "ziel"})
    dienste.adapter(ziel)  # 503, wenn nicht konfiguriert
    frappe.enqueue("ph_ablage.ph_ablage.tasks.speicher_umziehen", queue="long", timeout=14400, ziel=ziel, limit=min(max(cint(limit) or 200, 1), 5000), bestand_einbeziehen=cint(bestand_einbeziehen), alte_loeschen=cint(alte_loeschen))
    return {"eingereiht": True, "ziel": ziel}
