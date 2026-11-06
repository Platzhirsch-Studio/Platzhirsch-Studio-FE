# 10 – Konzept Bereich „Marketing“ (Funktion, Oberfläche, Bauauftrag) – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept des Bereichs Marketing im eigenen Next.js-Backoffice (`backoffice/`, Port 3100, Route `/marketing`) samt Bauauftrag. Datenschicht ist die Frappe-App `ph_marketing` (24 DocTypes laut Ordner `doctype/`, 4 Workflows, 6 Reports, 4 Druckformate, 7 Scheduler-Läufe) – für Mitarbeiter unsichtbar.
**Stand:** 2026-11-04 · Rolle: Produktdesigner (Überarbeitung) · Status: finale Fassung zur Umsetzung; Punkte mit „Entscheidung Inhaber/Kanzlei/StB“ bleiben offen und sind im Bau als Schalter bzw. gesperrte Funktion vorgesehen.
**Eingearbeitet:** alle Pflichtänderungen aus `20-kritik-ux-marketing.md` (P1–P20, Empfehlungen §2, Wireframes §3, Widersprüche W1–W13, Klickzahlen §5, Abnahme §7) und `21-kritik-fach-marketing.md` (F1–F11, U1–U22, R1–R14, B1–B7, P-M1–P-M11, Randfälle §6, P0/P1/P2 §7, K1–K13 §8, Akzeptanz §9). Widersprüche zwischen beiden Kritiken sind zugunsten von **Einfachheit** und **Rechtskonformität** gelöst (§0.2). Änderungsprotokoll am Ende (§15).
**Gegengeprüft am Datenbestand (04.11.2026, nur gelesen):** `Backend-Import/ph_marketing` (README, DocType-JSONs, `events.py`, `checkin.py`, `newsletter.py`, `segmente.py`, `kampagnen.py`, `mail_ereignisse.py`, `api/__init__.py`, `api/webhook.py`, `hooks.py`, `doctype/ph_einwilligung/ph_einwilligung.py`), Fundament `backoffice/src` (Ordnerstruktur, `frappe/client.js`, `actions.js`), `PLAN-NEXT-BACKOFFICE.md` §1, §8–§10, `03-design-system.md` §1.5, `04-motion.md` Token. Der Datenbestand ist seit der ersten Fassung gewachsen (Check-in per QR, Nachrücken, Absage-Mail, Zielgruppen/Segmente, Mail-Ereignisse/Bounce-Webhook, Kontaktpunkte/Attribution, CSV-Kennzahlen) – das ist hier berücksichtigt (§11).
**Regeln:** Deutsch, Du-Form intern, Sie in Kundenmails. Beträge in Cent, Anzeige `cent()`. Keine Superlative, keine erfundenen Zahlen: Zahlen in Wireframes sind Platzhalter; Fristen/Werte von Kanzlei oder Steuerberater stehen als `‹Kanzlei›`/`‹StB›`/`‹Inhaber›`. Frappe-Begriffe erscheinen nie in der Oberfläche. Rollen: `PH Marketing Mitarbeiter` („Mitarbeiter“), `PH Marketing Leitung` („Leitung“), `PH Geschäftsführung` („GF“, lesend + Freigaben). Keine Rechtsberatung – jeder Rechtspunkt ist vor dem Umlegen eines Schalters eine Frage an die Kanzlei.

---

## 0. Leitidee und Entscheidungen

### 0.1 Leitidee in fünf Sätzen

1. **Marketing ist bei Platzhirsch Kundenbeziehung, die eine Gastgeberin nebenher macht.** Ein Brief im Monat („Post aus Lochau“), ein Adventsabend, wenige leise Kundenreisen, ein Empfehlungsprogramm, ein Redaktionsplan für Pinterest/Instagram. Die Oberfläche folgt der Arbeit, nicht der Datenstruktur: **eine Person = eine Akte** (Abo und Einwilligungen zusammen), **ein Freigabemuster** für alles, was nach außen geht, **sechs sichtbare Bereiche** plus „Mehr“.
2. **Rechtsregeln sind Bedienkomfort.** Bestätigungsmail (Double-Opt-in), Einwilligungszwecke, Grundlagen „Vertrag/Service“, „Bestandskunde“, „Einwilligung“, Bildrechte, Werbefenster Di–Do, Sperrtage, höchstens n werbliche Mails in 30 Tagen – die Oberfläche zeigt jede Regel als **Satz mit Folge** („Werbung heute nicht möglich: Montag. Nächstes Fenster Dienstag“). Verbotene Werte sind **nicht wählbar**, statt nach dem Klick als Fehler zu erscheinen.
3. **Recht geht vor Bequemlichkeit.** Wo der Datenbestand eine Rechtsfrage falsch löst (Event-Anmeldung als Werbe-Einwilligung, Einwilligung ohne Nachweis, Gutschein vor Lieferung), baut die Oberfläche den richtigen Weg und **sperrt** die betroffene Funktion mit Grund, bis das Backend nachzieht (§11). Kein Livebetrieb mit echten Adressen vor den P0-Punkten.
4. **Undo statt Rückfrage, Rückfrage nur bei Endgültigem.** Was nach außen wirkt und rückholbar ist (Zur Freigabe, Verwerfen, Pausieren, Code senden), läuft mit **verzögertem Commit** und Undo-Balken – gleich für alle Rollen. Was nicht rückholbar ist (Abmelden, Widerruf, Einwilligung speichern, Versand, Geld), bekommt einen **Bestätigen-Dialog mit Fakten**.
5. **Nichts geht ohne Freigabe der Leitung nach außen.** Newsletter, Social-Beitrag, Event veröffentlichen, Reise aktivieren: Mitarbeiter „Zur Freigabe“ → Leitung „Freigeben“ in Glocke oder „Zu tun“ – mit Vorschau, nie blind.

### 0.2 Auflösung der Widersprüche (verbindlich für den Bau)

| # | Widerspruch | Entscheidung | Begründung |
|---|---|---|---|
| E1 | UX P8(c): Anmeldedialog speichert Einwilligung „Einladungen“ mit Hinweis-Häkchen ↔ Fach R1: Teilnahme ist keine Werbe-Einwilligung | **Fach R1.** Anmeldung speichert nur den Nachweis „Teilnahme“; künftige Einladungen nur mit eigenem Schalter „Gast hat ausdrücklich ja gesagt“ (Standard aus) + Bestätigungsmail. | Rechtskonformität |
| E2 | UX P9: „Einwilligung erfassen“ speichert sofort wirksam mit Zusammenfassung ↔ Fach R2/K1: ohne Bestätigungsmail oder unterschriebenes Formular kein Nachweis | **Fach R2** mit UX-Dialogform (Zusammenfassung vor dem Speichern bleibt). Kanal Papier → Formular Pflicht; alle anderen Kanäle → Bestätigungsmail. | Rechtskonformität |
| E3 | Fach §8: Kürzel `d` (Bestätigungsmail), `w` (Nachrücken) ↔ UX P6: keine Einzeltaste, die eine Mail auslöst | **UX P6.** Bereichsaktionen nur mit Shift, Mail-Aktionen öffnen höchstens den Dialog. | Fehlervermeidung, WCAG 2.1.4 |
| E4 | UX P2 „Keine Werbung mehr“ ↔ Fach P-M2 „Widerspruch erfassen“ (kanalübergreifend, mit Umfang) | **Ein Dialog** „Keine Werbung mehr“ mit Umfang-Wahl; in der Kundenakte heißt der Einstieg gleich. | Einfachheit (ein Wort, ein Weg) |
| E5 | UX P17: Gutschein in einem Dialog erstellen und senden ↔ Fach B1/R8: Gutschein-Art „Aktion“, erst nach Lieferung, Zahlung, Frist | **Ein Dialog (UX)**, aber **gesperrt**, bis `PH Gutschein.art = Aktion` (ph_shop) und die AB-Verknüpfung (`PH Empfehlung.auftrag`) stehen. Kein Verkaufsgutschein als Ersatz. | Rechts-/Buchhaltungskonformität |
| E6 | UX P14: Ideen per Drag einplanen ↔ Fach F5: `datum_geplant` ist Pflicht | **Ideenleiste entfällt**, bis `datum_geplant` im Status Idee optional ist (P1-12). Neue Idee bekommt das Datum der angeklickten Zelle; Drag setzt nur das Datum, für jeden Status. | Einfachheit, Datenbestand |
| E7 | PLAN §9 fordert Kanban je Bereich ↔ UX 2.1-1: Kanban für 12 Ausgaben/Jahr ist Rauschen | **Kanban nur für Social.** Newsletter, Kampagnen, Events nur als Liste. Generische Ansicht `/d/<doctype>?ansicht=kanban` bleibt für Admins. | Einfachheit |
| E8 | UX P12 Anwesenheit mit Block-Sperre ↔ Fundament hat noch keine Anwesenheit | Anwesenheit ist Fundament-Abhängigkeit; **Rückfall** ohne Anwesenheit: blockweiser Abgleich über `modified` (§2.3), kein Diff-Dialog über JSON. | Einfachheit |
| E9 | UX 2.1-11 Leitung darf direkt „Freigeben und planen“ ↔ Vier-Augen-Prinzip | **Erlaubt** für Benutzer mit Leitungsrolle (beide Übergänge in der Zeitleiste). Vier-Augen bleibt **Entscheidung Inhaber**, im Bau als Schalter `config.marketing.vierAugen` (Standard aus). | Einfachheit; keine Rechtspflicht bekannt |
| E10 | UX 2.1-12 E-Mail-Maskierung | **Keine Maskierung** für Marketing-Rollen (sie brauchen die Adressen); CSV-Export nur Leitung, jeder Export als Kommentar protokolliert. Entscheidung Inhaber/Datenschutz bestätigt oder kippt das. | Einfachheit; Maskierung schützte nicht (Hover/Akte) |
| E11 | Widersprüche W1–W13 in den Leitlinien | Bis der UX-Lead entscheidet, gilt für Marketing die Vorschlagsspalte aus 20 §4 (Tabelle §2.0.7 hier). | Ein Wert je Regel |
| E12 | Konzept alt: „Als durchgeführt schließen“ (Leitung) ↔ Fach F6: Scheduler schließt am Folgetag | **Knopf entfällt.** Abschluss am Eingang über „‹ Fertig“ (Nicht-Erschienene markieren). | Einfachheit, Datenbestand |

### 0.3 Was heute baubar ist und was auf das Backend wartet

Der Bereich wird **vollständig** gebaut (Mock + Frappe-Modus). Funktionen, deren Backend-Voraussetzung fehlt, prüft `lib/backoffice/marketing/faehigkeiten.js` (§13.4) und zeigt sie **deaktiviert mit Grund** („Kommt mit dem nächsten Backend-Stand: Anmeldung aus dem Backoffice“) – nie ausgeblendet, damit die Mitarbeiterin den Weg kennt. Im Mock lassen sich alle Fähigkeiten einzeln ein- und ausschalten (`BACKOFFICE_MOCK_FAEHIGKEITEN`), damit beide Zustände abgenommen werden können. Übersicht der Sperren: §11.2.

---

## 1. Nutzer und Top-Aufgaben (Zielklickzahl, nach Umsetzung gezählt)

Klickzahl = Klicks/Tipps ab Zentrale ohne Suche; Enter zählt als Klick (02 §1). Palette (⌘/Strg+K) ist immer **zweiter** Weg, nie der einzige. Jede Zeile ist ein E2E-Schritt mit Klickzähler (§14).

### 1.1 Marketing-Mitarbeiterin
Meist dieselbe Person wie Gastgeberin/Empfang; Laptop, am Abend iPad; Marketing in Blöcken zwischen Kundenkontakten.

| Top-Aufgabe | Häufigkeit | Ziel | Weg |
|---|---|---|---|
| Newsletter-Ausgabe des Monats anlegen | monatlich | 2 | Marketing → „+ Neue Ausgabe“ (legt an, öffnet Editor, Fokus im Betreff) |
| Block befüllen | monatlich × 4 | 1 je Block | Block anklicken → tippen (Server-Autosave) |
| Testmail an mich | monatlich | 3 | Ausgabe öffnen (Karte Übersicht) → „Testmail…“ → Enter |
| Zur Freigabe geben | monatlich | 1 ab Ausgabe | „Zur Freigabe“ (Undo-Balken, keine Rückfrage) |
| Showroom-Anmeldung zum Newsletter | täglich | 3 | Kopfzeile „+“ → „Newsletter-Anmeldung“ → E-Mail + Enter |
| Event-Anmeldung am Telefon | saisonal täglich | 3 | Marketing → Karte „Nächstes Event“ „Anmeldung erfassen“ → Felder + Enter |
| Social-Beitrag planen | wöchentlich × 3 | 3 | Marketing → Social → Tag-Zelle (Titel tippen, Enter legt Beitrag mit Datum an) |
| Kampagnen-Kennzahl eintragen | wöchentlich | 4 | Marketing → Kampagnen → Zeilenknopf „Kennzahl“ → Enter |
| Abmeldung aus Antwortmail protokollieren | wöchentlich | 5 | Marketing → Empfänger → Suche/Zeile → „Abmelden…“ → Bestätigen |
| Einwilligungsnachweis ausgeben | selten | 4 | Marketing → Empfänger → Zeile → „Nachweis (PDF)“ |

### 1.2 Marketing-Leitung (bei Platzhirsch Inhaber oder Gastgeberin)

| Top-Aufgabe | Ziel | Weg |
|---|---|---|
| Newsletter freigeben und Versand planen | 3 | Glocke → „Freigeben“ → „Freigeben – Do 03.12. 18:00“ (Dialog mit Vorschau) |
| Social-Beitrag freigeben | 3 | Glocke → „Freigeben“ → Enter (Dialog D2 mit Bild, Text und den drei Bildrechte-Prüfungen; ohne Sicht auf das Bild keine Freigabe) |
| Event veröffentlichen | 3 | „Zu tun: Uhrzeit fehlt“ → Uhrzeit + Enter → „Veröffentlichen“ (Bestätigung) |
| Empfehlungsgutschein ausgeben | 3 | Glocke → „Gutschein…“ → „Gutschein über … erstellen und senden“ (gesperrt bis §11.2 S7) |
| Kundenreise aktivieren | 5 | Marketing → Mehr → Kundenreisen → Reise → „Aktivieren“ → Bestätigen (selten; Zielwert ehrlich) |
| Kanzlei-Freigabe eintragen | 5 (über „Zu tun“ 3) | Marketing → Mehr → Einstellungen → Schalter → Bestätigen |
| Kampagne auswerten | 3 | Marketing → Kampagnen → Zeile → Tab „Auswertung“ |

### 1.3 Geschäftsführung
Lesend: Übersicht, Kampagnen-Kosten (belegt/gemeldet), Abo-Entwicklung, Event-Auslastung, Bericht Kampagnen-ROI (netto). Jede Kennzahl ist ein Link (1 Klick).

### 1.4 Andere Rollen, die den Bereich berühren
- **Verkauf/CRM:** Kundenakte Tab „Marketing“ (§3.2) lesend + „Newsletter-Anmeldung“, „Event-Anmeldung“, „Keine Werbung mehr“, „Empfehlungscode“.
- **Kassa:** keine Marketing-Erfassung. Aber: Aktionsgutscheine (Empfehlung) werden an der Kassa als **Preisnachlass** eingelöst (ph_kassa/ph_shop, §12); Verkauf am Eventabend läuft über die normale Kassa.
- **Projekte:** Referenzen (`/projekte/referenzen`) zeigen die Einwilligung „Foto-Referenz“; Social-Beitrag mit Kundenprojekt verlangt diese Einwilligung (§2.9).

---

## 2. Gemeinsame Regeln und Seiten

### 2.0 Gemeinsame Regeln

#### 2.0.1 Unternavigation (6 + Mehr)

```
Zentrale › Marketing
[Übersicht] [Newsletter •] [Social] [Events 2] [Kampagnen] [Empfänger] [Mehr ▾ •]
                                                                       ├ Kundenreisen
                                                                       ├ Zielgruppen
                                                                       ├ Empfehlungen   1
                                                                       ├ Einblicke
                                                                       ├ Berichte
                                                                       ├ Vorlagen        (Leitung)
                                                                       └ Einstellungen   (Leitung)
```
- Pills nach 05 §1; aktiver Unterstrich 2 px **Tinte** (`ink`, W8: ein Wert, Kontrast 1.4.11), gleitet 200 ms `--bo-ease-inout`. Bei 1 024 px kein horizontaler Scroll (6 Pills + „Mehr“ ≤ Inhaltsbreite bei eingeklappter Seitenleiste).
- „Mehr ▾“: Popover (03 §8.11), Öffnen 160 ms `opacity` + `translateY(-4px)` → 0, `--bo-ease-out`; Schließen 120 ms `--bo-ease-in`. Pfeiltasten im Menü, Esc schließt, Fokus zurück auf „Mehr“. Aktiver Unterpunkt: „Mehr“ trägt den Unterstrich und zeigt den Namen „Mehr · Kundenreisen ▾“.
- Zählen je Rolle nach Ausblendung (W13); „Mehr“ zählt nicht mit.
- **Badges:** Newsletter = Ausgaben „Wartet auf Freigabe“ (nur Leitung) · Events = Anmeldungen heute · Social = Beiträge „Wartet auf Freigabe“ (Leitung) bzw. „Heute geplant, nicht veröffentlicht“ (Zuständige) · Empfehlungen = „Gutschein fällig“ (Leitung). Ein Badge an einem Eintrag unter „Mehr“ erscheint als Punkt 6 px `accent` am „Mehr“-Knopf und als Zahl im Menü. Badge-Zahl ändert sich ohne Animation (kein Hochzählen).
- Alte Routen `/marketing/abos`, `/marketing/einwilligungen` (+ `[…]`) leiten dauerhaft (308) auf `/marketing/empfaenger?ansicht=personen|einwilligungen` bzw. die Personen-Akte.

#### 2.0.2 Bänder (höchstens eines je Seite)
Priorität: **Testmodus > Fehler > Hinweis**. Weitere Hinweise wandern als Zeile in die Zustandsleiste des Kopfes.
- **Testmodus** (ph_core `PH Einstellungen.testmodus`): „Testmodus – alle Mails gehen an die Testadresse team@…“ `special-soft`, nicht schließbar, auf allen Seiten des Bereichs.
- **Automatik aus** (`automatik_aktiv = 0`): nur Übersicht und Kundenreisen, Ton `info`: „Kundenreisen sind ausgeschaltet – es werden keine automatischen Mails geplant.“
- **Backend-Sperre** (§11.2): nur auf der betroffenen Seite, Ton `info`: „Einige Funktionen warten auf den nächsten Backend-Stand – Details“ (Popover mit Liste).

#### 2.0.3 Sprache (Glossar, eine Quelle)
Alle sichtbaren Texte, Label-Maps und Hilfe-Popover kommen aus `lib/backoffice/marketing/texte.js`. Verboten in sichtbaren Strings (Abnahme-Grep §14): „DOI“, „Opt-in“, „Bounce“, „Claim-Guard“, „Slot“, „Preheader“, „Overline“, „UTM“, „ECG“, „V/B/E“ als Wort, „Frappe“, „DocType“, „Workflow“, „Jinja“, „Doku“, „.md“, rohe Schlüssel (`b_kanzlei_offen`, `jaehrlich (MM-TT)` …).

| Fachbegriff / Schlüssel | Oberfläche |
|---|---|
| DOI, DOI-Mail, DOI-Quote | „Bestätigung“, „Bestätigungsmail“, „Bestätigungsquote 30 Tage“ |
| Angemeldet unbestaetigt | „Unbestätigt“ |
| Altbestand ohne DOI | „Alte Adresse ohne Bestätigung – wird nicht angeschrieben“ |
| Bounce (hart/weich) | „Unzustellbar“ / „vorübergehend unzustellbar“ |
| Beschwerde | „Als Spam gemeldet“ |
| Claim-Guard | „Bildrechte“ |
| Slot offen | „optional, leer“ |
| Preheader / Overline | „Vorschauzeile“ / „Dachzeile“ |
| Fußzeile A/B | „Fußzeile mit Abmeldelink“ |
| Fußzeile V/S | „Fußzeile ohne Abmeldelink (Service)“ |
| Grundlage V / B / E | „Vertrag/Service (keine Werbung)“ · „Bestandskunde, ähnliche Produkte“ · „Einwilligung“ (Kürzel nur als `muted`-Nebentext) |
| ECG-Abgleich | „Abgleich mit der Robinson-Liste“ |
| UTM-Link | „Kampagnen-Link für Anzeigen“ |
| Frequenzgrenze | „höchstens {werbung_pro_30_tage} werbliche Mails in 30 Tagen“ |
| Segment | „Zielgruppe“ |
| `kein_widerspruchshinweis` | „Kein Werbehinweis beim Kauf dokumentiert“ |
| Zweck-Schlüssel | Klartext aus `ZWECK_TEXT` (Schlüssel nur im Abschnitt „Technische Angaben“) |
| Versandweg | „Versand über das System“ / „Versand über Mail-Dienst“ |

Begriffe, die bleiben müssen (Art. 7, Art. 15, Art. 21, Textversion): gestrichelter Unterstrich + Popover (02 §8, max. 200 Wörter). `idempotency_key`, `ip_hash`, `quelle`, `stopp_regeln`, `quelle_system` nur im eingeklappten Abschnitt „Technische Angaben“ (Leitung).

#### 2.0.4 Status-Töne (Marketing, nachzutragen in 03 §1.5)

| Ton | Zustände |
|---|---|
| grau (`neutral`) | Entwurf, Idee, Verworfen, Widerrufen, Abgemeldet, Abgelaufen, Verfallen, Abgelehnt (Empfehlung), Abgesagt (ohne Teilnehmer), Nicht erschienen, Archiviert |
| blau (`info`) | Geplant, Offen (Event), Code ausgegeben, Anfrage eingegangen, Auftrag erteilt, Angemeldet |
| türkis (`progress`) | Wird versendet (mit 2-px-Fortschrittsbalken `accent`, kein Puls), Freigegeben (Social), Geliefert und bezahlt (Empfehlung) |
| orange (`warning`) | Wartet auf Freigabe, Unbestätigt, Unzustellbar, Pausiert, Ausgebucht, Gutschein fällig, Warteliste, „Aktiv · wartet auf Automatik“ |
| rot (`danger`) | Als Spam gemeldet, Abgebrochen (Newsletter), Abgesagt mit Teilnehmern, Auftrag storniert, Versandfehler |
| grün (`success`) | Versendet, Veröffentlicht, Durchgeführt, Aktiv, Bestätigt, Gutschein ausgegeben, Da (Check-in) |

Regel: Rot nur für Abbruch/Problem; ein Widerruf ist das Recht des Kunden und daher grau. Badge immer mit Text, Form des Punkts nach 03 §1.5. Ampeln in Bändern/Leisten als Icon mit Form (gefüllter Kreis / Ring / Dreieck) + Text, das Icon `aria-hidden`.

#### 2.0.5 Tastatur (Registry `lib/backoffice/marketing/kuerzel.js`)
- **Einzelbuchstaben nur aus 02 §9 / 05 §2:** `n` neu, `e` bearbeiten (Akte) bzw. Export (Liste), `p` drucken, `x` auswählen, `a` zuweisen, `s` Status-Filter, `c` Kommentar, `t/w/m/d` Kalender (heute/Woche/Monat/Tag), `1–9` Tabs bzw. Status-Chips (nur außerhalb von Eingabefeldern), `/` Filter, `?` Hilfe, `.` Zeilenmenü, `r` neu laden (Übersicht).
- **Bereichsaktionen nur mit Shift:** Shift+A Anmeldung erfassen (Event) · Shift+T Testmail-Dialog · Shift+K Kennzahl-Dialog · Shift+C Text kopieren (Social) · Shift+W „Keine Werbung mehr…“ (Personen-Akte, Kundenakte) · Shift+N Nachrücken-Dialog (Warteliste-Zeile).
- **Nie** löst ein Kürzel eine Mail oder Freigabe direkt aus; es öffnet höchstens den Dialog. ⌘/Strg+Enter = Primäraktion der Seite bzw. des Dialogs (Freigeben nur, wenn es die Primäraktion ist).
- Listen: Leertaste = auswählen, **Shift+Enter** = Side-Peek, Enter = Akte, ↑/↓ Zeile. Akten: **Alt+↑/↓** = vorheriger/nächster Datensatz.
- Block-Editor: Block verschieben **⌘/Strg+Shift+↑/↓**; Löschen/Duplizieren nur über das Blockmenü (`⋮` bzw. `.` bei Fokus auf dem Blockkopf). Strg+Backspace löscht in Textfeldern ein Wort, nie einen Block.
- Rückgängig: **⌘/Strg+Z** solange der Undo-Balken läuft (kein `Z` allein, W2).
- Alle Einzeltasten über Benutzer-Menü „Einzeltasten-Kürzel aus“ abschaltbar (WCAG 2.1.4; Fundament-Schalter). Das Hilfe-Panel (`?`) zeigt je Seitentyp die Belegung aus der Registry; ein Unit-Test prüft Doppelbelegungen.

#### 2.0.6 Rückmeldung, Undo, Bestätigung (eine Regel)

| Aktionsart | Verhalten | Beispiele |
|---|---|---|
| Wirkung nach außen **und** rückholbar | **Verzögerter Commit:** Oberfläche zeigt neuen Zustand sofort, Toast „… · Rückgängig“ mit linearem Balken über `--undo-ms` (Vorschlag 8 000 ms, W1), Server-Aufruf erst nach Ablauf; `pagehide`/`visibilitychange: hidden` → sofort committen; Benachrichtigungen an andere entstehen erst nach dem Commit | Zur Freigabe, Verwerfen (Social), Als ausgebucht, Pausieren (Reise/Kampagne), Code senden, Kalender-Datum ändern, Gast eingecheckt |
| Reiner Feldwert | sofort speichern, Toast nur bei Fehler | Betreff, Sprache, Interessen, Notiz |
| Nicht rückholbar / Geld / Versand an viele | **Bestätigen-Dialog** (`Bestaetigen`, 440 px) mit 1–3 Fakten, Primärverb rechts, Esc = Abbrechen, Knopf 600 ms gegen Doppelklick gesperrt, Mail-Knöpfe `disabled` bis Antwort | Abmelden, Keine Werbung mehr, Widerruf, Einwilligung speichern, Jetzt versenden, Freigeben (Dialog), Absagen und informieren, Daten löschen, Gutschein senden, Automatik einschalten |
| Rot (zerstörend) | Bestätigen rot, Fokus auf „Abbrechen“ | Abbrechen (Newsletter), Absagen, Daten löschen |

