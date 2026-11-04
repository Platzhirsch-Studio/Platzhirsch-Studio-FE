"""Whitelisted Methoden von ph_projekte.

1. Kundenportal (Website → Frappe, Token des Benutzers website@platzhirsch.studio + `kunde_token`):
   Antwortformen exakt wie der Mock-Adapter der Website (src/lib/portal/adapters/mock.js, interface.js),
   damit der Frappe-Adapter (src/lib/portal/adapters/frappe.js) nur noch die Methoden aufruft.

     portal_login_token(email)                      → {kontakt, kunde_token, customer}   (Website mailt den Magic-Link)
     portal_find_customer(email)                    → Customer | null                     (nur Server)
     portal_customer(kontakt, kunde_token)          → Customer
     portal_projects(kontakt, kunde_token)          → Project[]
     portal_project(kontakt, kunde_token, projekt)  → Project | null
     portal_documents(kontakt, kunde_token, type?, projekt?) → PortalDocument[] (PH Projekt Dokument; Belege aus ph_faktura.api.portal_documents)
     portal_appointments(kontakt, kunde_token, projekt?, von?) → Appointment[] (PH Termin aus ph_crm, Montagen, Fremdgewerke)
     portal_product_passes(kontakt, kunde_token, projekt?) / portal_product_pass(kontakt, kunde_token, pass) → ProductPass
     portal_renderings(kontakt, kunde_token, projekt) → Rendering[]
     portal_feedback_list(kontakt, kunde_token, projekt) → Entry[]   (Form wie planungStore.strip)
     portal_add_feedback(kontakt, kunde_token, eintrag, audio_base64?, audio_mime?) → {id, createdAt, entry}
     portal_messages / portal_send_message / portal_mark_read
     portal_request_planning(kontakt, kunde_token, eintrag) → {id, createdAt}  (PH Anfrage art=Beratung)
     portal_file(kontakt, kunde_token, file_url)    → {name, mime, size, content_base64}  (nur eigene, private Dateien)
   Tagebuch/Referenz: ph_projekte.api.tagebuch (hier re-exportiert).

2. Desk: auftragsmappe(projekt) für die Page „ph-auftragsmappe“, projekt_aus_anfrage(anfrage),
   Number-Card-Methoden anzahl_offene_maengel / anzahl_renderings_ohne_antwort.

Fehlercodes wie die Website (CONVENTIONS 11): invalid 400, forbidden 403, not_found/invalid_token 404,
conflict 409, rate_limited 429, unavailable 503.
"""

import base64
import json

import frappe
from frappe import _
from frappe.utils import add_days, cint, get_datetime, now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
from ph_projekte.api.basis import customer, kontakt_meta_ok, kunde, projekt_des_kunden
from ph_projekte.api.tagebuch import (  # noqa: F401 – re-export für ph_projekte.api.tagebuch_*
    referenz_create,
    referenz_file,
    referenz_list,
    referenz_update,
    tagebuch_add,
    tagebuch_delete,
    tagebuch_file,
    tagebuch_list,
)
from ph_projekte.ph_projekte.helfer import datei_anhaengen, iso, kunden_name, privat_datei
from ph_projekte.utils.portal import (
    GEWERK_STATUS_WEB,
    GEWERK_ZU_TRADE,
    PHASE_ZU_STEP,
    audio_pruefen,
    audio_signatur_ok,
    feedback_pruefen,
    neuer_token,
    steps_fuer_phase,
    token_hash,
)

DOKUMENT_TYP = {"Angebot": "angebot", "Auftragsbestaetigung": "auftragsbestaetigung", "Lieferschein": "lieferschein", "Rechnung": "rechnung"}
TERMINART_KIND = {"Beratung": "beratung", "Aufmass": "aufmass", "Aufmaß": "aufmass", "Planung": "planung", "Lieferung": "lieferung", "Montage": "montage", "Uebergabe": "uebergabe", "Übergabe": "uebergabe"}
MAX_DATEI_BYTES = 25 * 1024 * 1024

# Kundenprüfung und Customer-Form: ph_projekte/api/basis.py (gemeinsam mit api/tagebuch.py)
_kontakt_meta_ok = kontakt_meta_ok
_kunde = kunde
_customer = customer
_projekt_des_kunden = projekt_des_kunden


# ── Login / Kunde ──────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=20)
def portal_login_token(email):
    """Magic-Link-Anfrage der Website: erzeugt den Kunden-Token (Hash in PH Kontakt), die Website mailt.
    Antwort ist für unbekannte E-Mails bewusst gleich (kein Nutzer-Enumerieren): {found: false}."""
    email = text(email, 254).lower()
    pflicht({"email": email}, "email")
    _kontakt_meta_ok()
    name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if not name:
        return {"found": False}
    meta = frappe.get_meta("PH Kontakt")
    if meta.has_field("portal_aktiv") and not cint(frappe.db.get_value("PH Kontakt", name, "portal_aktiv")):
        return {"found": False}
    token = neuer_token()
    werte = {"portal_token_hash": token_hash(token)}
    if meta.has_field("portal_letzter_login"):
        werte["portal_letzter_login"] = now_datetime()
    frappe.db.set_value("PH Kontakt", name, werte, update_modified=False)
    k = _kunde(name, token)
    return {"found": True, "kontakt": name, "kunde_token": token, "customer": _customer(k)}


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api(limit_pro_minute=30)
def portal_find_customer(email):
    """findCustomerByEmail (nur Server, Auth-Zweck): Customer ohne Token oder null."""
    email = text(email, 254).lower()
    pflicht({"email": email}, "email")
    _kontakt_meta_ok()
    name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if not name:
        return None
    k = frappe.db.get_value("PH Kontakt", name, ["name", "email", "anrede", "vorname", "nachname", "firma", "telefon", "berater"], as_dict=True)
    return _customer(k)


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_customer(kontakt, kunde_token):
    return _customer(_kunde(kontakt, kunde_token))


