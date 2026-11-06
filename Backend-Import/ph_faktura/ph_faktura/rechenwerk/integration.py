"""Reine Logik der Nachbar-App-Anbindung (Integration Runde 3) – ohne Frappe, unit-getestet.

- Shop-Erstattung → Gutschrift-Positionen je USt-Satz (Hook ph_shop_gutschrift_erstellen, satz_json der
  PH Bestellung Erstattung: {"posten": [{satz_promille, brutto_cent, ust_cent, netto_cent}], "versand", "zeilen"}).
- Warenrücknahme (ph_logistik) → Gutschrift-Positionen aus den Rechnungspositionen (Zuordnung über AB-Position
  bzw. Produkt, Menge gedeckelt auf berechnet − bereits gutgeschrieben).
- Lieferanten-Gutschrift (Eingangsseite): Vorzeichen für Export/UVA; Betrag für den Regress-Abgleich (netto).
- Regress-Differenz ausgebucht → Export-Zeile (Aufwand an Forderung Lieferant).
- PH Pflege Abo (ph_service) → Angebotspositionen.
"""

from __future__ import annotations

import json
from decimal import ROUND_HALF_UP, Decimal


class IntegrationFehler(ValueError):
    """Fachlicher Fehler – der Controller übersetzt in frappe.throw."""


def _rund(x) -> int:
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def netto_aus_brutto(brutto_cent: int, satz_promille: int) -> int:
    satz = int(satz_promille or 0)
    return _rund(Decimal(int(brutto_cent)) * Decimal(10000) / Decimal(10000 + satz))


# ── Shop-Erstattung ──────────────────────────────────────────────────────────

ERSTATTUNG_ART_GUTSCHRIFT = {"Teilstorno": "Teilgutschrift", "Teilerstattung": "Teilgutschrift", "Versand": "Teilgutschrift", "Kulanz": "Kulanz", "Widerruf": "Teilgutschrift"}


def gutschrift_art_aus_erstattung(art: str | None) -> str:
    return ERSTATTUNG_ART_GUTSCHRIFT.get(art or "", "Teilgutschrift")


def gutschrift_positionen_aus_erstattung(satz_json, art: str | None = None, bestellung: str | None = None) -> list[dict]:
    """Je USt-Satz eine Position (Netto aus dem Posten, sonst aus Brutto). Leere/0-Posten entfallen."""
    daten = json.loads(satz_json) if isinstance(satz_json, str) else (satz_json or {})
    posten = daten.get("posten") or []
    if not posten:
        raise IntegrationFehler("Erstattung ohne USt-Aufteilung (satz_json.posten) – Gutschrift manuell erstellen.")
    text = {"Kulanz": "Preisminderung (Kulanz)", "Versand": "Erstattung Versandkosten"}.get(art or "", "Erstattung Rücknahme")
    out = []
    for p in sorted(posten, key=lambda x: -int(x.get("satz_promille") or 0)):
        brutto = int(p.get("brutto_cent") or 0)
        if brutto <= 0:
            continue
        satz = int(p.get("satz_promille") or 0)
        netto = int(p["netto_cent"]) if p.get("netto_cent") not in (None, "") else netto_aus_brutto(brutto, satz)
        bez = f"{text} {satz / 100:g} %" + (f" – Bestellung {bestellung}" if bestellung else "")
        out.append({"art": "Leistung", "bezeichnung": bez[:140], "menge": 1, "einheit": "Pausch", "einzel_netto_cent": netto, "ust_satz_promille": satz})
    if not out:
        raise IntegrationFehler("Erstattung ohne Betrag.")
    return out


# ── Warenrücknahme ───────────────────────────────────────────────────────────

