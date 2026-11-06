"""Server-Methoden der Desk-Page „ph-packtisch“ (Desk-Benutzer mit Rolle PH Logistik …).

Oberfläche: offene Bestellungen/Lieferscheine → Pack-Ansicht je Lieferschein: Positionen abhaken oder scannen
(Barcode-Eingabe), Paketwahl aus Paketprofilen, Gewicht, Versicherungswert, „Etikett erzeugen“, Druck Lieferschein + Etikett.
"""

import frappe
from frappe import _

from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map, vorschlag_fuer
from ph_logistik.ph_logistik.helfer import einstellungen, produkt_info

ROLLEN = {"PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Backoffice-Admin", "System Manager", "PH Geschäftsführung"}


def _pruefen():
    if not ROLLEN & set(frappe.get_roles()):
        frappe.throw(_("Keine Berechtigung für den Packtisch."), frappe.PermissionError)


@frappe.whitelist()
def offene():
    """Offene Lieferscheine (Entwurf/Gepackt) + bezahlte Shop-Bestellungen ohne Lieferschein."""
    _pruefen()
    ls = frappe.get_all(
        "PH Lieferschein",
        {"status": ("in", ["Entwurf", "Gepackt"])},
        ["name", "titel", "status", "lieferart", "kunde_name", "bestellung", "auftrag", "datum", "wunschtermin", "liefer_ort", "liefer_land", "zerbrechlich", "versichern", "teillieferung", "zurueckgestellt", "zurueckgestellt_grund", "modified"],
        order_by="status desc, datum asc",
    )
    for l in ls:  # noqa: E741
        l["positionen"] = frappe.db.count("PH Lieferschein Position", {"parent": l.name})
        l["offen"] = frappe.db.count("PH Lieferschein Position", {"parent": l.name, "gepackt": 0})
        l["sendung"] = frappe.db.get_value("PH Sendung", {"lieferschein": l.name, "richtung": "Ausgang", "status": ("in", ["Angelegt", "Etikett", "Unterwegs"])}, "name")
    bestellungen = []
    if frappe.db.exists("DocType", "PH Bestellung"):
        meta = frappe.get_meta("PH Bestellung")
        felder = [f for f in ("name", "status", "kunde_name", "lieferart", "gesamt_cent", "bezahlt_am", "modified") if meta.has_field(f)]
        mit_ls = {x.bestellung for x in frappe.get_all("PH Lieferschein", {"bestellung": ("is", "set"), "status": ("!=", "Storniert")}, ["bestellung"])}
        try:
            rows = frappe.get_all("PH Bestellung", {"status": ("in", ["bezahlt", "versandbereit", "reserviert", "abholbereit"])}, felder, order_by="modified asc", limit=200)
            bestellungen = [r for r in rows if r.name not in mit_ls]
        except Exception:  # noqa: BLE001
            bestellungen = []
    e = einstellungen()
    return {"lieferscheine": ls, "bestellungen": bestellungen, "hinweis": e.get("packtisch_hinweis"), "mock": bool(e.get("letmeship_testmodus") or not e.get("letmeship_konfiguriert"))}


@frappe.whitelist()
def lieferschein_aus_bestellung(bestellung):
    _pruefen()
    from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import lieferschein_aus_bestellung as f

    return f(bestellung).name


@frappe.whitelist()
def packansicht(lieferschein):
    """Alles für die Pack-Ansicht: Lieferschein, Positionen mit Profilvorschlag, Pakete, Profile, Sendungen."""
    _pruefen()
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    ls.check_permission("read")
    profile = profile_map()
    positionen = []
    for p in ls.positionen:
        d = p.as_dict()
        if not d.get("paketprofil") and p.produkt:
            d["paketprofil_vorschlag"] = vorschlag_fuer(produkt_info(p.produkt))
        positionen.append(d)
    sendungen = frappe.get_all("PH Sendung", {"lieferschein": ls.name}, ["name", "status", "richtung", "carrier", "service_name", "tracking_nr", "tracking_url", "etikett", "preis_brutto_cent", "env"], order_by="creation desc")
    e = einstellungen()
    return {
        "lieferschein": ls.as_dict(),
        "positionen": positionen,
        "pakete": [pk.as_dict() for pk in ls.pakete],
        "profile": sorted(profile.values(), key=lambda x: (x.get("familie") or "", x.get("gewicht_g") or 0)),
        "sendungen": sendungen,
        "einstellungen": {"glas_immer_versichern": e.get("glas_immer_versichern"), "versicherung_ab_cent": e.get("versicherung_ab_cent"), "mock": bool(e.get("letmeship_testmodus") or not e.get("letmeship_konfiguriert"))},
    }


