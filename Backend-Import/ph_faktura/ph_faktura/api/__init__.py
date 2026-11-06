"""Whitelisted Methoden von ph_faktura (Token des Benutzers website@platzhirsch.studio, CONVENTIONS 11).

Kundenportal (src/lib/portal/adapters/frappe.js, PLAN.md Zeile 14):
  portal_documents(kontakt, kunde_token, art=None)  → {documents: [{id, type, number, date, amount_cent|None, outstanding_cent, dueDate, status, pdf}]}
  portal_document_pdf(kontakt, kunde_token, doctype, name) → PDF-Datei (gestreamt), nur eigene Belege
Intern (ph_shop / ph_kassa, Token mit Rolle PH Website Integration oder Desk-Benutzer):
  create_cash_invoice(bestellung)                   → Barverkauf-Rechnung aus bezahlter PH Bestellung
  create_partial_invoice(auftrag, lieferschein=None, positionen=None, idempotency_key=None) → Teilrechnung (ph_logistik)
  register_payment(rechnung, betrag_cent, kanal, zahlung=None, datum=None)

kunde_token: Klartext-Token aus dem Magic-Link; geprüft gegen PH Kontakt.portal_token_hash (SHA-256).
Beträge werden nur gezeigt, wenn PH Faktura Einstellungen das zulässt (Inhaber-Frage 10) – sonst None („auf Anfrage“).
"""

import hashlib
import hmac

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, nowdate

from ph_core.api import ApiFehler, pflicht, ph_api, text

PORTAL_DOCTYPES = {"PH Angebot": "quotation", "PH Auftragsbestaetigung": "order", "PH Rechnung": "invoice", "PH Gutschrift": "credit_note"}


def _kunde_pruefen(kontakt, kunde_token):
    """Einheitliche Kundenprüfung (60-website-backend-umstellung.md, Lücke ph_faktura 2): ph_projekte.api.basis.kunde
    (portal_aktiv, Ablauf, mehrere Sitzungen je Kontakt, Sperre) – sonst ph_core.api.portal_kontakt_pruefen."""
    try:
        from ph_projekte.api.basis import kunde
    except ImportError:
        kunde = None
    if kunde is not None:
        kunde(kontakt, kunde_token)
        return
    try:
        from ph_core.api import portal_kontakt_pruefen

        portal_kontakt_pruefen(kontakt, kunde_token)
        return
    except ImportError:
        pass
    if not frappe.db.exists("DocType", "PH Kontakt"):
        raise ApiFehler("unavailable", 503, "Kontakte sind noch nicht installiert.")
    if not frappe.get_meta("PH Kontakt").has_field("portal_token_hash"):
        raise ApiFehler("unavailable", 503, "Portal-Token nicht konfiguriert.")
    soll = frappe.db.get_value("PH Kontakt", kontakt, "portal_token_hash") or ""
    ist = hashlib.sha256(str(kunde_token or "").encode()).hexdigest()
    if not soll or not hmac.compare_digest(str(soll), ist):
        raise ApiFehler("invalid_token", 404, "Ungültiger Zugang.")


def _dokument(dt, d, betraege):
    outstanding = cint(d.get("offen_cent")) if dt == "PH Rechnung" else 0
    return {
        "id": d.name,
        "type": PORTAL_DOCTYPES[dt],
        "subtype": d.get("art"),
        "number": d.get("nummer") or d.name,
        "date": str(d.datum) if d.get("datum") else None,
        "amount_cent": cint(d.get("zahlbar_cent") if dt == "PH Rechnung" else d.get("brutto_cent")) if betraege else None,
        "outstanding_cent": outstanding if betraege else None,
        "dueDate": str(d.faellig) if d.get("faellig") else None,
        "status": d.get("status"),
        "pdf": bool(d.get("pdf")) or dt in ("PH Angebot", "PH Auftragsbestaetigung"),
    }


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
@ph_api()
def portal_documents(kontakt, kunde_token, art=None, **kw):
    pflicht({"kontakt": kontakt, "kunde_token": kunde_token}, "kontakt", "kunde_token")
    _kunde_pruefen(kontakt, kunde_token)
    betraege = bool(frappe.db.get_single_value("PH Faktura Einstellungen", "portal_betraege_anzeigen")) if frappe.get_meta("PH Faktura Einstellungen").has_field("portal_betraege_anzeigen") else False
    out = []
    for dt in PORTAL_DOCTYPES:
        if art and PORTAL_DOCTYPES[dt] != art:
            continue
        filters = {"kontakt": kontakt}
        if dt in ("PH Rechnung", "PH Gutschrift"):
            filters["docstatus"] = 1
        else:
            filters["status"] = ("not in", ("Entwurf", "Ersetzt"))
        felder = ["name", "datum", "status", "brutto_cent"] + (["nummer", "art", "zahlbar_cent", "offen_cent", "faellig", "pdf"] if dt == "PH Rechnung" else ["pdf"] if dt in ("PH Gutschrift", "PH Angebot") else [])
        if dt == "PH Gutschrift":
            felder += ["nummer", "art"]
        for d in frappe.get_all(dt, filters=filters, fields=felder, order_by="datum desc", limit=200):
            out.append(_dokument(dt, d, betraege))
    out.sort(key=lambda x: x["date"] or "", reverse=True)
    return {"documents": out}


