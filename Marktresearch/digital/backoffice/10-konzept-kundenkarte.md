# 10 – Konzept Bereich „Kundenkarte“ (Next-Backoffice, `backoffice/`, Port 3100) – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Kundenkarte (Karten, Stufen, Leistungsvorteile ohne Geldwert, Einlösungen, Anträge, Einwilligung, Wallet, Lebenszyklus Ersatz/Übertragung/Zusammenführung) inklusive Bauauftrag. Für den Bereichs-Agenten (Routen, Komponenten, Server Actions), den Fundament-Agenten (Scan-Tor, Undo, Kundenmodus) und die Agenten Kassa, Logistik, CRM, Faktura (Schnittstellen). Frappe-App `ph_kundenkarte` ist die Datenschicht und bleibt unsichtbar.
**Stand:** 2026-11-04 · Rolle: Produktdesigner (Überarbeitung) · Status: **final zur Umsetzung**, offene Inhaber-/Kanzlei-/Steuerberater-Fragen in §15. Alle Pflichtänderungen aus `20-kritik-ux-kundenkarte.md` (P1–P30) und `21-kritik-fach-kundenkarte.md` (F1–F13, P1–P16, PR1–PR11, B1–B11, §8) sind eingearbeitet; Nachweis im Änderungsprotokoll (§17).
**Gelesen/geprüft:** 01–05, `10-konzept-kassa.md`, `PLAN-NEXT-BACKOFFICE.md` §8–§10, `Backend-Import/ph_kundenkarte` (README, alle DocType-JSONs, Controller, `api/__init__.py`, `api/backoffice.py`, `umsatz.py`, `tasks.py`, `kennzahlen.py`, `lebenszyklus.py`, `kontakt.py`, `utils/karte.py`, `utils/kartenregeln.py`), `backoffice/src` (Fundament: `frappe/client.js`, `auth/dal.js`, `auth/rechte.js`, `Kiosk/hooks.js`, `bereiche.js`).

**Backend-Stand 04.11. (neu gegen den Code geprüft – die Kritiken kannten ihn teils noch nicht):** vorhanden sind inzwischen `sperren(grund, sperrgrund_art)` mit Sperrgrund-Katalog, `ersatzkarte_ausstellen`, `uebertragen`, `zusammenfuehren_mit`, `karte_uebergeben`/`api.hand_over_card`, `api.cancel_redemption`, `annehmen(kontakt, stufe, aktiv, sofort_aktiv)`, Ereignisse `Einwilligung`/`Widerruf`/`Ersatzkarte`/`Uebergabe`/`Einloesung storniert`/`Anonymisierung`, Storno-Kaskade bei Stornobeleg/Cancel/Bestellung storniert, `geburtstag_tag_monat` mit 28.02.-Regel, Antrag-Felder `nachweis` (Attach) + `nachweis_art`, Antrag-Quellen `event`/`backoffice`, Kassa-Recht `create` auf Antrag, `KASSA_ROLLEN` inkl. Logistik, Limits über die Vorgänger-Kette, Backoffice-Methoden `wallet_status`, `umsatz_alle_neu_berechnen`, `stufenplan_vorschau`, `stammdaten_anlegen`, `dubletten_finden`, `sperrgruende`, `karten_zusammenfuehren`, Number Card „Einlösungen 30 Tage“ als Methode `kennzahlen.einloesungen_30_tage`, Anonymisieren über ph_crm-Hook. **Weiterhin fehlend** (blockiert Livegang, §9.3): Umsatzregeln B1–B8, `einwilligung_erteilen` mit Nachweis, Feldrechte (Umsatz permlevel 1, `kontakt` set_only_once, Stufe nur Leitung), `stufe_manuell_grund`, `ablehnungsgrund`, `datenschutzinfo_version`, `volljaehrig_bestaetigt`, E-Mail optional für Showroom, Einlösungs-Status `Zugesagt` + Bezüge AB/Lieferschein/Montageauftrag, Kassen-Position „Kartenleistung“, `vorteil_pruefen`, Sperre gegen Wettlauf, Wallet „ungültig“, Kanalprüfung bei Aufgaben.

**Bauprinzip „Fähigkeit aus Meta“:** Die UI wird jetzt gegen das Zielmodell gebaut. Jede Funktion, die ein noch fehlendes Feld/Methode braucht, prüft beim Laden die Meta (`ladeMeta`) bzw. eine Fähigkeitsliste (`lib/backoffice/kundenkarte/faehigkeiten.js`) und zeigt bis dahin die in §9.3 genannte **Übergangsregel**. Kein Feature tut so, als wäre es fertig.

**Fachliche Leitplanken (nicht verhandelbar in der UI):**
- Kein Guthaben, keine Punkte, kein Rabatt in Euro/Prozent. Vorteile sind Leistungen. Nirgends ein „Kontostand“. Leistungen auf AB/Rechnung erscheinen als Position 0,00 € mit Text, nie als Preis mit Abzug (§7.5).
- Umsatz wird nur mit Einwilligung zur Auswertung berechnet und dient nur der Einstufung. Ohne Einwilligung: „–“, nie 0 €. Mitarbeitende sehen **keine Beträge** (Zweckbindung, Kundin sieht mit auf den Bildschirm); Leitung/GF hinter „Beträge zeigen“.
- Einwilligung wird nur **mit Nachweis** erfasst (Art. 7 Abs. 1 DSGVO); Widerruf ist ein eigener Dialog und leert Umsatzangaben.
- Rechte werden **serverseitig** durchgesetzt: Next-DAL filtert Felder je Rolle per Allowlist vor der Serialisierung; Ausblenden allein gilt nicht als Schutz.
- Kassa/Packtisch sehen nur Name, Stufe, Vorteile (`lookup_card`), nie Kontaktdaten oder Umsatz, und haben **keine** Backoffice-Karten-Akte.
- Kein `workflow.json`; Statuswechsel nur über Dokumentmethoden; `status` überall read_only, kein Status-Dropdown, kein Kanban-Ziehen.
- Kundentexte werden live und serverseitig geprüft (keine €/%/Rabatt/Bonus/Guthaben/Punkte/Gutschrift/Gutschein, keine Superlative, Sie-Form).
- Kein Löschen von Karten, Anträgen, Einlösungen in der UI – nur Anonymisieren (Rechenschaftspflicht Art. 5 Abs. 2).
- Gruß- und Reaktivierungsaufgaben nennen nur erlaubte Kanäle (TKG 2021 § 174): Brief immer (außer Widerspruch), Telefon/E-Mail/SMS nur mit Werbeeinwilligung.

---

## 0. Kurzfassung

| Was | Wie im Backoffice |
|---|---|
| Einstieg | Seitenleiste „Kundenkarte“ (lucide `credit-card`, `G` dann `K`), Zähler = Anträge „zu entscheiden“. Unternavigation: Übersicht · Anträge · Karten · Einlösungen · Stufen & Vorteile · Berichte; Zahnrad = Einstellungen. |
| Hauptweg | **Scan**: Kartennummer scannen (Hand-Scanner, iPad-Kamera) öffnet überall die Karten-Akte. Scan-Tor verhindert, dass Scan-Zeichen Kürzel auslösen. |
| Herzstück | **Karten-Akte**: Kopf mit Mini-Karte in Stufenfarbe, `StufenKennzeichen`, Primäraktion je Zustand (⌘↵). 4 Tabs: Vorteile · Verlauf · Einkäufe · Details. Rechts: Bezüge + Nächster Schritt. |
| Einlösen | Kachel „Einlösen“ → Popover mit bis zu 5 offenen Belegen → **ein Klick = Einlösung**, Undo-Toast 8 s (verzögerter Commit). Lieferung/Montage/Pflege nur mit Beleg. |
| Neue Karte | **Ein Formular** (Dialog lg / iPad Vollbild): Person · Einwilligungen (mit Nachweis-Foto) · eingeklappt Weitere Angaben. Live-Satz „Legt an: …“. „An Kundin übergeben“ öffnet den **Kundenmodus**. |
| Anträge | Liste mit Reitern Zu entscheiden · Wartet auf Mail · Erledigt. Kein Kanban. Website-Anträge werden nach E-Mail-Bestätigung automatisch zur Karte. |
| Lebenszyklus | Sperren (Grund-Katalog, Undo 8 s), Ersatzkarte (Verlust/Diebstahl/Beschädigung, Stufe + Limits bleiben), Übertragen, Zusammenführen (Leitung), Kündigen (Leitung), Übergabe aktivieren. |
| Stufen | Automatik nach Umsatz (nur mit Einwilligung). „Stufe festlegen“ nur Leitung, Grund Pflicht. Stufenplan zeigt nur die **Zuordnung** Vorteil → Stufe; `gilt_ab_stufe` folgt automatisch. |
| Recht | Einwilligung nur mit Nachweis, Widerruf leert Umsatzangaben, keine Beträge für Mitarbeitende, Ablehnungsgrund als Katalog, Datenschutzinfo- und Volljährigkeits-Haken, Kanalprüfung bei Aufgaben. |
| Möbelhandel | Leistung wird bei der **AB zugesagt** und bei Lieferschein/Montageabnahme **erbracht** (Zielmodell, Backend-Abhängigkeit §9.3). |

---

## 1. Nutzer und Top-Aufgaben

Klickzahl nach 02 §1: ab Zentrale, ohne Suche, Enter = Klick, Tippen in Felder zählt nicht. Zweite Spalte: Hauptweg mit Scan bzw. ⌘K (Scan = 0). Beide Werte werden per E2E gemessen (K34).

### 1.1 Verkäuferin / Beraterin (`PH Kundenkarte Mitarbeiter`)

| Aufgabe | ab Zentrale | mit Scan / ⌘K | Weg |
|---|---|---|---|
| Karte aufrufen (Kundin steht daneben) | 3 | **Scan 0** · ⌘K+Name+Enter 1 | Seitenleiste → Karten → Zeile |
| Vorteil einlösen | 5 | **Scan + 2** | … → Kachel „Einlösen“ → Belegzeile |
| Neue Karte im Showroom | 5 | ⌘K „> neue karte“ 4 | Kundenkarte → Neue Karte → Kontakt → Haken Teilnahmebedingungen → „Karte ausstellen“ |
| Karte + Begrüßung drucken | 5 | Scan + 2 (⌘P → Format) | direkt nach Ausstellen: 1 (Ergebnis-Karte) |
| Berater ändern | 4 | Scan + 3 | Karten → Zelle Berater → Wahl |
| Karte sperren (Verlust) | 7 | Scan + 4 | … → `⋯` → „Sperren…“ → Grund-Chip → „Sperren“ (Undo 8 s) |
| Ersatzkarte bei Verlust | 7 | Scan + 4 | … → `⋯` → „Ersatzkarte…“ → Grund → „Ausstellen“ |
| Geburtstagsgruß erledigen | 2 | – | Zentrale „Meine Aufgaben“ → „Erledigt“ |
| Einwilligung erfassen | 6 | Scan + 4 | … → Stufenblock „Einwilligung erfassen“ → Foto → Haken → „Erfassen“ |

### 1.2 Kundenkarte-Leitung (`PH Kundenkarte Leitung`)

| Aufgabe | ab Zentrale | mit Scan | Weg |
|---|---|---|---|
| Antrag entscheiden | 5 (eindeutiger Treffer) | – | Kundenkarte → Anträge → Zeile → „Karte ausstellen“ → „Ausstellen“ |
| Stufe festlegen (Kulanz, Korrektur) | 6 | Scan + 4 | … → `StufenKennzeichen` → Stufe → Grund-Chip → „Festlegen“ |
| Vorteil einer Stufe zuordnen | 5 | – | Stufen & Vorteile → „+ Vorteil zuordnen“ → Wahl → ⌘S |
| Fremde Einlösung stornieren | 5 | – | Einlösungen → Zeile → „Stornieren…“ → Grund |
| Entsperren | 5 | Scan + 2 | Karte → ⌘↵ → „Entsperren“ |
| Dubletten zusammenführen | 5 | – | Karten → Reiter „Mögliche Dubletten“ → Zeile → „Zusammenführen…“ → Bestätigen |
| Karten ohne Einkauf → Aufgaben | 5 | – | Berichte → „Karten ohne Einkauf“ → Auswahl → „Aufgabe an Berater“ |

### 1.3 Kassa (`PH Kassa Mitarbeiter`, Kiosk) – Detail `10-konzept-kassa.md`
Scan → Panel Name/Stufe/Vorteile (0) · Chip antippen → Position „Kartenleistung“ 0,00 € (1) · Laufkundin beantragt Karte → Kurzformular (2) · Beantragte Karte übergeben → „Übergeben“ (`hand_over_card`, 1).

### 1.4 Packtisch (`PH Logistik Mitarbeiter`)
Scan → Kartennummer an Shop-Bestellung (0) · Lieferung als Kartenleistung bestätigt sich mit „Übergeben“, Zeile in der Ergebnis-Karte mit Rückgängig 8 s (§7.3).

### 1.5 Geschäftsführung (`PH Geschäftsführung`, lesend)
Übersicht (1) · Berichte → Kundenwert (2).

### 1.6 Website / Kundenportal (Datenquelle)
`create_card_application` → E-Mail-Bestätigung → `confirm_card_application` → Karte `Aktiv`. Portal: `portal_card`, `portal_wallet_pass`; Widerruf und Kündigung im Portal sind Backend-Anfrage (§9.3, Art. 7 Abs. 3).

---

## 2. Routen, Navigation, Rechte, Tastatur

### 2.1 Routen

| Route | Typ (05 §2) | Mindestrecht | Besonderheit |
|---|---|---|---|
| `/kundenkarte` | T1 Übersicht | Mitarbeiter, GF | Heute-Leiste, Kennzahlen, Zu tun, Einrichtungs-Checkliste (Leitung) |
| `/kundenkarte/antraege` | T2 Liste | Mitarbeiter | Reiter Zu entscheiden · Wartet auf Mail · Erledigt; `?ansicht=kanban` → 307 auf Liste |
| `/kundenkarte/antraege/[name]` | T5 ohne Tabs | Mitarbeiter | Abschnitte Antrag · Einwilligungen · Verlauf |
| `/kundenkarte/karten` | T2 | Mitarbeiter | Scan-/Suchfeld `data-scan="ja"`; Reiter Alle · Ohne Berater · Wartet auf Übergabe · Mögliche Dubletten (Leitung) |
| `/kundenkarte/karten/neu` | Dialog lg als Route (Intercepting Route aus Liste; Direktaufruf = Vollseite) | Mitarbeiter | `?kontakt=` vorbefüllt |
| `/kundenkarte/karten/[kartennummer]` | T5 Karten-Akte | Mitarbeiter, Leitung, GF (lesend) | **nicht** für Kassa-Rolle (404 wie fehlendes Recht, 05 §8.3) |
| `/kundenkarte/einloesungen` | T2 + Sheet | Mitarbeiter | „Einlösen…“ mit Kartensuche |
| `/kundenkarte/einloesungen/[name]` | Sheet / Vollseite per Deep-Link | Mitarbeiter | |
| `/kundenkarte/stufen` | T9 Stufen & Vorteile | Leitung schreibend, Mitarbeiter lesend | `?panel=vorteil:<name>` öffnet Vorteil-Sheet |
| `/kundenkarte/vorteile` | – | – | 307 → `/kundenkarte/stufen` (mit `?panel=` bei Unterpfad) |
| `/kundenkarte/berichte` | Liste | je Report | zeigt nur Berichte, die die Rolle öffnen darf |
| `/kundenkarte/berichte/[report]` | T8 | Leitung/GF: alle; Mitarbeiter: Stufenwechsel (ohne €), Vorteile Nutzung, Karten ohne Einkauf (ohne €) | |
| `/kundenkarte/einstellungen` | T9 Single | Leitung schreibend, Mitarbeiter lesend | Zahnrad im Seitenkopf |
| `/kundenkarte/kundenmodus/[sitzung]` | Vollbild ohne Shell | Mitarbeiter (startet), Kundin bedient | §3.12 |
| `/kunden/[kontakt]` | CRM | CRM | Chip, Tab Marketing/Datenschutz (§3.11) |
| `/kassa`, `/packtisch` | T7 Kiosk | Kassa, Logistik | §7 |
| `/d/ph-kundenkarte*/*` | Rückfall | | 307 auf kanonische Routen |

### 2.2 Rechte (UI + Server)

| Rolle | Sieht | Darf | Server-Allowlist (Felder, die den Server verlassen) |
|---|---|---|---|
| Mitarbeiter | Bereich ohne Beträge, ohne `notizen_intern` | anlegen, Vorteil einlösen, sperren (Undo), Ersatzkarte, Übergabe aktivieren, Einwilligung erfassen/beenden, eigene Einlösung bis 23:59 desselben Tages stornieren | Karte ohne `jahresumsatz_cent`, `gesamtumsatz_cent`, `umsatz_berechnet_am`, `ip_hash`, `idempotency_key`, `notizen_intern`; `letzter_einkauf` nur als Monat („10/2026“); Antrag ohne `ip_hash`, `doi_token_hash` |
| Leitung | alles inkl. Beträge (hinter „Beträge zeigen“), Intern | + Stufe festlegen, entsperren, kündigen, übertragen, zusammenführen, Annahme ohne Mail-Bestätigung, fremde Einlösung stornieren, Stammdaten, Einstellungen, Export | alles außer Hashes/Schlüsseln |
| GF | alles lesend inkl. Beträge | Berichte, Export | wie Leitung, keine Aktionen |
| Kassa Mitarbeiter | Bereich **nicht** in der Seitenleiste, keine Akte | nur Kiosk (`lookup_card`, `redeem_benefit`, `hand_over_card`, Antrag-Kurzform) | – |
| Website Integration | – | API | – |

- Deaktivierte Knöpfe haben **immer** einen sichtbaren Satz darunter (12 px `muted`) und einen echten Sekundärknopf „Leitung bitten“ (legt PH Aufgabe an; danach „Angefragt bei Leitung · heute 10:12“ + „Aufgabe öffnen“). Tooltip ist nie einzige Erklärung.
- Abschnitt „Intern“ wird ohne permlevel-1-Recht **nicht gerendert**.
- Kündigen ist Leitung (irreversibel, gleiche Stufe wie Entsperren); Mitarbeitende sehen „Kündigen…“ mit Satz „Kündigen darf die Leitung“ + „Leitung bitten“. Kundenwunsch an der Theke: Mitarbeitende sperren mit Grund „Kundenwunsch“ (umkehrbar) und bitten die Leitung.

### 2.3 Scan-Tor (Fundament, Pflicht vor allen Kürzeln)

- `useTastenkuerzel` und `useScanner` teilen sich einen Tastatur-Puffer: Einzeltasten-Kürzel werden **40 ms** zurückgehalten; folgt innerhalb 40 ms ein weiteres druckbares Zeichen, gilt die Folge als Scan-Kandidat, kein Kürzel feuert.
- Scan = ≥ 6 Zeichen, Abstand < 35 ms, Abschluss Enter.
- Scan-Erkennung nur, wenn **kein** Eingabefeld fokussiert ist **oder** das Feld `data-scan="ja"` trägt (Kartensuche Liste, Palette, Kartensuche im Einlöse-Dialog, Kassa-Scanfeld). In allen anderen Feldern bleibt die Eingabe Text.
- Nach Enter: `istKartennummer(normalisiereKartennummer(x))` → Karte öffnen; sonst verwerfen + Toast „Code nicht erkannt“ (4 s, `role="status"`).
- Navigation beim **Tippen** nur bei Enter. Ist eine vollständige Nummer getippt, steht als erste Trefferzeile „Karte KK-7K3QX9 öffnen ↵“ (vorausgewählt).

