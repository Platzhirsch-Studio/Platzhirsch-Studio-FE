"""DSGVO für PH Kontakt: Auskunft/Export (Art. 15/20), Lösch- und Aufbewahrungsplan, Anonymisieren (Art. 17
mit Ausnahme Abs. 3 lit. b – § 132 BAO 7 Jahre). Regeln: ph_crm/utils/aufbewahrung.py (ohne Frappe getestet).

Ablauf in der Praxis (PH Datenschutzanfrage):
  1. Anfrage erfassen (Frist 1 Monat), Identität prüfen.
  2. Auskunft: export() → JSON-Datei privat an der Anfrage; zusätzlich Druckformat „PH Kontakt DSGVO-Auskunft“.
  3. Löschung: plan() zeigen (was wird gelöscht / anonymisiert / bis wann aufbewahrt) → ausfuehren().
  4. Nach Fristende (aufbewahren_bis) anonymisiert der tägliche Task den Rest (tasks.dsgvo_fristen).
"""

import json

import frappe
from frappe import _
from frappe.utils import getdate, now_datetime, nowdate

from ph_crm.ph_crm.kontakt360 import hooks_aufrufen, kontakt_bezuege
from ph_crm.utils import aufbewahrung as auf

# Felder, die bei fremden DocTypes ohne eigenen Hook generisch geleert werden (nur wenn vorhanden)
PERSONENFELDER_FREMD = (
    "vorname", "nachname", "email", "telefon", "mobil", "strasse", "adresse", "plz", "ort", "plz_ort",
    "kunde_name", "kunde_email", "kunde_telefon", "kunde_adresse", "lieferadresse", "rechnungsadresse",
    "empfaenger_name", "empfaenger_email", "empfaenger_telefon", "anliegen", "notiz", "nachricht", "ip_hash",
    "geburtstag", "unterschrift", "unterschrift_name",
)
TECHNISCH = {"portal_token_hash", "idempotency_key", "ip_hash", "verify_hash", "manage_hash", "naming_series", "_user_tags", "_comments", "_assign", "_liked_by", "_seen"}
BESTAETIGUNG = "ANONYMISIEREN"


def _pruefe_leitung():
    frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin"))


def _sichtbar(meta, df):
    return df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Button", "Fold") and df.fieldname not in TECHNISCH and not int(df.permlevel or 0)


def _doc_daten(doc):
    """Personenbezogene Sicht eines Dokuments: alle Felder der Ebene 0 ohne Technik, Kindtabellen flach."""
    daten = {}
    for df in doc.meta.fields:
        if not _sichtbar(doc.meta, df):
            continue
        wert = doc.get(df.fieldname)
        if df.fieldtype in ("Table", "Table MultiSelect"):
            if wert:
                kind = frappe.get_meta(df.options)
                daten[df.label or df.fieldname] = [{(c.label or c.fieldname): z.get(c.fieldname) for c in kind.fields if _sichtbar(kind, c) and z.get(c.fieldname) not in (None, "")} for z in wert]
        elif wert not in (None, ""):
            daten[df.label or df.fieldname] = wert
    return daten