Toasts unten rechts (W4), im Kiosk oben Mitte 480 px. Eintritt 160 ms `--bo-ease-out` (`translateY(8px)` → 0, `opacity`), Austritt 120 ms `--bo-ease-in`. Fehler-Toasts bleiben bis zum Schließen. Kein `window.prompt`: Eingaben (URL, Beleg, Grund) immer als Dialog sm 400 px mit beschriftetem Feld.

#### 2.0.7 Leitlinien-Werte bis zur Entscheidung des UX-Leads (W1–W13)

| W | Wert für Marketing |
|---|---|
| W1 | `--undo-ms` (Token in `globals.css`; Texte nennen nie Sekunden) |
| W2 | ⌘/Strg+Z |
| W3 | verzögerter Commit für Außenwirkung, sofort + Gegenaktion für Feldwerte |
| W4 | Toast unten rechts, Kiosk oben Mitte |
| W5 | Tabs `1–9` außerhalb von Feldern; im Editor Tab-Taste auf Tableiste + ←/→ |
| W6 | Alt+↑/↓ nächster Datensatz; ⌘/Strg+Shift+↑/↓ Zeile/Block verschieben |
| W7 | Leertaste auswählen, Shift+Enter Side-Peek |
| W8 | Unterstrich Tinte für Tabs und Pills |
| W9 | Zahlen zählen nur bei Wertwechsel hoch (400 ms `--bo-ease-out`), nie beim ersten Laden |
| W10 | Bodoni nie für Marketing-Kennzahlen |
| W11 | G-Akkorde aus 05; `g m` = Marketing |
| W12 | Sheet 200 ms ein, 160 ms aus |
| W13 | Unternavigation zählt je Rolle nach Ausblendung, „Mehr“ zählt nicht |

#### 2.0.8 Listen, Akten, Zustände (gilt überall)
- **Listen:** ≤ 7 Standardspalten, Nebenwerte als zweite Zeile `muted` 12 px; Filter in der URL; Status-Chips; Skeleton erst nach 300 ms (Zeilenhöhe 40 px), mindestens 300 ms sichtbar, dann Inhalt 120 ms `opacity` `--bo-ease-out`; unter 768 px Karten (Titel, zwei Nebenwerte, Status, Fälligkeit), Filter als Bottom-Sheet.
- **Drei Leerzustände je Liste** (02 §7.1): nie Daten (Satz + Aktion), Filter ohne Treffer („Keine … mit … “ + „Filter zurücksetzen“), alles erledigt (Häkchen Sand 32 px, keine Aktion). Leerzustand erscheint 240 ms `opacity` nach dem Skeleton. „Kein Zugriff“ nach 03 §8.18.
- **Fehler** am Ort der Arbeit (02 §7.2), kachel- bzw. abschnittsweise `Fehlerblock` „… konnte nicht geladen werden (Fehler-Nr. …) · Erneut“; nie Vollbildfehler.
- **Akten:** Kopf (Titel, Status-Badge, Phase als kompakter Stepper in der Titelzeile – Punkte 8 px, Label nur aktuelle Phase –, eine Primäraktion, `⋯`), höchstens 4 Tabs, rechte Spalte „Bezüge · Zeitleiste“ (320 px ab 1 440 px, darunter Tab „Bezüge“). „Nächste Schritte“ nur, wenn etwas **nicht** im Kopf steht (z. B. „Event-Termin fehlt im Block Termine“), sonst entfällt der Abschnitt.
- **Speichern** in Akten: Server-Autosave nach 1 500 ms Ruhe und beim Verlassen eines Feldes/Blocks (`save` mit `modified`). Kopf-Status (03 §8.20): „Speichert …“ (Spinner 16 px erst nach 300 ms) → „Gespeichert 14:05“ → „Nicht gespeichert – Erneut“ `warning-text`. Keine Speicherleiste in Akten mit Autosave; Einstellungen behalten die Speicherleiste (§2.14). `sessionStorage` nur als Rettung bei Verbindungsfehler („Entwurf von 14:02 wiederherstellen?“).
- Seitentitel: `<Objekt> · Marketing · Platzhirsch Backoffice`.

---

### 2.1 `/marketing` – Übersicht (T1)

```
┌ Zentrale › Marketing                                                              [+ Neu ▾] ┐
│ [Übersicht] [Newsletter •] [Social] [Events 2] [Kampagnen] [Empfänger] [Mehr ▾ •]           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ZU TUN (3)                                                                                  │  Leitung: Freigaben zuerst
│ ● Ausgabe November wartet auf Freigabe · Anna, vor 2 Std.        [Ansehen] [Freigeben]      │  Mitarbeiter: „Meine Aufgaben“
│ ● Gutschein fällig · Empfehlung Maria Muster                                 [Gutschein…]   │
│ ● Adventsabend: Uhrzeit fehlt – Einladung kann nicht starten               [Eintragen]     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ Aktive Abos ────┐ ┌ Unbestätigt > 48 h ┐ ┌ Anmeldungen Advent ┐ ┌ Beiträge diese Woche ┐  │  4 Kennzahlen
│ │ 1.248  ▲ Monat  │ │ 4  ⚠               │ │ 46 / 60 Personen   │ │ 3                    │  │
│ └─────────────────┘ └────────────────────┘ └────────────────────┘ └──────────────────────┘  │
│ ┌ Nächste Ausgabe ───────────────────────────┐ ┌ Diese Woche (Social + Events) ───────────┐ │
│ │ November 2026 · „Was den Winter …“         │ │ Di 10. Pinterest „Bodensee-Küche“ ● Gepl.│ │
│ │ ● Wartet auf Freigabe · bereit ✓ · 1.248   │ │ Do 12. Instagram „Advent“ ○ wartet auf F.│ │
│ │ [Öffnen]                                   │ │ [Kalender öffnen]                        │ │
│ └────────────────────────────────────────────┘ └──────────────────────────────────────────┘ │
│ ┌ Nächstes Event ─────────────────────────────────────────────────────────────────────────┐ │
│ │ Adventsabend · Do 26.11. 18:00 · ● Offen · 46 von 60 Plätzen      [Anmeldung erfassen]   │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ▸ Mehr Zahlen (Abos je Woche · Abos nach Quelle · Einwilligungen nach Zweck)   eingeklappt  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **„Zu tun“** (oberste Kachel, wird zuerst gestreamt): Leitung = offene Freigaben (Newsletter, Social, Event veröffentlichen, Reise aktivieren), „Gutschein fällig“, „Uhrzeit fehlt“, offene Kanzlei-Schalter bei werblichen Reisen; Mitarbeiter = eigene Aufgaben (zurückgegebene Freigaben mit Kommentar, heute geplante Beiträge, Kennzahl seit 7 Tagen fehlt). Zeile: Punkt im Status-Ton, Satz, Person/Alter `muted`, bis zu zwei Knöpfe. „Freigeben“ öffnet den Freigabe-Dialog (§4.4 D1); eine erledigte Zeile fällt mit Höhe → 0 in 160 ms `--bo-ease-out` heraus (04 §3.3). Leer: „Nichts wartet auf dich.“ (Häkchen Sand 32 px).
- **Erste Schritte** (statt „Zu tun“, wenn 0 Ausgaben, 0 Events, 0 Beiträge): Karte mit drei abhakbaren Punkten (Erste Ausgabe anlegen · Event anlegen · Beitrag planen); verschwindet nach dem dritten (Zustand aus den Daten, nicht aus dem Browser-Speicher).
- **4 Kennzahlen** (03 §8.14, Instrument Sans 2xl 500 tabular): Aktive Abos (Vergleich Vormonat) · Unbestätigt > 48 h (`warning` ab 1) · Anmeldungen nächstes Event (Personen / Plätze) · Beiträge diese Woche. Jede Kennzahl ist Link auf die gefilterte Liste. Ohne Daten „–“ mit Tooltip „Noch keine Werte“.
- **Karten:** Nächste Ausgabe (Status, „bereit ✓“ bzw. „noch nicht bereit: Brief fehlt“, Empfängerzahl), Diese Woche (Social + Events, max. 5 Zeilen), Nächstes Event (Primär „Anmeldung erfassen“; am Eventtag „Check-in öffnen“). Leer: „Noch keine Ausgabe für Dezember · Ausgabe anlegen“ / „Kein Event geplant · Event anlegen“ (Leitung).
- **Mehr Zahlen** (eingeklappt; Zustand je Benutzer in `localStorage` mit try/catch, ohne Speicher eingeklappt; lazy geladen): Abos je Woche (Balken), Abos nach Quelle (horizontaler Balken, Top 4 + „Sonstige“), Einwilligungen nach Zweck (Balken). Balken wachsen 400 ms `--bo-ease-out` ohne Stagger (03 §8.15); `prefers-reduced-motion` → sofort.
- **„+ Neu ▾“:** Newsletter-Ausgabe · Social-Beitrag · Event (Leitung) · Kampagne · Newsletter-Anmeldung · Einwilligung erfassen · Empfehlungscode.
- Streaming: Zu tun → Kennzahlen → Karten → (lazy) Charts; jede Kachel eigenes `<Suspense>`, Skeleton nach 300 ms (Kennzahl 80 px, Karte 160 px). Fehler kachelweise, Rest bleibt.
- Kürzel: `r` neu laden, `n` öffnet „+ Neu ▾“, ↑/↓ in „Zu tun“, Enter = erster Knopf der Zeile.

### 2.2 `/marketing/newsletter` – Ausgaben (T2, nur Liste)

```
┌ Zentrale › Marketing › Newsletter                                         [+ Neue Ausgabe ▾] ┐
├ [Entwurf 1] [Wartet auf Freigabe 1] [Geplant 0] [Wird versendet 0] [Versendet 9] [Abgebrochen] | Jahr ▾ | 🔍 ┤
│ Ausgabe                                   Versand          Empfänger  Zugestellt/Fehler  Status            │
│ November 2026                             Do 03.12. 18:00  1.248      –                  ● Wartet auf Fr.  │
│   „Was den Winter wohnlich macht“ · PH-NL-2026-011 (muted mono)                                           │
│ Oktober 2026                              06.11. 18:00     1.231      1.229 / 2          ● Versendet       │
├ 11 Ausgaben · [25|50]                                                              [CSV] (Leitung) ┤
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Ausgabe heißt in der Oberfläche „<Monat> <Jahr>“ (aus `slug`), Betreff als zweite Zeile, Nummer `muted` mono und in der Suche (Volltext `titel, betreff, slug`).
- Spalten (5): Ausgabe, `versand_geplant` (relativ ≤ 7 Tage, Tooltip absolut mit Wochentag), `empfaenger_anzahl`, `gesendet`/`fehler`, `status`. Wählbar: Kampagne, Zielgruppe, Freigegeben von, Sprache.
- Sortierung `versand_geplant desc`, Endzustände unten. Filter: Status-Chips (`1–6`), Jahr, Zielgruppe, Kampagne.
- Zeilenmenü (`.`/Rechtsklick): Öffnen, In neuem Tab, Duplizieren als nächste Ausgabe, Versandprotokoll, Abbrechen (Leitung, rot). Shift+Enter = Side-Peek mit Vorschau.
- Keine Massenaktionen außer CSV (Leitung).
- **„+ Neue Ausgabe“** (ein Klick legt an, P16): Kennung = nächster freier Monat (`JJJJ-MM`), Titel „Post aus Lochau · <slug>“, Betreff leer, Zielgruppe „Alle aktiven Abos“, Blockstruktur der letzten Ausgabe **ohne** Inhalte (Standard: Brief, Neue Stücke, Skizze, Termine, Ein Tipp). Öffnet den Editor mit Fokus im Betreff; Toast „Ausgabe Dezember 2026 angelegt · Rückgängig“ (Undo löscht den Entwurf; hier sofort anlegen + Gegenaktion, weil nichts nach außen geht). Split-Menü ▾: „Leer beginnen“, „Kopie der letzten Ausgabe mit Inhalt“. Gibt es den Monat schon → Hinweis „Für Dezember gibt es schon eine Ausgabe · Öffnen“.
- Leer: „Noch keine Ausgabe. Post aus Lochau erscheint einmal im Monat – die erste Ausgabe beginnt mit dem Brief.“ + „Neue Ausgabe“. Filter: „Keine Ausgabe mit Status ‚Geplant‘ 2026.“ + „Filter zurücksetzen“.
- Kürzel: `n` neue Ausgabe, Enter öffnen, Shift+Enter Side-Peek, `x` wählen, `e` CSV (Leitung).

### 2.3 `/marketing/newsletter/[name]` – Ausgabe (T5 mit Block-Editor)

```
┌ Zentrale › Marketing › Newsletter › November 2026                                                         ┐
│ „Was den Winter wohnlich macht“  ● Entwurf  ○─●─○─○  Entwurf          Gespeichert 14:05  (A) Anna   │
│ Bereit ✓ 4 von 4 nötigen Teilen · 1.248 Empfänger ▾        [Testmail…] [⋯]   [ Zur Freigabe ]  ⌘↵    │
├ Inhalt | Empfänger & Versand | Protokoll | Verlauf ──────────────────────────────────────────────────┤
│ ┌ ⋮ Brief ──────────────────────── ✓ dabei ┐   │ VORSCHAU  [Desktop|Mobil] [Hell|Dunkel] [⤢]     │
│ │ Absender [Harald Mayer ▾]                │   │ ┌──────────────────────────┐                    │
│ │ Text  Liebe Leserinnen und Leser, …      │   │ │ PLATZHIRSCH              │  Stand 14:05       │
│ └──────────────────────────────────────────┘   │ │ …                        │                    │
│ ┌ ⋮ Haralds Skizze ─── optional, leer ─────┐   │ └──────────────────────────┘                    │
│ │ ◌ Ohne Bild bleibt der Block weg.        │   │ Betreff · Vorschauzeile                         │
│ │ Bild [Dropzone]  ☑ Eigenes Foto von PH   │   │ [Testmail…] [HTML herunterladen]                │
│ └──────────────────────────────────────────┘   │                                                 │
│ [+ Block ▾]                                     │                                                 │
└─────────────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

**Kopf**
- Titel = Betreff (inline editierbar: Klick → Input, Enter/Blur speichert), Ausgabe-Name im Krümelpfad. Status-Badge (§2.0.4). Phase als kompakter Stepper Entwurf → Wartet auf Freigabe → Geplant → Versendet (Abgebrochen als rotes Band statt Phase).
- **Bereitschaft** als eine Zeile „Bereit ✓ 4 von 4 nötigen Teilen“ bzw. „Noch nicht bereit: Brief fehlt“ (`warning-text`); Klick öffnet Popover mit Regel („Bereit = Brief + ein gefüllter Teil ‚Neue Stücke‘ oder ‚Skizze‘ + mindestens zwei Inhaltsblöcke“) und den Teilen (✓ / „optional, leer“ / fehlt, je mit Sprung zum Block). Clientseitig gespiegelt aus der Website-Regel (`src/lib/kundenbetreuung/newsletter/newsletter.js`: `blockSichtbar`, `versandbereit`, `offeneSlots` – als Kopie mit Quellkommentar in `lib/backoffice/marketing/regeln.js`, keine Laufzeit-Importe aus `src/`), nach jedem Speichern mit den Server-Werten `versandbereit`, `offene_slots` abgeglichen; der Server gewinnt.
- Empfängerzahl aus `vorschau()`; „▾“ springt in den Tab Empfänger & Versand.
- Speicher-Status und **Anwesenheit**: Avatar 24 px „Anna bearbeitet gerade“ (Fundament-Anwesenheit, E8). Der Block, in dem Anna tippt, ist für andere 30 s gesperrt: Rand `accent` gestrichelt, Text „Anna schreibt hier“. **Rückfall ohne Anwesenheit:** `save` mit `modified`; bei Konflikt lädt der Editor den Serverstand und behält lokale Änderungen je Block; betrifft der Konflikt denselben Block, zeigt dieser Block beide Fassungen nebeneinander mit „Annas Fassung übernehmen“ / „Meine behalten“ – kein Diff über Rohdaten.

**Primäraktion je Zustand** (genau eine, ⌘/Strg+Enter)

| Status | Primär | Sichtbar daneben | im `⋯` |
|---|---|---|---|
| Entwurf | Mitarbeiter: **Zur Freigabe** (nur wenn bereit; sonst deaktiviert mit Grund „Noch nicht bereit: Brief fehlt“ und Klickziel „Zum Brief springen“) · Leitung: **Freigeben und planen…** (D1) | Testmail… | Duplizieren, Drucken (HTML), Abbrechen (Leitung, rot) |
| Wartet auf Freigabe | Leitung: **Freigeben…** (D1) · Mitarbeiter: Badge „Wartet auf Freigabe“, kein Knopf | Testmail…, Zurückgeben… (Leitung) | Zurück auf Entwurf (Ersteller) |
| Geplant | Leitung: **Jetzt versenden…** (Bestätigung) | Termin ändern… (Leitung, Datumsdialog mit Sperrtag-Prüfung; Toast „Versand auf Fr 04.12. 18:00 verschoben · Rückgängig“) | Zurück auf Entwurf (Leitung), Abbrechen (Leitung, rot) |
| Wird versendet | – (Fortschritt im Kopf „612 von 1.248 gesendet · 2 Fehler“, Balken 2 px `accent`, Abfrage alle 15 s) | Protokoll | Abbrechen (Leitung, rot: „Offene Empfänger werden übersprungen“) |
| Versendet | **Protokoll** | Duplizieren als nächste Ausgabe | – |
| Abgebrochen | **Duplizieren** | – | – |

- **Bearbeiten in „Wartet auf Freigabe“ oder „Geplant“** (P12, P-M8): die erste Änderung setzt die Ausgabe auf Entwurf zurück, Toast „Zurück auf Entwurf – erneute Freigabe nötig · Rückgängig“ (Undo verwirft die Änderung). Ab „Wird versendet“ ist der Editor schreibgeschützt mit Band „Versendet am 06.11. 18:04 – Inhalt ist eingefroren“.
- Countdown im Kopf bei Geplant: „sendet in 2 Tagen 4 Std.“ – Minutentakt, keine Live-Region, `title` absolut mit Wochentag.
- **Teilfehler nach Versand:** Zeile in der Zustandsleiste `warning-soft` „1.246 zugestellt, 2 fehlgeschlagen – Protokoll ansehen“.

**Tab Inhalt – Block-Editor**
- Blöcke = Kindtabelle `bloecke` (PH Newsletter Block), Reihenfolge `idx`. Karten mit Griff `⋮`; Ziehen mit FLIP 180 ms `--bo-ease-out`, Platzhalter gestrichelt `line-strong`; Zeiger-Alternative ohne Ziehen im Blockmenü: Nach oben · Nach unten · An den Anfang · Duplizieren · Entfernen (Entfernen mit Undo-Toast). Tastatur ⌘/Strg+Shift+↑/↓.
- Blocktypen/Felder: `brief` (absender, text) · `neueStuecke` / `skizze` (titel, text, bild, bild_alt, marke, url, link_label) · `termine` (titel, event oder text, url) · `gutZuWissen` (titel, text, url) · `arbeitsweise` (titel, text) über „+ Block ▾“.
- Block-Badge rechts oben: „✓ dabei“ (grün) / „optional, leer“ (`muted`, Icon `circle-dashed`, **kein** Warnsymbol) / „unvollständig: Bildbeschreibung fehlt“ (`warning-text`, Grund aus `blockSichtbar`). Unvollständige Blöcke sind in der Vorschau ausgeblendet, nicht gelöscht.
- **Bildfeld** (P13): Dropzone (03 §8.20, Kamera am iPad), Vorschau 64 px, Pflicht-Kontrollkästchen **„Eigenes Foto von Platzhirsch“** (Standard an). Aus → Bild wird nicht übernommen, Satz darunter: „Im Newsletter nur eigene Fotos. Herstellerbilder gehen über Social-Beiträge mit Freigabe.“ Keine Auswahl einer verbotenen Bildquelle; Speichern scheitert deshalb nie an der Bildquelle (den Wert `bildquelle = eigen` setzt die Server Action). Zeigt das Foto Kunden oder deren Räume: Kontrollkästchen „Kundenprojekt – Einwilligung Foto-Referenz nötig“ → Link-Suche Einwilligung mit Zweck „Foto-Referenz“ (Feld `PH Newsletter Block.einwilligung` fehlt, U21 → bis dahin Kommentar am Block; der Freigabe-Dialog zeigt den Prüfpunkt).
- Upload-Fehler je Datei in der Dropzone: „Bild ist 31 MB groß – höchstens 25 MB. Tipp: als JPG exportieren.“ / „Format HEIC wird nicht angenommen – bitte JPG oder PNG.“
- **Event-Picker** im Block `termine`: Link-Suche PH Event, nur Offen/Ausgebucht wählbar, andere `aria-disabled` mit „nicht veröffentlicht“.
- Marke: Freitext, Hinweis „nur ‚im Showroom‘, keine Preisangaben“.
- Rich-Text: Absatz, fett, kursiv, Link, Liste; kein Bild, keine Farbe. Zeichenzähler sichtbar ab 1 200 Zeichen („lang für eine Mail“), ohne Live-Region.
- Leer (Ausgabe ohne Blöcke): Karte „Diese Ausgabe hat noch keine Blöcke“ + „Standardblöcke einfügen“.

**Live-Vorschau rechts** (einzige Vorschau; Tab „Vorschau“ und Listen-Drawer entfallen)
- iframe `sandbox` mit `srcdoc` aus `vorschau()`; `title="Mail-Vorschau Ausgabe November 2026, Desktop-Breite"`; keine Live-Region. Neu geladen nach jedem Server-Autosave; dazwischen „Aktualisiert gleich …“ neben „Stand 14:05“ (keine Client-Näherung per DOM-Patch).
- Umschalter Desktop/Mobil (600/360 px skaliert), Hell/Dunkel; `⤢` öffnet Dialog lg 800 px. Darunter: Betreff · Vorschauzeile (automatisch), „Testmail…“, „HTML herunterladen“.
- Fehler: im Rahmen `Fehlerblock` „Vorschau konnte nicht erzeugt werden (Fehler-Nr. …) · Erneut“; Freigeben ist dann gesperrt mit Grund „Ohne Vorschau keine Freigabe“.
- **Testmail…** (Shift+T): Dialog sm 400 px, Feld vorbelegt mit `test_empfaenger`; erlaubt sind nur interne Adressen (Testadresse, Team-Postfach, Benutzer-Adressen, Domains aus Einstellungen). Die Server Action prüft das (U19; Server-Regel P0-11 folgt), Fehlertext „Testmails nur an interne Adressen“. Erfolg: Toast „Testmail an anna@… gesendet“ + Zeitleisten-Eintrag (Quelle für die Prüfliste in D1). Fehler: Knopf zurück in Normalzustand, Toast `fehler` „Testmail konnte nicht gesendet werden – Mail-Dienst antwortet nicht · Erneut versuchen“.

**Tab Empfänger & Versand**
- Zielgruppe als Segment-Schalter: Alle aktiven Abos · Interesse (+ `zielgruppe_interesse`) · Sprache · **Zielgruppe** (Link PH Segment, §2.5) · Testadresse. **Keine** Auswahl nach Anrede oder Geschlecht (R12). Darunter Empfängerzahl (Instrument Sans 2xl 500 tabular) und Satz „Unbestätigte Adressen und alte Adressen ohne Bestätigung sind nie dabei.“
- „Empfänger anzeigen“ → Side-Peek mit Liste (Name, E-Mail, Sprache, Quelle): bei Zielgruppe über `PH Segment.vorschau(speichern=0)`, sonst `getList PH Newsletter Abo` mit denselben Filtern (L2).
- `versand_geplant`: Datum + Uhrzeit nativ, Vorschlag erster Donnerstag 18:00. **Sperrtage sind im Picker nicht wählbar** (`aria-disabled`, Tooltip „Sperrtag: 24.12.“); außerhalb Di–Do `warning`-Satz „Newsletter sind Werbung – empfohlen Di bis Do“ ohne Sperre (P11). Die Server Action lehnt Sperrtage ab, bis der Versand-Scheduler selbst prüft (L24).
- Kampagne (Link), Sprache. Fakten: Versandweg, Freigegeben von/am.

**Tab Protokoll:** PH Newsletter Versand (`ausgabe = name`): E-Mail, Status-Chip (geplant · gesendet · zugestellt · verzögert · vorübergehend unzustellbar · unzustellbar · als Spam gemeldet · abgemeldet · übersprungen · Fehler – aus den Status-Optionen des Datenbestands), `gesendet_am`, `zugestellt_am`, Grund als Satz. Summenzeile. Filter Status. Leer vor Versand: „Das Protokoll entsteht beim Versand.“ CSV (Leitung, protokolliert).

**Tab Verlauf:** `Zeitleiste` (Testmails, Freigaben mit Person, Zurückgaben mit Kommentar, Versand, Abbruch; technische Versionen eingeklappt).

**Laptop-Breiten:** ≥ 1 440 px Editor 640 + Vorschau 360, rechte Spalte als Tab „Bezüge“; 1 280–1 439 px Seitenleiste automatisch eingeklappt (56 px); < 1 280 px Segment „Schreiben | Vorschau“ (Marker gleitet 200 ms `--bo-ease-inout`). Tablet quer wie < 1 280 px; Telefon: lesen + Freigabe (D1 als Bottom-Sheet, §7.2).

**Kürzel:** `1–4` Tabs (außerhalb von Feldern), `e` Betreff bearbeiten, ⌘/Strg+Enter Primär, Shift+T Testmail-Dialog, `p` Drucken, ⌘/Strg+Shift+↑/↓ Block verschieben, Alt+↑/↓ nächste/vorige Ausgabe.

**Zustände:** Laden – Kopf + Tab Inhalt sofort, Blöcke als 3 Karten-Skeletons 120 px, Vorschau nach erstem `vorschau()`. Fehler `invalid` beim Speichern → Fehler am Block, Scroll dorthin (200 ms `--bo-ease-inout`), Fokus ins Feld.

---

### 2.4 `/marketing/empfaenger` – Empfänger (T2, ersetzt „Abos“ und „Einwilligungen“)

Eine Seite, Segment-Schalter **Personen · Einwilligungen** (Segment 03 §8.10, Marker gleitet 200 ms `--bo-ease-inout`, URL `?ansicht=`). Standard „Personen“.

```
┌ Zentrale › Marketing › Empfänger                       [+ Newsletter-Anmeldung] [+ Einwilligung ▾] ┐
│ [ Personen | Einwilligungen ]                                                                      │
├ [Aktiv 1.248] [Unbestätigt 19] [Abgemeldet 203] [Unzustellbar 7] [Als Spam gemeldet 1] | Zweck ▾ | Quelle ▾ | Sprache ▾ | 🔍 Name / E-Mail ┤
│ ☐ Person                        Newsletter        Zwecke                    Quelle     Letzte Zustellung │
│ ☐ Maria Muster                  ● Aktiv           Newsletter · Einladungen  Website    06.11.            │
│     m.muster@example.com (muted)                                                                       │
│ ☐ k.beispiel@example.com        ● Unbestätigt ⚠   –                         Showroom   –                 │
│     seit 52 Std. · Link abgelaufen                                                                      │
│ ☐ a.alt@example.com             ○ Alte Adresse ohne Bestätigung – wird nicht angeschrieben   Import      │
├ 25 von 1.478 · [25|50|100]                                                           [CSV] (Leitung) ┤
└ Auswahl (3): [Bestätigungsmail erneut senden…] [Abmelden…] [Mehr ▾: Interesse · Sprache · Daten löschen (Leitung)]  Esc ┘
```

**Ansicht Personen** (eine Zeile je E-Mail-Adresse; Quelle PH Newsletter Abo + PH Einwilligung + PH Kontakt)
- Spalten (5): Person (Name aus Kontakt oder `anrede_name`, sonst E-Mail; E-Mail als zweite Zeile), Newsletter-Status, Zweck-Chips (max. 2 + „+n“, 03 §8.9), Quelle, letzte Zustellung. Wählbar: Sprache, Interessen, angemeldet am, bestätigt am, Kontakt.
- Keine Maskierung für Marketing-Rollen (E10); Suche auf Name und voller Adresse serverseitig.
- Zeit als Signal: Unbestätigt > 48 h → orange Punkt + Nebenzeile „seit 52 Std. · Link abgelaufen“; Resttage bis automatische Löschung im Tooltip („wird in 12 Tagen gelöscht, wenn nicht bestätigt“, Wert aus `unbestaetigt_loeschen_tage`).
- **Massenaktionen** mit Vorschau (02 §5): **Bestätigungsmail erneut senden…** – möglich nur bei Status Unbestätigt, letzte Bestätigungsmail > 60 min, Versuche < ‹Kanzlei› (K2/R4); Vorschau: „19 ausgewählt – 12 möglich, 7 übersprungen (4 abgemeldet, 2 vor Kurzem gesendet, 1 als Spam gemeldet)“. Abgemeldete, Unzustellbare, Gemeldete und Aktive werden **nie** angeschrieben – die Server Action filtert, bis die Server-Regel P0-6 steht. · **Abmelden…** (Kanal/Grund, Bestätigung) · Mehr: Interesse hinzufügen/entfernen, Sprache setzen, Daten löschen (Leitung, nur zulässige Status). Ausführung als Einzelaufrufe mit Fortschritt im Knopf „12/40“, abbrechbar, Ergebnis-Toast mit „Details“ (Side-Peek mit übersprungenen Zeilen und Grund).
- Zeilenmenü: Öffnen, Kundenakte (wenn Kontakt), Bestätigungsmail erneut senden… (nur wenn zulässig), Abmelden…, Nachweis (PDF), Auskunft (Art. 15).
- Leer: nie Daten „Noch keine Empfänger. Anmeldungen kommen über die Website (mit Bestätigungsmail) oder werden hier am Tresen erfasst.“ + „Newsletter-Anmeldung“; Filter „Keine Personen mit Quelle ‚Event‘ und Status ‚Unzustellbar‘.“ + „Filter zurücksetzen“.
- Kürzel: `n` Newsletter-Anmeldung, Enter Akte, Shift+Enter Side-Peek, `x`/Leertaste wählen, `/` Filter, `e` CSV (Leitung). Keine Einzeltaste für Abmelden oder Mailversand.

**Ansicht Einwilligungen** (Nachweisliste für Prüfungen; PH Einwilligung)
- Spalten (6): Person/E-Mail, Zweck (Klartext), Status, Kanal, Textversion, Zeitpunkt. Wählbar: bestätigt am, widerrufen am, Widerrufs-Kanal, Bezug (Objekt-Chip), Sprache.
- Status-Töne §2.0.4 (Widerrufen grau). Zwecke: alle neun Optionen des Datenbestands (Newsletter, Einladungen, Merkliste-Erinnerung, Planer-Erinnerung, Rückmeldung, Pflege/Nachkauf, WhatsApp, Foto-Referenz, Kundenkarte-Auswertung) – F1, L12 entfällt. Nach P0-1 zusätzlich „Teilnahme an Event (kein Werbezweck)“.
- Massenaktionen: Nachweis drucken (Sammel-PDF ≤ 50), Widerruf erfassen… (Bestätigung, nur Offen/Bestätigt).
- Leer: nie „Noch keine Einwilligungen. Sie entstehen mit jeder bestätigten Website-Anmeldung; Papier- und Showroom-Einwilligungen werden hier erfasst.“; Filter „Keine Einwilligung mit Zweck ‚WhatsApp‘ im Zeitraum.“ + „Filter zurücksetzen“.

#### Personen-Akte `/marketing/empfaenger/[email]` (T5)

```
┌ Zentrale › Marketing › Empfänger › Maria Muster                                                     ┐
│ Maria Muster  m.muster@example.com   ● Newsletter aktiv   Website · de      [Keine Werbung mehr…] [⋯] │
├ Übersicht | Einwilligungen 2 | Zustellungen 9 | Verlauf ─────────────────────────────────────────────┤
│ NEWSLETTER  Angemeldet 01.11. 09:12 → Bestätigungsmail 09:12 → Bestätigt 01.11. 10:40 (Website)      │ BEZÜGE
│ Interessen [Küche ×] [Outdoor ×] [+]   Name für Anrede [Maria Muster]   Sprache [de ▾]              │ Kundenakte Familie Muster
│ EINWILLIGUNGEN  ● Newsletter · Textversion nl-2026-10-29 · bestätigt 01.11.        [Nachweis PDF]    │ Event Adventsabend (angemeldet)
│                 ● Einladungen · Papier · 28.10. · Formular ▣                                          │ Empfehlung EMP-7K3QX9
│ Falsch erfasst? Widerruf mit Grund „Erfassungsfehler“ und neu erfassen.                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Zeigt Abo, alle Einwilligungen, Zustellungen (Newsletter + Kundenreisen), Event-Anmeldungen und Empfehlungen einer Adresse.
- Primär **„Keine Werbung mehr…“** (Shift+W) = Dialog D4 (§4.4). `⋯`: Nur Newsletter abbestellen… · Einwilligung erfassen… · Bestätigungsmail erneut senden… (nur zulässig) · Adresse ändern… (P-M4, gesperrt bis Backend, §11.2 S10) · Nachweis (PDF) · Auskunft (Art. 15) · Daten löschen (Leitung, rot, Tippfeld „löschen“, nur Status Abgemeldet/Unbestätigt/Unzustellbar/Als Spam gemeldet; Fakten „Die Einwilligungs-Einträge bleiben als Nachweis mit Widerruf.“).
- Inline: Interessen (Chips, Klickfläche ≥ 24 × 24 px, iPad 44 px), Name für Anrede, Sprache. Status nie direkt (Tooltip „Status ändert sich nur über Bestätigen oder Abmelden“).
- Nachweisfelder einer Einwilligung mit Schloss-Icon (Tooltip „Nachweisfeld – nicht änderbar“). Korrekturweg als Text in der Akte und in der Hilfe.
- „Technische Angaben“ (eingeklappt, Leitung): Quelle, Idempotenz-Schlüssel, IP-Hash (nur wenn gespeichert).
- Auskunft (Art. 15): Side-Peek mit allen Daten aus `auskunft()` + Event-Zeilen + Reise-Versand; „Als PDF“ über Druckformat „PH Einwilligung Nachweis“; vollständige Auskunft über CRM (`/kunden/[kontakt]/dsgvo`). Eingang einer DSGVO-Anfrage mit Frist: CRM-Vorgang `PH Datenschutz Anfrage` (P1-14, §12) – Link „Anfrage mit Frist anlegen“, gesperrt bis vorhanden.