# ── Projekte ──────────────────────────────────────────────────────────────────

def _projekt_payload(p, preise_erlaubt=False):
    verlauf = {}
    for z in frappe.get_all("PH Projekt Phase", filters={"parent": p.name, "parenttype": "PH Projekt"}, fields=["phase", "datum"], order_by="datum asc"):
        verlauf.setdefault(z.phase, iso(z.datum))
    termine = {"lieferung": iso(p.liefertermin_geplant), "montage": iso(p.montage_von), "uebergabe": iso(p.uebergabe_am)}
    items = []
    for pos in frappe.get_all("PH Projekt Position", filters={"parent": p.name, "parenttype": "PH Projekt"}, fields=["name", "bezeichnung", "marke", "kategorie", "menge", "ausfuehrung_text", "status", "produktpass", "preis_cent"], order_by="idx asc"):
        item = {"id": pos.name, "name": pos.bezeichnung, "brand": pos.marke or "", "category": pos.kategorie or "", "quantity": int(pos.menge or 1), "variant": pos.ausfuehrung_text or "", "status": pos.status or "geplant", "productPassId": pos.produktpass}
        if preise_erlaubt and pos.preis_cent:
            item["priceCent"] = int(pos.preis_cent)
        items.append(item)
    trades = []
    for g in frappe.get_all("PH Fremdgewerk", filters={"projekt": p.name, "kunde_sichtbar": 1, "status": ("!=", "Abgesagt")}, fields=["name", "gewerk", "partner_text", "status", "leistung", "termin", "termin_von"], order_by="termin_von asc"):
        trades.append({"id": g.name, "trade": GEWERK_ZU_TRADE.get(g.gewerk, "tischler"), "company": g.partner_text or "Partnerbetrieb (Name folgt)", "status": GEWERK_STATUS_WEB.get(g.status, "offen"), "scope": g.leistung or "", "appointmentId": g.termin or (g.name if g.termin_von else None)})
    return {
        "id": p.name,
        "title": p.titel,
        "room": p.raum or "",
        "currentStep": PHASE_ZU_STEP.get(p.status, "anfrage"),
        "steps": steps_fuer_phase(p.status, verlauf, termine),
        "items": items,
        "trades": trades,
        "createdAt": iso(p.eingang or p.creation),
        "updatedAt": iso(p.modified),
        "summary": p.kurzbeschreibung or "",
        "note": p.portal_hinweis or "",
        "aiGeneratedHint": bool(p.ki_generiert_hinweis),
        "cancelled": p.status == "Abgebrochen",
    }


PROJEKT_FELDER = ["name", "titel", "raum", "status", "eingang", "creation", "modified", "kurzbeschreibung", "portal_hinweis", "ki_generiert_hinweis", "liefertermin_geplant", "montage_von", "uebergabe_am", "portal_positionen_preise"]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_projects(kontakt, kunde_token):
    k = _kunde(kontakt, kunde_token)
    rows = frappe.get_all("PH Projekt", filters={"kontakt": k["name"], "portal_sichtbar": 1}, fields=PROJEKT_FELDER, order_by="modified desc")
    return [_projekt_payload(p, bool(p.portal_positionen_preise)) for p in rows]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_project(kontakt, kunde_token, projekt):
    k = _kunde(kontakt, kunde_token)
    try:
        name = _projekt_des_kunden(k["name"], projekt)
    except ApiFehler as e:
        if e.code == "not_found":
            return None
        raise
    p = frappe.get_all("PH Projekt", filters={"name": name}, fields=PROJEKT_FELDER)[0]
    return _projekt_payload(p, bool(p.portal_positionen_preise))


# ── Dokumente ─────────────────────────────────────────────────────────────────

def _dokument_payload(d):
    datei = privat_datei(d.datei)
    typ = DOKUMENT_TYP.get(d.kategorie, d.kategorie.lower())
    return {
        "id": d.name,
        "type": typ,
        "category": d.kategorie,
        "projectId": d.projekt,
        "title": d.titel,
        "number": d.referenz_name or d.name,
        "date": iso(d.datum or d.creation),
        "status": "neu" if d.status == "Freigegeben" else "offen",
        "amount": None,
        "amountNote": "auf Anfrage",
        "file": {"name": datei.file_name, "mime": d.mime or "application/octet-stream", "size": int(datei.file_size or 0), "storageKey": d.datei} if datei else None,
    }


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_documents(kontakt, kunde_token, type=None, projekt=None):
    """Freigegebene Projektdokumente. Belege mit Beträgen liefert ph_faktura.api.portal_documents (gleiche Form)."""
    k = _kunde(kontakt, kunde_token)
    filters = {"kontakt": k["name"], "kunde_sichtbar": 1, "status": "Freigegeben"}
    if projekt:
        filters["projekt"] = _projekt_des_kunden(k["name"], projekt)
    typ = text(type, 40)
    if typ:
        kategorien = [kat for kat, t in DOKUMENT_TYP.items() if t == typ] or [typ.capitalize()]
        filters["kategorie"] = ("in", kategorien)
    rows = frappe.get_all("PH Projekt Dokument", filters=filters, fields=["name", "titel", "kategorie", "projekt", "datum", "creation", "status", "datei", "mime", "referenz_name"], order_by="datum desc, creation desc")
    return [_dokument_payload(d) for d in rows]


