"""Belege atomar erzeugen (Frappe-Seite des RKSV-Kerns).

Ablauf erzeuge_beleg(): PH Kasse sperren (SELECT … FOR UPDATE) → Belegnummer = Zähler + 1 → Summen je
Steuersatz → Umsatzzähler (letzten Stand entschlüsseln, Betrag addieren, verschlüsseln) → Code → Signatur
(SEE; bei Störung Ausfallsignatur + PH Kassa Ereignis) → QR/OCR → PH Kassenbeleg als submitted einfügen →
Kasse fortschreiben. Alles in einer DB-Transaktion: schlägt ein Schritt fehl, entsteht keine Lücke.

Öffentliche Funktionen (WP10b programmiert dagegen, s. ph_kassa/schnittstellen.py):
    erzeuge_beleg(kasse, positionen, zahlarten, belegart="Standard", …) -> PH Kassenbeleg (docstatus 1)
    storniere_beleg(beleg, grund, bediener=None) -> Stornobeleg
    nullbeleg(kasse, bediener=None, belegart="Nullbeleg") -> Nullbeleg
    startbeleg(kasse) / monatsbeleg(kasse) / jahresbeleg(kasse) / schlussbeleg(kasse)
    see_ausfall_melden(see, notiz=None) / see_ausfall_beenden(see, notiz=None, automatisch=False)
    sammelbeleg_nach_ausfall(kasse) -> Sammelbeleg (RKSV § 17 Abs 4)
"""

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, now_datetime, time_diff_in_hours

from . import NULLBELEGARTEN
from . import beleg as rksv_beleg
from .counter import ZaehlerFehler, entschluessele, ist_kennwort, schluessel_aus_b64
from .finanzonline import ausfall_meldepflichtig
from .see import signer_fuer
from .signer import SignaturFehler

ROLLEN_STORNO = ("PH Kassa Leitung", "System Manager", "Administrator")
# Zusatzfelder, die Page/Notbetrieb an erzeuge_beleg übergeben dürfen (alles andere bleibt Kern-Sache)
ZUSATZFELDER = ("freigabe_von", "freigabe_gruende", "notbeleg_nr", "notbeleg_zeitpunkt", "id_pruefung_art", "id_pruefung_nummer", "id_pruefung_name", "id_pruefung_von")
# PH Kassenbeleg.belegart → Vorgaben (Betrag 0, keine Positionen)
LEERE_SUMMEN = {"betrag_normal_cent": 0, "betrag_ermaessigt1_cent": 0, "betrag_ermaessigt2_cent": 0, "betrag_null_cent": 0, "betrag_besonders_cent": 0}
SUMMEN_ZU_SATZ = {
    "betrag_normal_cent": "normal",
    "betrag_ermaessigt1_cent": "ermaessigt1",
    "betrag_ermaessigt2_cent": "ermaessigt2",
    "betrag_null_cent": "null",
    "betrag_besonders_cent": "besonders",
}
BARUMSATZ_ZAHLARTEN = ("Bar", "Karte Stripe Terminal", "Karte extern", "Gutschein")


class KassaFehler(frappe.ValidationError):
    pass


# ── Hilfen ────────────────────────────────────────────────────────────────────

def _summen(positionen):
    """Summen über ph_kassa.logik.betraege (WP10b, reine Logik) – gleiche Rechnung wie die Kassa-Page."""
    from ph_kassa.logik.betraege import KassenFehler, summen

    try:
        return summen(positionen or [])
    except KassenFehler as e:
        frappe.throw(str(e), KassaFehler)


def _zahlarten_pruefen(gesamt_cent, zahlarten):
    from ph_kassa.logik.betraege import KassenFehler, zahlarten_pruefen

    try:
        return zahlarten_pruefen(gesamt_cent, zahlarten or [])["zahlarten"]
    except KassenFehler as e:
        frappe.throw(str(e), KassaFehler)


def _sperre_kasse(name):
    """Zeile der Kasse sperren (bis Commit) und Kettenstand lesen."""
    zeilen = frappe.db.sql(
        """select name, kassen_id, status, belegnummer_zaehler, umsatzzaehler_cent, umsatzzaehler_verschluesselt,
                  umsatzzaehler_belegnummer, letzter_beleg, startbeleg, see, aes_schluessel_name, trainings_modus
           from `tabPH Kasse` where name = %s for update""",
        name,
        as_dict=True,
    )
    if not zeilen:
        frappe.throw(_("Kasse {0} nicht gefunden.").format(name), KassaFehler)
    return zeilen[0]


