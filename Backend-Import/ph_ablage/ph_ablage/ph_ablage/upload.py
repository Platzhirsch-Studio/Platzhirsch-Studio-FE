"""Upload-Ablauf (zweistufig, für große Office-/CAD-Dateien):

  1. start(...)        → Datei-Datensatz reservieren (Status „Hochladen“), Upload-Token, Ziel:
                          - „direkt“: vorsignierte PUT-URL beim S3-Anbieter (nur s3 und wenn sha256 vorab bekannt –
                            der Anbieter prüft x-amz-checksum-sha256 selbst, der Server sieht die Bytes nicht),
                          - „teile“: Upload in Teilen über ph_ablage.api.upload_chunk (lokal, Drive, OneDrive, S3 ohne sha256).
  2. chunk(...)        → Teil anhängen (fortlaufend, Wiederholung desselben Teils ist harmlos).
  3. abschliessen(...) → Prüfsumme prüfen, Objekt unter dem unveränderlichen Schlüssel ablegen, Version anlegen,
                          Duplikat-Erkennung per sha256, Vorschau/Volltext einreihen.

Zustand im Redis-Cache (`ph_ablage:upload:<sha256(token)>`), Teile unter sites/<site>/private/ph_ablage_tmp/
(nicht unter private/files, nicht im Backup, nicht ausgeliefert). Verwaiste Uploads räumt tasks.uploads_aufraeumen.
"""

import base64
import hashlib
import os

import frappe
from frappe import _
from frappe.utils import add_to_date, cint, getdate, now_datetime

from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln
from ph_core.api import ApiFehler

CACHE = "ph_ablage:upload:"
MB = 1024 * 1024


def tmp_ordner():
    return frappe.get_site_path("private", "ph_ablage_tmp")


def _tmp_pfad(th):
    return os.path.join(tmp_ordner(), f"{th}.part")


def _zustand(token):
    th = regeln.token_hash(token)
    z = frappe.cache().get_value(CACHE + th) if token else None
    if not z:
        raise ApiFehler("invalid_token", 404, _("Upload-Token unbekannt oder abgelaufen."))
    if z.get("user") != frappe.session.user:
        raise ApiFehler("forbidden", 403, _("Upload gehört einem anderen Benutzer."))
    return th, frappe._dict(z)


def _pruefe_datei_daten(dateiname, groesse, sha256, e):
    try:
        name = regeln.dateiname_bereinigen(dateiname)
    except ValueError:
        raise ApiFehler("invalid", 400, _("Dateiname fehlt."), {"field": "dateiname"})
    end = regeln.endung(name)
    ok, grund = regeln.endung_erlaubt(end, set(e.erlaubt) or None, set(e.gesperrt))
    if not ok:
        raise ApiFehler("blocked_type", 415, _("Dateityp „.{0}“ ist in der Ablage nicht erlaubt.").format(end or "?"), {"endung": end, "grund": grund})
    groesse = cint(groesse)
    max_bytes = cint(e.max_groesse_mb) * MB
    if groesse <= 0:
        raise ApiFehler("invalid", 400, _("Größe fehlt."), {"field": "groesse"})
    if groesse > max_bytes:
        raise ApiFehler("too_large", 413, _("Datei größer als {0} MB.").format(cint(e.max_groesse_mb)), {"max_bytes": max_bytes})
    sha = str(sha256 or "").strip().lower() or None
    if sha and not regeln.sha256_hex_gueltig(sha):
        raise ApiFehler("invalid", 400, _("sha256 muss 64 Hex-Zeichen haben."), {"field": "sha256"})
    return name, end, groesse, sha


