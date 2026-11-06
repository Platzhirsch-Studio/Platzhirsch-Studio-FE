"""Dienste der Ablage (Frappe): Ordner für Bezüge, Datei-Antworten, Versionen, Check-out, Papierkorb, Downloads,
Freigabelinks. Von API (ph_ablage.api), Hooks (ereignisse.py, kontakt.py) und Jobs (tasks.py) genutzt.
Rechte prüfen die Aufrufer (rechte.pruefe_*); Funktionen hier arbeiten mit ignore_permissions.
"""

import hashlib
from zoneinfo import ZoneInfo

import frappe
from frappe import _
from frappe.utils import add_to_date, cint, get_datetime, get_system_timezone, getdate, now_datetime, nowdate

from ph_ablage import speicher
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln
from ph_core.api import ApiFehler

BEREICH_TITEL = {"PH Kontakt": "Kontakte", "PH Projekt": "Projekte", "PH Lieferant": "Lieferanten", "PH Mitarbeiter": "Mitarbeiter", "PH Servicefall": "Servicefälle"}
BEREICH_ICON = {"PH Kontakt": "users", "PH Projekt": "project", "PH Lieferant": "truck", "PH Mitarbeiter": "users", "PH Servicefall": "tool"}
DL_CACHE = "ph_ablage:dl:"
MB = 1024 * 1024


# ── Allgemein ───────────────────────────────────────────────────────────────────────────────────
def iso(wert):
    if not wert:
        return None
    d = get_datetime(wert)
    if d.tzinfo is None:
        d = d.replace(tzinfo=ZoneInfo(get_system_timezone() or "Europe/Vienna"))
    return d.isoformat()


def adapter(name):
    """Speicher-Adapter oder ApiFehler unavailable (503) mit Liste fehlender site_config-Schlüssel (nur Namen)."""
    try:
        return speicher.speicher_fuer(name)
    except speicher.NichtKonfiguriert as e:
        raise ApiFehler("unavailable", 503, _("Speicher „{0}“ ist nicht konfiguriert.").format(name), {"adapter": name, "fehlend": list(e.fehlend)})


def voller_schluessel(s):
    return regeln.mit_praefix(einstellungen().speicher_praefix, s)


def vorschau_ziel(datei, jahr, version, sha, art_endung):
    sha8 = (sha or "0" * 8)[:8]
    return voller_schluessel(f"vorschau/{int(jahr)}/{datei}/{int(version)}-{sha8}.{art_endung}")


def bezug_titel(dt, name):
    if not dt or not name or not frappe.db.exists("DocType", dt):
        return name
    meta = frappe.get_meta(dt)
    tf = meta.title_field
    t = frappe.db.get_value(dt, name, tf) if tf and meta.has_field(tf) else None
    return (f"{name} · {t}" if t and t != name else name)[:200]


# ── Ordner ──────────────────────────────────────────────────────────────────────────────────────
def _ordner_neu(titel, eltern=None, bezug_doctype=None, bezug_name=None, **werte):
    d = frappe.get_doc({"doctype": "PH Ordner", "titel": titel, "parent_ph_ordner": eltern, "bezug_doctype": bezug_doctype, "bezug_name": bezug_name, **werte})
    d.flags.ignore_permissions = True
    d.flags.ph_system = True
    d.insert()
    return d


def bereichsordner(dt):
    """Oberster Ordner je Bezugsart („Projekte“, „Kontakte“, …) – Bezugsart ohne Bezug, geschützt."""
    vorhanden = frappe.db.get_value("PH Ordner", {"vorlage": f"bereich:{dt}"}, "name")
    if vorhanden:
        return vorhanden
    try:
        return _ordner_neu(_(BEREICH_TITEL[dt]), None, dt, None, vorlage=f"bereich:{dt}", geschuetzt=1, quelle="vorlage", rechte_modus=regeln.WURZEL_MODUS.get(dt, ""), icon=BEREICH_ICON.get(dt)).name
    except frappe.DuplicateEntryError:
        return frappe.db.get_value("PH Ordner", {"vorlage": f"bereich:{dt}"}, "name")