def aes_key(kasse):
    """AES-Schlüssel aus site_config (Name steht in PH Kasse.aes_schluessel_name). Nie loggen."""
    name = kasse.get("aes_schluessel_name") if isinstance(kasse, dict) else kasse.aes_schluessel_name
    wert = frappe.conf.get(name or "")
    if not wert:
        frappe.throw(_("AES-Schlüssel „{0}“ fehlt in site_config.json.").format(name), KassaFehler)
    try:
        return schluessel_aus_b64(wert)
    except ZaehlerFehler as e:
        frappe.throw(str(e), KassaFehler)


def _zaehler_vorher(stand, key):
    if not stand.umsatzzaehler_verschluesselt:
        return 0
    try:
        wert = entschluessele(stand.umsatzzaehler_verschluesselt, key, stand.kassen_id, stand.umsatzzaehler_belegnummer)
    except ZaehlerFehler as e:
        frappe.throw(_("Umsatzzähler der Kasse nicht entschlüsselbar: {0}").format(e), KassaFehler)
    if cint(stand.umsatzzaehler_cent) != wert:
        frappe.throw(_("Umsatzzähler inkonsistent (Anzeige {0} ≠ verschlüsselt {1}) – Kasse sperren und prüfen.").format(stand.umsatzzaehler_cent, wert), KassaFehler)
    return wert


def _pruefe_zulaessig(stand, belegart):
    if stand.status == "Ausser Betrieb":
        frappe.throw(_("Kasse {0} ist außer Betrieb (Schlussbeleg erstellt).").format(stand.name), KassaFehler)
    if belegart == "Startbeleg":
        if cint(stand.belegnummer_zaehler) > 0 or stand.startbeleg:
            frappe.throw(_("Startbeleg existiert bereits ({0}).").format(stand.startbeleg), KassaFehler)
    elif not stand.startbeleg:
        frappe.throw(_("Zuerst den Startbeleg erstellen (PH Kasse → Startbeleg erstellen)."), KassaFehler)
    if not stand.see:
        frappe.throw(_("Kasse hat keine Signaturerstellungseinheit."), KassaFehler)


def _signer_oder_ausfall(see_doc):
    """(signer | None, grund). None = SEE bereits als ausgefallen markiert oder nicht erreichbar."""
    if see_doc.status == "Ausgefallen" and not getattr(frappe.flags, "ph_kassa_test_signer", None):
        return None, _("SEE ist als ausgefallen markiert.")
    try:
        return signer_fuer(see_doc), None
    except SignaturFehler as e:
        return None, str(e)


def _ausfall_beginn(kasse_name, see_doc, grund, automatisch=True):
    """SEE auf Ausgefallen setzen, Ereignis anlegen (idempotent je laufendem Ausfall)."""
    if see_doc.status != "Ausgefallen":
        see_doc.db_set({"status": "Ausgefallen", "ausgefallen_seit": now_datetime()}, update_modified=False)
    offen = frappe.db.exists("PH Kassa Ereignis", {"see": see_doc.name, "art": "SEE Ausfall Beginn", "status": "Offen"})
    if not offen:
        frappe.get_doc(
            {
                "doctype": "PH Kassa Ereignis",
                "kasse": kasse_name,
                "see": see_doc.name,
                "art": "SEE Ausfall Beginn",
                "zeitpunkt": now_datetime(),
                "notiz": grund,
                "automatisch": 1 if automatisch else 0,
            }
        ).insert(ignore_permissions=True)
    if kasse_name:
        frappe.db.set_value("PH Kasse", kasse_name, "status", "Ausgefallen", update_modified=False)