# ── Termine ───────────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_appointments(kontakt, kunde_token, projekt=None, von=None):
    k = _kunde(kontakt, kunde_token)
    projekte = {p.name: p.titel for p in frappe.get_all("PH Projekt", filters={"kontakt": k["name"], "portal_sichtbar": 1}, fields=["name", "titel"])}
    if projekt:
        projekt = _projekt_des_kunden(k["name"], projekt)
        projekte = {projekt: projekte.get(projekt)}
    out = []
    # Beratungs-/Aufmaßtermine aus ph_crm (PH Termin), wenn installiert.
    if frappe.db.exists("DocType", "PH Termin"):
        try:
            meta = frappe.get_meta("PH Termin")
            # Projektbezug: Custom Field ph_projekte_projekt (fixtures/custom_field.json), Rückfall auf ein eigenes Feld „projekt“ von ph_crm.
            projekt_feld = "ph_projekte_projekt" if meta.has_field("ph_projekte_projekt") else ("projekt" if meta.has_field("projekt") else None)
            felder = [f for f in ("name", "terminart", "modus", "thema", "start", "ende", "status", "meet_url") if meta.has_field(f) or f == "name"]
            if projekt_feld:
                felder.append(projekt_feld)
            for t in frappe.get_all("PH Termin", filters={"kontakt": k["name"], "status": ("in", ("Unbestaetigt", "Bestaetigt", "Erledigt"))}, fields=felder):
                t_projekt = t.get(projekt_feld) if projekt_feld else None
                if projekt and t_projekt != projekt:
                    continue
                modus = t.get("modus") or ""
                out.append(
                    {
                        "id": t.name,
                        "projectId": t_projekt,
                        "kind": TERMINART_KIND.get(str(t.get("terminart") or "").split(" ")[0], "beratung"),
                        "title": t.get("thema") or _("Beratungstermin"),
                        "start": iso(t.get("start")),
                        "end": iso(t.get("ende")),
                        "location": "Video" if modus == "Video" else ("Bei Ihnen zu Hause" if modus == "Vor Ort" else "Showroom Lochau, Landstraße 11"),
                        "status": "bestaetigt" if t.get("status") in ("Bestaetigt", "Erledigt") else "angefragt",
                        "note": "",
                    }
                )
        except Exception:  # noqa: BLE001
            frappe.log_error(title="portal_appointments: PH Termin")
    for m in frappe.get_all("PH Montageauftrag", filters={"projekt": ("in", list(projekte)), "status": ("not in", ("Abgebrochen",))}, fields=["name", "projekt", "start", "ende", "status", "ort", "strasse"]):
        out.append({"id": m.name, "projectId": m.projekt, "kind": "montage", "title": _("Lieferung und Montage {0}").format(projekte.get(m.projekt) or ""), "start": iso(m.start), "end": iso(m.ende or m.start), "location": "Bei Ihnen zu Hause", "status": "bestaetigt" if m.status != "Geplant" else "angefragt", "note": ""})
    for g in frappe.get_all("PH Fremdgewerk", filters={"projekt": ("in", list(projekte)), "kunde_sichtbar": 1, "termin_von": ("is", "set"), "status": ("not in", ("Abgesagt",))}, fields=["name", "projekt", "gewerk", "partner_text", "termin_von", "termin_bis", "status", "leistung"]):
        out.append({"id": g.name, "projectId": g.projekt, "kind": "aufmass" if "aufma" in (g.leistung or "").lower() else "montage", "title": f"{g.gewerk}: {g.partner_text or 'Partnerbetrieb'}", "start": iso(g.termin_von), "end": iso(g.termin_bis or g.termin_von), "location": "Bei Ihnen zu Hause", "status": "bestaetigt" if g.status in ("Geplant", "In Arbeit", "Erledigt") else "angefragt", "note": g.leistung or ""})
    if von:
        von_dt = get_datetime(von)
        out = [a for a in out if a["end"] and get_datetime(a["end"]) >= von_dt]
    out.sort(key=lambda a: a["start"] or "")
    return out


# ── Produktpass ───────────────────────────────────────────────────────────────

def _pass_payload(name):
    pp = frappe.get_doc("PH Produktpass", name)
    return {
        "id": pp.name,
        "itemId": pp.position,
        "projectId": pp.projekt,
        "product": pp.produkt_name,
        "brand": pp.marke or "",
        "variant": pp.ausfuehrung_text or "",
        "serialNumber": pp.seriennummer or None,
        "materials": [m.material + (f" ({m.anteil})" if m.anteil else "") for m in pp.materialien],
        "care": [c.hinweis for c in pp.pflege],
        "careCategory": pp.pflegekategorie or "",
        "outdoor": bool(pp.outdoor),
        "warranty": {"months": pp.garantie_monate or None, "until": iso(pp.garantie_bis), "note": pp.garantie_hinweis or ""},
        "deliveredAt": iso(pp.lieferdatum),
        "status": pp.status,
        "attachments": [{"title": d.titel, "storageKey": d.datei} for d in pp.dokumente if d.kunde_sichtbar and d.datei],
    }


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_product_passes(kontakt, kunde_token, projekt=None):
    k = _kunde(kontakt, kunde_token)
    filters = {"kontakt": k["name"], "kunde_sichtbar": 1}
    if projekt:
        filters["projekt"] = _projekt_des_kunden(k["name"], projekt)
    return [_pass_payload(n) for n in frappe.get_all("PH Produktpass", filters=filters, pluck="name", order_by="creation asc")]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_product_pass(kontakt, kunde_token, produktpass):
    k = _kunde(kontakt, kunde_token)
    produktpass = text(produktpass, 80)
    if not frappe.db.exists("PH Produktpass", {"name": produktpass, "kontakt": k["name"], "kunde_sichtbar": 1}):
        return None
    return _pass_payload(produktpass)


