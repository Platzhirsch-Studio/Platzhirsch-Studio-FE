"""Schnittstellen der Kassa-Oberfläche (WP10b) zu WP10a (RKSV-Kern) und ph_shop (Zahlung).

Programmiert gegen die Plan-Signaturen (PLAN.md WP10a/b, Abschnitt 5). Sobald WP10a bzw. ph_shop
ihre Module liefern, werden sie hier importiert; bis dahin greift der Mock-Pfad (nur Staging ohne
die Module, nie produktiv – `frappe.throw`, wenn der Kern fehlt und kein Mock erlaubt ist).

Erwartete WP10a-Funktionen (ph_kassa/ph_kassa/rksv/beleg.py):
    erzeuge_beleg(kasse, positionen, zahlarten, belegart="Standard", kontakt=None, auftrag=None,
                  rechnung=None, bestellung=None, trainings=False, bediener=None,
                  storno_von=None, storno_grund=None, kundenbeleg_email=None) -> PH Kassenbeleg (submitted)
    storniere_beleg(beleg, grund, bediener=None) -> PH Kassenbeleg (Stornobeleg, submitted)
    nullbeleg(kasse, bediener=None) -> PH Kassenbeleg (Nullbeleg)
ph_shop-Funktionen (Module ph_shop.zahlung / ph_shop.gutschein, Signatur ph_shop/README):
    buche(*, kanal, betrag_cent, art="Eingang", bezug_doctype, bezug, kontakt=None, zeitpunkt=None,
          stripe_payment_intent=None, gutschein=None, notiz=None, idempotency_key=None, quelle="kassa", …) -> PH Zahlung
    gutschein.pruefen(code_or_name) -> dict · gutschein.einloesen(*, gutschein|code, betrag_cent, kanal, beleg_doctype, beleg, …)
WP10a ruft `buche` selbst in `PH Kassenbeleg.on_submit` je Zahlart auf; die Oberfläche ruft
`buche` daher NICHT doppelt, sondern nur für Kassenbuch-Einlagen/Entnahmen (kanal Bar, Verrechnung).
"""

from __future__ import annotations

import frappe
from frappe import _

MOCK_ERLAUBT_SCHLUESSEL = "ph_kassa_mock_kern"  # site_config: true → Mock-Kern auf Staging ohne WP10a


def _kern():
    try:
        from ph_kassa.rksv import beleg as kern  # WP10a

        return kern
    except ImportError:
        return None


def mock_erlaubt() -> bool:
    return bool(frappe.conf.get(MOCK_ERLAUBT_SCHLUESSEL)) or bool(getattr(frappe.flags, "in_test", False))


def erzeuge_beleg(**args):
    kern = _kern()
    if kern and hasattr(kern, "erzeuge_beleg"):
        return kern.erzeuge_beleg(**args)
    if not mock_erlaubt():
        frappe.throw(_("RKSV-Kern (WP10a) ist nicht installiert – Belege können nicht signiert werden."))
    return _mock_beleg(**args)


def storniere_beleg(beleg: str, grund: str, bediener: str | None = None, **kw):
    """kw: erlaube_mitarbeiter, freigabe_von (Fachkritik 21 P1) – an den Kern durchgereicht."""
    kern = _kern()
    if kern and hasattr(kern, "storniere_beleg"):
        return kern.storniere_beleg(beleg, grund, bediener=bediener, **kw)
    if not mock_erlaubt():
        frappe.throw(_("RKSV-Kern (WP10a) ist nicht installiert – Storno nicht möglich."))
    alt = frappe.get_doc("PH Kassenbeleg", beleg)
    pos = [{**p.as_dict(), "brutto_cent": -int(p.brutto_cent or 0), "einzel_brutto_cent": -int(p.einzel_brutto_cent or 0), "art": "Storno"} for p in alt.positionen]
    zahl = [{"zahlart": z.zahlart, "betrag_cent": -int(z.betrag_cent or 0)} for z in alt.zahlarten]
    return _mock_beleg(kasse=alt.kasse, positionen=pos, zahlarten=zahl, belegart="Stornobeleg", storno_von=beleg, storno_grund=grund, bediener=bediener, kontakt=alt.kontakt)


def nullbeleg(kasse: str, bediener: str | None = None):
    kern = _kern()
    if kern and hasattr(kern, "nullbeleg"):
        return kern.nullbeleg(kasse, bediener=bediener)
    if not mock_erlaubt():
        frappe.throw(_("RKSV-Kern (WP10a) ist nicht installiert – Nullbeleg nicht möglich."))
    return _mock_beleg(kasse=kasse, positionen=[], zahlarten=[], belegart="Nullbeleg", bediener=bediener)