def auskunft(kontakt):
    """Vollständige Auskunft als dict (Art. 15) – maschinenlesbar (Art. 20)."""
    doc = frappe.get_doc("PH Kontakt", kontakt)
    doc.check_permission("read")
    abschnitte = [{"abschnitt": _("Stammdaten"), "doctype": "PH Kontakt", "name": doc.name, "daten": _doc_daten(doc)}]
    for b in kontakt_bezuege():
        for z in frappe.get_all(b.doctype, filters={b.feld: kontakt}, pluck="name", limit=1000):
            try:
                abschnitte.append({"abschnitt": _(b.doctype), "doctype": b.doctype, "name": z, "daten": _doc_daten(frappe.get_doc(b.doctype, z))})
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH CRM Auskunft: {b.doctype} {z} nicht lesbar")
    kom = frappe.get_all("Communication", filters={"reference_doctype": "PH Kontakt", "reference_name": kontakt}, fields=["name", "communication_date", "subject", "sent_or_received", "sender", "recipients", "content"], limit=1000)
    links = frappe.get_all("Communication Link", filters={"link_doctype": "PH Kontakt", "link_name": kontakt, "parenttype": "Communication"}, pluck="parent", limit=1000)
    if links:
        bekannt = {k.name for k in kom}
        kom += [k for k in frappe.get_all("Communication", filters={"name": ("in", links)}, fields=["name", "communication_date", "subject", "sent_or_received", "sender", "recipients", "content"]) if k.name not in bekannt]
    for k in kom:
        abschnitte.append({"abschnitt": _("Kommunikation"), "doctype": "Communication", "name": k.name, "daten": {"Datum": k.communication_date, "Richtung": k.sent_or_received, "Betreff": k.subject, "Von": k.sender, "An": k.recipients, "Inhalt": frappe.utils.strip_html(k.content or "")[:5000]}})
    for pfad, teile in hooks_aufrufen("ph_kontakt_datenauskunft", kontakt):
        for t in teile or []:
            if isinstance(t, dict) and t.get("daten") is not None:
                abschnitte.append({"abschnitt": t.get("abschnitt") or pfad.split(".", 1)[0], "doctype": t.get("doctype"), "name": t.get("name"), "daten": t["daten"]})
    return {
        "verantwortlicher": _verantwortlicher(),
        "betroffene_person": doc.titel,
        "kontakt": doc.name,
        "erstellt": now_datetime().isoformat(),
        "zwecke": _("Beratung, Planung, Verkauf, Lieferung/Montage, Service, Rechnungslegung; Marketing nur mit Einwilligung."),
        "speicherdauer": _("Vertrags- und Belegdaten 7 Jahre ab Ende des Kalenderjahres (§ 132 BAO); übrige Daten bis Widerruf/Löschung."),
        "abschnitte": abschnitte,
    }


def _verantwortlicher():
    """Verantwortlicher (Art. 13/15): Standardfirma aus ph_core (PH Firma)."""
    try:
        from ph_core.ph_core.doctype.ph_firma.ph_firma import standard_firma

        return standard_firma()
    except Exception:  # noqa: BLE001
        return None


def export(kontakt, an_doctype=None, an_name=None):
    """Auskunft als private JSON-Datei anhängen (an Datenschutzanfrage oder Kontakt) → file_url."""
    daten = auskunft(kontakt)
    inhalt = json.dumps(daten, ensure_ascii=False, indent=1, default=str)
    f = frappe.get_doc({
        "doctype": "File",
        "file_name": f"datenauskunft-{kontakt}-{nowdate()}.json",
        "is_private": 1,
        "content": inhalt.encode("utf-8"),
        "attached_to_doctype": an_doctype or "PH Kontakt",
        "attached_to_name": an_name or kontakt,
    })
    f.flags.ignore_permissions = True
    f.insert()
    frappe.get_doc("PH Kontakt", kontakt).add_comment("Info", _("Datenauskunft exportiert ({0} Abschnitte).").format(len(daten["abschnitte"])))
    return f.file_url


# ── Löschplan ───────────────────────────────────────────────────────────────


def _belegdatum(b, z):
    return z.get(b.datum_feld) or z.get("creation")