# ── Renderings und Feedback ───────────────────────────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_renderings(kontakt, kunde_token, projekt):
    k = _kunde(kontakt, kunde_token)
    projekt = _projekt_des_kunden(k["name"], projekt)
    rows = frappe.get_all("PH Rendering", filters={"projekt": projekt, "kunde_sichtbar": 1, "status": ("!=", "Verworfen")}, fields=["name", "projekt", "bezeichnung", "variante", "version", "creation", "vorgelegt_am", "bild", "beschreibung", "ki_generiert", "status", "votes_up", "votes_down"], order_by="variante asc, version desc")
    return [
        {
            "id": r.name,
            "projectId": r.projekt,
            "title": r.bezeichnung,
            "letter": r.variante,
            "version": int(r.version or 1),
            "createdAt": iso(r.vorgelegt_am or r.creation),
            "image": r.bild or None,
            "description": r.beschreibung or "",
            "aiGenerated": bool(r.ki_generiert),
            "status": r.status,
            "approved": r.status == "Freigegeben",
        }
        for r in rows
    ]


def _entry_payload(e):
    out = {"id": e.website_id or e.name, "frappeId": e.name, "from": e.von, "author": e.autor or ("Platzhirsch" if e.von == "studio" else "Sie"), "createdAt": iso(e.erstellt_am), "kind": e.art, "projectId": e.projekt, "status": e.status}
    if e.rendering:
        out["renderingId"] = e.rendering
    if e.antwort_auf:
        out["parentId"] = frappe.db.get_value("PH Rendering Feedback", e.antwort_auf, "website_id") or e.antwort_auf
    if e.art == "annotation":
        out["point"] = {"x": float(e.punkt_x or 0), "y": float(e.punkt_y or 0)}
    if e.art == "vote":
        out["vote"] = e.vote
    if e.art != "vote":
        out["body"] = e.text or ""
    if e.art == "sprachnachricht" and e.audio:
        out["audio"] = {"id": e.name, "mime": e.audio_mime, "size": int(e.audio_groesse or 0), "durationSec": float(e.audio_dauer_s or 0), "storageKey": e.audio}
    return out


FEEDBACK_FELDER = ["name", "website_id", "von", "autor", "erstellt_am", "art", "projekt", "rendering", "antwort_auf", "punkt_x", "punkt_y", "vote", "text", "audio", "audio_mime", "audio_groesse", "audio_dauer_s", "status"]


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_feedback_list(kontakt, kunde_token, projekt):
    k = _kunde(kontakt, kunde_token)
    projekt = _projekt_des_kunden(k["name"], projekt)
    rows = frappe.get_all("PH Rendering Feedback", filters={"projekt": projekt}, fields=FEEDBACK_FELDER, order_by="erstellt_am asc")
    # Studio-Einträge gelten als vom Kunden gelesen, sobald die Liste abgerufen wurde.
    offen = [r.name for r in rows if r.von == "studio"]
    if offen:
        frappe.db.sql("update `tabPH Rendering Feedback` set gelesen_kunde = 1 where name in %(n)s and gelesen_kunde = 0", {"n": tuple(offen)})
    return [_entry_payload(r) for r in rows]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Rendering Feedback", r["frappeId"]))