**Kartennummer (eine Funktion für alle):** `lib/backoffice/kundenkarte/kartennummer.js` – `normalisiereKartennummer(x)`: Großschreiben, nur A–Z/0–9 behalten, Präfix `KK` abtrennen, Ergebnis `KK-<rest>`; `istKartennummer(x)`: `^KK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$` (Alphabet aus `utils/karte.py`, ohne I und O). Genutzt von Liste, Palette, Kiosk, Einlöse-Dialog, Kamera-Scan. Unit-Test mit `kk 7k3qx9`, `KK7K3QX9`, ` kk-7k3qx9 `, `KK-7K3QX` (ungültig), `KK-7K3QXO` (ungültig).

### 2.4 Tastenkürzel (ersetzt alte §2.3)

| Kontext | Kürzel | Wirkung |
|---|---|---|
| global | `G` dann `K` | Bereich Kundenkarte |
| global | Scan `KK…` + Enter | Karte öffnen (Regeln §2.3) |
| Liste | `/` Such-/Scanfeld · `↑↓` · `Enter` öffnen · `N` Neue Karte · `A` Berater zuweisen · `X` auswählen · `Leertaste` Side-Peek · `1–4` Reiter | |
| Side-Peek | `↑↓` blättert (ohne Alt) · `Esc` schließt · `Enter` Vollansicht | |
| Karten-Akte | `⌘/Strg+Enter` | Primäraktion je Zustand (Einlösen · Übergabe aktivieren · Entsperren · Neue Karte) |
| Karten-Akte | `⌘/Strg+P` | Drucken-Menü (Karte · Begrüßung · beides) |
| Karten-Akte | `.` | Aktionsmenü (im Menü Buchstabensprung erlaubt) |
| Karten-Akte | `Alt+1…4` | Tabs Vorteile · Verlauf · Einkäufe · Details |
| Karten-Akte | `Alt+↑/↓` | vorige/nächste Karte der Liste |
| Antrag-Akte | `⌘/Strg+Enter` | Karte ausstellen (Ablehnen/Doppelt nur über Knopf/Menü) |
| Einlöse-Popover | `↑↓` · `Enter` = einlösen · `Esc` | |
| Stufenplan | `←→` nur bei Fokus im Spaltenkopf (Roving-Tabindex) · `⌘S` | |
| Toast | `⌘/Strg+Z`; zusätzlich `Z` nur bei eingeschalteten Einzeltasten | Rückgängig |
| Benutzer-Menü | Schalter „Tastenkürzel mit Einzeltasten“ (Standard an, serverseitig im Profil) | WCAG 2.1.4 |

Entfallen: `V`, `W`, `K`, `P`, `E`, `1–6` in der Akte; `A`/`D`/`R`/`S` in der Antrag-Akte; `S` im Einlösungs-Sheet; „Enter dann A“. Ablehnen, Doppelt, Stornieren, Sperren, Kündigen haben **keine** Einzeltaste. Palette-Aktionen: `> neue karte`, `> vorteil einlösen` (fragt Karte per Scan/Suche), `> karte sperren` (nur auf der Akte), `? kundenkarte` (Hilfe).

---

## 3. Seiten im Detail

Gemeinsam: Zustände `laden` (Skeleton ab 300 ms, Zielhöhen) → `bereit | leer | fehler:<code> | nicht-gefunden`. Fehlertexte 02 §7.2, Bewegung 04 (Token `--bo-dur-*`, `--bo-ease-*`), `prefers-reduced-motion`: Bewegung → Crossfade ≤ 120 ms oder sofort. Undo im ganzen Bereich **8 s**. Alle Status- und Select-Werte über Label-Tabelle (§12.1), nie Rohwerte.

### 3.1 Übersicht `/kundenkarte`

```
┌ Zentrale › Kundenkarte                         Übersicht · Anträge 3 · Karten · Einlösungen · Stufen & Vorteile · Berichte   [⚙] ┐
│ Heute: [Anträge zu entscheiden 3] [Geburtstage heute 1] [Einlösungen heute 4]                         [Neue Karte ⌘↵]  │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────────────────────────────────────┤
│ AKTIVE KARTEN                │ NEUE KARTEN 30 TAGE          │ EINLÖSUNGEN 30 TAGE                                      │
│ 412                          │ 9                            │ 27 · davon 2 storniert                                   │
├──────────────────────────────┴───────────────┬──────────────┴──────────────────────────────────────────────────────────┤
│ KARTEN JE STUFE (Balken, Stufenfarbe)        │ ZU TUN                                                                  │
│ Platzhirsch       ████████████ 330           │ › Antrag Anna Muster – gleiche E-Mail, anderer Name                     │
│ Platzhirsch Plus  ███ 68                     │ › 2 Karten ohne Berater                                                 │
│ Platzhirsch Privé █ 14                       │ › Karte KK-9M2PT4 wartet seit 9 Tagen auf Übergabe                      │
├──────────────────────────────────────────────┤ › Einlösung „Limit überschritten – Kulanz“ prüfen (Kassa)               │
│ NEUE KARTEN JE MONAT (Linie, 12 Monate)      │                                                                         │
├──────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────┤
│ ZULETZT GEÄNDERT (recent_activity, 10)                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
(Zahlen sind Beispiele.)
```
- **Heute-Leiste = Arbeitszähler** (Chips klickbar, gefilterte Liste); Chip mit 0: `muted`, `aria-disabled`, nicht klickbar.
- **Kennzahlen = Bestand/Trend:** Aktive Karten (Number Card `PH Aktive Kundenkarten`), Neue Karten 30 Tage (`count ausgestellt_am ≥ heute−30`), Einlösungen 30 Tage (Methode `kennzahlen.einloesungen_30_tage`, nicht nachbauen).
- Charts: „Karten je Stufe“, „Neue Karten je Monat“. „Einlösungen je Vorteil“ liegt im Bericht „Vorteile Nutzung“.
- **Zu tun** (nur Kundenvorgänge, max. 6, Rest „Alle anzeigen“): Anträge zu entscheiden > 2 Tage; Hinweis gleiche E-Mail/anderer Name; Karten `Aktiv` ohne Berater; `Beantragt` > 7 Tage; Kassa-Einlösungen mit Hinweis „Kulanz“; Karten `Gesperrt` > 30 Tage (Leitung: „Kündigen oder entsperren?“). Leer: „Alles erledigt – nichts offen.“ (Häkchen Sand 32 px).
- **Einrichtungs-Checkliste „Kundenkarte einrichten“** (nur Leitung, verschwindet wenn vollständig): Stufen prüfen · Vorteile prüfen · Teilnahmebedingungen-Version eintragen · Text Datenschutzinformation eintragen · Einwilligungstext-Version anlegen · Wallet einrichten (optional, „Die Karte funktioniert ohne Pass.“). Ohne Teilnahmebedingungen-Version ist „Neue Karte“ deaktiviert mit Satz „Teilnahmebedingungen-Version fehlt – Leitung trägt sie in den Einstellungen ein.“
- Leer (frischer Mandant): „Noch keine Karten. Karten entstehen aus Website-Anträgen oder hier im Showroom.“ + „Neue Karte“; Charts ausgeblendet.
- Jede Kachel eigenes `<Suspense>`; Fehler: „Nicht geladen · Erneut“ ohne Seitenverlust. Skeleton Kennzahl 80 px, Chart 220 px; Charts zeichnen 400 ms `--bo-ease-out` nur beim ersten Erscheinen.
- Erstbesuch-Hinweis (§12.2).

### 3.2 Anträge `/kundenkarte/antraege`

```
┌ Zentrale › Kundenkarte › Anträge                                                      [Showroom-Antrag] ┐
├ [Zu entscheiden 2] [Wartet auf Mail 1] [Erledigt]   [⌕ Name, E-Mail, PLZ]  [Quelle ▾] [+ Filter]       ┤
│ ☐ Name                   Quelle     Eingang            Status                         Hinweis          │
│ ☐ Anna Muster            Website    heute 09:12        Bestätigt                      –                │
│   6900 Bregenz · PH-KKA-2026-00031                                                                     │
│ ☐ Peter Beispiel         Showroom   gestern            Bestätigt · wartet seit 2 Tg   Karte besteht:   │
│   6911 Lochau · PH-KKA-2026-00030                                                     KK-9M2PT4        │
├ 2 von 2                                                                                     [CSV]      ┤
└ Auswahl (1): [Ablehnen…] [Als doppelt…] [Exportieren]                                                  ┘
```
- Reiter: **Zu entscheiden** = `Bestaetigt` + `Neu` ohne `doi_noetig`; **Wartet auf Mail** = `Neu` mit `doi_noetig` (Spalte Status: „wartet auf Mail-Bestätigung · läuft ab in 4 Tagen“); **Erledigt** = Angenommen/Abgelehnt/Doppelt. URL-Zustand `?reiter=&quelle=&q=`.
- 5 Standardspalten: Name (Ort + Nummer als `muted`-Untertext) · Quelle · Eingang (relativ, Tooltip + `title` absolut) · Status (Text) · Hinweis („Karte besteht: KK-…“, „Gleiche E-Mail wie A. M*** – andere Person?“). E-Mail nur in der Akte.
- Zeit-Signal: zu entscheiden > 2 Tage → Punkt `warning` + Text „wartet seit 3 Tagen“.
- Zeilenmenü: Öffnen, Kundenakte (wenn verknüpft), Karte ausstellen, Ablehnen…, Als doppelt….
- Massenaktionen: Ablehnen (ein Grund für alle), Als doppelt (nur Zeilen mit erkannter Karte), Exportieren (Leitung/GF). **Kein** Massen-Ausstellen.
- Leer: Reiter „Zu entscheiden“: „Keine offenen Anträge – alles bearbeitet.“ (Häkchen Sand); Filter-Leer: „Keine Anträge für diese Filter.“ + „Filter zurücksetzen“.
- Laden: Kopf echt, 8 Skeleton-Zeilen 44 px. Fehler: Fehlerblock in der Tabelle, Filterleiste bleibt.
- Mobil < 768: Karten „Name · Quelle · Eingang · Status“; Knopf „Ausstellen“ in der Karte (kein Wischen, weil Dialog folgt); Filter als Bottom-Sheet.

### 3.3 Antrag-Akte `/kundenkarte/antraege/[name]` (ohne Tabs)

```
┌ Zentrale › Kundenkarte › Anträge › PH-KKA-2026-00031                                                  ┐
│ Anna Muster · Website · Eingang 04.11.2026 09:12    Bestätigt         [Karte ausstellen ⌘↵]  [⋯]      │
├───────────────────────────────────────────────────────────────────────┬───────────────────────────────┤
│ ANTRAG                                                                │ KONTAKT                        │
│ Frau Anna Muster · anna.muster@… · +43 …                              │ Nicht verknüpft                │
│ 6900 Bregenz · Deutsch · Interessen: Küche, Outdoor · Geburtstag 12.05.│ Ähnliche Kontakte (1)          │
│ Nachricht: „…“                                                        │ › Anna Muster, 6900 Bregenz    │
│ EINWILLIGUNGEN                                                        │   [E-Mail gleich]              │
│ ✓ Teilnahmebedingungen (Version 2026-11)                              │ KARTE                          │
│ ✓ Auswertung der Einkäufe (Text kundenkarte-auswertung-v1)            │ – entsteht beim Ausstellen     │
│ – Newsletter                                                          │                                │
│ ✓ E-Mail bestätigt am 04.11.2026 09:20                                │                                │
│ ▸ Nachweis-Details (Zeitpunkt, Kanal, IP-Hash, Datei)                 │                                │
│ VERLAUF                                                               │                                │
│ 09:20 E-Mail bestätigt · 09:12 Eingang über die Website               │                                │
└───────────────────────────────────────────────────────────────────────┴───────────────────────────────┘
```
- **Primäraktion je Status:** `Bestaetigt` → „Karte ausstellen“. `Neu` + `doi_noetig` → Primär deaktiviert, Satz „Wartet auf die E-Mail-Bestätigung der Kundin“; Leitung zusätzlich Sekundär „Ohne Bestätigung ausstellen…“ (Dialog mit Pflicht-Begründung); Mitarbeitende „Leitung bitten“. Endzustand: keine Primäraktion, **Band im Kopf** „Abgelehnt am 03.11. von L. Berger – Angaben unvollständig“ / „Angenommen → KK-…“ / „Doppelt zu KK-…“.
- Hinweisband `warning-soft` bei gleicher E-Mail und anderem Nachnamen (PR11): „Diese E-Mail gehört zu A. M*** – andere Person?“ Knöpfe „Neuen Kontakt anlegen“ / „Ist dieselbe Person“. Bis zur Backend-Änderung (Auto-Verknüpfung nur bei gleichem Nachnamen) prüft die Server Action vor dem Ausstellen selbst und setzt `kontakt` nicht automatisch.
- Nachweis-Details eingeklappt, mono, `muted`. Einwilligungen nach Eingang nicht bearbeitbar.
- **Dialog „Karte ausstellen“** (md 560, Primär „Ausstellen“):
  1. Kontakt: genau ein Treffer mit gleicher E-Mail **und** gleichem Nachnamen → „Verknüpfen mit Anna Muster, 6900 Bregenz“ vorausgewählt. Mehrere/unsichere Treffer → nichts vorausgewählt, Primär deaktiviert mit Satz „Bitte Kontakt wählen oder ‚Neu anlegen‘“. Trefferzeilen zeigen Übereinstimmung als Kennzeichen („E-Mail gleich“, „Name + PLZ gleich“). Keine Treffer → „Neuen Kontakt anlegen“ vorausgewählt.
  2. Stufe: Startstufe fest; Leitung kann „Andere Stufe…“ (öffnet Grund-Pflicht wie §3.5.4).
  3. Live-Satz mit **berechnetem** Kartenstatus: Website-Antrag → „Karte wird aktiv“ (Auto-Annahme) bzw. bei manueller Annahme „Karte wird aktiv“ (Server Action übergibt `aktiv=True`, weil der Antrag per Mail bestätigt ist); Showroom/Kassa → „aktiv“ oder „beantragt – aktivieren bei Übergabe“ (Schalter „Erst bei Übergabe aktivieren“ → `sofort_aktiv=0`).
  Ausführung `annehmen`. Antwort `KK-…` → Ergebnis-Karte (Häkchen 400 ms `--bo-ease-out`, Nummer sofort ohne Hochzählen, Knöpfe „Karte + Begrüßung drucken“, „Karte öffnen“, „Nächster Antrag“). Antwort „Doppelt“ → Ergebnis „Bereits vorhanden: KK-… – Antrag als doppelt markiert“ (kein Fehler).
- **Dialog „Ablehnen“** (sm 400): Grund Pflicht als Radio-Liste: Doppelte Anmeldung · Angaben unvollständig/nicht prüfbar · Missbrauch früherer Karte · Kundenwunsch · E-Mail nicht bestätigt · Sonstiges (dann Freitext Pflicht, 140). Satz „Keine Nachricht an die Kundin – interne Dokumentation.“ Primär rot „Ablehnen“, Fokus auf Abbrechen. Übergang: bis Feld `ablehnungsgrund` existiert, schreibt die Server Action `entscheidung_grund = "[<Grund>] <Freitext>"`.
- **Dialog „Als doppelt“**: zeigt erkannte Karte, Primär „Als doppelt markieren“.
- Fehler: „Ohne bestätigte E-Mail darf nur die Leitung annehmen.“ → Toast + „Leitung bitten“; `DuplicateEntryError` (Doppelklick, `idempotency_key`) → Server Action lädt den vorhandenen Antrag und zeigt dessen Ergebnis; „PH Kontakt ist nicht installiert“ → Fehlerblock `unavailable`.
- 404: „Dieser Antrag existiert nicht mehr.“ + „Zur Liste“.

### 3.4 Karten `/kundenkarte/karten`

```
┌ Zentrale › Kundenkarte › Karten                                                          [Neue Karte] ┐
├ [Alle] [Ohne Berater 2] [Wartet auf Übergabe 1] [Mögliche Dubletten 1]  [+]                           ┤
│ [⌕ Scannen oder suchen: Name, Kartennummer] [⌁]  [Status ▾] [Stufe ▾] [Berater ▾] [+ Filter]          │
│ ☐ Karte       Name                       Stufe                Berater        Letzter Einkauf           │
│ ☐ KK-7K3QX9   Anna Muster                [▭ Platzhirsch Plus] A. Berger ▾    10/2026                   │
│ ☐ KK-9M2PT4   Fam. Huber  (Beantragt)    [▭ Platzhirsch]      –  ▾           –  (nicht ausgewertet)    │
├ 50 von 417 · ‹ 1 2 … 9 ›                                                                 [CSV]         ┤
└ Auswahl (3): [Berater zuweisen ▾] [Drucken (3) ▾] [Aufgabe an Berater] [Mehr ▾: Sperren…]              ┘
```
- Suchfeld = Scanfeld (`data-scan="ja"`, `autocapitalize="characters"`, `autocomplete="off"`, `spellcheck="false"`), `[⌁]` = Icon `scan-barcode` öffnet Kamera-Sheet (§7.1). Unbekannte Nummer nach Enter: Shake 240 ms am Feld + Text unter dem Feld „Keine Karte KK-… Nummer prüfen oder nach Namen suchen.“ – Text bleibt, bis neu getippt wird.
- **6 Standardspalten:** Karte (mono) · Name (Status-Badge in der Zelle nur wenn ≠ Aktiv) · Stufe (`StufenKennzeichen`) · Berater (inline) · Letzter Einkauf (Mitarbeitende: Monat/Jahr; ohne Einwilligung „–“ + sr-only „nicht ausgewertet“, Legende im Spaltenkopf-Popover) · (Auswahl). Über „Spalten“: Stufe seit, Kanal, Ausgestellt am, Einwilligung, Wallet aktualisiert; Umsatz Zeitraum nur Leitung/GF. iPad: Name · Stufe · Status · Letzter Einkauf.
- Inline nur `persoenlicher_berater` (sofort, Undo 8 s, Zelle Häkchen 600 ms). Stufe nie inline.
- Status-Filter Standard: `Aktiv, Beantragt, Gesperrt`; Endzustände (Gekündigt, Ersetzt, Übertragen, Zusammengeführt) über Status-Filter.
- Reiter „Mögliche Dubletten“ (Leitung) = `api.backoffice.dubletten_finden(50)`; Zeile → Dialog „Zusammenführen“ (§3.5.6).
- Zeit-Signal: `Beantragt` > 7 Tage → „wartet auf Übergabe seit 9 Tagen“ (`warning`); `Gesperrt` zeigt Sperrgrund als Untertext (nicht nur Tooltip).
- Zeilenmenü: Öffnen, Kundenakte, Vorteil einlösen…, Karte drucken, Begrüßung drucken, Sperren… (Aktiv), Übergabe aktivieren (Beantragt), Entsperren (Gesperrt, Leitung).
- Side-Peek (Leertaste, 480 px, Slide 200 ms `--bo-ease-out`): Kopf + Vorteil-Kacheln + letzte 5 Verlaufseinträge. Laden: Skeleton Kopf 56 + 3 Kacheln 88. Fehler: „Karte nicht geladen.“ + „Erneut“, „Vollansicht öffnen“.
- Leer: „Noch keine Karten.“ + „Neue Karte“; Filter-Leer „Keine gesperrten Karten.“ als Erledigt-Zustand.
- Mobil < 768: Karte „Name · StufenKennzeichen · Letzter Einkauf“; Wischen links = Berater zuweisen (sofort + Undo), Tippen = Akte.

### 3.5 Karten-Akte `/kundenkarte/karten/[kartennummer]`

