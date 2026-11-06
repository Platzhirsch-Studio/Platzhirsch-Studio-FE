"""GlBG § 9 Abs 2 – Entgeltangabe im Stelleninserat (Marktfunktionen-Nachtrag A15) – reine Prüflogik.

Pflicht: KV-/gesetzliches Mindestentgelt (Cent > 0), Zeitraum (Monat/Jahr/Stunde), Kollektivvertrag bzw.
Rechtsgrundlage und die Angabe zur Bereitschaft zur Überzahlung (ja/nein oder eigener Wortlaut).
Verstoß: Verwaltungsstrafe nach § 10 Abs 3 GlBG. Website-Regel: src/components/Karriere/glbg.js.
Stundenlohn-Stellen (Zeitraum „Stunde“) sind gleichwertig veröffentlichbar: Die Website kann „Stunde“ seit
04.11.2026 (src/lib/karriere/stellen.js SALARY_UNIT HOUR, src/lib/karriere/texte.js in 4 Sprachen); die frühere
Ausblendung ist aufgehoben (60-website-backend-umstellung.md, Lücke ph_personal 1). karriere_data liefert
salary_unit "HOUR" und entgelt.zeitraum "Stunde".
"""

ZEITRAEUME = ("Monat", "Jahr", "Stunde")
UEBERZAHLUNG = ("ja", "nein")
SALARY_UNIT = {"Monat": "MONTH", "Jahr": "YEAR", "Stunde": "HOUR"}


def entgelt_fehlt(kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text=""):
    """Liste der fehlenden Bestandteile (leer = vollständig)."""
    fehlt = []
    try:
        betrag = int(kv_mindest_brutto_cent or 0)
    except (TypeError, ValueError):
        betrag = 0
    if betrag <= 0:
        fehlt.append("Mindestentgelt (Betrag)")
    if zeitraum not in ZEITRAEUME:
        fehlt.append("Zeitraum (Monat, Jahr oder Stunde)")
    if not str(kollektivvertrag or "").strip():
        fehlt.append("Kollektivvertrag bzw. Rechtsgrundlage")
    if ueberzahlung not in UEBERZAHLUNG and not str(ueberzahlung_text or "").strip():
        fehlt.append("Bereitschaft zur Überzahlung (ja/nein oder eigener Wortlaut)")
    return fehlt


def entgelt_vollstaendig(*args, **kwargs):
    return not entgelt_fehlt(*args, **kwargs)


def darf_veroeffentlichen(status, kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text=""):
    """Status „Aktiv“ / Website-Ausgabe / API nur mit vollständiger Entgeltangabe."""
    return status == "Aktiv" and entgelt_vollstaendig(kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text)
