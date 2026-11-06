"""Bautagebuch und Referenz-Freigabe für die Website (src/lib/portal/tagebuch/adapter.js, service.js).

Rollen: rolle="team" (Website-Teamsitzung, nur API-Token) oder Kunde (kontakt + kunde_token).
Dateien: die Website kodiert Bilder neu (AVIF/WebP 640/1280/1920, EXIF/GPS entfernt) und schickt sie
als Base64-Liste; sie werden als private Files an PH Tagebuch Foto gehängt (<foto_id>-<w>.<fmt>).

  tagebuch_list(rolle, kontakt, kunde_token, projekt)                      → {projektId, titel, raum, fotos[]}
  tagebuch_add(rolle, kontakt, kunde_token, projekt, foto, dateien)         → foto
  tagebuch_delete(rolle, kontakt, kunde_token, projekt, foto_id)            → {ok}
  tagebuch_file(rolle, kontakt, kunde_token, projekt, datei)                → {name, mime, content_base64}
  referenz_create(kontakt, kunde_token, projekt, eintrag)                   → freigabe
  referenz_update(rolle, kontakt, kunde_token, freigabe_id, aktion, daten)  → freigabe   (veroeffentlichen/ablehnen/zurueckziehen: team; widerrufen: kunde)
  referenz_list(rolle, kontakt, kunde_token, projekt?, status[])            → freigabe[]
  referenz_file(freigabe_id, datei)                                         → Datei nur bei Status Veroeffentlicht (öffentliche Seite)
"""

import base64
import json
import mimetypes

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_core.api import ApiFehler, ip_hash, ph_api, text
from ph_projekte.api.basis import kunde, projekt_des_kunden, team_oder_kunde
from ph_projekte.ph_projekte.helfer import datei_anhaengen, iso, kunden_name
from ph_projekte.utils.portal import FOTO_ID_RE, FREIGABE_ID_RE, REFERENZ_AKTIV, REFERENZ_STATUS_WEB, ist_adresse, referenz_veroeffentlichbar, tagebuch_upload_erlaubt

MAX_BILD_BYTES = 25 * 1024 * 1024
BILD_MIME = {"avif": "image/avif", "webp": "image/webp", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}


def _foto_payload(f):
    varianten = f.varianten
    if isinstance(varianten, str):
        try:
            varianten = json.loads(varianten)
        except ValueError:
            varianten = []
    out = {
        "id": f.name,
        "phase": f.phase,
        "titel": f.titel or "",
        "von": f.von,
        "autor": f.autor or "",
        "hochgeladenAm": iso(f.hochgeladen_am),
        "breite": f.breite,
        "hoehe": f.hoehe,
        "varianten": varianten or [],
        "metadatenEntfernt": bool(f.metadaten_entfernt),
        "gpsEntfernt": bool(f.gps_entfernt),
        "beispiel": bool(f.beispiel),
    }
    if f.echt_bestaetigt:
        out["echtBestaetigt"] = True
        out["urheber"] = f.urheber or ""
    return out


FOTO_FELDER = ["name", "phase", "titel", "von", "autor", "hochgeladen_am", "breite", "hoehe", "varianten", "metadaten_entfernt", "gps_entfernt", "echt_bestaetigt", "urheber", "beispiel"]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def tagebuch_list(projekt, rolle="kunde", kontakt=None, kunde_token=None):
    rolle, kontakt, projekt = team_oder_kunde(rolle, kontakt, kunde_token, projekt)
    p = frappe.db.get_value("PH Projekt", projekt, ["titel", "raum", "creation"], as_dict=True)
    fotos = frappe.get_all("PH Tagebuch Foto", filters={"projekt": projekt}, fields=FOTO_FELDER, order_by="hochgeladen_am asc")
    return {"projektId": projekt, "kundeId": kontakt, "titel": p.titel, "raum": p.raum or "", "erstellt": iso(p.creation), "fotos": [_foto_payload(f) for f in fotos]}