@frappe.whitelist()
def scan(lieferschein, code):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).scan(code)


@frappe.whitelist()
def position_packen(lieferschein, position, anzahl=1):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).position_packen(position, int(anzahl))


@frappe.whitelist()
def position_zuruecksetzen(lieferschein, position):
    _pruefen()
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    ls.check_permission("write")
    for p in ls.positionen:
        if p.name == position:
            p.menge_gepackt = 0
            p.gepackt = 0
    ls.save()
    return True


@frappe.whitelist()
def pakete_speichern(lieferschein, pakete, versicherungswert_cent=None, versichern=None):
    _pruefen()
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    ls.check_permission("write")
    if isinstance(pakete, str):
        pakete = frappe.parse_json(pakete)
    ls.set("pakete", [])
    for i, pk in enumerate(pakete or [], start=1):
        ls.append("pakete", {"paket_nr": pk.get("paket_nr") or i, "paketprofil": pk.get("paketprofil") or None, "laenge_cm": pk.get("laenge_cm"), "breite_cm": pk.get("breite_cm"), "hoehe_cm": pk.get("hoehe_cm"), "gewicht_g": pk.get("gewicht_g"), "zerbrechlich": int(bool(pk.get("zerbrechlich"))), "inhalt": pk.get("inhalt")})
    if versichern is not None:
        ls.versichern = int(bool(int(versichern)))
    if versicherungswert_cent is not None:
        ls.versicherungswert_cent = int(versicherungswert_cent or 0)
    ls.save()
    return {"gesamtgewicht_g": ls.gesamtgewicht_g, "versichern": ls.versichern, "versicherungswert_cent": ls.versicherungswert_cent}


@frappe.whitelist()
def pakete_vorschlagen(lieferschein):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).pakete_vorschlagen()


@frappe.whitelist()
def als_gepackt(lieferschein):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).als_gepackt()


@frappe.whitelist()
def tarife(lieferschein, neu=0):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).tarife(neu=neu)


@frappe.whitelist()
def etikett_erzeugen(lieferschein, tarif_id):
    _pruefen()
    name = frappe.get_doc("PH Lieferschein", lieferschein).etikett_erzeugen(tarif_id)
    s = frappe.db.get_value("PH Sendung", name, ["name", "status", "carrier", "tracking_nr", "etikett", "tracking_url", "env"], as_dict=True)
    return s


@frappe.whitelist()
def uebergeben(lieferschein, an="Dienstleister"):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).uebergeben(an)


@frappe.whitelist()
def abholung_buchen(lieferschein, empfaenger_name, unterschrift=None, abholcode=None):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).als_zugestellt(empfaenger_name, unterschrift, abholcode)


@frappe.whitelist()
def positionen_setzen(lieferschein, stand, idempotency_key=None):
    """Offline-Puffer: absoluter Pack-Stand je Position (wiederholbar)."""
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).positionen_setzen(stand, idempotency_key)


@frappe.whitelist()
def position_minus(lieferschein, position):
    """Abhaken um eins zurücknehmen (statt ganz auf 0)."""
    _pruefen()
    ls = frappe.get_doc("PH Lieferschein", lieferschein)
    for p in ls.positionen:
        if p.name == position:
            return ls.positionen_setzen({position: max(int(p.menge_gepackt or 0) - 1, 0)})
    frappe.throw(_("Position nicht gefunden."))


@frappe.whitelist()
def problem_melden(lieferschein, grund, text=None, fotos=None):
    _pruefen()
    return frappe.get_doc("PH Lieferschein", lieferschein).problem_melden(grund, text, fotos)


@frappe.whitelist()
def statistik():
    """Kopfzahlen für das Packtisch-Dashboard."""
    _pruefen()
    heute = frappe.utils.nowdate()
    return {
        "zu_packen": frappe.db.count("PH Lieferschein", {"status": "Entwurf"}),
        "gepackt": frappe.db.count("PH Lieferschein", {"status": "Gepackt"}),
        "etikett_offen": frappe.db.count("PH Sendung", {"status": "Angelegt"}),
        "unterwegs": frappe.db.count("PH Sendung", {"status": "Unterwegs"}),
        "probleme": frappe.db.count("PH Sendung", {"status": "Problem"}),
        "heute_gepackt": frappe.db.count("PH Lieferschein", {"gepackt_am": (">=", heute)}),
        "touren_heute": frappe.db.count("PH Tour", {"datum": heute, "status": ("!=", "Abgebrochen")}),
        "zurueckgestellt": frappe.db.count("PH Lieferschein", {"status": "Entwurf", "zurueckgestellt": 1}),
    }
