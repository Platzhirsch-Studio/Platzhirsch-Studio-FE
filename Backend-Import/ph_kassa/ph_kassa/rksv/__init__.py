"""RKSV-Kern der App ph_kassa (Arbeitspaket WP10a).

Rechtsgrundlage: § 131b BAO, Registrierkassensicherheitsverordnung (RKSV, BGBl. II 410/2015 idgF),
BMF „Detailspezifikation zur RKSV“ (A-SIT) – Belegsignatur, Verkettung, Umsatzzähler, DEP7.

Module ohne Frappe-Import (testbar per `python -m unittest` ohne Site):
  counter.py       AES-256-CTR-Umsatzzähler (IV aus Kassen-ID + Belegnummer), TRA/STO
  beleg.py         maschinenlesbarer Code, Betragformat, Verkettung, JWS-Zusammenbau, QR/OCR
  signer.py        Signer-Schnittstelle, Software-Signer (EC P-256, Test), Ausfall-Signer, Verifikation
  atrust.py        A-Trust a.sign RK Online (REST-Client, Test-/Produktivumgebung, Timeout → Ausfall)
  dep.py           DEP7-Export („Belege-Gruppe“) + Prüfsumme + Strukturprüfung
  pruefung.py      Verifikation einer Belegkette (Signatur, Verkettung, Zähler) – Simulation Belegcheck
  finanzonline.py  Registrierungsdaten (AES-Prüfwert, Kassen-ID, SEE) und Belegcheck-Hinweise

Module mit Frappe (nur auf einer Site lauffähig):
  buchung.py       erzeuge_beleg(...) atomar: Sperre Kasse → Nummer → Zähler → Code → Signatur → Speichern;
                   Startbeleg, Nullbeleg, Monats-/Jahres-/Schlussbeleg, Storno, Sammelbeleg nach Ausfall
  see.py           Signer für eine PH Signatureinheit bauen (A-Trust / Test / Ausfall)
  tasks.py         Scheduler: Monats-/Jahresbeleg, Erinnerungen, Ausfallüberwachung
  api.py           whitelisted Methoden für die Kassen-Oberfläche (WP10b)
"""

PRAEFIX = "_R1"
AUSFALL_TEXT = "Sicherheitseinrichtung ausgefallen"
BELEGARTEN = (
    "Standard",
    "Startbeleg",
    "Nullbeleg",
    "Monatsbeleg",
    "Jahresbeleg",
    "Schlussbeleg",
    "Sammelbeleg",
    "Stornobeleg",
    "Trainingsbeleg",
)
# Belegarten mit Betrag 0, die den aktuellen Zählerstand tragen (RKSV § 7 Abs 1 Z 2, § 8)
NULLBELEGARTEN = ("Startbeleg", "Nullbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg")