TEAM_ROLLEN = ("PH Projekte Mitarbeiter", "PH Projekte Leitung", "System Manager", "PH Website Integration")


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api(intern=True)
def tagebuch_list_alle(rolle="team", seite=1, groesse=20, suche=None, nur_mit_fotos=0):
    """Teamansicht Bautagebuch über alle Projekte (Website `listeTagebuecher`, 60-…, Lücke ph_projekte 2).
    Nur Team: PH Projekte Mitarbeiter/Leitung (Desk/Backoffice) bzw. Website-Teamsitzung (API-Token). Paginiert, jüngste
    Aktivität zuerst. → {items: [{projektId, kundeId, titel, raum, erstellt, fotos, letztesFoto}], seite, groesse, gesamt}"""
    from ph_projekte.utils.portal_sitzung import seite as seite_fn

    if str(rolle or "").lower() != "team":
        raise ApiFehler("forbidden", 403, _("Nur für das Team."))
    if frappe.session.user != "Administrator" and not set(TEAM_ROLLEN) & set(frappe.get_roles()):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    start, limit = seite_fn(seite, groesse)
    zaehler = {r.projekt: r for r in frappe.get_all("PH Tagebuch Foto", fields=["projekt", "count(name) as anzahl", "max(hochgeladen_am) as letztes"], group_by="projekt")}
    filters = {}
    if cint(nur_mit_fotos):
        filters["name"] = ("in", list(zaehler) or [""])
    or_filters = None
    q = text(suche, 80)
    if q:
        or_filters = [["titel", "like", f"%{q}%"], ["kunde_name", "like", f"%{q}%"], ["name", "like", f"%{q}%"]]
    gesamt = len(frappe.get_all("PH Projekt", filters=filters, or_filters=or_filters, pluck="name"))
    rows = frappe.get_all("PH Projekt", filters=filters, or_filters=or_filters, fields=["name", "kontakt", "titel", "raum", "creation", "modified"], order_by="modified desc", start=start, page_length=limit)
    items = []
    for p in rows:
        z = zaehler.get(p.name)
        items.append({"projektId": p.name, "kundeId": p.kontakt, "titel": p.titel, "raum": p.raum or "", "erstellt": iso(p.creation), "fotos": cint(z.anzahl) if z else 0, "letztesFoto": iso(z.letztes) if z and z.letztes else None})
    return {"items": items, "seite": start // limit + 1, "groesse": limit, "gesamt": gesamt}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=30, referenz=lambda r: ("PH Tagebuch Foto", r["id"]))
def tagebuch_add(projekt, foto, dateien=None, rolle="kunde", kontakt=None, kunde_token=None):
    """foto: {phase, titel, echt?, autor?, breite, hoehe, varianten[{w,h}], gpsEntfernt?, id?}
    dateien: [{name: "f-xxx-1280.webp", content_base64}] (die Website liefert die fertigen Varianten)."""
    if not cint(frappe.db.get_single_value("PH Projekte Einstellungen", "tagebuch_aktiv")):
        raise ApiFehler("unavailable", 503, _("Das Projekt-Tagebuch ist noch nicht verfügbar."))
    rolle, kontakt, projekt = team_oder_kunde(rolle, kontakt, kunde_token, projekt)
    if isinstance(foto, str):
        foto = json.loads(foto)
    if isinstance(dateien, str):
        dateien = json.loads(dateien)
    foto = foto or {}
    phase = text(foto.get("phase"), 20)
    echt = foto.get("echt") in (True, "ja", 1, "1")
    ok, grund = tagebuch_upload_erlaubt(phase, rolle, echt)
    if not ok:
        meldung = {"phase": _("Unbekannte Phase."), "nur_team": _("Fotos dieser Phase lädt das Studio-Team hoch."), "echt": _("Bitte bestätigen: Foto oder Scan des echten Originals (keine KI).")}[grund]
        raise ApiFehler("forbidden" if grund == "nur_team" else "invalid", 403 if grund == "nur_team" else 400, meldung, {"field": grund})
    maximum = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "max_fotos_je_projekt")) or 120
    if frappe.db.count("PH Tagebuch Foto", {"projekt": projekt}) >= maximum:
        raise ApiFehler("conflict", 409, _("Höchstens {0} Fotos je Projekt.").format(maximum))
    foto_id = text(foto.get("id"), 12)
    if foto_id and (not FOTO_ID_RE.match(foto_id) or frappe.db.exists("PH Tagebuch Foto", foto_id)):
        raise ApiFehler("conflict", 409, _("Foto-ID ungültig oder vergeben."))
    dateien = dateien or []
    if not dateien:
        raise ApiFehler("invalid", 400, _("Keine Bilddateien erhalten."))
    inhalte = []
    for d in dateien[:6]:
        name = text(d.get("name"), 80)
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        if ext not in BILD_MIME:
            raise ApiFehler("invalid", 415, _("Dateiformat nicht unterstützt: {0}").format(name))
        try:
            daten = base64.b64decode(d.get("content_base64") or "", validate=True)
        except Exception:  # noqa: BLE001
            raise ApiFehler("invalid", 400, _("Datei {0} ist kein gültiges Base64.").format(name)) from None
        if not daten or len(daten) > MAX_BILD_BYTES:
            raise ApiFehler("invalid", 413, _("Datei {0} ist leer oder zu groß.").format(name))
        inhalte.append((name, daten))
    autor = text(foto.get("autor"), 80) or (kunden_name(kontakt).split(" ")[0] if rolle == "kunde" else "Platzhirsch")
    doc = frappe.get_doc(
        {
            "doctype": "PH Tagebuch Foto",
            "foto_id": foto_id or None,
            "projekt": projekt,
            "kontakt": kontakt,
            "phase": phase,
            "titel": text(foto.get("titel"), 120),
            "von": rolle,
            "autor": autor,
            "hochgeladen_am": now_datetime(),
            "breite": cint(foto.get("breite")),
            "hoehe": cint(foto.get("hoehe")),
            "varianten": foto.get("varianten") or [],
            "metadaten_entfernt": 1,
            "gps_entfernt": 1 if foto.get("gpsEntfernt") else 0,
            "echt_bestaetigt": 1 if echt else 0,
            "urheber": text(foto.get("urheber"), 80),
            "beispiel": 1 if foto.get("beispiel") else 0,
            "quelle": "website",
            "ip_hash": ip_hash(),
        }
    )
    doc.insert(ignore_permissions=True)
    groesste = None
    for name, daten in inhalte:
        if not name.startswith(doc.name):
            name = f"{doc.name}-{name}"
        f = datei_anhaengen("PH Tagebuch Foto", doc.name, name, daten)
        groesste = f.file_url
    if groesste:
        doc.db_set("bild", groesste, update_modified=False)
    f = frappe.get_all("PH Tagebuch Foto", filters={"name": doc.name}, fields=FOTO_FELDER)[0]
    return _foto_payload(f)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=30)