@frappe.whitelist(allow_guest=False, methods=["POST", "GET"])
def portal_document_pdf(kontakt, kunde_token, doctype, name):
    """Streamt das PDF eines eigenen Belegs. Kein ph_api-Decorator (Binärantwort), Rollen-/Tokenprüfung hier.
    Fehler als Website-Fehlerform {code, message} mit HTTP-Status (forbidden 403, invalid 400, invalid_token/not_found 404,
    expired 410, unavailable 503) statt 500 (60-website-backend-umstellung.md, Lücke ph_faktura 1)."""
    try:
        doc = _portal_beleg(kontakt, kunde_token, doctype, name)
    except ApiFehler as e:
        frappe.local.response["http_status_code"] = e.http_status
        return {"code": e.code, "message": e.meldung, **(e.daten or {})}
    from ph_faktura.versand import pdf_bytes

    frappe.local.response.filename = f"{doc.get('nummer') or doc.name}.pdf"
    frappe.local.response.filecontent = pdf_bytes(doc)
    frappe.local.response.type = "pdf"


def _portal_beleg(kontakt, kunde_token, doctype, name):
    if frappe.session.user != "Administrator" and "PH Website Integration" not in frappe.get_roles():
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    if doctype not in PORTAL_DOCTYPES:
        raise ApiFehler("invalid", 400, _("Unbekannter Belegtyp."), {"field": "doctype"})
    if not kontakt or not kunde_token or not name:
        raise ApiFehler("invalid", 400, _("kontakt, kunde_token und name sind Pflicht."))
    _kunde_pruefen(kontakt, kunde_token)
    if not frappe.db.exists(doctype, name):
        raise ApiFehler("not_found", 404, _("Beleg nicht gefunden."))
    doc = frappe.get_doc(doctype, name)
    if doc.kontakt != kontakt or doc.get("status") in ("Entwurf", "Ersetzt") or (doc.meta.is_submittable and doc.docstatus != 1):
        raise ApiFehler("not_found", 404, _("Beleg nicht gefunden."))
    return doc


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Rechnung", r["rechnung"]))
def create_cash_invoice(bestellung, **kw):
    """Barverkauf-Rechnung aus einer bezahlten Shop-Bestellung (PH Bestellung, ph_shop) – Button „Rechnung erstellen“
    im Bestellformular (Client Script) und Aufruf aus ph_kassa.
    Feldnamen laut ph_shop, geprüft 04.11.: kontakt, kunde_name, kunde_email, adresse_strasse/hausnr/plz/ort/land,
    rechnung_name, rechnung_adresse (mehrzeilig), rechnung_uid, positionen (bezeichnung, menge, einzel_cent brutto,
    ust_satz_promille, produkt, marke, variante_name), gesamt_cent, versand_cent, ust_aufteilung (PH Bestellung Steuer)."""
    pflicht({"bestellung": bestellung}, "bestellung")
    if not frappe.db.exists("DocType", "PH Bestellung"):
        raise ApiFehler("unavailable", 503, "PH Bestellung (ph_shop) nicht installiert.")
    vorhanden = frappe.db.get_value("PH Rechnung", {"bestellung": bestellung, "docstatus": 1, "status": ("!=", "Storniert")}, "name")
    if vorhanden:
        return {"rechnung": vorhanden, "status": "vorhanden"}
    b = frappe.get_doc("PH Bestellung", bestellung)
    if b.status not in ("bezahlt", "versandbereit", "versendet", "abgeholt", "abholbereit"):
        raise ApiFehler("conflict", 409, f"Bestellung ist nicht bezahlt ({b.status}).")
    # Rechnungsadresse: abweichende Rechnungsanschrift (rechnung_adresse, Zeilen: Straße / PLZ Ort / Land) sonst Lieferadresse
    strasse, plz, ort, land = f"{b.adresse_strasse or ''} {b.adresse_hausnr or ''}".strip(), b.adresse_plz, b.adresse_ort, b.adresse_land
    if b.rechnung_adresse:
        zeilen = [z.strip() for z in str(b.rechnung_adresse).splitlines() if z.strip()]
        if len(zeilen) >= 2:
            strasse = zeilen[0]
            teile = zeilen[1].split(" ", 1)
            plz, ort = (teile[0], teile[1]) if len(teile) == 2 else (plz, zeilen[1])
            if len(zeilen) >= 3 and len(zeilen[2]) == 2:
                land = zeilen[2]
    re = frappe.new_doc("PH Rechnung")
    re.update({
        "art": "Barverkauf", "kontakt": b.kontakt, "kunde_name": b.rechnung_name or b.kunde_name, "bestellung": b.name, "datum": nowdate(),
        "leistungsdatum": getdate(b.bezahlt_am) if b.bezahlt_am else nowdate(), "faellig": nowdate(),
        "strasse": strasse, "plz": plz, "ort": ort, "land": (land or "AT")[:2].upper(), "uid_empfaenger": b.rechnung_uid,
        "sprache": (b.sprache or "de")[:2], "quelle": "shop", "idempotency_key": f"bestellung:{b.name}",
    })
    if b.oss and b.steuerland and re.meta.has_field("oss_land"):
        re.update({"ust_fall": "OSS", "oss_land": b.steuerland})
    for p in b.positionen:
        satz = cint(p.ust_satz_promille or 2000)
        re.append("positionen", {"art": "Produkt", "produkt": p.produkt, "bezeichnung": p.bezeichnung or p.variante_name or p.slug or p.produkt, "marke": p.marke, "ausfuehrung_text": p.variante_name or p.variante,
                                 "menge": p.menge or 1, "einzel_netto_cent": _netto_aus_brutto(p.einzel_cent, satz), "ust_satz_promille": satz})
    if cint(b.versand_cent):
        # Versand je USt-Satz laut PH Bestellung Steuer (satz_promille, versand_cent); ohne Aufteilung: Normalsatz
        aufteilung = [(cint(z.satz_promille), cint(z.versand_cent)) for z in (b.ust_aufteilung or []) if cint(z.versand_cent)]
        if not aufteilung:
            aufteilung = [(2000, cint(b.versand_cent))]
        for satz, brutto in aufteilung:
            re.append("positionen", {"art": "Leistung", "bezeichnung": "Versand", "menge": 1, "einheit": "Pausch", "einzel_netto_cent": _netto_aus_brutto(brutto, satz), "ust_satz_promille": satz})
    if not re.kontakt:
        raise ApiFehler("invalid", 400, "Bestellung ohne Kontakt – Rechnung braucht einen Kunden.")
    re.insert(ignore_permissions=True)
    re.submit()
    bezahlt = cint(b.betrag_bezahlt_cent or b.gesamt_cent)
    if bezahlt:
        from ph_faktura.zahlung import zahlung_auf_rechnung

        zahlung_auf_rechnung(re, bezahlt, "Stripe Checkout" if b.zahlung == "online" else "Bar", b.bezahlt_am, zahlung_name=b.zahlung_ref, hinweis=b.payment_intent)
    return {"rechnung": re.name, "status": re.status}


