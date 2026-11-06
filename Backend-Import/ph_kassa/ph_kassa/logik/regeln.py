"""Fachregeln eines Kassenbelegs vor dem Buchen – ohne Frappe.

Quellen: Marktresearch/digital/backoffice/21-kritik-fach-kassa.md (P4 Rechnung ab 400 €, P5 Einzweck/Mehrzweck,
P7 Retoure, §5 Randfälle: Anzahlung nur mit Auftrag, Überzahlung, Gutschein Verkauf + Einlösung im selben Bon,
Bar ab 10.000 € Identität nach § 365m ff. GewO), 50-backend-luecken-kassa-faktura.md.

`pruefe(entwurf, einst)` liefert {"fehler": [...], "freigaben": [...], "hinweise": [...]}:
- fehler: Buchung unmöglich (Server wirft),
- freigaben: Buchung nur mit Leitungsfreigabe (PIN), Codes stabil für die Oberfläche,
- hinweise: Text für die Ergebnis-Karte (z. B. FAGG-Rücktrittsfrist).
"""

from __future__ import annotations

from .betraege import NEGATIVE_ARTEN

ZAHLUNG_AUF_AUFTRAG = ("Anzahlung", "Teilzahlung", "Schlusszahlung")

# Codes der Freigaben (Oberfläche zeigt den Text, Leitung gibt mit PIN frei)
FREIGABE_TEXTE = {
    "rabatt": "Rabatt über der Freigabegrenze",
    "ueberzahlung": "Anzahlung übersteigt das offene Soll",
    "retoure_bar": "Rückzahlung in bar",
    "retoure_ohne_beleg": "Rücknahme ohne Originalbeleg",
    "storno_fremd": "Storno eines fremden oder älteren Belegs",
    "storno_betrag": "Storno über der Mitarbeiter-Grenze",
}


