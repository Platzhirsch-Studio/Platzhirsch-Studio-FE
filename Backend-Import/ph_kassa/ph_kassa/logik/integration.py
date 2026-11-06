"""Reine Logik der Nachbar-App-Anbindung der Kassa (Integration Runde 3) – ohne Frappe.

Quellen: 52-backend-luecken-crm-shop-service-personal-marketing.md Abschnitt 8 (ph_shop Rabattgutschein,
Einzweck-Satz Pflicht; ph_kundenkarte `card_*`-Codes), 51-… (Ausstellungsstücke ph_logistik).

- Rabattgutschein (`pruefen()["mindert_entgelt"]`): kein Zahlungsmittel → negative Rabattposition(en), aufgeteilt
  nach den Steuersätzen der Ware im Beleg (Entgeltminderung je Satz, § 16 UStG analog).
- Einzweck-Gutschein: Einlösung mit dem Satz der Ausgabe (`steuersatz` aus pruefen), ohne Satz → klare Meldung.
- Kundenkarte: ApiFehler (code, http_status, meldung) → Kassa-Fehlerform {code, meldung, vorteil}.
- Ausstellungsstück: PH Lagerbestand → Kassenposition „Ausstellungsstück“ mit Bezug.
"""

from __future__ import annotations

from .betraege import STEUERSAETZE, KassenFehler

WARE_ARTEN = ("Artikel", "Freitext")
RABATT_ART = "Rabatt"
EINZWECK_OHNE_SATZ = "Einzweck-Gutschein {0} hat keinen USt-Satz der Ausgabe – nicht einlösbar. Shop-Leitung: Satz am Gutschein nachtragen (PH Gutschein → USt-Satz)."


# ── Gutscheine ───────────────────────────────────────────────────────────────

def ware_je_satz(positionen: list[dict]) -> dict[str, int]:
    """Brutto der Ware (Artikel/Freitext, positiv) je Steuersatz – Grundlage der Rabattaufteilung."""
    out: dict[str, int] = {}
    for p in positionen:
        if p.get("art") not in WARE_ARTEN:
            continue
        menge = 1.0 if p.get("menge") in (None, "") else float(p["menge"])
        b = int(round(menge * int(p.get("einzel_brutto_cent") or 0))) if p.get("brutto_cent") in (None, "") else int(p["brutto_cent"])
        if b > 0:
            satz = p.get("steuersatz") or "Normal 20"
            out[satz] = out.get(satz, 0) + b
    return out


def rabatt_aufteilen(betrag_cent: int, positionen: list[dict]) -> list[dict]:
    """Rabattbetrag anteilig auf die Steuersätze der Ware (größter Rest, Summe exakt). Gedeckelt auf die Warensumme.

    → [{steuersatz, brutto_cent (positiv)}] absteigend nach Satz."""
    betrag = int(betrag_cent or 0)
    if betrag <= 0:
        raise KassenFehler("Rabattbetrag muss größer 0 sein.")
    je_satz = ware_je_satz(positionen)
    summe = sum(je_satz.values())
    if summe <= 0:
        raise KassenFehler("Rabattgutschein mindert das Entgelt – zuerst Ware erfassen.")
    betrag = min(betrag, summe)
    saetze = sorted(je_satz, key=lambda s: (-STEUERSAETZE.get(s, 0), s))
    roh = [(s, betrag * je_satz[s] / summe) for s in saetze]
    teile = {s: int(x) for s, x in roh}
    rest = betrag - sum(teile.values())
    for s, x in sorted(roh, key=lambda t: (-(t[1] - int(t[1])), -STEUERSAETZE.get(t[0], 0))):
        if rest <= 0:
            break
        teile[s] += 1
        rest -= 1
    return [{"steuersatz": s, "brutto_cent": teile[s]} for s in saetze if teile[s] > 0]


def rabatt_positionen(gutschein: str, betrag_cent: int, positionen: list[dict], letzte4: str | None = None) -> list[dict]:
    """Negative Rabattpositionen (Art „Rabatt“) je Steuersatz mit Bezug auf den Gutschein."""
    text = f"Rabattgutschein …{letzte4}" if letzte4 else "Rabattgutschein"
    return [
        {"art": RABATT_ART, "bezeichnung": text, "zusatz": "Entgeltminderung", "menge": 1, "einzel_brutto_cent": -t["brutto_cent"], "steuersatz": t["steuersatz"],
         "gutschein": gutschein, "bezug_doctype": "PH Gutschein", "bezug": gutschein}
        for t in rabatt_aufteilen(betrag_cent, positionen)
    ]