@frappe.whitelist(allow_guest=False, methods=["POST"])
def create_partial_invoice(auftrag, lieferschein=None, positionen=None, idempotency_key=None, **kw):
    """Teilrechnung aus PH Auftragsbestaetigung über gelieferte, nicht abgerechnete Mengen (ph_logistik PH Lieferschein,
    Button „Teilrechnung erstellen“). positionen: {PH Beleg Position.name: menge} – gedeckelt auf
    (lieferschein_menge − rechnung_menge); ohne Angabe alle offenen Liefermengen. Idempotent über idempotency_key
    (Standard lieferschein:<name>). → {"rechnung": name, "status": "neu"|"vorhanden"}"""
    pflicht({"auftrag": auftrag}, "auftrag")
    frappe.has_permission("PH Rechnung", "create", throw=True)
    key = idempotency_key or (f"lieferschein:{lieferschein}" if lieferschein else None)
    if key:
        vorhanden = frappe.db.get_value("PH Rechnung", {"idempotency_key": key, "status": ("!=", "Storniert")}, "name")
        if vorhanden:
            return {"rechnung": vorhanden, "status": "vorhanden"}
    if lieferschein and frappe.db.exists("DocType", "PH Lieferschein"):
        vorhanden = frappe.db.get_value("PH Lieferschein", lieferschein, "teilrechnung")
        if vorhanden and frappe.db.exists("PH Rechnung", vorhanden):
            return {"rechnung": vorhanden, "status": "vorhanden"}
    ab = frappe.get_doc("PH Auftragsbestaetigung", auftrag)
    if isinstance(positionen, str):
        positionen = frappe.parse_json(positionen)
    mengen = None
    if positionen:
        offen = {p.name: max(flt(p.lieferschein_menge) - flt(p.rechnung_menge), 0) for p in ab.positionen}
        mengen = {k: min(flt(v), offen.get(k, 0)) for k, v in positionen.items() if k in offen and flt(v) > 0 and offen.get(k, 0) > 0}
        if not mengen:
            raise ApiFehler("conflict", 409, "Keine offenen Liefermengen für diese Positionen (noch nicht geliefert oder schon abgerechnet).")
    name = ab.rechnung_erstellen(art="Teilrechnung", mengen=mengen)
    werte = {}
    if key:
        werte["idempotency_key"] = key
    if lieferschein:
        werte["teillieferung_hinweis"] = _("Teillieferung {0} zu {1}").format(lieferschein, auftrag)
    if werte:
        frappe.db.set_value("PH Rechnung", name, werte, update_modified=False)
    return {"rechnung": name, "status": "neu"}


