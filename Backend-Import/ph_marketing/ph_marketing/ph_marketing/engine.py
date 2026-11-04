"""Kundenreisen: Regel „Auslöser → Wartezeit → Mail-Vorlage“ mit Rechtsgrundlage und Protokoll (PH Reise Versand).

Übernommen aus ../platzhirsch-frappe-kundenbetreuung/kundenbetreuung/engine.py (Generator-Stand 29.10.2026) und an
das PH-Schema angepasst: Auftrags-Doctype konfigurierbar (PH Auftragsbestaetigung / PH Bestellung statt Sales Order),
Kontaktflags aus PH Kontakt, Event statt „PH Termin“, Abo-Auslöser, Einstellungen aus ph_core/ph_marketing.
Spiegel der Website-Regeln: src/lib/kundenbetreuung/rechtsgrundlagen.js (darfSenden).
"""

import hashlib
import json
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import add_days, cint, escape_html, getdate, now_datetime, nowdate

from ph_marketing.ph_marketing import einwilligung as ew
from ph_marketing.ph_marketing import versand
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils import regeln
from ph_marketing.utils.token import hash_token, neuer_token


def pruefe_reise(reise):
    html = frappe.db.get_value("PH Mail Vorlage", reise.vorlage, "html") if reise.vorlage else ""
    return regeln.pruefe_reise(reise, html or "")


# ── Darf an diesen Kontakt gesendet werden? ─────────────────────────────────
def widerspruch(email):
    return frappe.db.exists("Email Unsubscribe", {"email": email, "global_unsubscribe": 1})


def werbliche_mails_30_tage(email):
    n = frappe.db.count("PH Reise Versand", {"empfaenger": email, "werbung": 1, "status": "gesendet", "gesendet_am": (">=", now_datetime() - timedelta(days=30))})
    n += frappe.db.count("PH Newsletter Versand", {"email": email, "status": "gesendet", "gesendet_am": (">=", now_datetime() - timedelta(days=30))})
    return n


def darf_senden(reise, kontakt):
    """→ (ok, grundlage, grund). kontakt: dict aus faellige_kontakte()."""
    s = einstellungen()
    if not reise.werbung:
        return True, "V", None
    if kontakt.get("nicht_kontaktieren"):
        return False, None, "nicht_kontaktieren"
    if not s["kanzlei_fusszeilen_freigegeben"]:
        return False, None, "fusszeilen_nicht_freigegeben"
    if kontakt.get("reklamation_offen"):
        return False, None, "reklamation_offen"
    if kontakt.get("anfrage_offen") and reise.reise_id != "bewertung":
        return False, None, "anfrage_offen"
    if werbliche_mails_30_tage(kontakt["email"]) >= s["werbung_pro_30_tage"]:
        return False, None, "frequenzgrenze"
    if widerspruch(kontakt["email"]):
        return False, None, "widerspruch"
    g = regeln.grundlagen(reise)
    if "E" in g and reise.zweck and ew.aktiv(kontakt["email"], reise.zweck):
        return True, "E", None
    if "B" in g and kontakt.get("hat_auftrag"):
        if cint(reise.b_nur_mit_kanzlei) and not s["kanzlei_b_einladung_bestaetigt"]:
            return False, None, "b_kanzlei_offen"
        if cint(reise.segment_outdoor) and not kontakt.get("outdoor"):
            return False, None, "b_ohne_passenden_kauf"
        # § 174 Abs. 4 Z 3 TKG: Hinweis auf das Ablehnungsrecht beim Kauf, nachweisbar (Datum + Quelle in PH Kontakt)
        if not (kontakt.get("widerspruchshinweis_am") and kontakt.get("widerspruchshinweis_quelle")):
            return False, None, "kein_widerspruchshinweis"
        if not s["ecg_abgleich_gueltig_bis"] or getdate(s["ecg_abgleich_gueltig_bis"]) < getdate(nowdate()):
            return False, None, "ecg_abgleich_fehlt"
        return True, "B", None
    return False, None, "keine_grundlage"


# ── Kontakte je Auslöser ────────────────────────────────────────────────────
def _quelle_verfuegbar(s):
    return bool(s["auftrags_doctype"]) and frappe.db.exists("DocType", s["auftrags_doctype"])