def einloese_steuersatz(pruef: dict) -> str | None:
    """Steuersatz der Einlösung aus ph_shop.gutschein.pruefen(): Einzweck → Satz der Ausgabe (Pflicht),
    Mehrzweck → None (Zahlart, kein Satz), Rabatt → None (Rabattposition)."""
    art = pruef.get("art") or "Mehrzweck"
    if art != "Einzweck":
        return None
    satz = pruef.get("steuersatz")
    if not satz or satz not in STEUERSAETZE or not STEUERSAETZE[satz]:
        raise KassenFehler(EINZWECK_OHNE_SATZ.format(pruef.get("gutschein") or ""))
    return satz


def gutscheine_umstellen(positionen: list[dict], zahlarten: list[dict], pruef_je_gutschein: dict[str, dict]) -> tuple[list[dict], list[dict], list[str]]:
    """Gutschein-Zahlarten/-Positionen nach Art des Gutscheins (Server, nie dem Client glauben):

    - Rabatt (mindert_entgelt): Zahlart/Position entfällt → Rabattposition(en) je Satz der Ware.
    - Einzweck: Position „Gutschein Einloesung“ erhält den Satz der Ausgabe.
    Betrag: Zahlart betrag_cent bzw. |brutto| der Position, gedeckelt auf den Restwert.
    → (positionen, zahlarten, hinweise)"""
    neue_pos, neue_zahl, hinweise = [], [], []
    rabatte: list[tuple[str, int, dict]] = []
    for z in zahlarten:
        g = z.get("gutschein")
        pr = pruef_je_gutschein.get(g) if (z.get("zahlart") == "Gutschein" and g) else None
        if pr and pr.get("mindert_entgelt"):
            rabatte.append((g, int(z.get("betrag_cent") or 0), pr))
            continue
        neue_zahl.append(z)
    for p in positionen:
        g = p.get("gutschein")
        pr = pruef_je_gutschein.get(g) if (p.get("art") == "Gutschein Einloesung" and g) else None
        if pr and pr.get("mindert_entgelt"):
            menge = 1.0 if p.get("menge") in (None, "") else float(p["menge"])
            rabatte.append((g, abs(int(round(menge * int(p.get("einzel_brutto_cent") or 0)))), pr))
            continue
        if pr:
            satz = einloese_steuersatz(pr)
            if satz:
                p = {**p, "steuersatz": satz}
        neue_pos.append(p)
    for g, betrag, pr in rabatte:
        betrag = min(betrag, int(pr.get("rest_cent") or betrag))
        if betrag <= 0:
            raise KassenFehler(f"Rabattgutschein {g}: kein Restwert.")
        rp = rabatt_positionen(g, betrag, neue_pos, pr.get("letzte4"))
        gekappt = sum(-x["einzel_brutto_cent"] for x in rp)
        if gekappt < betrag:
            hinweise.append(f"Rabattgutschein {g}: nur {gekappt / 100:.2f} € angerechnet (Warenwert).")
        neue_pos.extend(rp)
        hinweise.append(f"Rabattgutschein {g} mindert das Entgelt ({gekappt / 100:.2f} €) – keine Zahlung.")
        # Zahlbetrag sinkt um den Rabatt: Überzahlung der übrigen Zahlarten gleicht der Aufrufer aus
    return neue_pos, neue_zahl, hinweise


# ── Kundenkarte ──────────────────────────────────────────────────────────────