#### Newsletter-Anmeldung erfassen (Showroom/Telefon)
- **Zielweg (nach L1):** Dialog sm 440 px: E-Mail (Pflicht, Tippfehler-Prüfung: Domain-Vorschlag „gmx.at statt gmx.ar?“), Name für Anrede, Sprache, Interessen, Quelle (Showroom · Telefon · Backoffice). Satz: „Die Kundin bekommt eine Bestätigungsmail. Erst nach dem Klick ist sie angemeldet.“ Primär „Anmelden – Bestätigungsmail senden“. Technik: whitelisted Wrapper `ph_marketing.api.backoffice_anmelden` (Rolle Marketing/CRM) auf `newsletter.anmelden(kanal="backoffice", quelle=…)`. Die frühere Zwischenlösung (`insert` + `doi_erneut_senden`) entfällt (F10: kein Nachweis zum Zeitpunkt der Erklärung).
- **Bis L1 steht** (heute): Dialog zeigt stattdessen **„Am Tablet selbst eintragen“**: QR-Code und Kurzlink auf die Website-Anmeldeseite (`website_url` + Newsletter-Pfad), Text „Die Kundin trägt sich auf ihrem Telefon oder dem Showroom-Tablet ein und bekommt die Bestätigungsmail.“ Damit ist der Nachweis vollständig (Kanal Website, Textversion der Seite). Kein Backoffice-Eintrag für fremde Erklärungen ohne Server-Methode.

#### Einwilligung erfassen (D3, Dialog md 560 px; ersetzt Assistent M5)
```
┌ Einwilligung erfassen ──────────────────────────────────────────────┐
│ Person     [m.muster@example.com      ]  oder Kundenakte [Suche ▾]  │
│ Zweck      [Einladungen zu Abenden ▾]                               │
│ Wie erteilt? ( Telefon | Showroom | E-Mail | Papier )               │
│   → „Die Kundin bekommt eine Bestätigungsmail. Erst nach dem Klick  │
│      gilt die Einwilligung.“                                        │
│   → Papier: [Unterschriebenes Formular hochladen]  (Pflicht)        │
│ Textversion [event-2026-10 ▾]   Bezug [Projekt/Event ▾] (optional)  │
│ ─────────────────────────────────────────────────────────────────── │
│ Wird gespeichert: Einladungen · Papier · Textversion event-2026-10 · │
│ 04.11.2026 10:12 – danach nicht mehr änderbar                        │
│                                   [Abbrechen] [Erfassen mit Formular] │
└─────────────────────────────────────────────────────────────────────┘
```
- Folgesatz unter dem Kanal blendet 160 ms `--bo-ease-out` ein (Höhe + `opacity`). Primär je Kanal: „Erfassen – Bestätigung senden“ bzw. „Erfassen mit Formular“. Papier ohne Datei → Feldfehler „Ohne Formular kein Nachweis“.
- Zwecke Foto-Referenz/WhatsApp: E-Mail optional, Kundenakte (Foto-Referenz) bzw. Telefon (WhatsApp) Pflicht – erst nach P1-7 (`telefon`, `email` nicht Pflicht); bis dahin ist bei diesen Zwecken die E-Mail Pflicht und WhatsApp gesperrt mit Grund.
- Technik heute: **Papier** = `uploadFile` + `insert PH Einwilligung` mit `kanal = papier`, `erteilung_beleg` (Feld vorhanden) → Status Bestätigt mit Beleg. **Alle anderen Kanäle** für Zwecke mit Bestätigungspflicht (Newsletter, Einladungen, Merkliste/Planer-Erinnerung, Rückmeldung, Pflege/Nachkauf) brauchen eine Server-Methode, die die Bestätigungsmail sendet (P0-3) – bis dahin sind diese Kanäle im Segment `aria-disabled` mit Tooltip „Kommt mit dem nächsten Backend-Stand – bis dahin: Formular unterschreiben lassen“. Der Backoffice-Server legt **nie** eine Einwilligung mit `doi_noetig = 0` außer Papier mit Beleg an (R2).

#### Bestätigungsmail erneut senden (einzeln)
Knopf aktiv ab 60 min nach der letzten Mail; unter 48 h Hinweis „Link ist noch gültig (bis Do 10:40)“; Tooltip bei Sperre „zuletzt vor 20 Min. gesendet“. Nur Status Unbestätigt (R4).

---

### 2.5 `/marketing/zielgruppen` – Zielgruppen (T2 + T5, unter „Mehr“; Datenbestand: PH Segment, PH Segment Regel)

- **Liste:** Titel, Zweck (Klartext), Regeln als Satz („Interesse ist Küche UND Kauf in den letzten 365 Tagen“), Treffer · davon anschreibbar · ausgeschlossen (aus `vorschau_*`, „Stand 04.11. 10:12“), Status (Aktiv/Archiviert). Kürzel `n` neu.
- **Akte = Regel-Editor als Sätze:** Kopf „Zweck [Newsletter ▾]“ (bestimmt, welche Einwilligung Pflicht ist – Satz „Es zählen nur Personen mit wirksamer Einwilligung ‚Newsletter‘.“), Verknüpfung als Segment „alle Bedingungen (UND) | eine reicht (ODER)“. Zeilen: Kriterium (Interesse, Sprache, PLZ, Land, Kontaktart, Kontaktstatus, Kundenkarten-Stufe, Kauf in den letzten n Tagen, Kein Kauf seit n Tagen, Umsatz 12 Monate, Umsatz gesamt, Anzahl Käufe, Event, Abo-Quelle) · Operator · Wert (· bis), Schalter „nicht“, „aus“. Native `select`/`input`, Tab-Reihenfolge = Lesereihenfolge, „+ Bedingung“ per Enter im letzten Feld.
- **Vorschau** rechts (`PH Segment.vorschau(speichern=0)` 600 ms nach der letzten Änderung, Abbruch laufender Anfragen): Treffer, anschreibbar, ausgeschlossen mit Gründen („ohne Einwilligung 41 · nicht kontaktieren 3“), Liste der ersten 20 Personen. „Stand speichern“ = `vorschau(speichern=1)`.
- Regeln: Kriterien zu Umsatz und Kundenkarten-Stufe nur für Leitung sichtbar; Kriterium Kundenkarten-Stufe setzt Zweck „Kundenkarte-Auswertung“ bzw. dessen Einwilligung voraus (ph_kundenkarte, §12). Keine Kriterien nach Anrede/Geschlecht (R12). Zielgruppen für Einladungen (Zweck „Einladungen“) sind bis P0-1 **nicht verwendbar** (Hinweis §2.8).
- Leer: „Noch keine Zielgruppe. Eine Zielgruppe wählt Empfänger nach Interessen, Käufen oder Ort – immer nur mit passender Einwilligung.“ + „Zielgruppe anlegen“. Archivieren mit Undo.

---

### 2.6 `/marketing/kundenreisen` – Kundenreisen (T2, unter „Mehr“; Leitung bearbeitet, Mitarbeiter lesend)

```
┌ Zentrale › Marketing › Mehr · Kundenreisen                                   [Reise duplizieren…] ┐
│ Werbung heute: Dienstag – erlaubt · Automatik: aus (Einstellungen)                                 │  Zustandszeile, kein Band
├ [Aktiv 0] [Pausiert 0] [Entwurf 7] | Grundlage ▾ | Werbung ▾ | 🔍                                  ┤
│ Reise                                    Auslöser                   Grundlage                Regeln     Status       │
│ Danke nach dem Kauf                      Lieferung + 1 Tag          Vertrag/Service          ✓          ● Entwurf    │
│ Zufriedenheit und Bewertung              Lieferung + 42 Tage        Einwilligung             ⚠ 1        ● Entwurf    │
│   gesendet 0 · zuletzt – (muted)                                                                                  │
│ Einladung zum Adventsabend               Event − 21 Tage            Bestandskunde · Einw.    ⚠ Kanzlei  ● Entwurf    │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Spalten (5): Reise (+ „gesendet n · zuletzt …“ als zweite Zeile), Auslöser als Satz, Grundlage (Klartext), Regeln (`pruefen()` je Zeile, 60 s gecacht: ✓ oder Zahl mit Tooltip-Liste), Status. Status „Aktiv · wartet auf Automatik“ (orange), solange `automatik_aktiv = 0`, mit Link „Automatik einschalten (Einstellungen)“.
- Primärweg für Neues: **„Reise duplizieren…“** (Zeilenmenü und Kopf; Dialog: Quelle wählen, neuer Titel) → direkt im Regel-Editor. „Leer beginnen“ im Split-Menü öffnet den Assistenten M2 (§4.4).
- Massenaktion: Pausieren (Leitung, verzögerter Commit).
- Leer: 0 Datensätze ist ein **Fehlerzustand** (die App liefert sieben Reisen mit) → `Fehlerblock` „Die mitgelieferten Kundenreisen fehlen. Bitte Administrator informieren.“ + „Melden“. Filter: „Keine aktive Reise mit Grundlage ‚Einwilligung‘.“ + „Filter zurücksetzen“. Mitarbeiter auf Bearbeiten-Route: „Kein Zugriff“ (03 §8.18) mit „Nur die Leitung bearbeitet Kundenreisen. Lesen ist möglich.“

#### Reise-Akte `/marketing/kundenreisen/[reise_id]` – Regel-Editor (T5)

```
┌ Zentrale › Marketing › Kundenreisen › Pflegetipps nach zwei Wochen                                            ┐
│ Pflegetipps nach zwei Wochen   ● Entwurf  Regelprüfung ✓ 0 Fehler        [Testmail…] [⋯]   [ Aktivieren… ]    │
├ Regel | Rechtsgrundlage | Vorlage | Protokoll ────────────────────────────────────────────────────────────────┤
│ Wenn  [Lieferung ▾] des Auftrags  + [14] Tage   dann Mail [Pflegetipps ▾]                    ║ WAS DIESE REISE DARF │
│ [+ weiterer Auslöser]                                                                         ║ Vertrag/Service      │
│ Nur für: ☐ Aufträge mit Outdoor-Position  ☑ Aufträge mit Pflegekategorie                     ║ keine Werbung →      │
│ Häufigkeit: ☑ höchstens einmal je Person   Höchstzahl je Person [–]                           ║ täglich, ohne        │
│ Wer wäre heute dran?  [Trockenlauf]  (gesperrt bis Backend, §11.2 S9)                         ║ Abmeldelink          │
└───────────────────────────────────────────────────────────────────────────────────────────────╨──────────────────────┘
```
- **Tab Regel:** Auslöser-Zeilen (PH Reise Trigger) als Satzbausteine, native `select`/`input`, Felder je Typ: Datum/Jahrestag → Feld + Tage; Jährlich → Tag/Monat-Picker (nie „MM-TT“ sichtbar); Event → Link + „vor/nach“ + Tage; Einwilligung → Zweck-Chips + Tage; Bestätigtes Abo → Tage. Client-Validierung spiegelt `validate`. Auslöser „Lieferung“ meint nach P1-13 die **letzte Zustellung** (Lieferschein) bzw. „Montage abgeschlossen“; bis dahin Hinweis unter dem Feld: „Heute zählt der bestätigte Liefertermin – bei Verschiebung oder Teillieferung kann die Mail zu früh kommen.“ (Fach §6).
- Segmente, „einmalig“, Höchstzahl, Ziel. „Stopp-Regeln“, „Quelle“, „Hinweis“ nur in „Technische Angaben“ (Leitung). Band, wenn keine Auftragsdaten verbunden sind: „Auftragsdaten nicht verbunden – Reisen laufen nur über Einwilligungen und Events“.
- **Tab Rechtsgrundlage:** Schalter „Diese Mail wirbt (Angebot, Einladung, Hinweis auf Neues)“ oben. Drei Karten **Vertrag/Service** · **Bestandskunde, ähnliche Produkte** · **Einwilligung** mit Erklärsatz und Pflichtfeldern (Einwilligung → Zweck; Bestandskunde → Begründung „ähnliche Produkte“). Die Karte **Bestandskunde** ist bis P0-4/P0-5 gesperrt: „Nicht verfügbar: Der Hinweis auf das Werberecht beim Kauf wird noch nicht dokumentiert (Kundenakte).“ (R3). Regelprüfung darunter, live (Client-Spiegel `pruefeReise` aus `rechtsgrundlagen.js`, Server beim Speichern), Texte 1:1 als Sätze.
  **Versandbedingungen zur Laufzeit** als Lesetabelle, je Zeile ein Satz: Person will keinen Kontakt · Fußzeilen ohne Kanzlei-Freigabe · Reklamation offen · Anfrage offen · höchstens n werbliche Mails in 30 Tagen · Widerspruch · Bestandskunden-Einladung ohne Kanzlei-Bestätigung · kein passender Kauf · Kein Werbehinweis beim Kauf dokumentiert · Abgleich mit der Robinson-Liste fehlt · keine Grundlage · **neu (K9, nach P0-5/P1-13):** Auftrag storniert · Retoure offen · keine E-Mail-Adresse.
- **Tab Vorlage:** Vorlage (nur Art Kundenreise), Absender (Berater/Gastgeberin), Vorschau-iframe aus `vorschau()` mit `title`, Testmail… (nur intern), Link „Vorlage bearbeiten“ (Leitung).
- **Tab Protokoll:** PH Reise Versand: Empfänger, Status-Chip, Grundlage, geplant für, gesendet am, Grund als Satz, Bezug-Chip. Kopfzahlen gesendet/übersprungen/zuletzt. Filter Status/Zeitraum. Leer: „Noch kein Versand. Geplant wird täglich um 06:00, gesendet um 09:00 (Werbung nur Di–Do).“
- **Aktionen:** **Aktivieren…** (Leitung; Bestätigung mit Fakten „Werbung: ja · Grundlage Einwilligung · gesendet ab morgen 09:00, wenn die Automatik an ist“; Server prüft Regeln und Kanzlei-Schalter; Fehler als Liste mit Sprung-Links im Kopf) · **Pausieren** (Leitung, verzögerter Commit – damit entfällt das Problem L18) · Fortsetzen · Testmail… · Fällige heute planen… (Leitung, Bestätigung „legt Versand-Einträge für heute an, gesendet wird um 09:00“) · Duplizieren.
- **Freigabe-Rückfall** (U15/K9): Ändert die Leitung bei einer aktiven Reise Werbung, Grundlage, Zweck, Vorlage, Auslöser oder Segmente → nach dem Speichern Band `info`, nicht schließbar bis zur erneuten Aktivierung: „Regel geändert – Reise ist wieder Entwurf und braucht eine neue Freigabe.“ Bis P1-3 setzt die Server Action selbst `aktiv = 0` + Kommentar.
- Kürzel: `1–4` Tabs, Shift+T Testmail-Dialog, ⌘/Strg+Enter Primär, Alt+↑/↓ nächste Reise.

---

### 2.7 `/marketing/kampagnen` – Kampagnen (T2, nur Liste)

```
┌ Zentrale › Marketing › Kampagnen                                              [+ Neue Kampagne] ┐
├ [Entwurf 1] [Aktiv 2] [Pausiert 0] [Beendet 6] | Kanal ▾ | Jahr ▾ | Zuständig ▾ | 🔍                 ┤
│ Kampagne                           Budget / Ausgaben            Anfragen  € je Anfrage  Status        │
│ Küche Bodensee Herbst              ▮▮▮▮▮▮▮░░░ 1.340,50 / 2.000  12        111,71 €      ● Aktiv  [Kennzahl] │
│   Meta · 01.10.–30.11. (muted)                                                                       │
│ Adventsabend 2026                  ░░░░░░░░░░ 0,00 / 300,00      –         –             ● Aktiv  [Kennzahl] │
├ Summe gefiltert: Budget 6.300,00 € · Ausgaben 4.120,30 € · Anfragen 41  (nur Euro; Fremdwährung je eigene Zeile) ┤
└ Auswahl: [Pausieren] [Fortsetzen] [Beenden… (Leitung)] [Bericht drucken (n)] [Zuweisen]                ┘
```
- Spalten (5): Kampagne (+ Kanal · Zeitraum), Budget/Ausgaben als Balkenzelle (rot ab > 100 %), Anfragen (CRM + manuell, Tooltip mit beiden Werten, B6), Kosten je Anfrage, Status. Zeilenknopf **„Kennzahl“** (Shift+K auf der Fokuszeile) öffnet den Kennzahl-Dialog. Wählbar: Kampagnen-Link-Kennung, Ziel (Fortschritt), Zuständig, Klicks, Klickrate (%).
- Summenzeile über die gefilterte Menge, **nur Euro**; Kampagnen mit anderer Währung als eigene Summenzeile je Währung (B5).
- Zeit-Signal: Aktiv mit Zeitraum vorbei → „Zeitraum vorbei – beenden?“; Aktiv ohne Kennzahl seit 14 Tagen → „ruht seit 14 Tagen“.
- Massenaktionen: Pausieren/Fortsetzen (verzögerter Commit), Beenden (Leitung, Bestätigung), Bericht drucken (Sammel-PDF „PH Kampagnenbericht“), Zuweisen.
- Leer: „Noch keine Kampagne. Eine Kampagne bündelt Budget, Kampagnen-Link und Kennzahlen – Anfragen über den Kampagnen-Link werden automatisch zugeordnet.“ Filter: „Keine Kampagne mit Kanal ‚Pinterest‘ 2026.“ + „Filter zurücksetzen“.
- **„+ Neue Kampagne“** = Dialog md 560 px (ersetzt Assistent M6): Titel, Kanal, Zeitraum, Budget (Euro, Währungs-Chip), Ziel (Kennzahl + Wert), Zuständig; Kampagnen-Link wird aus dem Titel vorgeschlagen und ist danach in der Akte änderbar. Primär „Anlegen“ → Akte (Entwurf).

#### Kampagnen-Akte `/marketing/kampagnen/[name]` (T5)
```
│ Küche Bodensee Herbst  ● Aktiv  Meta · 01.10.–30.11.        [Kennzahl erfassen] [⋯]   [ Pausieren ]  │
│ Budget ▮▮▮▮▮▮▮░░░ 1.340,50 € von 2.000,00 € (67 %) · Ziel Anfragen 20 → 12 (60 %) · Stand 14:05        │
├ Übersicht | Kennzahlen 9 | Anfragen 12 | Auswertung ─────────────────────────────────────────────────┤
```
- **Übersicht:** Briefing, Ziel mit Fortschritt (Anfragen/Klicks automatisch; andere Zielkennzahlen „manuell“, L10), Landingpage, **Kampagnen-Link für Anzeigen** (Generator: Landingpage + Quelle/Medium/Kampagne → „Kopieren“; Text „Anfragen über diesen Link werden automatisch zugeordnet“), Zuständig, Währung. Inhalte der Kampagne (Newsletter, Social, Events mit `kampagne = name`) als Karten mit „+ Beitrag zu dieser Kampagne“ – kein eigener Tab.
- **Kennzahlen:** Kindtabelle PH Kampagne Kennzahl als Grid (Datum, Impressionen, Klicks, Kosten €, Anfragen manuell, Notiz) + Sparkline Kosten je Woche. Spalten **Beleg** (Eingangsrechnungs-Chip, nach P1-8) und **Währung** (Chip; ohne Kurs bei Fremdwährung Feldfehler „Kurs fehlt“, nach P1-8). Feldhilfe „Kosten netto eingeben“ (U11). **CSV importieren…**: Datei → Vorschau der gelesenen Zeilen (Parser-Regeln wie `utils/kennzahlen_csv.lesen`, im Client gespiegelt, bis ein whitelisted Import existiert) → „n Zeilen übernehmen“ → Einzelaufrufe `kennzahl_erfassen`, Fortschritt im Knopf.
- **Kennzahl-Dialog** (sm 400 px): Datum (heute), Impressionen, Klicks, Kosten (Euro mit Komma → Cent), Anfragen manuell (Hinweis „nur Anfragen ohne Kampagnen-Link“), Notiz. Enter speichert, Aggregate aktualisieren ohne Neuladen. Budgetüberschreitung: Zustandszeile rot „Ausgaben übersteigen das Budget“.
- **Anfragen:** PH Anfrage mit `ph_marketing_kampagne = name` und Kontaktpunkte (PH Kampagne Kontaktpunkt: Anfrage, Newsletter-Anmeldung, Event-Anmeldung, Termin, Bestellung). Zählung läuft bei jedem Öffnen der Akte (`anfragen_zaehlen`); ein täglicher Lauf über `kampagnen.alle_aktualisieren` ist im Datenbestand vorhanden, aber nicht in `hooks.py` eingeplant (Anfrage A11) – **kein Knopf „Anfragen zählen“**; „Stand 14:05“ neben der Zahl.
- **Auswertung:** Karten **Kosten belegt (netto)** (Summe zugeordneter Eingangsrechnungen, nach P1-8) vs. **Kosten gemeldet** (Kennzahlen); Abweichung > 0 → Zeile `warning` „Kosten aus Kennzahlen weichen von Eingangsrechnungen ab“. Impressionen/Klicks/Klickrate, Anfragen/gewonnen, Kosten je Anfrage, **Umsatz netto nach Gutschriften** (nur Leitung/GF, aus Bericht Kampagnen-ROI nach P1-10; bis dahin Karte „Umsatz: Bericht wird auf netto umgestellt“ ohne Zahl). Zuordnungsmodell aus Einstellungen (`attribution_modell`: letzter/erster Kontakt/linear) als Satz. Fazit (Rich-Text). „Kampagnenbericht (PDF)“.
- Workflow-Knöpfe: Aktivieren (Leitung, braucht Zeitraum-Beginn) · Pausieren/Fortsetzen (verzögerter Commit) · Beenden… (Leitung, Bestätigung: „Kampagne beenden? Kennzahlen bleiben erfassbar.“ + Satz zur Nachlaufzeit aus `kampagne_nachlauf_tage`: „Anfragen werden noch {n} Tage nach Zeitraumende zugeordnet.“ – Verhalten im Bau gegen `attribution.kampagne_waehlen` testen, L21) · aus Beendet: **„Wieder aktivieren“** (Leitung).
- Kürzel: `1–4` Tabs, Shift+K Kennzahl-Dialog, ⌘/Strg+Enter Primär, `p` Bericht drucken.

---

### 2.8 `/marketing/events` – Events (T2, nur Liste)

```
┌ Zentrale › Marketing › Events                                                    [+ Neues Event] (Leitung) ┐
├ [Geplant 1] [Offen 1] [Ausgebucht 0] [Durchgeführt 3] [Abgesagt] | Art ▾ | Jahr ▾ | 🔍                       ┤
│ 26   Adventsabend im Showroom             ▮▮▮▮▮▮▮▮░░ 46 / 60 Personen · Warteliste 0      ● Offen          │
│ NOV  Do 18:00 · Erinnerung 24.11. 08:00 (muted)                                                             │
│ 12   Frühjahrsabend Outdoor               – / –                                           ● Geplant ⚠ Uhrzeit offen │
│ MÄR                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Zeile: Datum groß links (Tag 20 px, Monat 11 px Versalien `muted`), Titel + Uhrzeit/Erinnerung, Plätze-Balken, Status. Wählbar: Ort, Website-Link, Kampagne, Löschfrist.
- Zeit-Signal: Geplant ohne Uhrzeit → orange Chip „Uhrzeit offen“; Event heute → Karte oben mit „Check-in öffnen“.
- Leer: „Noch kein Event. Der Adventsabend wird mit der App angelegt (Status Geplant).“ Filter: „Kein Event 2027.“ + „Filter zurücksetzen“.
- Kürzel: `n` neu (Leitung), Shift+A Anmeldung erfassen (Fokuszeile), Enter öffnen.
- **„+ Neues Event“** = Dialog lg 800 px mit drei Abschnitten statt Assistent M3: Eckdaten (Art, Titel, Datum, Uhrzeit optional, Ort, Plätze, Warteliste, max. Personen je Anmeldung, automatisch nachrücken) · Mails (Bestätigung, Erinnerung, Nachrück-, Absage-Vorlage; Erinnerung n Tage vorher) · Datenschutz (Textversion, Foto-Hinweis, Löschfrist). Fuß: „Anlegen – bleibt ‚Geplant‘, bis die Uhrzeit bestätigt ist“. **Kostenbeitrag gibt es nicht** (P-M7): Schalter „kostenlos“ fest an mit Satz „Events mit Kostenbeitrag kommen später (Zahlung und Beleg fehlen noch).“