def _kasse_fortschreiben(stand, doc, erg):
    werte = {
        "belegnummer_zaehler": doc.belegnummer,
        "letzter_beleg": doc.name,
        "letzter_beleg_am": doc.datum_uhrzeit,
        "letzte_signatur": rksv_beleg.hash_vorbeleg(doc.jws_compact),
    }
    if not ist_kennwort(erg["zaehler_feld"]):
        werte.update(umsatzzaehler_verschluesselt=erg["zaehler_feld"], umsatzzaehler_belegnummer=doc.belegnummer, umsatzzaehler_cent=erg["zaehler_neu"])
    if doc.belegart == "Startbeleg":
        werte.update(startbeleg=doc.name, startbeleg_erstellt_am=doc.datum_uhrzeit)
        if stand.status == "Angelegt":
            werte["status"] = "Registriert"
    if doc.belegart in ("Monatsbeleg", "Jahresbeleg"):
        werte["letzter_monatsbeleg"] = get_datetime(doc.datum_uhrzeit).strftime("%Y-%m")
    if doc.belegart == "Jahresbeleg":
        werte["letzter_jahresbeleg"] = get_datetime(doc.datum_uhrzeit).year
    if doc.belegart == "Schlussbeleg":
        werte.update(schlussbeleg=doc.name, status="Ausser Betrieb")
    frappe.db.set_value("PH Kasse", stand.name, werte, update_modified=False)


# ── Kern ──────────────────────────────────────────────────────────────────────