def portal_add_feedback(kontakt, kunde_token, eintrag, audio_base64=None, audio_mime=None, website_id=None):
    """eintrag: feedbackEntrySchema (kind, projectId, renderingId?, body?, point?, vote?, confirm?, parentId?)
    oder {kind: "sprachnachricht", durationSec, consent: "ja"} + audio_base64/audio_mime.
    Auch das flache addFeedback-Format {projectId, target{kind,id}, message, rating?} wird angenommen."""
    k = _kunde(kontakt, kunde_token)
    if isinstance(eintrag, str):
        eintrag = json.loads(eintrag)
    eintrag = dict(eintrag or {})
    if "kind" not in eintrag and "message" in eintrag:  # addFeedback(core) → kommentar
        ziel = eintrag.get("target") or {}
        eintrag = {"kind": "kommentar", "projectId": eintrag.get("projectId"), "renderingId": ziel.get("id") if ziel.get("kind") == "rendering" else None, "body": eintrag.get("message")}
    ok, feld = feedback_pruefen(eintrag)
    if not ok:
        raise ApiFehler("invalid", 400, _("Bitte Eingaben prüfen: {0}").format(feld), {"field": feld})
    projekt = _projekt_des_kunden(k["name"], eintrag["projectId"])
    rendering = eintrag.get("renderingId")
    if rendering and not frappe.db.exists("PH Rendering", {"name": rendering, "projekt": projekt, "kunde_sichtbar": 1}):
        raise ApiFehler("not_found", 404, _("Variante nicht gefunden."))
    antwort_auf = None
    if eintrag.get("parentId"):
        antwort_auf = frappe.db.get_value("PH Rendering Feedback", {"website_id": eintrag["parentId"], "projekt": projekt}, "name") or frappe.db.get_value("PH Rendering Feedback", {"name": eintrag["parentId"], "projekt": projekt}, "name")
        if not antwort_auf:
            raise ApiFehler("not_found", 404, _("Beitrag nicht gefunden."))
    art = eintrag["kind"]
    audio_bytes = ext = None
    if art == "sprachnachricht":
        if not audio_base64:
            raise ApiFehler("invalid", 400, _("Keine Aufnahme erhalten."), {"field": "audio"})
        try:
            audio_bytes = base64.b64decode(audio_base64, validate=True)
        except Exception:  # noqa: BLE001
            raise ApiFehler("invalid", 400, _("Aufnahme ist kein gültiges Base64."))
        max_mb = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "max_audio_mb")) or 5
        ext = audio_pruefen(audio_mime, len(audio_bytes), max_mb * 1024 * 1024)
        if not ext:
            raise ApiFehler("invalid", 415, _("Dateiformat nicht unterstützt oder Aufnahme zu groß (max. {0} MB).").format(max_mb))
        if not audio_signatur_ok(audio_bytes, ext):
            raise ApiFehler("invalid", 415, _("Datei ist keine gültige Audioaufnahme."))
    doc = frappe.get_doc(
        {
            "doctype": "PH Rendering Feedback",
            "projekt": projekt,
            "rendering": rendering,
            "kontakt": k["name"],
            "art": art,
            "von": "kunde",
            "autor": kunden_name(k["name"]),
            "text": text(eintrag.get("body"), 2000),
            "antwort_auf": antwort_auf,
            "punkt_x": (eintrag.get("point") or {}).get("x"),
            "punkt_y": (eintrag.get("point") or {}).get("y"),
            "vote": eintrag.get("vote"),
            "freigabe_bestaetigt": 1 if art == "freigabe" else 0,
            "audio_dauer_s": eintrag.get("durationSec"),
            "einwilligung_audio_am": now_datetime() if art == "sprachnachricht" else None,
            "website_id": text(website_id or eintrag.get("id"), 80) or None,
            "quelle": "website",
            "ip_hash": ip_hash(),
            "erstellt_am": now_datetime(),
        }
    )
    if art == "sprachnachricht":
        doc.audio = "pending"
    doc.insert(ignore_permissions=True)
    if audio_bytes:
        f = datei_anhaengen("PH Rendering Feedback", doc.name, f"{doc.name}.{ext}", audio_bytes, feld="audio")
        doc.db_set({"audio": f.file_url, "audio_mime": str(audio_mime).split(";")[0].strip().lower(), "audio_groesse": len(audio_bytes)}, update_modified=False)
    if art == "freigabe" and rendering:
        frappe.db.set_value("PH Rendering", rendering, {"freigabe_feedback": doc.name}, update_modified=False)
    e = frappe.get_all("PH Rendering Feedback", filters={"name": doc.name}, fields=FEEDBACK_FELDER)[0]
    return {"id": e.website_id or e.name, "frappeId": e.name, "createdAt": iso(e.erstellt_am), "entry": _entry_payload(e)}


# ── Nachrichten ───────────────────────────────────────────────────────────────

def _message_payload(m):
    return {"id": m.name, "projectId": m.projekt, "from": "kunde" if m.richtung == "eingehend" else "studio", "author": m.autor or ("Platzhirsch" if m.richtung == "ausgehend" else "Sie"), "body": m.text, "sentAt": iso(m.gesendet_am), "read": m.status == "Gelesen" or m.richtung == "eingehend"}


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_messages(kontakt, kunde_token, projekt=None):
    k = _kunde(kontakt, kunde_token)
    filters = {"kontakt": k["name"]}
    if projekt:
        filters["projekt"] = _projekt_des_kunden(k["name"], projekt)
    rows = frappe.get_all("PH Projekt Nachricht", filters=filters, fields=["name", "projekt", "richtung", "autor", "text", "gesendet_am", "status"], order_by="gesendet_am desc")
    return [_message_payload(m) for m in rows]


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=30, referenz=lambda r: ("PH Projekt Nachricht", r["id"]))
def portal_send_message(kontakt, kunde_token, body, projekt=None):
    k = _kunde(kontakt, kunde_token)
    body = text(body, 2000)
    if len(body) < 2:
        raise ApiFehler("invalid", 400, _("Bitte schreiben Sie eine Nachricht."), {"field": "body"})
    doc = frappe.get_doc(
        {"doctype": "PH Projekt Nachricht", "kontakt": k["name"], "projekt": _projekt_des_kunden(k["name"], projekt) if projekt else None, "richtung": "eingehend", "autor": kunden_name(k["name"]), "text": body, "quelle": "website", "ip_hash": ip_hash()}
    ).insert(ignore_permissions=True)
    m = frappe.get_all("PH Projekt Nachricht", filters={"name": doc.name}, fields=["name", "projekt", "richtung", "autor", "text", "gesendet_am", "status"])[0]
    return _message_payload(m)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api()
def portal_mark_read(kontakt, kunde_token, message_ids):
    k = _kunde(kontakt, kunde_token)
    if isinstance(message_ids, str):
        message_ids = json.loads(message_ids)
    ids = [text(i, 80) for i in (message_ids or [])][:200]
    if not ids:
        return 0
    rows = frappe.get_all("PH Projekt Nachricht", filters={"name": ("in", ids), "kontakt": k["name"], "richtung": "ausgehend", "status": "Ungelesen"}, pluck="name")
    for name in rows:
        frappe.db.set_value("PH Projekt Nachricht", name, {"status": "Gelesen", "gelesen_am": now_datetime()}, update_modified=False)
    return len(rows)


