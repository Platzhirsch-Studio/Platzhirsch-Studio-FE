"""Stripe Radar – Betrugsprüfung nur als Anzeige (reine Logik, ohne Frappe).

Quelle: Stripe Charge-Objekt `outcome` (risk_level normal|elevated|highest|not_assessed|unknown, risk_score 0–99,
type authorized|manual_review|issuer_declined|blocked|invalid, seller_message) sowie Ereignisse
`review.opened`/`review.closed` und `radar.early_fraud_warning.created`.
Das Backoffice entscheidet nichts automatisch: es markiert und zeigt (Listenindikator „Risiko prüfen“).
"""

RISK_LEVELS = ("normal", "elevated", "highest", "not_assessed", "unknown")
SCHWELLE_SCORE = 65  # Stripe: ab 65 „elevated“, ab 75 „highest“ (Standard-Regeln)


def aus_charge(charge):
    """Charge-dict → {radar_risk_level, radar_risk_score, radar_outcome, radar_hinweis} (nur vorhandene Werte)."""
    outcome = (charge or {}).get("outcome") or {}
    out = {}
    level = outcome.get("risk_level")
    if level:
        out["radar_risk_level"] = level if level in RISK_LEVELS else "unknown"
    if outcome.get("risk_score") is not None:
        try:
            out["radar_risk_score"] = max(0, min(99, int(outcome.get("risk_score"))))
        except (TypeError, ValueError):
            pass
    if outcome.get("type"):
        out["radar_outcome"] = str(outcome.get("type"))[:40]
    if outcome.get("seller_message"):
        out["radar_hinweis"] = str(outcome.get("seller_message"))[:140]
    return out


def markiert(risk_level=None, risk_score=None, outcome=None, warnung=False, review_offen=False):
    """True, wenn ein Mensch hinsehen soll (Anzeige, keine Sperre)."""
    if warnung or review_offen:
        return True
    if risk_level in ("elevated", "highest"):
        return True
    if outcome in ("manual_review", "blocked"):
        return True
    try:
        return risk_score is not None and int(risk_score) >= SCHWELLE_SCORE
    except (TypeError, ValueError):
        return False


def stufe(risk_level=None, risk_score=None, outcome=None, warnung=False, review_offen=False):
    """Anzeige-Stufe: 'hoch' | 'erhoeht' | 'normal' | None (keine Daten)."""
    if warnung or risk_level == "highest" or outcome == "blocked":
        return "hoch"
    if markiert(risk_level, risk_score, outcome, warnung, review_offen):
        return "erhoeht"
    if risk_level or risk_score is not None:
        return "normal"
    return None