def plan(kontakt, heute=None):
    """Lösch-/Aufbewahrungsplan ohne Ausführung → [{doctype, name, aktion, grund, frist_bis, quelle}]."""
    heute = getdate(heute or nowdate())
    zeilen = {}
    for b in kontakt_bezuege():
        felder = ["name", "creation"] + ([b.datum_feld] if b.datum_feld != "creation" else []) + (["docstatus"] if b.submittable else [])
        for z in frappe.get_all(b.doctype, filters={b.feld: kontakt}, fields=felder, limit=5000):
            e = auf.entscheide(b.doctype, _belegdatum(b, z), heute, ist_submittable=b.submittable, docstatus=z.get("docstatus"))
            if e["aktion"] == "loeschen" and b.submittable and int(z.get("docstatus") or 0) == 1:
                e = {"aktion": "anonymisieren", "grund": _("Frist abgelaufen – gebuchter Beleg bleibt ohne Personenbezug"), "frist_bis": e["frist_bis"]}
            zeilen[(b.doctype, z.name)] = {"doctype": b.doctype, "name": z.name, **e, "quelle": "ph_crm"}
    for pfad, teile in hooks_aufrufen("ph_kontakt_anonymisieren", kontakt, ausfuehren=False):
        for t in auf.pruefe_plan(teile):
            zeilen[(t["doctype"], t["name"])] = {**t, "quelle": pfad.split(".", 1)[0]}
    # Kommunikation: an aufbewahrten Belegen = Geschäftspapier (aufbewahren), sonst löschen
    aufbewahrt = {k for k, v in zeilen.items() if v["aktion"] == "aufbewahren"}
    for k in frappe.get_all("Communication", filters={"reference_doctype": "PH Kontakt", "reference_name": kontakt}, fields=["name", "communication_date"], limit=5000):
        zeilen[("Communication", k.name)] = {"doctype": "Communication", "name": k.name, "aktion": "loeschen", "grund": _("E-Mail am Kontakt ohne Belegbezug"), "frist_bis": None, "quelle": "ph_crm"}
    for k in frappe.get_all("Communication", filters={"reference_doctype": ("in", list({d for d, _n in zeilen})), "reference_name": ("in", [n for _d, n in zeilen] or ["-"])}, fields=["name", "reference_doctype", "reference_name"], limit=5000):
        bezug = (k.reference_doctype, k.reference_name)
        if bezug in aufbewahrt:
            zeilen[("Communication", k.name)] = {"doctype": "Communication", "name": k.name, "aktion": "aufbewahren", "grund": _("Geschäftsbrief zu aufbewahrtem Beleg {0}").format(k.reference_name), "frist_bis": zeilen[bezug].get("frist_bis"), "quelle": "ph_crm"}
    if "ph_kassa" in frappe.get_installed_apps():
        # Kassenbelege bleiben (§ 132 BAO), ph_kassa entfernt den Kontaktbezug selbst (Initialen statt Name)
        for (dt, _n), z in zeilen.items():
            if dt == "PH Kassenbeleg":
                z.update({"aktion": "aufbewahren", "grund": _("Beleg bleibt (§ 132 BAO); Kontaktbezug entfernt ph_kassa (Initialen)"), "quelle": "ph_kassa", "ohne_kontaktbezug": True})
    liste = sorted(zeilen.values(), key=lambda x: (x["aktion"], x["doctype"], x["name"]))
    liste.append({**auf.kontakt_zeile(liste, heute), "name": kontakt, "quelle": "ph_crm"})
    return liste


# ── Ausführen ───────────────────────────────────────────────────────────────


def _spuren_loeschen(doctype, name):
    """Versionen, Kommentare und Papierkorb-Kopien enthalten alte Personendaten → mitlöschen."""
    frappe.db.delete("Version", {"ref_doctype": doctype, "docname": name})
    frappe.db.delete("Comment", {"reference_doctype": doctype, "reference_name": name, "comment_type": ("in", ["Comment", "Info", "Edit", "Attachment", "Like", "Label", "Workflow"])})
    frappe.db.delete("Deleted Document", {"deleted_doctype": doctype, "deleted_name": name})


def _anonymisiere_generisch(doctype, name):
    meta = frappe.get_meta(doctype)
    werte = {}
    for f in PERSONENFELDER_FREMD:
        df = meta.get_field(f)
        if df and df.fieldtype in ("Data", "Small Text", "Text", "Long Text", "Text Editor", "Phone", "Signature", "Date"):
            werte[f] = "Anonymisiert" if f in ("nachname", "kunde_name", "empfaenger_name") else None
    if werte:
        frappe.db.set_value(doctype, name, werte, update_modified=False)
    _spuren_loeschen(doctype, name)


def _kassa_anonymisieren(kontakt):
    """ph_kassa.dienste.kontakt_anonymisieren – nur wenn ph_kassa installiert; Fehler nur protokollieren.
    → Ergebnis der Kassa ({belege: n}) oder None (nicht installiert/fehlgeschlagen)."""
    if "ph_kassa" not in frappe.get_installed_apps():
        return None
    try:
        return frappe.get_attr("ph_kassa.dienste.kontakt_anonymisieren")(kontakt)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH CRM Löschung: ph_kassa.kontakt_anonymisieren für {kontakt} fehlgeschlagen")
        return None


