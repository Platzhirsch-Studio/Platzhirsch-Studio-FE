"""DSGVO Art. 17 – Löschen/Anonymisieren von Service-Daten mit Aufbewahrungsausnahmen (Art. 17 Abs 3 lit b/e) – reine Logik.

Regeln (vor Produktivgang mit der Kanzlei bestätigen, s. README „Offene Punkte“):
- Offener Servicefall/Regress/Einsatz → aufbewahren (laufende Vertragserfüllung).
- Erledigter Servicefall → aufbewahren bis Ende der längsten Frist: Verjährung der Gewährleistung (§ 933 Abs 3 ABGB,
  § 10 Abs 2 VGG), Herstellergarantie + 3 Monate, Regress absolut 5 Jahre ab Lieferung an den Händler (§ 933b ABGB),
  danach anonymisieren (Statistik Fehlercode/Marke bleibt).
- Kosten/Gutschriften/Rechnungen sind Belege in ph_faktura (BAO § 132: 7 Jahre) – nicht hier; Servicefall verweist nur.
- Pflege-/Wartungsvertrag aktiv/pausiert → aufbewahren; beendet/gekündigt → anonymisieren.
"""

from datetime import date

from ph_service.ph_service.fristen import monate_dazu

ANONYMISIEREN = "anonymisieren"
AUFBEWAHREN = "aufbewahren"
LOESCHEN = "loeschen"

OFFENE_FAELLE = ("Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant")


def _d(wert):
    if not wert:
        return None
    if isinstance(wert, date):
        return wert if not hasattr(wert, "date") else wert.date()
    return date.fromisoformat(str(wert)[:10])


def servicefall(status, verjaehrung_bis=None, garantie_bis=None, regress_absolut_bis=None, regress_offen=False, heute=None):
    """→ (aktion, grund, frist_bis)."""
    heute = _d(heute) or date.today()
    if status in OFFENE_FAELLE:
        return AUFBEWAHREN, "Servicefall offen (Vertragserfüllung)", None
    if regress_offen:
        return AUFBEWAHREN, "Lieferantenregress offen (§ 933b ABGB)", None
    kandidaten = []
    if _d(verjaehrung_bis):
        kandidaten.append((_d(verjaehrung_bis), "Gewährleistung bis Verjährung (§ 933 ABGB / § 10 VGG)"))
    if _d(garantie_bis):
        kandidaten.append((monate_dazu(_d(garantie_bis), 3), "Herstellergarantie + 3 Monate"))
    if _d(regress_absolut_bis):
        kandidaten.append((_d(regress_absolut_bis), "Regress absolut 5 Jahre (§ 933b ABGB)"))
    if kandidaten:
        frist, grund = max(kandidaten)
        if frist >= heute:
            return AUFBEWAHREN, grund, frist
    return ANONYMISIEREN, "Fristen abgelaufen – Personendaten entfernen, Statistik bleibt", None


def vertrag(status):
    if status in ("Aktiv", "Pausiert", "Angeboten"):
        return AUFBEWAHREN, "Vertrag läuft", None
    return ANONYMISIEREN, "Vertrag beendet", None


def einsatz(status, fall_aktion=None):
    """Einsatz folgt dem Servicefall (Bericht ist Beweis zur Gewährleistung); ohne Fall wie beendeter Vertrag."""
    if status in ("Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"):
        return AUFBEWAHREN, "Einsatz offen", None
    if fall_aktion == AUFBEWAHREN:
        return AUFBEWAHREN, "Servicefall wird aufbewahrt", None
    return ANONYMISIEREN, "Einsatz abgeschlossen", None