def _auftrag_kontakt(s, name):
    f = s["felder"]
    doc = frappe.get_doc(s["auftrags_doctype"], name)
    positionen = doc.get(f["positionen_tabelle"]) or [] if f["positionen_tabelle"] else []
    kat, out = f["feld_pflegekategorie"], f["feld_outdoor"]
    k = {
        "email": (doc.get(f["feld_email"]) or "").strip().lower() if f["feld_email"] else "",
        "name": doc.get(f["feld_name"]) or "" if f["feld_name"] else "",
        "anrede_feld": doc.get(f["feld_anrede"]) or "" if f["feld_anrede"] else "",
        "berater": doc.get(f["feld_berater"]) if f["feld_berater"] else None,
        "produkt": doc.get(f["feld_produkt"]) or "" if f["feld_produkt"] else "",
        "pflegekategorien": sorted({p.get(kat) for p in positionen if kat and p.get(kat)}),
        "outdoor": any(cint(p.get(out)) for p in positionen) if out else False,
        "storniert": str(doc.get(f["feld_storniert"]) or "") == (f["wert_storniert"] or "Storniert") if f["feld_storniert"] else False,
        "hat_auftrag": True,
        "referenz_doctype": s["auftrags_doctype"],
        "referenz_name": doc.name,
        "nicht_kontaktieren": False,
        "reklamation_offen": False,
        "widerspruchshinweis_am": None,
        "widerspruchshinweis_quelle": "",
    }
    kontakt = doc.get(f["feld_kontakt"]) if f["feld_kontakt"] else None
    if kontakt and frappe.db.exists("DocType", "PH Kontakt") and frappe.db.exists("PH Kontakt", kontakt):
        kd = frappe.db.get_value("PH Kontakt", kontakt, ["nicht_kontaktieren", "widerspruchshinweis_am", "widerspruchshinweis_quelle", "email", "anrede", "nachname"], as_dict=True) or {}
        k.update(
            nicht_kontaktieren=bool(kd.get("nicht_kontaktieren")),
            widerspruchshinweis_am=kd.get("widerspruchshinweis_am"),
            widerspruchshinweis_quelle=kd.get("widerspruchshinweis_quelle") or "",
            email=k["email"] or (kd.get("email") or "").lower(),
            anrede_feld=k["anrede_feld"] or kd.get("anrede") or "",
            name=k["name"] or kd.get("nachname") or "",
            kontakt=kontakt,
        )
        if frappe.db.exists("DocType", "PH Servicefall"):
            k["reklamation_offen"] = bool(frappe.db.exists("PH Servicefall", {"kontakt": kontakt, "status": ("not in", ("Erledigt", "Abgelehnt", "Geschlossen"))}))
        if frappe.db.exists("DocType", "PH Anfrage"):
            k["anfrage_offen"] = bool(frappe.db.exists("PH Anfrage", {"kontakt": kontakt, "status": ("in", ("Neu", "Qualifiziert", "Termin vereinbart", "Angebot"))}))
    return k


def _auftraege(s, filters):
    return frappe.get_all(s["auftrags_doctype"], filters=filters, pluck="name", limit=5000)


def _einwilligungs_kontakte(zweck, extra_filters=None):
    out = []
    for e in frappe.get_all("PH Einwilligung", filters={"zweck": zweck, "status": "Bestaetigt", **(extra_filters or {})}, fields=["name", "email", "zeitpunkt", "daten_json", "doi_bestaetigt_am", "kontakt"]):
        out.append({"email": e.email, "name": "", "hat_auftrag": False, "pflegekategorien": [], "einwilligung": e.name, "daten": json.loads(e.daten_json or "{}"), "referenz_doctype": "PH Einwilligung", "referenz_name": e.name, "zeitpunkt": e.zeitpunkt, "bestaetigt_am": e.doi_bestaetigt_am, "kontakt": e.kontakt})
    return out