def ausfuehren(kontakt, bestaetigung, anfrage=None):
    """Plan ausführen (nur Leitung). → {"plan", "aufbewahren_bis", "gezaehlt"}."""
    _pruefe_leitung()
    if str(bestaetigung or "").strip().upper() != BESTAETIGUNG:
        frappe.throw(_("Bitte zur Bestätigung „{0}“ eintippen.").format(BESTAETIGUNG))
    p = plan(kontakt)
    von_hooks = {(z["doctype"], z["name"]) for z in p if z.get("quelle") not in ("ph_crm", None)}
    zaehler = {"loeschen": 0, "anonymisieren": 0, "aufbewahren": 0}
    for z in p:
        if z["doctype"] == "PH Kontakt" or (z["doctype"], z["name"]) in von_hooks:
            continue
        try:
            if not frappe.db.exists(z["doctype"], z["name"]):
                continue
            if z["aktion"] == "loeschen":
                frappe.delete_doc(z["doctype"], z["name"], ignore_permissions=True, force=True, ignore_on_trash=True, delete_permanently=True)
                _spuren_loeschen(z["doctype"], z["name"])
            elif z["aktion"] == "anonymisieren":
                _anonymisiere_generisch(z["doctype"], z["name"])
            zaehler[z["aktion"]] += 1
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH CRM Löschung: {z['doctype']} {z['name']} fehlgeschlagen")
            z["fehler"] = 1
    for _pfad, _erg in hooks_aufrufen("ph_kontakt_anonymisieren", kontakt, ausfuehren=True):
        pass
    kassa = _kassa_anonymisieren(kontakt)
    if kassa is not None:
        p.append({"doctype": "PH Kassenbeleg", "name": _("(alle Belege des Kontakts)"), "aktion": "anonymisieren", "grund": _("ph_kassa: Kontaktbezug entfernt, {0} Belege").format(kassa.get("belege", 0) if isinstance(kassa, dict) else kassa), "frist_bis": None, "quelle": "ph_kassa", "ergebnis": kassa})
    frist = auf.gesamtfrist(p)
    werte = auf.kontakt_werte(aufbewahren=bool(frist) or auf.braucht_name(p))
    meta = frappe.get_meta("PH Kontakt")
    werte = {k: v for k, v in werte.items() if meta.has_field(k) and meta.get_field(k).fieldtype != "Table"}
    werte.update({"anonymisiert_am": now_datetime(), "aufbewahren_bis": frist, "nicht_kontaktieren": 1, "status": "Inaktiv" if not frist else frappe.db.get_value("PH Kontakt", kontakt, "status"), "loeschung_angefordert_am": frappe.db.get_value("PH Kontakt", kontakt, "loeschung_angefordert_am") or nowdate()})
    frappe.db.set_value("PH Kontakt", kontakt, werte, update_modified=True)
    if "nachname" in werte:  # vollständig: auch Adressen/Rollen weg
        frappe.db.delete("PH Kontakt Adresse", {"parent": kontakt, "parenttype": "PH Kontakt"})
    frappe.db.delete("PH Kontakt Rolle", {"parent": kontakt, "parenttype": "PH Kontakt"})
    frappe.db.set_value("PH Kontakt", kontakt, "titel", _("Anonymisiert") if "nachname" in werte else frappe.get_doc("PH Kontakt", kontakt).bilde_titel(), update_modified=False)
    _spuren_loeschen("PH Kontakt", kontakt)
    frappe.get_doc("PH Kontakt", kontakt).add_comment("Info", _("DSGVO-Löschung ausgeführt: {0} gelöscht, {1} anonymisiert, {2} aufbewahrt (bis {3}).").format(zaehler["loeschen"], zaehler["anonymisieren"], zaehler["aufbewahren"], frist or "–"))
    return {"plan": p, "aufbewahren_bis": frist, "gezaehlt": zaehler, "anfrage": anfrage}