def tagebuch_delete(projekt, foto_id, rolle="kunde", kontakt=None, kunde_token=None):
    rolle, kontakt, projekt = team_oder_kunde(rolle, kontakt, kunde_token, projekt)
    foto_id = text(foto_id, 12)
    f = frappe.db.get_value("PH Tagebuch Foto", {"name": foto_id, "projekt": projekt}, ["name", "von"], as_dict=True)
    if not f:
        raise ApiFehler("not_found", 404, _("Foto nicht gefunden."))
    if rolle != "team" and f.von != "kunde":
        raise ApiFehler("forbidden", 403, _("Fotos des Studio-Teams kann nur das Team entfernen."))
    for z in frappe.get_all("PH Referenz Bild", filters={"foto": foto_id, "parenttype": "PH Referenz"}, fields=["parent"]):
        if frappe.db.get_value("PH Referenz", z.parent, "status") in REFERENZ_AKTIV:
            raise ApiFehler("conflict", 409, _("Dieses Foto ist Teil einer Referenz-Freigabe. Bitte zuerst die Freigabe widerrufen."))
    frappe.delete_doc("PH Tagebuch Foto", foto_id, ignore_permissions=True)
    return {"ok": True}


def _datei_lesen(doctype, docname, datei):
    datei = text(datei, 120)
    name = frappe.db.get_value("File", {"attached_to_doctype": doctype, "attached_to_name": docname, "file_name": datei}, "name")
    if not name:
        raise ApiFehler("not_found", 404, _("Datei nicht gefunden."))
    f = frappe.get_doc("File", name)
    inhalt = f.get_content()
    return {"name": f.file_name, "mime": mimetypes.guess_type(f.file_name)[0] or BILD_MIME.get(f.file_name.rsplit(".", 1)[-1].lower(), "application/octet-stream"), "size": len(inhalt), "content_base64": base64.b64encode(inhalt).decode()}


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api(limit_pro_minute=240)
def tagebuch_file(projekt, datei, rolle="kunde", kontakt=None, kunde_token=None):
    """Bildvariante eines Tagebuch-Fotos (privat): datei = "<foto_id>-<w>.<fmt>"."""
    rolle, kontakt, projekt = team_oder_kunde(rolle, kontakt, kunde_token, projekt)
    foto_id = text(datei, 120).split("-")
    foto_id = "-".join(foto_id[:2]) if len(foto_id) >= 2 else ""
    if not frappe.db.exists("PH Tagebuch Foto", {"name": foto_id, "projekt": projekt}):
        raise ApiFehler("not_found", 404, _("Foto nicht gefunden."))
    return _datei_lesen("PH Tagebuch Foto", foto_id, datei)


