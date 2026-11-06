"""Notbetrieb / Offline-Belege (RKSV § 17 Abs 1–3, BAO § 131b Abs 3; Fachkritik 21 R4) – ohne Frappe.

Fällt die Registrierkasse aus (Server nicht erreichbar und keine andere Kasse am Standort verfügbar), werden
Papier-Notbelege (Paragon mit Durchschrift, fortlaufend nummeriert) oder Offline-Puffer-Belege des Geräts
erteilt. Nach Wiederinbetriebnahme wird **jeder Notbeleg einzeln** als Standardbeleg nacherfasst (kein
Sammelbeleg über Umsätze), mit Kennzeichnung „Nacherfassung Notbeleg N-…“ und Datum/Uhrzeit des Notbelegs als
Zusatzangabe; Belegdatum der RKSV-Kette ist der Zeitpunkt der Nacherfassung (Kette ist streng zeitlich).
Die Papierdurchschriften sind 7 Jahre aufzubewahren (§ 132 BAO).
"""

from __future__ import annotations

from datetime import datetime

from .betraege import KassenFehler, beleg_pruefen

QUELLE = "Kassa-Notbetrieb"


def notbetrieb_zulaessig(kasse_erreichbar: bool, andere_kasse_online: bool) -> bool:
    """Notbelege nur, wenn weder diese noch eine andere Kasse am Standort buchen kann (R4)."""
    return not kasse_erreichbar and not andere_kasse_online


def pruefe_notbelege(belege: list[dict], jetzt: datetime, bereits_erfasst: set[str] | None = None, limit_cent: int | None = None) -> list[dict]:
    """Prüft und normalisiert Notbelege vor der Nacherfassung.

    beleg: {"notbeleg_nr": "N-0001", "zeitpunkt": "2026-11-04T10:15:00", "positionen": [...], "zahlarten": [...],
            "kontakt"?, "bediener"?}
    Regeln: Nummer Pflicht und eindeutig (auch gegen bereits erfasste), Zeitpunkt nicht in der Zukunft, Summen und
    Zahlarten wie ein normaler Beleg, keine Kartenzahlung über das Terminal (offline nicht möglich), optionales
    Gerätelimit (PH Geraet.ph_kassa_offline_limit_cent) je Beleg.
    """
    bereits = set(bereits_erfasst or ())
    gesehen: set[str] = set()
    out = []
    for b in belege or []:
        nr = (b.get("notbeleg_nr") or "").strip()
        if not nr:
            raise KassenFehler("Notbeleg ohne Nummer.")
        if nr in gesehen or nr in bereits:
            raise KassenFehler(f"Notbeleg {nr} ist doppelt bzw. bereits nacherfasst.")
        gesehen.add(nr)
        try:
            zeit = datetime.fromisoformat(str(b.get("zeitpunkt")))
        except (TypeError, ValueError):
            raise KassenFehler(f"Notbeleg {nr}: Zeitpunkt fehlt oder ist ungültig.") from None
        if zeit.tzinfo is not None:
            zeit = zeit.replace(tzinfo=None)
        if zeit > jetzt:
            raise KassenFehler(f"Notbeleg {nr}: Zeitpunkt liegt in der Zukunft.")
        if any(z.get("zahlart") == "Karte Stripe Terminal" for z in b.get("zahlarten") or []):
            raise KassenFehler(f"Notbeleg {nr}: Terminal-Kartenzahlung ist offline nicht möglich (Karte extern verwenden).")
        s = beleg_pruefen(b.get("positionen") or [], b.get("zahlarten") or [])
        if limit_cent is not None and int(limit_cent) and s["gesamt_cent"] > int(limit_cent):
            raise KassenFehler(f"Notbeleg {nr}: Betrag über dem Offline-Limit des Geräts.")
        zusatz = f"Nacherfassung Notbeleg {nr} vom {zeit:%d.%m.%Y %H:%M}"
        positionen = []
        for p in s["positionen"]:
            p = dict(p)
            p["zusatz"] = (f"{p.get('zusatz')} · " if p.get("zusatz") else "") + zusatz
            positionen.append(p)
        out.append({**b, "notbeleg_nr": nr, "zeitpunkt": zeit, "positionen": positionen, "zahlarten": s["zahlarten"], "gesamt_cent": s["gesamt_cent"], "zusatz": zusatz})
    return sorted(out, key=lambda x: x["zeitpunkt"])