def _netto_aus_brutto(brutto_cent, satz_promille):
    from decimal import Decimal

    from ph_faktura.rechenwerk.steuer import rund

    satz = cint(satz_promille or 2000)
    return rund(Decimal(cint(brutto_cent)) * Decimal(10000) / Decimal(10000 + satz))


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Rechnung", r["rechnung"]))
def register_payment(rechnung, betrag_cent, kanal="Ueberweisung", zahlung=None, datum=None, **kw):
    """Intern: Zahlung auf eine Rechnung verbuchen (z. B. ph_kassa nach Kassenbeleg mit Rechnungsbezug)."""
    pflicht({"rechnung": rechnung, "betrag_cent": betrag_cent}, "rechnung", "betrag_cent")
    if not frappe.db.exists("PH Rechnung", rechnung):
        raise ApiFehler("not_found", 404, "Rechnung nicht gefunden.")
    from ph_faktura.zahlung import zahlung_auf_rechnung

    re = zahlung_auf_rechnung(rechnung, cint(betrag_cent), text(kanal, 30) or "Ueberweisung", datum, zahlung_name=zahlung)
    return {"rechnung": re.name, "status": re.status, "offen_cent": cint(re.offen_cent)}


# ── Kassa, Journal, Zahllauf (50-backend-luecken-kassa-faktura.md) ─────────────

KASSA_STEUERSAETZE = {"Normal 20": 2000, "Ermaessigt-1 10": 1000, "Ermaessigt-2 13": 1300, "Null 0": 0, "Besonders 19": 1900, "Steuerfrei": 0}
ROLLEN_KASSA_FAKTURA = {"PH Kassa Mitarbeiter", "PH Kassa Leitung", "PH Faktura Mitarbeiter", "PH Faktura Leitung", "System Manager"}