def start(ordner=None, dateiname=None, groesse=None, mime=None, sha256=None, datei=None, kommentar=None, einchecken=1):
    from ph_ablage.ph_ablage.rechte import pruefe_datei, pruefe_ordner

    e = einstellungen()
    if datei:
        doc = pruefe_datei(datei, "write")
        if doc.status != "Aktiv":
            raise ApiFehler("conflict", 409, _("Neue Versionen nur für aktive Dateien (nicht im Papierkorb)."))
        dienste.sperre_pruefen(doc)
        dateiname = dateiname or doc.dateiname
    else:
        pruefe_ordner(ordner, "create")
    name, end, groesse, sha = _pruefe_datei_daten(dateiname, groesse, sha256, e)
    if datei and end != doc.endung:
        raise ApiFehler("invalid", 400, _("Eine neue Version muss die Endung „.{0}“ haben.").format(doc.endung), {"field": "dateiname"})
    mime = regeln.mime_fuer(name, mime)
    adapter_name = e.speicher_adapter or "lokal"
    a = dienste.adapter(adapter_name)
    if not datei:
        doc = frappe.get_doc({"doctype": "PH Datei", "dateiname": name, "ordner": ordner, "status": "Hochladen", "mime": mime, "quelle": "backoffice", "hochgeladen_von": frappe.session.user})
        doc.flags.ignore_permissions = True
        doc.flags.ph_api = True
        doc.insert()
    version = cint(doc.aktuelle_version) + 1
    token = regeln.neues_token(32)
    th = regeln.token_hash(token)
    stunden = cint(e.upload_token_stunden) or 24
    zustand = {"user": frappe.session.user, "datei": doc.name, "neu": 0 if datei else 1, "dateiname": name, "endung": end, "groesse": groesse, "mime": mime, "sha256": sha, "speicher": adapter_name, "kommentar": (kommentar or "")[:500] or None, "einchecken": cint(einchecken), "version": version, "modus": "teile"}
    ziel = None
    if sha and adapter_name == "s3":
        schluessel = dienste.voller_schluessel(regeln.schluessel(getdate(doc.creation).year, doc.name, version, sha, end))
        put = a.presign_put(schluessel, max(cint(e.presign_sekunden), 900), mime, regeln.sha256_b64(sha))
        if put:
            zustand.update(modus="direkt", schluessel=schluessel)
            ziel = {"art": "direkt", **put}
    if not ziel:
        ziel = {"art": "teile", "methode": "ph_ablage.api.upload_chunk", "chunk_bytes": cint(e.chunk_mb) * MB}
    frappe.cache().set_value(CACHE + th, zustand, expires_in_sec=stunden * 3600)
    return {"token": token, "datei": doc.name, "version": version, "ablauf": dienste.iso(add_to_date(now_datetime(), hours=stunden)), "ziel": ziel, "duplikate": dienste.duplikate(sha, ausser=doc.name) if sha else []}


def chunk(token, offset=0, daten=None):
    th, z = _zustand(token)
    if z.modus != "teile":
        raise ApiFehler("conflict", 409, _("Dieser Upload geht direkt zum Speicher (PUT-URL)."))
    teil = None
    req = getattr(frappe, "request", None)
    if req is not None and getattr(req, "files", None) and req.files.get("chunk"):
        teil = req.files["chunk"].read()
    elif daten:
        try:
            teil = base64.b64decode(daten, validate=True)
        except (ValueError, TypeError):
            raise ApiFehler("invalid", 400, _("Teil ist kein gültiges Base64."), {"field": "daten"})
    if not teil:
        raise ApiFehler("invalid", 400, _("Teil fehlt."), {"field": "daten"})
    os.makedirs(tmp_ordner(), exist_ok=True)
    pfad = _tmp_pfad(th)
    erhalten = os.path.getsize(pfad) if os.path.exists(pfad) else 0
    offset = cint(offset)
    if offset < erhalten and offset + len(teil) <= erhalten:
        return {"erhalten": erhalten, "groesse": z.groesse, "fertig": erhalten == z.groesse}  # Wiederholung
    ok, code = regeln.chunk_pruefen(offset, len(teil), erhalten, z.groesse, cint(einstellungen().chunk_mb) * MB)
    if not ok:
        raise ApiFehler("conflict" if code == "offset" else "invalid", 409 if code == "offset" else 400, _("Teil passt nicht ({0}).").format(code), {"erhalten": erhalten, "grund": code})
    with open(pfad, "ab") as f:
        f.write(teil)
    erhalten += len(teil)
    return {"erhalten": erhalten, "groesse": z.groesse, "fertig": erhalten == z.groesse}


def _hash_datei(pfad):
    h = hashlib.sha256()
    with open(pfad, "rb") as f:
        for teil in iter(lambda: f.read(8 * MB), b""):
            h.update(teil)
    return h.hexdigest()