def faellige_kontakte(reise, trigger, heute):
    s = einstellungen()
    lief = s["felder"]["feld_lieferdatum"]
    typ = trigger.ausloeser_typ
    kontakte = []
    quelle_ok = _quelle_verfuegbar(s) and lief
    if typ == "datum" and quelle_ok:
        stichtag = add_days(heute, -cint(trigger.versatz_tage))
        kontakte = [_auftrag_kontakt(s, n) for n in _auftraege(s, {lief: stichtag})]
    elif typ == "jahrestag" and quelle_ok:
        d = getdate(heute)
        for n in _auftraege(s, [[lief, "<", add_days(d, -364)]]):
            ld = frappe.db.get_value(s["auftrags_doctype"], n, lief)
            if ld and getdate(ld).month == d.month and getdate(ld).day == d.day and getdate(ld).year < d.year:
                kontakte.append(_auftrag_kontakt(s, n))
    elif typ == "jaehrlich":
        if getdate(heute).strftime("%m-%d") != (trigger.tag_monat or ""):
            return []
        seen = set()
        if quelle_ok:
            for n in _auftraege(s, {lief: ("is", "set")}):
                k = _auftrag_kontakt(s, n)
                if cint(reise.segment_outdoor) and not k["outdoor"]:
                    continue
                if k["email"] and k["email"] not in seen:
                    seen.add(k["email"])
                    kontakte.append(k)
        for k in _einwilligungs_kontakte(reise.zweck or "newsletter", {"interessen": ("like", "%outdoor%")} if cint(reise.segment_outdoor) else None):
            if k["email"] not in seen:
                seen.add(k["email"])
                k["outdoor"] = True
                kontakte.append(k)
    elif typ == "event" and trigger.event:
        ev = frappe.get_doc("PH Event", trigger.event)
        if ev.status not in ("Offen", "Ausgebucht") or getdate(add_days(ev.datum, cint(trigger.versatz_tage))) != getdate(heute):
            return []
        seen = set()
        angemeldet = {a.email for a in ev.anmeldungen if a.status != "abgesagt"}
        for k in _einwilligungs_kontakte("einladungen"):
            if k["email"] in angemeldet or k["email"] in seen:
                continue
            seen.add(k["email"])
            k["event"] = ev.name
            kontakte.append(k)
        if quelle_ok and cint(reise.grundlage_b):
            for n in _auftraege(s, {lief: ("is", "set")}):
                k = _auftrag_kontakt(s, n)
                if k["email"] and k["email"] not in seen and k["email"] not in angemeldet:
                    seen.add(k["email"])
                    k["event"] = ev.name
                    kontakte.append(k)
    elif typ == "einwilligung":
        zwecke = regeln.liste_aus_text(trigger.zwecke)
        stichtag = getdate(add_days(heute, -cint(trigger.versatz_tage)))
        for z in zwecke:
            for k in _einwilligungs_kontakte(z):
                if k.get("bestaetigt_am") and getdate(k["bestaetigt_am"]) == stichtag:
                    kontakte.append(k)
    elif typ == "abo_bestaetigt":
        stichtag = getdate(add_days(heute, -cint(trigger.versatz_tage)))
        for a in frappe.get_all("PH Newsletter Abo", filters={"status": "Aktiv", "altbestand_ohne_doi": 0}, fields=["name", "email", "doi_bestaetigt_am", "anrede_name", "einwilligung"]):
            if a.doi_bestaetigt_am and getdate(a.doi_bestaetigt_am) == stichtag:
                kontakte.append({"email": a.email, "name": a.anrede_name or "", "hat_auftrag": False, "pflegekategorien": [], "einwilligung": a.einwilligung, "referenz_doctype": "PH Newsletter Abo", "referenz_name": a.name})

    out = []
    for k in kontakte:
        if not k.get("email") or k.get("storniert"):
            continue
        if cint(reise.segment_pflege) and not k.get("pflegekategorien"):
            continue
        if cint(reise.segment_outdoor) and not k.get("outdoor"):
            continue
        out.append(k)
    return out


# ── Planen und Senden ───────────────────────────────────────────────────────
def schluessel(reise, trigger_idx, kontakt, heute):
    teil = kontakt.get("referenz_name") or kontakt.get("event") or ""
    jahr = getdate(heute).year if reise.reise_id in ("jahrestag", "outdoor") else ""
    roh = f"{reise.reise_id}|{trigger_idx}|{kontakt['email']}|{teil}|{jahr}"
    return hashlib.sha256(roh.encode()).hexdigest()[:40]