def wurzel_fuer_bezug(dt, name, anlegen=True, mit_vorlage=True):
    """Stammordner eines Bezugs (idempotent) inkl. Vorlagenordner → Name oder None (App/Datensatz fehlt)."""
    if dt not in regeln.ERLAUBTE_BEZUEGE or not name:
        return None
    vorhanden = frappe.db.get_value("PH Ordner", {"bezug_doctype": dt, "bezug_name": name, "ist_bezugswurzel": 1}, "name")
    if vorhanden or not anlegen:
        return vorhanden
    if not frappe.db.exists("DocType", dt) or not frappe.db.exists(dt, name):
        return None
    try:
        w = _ordner_neu(bezug_titel(dt, name), bereichsordner(dt), dt, name, ist_bezugswurzel=1, geschuetzt=1, vorlage=f"wurzel:{dt}", quelle="vorlage", rechte_modus=regeln.WURZEL_MODUS.get(dt, ""))
    except frappe.DuplicateEntryError:
        return frappe.db.get_value("PH Ordner", {"bezug_doctype": dt, "bezug_name": name, "ist_bezugswurzel": 1}, "name")
    protokoll("Ordner angelegt", ordner=w.name, bezug_doctype=dt, bezug_name=name, hinweis=_("Stammordner"), automatisch=True)
    if mit_vorlage:
        ordner_aus_vorlage(w.name, dt)
    return w.name


def _unterordner(wurzel):
    w = frappe.db.get_value("PH Ordner", wurzel, ["lft", "rgt"], as_dict=True)
    if not w:
        return []
    return frappe.get_all("PH Ordner", filters={"lft": (">", w.lft), "rgt": ("<", w.rgt)}, fields=["name", "titel", "parent_ph_ordner", "rechte_modus", "bezug_name", "lft", "rgt"], order_by="lft asc")


def vorlage_zeilen(dt):
    e = einstellungen()
    if not e.vorlagen:  # Einstellungen noch ohne Tabelle (vor install) → Standard
        return regeln.STANDARD_VORLAGEN.get(dt, [])
    return e.vorlagen.get(dt, [])


def ordner_aus_vorlage(wurzel, dt):
    """Fehlende Vorlagenordner unter `wurzel` anlegen (idempotent) → Anzahl neu."""
    bezug_name = frappe.db.get_value("PH Ordner", wurzel, "bezug_name")
    pfad_von = {wurzel: ()}
    for k in _unterordner(wurzel):
        pfad_von[k.name] = pfad_von.get(k.parent_ph_ordner, ()) + (k.titel,)
    name_von = {p: n for n, p in pfad_von.items()}
    plan = regeln.ordner_plan(vorlage_zeilen(dt), vorhandene=[p for p in pfad_von.values() if p])
    for z in plan:
        eltern = name_von.get(z["eltern"], wurzel) if z["eltern"] else wurzel
        try:
            d = _ordner_neu(z["titel"], eltern, dt, bezug_name, rechte_modus=z["modus"], aufbewahrungsklasse=z["aufbewahrung"] or None, farbe=z["farbe"] or None, geschuetzt=1, vorlage=f"vorlage:{dt}", quelle="vorlage")
            name_von[z["pfad"]] = d.name
        except frappe.DuplicateEntryError:
            continue
    return len(plan)