def erzeuge_beleg(
    kasse,
    positionen=None,
    zahlarten=None,
    belegart="Standard",
    kontakt=None,
    auftrag=None,
    rechnung=None,
    bestellung=None,
    trainings=False,
    bediener=None,
    storno_von=None,
    storno_grund=None,
    kundenbeleg_email=None,
    datum=None,
    kunde_name=None,
    zahlungsplan_position=None,
    idempotency_key=None,
    quelle="Kassa",
    ignore_permissions=False,
    zusatz=None,
):
    """Signierten PH Kassenbeleg erzeugen (docstatus 1). Liefert das Dokument.

    positionen: [{art, produkt, bezeichnung, zusatz, menge, einzel_brutto_cent, steuersatz, gutschein, bezug_doctype, bezug}]
    zahlarten:  [{zahlart, betrag_cent, gegeben_cent, gutschein, terminal_payment_intent, zahlung}]
    """
    if idempotency_key:
        alt = frappe.db.get_value("PH Kassenbeleg", {"idempotency_key": idempotency_key, "docstatus": 1}, "name")
        if alt:
            return frappe.get_doc("PH Kassenbeleg", alt)

    stand = _sperre_kasse(kasse)
    _pruefe_zulaessig(stand, belegart)
    if belegart == "Standard" and (trainings or cint(stand.trainings_modus)):
        belegart = "Trainingsbeleg"

    # Summen und Zahlarten
    if belegart in NULLBELEGARTEN:
        pos, zahl, rksv_summen, gesamt, ust = [], [], dict(LEERE_SUMMEN), 0, 0
    else:
        if not positionen:
            frappe.throw(_("Beleg ohne Positionen."), KassaFehler)
        s = _summen(positionen)
        pos, rksv_summen, gesamt, ust = s["positionen"], s["rksv"], s["gesamt_cent"], s["ust_cent"]
        if belegart == "Stornobeleg" or storno_von:  # Gegenbeleg (auch Training): Zahlarten 1:1 negiert
            zahl = list(zahlarten or [])
            if sum(cint(z.get("betrag_cent")) for z in zahl) != gesamt:
                frappe.throw(_("Zahlarten des Stornobelegs decken den Betrag nicht."), KassaFehler)
            for z in zahl:
                z["barumsatz"] = 1 if z.get("zahlart") in BARUMSATZ_ZAHLARTEN else 0
        else:
            zahl = _zahlarten_pruefen(gesamt, zahlarten)

    # Schlüssel, Zähler, Vorbeleg, Signer
    key = aes_key(stand)
    zaehler_vorher = _zaehler_vorher(stand, key)
    vorbeleg_jws = frappe.db.get_value("PH Kassenbeleg", stand.letzter_beleg, "jws_compact") if stand.letzter_beleg else ""
    see_doc = frappe.get_doc("PH Signatureinheit", stand.see)
    signer, ausfall_grund = _signer_oder_ausfall(see_doc)
    zda_id = (signer.zda_id if signer else see_doc.vda_id) or "AT1"
    seriennummer = (signer.zertifikat_seriennummer if signer else see_doc.zertifikat_seriennummer) or ""
    if not seriennummer:
        frappe.throw(_("Zertifikat-Seriennummer der SEE unbekannt – zuerst „Zertifikat abrufen“ in PH Signatureinheit."), KassaFehler)

    zeit = get_datetime(datum) if datum else now_datetime()
    nummer = cint(stand.belegnummer_zaehler) + 1
    geschaeftstag = _geschaeftstag(zeit)
    try:
        daten = rksv_beleg.Belegdaten(
            kassen_id=stand.kassen_id,
            belegnummer=str(nummer),
            datum=zeit,
            betraege_cent={SUMMEN_ZU_SATZ[k]: v for k, v in rksv_summen.items()},
            belegart=belegart,
            zda_id=zda_id,
            zertifikat_seriennummer=seriennummer,
            vorbeleg_jws=vorbeleg_jws,
        )
        try:
            erg = rksv_beleg.erzeuge(daten, zaehler_vorher, key, signer)
        except SignaturFehler as e:
            ausfall_grund = str(e)
            erg = rksv_beleg.erzeuge(daten, zaehler_vorher, key, None)
    except rksv_beleg.BelegFehler as e:
        frappe.throw(str(e), KassaFehler)

    if erg["ausfall"]:
        _ausfall_beginn(stand.name, see_doc, ausfall_grund or _("SEE nicht erreichbar."))

    doc = frappe.get_doc(
        {
            "doctype": "PH Kassenbeleg",
            "kasse": stand.name,
            "belegnummer": nummer,
            "belegart": belegart,
            "datum_uhrzeit": zeit,
            "status": "Ausfall" if erg["ausfall"] else "Signiert",
            "kontakt": kontakt,
            "kunde_name": kunde_name,
            "bediener": bediener or frappe.session.user,
            "trainings": 1 if belegart == "Trainingsbeleg" else 0,
            "see_ausgefallen": 1 if erg["ausfall"] else 0,
            "auftrag": auftrag,
            "rechnung": rechnung,
            "bestellung": bestellung,
            "zahlungsplan_position": zahlungsplan_position,
            "storno_von": storno_von,
            "storno_grund": storno_grund,
            "positionen": pos,
            "zahlarten": zahl,
            **rksv_summen,
            "gesamt_cent": gesamt,
            "ust_cent": ust,
            "waehrung": "EUR",
            "umsatzzaehler_verschluesselt": erg["zaehler_feld"],
            "umsatzzaehler_klar_cent": erg["zaehler_neu"],
            "signatur_vorbeleg": erg["sig_vorbeleg"],
            "vorbeleg": stand.letzter_beleg,
            "zertifikat_seriennummer": seriennummer,
            "zda_id": zda_id,
            "jws_compact": erg["jws"],
            "maschinenlesbarer_code": erg["qr"],
            "ocr_code": erg["ocr"],
            "kundenbeleg_email": kundenbeleg_email,
            "quelle": quelle,
            "idempotency_key": idempotency_key or None,
            "geschaeftstag": geschaeftstag,
            **{k: v for k, v in (zusatz or {}).items() if k in ZUSATZFELDER and v not in (None, "")},
            "docstatus": 1,
        }
    )
    doc.flags.ph_rksv = True
    doc.flags.ignore_permissions = ignore_permissions
    doc.insert(ignore_permissions=ignore_permissions)
    _kasse_fortschreiben(stand, doc, erg)
    return doc


def _geschaeftstag(zeit):
    """Geschäftstag laut Tageswechsel-Uhrzeit (PH Kassa Einstellungen); ohne Einstellung Kalendertag."""
    from ph_kassa.logik.abschluss import geschaeftstag

    try:
        from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen

        wechsel = einstellungen().get("tageswechsel_uhrzeit")
    except Exception:  # noqa: BLE001 – Einstellungen noch nicht migriert
        wechsel = None
    return geschaeftstag(get_datetime(zeit), wechsel)


# ── Abgeleitete Belege ────────────────────────────────────────────────────────