# ── Referenz-Freigabe ─────────────────────────────────────────────────────────

def _freigabe_payload(name):
    r = frappe.get_doc("PH Referenz", name)

    def js(wert, standard):
        if isinstance(wert, str):
            try:
                return json.loads(wert)
            except ValueError:
                return standard
        return wert if wert is not None else standard

    anzeige = {"art": r.anzeige_art}
    if r.anzeige_art == "vorname_ort":
        anzeige.update(vorname=r.anzeige_vorname or "", ort=r.anzeige_ort or "")
    out = {
        "id": r.name,
        "projektId": r.projekt,
        "kundeId": r.kontakt,
        "status": REFERENZ_STATUS_WEB.get(r.status, r.status.lower()),
        "erstellt": iso(r.eingereicht_am or r.creation),
        "beispiel": bool(r.beispiel),
        "anzeige": anzeige,
        "bilder": [{"id": b.foto, "phase": b.phase, "titel": b.titel or "", "von": b.von, "breite": b.breite, "hoehe": b.hoehe, "varianten": js(b.varianten, [])} for b in r.bilder],
        "einwilligung": {"erteilt": True, "version": r.einwilligung_version, "textStatus": r.einwilligung_textstatus, "text": (r.einwilligung_text or "").split("\n\n") if r.einwilligung_text else [], "zeitpunkt": iso(r.einwilligung_zeitpunkt), "kanal": r.einwilligung_kanal},
        "verlauf": js(r.verlauf, []),
    }
    if r.widerruf_zeitpunkt:
        out["widerruf"] = {"zeitpunkt": iso(r.widerruf_zeitpunkt), "kanal": r.widerruf_kanal}
    if r.geprueft_am or r.slug:
        out["pruefung"] = {
            "slug": r.slug or "",
            "titel": r.titel or "",
            "typologie": r.typologie or "",
            "leistungen": js(r.leistungen, []),
            "zeitraumVon": r.zeitraum_von or "",
            "zeitraumBis": r.zeitraum_bis or "",
            "ausgangslage": r.ausgangslage or "",
            "loesung": js(r.loesung, []),
            "alt": {b.foto: b.alt for b in r.bilder if b.alt},
            "von": frappe.db.get_value("User", r.geprueft_von, "full_name") if r.geprueft_von else "",
            "am": iso(r.geprueft_am),
            "notiz": r.notiz or "",
        }
    return out


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=10, referenz=lambda r: ("PH Referenz", r["id"]))
def referenz_create(kontakt, kunde_token, projekt, eintrag):
    """freigabeInputSchema: {fotoIds[], anzeige, vorname?, ort?, einwilligung: true, version} + einwilligung_text/textStatus."""
    if not cint(frappe.db.get_single_value("PH Projekte Einstellungen", "referenz_freigabe_aktiv")):
        raise ApiFehler("unavailable", 503, _("Die Referenz-Freigabe ist noch nicht verfügbar."))
    k = kunde(kontakt, kunde_token)
    projekt = projekt_des_kunden(k["name"], projekt)
    if isinstance(eintrag, str):
        eintrag = json.loads(eintrag)
    eintrag = eintrag or {}
    foto_ids = [text(x, 12) for x in (eintrag.get("fotoIds") or [])]
    if not 1 <= len(foto_ids) <= 12 or len(set(foto_ids)) != len(foto_ids):
        raise ApiFehler("invalid", 400, _("Bitte 1 bis 12 verschiedene Fotos auswählen."), {"field": "fotoIds"})
    if eintrag.get("einwilligung") is not True:
        raise ApiFehler("invalid", 400, _("Bitte die Einwilligung bestätigen."), {"field": "einwilligung"})
    if frappe.get_all("PH Referenz", filters={"projekt": projekt, "status": ("in", REFERENZ_AKTIV)}, limit=1):
        raise ApiFehler("conflict", 409, _("Für dieses Projekt gibt es schon eine aktive Freigabe. Widerrufen Sie sie, um eine neue zu erstellen."))
    fotos = {f.name: f for f in frappe.get_all("PH Tagebuch Foto", filters={"name": ("in", foto_ids), "projekt": projekt}, fields=FOTO_FELDER + ["bild"])}
    if len(fotos) != len(foto_ids):
        raise ApiFehler("invalid", 400, _("Ein ausgewähltes Foto gibt es nicht mehr."))
    anzeige = text(eintrag.get("anzeige"), 20)
    if anzeige not in ("anonym", "vorname_ort"):
        raise ApiFehler("invalid", 400, _("Nennung ungültig."), {"field": "anzeige"})
    vorname, ort = text(eintrag.get("vorname"), 40), text(eintrag.get("ort"), 60)
    if anzeige == "vorname_ort" and (not vorname or not ort or ist_adresse(ort)):
        raise ApiFehler("invalid", 400, _("Bitte nur Vorname und Gemeinde/Region angeben (keine Adresse)."), {"field": "ort"})
    ew = eintrag.get("einwilligung_text") or eintrag.get("einwilligungText") or []
    doc = frappe.get_doc(
        {
            "doctype": "PH Referenz",
            "projekt": projekt,
            "kontakt": k["name"],
            "status": "Eingereicht",
            "beispiel": 1 if any(fotos[i].beispiel for i in foto_ids) else 0,
            "anzeige_art": anzeige,
            "anzeige_vorname": vorname if anzeige == "vorname_ort" else None,
            "anzeige_ort": ort if anzeige == "vorname_ort" else None,
            "einwilligung_version": text(eintrag.get("version"), 80),
            "einwilligung_textstatus": "freigegeben" if eintrag.get("textStatus") == "freigegeben" else "entwurf",
            "einwilligung_text": "\n\n".join(ew) if isinstance(ew, list) else str(ew),
            "einwilligung_zeitpunkt": now_datetime(),
            "einwilligung_kanal": "Kundenportal",
            "bilder": [{"foto": i, "phase": fotos[i].phase, "titel": fotos[i].titel, "von": fotos[i].von, "breite": fotos[i].breite, "hoehe": fotos[i].hoehe, "varianten": fotos[i].varianten} for i in foto_ids],
            "quelle": "website",
            "ip_hash": ip_hash(),
        }
    )
    doc.insert(ignore_permissions=True)
    # Bildkopien an die Referenz hängen (Widerruf löscht genau diese Kopien).
    for i in foto_ids:
        for fd in frappe.get_all("File", filters={"attached_to_doctype": "PH Tagebuch Foto", "attached_to_name": i}, fields=["name", "file_name"]):
            try:
                quelle = frappe.get_doc("File", fd.name)
                kopie = datei_anhaengen("PH Referenz", doc.name, fd.file_name, quelle.get_content())
                if fotos[i].bild and quelle.file_url == fotos[i].bild:
                    for b in doc.bilder:
                        if b.foto == i:
                            frappe.db.set_value("PH Referenz Bild", b.name, "datei", kopie.file_url, update_modified=False)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="referenz_create: Bildkopie fehlgeschlagen")
    return _freigabe_payload(doc.name)


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def referenz_list(rolle="kunde", kontakt=None, kunde_token=None, projekt=None, status=None):
    if isinstance(status, str):
        try:
            status = json.loads(status)
        except ValueError:
            status = [status]
    web_zu_db = {v: k for k, v in REFERENZ_STATUS_WEB.items()}
    filters = {}
    if status:
        filters["status"] = ("in", [web_zu_db.get(s, s) for s in status])
    if str(rolle or "").lower() == "team":
        if projekt:
            filters["projekt"] = text(projekt, 80)
    else:
        k = kunde(kontakt, kunde_token)
        filters["kontakt"] = k["name"]
        if projekt:
            filters["projekt"] = projekt_des_kunden(k["name"], projekt)
    return [_freigabe_payload(n) for n in frappe.get_all("PH Referenz", filters=filters, pluck="name", order_by="eingereicht_am desc")]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=20, referenz=lambda r: ("PH Referenz", r["id"]))