def unterbaum_aktualisieren(ordner):
    """Wirksamen Modus, Bezug und Pfad an Unterordner und Dateien weitergeben (nach Verschieben/Modus-Wechsel)."""
    o = frappe.db.get_value("PH Ordner", ordner, ["name", "lft", "rgt", "effektiver_modus", "bezug_doctype", "bezug_name", "bezug_titel", "pfad"], as_dict=True)
    if not o:
        return
    info = {ordner: o}
    for k in _unterordner(ordner):
        e = info.get(k.parent_ph_ordner) or o
        werte = {
            "effektiver_modus": regeln.effektiver_modus([e.effektiver_modus, k.rechte_modus]),
            "bezug_doctype": e.bezug_doctype,
            "bezug_name": e.bezug_name or (k.bezug_name if e.bezug_doctype else None),
            "pfad": f"{e.pfad or ''} / {k.titel}".strip(" /")[:500],
        }
        werte["bezug_titel"] = e.bezug_titel if e.bezug_name else (bezug_titel(werte["bezug_doctype"], werte["bezug_name"]) if werte["bezug_name"] else None)
        frappe.db.set_value("PH Ordner", k.name, werte, update_modified=False)
        info[k.name] = frappe._dict({**k, **werte})
    for n, i in info.items():
        frappe.db.set_value("PH Datei", {"ordner": n}, {"effektiver_modus": i.effektiver_modus, "bezug_doctype": i.bezug_doctype, "bezug_name": i.bezug_name, "bezug_titel": i.bezug_titel}, update_modified=False)


def ordner_payload(o, anzahl=None):
    return {
        "ordner": o.name, "titel": o.titel, "eltern": o.parent_ph_ordner or None, "pfad": o.pfad,
        "bezug_doctype": o.bezug_doctype or None, "bezug_name": o.bezug_name or None, "bezug_titel": o.bezug_titel or None,
        "rechte_modus": o.rechte_modus or None, "effektiver_modus": o.effektiver_modus or "intern",
        "farbe": o.farbe or None, "icon": o.icon or None, "geschuetzt": cint(o.geschuetzt), "ist_bezugswurzel": cint(o.ist_bezugswurzel),
        "aufbewahrungsklasse": o.aufbewahrungsklasse or None, "anzahl_dateien": anzahl,
    }


# ── Dateien ─────────────────────────────────────────────────────────────────────────────────────
def datei_payload(d, mit_versionen=False):
    p = {
        "datei": d.name, "dateiname": d.dateiname, "ordner": d.ordner, "status": d.status, "endung": d.endung, "mime": d.mime,
        "groesse": cint(d.groesse), "groesse_text": regeln.groesse_text(d.groesse), "version": cint(d.aktuelle_version), "sha256": d.sha256,
        "tags": regeln.tags_normalisieren(d.tags), "beschreibung": d.beschreibung or None,
        "vorschau_art": d.vorschau_art, "vorschau_status": d.vorschau_status,
        "gesperrt_von": d.gesperrt_von if sperre_aktiv(d) else None, "gesperrt_bis": iso(d.gesperrt_bis) if sperre_aktiv(d) else None,
        "portal_freigabe": cint(d.portal_freigabe), "portal_ablauf": str(d.portal_ablauf) if d.portal_ablauf else None,
        "freigabelinks_aktiv": cint(d.freigabelinks_aktiv),
        "aufbewahrungsklasse": d.aufbewahrungsklasse, "aufbewahren_bis": str(d.aufbewahren_bis) if d.aufbewahren_bis else None, "loeschsperre": cint(d.loeschsperre),
        "geloescht_am": iso(d.geloescht_am), "papierkorb_bis": str(d.papierkorb_bis) if d.papierkorb_bis else None,
        "bezug_doctype": d.bezug_doctype or None, "bezug_name": d.bezug_name or None, "bezug_titel": d.bezug_titel or None,
        "hochgeladen_von": d.hochgeladen_von, "erstellt": iso(d.creation), "geaendert": iso(d.modified),
    }
    if mit_versionen and hasattr(d, "versionen"):
        p["versionen"] = [version_payload(v) for v in sorted(d.versionen, key=lambda v: -cint(v.version))]
    return p


def version_payload(v):
    return {"version": cint(v.version), "groesse": cint(v.groesse), "sha256": v.sha256, "geprueft": cint(v.geprueft), "hochgeladen_von": v.hochgeladen_von, "hochgeladen_am": iso(v.hochgeladen_am), "kommentar": v.kommentar or None, "dateiname": v.dateiname_damals, "wiederhergestellt_aus": cint(v.wiederhergestellt_aus) or None}