```
┌ Zentrale › Kundenkarte › Karten › KK-7K3QX9                                                                       ┐
│ ┌────────────┐  Anna Muster  ↗ Kundenakte                                        [Vorteil einlösen ⌘↵]  [⋯]     │
│ │▓▓▓▓▓▓▓▓▓▓▓▓│  [▭ Platzhirsch Plus] seit 14.03.2026 · KK-7K3QX9 ⧉ · Berater A. Berger                         │
│ │ KK-7K3QX9  │  (Status-Badge nur wenn ≠ Aktiv)                                                                 │
│ └────────────┘  Mini-Karte 120 × 76 px, Klick dreht auf Rückseite (QR + Datenschutztext)                         │
├ Stufenblock (64 px): Platzhirsch ●───◉ Plus ───○ Privé   Nächste Stufe: Privé   [eye Beträge zeigen] (Leitung) [refresh-cw] ┤
│ Zählt: … (Fußzeile, §3.5.2)                                                         Stand heute 03:30               │
├ Vorteile · Verlauf · Einkäufe · Details                                                                            ┤
│ VORTEILE                                                                            ║ BEZÜGE                       │
│ ┌ truck  Lieferung im Liefergebiet ┐ ┌ droplets  Pflegetermin im Jahr ┐              ║ Kundenakte Anna Muster       │
│ │ unbegrenzt                       │ │ 1 je Kalenderjahr · 0 verbleibend│             ║ Antrag PH-KKA-2026-00031     │
│ │ „Wir liefern … im Liefergebiet.“ │ │ ████████████ (4 px)              │             ║ Aufträge 2 · Kassenkäufe 5   │
│ │ [Einlösen]                       │ │ wieder ab 01.01.2027             │             ║ Serviceleistungen 1          │
│ └──────────────────────────────────┘ └──────────────────────────────────┘             ║ Aufgaben 1 offen             │
│ ┌ user-round  Persönliche Beratung ┐                                                  ║ Vorgängerkarte KK-…          │
│ │ unbegrenzt · [Einlösen]          │                                                  ║ NÄCHSTER SCHRITT             │
│ └──────────────────────────────────┘                                                  ║ › Pflegetermin anbieten      │
│ AB PLATZHIRSCH PRIVÉ  (Text ink-soft, Icon lock 12 px)                                ║                              │
│ · Montage durch unser Team                                                            ║                              │
└───────────────────────────────────────────────────────────────────────────────────────╨──────────────────────────────┘
```

#### 3.5.1 Kopf
- `kunde_name` (Link Kundenakte), `StufenKennzeichen` (Knopf, §3.5.4), „seit `stufe_seit`“, Kartennummer mono + Kopier-Knopf (Icon `copy` → `check` 120 ms, nach 1500 ms zurück, Live-Region „Kartennummer kopiert“), Berater, Status-Badge nur wenn ≠ Aktiv.
- **Mini-Karte** (`MiniKarte`, 120 × 76 px, Seitenverhältnis 85,6 : 54, Stufenfarbe, Wortmarke Bodoni Moda klein, Nummer mono): `button` `aria-label="Kartenrückseite zeigen"`; Klick dreht 240 ms `--bo-ease-inout` `rotateY 0→180°` (Rückseite: QR + `text_datenschutz_karte`), reduce: Crossfade 120 ms.
- Bänder (max. eines, Rangfolge **Gesperrt > Gekündigt/Endzustand > Beantragt**):
  - Gesperrt: `danger-soft` „Gesperrt am 02.11. – Verlust (L. Berger)“; Knöpfe je Sperrgrund: „Ersatzkarte ausstellen“ (Verlust/Diebstahl/Beschädigt), „Entsperren“ (Leitung, nur wenn Sperrgrund entsperrbar – nicht bei Diebstahl, Dublette, Datenschutz, Verstorben).
  - Gekündigt: neutral „Gekündigt am … – eine neue Karte ist möglich.“ + „Neue Karte“.
  - Ersetzt / Übertragen / Zusammengeführt: neutral „Ersetzt durch KK-…“ / „Übertragen an <Name> (KK-…)“ / „Zusammengeführt in KK-…“ mit Link; keine Aktionen.
  - Beantragt: `warning-soft` „Noch nicht übergeben“ – Primär „Übergabe aktivieren“.
- Einwilligung fehlt = **kein Band** (Zeile im Stufenblock). „Stufe von Hand festgelegt“ = Zusatz am `StufenKennzeichen`, kein Band.
- **Primäraktion je Zustand (⌘↵):** Aktiv → „Vorteil einlösen“ (öffnet Popover der ersten verfügbaren Kachel bzw. Auswahl-Popover); Beantragt → „Übergabe aktivieren“ (`karte_uebergeben(ort)`, Variante A 8 s); Gesperrt → „Entsperren“ (Leitung) bzw. „Ersatzkarte ausstellen“ bei Verlust/Diebstahl/Beschädigt für Mitarbeitende; Gekündigt → „Neue Karte“; Ersetzt/Übertragen/Zusammengeführt → „Zur neuen Karte“.
- **Aktionsmenü `⋯` / `.`:** Drucken ▸ (Karte · Begrüßung · beides) · Wallet-Pass erneuern · Ersatzkarte ausstellen… · Sperren… · Übertragen… (Leitung) · Zusammenführen… (Leitung) · Kündigen… (Leitung, rot) · Aufgabe anlegen · Kundenakte öffnen · Datenschutz in der Kundenakte (Leitung; Auskunft/Anonymisieren laufen über ph_crm-Hook, nicht hier).

#### 3.5.2 Stufenblock (Höhe 64, `<ol>` mit `aria-current="step"`)
- Punkte = aktive Stufen in `reihenfolge`; gefüllt = erreicht, Ring Sand = aktuell, hohl = offen (Form + Farbe). Text „Nächste Stufe: <Name>“.
- **Beträge:** Mitarbeitende nie. Leitung/GF: Knopf `eye` „Beträge zeigen“ (`aria-pressed`, verfällt beim Verlassen der Akte) → „Umsatz (netto) letzte 12 Monate: 14.760,00 € · bis Privé: 35.240,00 € · Schwellen ab 10.000 € / ab 50.000 €“. Bis Umsatzregeln B1–B8 umgesetzt sind: Band `warning-soft` im aufgeklappten Bereich „Berechnung im Aufbau – Anzahlungen, Gutschriften und Fremdwährung noch nicht berücksichtigt.“ und Wort „netto“ entfällt.
- **Fußzeile „Zählt:“** (immer, 12 px `muted`) – Text kommt aus `faehigkeiten.umsatzregeln`: Zielstand „Zählt: bezahlte Rechnungen, Kassenkäufe, Shop-Bestellungen; Anzahlungen mit der Schlussrechnung; Gutschriften werden abgezogen. Aufträge zählen mit der Schlussrechnung.“ Heute (wahr für `umsatz.py`): „Zählt: Kassenkäufe ohne Rechnung, bezahlte Shop-Bestellungen, gestellte Rechnungen. Aufträge zählen mit der Rechnung.“
- „Neu berechnen“ = Icon-Knopf `refresh-cw` mit `aria-label` und Tooltip; nach 300 ms Text „Berechnet …“, ab 2 s „Dauert länger als gewohnt …“. Stand-Zeit `muted`.
- Ohne Einwilligung: nur aktuelle Stufe + Zeile „Einkäufe werden nicht ausgewertet – Stufe bleibt Platzhirsch.“ + Knopf „Einwilligung erfassen“ (§3.5.5).
- Mit Einwilligung: Zeile rechts „Einwilligung seit 03.02.2026 · Beenden…“ (Knopf führt zum Widerruf-Dialog).
- Linie füllt 400 ms `--bo-ease-out` nur nach Neuberechnung mit Stufenwechsel oder nach Einwilligung erfassen, nie beim Laden.
- Keine Regel „kurz vor <Stufe>“ (Zweckbindung).

#### 3.5.3 Tabs (4)
1. **Vorteile** – Kacheln aus `portal_daten().vorteile`, Reihenfolge `reihenfolge`, Raster 3 Spalten (iPad 2, Telefon 1). Kachel (`VorteilKachel`): Icon je Art (`truck` Lieferung, `wrench` Montage, `droplets` Pflege, `calendar-heart` Event, `life-buoy` Service, `user-round` Persönlich, `circle-dot` Sonstiges), Titel, Limit als Text („1 je Kalenderjahr · 0 verbleibend“ / „unbegrenzt“), Fortschritt 4 px `accent` `aria-hidden`, Kundentext 2 Zeilen, Knopf „Einlösen“ (iPad volle Breite 44 px). Nicht verfügbar: Knopf entfällt, Grund als Text („wieder ab 01.01.2027“, „Karte gesperrt“). Zugesagte Leistungen (Zielmodell): Kennzeichen türkis „zugesagt zu AB-2026-0123“, zählt gegen Limit. Vorteile höherer Stufen darunter als Liste „Ab Platzhirsch Privé“ (Text `ink-soft`, Icon `lock` `aria-hidden`). Leer: „Dieser Stufe ist noch kein Vorteil zugeordnet.“ + Leitung „Stufenplan öffnen“.
2. **Verlauf** – chronologisch: `PH Kundenkarte Ereignis` + Einlösungen + Kommentare; Filter-Chips „Alle · Einlösungen · Stufe · Einwilligung · Kommentare“. Menschensprache: „Einstufung geprüft · 5 Einkäufe berücksichtigt“, „Stufe Platzhirsch → Platzhirsch Plus (automatisch)“, „Gesperrt von Lena – Verlust“, „Pflegetermin eingelöst · zu Beleg PFL-2026-0012 · T. Steiner“. Einlösungszeilen mit Menü „Stornieren…“ nach Regel (§4.3). Beträge im Verlauf nur Leitung/GF. Technische Versionen eingeklappt. Leer (gefiltert): „Keine Einlösungen bisher.“ + „Filter zurücksetzen“. Kommentar schreiben unten (Autosave nein – Knopf „Kommentar“, ⌘↵).
3. **Einkäufe** – Belege des Kontakts (Kassenbeleg, Bestellung, Rechnung, AB) **und** Kassenbelege/Bestellungen per `ph_kundenkarte_kartennummer` (aller Karten der Kette), gekennzeichnet „über Karte“/„über Kontakt“. Spalten: Datum, Art (Icon + Text), Belegnummer (Link zur Akte des Belegs), zählt zur Einstufung ja/nein (Text, z. B. „Anzahlung – zählt mit der Schlussrechnung“). Beträge nur Leitung/GF/Faktura und nur mit Einwilligung; Fremdwährung „CHF 1.200,00 (≈ EUR … zum Belegkurs)“ nur Leitung. Hinweis „über Karte – zählt erst, wenn die Einstufung Kartennummern berücksichtigt“ solange B8 fehlt. Ohne Einwilligung: Belege sichtbar, Zeile oben „Einkäufe werden nicht ausgewertet – keine Summen.“ + „Einwilligung erfassen“. Leer: „Noch keine Einkäufe mit dieser Karte oder diesem Kontakt.“
4. **Details** – Abschnitte mit Sprungleiste: **Einwilligung** (Stand, Textversion, Kanal, Nachweis-Datei, Zeitpunkte; Knöpfe „Einwilligung erfassen“/„Beenden…“; Geburtstag als Tag/Monat mit Satz „leer = kein Gruß“) · **Wallet & QR** (QR 160 px `role="img"` `aria-label="QR-Code der Kundenkarte KK-7K3QX9"`, Knöpfe „SVG laden“, „PNG laden“; Zustand aus `wallet_status()`: „Apple: eingerichtet · Google: nicht eingerichtet“; zuletzt erzeugt je Plattform; „Pass erneuern“; Satz „Die Kundin lädt den Pass im Kundenportal. Der Pass zeigt Kartennummer, Vorname und Stufe.“; nicht eingerichtet: „Wallet-Pässe sind noch nicht eingerichtet. Die Karte funktioniert ohne Pass.“ + Leitung „Einstellungen öffnen“; Kontakt ohne E-Mail: „Kein Kundenportal – Pass nicht verfügbar.“) · **Stammdaten** (Kanal, Berater, Ausgestellt am/durch, Übergeben am, Vorgänger/Nachfolger, Kontakt readonly mit Satz „Die Karte ist personengebunden – Übertragen über das Aktionsmenü (Leitung).“) · **Intern** (nur Leitung/GF: `notizen_intern`, Autosave 1 s, „Gespeichert 14:02“ im Abschnittskopf).

**Ein Speichermodell:** Einzelfelder (Berater, Kanal, Geburtstag) sofort + Undo-Toast 8 s; Notiz Autosave 1 s; Stufe und Einwilligung nur über eigene Dialoge mit Folge-Text. **Keine Speicherleiste in der Karten-Akte.** `conflict` je Feld (gelb umrandet, „Wurde gerade von L. Berger geändert – übernehmen / meins behalten“), nicht als Seiten-Diff.

**Rechte Spalte:** Bezüge (Kundenakte, Antrag, Aufträge/Kassenkäufe-Zähler, Serviceleistungen = PH Serviceauftrag/Pflege Abo des Kontakts, Aufgaben offen/erledigt, Vorgänger-/Nachfolgekarte); Leer: „Noch keine Belege, Aufgaben oder Serviceleistungen.“ **Nächster Schritt** (eine Zeile, Regeln §8.3). iPad: rechte Spalte als 5. Bereich „Bezüge“ unterhalb.

**Zustände:** Kopf blockierend (≤ 1,0 s), Tabs lazy, Verlauf gestreamt; `not_found` auch bei fehlendem Recht.

#### 3.5.4 Popover „Stufe festlegen“ (am `StufenKennzeichen`, 360 px, `role="dialog"`, Fokusfalle)
- Radio-Liste der aktiven Stufen (Kennzeichen + Name); Grund Pflicht: Chips „Kulanz“, „Objekt/Hotel“, „Korrektur“ + Freitext 140; Folgesatz „Automatische Einstufung wird für diese Karte ausgeschaltet.“; Primär „Festlegen“.
- Nur Leitung. Mitarbeitende sehen das Popover lesend mit Satz „Stufe festlegen darf die Leitung.“ + „Leitung bitten“.
- Ausführung: `save` (`stufe`, `stufe_manuell=1`) + Kommentar „Stufe festgelegt – Grund: …“ (bis Feld `stufe_manuell_grund` existiert, dann Feld). Undo-Toast 8 s Variante B (Gegenaktion: alte Stufe + alter `stufe_manuell`).
- Danach Zusatz am Kennzeichen „von Hand“ + Link „Automatik wieder zulassen“ (`stufe_manuell=0`, danach `umsatz_neu_berechnen`, Undo 8 s).
- Bericht „Manuelle Stufen“ für Leitung (Filter in Kartenliste `stufe_manuell=1`, gespeicherter Reiter) – Gleichbehandlungsnachweis.

#### 3.5.5 Einwilligung erfassen / beenden
**Dialog „Einwilligung zur Auswertung der Einkäufe erfassen“** (md 560; iPad Vollbild-Sheet):
```
┌ Einwilligung zur Auswertung der Einkäufe erfassen ─────────────────────── × ┐
│ Text, den die Kundin bestätigt hat  [kundenkarte-auswertung-v1 ▾] (aus Einst.)│
│ ▸ Text anzeigen (14 px, Sie-Form)                                            │
│ Wie erteilt?   (•) Unterschrift im Showroom  ( ) Brief  ( ) Tablet (Kundenmodus) │
│ Nachweis       [Foto aufnehmen] [Datei wählen]   (Pflicht)                   │
│ ☐ Die Kundin hat die Datenschutzinformation erhalten (Version 2026-11)       │
│ [An Kundin übergeben]  (öffnet Kundenmodus, Nachweis = Tablet-Bestätigung)   │
│                                              [Abbrechen]  [Erfassen]         │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Primär deaktiviert bis Nachweis + Häkchen (Satz darunter „Nachweis und Datenschutzinformation fehlen“). Ausführung: Datei-Upload (`uploadFile`, privat, an PH Kundenkarte) → bis `einwilligung_erteilen` existiert: `save` (`einwilligung_auswertung=1`, `einwilligung_textversion`) + Kommentar „Einwilligung erfasst · Kanal … · Nachweis <Datei> · Datenschutzinfo <Version>“; Ereignis `Einwilligung` schreibt der Controller. Danach automatisch `umsatz_neu_berechnen`; Toast „Einwilligung erfasst · Einstufung wird geprüft“; Stufenblock füllt 400 ms.
- Fehler: Textversion fehlt in den Einstellungen → Feldfehler „Textversion zuerst in den Einstellungen anlegen (Leitung).“
- Kein Undo (Rücknahme = Widerruf).

**Dialog „Auswertung für Anna Muster beenden?“** (sm 400): Pflicht „Wie widerrufen?“ (Showroom · Telefon · Brief · E-Mail · Portal); Fakten: „Umsatzangaben werden gelöscht · Stufe wird Platzhirsch · Gespeicherte Umsatzwerte im Verlauf werden gelöscht · Zeitpunkt wird vermerkt“; bei `stufe_manuell`: „Stufe bleibt (von Hand festgelegt)“. Primär neutral „Beenden“, Fokus auf Abbrechen. Ausführung `save` (`einwilligung_auswertung=0`) + Kommentar mit Kanal; Leeren der Umsatzwerte in Ereignissen = Backend-Abhängigkeit (P7).

#### 3.5.6 Lebenszyklus-Dialoge
| Dialog | Größe | Inhalt | Ausführung | Rückmeldung |
|---|---|---|---|---|
| Sperren… | sm 400 | Grund Pflicht als Chips aus `sperrgruende()` (Verlust, Diebstahl, Beschädigt, Missbrauch, Kundenwunsch, Dublette, Datenschutz, Verstorben, Sonstiges [Text Pflicht]); Satz „Die Karte wird an der Kassa abgelehnt.“ + je Grund „Entsperren ist danach nicht möglich“ (endgültige Gründe) | Variante A 8 s → `sperren(grund, sperrgrund_art)` | Toast „Karte KK-… gesperrt · Rückgängig“; bei Verlust/Diebstahl/Beschädigt danach Vorschlag „Ersatzkarte ausstellen“ |
| Ersatzkarte… | sm 400 | Grund Pflicht (Verlust, Diebstahl, Beschädigt); Satz „Neue Nummer. Stufe, Einwilligung, Berater und genutzte Vorteile werden übernommen. Die alte Karte wird ungültig.“ | `ersatzkarte_ausstellen(sperrgrund_art, grund)` (kein Undo, erzeugt Dokument) | Ergebnis-Karte mit neuer Nummer, „Karte drucken“, „Karte öffnen“ |
| Übertragen… (Leitung) | md 560 | Ziel-Kontakt (Link-Suche, „neu anlegen“), Grund (Partner/Haushalt, Erbe, Firmennachfolge, Sonstiges), Satz „Neue Nummer für die neue Person. Stufe bleibt, Einwilligung und Umsätze gehen nicht über.“; optional Einwilligung der neuen Person nur mit Nachweis (wie §3.5.5) | `uebertragen(...)` | Ergebnis-Karte |
| Zusammenführen… (Leitung) | md 560 | Plan aus `zusammenfuehren_mit(nur_plan=1)`: Ziel-Karte, was bleibt (Stufe, Einwilligung, Einlösungen umgehängt), Warnungen (z. B. Missbrauch-Sperre); Haken „Verschiedene Kontakte – trotzdem“ nur wenn nötig | `zusammenfuehren_mit(andere, 0, …)` | Toast + Link Zielkarte |
| Kündigen… (Leitung) | sm 400, gefährlich | Wer: Kundin/Platzhirsch; Grund (Text); Satz „Endgültig. Eine neue Karte kann später ausgestellt werden; Einlösungen und Verlauf bleiben. Zugesagte Leistungen aus Aufträgen bleiben gültig.“ Fokus Abbrechen, Primär rot | `kuendigen(grund)` + Kommentar „Kündigung durch …“ (bis Feld `kuendigung_durch`) | Band neutral |
| Entsperren (Leitung) | sm 400 | „Karte KK-… wieder aktivieren?“ | `entsperren()` | Band weg |
| Übergabe aktivieren | kein Dialog | – | Variante A 8 s → `karte_uebergeben(ort)` | Toast „Karte aktiviert · Rückgängig“ |

#### 3.5.7 Popover „Vorteil einlösen“ (an der Kachel, 360 px, öffnet 160 ms `--bo-ease-out` `translateY -4px→0` + Fade)
```
┌ Lieferung im Liefergebiet einlösen ───────── × ┐
│ Beleg wählen                                   │
│ › file-text  AB-2026-0123   02.11.  Küche      │
│ › receipt    KB-2026-04412  28.10.             │
│ › package    BE-2026-0210   abholbereit        │
│ › search     Anderen Beleg suchen …            │
│ (Ohne Beleg – nur Beratung und Events)         │
│ ▸ Mehr: Ort [Showroom ▾] · Kommentar           │
└────────────────────────────────────────────────┘
```
- Liste: bis 5 offene Belege des Kontakts (Bezugs-Registry `bezuege.js`, Typen nach Vorteil-Art, §4.6), Typ-Icon, Nummer mono, Datum, Kurzinfo; Betrag nur mit Recht. „Anderen Beleg suchen …“ = eine Combobox über alle erlaubten Typen, Typ aus Präfix erkannt (`AB-`, `KB-`, `BE-`, `RE-`, `LS-`, `MA-` …; Präfixe aus den Naming-Series der Apps).
- **Ein Klick/Enter auf eine Zeile = einlösen:** Popover schließt, Toast „Lieferung im Liefergebiet eingelöst · Rückgängig“ mit 8-s-Balken; Kachel sofort optimistisch (Zahl springt, Hintergrund `accent-soft` → transparent 1200 ms). Nach Ablauf `vorteil_einloesen(vorteil, bezug_doctype, bezug, kommentar, ort)`. Seitenwechsel → `flush()` (sofortiger Commit).
- „Ohne Beleg“ nur für Art Persönlich und Event (Steuer-Prüfauftrag §15); bei Lieferung/Montage/Pflege fehlt die Zeile, Satz „Bitte Auftrag, Lieferschein, Montageauftrag oder Beleg wählen.“
- Ort automatisch aus Arbeitsplatz („Showroom“ im Backoffice); Kommentar/Ort unter „Mehr ▾“.
- Fokus danach auf Kachel-Überschrift (`tabindex="-1"`), Live-Region polite „Pflegetermin im Jahr eingelöst. 0 von 1 verbleibend, wieder ab 01.01.2027.“; Undo stellt Knopf wieder her und setzt den Fokus darauf.
- Leer: „Keine offenen Belege der Kundin.“ (Suche bleibt). Suche nicht erreichbar: „Belegsuche gerade nicht möglich.“ + „Erneut“ (+ „Ohne Beleg einlösen“ nur bei erlaubter Art).
- Fehler nach Commit (409 `card_pending`, `card_blocked`, `card_replaced`, `card_transferred`, `card_cancelled`, `benefit_inactive`, `tier_too_low`, `benefit_not_in_tier`, `limit_reached`): Kachel zurück, Fehler-Toast mit Klartext + „Erneut“. Seite schon verlassen: Fehler-Toast bleibt bis geschlossen (`role="alert"`) „Einlösung für Anna Muster nicht gespeichert – Limit erreicht.“ + „Zur Karte“. Wettlauf: „Gerade an anderer Stelle eingelöst – Stand aktualisiert.“, Kachel lädt neu, Shake 240 ms nur am Knopf.
- Telefon/iPad hochkant: Popover als Bottom-Sheet.
- Der md-Dialog (`EinloeseDialog`) existiert nur für `/kundenkarte/einloesungen` und Palette (vorangestelltes Kartenfeld `data-scan="ja"`, danach dieselbe Belegliste).

### 3.6 Einlösungen `/kundenkarte/einloesungen`

```
┌ Zentrale › Kundenkarte › Einlösungen                                               [Einlösen…] ┐
├ [Eingelöst] [Zugesagt] [Storniert]  [⌕ Kunde, Vorteil] [Vorteil ▾] [Ort ▾] [Zeitraum ▾] [Gruppieren ▾] ┤
│ ☐ Datum          Kunde          Vorteil                    Ort        Beleg           Durch        │
│ ☐ heute 10:40    Anna Muster    Lieferung im Liefergebiet  Packtisch  BE-2026-0210    T. Steiner   │
│ ☐ gestern 16:02  Fam. Huber     Pflegetermin im Jahr       Service    PFL-2026-0012   L. Moser     │
├ 2 Einlösungen (Anzahl, keine Euro)                                                   [CSV]       ┤
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Standard: 30 Tage, `eingeloest_am desc`. Reiter „Zugesagt“ erscheint erst mit Fähigkeit `einloesung_zugesagt`.
- „Durch“: Avatar 24 + „T. Steiner“. Storniert: Status grau, Vorteilstitel durchgestrichen, Stornogrund als Untertext.
- Zeilenmenü: Öffnen (Sheet 480), Karte öffnen, Beleg öffnen, Stornieren… – sichtbar nach Regel: Leitung oder einlösende Person **bis heute 23:59**; sonst Satz im Sheet „Stornieren darf die Leitung oder die einlösende Person bis heute 23:59.“ + „Leitung bitten“.
- Sheet: alle Felder **readonly** (keine Korrektur von Datum/Vorteil/Beleg – Limitschutz), Kommentar bleibt editierbar; Stornoblock; Dialog „Stornieren“ (Grund Pflicht, Satz „Nachweis bleibt als storniert erhalten; eine neue Einlösung ist danach möglich.“).
- Leer: „Noch keine Einlösungen – sie entstehen an Kassa, Packtisch, im Service oder hier.“

