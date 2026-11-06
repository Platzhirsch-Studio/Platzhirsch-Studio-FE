"""Projektnachkalkulation: Kostenarten + Platzhalter-Kostensätze auf bestehenden Sites (idempotent)."""


def execute():
    from ph_projekte.install import kalkulation_einrichten

    kalkulation_einrichten()