#### Event-Akte `/marketing/events/[event_id]` (T5, 4 Tabs)
```
┌ Zentrale › Marketing › Events › Adventsabend im Showroom                                                      ┐
│ Adventsabend im Showroom  Do 26.11. · 18:00–21:00 · Showroom und Café  ● Offen   [⋯]   [ Anmeldung erfassen ] │
│ ▮▮▮▮▮▮▮▮░░ 46 von 60 · frei 14 · Warteliste 0 · Erinnerung geht 24.11. 08:00                                  │
├ Anmeldungen 31 | Eckdaten | Mails | Verlauf ────────────────────────────────────────────────────────────────────┤
│ [angemeldet 29] [warteliste 0] [abgesagt 2] [da 0] 🔍 Name                                                    │
│ Familie Muster      2   website  01.11.  Bestätigung ✓  ● angemeldet                      [⋯]               │
│   m.muster@… · +43 … · „vegetarisch“ (muted)                                                                 │
│ Herr Huber          1   telefon  03.11.  keine E-Mail   ● angemeldet                      [⋯]               │
│ Summe: 31 Anmeldungen · 46 Personen                                                                           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
**Primäraktion je Status:** Geplant → **Veröffentlichen…** (Leitung, nur mit Uhrzeit; sonst deaktiviert „Zuerst Uhrzeit eintragen“; Bestätigung „Event auf der Website zur Anmeldung öffnen?“) · Offen/Ausgebucht → **Anmeldung erfassen** · am Eventtag → **Check-in öffnen** (Kiosk §7.1) · nach dem Tag → **Teilnehmerliste** (der Scheduler schließt das Event am Folgetag 08:00 auf „Durchgeführt“; kein Knopf „Als durchgeführt“, E12).

**`⋯`:** Erinnerung senden… (eine Aktion: „Erinnerung an 29 Personen senden, die noch keine bekommen haben?“ + Kontrollkästchen „Auch an 2 bereits Erinnerte“) · Als ausgebucht markieren (verzögerter Commit) · Wieder öffnen (Leitung) · **Verschieben…** (Leitung; neues Datum/Uhrzeit, Fakten „Anmeldungen bleiben, 31 Personen werden informiert“; Mail-Vorlage `event_verschoben` und Methode fehlen → gesperrt bis P1-5, §11.2) · **Absagen und informieren…** (Leitung, rot, Fokus Abbrechen; Fakten „29 Personen werden per Mail informiert, 2 ohne E-Mail – Telefonliste drucken“; Grund Pflicht; Technik Workflow „Absagen“ + `events.absage_an_teilnehmer` über Wrapper, bis dahin Teil „informieren“ gesperrt und Text „Bitte Teilnehmerliste drucken und informieren“) · Einladung an Zielgruppe… (siehe unten) · Duplizieren für nächstes Jahr · Teilnehmerliste drucken (`p`) · Namensschilder drucken.

**Tab Anmeldungen:** Kindtabelle PH Event Anmeldung, Status-Chips, Suche Name/E-Mail/Telefon. Zeilenmenü: Status setzen (bestätigt · abgesagt · da · nicht erschienen → `teilnehmer_status`), Personen ändern… (Kapazitätsprüfung; Methode `personen_aendern` fehlt → bis P1-5 gesperrt), Kundenakte, Nachweis öffnen, Notiz. Abgesagte Zeilen mit Badge „Abgesagt“ (Text) und Kontrast ≥ 4,5:1 (`text-soft`), nicht nur durchgestrichen.
- **Warteliste** als eigener Abschnitt; je Zeile **„Nachrücken…“** (Shift+N) → Bestätigung „Maria Muster (2 Personen) bekommt einen Platz und die Mail ‚Platz frei geworden‘.“ Technik: `events.nachruecken` über whitelisted Wrapper (Daten und Vorlage `nachrueck_vorlage` vorhanden; §11.2 S5). Ist „automatisch nachrücken“ (`nachruecken_automatisch`) an, steht über der Liste „Rückt automatisch nach, sobald Plätze frei werden“ und der Knopf entfällt.
- **„Anmeldung erfassen“** (D5, Dialog md 560 px; iPhone als Vollbild-Sheet): Person/Kontakt-Suche (vorbefüllt aus Kundenakte), Name, E-Mail, Telefon, Personen (Stepper 1 … `max_personen_je_anmeldung`), Quelle (Telefon · Showroom · E-Mail · Backoffice), Nachricht. Schalter **„Einladungen zu künftigen Abenden: Gast hat ausdrücklich ja gesagt“** (Standard aus; an → Satz „Wir senden dafür eine eigene Bestätigungsmail.“) – erst nach P0-1/P0-2 wirksam; bis dahin ausgeblendet **und** Satz unter dem E-Mail-Feld „Die Anmeldung gilt nur für diesen Abend.“ E-Mail optional, wenn Telefon gesetzt (nach P1-6/L23; bis dahin Pflicht mit Hinweis „Ohne E-Mail: bitte Gast am Abend über ‚+ Gast ohne Anmeldung‘ zählen“). Ergebnis-Toast: „Angemeldet – Bestätigung geht an h…@…“ / „Angemeldet – keine Bestätigungsmail (keine E-Mail-Adresse)“ / „Auf Warteliste gesetzt“. Schon angemeldet → Hinweis „Diese Adresse ist schon angemeldet (2 Personen) · Personen ändern“. Voll ohne Warteliste → Feldfehler „Das Event ist ausgebucht“ + Vorschlag „Warteliste in Eckdaten erlauben“ (Leitung).
- **Einladung an Zielgruppe…** (Leitung): Datenbestand hat `einladungen_senden(trockenlauf)` mit Zielgruppe und Kontingent. **Gesperrt bis P0-1**, weil heute jede Event-Anmeldung eine Einwilligung „Einladungen“ erzeugt und diese Einträge als Werbegrundlage zählen würden (R1). Tooltip: „Gesperrt: Einladungs-Einwilligungen aus früheren Anmeldungen müssen erst bereinigt werden.“ Nach P0-1: Dialog mit Trockenlauf-Ergebnis („98 Personen mit Einwilligung, 12 bereits angemeldet“) → Freigabe-Muster (Mitarbeiter „Zur Freigabe“, Leitung „Freigeben und senden“).

**Tab Eckdaten:** Titel, Art, Datum, Uhrzeit von/bis, Ort, Website-Link, Plätze (leer = unbegrenzt, Hinweis „nur echte Angabe“), Warteliste, max. Personen je Anmeldung, automatisch nachrücken, Einladungs-Kontingent bis, Programm (Rich-Text, Hilfe „nur fest Zugesagtes“), interne Beschreibung, Kampagne. Zustandszeile bei Geplant: „Uhrzeit, Programm, Plätze erst nach Bestätigung des Inhabers eintragen“. **Abschnitt Datenschutz:** Textversion, Foto-Hinweis (Aushang), Löschfrist (Standard aus Einstellungen), geplantes Löschdatum, gelöscht am; Satz (K5) „Event-Nachweise: Zweck Teilnahme, gelöscht mit den Anmeldedaten am 26.02.2027“ – nach R6/P1-2; bis dahin ehrlich „Nachweis-Einträge der Anmeldungen bleiben vorerst erhalten (Bereinigung folgt)“.

**Tab Mails:** Bestätigungs-, Erinnerungs-, Nachrück-, Absage-, Einladungsvorlage (Link PH Mail Vorlage Art Event, Vorschau-Knopf), Erinnerung n Tage vorher, berechneter Termin, gesendet am.

**Kürzel:** Shift+A Anmeldung erfassen, Shift+N Nachrücken (Warteliste-Zeile), `p` Teilnehmerliste, `1–4` Tabs, ⌘/Strg+Enter Primär, Alt+↑/↓ nächstes Event.

---

### 2.9 `/marketing/social` – Social-Beiträge (T4 Kalender Standard, `?ansicht=kanban` T3, `?ansicht=liste` T2)

```
┌ Zentrale › Marketing › Social                              [+ Neuer Beitrag]   Kalender | Kanban | Liste ┐
│ KW 46 · 9.–15. November 2026   ‹ heute ›   [Woche|Monat|Tag]  [Pinterest ✓] [Instagram ✓] [LinkedIn] … | Zuständig ▾ │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│ Mo 9.  + │ Di 10. + │ Mi 11. + │ Do 12. + │ Fr 13. + │ Sa 14. + │ So 15. + │   „+“ am iPad/Telefon immer sichtbar,
│          │ ┌──────┐ │          │ ┌──────┐ │          │          │          │   am Desktop bei Hover UND Fokus
│          │ │▣ Pin │ │          │ ┌╌╌╌╌╌╌┐ │          │          │          │
│          │ │Boden-│ │          │ ╎▣ Post╎ │          │          │          │   gestrichelt = wartet auf Freigabe
│          │ │●Gepl.│ │          │ ╎wartet╎ │          │          │          │
│          │ └──────┘ │          │ └╌╌╌╌╌╌┘ │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```
- **Kalender** (Fundament-Komponente `Kalender`, Quelle Social + Events als Hintergrund-Chips): Karte mit Thumbnail 48 px, Kanal-Icon, Format, Titel, Status-Punkt, Bildrechte-Chip; Mindesthöhe 44 px am iPad. `role="grid"`, ←/→/↑/↓ zwischen Tagen, Enter in leerer Zelle = neuer Beitrag am Tag (Titel tippen, Enter legt an – Status Idee, Datum = Zelle), `t` heute, `w/m/d` Woche/Monat/Tag, `m` auf Karte = „Verschieben nach…“ (Datumsauswahl).
- **Ziehen oder „Datum setzen…“** setzt nur `datum_geplant` – für jeden Status (P14, E6). Ist der Beitrag freigegeben, löst die Server Action danach den Übergang „Planen“ aus. Karte zeigt ihren Zustand („10.11. · wartet auf Freigabe“, Rahmen gestrichelt `line-strong`). Ablage 200 ms `cubic-bezier(0.2,0,0,1)` (05 §15); fehlgeschlagen gleitet die Karte 200 ms zurück + Toast `fehler` mit Grund. Datumsänderung mit Undo (verzögerter Commit).
- **Keine Ideenleiste** (F5: Datum ist Pflicht), bis P1-12 das Datum im Status Idee freigibt; danach Leiste „Ohne Datum (Ideen)“ unter dem Raster.
- iPad hoch (640–1 023 px): Standard **3-Tage-Ansicht** mit Wischen, Woche per Umschalter. Telefon: Tagesliste mit Datum-Wischen; Foto per Kamera (`capture`); Hauptnutzen „Idee anlegen, Foto anhängen“.
- **Kanban** (einziges Kanban des Bereichs): Idee · Entwurf · Wartet auf Freigabe · Freigegeben · Geplant · Veröffentlicht (Verworfen per Filter). Gesperrte Ziele: Spalte halbtransparent 0.5, Tooltip/Menügrund („Freigegeben – Bildrechte offen“, `aria-disabled`); `m` = Verschieben-Menü mit denselben Gründen. Ablage 200 ms wie oben.
- **Liste:** Beitrag (+ Kanal · Format), Datum, Bildrechte, Zuständig, Status; wählbar Kampagne, Reichweite, Saves, Klicks. Massenaktionen: Zuweisen, Kampagne setzen, Um n Tage verschieben (Vorschau), Verwerfen (verzögerter Commit).
- Leer (Woche): „Keine Beiträge in dieser Woche.“ + „Beitrag planen“; Filter: „Keine Beiträge für LinkedIn in dieser Woche.“ + „Filter zurücksetzen“.

#### Beitrags-Akte `/marketing/social/[name]` (T5, zweispaltig mit Vorschau im Kanal-Format)
```
│ „Bodensee-Küche in Eiche“  Pinterest · Pin · Board bodensee  ● Entwurf     [Text kopieren] [⋯]  [ Zur Freigabe ] │
│ Bildrechte ✓ eigen · Kundenprojekt: nein · Kennzeichnung: nicht nötig · Bildbeschreibung ✓ · 10.11. 10:00       │
├ Beitrag | Bild & Bildrechte | Veröffentlichung | Verlauf ──────────────────────────────────────────────────────┤
```
- **Tab Beitrag:** Titel, Dachzeile, Text (Zähler Pinterest 500 / Instagram 2 200, beim Überschreiten einmal `aria-live="polite"`), Hashtags, Ziel-Link, Sprache, Bildbeschreibung (Pflicht), Kanal/Format (Pinterest nur Pin/Board/Video – unzulässige Formate nicht wählbar), Board (Vorschläge bodensee, chalet, pool-spa, kueche, outdoor, yacht, hotel, ski), Kampagne, Zuständig, Produkt (Link-Suche Website-Slugs aus PH Produkt). Autosave §2.0.8.
- **Tab Bild & Bildrechte:** Upload (Dropzone/Kamera, Format-Rahmen 2:3 / 4:5 / 9:16), Bildaufteilung, **Bildquelle als drei Karten** (offen · eigen · Hersteller freigegeben) mit Folgen-Text; bei Hersteller: Marke, Link-Suche Freigabe (PH Marke, ph_sortiment), „Bild-Freigabe prüfen“ → Chip („schriftlich erteilt“ grün / „keine Marke verknüpft“ orange / „Markenverwaltung nicht erreichbar“ grau), Bildnachweis Pflicht, Bearbeitung. Gesperrte Marken → Feldtext. Bei „eigen“ setzt die UI den Bildnachweis „Platzhirsch Home Living“.
  **Dreiteilige Bildrechte-Prüfung** (K10, R10, R11): ① Bildquelle ✓ · ② **Kundenprojekt** – „Zeigt das Bild Personen oder Räume von Kunden?“ ja → Einwilligung „Foto-Referenz“ verknüpfen (Feld `einwilligung`, P1-12; bis dahin Pflicht-Kommentar mit Link auf die Einwilligung) · ③ **Kennzeichnung** – „Kooperation oder bezahlt?“ (nein · Kooperation Hersteller · bezahlt; Feld `kommerziell`, P1-12) → bei ≠ nein muss der Text „Anzeige“ bzw. „Werbung“ enthalten, sonst Freigabe gesperrt mit Grund. Bis zum Feld wird ③ im Freigabe-Dialog als Pflicht-Kontrollkästchen abgefragt und als Kommentar gespeichert.
- **Tab Veröffentlichung:** Plandatum/Uhrzeit (inline), **„Als veröffentlicht markieren…“** (Dialog sm: URL des Beitrags, Pflicht), veröffentlicht am/URL, Kennzahlen erfassen… (Reichweite, Likes, Saves, Klicks, Kommentare; Stand), Notiz. Kein direktes Posten: „Text kopieren“ (Shift+C; Titel + Text + Hashtags), „Bild herunterladen“.
- **Freigabe (P4, ein Muster):** Mitarbeiter **„Zur Freigabe“** (nur wenn Bild, Bildbeschreibung und alle drei Prüfungen grün; verzögerter Commit) → Badge „Wartet auf Freigabe“ (orange) → genau **eine** Glockenzeile für die Leitung nach dem Commit → Leitung **„Freigeben“** (Dialog D2 mit Bild, Text, drei Prüfungen; Enter) oder **„Zurückgeben…“** (Pflicht-Kommentar → Zeitleiste + Aufgabe an Ersteller). Technik bis L22 (Status „Freigabe“ im Workflow fehlt): Kommentar „Zur Freigabe gegeben“ + ToDo an die Leitung (`reference_type = PH Social Beitrag`); Badge aus offenem ToDo abgeleitet; keine 24-h-Regel.
- **Primär je Status:** Idee → Ausarbeiten · Entwurf → Zur Freigabe (Mitarbeiter) / Freigeben… (Leitung) · Wartet auf Freigabe → Freigeben… (Leitung) · Freigegeben → Datum setzen… (ohne Datum) bzw. automatisch Geplant · Geplant → Als veröffentlicht markieren… · Veröffentlicht → Kennzahlen erfassen…
- Verwerfen (Idee/Entwurf): verzögerter Commit in allen Rollen (P5) – kein Server-Rückweg nötig.
- Kürzel: `1–4` Tabs, Shift+C Text kopieren, ⌘/Strg+Enter Primär, Alt+↑/↓ nächster Beitrag. Kein `f`, kein `c` als Einzeltaste.

---

### 2.10 `/marketing/empfehlungen` – Empfehlungen „Unter Freunden“ (T2, unter „Mehr“)

```
┌ Zentrale › Marketing › Mehr · Empfehlungen                                     [+ Empfehlungscode] ┐
├ [Code ausgegeben 5] [Anfrage eingegangen 2] [Auftrag erteilt 1] [Gutschein fällig 1] [Ausgegeben 7] [Verfallen] [Abgelehnt] | 🔍 ┤
│ Empfehlung                       Empfohlene Person   Auftrag                         Status              │
│ Maria Muster · EMP-7K3QX9        Peter Beispiel      AB-2026-0031 ● Geliefert         ● Gutschein fällig  │
│   Code gesendet 12.10. (muted)                       offen 0,00 € · zugestellt 28.10.                     │
│ Hans Huber · EMP-2B8MN4          –                   –                               ● Code ausgegeben   │
│   ⚠ Code nicht gesendet                                                                                 │
└ Auswahl: [Code senden (n)] [Ablehnen…]                                                                  ┘
```
- Spalten (4): Empfehlung (Empfehler · Code; Nebenzeile Code-Versand), Empfohlene Person, Auftrag (AB-Chip mit Status + Nebenzeile „offen … · zugestellt …“), Status. „Gutschein fällig“ oben einsortiert.
- Massenaktionen: Code senden (nur ohne Versanddatum; verzögerter Commit je Zeile), Ablehnen… (Grund, Bestätigung).
- Leer: „Noch keine Empfehlung. Ein Code entsteht, wenn eine Kundin mit eigenem Auftrag ihn anfordert.“ Filter: „Keine Empfehlung mit Status ‚Verfallen‘.“ + „Filter zurücksetzen“. Reiter „Gutschein fällig“ leer: „Kein Gutschein fällig. Fällig wird er automatisch, wenn der empfohlene Auftrag geliefert und bezahlt ist und keine Rücktrittsfrist mehr läuft.“
- **„+ Empfehlungscode“** (Dialog md, ersetzt Assistent M7): Empfehler (Kontakt-Suche, E-Mail), eigener Auftrag (AB-Suche, Pflicht-Nachweis), Vorschau der Mail. Primär „Anlegen und Code senden“ (verzögerter Commit für den Versand).

#### Empfehlungs-Akte `/marketing/empfehlungen/[code]` (eine Seite mit Schrittleiste)
```
│ EMP-7K3QX9 · Maria Muster   ● Gutschein fällig                         [⋯: Code senden · Ablehnen…] [ Gutschein… ] │
│ Code ausgegeben ─● Anfrage ─● Auftrag erteilt ─● Geliefert und bezahlt ─● Gutschein fällig ─○ Gutschein ausgegeben    │
│ Empfehlende Person: Name, E-Mail, Kundenakte, eigener Auftrag · Unternehmer? ☐ (Hinweis unten)                     │
│ Empfohlene Person: Name, E-Mail, Zustimmung zur Zuordnung ✓ 20.10. 14:02, Anfrage → CRM                            │
│ Auftrag: [AB-2026-0031 ▾] ● Geliefert · offen 0,00 € · letzte Zustellung 28.10. · Vertragsart Showroom             │
│ Gutschein fällig, wenn geliefert, bezahlt und keine Rücktrittsfrist mehr läuft.                                    │
```
- Schrittleiste mit neuem Schritt **„Geliefert und bezahlt“** (K6). Auftragsfeld als Link-Suche PH Auftragsbestaetigung mit Status-Chip (Offen/Teilgeliefert/Geliefert/Storniert) und Fakten „offen 0,00 €“, „letzte Zustellung 28.10.“, Vertragsart. Heute ist `auftrag` ein Textfeld: die UI sucht und schreibt die Nummer; die Fakten liest die Server Action über die AB-Nummer (`getList PH Auftragsbestaetigung`, Lieferscheine `zugestellt_am`). Zuordnung nur mit Zustimmung der empfohlenen Person (Server-Feldfehler „Ohne Zustimmung der empfohlenen Person keine Zuordnung“).
- **Fälligkeit (R8):** „Gutschein fällig“ setzt der Scheduler heute **ab Auftragsdatum + Tage** – das ist zu früh. Bis P0-8 zeigt die Akte die Prüfampeln **Storno · Lieferung · Zahlung · Frist** selbst (aus AB, Lieferschein, `offen_cent`) und sperrt „Gutschein…“, solange eine Ampel nicht grün ist („Gesperrt: Auftrag noch nicht vollständig geliefert“).
- **Storno:** AB storniert → rotes Band „Auftrag storniert – Empfehlung abgelehnt“ (nach P-M9 automatisch; bis dahin Band + Knopf „Ablehnen…“ mit Grund „Auftrag storniert“ vorbelegt). Bereits ausgegebener Gutschein → Aufgabe an Leitung „Gutschein PH-GS-… sperren?“ mit Link in den Shop.
- **Unternehmer-Empfehler** (B2): Häkchen „Empfehler ist Unternehmer (Architekt, Planerin …)“ + UID → Hinweis „Bei Unternehmern Provisionsgutschrift über Faktura statt Gutschein“; „Gutschein…“ wird zu „Gutschrift anlegen…“ (Aufgabe an Faktura). Felder fehlen (P0-8) → bis dahin Hinweis + Kommentar.
- **„Gutschein…“** = Dialog D6 (§4.4), gesperrt bis P0-8/P0-9/L25 (E5).
- Rechte Spalte: Kundenakten beider Personen, Anfrage, Auftrag, Gutschein (nach `PH Empfehlung.gutschein` als Link; bis dahin Text „…-1234“).
- Verfallen: kein Prozess setzt heute „Verfallen“ (F2) → Anzeige nur, wenn gesetzt; Laufzeit des Codes `‹Inhaber/Kanzlei›` (R9).

### 2.11 `/marketing/vorlagen` – Mail-Vorlagen (T9, unter „Mehr“, nur Leitung)
- Liste links 240 px, gruppiert nach Art (System · Newsletter · Event · Kundenreise): Kennung, Betreff, Sprache, Stand. Rechts Editor: Betreff (Platzhalter erlaubt), Vorschauzeile, Art, Sprache, Fußzeile (Klartext „mit Abmeldelink“ / „ohne Abmeldelink (Service)“), Code-Editor (Monospace, Zeilennummern, Hervorhebung der Platzhalter), Vorschau-iframe (`vorschau()`, `title`), Platzhalter als Chip-Liste zum Einfügen.
- Regeln: werbliche Fußzeilen brauchen Abmeldelink; System-Vorlagen tragen Band „Diese Vorlage wird von Website-Abläufen (Bestätigung, Event) verwendet“. Mitarbeiter haben laut Datenbestand Schreibrecht (F8) – die Seite ist nur für Leitung, die Server Action prüft die Rolle; Server-Rechte P1-9.
- Aktionen: Speichern (Autosave), Duplizieren, Verlauf. Testmail direkt aus der Vorlage fehlt (L14) → Hinweis „Testmail über eine Reise oder Ausgabe, die diese Vorlage nutzt“ mit Links.
- Leer: nicht erreichbar (14 Vorlagen werden installiert) → 0 = `Fehlerblock` wie bei Kundenreisen.

### 2.12 `/marketing/einblicke` – Besucher-Einblicke (T8, unter „Mehr“)
- Filter Zeitraum (Standard 30 Tage). Tabelle „Top-Seiten“: Seite, Besuche, Tage mit Daten, Scrolltiefe Ø, Ziele (Termin/Anfrage); Balken Top 12. Kennzahlen „Tage empfangen“, „Besuche (Top-Seiten)“. Empfangsstatus je Tag als Kalender-Heat (60 Tage, Sequenzpalette 03 §1.6; grau = kein Datensatz).
- Satz im Hilfe-Panel: „Kein Tracking-Pixel, keine Öffnungsraten. Die Website sendet täglich eine Zusammenfassung ohne Personenbezug.“
- Leer: „Noch keine Einblicke. Die Website sendet nach ihrer Umstellung jeden Tag eine Zusammenfassung ohne Personenbezug.“

### 2.13 `/marketing/berichte/[report]` – Berichte (T8, unter „Mehr“)
- PH Newsletter-Entwicklung · **PH Kampagnen-ROI** (Leitung/GF) · PH Einwilligungen nach Zweck · PH Event-Auslastung · PH Social Redaktionsplan · PH Top-Seiten. Jeder Bericht: Filterzeile (URL), Tabelle ohne Paging, Chart aus der Report-Definition (Balken, nie Donut > 5 Anteile), CSV, Druck.
- **Kampagnen-ROI** (B4, K13): Spalten Budget, Kosten belegt (netto), Kosten gemeldet, Klicks, Anfragen, Gewonnen, **Auftragswert netto**, **abgerechnet netto**, **bezahlt**, Umsatz netto nach Gutschriften, ROI. Tabellenfuß: „Umsatz netto, ohne stornierte und gutgeschriebene Beträge.“ Fremdwährung als eigene Summenzeile je Währung. Bis P1-10 zeigt der Bericht oben `info`: „Dieser Bericht rechnet noch mit Bruttowerten ohne Gutschriften – Zahlen nur als Richtwert.“ und blendet die ROI-Spalte aus (keine irreführende Kennzahl).

### 2.14 `/marketing/einstellungen` – Einstellungen (T9, unter „Mehr“, nur Leitung)

```
│ Kundenreisen-Automatik ○ aus · Fußzeilen (Kanzlei) ○ offen · Bestandskunden-Einladung (Kanzlei) ○ offen ·        │
│ Robinson-Abgleich gültig bis – · Versand über das System · Versanddienst-Vertrag (AVV) – · Aufbewahrung ○ offen  │
│ Bereitschaft für Livebetrieb: 7 offene Punkte ▾                                                                  │
├ Allgemein | Bestätigung und Versand | Auftragsdaten | Empfehlungen und Events ──────────────────────────────────┤
```
- **Zustandsleiste** mit Ampeln (Icon mit Form + Text): Automatik, Kanzlei-Fußzeilen, Kanzlei-Bestandskunden-Einladung, Robinson-Abgleich, Versandweg, **Versanddienst-Vertrag (AVV) + Transfergrundlage** (R7, Felder nach P1-1), **Aufbewahrung festgelegt** (R6, nach P1-1).
- **Bereitschaft** (K11): Popover mit offenen Punkten aus §11.1 (P0) und Kanzlei-Fragen, je mit Status. Berechnet im Backoffice-Server (`faehigkeiten.js` + Einstellungen), bis es eine Server-Methode `bereitschaft()` gibt.
- **Schalter mit Außenwirkung** (Automatik, Kanzlei-Schalter, Versandweg): Bestätigung mit Folgesatz, danach **sofort gespeichert** (Toast „Kanzlei-Freigabe Fußzeilen eingetragen“), Zeitleisten-Eintrag mit Person. „Automatik einschalten“ ist gesperrt, solange P0 offen ist („Gesperrt: 7 Punkte vor Livebetrieb offen · Details“). Versandweg „Mail-Dienst“ nur wählbar mit AVV-Datum und Transfergrundlage (nach P1-1; bis dahin mit Hinweis statt Sperre).
- Übrige Felder mit **Speicherleiste** (01 D2) + ⌘/Strg+S: Testadresse, interne Test-Domains (P0-11), Absendernamen, Antwort-an, Fristen der Bestätigung, Löschfrist, IP-Hash, Textversion, Pfade, Werbefenster (Wochentage als Chips Mo–So), Sperrtage (Datums-Chips), werbliche Mails je 30 Tage, Empfehlung (Gutscheinwert €, Rücktrittstage, Bedingungen-Link), Event-Standards, Mail-Ereignisse (Webhook an/aus, Grenze vorübergehend unzustellbar, Aufbewahrung Tage), Zuordnungsmodell und -fenster, Nachlauf Kampagne.
- Geheimnisse: nur Schlüssel-**Namen** als Text, nie Eingabefelder.
- **Auftragsdaten:** Datenquelle + Feldzuordnung als Tabelle mit „Prüfen“ (Backoffice-Server `getMeta`, L15): „Feld liefertermin_bestaetigt vorhanden ✓“. Neu nach P1-1: Quelle Lieferdatum (AB-Feld · Lieferschein zugestellt · Montage abgeschlossen).

---

## 3. Akten, Zeitleiste, Verknüpfungen

### 3.1 Akten im Überblick

| Akte | Tabs (≤ 4) | Bezüge (rechte Spalte) | Primär je Zustand |
|---|---|---|---|
| Newsletter-Ausgabe | Inhalt · Empfänger & Versand · Protokoll · Verlauf | Kampagne, Events aus Blöcken | Zur Freigabe / Freigeben… / Jetzt versenden… / Protokoll |
| Person (Empfänger) | Übersicht · Einwilligungen · Zustellungen · Verlauf | Kundenakte, Events, Empfehlungen | Keine Werbung mehr… |
| Zielgruppe | eine Seite (Regeln + Vorschau) | Ausgaben/Events mit dieser Zielgruppe | Stand speichern |
| Kundenreise | Regel · Rechtsgrundlage · Vorlage · Protokoll | Vorlage, Events | Aktivieren… / Pausieren |
| Kampagne | Übersicht · Kennzahlen · Anfragen · Auswertung | Inhalte, Anfragen | Pausieren / Aktivieren / Wieder aktivieren |
| Event | Anmeldungen · Eckdaten · Mails · Verlauf | Kampagne, Newsletter-Blöcke | Veröffentlichen… / Anmeldung erfassen / Check-in öffnen / Teilnehmerliste |
| Social-Beitrag | Beitrag · Bild & Bildrechte · Veröffentlichung · Verlauf | Kampagne, Marke, Produkt | Ausarbeiten / Zur Freigabe / Freigeben… / Als veröffentlicht markieren… |
| Empfehlung | eine Seite mit Schrittleiste | Kundenakten, Anfrage, Auftrag, Gutschein | Code senden / Gutschein… |

**Zeitleiste** (03 §8.16) aus Kommentaren der Dokumentmethoden, Statuswechseln mit Person, Anhängen; technische Versionen eingeklappt; @Erwähnung → Benachrichtigung. Zurückgaben, Kanzlei-Schalter, CSV-Exporte und Freigaben stehen immer mit Person und Zeit.

### 3.2 Kundenakte `/kunden/[kontakt]`, Tab „Marketing“ (Baustein für den CRM-Bereich)
- Newsletter-Status, Einwilligungen als Zweck-Chips mit Status, Event-Anmeldungen, Empfehlungen (als Empfehler/Empfohlene), Kundenkarte.
- Chip **„Werbehinweis erteilt 12.10. (AB)“** bzw. „Werbehinweis fehlt“ (K12, nach P0-4).
- **„Keine Werbung mehr…“** (Shift+W) = derselbe Dialog D4 wie in der Personen-Akte – statt einzelner Abmelde- und Widerrufsknöpfe.
- „Neu ▾“: Newsletter-Anmeldung · Event-Anmeldung · Einwilligung erfassen · Empfehlungscode.
- `nicht_kontaktieren = 1`: Tab zeigt Band `danger-soft` „Diese Person will keinen Kontakt – keine Marketing-Aktionen“; alle Aktionen außer Nachweis/Auskunft deaktiviert.
- Lieferung: Komponente `MarketingTab` aus `components/Backoffice/Marketing/`, Daten über `ph_crm.api.kundenakte` (Marketing-Block, Anfrage an ph_crm) bzw. bis dahin eigene Abfragen in `lib/backoffice/marketing/daten.js`.

---

## 4. Workflows, Methoden, Massenaktionen, Dialoge

### 4.1 Workflow-Übergänge (Datenbestand `fixtures/workflow.json`) → Knopf und Verhalten

| DocType | Von → Nach | Knopf | Rolle | Bedingung | Verhalten |
|---|---|---|---|---|---|
| PH Newsletter Ausgabe | Entwurf → Freigabe | Zur Freigabe | Mitarbeiter | bereit | verzögerter Commit; danach ToDo + Glockenzeile an Leitung (L4: Backoffice-Server legt sie an) |
| | Entwurf → Freigabe → Geplant | Freigeben und planen… | Leitung | bereit + Termin | Dialog D1; eine Server Action, zwei Übergänge, beide in der Zeitleiste (E9) |
| | Freigabe → Geplant | Freigeben… | Leitung | bereit + Termin | Dialog D1 |
| | Freigabe → Entwurf | Zurückgeben… / Zurück auf Entwurf | Leitung / Ersteller | – | Kommentar Pflicht bei Zurückgeben; sofort |
| | Geplant → Wird versendet | Jetzt versenden… | Leitung | bereit | Bestätigung (Fakten: Empfänger, Zielgruppe, letzte Testmail oder „Noch keine Testmail“ `warning`, Testmodus); Scheduler löst denselben Übergang ab Termin aus |
| | Geplant → Entwurf | Zurück auf Entwurf | Leitung | – | sofort + Undo |
| | Geplant / Wird versendet → Abgebrochen | Abbrechen… | Leitung | – | Bestätigung rot mit Grund; Server-Rollenprüfung fehlt (F7, P1-9) → Server Action prüft |
| PH Event | Geplant → Offen | Veröffentlichen… | Leitung | Uhrzeit | Bestätigung; Freigabe-Muster, wenn ein Mitarbeiter anlegt („Zur Freigabe“) |
| | Geplant/Offen/Ausgebucht → Abgesagt | Absagen und informieren… | Leitung | Grund | Bestätigung rot |
| | Offen → Ausgebucht | Als ausgebucht markieren | Mitarbeiter | – | verzögerter Commit (alle Rollen gleich) |
| | Ausgebucht → Offen | Wieder öffnen | Leitung | – | sofort |
| | Offen/Ausgebucht → Durchgefuehrt | – | Scheduler | Folgetag 08:00 | kein Knopf (E12) |
| PH Kampagne | Entwurf → Aktiv | Aktivieren | Leitung | Zeitraum-Beginn | sofort + Undo |
| | Aktiv ⇄ Pausiert | Pausieren / Fortsetzen | Mitarbeiter | – | verzögerter Commit |
| | Aktiv/Pausiert → Beendet | Beenden… | Leitung | – | Bestätigung |
| | Beendet → Aktiv | Wieder aktivieren | Leitung | – | Bestätigung |
| PH Social Beitrag | Idee → Entwurf | Ausarbeiten | Mitarbeiter | – | sofort + Undo |
| | Idee/Entwurf → Verworfen | Verwerfen | Mitarbeiter | – | verzögerter Commit |
| | Entwurf → (Wartet auf Freigabe) | Zur Freigabe | Mitarbeiter | Bild, Bildbeschreibung, 3 Prüfungen | verzögerter Commit; bis L22 Kommentar + ToDo |
| | Entwurf → Freigegeben | Freigeben… | Leitung | Bildquelle ≠ offen, Bild | Dialog D2 |
| | Freigegeben → Geplant | (automatisch) | – | Datum | Server Action nach Datum setzen |
| | Freigegeben/Geplant → Entwurf | Zurückgeben… | Leitung | – | Kommentar Pflicht |
| | Geplant → Veroeffentlicht | Als veröffentlicht markieren… | Mitarbeiter | URL | Dialog sm |
| | Verworfen → Entwurf | Wiederherstellen | Leitung | – | sofort |

Kundenreise, Empfehlung, Abo, Einwilligung, Zielgruppe haben keinen Workflow; Zustände wechseln über Dokumentmethoden. `WorkflowLeiste` (Fundament) zeigt höchstens 2 Übergänge + `⋯`; Bedingungen vorgeprüft (Tooltip mit Grund), Server bleibt letzte Instanz.

### 4.2 Dokumentmethoden → Knöpfe (Datenbestand, whitelisted)

| DocType | Methode | Knopf | Rolle | Verhalten |
|---|---|---|---|---|
| PH Newsletter Ausgabe | `vorschau()` | Live-Vorschau | alle | automatisch nach Autosave |
| | `testmail(empfaenger)` | Testmail… | Mitarbeiter | Dialog, nur interne Adressen (Server Action prüft) |
| | `jetzt_versenden()` | Jetzt versenden… | Leitung | Bestätigung |
| | `abbrechen(grund)` | Abbrechen… | Leitung | Bestätigung rot, Rolle in der Server Action |
| PH Newsletter Abo | `doi_erneut_senden()` | Bestätigungsmail erneut senden… | Mitarbeiter | nur Unbestätigt, > 60 min (Server Action filtert) |
| | `abmelden(grund, kanal)` | Abmelden… / Nur Newsletter abbestellen… | Mitarbeiter | Bestätigung (endgültig) |
| | `auskunft()` | Auskunft (Art. 15) | Mitarbeiter | Side-Peek |
| | `loeschen_dsgvo()` | Daten löschen… | Leitung | Bestätigung rot mit Tippfeld |
| PH Einwilligung | `widerrufen(kanal, grund)` | Widerruf erfassen… | Mitarbeiter | Bestätigung (endgültig; widerruft alle wirksamen Einträge des Zwecks, bei Newsletter auch das Abo) |
| | `bestaetigen_mit_beleg(beleg_hinweis)` | Bestätigung mit Beleg… | Leitung | Dialog sm (Beleg-Text Pflicht) |
| | `nachweis()` | Nachweis | alle | Daten für PDF/Side-Peek |
| PH Kundenreise | `pruefen()` · `aktivieren()` · `pausieren()` · `testmail()` · `vorschau()` · `heute_planen()` | siehe §2.6 | Leitung (Testmail/Vorschau alle) | – |
| PH Kampagne | `kennzahl_erfassen(...)` · `anfragen_zaehlen()` · `auswertung()` | Kennzahl… / automatisch / Tab Auswertung | Mitarbeiter | `anfragen_zaehlen` beim Öffnen der Akte |
| PH Event | `anmeldung_hinzufuegen(...)` · `erinnerung_senden(alle)` · `teilnehmer_status(zeile, status)` · `teilnehmerliste()` | Anmeldung erfassen / Erinnerung senden… / Zeilenmenü, Check-in / Druck | Mitarbeiter | `als_durchgefuehrt()` wird nicht angeboten |
| PH Social Beitrag | `bild_freigabe_pruefen()` · `freigeben()` · `als_veroeffentlicht(url)` · `kennzahlen_erfassen(...)` | siehe §2.9 | Mitarbeiter / Leitung (freigeben) | – |
| PH Empfehlung | `code_senden()` · `gutschein_senden(gutschein_code)` · `ablehnen(grund)` | Code senden / Gutschein… / Ablehnen… | Mitarbeiter / Leitung | Gutschein gesperrt (E5) |
| PH Segment | `vorschau(speichern)` | Vorschau / Stand speichern | Mitarbeiter | 600 ms nach Änderung |
| PH Mail Vorlage | `vorschau()` | Vorschau | Leitung | – |
| Modul (nicht whitelisted, Wrapper nötig) | `checkin.einchecken(code|event, zeile, personen)` · `checkin.stand(event)` · `events.nachruecken(event)` · `events.absage_an_teilnehmer(event, hinweis)` · `events.einladungen_senden(event, trockenlauf)` · `utils/kennzahlen_csv.lesen` | Check-in / Nachrücken… / Absagen und informieren… / Einladung an Zielgruppe… / CSV importieren… | – | Anfrage an ph_marketing §11.3 A1–A5 |

### 4.3 Massenaktionen (≤ 6 sichtbar, Vorschau „n von m möglich“)

| Liste | Massenaktionen | Vorschau-Regel |
|---|---|---|
| Newsletter | – (CSV Leitung) | – |
| Empfänger · Personen | Bestätigungsmail erneut senden…, Abmelden…, Interesse, Sprache, Daten löschen (Leitung) | nur Unbestätigt > 60 min für Bestätigungsmail; Löschen nur zulässige Status |
| Empfänger · Einwilligungen | Nachweis drucken (≤ 50), Widerruf erfassen… | nur Offen/Bestätigt |
| Kundenreisen | Pausieren (Leitung) | nur Aktiv |
| Kampagnen | Pausieren, Fortsetzen, Beenden… (Leitung), Bericht drucken, Zuweisen | Workflow-Zustand je Zeile |
| Events | Teilnehmerliste drucken | – |
| Event-Anmeldungen (Akte) | Status setzen (bestätigt/da/nicht erschienen/abgesagt), CSV | – |
| Social | Zuweisen, Kampagne setzen, Um n Tage verschieben, Verwerfen | Übergang je Zeile |
| Empfehlungen | Code senden, Ablehnen… | nur ohne Code-Versand bzw. offene Status |

Ausführung: Einzelaufrufe (L3) mit Fortschritt im Knopf „12/40“, abbrechbar, Ergebnis-Toast mit „Details“ (Side-Peek mit übersprungenen Zeilen und Grund).

### 4.4 Dialoge (ersetzen die Assistenten M0, M1, M5, M6, M7, M8)

| # | Dialog | Größe | Inhalt | Primär | Fehler/Sperre |
|---|---|---|---|---|---|
| D1 | **Newsletter freigeben** | lg 800 px; < 640 px Bottom-Sheet | links Mail-Vorschau (iframe `sandbox`, `title`, 360 px, Desktop/Mobil); rechts Prüfliste: Bereit ✓ · Testmail gesendet 14:20 ✓ bzw. „Noch keine Testmail“ `warning` · Empfänger 1.248 · Kundenprojekt-Fotos mit Einwilligung ✓/– · **Versandzeit** (Vorschlag erster Donnerstag 18:00; Sperrtage nicht wählbar; Satz zum Wochentag) | „Freigeben – Do 03.12. 18:00“ (Knopftext trägt den Termin); daneben „Zurückgeben…“ | Vorschau-Fehler sperrt mit „Ohne Vorschau keine Freigabe“; Sperrtag → Knopf deaktiviert mit Grund. Ergebnis-Toast „Ausgabe November freigegeben – sendet Do 03.12. 18:00 · Rückgängig“ (verzögerter Commit) |
| D2 | **Social freigeben** | md 560 px | Bild im Kanal-Format, Text, drei Prüfungen, Plandatum | „Freigeben“ | Prüfung rot → Knopf deaktiviert mit Grund |
| D3 | **Einwilligung erfassen** | md 560 px | §2.4 | „Erfassen – Bestätigung senden“ / „Erfassen mit Formular“ | Papier ohne Datei; Kanäle ohne Backend gesperrt |
| D4 | **Keine Werbung mehr** | md 560 px | Person, Umfang (Segment): **Werbung aller Art** (Standard) · **jede Kontaktaufnahme außer Vertrag/Service** · **nur Newsletter**; Kanal (Antwortmail · Telefon · Showroom · Backoffice), Grund (optional), Beleg (optional). Fakten: „Newsletter wird abgemeldet. Einwilligungen ‚Einladungen‘, ‚Pflege/Nachkauf‘ werden widerrufen. Erneute Anmeldung nur mit neuer Bestätigungsmail.“ | „Keine Werbung mehr“ (neutral, nicht rot – es ist das Recht des Kunden) | – |
| D5 | **Event-Anmeldung** | md 560 px; iPhone Vollbild-Sheet | §2.8 | „Anmelden“ | voll/doppelt als Feldtext |
| D6 | **Gutschein senden** | md 560 px | Fakten (Empfehlerin, Auftrag, Ampeln Storno/Lieferung/Zahlung/Frist ✓), Wert (aus Einstellungen, änderbar, Euro), Mail-Vorschau | „Gutschein über 100,00 € erstellen und senden“ (Bestätigung, geldwirksam) | gesperrt bis P0-8/P0-9/L25: „Gutschein-Art ‚Aktion‘ fehlt im Shop – Ausgabe nach Abstimmung mit dem Steuerberater“; Code wird nie abgetippt |
| D7 | **Testmail** | sm 400 px | Adresse (vorbelegt) | „Senden“ | extern → Feldfehler |
| D8 | **Als veröffentlicht / Beleg / Grund** | sm 400 px | ein beschriftetes Feld | Verb der Aktion | Pflichtfeld |
| M2 | **Kundenreise leer beginnen** (Assistent bleibt, selten) | Assistent | 1 Zweck/Titel → 2 Auslöser → 3 Werbung ja/nein → 4 Grundlage → 5 Vorlage + Vorschau → 6 Regelprüfung → Anlegen (inaktiv) | „Anlegen“ | Esc ab Schritt 2 mit Rückfrage |

D4 Technik heute (bis A6 „Widerspruch erfassen“ im Backend): eine Server Action ruft **einmal** `PH Newsletter Abo.abmelden(kanal, grund)` (widerruft die Newsletter-Einwilligung mit) und danach `PH Einwilligung.widerrufen` je **anderem** werblichen Zweck mit wirksamem Eintrag – nie doppelt für „Newsletter“. Umfang „jede Kontaktaufnahme“ setzt zusätzlich `PH Kontakt.nicht_kontaktieren` (nur mit CRM-Schreibrecht; sonst Aufgabe an CRM „Kontaktsperre setzen“ und Hinweis im Ergebnis). Der globale Abmeldeeintrag und die Postsperre folgen mit A6/P0-7.

Alle Dialoge: Öffnen 160 ms (`opacity` + `scale(0.98)` → 1, `--bo-ease-out`), Schließen 120 ms `--bo-ease-in`; Bottom-Sheet 200 ms ein / 160 ms aus; Fokus auf erstes Feld bzw. bei roten Aktionen auf „Abbrechen“; Enter = Primär, Esc = Abbrechen (bei geänderten Feldern Rückfrage); Sticky-Footer mit Safe-Area am Telefon.

---

## 5. Kennzahlen, Charts, Quellen

| Element | Darstellung | Quelle | Klickziel |
|---|---|---|---|
| Aktive Abos | Kennzahl + Vormonat | Number Card „PH Aktive Abos“ | `/marketing/empfaenger?status=Aktiv` |
| Unbestätigt > 48 h | Kennzahl, `warning` ab 1 | `kennzahlen.unbestaetigte_48h` | `…?status=Angemeldet unbestaetigt` |
| Anmeldungen nächstes Event | Personen / Plätze | `kennzahlen.event_anmeldungen_offen` + PH Event `kapazitaet` | Event-Akte |
| Beiträge diese Woche | Kennzahl | Number Card „Beiträge diese Woche“ | `/marketing/social` |
| Bestätigungsquote 30 Tage | nur unter „Mehr Zahlen“ und im Bericht | `kennzahlen.doi_quote_30_tage` | Bericht Newsletter-Entwicklung |
| Abos je Woche | Balken (Quartal) | Chart „PH Abos je Woche“ | Empfänger mit Zeitraum |
| Abos nach Quelle | horizontaler Balken, Top 4 + Sonstige | Chart „PH Abos nach Quelle“ | `…?quelle=` |
| Einwilligungen nach Zweck | Balken | Chart „PH Einwilligungen nach Zweck“ | `…?ansicht=einwilligungen&zweck=` |
| Beiträge je Kanal | Balken | Chart „PH Beiträge je Kanal“ | Social `?kanal=` |
| Abmeldungen je Monat | Linie (Leitung/GF) | Chart „PH Abmeldungen je Monat“ | Empfänger |
| Nächste Ausgabe / Nächstes Event / Diese Woche | Karten | `getList` (Status, Datum) | Akte / Kalender |
| Zu tun | Liste | offene ToDos mit `reference_type` aus ph_marketing + berechnete Zeilen (Uhrzeit fehlt, Kanzlei offen) | Akte bzw. Dialog |
| GF-Kosten | Balken „Ausgaben je Kanal“ (Jahr) | `PH Kampagne.ausgaben_cent` group by Kanal | Kampagnen |

Charts nach 03 §1.6/§8.15: Tinte primär, Sand sekundär, Status-Farben nur für Status; keine Donuts im Bereich (alle Anteile als Balken). SVG serverseitig, Einblendung ≤ 400 ms, `prefers-reduced-motion` sofort. Zahlen zählen nur bei Wertwechsel hoch (W9).

---

## 6. Druck / PDF

| Ausgabe | Druckformat (Datenbestand) | Maß | Auslöser |
|---|---|---|---|
| Teilnehmerliste | „PH Event Teilnehmerliste“ (sortiert nach Name, Spalte „Da ☐“, Warteliste separat, Datenschutz-Hinweis) | A4 | Event-Akte `p`, Dashboard-Karte, Absagen-Dialog („Telefonliste drucken“) |
| Namensschilder | „PH Event Namensschilder“ (85 × 54 mm, je Person, +1/+2) | Bogen A4 | Event-Akte `⋯` (Fundament: Druckpanel mit Etikettenmaß) |
| Einwilligungsnachweis | „PH Einwilligung Nachweis“ (ein Eintrag + alle Einträge der Adresse, Art.-7-Hinweis) | A4 | Personen-Akte, Einwilligungsliste (Sammel ≤ 50), Kundenakte |
| Kampagnenbericht | „PH Kampagnenbericht“ | A4 | Kampagnen-Akte, Massenaktion |
| Newsletter-Ausgabe | HTML-Vorschau druckbar (`@media print`) | A4 | Ausgabe `p` |
| Listen/Berichte | DataTable-Druck ohne Shell, Filter als Kopfzeile | – | Liste/Bericht |

Vorschau im Druckpanel (480 px Sheet, 200 ms ein). Fehler PDF: `unavailable` „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“ (05 §10). Kein Druck aus dem Check-in-Kiosk außer der Teilnehmerliste (Browser-Druck).

---

## 7. Mobile, iPad, Kiosk

### 7.1 Event-Check-in (Kiosk-Arbeitsplatz)
- Route **`/(kiosk)/checkin/[event]`** im `KioskShell` (ohne Seitenleiste, Ziele ≥ 48 px, Schrift ≥ 18 px). Start: Primäraktion der Event-Akte am Eventtag und Kachel **„Event-Check-in“** in `/arbeitsplatz` – nur am Eventtag und nur für Marketing/CRM (Arbeitsplatzliste in 05 §1 und PLAN §8 ergänzen). Rückweg oben links **„‹ Fertig“**.

```
┌ ‹ Fertig    Adventsabend · Do 26.11. · 18:00          Da: 31 von 46 Personen · ● Online          ┐
│ [ 🔍 Name, E-Mail oder Telefon …                         ] [ ▣ Code scannen ] [ + Gast ohne Anmeldung (3) ] │  56 px
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Familie Muster        2 Personen   „vegetarisch“                                [   ✓ Da   ]    │  64 px Zeile
│  Herr Huber            1 Person                                                  [   ✓ Da   ]    │
│▌ Frau Berger           1 Person     Da · 18:04                                   [Rückgängig]    │  bleibt an der Stelle
│  …                                                                                                │
├ Warteliste 0 · Abgesagt 2 ───────────────────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Suche** filtert ab dem ersten Zeichen (lokale Liste aus `teilnehmerliste()` beim Öffnen). Nach „Da“: Zeile **bleibt an ihrer Stelle**, wird in 240 ms `--bo-ease-out` zu „Da · 18:04“ (Haken-Icon, Text, linker 3-px-Balken `success`), Knopf wird zu „Rückgängig“ (Text-Knopf 48 px) für `--undo-ms`; Suchfeld wird geleert und fokussiert. Neu sortiert (nicht Erschienene zuerst) wird erst, wenn die Suche leer ist oder die Liste 10 s ruht – **ohne** Animation. Kein grüner Flächenblitz.
- **Personenzahl am Abend:** langer Druck / Menü „Personen…“ auf der Zeile → Stepper 56 px (kam die Begleitung nicht?) → `einchecken(personen=…)`.
- **Code scannen** (Kamera oder Scanner-Hook `useScanner`): QR aus der Bestätigungsmail, sofern die Vorlage den Code trägt (im Bau prüfen; `checkin.qr_svg` vorhanden). Antwort „ok“ → wie Tipp; „bereits“ → Zeile zeigt „Schon da seit 18:04 (anderes Gerät)“, kein Fehlerton; „ungültig“ → Toast oben Mitte „Code nicht erkannt – bitte Namen suchen“.
- **Technik:** Zielweg `checkin.einchecken` (setzt `erschienen_am`, `checkin_durch`, erkennt Doppel-Check-in) und `checkin.stand` für den Zähler – über whitelisted Wrapper (A1). Bis dahin `teilnehmer_status(zeile, "erschienen")`, Uhrzeit lokal in der Sitzung, Doppel-Erkennung über erneutes Laden der Zeile vor dem Schreiben.
- **Gast ohne Anmeldung** (P8b): Knopf zählt lokal hoch („Ohne Anmeldung: 3“, Stepper 56 px); beim „‹ Fertig“ als Kommentar ans Event („3 Gäste ohne Anmeldung“). Keine Personendaten, keine Einwilligung. Spontane Anmeldung mit Name/E-Mail weiter über „+“ im Menü → D5 im Kiosk-Format.
- **Offline:** Tipps in IndexedDB-Warteschlange (05 §12.5), Band „Offline – 3 Änderungen warten“, Einspielen bei Verbindung in der Reihenfolge der Tipps; Konflikt (anderes Gerät schneller) → Zeile „Schon da seit …“.
- **Idle:** Kiosk-Sperre nach 15 min ist auf dieser Route aus, solange das Event „heute“ ist; der Bildschirm dunkelt nach 5 min auf 40 % (400 ms `--bo-ease-inout`), ein Tipp weckt ohne PIN (WCAG 2.2.1 erfüllt, keine Daten gehen verloren).
- **Externe Tastatur:** Suchfeld hat immer den Fokus; ↓ wählt den ersten Treffer, Enter = „Da“, ⌘/Strg+Z = Rückgängig.
- **„‹ Fertig“** fragt einmal: „31 von 46 Personen da. Übrige 15 als ‚nicht erschienen‘ markieren?“ [Markieren] [Offen lassen] → zurück in die Event-Akte, Tab Anmeldungen. Toasts nur bei Fehlern (Erfolg steht in der Zeile).