def startbeleg(kasse, quelle="Desk"):
    """Startbeleg (Betrag 0, Zähler 0, Verkettung auf Kassen-ID). Danach mit BMF Belegcheck-App prüfen."""
    doc = erzeuge_beleg(kasse, belegart="Startbeleg", quelle=quelle)
    _ereignis(kasse, "Startbeleg Pruefung", beleg=doc.name, notiz=_("Startbeleg mit BMF Belegcheck-App prüfen, dann Checkliste abhaken."))
    return doc


def nullbeleg(kasse, bediener=None, belegart="Nullbeleg", quelle="Desk", datum=None, ignore_permissions=False):
    if belegart not in NULLBELEGARTEN or belegart == "Startbeleg":
        frappe.throw(_("Unzulässige Nullbeleg-Art: {0}").format(belegart), KassaFehler)
    return erzeuge_beleg(kasse, belegart=belegart, bediener=bediener, quelle=quelle, datum=datum, ignore_permissions=ignore_permissions)


def monatsbeleg(kasse, quelle="Scheduler", datum=None, ignore_permissions=True):
    """Monatsbeleg = Nullbeleg am Monatsende; im Dezember ist er zugleich der Jahresbeleg (RKSV § 8)."""
    zeit = get_datetime(datum) if datum else now_datetime()
    art = "Jahresbeleg" if zeit.month == 12 else "Monatsbeleg"
    return nullbeleg(kasse, belegart=art, quelle=quelle, datum=datum, ignore_permissions=ignore_permissions)


def jahresbeleg(kasse, quelle="Desk", datum=None, ignore_permissions=False):
    doc = nullbeleg(kasse, belegart="Jahresbeleg", quelle=quelle, datum=datum, ignore_permissions=ignore_permissions)
    _ereignis(kasse, "Jahresbeleg Pruefung", beleg=doc.name, notiz=_("Jahresbeleg bis 15. Februar mit BMF Belegcheck-App prüfen."))
    return doc


def schlussbeleg(kasse, quelle="Desk"):
    """Außerbetriebnahme: letzter Beleg der Kette; Kasse → Ausser Betrieb; DEP vollständig exportieren."""
    return nullbeleg(kasse, belegart="Schlussbeleg", quelle=quelle)


def storniere_beleg(beleg, grund, bediener=None, quelle="Kassa", erlaube_mitarbeiter=False, freigabe_von=None):
    """Gegenbeleg (Stornobeleg, STO) zu einem Standardbeleg.

    Rechte (Fachkritik 21 P1): PH Kassa Leitung immer; Mitarbeiter nur, wenn der Aufrufer (Kassa-Page) die
    Regel geprüft hat (eigener Beleg von heute bis `storno_mitarbeiter_bis_cent`) und `erlaube_mitarbeiter=True`
    setzt, oder mit Leitungsfreigabe per PIN (`freigabe_von` = Leitungs-User, von der Page verifiziert).
    """
    rollen = set(frappe.get_roles())
    if not rollen & set(ROLLEN_STORNO):
        if not (erlaube_mitarbeiter or freigabe_von) or "PH Kassa Mitarbeiter" not in rollen:
            frappe.throw(_("Storno nur durch PH Kassa Leitung."), frappe.PermissionError)
    grund = (grund or "").strip()
    if not grund:
        frappe.throw(_("Stornogrund ist Pflicht."), KassaFehler)
    alt = frappe.get_doc("PH Kassenbeleg", beleg)
    if alt.docstatus != 1:
        frappe.throw(_("Nur gebuchte Belege können storniert werden."), KassaFehler)
    if alt.belegart not in ("Standard", "Trainingsbeleg"):
        frappe.throw(_("Belegart {0} kann nicht storniert werden.").format(alt.belegart), KassaFehler)
    if alt.storniert_durch:
        frappe.throw(_("Beleg wurde bereits storniert ({0}).").format(alt.storniert_durch), KassaFehler)
    for p in alt.positionen:
        # Verkaufter Gutschein bereits (teilweise) eingelöst → Storno würde Geld für eine verbrauchte Leistung zurückgeben
        if p.art == "Gutschein Verkauf" and p.gutschein and frappe.db.exists("PH Gutschein", p.gutschein):
            wert, rest = frappe.db.get_value("PH Gutschein", p.gutschein, ["wert_cent", "rest_cent"]) or (0, 0)
            if cint(rest) < cint(wert):
                frappe.throw(_("Gutschein {0} wurde bereits eingelöst – Storno nicht möglich, Restwert bleibt gültig.").format(p.gutschein), KassaFehler)
    positionen = [
        {
            "art": "Storno",
            "produkt": p.produkt,
            "bezeichnung": p.bezeichnung,
            "zusatz": p.zusatz,
            "menge": p.menge,
            "einzel_brutto_cent": -cint(p.einzel_brutto_cent),
            "steuersatz": p.steuersatz,
            "gutschein": p.gutschein,
            "bezug_doctype": "PH Kassenbeleg",
            "bezug": alt.name,
            "bezug_zeile": p.name,
            "ursprungsart": p.art,  # UVA-Abgrenzung (ph_faktura.rechenwerk.uva) braucht die Art der Originalzeile
        }
        for p in alt.positionen
    ]
    zahlarten = [
        {"zahlart": z.zahlart, "betrag_cent": -cint(z.betrag_cent), "gegeben_cent": 0, "retour_cent": 0, "gutschein": z.gutschein, "terminal_payment_intent": z.terminal_payment_intent, "erstattung_von_zahlung": z.zahlung}
        for z in alt.zahlarten
        if cint(z.betrag_cent)
    ]
    neu = erzeuge_beleg(
        alt.kasse,
        positionen=positionen,
        zahlarten=zahlarten,
        belegart="Trainingsbeleg" if alt.trainings else "Stornobeleg",
        kontakt=alt.kontakt,
        kunde_name=alt.kunde_name,
        auftrag=alt.auftrag,
        rechnung=alt.rechnung,
        bestellung=alt.bestellung,
        bediener=bediener,
        storno_von=alt.name,
        storno_grund=grund,
        quelle=quelle,
        zusatz={"freigabe_von": freigabe_von, "freigabe_gruende": "Storno" if freigabe_von else None},
    )
    alt.db_set({"storniert_durch": neu.name, "status": "Storniert"}, update_modified=False)
    alt.add_comment("Info", _("Storniert durch {0}: {1}").format(neu.name, grund))
    return neu


