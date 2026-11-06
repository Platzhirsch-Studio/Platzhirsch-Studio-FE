"""Gutschein-Einlösung und -Prüfung für andere Apps (ph_kassa, ph_faktura) – Modul ``ph_shop.gutschein``.

Die Fachlogik liegt im Controller PH Gutschein (``PHGutschein.einloesen``/``pruefe_einloesbar``); dieses Modul
ist die stabile Server-Schnittstelle dafür: Gutschein per Name oder Klartextcode finden, idempotent einlösen,
Restwert liefern. Rechteprüfung macht der Aufrufer (Kassa-Page, Button); gebucht wird mit ignore_permissions.

    from ph_shop.gutschein import einloesen, pruefen
    pruefen("PH-ABCD-EFGH")                      → {"gutschein", "status", "rest_cent", "wert_cent", "einloesbar", "letzte4", "gueltig_bis"}
    einloesen(gutschein="PH-GS-2026-00001", betrag_cent=2500, kanal="Kassa",
              beleg_doctype="PH Kassenbeleg", beleg="SHOWROOM1-000012")
                                                 → {"gutschein", "rest_cent", "eingeloest_cent", "status", "bereits_gebucht"}
Idempotenz: gleicher beleg_doctype/beleg (oder gleicher idempotency_key im Hinweis) → vorhandene Einlösung, keine zweite Buchung.
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import EINLOESBAR, finde_nach_code

KANAELE = ("Showroom", "Online", "Kassa")


def _laden(gutschein=None, code=None):
    """Gutschein-Dokument per Name oder Klartextcode; wirft 404-artigen Fehler, wenn nicht gefunden."""
    doc = None
    if gutschein and frappe.db.exists("PH Gutschein", gutschein):
        doc = frappe.get_doc("PH Gutschein", gutschein)
    elif code:
        doc = finde_nach_code(code)
        if doc is None and frappe.db.exists("PH Gutschein", code):
            doc = frappe.get_doc("PH Gutschein", code)
    if doc is None:
        frappe.throw(_("Gutschein nicht gefunden."), frappe.DoesNotExistError)
    return doc


def pruefen(code_or_name):
    """Status und Restwert eines Gutscheins (Kassa-Page „Gutschein einlösen“). Kein Käufer, kein Code."""
    doc = _laden(gutschein=code_or_name, code=code_or_name)
    abgelaufen = bool(doc.gueltig_bis and getdate(doc.gueltig_bis) < getdate(nowdate()))
    return {
        "gutschein": doc.name,
        "status": doc.status,
        "wert_cent": cint(doc.wert_cent),
        "rest_cent": cint(doc.rest_cent),
        "waehrung": doc.waehrung or "EUR",
        "einloesbar": doc.status in EINLOESBAR and not abgelaufen and cint(doc.rest_cent) > 0,
        "abgelaufen": abgelaufen,
        "gueltig_bis": str(doc.gueltig_bis) if doc.gueltig_bis else None,
        "test": bool(doc.test),
        "letzte4": doc.code_letzte4,
        "art": doc.art or "Mehrzweck",
        # Kassa (10-konzept-kassa §5): Steuer beim Einlösen/Verkauf – Mehrzweck: Satz Null, Einzweck: Satz der Leistung
        **doc.steuer(),
        "gesperrt": doc.status == "Gesperrt",
        "sperrgrund_art": doc.sperrgrund_art,
    }


def _vorhandene_einloesung(doc, beleg_doctype, beleg, idempotency_key):
    for z in doc.einloesungen:
        if beleg_doctype and beleg and z.beleg_doctype == beleg_doctype and z.beleg == beleg:
            return z
        if idempotency_key and (z.hinweis or "").endswith(f"[{idempotency_key}]"):
            return z
    return None


def einloesen(*, gutschein=None, code=None, betrag_cent, kanal="Kassa", beleg_doctype=None, beleg=None, kontakt=None, hinweis=None, idempotency_key=None, zahlung_buchen=False):
    """Teilbetrag eines Gutscheins einlösen (Serverfunktion für ph_kassa/ph_faktura).

    kanal: Showroom | Online | Kassa (Select der Kindtabelle PH Gutschein Einloesung).
    zahlung_buchen: False = der Aufrufer bucht die PH Zahlung selbst (Kassenbeleg je Zahlart); True = Controller
    legt eine PH Zahlung (Kanal Gutschein) an.
    Rückgabe: {"gutschein", "rest_cent", "eingeloest_cent", "status", "zahlung", "bereits_gebucht"}.
    """
    betrag_cent = cint(betrag_cent)
    if betrag_cent <= 0:
        frappe.throw(_("Betrag muss größer als 0 Cent sein."))
    if kanal not in KANAELE:
        kanal = "Kassa" if str(kanal).lower().startswith("kassa") else "Showroom"
    doc = _laden(gutschein=gutschein, code=code)
    alt = _vorhandene_einloesung(doc, beleg_doctype, beleg, idempotency_key)
    if alt is not None:
        return {"gutschein": doc.name, "rest_cent": cint(doc.rest_cent), "eingeloest_cent": cint(alt.betrag_cent), "status": doc.status, "zahlung": alt.zahlung, "bereits_gebucht": True}
    if beleg_doctype and not frappe.db.exists("DocType", beleg_doctype):
        beleg_doctype, beleg = None, None
    text = (hinweis or "").strip()
    if idempotency_key:
        text = f"{text} [{idempotency_key}]".strip()
    doc.flags.ignore_permissions = True
    r = doc.einloesen(betrag_cent, kanal=kanal, beleg_doctype=beleg_doctype, beleg=beleg, hinweis=text[:140] or None, zahlung_buchen=bool(zahlung_buchen), kontakt=kontakt)
    return {"gutschein": doc.name, "rest_cent": cint(r.get("rest_cent")), "eingeloest_cent": betrag_cent, "status": r.get("status"), "zahlung": r.get("zahlung"), "bereits_gebucht": False}


def storniere_einloesung(*, gutschein, beleg_doctype, beleg, grund=None):
    """Einlösung zu einem stornierten Beleg zurückbuchen (Kassa-Stornobeleg): Restwert erhöhen, Status zurücksetzen.
    Idempotent: ohne passende Einlösung passiert nichts (None)."""
    from ph_shop.ph_shop import status as st

    doc = frappe.get_doc("PH Gutschein", gutschein)
    zeile = _vorhandene_einloesung(doc, beleg_doctype, beleg, None)
    if zeile is None or (zeile.hinweis or "").startswith("STORNO"):
        return None
    if doc.status in ("Gesperrt", "Erstattet"):
        frappe.throw(_("Gutschein ist {0} – Einlösung kann nicht zurückgebucht werden.").format(doc.status))
    betrag = cint(zeile.betrag_cent)
    rest = min(cint(doc.rest_cent) + betrag, cint(doc.wert_cent))
    gegen = doc.append("einloesungen", {"datum": frappe.utils.now_datetime(), "betrag_cent": -betrag, "rest_danach_cent": rest, "kanal": zeile.kanal, "beleg_doctype": beleg_doctype, "beleg": beleg, "mitarbeiter": frappe.session.user, "hinweis": f"STORNO {grund or ''}"[:140]})
    gegen.db_insert()
    frappe.db.set_value("PH Gutschein Einloesung", zeile.name, "hinweis", f"STORNO→{gegen.name}"[:140], update_modified=False)
    neu = "Aktiv" if rest >= cint(doc.wert_cent) else ("Teilweise eingeloest" if rest > 0 else "Eingeloest")
    doc.flags.ignore_permissions = True
    st.setzen(doc, neu, _("Einlösung {0} Cent zurückgebucht ({1})").format(betrag, beleg), None, {"rest_cent": rest, "rest_eur": rest / 100})
    return {"gutschein": doc.name, "rest_cent": rest, "status": neu}


# ─────────────────── Verkauf im Showroom (ph_kassa) und Gutschriften ───────────────────

def ausstellen_verkauf(*, wert_cent, beleg_doctype, beleg, idempotency_key, position=None, kanal="Kassa", zahlung=None, kontakt=None, kaeufer_name=None, kaeufer_email=None, motiv="schlicht", empfaenger=None, grusstext=None, art=None, ust_satz_promille=None, test=False, pdf=True):
    """Gutschein aus einem Kassenbeleg (Position „Gutschein Verkauf“) ausstellen – idempotent je idempotency_key
    (z. B. "kassa:<beleg>:<position>"). Der Klartext-Code kommt GENAU EINMAL zurück (Bon/PDF); bei Wiederholung
    nur Name/letzte 4 (bereits_ausgestellt=True) – Nachdruck dann über „Ersetzen“.
    → {"gutschein", "code"|None, "letzte4", "wert_cent", "art", "steuersatz", "steuersatz_promille", "pdf", "bereits_ausgestellt"}"""
    from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen

    if not idempotency_key:
        frappe.throw(_("idempotency_key fehlt (z. B. kassa:<beleg>:<position>)."))
    if art == "Rabatt":
        frappe.throw(_("Rabattgutscheine sind nicht verkäuflich (mindern das Entgelt beim Einlösen)."))
    vorhanden = frappe.db.get_value("PH Gutschein", {"idempotency_key": idempotency_key}, "name")
    if vorhanden:
        doc = frappe.get_doc("PH Gutschein", vorhanden)
        return {"gutschein": doc.name, "code": None, "letzte4": doc.code_letzte4, "wert_cent": cint(doc.wert_cent), "art": doc.art, **doc.steuer(), "pdf": doc.pdf, "bereits_ausgestellt": True}
    einst = frappe.get_cached_doc("PH Shop Einstellungen")
    wert_cent = cint(wert_cent)
    if wert_cent <= 0:
        frappe.throw(_("Gutscheinwert muss größer als 0 Cent sein."))
    if cint(einst.gutschein_max_cent) and wert_cent > cint(einst.gutschein_max_cent):
        frappe.throw(_("Gutscheinwert übersteigt das Maximum ({0} Cent).").format(einst.gutschein_max_cent))
    doc, code = ausstellen(
        wert_cent, test=bool(test), kanal="Kassa" if kanal == "Kassa" else "Showroom", motiv=motiv, empfaenger=empfaenger, grusstext=grusstext,
        kaeufer={"name": kaeufer_name, "email": kaeufer_email, "kontakt": kontakt}, zahlung=zahlung, quelle="kassa", art=art,
        idempotency_key=idempotency_key, ausgabe_beleg_doctype=beleg_doctype, ausgabe_beleg=beleg, ust_satz_promille=ust_satz_promille,
    )
    if position:
        doc.add_comment("Info", _("Verkauft mit {0} {1}, Position {2}").format(beleg_doctype, beleg, position))
    datei = doc.pdf_erzeugen(code) if pdf else None
    return {"gutschein": doc.name, "code": code, "letzte4": doc.code_letzte4, "wert_cent": wert_cent, "art": doc.art, **doc.steuer(), "pdf": datei, "bereits_ausgestellt": False}


def verkauf_stornieren(*, beleg_doctype, beleg, grund=None):
    """Kassa-Storno eines Gutscheinverkaufs: unbenutzte Gutscheine des Belegs sperren (Rest 0, Sperrgrund
    „Verkauf storniert“). Teilweise eingelöste bleiben aktiv und werden gemeldet (Rückzahlung nur Restwert).
    → [{"gutschein", "ergebnis": "gesperrt"|"teilweise_eingeloest"|"bereits_gesperrt", "rest_cent"}]"""
    out = []
    for name in frappe.get_all("PH Gutschein", {"ausgabe_beleg_doctype": beleg_doctype, "ausgabe_beleg": beleg}, pluck="name"):
        doc = frappe.get_doc("PH Gutschein", name)
        doc.flags.ignore_permissions = True
        if doc.status in ("Gesperrt", "Erstattet"):
            out.append({"gutschein": name, "ergebnis": "bereits_gesperrt", "rest_cent": cint(doc.rest_cent)})
        elif cint(doc.rest_cent) < cint(doc.wert_cent):
            out.append({"gutschein": name, "ergebnis": "teilweise_eingeloest", "rest_cent": cint(doc.rest_cent)})
        else:
            doc.sperren(_("Kassa-Storno {0}: {1}").format(beleg, grund or "–"), sperrgrund_art="Verkauf storniert")
            doc.db_set({"rest_cent": 0, "rest_eur": 0})
            out.append({"gutschein": name, "ergebnis": "gesperrt", "rest_cent": 0})
    return out


def gutschreiben(*, gutschein, betrag_cent, beleg_doctype=None, beleg=None, grund=None, idempotency_key=None):
    """Restwert-Gutschrift (Kassa-Retoure auf Gutschein, Teilerstattung). Idempotent über idempotency_key."""
    doc = _laden(gutschein=gutschein, code=gutschein)
    if idempotency_key and any((z.hinweis or "").endswith(f"[{idempotency_key}]") for z in doc.einloesungen):
        return {"gutschein": doc.name, "rest_cent": cint(doc.rest_cent), "status": doc.status, "bereits_gebucht": True}
    doc.flags.ignore_permissions = True
    text = f"{grund or ''} [{idempotency_key}]".strip() if idempotency_key else grund
    r = doc.gutschreiben(betrag_cent, text, beleg_doctype, beleg)
    r["bereits_gebucht"] = False
    return r