### 7.2 Backoffice am iPad/Telefon
- Listen < 768 px als Karten (Empfänger: Name, Newsletter-Status, Zweck-Chips, letzte Zustellung · Events: Datum groß links, Titel, Plätze-Balken); Filter als Bottom-Sheet.
- **Freigabe am Telefon:** D1/D2 als Bottom-Sheet; Vorschau oben volle Breite (360 px, scrollbar), darunter Prüfliste und Termin, Knopf klebt unten (Sticky-Footer, Safe-Area). Ohne Vorschau keine Freigabe.
- Social am Telefon: Tagesliste mit Datum-Wischen, Foto per Kamera; iPad hoch 3-Tage-Ansicht.
- Block-Editor am Tablet: Segment „Schreiben | Vorschau“; am Telefon nur lesen + Freigabe.
- Event-Anmeldung am iPhone (Tresen): D5 als Vollbild-Sheet.

### 7.3 Kassa
Keine Marketing-Erfassung in der Kassa. Schnittstellen: Einlösung von Aktionsgutscheinen als Preisnachlass (B1, Kassa/Shop) und Verkauf am Eventabend als normaler Kassenbeleg (R14).

---

## 8. Automationen und Benachrichtigungen

### 8.1 Scheduler (Datenbestand `hooks.py` → `tasks.py`) und Sichtbarkeit

