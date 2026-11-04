"""Nummernkreise und kurze Referenzen.

Zwei Arten von Kennungen (CONVENTIONS.md, Abschnitt 3):
  1. Belegnummern: Frappe naming_series, z. B. "PH-ANF-.YYYY.-.#####" → PH-ANF-2026-00001.
     Fortlaufend, lückenlos je Jahr (Faktura: Pflicht nach § 11 Abs 1 Z 3 lit b UStG).
  2. Kundenreferenzen: kurz, tippbar, ohne 0/O/1/I, z. B. "PT-7K3QX9" (Termin), "AG-…" (Agent),
     passend zur Website (src/lib/agent/appointment.py newReference, payments/codes.js ALPHABET).

NUMMERNKREISE ist die Quelle der Wahrheit: tools/check.py vergleicht jede DocType-JSON
(Feld naming_series.default) mit diesem Register; Abweichung = Fehler. Neue Serie zuerst hier
eintragen (Wunsch in ANFRAGEN-AN-CORE.md), dann in der DocType verwenden.
"""

import secrets

ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # 32 Zeichen, wie src/lib/payments/codes.js


def referenz(praefix, laenge=6):
    """Zufällige Kundenreferenz, z. B. referenz("PT") → "PT-7K3QX9"."""
    body = "".join(secrets.choice(ALPHABET) for _ in range(laenge))
    return f"{praefix}-{body}"


def normalisiere_code(wert):
    """Nutzereingabe eines Codes normalisieren: groß, ohne Leerzeichen/Bindestriche, O→0, I/L→1."""
    s = "".join(ch for ch in str(wert or "").upper() if ch.isalnum())
    return s.replace("O", "0").replace("I", "1").replace("L", "1")