### 3.7 Stufen & Vorteile `/kundenkarte/stufen`

```
┌ Zentrale › Kundenkarte › Stufen & Vorteile                                    [Vorteil anlegen] [Übersicht drucken] ┐
├──────────────────────────┬──────────────────────────┬──────────────────────────┬────────────────────────────────────┤
│ [▭] Platzhirsch       1  │ [▭] Platzhirsch Plus   2 │ [▭] Platzhirsch Privé  3 │ KATALOG                            │
│ Startstufe · 330 Karten  │ ab 10.000 € · 68 Karten  │ ab 50.000 € · 14 Karten  │ [⌕] [Art ▾] [Aktiv ▾]              │
│ „Ihre Kundenkarte: …“    │ „Zusätzlich zu …“        │ „Zusätzlich zu Plus …“   │ › user-round Persönliche Beratung  │
│ ─ Vorteile ───────────── │ ─ Vorteile ───────────── │ ─ Vorteile ───────────── │ › truck Lieferung im Liefergebiet  │
│ › Persönliche Beratung   │ › Lieferung im Liefergeb.│ › Montage durch unser T. │ › droplets Pflegetermin im Jahr    │
│ › Vorab-Zugang Events    │ › Verlängerte Umtauschfr.│ › Pflegetermin im Jahr   │ …                                  │
│ [+ Vorteil zuordnen]     │ [+ Vorteil zuordnen]     │ [+ Vorteil zuordnen]     │                                    │
│ enthält: –               │ enthält alles aus Platzh.│ enthält alles aus Plus   │                                    │
├──────────────────────────┴──────────────────────────┴──────────────────────────┴────────────────────────────────────┤
│ Ungespeichert: 2 Stufen geändert · Lieferung gilt dann zusätzlich für Platzhirsch (330 Karten)  [Verwerfen] [Speichern ⌘S] │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Spalte je aktive Stufe. Kopf (Fokus-Roving, `←→`) öffnet Stufen-Sheet: `stufenname` (nach Anlage fest), `reihenfolge`, Schwelle (Betragsfeld; Satz „muss mit der Reihenfolge steigen“), `farbe` (Hex + 8 Vorschläge aus Rohfarben 03 §1.2, Vorschau `StufenKennzeichen` + Mini-Karte, Live-Kontrast gegen `surface` hell/dunkel; < 3:1 → „Ring wird ergänzt“; Farbe = Status-Ton aus 03 §1.2 → Warnung „Diese Farbe ist für Status reserviert.“), `beschreibung_kunde` (Live-Textprüfung), `beschreibung_intern`, `aktiv` (Deaktivieren nur, wenn keine Karte Aktiv/Gesperrt/Beantragt auf der Stufe; sonst Satz „14 Karten zuerst umstufen“ – Umstufen ist Backend-Abhängigkeit P14, bis dahin Schalter deaktiviert mit diesem Satz).
- **Eine Wahrheit:** die UI zeigt nur die Zuordnung (Kindtabelle `vorteile`). Beim Speichern setzt die Server Action `gilt_ab_stufe` jedes betroffenen Vorteils = niedrigste zugeordnete Stufe. Im Vorteil-Sheet ist `gilt_ab_stufe` nur lesend („gilt ab Platzhirsch – folgt aus der Zuordnung“). Altdaten-Widerspruch: Warnzeile in der Spalte „Lieferung ist zugeordnet, gilt aber erst ab Plus – hier nicht einlösbar · Angleichen“.
- Zuordnen per „+ Vorteil zuordnen“ (Combobox, nur aktive, nicht schon zugeordnete), Ziehen zwischen Spalten oder Menü „Verschieben nach …“ (WCAG 2.5.7). „enthält alles aus …“ macht die Vererbung sichtbar.
- **Speicherleiste** fasst alle Änderungen zusammen inkl. Folge aus `stufenplan_vorschau(stufen)`: „2 Stufen geändert · 12 Karten würden aufsteigen, 0 absteigen“. Ein Speichern: nacheinander `save` je Stufe + Vorteile; Teilfehler → Rücknahme der bereits gespeicherten (vorher geladene Fassung zurückschreiben), Fehler je Feld. Danach Toast „Gespeichert · Karten werden neu eingestuft“ und `umsatz_alle_neu_berechnen()` (Hintergrundjob).
- Vorteil-Sheet: `titel`, `art` (Label-Tabelle), `aktiv`, `einloesbar_pro_jahr` (0 → „unbegrenzt“), `reihenfolge`, `beschreibung_kunde` (Live-Prüfung), `beschreibung_intern`, Zähler „in 2 Stufen zugeordnet · 27 Einlösungen (12 Monate)“. Deaktivieren statt Löschen. Zielmodell: `bezug_pflicht`, `bezug_typen` (Fähigkeit).
- **Live-Textprüfung:** Client-Regex = Server (`GELD_RE`, `SUPERLATIV_RE` aus `ph_kundenkarte_stufe.py`) **plus** `Gutschrift|Gutschein|gratis|kostenlos` (Server-Anfrage P13); Satz unter dem Feld: „Kundentexte versprechen keine Beträge, Prozente, Gutscheine oder Superlative („10 %“).“
- Leer: Katalog „Noch keine Vorteile. Vorteile sind Leistungen wie Lieferung oder Pflegetermin – ohne Geldwert.“ + „Vorteil anlegen“; keine Stufen: „Noch keine Stufen angelegt.“ + Leitung „Standardstufen anlegen“ (`stammdaten_anlegen()`); Stufe ohne Vorteile: „Dieser Stufe ist noch kein Vorteil zugeordnet.“ + „+ Vorteil zuordnen“.
- Mitarbeitende: lesend, keine Schwellen-Beträge.

### 3.8 Berichte `/kundenkarte/berichte/[report]`

| Report | Sicht | UI |
|---|---|---|
| `PH Kundenwert` | Leitung, GF | Euro-Spalten; Mitarbeitende sehen den Bericht nicht in der Liste; Server Action leert €-Spalten zusätzlich für Nicht-Leitung (bis Report P15 serverseitig). Band „Berechnung im Aufbau“ solange B1–B8 fehlen. |
| `PH Stufenwechsel` | Mitarbeitende (ohne €), Leitung | Richtung als Text + Icon (Aufstufung `arrow-up`, Herabstufung `arrow-down`), Auslöser automatisch/von Hand |
| `PH Vorteile Nutzung` | Mitarbeitende | Balken je Vorteil (früheres Übersicht-Chart), Fußnote „Kosten bewusst nur als Anzahl“ |
| `PH Karten ohne Einkauf 12 Monate` | Leitung; Berater: Filter „Meine Karten“ clientseitig | Massenaktion „Aufgabe an Berater“ mit **Kanal-Vorschau**: „8 von 12 – 4 ohne Werbeeinwilligung (nur Brief möglich) · 1 mit Widerspruch (keine Aufgabe)“; Aufgabentitel „Persönlich melden – per Brief“ bzw. erlaubter Kanal; Karten ohne Einwilligung „nicht beurteilbar“ grau |
| „Manuelle Stufen“ | Leitung | gespeicherte Kartenansicht (`stufe_manuell=1`) mit Grund |

Allgemein: Filterformular oben, Zeitraum je Benutzer serverseitig (localStorage nur Rückfall), CSV mit Recht, Zeitlimit 8 s → „Zeitraum eingrenzen“. Leer: „Keine Daten im Zeitraum.“

### 3.9 Einstellungen `/kundenkarte/einstellungen` (Zahnrad)

Abschnitte: **Stufen** (`startstufe`, `bewertungszeitraum_monate`, `herabstufung_erlaubt` mit Erklärsatz, `umsatz_nur_mit_einwilligung` readonly mit Schloss) · **Anträge** (`doi_pflicht`, `doi_gueltig_stunden`, `website_automatisch_annehmen` mit Folgesatz „Aus = jeder Website-Antrag erscheint unter ‚Zu entscheiden‘“, `berater_standard`, `bedingungen_version` – leer: Warnband „Teilnahmebedingungen ohne Version – vor dem Ausstellen eintragen“) · **Texte** (`text_begruessung` mit Vorschau Begrüßungsschreiben, `text_datenschutz_karte` mit Vorschau Kartenrückseite; Textversionen der Einwilligung und Datenschutzinformation als Liste – bis eigene Felder existieren, steht die aktuelle Version in `text_datenschutz_karte`/Konfiguration der Server Action) · **Wallet** (Kennungen; Zustand je Plattform aus `wallet_status()` als „eingerichtet / nicht eingerichtet – Administrator“). Speicherleiste, ⌘S. Mitarbeitende lesend.

### 3.10 Neue Karte (Formular, Dialog lg 800 / iPad Vollbild-Sheet)

```
┌ Neue Kundenkarte ──────────────────────────────────────────────────────────────────── × ┐
│ PERSON                                              │ LEGT AN                             │
│ [⌕ Kontakt suchen … ]  oder  + Neu anlegen          │ Kontakt Anna Muster (neu)           │
│ Vorname [Anna]  Nachname [Muster]                   │ Karte – aktiv, Platzhirsch          │
│ E-Mail [anna@…]                                     │ Nachweis Teilnahmebedingungen 2026-11│
│ ▸ Telefon, Anschrift, Sprache                       │ Einwilligung Auswertung (Foto)      │
│ ! Karte besteht bereits: KK-9M2PT4 › öffnen         │                                     │
│ EINWILLIGUNGEN                       [An Kundin übergeben] │                              │
│ ☐ Teilnahmebedingungen akzeptiert (Version 2026-11) Pflicht │                             │
│ ☐ Datenschutzinformation übergeben (Version …)      Pflicht │                             │
│ ☐ Volljährig bestätigt                              Pflicht │                             │
│ ○ Einkäufe für die Einstufung auswerten (optional) → Nachweis [Foto] Pflicht, wenn an     │
│ ○ Newsletter (optional, Bestätigung per E-Mail durch Marketing)                            │
│ ▸ Weitere Angaben: Geburtstag (Tag/Monat), Interessen, Berater, Stufe (Leitung),          │
│   Erst bei Übergabe aktivieren                                                             │
│                                                         [Abbrechen]  [Karte ausstellen ⌘↵] │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Person: Link-Suche PH Kontakt (vorbefüllt per `?kontakt=`), inline „Neu anlegen“ (Vorname, Nachname, E-Mail; eingeklappt Telefon, Straße, PLZ, Ort, Land, Sprache). **Prüfungen sofort unter dem Personenfeld:** Kontakt hat Karte (Aktiv/Gesperrt/Beantragt) → Hinweis mit Link, Primär deaktiviert; offener Antrag mit gleicher E-Mail → „Antrag PH-KKA-… offen – dort ausstellen“ mit Link; Kontakt `kontaktart = Geschaeft` → Hinweis nach Inhaber-Entscheidung (§15; Vorschlag: nur Privatpersonen, dann Primär deaktiviert mit Satz).
- **Ohne E-Mail** (Fähigkeit `antrag_ohne_email`): Anschrift Pflicht, Satz „Ohne E-Mail: kein Kundenportal und kein Wallet-Pass. Die Begrüßung kommt per Post.“; Ergebnis-Karte Primär „Begrüßung + Karte drucken“ (Pflichtschritt). Bis die Fähigkeit da ist: E-Mail Pflicht, Satz „Karten ohne E-Mail sind noch nicht möglich.“
- Einwilligungen: Teilnahmebedingungen, Datenschutzinformation, Volljährigkeit Pflicht (ohne `bedingungen_version` in den Einstellungen ist das Formular gesperrt). Auswertung optional; eingeschaltet → Nachweis Pflicht (Foto/Datei → `nachweis` + `nachweis_art` am Antrag; Kundenmodus-Bestätigung = `nachweis_art` „Unterschrift Tablet“). Felder, die das Backend noch nicht hat (`datenschutzinfo_version`, `volljaehrig_bestaetigt`), schreibt die Server Action bis dahin als Kommentar am Antrag.
- Kanal aus Arbeitsplatz (Showroom), Quelle `showroom` (Kassa-Kurzform `kassa`, Event `event`).
- Live-Satz rechts berechnet Status aus `sofort_aktiv`.
- Ausführung (Server Action, eine Transaktion aus Sicht der UI): `insert PH Kundenkarte Antrag` mit `idempotency_key = kk-neu:<kontakt|email>:<sitzungs-uuid>` → Upload Nachweis → `annehmen(kontakt, stufe, sofort_aktiv)`. `DuplicateEntryError` → vorhandenen Antrag laden, dessen Karte zurückgeben.
- Ergebnis-Karte (04 §3.13): Häkchen 400 ms, Kartennummer groß, QR, „Karte + Begrüßung drucken“ (Primär), „Karte öffnen“, „Nächste Karte“.
- `Esc` mit Eingaben → „Eingaben verwerfen?“. Entwurf in sessionStorage (try/catch).

### 3.11 Kundenkarte in der Kundenakte `/kunden/[kontakt]` (CRM-Querverweis)
- Kopf-Chip `StufenKennzeichen` + „KK-7K3QX9“ → Karten-Akte. Ohne Karte (Privatkontakt): Ghost-Knopf „Kundenkarte ausstellen“ (§3.10 mit `?kontakt=`). Bei `nicht_kontaktieren = 1`: Chip bleibt, Ausstellen bleibt möglich (Vertrag, keine Werbung), Geburtstags- und Reaktivierungsaufgaben entfallen (§8).
- Tab Marketing: Zeile Kundenkarte (Status, Stufe, Auswertung ja/nein, letzte Einlösung).
- Tab Datenschutz: Einwilligung „Auswertung der Einkäufe“ mit „Beenden…“ (gleicher Dialog §3.5.5); Datenauskunft und Anonymisieren über die ph_crm-Hooks (`ph_kontakt_datenauskunft`, `ph_kontakt_anonymisieren`) inkl. Karte, Einlösungen, Ereignisse, Anträge.

### 3.12 Kundenmodus (iPad, `/kundenkarte/kundenmodus/[sitzung]`)
- Start: Knopf „An Kundin übergeben“ (Neue Karte, Einwilligung erfassen). Vollbild ohne Seitenleiste/Palette/Kürzel, Sie-Form, Text 18 px, Schalter 44 px, voller Einwilligungstext mit Version, Knopf „Fertig – zurück an die Beratung“.
- Inhalte nur der aktuellen Person; keine Navigation. Zurück-Geste abgefangen (`history.pushState` + `popstate` bleibt im Modus).
- Rückkehr erst nach Bediener-Bestätigung: Langdruck 600 ms mit Fortschrittsring **oder** Bediener-PIN (`verify_pin`, gleiche Komponente wie Kiosk-Bedienerwechsel).
- Übergang 200 ms Crossfade `--bo-ease-inout`, reduce: sofort. Idle 2 min → zurück zur Beraterin (nach PIN), Eingaben bleiben.
- Ergebnis: bestätigte Schalter + Zeitstempel → Nachweis `nachweis_art = Unterschrift Tablet` (Fingerunterschrift auf Canvas als PNG an `nachweis`).
- Kein Auslöser durch Drehen (WCAG 1.3.4).