def version_zeile(doc, version=None):
    version = cint(version) or cint(doc.aktuelle_version)
    for v in doc.versionen or []:
        if cint(v.version) == version:
            return v
    raise ApiFehler("not_found", 404, _("Version {0} nicht gefunden.").format(version))


def duplikate(sha, ausser=None, ordner=None, limit=5):
    if not regeln.sha256_hex_gueltig(sha):
        return []
    f = {"sha256": sha.lower(), "status": ("in", ("Aktiv", "Papierkorb"))}
    if ausser:
        f["name"] = ("!=", ausser)
    if ordner:
        f["ordner"] = ordner
    rows = frappe.get_all("PH Datei", filters=f, fields=["name", "dateiname", "ordner", "status"], limit=limit, order_by="creation asc")
    return [{"datei": r.name, "dateiname": r.dateiname, "ordner": r.ordner, "status": r.status} for r in rows]


def aufbewahrung_setzen(doc):
    klasse = doc.aufbewahrungsklasse or "Allgemein"
    doc.aufbewahren_bis = regeln.aufbewahren_bis(klasse, doc.belegdatum or doc.hochgeladen_am or doc.creation or nowdate())
    doc.loeschsperre = 1 if (regeln.AUFBEWAHRUNG.get(klasse, {}).get("sperre") and doc.aufbewahren_bis and getdate(nowdate()) <= getdate(doc.aufbewahren_bis)) else 0


def version_anhaengen(doc, zeile):
    """Neue Version als aktuelle setzen (doc wird gespeichert)."""
    doc.append("versionen", zeile)
    doc.aktuelle_version = cint(zeile["version"])
    doc.groesse = cint(zeile.get("groesse"))
    doc.sha256 = zeile.get("sha256")
    doc.mime = zeile.get("mime") or doc.mime
    doc.status = "Aktiv"
    if not doc.hochgeladen_am:
        doc.hochgeladen_am = now_datetime()
        doc.hochgeladen_von = frappe.session.user
    doc.vorschau_status = "Ausstehend" if regeln.vorschau_art(doc.endung) != "keine" else "Keine"
    doc.volltext_status = "Ausstehend"
    doc.flags.ignore_permissions = True
    doc.save()


def objekt_wird_verwendet(speicher_name, schluessel, ausser_parent=None):
    f = {"speicher": speicher_name, "schluessel": schluessel, "parenttype": "PH Datei"}
    if ausser_parent:
        f["parent"] = ("!=", ausser_parent)
    return bool(frappe.get_all("PH Datei Version", filters=f, limit=1))


def objekte_entfernen(doc):
    """Speicher-Objekte aller Versionen + Vorschauen löschen (verlinkte Bestandsdateien bleiben). Fehler → Log."""
    gesehen = set()
    for v in doc.versionen or []:
        for name, schluessel in ((v.speicher, v.schluessel), (v.vorschau_speicher, v.vorschau_schluessel)):
            if not name or not schluessel or (name, schluessel) in gesehen or name in speicher.NUR_LESEN:
                continue
            gesehen.add((name, schluessel))
            if objekt_wird_verwendet(name, schluessel, ausser_parent=doc.name):
                continue
            try:
                speicher.speicher_fuer(name).delete(schluessel)
            except Exception:  # noqa: BLE001 – Objekt bleibt liegen, Aufräumen per Log nachvollziehbar
                frappe.log_error(title=f"ph_ablage: Objekt {name}:{schluessel} nicht gelöscht")


# ── Check-out ───────────────────────────────────────────────────────────────────────────────────
def sperre_aktiv(d):
    return bool(d.gesperrt_von and d.gesperrt_bis and get_datetime(d.gesperrt_bis) > now_datetime())


