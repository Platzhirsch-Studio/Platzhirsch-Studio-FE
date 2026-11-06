"""Lager: Platz-Scan, Kommissionsware je Projekt/Auftrag, Lieferschein aus Kommission, Reservierungsablauf.

Kommission = Projekt- oder AB-Nummer als Text (ph_projekte ist keine required_app). Kommissionsware entsteht beim
Wareneingang (PH Wareneingang.kommission bzw. Position) oder per Umbuchung und ist nicht frei verkäuflich.
"""

import frappe
from frappe import _
from frappe.utils import nowdate

from .bestand_logik import kommission_offen, platz_aus_code, reservierung_abgelaufen

ROLLEN = {"PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Backoffice-Admin", "System Manager", "PH Geschäftsführung", "PH Montage"}


def _pruefen():
    if not ROLLEN & set(frappe.get_roles()):
        frappe.throw(_("Keine Berechtigung für das Lager."), frappe.PermissionError)


def platz_aufloesen(code):
    """'<Lagerort>/<Platz>' → (lagerort, platz); prüft Lagerort und – wenn der Lagerort Plätze pflegt – den Platz."""
    lagerort, platz = platz_aus_code(code)
    if not lagerort or not frappe.db.exists("PH Lagerort", lagerort):
        frappe.throw(_("Unbekannter Lagerort im Code: {0}").format(code))
    plaetze = frappe.get_all("PH Lagerort Platz", {"parent": lagerort, "parenttype": "PH Lagerort"}, ["platz", "aktiv"])
    if platz and plaetze and not any(p.platz == platz and p.aktiv for p in plaetze):
        frappe.throw(_("Platz {0} ist in {1} nicht (aktiv) angelegt.").format(platz, lagerort))
    return lagerort, platz


@frappe.whitelist()
def platz_scan(code):
    """Mobil/Packtisch: Platzetikett scannen → Lagerort, Platz und Bestände dort."""
    _pruefen()
    lagerort, platz = platz_aufloesen(code)
    filt = {"lagerort": lagerort, "status": ("not in", ["Ausgeschieden", "Verkauft"])}
    if platz:
        filt["platz"] = platz
    rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "menge", "verfuegbar", "status", "kommission", "seriennummer", "gesperrt"], order_by="produkt_name")
    return {"lagerort": lagerort, "platz": platz, "bestaende": rows}


@frappe.whitelist()
def umlagern_scan(lagerbestand, platz_code, menge=None):
    """Serienmodus „Platz zuerst“: Bestand an den gescannten Platz umlagern."""
    _pruefen()
    return frappe.get_doc("PH Lagerbestand", lagerbestand).umlagern(platz_code=platz_code, menge=menge)


def _erwartet(kommission):
    """Offene Mengen aus PH Herstellerbestellung (ph_sortiment) mit dieser Kommission (Kopf oder Position)."""
    if not frappe.db.exists("DocType", "PH Herstellerbestellung"):
        return []
    koepfe = set(frappe.get_all("PH Herstellerbestellung", {"kommission": kommission, "status": ("not in", ["Storniert", "Abgeschlossen", "Entwurf"])}, pluck="name"))
    pos = frappe.get_all(
        "PH Herstellerbestellung Position",
        filters={"parenttype": "PH Herstellerbestellung"},
        or_filters={"kommission": kommission, "parent": ("in", list(koepfe) or ["-"])},
        fields=["parent", "produkt", "bezeichnung", "menge", "menge_erhalten", "bestaetigter_termin", "status"],
    )
    gueltig = set(frappe.get_all("PH Herstellerbestellung", {"name": ("in", list({p.parent for p in pos}) or ["-"]), "status": ("not in", ["Storniert", "Entwurf"])}, pluck="name"))
    return [p for p in pos if p.parent in gueltig]


@frappe.whitelist()
def kommissionsliste(kommission):
    """Kommissionsware eines Projekts/Auftrags: im Lager (mit Platz, gesperrt), noch erwartet (Herstellerbestellungen), Summen."""
    _pruefen()
    if not kommission:
        frappe.throw(_("Kommission fehlt."))
    bestaende = frappe.get_all(
        "PH Lagerbestand",
        {"kommission": kommission, "status": ("not in", ["Ausgeschieden", "Verkauft"])},
        ["name", "produkt", "produkt_name", "marke", "lagerort", "platz", "menge", "gesperrt", "sperrgrund", "zustand", "eingang_am", "seriennummer"],
        order_by="lagerort, platz, produkt_name",
    )
    erwartet = _erwartet(kommission)
    return {"kommission": kommission, "bestaende": bestaende, "erwartet": erwartet, "summen": kommission_offen(bestaende, erwartet)}