---

## 4. Zustände, Aktionen, Regeln

### 4.1 Zustandsautomaten (heute im Backend; Zielmodell markiert)

```
[PH Kundenkarte Antrag]
  insert(quelle=website)          → Neu (doi_noetig, wenn doi_pflicht)
  insert(quelle≠website)          → Bestaetigt
  doi_bestaetigen()               Neu → Bestaetigt (nur API)
  annehmen(kontakt, stufe, aktiv, sofort_aktiv)  Neu|Bestaetigt → Angenommen ⇒ PH Kontakt + PH Kundenkarte
                                  (Neu + doi_noetig: nur Leitung); bestehende Karte ⇒ als_doppelt
  ablehnen(grund)                 → Abgelehnt      als_doppelt(karte, kontakt) → Doppelt
  Scheduler 03:30                 Neu (doi_noetig, > 30 Tage) → Abgelehnt

[PH Kundenkarte]
  insert                          → Aktiv | Beantragt (sofort_aktiv=0 oder Website ohne Auto-Annahme)
  karte_uebergeben(ort) / hand_over_card   Beantragt → Aktiv
  sperren(grund, sperrgrund_art)  Aktiv → Gesperrt
  entsperren()                    Gesperrt → Aktiv (Leitung; nicht bei endgültigen Sperrgründen)
  kuendigen(grund)                Aktiv|Gesperrt|Beantragt → Gekuendigt
  ersatzkarte_ausstellen(...)     Aktiv|Gesperrt → Ersetzt  ⇒ neue Karte (übernimmt Stufe, Einwilligung, Berater; Limits über Kette)
  uebertragen(...)                → Uebertragen ⇒ neue Karte für Ziel-Kontakt (Stufe bleibt, Einwilligung/Umsatz nicht)
  zusammenfuehren_mit(...)        Quelle → Zusammengefuehrt (Einlösungen umgehängt)
  save(stufe)                     ⇒ stufe_manuell=1, Ereignis
  save(einwilligung_auswertung)   1: Ereignis Einwilligung · 0: Umsatz leer, Startstufe, Ereignis Widerruf
  umsatz_neu_berechnen()          nur mit Einwilligung
  Hook ph_kontakt_anonymisieren   → Gekuendigt (Datenschutz), Personenbezug entfernt

[PH Kundenkarte Einloesung]
  insert                          → Eingeloest (Prüfung: Karte aktiv, Vorteil aktiv, Stufe, Zuordnung, Limit/Jahr)
  stornieren(grund)               Eingeloest → Storniert (Leitung oder eigene am selben Tag)
  doc_events Storno-Kaskade       Beleg storniert → Einlösungen mit diesem Bezug → Storniert
  ZIEL (Fach PR1): insert bei AB  → Zugesagt ; Lieferschein/Montageabnahme erledigt → Eingeloest ; AB storniert → Storniert
```

### 4.2 Aktionskatalog

| Ort | Knopf | Aufruf | Rolle | Klasse | Rückmeldung |
|---|---|---|---|---|---|
| Antrag | Karte ausstellen | `Antrag.annehmen` | Mitarbeiter (Bestätigt), Leitung (ohne Mail-Bestätigung) | Dialog mit Vorschau | Ergebnis-Karte |
| Antrag | Ablehnen… / Als doppelt… | `ablehnen` / `als_doppelt` | Mitarbeiter | Bestätigung | Band im Kopf |
| Antrag | Kontakt suchen/verknüpfen | `kontakt_suchen`, `setValue kontakt` | Mitarbeiter | – | Trefferliste |
| Karte | Vorteil einlösen | `vorteil_einloesen` | Mitarbeiter | Variante A 8 s | Kachel, Live-Region |
| Karte | Übergabe aktivieren | `karte_uebergeben` | Mitarbeiter | Variante A 8 s | Toast |
| Karte | Sperren… | `sperren(grund, art)` | Mitarbeiter | Grund-Dialog + Variante A 8 s | Band |
| Karte | Entsperren | `entsperren` | Leitung | Bestätigung | Band weg |
| Karte | Ersatzkarte… | `ersatzkarte_ausstellen` | Mitarbeiter | Dialog | Ergebnis-Karte |
| Karte | Übertragen… / Zusammenführen… | `uebertragen` / `zusammenfuehren_mit` | Leitung | Dialog mit Plan | Ergebnis/Toast |
| Karte | Kündigen… | `kuendigen` | Leitung | gefährlich | Band |
| Karte | Stufe festlegen | `save stufe, stufe_manuell` + Kommentar | Leitung | Popover, Variante B 8 s | Kennzeichen „von Hand“ |
| Karte | Automatik wieder zulassen | `save stufe_manuell=0` + `umsatz_neu_berechnen` | Leitung | Variante B 8 s | Toast |
| Karte | Einwilligung erfassen | Upload + `save` + Kommentar → Ziel `einwilligung_erteilen` | Mitarbeiter | Dialog mit Nachweis | Stufenblock füllt |
| Karte | Auswertung beenden… | `save` + Kommentar → Ziel `einwilligung_widerrufen` | Mitarbeiter | Bestätigung | Toast |
| Karte | Neu berechnen | `umsatz_neu_berechnen` | Mitarbeiter (nur mit Einwilligung) | sofort | Toast „Einstufung geprüft · 5 Einkäufe“ |
| Karte | Wallet-Pass erneuern | `wallet_pass_erneuern` | Mitarbeiter | sofort | Toast „Pass wird beim nächsten Abruf neu gebaut“ |
| Karte | Berater | `setValue persoenlicher_berater` | Mitarbeiter | sofort + Undo 8 s | Häkchen |
| Karte | Drucken | `/druck/...?format=` | Mitarbeiter | – | Druckpanel |
| Karte | Leitung bitten | `insert PH Aufgabe` (an Leitung, Referenz Karte) | Mitarbeiter | sofort | „Angefragt bei Leitung · 10:12“ |
| Einlösung | Stornieren… | `Einloesung.stornieren` | Leitung / eigene bis 23:59 | Bestätigung | Status grau |
| Stufen | Speichern | n × `save` + `gilt_ab_stufe` + `umsatz_alle_neu_berechnen` | Leitung | Speicherleiste mit Vorschau | Toast |
| Einstellungen | Speichern | `save` Single | Leitung | Speicherleiste | Toast |

Oberfläche sagt nie „Submit/Cancel“.

### 4.3 Umkehrbar vs. Bestätigung

| Aktion | UI |
|---|---|
| Berater, Kanal, Geburtstag, Automatik zulassen, Stufe festlegen | sofort/Popover + Undo 8 s (Variante B) |
| Vorteil einlösen, Übergabe aktivieren, Sperren, Massen-Sperren | Variante A 8 s (kein Datensatz bis Ablauf, `flush()` bei Navigation) |
| Antrag ausstellen, Ersatzkarte, Übertragen, Zusammenführen, Einwilligung erfassen | Dialog mit Vorschau, kein Undo |
| Ablehnen, Doppelt, Kündigen, Entsperren, Storno, Auswertung beenden | Bestätigung mit Folge in einem Satz; Kündigen/Ablehnen/Storno rot; Fokus auf Abbrechen |

### 4.4 Massenaktionen

| Liste | Aktion | Umsetzung | Vorschau |
|---|---|---|---|
| Karten | Berater zuweisen | n × `setValue` | „Setzt Berater für 12 Karten (2 hatten bereits einen)“, Undo 8 s |
| Karten | Drucken (Karten / Begrüßungen) | Sammeldruck max. 50 | Seitenzahl |
| Karten | Aufgabe an Berater | n × `insert PH Aufgabe` mit Kanal-Prüfung (§8) | Kanal-Vorschau |
| Karten | Neu einstufen | n × `umsatz_neu_berechnen` (nur mit Einwilligung), > 20 Karten → `umsatz_alle_neu_berechnen` | „8 von 12 möglich – 4 ohne Einwilligung“; Fortschritt `aria-live` alle 5; Abbruch nach aktuellem Dokument; Timeout 8 s je Aufruf |
| Karten | Sperren… (Mehr) | n × `sperren`, ein Grund, Variante A 8 s | nur Aktiv |
| Karten | Exportieren | CSV Leitung/GF, Allowlist-Felder | – |
| Anträge | Ablehnen…, Als doppelt… | n × Methode | nur offene |
| Einlösungen | Exportieren | CSV | – |

### 4.5 Statusfarben Kundenkarte (in 03 §1.5 als Zeile „Kundenkarte“ eintragen)

| Objekt | Wert → Label → Ton |
|---|---|
| Antrag | Neu → „Neu“ blau · Bestaetigt → „Bestätigt“ türkis · Angenommen → grün · Abgelehnt → rot · Doppelt → grau |
| Karte | Beantragt → „Beantragt“ orange · Aktiv → grün (in Listen ausgeblendet) · Gesperrt → rot · Gekuendigt → „Gekündigt“ grau · Ersetzt, Uebertragen → „Übertragen“, Zusammengefuehrt → „Zusammengeführt“ grau |
| Einlösung | Zugesagt → türkis · Eingeloest → „Eingelöst“ grün · Storniert → grau + Titel durchgestrichen |

Stufen haben **keine** Statusfarbe (eigene Komponente `StufenKennzeichen`, §10).

### 4.6 Bezugsregeln je Vorteil-Art (Bezugs-Registry `bezuege.js`)

| Art | Erlaubte Belege (heute) | Ziel (nach Backend P5) | Ohne Beleg |
|---|---|---|---|
| Lieferung | PH Bestellung (Shop-Paket), PH Kassenbeleg, PH Rechnung | + PH Auftragsbestaetigung (Zusage), PH Lieferschein (Erbringung) | nein |
| Montage | PH Serviceauftrag, PH Rechnung | + PH Auftragsbestaetigung, PH Montageauftrag (Erbringung bei Abnahme) | nein |
| Pflege | PH Pflege Abo, PH Serviceauftrag | gleich | nein |
| Service | PH Serviceauftrag | gleich | nein |
| Event | PH Event | gleich | ja |
| Persönlich | beliebig erlaubter Typ | gleich | ja |
| Sonstiges | beliebig erlaubter Typ | gleich | nein |

Bis P5: Möbel-Lieferung per Tour und Montage zu einer AB sind **nicht einlösbar**; die Kachel zeigt bei Lieferung/Montage den Satz „Bei Möbeln aus einem Auftrag wird die Leistung im Auftrag vermerkt“ und die AB-Position 0,00 € (§7.5) ist der Nachweis. Kalenderjahr des Limits: Belegdatum des Bezugs, falls vorhanden (Backend-Anfrage).

---

## 5. Kennzahlen und Charts

| Element | Quelle |
|---|---|
| Aktive Karten | Number Card `PH Aktive Kundenkarten` |
| Anträge zu entscheiden | `count PH Kundenkarte Antrag` Reiter-Filter (Number Card `PH Offene Antraege` zählt auch „Wartet auf Mail“ – nicht verwenden) |
| Neue Karten 30 Tage | `count PH Kundenkarte ausgestellt_am ≥ heute−30` |
| Einlösungen 30 Tage | `kennzahlen.einloesungen_30_tage` (Custom Number Card) + `count status=Storniert` |
| Karten je Stufe | Dashboard Chart `PH Karten je Stufe`, Farbe = Stufenfarbe, Direktwert |
| Neue Karten je Monat | Dashboard Chart `PH Neue Karten je Monat`, Linie 400 ms beim Erscheinen |
| Einlösungen je Vorteil | im Bericht „Vorteile Nutzung“ |
| Heute: Geburtstage | `count PH Aufgabe referenz_doctype=PH Kundenkarte, faellig=heute, status=Offen, titel like Geburtstag%` |
| Zuletzt geändert | `ph_core.api.aktivitaet.recent_activity(limit=10, bereiche=["kundenkarte"])`; Einlösungen bis zur ph_core-Erweiterung über `getList PH Kundenkarte Einloesung` (5) |

Keine Euro in Charts. Keine Umsatz-Sparkline in der Akte.

---

## 6. Druck

| Ausgabe | Print Format | Aufruf | UI |
|---|---|---|---|
| Karte Vorder-/Rückseite | `PH Kundenkarte Karte` | `/druck/ph-kundenkarte/[nr]?format=…` | Druckpanel 480 px mit Vorschau, „Drucken“, „PDF“, Hinweis „Kartendrucker-Profil im Druckdialog wählen“ |
| Begrüßungsschreiben | `PH Kundenkarte Begruessung` | wie oben | fehlende Anschrift → Warnband „Anschrift unvollständig – Kundenakte öffnen“; Kontakt ohne E-Mail → Pflichtschritt nach Ausstellen |
| Karte + Begrüßung | beide, ein PDF | Sammeldruck (Fundament) | Standard nach Ausstellen |
| Vorteilsübersicht | `PH Kundenkarte Vorteilsuebersicht` | `/druck/ph-kundenkarte-stufe/[stufe]?format=…` | Stufenplan, Übersicht `⋯` |
| QR | `qr_svg` | Download SVG/PNG | Details › Wallet & QR |

Drucken = `⌘P` bzw. Aktionsmenü. Fehler `unavailable` (PDF-Dienst) → „HTML-Vorschau drucken?“.

---

## 7. iPad, Telefon, Kiosk, andere Bereiche

### 7.1 iPad (Showroom, quer 1180 px)
- Akte: Kopf, Stufenblock, Kacheln 2 Spalten, Knopf „Einlösen“ volle Breite 44 px, Bezüge unterhalb. Popover/Dialoge ab < 900 px als Bottom-Sheet bzw. Vollbild-Sheet.
- **Kamera-Scan** (`KameraScan`): `BarcodeDetector` wenn vorhanden, sonst Client-Decoder (`zxing-wasm`, dynamischer Import beim Öffnen des Kamera-Sheets, nicht im Routen-Bundle; Verfügbarkeit von `BarcodeDetector` in iPadOS-Safari vor Umsetzung im Zielgerät prüfen). Zustände: Kamera-Recht verweigert („Kamera nicht freigegeben. In den iPad-Einstellungen erlauben oder Nummer eintippen.“ + Feld), kein Treffer nach 10 s („Karte näher halten, Licht prüfen“), Treffer (Rahmen `success` 240 ms + Haken, dann Akte). Manuelle Eingabe: `autocapitalize="characters"`, Bindestrich wird automatisch gesetzt.
- Kundenmodus §3.12.

### 7.2 Telefon (< 640) – Ausnahme von 02 §11.1 (in 02 eintragen)
Akte lesbar; erlaubt: Vorteil einlösen (Bottom-Sheet), Berater, Aufgabe. Stufen & Vorteile, Einstellungen, Lebenszyklus-Dialoge: lesend mit Satz „Bearbeitung am Desktop oder iPad“.

### 7.3 Kassa-Kiosk (Abgleich `10-konzept-kassa.md`)
```
┌ KUNDE ────────────────────────────────┐
│ Anna Muster                     [×]   │  lookup_card.name – keine Kontaktdaten
│ [▭ Platzhirsch Plus] seit 03/2026     │  StufenKennzeichen
│ [truck Lieferung im Liefergebiet]     │  Chip 48 px, aria-pressed, Text „vorgemerkt“
│ [droplets Pflegetermin · 0 von 1]     │  nicht verfügbar: Text ink-soft + Grund
│ Karte KK-7K3QX9 am Beleg              │
└───────────────────────────────────────┘
```
- Scan → `lookup_card` (Panel ≤ 400 ms, sonst Skeleton-Zeile). Codes `card_*` mit `hinweis`-Text aus dem Sperrgrund-Katalog; `weitergeleitet_von` → Zeile „Zusammengeführte Karte – Hauptkarte KK-… verwendet“. `card_pending` → „Noch nicht aktiv“ + Knopf „Übergeben“ (`hand_over_card`).
- **Ziel (rechtskonform, RKSV):** Chip antippen → `vorteil_pruefen` (Backend P6) → Position „Kartenleistung: Lieferung im Liefergebiet“ 0,00 € **im Beleg vor dem Signieren**; Einlösung im `on_submit` des Belegs. Scheitert die Einlösung trotz Vorprüfung (zweite Kassa), bleibt die Position, Einlösung „Limit überschritten – Kulanz“ landet im Zu-tun der Leitung.
- **Übergang bis P6:** Chip merkt vor, `redeem_benefit(…, "PH Kassenbeleg", beleg, ort="Kassa")` **nach** dem Buchen; **keine** Bonzeile zur Kartenleistung (signierter Beleg kann nicht nachträglich ergänzt werden); Fehler als Zeile in der Ergebnis-Karte („Pflegetermin: Limit erreicht – nicht eingelöst“).
- Trainingsmodus: Band „Training – keine Einlösung“, Chips simulieren. Offline/Notbetrieb: keine Kartenleistung als Position; Kartennummer darf gespeichert werden; Zeile „Kartenleistung nach Wiederverbindung im Backoffice nachtragen“ → PH Aufgabe.
- Kundendisplay: „Guten Tag, Anna Muster“ (ohne Anrede bei fehlender oder diverser Anrede; nie aus dem Vornamen abgeleitet); nie Stufe/Vorteile.
- Kurzform „Kundenkarte beantragen“: Vorname, Nachname, E-Mail, Haken Teilnahmebedingungen + Datenschutzinformation + Volljährigkeit, Schalter Auswertung (mit Nachweis-Foto) und Newsletter, „Erst bei Übergabe aktivieren“ → `insert Antrag (quelle=kassa)` + `annehmen`. Ergebnis-Karte „Karte KK-… ausgestellt“ bzw. „Antrag an die Beratung übergeben“ (Text vom Inhaber freizugeben).
- Retoure (Ziel, Kassa/Faktura): zwei getrennte Zeilen „Rücktritt (gesetzlich, Fernabsatz) bis …“ nur bei Shop-Bestellungen und „Umtausch (freiwillig, Kundenkarte) bis …“ aus `ph_kundenkarte_umtausch_bis`.

### 7.4 Packtisch
Scan → `lookup_card` → Chip „Lieferung im Liefergebiet“ nur bei Shop-Paketversand mit Zustellung. Bei „Übergeben“: Ergebnis-Karte zeigt Zeile „Kundenkarte: Lieferung im Liefergebiet eingelöst · Rückgängig“ (8 s, Variante A) → `redeem_benefit(…, "PH Bestellung", bestellung, ort="Packtisch")`. Ohne diese sichtbare Zeile keine automatische Einlösung. Kartennummer → `PH Bestellung.ph_kundenkarte_kartennummer`.

### 7.5 Auftrag, Tour, Montage (Möbelhandel-Kette, Ziel nach Backend P5 + Faktura/Logistik/Projekte)
- **AB (Faktura):** beim Erfassen der AB zeigt die Kundenleiste die Kartenleistungen der Stufe; „Leistung zusagen“ legt Position 0,00 € „Lieferung im Liefergebiet – Leistung Ihrer Kundenkarte Platzhirsch Plus“ an (keine Streichpreise, keine „statt“-Angabe; Steuersatz = Hauptleistung, Steuerberater-Prüfung) und eine Einlösung `Zugesagt` mit Bezug AB. Zusage bleibt gültig bei Herabstufung, Sperre, Kündigung.
- **Tour (Logistik):** Tour-Stopp trägt Kennzeichen „Kartenleistung Lieferung“; Abschluss des (letzten) Lieferscheins setzt `Eingeloest`. Teillieferung: „2 von 3 Lieferscheinen erledigt“. Fahrer löst nichts ein.
- **Montage (Projekte):** Kennzeichen am Montageauftrag „Montage ist Leistung der Kundenkarte Platzhirsch Privé“; Abnahme (`PH Abnahme`) setzt `Eingeloest`; Abnahmeprotokoll bleibt Pflicht wie bei bezahlter Montage.
- **Storno AB:** `Zugesagt` → `Storniert`, Ereignis an der Karte.
- Monteur/Techniker mobil: nur Anzeige, keine Einlösung.

---

## 8. Automationen