def abschliessen(token, sha256, bei_duplikat=None):
    th, z = _zustand(token)
    sha = str(sha256 or "").strip().lower()
    if not regeln.sha256_hex_gueltig(sha):
        raise ApiFehler("invalid", 400, _("sha256 muss 64 Hex-Zeichen haben."), {"field": "sha256"})
    if z.sha256 and z.sha256 != sha:
        raise ApiFehler("checksum_mismatch", 422, _("Prüfsumme weicht von der beim Start angegebenen ab."))
    e = einstellungen()
    doc = frappe.get_doc("PH Datei", z.datei)
    a = dienste.adapter(z.speicher)
    version = max(cint(doc.aktuelle_version) + 1, 1)
    if z.modus == "teile":
        pfad = _tmp_pfad(th)
        erhalten = os.path.getsize(pfad) if os.path.exists(pfad) else 0
        if erhalten != z.groesse:
            raise ApiFehler("conflict", 409, _("Upload unvollständig ({0} von {1} Bytes).").format(erhalten, z.groesse), {"erhalten": erhalten})
        ist = _hash_datei(pfad)
        if ist != sha:
            _verwerfen(th, z)
            raise ApiFehler("checksum_mismatch", 422, _("Prüfsumme stimmt nicht – bitte erneut hochladen."), {"erwartet": sha, "ist": ist})
        schluessel = dienste.voller_schluessel(regeln.schluessel(getdate(doc.creation).year, doc.name, version, sha, z.endung))
        with open(pfad, "rb") as f:
            a.put(schluessel, f, z.mime)
        os.unlink(pfad)
        geprueft = 1
    else:
        schluessel = z.schluessel
        kopf = a.head(schluessel)
        if not kopf:
            raise ApiFehler("conflict", 409, _("Im Speicher ist noch nichts angekommen – PUT abgeschlossen?"))
        if kopf.get("groesse") is not None and cint(kopf["groesse"]) != cint(z.groesse):
            a.delete(schluessel)
            _verwerfen(th, z)
            raise ApiFehler("conflict", 409, _("Größe im Speicher ({0}) weicht ab ({1}).").format(kopf["groesse"], z.groesse))
        geprueft = 1 if kopf.get("sha256_b64") and kopf["sha256_b64"] == regeln.sha256_b64(sha) else 0
    dups = dienste.duplikate(sha, ausser=doc.name)
    verhalten = bei_duplikat or e.duplikat_verhalten or "melden"
    if dups and cint(z.neu) and verhalten == "verwerfen":
        if not dienste.objekt_wird_verwendet(z.speicher, schluessel):
            a.delete(schluessel)
        doc.flags.ph_objekte_entfernt = True
        frappe.delete_doc("PH Datei", doc.name, ignore_permissions=True, force=True, flags={"ph_objekte_entfernt": True})
        frappe.cache().delete_value(CACHE + th)
        protokoll("Abgelehnt", datei=z.datei, hinweis=_("Duplikat von {0}").format(dups[0]["datei"]))
        return {"datei": dups[0]["datei"], "duplikat": True, "verworfen": True, "duplikate": dups}
    zeile = {"version": version, "schluessel": schluessel, "speicher": z.speicher, "groesse": z.groesse, "sha256": sha, "geprueft": geprueft, "mime": z.mime, "endung": z.endung, "hochgeladen_von": frappe.session.user, "hochgeladen_am": now_datetime(), "kommentar": z.kommentar, "dateiname_damals": z.dateiname}
    doc.flags.ph_api = True
    dienste.version_anhaengen(doc, zeile)
    if cint(z.einchecken) and doc.gesperrt_von == frappe.session.user:
        doc.db_set({"gesperrt_von": None, "gesperrt_bis": None, "gesperrt_hinweis": None})
    frappe.cache().delete_value(CACHE + th)
    protokoll("Upload" if cint(z.neu) else "Neue Version", datei=doc.name, ordner=doc.ordner, version=version, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=f"{regeln.groesse_text(z.groesse)} · {z.speicher}")
    nach_upload(doc, version, geprueft)
    return {**dienste.datei_payload(doc), "duplikat": bool(dups), "verworfen": False, "duplikate": dups}


def nach_upload(doc, version, geprueft=1):
    """Hintergrundjobs: Vorschau, Volltext, ggf. Prüfsumme; Portal-Version nachziehen. Nie Fehler."""
    try:
        from ph_ablage.ph_ablage.vorschau import einreihen

        einreihen(doc.name, version, pruefsumme=not geprueft and cint(einstellungen().s3_pruefsumme_nachrechnen))
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Jobs für {doc.name} nicht eingereiht")
    if cint(doc.portal_freigabe):
        try:
            from ph_ablage.ph_ablage.portal import portal_setzen

            portal_setzen(doc, 1)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_ablage: Portal-Version {doc.name} nicht aktualisiert")


def _verwerfen(th, z):
    pfad = _tmp_pfad(th)
    if os.path.exists(pfad):
        os.unlink(pfad)
    frappe.cache().delete_value(CACHE + th)