def sperre_pruefen(doc, erzwingen=False):
    """Fremder aktiver Check-out → ApiFehler locked 423 (Leitung mit erzwingen=1 darf)."""
    if sperre_aktiv(doc) and doc.gesperrt_von != frappe.session.user:
        from ph_ablage.ph_ablage.rechte import ist_leitung

        if erzwingen and ist_leitung(doc.bezug_doctype):
            return
        raise ApiFehler("locked", 423, _("Die Datei ist ausgecheckt von {0} bis {1}.").format(frappe.utils.get_fullname(doc.gesperrt_von), frappe.utils.format_datetime(doc.gesperrt_bis)), {"gesperrt_von": doc.gesperrt_von, "gesperrt_bis": iso(doc.gesperrt_bis)})


def sperren(doc, stunden=None, hinweis=None):
    sperre_pruefen(doc)
    stunden = min(max(cint(stunden) or cint(einstellungen().sperre_stunden) or 8, 1), 168)
    bis = add_to_date(now_datetime(), hours=stunden)
    doc.db_set({"gesperrt_von": frappe.session.user, "gesperrt_bis": bis, "gesperrt_hinweis": (hinweis or "")[:200] or None})
    protokoll("Gesperrt", datei=doc.name, version=doc.aktuelle_version, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("bis {0}").format(bis))


def entsperren(doc, erzwingen=False):
    if sperre_aktiv(doc):
        sperre_pruefen(doc, erzwingen=erzwingen)
    if doc.gesperrt_von:
        doc.db_set({"gesperrt_von": None, "gesperrt_bis": None, "gesperrt_hinweis": None})
        protokoll("Entsperrt", datei=doc.name, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("erzwungen") if erzwingen else None)


# ── Papierkorb ──────────────────────────────────────────────────────────────────────────────────
def loeschen_pruefen(doc, endgueltig=False):
    from ph_ablage.ph_ablage.rechte import ist_leitung

    leitung = ist_leitung(doc.bezug_doctype)
    ok, grund = regeln.loeschen_erlaubt(doc.aufbewahrungsklasse, doc.aufbewahren_bis, nowdate(), ist_leitung_=leitung)
    if not ok and grund == "aufbewahrung":
        raise ApiFehler("locked", 423, _("Aufbewahrungspflicht bis {0} (Klasse {1}) – Löschen nicht möglich.").format(frappe.utils.formatdate(doc.aufbewahren_bis), _(doc.aufbewahrungsklasse)), {"grund": "aufbewahrung", "aufbewahren_bis": str(doc.aufbewahren_bis)})
    if not ok:
        raise ApiFehler("forbidden", 403, _("Nur die Leitung darf Dateien der Klasse {0} löschen.").format(_(doc.aufbewahrungsklasse)), {"grund": grund})
    if endgueltig and not leitung:
        raise ApiFehler("forbidden", 403, _("Endgültig löschen darf nur die Leitung (sonst nach Ablauf der Papierkorb-Frist automatisch)."))


def in_papierkorb(doc):
    if doc.status == "Papierkorb":
        return
    sperre_pruefen(doc)
    loeschen_pruefen(doc)
    jetzt = now_datetime()
    doc.db_set({"status": "Papierkorb", "geloescht": 1, "geloescht_am": jetzt, "geloescht_von": frappe.session.user, "papierkorb_bis": regeln.papierkorb_bis(jetzt, einstellungen().papierkorb_tage), "gesperrt_von": None, "gesperrt_bis": None})
    freigaben_widerrufen(doc.name, grund=_("Datei im Papierkorb"))
    if cint(doc.portal_freigabe):
        try:
            from ph_ablage.ph_ablage.portal import portal_setzen

            portal_setzen(doc, 0)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_ablage: Portal-Freigabe {doc.name} nicht zurückgezogen")
    protokoll("Geloescht", datei=doc.name, ordner=doc.ordner, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name)


def aus_papierkorb(doc):
    if doc.status != "Papierkorb":
        raise ApiFehler("conflict", 409, _("Die Datei ist nicht im Papierkorb."))
    doc.db_set({"status": "Aktiv", "geloescht": 0, "geloescht_am": None, "geloescht_von": None, "papierkorb_bis": None})
    protokoll("Wiederhergestellt", datei=doc.name, ordner=doc.ordner, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name)