| Zeit | Lauf | Sichtbar in der Oberfläche |
|---|---|---|
| alle 15 min | Newsletter-Versand ab Termin, Stapel | Fortschritt im Kopf (Abfrage 15 s, L17), Protokoll, Glocke an Freigebende bei Abschluss („Ausgabe November versendet: 1.246 zugestellt, 2 Fehler“) |
| alle 30 min | Erinnerung an unbestätigte Anmeldungen | Personen-Akte Verlauf „Erinnert am …“ |
| 03:30 | Unbestätigte nach n Tagen löschen, offene Einwilligungen → Abgelaufen | Tooltip „wird am … gelöscht“ |
| 06:00 | Reisen planen (nur Automatik an) | Reise-Protokoll „geplant für heute n“ |
| 07:00 | Empfehlungen prüfen → „Gutschein fällig“ + ToDo | „Zu tun“, Badge – Fälligkeit bis P0-8 in der Akte gegengeprüft (§2.10) |
| 08:00 | Event-Erinnerung, vergangene Events schließen, Anmeldedaten nach Löschfrist anonymisieren | Event-Akte, Status Durchgeführt |
| 09:00 | Reisen senden (Service täglich, Werbung Di–Do, nie an Sperrtagen) | Protokoll mit Gründen als Sätze |
| Ereignis | Neue Anfrage → Kampagne zuordnen, Empfehlungskontext | Kampagne Tab Anfragen, Empfehlung Schrittleiste |
| Webhook | Mail-Ereignisse des Mail-Dienstes (`api/webhook.resend`, PH Mail Ereignis) → zugestellt/unzustellbar/als Spam gemeldet/abgemeldet | Protokoll-Status, Personen-Status; bei Versand über das System bleibt „unzustellbar“ manuell (L16 teilweise) |

### 8.2 Benachrichtigungen (Glocke; eine ungelesene Zeile je Objekt, 05 §7.3)

| Auslöser | Empfänger | Text | Priorität |
|---|---|---|---|
| Ausgabe „Zur Freigabe“ (nach Commit) | Leitung | „Ausgabe November wartet auf Freigabe (Anna)“ + „Freigeben“ | hoch |
| Social „Zur Freigabe“ (nach Commit) | Leitung | „Beitrag ‚Bodensee-Küche‘ wartet auf Freigabe“ + „Freigeben“ | normal |
| Zurückgegeben | Ersteller | „Ausgabe November zurückgegeben: ‚Bild im Brief tauschen‘“ | hoch |
| Beitrag heute geplant, nicht veröffentlicht | Zuständig | „Heute geplant: ‚…‘ – als veröffentlicht markieren?“ | normal |
| Kampagne ohne Kennzahl 7 Tage | Zuständig | „Kampagne ‚…‘: letzte Kennzahl vor 7 Tagen“ | niedrig |
| Kampagne Zeitraum vorbei, noch aktiv | Leitung | „Kampagne ‚…‘ – Zeitraum beendet“ | niedrig |
| Event Geplant, ≤ 21 Tage, ohne Uhrzeit | Leitung | „Adventsabend: Uhrzeit fehlt – Einladung kann nicht starten“ | hoch |
| Event morgen | Marketing | „Morgen Adventsabend: 46 Personen – Teilnehmerliste drucken“ | normal |
| Versandfehler nach Abschluss | Freigebende, Leitung | „Ausgabe November: 2 Mails nicht zugestellt – Protokoll“ | hoch |
| Gutschein fällig | Leitung | aus ToDo des Schedulers | hoch |
| Reise-Protokoll Fehler | Leitung | „Reise ‚Pflegetipps‘: n Fehler heute“ | hoch |

Die frühere Regel „Social freigabefähig seit > 24 h“ entfällt (P4). Technik: ToDo/Notification Log (Lesezustand) für Freigaben, Zurückgaben und Gutschein; übrige Zeilen berechnet der Backoffice-Server beim Glocken-Tick (ohne Lesezustand). Freigabe-ToDos legt bis L4 die Server Action nach dem Commit an und schließt sie beim Freigeben/Zurückgeben.

---

## 9. Datenmapping UI → Frappe

### 9.1 Routen → DocType, Lesen, Schreiben

| Route | DocType / Quelle | Lesen | Schreiben |
|---|---|---|---|
| `/marketing` | Number Cards, Charts, `kennzahlen.*`, ToDo, Ausgabe/Event/Social | `getList`, `count`, `call` | – |
| `/marketing/newsletter` | PH Newsletter Ausgabe | `getList` | `insert` (Neue Ausgabe), `delete` (Undo) |
| `/marketing/newsletter/[name]` | Ausgabe + PH Newsletter Block + PH Newsletter Versand | `getDocMitInfo`, `runDocMethod vorschau`, `getList` Versand | `save` (modified), `setValue`, `workflowAction`, `runDocMethod testmail/jetzt_versenden/abbrechen`, `uploadFile`, `insert ToDo` |
| `/marketing/empfaenger` | PH Newsletter Abo (+ Interesse), PH Einwilligung, PH Kontakt | `getList` (zwei Abfragen, im Server zu Personen zusammengeführt) | `runDocMethod doi_erneut_senden/abmelden`, `save` (Interessen, Sprache) |
| `/marketing/empfaenger/[email]` | Abo, Einwilligungen (`email`), Newsletter Versand (`abo`), Reise Versand (`empfaenger`), Event Anmeldung (Kindtabelle), Empfehlung | `getDoc`, `runDocMethod auskunft`, `getList` | `runDocMethod abmelden/widerrufen/bestaetigen_mit_beleg/loeschen_dsgvo`, `insert PH Einwilligung` (Papier), `uploadFile` |
| `/marketing/zielgruppen` (+ `[id]`) | PH Segment + PH Segment Regel | `getList`, `getDoc`, `runDocMethod vorschau` | `insert`, `save`, `setValue status` |
| `/marketing/kundenreisen` (+ `[id]`) | PH Kundenreise + Trigger, PH Reise Versand, PH Mail Vorlage | `getList`, `runDocMethod pruefen/vorschau`, `getList` Versand | `save`, `insert` (Duplizieren), `runDocMethod aktivieren/pausieren/testmail/heute_planen` |
| `/marketing/kampagnen` (+ `[name]`) | PH Kampagne + Kennzahl, PH Anfrage (`ph_marketing_kampagne`), PH Kampagne Kontaktpunkt | `getList` + Summen, `getDoc`, `runDocMethod auswertung/anfragen_zaehlen` | `insert`, `save`, `workflowAction`, `runDocMethod kennzahl_erfassen` |
| `/marketing/events` (+ `[id]`) | PH Event + Anmeldung + Einladung, PH Mail Vorlage | `getList`, `getDoc`, `runDocMethod teilnehmerliste` | `insert`, `save`, `workflowAction`, `runDocMethod anmeldung_hinzufuegen/erinnerung_senden/teilnehmer_status`, Wrapper A2–A4 |
| `/(kiosk)/checkin/[event]` | PH Event + Anmeldung | `runDocMethod teilnehmerliste`, Wrapper `checkin.stand` | `runDocMethod teilnehmer_status` bzw. Wrapper `checkin.einchecken`, `kommentar` |
| `/marketing/social` (+ `[name]`) | PH Social Beitrag, PH Marke (lesend), PH Produkt (Slug-Suche) | `getList` (Zeitraum), `getKanban`, `getDoc`, `searchLink` | `insert`, `save`, `setValue datum_geplant`, `workflowAction`, `runDocMethod bild_freigabe_pruefen/freigeben/als_veroeffentlicht/kennzahlen_erfassen`, `insert ToDo`, `kommentar` |
| `/marketing/empfehlungen` (+ `[code]`) | PH Empfehlung, PH Anfrage, PH Kontakt, PH Auftragsbestaetigung, PH Lieferschein (lesend) | `getList`, `getDoc` | `insert`, `save` (auftrag), `runDocMethod code_senden/ablehnen/gutschein_senden` |
| `/marketing/vorlagen` | PH Mail Vorlage | `getList`, `getDoc`, `runDocMethod vorschau` | `save`, `insert` |
| `/marketing/einblicke` | Report „PH Top-Seiten (Einblicke)“, PH Einblick Tag | `getReport`, `getList` | – |
| `/marketing/berichte/[report]` | 6 Script Reports | `getReport(name, filters)` | – |
| `/marketing/einstellungen` | PH Marketing Einstellungen (Single), `getMeta` Auftragsdaten | `getDoc`, `getMeta` | `save`, `setValue` (Schalter) |
| Druck | Print Formats §6 | `/druck/[doctype]/[name]`, `getPdf` | – |

Kindtabellen-Abfragen über Elterndokumente hinweg (Interessen, Event-Anmeldungen einer Adresse) brauchen im Fundament `getList` mit Kindtabellen-Filter (§12).

### 9.2 Anzeige ≠ Speicherung

| Feld | Gespeichert | Anzeige |
|---|---|---|
| `*_cent` | Cent Int | `cent()`; Eingabe Euro mit Komma |
| `klickrate_promille` | ‰ Int | „x,y %“ |
| Status ohne Umlaut (`Veroeffentlicht`, `Durchgefuehrt`, `Bestaetigt`, `Angemeldet unbestaetigt`, `Gutschein faellig`, …) | Server-Schlüssel | Label-Map in `texte.js` (alle Status aller Marketing-DocTypes inkl. Empfehlung, Versand, Mail-Ereignis); Filter senden den Schlüssel |
| `zweck`, `grund`, Auslöser-Typ, Segment-Kriterium/Operator | Schlüssel | Klartext aus `texte.js`; Schlüssel nur in „Technische Angaben“ |
| Datum/Zeit | Datetime | relativ ≤ 7 Tage, Tooltip absolut mit Wochentag (de-AT) |
| Ausgabe | `name` + `slug` | „<Monat> <Jahr>“, Nummer `muted` |
| Token-Hashes, Idempotenz-Schlüssel, `schluessel`, `kontext_json` | Hash/JSON | nie angezeigt |

---

## 10. Randfälle (Umsetzung in der Oberfläche)

| Fall | Verhalten |
|---|---|
| Storno (AB) | Empfehlung: rotes Band + Ablehnen vorbelegt; Reise-Protokoll Grund „Auftrag storniert“ (nach P0-5); ROI ohne Storno (P1-10) |
| Teilstorno / Gutschrift | ROI netto nach Gutschriften (P1-10); Empfehlung: Mindestauftragswert nach Teilstorno `‹Inhaber›` – bis dahin Hinweis in der Akte, keine automatische Regel |
| Teillieferung / Montage danach | Reise-Auslöser „Lieferung“ mit Hinweis (§2.6) bis P1-13; Empfehlung erst nach letzter Zustellung (Ampel) |
| Anzahlung offen | Empfehlungs-Ampel „Zahlung“ rot; ROI-Spalte „bezahlt“ |
| Retoure / Reklamation offen | Reise-Laufzeittabelle (nach P0-5); Empfehlung: Hinweis „Retoure offen“ aus ph_shop/ph_service |
| Fremdwährung CHF | Kampagnen-Summen je Währung; Kennzahl ohne Kurs → Feldfehler (P1-8); Gutschein immer EUR (Hinweis in den Bedingungen) |
| Kunde ohne E-Mail | Event: Telefonanmeldung nach P1-6 (bis dahin „+ Gast ohne Anmeldung“ am Eingang); Reise: Protokollzeile „keine E-Mail“ (P1-13); Post-Einladung P2-1 |
| Ehepaar, eine E-Mail | eine Anmeldung, Personen ändern (P1-5) / am Eingang „Personen…“ über `einchecken(personen)` |
| Adresswechsel | „Adresse ändern…“ (P-M4) gesperrt bis Backend; bis dahin Hilfe-Text: „Neue Adresse über Website-Anmeldung, alte Adresse abmelden (Grund ‚Adresswechsel‘).“ |
| Event voll, Absage → Platz frei | automatisches Nachrücken (`nachruecken_automatisch`) oder „Nachrücken…“ |
| Mehrsprachigkeit | Ausgabe je Sprache (Zielgruppe Sprache); Reise-Vorlagen je Sprache P2-2 |
| Zwei Geräte am Eingang | „Schon da seit … (anderes Gerät)“ |
| Abmeldelink aus alter Mail | Backend P0-10 (Token je Versandzeile); Oberfläche unverändert |

---

## 11. Backend-Voraussetzungen, Sperren, Anfragen

### 11.1 Pflicht vor Livebetrieb mit echten Adressen (aus 21 §7, Stand Datenbestand 04.11.)

| # | App | Änderung | Stand 04.11. | Oberfläche bis dahin |
|---|---|---|---|---|
| P0-1 | ph_marketing | Zweck „Teilnahme an Event“; „Einladungen“ nur mit eigenem Ja + Bestätigungsmail; Altbestand umschlüsseln (R1) | offen (`events.anmelden` legt weiter „Einladungen“ an) | Einladungs-Schalter ausgeblendet; „Einladung an Zielgruppe…“ und Zielgruppen mit Zweck Einladungen gesperrt; Reise „Einladung zum Adventsabend“ nicht aktivierbar |
| P0-2 | ph_marketing | `PH Event Anmeldung.einladungen_ok`, `erschienen_am` | `erschienen_am` vorhanden, `einladungen_ok` offen | wie P0-1 |
| P0-3 | ph_marketing | Bestätigungsmail erzwingen außer Papier; `erteilung_beleg` Pflicht bei Papier (R2) | Feld vorhanden, Regel offen | D3 nur Papier; Server Action erzwingt Beleg |
| P0-4 | ph_crm | `PH Kontakt.werbehinweis_*`, Umbenennung `widerspruch_*`, `widerspruch_umfang` (R3, R5) | offen | Grundlage „Bestandskunde“ gesperrt; Chip „Werbehinweis“ ausgeblendet |
| P0-5 | ph_marketing | `darf_senden`: Werbehinweis, Stopp „storniert“/„Retoure“ zuerst, Kontaktsperre auch für Service-Mails je Umfang | offen | Laufzeittabelle zeigt neue Zeilen als „kommt“ |
| P0-6 | ph_marketing | `doi_erneut_senden` nur Unbestätigt, 1-h-Sperre, Versuchszähler (R4) | offen | Server Action filtert |
| P0-7 | ph_marketing | Empfänger ohne Kontaktsperre und globale Abmeldung; Sync-Hook PH Kontakt (U17) | offen | D4 setzt Kontaktsperre mit, sonst Aufgabe an CRM |
| P0-8 | ph_marketing | `PH Empfehlung.auftrag` als Link, `vertragsart`, `gutschein`, Unternehmer, Fälligkeit nach Lieferung/Zahlung/Frist (R8) | offen | Ampeln in der Akte, Gutschein gesperrt |
| P0-9 | ph_shop | `PH Gutschein.art` „Aktion (unentgeltlich)“, Kanal „Empfehlung/Marketing“, Einlösung als Preisnachlass (B1, `‹StB›`) | offen | D6 gesperrt |
| P0-10 | ph_marketing | Abmelde-Token je Versandzeile (U16) | offen (Token am Abo) | keine |
| P0-11 | ph_marketing | Testmail nur intern, `test_domains` (U19) | offen | Server Action prüft |

Automatik-Schalter und Versand an echte Listen bleiben gesperrt, bis P0 erledigt ist (Bereitschaft §2.14).

### 11.2 Sperren in der Oberfläche (Fähigkeiten, `faehigkeiten.js`)

| S | Funktion | Fähigkeit wird wahr, wenn … | Text bei Sperre |
|---|---|---|---|
| S1 | Newsletter-Anmeldung im Backoffice | Methode A7 (`backoffice_anmelden`) vorhanden | „Kommt mit dem nächsten Backend-Stand – bis dahin am Tablet selbst eintragen“ (QR) |
| S2 | Einwilligung per Telefon/Showroom/E-Mail | P0-3 + Methode für Bestätigungsmail | „Bis dahin: Formular unterschreiben lassen“ |
| S3 | Einladungs-Schalter, Einladung an Zielgruppe | P0-1/P0-2 (`einladungen_ok` in Meta) | „Gesperrt: Einladungs-Einwilligungen aus früheren Anmeldungen müssen erst bereinigt werden.“ |
| S4 | Check-in mit Uhrzeit/Code/Personen | Wrapper A1 | Rückfall `teilnehmer_status`, Code-Knopf ausgeblendet |
| S5 | Nachrücken | Wrapper A2 | „Bis dahin Status in der Zeile auf ‚angemeldet‘ setzen“ (Speichern der Kindzeile) |
| S6 | Absage-Mail, Verschieben, Personen ändern | Wrapper A3, P1-5 | „Teilnehmerliste drucken und informieren“ |
| S7 | Gutschein senden | P0-8 + P0-9 + A8 | E5-Text |
| S8 | Grundlage Bestandskunde, Werbehinweis-Chip | P0-4 | §2.6 |
| S9 | Trockenlauf Kundenreise | Methode `trockenlauf` (U13) | „Kommt mit dem nächsten Backend-Stand“ |
| S10 | Adresse ändern | Methode `adresse_aendern` (P-M4) | Hilfe-Text §10 |
| S11 | Ideenleiste Social | `datum_geplant` nicht Pflicht (P1-12) | – (Leiste ausgeblendet; Ausnahme von „nie ausblenden“, weil ohne Funktion kein Weg) |
| S12 | Social-Prüfungen Kundenprojekt/Kennzeichnung als Felder | P1-12 (`einwilligung`, `kommerziell`) | Kommentar + Kontrollkästchen im Freigabe-Dialog |
| S13 | Kosten belegt, Währung/Kurs | P1-8 | Karte „Kosten belegt: Zuordnung der Eingangsrechnungen folgt“ |
| S14 | ROI netto | P1-10 | Hinweis + ROI-Spalte ausgeblendet |
| S15 | Event-Telefonanmeldung ohne E-Mail | P1-6 / L23 | E-Mail Pflicht, Hinweis „+ Gast ohne Anmeldung“ |
| S16 | Datenschutz-Anfrage mit Frist | P1-14 | Link ausgegraut |
| S17 | Freigabe-Status Social | L22 | Kommentar + ToDo (kein sichtbarer Unterschied für Nutzer) |

Fähigkeiten aus `getMeta` (Felder/Optionen) werden 10 min gecacht; Methoden-Fähigkeiten stehen als Liste in `faehigkeiten.js` mit Backend-Stand-Kennung und werden beim Backend-Update gepflegt. Unit-Test: jede Sperre hat Text und Fähigkeit.

### 11.3 Anfragen an Backend-Apps (gesammelt)

