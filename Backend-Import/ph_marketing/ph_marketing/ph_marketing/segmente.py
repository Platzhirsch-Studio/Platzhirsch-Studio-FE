"""Segmente: Empfänger-Profile aus allen installierten Apps bauen und mit utils/segment.py auswerten.

Quellen (jede nur, wenn die DocType existiert – frappe.db.exists("DocType", …)):
  PH Newsletter Abo + Interessen, PH Einwilligung (ph_marketing) · PH Kontakt (ph_crm) · PH Kundenkarte (ph_kundenkarte)
  PH Auftragsbestaetigung (ph_faktura) · PH Bestellung (ph_shop) · PH Event Anmeldung · Email Unsubscribe (Frappe)
Basismenge: Adressen mit Abo oder mit Einwilligung des Segment-Zwecks – wer beides nicht hat, kann ohnehin nicht
angeschrieben werden (TKG § 174). Die Einwilligungsprüfung ist zwingend (utils/segment.einwilligung_pruefen).
"""

import frappe
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_marketing.utils import segment as seg
from ph_marketing.utils.token import email_maskieren, email_normalisieren

BESTELLUNG_BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")


def _dt(name):
    return bool(frappe.db.exists("DocType", name))


def _regeln(segment_doc):
    return [{"kriterium": r.kriterium, "operator": r.operator, "wert": r.wert, "wert_bis": r.wert_bis, "negieren": cint(r.negieren), "deaktiviert": cint(r.deaktiviert)} for r in segment_doc.regeln]


def profile(zweck="newsletter", emails=None):
    """→ list[dict] je E-Mail-Adresse (Felder siehe utils/segment.py)."""
    abos = {a.email: a for a in frappe.get_all("PH Newsletter Abo", fields=["name", "email", "status", "sprache", "kontakt", "quelle", "altbestand_ohne_doi"], filters={"email": ("in", emails)} if emails else None)}
    einw = {}
    ew_filter = {"zweck": ("in", list({zweck, "newsletter"}))}
    if emails:
        ew_filter["email"] = ("in", emails)
    for e in frappe.get_all("PH Einwilligung", filters=ew_filter, fields=["email", "zweck", "status", "kontakt"], order_by="zeitpunkt asc"):
        einw.setdefault(e.email, {})[e.zweck] = e.status  # jüngster Eintrag gewinnt (aufsteigend sortiert)
        einw[e.email].setdefault("_kontakt", e.kontakt)
    basis = set(abos) | {m for m, z in einw.items() if zweck in z}
    if emails:
        basis &= set(emails)
    if not basis:
        return []
    liste = sorted(basis)

    interessen = {}
    for r in frappe.get_all("PH Newsletter Abo Interesse", filters={"parenttype": "PH Newsletter Abo", "parent": ("in", liste)}, fields=["parent", "interesse"]):
        interessen.setdefault(r.parent, set()).add(str(r.interesse).lower())

    kontakte = {}
    if _dt("PH Kontakt"):
        for k in frappe.get_all("PH Kontakt", filters={"email": ("in", liste)}, fields=["name", "email", "sprache", "plz", "land", "kontaktart", "status", "nicht_kontaktieren"]):
            kontakte.setdefault(email_normalisieren(k.email), k)

    kontakt_namen = {k.name for k in kontakte.values()}
    karten, kaeufe = {}, {}
    if _dt("PH Kundenkarte") and kontakt_namen:
        # Stufe/Umsatz der Karte nur mit Einwilligung „kundenkarte_auswertung“ (Antrag, nicht widerrufen) – sonst
        # wäre die Segmentierung eine Profilbildung ohne Grundlage (Art. 6 Abs. 1 lit. a, Art. 22 DSGVO).
        for c in frappe.get_all("PH Kundenkarte", filters={"kontakt": ("in", list(kontakt_namen)), "status": "Aktiv", "einwilligung_auswertung": 1, "einwilligung_widerrufen_am": ("is", "not set")}, fields=["kontakt", "stufe", "letzter_einkauf", "gesamtumsatz_cent", "jahresumsatz_cent"]):
            karten[c.kontakt] = c
    grenze_12m = add_days(nowdate(), -365)

    def kauf(schluessel, datum, cent):
        k = kaeufe.setdefault(schluessel, {"letzter": None, "u12": 0, "gesamt": 0, "n": 0})
        d = getdate(datum) if datum else None
        if d and (not k["letzter"] or d > k["letzter"]):
            k["letzter"] = d
        k["gesamt"] += cint(cent)
        k["n"] += 1
        if d and d >= getdate(grenze_12m):
            k["u12"] += cint(cent)

    if _dt("PH Auftragsbestaetigung") and kontakt_namen:
        for a in frappe.get_all("PH Auftragsbestaetigung", filters={"kontakt": ("in", list(kontakt_namen)), "status": ("!=", "Storniert")}, fields=["kontakt", "datum", "brutto_cent"]):
            kauf(a.kontakt, a.datum, a.brutto_cent)
    if _dt("PH Bestellung"):
        for b in frappe.get_all("PH Bestellung", filters={"kunde_email": ("in", liste), "status": ("in", BESTELLUNG_BEZAHLT), "modus": "live"}, fields=["kontakt", "kunde_email", "angelegt", "gesamt_cent"]):
            kauf(b.kontakt or email_normalisieren(b.kunde_email), b.angelegt, b.gesamt_cent)

    events = {}
    for r in frappe.get_all("PH Event Anmeldung", filters={"parenttype": "PH Event", "email": ("in", liste), "status": ("in", ("angemeldet", "bestaetigt", "erschienen"))}, fields=["email", "parent"]):
        events.setdefault(r.email, set()).add(r.parent)

    widerspruch = set(frappe.get_all("Email Unsubscribe", filters={"email": ("in", liste), "global_unsubscribe": 1}, pluck="email")) if _dt("Email Unsubscribe") else set()

    erg = []
    for m in liste:
        a = abos.get(m)
        k = kontakte.get(m)
        karte = karten.get(k.name) if k else None
        kf = kaeufe.get(k.name) if k else None
        kf_mail = kaeufe.get(m)
        letzter = max([x["letzter"] for x in (kf, kf_mail) if x and x["letzter"]], default=None)
        if karte and karte.letzter_einkauf and (not letzter or getdate(karte.letzter_einkauf) > letzter):
            letzter = getdate(karte.letzter_einkauf)
        erg.append({
            "email": m,
            "kontakt": (k.name if k else None) or (a.kontakt if a else None) or (einw.get(m) or {}).get("_kontakt"),
            "sprache": (a.sprache if a else None) or (k.sprache if k else None),
            "plz": k.plz if k else None,
            "land": k.land if k else None,
            "kontaktart": k.kontaktart if k else None,
            "kontakt_status": k.status if k else None,
            "nicht_kontaktieren": cint(k.nicht_kontaktieren) if k else 0,
            "interessen": interessen.get(m, set()),
            "kundenkarte_stufe": karte.stufe if karte else None,
            "letzter_kauf": letzter,
            "umsatz_12m_cent": max(sum(x["u12"] for x in (kf, kf_mail) if x), cint(karte.jahresumsatz_cent) if karte else 0),
            "umsatz_gesamt_cent": max(sum(x["gesamt"] for x in (kf, kf_mail) if x), cint(karte.gesamtumsatz_cent) if karte else 0),
            "kaeufe_anzahl": sum(x["n"] for x in (kf, kf_mail) if x),
            "events": events.get(m, set()),
            "abo_status": a.status if a else None,
            "abo_quelle": a.quelle if a else None,
            "altbestand_ohne_doi": cint(a.altbestand_ohne_doi) if a else 0,
            "widerspruch": m in widerspruch,
            "einwilligungen": {z: s for z, s in (einw.get(m) or {}).items() if not z.startswith("_")},
            "abo": a.name if a else None,
        })
    return erg