def endgueltig_loeschen(doc, automatisch=False, pruefen=True):
    """Objekte + Datensatz entfernen. pruefen=False nur für DSGVO-Löschung nach eigener Prüfung (kontakt.py)."""
    if pruefen:
        loeschen_pruefen(doc, endgueltig=not automatisch)
    objekte_entfernen(doc)
    for link in frappe.get_all("PH Datei Freigabelink", filters={"datei": doc.name}, pluck="name"):
        frappe.delete_doc("PH Datei Freigabelink", link, ignore_permissions=True, force=True)
    name, ordner, bdt, bn = doc.name, doc.ordner, doc.bezug_doctype, doc.bezug_name
    frappe.delete_doc("PH Datei", name, ignore_permissions=True, force=True, flags={"ph_objekte_entfernt": True})
    protokoll("Endgueltig geloescht", datei=name, ordner=ordner, bezug_doctype=bdt, bezug_name=bn, automatisch=automatisch)


# ── Downloads ───────────────────────────────────────────────────────────────────────────────────
def download_info(doc, version=None, inline=False, art="Download", freigabelink=None, vorschau=False):
    """Kurzlebiger Link: vorsigniert direkt beim Anbieter (S3) oder einmaliger Proxy-Token (alle anderen)."""
    e = einstellungen()
    v = version_zeile(doc, version)
    if vorschau:
        if not v.vorschau_schluessel:
            raise ApiFehler("not_found", 404, _("Keine Vorschau vorhanden."), {"vorschau_status": doc.vorschau_status})
        name, schluessel, mime, dateiname = v.vorschau_speicher, v.vorschau_schluessel, v.vorschau_mime, f"{doc.dateiname}.vorschau"
    else:
        name, schluessel, mime, dateiname = v.speicher, v.schluessel, v.mime or doc.mime, doc.dateiname
    a = adapter(name)
    sekunden = cint(e.presign_sekunden) or 300
    url = None
    if getattr(a, "presign_mit_dateiname", False):
        try:
            url = a.presign_get(schluessel, sekunden, dateiname=dateiname, inline=inline)
        except speicher.NichtGefunden:
            raise ApiFehler("not_found", 404, _("Inhalt im Speicher nicht gefunden."))
    if url:
        weg = "direkt"
    else:
        token = regeln.neues_token(24)
        frappe.cache().set_value(DL_CACHE + regeln.token_hash(token), {"datei": doc.name, "version": cint(v.version), "user": frappe.session.user, "inline": int(bool(inline)), "vorschau": int(bool(vorschau))}, expires_in_sec=sekunden)
        url = f"/api/method/ph_ablage.api.herunterladen?dl={token}"
        weg = "proxy"
    if art:
        protokoll(art, datei=doc.name, version=cint(v.version), freigabelink=freigabelink, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("Vorschau") if vorschau else None)
    return {"url": url, "art": weg, "ablauf": iso(add_to_date(now_datetime(), seconds=sekunden)), "dateiname": doc.dateiname, "groesse": cint(v.groesse), "mime": mime, "version": cint(v.version)}


def proxy_token_lesen(token):
    return frappe.cache().get_value(DL_CACHE + regeln.token_hash(token))


def inhalt_lesen(name, schluessel, max_bytes=None):
    """Objekt vollständig lesen (Jobs, Portal-Kopie). max_bytes überschritten → ValueError."""
    a = speicher.speicher_fuer(name)
    f = a.get(schluessel)
    try:
        if max_bytes:
            daten = f.read(max_bytes + 1)
            if len(daten) > max_bytes:
                raise ValueError("zu_gross")
            return daten
        return f.read()
    finally:
        try:
            f.close()
        except Exception:  # noqa: BLE001
            pass


def sha256_objekt(name, schluessel):
    h = hashlib.sha256()
    n = 0
    f = speicher.speicher_fuer(name).get(schluessel)
    try:
        while True:
            teil = f.read(8 * MB)
            if not teil:
                break
            h.update(teil)
            n += len(teil)
    finally:
        try:
            f.close()
        except Exception:  # noqa: BLE001
            pass
    return h.hexdigest(), n