def ruecknahme_positionen(rechnung_positionen: list[dict], ruecknahme: list[dict], bereits: dict[str, float] | None = None) -> list[dict]:
    """Gutschrift-Positionen für zurückgenommene Ware.

    rechnung_positionen: [{name, art, produkt, bezeichnung, marke, ausfuehrung_text, menge, einheit, einzel_netto_cent,
                           rabatt_promille, ust_satz_promille, ab_position}]
    ruecknahme: [{produkt, beschreibung, menge, ab_position (aus Lieferschein-Position.beleg_position), entscheidung}]
    bereits: {Rechnungsposition: bereits gutgeschriebene Menge}
    Zuordnung: zuerst ab_position, dann Produkt; Menge gedeckelt. Nicht zuordenbare Zeilen → IntegrationFehler."""
    bereits = dict(bereits or {})
    frei = {p["name"]: float(p.get("menge") or 0) - float(bereits.get(p["name"], 0)) for p in rechnung_positionen}
    out, fehlt = [], []
    for r in ruecknahme:
        menge = float(r.get("menge") or 0)
        if menge <= 0:
            continue
        kandidaten = [p for p in rechnung_positionen if r.get("ab_position") and p.get("ab_position") == r.get("ab_position")]
        kandidaten = kandidaten or [p for p in rechnung_positionen if r.get("produkt") and p.get("produkt") == r.get("produkt")]
        for p in kandidaten:
            if menge <= 0:
                break
            m = min(menge, frei.get(p["name"], 0))
            if m <= 0:
                continue
            frei[p["name"]] -= m
            menge -= m
            out.append({k: p.get(k) for k in ("art", "produkt", "bezeichnung", "marke", "ausfuehrung_text", "einheit", "einzel_netto_cent", "rabatt_promille", "ust_satz_promille", "ab_position")} | {"menge": m, "rechnung_position": p["name"]})
        if menge > 0:
            fehlt.append(f"{r.get('beschreibung') or r.get('produkt') or '?'} ({menge:g})")
    if fehlt:
        raise IntegrationFehler("Keine (ausreichende) Rechnungsposition für: " + ", ".join(fehlt))
    if not out:
        raise IntegrationFehler("Keine zurückgenommene Menge.")
    return out


# ── Lieferanten-Gutschrift / Regress ─────────────────────────────────────────

def er_vorzeichen(belegart: str | None) -> int:
    """Eingangsrechnung +1, Lieferanten-Gutschrift −1 (Export: Kreditor im Soll, UVA: Vorsteuerkorrektur)."""
    return -1 if (belegart or "Rechnung") == "Gutschrift" else 1


def regress_betrag(netto_cent: int, brutto_cent: int, basis: str = "netto") -> int:
    """Betrag für ph_service gutschrift_erfassen: Belastung an den Lieferanten ist netto (Belastungsanzeige ohne USt)."""
    return int(netto_cent or 0) if basis == "netto" else int(brutto_cent or 0)


def regress_ausbuchung_zeile(regress: str, lieferant_name: str | None, datum, differenz_cent: int, kreditor: str, aufwandskonto: str, grund: str | None = None) -> dict:
    """Export-Zeile „Regress-Differenz ausgebucht“: Aufwand (Soll) an Lieferant/Forderung, ohne USt (Schadenersatz).
    Nur Unterdeckung (differenz > 0) wird ausgebucht."""
    betrag = int(differenz_cent or 0)
    if betrag <= 0:
        raise IntegrationFehler("Nur eine Unterdeckung (Differenz > 0) wird ausgebucht.")
    return {"beleg_doctype": "PH Lieferantenregress", "beleg": regress, "nummer": regress, "datum": datum, "kontakt_name": lieferant_name or "", "konto": kreditor, "gegenkonto": aufwandskonto,
            "steuercode": "0", "satz_promille": 0, "netto_cent": betrag, "ust_cent": 0, "brutto_cent": betrag, "soll_haben": "S",
            "text": f"Regress-Differenz ausgebucht {regress}" + (f": {grund}" if grund else ""), "leistungsdatum": datum, "uid": "", "extbelegnr": regress}