# ── Ausfall (RKSV § 17) ───────────────────────────────────────────────────────

def _ereignis(kasse, art, see=None, beleg=None, notiz=None, anzahl=None, status=None, automatisch=True):
    doc = frappe.get_doc(
        {
            "doctype": "PH Kassa Ereignis",
            "kasse": kasse,
            "see": see,
            "art": art,
            "zeitpunkt": now_datetime(),
            "beleg": beleg,
            "notiz": notiz,
            "anzahl_belege": anzahl,
            "automatisch": 1 if automatisch else 0,
        }
    )
    doc.insert(ignore_permissions=True)
    if status:
        doc.db_set("status", status, update_modified=False)
    return doc


def see_ausfall_melden(see, notiz=None, kasse=None):
    """Manuell: SEE als ausgefallen markieren (Belege laufen mit Ausfallsignatur weiter)."""
    see_doc = frappe.get_doc("PH Signatureinheit", see)
    if see_doc.status == "Ausgefallen":
        frappe.throw(_("SEE ist bereits als ausgefallen markiert."), KassaFehler)
    kassen = [kasse] if kasse else frappe.get_all("PH Kasse", {"see": see_doc.name, "status": ("!=", "Ausser Betrieb")}, pluck="name")
    _ausfall_beginn(kassen[0] if kassen else None, see_doc, notiz or _("Manuell gemeldet."), automatisch=False)
    for k in kassen[1:]:
        frappe.db.set_value("PH Kasse", k, "status", "Ausgefallen", update_modified=False)
    return see_doc.name