# ── Planungswunsch ────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=10, referenz=lambda r: ("PH Anfrage", r["id"]))
def portal_request_planning(kontakt, kunde_token, eintrag):
    """planningRequestSchema {projectId?, room, message, preferredContact, preferredDates[]} → PH Anfrage (Beratung)."""
    k = _kunde(kontakt, kunde_token)
    if isinstance(eintrag, str):
        eintrag = json.loads(eintrag)
    eintrag = eintrag or {}
    raum, nachricht = text(eintrag.get("room"), 80), text(eintrag.get("message"), 3000)
    if len(raum) < 2 or len(nachricht) < 10:
        raise ApiFehler("invalid", 400, _("Bitte Raum und Nachricht angeben."))
    projekt = _projekt_des_kunden(k["name"], eintrag["projectId"]) if eintrag.get("projectId") else None
    zeilen = [f"Planungswunsch aus dem Kundenportal – Raum: {raum}", "", nachricht, ""]
    zeilen.append(f"Bevorzugter Kontakt: {text(eintrag.get('preferredContact'), 20) or 'email'}")
    if eintrag.get("preferredDates"):
        zeilen.append("Wunschtermine: " + ", ".join(text(d, 10) for d in eintrag["preferredDates"][:3]))
    if projekt:
        zeilen.append(f"Projekt: {projekt}")
    doc = frappe.get_doc(
        {
            "doctype": "PH Anfrage",
            "art": "Beratung",
            "quelle": "website",
            "kanal": "Kundenportal",
            "eingang": now_datetime(),
            "vorname": k.get("vorname") or "",
            "nachname": k.get("nachname") or k.get("firma") or "(Portal)",
            "email": k.get("email"),
            "telefon": k.get("telefon"),
            "kontakt": k["name"],
            "anliegen": frappe.utils.escape_html("\n".join(zeilen)).replace("\n", "<br>"),
            "projektart": "Planungswunsch Portal",
            "objektart": raum,
            "wunschzeiten": ", ".join(text(d, 10) for d in (eintrag.get("preferredDates") or [])[:3]),
            "ip_hash": ip_hash(),
        }
    )
    doc.insert(ignore_permissions=True)
    return {"id": doc.name, "createdAt": iso(doc.eingang)}


# ── Dateien (privat, nur eigene) ──────────────────────────────────────────────

ERLAUBTE_DATEI_DOCTYPES = {
    "PH Rendering": ("projekt",),
    "PH Rendering Feedback": ("kontakt",),
    "PH Projekt Dokument": ("kontakt",),
    "PH Produktpass": ("kontakt",),
    "PH Projekt Nachricht": ("kontakt",),
    "PH Tagebuch Foto": ("kontakt",),
    "PH Montageauftrag": ("kontakt",),
}


def _datei_gehoert_kunde(file_doc, kontakt):
    dt, dn = file_doc.attached_to_doctype, file_doc.attached_to_name
    if dt not in ERLAUBTE_DATEI_DOCTYPES or not dn:
        return False
    feld = ERLAUBTE_DATEI_DOCTYPES[dt][0]
    wert = frappe.db.get_value(dt, dn, feld)
    if feld == "projekt":
        return bool(wert) and frappe.db.get_value("PH Projekt", wert, "kontakt") == kontakt
    return wert == kontakt


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api(limit_pro_minute=120)
def portal_file(kontakt, kunde_token, file_url):
    """Private Datei (Rendering, Dokument, Produktpass-Anhang, Sprachnotiz) des Kunden als Base64.
    Die Website streamt sie über ihre eigene authentifizierte Route; nie öffentlich."""
    k = _kunde(kontakt, kunde_token)
    file_url = text(file_url, 500)
    name = frappe.db.get_value("File", {"file_url": file_url}, "name")
    if not name:
        raise ApiFehler("not_found", 404, _("Datei nicht gefunden."))
    f = frappe.get_doc("File", name)
    if not _datei_gehoert_kunde(f, k["name"]):
        raise ApiFehler("not_found", 404, _("Datei nicht gefunden."))
    if (f.file_size or 0) > MAX_DATEI_BYTES:
        raise ApiFehler("invalid", 413, _("Datei zu groß."))
    inhalt = f.get_content()
    import mimetypes

    return {"name": f.file_name, "mime": mimetypes.guess_type(f.file_name or "")[0] or "application/octet-stream", "size": len(inhalt), "content_base64": base64.b64encode(inhalt).decode()}


# ── Desk: Auftragsmappe, Anfrage → Projekt, Number Cards ──────────────────────

def _optional(doctype, filters, fields, order_by="modified desc", limit=50):
    """get_all auf eine DocType einer anderen App – nur wenn installiert und Felder vorhanden."""
    if not frappe.db.exists("DocType", doctype):
        return None
    meta = frappe.get_meta(doctype)
    felder = [f for f in fields if meta.has_field(f) or f in ("name", "docstatus", "creation", "modified")]
    filters = {k: v for k, v in filters.items() if meta.has_field(k) or k in ("name", "docstatus")}
    try:
        return frappe.get_all(doctype, filters=filters, fields=felder, order_by=order_by, limit=limit)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"auftragsmappe: {doctype}")
        return []