def planen_fuer(heute=None):
    heute = heute or nowdate()
    geplant = 0
    for name in frappe.get_all("PH Kundenreise", filters={"aktiv": 1, "status": "Aktiv"}, pluck="name"):
        reise = frappe.get_doc("PH Kundenreise", name)
        fehler = pruefe_reise(reise)
        if fehler:
            frappe.log_error(title=f"PH Kundenreise {name} gesperrt", message="\n".join(fehler))
            continue
        for t in reise.trigger:
            for k in faellige_kontakte(reise, t, heute):
                key = schluessel(reise, t.idx if reise.reise_id == "merkliste" else 0, k, heute)
                if frappe.db.exists("PH Reise Versand", {"schluessel": key}):
                    continue
                if cint(reise.einmalig) and frappe.db.exists("PH Reise Versand", {"reise": name, "empfaenger": k["email"], "status": "gesendet"}):
                    continue
                if cint(reise.max_je_kontakt) and frappe.db.count("PH Reise Versand", {"reise": name, "empfaenger": k["email"], "status": "gesendet"}) >= cint(reise.max_je_kontakt):
                    continue
                frappe.get_doc(
                    {
                        "doctype": "PH Reise Versand",
                        "schluessel": key,
                        "reise": name,
                        "empfaenger": k["email"],
                        "werbung": reise.werbung,
                        "status": "geplant",
                        "einwilligung": k.get("einwilligung"),
                        "referenz_doctype": k.get("referenz_doctype"),
                        "referenz_name": k.get("referenz_name"),
                        "kontext_json": json.dumps(k, default=str, ensure_ascii=False),
                        "geplant_am": heute,
                    }
                ).insert(ignore_permissions=True)
                geplant += 1
        frappe.db.commit()
    return geplant


def senden_fuer(heute=None, limit=500):
    heute = getdate(heute or nowdate())
    s = einstellungen()
    if not s["automatik_aktiv"]:
        return 0
    wochentage = regeln.liste_aus_text(s["werbung_wochentage"], regeln.WERBUNG_WOCHENTAGE)
    sperrtage = regeln.liste_aus_text(s["sperrtage"], regeln.SPERRTAGE)
    if regeln.sperrtag(heute, sperrtage):
        return 0
    gesendet = 0
    for v in frappe.get_all("PH Reise Versand", filters={"status": "geplant"}, pluck="name", order_by="creation asc", limit=limit):
        vs = frappe.get_doc("PH Reise Versand", v)
        if vs.werbung and not regeln.werbung_heute_erlaubt(heute, wochentage, sperrtage):
            continue
        reise = frappe.get_doc("PH Kundenreise", vs.reise)
        if not reise.aktiv:
            vs.db_set({"status": "uebersprungen", "grund": "reise_inaktiv"})
            continue
        kontakt = json.loads(vs.kontext_json or "{}")
        if kontakt.get("referenz_doctype") == s["auftrags_doctype"] and kontakt.get("referenz_name") and _quelle_verfuegbar(s):
            kontakt.update({k: val for k, val in _auftrag_kontakt(s, kontakt["referenz_name"]).items() if k != "email"})
        ok, grundlage, grund = darf_senden(reise, kontakt)
        if not ok:
            vs.db_set({"status": "uebersprungen", "grund": grund})
            reise.db_set("uebersprungen_gesamt", cint(reise.uebersprungen_gesamt) + 1, update_modified=False)
            frappe.db.commit()
            continue
        try:
            sende_mail(reise, kontakt, grundlage)
            vs.db_set({"status": "gesendet", "grundlage": grundlage, "gesendet_am": now_datetime()})
            reise.db_set({"gesendet_gesamt": cint(reise.gesendet_gesamt) + 1, "letzter_versand": now_datetime()}, update_modified=False)
            gesendet += 1
        except Exception:  # noqa: BLE001
            vs.db_set({"status": "fehler", "grund": "versand"})
            frappe.log_error(title=f"PH Reise Versand {vs.name}")
        frappe.db.commit()
    return gesendet


def pflege_module(kategorien):
    from ph_marketing.ph_marketing.pflege import PFLEGE_MODULE

    return [PFLEGE_MODULE[k] for k in kategorien if k in PFLEGE_MODULE]