def bestandsveraenderung_zeile(bewertung: str, stichtag, betrag_cent: int, konto_bestand: str, konto_veraenderung: str, text: str | None = None) -> dict:
    """Export-Zeile „Bestandsveränderung Handelswaren“ aus einer festgeschriebenen PH Inventurbewertung (ph_logistik), ohne USt.
    betrag_cent > 0 = Bestandserhöhung (Soll Vorratskonto an Bestandsveränderung), < 0 = Minderung (Haben Vorratskonto).
    Konten sind Platzhalter aus PH Logistik Einstellungen – die Kanzlei bestätigt sie (91-steuerberater-fragen.md)."""
    b = int(betrag_cent or 0)
    if not b:
        raise IntegrationFehler("Keine Bestandsveränderung.")
    if not (konto_bestand and konto_veraenderung):
        raise IntegrationFehler("Konten für die Bestandsveränderung fehlen (PH Logistik Einstellungen).")
    return {"beleg_doctype": "PH Inventurbewertung", "beleg": bewertung, "nummer": bewertung, "datum": stichtag, "kontakt_name": "", "konto": konto_bestand, "gegenkonto": konto_veraenderung,
            "steuercode": "0", "satz_promille": 0, "netto_cent": abs(b), "ust_cent": 0, "brutto_cent": abs(b), "soll_haben": "S" if b > 0 else "H",
            "text": (text or f"Bestandsveränderung lt. Inventurbewertung {bewertung}")[:120], "leistungsdatum": stichtag, "uid": "", "extbelegnr": bewertung}


# ── Pflege-/Wartungsvertrag ──────────────────────────────────────────────────

def termine_pro_jahr(intervall_monate) -> int:
    i = int(intervall_monate or 0)
    return max(1, 12 // i) if i > 0 else 1


def pflege_angebot_positionen(abo: dict, satz_promille: int = 2000) -> list[dict]:
    """PH Pflege Abo → Angebotspositionen. preis_cent ist der Bruttopreis je Termin (ph_service); 0/leer = auf Anfrage
    → Fehler (nie schätzen, Inhaber-Entscheidung Nr. 13). Jährliche Abrechnung: Menge = Termine pro Jahr."""
    preis = int(abo.get("preis_cent") or 0)
    if preis <= 0:
        raise IntegrationFehler("Pflegevertrag ohne Preis – Preis je Termin eintragen (keine Schätzung).")
    jaehrlich = (abo.get("abrechnung") or "Je Termin") != "Je Termin" or abo.get("art") in ("Pflege Jahres-Abo", "Wartungsvertrag")
    menge = termine_pro_jahr(abo.get("intervall_monate")) if jaehrlich else 1
    titel = f"{abo.get('art') or 'Pflege'}: {abo.get('bereich') or ''}".strip(": ")
    stuecke = ", ".join(s for s in (x.get("bezeichnung") for x in (abo.get("stuecke") or [])) if s)
    zusatz = " · ".join(x for x in (f"alle {abo['intervall_monate']} Monate" if abo.get("intervall_monate") else None, stuecke or None) if x)
    out = [{"art": "Leistung", "bezeichnung": (titel + (" (je Termin)" if menge > 1 or not jaehrlich else ""))[:140], "ausfuehrung_text": zusatz[:140] or None, "beschreibung": abo.get("leistungen") or None,
            "menge": menge, "einheit": "Pausch", "einzel_netto_cent": netto_aus_brutto(preis, satz_promille), "ust_satz_promille": satz_promille}]
    if abo.get("mindestlaufzeit_monate") or abo.get("kuendigungsfrist_monate"):
        text = f"Mindestlaufzeit {abo.get('mindestlaufzeit_monate') or 0} Monate, Kündigungsfrist {abo.get('kuendigungsfrist_monate') or 0} Monate"
        out.append({"art": "Text", "bezeichnung": text[:140]})
    return out
