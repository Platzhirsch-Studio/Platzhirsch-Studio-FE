"""Exchange-Mail ↔ Kundenakte (Inhaber-Entscheidung Nr. 52 + Präzisierung 04.11.2026, Regeln in logik/zuordnung.py).

Gespeichert wird eine Mail NUR
  * automatisch, wenn die Gegenadresse eindeutig einem PH Kontakt / PH Lieferanten gehört (nicht vertraulich,
    keine Massenmail, nicht intern) – als Frappe `Communication` mit Zeitleisten-Link am Kontakt und, bei
    erkannter Vorgangsnummer, am Vorgang;
  * manuell über mail_zuordnen / kontakt_aus_mail durch einen Benutzer mit Recht auf das Postfach.
Alle anderen Mails bleiben in Outlook: keine Kopie, kein Betreff, kein Protokolleintrag mit Inhalt.
Die Liste „nicht zugeordnet“ wird live per Graph gelesen und nicht gespeichert.
"""

import base64
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import frappe
from frappe import _
from frappe.utils import cint, get_system_timezone, now_datetime

from ph_core.api import ApiFehler, hat_rolle, liste
from ph_microsoft.graph.client import DeltaAbgelaufen, GraphFehler
from ph_microsoft.logik import zuordnung as Z
from ph_microsoft.ph_microsoft.einstellungen import einstellungen
from ph_microsoft.ph_microsoft.graph_dienst import graph_client
from ph_microsoft.ph_microsoft.protokoll import eintrag, festschreiben

SELECT_LISTE = "id,internetMessageId,subject,from,sender,toRecipients,ccRecipients,receivedDateTime,sentDateTime,sensitivity,hasAttachments,isDraft"
SELECT_VOLL = SELECT_LISTE + ",body,internetMessageHeaders,conversationId"
PREFER_ID = {"Prefer": 'IdType="ImmutableId", odata.maxpagesize=50'}
MAX_SENDE_BYTES = 3 * 1024 * 1024  # Inline-Anhänge in sendMail (Graph-Grenze ~4 MB je Anfrage)
KOPF_MARKE = "X-PH-Mail-Id"  # eigene Kennung je gesendeter Mail (sendMail liefert keine ID zurück)
ADMIN_ROLLEN = ("System Manager", "PH Backoffice-Admin")


def _u(adresse):
    return f"/users/{quote(str(adresse), safe='@')}"