| # | An | Anfrage |
|---|---|---|
| A1 | ph_marketing | whitelisted Wrapper `checkin_einchecken(event, zeile|code, personen)`, `checkin_stand(event)` mit `pruefen_rolle()` |
| A2 | ph_marketing | whitelisted `PH Event.nachruecken(zeile=None)` auf `events.nachruecken` |
| A3 | ph_marketing | whitelisted `PH Event.absagen(grund, mail=1)` (Workflow + `absage_an_teilnehmer`), `verschieben(datum, uhrzeit)`, `personen_aendern(zeile, personen)`; Vorlage `event_verschoben` |
| A4 | ph_marketing | whitelisted `PH Event.einladungen_senden(trockenlauf)` – erst nach P0-1 |
| A5 | ph_marketing | whitelisted `PH Kampagne.kennzahlen_import(csv)` auf `utils/kennzahlen_csv.lesen` |
| A6 | ph_marketing | `widerspruch_erfassen(email, umfang, kanal, grund, beleg)` (P-M2): Abo, Einwilligungen, Kontaktsperre, globale Abmeldung in einem Aufruf |
| A7 | ph_marketing | `api.backoffice_anmelden` (L1) mit Kanal/Quelle aus dem Backoffice |
| A8 | ph_shop + ph_marketing | „Gutschein für Empfehlung anlegen und senden“ (L25), Art Aktion |
| A9 | ph_marketing | Status „Freigabe“ im Workflow PH Social Beitrag (L22) |
| A10 | ph_marketing | Sperrtag-Prüfung im Newsletter-Versand (L24) |
| A11 | ph_marketing | `empfaenger_liste()` für eine Ausgabe (L2), Stapelmethoden (L3), Freigabe-Benachrichtigung als Hook (L4), `trockenlauf` Reise (L5/U13), Testmail aus Vorlage (L14), Prüfmethode Auftragsdaten (L15), Realtime-Fortschritt (L17), `bereitschaft()` (K11), tägliche Einplanung von `kampagnen.alle_aktualisieren` in `hooks.py` |
| A12 | ph_marketing | Bounce-Anschluss für den Versand über das System (L16 Rest) |
| A13 | ph_marketing | `PH Kundenreise.zweck` um „Kundenkarte-Auswertung“ ergänzen oder bewusst ausschließen (F1) |
| A14 | ph_crm | `api.kundenakte` mit Marketing-Block; `PH Datenschutz Anfrage` (P1-14); Werbehinweis/Widerspruch (P0-4) |
| A15 | ph_faktura | Custom Field `PH Eingangsrechnung.ph_marketing_kampagne`; Werbehinweis setzen beim AB-Druck (P-M1) |
| A16 | ph_core | Nummernkreise `PH-NL-.YYYY.-.###`, `PH-SOC-.YYYY.-.####` (beantragt) |

### 11.4 Lücken der ersten Fassung – Stand

| L | Stand 04.11. | Behandlung |
|---|---|---|
| L1 | offen | S1, A7; alte Zwischenlösung gestrichen (F10) |
| L2 | teilweise (`PH Segment.vorschau` für Zielgruppen) | Side-Peek; A11 |
| L3 | offen | Einzelaufrufe |
| L4 | offen | Server Action legt ToDo nach Commit an |
| L5 | offen (Trockenlauf nur für Event-Einladungen) | S9 |
| L6 | Daten + Modulfunktion vorhanden | A2, S5 |
| L7 | Modulfunktion + Vorlage + `absage_mail_am` vorhanden | A3, S6 |
| L8 | Feld `erschienen_am` + `checkin.einchecken` vorhanden | A1, S4 |
| L9 | CSV-Leser vorhanden; Eingangsrechnungen offen | A5, P1-8 |
| L10 | offen | „manuell“ |
| L11 | erledigt (F2) | – |
| L12 | erledigt (F1) | – |
| L13 | Feld `erteilung_beleg` vorhanden | Papier-Weg baut darauf |
| L14 | offen | Hinweis + Links |
| L15 | offen | `getMeta` |
| L16 | teilweise (Webhook + Mail-Ereignis für Mail-Dienst) | A12 |
| L17 | offen | Abfrage 15 s |
| L18 | entfällt (verzögerter Commit) | – |
| L19 | ersetzt durch A2 | – |
| L20 | offen (Website-Team) | Testmodus-Band nennt es |
| L21 | Nachlauf-Feld vorhanden | Satz im Beenden-Dialog, Testfall |
| L22–L25 | offen | A9, S17 · S15 · A10 · A8/S7 |

---

## 12. Abhängigkeiten, offene Entscheidungen, Abgrenzung

### 12.1 Abhängigkeiten zu anderen Bereichen

| Bereich | Was Marketing braucht | Was Marketing liefert |
|---|---|---|
| **Fundament** (`backoffice/`) | Unternavigation mit „Mehr“ und Badge-Punkt; Token `--undo-ms` + verzögerter Commit in `Toast.js` (W1–W3); Kürzel-Registry mit Doppelbelegungs-Test und Abschalter „Einzeltasten aus“; Anwesenheit je Datensatz (P12, sonst Rückfall E8); Kiosk-Route `(kiosk)/checkin/[event]` mit Idle-Ausnahme und Kachel in `/arbeitsplatz`; `Kalender`-Komponente (Woche/Monat/Tag, 3-Tage, Drag, `role="grid"`); `getList` mit Kindtabellen-Filter; Druckpanel mit Etikettenmaß 85 × 54 mm; G-Akkord `g m`; Glocke liest ToDo mit `reference_type` | Muster „Freigabe-Dialog mit Vorschau“, „Fähigkeiten-Sperre mit Grund“ zur Wiederverwendung |
| **CRM** (`ph_crm`) | `PH Kontakt` Werbehinweis/Widerspruch (P0-4); Kontaktsperre-Sync (P0-7); `api.kundenakte` Marketing-Block; `PH Datenschutz Anfrage` (P1-14) | Komponente `MarketingTab` + Dialog D4 für die Kundenakte |
| **Faktura** (`ph_faktura`) | AB lesen (Status, `offen_cent`, `netto_cent`, `abgerechnet_cent`, `bezahlt_cent`, `storniert_am`, Währung); Gutschriften je AB (ROI); Custom Field Eingangsrechnung → Kampagne (P1-8); Werbehinweis beim AB-Druck (P-M1); Provisionsgutschrift für Unternehmer-Empfehler (B2, P2-4) | Kampagnen-Bezug auf Eingangsrechnungen (Anzeige) |
| **Shop** (`ph_shop`) | Gutschein-Art „Aktion“ und Anlage-Methode (P0-9, A8); Retouren-Status (Stopp-Regel) | – |
| **Kassa** (`ph_kassa`) | Einlösung von Aktionsgutscheinen als Preisnachlass (B1); Verkauf am Eventabend als normaler Beleg | – |
| **Logistik** (`ph_logistik`) | `PH Lieferschein.zugestellt_am` je AB (Empfehlungs-Ampel, Reise-Auslöser P1-13) | – |
| **Projekte** (`ph_projekte`) | Referenzen mit Einwilligung Foto-Referenz; „Montage abgeschlossen“ als Auslöser | Einwilligungs-Link in beide Richtungen |
| **Sortiment** (`ph_sortiment`) | PH Marke (Bildfreigabe, gesperrte Marken), PH Produkt (Slugs) | – |
| **Kundenkarte** (`ph_kundenkarte`) | Zweck „Kundenkarte-Auswertung“, Kriterium Kundenkarten-Stufe für Zielgruppen | – |
| **Service** (`ph_service`) | Servicefall Art Retoure/Reklamation offen (Stopp-Regel R13) | – |
| **Zentrale** | Glocke, Palette (Schnellaktionen „Newsletter-Anmeldung“, „Event-Anmeldung“, „Keine Werbung mehr“) | Zu-tun-Zeilen für die Zentrale |
| **Website-Team** | Seiten Bestätigen/Abmelden/Event-Absage, Umstellung der Formulare auf `ph_marketing.api` (L20) | – |

### 12.2 Offene Entscheidungen

| An | Frage | Wirkung im Bau |
|---|---|---|
| Inhaber | Vier-Augen-Prinzip, wenn Ersteller und Leitung dieselbe Person sind (E9) | Schalter `config.marketing.vierAugen`, Standard aus |
| Inhaber/Datenschutz | Keine E-Mail-Maskierung für Marketing-Rollen bestätigen (E10) | Standard keine Maskierung |
| Inhaber | Adventsabend: Uhrzeit, Programm, Plätze; Gutscheinwert Empfehlung; Mindestauftragswert, Teilstorno; kostenpflichtige Events geplant? | Status Geplant bis dahin; Kostenbeitrag gesperrt |
| Kanzlei | Fußzeilen mit Abmeldelink, Bestandskunden-Einladung, Bewertungsbitte, Empfehlungsbedingungen (inkl. Unternehmer, Verfallsdauer), Wortlaut Werbehinweis bei Erhebung, Aufbewahrungsfristen Nachweis/Protokoll, Hash-Sperrliste, Post-Werbung, Höchstzahl Bestätigungsmails | Schalter bleiben aus; Werte als `‹Kanzlei›` |
| Steuerberater | Buchung unentgeltlicher Aktionsgutscheine bei Einlösung; Provisionsgutschrift; Kurs für CHF in Auswertungen | D6 gesperrt; Kurs-Feld Pflicht |
| Leitung | Kampagnen-Zuordnung nach Zeitraumende (Nachlauf) gewünscht? | Satz im Beenden-Dialog |

### 12.3 Was über Branchensoftware wie marahplus hinausgeht (ohne Wertung)
1. Block-Editor mit sichtbarer Bereitschaftsregel und Live-Vorschau; Freigabe nur mit Vorschau.
2. Kundenreisen als Satz-Regeln mit Rechtsgrundlagen-Prüfung und Klartext-Gründen im Protokoll.
3. Eine Akte je Person mit Abo, Einwilligungen, Zustellungen und Nachweis-PDF (Art. 7) – kein Pixel, keine Öffnungsraten.
4. Event-Check-in am iPad mit stabilen Zeilen, Code-Scan, Offline-Puffer und Löschfrist.
5. Bildrechte-Prüfung in drei Teilen (Quelle, Kundenprojekt, Kennzeichnung) vor jeder Freigabe.
6. Kampagne → Kontaktpunkt → Anfrage → Auftrag mit Kosten belegt/gemeldet und Umsatz netto.
7. Empfehlungsprogramm, das die Fälligkeit an Lieferung, Zahlung und Frist knüpft.
8. Ein Freigabemuster in Glocke und „Zu tun“ statt Mailverkehr.

---

## 13. Bauauftrag

**Ziel:** Bereich Marketing vollständig im Fundament bauen – Mock und Frappe-Modus, mit Fähigkeiten-Sperren für fehlende Backend-Teile. Vor dem ersten Code: den passenden Leitfaden in `backoffice/node_modules/next/dist/docs/` lesen (App Router, Server Actions, `permanentRedirect`, `<Suspense>`-Streaming, View Transitions) – die Next-Version weicht von bekanntem Wissen ab (AGENTS.md). Regeln aus PLAN §10: `requireSession()`/`requireDocRecht()` zuerst, `export const dynamic = "force-dynamic"`, jede Server Action prüft Sitzung + Recht erneut, validiert Eingaben und antwortet `{ ok, code, message }`; keine Laufzeit-Importe aus `../src/`; keine Änderungen in `Backend-Import/`.

### 13.1 Dateien und Routen (`backoffice/src/app/`)

| Datei | Inhalt |
|---|---|
| `marketing/layout.js` | Unternavigation (6 + Mehr, Badges), Seitenband (Testmodus > Fehler > Hinweis), Rollen-Ausblendung |
| `marketing/page.js` | Übersicht (Zu tun, Erste Schritte, 4 Kennzahlen, Karten, Mehr Zahlen lazy) |
| `marketing/newsletter/page.js` | Ausgaben-Liste |
| `marketing/newsletter/[name]/page.js` | Ausgabe-Akte mit Block-Editor (Client-Insel `BlockEditor`) |
| `marketing/empfaenger/page.js` | Personen · Einwilligungen (`?ansicht=`) |
| `marketing/empfaenger/[email]/page.js` | Personen-Akte |
| `marketing/abos/page.js`, `marketing/abos/[email]/page.js`, `marketing/einwilligungen/page.js`, `marketing/einwilligungen/[name]/page.js` | nur `permanentRedirect()` (308) |
| `marketing/zielgruppen/page.js`, `marketing/zielgruppen/[id]/page.js` | Zielgruppen |
| `marketing/kundenreisen/page.js`, `marketing/kundenreisen/[id]/page.js` | Kundenreisen + Regel-Editor |
| `marketing/kampagnen/page.js`, `marketing/kampagnen/[name]/page.js` | Kampagnen |
| `marketing/events/page.js`, `marketing/events/[id]/page.js` | Events |
| `marketing/social/page.js`, `marketing/social/[name]/page.js` | Kalender/Kanban/Liste, Beitrags-Akte |
| `marketing/empfehlungen/page.js`, `marketing/empfehlungen/[code]/page.js` | Empfehlungen |
| `marketing/vorlagen/page.js`, `marketing/vorlagen/[id]/page.js` | Vorlagen (Leitung) |
| `marketing/einblicke/page.js` | Einblicke |
| `marketing/berichte/[report]/page.js` | 6 Berichte |
| `marketing/einstellungen/page.js` | Einstellungen (Leitung) |
| `marketing/**/loading.js` | Skeletons je Seitentyp (nach 300 ms) |
| `(kiosk)/checkin/[event]/page.js` | Check-in im `KioskShell` |

Navigation: `lib/backoffice/bereiche.js` (Eintrag `marketing` existiert, Unterpunkte ergänzen); Schnellaktionen in `lib/backoffice/suche.js`; Arbeitsplatz-Kachel „Event-Check-in“ in `app/arbeitsplatz/page.js` (Fundament-Änderung, mit dem Fundament abstimmen).

### 13.2 Komponenten (`backoffice/src/components/Backoffice/Marketing/`)

| Gruppe | Komponenten |
|---|---|
| Gemeinsam | `Unternav` (falls nicht im Fundament), `SeitenBand`, `ZustandsZeile`, `BereitschaftPopover`, `SperrHinweis` (Fähigkeit + Text), `StatusTon` (Mapping §2.0.4 → `StatusBadge`), `PersonZelle`, `ZweckChips`, `VerzoegertKnopf` (verzögerter Commit über Fundament-Toast) |
| Übersicht | `ZuTunListe`, `ErsteSchritte`, `NaechsteAusgabeKarte`, `NaechstesEventKarte`, `DieseWocheKarte`, `MehrZahlen` |
| Newsletter | `BlockEditor`, `BlockKarte`, `BlockMenue`, `BildFeld` (Dropzone + „Eigenes Foto“), `EventPicker`, `LiveVorschau` (iframe `sandbox`), `SpeicherStatus`, `Anwesenheit`, `KonfliktBlock`, `FreigabeDialog` (D1), `VersandFortschritt`, `TestmailDialog` (D7), `ProtokollTabelle` |
| Empfänger | `PersonenListe`, `EinwilligungsListe`, `PersonenAkte`, `NewsletterAnmeldungDialog` (Zielweg + QR-Rückfall), `EinwilligungErfassenDialog` (D3), `KeineWerbungDialog` (D4), `BestaetigungsmailDialog`, `AuskunftPeek`, `MarketingTab` (Kundenakte) |
| Zielgruppen | `SegmentEditor` (`SatzZeile`), `SegmentVorschau` |
| Kundenreisen | `RegelEditor` (`AusloeserZeile`), `RechtsgrundlageKarten`, `RegelPruefung`, `LaufzeitTabelle`, `ReiseProtokoll`, `ReiseDuplizierenDialog`, Assistent `ReiseAnlegen` (M2) |
| Kampagnen | `BudgetZelle`, `KennzahlDialog`, `KennzahlenGrid`, `CsvImport`, `KampagnenLink`, `AuswertungKarten`, `KampagneAnlegenDialog` |
| Events | `EventZeile`, `PlaetzeBalken`, `AnmeldungDialog` (D5), `AnmeldungenTabelle`, `WartelisteAbschnitt`, `NachrueckenDialog`, `AbsagenDialog`, `VerschiebenDialog`, `ErinnerungDialog`, `EventAnlegenDialog` |
| Check-in | `CheckinKopf`, `CheckinSuche`, `CheckinZeile`, `CodeScan`, `GastZaehler`, `FertigDialog`, `OfflineWarteschlange` |
| Social | `SocialKalender` (auf Fundament-`Kalender`), `SocialKarte`, `SocialKanban` (auf Fundament-`Kanban`), `BildrechteKarten`, `BildrechtePruefung` (3 Teile), `KanalVorschau`, `SocialFreigabeDialog` (D2), `VeroeffentlichtDialog` (D8) |
| Empfehlungen | `EmpfehlungSchritte`, `AuftragFakten` (Ampeln), `GutscheinDialog` (D6), `EmpfehlungscodeDialog` |
| Vorlagen/Einstellungen | `VorlagenEditor`, `PlatzhalterChips`, `Zustandsleiste`, `BereitschaftsPanel`, `SchalterMitFolge`, `FeldzuordnungTabelle` |

### 13.3 Bibliothek (`backoffice/src/lib/backoffice/marketing/`)

| Datei | Inhalt |
|---|---|
| `texte.js` | Glossar, Label-Maps aller Status/Zwecke/Gründe/Kriterien, Hilfe-Popover-Texte, Leer-/Fehlertexte |
| `status.js` | Ton-Zuordnung §2.0.4 je DocType + Status |
| `kuerzel.js` | Registrierung aller Bereichskürzel je Seitentyp (für `?`-Panel, Palette, Test) |
| `regeln.js` | Client-Spiegel: `versandbereit`, `blockSichtbar`, `offeneSlots` (Kopie aus `src/lib/kundenbetreuung/newsletter/newsletter.js`), `pruefeReise`, Werbefenster, Sperrtage, nächster erster Donnerstag, Tippfehler-Domains |
| `faehigkeiten.js` | S1–S17: Meta-Prüfungen (10 min Cache) + Methodenliste mit Backend-Stand; Mock-Schalter `BACKOFFICE_MOCK_FAEHIGKEITEN` |
| `daten.js` (`server-only`) | Lesefunktionen je Seite (Personen-Zusammenführung, Zu-tun-Berechnung, Kennzahlen, Empfehlungs-Ampeln aus AB/Lieferschein) |
| `actions.js` (`"use server"`) | Server Actions §13.4 |
| `intern.js` | Prüfung „interne Adresse“ für Testmails |
| `mock.js` | Seed (mind. 2 Ausgaben, 30 Abos in allen Status, 20 Einwilligungen, 7 Reisen, 3 Zielgruppen, 3 Kampagnen, 2 Events mit 46 Anmeldungen, 12 Social-Beiträge, 5 Empfehlungen, 14 Vorlagen; nur erfundene Beispielpersonen) + Mock-Handler für alle Dokumentmethoden und Wrapper, Fehler-Injektion (Testmail, Vorschau, Upload, Teilfehler, doppelter Check-in, Kalender-Drop) |

### 13.4 Server Actions (`lib/backoffice/marketing/actions.js`)

| Action | Eingabe | Frappe-Aufrufe (`FrappeClient`) | Prüfungen |
|---|---|---|---|
| `ausgabeAnlegen` | `{ art: struktur|leer|kopie }` | `getList` letzte Ausgabe → `insert PH Newsletter Ausgabe` | Monat frei |
| `ausgabeVerwerfen` (Undo) | `{ name }` | `delete` | nur Entwurf ohne Versand |
| `ausgabeSpeichern` | `{ name, modified, felder, bloecke }` | `save(…, { modified })`; bei Status Freigabe/Geplant vorher `workflowAction` „Zurück auf Entwurf“ | Rolle, `bildquelle = eigen` setzen, Konflikt → `code: conflict` + Serverstand |
| `ausgabeVorschau` | `{ name }` | `runDocMethod vorschau` | – |
| `testmail` | `{ doctype, name, empfaenger }` | `runDocMethod testmail` + `kommentar` | `intern.js` (U19) |
| `zurFreigabe` | `{ doctype, name }` (nach Undo-Ablauf) | Newsletter: `workflowAction`; Social: `kommentar` + `insert ToDo` (bis L22); Event: `insert ToDo`; je `insert ToDo` für Leitung | bereit / Bildrechte grün |
| `freigeben` | `{ doctype, name, versand_geplant? }` | Newsletter: `setValue versand_geplant` + `workflowAction` (1 oder 2 Übergänge); Social: `runDocMethod freigeben`; ToDo schließen (`save ToDo status Closed`) | Leitung; Sperrtag/Werbefenster; Vorschau ok; Vier-Augen-Schalter |
| `zurueckgeben` | `{ doctype, name, kommentar }` | `workflowAction` „Zurück auf Entwurf“ bzw. – + `kommentar` + `insert ToDo` an Ersteller | Kommentar Pflicht |
| `jetztVersenden`, `ausgabeAbbrechen` | `{ name, grund? }` | `runDocMethod jetzt_versenden/abbrechen` | Leitung (F7) |
| `versandTerminAendern` | `{ name, termin }` | `setValue versand_geplant` | Leitung, Sperrtag |
| `personenLaden` | Filter | `getList` Abo + Einwilligung + Kontakt | – |
| `bestaetigungsmailErneut` | `{ emails[] }` | je `runDocMethod doi_erneut_senden` | nur Unbestätigt, > 60 min, Versuche (R4) |
| `abmelden` | `{ email, kanal, grund }` | `runDocMethod PH Newsletter Abo.abmelden` | – |
| `keineWerbung` | `{ email, umfang, kanal, grund, beleg? }` | `abmelden` 1× + `runDocMethod widerrufen` je anderem werblichen Zweck; optional `setValue PH Kontakt.nicht_kontaktieren` oder `insert ToDo` an CRM; später A6 | keine doppelten Widerrufe |
| `einwilligungErfassen` | `{ email|kontakt, zweck, kanal, textversion, datei?, bezug? }` | Papier: `uploadFile` + `insert PH Einwilligung` (`erteilung_beleg`, `doi_noetig = 0`); andere Kanäle: Fähigkeit S2 | Papier ohne Datei → `invalid`; nie `doi_noetig = 0` ohne Beleg |
| `bestaetigenMitBeleg`, `widerrufErfassen` | `{ name, … }` | `runDocMethod bestaetigen_mit_beleg/widerrufen` | Leitung bzw. Mitarbeiter |
| `auskunft`, `datenLoeschen` | `{ email }` | `runDocMethod auskunft/loeschen_dsgvo` | Leitung bei Löschen, zulässiger Status |
| `newsletterAnmelden` | `{ email, … }` | A7 (S1) | Fähigkeit |
| `segmentSpeichern`, `segmentVorschau` | `{ id, regeln, speichern }` | `save`/`insert`, `runDocMethod vorschau` | Kriterien je Rolle |
| `reiseSpeichern`, `reiseDuplizieren`, `reiseAktivieren`, `reisePausieren`, `reiseHeutePlanen`, `reiseTestmail` | … | `save` (+ bei aktiver Reise und Regeländerung `setValue aktiv = 0` + `kommentar`), `insert`, `runDocMethod aktivieren/pausieren/heute_planen/testmail` | Leitung; Grundlage „Bestandskunde“ gesperrt (S8) |
| `kampagneAnlegen`, `kampagneSpeichern`, `kampagneWorkflow` | … | `insert`, `save`, `workflowAction` | Leitung für Aktivieren/Beenden |
| `kennzahlErfassen`, `kennzahlenImport` | `{ name, zeilen[] }` | je `runDocMethod kennzahl_erfassen` (Euro → Cent); später A5 | Zahlen, Datum |
| `kampagneAuswertung` | `{ name }` | `runDocMethod anfragen_zaehlen` + `auswertung` | – |
| `eventAnlegen`, `eventSpeichern`, `eventWorkflow` | … | `insert`, `save`, `workflowAction` | `kostenlos = 1` erzwungen (P-M7) |
| `eventAnmeldung` | `{ event, name, email, telefon, personen, quelle, nachricht, einladungenOk? }` | `runDocMethod anmeldung_hinzufuegen` | `einladungenOk` nur mit S3 |
| `teilnehmerStatus` | `{ event, zeile, status }` | `runDocMethod teilnehmer_status` | – |
| `einchecken` | `{ event, zeile|code, personen? }` | A1 bzw. `teilnehmer_status` (Rückfall, Zeile vorher neu lesen) | Doppel-Check-in |
| `checkinFertig` | `{ event, nichtErschienen[], ohneAnmeldung }` | je `teilnehmer_status` „nicht erschienen“ + `kommentar` | – |
| `nachruecken`, `eventAbsagen`, `eventVerschieben`, `personenAendern`, `erinnerungSenden` | … | A2, A3, `workflowAction` „Absagen“, `runDocMethod erinnerung_senden(alle)` | Leitung bei Absagen/Verschieben |
| `socialAnlegen`, `socialSpeichern`, `socialDatumSetzen`, `socialVerwerfen`, `alsVeroeffentlicht`, `socialKennzahlen`, `bildFreigabePruefen` | … | `insert`, `save`, `setValue datum_geplant` (+ `workflowAction` „Planen“ wenn freigegeben), `workflowAction`, `runDocMethod …` | Formate je Kanal, Kennzeichnung |
| `empfehlungAnlegen`, `auftragZuordnen`, `codeSenden`, `empfehlungAblehnen`, `gutscheinSenden` | … | `insert` + `runDocMethod code_senden`, `save auftrag/auftrag_datum`, `runDocMethod ablehnen`; Gutschein über A8 (S7) | Ampeln aus AB/Lieferschein |
| `vorlageSpeichern` | … | `save`, `insert` | Leitung (F8) |
| `einstellungenSpeichern`, `schalterSetzen` | … | `save` (modified), `setValue` + `kommentar` | Leitung; Automatik nur ohne offene P0 |
| `csvExport` | Liste + Filter | Fundament `exportCsvAction` + `kommentar` „CSV exportiert“ | Leitung |

Allgemeine Fundament-Actions (`workflowAktionAction`, `setzeWertAction`, `dokumentMethodeAction`, `massenaktionAction`, `kommentarAction`) werden wiederverwendet, wo keine Bereichsprüfung nötig ist.

### 13.5 Frappe-Aufrufe (Übersicht über `FrappeClient`)
`getList`, `count`, `getDoc`, `getDocMitInfo`, `getValue`, `insert`, `save({ modified })`, `setValue`, `delete`, `getTransitions`, `workflowAction`, `getKanban`, `runDocMethod` (Dokumentmethoden §4.2), `call` (`ph_marketing.ph_marketing.kennzahlen.*`, später Wrapper A1–A8), `searchLink`, `getReport`, `kommentar`, `uploadFile`, `getPdf`, `getMeta` (Fähigkeiten, Feldzuordnung), `hasPermission`. Benutzeraktionen immer mit der Sitzung des Mitarbeiters, nie mit dem Service-Token.