def kontext(reise, kontakt, grundlage, abmelde_link=None):
    berater = kontakt.get("berater")
    datum = ""
    if grundlage == "E" and reise.zweck:
        d = frappe.db.get_value("PH Einwilligung", {"email": kontakt["email"], "zweck": reise.zweck, "status": "Bestaetigt"}, "doi_bestaetigt_am", order_by="doi_bestaetigt_am desc")
        datum = frappe.utils.formatdate(d, "dd.MM.yyyy") if d else ""
    ctx = {
        "anrede": versand.anrede_fuer(kontakt.get("name"), kontakt.get("anrede_feld")),
        "produkt": escape_html(kontakt.get("produkt") or "Ihr neues Stück"),
        "berater_name": escape_html(frappe.utils.get_fullname(berater)) if berater else "Ihr Platzhirsch-Team",
        "berater_telefon": escape_html(frappe.db.get_value("User", berater, "phone") or "") if berater else "",
        "pflege_module": pflege_module(kontakt.get("pflegekategorien") or []),
        "portal_url": versand.website_url("/de/portal"),
        "bewerten_url": versand.website_url("/de/bewerten?utm_source=email&utm_medium=email&utm_campaign=bewertung"),
        "gemerkte_stuecke": (kontakt.get("daten") or {}).get("stuecke", []),
        "neuheiten": "",
        "abmelde_url": abmelde_link or "",
        "einwilligung_datum": datum,
        "fusszeile": regeln.FUSSZEILE_FUER.get(grundlage, "V"),
    }
    if reise.werbung:
        ctx["fusszeile_html"] = versand.fusszeile_html(grundlage, abmelde_link or versand.website_url(einstellungen()["abmelden_pfad"]), datum)
    if kontakt.get("event") and frappe.db.exists("PH Event", kontakt["event"]):
        ev = frappe.get_doc("PH Event", kontakt["event"])
        ctx.update(event_titel=escape_html(ev.titel), event_datum=versand.datum_lang(ev.datum), event_uhrzeit=(str(ev.uhrzeit_von)[:5] + " Uhr") if ev.uhrzeit_von else "", event_programm=escape_html(frappe.utils.strip_html(ev.programm or "")), event_url=ev.url or "")
    return ctx


def _abmelde_link(kontakt):
    """Abmeldelink: über das Newsletter-Abo (Token) oder – ohne Abo – über die Website-Seite mit E-Mail-Hinweis."""
    email = kontakt["email"]
    if frappe.db.exists("PH Newsletter Abo", email):
        abo = frappe.get_doc("PH Newsletter Abo", email)
        token = neuer_token()
        abo.db_set("abmelde_token_hash", hash_token(token), update_modified=False)
        return versand.abmelde_url(token)
    return versand.website_url(einstellungen()["abmelden_pfad"])


def sende_mail(reise, kontakt, grundlage):
    link = _abmelde_link(kontakt) if reise.werbung else None
    ctx = kontext(reise, kontakt, grundlage, link)
    betreff, html = versand.rendern(reise.vorlage, ctx)
    versand.sende(kontakt["email"], betreff, html, referenz_doctype=kontakt.get("referenz_doctype"), referenz_name=kontakt.get("referenz_name"), absender_art="gastgeberin" if reise.absender == "gastgeberin" else "standard")


def testmail(reise, empfaenger=None):
    """Button „Testmail“: Beispielkontext an die Testadresse (Testmodus-Umleitung greift zusätzlich)."""
    e = einstellungen()
    ziel = empfaenger or e["test_empfaenger"]
    if not ziel:
        frappe.throw(_("Keine Testadresse hinterlegt."))
    kontakt = {"email": ziel, "name": "Muster", "anrede_feld": "Frau", "produkt": "Ihr Sofa", "pflegekategorien": ["stoff", "holz"], "daten": {"stuecke": [{"name": "Beispielstück", "url": versand.website_url("/de")}]}}
    grundlage = "V" if not reise.werbung else ("E" if cint(reise.grundlage_e) else "B")
    ctx = kontext(reise, kontakt, grundlage, versand.website_url(e["abmelden_pfad"]))
    betreff, html = versand.rendern(reise.vorlage, ctx)
    versand.sende(ziel, f"[Testmail {reise.reise_id}] {betreff}", html, referenz_doctype="PH Kundenreise", referenz_name=reise.name)
    return ziel
