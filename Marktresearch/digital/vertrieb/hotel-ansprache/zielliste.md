# Zielliste Hotels – Erläuterung

**Stand:** 29.10.2026 · **Status:** Entwurf – nichts versendet, niemand kontaktiert
**Datei:** `zielliste.csv` (Semikolon, UTF-8). Für Excel: über „Daten → Aus Text/CSV“ öffnen und UTF-8 wählen, sonst stimmen die Umlaute und Sterne nicht.

## Was drinsteht

- **70 Häuser.** Nur Betriebe, keine Namen von Inhabern oder Mitarbeitenden.
- **Verteilung:** Arlberg 20 · Bodensee DE 21 · Bregenzerwald 12 · Bodensee AT 6 · Montafon 4 · Kleinwalsertal 3 · Bodensee CH 2 · Rheintal 1 · Liechtenstein 1.
- **Segmente:** Wellness & Spa 29 · Seehotel/Boutique 18 · Arlberg/Chalets & Ferienwohnungen 15 · Gastronomie 5 · Apartmenthotel 2.
- **Spalte „Saison/Umbau-Hinweis“:** nur gefüllt, wenn es eine öffentliche Quelle mit Datum gibt. Sonst bleibt sie leer. Ein leeres Feld heißt also nicht „kein Umbau“, sondern „nichts Öffentliches gefunden“.
- **Spalte „Stand“:** Tag der Recherche.

## Wie belastbar die Kategorien sind

| Beleg | Anzahl | Bewertung |
|---|---|---|
| Offizielle Liste Hotelsterne Austria (WKO: [4★S](https://www.wko.at/hotelsterne/vier-sterne-superior-hotels), [5★](https://www.wko.at/hotelsterne/fuenf-sterne-hotels-in-oesterreich), [5★S](https://www.wko.at/hotelsterne/fuenf-sterne-superior-hotels)) bzw. WKO-Meldung | 32 | belastbar |
| HotellerieSuisse / swisshotels.com | 2 | belastbar |
| Tourismusportal (lindau.de, bodensee.de, vorarlberg.travel), Fachpresse oder Eigenangabe der Website | 18 | brauchbar, nicht amtlich |
| Buchungs- oder Drittportal bzw. offen | 18 | Kategorie mit **[prüfen]** markiert |

**Wichtig:** Für Deutschland ist **keine** Kategorie direkt in der DEHOGA-Datenbank (hotelstars.eu) geprüft. Die Suche dort läuft über JavaScript und ließ sich nicht abrufen. 4★ ohne „Superior“ in Österreich ist ebenfalls nicht amtlich geprüft, weil es dafür keine abrufbare WKO-Liste gibt. In Briefen die Kategorie deshalb **nicht** nennen. Sie dient nur der Auswahl.

## Leads aus Datei 22 (übernommen, ohne Personennamen)

| Datei 22 | Haus | Hinweis |
|---|---|---|
| H13 | Hotel Central, Schaan | Fertigstellung Anfang 2027, 8 Serviced Apartments mit Küche. Betreiber und Kategorie [prüfen] |
| H23 | Hotel Engel, Langenargen | Hotel ab Ostern 2027. Bestellfenster läuft jetzt |
| H22 | Hotel Gierer, Wasserburg | Stufe 1 bis Ostern 2027, Stufe 2 ab 2028 |
| H6 | Hotel Panorama, Lech | neue Lobby, Bar, Kamin und Wohnung, Termin offen |
| H24 | Hotel-Gasthof Zur Kapelle, Kressbronn | Gemeinde als Käuferin, Pächter offen [teilweise verifiziert] |
| H7 | Hotel Hirlanda, Zürs | Verkauf. Ansprache erst nach Käuferwechsel |
| H4 | Hotel Steffisalp, Warth | Betreiber 1912 Hotels. Nur Outdoor 2027 |
| H8 | Hotel Kristberg, Lech | eröffnet 12/2025. Nur Nachrüstung |
| H10 | Hotel Ma.Ma, Bregenz | eröffnet 07/2026. Nur Nachrüstung |

**Nicht in die CSV übernommen**, weil es (noch) keinen Betrieb gibt: H11 Hotel in Hard (Bauherr offen), H12 Hotelprojekt Bregenz mit 107 Zimmern [nicht verifiziert], H1 Schruns, H16 Ekkehard St. Gallen. Diese bleiben in Datei 22 unter Beobachtung. Ketten wie Motel One, Légère, Dorint und B&B sind nach dem Muss-Kriterium aus hotel-contract.md 3.3 ausgeschlossen.

## Bewusst weggelassen

- **Ketten oder zentrale Einkäufe:** Grand Hotel Bregenz (MGallery), Thurnher's Alpenhof Zürs (A-ROSA Collection), A-ROSA Ifen, Falkensteiner Montafon, Four Points Dornbirn, Vienna House Dornbirn, VAYA Post Gaschurn, Steigenberger Konstanz, Hotel 47° und Buff Medical Resort Konstanz.
- **Unter 4★ oder nicht belegt:** Häuser in Rorschach, Altenrhein, Arbon, Kreuzlingen und Hard. Für **Hard** wurde **kein** 4★-Haus gefunden. Kandidat ist das Hotel am See, Kategorie [prüfen].
- **Nur über Buchungsportale belegt** und deshalb vorerst draußen: Gasthof Lamm Bregenz, Hotel Swiss Kreuzlingen, Zur Winzerstube Hagnau, Lindauer Hof Lindau, Seemöwe Güttingen, Krone Au, Burg Vital Resort Oberlech.

## Offene Punkte [prüfen]

1. **DEHOGA-Sterne** für alle 21 Häuser am DE-Ufer in hotelstars.eu nachsehen (manuell im Browser).
2. **4★-Häuser in AT ohne Superior:** Panorama Lech, Hirlanda, Steffisalp, Mondschein, Schwärzler, Messmer, Krone Hittisau in der WKO-Suche nach Bundesland prüfen.
3. **Fehlende Websites:** Kaiserstrand (SSL-Fehler), Ma.Ma, Engel, Sonnenhof, Kapelle, City Krone, Warther Hof, Central Schaan.
4. **Betreiber bzw. Einkaufsweg** bei Kaiserstrand (pepper-collection), Seegut Zeppelin (Design Hotels), Steffisalp (1912 Hotels): Wird regional entschieden? Sonst nach Muss-Kriterium streichen.
5. **Umbauhinweise ohne Datum:** Damülser Hof (laufender Umbau), Posthotel Taube (neues Wellnesshaus), Post Lech (Renovierung 2025/26), Biberkopf (Eröffnungsjahr). Presse mit Datum suchen.
6. **Lücken:** Arlberg-4★S-Häuser noch nicht erfasst (laut WKO-Liste u. a. in Lech, Oberlech und St. Anton). Montafon außerhalb von Schruns. Rheintal (Feldkirch, Hohenems). Weitere Häuser in Liechtenstein.
7. **Scoring** (hotel-contract.md 3.3) ist noch **nicht** je Haus gerechnet. Dafür fehlen Entscheider, Architekt und Bonität. Das gehört ins CRM, siehe `gespraechsleitfaden.md`.

## Quellen-Pflege

Wöchentlich 30 Minuten (hotel-contract.md 3.3): tageskarte.io, vol.at, schwaebische.de, stgallen24.ch, Kundmachungen der Bauämter. Neue Hinweise mit URL und Datum in die Spalte „Saison/Umbau-Hinweis“ eintragen und „Stand“ aktualisieren.