@frappe.whitelist()
def auftragsmappe(projekt):
    """Alle Daten der Page „ph-auftragsmappe“ in einem Aufruf. Prüft je fremder App, ob sie installiert ist."""
    if not frappe.has_permission("PH Projekt", "read", projekt):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    p = frappe.get_doc("PH Projekt", projekt)
    leitung = bool({"PH Projekte Leitung", "PH Geschäftsführung", "System Manager"} & set(frappe.get_roles()))
    kontakt = None
    if frappe.db.exists("DocType", "PH Kontakt"):
        meta = frappe.get_meta("PH Kontakt")
        felder = ["name"] + [f for f in ("vorname", "nachname", "firma", "email", "telefon", "mobil", "strasse", "plz", "ort", "portal_aktiv", "portal_letzter_login") if meta.has_field(f)]
        kontakt = frappe.db.get_value("PH Kontakt", p.kontakt, felder, as_dict=True)
    daten = {
        "projekt": {f: p.get(f) for f in ("name", "titel", "projektart", "status", "kunde_name", "kontakt", "berater", "planer", "montageleiter", "eingang", "raum", "kurzbeschreibung", "objekt_strasse", "objekt_plz", "objekt_ort", "objekt_hinweis", "liefertermin_geplant", "montage_von", "montage_bis", "uebergabe_am", "portal_sichtbar", "abnahme", "prioritaet")},
        "kontakt": kontakt,
        "phasen": [{"phase": z.phase, "datum": z.datum, "von": z.von, "notiz": z.notiz} for z in p.phasen_verlauf],
        "positionen": [{"name": z.name, "bezeichnung": z.bezeichnung, "marke": z.marke, "menge": z.menge, "status": z.status, "raum": z.raum, "produktpass": z.produktpass} for z in p.positionen],
        "team": [{"user": z.user, "rolle": z.rolle} for z in p.team],
        "summen": {f: p.get(f) for f in ("budget_cent", "auftragswert_cent", "anzahlung_cent", "bezahlt_cent", "offen_cent", "zeit_min_gesamt")} if leitung else None,
        "planungen": frappe.get_all("PH Planung", filters={"projekt": projekt}, fields=["name", "titel", "version", "status", "quelle_planung", "datei", "vorschau", "modified"], order_by="version desc"),
        "renderings": frappe.get_all("PH Rendering", filters={"projekt": projekt}, fields=["name", "titel", "variante", "version", "status", "bild", "ki_generiert", "feedback_offen", "feedback_anzahl", "votes_up", "votes_down", "modified"], order_by="variante asc, version desc"),
        "feedback_offen": frappe.get_all("PH Rendering Feedback", filters={"projekt": projekt, "status": "Offen", "von": "kunde", "art": ("!=", "vote")}, fields=["name", "titel", "art", "rendering", "erstellt_am", "text"], order_by="erstellt_am desc", limit=20),
        "dokumente": frappe.get_all("PH Projekt Dokument", filters={"projekt": projekt}, fields=["name", "titel", "kategorie", "status", "datum", "datei", "mime", "kunde_sichtbar", "version"], order_by="datum desc, creation desc"),
        "fotos": frappe.get_all("PH Tagebuch Foto", filters={"projekt": projekt}, fields=["name", "titel", "phase", "von", "hochgeladen_am", "bild"], order_by="hochgeladen_am desc", limit=60),
        "montagen": frappe.get_all("PH Montageauftrag", filters={"projekt": projekt}, fields=["name", "titel", "status", "start", "ende", "montageleiter", "stunden_ist"], order_by="start asc"),
        "gewerke": frappe.get_all("PH Fremdgewerk", filters={"projekt": projekt}, fields=["name", "gewerk", "partner_text", "status", "termin_von", "termin_bis", "leistung"], order_by="termin_von asc"),
        "abnahmen": frappe.get_all("PH Abnahme", filters={"projekt": projekt}, fields=["name", "titel", "status", "datum", "maengel_offen"], order_by="datum desc"),
        "produktpaesse": frappe.get_all("PH Produktpass", filters={"projekt": projekt}, fields=["name", "titel", "status", "lieferdatum", "garantie_bis"], order_by="creation asc"),
        "aufgaben": frappe.get_all("PH Projekt Aufgabe", filters={"projekt": projekt, "status": ("in", ("Offen", "In Arbeit"))}, fields=["name", "titel", "status", "faellig", "zugewiesen_an", "prioritaet"], order_by="faellig asc"),
        "zeiten": frappe.get_all("PH Projektzeit", filters={"projekt": projekt}, fields=["name", "datum", "user", "taetigkeit", "dauer_min", "status", "abrechenbar"], order_by="datum desc", limit=30),
        "nachrichten": frappe.get_all("PH Projekt Nachricht", filters={"projekt": projekt}, fields=["name", "richtung", "autor", "text", "gesendet_am", "status"], order_by="gesendet_am desc", limit=20),
        "referenzen": frappe.get_all("PH Referenz", filters={"projekt": projekt}, fields=["name", "titel", "status", "slug", "eingereicht_am"]),
        "apps": {},
    }
    # Belege und Vorgänge anderer Apps (nur wenn installiert; Beträge nur für Leitung sichtbar).
    fremd = {
        "angebote": ("PH Angebot", ["name", "datum", "status", "brutto_cent", "gueltig_bis", "docstatus"]),
        "auftraege": ("PH Auftragsbestaetigung", ["name", "datum", "status", "auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "offen_cent", "liefertermin_bestaetigt", "docstatus"]),
        "rechnungen": ("PH Rechnung", ["name", "art", "datum", "status", "brutto_cent", "bezahlt_cent", "offen_cent", "faellig", "docstatus"]),
        "lieferscheine": ("PH Lieferschein", ["name", "datum", "status", "docstatus"]),
        "herstellerbestellungen": ("PH Herstellerbestellung", ["name", "lieferant", "datum", "status", "liefertermin_bestaetigt", "docstatus"]),
        "sendungen": ("PH Sendung", ["name", "status", "carrier", "tracking_nummer", "modified"]),
        "servicefaelle": ("PH Servicefall", ["name", "titel", "status", "modified"]),
        "zahlungen": ("PH Zahlung", ["name", "art", "betrag_cent", "status", "bezahlt_am"]),
        "termine": ("PH Termin", ["name", "terminart", "start", "ende", "status", "modus"]),
    }
    for key, (dt, felder) in fremd.items():
        rows = _optional(dt, {"projekt": projekt, "docstatus": ("<", 2)}, felder)
        daten["apps"][dt] = rows is not None
        if rows is not None and not leitung:
            for r in rows:
                for f in list(r.keys()):
                    if f.endswith("_cent"):
                        r.pop(f, None)
        daten[key] = rows or []
    return daten


@frappe.whitelist()
def projekt_aus_anfrage(anfrage, projektart="Wohnung", titel=None):
    """Button „Projekt anlegen“ in PH Anfrage (Client Script aus ph_projekte)."""
    if not frappe.has_permission("PH Projekt", "create"):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    a = frappe.get_doc("PH Anfrage", anfrage)
    if a.folgedokument_doctype == "PH Projekt" and a.folgedokument and frappe.db.exists("PH Projekt", a.folgedokument):
        return a.folgedokument
    if not a.kontakt:
        kontakt = a.run_method("kontakt_anlegen") if hasattr(a, "kontakt_anlegen") else None
        a.reload()
        if not a.kontakt and not kontakt:
            frappe.throw(_("Bitte zuerst einen Kontakt anlegen."))
    p = frappe.get_doc(
        {
            "doctype": "PH Projekt",
            "kontakt": a.kontakt,
            "anfrage": a.name,
            "projektart": projektart,
            "titel": text(titel, 140) or (a.objektart or a.projektart or _("Projekt {0}").format(a.nachname)),
            "kurzbeschreibung": frappe.utils.strip_html(a.anliegen or "")[:300],
            "berater": a.zugewiesen_an,
            "eingang": now_datetime(),
            "quelle": "backoffice",
        }
    ).insert()
    return p.name


@frappe.whitelist()
def anzahl_offene_maengel():
    """Number Card „PH Offene Mängel“ (Montage-Mängel + Abnahme-Positionen)."""
    from ph_projekte.ph_projekte.doctype.ph_abnahme.ph_abnahme import offene_maengel_anzahl as abn
    from ph_projekte.ph_projekte.doctype.ph_montageauftrag.ph_montageauftrag import offene_maengel_anzahl as mon

    return {"value": abn() + mon(), "fieldtype": "Int", "route_options": {"status": "Mit Maengeln"}, "route": ["ph-abnahme"]}


@frappe.whitelist()
def anzahl_renderings_ohne_antwort():
    """Number Card „PH Renderings ohne Antwort“: Feedback offen länger als X Tage (Einstellungen)."""
    tage = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "feedback_erinnerung_tage")) or 3
    n = frappe.db.count("PH Rendering", {"status": "Feedback offen", "letztes_feedback_am": ("<", add_days(now_datetime(), -tage))})
    return {"value": n, "fieldtype": "Int", "route_options": {"status": "Feedback offen"}, "route": ["ph-rendering"]}