def see_ausfall_beenden(see, notiz=None, automatisch=False):
    """SEE wieder in Betrieb: Erreichbarkeit prüfen, Ausfall-Ereignis schließen (Dauer, Meldepflicht > 48 h),
    je Kasse Sammelbeleg über die Ausfallbelege (Nachsignatur), Kassenstatus zurücksetzen."""
    see_doc = frappe.get_doc("PH Signatureinheit", see)
    if see_doc.status != "Ausgefallen":
        frappe.throw(_("SEE ist nicht als ausgefallen markiert."), KassaFehler)
    # Erreichbarkeit: Signer bauen (A-Trust: Zertifikat abrufen) – Fehler bleibt Ausfall.
    try:
        signer = signer_fuer(see_doc)
        if hasattr(signer, "zertifikat_abrufen"):
            signer.zertifikat_abrufen()
    except SignaturFehler as e:
        frappe.throw(_("SEE weiterhin nicht erreichbar: {0}").format(e), KassaFehler)

    jetzt = now_datetime()
    beginn = see_doc.ausgefallen_seit or jetzt
    dauer = time_diff_in_hours(jetzt, beginn)
    meldepflicht = ausfall_meldepflichtig(dauer)
    see_doc.db_set({"status": "Aktiv", "ausgefallen_seit": None}, update_modified=False)

    for ev in frappe.get_all("PH Kassa Ereignis", {"see": see_doc.name, "art": "SEE Ausfall Beginn", "status": "Offen"}, pluck="name"):
        frappe.db.set_value("PH Kassa Ereignis", ev, {"status": "Beendet", "ende": jetzt, "dauer_h": dauer, "meldung_finanzonline_noetig": 1 if meldepflicht else 0}, update_modified=False)

    ergebnis = {"see": see_doc.name, "dauer_h": round(dauer, 2), "meldepflicht": meldepflicht, "sammelbelege": []}
    for k in frappe.get_all("PH Kasse", {"see": see_doc.name, "status": "Ausgefallen"}, pluck="name"):
        sammel = sammelbeleg_nach_ausfall(k, automatisch=automatisch)
        if sammel:
            ergebnis["sammelbelege"].append(sammel.name)
        k_doc = frappe.get_doc("PH Kasse", k)
        frappe.db.set_value("PH Kasse", k, "status", "Aktiv" if k_doc.startbeleg_geprueft_am else "Registriert", update_modified=False)
        _ereignis(k, "SEE Ausfall Ende", see=see_doc.name, notiz=(notiz or "") + (_(" – FinanzOnline-Meldung nötig (> 48 h).") if meldepflicht else ""), status="Beendet", automatisch=automatisch)
        if meldepflicht:
            aufgabe(k, _("SEE-Ausfall {0} h: Ausfall und Wiederinbetriebnahme in FinanzOnline melden (RKSV § 17), Nachweis im Ereignis anhängen.").format(round(dauer, 1)))
    return ergebnis


def sammelbeleg_nach_ausfall(kasse, automatisch=True):
    """Sammelbeleg (Betrag 0, signiert) über alle Belege mit Ausfallsignatur dieser Kasse; markiert sie als nachsigniert."""
    offen = frappe.get_all("PH Kassenbeleg", {"kasse": kasse, "docstatus": 1, "see_ausgefallen": 1, "nachsigniert": 0}, pluck="name", order_by="belegnummer asc")
    if not offen:
        return None
    sammel = erzeuge_beleg(kasse, belegart="Sammelbeleg", quelle="Scheduler" if automatisch else "Desk", ignore_permissions=True)
    if sammel.see_ausgefallen:
        frappe.throw(_("Sammelbeleg konnte nicht signiert werden – SEE weiterhin gestört."), KassaFehler)
    jetzt = now_datetime()
    for name in offen:
        frappe.db.set_value("PH Kassenbeleg", name, {"nachsigniert": 1, "nachsigniert_am": jetzt, "sammelbeleg": sammel.name, "status": "Nachsigniert"}, update_modified=False)
    _ereignis(kasse, "Nachsignatur", beleg=sammel.name, anzahl=len(offen), status="Erledigt", notiz=_("Sammelbeleg über {0} Belege mit Ausfallsignatur (Nr. {1}–{2}).").format(len(offen), offen[0], offen[-1]), automatisch=automatisch)
    return sammel


def aufgabe(kasse, text, rolle="PH Kassa Leitung"):
    """ToDo an eine Rolle, idempotent je Kasse + Text (offene Aufgabe)."""
    if frappe.db.exists("ToDo", {"reference_type": "PH Kasse", "reference_name": kasse, "description": text, "status": "Open"}):
        return None
    return frappe.get_doc({"doctype": "ToDo", "description": text, "reference_type": "PH Kasse", "reference_name": kasse, "role": rolle, "priority": "High"}).insert(ignore_permissions=True)