KARTE_MELDUNG = {
    "card_pending": "Karte ist beantragt, aber noch nicht übergeben.",
    "card_blocked": "Karte ist gesperrt.",
    "card_replaced": "Karte wurde ersetzt – neue Karte scannen.",
    "card_transferred": "Karte wurde übertragen.",
    "card_cancelled": "Karte ist gekündigt.",
    "card_merged": "Karte wurde zusammengeführt.",
    "card_inactive": "Karte ist nicht aktiv.",
    "limit_reached": "Vorteil: Limit für dieses Jahr erreicht – nicht eingelöst.",
    "tier_too_low": "Stufe reicht für diesen Vorteil nicht.",
    "benefit_not_in_tier": "Vorteil gehört nicht zur Stufe der Karte.",
    "benefit_inactive": "Vorteil ist nicht aktiv.",
    "not_found": "Karte oder Vorteil unbekannt.",
    "invalid": "Eingabe ungültig.",
    "forbidden": "Keine Berechtigung für die Kundenkarte.",
}


def karten_fehler(code: str | None, meldung: str | None = None, vorteil: str | None = None, http_status: int | None = None) -> dict:
    """ApiFehler der Kundenkarte → Kassa-Fehlerform (Oberfläche zeigt `meldung`, wertet `code` aus)."""
    code = code or "unavailable"
    text = (meldung if meldung and meldung != code else None) or KARTE_MELDUNG.get(code) or code
    out = {"code": code, "meldung": str(text)[:200], "http_status": int(http_status or 409)}
    if vorteil:
        out["vorteil"] = vorteil
    return out


# ── Ausstellungsstück (ph_logistik PH Lagerbestand) ──────────────────────────

UST_KLASSE_STEUERSATZ = {"normal": "Normal 20", "ermaessigt": "Ermaessigt-1 10"}


def ausstellungsstueck_position(bestand: dict, vk_cent: int | None = None, standard_satz: str = "Normal 20", ust_klasse: str | None = None) -> dict:
    """Position „Ausstellungsstück“ (Art Artikel) mit Bezug PH Lagerbestand. bestand: {name, produkt, produkt_name,
    marke, seriennummer, ausstellungsstueck, status, verfuegbar, vk_cent_ausstellung, zustand}.
    Ein bereits über ph_logistik als verkauft gebuchtes Stück (Status Verkauft) darf kassiert werden (bereits_gebucht)."""
    if not int(bestand.get("ausstellungsstueck") or 0):
        raise KassenFehler("Bestand ist kein Ausstellungsstück.")
    status = bestand.get("status") or ""
    if status in ("Ausgeschieden", "Gesperrt"):
        raise KassenFehler(f"Ausstellungsstück ist {status} – nicht verkäuflich.")
    if status == "Reserviert":
        raise KassenFehler("Ausstellungsstück ist reserviert – Reservierung zuerst freigeben.")
    preis = int(vk_cent if vk_cent not in (None, "", 0) else (bestand.get("vk_cent_ausstellung") or 0))
    if preis <= 0:
        raise KassenFehler("Ausstellungsstück ohne Verkaufspreis – Preis angeben.")
    zusatz = " · ".join(x for x in (bestand.get("marke"), f"S/N {bestand['seriennummer']}" if bestand.get("seriennummer") else None, bestand.get("zustand")) if x)
    return {
        "art": "Artikel",
        "produkt": bestand.get("produkt"),
        "bezeichnung": f"Ausstellungsstück: {bestand.get('produkt_name') or bestand.get('produkt') or bestand.get('name')}"[:140],
        "zusatz": zusatz[:140] or None,
        "menge": 1,
        "einzel_brutto_cent": preis,
        "steuersatz": UST_KLASSE_STEUERSATZ.get(ust_klasse or "", standard_satz),
        "bezug_doctype": "PH Lagerbestand",
        "bezug": bestand.get("name"),
        "lagerbestand_ref": bestand.get("name"),
        "ausstellungsstueck": 1,
        "bereits_gebucht": status == "Verkauft",
    }


def ausstellungsstuecke_im_beleg(positionen: list[dict]) -> list[dict]:
    """Positionen mit Bezug PH Lagerbestand (Ausstellungsstück) – Menge muss 1 sein."""
    out = []
    for p in positionen:
        if p.get("bezug_doctype") == "PH Lagerbestand" and p.get("bezug"):
            if float(p.get("menge") or 1) != 1:
                raise KassenFehler("Ausstellungsstück: Menge 1 je Stück.")
            out.append(p)
    namen = [p["bezug"] for p in out]
    if len(set(namen)) != len(namen):
        raise KassenFehler("Dasselbe Ausstellungsstück ist mehrfach im Beleg.")
    return out