### 8.1 Vorhanden (App)
| Wann | Was | Sichtbar |
|---|---|---|
| Kassenbeleg gebucht/storniert, Bestellung Statuswechsel, Rechnung gebucht/storniert | Neuberechnung (nur mit Einwilligung); Storno-Kaskade für Einlösungen | Verlauf |
| 03:30 | Neuberechnung aller Karten mit Einwilligung; Website-Anträge > 30 Tage → Abgelehnt | Verlauf, Anträge |
| 08:00 | Geburtstag → PH Aufgabe an Berater | Zentrale |
| 08:05 | `Beantragt` > 7 Tage → Aufgabe „noch nicht übergeben“ | Zentrale, Zu tun |
| 1.12. 08:10 | ungenutzte limitierte Vorteile → Aufgabe „anbieten“ | Zentrale |
| Einwilligung/Widerruf | Ereignis | Verlauf |

### 8.2 Regeln für Aufgaben (TKG § 174, Backend-Anfrage P12; UI setzt sie bei eigenen Aufgaben sofort um)
- Bei `nicht_kontaktieren = 1` **keine** Geburtstags- oder Reaktivierungsaufgabe (Server Action filtert bei Massenaktionen; Scheduler = Backend).
- Aufgabentext nennt erlaubte Kanäle: „per Brief/Karte“; „Telefon/E-Mail“ nur mit Werbeeinwilligung (ph_marketing Zweck je Kanal). Der Scheduler-Text „Anruf, Karte“ in `tasks.py` ist anzupassen (Anfrage).
- Keine automatischen Kundenmails aus dem Backoffice.

### 8.3 Nächster Schritt (rechte Spalte, eine Zeile)
| Zustand | Nächster Schritt |
|---|---|
| Beantragt | Übergabe aktivieren |
| Gesperrt (Verlust/Diebstahl/Beschädigt) | Ersatzkarte ausstellen |
| Gesperrt (sonst) | Leitung: Entsperren oder Kündigen |
| Aktiv, ohne Berater | Berater zuweisen |
| Aktiv, Einwilligung ja, nie berechnet | Einstufung prüfen |
| Aktiv, limitierter Vorteil ungenutzt, ab Oktober | „<Vorteil> anbieten“ (Aufgabe, Kanalregel §8.2) |
| Gekündigt | Neue Karte |
Keine Regel „kurz vor <Stufe>“.

---

## 9. Datenmapping UI → Frappe

Konvention: Fundament-Client `backoffice(session)` mit `getList`, `count`, `getDoc`, `getDocMitInfo`, `docinfo`, `insert`, `save`, `setValue`, `runDocMethod(doctype, name, method, args)`, `call(method, args)`, `getReport`, `uploadFile`, `kommentar`, `searchLink`, `getPdf`; `api.*` = `ph_kundenkarte.api.*`; `bo.*` = `ph_kundenkarte.api.backoffice.*`.

### 9.1 Backoffice
| UI | Aufruf | Stand |
|---|---|---|
| Anträge Liste | `getList PH Kundenkarte Antrag` (name, titel, status, quelle, eingang, kontakt, kundenkarte, doi_noetig, bestaetigt_am, vorname, nachname, plz, ort, email→nur für Hinweis serverseitig) | vorhanden |
| Antrag ausstellen/ablehnen/doppelt/suchen | `runDocMethod Antrag annehmen{kontakt,stufe,aktiv,sofort_aktiv}` / `ablehnen{grund}` / `als_doppelt` / `kontakt_suchen` | vorhanden |
| Antrag-Nachweis | `uploadFile` + `setValue nachweis, nachweis_art` | vorhanden |
| Karten Liste | `getList PH Kundenkarte` (Allowlist §2.2) | vorhanden |
| Dubletten | `call bo.dubletten_finden{limit}` | vorhanden |
| Scan/Palette | `normalisiereKartennummer` → `getDoc`; Palette `ph_core.api.suche.global_search(q, doctypes)` mit normalisierter Eingabe; `href_hinweis /d/ph-kundenkarte/<n>` → `/kundenkarte/karten/<n>` umschreiben | vorhanden |
| Akte | `getDocMitInfo PH Kundenkarte` + `runDocMethod portal_daten` | vorhanden |
| Stufen | `getList PH Kundenkarte Stufe (aktiv) order reihenfolge` + `getDoc` je Stufe (Kindtabelle) | vorhanden |
| Verlauf | `getList PH Kundenkarte Ereignis {kundenkarte}` + `getList Einloesung` + `docinfo` | vorhanden |
| Einkäufe | `getList` PH Kassenbeleg/PH Bestellung `{kontakt}` und `{ph_kundenkarte_kartennummer in Kette}`, PH Rechnung/PH Auftragsbestaetigung `{kontakt}` | vorhanden (Beträge nach Rechten der Quell-DocTypes) |
| Einlösen | `runDocMethod vorteil_einloesen{vorteil,bezug_doctype,bezug,kommentar,ort}` | vorhanden |
| Belegvorschläge | `getList` je erlaubtem Typ `{kontakt, offen}` (Registry) | vorhanden |
| Storno | `runDocMethod Einloesung stornieren{grund}` | vorhanden |
| Sperren / Gründe | `runDocMethod sperren{grund,sperrgrund_art}`, `call bo.sperrgruende` | vorhanden |
| Ersatz / Übertragen / Zusammenführen / Übergabe | `ersatzkarte_ausstellen`, `uebertragen`, `zusammenfuehren_mit{nur_plan}`, `karte_uebergeben{ort}` | vorhanden |
| Entsperren / Kündigen | `entsperren`, `kuendigen{grund}` | vorhanden |
| Neu berechnen | `umsatz_neu_berechnen`; Sammel `call bo.umsatz_alle_neu_berechnen` | vorhanden |
| Stufenplan-Vorschau | `call bo.stufenplan_vorschau{stufen}` | vorhanden |
| Standardstufen | `call bo.stammdaten_anlegen` | vorhanden |
| Wallet-Zustand / erneuern | `call bo.wallet_status`, `runDocMethod wallet_pass_erneuern` | vorhanden |
| Einwilligung | Upload + `save einwilligung_auswertung, einwilligung_textversion` + `kommentar` | Übergang (§9.3 P3) |
| Stufe festlegen | `save stufe, stufe_manuell` + `kommentar` | Übergang (P9) |
| Kennzahlen/Charts/Reports | Number Cards, `call kennzahlen.einloesungen_30_tage`, Dashboard Charts, `getReport` | vorhanden |
| Aufgabe/Leitung bitten | `insert PH Aufgabe {titel, faellig, zugewiesen_an, referenz_doctype, referenz_name, kontakt, quelle:"backoffice"}` | vorhanden (ph_crm) |
| Kundenakte-Chip | `PH Kontakt.ph_kundenkarte_karte`, `.ph_kundenkarte_stufe` | vorhanden |

### 9.2 Kiosk
`api.lookup_card`, `api.redeem_benefit`, `api.cancel_redemption`, `api.hand_over_card` (vorhanden, `KASSA_ROLLEN` inkl. Logistik). `vorteil_pruefen` und Position „Kartenleistung“: fehlen (P6).

### 9.3 Backend-Abhängigkeiten mit Übergangsregel (Anfragen, nicht in diesem Bereich gebaut)

| # | App | Änderung | Blockiert Livegang | Übergang in der UI |
|---|---|---|---|---|
| P1 | ph_kundenkarte Antrag | Teilnahmebedingungen + Version Pflicht für alle Quellen; E-Mail nur Website Pflicht (+ `strasse`, `land`); `datenschutzinfo_version`, `volljaehrig_bestaetigt`, `ablehnungsgrund` (Select), `erfasst_durch`; Auto-Verknüpfung nur bei gleichem Nachnamen | ja | UI erzwingt Haken; Kommentar am Antrag; Grund als Präfix; Server Action verknüpft nicht automatisch |
| P2 | ph_kundenkarte `umsatz.py` | B1–B8: Rechnungsarten (Anzahlung/Teil nicht neben Schlussrechnung), Kassen-Positionen statt `gesamt_cent` (keine Anzahlung, kein Gutscheinverkauf), Gutschriften abziehen, nur bezahlt, netto, Belegkurs, Belege per Kartennummer; Tests | ja | Mitarbeitende ohne Beträge; Leitung mit Band „Berechnung im Aufbau“; „Zählt“-Text wahrheitsgemäß |
| P3 | ph_kundenkarte Karte | `einwilligung_*` read_only; `einwilligung_erteilen(textversion, kanal, nachweis_datei)`, `einwilligung_widerrufen(kanal, hinweis)`; `einwilligung_kanal`, `einwilligung_nachweis`, `geburtstag_einwilligung`; Portal-Widerruf und Portal-Kündigung | ja | Dialog mit Pflicht-Nachweis + Kommentar |
| P4 | ph_kundenkarte | Ersatzkarte, Limits über Kette | erledigt | – |
| P5 | ph_kundenkarte Einloesung/Vorteil | `BEZUG_ERLAUBT` += AB, Lieferschein, Montageauftrag; Status `Zugesagt`, `zugesagt_am`, `erbracht_am`, `erbracht_bezug*`; `bezug_pflicht`, `bezug_typen`; Limit-Jahr nach Belegdatum; Sperre `for_update` gegen Wettlauf | ja | Bezugsregeln §4.6 im Client; Möbel-Lieferung/Montage nicht einlösbar |
| P6 | ph_kassa + ph_kundenkarte api | Position `art = Kartenleistung` 0,00 €, Einlösung im `on_submit`, `vorteil_pruefen`, Trainingsbeleg-Sperre in `redeem_benefit` | ja | §7.3 Übergang, keine Bonzeile |
| P7 | ph_kundenkarte | Widerruf leert `jahresumsatz_cent`/`hinweis` aller Ereignisse | ja | Dialog nennt Folge erst, wenn Fähigkeit da; sonst „Umsatzangaben an der Karte werden gelöscht“ |
| P8 | ph_kundenkarte Rechte | Umsatzfelder permlevel 1; `kontakt` set_only_once; Website Integration ohne `write` | ja | DAL-Allowlist (wirkt nur für Next, nicht für REST) |
| P9 | ph_kundenkarte | `stufe`/`stufe_manuell` permlevel 2 (Leitung), `stufe_manuell_grund` | ja | UI nur Leitung + Kommentar |
| P10 | ph_kundenkarte | Löschfristen-Scheduler; `delete` der Leitung auf Karte/Antrag/Einlösung entziehen | ja | UI bietet kein Löschen |
| P11 | ph_kundenkarte wallet | Pass „ungültig“ bei Sperre/Kündigung/Ersatz; Inhalt Nummer, Vorname, Stufe | ja | Satz im Wallet-Abschnitt |
| P12 | ph_kundenkarte tasks + ph_crm | Kanalprüfung, keine Aufgabe bei Widerspruch, Text ohne „Anruf“ | ja | Massenaktion filtert |
| P13 | ph_kundenkarte | Umtausch-Text ohne „Gutschrift“, `GELD_RE` erweitert | vor Schulung | Client-Regex erweitert |
| P14 | ph_kundenkarte Stufe | Deaktivieren nur ohne Karten, `karten_umstufen(ziel)` | vor Schulung | Schalter gesperrt mit Satz |
| P15 | Report Kundenwert | € nur Leitung/GF serverseitig | vor Schulung | Report nur Leitung/GF + Leeren in Server Action |
| P16 | Kanban-Fixture | entfernen oder Status-Schutz | vor Schulung | kein Kanban im Next |
| – | ph_core | `PH Kundenkarte Einloesung` in `BEREICHE["kundenkarte"]` | nein | `getList` |
| – | ph_marketing | Zweck `kundenkarte_auswertung`, Werbe-Zweck je Kanal | ja (für P12) | Kanal „Brief“ |
| – | ph_faktura/ph_kassa | `ph_kundenkarte_umtausch_bis` an Beleg; Retoure-Anzeige | vor Schulung | – |
| – | ph_logistik | Liefergebiet (PLZ/Zonen) | Inhaber | Chip ohne Gebietsprüfung nur Shop-Paket |

`faehigkeiten.js` prüft je Punkt per Meta (Feld/Option vorhanden) oder per Methodenaufruf mit `not_found`-Erkennung und cached 10 min.

---

## 10. Komponenten (neu im Bereich)

| Komponente | Spezifikation |
|---|---|
| `StufenKennzeichen` | Rechteck Radius 4 (nicht Pille), Höhe 20 (Liste) / 24 (Kopf), Hintergrund `surface-2`, Rand `line`, links Mini-Karte 14 × 9 px in Stufenfarbe mit 1 px Ring `line-strong`, Text 12/500 `--color-bo-ink` (hell/dunkel ≥ 4,5:1). Optional Zusatz „von Hand“ (`muted`). Als Knopf: `aria-haspopup="dialog"`. Kein Farb-Tint. |
| `MiniKarte` | 120 × 76 px (Kopf) / 240 × 152 (Ergebnis-Karte), Radius 6, Stufenfarbe, Wortmarke Bodoni Moda, Nummer Instrument Sans mono-ähnlich tabular; Rückseite QR; Drehung 240 ms. |
| `Stufenblock` | §3.5.2. |
| `VorteilKachel` | §3.5.3; Höhe min. 132; Hover `surface-2` 120 ms; optimistischer Wechsel ohne Hochzählen. |
| `EinloesePopover` / `EinloeseDialog` | §3.5.7. |
| `LeitungBitten` | Sekundärknopf + Zustand „Angefragt bei Leitung · Zeit“ + Link Aufgabe; idempotent je Karte/Aktion/Tag. |
| `KartenSuche` | Feld `data-scan="ja"`, erste Zeile „Karte KK-… öffnen ↵“, Shake 240 ms bei Unbekannt, Text bleibt. |
| `KameraScan` | §7.1. |
| `Kundenmodus` | §3.12; nutzt Fundament-Komponente `BedienerRueckkehr` (Langdruck/PIN). |
| `ErgebnisKarte` | 04 §3.13, Häkchen 400 ms, Knöpfe ≤ 3. |
| `NachweisAufnahme` | Kamera (`<input type="file" accept="image/*" capture="environment">`) + Datei; Vorschau 96 px; Upload privat; Fehler „Upload fehlgeschlagen – erneut“. |
| `Stufenplan` | §3.7, Spalten, Drag mit Alternative, Speicherleiste mit Vorschau. |

Bewegung gesamt: Popover 160 ms `--bo-ease-out`; Sheet/Side-Peek 200 ms `--bo-ease-out`; Dialog 200 ms; Karte drehen 240 ms `--bo-ease-inout`; Linie füllen 400 ms; Shake 240 ms (3 × 4 px); Häkchen 400 ms; Zeilen-Hervorhebung 1200 ms. Reduce: Crossfade ≤ 120 ms oder sofort, kein Shake (Rand `danger` statt Bewegung).

---

## 11. Leer- und Fehlerzustände (vollständig)

| Ort | Fall | Text | Aktion |
|---|---|---|---|
| Übersicht | frisch | „Noch keine Karten. Karten entstehen aus Website-Anträgen oder hier im Showroom.“ | Neue Karte |
| Übersicht › Zu tun | leer | „Alles erledigt – nichts offen.“ | – |
| Heute-Chip | 0 | „0“ `muted`, nicht klickbar | – |
| Übersicht › Zuletzt | leer | „Noch keine Änderungen im Bereich.“ | – |
| Kachel | Fehler | „Nicht geladen.“ | Erneut |
| Anträge | leer | „Keine offenen Anträge – alles bearbeitet.“ | – |
| Antrag › Ähnliche Kontakte | 0 | „Kein ähnlicher Kontakt gefunden – beim Ausstellen wird ein neuer angelegt.“ | – |
| Karten | leer / Filter-leer | „Noch keine Karten.“ / „Keine Karten für diese Filter.“ | Neue Karte / Filter zurücksetzen |
| Side-Peek | Fehler | „Karte nicht geladen.“ | Erneut, Vollansicht |
| Tab Vorteile | keine | „Dieser Stufe ist noch kein Vorteil zugeordnet.“ | Leitung: Stufenplan |
| Tab Verlauf | gefiltert leer | „Keine Einlösungen bisher.“ | Filter zurücksetzen |
| Tab Einkäufe | keine | „Noch keine Einkäufe mit dieser Karte oder diesem Kontakt.“ | – |
| Tab Einkäufe | ohne Einwilligung | „Einkäufe werden nicht ausgewertet – keine Summen.“ | Einwilligung erfassen |
| Details › Wallet | nicht eingerichtet | „Wallet-Pässe sind noch nicht eingerichtet. Die Karte funktioniert ohne Pass.“ | Leitung: Einstellungen |
| Details › Wallet | ohne E-Mail | „Kein Kundenportal – Pass nicht verfügbar.“ | – |
| Bezüge | nichts | „Noch keine Belege, Aufgaben oder Serviceleistungen.“ | – |
| Einlöse-Popover | keine Belege | „Keine offenen Belege der Kundin.“ | Suche |
| Einlöse-Popover | Suche aus | „Belegsuche gerade nicht möglich.“ | Erneut |
| Einlöse-Popover | Beleg Pflicht | „Bitte Auftrag, Lieferschein, Montageauftrag oder Beleg wählen.“ | – |
| Commit-Fehler | Seite verlassen | „Einlösung für Anna Muster nicht gespeichert – Limit erreicht.“ | Zur Karte |
| Wettlauf | – | „Gerade an anderer Stelle eingelöst – Stand aktualisiert.“ | – |
| Einlösungen | leer | „Noch keine Einlösungen – sie entstehen an Kassa, Packtisch, im Service oder hier.“ | – |
| Stufenplan | keine Stufen | „Noch keine Stufen angelegt.“ | Standardstufen anlegen |
| Katalog | leer | „Noch keine Vorteile. Vorteile sind Leistungen wie Lieferung oder Pflegetermin – ohne Geldwert.“ | Vorteil anlegen |
| Stufen speichern | Teilfehler | „Nicht gespeichert – Schwelle muss mit der Reihenfolge steigen.“ (am Feld) | – |
| Palette | Nummer unbekannt | „Keine Karte KK-7K3QX9. Nummer prüfen oder nach Namen suchen.“ | – |
| Kamera | Recht verweigert | „Kamera nicht freigegeben. In den iPad-Einstellungen erlauben oder Nummer eintippen.“ | Feld |
| Kamera | 10 s kein Treffer | „Karte näher halten, Licht prüfen.“ | – |
| Neu berechnen | > 2 s | „Dauert länger als gewohnt …“ | – |
| Wallet erneuern | Fehler | „Pass konnte nicht aktualisiert werden.“ | Erneut |
| Leitung bitten | schon angefragt | „Angefragt bei Leitung · heute 10:12“ | Aufgabe öffnen |
| Berichte (Mitarbeitende) | – | nur erlaubte Berichte gelistet | – |
| Neue Karte | ohne Teilnahmebedingungen-Version | „Teilnahmebedingungen-Version fehlt – Leitung trägt sie in den Einstellungen ein.“ | Leitung: Einstellungen |
| Druck | PDF-Dienst aus | „PDF gerade nicht möglich. HTML-Vorschau drucken?“ | Vorschau |
| Frappe nicht erreichbar | Seite | Shell bleibt, Fehlerblock „Daten gerade nicht erreichbar.“ | Erneut |

---

## 12. Texte und Hilfe

### 12.1 Glossar (Oberfläche statt Rohwert)
| Statt | Oberfläche |
|---|---|
| DOI / Double-Opt-in | „E-Mail-Bestätigung“ |
| Bestaetigt, Gekuendigt, Eingeloest, Persoenlich, Uebertragen, Zusammengefuehrt, Beschaedigt | „Bestätigt“, „Gekündigt“, „Eingelöst“, „Persönlich“, „Übertragen“, „Zusammengeführt“, „Beschädigt“ |
| website / showroom / kassa / event | „Website“ / „Showroom“ / „Kassa“ / „Event“ |
| Bezug, Bezugsbeleg | „Beleg“ („zu Beleg BE-2026-0210“) |
| Startstufe | Name der Stufe |
| Bewertungszeitraum | „letzte 12 Monate“ (aus Einstellung) |
| Kaufhistorien-Auswertung | „Auswertung der Einkäufe für die Einstufung“ |
| IP-Hash, Textversion-ID, Seriennummer | nur „Nachweis-Details“, mono, `muted` |
| site_config, Zertifikat, after_install | „Wallet ist noch nicht eingerichtet – Administrator“ |
| stufe_manuell | „Stufe von Hand festgelegt“ |
| Umsatz berechnet · 5 Belege | „Einstufung geprüft · 5 Einkäufe berücksichtigt“ |