def _mock_beleg(kasse, positionen, zahlarten, belegart="Standard", kontakt=None, auftrag=None, rechnung=None, bestellung=None, trainings=False, bediener=None, storno_von=None, storno_grund=None, kundenbeleg_email=None, **_weitere):
    """Mock: legt einen PH Kassenbeleg ohne echte Signatur an (Kennzeichen MOCK im Code). Nur Staging/Tests."""
    from .logik.betraege import summen

    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        frappe.throw(_("DocType PH Kassenbeleg (WP10a) fehlt."))
    s = summen(positionen)
    nummer = (frappe.db.count("PH Kassenbeleg", {"kasse": kasse}) or 0) + 1
    doc = frappe.get_doc(
        {
            "doctype": "PH Kassenbeleg",
            "kasse": kasse,
            "belegnummer": nummer,
            "belegart": belegart,
            "datum_uhrzeit": frappe.utils.now_datetime(),
            "kontakt": kontakt,
            "auftrag": auftrag,
            "rechnung": rechnung,
            "bestellung": bestellung,
            "trainings": 1 if trainings else 0,
            "bediener": bediener or frappe.session.user,
            "storno_von": storno_von,
            "storno_grund": storno_grund,
            "kundenbeleg_email": kundenbeleg_email,
            "positionen": s["positionen"],
            "zahlarten": zahlarten,
            "gesamt_cent": s["gesamt_cent"],
            **s["rksv"],
            "maschinenlesbarer_code": f"_R1-AT1_{kasse}_{nummer}_MOCK_{s['gesamt_cent']}_MOCKSIGNATUR",
            "jws_compact": "eyJhbGciOiJFUzI1NiJ9.MOCK.MOCK",
        }
    )
    doc.flags.ph_mock = True
    doc.insert()
    doc.submit()
    return doc


def zahlung_buchen(**args):
    """ph_shop.zahlung.buche(**keyword-args) – für Kassenbuch-Einlagen/Entnahmen (Verrechnung). Fehler → None (nie werfen)."""
    try:
        from ph_shop.zahlung import buche
    except ImportError:
        return None
    args.setdefault("quelle", "kassa")
    try:
        return buche(**args)
    except Exception:  # noqa: BLE001 – Nebenbuchung darf die Kassenbuchung nicht verhindern
        frappe.log_error(title="PH Kassa: ph_shop.zahlung.buche fehlgeschlagen")
        return None


def gutschein_pruefen(code: str) -> dict:
    """Restwert/Status eines Gutscheins über ph_shop.gutschein.pruefen (Code nur als Hash gespeichert).
    Rückgabe für die Page: {gutschein, rest_cent, status, letzte4, test}; wirft bei nicht einlösbarem Gutschein."""
    code = (code or "").strip()
    if not code:
        frappe.throw(_("Gutscheincode fehlt."))
    if not frappe.db.exists("DocType", "PH Gutschein"):
        frappe.throw(_("DocType PH Gutschein (ph_shop) fehlt."))
    from ph_shop.gutschein import pruefen

    try:
        r = pruefen(code)
    except frappe.DoesNotExistError:
        raise
    except frappe.ValidationError as e:
        # ph_shop: Einzweck ohne Satz der Ausgabe bricht ab (52-…, Abschnitt 8) → klare Kassa-Meldung
        if "Einzweck" in str(e):
            from ph_kassa.logik.integration import EINZWECK_OHNE_SATZ

            frappe.throw(_(EINZWECK_OHNE_SATZ).format(code[-4:] if len(code) > 8 else code), title=_("Gutschein nicht einlösbar"))
        raise
    if r.get("abgelaufen"):
        frappe.throw(_("Gutschein ist abgelaufen."))
    if not r.get("einloesbar"):
        frappe.throw(_("Gutschein ist {0}.").format(_(r.get("status") or "nicht einlösbar")))
    # art/mindert_entgelt/steuersatz: Oberfläche wählt Zahlart (Mehrzweck), Position mit Satz (Einzweck) oder Rabatt;
    # der Server stellt beim Buchen ohnehin nach Art um (page._gutscheine_nach_art)
    return {"gutschein": r["gutschein"], "rest_cent": int(r["rest_cent"]), "status": r["status"], "letzte4": r.get("letzte4"), "test": r.get("test"),
            "art": r.get("art") or "Mehrzweck", "mindert_entgelt": bool(r.get("mindert_entgelt")), "steuersatz": r.get("steuersatz"), "zahlungsmittel": bool(r.get("zahlungsmittel", True))}