@frappe.whitelist(allow_guest=False, methods=["POST"])
def create_invoice_from_receipt(kassenbeleg, kontakt=None, **kw):
    """Barverkaufsrechnung aus einem Kassenbeleg (§ 11 UStG über 400 € oder auf Kundenwunsch, Fachkritik 21 P4).

    Positionen netto aus brutto je Satz, Zahlung „Kassa“ = bezahlt. Die Rechnung trägt `kassenbeleg`; die UVA nimmt
    den Umsatz aus der Kassa (nicht doppelt). Idempotent je Kassenbeleg. → {rechnung, status, differenz_cent}
    """
    if not set(frappe.get_roles()) & ROLLEN_KASSA_FAKTURA:
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        frappe.throw(_("ph_kassa ist nicht installiert."))
    vorhanden = frappe.db.get_value("PH Rechnung", {"kassenbeleg": kassenbeleg, "status": ("!=", "Storniert")}, "name")
    if vorhanden:
        return {"rechnung": vorhanden, "status": "vorhanden", "differenz_cent": 0}
    kb = frappe.get_doc("PH Kassenbeleg", kassenbeleg)
    if kb.docstatus != 1 or kb.belegart != "Standard" or cint(kb.gesamt_cent) <= 0 or kb.get("storniert_durch"):
        frappe.throw(_("Nur gültige, nicht stornierte Standardbelege mit Betrag > 0."))
    kontakt = kontakt or kb.kontakt
    if not kontakt:
        frappe.throw(_("Rechnungsempfänger fehlt – zuerst Kunde wählen oder anlegen."))
    datum = getdate(kb.get("geschaeftstag") or kb.datum_uhrzeit)
    re = frappe.new_doc("PH Rechnung")
    re.update({"art": "Barverkauf", "kontakt": kontakt, "datum": datum, "leistungsdatum": datum, "faellig": datum, "kassenbeleg": kb.name,
               "quelle": "kassa", "idempotency_key": f"kassenbeleg:{kb.name}", "kleinbetragsrechnung": 0,
               "schluss": _("Bar bezahlt – Kassenbeleg {0} vom {1}.").format(kb.name, frappe.utils.format_datetime(kb.datum_uhrzeit))})
    for p in kb.positionen:
        if p.art in ("Anzahlung", "Teilzahlung", "Schlusszahlung"):
            frappe.throw(_("Zahlungen auf Aufträge/Rechnungen bekommen keine Barverkaufsrechnung (Anzahlungsrechnung bzw. Rechnung existiert)."))
        satz = KASSA_STEUERSAETZE.get(p.steuersatz or "Normal 20", 2000)
        if p.art == "Gutschein Verkauf" and satz == 0:
            re.append("positionen", {"art": "Text", "bezeichnung": _("Mehrzweck-Gutschein {0} € (kein Umsatz, USt bei Einlösung)").format(f"{cint(p.brutto_cent) / 100:.2f}")})
            continue
        menge = flt(p.menge) or 1
        einzel_brutto = cint(p.einzel_brutto_cent)
        text = p.zusatz or ""
        if cint(p.get("rabatt_cent")):
            text = (text + " · " if text else "") + _("Rabatt {0} € je Stück ({1})").format(f"{cint(p.rabatt_cent) / 100:.2f}", p.get("rabatt_grund") or "")
        art = "Rabatt" if p.art == "Rabatt" else ("Produkt" if p.produkt else "Leistung")  # Rabattgutschein = Entgeltminderung
        re.append("positionen", {"art": art, "produkt": p.produkt, "bezeichnung": p.bezeichnung, "ausfuehrung_text": text[:140] or None,
                                 "menge": menge, "einzel_netto_cent": _netto_aus_brutto(einzel_brutto, satz), "ust_satz_promille": satz})
    re.flags.ignore_permissions = True
    re.insert(ignore_permissions=True)
    re.submit()
    differenz = cint(re.brutto_cent) - cint(kb.gesamt_cent)
    from ph_faktura.zahlung import zahlung_auf_rechnung

    zahlung_auf_rechnung(re, cint(re.zahlbar_cent), "Kassa", datum, zahlung_name=None, hinweis=f"KB:{kb.name}")
    if differenz:
        re.add_comment("Info", _("Rundungsdifferenz netto/brutto zum Kassenbeleg: {0} Cent (Kassenbeleg ist maßgeblich).").format(differenz))
    return {"rechnung": re.name, "status": "neu", "differenz_cent": differenz}