### 13.6 Reihenfolge und Aufwand (Schätzung in Agent-Stunden)

| Schritt | Inhalt | Abhängig von | Aufwand |
|---|---|---|---|
| 0 | `texte.js`, `status.js`, `kuerzel.js`, `regeln.js`, `faehigkeiten.js`, `intern.js`, `mock.js` (Seed + Handler), `marketing/layout.js` (Unternavigation, Bänder) | Fundament: Unternav „Mehr“, `--undo-ms`, verzögerter Commit, Kürzel-Registry | 7 h |
| 1 | Übersicht (Zu tun, Erste Schritte, Kennzahlen, Karten, Mehr Zahlen) | 0, Glocke/ToDo | 4 h |
| 2 | Newsletter-Liste, Ausgabe-Akte, Block-Editor, Autosave/Konflikt, Live-Vorschau, Testmail, Freigabe-Dialog D1, Zurückgeben, Versand/Abbruch, Protokoll | 0, Anwesenheit (optional) | 14 h |
| 3 | Empfänger (Personen/Einwilligungen), Personen-Akte, D3, D4, Bestätigungsmail, Auskunft/Löschen, Weiterleitungen, Anmeldung-Rückfall (QR), `MarketingTab` | 0 | 9 h |
| 4 | Events (Liste, Akte, D5, Warteliste/Nachrücken, Absagen, Erinnerung, Event anlegen) + Kiosk-Check-in (Suche, stabile Zeilen, Code, Gast-Zähler, Offline, Idle, Fertig) | 0, Kiosk-Route, IndexedDB-Warteschlange | 11 h |
| 5 | Social (Kalender, Kanban, Liste, Akte, Bildrechte 3-teilig, D2, Freigabe-Muster, Veröffentlicht) | 0, `Kalender`, `Kanban` | 9 h |
| 6 | Kampagnen (Liste, Akte, Kennzahl-Dialog, CSV-Import, Kampagnen-Link, Auswertung) + Berichte (6, ROI-Hinweis) | 0 | 7 h |
| 7 | Zielgruppen (Editor, Vorschau) + Kundenreisen (Liste, Regel-Editor, Rechtsgrundlage, Protokoll, Duplizieren, M2) + Vorlagen | 0 | 10 h |
| 8 | Empfehlungen (Liste, Akte, Ampeln aus AB/Lieferschein, D6 gesperrt, Code-Dialog) | 0, Faktura/Logistik lesend | 4 h |
| 9 | Einstellungen (Zustandsleiste, Bereitschaft, Schalter, Speicherleiste, Feldzuordnung) + Einblicke | 0 | 4 h |
| 10 | Tests: Unit (Regeln, Glossar-Grep, Kürzel-Doppelbelegung, Fähigkeiten), E2E desktop + iPad inkl. Klickzähler §1, axe, Fehler-Injektion, Mock-Fähigkeiten an/aus | 1–9 | 10 h |
| | **Summe** | | **89 h** |

Die Schätzung setzt die Fundament-Bausteine aus §12.1 voraus; fehlen Anwesenheit und `Kalender`, kommen etwa 3 h (Rückfall-Konflikt) bzw. 5 h (Kalender im Bereich) hinzu. Backend-Arbeiten (§11) sind nicht enthalten.

### 13.7 Übergabe an andere Agenten
- **Fundament-Agent:** Liste §12.1 Zeile Fundament (vor Schritt 0 klären, sonst Rückfälle).
- **CRM-Agent:** `MarketingTab` und D4 einbinden; Werbehinweis-Chip nach P0-4.
- **Shop-/Kassa-Agent:** Aktionsgutschein (P0-9) und Einlösung als Preisnachlass.
- **Backend (ph_marketing u. a.):** §11.1 und §11.3 als Arbeitsliste; nach jedem Stand `faehigkeiten.js` pflegen.

---

## 14. QA-Checkliste (Abnahme)

**Allgemein**
- [ ] Jede Route läuft im Mock ohne Frappe mit Seed (§13.3); Fähigkeiten-Schalter im Mock einzeln an/aus – beide Zustände abgenommen.
- [ ] Unternavigation: je Rolle ≤ 7 sichtbare Einträge inkl. „Mehr“; bei 1 024 px kein horizontaler Scroll; Badge unter „Mehr“ erscheint als Punkt am Knopf.
- [ ] `/marketing/abos…` und `/marketing/einwilligungen…` antworten mit 308 auf die neuen Routen.
- [ ] Text-Grep über `backoffice/src/app/**/marketing/**`, `src/app/(kiosk)/checkin/**`, `components/Backoffice/Marketing/**`, `lib/backoffice/marketing/**` (ohne `texte.js`): „DOI“, „Opt-in“, „Bounce“, „Claim-Guard“, „Slot“, „Preheader“, „Overline“, „UTM“, „ECG“, „Frappe“, „DocType“, „Workflow“, „Jinja“, „Doku“, „.md“ in sichtbaren Strings = 0.
- [ ] Testmodus-Band auf allen Marketing-Seiten bei `testmodus = 1`; höchstens ein Band je Seite.
- [ ] Status-Ton-Test: Widerrufen, Abgemeldet grau; Unzustellbar orange; keine Liste mit rotem Badge für einen Normalzustand; Badges immer mit Text.
- [ ] Jede Liste mit leerem Seed und mit Filter ohne Treffer zeigt Text + Aktion (Snapshot); Kundenreisen/Vorlagen mit 0 Datensätzen zeigen Fehlerblock.
- [ ] Kürzel-Test: keine Einzelbuchstaben außerhalb der Liste §2.0.5; kein Kürzel sendet eine Mail; Strg+Backspace im Block-Textfeld löscht ein Wort, keinen Block; Alt+↓ öffnet den nächsten Datensatz; Einzeltasten abschaltbar.
- [ ] Verzögerter Commit: Zur Freigabe, Verwerfen, Als ausgebucht, Pausieren, Code senden, Kalender-Datum, Check-in – in allen Rollen Toast mit Undo; ⌘/Strg+Z innerhalb `--undo-ms` → kein Server-Aufruf im Mock-Protokoll; nach Ablauf genau einer; `pagehide` committet sofort; Glockenzeile erst nach dem Commit.
- [ ] axe serious/critical = 0 auf Übersicht, Empfänger-Liste, Ausgabe-Akte, Event-Akte, Social-Kalender, Check-in; Fokusring sichtbar hell/dunkel; `prefers-reduced-motion` ohne Bewegung.
- [ ] Klickzähler je Zeile aus §1 als E2E-Schritt.
- [ ] Fehler-Injektion: Testmail, Vorschau, Upload > 25 MB, Versand mit 2 Fehlern, doppelter Check-in, Kalender-Drop – je Fall Text am Ort der Arbeit, kein Vollbildfehler.

**Newsletter**
- [ ] „+ Neue Ausgabe“: 1 Klick → Editor mit Fokus im Betreff; Undo löscht den Entwurf.
- [ ] Ohne Brief oder gefüllten Teil: „Zur Freigabe“ deaktiviert mit Grund und Sprungziel.
- [ ] Bildfeld: keine verbotene Bildquelle wählbar; 0 Serverfehler „nur eigene Fotos“ im E2E-Lauf.
- [ ] Text tippen, 2 s warten, Fenster schließen, in zweitem Browser öffnen → Text vorhanden; zweiter Benutzer sieht „Anna bearbeitet gerade“ (bzw. Rückfall-Konfliktblock).
- [ ] Änderung in „Wartet auf Freigabe“ setzt auf Entwurf zurück (Toast mit Undo).
- [ ] D1: Vorschau-iframe mit `title`; Primärknopf trägt den Termin; Vorschau-Fehler sperrt Freigeben mit Grund; bei 390 px als Bottom-Sheet bedienbar.
- [ ] Sperrtag im Picker nicht wählbar; Server Action lehnt Sperrtag ab.
- [ ] Testmail an externe Adresse → „Testmails nur an interne Adressen“.
- [ ] „Jetzt versenden“ zeigt Empfängerzahl und Testmail-Stand; Fortschritt im Kopf; Teilfehler als Zeile in der Zustandsleiste.
- [ ] Zielgruppen-Auswahl enthält keine Option nach Anrede/Geschlecht.

**Empfänger**
- [ ] Personen-Akte zeigt Abo und alle Einwilligungen einer Adresse.
- [ ] „Keine Werbung mehr“ erzeugt im Mock genau einen `abmelden`-Aufruf und je anderem werblichen Zweck einen `widerrufen`-Aufruf, keinen doppelten Newsletter-Widerruf.
- [ ] Abmelden, Widerruf, Einwilligung erfassen: Bestätigen-Dialog mit Fakten, kein Undo-Toast; Einwilligung zeigt die Zusammenfassung vor dem Speichern.
- [ ] Einwilligung Papier ohne Datei → Feldfehler „Ohne Formular kein Nachweis“; Kanal Telefon ohne Fähigkeit S2 nicht wählbar; nie `doi_noetig = 0` ohne Beleg im Mock-Protokoll.
- [ ] Bestätigungsmail erneut: Abgemeldete/Unzustellbare/Gemeldete/Aktive fehlen in Akte und Massenaktion; Vorschau „n möglich, m übersprungen“ mit Gründen; unter 60 min Tooltip mit Zeit.
- [ ] Nachweis-PDF enthält alle Einträge der Adresse.

**Events / Check-in**
- [ ] Event-Anmeldung über Telefon ohne Einladungs-Schalter erzeugt (nach P0-1) keine Einwilligung „Einladungen“; vor P0-1 ist „Einladung an Zielgruppe“ gesperrt mit Grund.
- [ ] „Veröffentlichen“ ohne Uhrzeit deaktiviert; mit Uhrzeit Bestätigung → Offen.
- [ ] Voll ohne Warteliste → Feldfehler „ausgebucht“; mit Warteliste → Warteliste; doppelte E-Mail → Hinweis, keine zweite Zeile.
- [ ] Kein Knopf „Als durchgeführt“.
- [ ] Check-in (iPad, Mock 46 Anmeldungen): 10 schnelle Tipps an derselben Bildschirmposition checken 10 vorher gesuchte, verschiedene Personen ein; keine Zeile verschiebt sich während der Suche; „‹ Fertig“ fragt nach Nicht-Erschienenen.
- [ ] „+ Gast ohne Anmeldung“ zählt offline; nach „Fertig“ Kommentar mit der Zahl am Event.
- [ ] Doppelter Check-in von zweitem Gerät → „Schon da seit … (anderes Gerät)“.
- [ ] Kiosk-Idle sperrt am Eventtag nicht; Dimmen nach 5 min, Tipp weckt.

**Social**
- [ ] Datum per Drag und per „Datum setzen…“ für jeden Status; Karte „wartet auf Freigabe“ gestrichelt; „+“ am iPad ohne Hover sichtbar; Pfeiltasten wandern durch Tage.
- [ ] „Zur Freigabe“ erzeugt genau eine Glockenzeile; nach 24 h keine zweite.
- [ ] Bildquelle offen → Zur Freigabe/Freigeben deaktiviert, Kanban-Spalte kein Ziel; Kennzeichnung „bezahlt“ ohne „Anzeige“/„Werbung“ im Text → Freigabe gesperrt.
- [ ] Pinterest + Reel nicht wählbar.

**Kampagnen / Berichte**
- [ ] Kennzahl „12,50“ speichert 1 250 Cent; Aggregate ohne Neuladen.
- [ ] Kein Knopf „Anfragen zählen“; „Stand hh:mm“ neben der Zahl.
- [ ] Summenzeile nur Euro, Fremdwährung als eigene Zeile; CHF-Kennzahl ohne Kurs → Feldfehler (nach P1-8).
- [ ] ROI-Bericht vor P1-10 mit Hinweis und ohne ROI-Spalte; nach P1-10: AB netto 1.000 €, Gutschrift 200 € → Umsatz 800 € (Testwerte).

**Kundenreisen / Zielgruppen**
- [ ] Regel-Panel zeigt dieselben Sätze wie `pruefen()`.
- [ ] Aktive Reise: Änderung der Vorlage → Status Entwurf + Band „Regel geändert …“.
- [ ] Grundlage „Bestandskunde“ gesperrt mit Grund (S8).
- [ ] Werbefenster-Zeile: Montag „nicht erlaubt“, 24.12. „Sperrtag“.
- [ ] Zielgruppen-Vorschau zeigt Treffer, anschreibbar, ausgeschlossen mit Gründen.

**Empfehlungen**
- [ ] Empfehlung mit AB Status Offen und abgelaufener Frist: Gutschein gesperrt (Ampel Lieferung); AB storniert → rotes Band, Ablehnen vorbelegt.
- [ ] D6 ohne Fähigkeit S7 gesperrt mit Grund; kein Freitextfeld für einen Gutscheincode.

**Einstellungen**
- [ ] Automatik-Schalter gesperrt, solange P0 offen; Kanzlei-Schalter speichern nach Bestätigung sofort (ohne Speicherleiste) mit Zeitleisten-Eintrag.
- [ ] Geheimnisse nur als Schlüssel-Namen.

**Leistung (05 §13)**
- [ ] Empfänger-Liste (1 500 Zeilen serverpaginiert): erste Zeile < 1 s; Block-Editor Tipp-Latenz < 50 ms; Vorschau nach Autosave < 1,5 s; Check-in-Suche < 50 ms bei 200 Zeilen.

---

## 15. Änderungsprotokoll (erste Fassung 04.11. → finale Fassung 04.11.2026)

### 15.1 Pflichtänderungen UX (`20-kritik-ux-marketing.md` §1)

| Nr. | Umsetzung | Abschnitt |
|---|---|---|
| P1 | 12 Pills → 6 + „Mehr“ (Kundenreisen, Zielgruppen, Empfehlungen, Einblicke, Berichte, Vorlagen, Einstellungen); Badge-Punkt am „Mehr“; Popover 160 ms | §2.0.1 |
| P2 | Abos + Einwilligungen → `/marketing/empfaenger` (Personen · Einwilligungen) + Personen-Akte; „Keine Werbung mehr“; 308-Weiterleitungen | §2.4, §4.4 D4 |
| P3 | Glossar `texte.js`, alle Fachbegriffe ersetzt, „Technische Angaben“ eingeklappt, Abnahme-Grep erweitert | §2.0.3, §14 |
| P4 | Ein Freigabemuster (Zur Freigabe → Wartet auf Freigabe → Freigeben/Zurückgeben…); 24-h-Regel gestrichen; L22 | §2.9, §4.1, §8.2 |
| P5 | Verzögerter Commit für Verwerfen, Als ausgebucht, Pausieren, Zur Freigabe, Code senden – rollenunabhängig | §2.0.6, §4.1 |
| P6 | Kürzel-Regel (nur 02/05-Einzeltasten, Bereich mit Shift, nie Mail per Taste), Block-Editor ⌘/Strg+Shift+↑/↓, Abschalter | §2.0.5 |
| P7 | Check-in: Zeilen bleiben stehen, Rückgängig in der Zeile, Neusortierung erst nach Ruhe, „Nicht da“-Knopf entfernt, Abschluss über „‹ Fertig“, kein Flächenblitz | §7.1 |
| P8 | (a) Anfrage L23/P1-6, (b) „+ Gast ohne Anmeldung“, (c) **ersetzt** durch Fach R1 (E1) | §2.8, §7.1 |
| P9 | Abmelden, Widerruf, Einwilligung erfassen als Bestätigen-Dialog mit Fakten; Zusammenfassung vor dem Speichern; Tippfehler-Prüfung; Korrekturweg | §2.4, §4.4 |
| P10 | Freigabe-Dialog D1 mit Vorschau, Prüfliste, Termin im Knopf | §4.4 D1 |
| P11 | Sperrtag = gesperrt im Picker und in der Server Action; L24 | §2.3 |
| P12 | Server-Autosave, Kopf-Status, keine Speicherleiste im Editor, Anwesenheit/Block-Sperre, Rückfall ohne Diff-Dialog, Rücksetzen auf Entwurf bei Änderung | §2.0.8, §2.3 |
| P13 | Keine Bildquellen-Auswahl im Newsletter, Kontrollkästchen „Eigenes Foto“, leerer Block neutral | §2.3 |
| P14 | Datum setzen für jeden Status, „+“ ohne Hover, Grid-Tastatur, Drop 200 ms | §2.9 |
| P15 | Klickzahlen neu gezählt, je Zeile E2E-Schritt | §1, §14 |
| P16 | „+ Neue Ausgabe“ legt mit einem Klick an; Assistent M0 gestrichen | §2.2 |
| P17 | Gutschein-Dialog D6 ohne Code-Abtippen; gesperrt bis P0-8/P0-9/L25 (E5) | §2.10, §4.4 |
| P18 | Status-Töne für Marketing (Widerruf grau, Wird versendet türkis mit Balken, „Puls 0“ gestrichen) | §2.0.4 |
| P19 | Drei Leerzustände je Liste, „Alles erledigt“, Kein Zugriff, Erste Schritte, Kundenreisen/Vorlagen 0 = Fehler | §2.0.8, §2.1, alle Listen |
| P20 | Fehlerzustände für Testmail, Vorschau, Upload, Teilfehler, doppelten Check-in, Kalender-Drop | §2.3, §2.9, §7.1, §14 |

### 15.2 Empfehlungen UX (20 §2) und Widersprüche (20 §4)

| Punkt | Umsetzung |
|---|---|
| 2.1-1 Kanban nur Social | Newsletter, Kampagnen, Events nur Liste (E7) |
| 2.1-2 Übersicht entschlackt | „Zu tun“ oben, 4 Kennzahlen, 3 Karten, Charts eingeklappt (§2.1) |
| 2.1-3 „Nächste Schritte“ nur ohne Doppelung | §2.0.8 |
| 2.1-4 eine Vorschau, 4 Tabs Ausgabe | §2.3 |
| 2.1-5 Event-Akte 4 Tabs | §2.8 |
| 2.1-6 eine Aktion „Erinnerung senden…“ | §2.8 |
| 2.1-7 Knopf „Anfragen zählen“ gestrichen | §2.7 |
| 2.1-8 „Wieder aktivieren“ aus Beendet | §2.7, §4.1 |
| 2.1-9 Reise duplizieren als Primärweg, M2 nur „Leer beginnen“ | §2.6 |
| 2.1-10 Einwilligung erfassen nur als Dialog, M5 gestrichen | §2.4 |
| 2.1-11 Leitung „Freigeben und planen“ direkt; Vier-Augen offen | E9, §12.2 |
| 2.1-12 keine Maskierung für Marketing, CSV protokolliert | E10 |
| 2.1-13 eine Kennung pro Ausgabe sichtbar | §2.2 |
| 2.1-14 Kanzlei-Schalter speichern sofort | §2.14 |
| 2.2-1…6 Kürzel-Registry, Tabs, Shift+T, Check-in-Tastatur, `m` im Kanban, Regel-Editor-Tab-Reihenfolge | §2.0.5, §2.6, §2.9, §7.1 |
| 2.3-1…10 Zeiger-Alternative Blockmenü, iframe-`title`, Maskierung entfällt, Countdown ohne Live-Region, Zeichenzähler, Abgesagt mit Badge/Kontrast, Zielgrößen, Ampeln als Form, Check-in-Idle, „optional, leer“ | §2.3, §2.4, §2.8, §2.0.4, §7.1 |
| 2.4-1…5 Check-in als Kiosk-Route mit Kachel, Freigabe als Bottom-Sheet, Laptop-Breiten, iPad-3-Tage-Ansicht, Karten unter 768 px | §7, §2.3, §2.9 |
| 2.5-1…8 ≤ 7 Spalten, kompakter Kopf, keine Bodoni-Zahl, keine Donuts, 4 Kennzahlen, Chart-Bewegung nach 03, Drop 200 ms, ein Band | §2.0.2, §2.0.8, §2.1, §5 |
| 2.6-1…9 Widersprüche im alten Text | aufgelöst in §2.3 (Termin ändern nur Leitung), §2.0.6 (kein `window.prompt`), §2.6 (Aktiv · wartet auf Automatik), §2.10 (Frist-Text), §2.4 (eine Sperrregel 60 min), §9.2 (Label-Map Empfehlung), §2.0.5 (`e` je Seitentyp) |
| W1–W13 | Werte §2.0.7 bis zur Entscheidung des UX-Leads |
| 20 §3 Wireframes | übernommen in §2.1, §2.3, §7.1 |
| 20 §7 Abnahme | übernommen in §14 |

### 15.3 Fachkritik (`21-kritik-fach-marketing.md`)

| Punkt | Umsetzung |
|---|---|
| F1, F2 | L11/L12 erledigt; neun Zwecke sichtbar; Kundenreise-Zweck A13 |
| F3 / R2 / K1 / P0-3 | Einwilligung nur Papier mit Beleg sofort wirksam; andere Kanäle mit Bestätigungsmail, bis dahin gesperrt (S2) |
| F4 / R4 / K2 / P0-6 | Bestätigungsmail erneut nur Unbestätigt > 60 min, Server Action filtert |
| F5 / P1-12 / K10 | Ideenleiste entfällt bis Datum optional (E6) |
| F6 / F7 / F8 / P1-9 | „Als durchgeführt“ entfernt; Rollenprüfung in Server Actions; Vorlagen nur Leitung |
| F9 / R6 | ehrlicher Satz zur Event-Löschfrist; Bereinigung P1-2 |
| F10 / K3 | Zwischenlösung `insert` + `doi_erneut_senden` gestrichen; QR-Rückfall auf Website-Anmeldung |
| F11 / P-M4 | „Adresse ändern…“ gesperrt mit Hilfe-Text (S10) |
| U1–U3 | `erschienen_am` vorhanden; Nachrücken/Absage über Wrapper A1–A3 |
| U4–U6 | `erteilung_beleg` genutzt; Telefon/E-Mail optional nach P1-7 |
| U7–U9 | Auftrag als AB-Suche mit Ampeln; Gutschein-Link nach P0-8; Showroom-Empfehlungscode an AB (A15/P0-8) |
| U10–U12 / B3 / B5 / B6 / K8 | Kosten belegt/gemeldet, netto, Währung/Kurs, Anfragen CRM + manuell (§2.7, S13) |
| U13 / L5 | Trockenlauf gesperrt (S9) |
| U14 | Protokollzeile „keine E-Mail“ nach P1-13 |
| U15 / P1-3 / K9 | Freigabe-Rückfall bei Regeländerung, Band; Server Action setzt `aktiv = 0` |
| U16 / P0-10 | Backend; Abnahme dort |
| U17 / R5 / P0-7 / K12 | D4 mit Kontaktsperre; Kundenakte-Einstieg gleich |
| U18 / P1-14 / P-M3 | Link „Anfrage mit Frist anlegen“ (S16) |
| U19 / P0-11 | Testmail nur intern (Server Action) |
| U20 / P-M7 | Kostenbeitrag gesperrt, `kostenlos = 1` erzwungen |
| U21 / U22 / R10 / R11 | Bildrechte dreiteilig, Newsletter-Kundenprojekt-Prüfpunkt |
| R1 / P0-1 / P0-2 / K4 | Einladungs-Schalter (Standard aus) + Bestätigungsmail; Einladungen an Zielgruppe gesperrt (S3) (E1) |
| R3 / P0-4 / P0-5 | Grundlage „Bestandskunde“ gesperrt (S8); Laufzeittabelle umbenannt |
| R7 / P1-1 / K11 | AVV/Transfergrundlage in der Zustandsleiste |
| R8 / P0-8 / K6 / K7 | Schritt „Geliefert und bezahlt“, Ampeln Storno/Lieferung/Zahlung/Frist, Gutschein gesperrt |
| R9 | Verfallen nur Anzeige, Laufzeit `‹Inhaber/Kanzlei›` |
| R12 | keine Zielgruppe/Kriterium nach Anrede/Geschlecht; neutrale Anrede P2-3 |
| R13 | Stopp-Regel Retoure (Laufzeittabelle, P0-5) |
| R14 / B1 / P0-9 | Aktionsgutschein als Preisnachlass (Shop/Kassa), D6 gesperrt |
| B2 | Unternehmer-Empfehler → Gutschrift über Faktura |
| B4 / P1-10 / K13 | ROI netto nach Gutschriften, bis dahin Hinweis ohne ROI-Spalte |
| B7 | Event-Kosten über Kampagne/Eingangsrechnung (P1-8) |
| P-M1 | Werbehinweis bei AB-Druck (A15), Chip in Kundenakte |
| P-M2 | D4 „Keine Werbung mehr“ mit Umfang (E4), A6 |
| P-M5 / P2-1 | Post-Einladung Ausbau, Hinweis bei „Kunde ohne E-Mail“ |
| P-M6 / K5 | Absagen und informieren, Verschieben (gesperrt bis A3) |
| P-M8 / P1-4 | Rücksetzen auf Entwurf bei Änderung |
| P-M9 | Storno-Band, Aufgabe „Gutschein sperren?“ |
| P-M10 / P-M11 | Aufbewahrung in Einstellungen (P1-1/P1-2); Bounce: Webhook vorhanden, Rest A12 |
| 21 §6 Randfälle | §10 |
| 21 §8 Tastenkürzel `d`, `w`, ⇧W | ersetzt durch Shift-Regel (E3): Shift+N Nachrücken (Dialog), Shift+W Keine Werbung mehr (Dialog), Bestätigungsmail ohne Kürzel |
| 21 §9 Akzeptanz | übernommen in §14 |
| 21 §10 Fragen | §12.2 |

### 15.4 Weitere Änderungen dieser Fassung
- Abgleich mit dem gewachsenen Datenbestand: Zielgruppen (PH Segment) als neue Seite unter „Mehr“; Zielgruppe als Newsletter-Option; Check-in per Code (`checkin.py`); Nachrücken automatisch/manuell; Absage-, Nachrück-, Einladungsvorlagen; Mail-Ereignisse/Webhook und erweiterte Versand-Status; Kontaktpunkte und Zuordnungsmodell; CSV-Leser; Lückenliste mit Stand (§11.4).
- Assistenten M0, M1, M3, M5, M6, M7, M8 durch Dialoge ersetzt; M2 bleibt nur für „Leer beginnen“.
- Fähigkeiten-Konzept (§0.3, §11.2) statt stiller Zwischenlösungen.
- Bauauftrag (§13) mit Dateien, Komponenten, Server Actions, Frappe-Aufrufen, Reihenfolge, Aufwand, Abhängigkeiten; QA-Checkliste (§14) zusammengeführt.
- Abschnitt „Was SHD nicht kann“ ohne Wertungen gekürzt (§12.3).

*Ende 10 – Konzept Marketing (finale Fassung).*