Intern Du-Form, Kundentexte und Kundenmodus Sie-Form. Fachbegriffe (Vorteil ohne Geldwert, Auswertung der Einkäufe, Stufe von Hand, Zugesagt) mit gestricheltem Unterstrich → Hilfe-Popover.

### 12.2 Erstbesuch-Hinweise (je ≤ 2 Sätze)
- Übersicht: „Hier siehst du, was bei der Kundenkarte heute ansteht. Vorteile sind Leistungen wie Lieferung oder Pflegetermin – nie Rabatt oder Guthaben.“
- Karten: „Karte scannen oder Namen tippen und Enter drücken öffnet die Karte.“
- Karten-Akte: „Einlösen erfasst eine Leistung als Nachweis. Rückgängig geht 8 Sekunden lang, danach über ‚Stornieren‘.“
- Anträge: „Website-Anträge werden nach der E-Mail-Bestätigung automatisch zur Karte. Hier landen nur Anträge, die eine Entscheidung brauchen.“
- Stufen & Vorteile: „Kundentexte werden beim Tippen geprüft: keine Beträge, Prozente, Gutscheine oder Superlative.“

### 12.3 Hilfeartikel
`backoffice/hilfe/kundenkarte/{uebersicht,antraege,karten,karte,einloesungen,stufen,berichte,einstellungen,kundenmodus}.md` – je Artikel: Wozu, drei häufigste Handgriffe, Begriffe, „Was passiert mit den Daten“.

---

## 13. Akzeptanzkriterien (QA)

| # | Kriterium | Prüfung |
|---|---|---|
| K1 | `kk 7k3qx9`, `KK7K3QX9`, `KK-7K3QX9` per Scan in Liste, Palette, Kundenakte öffnen dieselbe Karte < 400 ms; getippt erst nach Enter; unbekannt → Text bleibt, kein Seitenwechsel | E2E |
| K2 | Antrag Bestätigt: ⌘↵ öffnet Dialog; Ausführung legt Kontakt + Karte an; Ergebnis-Karte zeigt Nummer ohne Hochzählen; „Karte + Begrüßung drucken“ = ein PDF, zwei Dokumente | E2E |
| K3 | Antrag mit offener E-Mail-Bestätigung: Mitarbeitende sehen deaktivierten Knopf **mit sichtbarem Satz** und „Leitung bitten“; Leitung kann mit Begründung ausstellen | E2E Rollen |
| K4 | Kein Kanban; `?ansicht=kanban` → 307 | E2E |
| K5 | Einlösen: Klick auf Belegzeile → Toast 8 s; ⌘Z innerhalb 8 s → kein Datensatz; danach genau eine Einlösung; Navigation vor Ablauf → Commit via `flush` | E2E + DB |
| K6 | Limit erreicht: Kachel ohne Knopf, Text „wieder ab 01.01.<Jahr+1>“; Methode direkt → Klartext aus Code | E2E |
| K7 | Gesperrt (Verlust): Band, Primär für Mitarbeitende „Ersatzkarte ausstellen“; Entsperren nur Leitung; Diebstahl → kein Entsperren | E2E Rollen |
| K8 | Auswertung beenden: Dialog mit Kanal Pflicht; danach Umsatz „–“, Stufe Startstufe (außer von Hand), Ereignis „Widerruf“ | E2E |
| K9 | Ohne Einwilligung: keine Beträge, „Letzter Einkauf“ „–“ mit sr-only-Text, nie 0 € | Snapshot |
| K10 | Stufe festlegen nur Leitung, Grund Pflicht, Kommentar + Ereignis; Undo 8 s stellt alte Stufe her | E2E |
| K11 | Stufenplan: Schwelle nicht steigend → Feldfehler; „10 % Rabatt“ und „Gutschein“ → Live-Hinweis; Server lehnt „10 %“ identisch ab | E2E |
| K12 | Karten-PDF: Stufenfarbe, QR lesbar (Scanner liest `KK-…`), Rückseite Datenschutztext | manuell |
| K13 | Kassa `lookup_card`: keine E-Mail/Telefon/Umsatz in der Antwort; gesperrt → keine Chips, Hinweistext | E2E Kiosk |
| K14 | Kassa Übergang: Einlösung nach Buchung, keine Bonzeile; Fehler `limit_reached` als Zeile in der Ergebnis-Karte | E2E Kiosk |
| K15 | Geburtstag (Mock-Datum) → genau eine Aufgabe; `nicht_kontaktieren=1` → keine (nach P12) | Scheduler + UI |
| K16 | Mitarbeitende: Bericht „Kundenwert“ nicht gelistet, Direktaufruf → nicht gefunden | E2E |
| K17 | `notizen_intern` für Mitarbeitende nicht im DOM; Kassa-Rolle: kein Bereich, Akte 404 | E2E Rollen |
| K18 | Leerzustände §11 vorhanden; keine leere Tabelle ohne Text | Snapshot |
| K19 | Frappe aus → Kacheln einzeln „Nicht geladen“, Shell bleibt; Feldkonflikt gelb je Feld | E2E |
| K20 | Bewegung ≤ 400 ms (außer Hervorhebung 1200 ms); reduce → kein Shake, kein Linienfüllen, Toast-Balken mit Sekundenzähler | Playwright reduce |
| K21 | axe 0 serious/critical auf allen Routen; Stufenleiste `<ol>` + `aria-current`; QR `role="img"` | axe + Screenreader |
| K22 | Grep über `backoffice/src/app/kundenkarte` und `components/Backoffice/Kundenkarte`: kein Rabatt/Bonus/Guthaben/Punkte/%/Gutschein in UI-Texten, keine Superlative, keine Rohwerte (`Bestaetigt` …) | Grep |
| K23 | Akte Kopf + Tab 1 < 1,0 s, Liste < 1,2 s, Routen-JS ≤ 80 KB (Decoder dynamisch) | Trace |
| K24 | Doppelklick/Netzabbruch bei Neue Karte: eine Karte; `DuplicateEntryError` → vorhandenes Ergebnis | E2E |
| K25 | Palette normalisiert `kk7k3qx9`, `href_hinweis` wird umgeschrieben | E2E |
| K26 | „Zuletzt geändert“ zeigt nur lesbare Einträge; leer/Fehler-Zustände | E2E |
| K27 | Scan-Simulation (10 ms Abstand) auf Akte, Antrag, Liste, Stufenplan löst kein Kürzel aus; Scan im Kommentarfeld bleibt Text | E2E |
| K28 | Einzeltasten aus → `A`, `X`, `N`, `.`, `Z` wirkungslos, ⌘-Kürzel bleiben | E2E |
| K29 | Kundenmodus: Seitenleiste/Palette/Zurück nicht erreichbar; Rückkehr nur Langdruck/PIN; Idle 2 min → Beraterin, Eingaben erhalten | E2E iPad |
| K30 | Nach Einlösen Fokus auf Kachel-Überschrift, Live-Region liest Rest | E2E + Screenreader |
| K31 | `StufenKennzeichen` hell/dunkel Text ≥ 4,5:1, Mini-Karte ≥ 3:1 oder Ring; Form ≠ StatusBadge | axe + Snapshot |
| K32 | Mitarbeiter-Sitzung: keine Next-Antwort (RSC-Payload, Action-Antwort) enthält `jahresumsatz_cent`, `gesamtumsatz_cent`, `ip_hash`, E-Mail einer Liste | Netzwerk-Assertion |
| K33 | Zuordnung „Lieferung → Platzhirsch“ speichern setzt `gilt_ab_stufe`; Altdaten → Warnzeile; Teilfehler → Rücknahme | E2E Mock + Frappe |
| K34 | Klickwege §1 (beide Spalten) gemessen und eingehalten | E2E |
| K35 | Einwilligung erfassen ohne Nachweis/Häkchen → Primär deaktiviert mit Satz; mit Nachweis → Datei privat an Karte, Kommentar, Ereignis | E2E |
| K36 | Ersatzkarte: Stufe, `stufe_seit`, Einwilligung übernommen; Pflegetermin genutzt → neue Karte „0 von 1“; alte Karte Band „Ersetzt durch …“ | E2E |
| K37 | Zweiter Antrag gleiche E-Mail, anderer Nachname → kein Auto-Kontakt, Hinweisband | E2E |
| K38 | Lieferung/Montage/Pflege ohne Beleg nicht einlösbar (Zeile fehlt); Persönlich/Event ohne Beleg möglich | E2E |
| K39 | Einlösungs-Sheet: Datum/Vorteil/Beleg readonly | E2E |
| K40 | Ablehnen ohne Grund unmöglich; „Sonstiges“ verlangt Text | E2E |
| K41 | Massenaktion „Aufgabe an Berater“: Vorschau nennt Kanäle; Widerspruch → keine Aufgabe; Titel ohne „Anruf“ ohne Telefon-Einwilligung | E2E |
| K42 | Packtisch: Einlösung nur mit sichtbarer Zeile + Rückgängig 8 s | E2E Kiosk |
| K43 | Kündigen nur Leitung; Mitarbeitende „Leitung bitten“ → Aufgabe | E2E Rollen |
| K44 | Fähigkeiten: Mock ohne `Zugesagt`/`ablehnungsgrund`/`einwilligung_erteilen` zeigt Übergangsregeln; Mock mit → Zielverhalten | Unit + E2E |
| Backend (Abnahme ph_kundenkarte, nicht dieser Bereich) | Fach-K27–K43 aus `21-kritik-fach-kundenkarte.md` §9 (Anzahlung/Schlussrechnung, Gutschrift, CHF, Kartennummer-Belege, Storno-Kaskade, Training, Feldrechte, Widerruf leert Ereignisse, Wettlauf, Zugesagt→Erbracht) | Frappe-Tests |

---

## 14. Was hier anders ist als SHD/Branchensoftware

1. Leistungsvorteile mit Jahreslimit und Beleg statt Rabattkonto – ohne Geldwert, ohne Passivierung; im Auftrag als Zusage 0,00 € sichtbar, bei Lieferung/Montage erbracht.
2. Scan ist Suche, überall, mit Scan-Tor gegen Fehlauslösung und Kamera-Scan am iPad.
3. Datenschutz als Bedienlogik: Einwilligung nur mit Nachweis, Kundenmodus am iPad, keine Beträge für Mitarbeitende, Kiosk ohne Kontaktdaten, Rechte vor der Serialisierung.
4. Lebenszyklus vollständig: Ersatzkarte mit übernommener Stufe und Limits, Übertragung, Zusammenführung von Dubletten mit Plan-Vorschau.
5. Ein Klick zur Einlösung mit 8 s Rückgängig statt Formular.
6. Stufenplan mit einer Wahrheit (Zuordnung) und Vorschau „12 Karten würden aufsteigen“.
7. Reaktivierung als persönliche Aufgabe mit geprüftem Kanal, nicht als Massenmail.

---

## 15. Offene Entscheidungen

| An | Frage | Vorschlag |
|---|---|---|
| Inhaber | Schwellen Plus/Privé (Platzhalter 10.000/50.000 €), Stufennamen, Farbe Privé (heute Status-Blau) | Privé eine Datenfarbe außerhalb der Status-Töne |
| Inhaber | Umsatz netto/brutto, nur bezahlt, Aufträge bei AB oder Schlussrechnung (B5, B6, B11); Karenz bis Aufstufung (PR7) | netto, bezahlt, Schlussrechnung, Karenz = längste Rückgabefrist |
| Inhaber | Leitung sieht Beträge – Mitarbeitende nie (dieses Konzept). Bestätigen. | so lassen |
| Inhaber | Kundenkarte auch für Firmenkunden (Hotel, Yacht)? | nein, nur Privatpersonen |
| Inhaber | Liefergebiet (PLZ/Zonen), Umtausch-Ausschlüsse (Sonderanfertigung, Küche) | – |
| Inhaber | Text der Kassa-Ergebnis-Karte bei Antrag | – |
| Kanzlei | FAGG auf Teilnahmevertrag; Teilnahmebedingungen inkl. Mindestalter 18, Kündigung durch Platzhirsch, Fortbestand zugesagter Leistungen; Einwilligungstexte; Datenschutzinformation; Löschfristen; Wallet-Anbieter in Datenschutzerklärung; „kostenlos/gratis“ in Kundentexten | – |
| Steuerberater | Steuersatz der 0-€-Kartenleistung; unentgeltliche Leistungen ohne Kauf (Pflege, Montage, Event); Programmkosten | bis dahin Beleg Pflicht außer Persönlich/Event |
| Fundament/UX-Lead | Undo 8 s in 04 §3.6; ⌘Z + abschaltbares `Z`; Toast unten rechts; Leertaste = Peek, `X` = Auswahl; `Alt+1…9`; `.` = Aktionsmenü in 02 §9.1; 02 §13 Messing-Regel durch `StufenKennzeichen` ersetzen; Telefon-Ausnahme 02 §11.1; Einzeltasten-Schalter | wie hier |

---

## 16. Bauauftrag

### 16.1 Dateien und Routen (Next App Router, `backoffice/src`)

Vor Beginn: Next-Doku in `node_modules/next/dist/docs/` lesen (AGENTS.md), insbesondere Server Actions, Intercepting/Parallel Routes, `redirect`/`permanentRedirect`, `loading.js`.

```
src/app/kundenkarte/
  layout.js                         Unternavigation (Segment-Leiste), Zähler Anträge, Zahnrad (Leitung)
  page.js                           Übersicht (Server Component, Suspense je Kachel)
  antraege/page.js                  Liste mit Reitern
  antraege/[name]/page.js           Antrag-Akte  (+ not-found.js, loading.js)
  karten/page.js                    Liste + Side-Peek
  karten/neu/page.js                Neue Karte (Vollseite)
  karten/@modal/(.)neu/page.js      Neue Karte als Dialog über der Liste (Intercepting Route)
  karten/[kartennummer]/page.js     Karten-Akte (+ loading.js, not-found.js)
  einloesungen/page.js              Liste + Sheet
  einloesungen/[name]/page.js       Einlösung Vollseite
  stufen/page.js                    Stufen & Vorteile
  vorteile/[[...rest]]/page.js      307 → /kundenkarte/stufen?panel=vorteil:<name>
  berichte/page.js                  erlaubte Berichte
  berichte/[report]/page.js         Report
  einstellungen/page.js             Single
  kundenmodus/[sitzung]/page.js     Vollbild ohne Shell (eigenes Layout via Route Group)
src/components/Backoffice/Kundenkarte/
  StufenKennzeichen.js  MiniKarte.js  Stufenblock.js  KartenKopf.js  VorteilKachel.js  VorteileTab.js
  VerlaufTab.js  EinkaeufeTab.js  DetailsTab.js  BezuegeSpalte.js  NaechsterSchritt.js
  EinloesePopover.js  EinloeseDialog.js  BelegListe.js  KartenSuche.js  KameraScan.js
  StufeFestlegenPopover.js  EinwilligungErfassenDialog.js  EinwilligungBeendenDialog.js  NachweisAufnahme.js
  SperrenDialog.js  ErsatzkarteDialog.js  UebertragenDialog.js  ZusammenfuehrenDialog.js  KuendigenDialog.js  EntsperrenDialog.js
  AntraegeTabelle.js  AntragAkte.js  AusstellenDialog.js  AblehnenDialog.js  DoppeltDialog.js
  KartenTabelle.js  KartenPeek.js  EinloesungenTabelle.js  EinloesungSheet.js
  NeueKarteFormular.js  ErgebnisKarte.js  Kundenmodus.js  LeitungBitten.js
  Stufenplan.js  StufenSheet.js  VorteilSheet.js  Speicherleiste (Fundament)  Einrichtungsliste.js
src/lib/backoffice/kundenkarte/
  kartennummer.js      rein: normalisiereKartennummer, istKartennummer (node --test)
  textpruefung.js      rein: GELD_RE + Zusatz, SUPERLATIV_RE, pruefeKundentext()
  labels.js            rein: Status-/Select-Labels, Töne, Art-Icons
  regeln.js            rein: Primäraktion je Zustand, Bandrangfolge, Nächster Schritt, Storno-Erlaubnis (23:59), Bezugsregeln §4.6, Kanalregel
  felder.js            server-only: Allowlist je Rolle, filtereKarte(), filtereAntrag()
  faehigkeiten.js      server-only: Meta-/Methodenprüfung, Cache 10 min
  daten.js             server-only: ladeUebersicht, ladeAntraege, ladeAntrag, ladeKarten, ladeKarte, ladeVerlauf, ladeEinkaeufe, ladeEinloesungen, ladeStufenplan, ladeBerichte
  bezuege.js           server-only: Bezugs-Registry, offeneBelege(kontakt, art), sucheBeleg(q)
  kennzahlen.js        server-only
  actions.js           "use server" (16.3)
  mock-seed.js         Seed-Ergänzung für mock/seed.js (Stufen, Vorteile, 30 Karten, Anträge, Einlösungen, Ereignisse, Belege)
backoffice/hilfe/kundenkarte/*.md
backoffice/tests/unit/kundenkarte-{kartennummer,textpruefung,regeln,felder}.test.mjs
backoffice/tests/e2e/kundenkarte-*.spec.(js|mjs)   (desktop + ipad)
```
Navigation: Eintrag besteht in `bereiche.js` (`slug: "kundenkarte"`); `kanban` dort leeren; Schnellaktionen in `suche.js` (`> neue karte`, `> vorteil einlösen`, `? kundenkarte`) – beides Fundament-Dateien, Änderung über den Fundament-Agenten oder abgestimmt.