def pruefe(entwurf: dict, einst: dict) -> dict:
    """entwurf: {positionen (berechnet), zahlarten, kontakt, auftrag, rechnung, gesamt_cent, empfaenger (dict|None),
    identitaet (dict|None), auftrag_offen_cent (int|None), vertragsort (str|None), fagg_frist_ende (str|None),
    retoure_original (bool), rabatt_freigabe_index (list)}.
    einst: Kassa-Einstellungen (dict aus einstellungen()).
    """
    fehler, freigaben, hinweise = [], [], []
    pos = entwurf.get("positionen") or []
    zahl = entwurf.get("zahlarten") or []
    arten = [p.get("art") for p in pos]
    gesamt = int(entwurf.get("gesamt_cent") or 0)
    gutscheinart = einst.get("gutschein_art") or "Mehrzweck"

    # Zahlungen auf Auftrag/Rechnung
    if any(a in ZAHLUNG_AUF_AUFTRAG for a in arten):
        if not (entwurf.get("auftrag") or entwurf.get("rechnung")):
            fehler.append("Anzahlung/Teil-/Schlusszahlung nur mit Auftrag oder Rechnung – ohne Auftrag: Gutschein verkaufen.")
        offen = entwurf.get("auftrag_offen_cent")
        summe = sum(int(p.get("brutto_cent") or 0) for p in pos if p.get("art") in ZAHLUNG_AUF_AUFTRAG)
        if offen is not None and summe > int(offen):
            freigaben.append("ueberzahlung")
        if entwurf.get("vertragsort") == "Beim Kunden" and entwurf.get("fagg_frist_ende"):
            hinweise.append(f"Außergeschäftsraumvertrag (FAGG): Rücktritt bis {entwurf['fagg_frist_ende']} möglich – Anzahlung wäre rückzuzahlen.")

    # Gutscheine
    if "Gutschein Verkauf" in arten and ("Gutschein Einloesung" in arten or any(z.get("zahlart") == "Gutschein" for z in zahl)):
        fehler.append("Gutschein verkaufen und einlösen im selben Beleg ist nicht möglich – der neue Gutschein gilt erst nach dem Buchen.")
    if gutscheinart == "Einzweck" and any(z.get("zahlart") == "Gutschein" for z in zahl):
        fehler.append("Einzweck-Gutscheine werden als Position „Gutschein Einlösung“ eingelöst, nicht als Zahlart.")
    if gutscheinart == "Mehrzweck" and "Gutschein Einloesung" in arten:
        fehler.append("Mehrzweck-Gutscheine werden als Zahlart „Gutschein“ eingelöst, nicht als Position.")
    for p in pos:
        if p.get("art") == "Gutschein Einloesung" and not p.get("gutschein"):
            fehler.append("Gutschein-Einlösung ohne geprüften Gutschein.")
        if p.get("art") == "Gutschein Verkauf" and int(p.get("brutto_cent") or 0) <= 0:
            fehler.append("Gutschein-Verkauf braucht einen Wert größer 0.")

    # Retoure
    if "Retoure" in arten:
        if not entwurf.get("retoure_original"):
            freigaben.append("retoure_ohne_beleg")
        if gesamt < 0 and any(z.get("zahlart") == "Bar" for z in zahl) and int(einst.get("retoure_bar_nur_leitung", 1)):
            freigaben.append("retoure_bar")
        for p in pos:
            if p.get("art") == "Retoure" and not (p.get("zusatz") or "").strip():
                fehler.append("Retoure braucht einen Grund (Umtausch, Mangel, Kulanz …).")
                break
    if gesamt < 0 and not any(a in NEGATIVE_ARTEN for a in arten):
        fehler.append("Negativer Beleg nur mit Retoure oder Gutschein-Einlösung (Storno über „Stornieren“).")

    # Rabatt
    if entwurf.get("rabatt_freigabe_index"):
        freigaben.append("rabatt")

    # Rechnungspflicht ab Grenze (§ 11 Abs 6 UStG: Kleinbetragsrechnung nur bis 400 € brutto)
    grenze = int(einst.get("barverkauf_rechnung_ab_cent") or 40000)
    umsatz = sum(int(p.get("brutto_cent") or 0) for p in pos if p.get("art") not in ZAHLUNG_AUF_AUFTRAG + ("Gutschein Verkauf",))
    if umsatz > grenze and not entwurf.get("rechnung"):
        emp = entwurf.get("empfaenger") or {}
        if not (entwurf.get("kontakt") or (emp.get("name") and emp.get("strasse") and emp.get("ort"))):
            fehler.append("Beleg über {:.2f} € braucht einen Rechnungsempfänger mit Name und Anschrift (§ 11 UStG).".format(grenze / 100))
        uid_grenze = int(einst.get("uid_empfaenger_ab_cent") or 1000000)
        if umsatz > uid_grenze and emp and emp.get("ist_unternehmer") and not emp.get("uid"):
            fehler.append("Über 10.000 € braucht die Rechnung an Unternehmer die UID des Empfängers.")

    # Bargeld ab 10.000 € (§ 365m ff. GewO: Händler stellen die Identität fest)
    bar_grenze = int(einst.get("bar_identitaet_ab_cent") or 1000000)
    bar = sum(abs(int(z.get("betrag_cent") or 0)) for z in zahl if z.get("zahlart") == "Bar")
    if bar >= bar_grenze:
        ident = entwurf.get("identitaet") or {}
        if not (ident.get("art") and ident.get("nummer") and (entwurf.get("kontakt") or ident.get("name"))):
            fehler.append("Barzahlung ab {:.2f} €: Identität feststellen (Ausweisart, Nummer, Name) – § 365m ff. GewO.".format(bar_grenze / 100))

    return {"fehler": fehler, "freigaben": sorted(set(freigaben)), "hinweise": hinweise}


def storno_freigabe(beleg: dict, bediener: str, heute, leitung: bool, grenze_cent: int) -> list[str]:
    """Welche Freigaben braucht ein Storno? beleg: {bediener, datum (date), gesamt_cent}. Leitung braucht keine.
    Mitarbeiter: eigener Beleg von heute bis zur Grenze (0 = Mitarbeiter-Storno aus)."""
    if leitung:
        return []
    out = []
    if beleg.get("bediener") != bediener or beleg.get("datum") != heute:
        out.append("storno_fremd")
    if not int(grenze_cent or 0) or abs(int(beleg.get("gesamt_cent") or 0)) > int(grenze_cent):
        out.append("storno_betrag")
    return out