def utc_zu_lokal(wert):
    """'2026-11-04T09:15:00Z' → naive datetime in Site-Zeit."""
    if not wert:
        return now_datetime()
    try:
        from zoneinfo import ZoneInfo

        dt = datetime.strptime(str(wert)[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
        return dt.astimezone(ZoneInfo(get_system_timezone())).replace(tzinfo=None)
    except Exception:  # noqa: BLE001
        return now_datetime()


def _iso_utc(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Adressbuch: Kontakte, Lieferanten, weitere Adressen, Sperrliste ────────────────────────────
def _cache(name):
    c = getattr(frappe.local, "ph_ms_mailcache", None)
    if c is None:
        c = frappe.local.ph_ms_mailcache = {}
    return c.setdefault(name, {})


def treffer(adresse):
    """Adresse → [(doctype, name)] aller Kontakte/Lieferanten mit dieser Adresse (exakt, klein)."""
    adresse = Z.normalisiere(adresse)
    c = _cache("treffer")
    if adresse in c:
        return c[adresse]
    aus = []
    if adresse:
        if frappe.db.exists("DocType", "PH Kontakt"):
            for n in frappe.get_all("PH Kontakt", filters={"email": adresse, "anonymisiert_am": ("is", "not set")}, pluck="name", limit=5):
                aus.append(("PH Kontakt", n))
        for z in frappe.get_all("PH Mail Adresse", filters={"adresse": adresse, "art": "Zuordnung"}, fields=["kontakt_doctype", "kontakt_name"], limit=5):
            if z.kontakt_doctype and z.kontakt_name:
                aus.append((z.kontakt_doctype, z.kontakt_name))
        if frappe.db.exists("DocType", "PH Lieferant"):
            for n in frappe.get_all("PH Lieferant", filters={"bestell_email": adresse}, pluck="name", limit=5):
                aus.append(("PH Lieferant", n))
            if frappe.db.exists("DocType", "PH Sortiment Ansprechpartner"):
                for n in frappe.get_all("PH Sortiment Ansprechpartner", filters={"email": adresse, "parenttype": "PH Lieferant"}, pluck="parent", limit=5):
                    aus.append(("PH Lieferant", n))
    c[adresse] = Z._eindeutig(aus)
    return c[adresse]


def gesperrte_adressen():
    c = _cache("sperre")
    if "alle" not in c:
        c["alle"] = set(frappe.get_all("PH Mail Adresse", filters={"art": "Sperre"}, pluck="adresse"))
    return c["alle"]


def eigene_adressen():
    c = _cache("eigene")
    if "alle" not in c:
        c["alle"] = {Z.normalisiere(a) for a in frappe.get_all("PH Postfach", pluck="adresse")}
    return c["alle"]


def entscheiden(mail):
    e = einstellungen()
    return Z.entscheiden(mail, treffer, e["interne_domains"], eigene_adressen(), gesperrte_adressen())


def _titel(doctype, name):
    try:
        meta = frappe.get_meta(doctype)
        feld = meta.title_field or "name"
        return frappe.db.get_value(doctype, name, feld) or name
    except Exception:  # noqa: BLE001
        return name


# ── Rechte auf Postfächer ──────────────────────────────────────────────────────────────────────
def erlaubte_postfaecher(user=None, recht="lesen"):
    """Eigenes Postfach (User-E-Mail mit interner Domain) + PH Postfach mit Besitzer = user oder Berechtigungszeile.
    Admins erhalten bewusst KEINEN Zugriff auf fremde Postfächer (Datenschutz)."""
    user = user or frappe.session.user
    aus = set()
    email = Z.normalisiere(frappe.db.get_value("User", user, "email") or user)
    if email and Z.ist_intern(email, einstellungen()["interne_domains"]):
        aus.add(email)
    for p in frappe.get_all("PH Postfach", filters={"aktiv": 1, "besitzer": user}, pluck="adresse"):
        aus.add(Z.normalisiere(p))
    feld = "senden" if recht == "senden" else "lesen"
    for p in frappe.get_all("PH Postfach Benutzer", filters={"user": user, feld: 1, "parenttype": "PH Postfach"}, pluck="parent"):
        if cint(frappe.db.get_value("PH Postfach", p, "aktiv")):
            aus.add(Z.normalisiere(frappe.db.get_value("PH Postfach", p, "adresse")))
    return sorted(a for a in aus if a)


def postfach_pruefen(postfach, recht="lesen"):
    pf = Z.normalisiere(postfach)
    if not pf or pf not in erlaubte_postfaecher(recht=recht):
        raise ApiFehler("forbidden", 403, _("Kein Recht auf dieses Postfach."))
    return pf


# ── Speichern (nur zugeordnete Mails) ──────────────────────────────────────────────────────────
def kommunikation_zu(internet_id):
    if not internet_id:
        return None
    return frappe.db.get_value("Communication", {"message_id": internet_id}, "name")


def _serien_muster():
    c = _cache("muster")
    if "m" not in c:
        try:
            from ph_core.utils.naming import NUMMERNKREISE

            c["m"] = Z.referenz_muster(NUMMERNKREISE)
        except Exception:  # noqa: BLE001
            c["m"] = []
    return c["m"]


def _vorgang_passt(doctype, name, kontakte):
    if not frappe.db.exists("DocType", doctype) or not frappe.db.exists(doctype, name):
        return False
    meta = frappe.get_meta(doctype)
    kon = {n for d, n in kontakte if d == "PH Kontakt"}
    lief = {n for d, n in kontakte if d == "PH Lieferant"}
    if meta.has_field("kontakt") and kon:
        return frappe.db.get_value(doctype, name, "kontakt") in kon
    if meta.has_field("lieferant") and lief:
        return frappe.db.get_value(doctype, name, "lieferant") in lief
    return not meta.has_field("kontakt") and not meta.has_field("lieferant")


def vorgaenge_erkennen(betreff, text, kontakte):
    aus = []
    for dt, nr in Z.referenzen_erkennen(f"{betreff}\n{(text or '')[:5000]}", _serien_muster()):
        if _vorgang_passt(dt, nr, kontakte):
            aus.append((dt, nr))
    return aus


def kontakte_von_bezug(doctype, name):
    if doctype in ("PH Kontakt", "PH Lieferant"):
        return [(doctype, name)]
    if not frappe.db.exists("DocType", doctype):
        return []
    meta = frappe.get_meta(doctype)
    aus = []
    if meta.has_field("kontakt"):
        k = frappe.db.get_value(doctype, name, "kontakt")
        if k:
            aus.append(("PH Kontakt", k))
    if meta.has_field("lieferant"):
        lf = frappe.db.get_value(doctype, name, "lieferant")
        if lf and frappe.db.exists("DocType", "PH Lieferant"):
            aus.append(("PH Lieferant", lf))
    return aus


def speichern(voll, mail, postfach, kontakte, art, bezug=None, zugeordnet_von=None):
    """Graph-Nachricht als Communication anlegen (oder vorhandene ergänzen). → Name der Communication."""
    vorhanden = kommunikation_zu(mail.get("internet_id"))
    text = frappe.utils.strip_html(((voll.get("body") or {}).get("content") or ""))[:5000]
    vorgaenge = [bezug] if bezug else vorgaenge_erkennen(mail["betreff"], text, kontakte)
    ziel = vorgaenge[0] if vorgaenge else (kontakte[0] if kontakte else (None, None))
    links = [x for x in Z._eindeutig(list(kontakte) + list(vorgaenge)) if x != tuple(ziel)]
    if vorhanden:
        doc = frappe.get_doc("Communication", vorhanden)
        bekannt = {(l.link_doctype, l.link_name) for l in doc.timeline_links or []} | {(doc.reference_doctype, doc.reference_name)}
        neu = [x for x in Z._eindeutig(list(kontakte) + list(vorgaenge)) if x not in bekannt]
        for dt, n in neu:
            doc.append("timeline_links", {"link_doctype": dt, "link_name": n})
        if neu:
            doc.save(ignore_permissions=True)
        return doc.name
    ausgang = mail["richtung"] == "ausgang"
    doc = frappe.get_doc({
        "doctype": "Communication",
        "communication_type": "Communication",
        "communication_medium": "Email",
        "sent_or_received": "Sent" if ausgang else "Received",
        "subject": mail["betreff"] or _("(ohne Betreff)"),
        "content": (voll.get("body") or {}).get("content") or "",
        "sender": mail["absender"],
        "sender_full_name": mail.get("absender_name") or None,
        "recipients": ", ".join(mail["an"]),
        "cc": ", ".join(mail["cc"]) or None,
        "communication_date": utc_zu_lokal(mail.get("datum")),
        "message_id": mail.get("internet_id"),
        "reference_doctype": ziel[0],
        "reference_name": ziel[1],
        "status": "Linked",
        "seen": 1 if ausgang else 0,
        "has_attachment": 1 if mail.get("anhaenge") else 0,
        "ph_microsoft_postfach": postfach,
        "ph_microsoft_graph_id": mail.get("id"),
        "ph_microsoft_zuordnung": art,
        "ph_microsoft_zugeordnet_von": zugeordnet_von,
        "timeline_links": [{"link_doctype": dt, "link_name": n} for dt, n in links],
    })
    doc.flags.ph_microsoft = True
    doc.insert(ignore_permissions=True)
    if mail.get("anhaenge") and einstellungen()["anhaenge_uebernehmen"]:
        anhaenge_speichern(postfach, mail["id"], doc.name, ziel, kontakte)
    kontakt = next((n for d, n in kontakte if d == "PH Kontakt"), None)
    eintrag("Mail", f"Zuordnung {art}", "OK", None, "Communication", doc.name, postfach=postfach, kontakt=kontakt, benutzer=zugeordnet_von)
    return doc.name


def anhaenge_speichern(postfach, message_id, communication, bezug, kontakte):
    """Dateianhänge (nicht inline) bis anhang_max_mb als private File an der Communication; danach Hook
    `ph_microsoft_anhang_ablegen` (ph_ablage trägt sich dort ein)."""
    max_bytes = einstellungen()["anhang_max_mb"] * 1024 * 1024
    g = graph_client()
    try:
        liste_ = list(g.seiten(f"{_u(postfach)}/messages/{quote(message_id)}/attachments", params={"$select": "id,name,size,isInline,contentType"}, headers=PREFER_ID, max_seiten=3))
    except GraphFehler as e:
        eintrag("Mail", "Anhänge", "Fehler", f"Graph {e.status} {e.code}", "Communication", communication, postfach=postfach)
        return []
    gespeichert = []
    for a in liste_:
        if a.get("isInline") or int(a.get("size") or 0) > max_bytes or "fileAttachment" not in str(a.get("@odata.type") or "#microsoft.graph.fileAttachment"):
            continue
        try:
            voll = g.get(f"{_u(postfach)}/messages/{quote(message_id)}/attachments/{quote(a['id'])}", headers=PREFER_ID)
            inhalt = base64.b64decode(voll.get("contentBytes") or "")
            datei = frappe.get_doc({
                "doctype": "File",
                "file_name": (a.get("name") or "anhang")[:140],
                "attached_to_doctype": "Communication",
                "attached_to_name": communication,
                "is_private": 1,
                "content": inhalt,
            }).insert(ignore_permissions=True)
            gespeichert.append(datei.name)
            kontakt = next((n for d, n in kontakte if d == "PH Kontakt"), None)
            for pfad in frappe.get_hooks("ph_microsoft_anhang_ablegen") or []:
                try:
                    frappe.get_attr(pfad)(datei=datei.name, bezug_doctype=bezug[0], bezug_name=bezug[1], kontakt=kontakt, quelle="exchange")
                except Exception:  # noqa: BLE001
                    frappe.log_error(title=f"PH Microsoft: Anhang-Hook {pfad} fehlgeschlagen")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Microsoft: Anhang konnte nicht übernommen werden")
    return gespeichert


def _voll_laden(postfach, message_id):
    return graph_client().get(f"{_u(postfach)}/messages/{quote(message_id)}", params={"$select": SELECT_VOLL}, headers=PREFER_ID)


def verarbeiten(m, postfach, ordner=None):
    """Eine Nachricht aus Delta/Webhook. → Communication-Name oder None (nicht gespeichert)."""
    mail = Z.graph_mail(m, postfach, ordner)
    if mail["entwurf"] or not mail["id"]:
        return None
    if kommunikation_zu(mail["internet_id"]):
        return None
    if entscheiden(mail)["aktion"] != Z.AUTO:
        return None  # bleibt in Outlook – nichts speichern
    voll = _voll_laden(postfach, mail["id"])
    mail = Z.graph_mail(voll, postfach, ordner)
    marke = mail["kopfzeilen"].get(KOPF_MARKE.lower())
    if marke:  # über mail_senden verschickt – Communication existiert schon, nur Kennungen nachtragen
        vorhanden = frappe.db.get_value("Communication", {"ph_microsoft_graph_id": f"ph:{marke[:64]}"})
        if vorhanden:
            frappe.db.set_value("Communication", vorhanden, {"message_id": mail["internet_id"], "ph_microsoft_graph_id": mail["id"]}, update_modified=False)
            return None
    ent = entscheiden(mail)  # jetzt mit Kopfzeilen (List-Unsubscribe, Precedence …)
    if ent["aktion"] != Z.AUTO:
        return None
    return speichern(voll, mail, postfach, ent["kontakte"], "automatisch")


def _ordner(pf):
    o = [x.strip() for x in str(pf.ordner or "Inbox\nSentItems").replace(",", "\n").splitlines() if x.strip()]
    if pf.richtung == "Eingang":
        o = [x for x in o if x.lower() != "sentitems"]
    elif pf.richtung == "Ausgang":
        o = [x for x in o if x.lower() == "sentitems"]
    return o


def abholen(postfach_name):
    """Delta-Abholung eines PH Postfach (Scheduler alle 5 min, Webhook-Auslöser). Idempotent."""
    e = einstellungen()
    pf = frappe.get_doc("PH Postfach", postfach_name)
    if not e["mail_sync_aktiv"] or not cint(pf.aktiv):
        return 0
    adresse = Z.normalisiere(pf.adresse)
    delta = json.loads(pf.delta_json or "{}")
    g = graph_client()
    anzahl, fehler = 0, None
    for ordner in _ordner(pf):
        start = (datetime.now(timezone.utc) - timedelta(days=e["sync_tage_vergangenheit"]))
        for _versuch in range(2):
            link = delta.get(ordner)
            params = None if link else {"$select": SELECT_LISTE, "changeType": "created", "$filter": f"receivedDateTime ge {_iso_utc(start)}"}
            try:
                items, neu = g.delta(link or f"{_u(adresse)}/mailFolders/{quote(ordner)}/messages/delta", params=params, headers=PREFER_ID)
            except DeltaAbgelaufen:
                delta.pop(ordner, None)
                continue
            except GraphFehler as f:
                fehler = f"{ordner}: Graph {f.status} {f.code}"
                break
            for m in items:
                if "@removed" in m:
                    continue
                try:
                    if verarbeiten(m, adresse, ordner):
                        anzahl += 1
                except GraphFehler as f:
                    fehler = f"{ordner}: Graph {f.status} {f.code}"
                except Exception:  # noqa: BLE001
                    frappe.log_error(title=f"PH Microsoft: Mail in {pf.name} nicht verarbeitet")
                    fehler = f"{ordner}: Verarbeitung fehlgeschlagen (Error Log)"
            if neu:
                delta[ordner] = neu
            break
    pf.db_set({
        "delta_json": json.dumps(delta),
        "letzte_abholung": now_datetime(),
        "status": "Fehler" if fehler else "Aktiv",
        "letzter_fehler": fehler,
        "mails_zugeordnet": cint(pf.mails_zugeordnet) + anzahl,
    }, update_modified=False)
    eintrag("Mail", "Abholung", "Fehler" if fehler else "OK", fehler, "PH Postfach", pf.name, postfach=adresse, anzahl=anzahl)
    festschreiben()
    return anzahl


# ── Manuelle Zuordnung (API) ───────────────────────────────────────────────────────────────────
def unzugeordnet(postfach=None, tage=14):
    """Flüchtige Liste (nicht gespeichert): Mails der letzten `tage` Tage ohne automatische Zuordnung."""
    tage = max(1, min(cint(tage) or einstellungen()["unzugeordnet_tage"], 31))
    erlaubt = erlaubte_postfaecher()
    if postfach:
        ziele = [postfach_pruefen(postfach)]
    else:
        ziele = erlaubt
    if not ziele:
        return []
    seit = _iso_utc(datetime.now(timezone.utc) - timedelta(days=tage))
    g = graph_client()
    aus = []
    for adresse in ziele:
        params = {"$filter": f"receivedDateTime ge {seit}", "$select": SELECT_LISTE, "$orderby": "receivedDateTime desc", "$top": 50}
        for m in g.seiten(f"{_u(adresse)}/messages", params=params, headers=PREFER_ID, max_seiten=4):
            mail = Z.graph_mail(m, adresse)
            if mail["entwurf"] or kommunikation_zu(mail["internet_id"]):
                continue
            ent = entscheiden(mail)
            if ent["aktion"] != Z.MANUELL:
                continue
            aus.append({
                "message_id": mail["id"],
                "postfach": adresse,
                "richtung": mail["richtung"],
                "absender": mail["absender"],
                "absender_name": mail["absender_name"],
                "gegenadresse": (ent["adressen"] or [""])[0],
                "betreff": mail["betreff"],
                "datum": mail["datum"],
                "grund": ent["grund"],
                "vertraulich": mail["sensitivity"] in Z.VERTRAULICH,
                "vorschlaege": [{"doctype": d, "name": n, "titel": _titel(d, n)} for d, n in ent["vorschlaege"][:5]],
            })
    aus.sort(key=lambda x: x["datum"] or "", reverse=True)
    return aus[:200]


def zuordnen(message_id, postfach, bezug_doctype, bezug_name, adresse_merken=False):
    pf = postfach_pruefen(postfach)
    if not bezug_doctype or not bezug_name or not frappe.db.exists("DocType", bezug_doctype) or not frappe.db.exists(bezug_doctype, bezug_name):
        raise ApiFehler("not_found", 404, _("Vorgang nicht gefunden."))
    if not frappe.has_permission(bezug_doctype, "read", doc=bezug_name):
        raise ApiFehler("forbidden", 403, _("Kein Recht auf diesen Vorgang."))
    voll = _voll_laden(pf, message_id)
    mail = Z.graph_mail(voll, pf)
    kontakte = kontakte_von_bezug(bezug_doctype, bezug_name)
    gemerkt = None
    if cint(adresse_merken):
        ziel = next(iter(kontakte), None)
        extern = [a for a in Z.gegenadressen(mail) if not Z.ist_intern(a, einstellungen()["interne_domains"], eigene_adressen())]
        if not ziel or not extern:
            raise ApiFehler("invalid", 400, _("Adresse kann nur mit Kontakt/Lieferant und externer Adresse gemerkt werden."), {"field": "adresse_merken"})
        gemerkt = adresse_zuordnen(extern[0], ziel[0], ziel[1])
    name = speichern(voll, mail, pf, kontakte, "manuell", bezug=(bezug_doctype, bezug_name), zugeordnet_von=frappe.session.user)
    return {"communication": name, "bezug_doctype": bezug_doctype, "bezug_name": bezug_name, "adresse_gemerkt": gemerkt}


def adresse_zuordnen(adresse, kontakt_doctype, kontakt_name, notiz=None):
    adresse = Z.normalisiere(adresse)
    vorhanden = frappe.db.get_value("PH Mail Adresse", {"adresse": adresse, "art": "Zuordnung", "kontakt_doctype": kontakt_doctype, "kontakt_name": kontakt_name})
    if vorhanden:
        return vorhanden
    doc = frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": adresse, "art": "Zuordnung", "kontakt_doctype": kontakt_doctype, "kontakt_name": kontakt_name, "notiz": notiz})
    doc.insert(ignore_permissions=True)
    _cache("treffer").pop(adresse, None)
    return doc.name


def zuordnung_aufheben(communication):
    c = frappe.db.get_value("Communication", communication, ["name", "ph_microsoft_postfach", "ph_microsoft_zugeordnet_von", "reference_doctype", "reference_name"], as_dict=True)
    if not c or not c.ph_microsoft_postfach:
        raise ApiFehler("not_found", 404, _("Keine über Exchange zugeordnete Mail."))
    darf = (
        c.ph_microsoft_zugeordnet_von == frappe.session.user
        or Z.normalisiere(c.ph_microsoft_postfach) in erlaubte_postfaecher()
        or hat_rolle(*ADMIN_ROLLEN, leitung=True)
    )
    if not darf:
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    kontakt = frappe.db.get_value("Communication Link", {"parent": c.name, "link_doctype": "PH Kontakt"}, "link_name")
    for f in frappe.get_all("File", filters={"attached_to_doctype": "Communication", "attached_to_name": c.name}, pluck="name"):
        frappe.delete_doc("File", f, ignore_permissions=True, force=True)
    frappe.delete_doc("Communication", c.name, ignore_permissions=True, force=True)
    eintrag("Mail", "Zuordnung aufgehoben", "OK", _("Mail aus der Akte entfernt, bleibt in Outlook."), c.reference_doctype, c.reference_name, postfach=c.ph_microsoft_postfach, kontakt=kontakt, benutzer=frappe.session.user)
    return {"ok": True, "communication": c.name}


def adresse_sperren(adresse, notiz=None):
    a = Z.normalisiere(adresse)
    if not a:
        raise ApiFehler("invalid", 400, _("Ungültige E-Mail-Adresse."), {"field": "adresse"})
    vorhanden = frappe.db.get_value("PH Mail Adresse", {"adresse": a, "art": "Sperre"})
    if not vorhanden:
        vorhanden = frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": a, "art": "Sperre", "notiz": (notiz or "")[:500] or None}).insert(ignore_permissions=True).name
        eintrag("Mail", "Adresse gesperrt", "OK", None, "PH Mail Adresse", vorhanden, benutzer=frappe.session.user)
    return {"ok": True, "adresse": a, "eintrag": vorhanden}


def kontakt_aus_mail(message_id, postfach):
    if not frappe.db.exists("DocType", "PH Kontakt"):
        raise ApiFehler("unavailable", 503, _("ph_crm (PH Kontakt) ist nicht installiert."))
    if not frappe.has_permission("PH Kontakt", "create"):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung, Kontakte anzulegen."))
    pf = postfach_pruefen(postfach)
    voll = _voll_laden(pf, message_id)
    mail = Z.graph_mail(voll, pf)
    extern = [a for a in Z.gegenadressen(mail) if not Z.ist_intern(a, einstellungen()["interne_domains"], eigene_adressen())]
    if not extern:
        raise ApiFehler("invalid", 400, _("Keine externe Adresse in dieser Mail."))
    vorhandene = treffer(extern[0])
    if vorhandene:
        raise ApiFehler("conflict", 409, _("Adresse ist bereits zugeordnet."), {"vorschlaege": [{"doctype": d, "name": n, "titel": _titel(d, n)} for d, n in vorhandene]})
    name_roh = mail["absender_name"] if mail["richtung"] == "eingang" else next((((x.get("emailAddress") or {}).get("name")) for x in voll.get("toRecipients") or [] if Z.normalisiere((x.get("emailAddress") or {}).get("address")) == extern[0]), "")
    vor, nach = Z.name_teilen(name_roh, extern[0])
    k = frappe.get_doc({"doctype": "PH Kontakt", "vorname": vor, "nachname": nach or extern[0].split("@")[0], "email": extern[0], "quelle": "email", "kontaktart": "Privat", "status": "Interessent"})
    k.insert()
    comm = speichern(voll, mail, pf, [("PH Kontakt", k.name)], "manuell", bezug=("PH Kontakt", k.name), zugeordnet_von=frappe.session.user)
    return {"kontakt": k.name, "communication": comm}


# ── Senden über Exchange ──────────────────────────────────────────────────────────────────────
def _anhaenge_laden(anhaenge):
    aus, summe = [], 0
    if isinstance(anhaenge, str):
        anhaenge = json.loads(anhaenge) if anhaenge.strip().startswith("[") else liste(anhaenge)
    for eintrag_ in anhaenge or []:
        if isinstance(eintrag_, dict):
            inhalt = eintrag_.get("fcontent")
            inhalt = inhalt if isinstance(inhalt, bytes) else base64.b64decode(inhalt or "")
            name, typ = eintrag_.get("fname") or "anhang", eintrag_.get("content_type") or "application/octet-stream"
        else:
            datei = frappe.db.get_value("File", {"file_url": eintrag_}) or (eintrag_ if frappe.db.exists("File", eintrag_) else None)
            if not datei:
                raise ApiFehler("not_found", 404, _("Anhang nicht gefunden."), {"field": "anhaenge"})
            f = frappe.get_doc("File", datei)
            if not f.has_permission("read"):
                raise ApiFehler("forbidden", 403, _("Kein Recht auf den Anhang."))
            inhalt = f.get_content()
            inhalt = inhalt.encode() if isinstance(inhalt, str) else inhalt
            name, typ = f.file_name, "application/octet-stream"
        summe += len(inhalt)
        if summe > MAX_SENDE_BYTES:
            raise ApiFehler("invalid", 400, _("Anhänge zusammen über 3 MB."), {"field": "anhaenge"})
        aus.append({"@odata.type": "#microsoft.graph.fileAttachment", "name": name[:140], "contentType": typ, "contentBytes": base64.b64encode(inhalt).decode()})
    return aus


def _empf(liste_):
    return [{"emailAddress": {"address": a}} for a in liste_]


def senden(an, betreff, html, von=None, anhaenge=None, bezug_doctype=None, bezug_name=None, cc=None, bcc=None):
    """1:1-Mail aus dem Exchange-Postfach des Benutzers (oder Shared-Mailbox mit Senderecht)."""
    user = frappe.session.user
    von = Z.normalisiere(von) or Z.normalisiere(frappe.db.get_value("User", user, "email"))
    if not von or von not in erlaubte_postfaecher(user, "senden"):
        raise ApiFehler("forbidden", 403, _("Kein Senderecht für dieses Postfach."), {"field": "von"})
    an_l = [Z.normalisiere(a) for a in liste(an)]
    cc_l = [Z.normalisiere(a) for a in liste(cc)]
    bcc_l = [Z.normalisiere(a) for a in liste(bcc)]
    if not an_l or not all(an_l + cc_l + bcc_l):
        raise ApiFehler("invalid", 400, _("Empfängeradresse fehlt oder ist ungültig."), {"field": "an"})
    if not str(betreff or "").strip():
        raise ApiFehler("invalid", 400, _("Pflichtfeld fehlt: betreff"), {"field": "betreff"})
    if bezug_doctype:
        if not frappe.db.exists("DocType", bezug_doctype) or not frappe.db.exists(bezug_doctype, bezug_name):
            raise ApiFehler("not_found", 404, _("Vorgang nicht gefunden."))
        if not frappe.has_permission(bezug_doctype, "read", doc=bezug_name):
            raise ApiFehler("forbidden", 403, _("Kein Recht auf diesen Vorgang."))
    from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen as core_einst

    ce = core_einst()
    test = cint(ce.get("testmodus"))
    echte = list(an_l)
    if test:
        an_l, cc_l, bcc_l = [Z.normalisiere(ce.get("team_email")) or von], [], []
        betreff = f"[TEST] {betreff}"
    nachricht = {
        "subject": str(betreff)[:255],
        "body": {"contentType": "HTML", "content": html or ""},
        "toRecipients": _empf(an_l),
        "ccRecipients": _empf(cc_l),
        "bccRecipients": _empf(bcc_l),
        "attachments": _anhaenge_laden(anhaenge) if anhaenge else [],
    }
    marke = frappe.generate_hash(length=32)
    nachricht["internetMessageHeaders"] = [{"name": KOPF_MARKE, "value": marke}]
    if bezug_doctype:
        nachricht["singleValueExtendedProperties"] = [{"id": "String {8b7f5a2e-3c1d-4e6f-9a0b-5d2c7e1f4a36} Name PHReferenz", "value": f"{bezug_doctype}|{bezug_name}"}]
    # Nur Mail.Send nötig (kein Entwurf mit Mail.ReadWrite). Die Kopie in „Gesendete Elemente“ erkennt verarbeiten()
    # an X-PH-Mail-Id und trägt dann internetMessageId/Graph-ID an der Communication nach.
    graph_client().post(f"{_u(von)}/sendMail", json={"message": nachricht, "saveToSentItems": True})
    kontakte = kontakte_von_bezug(bezug_doctype, bezug_name) if bezug_doctype else []
    if not test:
        for a in echte:
            t = treffer(a)
            if len(t) == 1:
                kontakte.append(t[0])
    kontakte = Z._eindeutig(kontakte)
    mail = {"id": f"ph:{marke}", "internet_id": None, "richtung": "ausgang", "absender": von, "absender_name": None,
            "an": an_l, "cc": cc_l, "betreff": nachricht["subject"], "datum": _iso_utc(datetime.now(timezone.utc)), "anhaenge": False}
    comm = speichern({"body": nachricht["body"]}, mail, von, kontakte, "manuell", bezug=(bezug_doctype, bezug_name) if bezug_doctype else None, zugeordnet_von=user)
    return {"ok": True, "communication": comm, "von": von, "testmodus": bool(test)}


def einzel_versand(empfaenger, betreff, html, anhaenge=None, bezug_doctype=None, bezug_name=None, von=None, cc=None):
    """Hook `ph_mail_einzelversand` (README): andere Apps senden 1:1-Kundenmails über Exchange, wenn
    PH Microsoft Einstellungen.kundenmails_ueber_exchange = 1. → dict oder None (dann Resend/ph_core nutzen)."""
    if not einstellungen()["kundenmails_ueber_exchange"]:
        return None
    try:
        return senden(empfaenger, betreff, html, von=von, anhaenge=anhaenge, bezug_doctype=bezug_doctype, bezug_name=bezug_name, cc=cc)
    except ApiFehler:
        return None