def referenz_update(freigabe_id, aktion, rolle="kunde", kontakt=None, kunde_token=None, daten=None):
    """pruefungSchema: aktion veroeffentlichen {slug,titel,typologie,leistungen,zeitraumVon,zeitraumBis,ausgangslage,loesung,alt}
    | ablehnen {notiz} | zurueckziehen {notiz} (alle team) | widerrufen (kunde)."""
    freigabe_id = text(freigabe_id, 13)
    if not FREIGABE_ID_RE.match(freigabe_id) or not frappe.db.exists("PH Referenz", freigabe_id):
        raise ApiFehler("not_found", 404, _("Freigabe nicht gefunden."))
    if isinstance(daten, str):
        daten = json.loads(daten)
    daten = daten or {}
    doc = frappe.get_doc("PH Referenz", freigabe_id)
    team = str(rolle or "").lower() == "team"
    aktion = text(aktion, 20)
    if aktion == "widerrufen":
        if team:
            kanal = text(daten.get("kanal"), 40) or "E-Mail"
        else:
            k = kunde(kontakt, kunde_token)
            if doc.kontakt != k["name"]:
                raise ApiFehler("not_found", 404, _("Freigabe nicht gefunden."))
            kanal = "Kundenportal"
        if doc.status not in REFERENZ_AKTIV:
            raise ApiFehler("conflict", 409, _("Diese Freigabe ist nicht aktiv."))
        doc.status = "Widerrufen"
        doc.widerruf_zeitpunkt = now_datetime()
        doc.widerruf_kanal = kanal
        doc.flags.ignore_permissions = True
        doc.save()
        return _freigabe_payload(doc.name)
    if not team:
        raise ApiFehler("forbidden", 403, _("Nur das Studio prüft Freigaben."))
    if aktion == "veroeffentlichen":
        if doc.status != "Eingereicht":
            raise ApiFehler("conflict", 409, _("Nur eingereichte Freigaben können veröffentlicht werden."))
        doc.slug = text(daten.get("slug"), 80)
        doc.titel = text(daten.get("titel"), 120)
        doc.typologie = text(daten.get("typologie"), 60)
        doc.leistungen = json.dumps(daten.get("leistungen") or [], ensure_ascii=False)
        doc.zeitraum_von = text(daten.get("zeitraumVon"), 7)
        doc.zeitraum_bis = text(daten.get("zeitraumBis"), 7)
        doc.ausgangslage = text(daten.get("ausgangslage"), 1200)
        doc.loesung = daten.get("loesung") or []
        alt = daten.get("alt") or {}
        for b in doc.bilder:
            if alt.get(b.foto):
                b.alt = text(alt[b.foto], 200)
        fehlt = referenz_veroeffentlichbar(doc._als_pruefdict())
        if fehlt:
            raise ApiFehler("invalid", 400, _("Es fehlt/stimmt nicht: {0}").format(", ".join(fehlt)), {"fields": fehlt})
        if doc.slug and frappe.db.exists("PH Referenz", {"slug": doc.slug, "name": ("!=", doc.name)}):
            raise ApiFehler("conflict", 409, _("Slug ist schon vergeben."), {"field": "slug"})
        doc.status = "Veroeffentlicht"
        doc.geprueft_von = frappe.session.user
        doc.geprueft_am = now_datetime()
    elif aktion == "ablehnen":
        if doc.status != "Eingereicht":
            raise ApiFehler("conflict", 409, _("Nur eingereichte Freigaben können abgelehnt werden."))
        doc.status = "Abgelehnt"
        doc.notiz = text(daten.get("notiz"), 500)
        doc.geprueft_von = frappe.session.user
        doc.geprueft_am = now_datetime()
    elif aktion == "zurueckziehen":
        if doc.status != "Veroeffentlicht":
            raise ApiFehler("conflict", 409, _("Nur veröffentlichte Referenzen können zurückgezogen werden."))
        doc.status = "Eingereicht"
        doc.notiz = text(daten.get("notiz"), 500)
    else:
        raise ApiFehler("invalid", 400, _("Unbekannte Aktion."))
    doc.flags.ignore_permissions = True
    doc.save()
    return _freigabe_payload(doc.name)


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api(limit_pro_minute=600)
def referenz_file(freigabe_id, datei):
    """Bild einer veröffentlichten Referenz (für /de/projekte/<slug>); die Website liefert es öffentlich aus.
    Bei jedem anderen Status 404 – kein öffentlicher Frappe-File-Link."""
    freigabe_id = text(freigabe_id, 13)
    if frappe.db.get_value("PH Referenz", freigabe_id, "status") != "Veroeffentlicht":
        raise ApiFehler("not_found", 404, _("Nicht gefunden."))
    return _datei_lesen("PH Referenz", freigabe_id, datei)
