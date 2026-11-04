# Quellen RKSV (nur Links – keine Fremddokumente im Repo, Lizenz unklar)

- RKSV, BGBl. II Nr. 410/2015 idgF (RIS): https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20009390
- § 131b, § 132a BAO (RIS): https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10003940
- BMF Registrierkassen (Erlass, FAQ, Belegcheck-App, FinanzOnline-Registrierung): https://www.bmf.gv.at/themen/steuern/registrierkassen.html
- BMF/A-SIT „Detailspezifikation zur RKSV“ und Mustercode (Apache 2.0): https://github.com/a-sit-plus/at-registrierkassen-mustercode
  – Abschnitte: Belegsignatur (4), Umsatzzähler AES-256-ICM (5), Verkettung (6), DEP7 (7), Ausfall (8), QR/OCR (12)
- A-Trust a.sign RK Online, Schnittstellenbeschreibung (Kundenbereich A-Trust; Test-URL hs-abnahme.a-trust.at): https://www.a-trust.at/de/produkte/registrierkassen/
- BMF Belegcheck-App (iOS/Android) – Prüfung Startbeleg, Jahresbeleg; Prüfungs-Code aus FinanzOnline.

Stand 04.11.2026. Vor Produktivbetrieb: aktuelle Fassung der Detailspezifikation gegen `ph_kassa/rksv/beleg.py`
(Codeformat, Regex) und `counter.py` (IV, Zählerlänge) abgleichen; Startbeleg mit Belegcheck-App prüfen.