def _adresse_aus_kommission(kommission):
    """Lieferadresse aus dem Projekt (ph_projekte, Felder objekt_*), sonst nur Projektbezug."""
    if frappe.db.exists("DocType", "PH Projekt") and frappe.db.exists("PH Projekt", kommission):
        p = frappe.db.get_value("PH Projekt", kommission, ["kontakt", "kunde_name", "objekt_strasse", "objekt_plz", "objekt_ort", "objekt_land", "baustelle_telefon", "objekt_hinweis"], as_dict=True)
        return {
            "projekt": kommission,
            "kontakt": p.kontakt,
            "kunde_name": p.kunde_name,
            "liefer_name": p.kunde_name,
            "liefer_strasse": p.objekt_strasse,
            "liefer_plz": p.objekt_plz,
            "liefer_ort": p.objekt_ort,
            "liefer_land": str(p.objekt_land or "AT")[:2].upper(),
            "liefer_telefon": p.baustelle_telefon,
            "lieferhinweis": p.objekt_hinweis,
        }
    return {"projekt": kommission}


@frappe.whitelist()
def lieferschein_aus_kommission(kommission, lieferart="Eigenlieferung", bestaende=None, wunschtermin=None):
    """Lieferschein aus der Kommissionsware (alle oder ausgewählte Bestände, nicht gesperrt).
    Positionen verweisen auf den Bestand → beim Packen wird der Verkauf gebucht (Lieferschein._bestand_ausbuchen)."""
    _pruefen()
    frappe.has_permission("PH Lieferschein", "create", throw=True)
    if isinstance(bestaende, str):
        bestaende = frappe.parse_json(bestaende)
    filt = {"kommission": kommission, "gesperrt": 0, "menge": (">", 0), "status": ("not in", ["Ausgeschieden", "Verkauft"])}
    if bestaende:
        filt["name"] = ("in", bestaende)
    rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "marke", "menge", "seriennummer", "ean", "platz", "lagerort"])
    if not rows:
        frappe.throw(_("Keine lieferbare Kommissionsware für {0}.").format(kommission))
    offen = frappe.get_all("PH Lieferschein Position", {"lagerbestand": ("in", [r.name for r in rows]), "parenttype": "PH Lieferschein"}, ["parent", "lagerbestand"])
    offen_ls = set(frappe.get_all("PH Lieferschein", {"name": ("in", [o.parent for o in offen] or ["-"]), "status": ("in", ["Entwurf", "Gepackt"])}, pluck="name"))
    belegt = {o.lagerbestand for o in offen if o.parent in offen_ls}
    rows = [r for r in rows if r.name not in belegt]
    if not rows:
        frappe.throw(_("Alle Bestände stehen bereits auf offenen Lieferscheinen."))
    if frappe.db.exists("DocType", "PH Auftragsbestaetigung") and frappe.db.exists("PH Auftragsbestaetigung", kommission):
        # Adresse/Kontakt aus der AB (Feldnamen wie lieferschein_aus_auftrag), Positionen aus dem Lager
        ls = frappe.new_doc("PH Lieferschein")
        ab = frappe.get_doc("PH Auftragsbestaetigung", kommission)
        ls.update({"auftrag": kommission, "projekt": ab.projekt, "kontakt": ab.kontakt, "kunde_name": ab.kunde_name, "liefer_name": ab.kunde_name, "liefer_firma": ab.firma, "liefer_strasse": ab.strasse, "liefer_plz": ab.plz, "liefer_ort": ab.ort, "liefer_land": str(ab.land or "AT")[:2].upper(), "lieferhinweis": ab.lieferhinweis})
    else:
        ls = frappe.new_doc("PH Lieferschein")
        ls.update(_adresse_aus_kommission(kommission))
    ls.update({"lieferart": lieferart, "kommission": kommission, "wunschtermin": wunschtermin, "quelle": "backoffice"})
    for r in rows:
        ls.append("positionen", {"produkt": r.produkt, "beschreibung": r.produkt_name or r.produkt, "marke": r.marke, "menge": int(r.menge), "seriennummer": r.seriennummer, "ean": r.ean, "lagerbestand": r.name})
    ls.insert()
    ls.add_comment("Info", _("Aus Kommissionsware {0} erzeugt ({1} Positionen)").format(kommission, len(rows)))
    return ls.name


def reservierungen_freigeben():
    """Scheduler täglich 06:30: abgelaufene Reservierungen (reserviert_bis < heute) freigeben + Kommentar + Aufgabe an Leitung."""
    from .bestand import buche
    from .tasks import _aufgabe

    heute = nowdate()
    for r in frappe.get_all("PH Lagerbestand", {"reserviert": (">", 0), "reserviert_bis": ("is", "set")}, ["name", "produkt", "lagerort", "reserviert", "reserviert_bis", "reserviert_kunde_name"]):
        if not reservierung_abgelaufen(r.reserviert_bis, heute):
            continue
        try:
            buche("Freigabe", r.produkt, int(r.reserviert), lagerort_von=r.lagerort, lagerbestand=r.name, grund=_("Reservierung abgelaufen ({0})").format(r.reserviert_bis), idempotency_key=f"resab:{r.name}:{r.reserviert_bis}", quelle="scheduler")
            _aufgabe(f"Reservierung {r.name} ({r.reserviert_kunde_name or '-'}) abgelaufen und freigegeben", "PH Lagerbestand", r.name)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_logistik: Reservierung {r.name} freigeben")