def auswerten(segment_doc, zweck=None):
    """→ (empfaenger, ausgeschlossen Counter, treffer)."""
    zweck = zweck or segment_doc.zweck or "newsletter"
    return seg.auswerten(_regeln(segment_doc), profile(zweck), zweck, segment_doc.verknuepfung or "UND", nowdate())


def vorschau(segment_doc, speichern=1):
    emp, aus, treffer = auswerten(segment_doc)
    text = "\n".join(f"{seg.GRUND_TEXT.get(g, g)}: {n}" for g, n in aus.most_common())
    if speichern and not segment_doc.is_new():
        segment_doc.db_set({"vorschau_treffer": treffer, "vorschau_empfaenger": len(emp), "vorschau_ausgeschlossen": text or None, "vorschau_am": now_datetime()}, update_modified=False)
    return {
        "treffer": treffer,
        "empfaenger": len(emp),
        "ausgeschlossen": [{"grund": g, "text": seg.GRUND_TEXT.get(g, g), "anzahl": n} for g, n in aus.most_common()],
        "beispiele": [{"email": email_maskieren(p["email"]), "sprache": p.get("sprache"), "stufe": p.get("kundenkarte_stufe")} for p in emp[:20]],
    }


def empfaenger(segment_name, zweck):
    """Für Newsletter-Versand und Event-Einladungen. Zweck muss zum Segment passen."""
    doc = frappe.get_doc("PH Segment", segment_name)
    if doc.status != "Aktiv":
        frappe.throw(frappe._("Segment {0} ist archiviert.").format(segment_name))
    if (doc.zweck or "newsletter") != zweck:
        frappe.throw(frappe._("Segment {0} ist für den Zweck „{1}“ angelegt, gebraucht wird „{2}“.").format(segment_name, doc.zweck, zweck))
    return auswerten(doc, zweck)[0]