@frappe.whitelist()
def create_product_passes(*, lieferschein=None, auftrag=None, projekt=None, positionen=None, idempotency_key=None):
    """Produktpässe aus Lieferung anlegen (Aufrufer: ph_logistik PH Lieferschein „Produktpässe erzeugen“, Desk).

    positionen: Liste von dicts {produkt, bezeichnung, menge, seriennummer?, ausfuehrung_text?, ab_position?}; je Position
    ein Pass (bei menge > 1 ohne Seriennummer: ein Pass je Stück, Position „<ab_position>/<n>“). Kontakt/Projekt aus
    `projekt`, sonst aus PH Auftragsbestaetigung (ph_faktura) bzw. PH Lieferschein (ph_logistik) – nur wenn installiert.
    Idempotent über idempotency_key bzw. (projekt, position) / (produkt, seriennummer). → {"produktpaesse": [...], "uebersprungen": n}
    """
    from ph_projekte.ph_projekte.doctype.ph_produktpass.ph_produktpass import pass_anlegen

    frappe.has_permission("PH Produktpass", "create", throw=True)
    if isinstance(positionen, str):
        positionen = json.loads(positionen or "[]")
    positionen = positionen or []
    kontakt = None
    if projekt:
        kontakt = frappe.db.get_value("PH Projekt", projekt, "kontakt")
    if (not kontakt or not projekt) and auftrag and frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
        ab = frappe.db.get_value("PH Auftragsbestaetigung", auftrag, ["kontakt", "projekt"], as_dict=True) or {}
        kontakt = kontakt or ab.get("kontakt")
        projekt = projekt or ab.get("projekt")
    if not kontakt and lieferschein and frappe.db.exists("DocType", "PH Lieferschein"):
        kontakt = frappe.db.get_value("PH Lieferschein", lieferschein, "kontakt")
    if not kontakt:
        raise ApiFehler("invalid", 400, _("Kein Kunde ermittelbar (projekt, auftrag oder lieferschein nötig)."))
    heute = frappe.utils.nowdate()
    neu, uebersprungen = [], 0
    for i, pos in enumerate(positionen):
        pos = frappe._dict(pos or {})
        menge = max(1, cint(pos.get("menge") or 1))
        basis = pos.get("ab_position") or pos.get("position") or f"{idempotency_key or lieferschein or auftrag or projekt}:{i + 1}"
        stueck = 1 if pos.get("seriennummer") else menge
        for n in range(stueck):
            position = basis if stueck == 1 else f"{basis}/{n + 1}"
            name, ist_neu = pass_anlegen(
                kontakt=kontakt, projekt=projekt, position=position, produkt=pos.get("produkt"), produkt_name=pos.get("bezeichnung"),
                ausfuehrung_text=pos.get("ausfuehrung_text"), seriennummer=pos.get("seriennummer"), lieferdatum=heute, quelle="system",
            )
            if ist_neu:
                neu.append(name)
            else:
                uebersprungen += 1
    return {"produktpaesse": neu, "uebersprungen": uebersprungen}