### 16.2 Komponenten-Abhängigkeiten aus dem Fundament
`Shell`, `Seitenkopf`, `Segment`, `DataTable` + `Filterleiste`, `Formular`/`Feld`/`LinkFeld`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Toast` (Variante A/B, 8 s, `flush()`), `Bestaetigen`, `Leer`, `Fehler`, `Knopf`, `Befehlspalette`, `Kiosk/hooks` (`useScanner`, `useTastenkuerzel`). **Neu benötigt vom Fundament:** Scan-Tor (§2.3), `Popover` (Fokusfalle, `role="dialog"`, Bottom-Sheet-Fallback), `Sheet`/Side-Peek, `Speicherleiste`, Druckpanel mit Sammeldruck zweier Formate, `BedienerRueckkehr` (Langdruck/PIN), Einzeltasten-Schalter im Benutzer-Menü, Feldkonflikt je Feld, Undo-Dauer 8 s.

### 16.3 Server Actions (`lib/backoffice/kundenkarte/actions.js`)
Jede: `requireSession` + Rollenprüfung (`darf`/`darfDoc`), Eingaben per zod/`validiere`, Ergebnis `{ ok, code, message, daten? }`, `revalidatePath` der betroffenen Routen, nie Rohfehler an den Client.

| Action | Rolle | Frappe-Aufrufe |
|---|---|---|
| `karteOeffnenAusScan(roh)` | Mitarbeiter | normalisieren → `getValue PH Kundenkarte name` → `{ href }` |
| `antragAusstellen({antrag, kontakt?, neuerKontakt?, stufe?, sofortAktiv})` | Mitarbeiter/Leitung | `getDoc Antrag` → Prüfung gleicher Nachname → `runDocMethod annehmen` (`aktiv=True` wenn per Mail bestätigt) |
| `antragAblehnen({antrag, grund, text?})` | Mitarbeiter | `runDocMethod ablehnen{grund:"[Grund] Text"}` bzw. `ablehnungsgrund` (Fähigkeit) |
| `antragDoppelt({antrag})` | Mitarbeiter | `runDocMethod als_doppelt` |
| `antragKontaktVerknuepfen({antrag, kontakt})` | Mitarbeiter | `setValue kontakt` |
| `neueKarte(formData)` | Mitarbeiter | `insert Antrag` (idempotency) → `uploadFile` Nachweis → `setValue nachweis, nachweis_art` → `kommentar` (Übergangsfelder) → `runDocMethod annehmen{sofort_aktiv}`; `DuplicateEntryError` abfangen |
| `vorteilEinloesen({karte, vorteil, bezugDoctype?, bezug?, kommentar?, ort})` | Mitarbeiter | Bezugsregel prüfen → `runDocMethod vorteil_einloesen` (vom Client erst nach 8 s aufgerufen) |
| `belegeVorschlagen({karte, vorteil})`, `belegSuchen({q, art})` | Mitarbeiter | `getList` je Typ |
| `einloesungStornieren({einloesung, grund})` | Leitung / eigene bis 23:59 | `runDocMethod stornieren` |
| `karteSperren({karte, art, text?})` | Mitarbeiter | `runDocMethod sperren` |
| `karteEntsperren`, `karteKuendigen({karte, durch, grund})` | Leitung | `entsperren`, `kuendigen` + `kommentar` |
| `ersatzkarte({karte, art, grund?})` | Mitarbeiter | `runDocMethod ersatzkarte_ausstellen` |
| `karteUebertragen({...})`, `zusammenfuehrenPlan/Ausfuehren({...})` | Leitung | `uebertragen`, `zusammenfuehren_mit{nur_plan}` |
| `uebergabeAktivieren({karte})` | Mitarbeiter | `runDocMethod karte_uebergeben{ort}` |
| `stufeFestlegen({karte, stufe, grund})`, `automatikZulassen({karte})`, `stufeRueckgaengig(...)` | Leitung | `save` + `kommentar` / `save` + `umsatz_neu_berechnen` |
| `einwilligungErfassen(formData)` | Mitarbeiter | `uploadFile` → `einwilligung_erteilen` (Fähigkeit) oder `save` + `kommentar` → `umsatz_neu_berechnen` |
| `einwilligungBeenden({karte, kanal})` | Mitarbeiter | `einwilligung_widerrufen` (Fähigkeit) oder `save` + `kommentar` |
| `neuBerechnen({karte})`, `alleNeuBerechnen()` | Mitarbeiter / Leitung | `umsatz_neu_berechnen`, `bo.umsatz_alle_neu_berechnen` |
| `walletErneuern({karte})` | Mitarbeiter | `wallet_pass_erneuern` |
| `feldSetzen({karte, feld, wert, modified})` | Mitarbeiter | Allowlist (`persoenlicher_berater`, `kanal`, `geburtstag_tag_monat`) → `setValue`; Konflikt → `conflict` |
| `notizSpeichern({karte, text})` | Leitung | `setValue notizen_intern` |
| `leitungBitten({karte, aktion})` | Mitarbeiter | `getList PH Aufgabe` (idempotent) → `insert PH Aufgabe` |
| `aufgabenAnBerater({karten, titel})` | Leitung | Kontakt `nicht_kontaktieren` + Einwilligungen lesen → n × `insert PH Aufgabe` |
| `bulkBerater`, `bulkSperren`, `bulkNeuBerechnen`, `exportCsv` | je Recht | n × Einzelaufruf, Fortschritt |
| `stufenplanVorschau({stufen})`, `stufenplanSpeichern({stufen, vorteile})` | Leitung | `bo.stufenplan_vorschau`; n × `save Stufe`, `save Vorteil gilt_ab_stufe`, Rücknahme bei Teilfehler, `bo.umsatz_alle_neu_berechnen` |
| `stammdatenAnlegen()` | Leitung | `bo.stammdaten_anlegen` |
| `einstellungenSpeichern(formData)` | Leitung | `save PH Kundenkarte Einstellungen` |
| `kundenmodusStarten/Beenden({kontext, pin?})` | Mitarbeiter | Sitzungsobjekt serverseitig (kurzlebig, 15 min), `verify_pin` |

### 16.4 Reihenfolge und Aufwand (Schätzung in Agent-Stunden, ohne Backend-Arbeiten)

| # | Paket | Inhalt | Std. |
|---|---|---|---|
| 1 | Grundlagen | `kartennummer`, `textpruefung`, `labels`, `regeln`, `felder` (Allowlist), `faehigkeiten`, Mock-Seed, Unit-Tests | 5 |
| 2 | Karten-Liste + Karten-Akte lesend | Liste, Peek, Kopf, MiniKarte, StufenKennzeichen, Stufenblock, 4 Tabs, Bezüge, Nächster Schritt | 9 |
| 3 | Einlösen | Popover, BelegListe, Registry, Undo A + `flush`, Fehlerfälle, Fokus/Live-Region, EinloeseDialog | 6 |
| 4 | Lebenszyklus | Sperren, Ersatz, Übergabe, Entsperren, Kündigen, Übertragen, Zusammenführen, LeitungBitten | 6 |
| 5 | Stufe + Einwilligung | Popover Stufe, Einwilligung erfassen/beenden, NachweisAufnahme | 5 |
| 6 | Anträge | Liste, Akte, Ausstellen (Kontaktlogik), Ablehnen, Doppelt | 6 |
| 7 | Neue Karte + Kundenmodus | Formular, Intercepting Route, Ergebnis-Karte, Kundenmodus, Idempotenz | 7 |
| 8 | Stufen & Vorteile | Stufenplan, Sheets, Zuordnung → `gilt_ab_stufe`, Vorschau, Speicherleiste mit Rücknahme | 6 |
| 9 | Übersicht, Einlösungen, Berichte, Einstellungen | Kennzahlen, Zu tun, Checkliste, Einlösungsliste/Sheet, 4 Reports + Kanal-Vorschau, Einstellungen | 7 |
| 10 | iPad/Telefon/Kamera | Bottom-Sheets, KameraScan mit dynamischem Decoder, mobile Karten | 4 |
| 11 | Texte, Hilfe, Barrierefreiheit, E2E | 9 Hilfeartikel, Glossar-Popover, axe, K1–K44 | 9 |
| | **Summe** | | **70** |

Reihenfolge zwingend: 1 → 2 → 3; 4–9 danach in beliebiger Reihenfolge (parallelisierbar ab 2); 10–11 zuletzt. Fundament-Teile (16.2) vor Paket 3 (Undo/Popover) bzw. vor Paket 2 (Scan-Tor).

### 16.5 Abhängigkeiten zu anderen Bereichen
| Bereich | Braucht von Kundenkarte | Liefert an Kundenkarte |
|---|---|---|
| Fundament | – | Scan-Tor, Popover, Sheet, Speicherleiste, Toast 8 s, Sammeldruck, BedienerRueckkehr, Einzeltasten-Schalter, Feldkonflikt |
| CRM | `StufenKennzeichen`, Chip-Link, Dialog „Auswertung beenden“ | Kundenakte, PH Aufgabe, `nicht_kontaktieren`, Datenauskunft/Anonymisieren-Hooks |
| Kassa | `kartennummer.js`, `StufenKennzeichen`, Chip-Regeln, Kurzform-Antrag | Kartenleistung-Position (P6), Training/Offline, Retoure-Anzeige |
| Logistik | Chip/Zeile am Packtisch, Kennzeichen am Tour-Stopp | Lieferschein-Abschluss → Erbringung (P5), Liefergebiet |
| Projekte | Kennzeichen am Montageauftrag | Abnahme → Erbringung (P5) |
| Faktura | Kundenleiste in der AB „Leistung zusagen“ | AB/Rechnung-Position 0,00 €, Schlussrechnungslogik für B1 |
| Marketing | – | Einwilligungszweck `kundenkarte_auswertung`, Werbe-Zwecke je Kanal |
| Shop | – | Bestellung, FAGG-Rücktrittsfrist |
| Zentrale | Aufgaben (Geburtstag, Übergabe, Anbieten), Heute-Zähler | „Meine Aufgaben“ |
| ph_core | – | `global_search`, `recent_activity`, `verify_pin`; Einlösung in `BEREICHE` |

### 16.6 QA-Checkliste vor Abnahme
- [ ] Alle Routen laufen im Mock-Modus (`BACKOFFICE_MODE=mock`) und gegen Frappe-Staging.
- [ ] Jede Seite `requireSession`/Rollenprüfung zuerst, `dynamic = "force-dynamic"`, Fehler als `Fehler`-Komponente.
- [ ] Netzwerk-Assertion K32 (Mitarbeiter: keine Umsatzfelder, keine Hashes, keine E-Mail in Listen); Kassa-Rolle: Akte 404.
- [ ] Scan-Simulation K27 auf allen Seiten; Kommentarfeld bleibt Text.
- [ ] Einzeltasten-Schalter K28; keine Einzeltaste für irreversible Aktionen.
- [ ] Undo 8 s überall; `flush()` bei Navigation; Commit-Fehler nach Seitenwechsel als bleibender Toast.
- [ ] Jede deaktivierte Aktion hat sichtbaren Satz + „Leitung bitten“.
- [ ] Leerzustände §11 vollständig, Glossar §12.1 angewendet (Grep Rohwerte = 0).
- [ ] Grep K22 (Geldwort, Superlative) = 0.
- [ ] axe serious/critical = 0 (desktop + iPad), Fokus nach Einlösen, Popover-Fokusfalle, Kontrast hell/dunkel `StufenKennzeichen`.
- [ ] `prefers-reduced-motion`-Lauf K20.
- [ ] Klickwege K34 gemessen.
- [ ] Fähigkeiten K44: Übergangsregeln im Mock ohne Zielfelder, Zielverhalten mit Zielfeldern.
- [ ] Bezugsregeln K38, Einlösungs-Sheet readonly K39, Ablehnungsgrund K40, Kanal-Vorschau K41.
- [ ] Kundenmodus K29 am iPad-Viewport; Kamera-Scan mit verweigertem Recht.
- [ ] Budgets K23 (Decoder nicht im Routen-Bundle).
- [ ] Unit-Tests `node --test` grün; ESLint 0 Fehler.
- [ ] Liste offener Backend-Abhängigkeiten (§9.3) im Abnahmeprotokoll mit Status; Livegang erst, wenn alle „blockiert Livegang: ja“ erledigt und Kanzlei-/Steuerberater-Fragen (§15) beantwortet sind.

---

## 17. Änderungsprotokoll (Überarbeitung 04.11.2026)

**Aus UX-Kritik (`20-kritik-ux-kundenkarte.md`):**
| Nr. | Umsetzung |
|---|---|
| P1 Scan löst Kürzel aus | Scan-Tor §2.3, K27 |
| P2 Scan in Textfeldern | Regel `data-scan="ja"` §2.3 |
| P3 Kürzelkollisionen, WCAG 2.1.4 | neue Kürzeltabelle §2.4, Einzeltasten-Schalter, K28 |
| P4 Klickzahlen | §1 neu gezählt, zwei Spalten, K34 |
| P5 7 Tabs | 4 Tabs §3.5.3, Zeitleiste → Tab Verlauf |
| P6 vier Speichermodelle | ein Modell, keine Speicherleiste in der Akte §3.5.3 |
| P7 Stufe manuell | Popover mit Grund, nur Leitung §3.5.4 |
| P8/P8a Undo, Widerruf | 8 s überall, Variante A für Einlösen/Sperren/Übergabe §4.3; Widerruf-Dialog §3.5.5 |
| P9 Einlöse-Dialog zu schwer | Popover, ein Klick §3.5.7 |
| P10 4-Schritt-Assistent | ein Formular §3.10 |
| P11 Kundin am iPad | Kundenmodus §3.12, K29 |
| P12 Stufe wie Status | `StufenKennzeichen` §10, K31 |
| P13 Statusfarben | §4.5, Eintrag in 03 §1.5 |
| P14 zwei Wahrheiten Vorteil/Stufe | nur Zuordnung, `gilt_ab_stufe` automatisch, Speicherleiste gesamt §3.7, K33 |
| P15 Scan-Muster | eine Funktion `kartennummer.js`, Navigation nur bei Enter §2.3 |
| P16 Kamera am iPad | `KameraScan` mit Decoder-Rückfall §7.1 |
| P17 Tooltip als einzige Erklärung | sichtbarer Satz + „Leitung bitten“ §2.2 |
| P18 Kontaktwahl beim Ausstellen | Regeln §3.3 |
| P19 Antrag-Tabs | ohne Tabs §3.3 |
| P20 Kanban | entfernt, Reiter §3.2 |
| P21 Leerzustände | §11 |
| P22 Kassa in der Akte | keine Akte für Kassa, DAL-Allowlist §2.2, K32 |
| P23 Schwellen-Geheimnis | Mitarbeitende keine Beträge; Leitung „Beträge zeigen“ §3.5.2 (zugunsten Rechtskonformität entschieden, statt Inhaber-Frage nur noch Bestätigung §15) |
| P24 Bänder | Rangfolge, Einwilligung als Zeile §3.5.1 |
| P25 Fokusverlust | §3.5.7, K30 |
| P26 Navigation, doppelte Route | Unternavigation §2.1, `/vorteile` → 307 |
| P27 Rohwerte | Glossar §12.1 |
| P28 Planungsnotizen im Spec | entfernt; offene Fragen nur §15 |
| P29 Listen zu breit | 6 bzw. 5 Spalten §3.2, §3.4 |
| P30 Hilfe | §12.2, §12.3 |
| Empfehlungen §3 | übernommen: Heute vs. Kennzahlen, Einrichtungs-Checkliste, Filterzeilen, Gruppieren in Werkzeugleiste, „T. Steiner“, Packtisch-Zeile, Kassa-Ergebnistext, Kündigen nur Leitung, Roving-Tabindex, Palette-Aktionen, a11y-Einzelpunkte, Telefon-Ausnahme, mobile Listen, Kopf-Entwurf mit Mini-Karte, Art-Icons, Stufenblock kompakt, Storno „bis 23:59“, Sammel-Neuberechnung jetzt vorhanden |

**Aus Fachkritik (`21-kritik-fach-kundenkarte.md`):**
| Nr. | Umsetzung |
|---|---|
| F1 Number Card | Methode `einloesungen_30_tage` §5 |
| F2 `annehmen(aktiv)` | Status berechnet, `sofort_aktiv` §3.3, §3.10 |
| F3/B8 Kartennummer-Belege | Einkäufe-Tab Hinweis, P2 §9.3 |
| F4/F5 Montage/Lieferung falscher Bezug | Bezugsregeln §4.6, Möbelkette §7.5 |
| F6 Einwilligung nicht protokolliert | Backend erledigt (Ereignis) |
| F7 DuplicateEntryError | Server Actions §3.3, §3.10, K24 |
| F8 Bon nach Signatur | §7.3 Ziel + Übergang ohne Bonzeile |
| F9 Ersatzkarte | Dialog §3.5.6 (Backend vorhanden), K36 |
| F10/F11 Feldrechte | DAL-Allowlist + Backend P8 |
| F12 Stufe-Recht | nur Leitung, Backend P9 |
| F13 Schwelle ableitbar | keine Beträge für Mitarbeitende |
| §2 UI ohne Feld | jeweils Übergangsregel §9.3 und Fähigkeitsprüfung |
| PR1–PR4 Zusage bei AB, Tour, Montage | §4.1 Ziel, §4.6, §7.5 |
| PR5 Storno-Kaskade | Backend erledigt; Verlauf zeigt „Einlösung storniert – Beleg … storniert“ |
| PR6/PR7 Retoure, Karenz | §7.3, §15 |
| PR8 Ersatzkarte | §3.5.6 |
| PR9 Anonymisieren | über ph_crm-Hook §3.11, kein Löschen in der UI |
| PR10 Kanal | §8.2, §3.8, K41 |
| PR11 Haushalt | Hinweisband §3.3, K37 |
| §4.1 RKSV | §7.3 (Ziel, Übergang, Training, Notbetrieb) |
| §4.2 UStG | Position 0,00 € §7.5; Beleg Pflicht außer Persönlich/Event; Gutschrift/Gutschein-Prüfung §3.7 |
| §4.3 FAGG | getrennte Zeilen Rücktritt/Umtausch §7.3; Kanzlei §15 |
| §4.4 DSGVO | Nachweis-Dialog, Widerruf mit Kanal, Zweckbindung (keine „kurz vor“-Regel), Datenschutzinfo-Haken, Wallet-Inhalt, kein Löschen |
| §4.5 TKG | §8.2 |
| §4.6 GlBG | Ablehnungsgrund-Katalog §3.3, Grund bei Stufe von Hand §3.5.4, Anrede am Kundendisplay §7.3 |
| §5 B1–B11 | Backend P2; UI-Band „Berechnung im Aufbau“, wahrheitsgemäßer „Zählt“-Text §3.5.2 |
| §6 Randfälle | Firmenkunde (§15), Minderjährige (Haken), 29.02. (Backend erledigt), Geburtstag ohne Jahr (Tag/Monat), Wettlauf (Fehlerzustand), Jahreswechsel (Backend-Anfrage), Stufe deaktivieren (gesperrt), Kunde ohne E-Mail (Fähigkeit) |
| §8.1–8.7 | Dialog Einwilligung §3.5.5, Stufenblock §3.5.2, Einlöse-Zustände §3.5.7, Formular §3.10, Antrag §3.3, Kiosk §7.3, Akte §3.5.6 |
| K27–K43 (Fach) | als Backend-Abnahme in §13; UI-relevante als K35–K43 übernommen |

**Widersprüche aufgelöst:**
| Widerspruch | Entscheidung | Begründung |
|---|---|---|
| Undo 5 s (Fach §8.3) vs. 8 s (UX P8) | 8 s | eine Regel für alle Bereiche |
| Einwilligung erteilen „sofort + Undo“ (UX P8) vs. Dialog mit Nachweis (Fach P3) | Dialog mit Nachweis, kein Undo | Art. 7 Abs. 1 DSGVO |
| „Ohne Bezug“ immer (UX P9) vs. Beleg Pflicht (Fach §4.2) | „Ohne Beleg“ nur Persönlich/Event | Steuer-/Nachweisrisiko |
| Assistent mit Schritten (Fach §8.4) vs. ein Formular (UX P10) | ein Formular mit allen Fach-Pflichtfeldern | Einfachheit; Rechtsinhalt bleibt |
| Beträge für Mitarbeitende (UX P23 Optionen) | keine Beträge | Zweckbindung, Showroom-Bildschirm |
| Sand-Outline für „Zugesagt“ (Fach §8.3) | Status-Ton türkis | Sand ist Akzent, nicht Status (03) |
| Kündigen durch Mitarbeitende (Backend) vs. UX-Empfehlung | UI: nur Leitung | irreversibel ≥ Entsperren |
| Kassa-Bonzeile nach Buchung (alt) vs. RKSV | keine Bonzeile im Übergang, Position vor Signatur als Ziel | RKSV |
| Kanban-Fixture | nicht im Next; Backend-Entfernung angefragt | DOI-Nachweis nicht umgehbar |

**Gegenüber der Vorfassung entfernt:** Kanban-Ansicht, Tabs der Antrag-Akte, 7-Tab-Akte, Speicherleiste in der Akte, Einzeltasten `V W K P E S D R`, Drehen als Kundenmodus-Auslöser, Ort-Auswahl „Kassa/Packtisch“ im Backoffice-Dialog, Regel „kurz vor <Stufe>“, Bonzeile nach Buchung, Hinweise auf interne Entscheidungsprozesse in UI-Texten, Lücken, die das Backend inzwischen schließt (Logistik in `KASSA_ROLLEN`, Kassa-Antragsrecht, `hand_over_card`, `wallet_status`, `stufenplan_vorschau`, `umsatz_alle_neu_berechnen`, `stammdaten_anlegen`, Ereignis Einwilligung/Widerruf, 29.02.).

*Ende 10 – Konzept Kundenkarte (final).*
