"""Rechenwerk der Faktura – reine Logik ohne Frappe-Import (testbar mit python -m unittest).

Module:
  steuer     Positions- und Summenberechnung in Cent, USt-Fall (AT/OSS/igL/RC/Ausfuhr), Kleinbetrag
  anzahlung  Anzahlungsverrechnung je USt-Satz (Schluss- und Teilrechnung, marahrw7-Prinzip)
  epc        EPC-QR (GiroCode) Text für Überweisungen
  camt       CAMT.053-Parser (ISO 20022) und Zuordnungsvorschlag Bank → Beleg
  export     BMD-CSV und DATEV-Buchungsstapel (EXTF) mit Prüfsummen
  nummern    Lückenprüfung fortlaufender Belegnummern
  mahnen     Mahnstufe und Verzugszinsen
"""