# Nummernkreise je DocType (Stand 04.11.2026, abgeglichen mit allen DocType-JSONs der 11 Apps).
# Sortiert nach App in Installationsreihenfolge.
NUMMERNKREISE = {
    # ph_crm
    "PH Anfrage": "PH-ANF-.YYYY.-.#####",
    "PH Kontakt": "PH-KON-.#####",
    "PH Termin": "PH-TER-.YYYY.-.#####",
    "PH Beratungsgespraech": "PH-BG-.YYYY.-.#####",
    "PH Aufgabe": "PH-AUF-.YYYY.-.#####",
    # ph_sortiment
    "PH Herstellerbestellung": "HB-.YYYY.-.#####",
    "PH Wareneingang": "WE-.YYYY.-.#####",
    "PH Preisliste Import": "PH-PLI-.YYYY.-.####",
    # ph_projekte
    "PH Projekt": "PH-PRJ-.YYYY.-.####",
    "PH Planung": "PH-PLN-.YYYY.-.####",
    "PH Rendering": "PH-REN-.YYYY.-.####",
    "PH Rendering Feedback": "PH-FB-.YYYY.-.#####",
    "PH Projekt Nachricht": "PH-NAC-.YYYY.-.#####",
    "PH Produktpass": "PH-PP-.YYYY.-.#####",
    "PH Projekt Dokument": "PH-DOK-.YYYY.-.#####",
    "PH Montageauftrag": "PH-MON-.YYYY.-.####",
    "PH Fremdgewerk": "PH-GEW-.YYYY.-.####",
    "PH Abnahme": "PH-ABN-.YYYY.-.####",
    "PH Projekt Aufgabe": "PH-PAU-.YYYY.-.#####",
    "PH Projektzeit": "PH-PZT-.YYYY.-.#####",
    # ph_shop
    "PH Bestellung": "PH-S-.YY.MM.DD.-.#####",
    "PH Gutschein": "PH-GS-.YYYY.-.#####",
    "PH Zahlung": "PH-ZAH-.YYYY.-.#####",
    "PH Widerruf": "PH-WID-.YYYY.-.#####",
    "PH Retoure": "PH-RET-.YYYY.-.#####",
    # ph_faktura (PH Rechnung/PH Gutschrift: Entwurf = format:ENTW-…, Serie erst beim Stellen)
    "PH Angebot": "AN-.YYYY.-.#####",
    "PH Auftragsbestaetigung": "AB-.YYYY.-.#####",
    "PH Rechnung": "RE-.YYYY.-.#####",
    "PH Gutschrift": "GU-.YYYY.-.#####",
    "PH Mahnung": "MA-.YYYY.-.#####",
    "PH Eingangsrechnung": "ER-.YYYY.-.#####",
    "PH Export Lauf": "EX-.YYYY.-.####",
    "PH Bankimport": "BI-.YYYY.-.####",
    "PH Bankumsatz": "BU-.YYYY.-.######",
    "PH UVA Auswertung": "UVA-.YYYY.-.###",
    # ph_logistik
    "PH Lieferschein": "LS-.YYYY.-.#####",
    "PH Sendung": "PH-SND-.YYYY.-.#####",
    "PH Lagerbestand": "PH-LB-.#####",
    "PH Lagerbewegung": "PH-LBW-.YYYY.-.#####",
    "PH Inventur": "PH-INV-.YYYY.-.####",
    "PH Tour": "PH-TOUR-.YYYY.-.####",
    # ph_personal (PH Zeiterfassung gehört laut PLAN WP8 zu ph_personal)
    "PH Bewerbung": "PH-BEW-.YYYY.-.#####",
    "PH Bewerbungsgespraech": "PH-GSP-.YYYY.-.#####",
    "PH Mitarbeiter": "PH-MA-.####",
    "PH Zeiterfassung": "PH-ZEIT-.YYYY.-.######",
    "PH Abwesenheit": "PH-ABW-.YYYY.-.#####",
    # ph_marketing
    "PH Kampagne": "PH-KAM-.YYYY.-.####",
    "PH Newsletter Ausgabe": "PH-NL-.YYYY.-.###",
    "PH Social Beitrag": "PH-SOC-.YYYY.-.####",
    # ph_kassa (PH Kassenbeleg: kein Nummernkreis, Name = <Kassen-ID>-<Belegnummer>, Controller)
    "PH DEP Export": "PH-DEP-.YYYY.-.####",
    "PH Kassa Ereignis": "PH-KEV-.YYYY.-.#####",
    "PH Kassenabschluss": "KA-.YYYY.-.#####",
    "PH Kassenbuch": "KB-.YYYY.-.#####",
    # ph_service
    "PH Servicefall": "PH-SRV-.YYYY.-.#####",
    "PH Serviceeinsatz": "PH-SRE-.YYYY.-.#####",
    "PH Ersatzteil": "PH-ET-.#####",
    "PH Ersatzteilbestellung": "PH-ETB-.YYYY.-.#####",
    "PH Lieferantenregress": "PH-REG-.YYYY.-.#####",
    "PH Pflege Abo": "PFL-.YYYY.-.#####",
    "PH Serviceauftrag": "PH-SA-.YYYY.-.#####",
}

# Bekannte Kollisionen (gleiche Serie in zwei DocTypes → gemeinsamer Zähler in `tabSeries`,
# Nummern springen zwischen den DocTypes). Eingetragen, wie die JSONs es heute verwenden;
# Auflösung durch den Integrationsagenten (INTEGRATION-BEFUNDE-CORE.md). Solange ein Eintrag
# hier steht, meldet tools/check.py nur eine Warnung statt eines Fehlers.
GETEILTE_SERIEN = {}


def serie(doctype):
    """Serie einer DocType oder KeyError mit Hinweis auf ANFRAGEN-AN-CORE.md."""
    try:
        return NUMMERNKREISE[doctype]
    except KeyError:
        raise KeyError(f"Kein Nummernkreis für {doctype!r} – in ph_core/utils/naming.py eintragen (ANFRAGEN-AN-CORE.md).")