@frappe.whitelist()
def journal_kette_pruefen(limit=5000):
    """Prüfsummenkette des PH Buchungsjournals prüfen (Konzept 10-faktura §12 Nr. 6) – Leitung/GF/Buchhaltung extern."""
    if not set(frappe.get_roles()) & {"PH Faktura Leitung", "PH Geschäftsführung", "PH Buchhaltung extern", "System Manager"}:
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    from ph_faktura.journal import kette_pruefen

    return kette_pruefen(limit=cint(limit) or 5000)


@frappe.whitelist(methods=["POST"])
def sepa_zahllauf(eingangsrechnungen, ausfuehrung=None):
    """SEPA-Datei pain.001.001.03 für freigegebene Eingangsrechnungen (Zahllauf). Skonto, wenn Ausführung ≤ Skontofrist.
    Die Datei wird im Banking hochgeladen und dort freigegeben – ph_faktura überweist nicht. → {datei, anzahl, summe_cent}"""
    if not set(frappe.get_roles()) & {"PH Faktura Leitung", "System Manager"}:
        frappe.throw(_("Zahllauf nur durch die Faktura-Leitung."), frappe.PermissionError)
    from ph_faktura import einstellungen
    from ph_faktura.rechenwerk import sepa

    if isinstance(eingangsrechnungen, str):
        eingangsrechnungen = frappe.parse_json(eingangsrechnungen)
    tag = getdate(ausfuehrung or nowdate())
    zahlungen = []
    for name in eingangsrechnungen or []:
        er = frappe.get_doc("PH Eingangsrechnung", name)
        if er.status != "Freigegeben":
            frappe.throw(_("{0} ist nicht freigegeben ({1}).").format(name, er.status))
        betrag = cint(er.zahlbetrag_cent) or cint(er.brutto_cent)
        if er.skonto_bis and getdate(er.skonto_bis) >= tag and cint(er.skonto_cent):
            betrag = cint(er.brutto_cent) - cint(er.skonto_cent)
        zahlungen.append({"empfaenger": er.lieferant_name, "iban": er.iban_lieferant, "bic": er.bic_lieferant, "betrag_cent": betrag, "verwendungszweck": er.zahlungsreferenz or er.rechnungsnummer_lieferant, "end_to_end_id": er.name})
    k = einstellungen.bankkonto()
    lauf = f"ZL-{tag:%Y%m%d}-{frappe.generate_hash(length=6)}"
    try:
        xml = sepa.pain001({"name": k.get("kontoinhaber"), "iban": k.get("iban"), "bic": k.get("bic")}, zahlungen, tag, lauf)
    except sepa.SepaFehler as e:
        frappe.throw(str(e))
    datei = frappe.get_doc({"doctype": "File", "file_name": f"{lauf}.xml", "content": xml.encode("utf-8"), "is_private": 1}).insert(ignore_permissions=True)
    return {"datei": datei.file_url, "anzahl": len(zahlungen), "summe_cent": sum(z["betrag_cent"] for z in zahlungen), "zahllauf": lauf}


# ── Integration Runde 3 (52-…, „Bedarf an andere Apps“) ──────────────────────

def gutschrift_aus_bestellung(bestellung_doc, erstattung_zeile):
    """Hook ph_shop_gutschrift_erstellen (ph_shop PHBestellung._gutschrift_anstossen) – kein HTTP-Endpunkt."""
    from ph_faktura.ph_faktura.integration import gutschrift_aus_bestellung as fn

    return fn(bestellung_doc, erstattung_zeile)


@frappe.whitelist(methods=["POST"])
def create_credit_note_from_return(warenruecknahme):
    """Gutschrift-Entwurf aus PH Warenruecknahme (ph_logistik, Button „Gutschrift erstellen“). → Name der Gutschrift"""
    from ph_faktura.ph_faktura.integration import gutschrift_aus_warenruecknahme

    return gutschrift_aus_warenruecknahme(warenruecknahme)


@frappe.whitelist(methods=["POST"])
def create_quote_from_care_contract(pflege_abo):
    """Angebot aus PH Pflege Abo (ph_service, Button „Angebot erstellen“). → Name des Angebots"""
    from ph_faktura.ph_faktura.integration import angebot_aus_pflege_abo

    return angebot_aus_pflege_abo(pflege_abo)