# ── Freigabelinks ───────────────────────────────────────────────────────────────────────────────
def freigaben_zaehlen(datei):
    n = frappe.db.count("PH Datei Freigabelink", {"datei": datei, "status": "Aktiv", "ablauf": (">", now_datetime())})
    frappe.db.set_value("PH Datei", datei, "freigabelinks_aktiv", n, update_modified=False)
    return n


def freigaben_widerrufen(datei, grund=None):
    for name in frappe.get_all("PH Datei Freigabelink", filters={"datei": datei, "status": "Aktiv"}, pluck="name"):
        frappe.db.set_value("PH Datei Freigabelink", name, {"status": "Widerrufen", "widerrufen_am": now_datetime(), "widerrufen_von": frappe.session.user}, update_modified=False)
        protokoll("Freigabe widerrufen", datei=datei, freigabelink=name, hinweis=grund)
    freigaben_zaehlen(datei)


def freigabelink_erstellen(doc, tage=None, passwort=None, max_downloads=None, version=None, empfaenger_hinweis=None):
    e = einstellungen()
    if doc.status != "Aktiv":
        raise ApiFehler("conflict", 409, _("Nur aktive Dateien können freigegeben werden."))
    tage = cint(tage) or cint(e.freigabe_standard_tage) or 7
    if tage < 1 or tage > cint(e.freigabe_max_tage or 90):
        raise ApiFehler("invalid", 400, _("Gültigkeit 1–{0} Tage.").format(cint(e.freigabe_max_tage or 90)), {"field": "tage"})
    if cint(e.freigabe_passwort_pflicht) and not passwort:
        raise ApiFehler("invalid", 400, _("Für Freigabelinks ist ein Passwort vorgeschrieben."), {"field": "passwort"})
    if passwort and len(str(passwort)) < 6:
        raise ApiFehler("invalid", 400, _("Passwort mindestens 6 Zeichen."), {"field": "passwort"})
    if version:
        version_zeile(doc, version)
    hinweis = str(empfaenger_hinweis or "").strip()[:140] or None
    if hinweis and "@" in hinweis:
        raise ApiFehler("invalid", 400, _("Bitte keine E-Mail-Adresse im Hinweis."), {"field": "empfaenger_hinweis"})
    token = regeln.neues_token(32)
    ablauf = add_to_date(now_datetime(), days=tage)
    link = frappe.get_doc({
        "doctype": "PH Datei Freigabelink", "datei": doc.name, "version": cint(version), "status": "Aktiv", "ablauf": ablauf,
        "token_hash": regeln.token_hash(token), "passwort_hash": regeln.passwort_hash(passwort) if passwort else None,
        "passwort_gesetzt": 1 if passwort else 0, "max_downloads": max(cint(max_downloads), 0), "empfaenger_hinweis": hinweis,
        "erstellt_von": frappe.session.user, "nur_lesen": 1,
    })
    link.flags.ignore_permissions = True
    link.insert()
    freigaben_zaehlen(doc.name)
    protokoll("Freigabe erstellt", datei=doc.name, freigabelink=link.name, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=_("{0} Tage").format(tage) + (_(", Passwort") if passwort else ""))
    basis = str(e.freigabe_basis_url or "").strip()
    return {"freigabelink": link.name, "token": token, "url": (basis.rstrip("/") + "/" + token) if basis else None, "ablauf": iso(ablauf), "passwort": bool(passwort), "max_downloads": link.max_downloads or None, "version": cint(version) or None}


def freigabelink_payload(l):
    return {"freigabelink": l.name, "datei": l.datei, "version": cint(l.version) or None, "status": l.status, "ablauf": iso(l.ablauf), "passwort": cint(l.passwort_gesetzt), "max_downloads": cint(l.max_downloads) or None, "downloads": cint(l.download_zaehler), "letzter_download": iso(l.letzter_download), "empfaenger_hinweis": l.empfaenger_hinweis, "erstellt_von": l.erstellt_von, "erstellt": iso(l.creation)}
