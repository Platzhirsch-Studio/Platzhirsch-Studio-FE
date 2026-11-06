# 10 – Konzept Bereich „Shop“ (Bestellungen, Zahlungen, Gutscheine, Widerruf, Retouren, Anzahlungen, Stripe)

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Shop des Next-Backoffice (`backoffice/`, Port 3100, Routen `/shop/*`) mit Bauauftrag für den Fachbereichs-Agenten „Shop“. Jede Seite, Akte, jeder Knopf mit exakter Frappe-Methode aus `Backend-Import/ph_shop` (Stand v0.2), Zustände, Kürzel, Animationen, Druck, Kiosk-Anteile, Automationen, Datenmapping, QA.
**Stand:** 2026-11-04 · **Fassung 3 (final)** – überarbeitet nach `20-kritik-ux-shop.md` (Runde 2, N1–N20 + Empfehlungen) und `21-kritik-fach-shop.md` (P1–P22, U1–U24, B1–B10, R1–R16, F1–F10); Widersprüche zugunsten von Einfachheit und Rechtskonformität entschieden (§0); Änderungsprotokoll §16 · Rolle: Produktdesigner · Status: Vorschlag, keine Entscheidung des Inhabers. Rechtliche Aussagen sind fachliche Einschätzung, Bestätigung durch Steuerberater (StB) bzw. Kanzlei (§14.6).
**Gelesen:** 01–05, `PLAN-NEXT-BACKOFFICE.md`, `20-kritik-ux-shop.md`, `21-kritik-fach-shop.md`; `ph_shop/README.md` (inkl. „Backoffice-Lücken v0.2“), alle DocType-JSONs (Felder, Pflicht, Rechte), `ph_bestellung.py`, `ph_zahlung.py`, `ph_widerruf.py`, `ph_retoure.py`, `ph_gutschein.py` (Auszug), `api/backoffice.py`, `gutschein_code.py`, `stripe_webhook.py` (`_dispute`), `tasks.py`, `fixtures/workflow.json`; Nachbarn: `ph_faktura/api` (`create_cash_invoice`), `ph_logistik/hooks.py` + `api` (`zugestellt_am`), `ph_kassa` (Seite `ph_kassa.py`), `ph_core/hooks.py` (Hook-Verträge); `backoffice/src` (Struktur, UI-Kit).
**Regeln:** Frappe unsichtbar; Beträge in Cent, Anzeige `1.234,50 €`; Datum de-AT; eine Primäraktion je Sicht; Undo statt Rückfrage, außer bei Geld oder Endgültigem (02 §6); Bewegung nur mit Token aus 04 (`--bo-dur-120|160|200|240`, `--bo-ease-out|in|in-out`), bei `prefers-reduced-motion` ohne Bewegung (nur Überblendung ≤ 120 ms); Farben/Komponenten aus 03; Seitentypen T1–T9 aus 05 §2. Toast Desktop unten rechts, Kiosk oben Mitte.

Begriffe in der Oberfläche: **Bestellung** (PH Bestellung), **Zahlung** (PH Zahlung), **Gutschein** (PH Gutschein), **Gutscheinkauf** (PH Gutschein Bestellung), **Anzahlung** (PH Anzahlung), **Widerruf** (PH Widerruf), **Retoure** (PH Retoure), **Stripe-Ereignis** (PH Stripe Ereignis), **Auszahlung** (PH Stripe Auszahlung). Rollentexte geschlechtsneutral: „Shop-Team“, „Shop-Leitung“, „Geschäftsführung“ (GlBG, R16).

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

| # | Frage / Widerspruch | Entscheidung | Begründung |
|---|---|---|---|
| E1 | Bar/Karte im Backoffice (Fassung 2, UX-N7 „hier kassieren“) ↔ Registrierkassenpflicht (Fach R1/P1) | **Bar, Karte extern, Stripe Terminal gibt es im Backoffice nicht** – weder in „Zahlung erfassen“, noch beim Gutschein, noch bei Erstattungen. Überall derselbe Baustein `AnDieKassa`: „Bar oder Karte? An der Kassa kassieren →“. Im Backoffice bleiben: **Überweisung eingegangen** und **Zahlungslink (Stripe) senden**. Kanal „Verrechnung“ entfällt (U23). | § 131b BAO / RKSV: Barumsatz (inkl. Karte) nur mit Kassenbeleg. Weniger Kanäle = einfacher. |
| E2 | Gutschein im Showroom ausstellen und drucken (Top-Aufgabe F2, N7) | **Verkauf = Kassa** (`ph_shop.api.backoffice.sell_voucher`, baut das Kassa-Konzept). Im Shop nur **„Gutschein ohne Verkauf“** (Kulanz, Ersatz, Gewinnspiel; nur Leitung, Grund Pflicht) über `issue_voucher`. Art fest **Mehrzweck**, Gültigkeit Standard **unbefristet**. | RKSV (E1); Gutschein-USt (R14); Befristung (R13). Die alte S5-Variante „Kassa empfohlen“ ohne Code im Dialog entfällt. |
| E3 | Teilzahlungen gesperrt (F2) ↔ App korrigiert (v0.2) | `zahlung_erfassen` addiert jetzt und setzt `bezahlt` erst bei Vollzahlung → **Teilbetrag frei** mit Live-Satz „offen danach …“. | Codestand §0.1. |
| E4 | Unbezahlte Übergabe (`ist_bezahlt()` zählt `abholbereit` als bezahlt, Fach B1) | **Geldprüfung statt Statusprüfung im Backoffice**: `offen_cent > 0` ⇒ kein „Übergeben“ – Client **und** Server Action prüfen vor `abgeholt_melden`. Solange A1 (§14.1) fehlt: „Abholbereit melden“ nur für **voll bezahlte** Bestellungen; unbezahlte Reservierungen bleiben `reserviert`, Kunde wird über „Ware liegt bereit“ (E-Mail mit Textbaustein, ohne Statuswechsel) informiert und zahlt an der Kassa. Schalter `abholbereitUnbezahlt` schaltet Phasenvariante 3 frei, sobald A1 geliefert ist. | Sonst verlässt unbezahlte Ware das Haus, und `zahlung_erfassen` verweigert die Zahlung einer abholbereiten Reservierung. |
| E5 | Undo-Technik und Esc | **Verzögerter Commit 8 s** (04 §3.6 Variante A) für alles mit Mail, Beleg oder ohne Rückweg; **Variante B** (sofort + Gegenwert) nur für Feldwerte (Zuständig, Notiz, Abholfrist). `Esc` berührt Undo-Toasts **nie**; Abbruch nur per „Rückgängig“/`Z`/`⌘Z`, sofortiges Ausführen nur per Knopf „Jetzt ausführen“. Gleichartige Toasts werden **zusammengefasst**, nie verdrängt. Ausstehende Aktionen sind ein sichtbarer Zustand in Liste, Kanban und Akte (§3.1). | N1–N3; eine Regel, keine Überraschung. |
| E6 | Rechnung erstellen „sofort“ (F2) ↔ Bestätigungspflicht (02 §6.2) ↔ Hook fehlt (ph_faktura) | **Bestätigungsdialog** mit Betrag und Satz „Nummer wird vergeben“; Rechnung frühestens ab **Versand oder Übergabe** (Leistungsdatum, B8). Hook `ph_shop_rechnung_erstellen` ist in ph_faktura nicht registriert → Knopf sichtbar, deaktiviert, Satz „Noch nicht verfügbar – Rechnung in Faktura erstellen“ (Link). | N16, R2, B8, N19. |
| E7 | Storno nach Versand/Abholung (Methode erlaubt es, Workflow nicht) | Storno nur aus `offen · zahlung_ausstehend · reserviert · bezahlt · versandbereit · abholbereit · pruefen · fehlgeschlagen · checkout_fehler`. Aus `versendet · abgeholt · abgeschlossen` heißt der Knopf **„Widerruf erfassen“** bzw. „Retoure/Reklamation“. | B6, Workflow `workflow.json`. |
| E8 | Erstattung, wenn Geld bar/Karte an der Kassa floss | Erstattung dieser Anteile **nur an der Kassa** (Kassa-Auszahlungsbeleg). Shop-Dialoge (Storno, Teilerstattung, Widerruf, Retoure) prüfen alle Eingänge der Bestellung; enthält einer `Bar · Karte extern · Stripe Terminal`, ist die Geldbewegung im Backoffice gesperrt: „Erstattung an der Kassa auszahlen – danach hier stornieren (ohne Erstattung)“. | R1, U9; `_geld_zurueck` würde sonst eine Bar-Gegenbuchung ohne Kassenbeleg erzeugen. |
| E9 | Erstattung bei vorhandener Rechnung (Fach B1/P10) | Existiert eine PH Rechnung zur Bestellung, ist jede Erstattung **gesperrt**, bis der Gutschrift-Hook `ph_shop_gutschrift_erstellen` (ph_faktura) registriert ist: „Erst Gutschrift in Faktura anlegen“ (Link). Ohne Rechnung läuft die Erstattung; die USt-Aufteilung schreibt `teilerstatten` mit. | Rechnung bleibt sonst gültig, Umsatz bleibt gebucht. |
| E10 | Widerruf/Retoure erstatten (Methoden erstatten nur `zahlung_ref`, Status immer `widerrufen`, B4/U6) | Ein Weg für alle Fälle: Server Action `widerrufErstattenAction` nutzt **`PH Bestellung.teilerstatten(zeilen, versand_cent, grund="Widerruf PH-WID-…")`** (positionsgenau, alle Zahlungen, USt je Satz). Fall „Vollwiderruf + genau eine unbare Zahlung“ ruft weiter `PH Widerruf.erstatten(betrag_cent)` (setzt Widerrufsstatus). Sonst zeigt die Widerrufsakte nach der Teilerstattung das Band „Erstattung in Bestellung gebucht · Status-Abschluss folgt mit ph_shop-Änderung (A5)“, Ampel grau. Anzeige an der Bestellung „Teilweise widerrufen“, wenn `status=widerrufen` und `erstattet_cent < betrag_bezahlt_cent`. | Rechtzeitige, richtige Rückzahlung (§ 14 FAGG) geht vor einem sauberen Statuswert. |
| E11 | Widerrufsfrist ab Versand (B5) | Ampel rechnet ab **Zustellung** aus `PH Lieferschein.zugestellt_am` (ph_logistik, vorhanden), sonst „ab Versand – geschätzt“ (`muted`). Weicht `erhalten_am` ab, bietet die Akte „Zustelldatum übernehmen (06.11. lt. Sendungsverfolgung)“ (speichert `erhalten_am`, Server rechnet `frist_ende`/`fristgerecht` neu). Ablehnen mit Grund „Frist überschritten“ nur bei bekannter Zustellung **und** nachweisbarer Belehrung (§3.7). | § 11 Abs 2 FAGG, § 12 FAGG. |
| E12 | Kunde ohne E-Mail (N9a ↔ F6/P9) | `kunde_email` ist Pflicht im DocType. Bis A9: Feldfehler mit Ausweg **„Ohne E-Mail: an der Kassa direkt verkaufen“** + „Leitung fragen“ (Aufgabe). Kein Platzhalter, keine erfundene Adresse. Mit A9: Kontaktweg „Ausdruck“ und Reservierungsbeleg A5. | Keine Sackgasse, keine Scheindaten. |
| E13 | Abschlussweg (FAGG-Belehrung, R11/P20) | Vorhandenes Feld **`bestellart`** (`Online · Telefon · Showroom · Ersatz`): im Dialog Pflicht über die Einstiegswahl (Telefonbestellung / Showroom-Reservierung). Telefon ⇒ immer Zahlungslink (Fernabsatz, Belehrung in der Linkmail); Showroom ⇒ Reservierung mit Zahlung an der Kassa. Belehrungstext je Weg: Kanzlei-Frage §14.6. | Feld existiert, `create_phone_order` setzt es. |
| E14 | Anzahlungen anlegen im Shop (F2) ↔ Faktura (Fach B10, Empf. 3.1) | `/shop/anzahlungen` ist **Kontroll- und Linkansicht**. Anlage nur aus dem Auftrag (Faktura). Route `/shop/anzahlungen/neu` entfällt. | Ein Ort je Schritt; USt/Anzahlungsrechnung gehören in Faktura. |
| E15 | Gutschein einlösen in der Gutscheinakte | Entfällt als freie Buchung. Einlösung entsteht **auf einer Bestellung** (S2) oder **an der Kassa**. Gutscheinakte: „Auf Bestellung anrechnen“ (öffnet S2 mit Bestellsuche) und „Einlösung zurücknehmen“ (Leitung, `cancel_voucher_redemption`). | RKSV (Einlösung im Laden = Zahlungsmittel am Bon), N17 ein Muster. |
| E16 | Kürzel `p`, `k`, WCAG 2.1.4 | Drucken `⌘/Strg+P` (abgefangen → Druckpanel); `p` erst nach Fundament-Entscheidung. `k` = Kundenakte **in Akten** (in Listen bleibt `k` = vorige Zeile, Fokus-Kontext trennt). Benutzereinstellung „Einzeltasten-Kürzel aus“ (Fundament) gilt auch für `Shift+Buchstabe`. | N12, 02/05. |
| E17 | Datenschutz-Tab in Shop-Einstellungen (R15/P21) | **Kein eigener Tab.** Auskunft und Anonymisierung laufen über die Kundenakte (ph_crm, Hook `ph_shop/ph_shop/kontakt.py` vorhanden). `ip_hash` erscheint nirgends in der Oberfläche. | Ein Ort für DSGVO je Person. |
| E18 | Live schalten | Eigener Block „Shop-Modus“ mit Prüfliste; Live nur bei vollständiger Liste (Schlüssel, Webhook-Secret, Simulation aus, Rechtstexte `freigegeben`, StB-Freigabe USt-Regeln). `⌘S` ändert `shop_modus` nie. Ist der Shop bereits live und fehlt ein Punkt: Band `danger-soft` für die Leitung. | N20, R6, F10. |
| E19 | Währung | **Shop nur EUR.** Keine Währungswahl; Bestellungen mit `waehrung ≠ EUR` zeigen Band „Fremdwährung – Leitung prüfen“, Geld-Dialoge sind dort deaktiviert. CHF-Barzahlung → Kassa. | B7, P16. |
| E20 | Funktionen, die der Server noch nicht kann | Eine Regel (N19): **fachlich erwartet** ⇒ Knopf sichtbar, deaktiviert, darunter `muted` 12 px „Noch nicht verfügbar – {Ersatzweg}“ (Ersatzweg als Link); **nicht erwartet** ⇒ ausgeblendet. Freischaltung über `lib/backoffice/shop/schalter.js` (§2.7). | Keine Klicks ins Leere. |

### 0.1 Codestand ph_shop v0.2 (Grundlage dieser Fassung)

| Thema | Stand im Code | Folge im Konzept |
|---|---|---|
| Teilzahlungen (`zahlung_erfassen`) | ✔ addiert, `offen_cent`, Status erst bei Vollzahlung | S1 Teilbetrag frei |
| Storno erstattet alle Eingänge inkl. Gutschein (`_geld_zurueck`) | ✔ | S3 zeigt Verteilung aus `erstattung_vorschau` |
| Teilstorno, Teilerstattung positionsweise, Kulanz, Versandanteil (`positionen_stornieren`, `teilerstatten`, `erstattung_vorschau`) | ✔ Leitung; USt je Satz in `erstattungen[]` | neuer Dialog S9 |
| Ersatzlieferung 0 € (`ersatzlieferung_anlegen`) | ✔ | Aktion „Ersatz liefern“ |
| Telefonbestellung + Zahlungslink (`api.backoffice.create_phone_order`, `zahlungslink_erstellen`, `zahlungslink_senden`) | ✔ | Dialog „Neue Bestellung“ §4.3 |
| Gutschein prüfen / ohne Verkauf ausstellen / Einlösung zurücknehmen (`check_voucher`, `issue_voucher`, `cancel_voucher_redemption`) | ✔ whitelisted | S2 Live-Karte, S5 neu, E15 |
| Übergabe zurücknehmen, Abholcode ohne Fristreset (`abholung_zuruecknehmen`, `abholcode_erneut_senden`) | ✔ | Akte `⋯`, Sekundäraktion |
| `normalisiere_abhol` ersetzt `L` nicht mehr | ✔ | Packtisch ohne Sonderregel |
| Versandbenachrichtigung (`versendet_melden(benachrichtigen=1)`), Auto-Abschluss (`auto_abschliessen_tage`) | ✔ | Undo-Text nennt Mail |
| Angekündigte Zahlung stornieren (`ankuendigung_stornieren`) | ✔ Leitung | Zahlungsakte |
| Zahlungsstreit-Felder (`dispute_*`), Stripe Radar (`radar_*`, `radar_geprueft`) | ✔ Anzeige + Aufgabe; **keine Buchung** | Bänder, Ansicht §4.9 |
| Widerruf: Rückwärtslink bei nachträglicher Zuordnung | ✔ | – |
| `ist_bezahlt()` zählt `abholbereit` als bezahlt | ✘ (B1) | E4, A1 |
| `abholbereit_melden` erlaubt `pruefen` und überschreibt `abholung_bis` | ✘ | N5/N6, A2 |
| Retoure: `erstattungsbetrag_cent` nur bei leerem Feld | ✘ (B3) | Server Action setzt Betrag explizit, A4 |
| Widerruf/Retoure erstatten nur `zahlung_ref`, Status immer `widerrufen` | ✘ (B4/U6) | E10, A5 |
| Widerruf `erhalten_am` = Versanddatum | ✘ (B5) | E11, A6 |
| `stornieren` aus `versendet/abgeholt/widerrufen` | ✘ | E7, A7 |
| `PH Zahlung.validate` ohne RKSV-Regel | ✘ (R1) | E1, A3 |
| Löschrecht `PH Shop Leitung` auf allen DocTypes außer Einstellungen | ✘ (B9) | kein Löschen-Knopf, A8 |
| `kunde_email` Pflicht (Bestellung, Widerruf) | ✘ (U15) | E12, A9 |
| Hooks `ph_shop_rechnung_erstellen`, `ph_shop_gutschrift_erstellen` in ph_faktura nicht registriert | ✘ | E6, E9 |
| Reservierung mit Teilzahlung läuft ab (prüft nur `bezahlt_am`) | ✘ (F4) | Glocke Leitung, A10 |

---

## 1. Nutzer und Top-Aufgaben (gezählte Wege)

Zählregel: ab `/shop` (Bereich offen), sofern die Zeile nichts anderes nennt; jeder Klick/Tipp/Enter zählt, Tippen von Text nicht; Stepper-Klicks werden als „+ Mengenwahl“ ausgewiesen. Jede Zeile wird im E2E über genau diesen Weg gemessen (§12.2).

Rollen (DocType-Rechte): **PH Shop Mitarbeiter** (read/write/create, Zahlung submit) · **PH Shop Leitung** (zusätzlich Storno, Erstattung, Sperren, Einstellungen; Löschen wird in der Oberfläche nie angeboten) · **PH Geschäftsführung** (lesend + Freigabe Erstattung über der Vier-Augen-Grenze `vier_augen_ab_cent`, Standard 1.000 €) · **PH Buchhaltung extern** (Zahlungen, Auszahlungen, Berichte lesend) · **PH Logistik Mitarbeiter** (Bestellungen lesend, Packtisch) · **PH Kassa Mitarbeiter** (Kassa-Kiosk).

### 1.1 Shop-Team (Desktop/iPad)

| Aufgabe | Klicks | Weg |
|---|---|---|
| Bezahlte Versandbestellung packen | **2** | Heute-Chip „Zu packen 4“ (1) → Zeilenknopf „Packen“ (2, Undo 8 s); gesammelt: Chip (1) → Kopf-Checkbox (2) → „Packen“ (3) |
| Abholbereit melden (bezahlt) | **2** | Heute-Chip „Abholung“ (1) → Zeilenknopf „Abholbereit melden“ (2, Undo 8 s); Alternative Kanban: Karte ziehen (1) |
| Überweisung als Zahlung erfassen | **2** ab Akte | „Zahlung erfassen“ (1) → Referenz tippen → „89,00 € buchen“ (2) |
| Versendet melden | **2** ab Akte | „Versendet melden“ (1) → Sendungsnummer vorbefüllt → Enter (2, Undo 8 s, Mail an Kunden) |
| Telefonbestellung mit Zahlungslink | **5** | `+ Neu ▾` (1) → „Telefonbestellung“ (2) → Kunde wählen (3) → Produkt wählen (4) → „Anlegen und Link senden“ (5) |
| Showroom-Reservierung | **5** | `+ Neu ▾` (1) → „Showroom-Reservierung“ (2) → Kunde (3) → Produkt (4) → „Reservieren“ (5) |
| Widerruf: Retoure anlegen | **2** | Heute-Chip „Widerrufe“ (1) → Zeilenknopf „Retoure anlegen“ (2, Undo 8 s). Die Eingangsbestätigung sendet der Server beim Eingang selbst. |
| Bestellstatus am Telefon nennen | **0–1** | ⌘K → Name/Nummer/E-Mail: Treffer zeigt Status, Nächster Schritt, Lieferart (0); Enter öffnet Akte (1) |
| Bestellbestätigung erneut senden | **2** ab Akte | `⋯` (1) → „Bestellbestätigung senden“ (2, Undo 8 s) |
| Gutschein auf Bestellung anrechnen | **2** ab Akte | „Gutschein einlösen“ (1) → Code scannen/tippen → „62,50 € einlösen“ (2) |
| Bar/Karte, Gutschein verkaufen | – | an der Kassa (Kassa-Konzept), Backoffice zeigt `AnDieKassa` |

### 1.2 Shop-Leitung

| Aufgabe | Klicks | Weg |
|---|---|---|
| Bestellung „Prüfen“ klären | **2** | Heute-Chip „Prüfen 1“ (1) → Zeilenknopf „Prüfen“ öffnet Soll/Ist-Dialog → „Übernehmen“ (2) |
| Stornieren und erstatten | **4** ab Akte | `⋯` (1) → „Stornieren & erstatten“ (2) → Grund-Chip (3) → „Stornieren“ (4) |
| Teilerstattung positionsweise | **3 + Mengenwahl** ab Akte | „Erstatten …“ (1) → Menge je Position → Grund-Chip (2) → „289,00 € erstatten“ (3) |
| Gutschein ersetzen (Verlust) | **2** ab Akte | „Ersetzen“ (1) → Bestätigen (2), Code einmalig |
| Gutschein ohne Verkauf (Kulanz) | **4** | Gutscheine (1) → „Gutschein ohne Verkauf“ (2) → Wert-Kachel + Grund-Chip (3) → „Ausstellen“ (4); Drucken `⌘P` |
| Stripe-Fehler nacharbeiten | **2** | `Mehr ▾ › Stripe` mit Ansicht „Fehler“ (1) → „Erneut verarbeiten“ (2) |
| Zahlungsstreit sehen | **1** | Glocke-Eintrag (1) → Zahlungsakte mit Band und Frist |

### 1.3 Geschäftsführung

| Aufgabe | Klicks | Weg |
|---|---|---|
| Erstattung über Grenze freigeben | **3** | Glocke (1) → „Freigeben“ (2) → „1.450,00 € freigeben – bestätigen“ (3, Zwei-Klick-Regel §3.4) |
| Shop-Lage | **0** | Zentrale (GF-Sicht) zeigt die Shop-Kennzahlen |

### 1.4 Packtisch / Kassa (Kiosk, §9)

| Aufgabe | Weg |
|---|---|
| Abholung übergeben (bezahlt) | Scan Abholcode → Karte → „Übergeben an Huber“ (1 Tipp, Undo 8 s) |
| Abholung unbezahlt | Scan → Karte „Offen 89,00 €“ → „Kunde zur Kassa schicken“ (1 Tipp) |
| Abholung ohne Code | „Ohne Code suchen“ → Name/Nummer → „Ausweis geprüft“ (Kästchen) → „Übergeben“ |

### 1.5 Buchhaltung extern

| Aufgabe | Klicks | Weg |
|---|---|---|
| Stripe-Gebühren und Auszahlungen eines Monats | **2** | `Mehr ▾ › Berichte` (1) → „Stripe-Abgleich“ (2) → CSV |
| USt-Werte | – | Bericht `umsatz-ust` trägt bis A13 + StB-Freigabe das Band „Entwurf – nicht für die UVA verwenden“ (§4.11) |

---

## 2. Bereichsstruktur

### 2.1 Routen und Unternavigation

Pills (max. 6, 02 §2.1): **Übersicht · Bestellungen · Zahlungen · Gutscheine · Widerruf & Retouren · Anzahlungen · Mehr ▾** (Stripe – Leitung, Berichte, Einstellungen – Leitung). Aktive Seite unter „Mehr“ gibt dem Knopf ihren Namen („Stripe ▾“) und den Aktiv-Strich (Breite 2 px Sand, Übergang 160 ms `--bo-ease-out`). Eintrag in `bereiche.js` (`navigation[]` Slug `shop`, `startseite: "/shop"`); `ROUTEN`-Register `PH Bestellung → /shop/bestellungen/[name]` usw.; `/d/ph-bestellung/*` → 307.

| Route | Typ | Quelle | Mindestrecht |
|---|---|---|---|
| `/shop` | T1 | Zähler, Kennzahlen, Zu erledigen (§7) | Shop-Team |
| `/shop/bestellungen` (`?ansicht=liste|kanban`, `?neu=telefon|showroom`) | T2/T3 | PH Bestellung | Shop-Team, Logistik lesend |
| `/shop/bestellungen/neu` | 307 → `?neu=telefon` | – | – |
| `/shop/bestellungen/[name]` | T5 | PH Bestellung + Bezüge | Shop-Team |
| `/shop/zahlungen`, `/shop/zahlungen/[name]` | T2/T5 | PH Zahlung | Shop-Team; Faktura, Buchhaltung extern lesend |
| `/shop/gutscheine` (`?tab=gutscheine|kaeufe`, `?neu=1` Leitung) | T2 | PH Gutschein, PH Gutschein Bestellung | Shop-Team |
| `/shop/gutscheine/[name]`, `/shop/gutscheinkaeufe/[name]` | T5 | – | Shop-Team |
| `/shop/widerrufe` (`?segment=widerrufe|retouren`, `?ansicht=liste|kanban`), `/shop/widerrufe/[name]`, `/shop/retouren/[name]` | T2/T3/T5 | PH Widerruf, PH Retoure | Shop-Team |
| `/shop/retouren` | 307 → `/shop/widerrufe?segment=retouren` | – | – |
| `/shop/anzahlungen`, `/shop/anzahlungen/[name]` | T2/T5 | PH Anzahlung | Shop-Team, Faktura |
| `/shop/stripe` (`?tab=ereignisse|auszahlungen`), `/shop/stripe/ereignisse/[name]`, `/shop/stripe/auszahlungen/[name]` | T2/T5 | PH Stripe Ereignis, PH Stripe Auszahlung | Shop-Leitung; Buchhaltung extern Auszahlungen lesend |
| `/shop/berichte/[report]` | T8 | 6 Reports + 2 Kennzahl-Berichte (§4.11) | Shop-Team (Umsatz/USt: Leitung, GF, Buchhaltung) |
| `/shop/einstellungen` (`?tab=shop|versand|gutscheine|rechtstexte|stripe`) | T9 | PH Shop Einstellungen, PH Stripe Einstellungen | Shop-Leitung |

### 2.2 Statusmodell (Anzeige, Ton, Icon – Badge immer Form + Farbe)

Rot nur bei Problemen (N14). Rohwerte erscheinen nie (N13); `lib/backoffice/shop/status.js` liefert `{anzeige, ton, icon}` je DocType und Wert.

**PH Bestellung** (`status`)

| Wert | Anzeige | Ton | Icon |
|---|---|---|---|
| `offen` | Offen | blau | `circle` |
| `zahlung_ausstehend` | Zahlung unterwegs | türkis | `clock` |
| `bezahlt` | Bezahlt | grün | `check` |
| `versandbereit` | Versandbereit | türkis | `package` |
| `versendet` | Versendet | türkis | `truck` |
| `reserviert` | Reserviert | blau | `bookmark` |
| `abholbereit` | Abholbereit | türkis | `shopping-bag` |
| `abgeholt` | Abgeholt | grün | `check-check` |
| `abgeschlossen` | Abgeschlossen | grau | `check` |
| `storniert` | Storniert | grau | `circle-slash` |
| `widerrufen` | Widerrufen (bzw. „Teilweise widerrufen“, wenn `erstattet_cent < betrag_bezahlt_cent`) | grau | `undo-2` |
| `erstattet` / `teilerstattet` | Erstattet / Teilweise erstattet | grau | `undo-2` |
| `abgelaufen` | Abgelaufen | grau | `clock` |
| `fehlgeschlagen` | Zahlung fehlgeschlagen | rot | `circle-x` |
| `checkout_fehler` | Bezahlvorgang fehlerhaft | rot | `circle-x` |
| `pruefen` | Prüfen | rot | `triangle-alert` |

Zusatzkennzeichen (eigene Chips neben dem Badge, `special-soft` bzw. `warning-soft`): „TEST“ (`modus=test`), „Risiko prüfen“ (`radar_markiert=1` und `radar_geprueft_am` leer), „Zahlungsstreit“ (Zahlung mit `dispute_status` offen), „Erstattung wartet auf Freigabe“ (eine Zahlung `Erstattung angefordert`), „Fremdwährung“ (`waehrung≠EUR`).

**PH Zahlung:** Angekuendigt → „Angekündigt“ blau `clock` · Bezahlt grün `check` (+`lock`) · Teilerstattet → „Teilweise erstattet“ grau `undo-2` · Erstattet grau `undo-2` · Erstattung angefordert → „Freigabe offen“ orange `clock` · Fehlgeschlagen rot `circle-x` · Storniert grau `circle-slash`.
**PH Gutschein:** Erstellt blau · Aktiv grün · Teilweise eingeloest → „Teilweise eingelöst“ orange · Eingeloest → „Eingelöst“ grau · Gesperrt rot `lock` · Abgelaufen grau `clock` (mit Rest: orange „Abgelaufen · Rest 37,50 €“) · Erstattet grau.
**PH Widerruf:** Eingegangen blau · Bestaetigt → „Bestätigt“ türkis · Ware erwartet orange `clock` · Ware erhalten türkis · Erstattet grün · Abgelehnt rot.
**PH Retoure:** Angekuendigt → „Angekündigt“ blau · Label gesendet türkis · Unterwegs türkis `truck` · Eingegangen orange · Geprueft → „Geprüft“ türkis · Erstattet grün · Abgelehnt rot.
**PH Stripe Ereignis:** empfangen → „Empfangen“ blau · verarbeitet → „Verarbeitet“ grün · ignoriert → „Ignoriert“ grau · fehler → „Fehler“ rot · wiederholt → „Wiederholt“ grau. **PH Stripe Auszahlung:** angekuendigt → „Angekündigt“ blau · unterwegs → „Unterwegs“ türkis · bezahlt → „Auf dem Konto“ grün · abgeglichen → „Abgeglichen“ grün `check` · fehlgeschlagen rot · storniert grau.
**PH Anzahlung:** offen blau · zahlung_ausstehend → „Zahlung unterwegs“ türkis · bezahlt grün · fehlgeschlagen rot · abgelaufen grau · doppelt → „Doppelt bezahlt“ rot · erstattet/teilerstattet grau · pruefen → „Prüfen“ rot.

### 2.3 Phasenleiste der Bestellungsakte

| Variante | Phasen |
|---|---|
| Versand | `Offen → Bezahlt → Versandbereit → Versendet → Abgeschlossen` |
| Abholung, online bezahlt | `Offen → Bezahlt → Abholbereit → Abgeholt → Abgeschlossen` |
| Showroom-Reservierung (bis A1) | `Reserviert → Bezahlt → Abholbereit → Abgeholt → Abgeschlossen` |
| Showroom-Reservierung (ab Schalter `abholbereitUnbezahlt`) | `Reserviert → Abholbereit → Bezahlt → Abgeholt → Abgeschlossen` („Bezahlt“ = Punkt aus `offen_cent = 0`) |
| Ersatzlieferung (`bestellart=Ersatz`) | wie Versand bzw. Abholung, Punkt „Bezahlt“ heißt „0 € Ersatz“ |

Endzustände erscheinen als Banner, nicht als Phase. Erreichte Punkte sind `<button>` (öffnet Zahlung / Lieferschein / Sendung); nicht erreichte `aria-disabled="true"` mit `aria-label` „Versendet – noch nicht erreicht“; aktuelle Phase `aria-current="step"`; Datum darunter `muted` 12 px. Wechsel des aktuellen Punkts: Füllung 200 ms `--bo-ease-out`.

### 2.4 Testmodus

`PH Bestellung.modus=test`, `PH Zahlung.livemode=0`, `PH Gutschein.test=1` → Chip „TEST“ in Liste, Karte, Akte-Kopf (`title="Testmodus – zählt nicht in Kennzahlen"`). Kennzahlen und Berichte nur live. Listen-Chip „Testdaten anzeigen“ (Standard aus) – überall gleich, nie als Reiter (N10). `shop_modus ≠ live` → Band in der Übersicht „Shop im Testmodus – Mails gehen an {testmodus_mail_an}“ (`special-soft`).

### 2.5 Tastenkürzel (zusätzlich zu 02 §9)

Regel: keine globale Einzeltaste mit anderer Bedeutung; Bereichskürzel nur `Shift+Buchstabe`; Primäraktion `⌘/Strg+Enter` (Seite/Akte/Dialog) bzw. `Shift+Enter` (fokussierte Zeile/Karte). Alle Einzeltasten inkl. `Shift+Buchstabe` sind über die Benutzereinstellung „Einzeltasten-Kürzel aus“ abschaltbar (WCAG 2.1.4); dann wirken nur Kürzel mit `⌘/Strg`/`Alt`.

| Kürzel | Wo | Wirkung |
|---|---|---|
| `g s` | überall | Gehe zu `/shop` |
| `n` | Bestellungen | Menü „Neu“ (Telefonbestellung · Showroom-Reservierung) |
| `1–9` | Listen | Status-Filter n ein/aus; Ziffer steht im Status-Menü neben den ersten 9 Einträgen |
| `s` | Listen, Kanban | Menü „Nächster Schritt“ der fokussierten Zeile (nur erlaubte Methoden, gleiche Undo-Regel) |
| `e` | Akten | springt in den ersten bearbeitbaren Tab, Fokus ins erste Feld |
| `k` | Akten (Bestellung, Widerruf, Zahlung, Retoure) | Kundenakte öffnen |
| `⌘/Strg+Enter` | Akte, Dialog | Primäraktion (Tooltip „Packen · ⌘↵“, `<kbd>` nur im Tooltip, nie im Knopftext) |
| `Shift+Enter` | Liste, Kanban | Primäraktion der Zeile/Karte |
| `Alt+1…9` | Akten | Tab n (Tab-Menge je Akte-Typ fix, §5) |
| `⌘/Strg+P` | Akten | Druckpanel (Browser-Druck abgefangen) |
| `Shift+O` | Zahlungs-/Bestellungsakte | Zahlung im Stripe-Dashboard (neuer Tab; nur mit `payment_intent`) |
| `Shift+R` | Zahlungsakte | Erstatten-Dialog (Leitung) |
| `.` | Akten | Aktionsmenü `⋯` |
| `Z` / `⌘Z` | überall außer Eingabefeldern | jüngste ausstehende Aktion zurücknehmen (in Feldern bleibt `⌘Z` Text-Undo) |
| `←/→` | Widerrufe-/Retouren-Kanban | Fokus Spalte wechseln (kein Verschieben) |

`Esc`-Reihenfolge (festgeschrieben): offenes Menü/Popover → Dialog → Inline-Bearbeitung → Auswahl. `Esc` schließt nie einen Undo-Toast und bricht nie eine laufende Ausführung ab; Abbruch einer Massenaktion über den fokussierten Knopf „Nach diesem Dokument abbrechen“.

### 2.6 Glossar und Texte

| Nicht in Nutzertexten | Stattdessen |
|---|---|
| PI, Payment Intent, Charge | Stripe-Zahlung |
| Refund, Refund-ID | Erstattung, Stripe-Erstattung (ID als Nebentext) |
| AWB, Tracking-ID | Sendungsnummer |
| Carrier | Versanddienst |
| Payout, `po_…` | Auszahlung |
| Event, `evt_…` | Ereignis |
| Balance Transaction | Stripe-Buchung |
| Dispute, Chargeback | Zahlungsstreit |
| Radar, Risk Score | Risiko (Stripe-Prüfung) |
| Session, Checkout Session | Bezahlvorgang |
| Scheduler | „automatisch“ |
| Submit / docstatus 1 | gebucht (Icon `lock`) |

Technische IDs nur als `muted` Mono 12 px mit Kopieren-Knopf. Statustexte mit Umlauten (§2.2). Verlaufszeilen des Servers werden über `texte.js` übersetzt (z. B. „Checkout-Session abgelaufen“ → „Bezahlvorgang abgelaufen“, „(Scheduler)“ → „automatisch“); unbekannte Texte erscheinen unverändert.

Erstbesuchs-Sätze (Band `info-soft`, „Verstanden“ schließt je Benutzer serverseitig):

| Seite | Satz |
|---|---|
| Übersicht | „Oben steht, was heute zu tun ist. Ein Klick auf eine Zahl öffnet die passende Liste.“ |
| Bestellungen | „‚Nächster Schritt‘ zeigt, was jede Bestellung braucht. ⇧↵ führt ihn aus.“ |
| Kanban | „Karte ziehen löst den Schritt aus – Lieferschein, Abholcode, Mail. 8 Sekunden lang lässt er sich zurücknehmen.“ |
| Neue Bestellung | „Die Bestätigung geht 8 Sekunden nach dem Anlegen an den Kunden – vorher lässt sie sich zurücknehmen.“ |
| Zahlungen | „Gebuchte Zahlungen sind gesperrt. Korrigiert wird mit einer Erstattung. Bar und Karte laufen über die Kassa.“ |
| Gutscheine | „Codes sind nirgends im Klartext gespeichert. Verloren? ‚Ersetzen‘ erzeugt einen neuen über den Restwert.“ |
| Widerruf & Retouren | „Die Ampel zeigt die gesetzlichen Fristen ab Zustellung. Rot heißt: heute handeln.“ |
| Anzahlungen | „Anzahlungen entstehen am Auftrag in Faktura. Hier siehst du Zahlungslinks und Zahlungseingänge.“ |
| Stripe | „Jede Nachricht von Stripe steht hier. ‚Erneut verarbeiten‘ erkennt doppelte Buchungen.“ |
| Berichte | „Alle Berichte zählen nur echte Bestellungen, keine Testdaten.“ |
| Einstellungen | „Änderungen wirken auf Website und Mails. Live schalten geht nur über den Block ‚Shop-Modus‘.“ |

### 2.7 Schalter für Server-Funktionen (`lib/backoffice/shop/schalter.js`)

Ein Schalter = eine Funktion, die erst mit einer App-Änderung erscheint. Erkennung: Feld im Meta vorhanden (automatisch) oder Konstante (vom Bau-Agenten bei Lieferung umgestellt). Zustand aus = Regel E20.

| Schalter | Freigabe durch | Aus (heute) |
|---|---|---|
| `abholbereitUnbezahlt` | A1 | Abholbereit nur bei `offen_cent=0`; „Ware liegt bereit“ als E-Mail-Baustein |
| `abholfristBehalten` | A2 | Frist-Hinweis/Dialog nach N5 (§6.2) |
| `rechnung` | ph_faktura Hook | „Rechnung erstellen“ deaktiviert, Link Faktura |
| `gutschrift` | ph_faktura Hook | Erstattung bei vorhandener Rechnung gesperrt (E9) |
| `widerrufPositionen` | A5 | E10-Weg über `teilerstatten` |
| `ohneEmail` | A9 | E12-Ausweg |
| `kassaUebergabe` | ph_kassa K2 | „Kunde zur Kassa schicken“ mit großer Bestellnummer |
| `direktUebergabe` | A11 | Übergabe aus `bezahlt` ruft erst `abholbereit_melden` (Mail geht mit, Hinweis im Dialog) |
| `gutscheinReaktivieren` | A12 | abgelaufener Gutschein mit Rest: Band + „Leitung fragen“ |
| `uvaFreigabe` | A13 + StB | Band „Entwurf – nicht für die UVA“ |
| `zahlungsstreitBuchung` | A14 | Band „Rückbuchung lt. Stripe – im Backoffice noch nicht gebucht“ |
| `fagg18` | A16 + ph_sortiment | Ablehnen-Grund „§ 18 FAGG“ als Text mit Pflichtangabe der Position |
| `retoureGrund` | A17 | Reklamation → Servicefall, Ersatzlieferung |

---

## 3. Bereichsweite Muster

### 3.1 Ausstehende Aktionen (verzögerter Commit, N1–N3)

**Ablauf:** Klick/Zug → Server Action `vormerkenAction({aktion, doctype, name, args})` legt ein Token (TTL 60 s, Server-Store, kein Frappe-Aufruf) an → Client trägt `{token, doc, aktion, start}` in den Speicher `ausstehend` (Fundament, `useAusstehend`) ein → Toast mit Balken 8000 ms linear → nach Ablauf `commitAction({token})` (führt die hinterlegte Methode genau einmal aus) · „Rückgängig“/`Z` → `verwerfenAction({token})`. Bei `pagehide`/Abmelden: `navigator.sendBeacon('/api/undo-commit', {token})`; Ergebnis liegt beim nächsten Laden als Glocken-Eintrag vor („2 Aktionen beim Verlassen ausgeführt – 1 Fehler“). Token ohne Commit nach 60 s → verworfen, Glocke „1 Aktion nicht ausgeführt – bitte wiederholen“.

**Zustand in jeder Sicht** (Liste, Kanban, Akte, Peek lesen denselben Speicher):

```
│ ☐ │ PH-S-261104-0012 │ Fam. Huber │ 369,00 € │ (◌) Versandbereit         │ wird gepackt … Rückgängig │
│   │                  │            │          │ Ring 12 px türkis, Zielton│ Zeilenknopf deaktiviert   │
```

- Badge zeigt Zielstatus mit Ring-Spinner 12 px (`role="status"`, Text „wird ausgeführt“), Untertext `muted` „wird gepackt … · Rückgängig“ (Link, gleiche Wirkung wie Toast).
- Primäraktion des Dokuments deaktiviert, Tooltip „Läuft noch (5 s)“ (Restsekunden je 1 s).
- Erfolg: Ring → Haken (160 ms `--bo-ease-out`), Live-Region `polite` „Lieferschein erzeugt“; Zeile in Arbeitsansicht blendet aus (opacity 160 ms `--bo-ease-in`, Höhe 200 ms `--bo-ease-out`; reduzierte Bewegung: sofort entfernen, Fokus auf nächste Zeile).
- Fehler nach Ablauf: Toast `danger` **ohne** Zeitablauf mit Nummer („Packen PH-S-261104-0012 fehlgeschlagen: {Servertext}“ · „Öffnen“), Glocke „Für mich“, Live-Region `assertive`; Karte/Zeile zurück in den alten Status (200 ms `--bo-ease-out`).

**Toast-Regeln:** max. 3 sichtbar; Toasts mit ausstehendem Commit werden nie verdrängt. Ab dem zweiten gleichartigen Toast: **Sammeltoast** „3 Bestellungen werden gepackt · Rückgängig (alle) · Einzeln ▾“ (Aufklappliste mit „Rückgängig“ je Dokument, Höhe 240 ms `--bo-ease-out`); Balken startet bei jedem Zugang neu. Kein „×“: stattdessen Knopf „Jetzt ausführen“. Massenaktion hebt die Auswahl beim Start auf.

### 3.2 Klassen von Aktionen (eine Klasse je Aktion, §6.3)

| Klasse | Muster |
|---|---|
| **Undo** | verzögerter Commit 8 s (Mail, Beleg, Statuswechsel ohne Rückweg) |
| **Feldwert** | sofort speichern, Toast „Gespeichert · Rückgängig“ setzt alten Wert (Variante B) |
| **Geld** | Dialog, Betrag im Primärknopf, Live-Satz, keine zweite Rückfrage |
| **Bestätigung** | Dialog mit Folge-Satz (Rechnung, Ablehnen, Sperren, Live schalten), Fokus „Abbrechen“ bei `danger` |
| **Zwei-Klick** | nur Freigabe der Geschäftsführung (§3.4) |
| **Sofort** | nur lesend oder idempotent (Erneut verarbeiten, Abgleichen, Schlüssel prüfen) |

### 3.3 Geld- und Kassenregeln (Bausteine)

- `lib/backoffice/shop/geld.js`: `offen(doc) = max(gesamt_cent − betrag_bezahlt_cent, 0)` (bzw. `offen_cent`); `vollBezahlt(doc) = offen(doc) = 0 && (gesamt_cent > 0 || bestellart = "Ersatz")`; `barEingang(zahlungen) = zahlungen.some(z => ["Bar","Karte extern","Stripe Terminal"].includes(z.kanal))`.
- `AnDieKassa` (Komponente): Icon `receipt` + Text „Bar oder Karte? An der Kassa kassieren →“; Wirkung bis K2: Hinweisfläche „An der Kassa Bestellnummer **PH-S-261103-0009** eingeben“ (Mono 24 px) + „Nummer kopieren“; ab K2: legt die Bestellung in „Offen zum Kassieren“, Toast „Bestellung liegt an der Kassa bereit“.
- Server Actions prüfen dieselben Regeln erneut (nie nur der Client).

### 3.4 Zwei-Klick-Freigabe (N8)

```
[ Freigeben ]  → (0–600 ms)   [ 1.450,00 € freigeben – bestätigen ]  opacity .6, aria-disabled
               → (600 ms–10 s) [ 1.450,00 € freigeben – bestätigen ]  aktiv, Ring Sand 2 px
               → Ablauf / Esc  [ Freigeben ]  Überblendung 120 ms --bo-ease-out
```

Breite = Breite des längeren Texts (kein Sprung unter dem Zeiger); Fenster pausiert bei Hover/Fokus; Fokus bleibt auf dem Knopf; Live-Region: „Zum Bestätigen erneut drücken. Esc bricht ab.“; Ziel ≥ 44 px, am Telefon 48 px volle Breite. Muster wird in 02 §6.2 aufgenommen (§14.5).

### 3.5 Listen-Regeln (N10)

Reiter = gespeicherte Arbeitsansicht, nie Duplikat eines Filters; max. 5 + „+“. Filterzeile: Suche + max. 3 feste Filter + „+ Filter“; aktive Filter als entfernbare Chips. Eigene Änderung macht den Reiter „(geändert)“ mit „Als Ansicht speichern“. Summe der gefilterten Menge rechts im Seitenkopf, Summe der Auswahl in der Aktionsleiste. Zeilenknopf „Nächster Schritt“: in Arbeitsansichten immer sichtbar; in „Alle“ bei Hover/Fokus; bei `pointer: coarse` immer. Kartenansicht hängt an der **Container-Breite** (< 640 px), nicht am Gerät (200 % Zoom, WCAG 1.4.10).

### 3.6 Akten-Regeln (N11)

Tab-Menge je Akte-Typ fix (`Alt+n` zeigt immer denselben Inhalt). Bedingte Inhalte sind **Bänder im Kopf** mit Aktion, nie bedingte Tabs. Verlauf führt Status, Versionen, Kommentare und Mails zusammen (Chips „Alle · Status · Mails · Kommentare“). Kein Löschen-Knopf an Bestellung, Zahlung, Gutschein, Gutscheinkauf, Widerruf, Retoure, Anzahlung, Stripe-Datensätzen (BAO § 131/132; Server-Sperre A8).

### 3.7 Rechtliche Prüfbausteine (`lib/backoffice/shop/fristen.js`, rein, unit-getestet)

- `zustellung(bestellung, lieferscheine)` → `{datum, quelle: "Sendungsverfolgung"|"Abholung"|"geschätzt (Versand)"}` aus `PH Lieferschein.zugestellt_am`, `abgeholt_am`, sonst `versendet_am`.
- `belehrungNachweisbar(bestellung)` = `widerrufsbelehrung_stand` gesetzt **und** `mail_status = gesendet` (Bestätigung mit Anhängen). Nein ⇒ Hinweis „Belehrung nicht nachweisbar – Frist kann bis zu 12 Monate länger laufen (§ 12 FAGG)“, Ablehnen wegen Frist gesperrt, Wertminderung gesperrt.
- `widerrufsFristen(widerruf, zustellung)` → Widerruf bis (Zustellung + 14), Rücksendung bis (Eingang + 14), Rückzahlung bis (Eingang + 14, Zurückbehaltung bis Ware oder Absendenachweis).
- `abschliessenAb(bestellung)` = Zustellung + 28 Tage (14 Widerruf + 14 Rücksendung) – darauf richtet sich „Nächster Schritt“ (P19).

---

## 4. Seiten

Gemeinsam: `requireSession()` + `darf(session,"shop",…)`; URL = Zustand; Skeleton nach 300 ms, mindestens 600 ms sichtbar; drei Leerzustände (noch nie Daten · gefiltert leer · alles erledigt); Fehler über `Fehler` mit Code; Zeilen-Schnellmenü (`⋯`/Rechtsklick/`Shift+F10`); Side-Peek 480 px (Einblenden 200 ms `--bo-ease-out`, `translateX 16px→0`) über das Symbol `panel-right` am Zeilenende – Peek-Knopf im Tab-Fluss der Zeile, `Enter` öffnet, Fokus in den Peek, `Esc` zurück zur Zeile. Peek-Zustände: Laden (Skeleton Kopf + 3 Zeilen), Fehler „Vorschau nicht geladen · Erneut“, gelöscht „Nicht mehr vorhanden“.

### 4.1 `/shop` – Übersicht (T1)

```
┌ Zentrale › Shop                                                              [+ Neu ▾] ┐
│ Shop                                     Übersicht · Bestellungen · Zahlungen · …       │
│ ▌Shop im Testmodus – Mails gehen an info@…                               (nur wenn)    │
│ HEUTE [Zu packen 4 · 1 seit gestern] [Abholung 2 · 1 Frist morgen] [Prüfen 1] [Widerrufe 3] [Freigabe 1*] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ZU ERLEDIGEN (max. 8, nach Dringlichkeit)                                    Alle →    │
│ [triangle-alert] Prüfen     PH-S-261103-0007  Soll 169,90 € · Ist 159,90 €   [Prüfen]  │
│ [shield-alert]  Risiko      PH-S-261104-0015  Stripe-Prüfung erhöht          [Ansehen] │
│ [shopping-bag]  Abholbereit PH-S-261030-0004  M. Berger · bis morgen         [Übergeben]│
│ [package]       Bezahlt     PH-S-261104-0012  Fam. Huber · ruht 2 Tage       [Packen]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ BESTELLUNGEN HEUTE ┐ ┌ ZAHLUNG UNTERWEGS ┐ ┌ EINGÄNGE MONAT* ┐ ┌ GUTSCHEIN-RESTWERT* ┐ │
│ │ 6                  │ │ 3 · älteste 19 h  │ │ 12.480,00 €     │ │ 4.325,00 €          │ │
│ └────────────────────┘ └───────────────────┘ └─────────────────┘ └─────────────────────┘ │
│ ┌ STRIPE* ─ Fehler 7 Tage 0 · Letzter Abgleich 05:00 · Ohne Auszahlung 2 · Streit 0 ┐   │
│ ┌ EINGÄNGE JE WOCHE* (Balken) ┐ ┌ ZAHLUNGEN NACH KANAL* (waagrechte Balken) ┐          │
└────────────────────────────────────────────────────────────────────────────────────────┘
* nur Leitung/GF
```

- Reihenfolge „oben Arbeit, unten Zahlen“. Shop-Team sieht Heute-Leiste, Zu erledigen und 2 Kacheln (Bestellungen heute, Zahlung unterwegs). Leitung/GF zusätzlich 2 Geldkacheln, Stripe-Karte, 2 Charts.
- Heute-Chips verlinken gefiltert (`?ansicht=zu-packen`, `?ansicht=abholung`, `?ansicht=pruefen`, `/shop/widerrufe?ansicht=offen`, `/shop/zahlungen?ansicht=freigabe`). Wert 0: `<span>` `muted` mit `aria-label="Zu packen: keine"`, nicht klickbar.
- Zu erledigen: `pruefen` → Risiko offen → Zahlungsstreit mit Frist → `abholbereit` mit `abholung_bis ≤ morgen` → `bezahlt` nach `bezahlt_am` (ab 2 Tagen „ruht seit n Tagen“ `warning-text`) → Widerruf mit Rückzahlung ≤ 3 Tage → abgelaufene Reservierung mit Zahlung (F4, Leitung). Primäraktion als Knopf mit Undo-Regel.
- `+ Neu ▾`: Telefonbestellung · Showroom-Reservierung · Gutschein ohne Verkauf (Leitung).
- **Leer:** (a) noch nie Bestellungen: Checkliste „Shop einrichten“ (Stripe-Schlüssel ✓/✗ → Testbestellung auf der Website → Live schalten, Leitung); (b) alles erledigt: Icon `check` 32 px Sand, „Alles erledigt – nichts zu packen, keine Abholung offen.“, Kacheln bleiben; (c) Kachel-Fehler je Kachel „Nicht geladen · Erneut“; (d) GF ohne Freigabe: Chip „Freigabe 0“ grau.
- Jede Kachel eigenes `<Suspense>`; kein Hochzählen beim Erstaufbau; Trend nur mit Vergleichswert.

### 4.2 `/shop/bestellungen` – Liste (T2)

```
┌ Zentrale › Shop › Bestellungen                                  [+ Neu ▾]  Liste | Kanban  [CSV] ┐
│ Bestellungen                                        142 Bestellungen · 14.230,00 €               │
│ Ansichten: Alle · Zu packen 4 · Abholung 3 · Prüfen 1 · Meine · [+]                                │
├ [search Nummer, Name, E-Mail, Sendungsnr.] [Status ▾] [Lieferart ▾] [Zeitraum ▾] [+ Filter]  (Bezahlt ×) │
├ ☐ │ Nummer ↓        │ Kunde                │ Gesamt   │ Status              │ Nächster Schritt          │ Bestellt   │ Zust. │ ⋯ ┤
│ ☐ │ PH-S-261104-0012│ Fam. Huber · Lochau  │ 369,00 € │ [check] Bezahlt     │ [truck] Packen · vor 2 h [Packen] │ heute 09:10│ (DB) │ ⋯ │
│ ☐ │ PH-S-261103-0009│ M. Berger · Bregenz  │  89,00 € │ [bookmark] Reserviert · Offen 89,00 € │ [bag] An der Kassa · bis 11.11. │ gestern │ – │ ⋯ │
│ ☐ │ PH-S-261103-0007│ A. Beispiel · Wien   │ 169,90 € │ [△] Prüfen          │ Soll ≠ Ist −10,00 €       │ 03.11.     │ (SL) │ ⋯ │
├ 25 von 142 · ‹ 1 2 3 … 6 ›  [25|50|100]                                                                   ┤
└ Auswahl (2) · 458,00 €: [Packen] [Abholbereit melden] [Abschließen] [Zuständig ▾] [Drucken] [Mehr ▾] ┘
```

- **Spalten (7, ohne horizontalen Scroll ab 1180 px):** Nummer (Mono 12), Kunde (+ Ort `muted`), Gesamt (tabular, rechts), Status (Badge + Zusatzchips §2.2; bei `offen_cent > 0` und Status `reserviert|abholbereit` zweite Zeile „Offen 89,00 €“ `warning-text`), Nächster Schritt (§6.1, Lieferart-Icon mit `aria-label`, Zeitsignal, Zeilenknopf), Bestellt (relativ < 24 h), Zuständig (Avatar 24). Wählbar: Positionen, Zahlungsweg, Bestellart, Bezahlt am, Versendet am, Sendungsnummer, Land, Sprache, Quelle, Rechnung gewünscht, Bestätigung (`mail_status`).
- **iPad quer (1024–1279):** 4 Spalten – Nummer · Kunde · Gesamt · Status mit Nächstem Schritt in derselben Zelle (Zeilenknopf darunter); Positionen im Peek.
- Filter: Status (Mehrfachauswahl, Reihenfolge Arbeitsfluss, Endzustände unten abgetrennt), Lieferart, Zeitraum; „+ Filter“: Zahlungsweg, Bestellart, Zuständig, Land, Quelle, Risiko, Testdaten. Volltext über `name`, `kunde_name`, `kunde_email`, `kunde_telefon`, `payment_intent`, `awb`, `abholcode`.
- Ansichten: „Zu packen“ (`status=bezahlt & lieferart=versand`), „Abholung“ (`lieferart=abholung & status in reserviert,bezahlt,abholbereit`), „Prüfen“ (`status=pruefen` oder Risiko offen), „Meine“ (`zugewiesen_an=ich`); eigene Ansichten serverseitig je Benutzer.
- Sortierung: Arbeitsansichten nach Fälligkeit des Nächsten Schritts; „Alle“ nach `angelegt` absteigend.
- Inline (Klasse Feldwert): `zugewiesen_an`; `notiz_intern` im Peek (Autosave 1 s, Hinweis „gespeichert“ 120 ms Überblendung); `abholung_bis` nur bei `reserviert|abholbereit` → Toast „Abholfrist auf 12.11. gesetzt · Kunde ist nicht informiert“ + „E-Mail schreiben“ (Composer mit Baustein); bis eine Mail an `kunde_email` im Verlauf steht, trägt die Akte „Abholfrist geändert, Kunde nicht informiert“ (`warning-text`).
- **Massenaktionen** (Vorschau „3 von 5 möglich – 2 übersprungen“, Drawer mit Grund je Zeile): **Packen** (`bezahlt & versand`, ohne Band „Steuerfall klären“), **Abholbereit melden** (`bezahlt|reserviert & abholung & offen_cent=0`; `pruefen` → „übersprungen (zuerst prüfen – Leitung)“; unbezahlt → „übersprungen (erst nach Zahlung)“), **Abschließen** (`versendet|abgeholt`, ab `abschliessenAb`), **Zuständig**, **Drucken** (max. 50), unter „Mehr“: **CSV** (Recht export), **Bestätigung senden**, **Stornieren …** (Leitung, S8). Alle Undo-Aktionen als ein Sammeltoast; danach sequenziell, Fortschritt im Knopf „2/3“, Live-Region alle 5 Dokumente und am Ende.
- Zeilen-Schnellmenü: Öffnen · In neuem Tab · Kundenakte · Zahlungen · Bestätigung drucken · Zuständig · Stornieren (Leitung).
- **Leer:** noch nie: „Noch keine Bestellungen. Sie kommen von der Website oder entstehen hier als Telefonbestellung oder Reservierung.“ + „Neu ▾“; gefiltert: „Keine Bestellungen für diese Filter“ + „Filter zurücksetzen“; Arbeitsansicht leer: „Alles erledigt.“ (`check`); Fehler: Zeilenbereich `Fehler`, Filterleiste bleibt.
- Telefon (< 640): Karten „Nummer · Kunde · Gesamt · Status · Nächster Schritt“, Filter als Bottom-Sheet, Langdruck = Auswahl.

### 4.3 Dialog „Neue Bestellung“ (`?neu=telefon|showroom`, lg 800 px)

Grundlage `ph_shop.api.backoffice.create_phone_order(kunde, positionen, lieferart, adresse, versand_cent, notiz_kunde, kontakt, bestellart, zahlungslink, senden=0, sprache, idempotency_key)`. Der Dialog sendet **immer `senden=0`**; Mail bzw. Zahlungslink gehen als Undo-Aktion 8 s nach dem Anlegen (N9b).

```
┌ Telefonbestellung ───────────────────────────────── [Telefon | Showroom-Reservierung] [x] ┐
│ Kunde *      [search Name, E-Mail, Telefon …                    ] [+ Neu]               │
│              Fam. Huber · huber@gmial.com · +43 …                                       │
│              [triangle-alert] Meinten Sie gmail.com?  [Übernehmen]                      │
│ Lieferung    ((Versand)) (Abholung)        Adresse aus Kontakt [ändern]                 │
│ Positionen * [img] Leuchte „Seelicht“ Messing  [ 1 ] × 289,00 € [lock]  Lager 2 [x]     │
│              [search Produkt, Marke, EAN …                                       ]      │
│ Versand      DHL Paket · 9,90 €  (Pauschale AT)                                         │
│              Summe 298,90 € · enth. USt 49,82 € (20 %)                                  │
│ Notiz an Kunden [                         ]   Interne Notiz [                        ]  │
│──────────────────────────────────────────────────────────────────────────────────────────│
│ Zahlungslink und Bestätigung gehen an **huber@gmail.com** [ändern]                       │
│                                         [Abbrechen]  [Anlegen und Link senden ⌘↵]        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feld | Regel |
|---|---|
| Segment Telefon / Showroom-Reservierung | setzt `bestellart`; Showroom erzwingt `lieferart=abholung` (Server: `zahlung=vorort`); Telefon: Versand oder Abholung, immer Zahlungslink |
| Kunde | Link-Suche PH Kontakt (ph_crm) → `kontakt`, Name, E-Mail, Telefon; „+ Neu“ Mini-Formular (Vorname, Nachname, E-Mail Pflicht, Telefon). E-Mail-Prüfung clientseitig: Format, fehlende Endung, häufige Verdreher (`gmial`, `gmx.ar`, `hotmial` …, Liste in `emailTipp.js`) → `warning` unter dem Feld mit „Übernehmen“ |
| Ohne E-Mail | Feldfehler „Für eine Bestellung braucht es eine E-Mail-Adresse – dorthin gehen Bestätigung und Abholcode.“ + Auswege **„An der Kassa direkt verkaufen“** (schließt Dialog, `AnDieKassa`) · **„Leitung fragen“** (PH Aufgabe mit allen Eingaben). Mit Schalter `ohneEmail`: Kontaktweg „Ausdruck“ |
| Positionen | `getList` PH Produkt (ph_sortiment: `titel`, `marke`, `ean`, `hersteller_artikelnr`, `bild_hauptbild`, `aktueller_preis_cent`, `preisart`, `ust_klasse`); Preis gesperrt (`lock`, Text „Preis aus Sortiment“), nur Leitung änderbar; `Enter` übernimmt ersten Treffer, `↑/↓` wählt. Bestand: „Lager 2 · Showroom 1“ bzw. „nicht lagernd“ (`warning`, übernehmbar), sobald ph_logistik den Bestand lesbar liefert (L3) – bis dahin keine Bestandszeile |
| „Preis auf Anfrage“ | Shop-Team: Knopf „Leitung fragen“ (Aufgabe mit Produkt + Kunde), Dialog bleibt offen; Leitung: Preisfeld frei |
| Kein Treffer | „Kein Produkt gefunden.“ + „Leitung fragen“ |
| Lieferung (Telefon) | Adresse Pflicht bei Versand; CH-Versand nicht angeboten (Server-Regel, Text „Versand in die Schweiz wird nicht angeboten – Abholung möglich“) |
| Versand | `versand_cent` aus Pauschalen der Einstellungen (`versand_pauschale_at_cent`, `_de_cent`, frei ab `versand_frei_ab_cent`); Leitung änderbar |
| Reserviert bis (Showroom) | Platzhalter `muted` = berechneter Wert (`reservierung_frist_tage`); nur bei Änderung gesendet (max. +30 Tage) |
| Summe/USt | live (Anzeige); maßgeblich ist der Serverwert |
| Währung | fest EUR, kein Feld (E19) |

- Primär Telefon: „Anlegen und Link senden“ → `create_phone_order(..., zahlungslink=1, senden=0, idempotency_key)` → Akte öffnet → Undo-Toast „Zahlungslink über 298,90 € an h…@… wird gesendet · Rückgängig“ → Commit `zahlungslink_senden()`.
- Primär Showroom: „Reservieren“ → `create_phone_order(bestellart="Showroom", lieferart="abholung", senden=0)` → Undo-Toast „Reservierungsbestätigung an h…@… wird gesendet“ → Commit `bestaetigung_senden()`.
- Rückgängig nach dem Anlegen: Mail/Link unterbleibt, Bestellung bleibt angelegt; Toast „Bestellung angelegt, nichts gesendet · Jetzt senden“.
- Zustände: Produktsuche lädt (Spinner im Feld nach 300 ms), Sortiment nicht erreichbar („Produktsuche nicht verfügbar · Erneut“, Eingaben bleiben); Serverfehler am Feld; Schließen mit Eingaben → „Entwurf verwerfen?“; Doppelklick auf Primär → gleicher `idempotency_key`, eine Bestellung.

### 4.4 `/shop/bestellungen?ansicht=kanban` (T3)

```
Bahn-Chip: Versand | Abholung | Alle
Versand:  [Offen 3] [Zahlung unterwegs 2] [Bezahlt 4] [Versandbereit 2] [Versendet 5]
Abholung: [Reserviert 1] [Abholbereit 2] [Abgeholt 3]        (Zahlstand auf der Karte)
Immer:    [triangle-alert Prüfen 1] (Rand danger, Leitung) · Ablagefläche „Abschließen“ 48 px rechts, nur beim Ziehen
```

- Karte: Nummer Mono · Alter · Kunde · Gesamt · bis 2 Positionen (Bild 28 px) · Fuß: Lieferart-Icon, Avatar, Frist-Badge (`abholung_bis` ≤ morgen orange, überschritten rot + `triangle-alert`), Zahlstand („Offen 89,00 €“ `warning` / „Bezahlt“ `check`), Zusatzchips.
- Erlaubte Züge (Dokumentmethoden, nie generisches Setzen): `bezahlt → versandbereit` (`packen`) · `versandbereit → versendet` (Mini-Dialog Sendungsnummer/Versanddienst vorbefüllt, dann Undo) · `bezahlt → abholbereit` und `reserviert → abholbereit` **nur bei `offen_cent=0`** (`abholbereit_melden`) · `abholbereit → abgeholt` nur bei `offen_cent=0` (`abgeholt_melden`) · `versendet|abgeholt → Abschließen` (`abschliessen`) · `pruefen → bezahlt` (Leitung, Soll/Ist-Dialog, Workflow „Als geprüft übernehmen“).
- Beim Ziehen: nicht erlaubte Spalten `opacity .5` (120 ms). Ablageversuch dort → Karte zurück (200 ms `--bo-ease-out`), Toast + Live-Region mit Grund („Von ‚Bezahlt‘ nach ‚Versendet‘ gibt es keinen Übergang – zuerst Packen.“ / „Erst nach Zahlung – an der Kassa kassieren.“).
- Erlaubter Zug: Karte sofort in Zielspalte mit Ring 16 px (§3.1), Undo-Toast; Rückgängig → Karte zurück 200 ms.
- Tastatur 02 §9.3: `m` Verschieben-Menü nur mit erlaubten Zielen; `Shift+Enter` Primäraktion; `s` Nächster Schritt.
- iPad/Touch: Tipp auf Karte → „Verschieben“ (Sheet mit erlaubten Zielen).
- Leer: Spalte „Keine Bestellungen“ (`muted` 13 px); Bahn „Abholung“ ganz leer: „Keine Abholungen offen.“ (N18); Board leer wie Liste.

### 4.5 `/shop/zahlungen` – Liste (T2)

```
┌ Zentrale › Shop › Zahlungen                                                   [+ Zahlung erfassen] ┐
│ Ansichten: Alle · Erstattungen · Freigabe nötig* · Ohne Auszahlung* · Zahlungsstreit* · [+]          │
├ [search Nummer, Bezug, Referenz, Betrag €] [Status ▾] [Kanal ▾] [Zeitraum ▾] [+ Filter]   Eingang 4.230,00 € │
│ ☐ │ Nummer        │ Zeitpunkt     │ Art · Kanal              │ Bezug                │ Betrag    │ Status          │ Auszahlung │
│ ☐ │ PH-ZAH-26-0101│ heute 09:12   │ Eingang                  │ Bestellung PH-S-…0012│  369,00 € │ [check] Bezahlt [lock] │ –    │
│   │               │               │ Stripe Checkout (muted)  │                      │           │                 │            │
│ ☐ │ PH-ZAH-26-0100│ gestern 16:40 │ [undo-2] Erstattung      │ zu PH-ZAH-26-0087    │  −89,00 € │ [check] Bezahlt [lock] │ 06.11. │
├ Summe gefiltert: Eingang 4.230,00 € · Erstattet 89,00 € · Netto 4.141,00 €                                  ┤
└ Auswahl (2): [Auszahlung zuordnen] [Beleg drucken] [CSV]                                                    ┘
* Leitung/GF
```

- 7 Standardspalten (Nummer · Zeitpunkt · Art+Kanal zweizeilig · Bezug-Chip · Betrag · Status · Auszahlung als Datum); wählbar: Gebühr, Kontakt, Zahlungsreferenz, Quelle, Live/Test. Erstattung mit `undo-2`, Minus, Ton `ink` – nie rot.
- Filter: Status, Kanal, Zeitraum; „+ Filter“: Art, Bezugstyp, Quelle, Testdaten. Volltext `name`, `bezug`, `stripe_payment_intent`, `stripe_charge`, `zahlungsreferenz`, `bank_referenz`, `kontakt`; Betragssuche „€ 89“ (05 §6.1).
- „+ Zahlung erfassen“ = Bestellsuche (Link-Suche PH Bestellung mit `offen_cent > 0`) → S1 in derselben Dialoghülle. Andere Bezüge (Rechnung, Anzahlung) gehören in Faktura, Kassenbelege in die Kassa (E1, E14).
- Massenaktionen: Auszahlung zuordnen (`auszahlung_zuordnen`, Combobox, Klasse Feldwert), Beleg drucken („PH Zahlungsbeleg“), CSV (Recht export).
- Leer: noch nie „Noch keine Zahlungen. Sie entstehen über Stripe, die Kassa oder eine erfasste Überweisung.“; gefiltert „Keine Zahlungen für diese Filter“; „Freigabe nötig“ leer „Keine Erstattung wartet auf Freigabe.“; „Zahlungsstreit“ leer „Kein Zahlungsstreit offen.“; „Ohne Auszahlung“ leer „Alle Stripe-Zahlungen sind einer Auszahlung zugeordnet.“

### 4.6 `/shop/gutscheine` (T2, Tabs Gutscheine | Gutscheinkäufe)

```
┌ Zentrale › Shop › Gutscheine                                       [+ Gutschein ohne Verkauf]* ┐
│ Tabs: Gutscheine · Gutscheinkäufe (online)                                                     │
│ Ansichten: Alle · Offen · Läuft ab (30 Tage) · [+]                                             │
├ [search letzte 4 Zeichen, Käufer, Empfänger] [Status ▾] [Ausgabe ▾] [Zeitraum ▾] [+ Filter]    │
│ ☐ │ Nummer       │ Code      │ Wert     │ Rest     │ Status              │ Ausgabe   │ Käufer → Empfänger │ Gültig bis │
│ ☐ │ PH-GS-26-0031│ ····-7K3Q │ 100,00 € │  62,50 € │ Teilweise eingelöst │ Kassa     │ A. Beispiel → Rosa │ unbefristet│
├ Restwert gefiltert (Verbindlichkeit): 4.325,00 € · davon ohne Verkauf 120,00 €                                   ┤
└ Auswahl (2): [PDF senden] [Sperren]* [CSV]                                                                       ┘
* Leitung
```

- Code nie im Klartext; Spalte `code_letzte4` als `····-XXXX`; Suche nur über die letzten 4 Zeichen (Client kürzt vollständige Eingabe).
- Rest-Balken 4 px (`aria-hidden`), Wert als Text daneben.
- Ansicht „Offen“ = `status in Erstellt, Aktiv, Teilweise eingeloest` + `Abgelaufen` mit `rest_cent > 0`.
- Restwert-Summe zählt `rest_cent` aller Status außer `Eingeloest`, `Erstattet`, `Gesperrt` mit `sperrgrund_art=Ersetzt` (B10); „ohne Verkauf“ = weder `zahlung` noch `ausgabe_beleg` noch `gutschein_bestellung` (B6).
- Massenaktionen: PDF senden (`pdf_senden` nur mit gespeicherter PDF), Sperren (Leitung, Dialog Grund + `sperrgrund_art`, `danger-solid`, Fokus „Abbrechen“), CSV.
- Tab Gutscheinkäufe: `name`, `erstellt`, Käufer, Anzahl × Betrag = Summe, Status, `mail_gesendet_am`, ausgestellte Gutscheine (Zähler), Live/Test; Massenaktion „Gutschein-Mail erneut senden“ (Undo).
- Leer: noch nie „Noch keine Gutscheine. Verkauft wird an der Kassa oder online.“; gefiltert „Keine Gutscheine für diese Filter“; „Läuft ab“ leer „In den nächsten 30 Tagen läuft kein Gutschein ab.“; Gutscheinkäufe leer „Noch keine Online-Gutscheinkäufe.“

### 4.7 `/shop/widerrufe` – Widerruf & Retouren (T2/T3)

Segment **Widerrufe | Retouren**, je Liste | Kanban. Widerrufe-Liste mit Zeilenknöpfen wie die Bestellliste.

```
Widerrufe – Kanban: [Eingegangen 1] [Bestätigt 2] [Ware erwartet 1] [Ware erhalten 0] [Erstattet]
Karte: PH-WID-26-0007 · Fam. Huber · Bestellung PH-S-… (oder „nicht zugeordnet“ rot)
       Ampel „Rückzahlung bis 18.11. · 12 Tage“ · Fuß-Knopf Primäraktion (z. B. „Retoure anlegen“)
```

- Ampel: grün > 7 Tage, orange ≤ 7, rot überschritten (+ `triangle-alert`), immer mit Text; Quelle der Frist als `muted` Nebentext („ab Zustellung lt. Sendungsverfolgung“ / „geschätzt ab Versand“). Erstattet: grau „erledigt“.
- Ansichten: Offen (Standard) · Alle · Rückzahlung ≤ 7 Tage · Nicht zugeordnet · [+]. Filter: Status, Kanal, Zeitraum.
- Spalten: Nummer, Eingang, Kanal, Kunde, Zuordnung, Status, Fristen (Ampel), Eingangsbestätigung (`mail_status` als Anzeige: gesendet · nicht gesendet · Limit erreicht · fehlgeschlagen · Testmodus), Betrag.
- Zeilenknopf = Primäraktion; nach „Eingangsbestätigung senden“ wird er zu „Retoure anlegen“ (keine Kette nur über flüchtige Toasts).
- Kanban: kein Ziehen (`cursor: default`); `Enter` öffnet Akte, `Shift+Enter` Primäraktion, `←/→` Spaltenfokus, `m` zeigt „Keine Verschiebung – Schritte laufen über die Karte oder die Akte“.
- Retouren: Kanban `Angekündigt · Label gesendet · Unterwegs · Eingegangen · Geprüft`; einziger Zug `→ Eingegangen` (`eingegangen()`, Undo). Liste: Nummer, angekündigt, Bestellung, Widerruf, Weg (Rücksendung/Showroom), Status, Eingang, Wertminderung, Erstattungsbetrag.
- Massenaktionen Widerrufe: Eingangsbestätigung senden (Undo), Zuständig, CSV. Retouren: Eingegangen (Undo), Begleitschein drucken, CSV.
- Leer: Offen leer „Keine offenen Widerrufe.“ (`check`); noch nie „Noch keine Widerrufe. Sie kommen über das Website-Formular oder werden in einer Bestellung erfasst.“; gefiltert „Keine Widerrufe für diese Filter“; Retouren noch nie „Noch keine Retouren. Sie entstehen aus einem Widerruf.“

### 4.8 `/shop/anzahlungen` (T2, Kontroll- und Linkansicht)

- Spalten: `anzahlung_id`, `erstellt`, Auftrag (`auftrag_referenz` → Faktura-Akte), Kunde, Betrag, Status, Link gültig bis (abgelaufen: orange `clock` + „abgelaufen“), Link gesendet am, bezahlt am, Doppelt (Zähler, rot).
- Ansichten: Alle · Offen · Link abgelaufen · Doppelt · [+]. Kein „Neu“: Hinweis im Seitenkopf „Neue Anzahlung am Auftrag in Faktura anlegen →“.
- Massenaktionen: Zahlungslink senden (`link_senden`, Undo), CSV.
- Leer: „Noch keine Anzahlungen über Zahlungslink. Anzahlungen entstehen am Auftrag in Faktura.“; gefiltert leer „Keine Anzahlungen für diese Filter“ (N18).

### 4.9 `/shop/stripe` (T2, Leitung; Tabs Ereignisse | Auszahlungen)

```
┌ Stripe          ▌Simulation aktiv (special-soft, wenn PH Stripe Einstellungen.simulation)   [Schlüssel prüfen] ┐
│ Ereignisse: Ansichten Alle · Fehler 0 · Zahlungsstreit · Risiko · Ignoriert                                     │
│ heute 09:12 │ Bezahlvorgang abgeschlossen │ Bestellung PH-S-261104-0012 │ Verarbeitet │ 1 Versuch │ [Erneut]    │
│             │ checkout.session.completed (muted mono 12)                                                         │
│ Auszahlungen: Ansichten Alle · Offen · Mit Differenz                                                              │
│ erwartet 06.11. │ 1.212,34 € │ Brutto 1.250,00 € │ Gebühren 37,66 € │ Differenz 0,00 € │ Abgeglichen │ [Abgleichen]│
```

- Ereignisart in Klartext (`stripeTypen.js`): `checkout.session.completed` „Bezahlvorgang abgeschlossen“ · `…async_payment_succeeded` „Zahlung nachträglich eingegangen“ · `…async_payment_failed` „Zahlung nachträglich fehlgeschlagen“ · `checkout.session.expired` „Bezahlvorgang abgelaufen“ · `payment_intent.succeeded` „Stripe-Zahlung eingegangen“ · `payment_intent.payment_failed` „Zahlung fehlgeschlagen“ · `charge.refunded` „Erstattung“ · `charge.succeeded/updated` „Zahlung aktualisiert“ · `review.*` „Risikoprüfung“ · `radar.early_fraud_warning.created` „Betrugswarnung“ · `charge.dispute.created/updated/closed` „Zahlungsstreit eröffnet/aktualisiert/abgeschlossen“ · `payout.paid` „Auszahlung auf dem Bankkonto“ · `payout.sync` „Auszahlung nachgeladen“; unbekannt: Rohtyp.
- Zeilenaktion „Erneut verarbeiten“ (`erneut_verarbeiten`) nur bei `fehler|ignoriert`, sonst deaktiviert mit Grund; Massenaktion für markierte Fehler (sequenziell, Fortschritt). Fehlertext aufklappbar (Höhe 200 ms).
- Auszahlungen: Differenz ≠ 0 `danger-text` + `triangle-alert`; „Abgleichen“ (`abgleichen`, sofort, Spinner nach 300 ms); Kopf „Letzter Abgleich {letzter_abgleich}“; S7 „Alle offenen abgleichen“.
- Bericht-Hinweis: „Gebührenrechnung monatlich aus Stripe ablegen“ (B2) mit Ablage als Datei an der Auszahlung (Anhang) bis Feld `gebuehrenbeleg` (A20).
- Leer: Ereignisse noch nie „Noch keine Stripe-Ereignisse. Sobald der Webhook eingerichtet ist, erscheinen sie hier.“ + Link Einstellungen › Stripe; „Fehler“ leer „Keine Fehler.“ (`check`); Auszahlungen noch nie „Noch keine Auszahlungen – Stripe meldet sie automatisch.“; „Mit Differenz“ leer „Alle Auszahlungen stimmen.“

### 4.10 `/shop/einstellungen` (T9, Leitung)

Tabs **Shop · Versand · Gutscheine · Rechtstexte · Stripe** (Route und Tabs gleich).

```
┌ SHOP-MODUS ───────────────────────────────────────────────────────────────────────────┐
│ Status  [check] Live seit 03.11.2026                                 [Zurück auf Test …] │
│ Prüfliste  ✓ Stripe-Schlüssel   ✓ Webhook-Geheimnis   ✓ Simulation aus                  │
│            ✓ Rechtstexte freigegeben   ✗ USt-Regeln vom Steuerberater freigegeben       │
│ ▌Live ohne StB-Freigabe der USt-Regeln (danger-soft)               [Freigabe erfassen]  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- `shop_modus` ist kein Formularfeld. „Live schalten …“ → Bestätigung mit Prüfliste; Primär nur bei vollständiger Liste, Text „Ab jetzt werden Zahlungen über Stripe ausgeführt und Mails gehen an Kunden.“ „Zurück auf Test“ = Undo 8 s. StB-Freigabe bis A15: Dialog „Freigabe erfassen“ (Datum, Name Kanzlei) → Kommentar an PH Shop Einstellungen; Prüfliste liest den jüngsten Kommentar dieser Art.
- Übrige Felder: Speichern `⌘S`, Toast „Gespeichert · Rückgängig“ (Feldwert, alter Stand). Beträge als `BetragFeld`. Sensibel markiert (Rückfrage beim Speichern): `vier_augen_ab_cent` (Stripe), `oss_aktiv` („Ab jetzt wird der Steuersatz des Lieferlands berechnet – nur nach Abstimmung mit dem Steuerberater.“).
- Tab Gutscheine: `gutschein_art_standard` nur lesend „Mehrzweck“ mit Satz „Einzweckgutscheine erst nach Steuerberater-Freigabe“; `gutschein_gueltig_jahre` mit Hinweis „0 = unbefristet (empfohlen). Befristung nur nach Rechtsprüfung.“; Grenzen min/max.
- Tab Versand: Pauschalen AT/DE, frei ab, `auto_abschliessen_tage` (Hinweis „mindestens 28 Tage plus Laufzeit“; Feldfehler unter 28 außer 0 = aus).
- Tab Rechtstexte: `rechtstexte_status` als Segment mit Satz „Anhänge an Bestellbestätigung nur bei ‚freigegeben‘“; Stände je Text.
- Tab Stripe: Schalter, Schlüssel-**Namen**, „Schlüssel prüfen“ (`pruefen`), Anzeige vorhanden/fehlt, Webhook-Pfad mit Kopieren. Band `danger-soft` bei `live` + `simulation`.

### 4.11 `/shop/berichte/[report]` (T8)

| Route | Quelle | Darstellung / Regel |
|---|---|---|
| `umsatz` | PH Shop Umsatz | Tabelle + Balken Eingang/Erstattet; Titel „Eingänge Shop“ |
| `umsatz-ust` | PH Shop Umsatz nach USt-Satz | Band `warning-soft` „Entwurf – nicht für die UVA verwenden (Leistungsmonat, Vorauszahlungen und Kassa-Ausschluss folgen; Steuerberater-Freigabe offen)“ bis Schalter `uvaFreigabe` |
| `gutschein-bestand` | PH Gutschein Bestand | Tabelle je Ausgabemonat; Hinweis bis A12 „Abgelaufene Gutscheine mit Rest fehlen im Report – Kennzahl der Übersicht zählt sie mit“ |
| `rueckerstattungen` | PH Rueckerstattungen | Tabelle + Linie je Monat |
| `stripe-abgleich` | PH Stripe Abgleich | Abschnitte Auszahlungen · mit Differenz · ohne Auszahlung · in Stripe fehlend; Spalte Gebühren; CSV |
| `ohne-rechnung` | PH Bestellungen ohne Rechnung | Tabelle; Firmenkunden (`rechnung_uid`) oben; Massenaktion „Rechnungen erstellen“ erst mit Schalter `rechnung` |
| `eu-versand` (neu, Backoffice-Abfrage) | PH Bestellung `lieferart=versand`, `adresse_land≠AT`, live, Status bezahlt…abgeschlossen, Kalenderjahr | Summe netto (`gesamt_cent − ust_cent`) gegen die EU-Schwelle 10.000 € für Fernverkäufe; Band ab 80 % für Leitung; Satz „Zählt nur den Shop – Versand aus Faktura kommt hinzu“ |
| `freigaben` (neu) | PH Zahlung Status „Erstattung angefordert“ + Historie aus Kommentaren | Liste für GF |

Zeitraum je Benutzer serverseitig gemerkt; CSV mit Recht; Abfrage > 8 s → „Zeitraum eingrenzen“; Leer „Keine Live-Bestellungen zwischen 01.10. und 31.10.“ + Zeitraum-Chips (N18).

---

## 5. Akten (T5)

Baukasten: Kopf (Titel, Badge, Zusatzchips, Primäraktion, `⋯`), Bänder, Phasenleiste, Tabs (fix), rechte Spalte „Bezüge · Nächste Schritte · Zeitleiste“ (320 px ab 1280, sonst Tab „Bezüge“ als letzter Tab). Zustände: Kopf blockierend < 300 ms, Tabs lazy, rechte Spalte gestreamt; Konflikt (`modified`) → Konfliktdialog; kein Recht/nicht gefunden → 404-gleich; Netzfehler → „nicht geladen“ je Tab. Leitungsaktionen für das Shop-Team sichtbar, deaktiviert, Tooltip „Nur Shop-Leitung – anfragen“ (legt PH Aufgabe an).

### 5.1 Bestellungsakte `/shop/bestellungen/[name]`

```
┌ Zentrale › Shop › Bestellungen › PH-S-261104-0012                                                 ┐
│ PH-S-261104-0012 · Fam. Huber · 369,00 €   [check] Bezahlt  [TEST] [truck]     [Packen]  [⋯]     │
│ ▌[shield-alert] Stripe-Prüfung: Risiko erhöht – vor dem Packen ansehen     [Risiko geprüft]      │
│ [Offen]─[Bezahlt]─◉ Versandbereit ─○ Versendet ─○ Abgeschlossen          Versand · DE · 2 Pos.   │
│   04.11. 09:10   04.11. 09:12                                                                     │
├ Tabs: Übersicht · Positionen 2 · Kunde & Lieferung · Zahlung 1 · Verlauf          (Alt+1…5)      ┤
│ ÜBERSICHT (Lesekarten, „Bearbeiten →“ springt in den Tab)           ║ BEZÜGE                     │
│ ┌ Zahlung ────────────┐ ┌ Versand ─────────────────────────┐        ║ Kunde → Kundenakte (k)     │
│ │ Gesamt   369,00 €   │ │ DHL Paket · 2–3 Tage              │        ║ Zahlung PH-ZAH-26-0101     │
│ │ Bezahlt  369,00 € ✓ │ │ Seestraße 4, 6911 Lochau          │        ║ Lieferschein – (beim Packen)│
│ │ Stripe Checkout     │ │ Sendungsnr. – · Zugestellt –      │        ║ Rechnung – [Rechnung …]    │
│ └─────────────────────┘ └───────────────────────────────────┘        ║ NÄCHSTE SCHRITTE / ZEITLEISTE│
└───────────────────────────────────────────────────────────────────────╨────────────────────────────┘
```

**Bänder** (Reihenfolge nach Schwere, max. 2 sichtbar, weitere als „+1 Hinweis“):
| Bedingung | Band | Aktion |
|---|---|---|
| `pruefen` | danger-soft „Stripe-Betrag 159,90 € weicht von 169,90 € ab“ | „Als geprüft übernehmen“ (Leitung), „Stornieren & erstatten“ |
| Zahlungsstreit offen (Zahlung mit `dispute_status` ≠ won/closed) | danger-soft „Zahlungsstreit über 89,00 € – Antwort bis 14.11. im Stripe-Dashboard“; bei `lost` + Schalter aus: „Rückbuchung lt. Stripe – im Backoffice noch nicht gebucht“ | „Im Stripe-Dashboard öffnen“ |
| Risiko offen | warning-soft „Stripe-Prüfung: Risiko {Stufe} – vor dem Packen ansehen“ | „Risiko geprüft“ (`radar_geprueft(notiz)`, Feldwert) |
| `rechnung_uid` + Versand nach DE | warning-soft „Firmenkunde mit UID, Lieferung DE – Steuerfall klären (Leitung)“; Packen für Shop-Team gesperrt | Leitung: „Geklärt“ (Kommentar + Packen frei) |
| `rechnung_uid` oder `rechnungswunsch` ohne Rechnung, ab Versand/Übergabe | warning-soft „Rechnung fehlt“ | „Rechnung erstellen …“ (E6) |
| Erstattung angefordert | neutral „Erstattung über 1.450,00 € wartet auf Freigabe der Geschäftsführung (seit 04.11.)“ | – |
| `storniert` mit `betrag_bezahlt_cent > erstattet_cent` | warning-soft „Storniert – Erstattung offen 89,00 €“ | „Erstatten …“ (Leitung) bzw. `AnDieKassa` |
| `storniert/erstattet/widerrufen/abgelaufen` | neutral mit Datum und Person aus Verlauf | – |
| `abgelaufen` mit `betrag_bezahlt_cent > 0` | warning-soft „Reservierung abgelaufen – 50,00 € bereits bezahlt“ | Leitung: „Erstatten …“ |
| `fehlgeschlagen/checkout_fehler/abgelaufen` | warning-soft | „Zurück auf Offen“ (Leitung, Undo) |
| `mail_status=fehlgeschlagen` | warning „Bestellbestätigung nicht zugestellt“ | „Erneut senden“ (Undo), „Als PDF drucken“ (dauerhafter Datenträger) |
| Abholfrist überschritten | warning „Abholfrist seit 09.11. überschritten“ | „Frist ändern“ |
| Positionen in `reserviert` geändert, keine Mail danach | warning „Reservierung geändert – Kunde ist nicht informiert“ | „Bestätigung erneut senden“ (Undo) |
| `waehrung≠EUR` | warning „Fremdwährung – Leitung prüfen“; Geld-Dialoge deaktiviert | – |

**Tabs (fix 5):**
| Tab | Inhalt |
|---|---|
| Übersicht | nur Lesekarten (Zahlung, Versand **oder** Abholung, Positionen kompakt); bearbeitbar nur Notiz (`notiz_intern`, Autosave) und Zuständig. Versandkarte zeigt „Zugestellt 06.11. 10:42“ aus PH Lieferschein. Abholkarte: `abholcode` Mono 24 + QR, `abholung_bis`, `abholbereit_am`, `abgeholt_am` |
| Positionen | Tabelle (Bild, Artikel, Marke, Variante, Menge, Einzel, Summe, USt-Satz, zurück/erstattet/storniert je Zeile), Summenblock, USt-Aufteilung; bearbeitbar nur in `offen`/`reserviert` und nur über **„Teilstorno …“** (S9, `positionen_stornieren`) – nie freie Bearbeitung nach dem Anlegen (Server sperrt nicht, U2) |
| Kunde & Lieferung | Kontaktkarte (oder „Kontakt aus Bestelldaten anlegen“), Bestellart, Sprache, Lieferadresse, Rechnungsadresse (`rechnung_*`, UID, Rechnungswunsch); Versanddetails bis `versandbereit` bearbeitbar, danach Hinweis „Lieferschein bereits erzeugt – dort anpassen“; Abschnitt **Nachweis** eingeklappt: AGB-Stand, Belehrungsstand, Einwilligung, „Kunden-Token vorhanden“ (kein `ip_hash`) |
| Zahlung | alle PH Zahlungen zum Bezug (Eingänge, Gutschein-Anrechnungen, Erstattungen) + `erstattungen[]` (Art, Betrag, USt, Positionen, Gutschrift-Nr.); offen = `offen_cent`; Knöpfe „Zahlung erfassen“, „Gutschein einlösen“, „Erstatten …“ (Leitung); Zahlungslink-Karte (`zahlungslink_url` Kopieren, gültig bis, gesendet am, „simuliert“). Leer: „Noch keine Zahlung. Offen 369,00 €.“ + „Zahlung erfassen“ |
| Verlauf | `verlauf[]` + Versionen + Kommentare + Mails, Chips; Mail-Zeilen mit Zustellstatus, „Erneut senden“ |

**Primäraktion je Status × Zahlungsweg × Geld** (`lib/backoffice/shop/primaer.js`, eine Funktion, parametrisiert getestet):

| Status · Bedingung | Primär | Sekundär sichtbar | im `⋯` |
|---|---|---|---|
| `offen` · Website-Checkout (`quelle=website`) | – (Band „Kunde hat den Bezahlvorgang nicht abgeschlossen“) | „Neuen Zahlungslink senden“ (`zahlungslink_erstellen(senden=0)` + Undo `zahlungslink_senden`) | Stornieren (Leitung) |
| `offen` · Telefonbestellung | „Zahlungslink erneut senden“ (Undo) | Überweisung erfassen (S1), Gutschein einlösen | Teilstorno, Stornieren (Leitung) |
| `zahlung_ausstehend` | – (Band türkis „Stripe-Zahlung unterwegs – keine Zahlung erfassen“) | Stripe öffnen | „Zahlung erfassen“ nur Leitung mit Satz „Stripe-Zahlung über 369,00 € angekündigt – doppelte Buchung möglich“ |
| `reserviert` · `offen_cent > 0` | `AnDieKassa` („An der Kassa kassieren“) | Überweisung erfassen, Gutschein einlösen, „Kunde informieren: Ware liegt bereit“ (Composer) | Teilstorno, Stornieren (Leitung) |
| `reserviert` · `offen_cent = 0` | Abholbereit melden (Undo) | – | Stornieren & erstatten (Leitung) |
| `bezahlt` · Versand | Packen (Undo) | Versendet melden (ohne Lieferschein) | Ersatz liefern, Stornieren & erstatten (Leitung) |
| `bezahlt` · Abholung | Abholbereit melden (Undo) | „Direkt übergeben“ (Kunde steht da; §9.2) | wie oben |
| `versandbereit` | Versendet melden (Mini-Dialog → Undo; Mail an Kunden) | Lieferschein öffnen, Etikett drucken | Stornieren & erstatten (Leitung) |
| `abholbereit` · `offen_cent = 0` | Übergeben (Undo) | „Abholcode erneut senden“ (`abholcode_erneut_senden`, Frist bleibt) | Stornieren & erstatten (Leitung) |
| `abholbereit` · `offen_cent > 0` | `AnDieKassa` | Gutschein einlösen | Stornieren (Leitung) |
| `versendet` / `abgeholt` | Abschließen (Undo; erst ab `abschliessenAb`, vorher Primär leer, `⋯` „Jetzt abschließen“ mit Satz „Widerrufsfrist läuft bis 20.11.“) | Rechnung erstellen …, Widerruf erfassen | Ersatz liefern, Reklamation an Service, Teilerstattung/Kulanz (Leitung), Übergabe zurücknehmen (Leitung, nur `abgeholt`, Dialog Grund) |
| `abgeschlossen` | – | Rechnung erstellen … (wenn fehlt) | Widerruf erfassen, Reklamation an Service, Kulanz (Leitung) |
| `pruefen` | Als geprüft übernehmen (Leitung, Soll/Ist-Dialog) | Stornieren & erstatten | Zahlung öffnen, Stripe öffnen |
| `fehlgeschlagen` / `checkout_fehler` / `abgelaufen` | Zurück auf Offen (Leitung, Undo) | Neuen Zahlungslink senden (nur Telefon) | Stornieren |
| `storniert` / `erstattet` / `widerrufen` | – | Zahlung öffnen | – |

Immer im `⋯`: E-Mail schreiben (Composer, Betreff „Ihre Bestellung {Nummer}“) · Drucken (`⌘P`) · Kundenakte (`k`) · In Stripe öffnen (`Shift+O`) · Zuständig · Aufgabe anlegen. Kein „Löschen“. Browser-Tab „PH-S-261104-0012 · Huber – Platzhirsch“.

### 5.2 Zahlungsakte `/shop/zahlungen/[name]`

```
│ PH-ZAH-26-0101 · Eingang 369,00 € · Stripe Checkout · Bestellung PH-S-261104-0012  [check] Bezahlt [lock] [Erstatten …] [⋯] │
│ ▌Freigabe angefordert: 1.450,00 € · Grund Kulanz · von S. Leitner am 04.11.   [Freigeben] [Ablehnen]   (nur GF) │
│ ▌Zahlungsstreit: 89,00 € · Grund „fraudulent“ · Antwort bis 14.11.                  [Im Stripe-Dashboard öffnen] │
│ Angekündigt ─● Bezahlt ─○ Teilweise erstattet ─○ Erstattet                                                  │
│ Tabs: Übersicht · Stripe · Erstattungen · Verlauf                                                           │
```

- Tabs fix 4: Übersicht (Betrag, Zeitpunkt, Kanal, Art, Bezug-Chip, Kontakt, Referenzen, Notiz editierbar, Quelle), Stripe (Stripe-Zahlung, Belastung, Bezahlvorgang, Stripe-Buchung je ID Mono + Kopieren, Gebühr, Auszahlung, auslösendes Ereignis, Risiko-Werte als Klartext, Live/Test), Erstattungen (`erstattungen[]`; leer „Noch keine Erstattungen zu dieser Zahlung.“), Verlauf.
- Bänder statt Tabs: Freigabe (GF: Zwei-Klick „Freigeben“ `erstattung_freigeben` + „Ablehnen“ Dialog Pflichtgrund `erstattung_ablehnen`; andere: Text), Zahlungsstreit (`dispute_*`), Risiko (`radar_*` + „Risiko geprüft“), „Gebucht – Korrektur nur per Erstattung“ (neutral, `lock`).
- Primär „Erstatten …“ (S4, Leitung) bei `art=Eingang`, gebucht, `erstattet_cent < betrag_cent`, Kanal nicht bar (sonst `AnDieKassa`-Variante „An der Kassa auszahlen“), Kanal `Gutschein` → „Restwert auf Gutschein zurück“ (`cancel_voucher_redemption` bzw. Teil über `credit_voucher`, Leitung, Grund Pflicht).
- `art=Erstattung`: Kopf „↩ Erstattung zu PH-ZAH-… “, keine Primäraktion.
- `status=Angekuendigt` (nicht gebucht): Primär „Als bezahlt buchen“ (Bestätigung „Zahlung über 369,00 € buchen? Danach gesperrt.“); `⋯` Leitung „Ankündigung stornieren“ (`ankuendigung_stornieren(grund)`, Dialog Pflichtgrund).
- `⋯`: Beleg drucken („PH Zahlungsbeleg“), Auszahlung zuordnen, In Stripe öffnen, Bezug öffnen, Kundenakte. Simulation → Toast „Erstattung simuliert (Stripe-Simulation aktiv)“.

### 5.3 Gutscheinakte `/shop/gutscheine/[name]`

```
│ PH-GS-26-0031 · ····-7K3Q · 100,00 € · Rest 62,50 €   Teilweise eingelöst   [Auf Bestellung anrechnen] [⋯] │
│ Rest ████████░░░ 62,5 %   Gültig: unbefristet · Ausgabe Kassa 12.10.2026 · Mehrzweck · [TEST]          │
│ ▌Gesperrt am … – Verlust gemeldet – ersetzt durch PH-GS-… (Link)                 [Entsperren] (Leitung)  │
│ Tabs: Übersicht · Einlösungen 2 · Käufer & Kauf · Verlauf                                               │
```

- Tabs fix 4: Übersicht (Wert, Rest, Status, Gültigkeit, Motiv, Empfänger, Grußtext, Hinweis – Motiv/Empfänger/Grußtext editierbar nur solange `pdf` leer), Einlösungen (Zeitpunkt, Betrag, Rest danach, Kanal, Beleg → Akte, Person, Zahlung; Zeilen-`⋯` Leitung „Einlösung zurücknehmen“ → Dialog Pflichtgrund → `cancel_voucher_redemption(gutschein, beleg_doctype, beleg, grund)`; leer „Noch keine Einlösung.“), Käufer & Kauf (Käufer, Gutscheinkauf/Kassenbeleg, Zahlung, Ausgabeart; „ohne Verkauf: {Grund aus Kommentar}“; leer „Kein Käufer erfasst – Ausgabe ohne Namen.“), Verlauf.
- Primär „Auf Bestellung anrechnen“ → S2 mit Bestellsuche (nur Bestellungen mit `offen_cent > 0`). Kein freies „Einlösen“ (E15).
- Abgelaufen mit Rest: Band orange „Abgelaufen am 01.10. · Rest 37,50 € – Einlösung nach Freigabe der Leitung“; Leitung: „Gültigkeit verlängern“ (Feld `gueltig_bis`, Feldwert) + Satz „Status-Reaktivierung folgt mit ph_shop-Änderung“ bis Schalter `gutscheinReaktivieren`.
- Sekundär: PDF senden (`pdf_senden(empfaenger)` nur mit gespeicherter PDF; ohne PDF Hinweis „Code liegt nicht mehr im Klartext vor – ‚Ersetzen‘ erzeugt einen neuen“), Drucken (gespeicherte PDF).
- `⋯` Leitung: Sperren (`sperren(grund, sperrgrund_art)`, Dialog `danger-solid`), Entsperren (`entsperren(grund)`, Dialog Grund), Ersetzen (`ersetzen()`; Bestätigung „Gutschein ····-7K3Q sperren und durch neuen Code über 62,50 € ersetzen?“ → Ergebnis-Karte mit Code einmalig).
- **Einmaliger Code (Ersetzen, S5):** Code Mono 24 px, „Kopieren“ (Live-Region „Code kopiert“), „Drucken“, „Per E-Mail senden“; Schließen nur über „Fertig“ (Esc/Klick außerhalb schließen nicht); „Fertig“ ohne Drucken/Senden fragt „Code wurde nicht gedruckt oder gesendet. Danach ist er nicht mehr sichtbar. Trotzdem schließen?“.

### 5.4 Gutscheinkauf-Akte `/shop/gutscheinkaeufe/[name]`

Tabs fix 4: Übersicht (Anzahl × Wert, Motiv, Empfänger, Grußtext, Käufer, Rechnungsadresse) · Gutscheine (`gutscheine[]` → Gutscheinakte; leer „Noch keine Gutscheine ausgestellt.“) · Zahlung & Nachweis (Zahlung, `bezahlt_am`, `erstattet_cent`, Stripe-IDs als Nebentext, Zustimmungen) · Verlauf. Primär bei `bezahlt`: „Gutschein-Mail erneut senden“ (`codes_erneut_senden`, Undo). `⋯` Leitung: „Erstatten …“ (`erstatten(grund, betrag_cent)`, S4-Variante; Vorschau „ungenutzte Gutscheine werden auf Erstattet gesetzt; eingelöste Anteile sind nicht erstattbar – erstattbar höchstens 37,50 €“), Widerruf öffnen. Band `pruefen`: „Betrag weicht ab – keine Codes erzeugt“.

### 5.5 Anzahlungsakte `/shop/anzahlungen/[name]`

Phasen `Offen → Link gesendet → Bezahlt`. Tabs fix 3: Übersicht (Betrag, Beschreibung, Kunde, Link gültig bis – Feldwert solange offen, gesendet am, bezahlt am, Zahlung, Auftrag → Faktura) · Zahlungen (Eingänge inkl. `doppelt[]`) · Verlauf. Band `danger-soft` bei `doppelt[]`: „2 doppelte Zahlungen · 89,00 €“ + „Doppelte erstatten“ (`doppelte_erstatten`, Leitung, Geld-Dialog mit Liste und Summe). Primär: `offen|fehlgeschlagen` → „Zahlungslink senden“ (Undo); `bezahlt` → keine (sekundär „Auftrag in Faktura öffnen“). Band Link abgelaufen: „Link abgelaufen – Gültigkeit verlängern und erneut senden“.

### 5.6 Widerrufsakte `/shop/widerrufe/[name]`

```
│ PH-WID-26-0007 · Widerruf PH-S-261020-0003 · Fam. Huber      Bestätigt         [Retoure anlegen]  [⋯] │
│ Eingegangen ─● Bestätigt ─◉ Ware erwartet ─○ Ware erhalten ─○ Erstattet                              │
│ Fristen: Widerruf bis 20.11. (ab Zustellung 06.11., Sendungsverfolgung) ✓ fristgerecht                │
│          Rücksendung bis 21.11. · Rückzahlung bis 21.11. – zurückbehalten bis Ware oder Absendenachweis│
│ ▌Erhalt-Datum weicht ab: Server rechnet ab Versand 03.11.     [Zustelldatum 06.11. übernehmen]        │
│ Tabs: Erklärung · Zuordnung · Abwicklung · Verlauf                                                    │
│ ABWICKLUNG                                                                     zurück                │
│ [img] Leuchte „Seelicht“   1 × 289,00 €                                        [ 1 ]                 │
│ [img] Sofa „Lochau“ Stoff nach Wahl 1 × 2.890,00 €                             [ 0 ]  (Hinweis § 18)  │
│ Hinsendekosten 0,00 € (Teilwiderruf) · Rücksendekosten trägt Kunde: ja (belehrt)                      │
│ Erstattung 289,00 € (enth. 48,17 € USt 20 %) · über Stripe-Zahlung       [289,00 € erstatten] (ab Eingang)│
```

- Tabs fix 4 (Mails als Chip im Verlauf): **Erklärung** (Name, E-Mail, Anschrift, bestellt am, erhalten am, Artikeltext, Nachricht), **Zuordnung** (Bestellung | Gutscheinkauf, Link-Suche; „nicht zugeordnet“ rot + Angabe des Kunden; Vorschlag per E-Mail-Treffer), **Abwicklung** (Positionen-Stepper je Bestellposition, Kosten, Retoure, Erstattung, Betrag, Ablehnungsgrund, Notiz, Absendenachweis), **Verlauf**.
- Fristen nach §3.7; `fristgerecht=0` bei bekannter Zustellung → Band warning „Nach Fristende eingegangen – Kulanzentscheidung Leitung“; Belehrung nicht nachweisbar → Band warning „Belehrung nicht nachweisbar – Frist kann bis zu 12 Monate länger laufen“ (Ablehnen wegen Frist und Wertminderung gesperrt).
- **Positionen und Betrag:** Stepper je Bestellposition (0 … Menge − bereits zurück), Vorschau über `PH Bestellung.erstattung_vorschau(zeilen, versand_cent)` (Betrag, USt je Satz, Verteilung auf Zahlungen); Hinsendekosten = voller Versandanteil bei Vollwiderruf, 0 bei Teilwiderruf (§ 14 FAGG); Rücksendekosten-Satz nur bei nachweisbarer Belehrung. § 18-Ausschluss bis Schalter `fagg18`: kein Automatismus – Leitung wählt im Ablehnen-Dialog den Grund „Ausnahme § 18 FAGG“ und nennt die Position (Pflicht).
- **Erstatten** (Leitung; Klasse Geld) aktiv ab Wareneingang **oder** hochgeladenem Absendenachweis (Datei am Widerruf, PDF/JPG ≤ 10 MB, Fehler „Datei zu groß (max. 10 MB)“, Kommentar „Absendenachweis vom …“); vorher deaktiviert mit „Ware noch nicht da – Absendenachweis hochladen oder Eingang buchen“. Weg nach E10; gesperrt nach E8 (bar) und E9 (Rechnung) mit Ersatzweg.
- Primär je Status: `Eingegangen` → Eingangsbestätigung senden (Undo; bei „nicht zugeordnet“ Hinweis „ohne Freitext, höchstens 3 je Adresse in 24 h“; `mail_status=limit` → Band „Limit erreicht – Bestätigung per Brief drucken“) · `Bestaetigt` → Retoure anlegen (Undo; nur mit Bestellung) bzw. bei Gutscheinkauf „Erstatten …“ · `Ware erwartet` → ohne Retoure „Ware erhalten“ (Undo), mit Retoure „Zur Retoure (Eingang buchen)“ · `Ware erhalten` → Erstatten … · `Erstattet|Abgelehnt` → keine.
- `⋯`: Ablehnen (Leitung; Dialog Pflichtgrund mit Chips „Frist überschritten“ (nur nach §3.7 erlaubt) · „Ausnahme § 18 FAGG“ · „Kein Fernabsatzvertrag“ · Freitext; `danger-solid`, Fokus „Abbrechen“), Bestätigung drucken („PH Widerruf Bestätigung“, auch für Postversand), Bestellung/Kundenakte öffnen, E-Mail schreiben.
- Widerruf per Brief/Telefon zu einer Bestellung: Bestellungsakte `⋯` „Widerruf erfassen“ (Kanal Brief/Telefon/Showroom/E-Mail, Text) → Undo 8 s vor Anlage (`widerruf_anlegen(kanal, text)`; der Server sendet bei Anlage die Eingangsbestätigung an die Bestell-E-Mail). Ohne Bestellung und ohne E-Mail: PH Aufgabe an Leitung mit Scan (bis A9).

### 5.7 Retourenakte `/shop/retouren/[name]`

Phasen `Angekündigt → (Label gesendet → Unterwegs) → Eingegangen → Geprüft → Erstattet`. Tabs fix 3: **Positionen** (Artikel, Menge, Zustand Segment neu/geöffnet/beschädigt, Wieder einlagern, Wertminderung `BetragFeld`; leer „Keine Positionen – Retoure ohne Artikelangabe.“ + „Positionen aus Bestellung übernehmen“), **Prüfung** (geprüft von/am, Wertminderung Summe, Erstattungsbetrag = Vorschau der zurückgegebenen Positionen − Wertminderung, Hinweis), **Verlauf**.
- Wertminderung nur bei Widerruf **und** nachweisbarer Belehrung (Checkbox der Leitung „Belehrung über Wertersatz lag vor“); sonst Feld gesperrt mit Tooltip „Ohne Belehrung keine Wertminderung (§ 15 FAGG)“.
- Primär: `Angekuendigt|Label gesendet|Unterwegs` → Ware eingegangen (Undo) · `Eingegangen` → Prüfung abschließen (Bestätigung mit Wertminderung/Erstattung; Server Action speichert `erstattungsbetrag_cent` **explizit** vor `pruefung_abschliessen`, weil der Server ihn nicht neu rechnet – B3/A4) · `Geprueft` → Erstatten … (Weg E10; Retoure.erstatten nur bei genau einer unbaren Zahlung, sonst `teilerstatten`).
- „Wieder einlagern“ an: nach Prüfung PH Aufgabe an Logistik „Wareneingang buchen“ (bis L3/F3).
- `⋯`: Ablehnen (Leitung, Pflichtgrund), Begleitschein drucken, Retourenlabel (deaktiviert „Noch nicht verfügbar – Label in Logistik erstellen“, L4), Widerruf/Bestellung öffnen. `weg=Showroom` → Hinweis „Rückgabe im Showroom – Packtisch bucht den Eingang per Scan“.
- Mangel, Transportschaden, Falschlieferung gehören **nicht** in die Retoure: Bestellungsakte `⋯` „Ersatz liefern“ (S10) bzw. „Reklamation an Service“ (Servicefall in ph_service mit Bezug Bestellung); Wertminderung gibt es dort nie (VGG, R12).

### 5.8 Stripe-Ereignis-Akte, Auszahlungs-Akte

Ereignis (Tabs fix 3: Übersicht · Inhalt · Verlauf): Kopf Klartext-Typ, Bezug, Status; ohne Bezug Karte „Keinem Vorgang zugeordnet“; Übersicht (IDs Nebentext, empfangen/verarbeitet, Versuche, Ergebnis, Fehler in `danger-soft`); Inhalt (`payload_json` eingeklappter Codeblock, Kopieren). Primär `fehler|ignoriert` → „Erneut verarbeiten“ (sofort, Ergebnis-Toast).
Auszahlung (Tabs fix 3: Übersicht · Zeilen · Verlauf): Karten Brutto/Gebühren/Netto/Differenz (≠ 0 rot + Icon); Zeilen `zahlungen[]` (Stripe-Buchung, Typ, PH Zahlung → Akte, Betrag, Gebühr, Netto, „Keine Zahlung im Backoffice gefunden“ `danger-text`; leer „Noch keine Zeilen – ‚Abgleichen‘ lädt sie von Stripe.“ + „Abgleichen“); Primär „Abgleichen“; `datum_bank`, `hinweis` Feldwert; Gebührenrechnung als Anhang.

---

## 6. Abläufe, Aktionen, Dialoge

### 6.1 „Nächster Schritt“ (`lib/backoffice/shop/naechsterSchritt.js`)

| Bedingung (Reihenfolge) | Nächster Schritt | Fälligkeit |
|---|---|---|
| `status=pruefen` | Prüfen (Leitung) | sofort (rot) |
| Risiko offen und Status vor Versand/Übergabe | Risiko ansehen | sofort |
| `status=zahlung_ausstehend` | – („Stripe-Zahlung unterwegs“) | – |
| `status=offen` und `bestellart=Telefon` | Zahlungslink nachfassen | `zahlungslink_gueltig_bis` |
| `status=reserviert` und `offen_cent>0` | An der Kassa kassieren | `abholung_bis` |
| `status=reserviert` und `offen_cent=0` | Abholbereit melden | `abholung_bis` |
| `status=bezahlt`, Versand, UID+DE ungeklärt | Steuerfall klären (Leitung) | sofort |
| `status=bezahlt`, Versand | Packen | `bezahlt_am` + 1 Werktag |
| `status=bezahlt`, Abholung | Abholbereit melden | `bezahlt_am` + 1 Werktag |
| `status=versandbereit` | Versendet melden | `bezahlt_am` + 2 Werktage |
| `status=abholbereit` und `offen_cent>0` | An der Kassa kassieren | `abholung_bis` |
| `status=abholbereit` | Übergeben | `abholung_bis` |
| `versendet|abgeholt` und (`rechnung_uid` oder `rechnungswunsch`) ohne Rechnung | Rechnung erstellen | + 3 Tage |
| `versendet|abgeholt` | Abschließen | `abschliessenAb` (Zustellung + 28 Tage) |
| `storniert` mit offener Erstattung | Erstatten (Leitung) | sofort |
| sonst | – | – |

Farbe: überfällig rot, heute Sand, später grau; „ruht seit n Tagen“ ab 2 Tagen ohne Verlaufseintrag.

### 6.2 Folgewirkungen beim Kunden (N5)

- **Abholbereit melden** setzt serverseitig `abholung_bis = heute + abholung_frist_tage`. Vor dem Commit vergleicht der Client: neue Frist ≥ vereinbarte → Undo-Toast nennt beide („Abholcode an h…@… · Frist **11.11.** (vereinbart war 09.11.) · Rückgängig“, Ton `warning` nur bei Abweichung). Neue Frist **kürzer** → kein Undo-Toast, sondern Bestätigung „Frist verkürzt sich von 25.11. auf 11.11. – Kunde erhält das neue Datum.“ · „Trotzdem melden“ / „Abbrechen“. Mit Schalter `abholfristBehalten` entfällt das.
- „Abholcode erneut senden“ nutzt `abholcode_erneut_senden()` (Frist bleibt), Knopftext ohne Fristangabe.
- Teilstorno/Positionsänderung in `reserviert` → Band „Reservierung geändert – Kunde ist nicht informiert“ + „Bestätigung erneut senden“.

### 6.3 Aktionsmatrix (genau eine Klasse je Aktion)

| Aktion | Methode | Rolle | Klasse | Begründung „sofort“ |
|---|---|---|---|---|
| Telefonbestellung / Reservierung anlegen | `api.backoffice.create_phone_order(..., senden=0)`; danach `zahlungslink_senden` bzw. `bestaetigung_senden` | Team | Anlage sofort + Mail Undo | Anlage ohne Außenwirkung |
| Überweisung erfassen | `zahlung_erfassen("Ueberweisung", betrag_cent, referenz)` | Team | Geld (S1) | |
| Zahlungslink erzeugen/senden | `zahlungslink_erstellen(senden=0)` / `zahlungslink_senden()` | Team | Undo | |
| Gutschein einlösen | `gutschein_einloesen(code, betrag_cent)`; Prüfung `api.backoffice.check_voucher(code)` | Team | Geld (S2) | |
| Abholbereit melden | `abholbereit_melden()` | Team | Undo (bzw. Bestätigung bei kürzerer Frist) | |
| Abholcode erneut senden | `abholcode_erneut_senden()` | Team | Undo | |
| Übergeben | `abgeholt_melden()` nach Geldprüfung | Team | Undo | |
| Direkt übergeben (aus `bezahlt`) | `abholbereit_melden()` + `abgeholt_melden()` (bis A11) | Team | Bestätigung („Kunde erhält zusätzlich die Abholbereit-Mail“) → Undo | |
| Übergabe zurücknehmen | `abholung_zuruecknehmen(grund)` | Leitung | Bestätigung (Pflichtgrund) | |
| Packen | `packen()` → Hook ph_logistik | Team | Undo | |
| Versendet melden | `versendet_melden(awb, carrier, benachrichtigen=1)` | Team | Mini-Dialog → Undo | |
| Abschließen | `abschliessen()` | Team | Undo | |
| Bestellbestätigung senden | `bestaetigung_senden()` | Team (email) | Undo | |
| Widerruf erfassen | `widerruf_anlegen(kanal, text)` | Team | Dialog → Undo | |
| Rechnung erstellen | `rechnung_erstellen()` → Hook ph_faktura | Team | Bestätigung | |
| Als geprüft übernehmen | Workflow „Als geprüft übernehmen“ | Leitung | Dialog Soll/Ist | |
| Zurück auf Offen | Workflow „Zurück auf Offen“ | Leitung | Undo | |
| Risiko geprüft | `radar_geprueft(notiz)` (Bestellung/Zahlung) | Team | Feldwert | |
| Teilstorno | `positionen_stornieren(zeilen, grund)` | Team (unbezahlt) / Leitung (bezahlt) | Dialog S9 (unbezahlt Undo, bezahlt Geld) | |
| Teilerstattung / Kulanz / Versandanteil | `erstattung_vorschau(…)`, `teilerstatten(zeilen, versand_cent, kulanz_cent, grund, art)` | Leitung | Geld (S9) | |
| Stornieren (& erstatten) | `erstattung_vorschau()`, `stornieren(grund, erstatten, betrag_cent)` | Leitung | Bestätigung + Geld (S3) | |
| Ersatz liefern | `ersatzlieferung_anlegen(zeilen, grund, bezug_doctype, bezug, lieferart)` | Team | Dialog → Undo (S10) | |
| Erstatten (Zahlung) | `PH Zahlung.rueckerstatten(betrag_cent, grund)` | Leitung | Geld (S4) | |
| Freigeben / Ablehnen | `erstattung_freigeben()` / `erstattung_ablehnen(grund)` | GF | Zwei-Klick / Dialog | |
| Ankündigung stornieren | `PH Zahlung.ankuendigung_stornieren(grund)` | Leitung | Bestätigung | |
| Auszahlung zuordnen | `auszahlung_zuordnen(auszahlung)` | Team | Feldwert | |
| Gutschein ohne Verkauf | `api.backoffice.issue_voucher(wert_cent, art="Mehrzweck", motiv, empfaenger, grusstext, kaeufer_*, kontakt, grund, senden_an, test)` | Leitung | Dialog (S5) | |
| Einlösung zurücknehmen | `api.backoffice.cancel_voucher_redemption(gutschein, beleg_doctype, beleg, grund)` | Leitung | Bestätigung | |
| Restwert gutschreiben | `api.backoffice.credit_voucher(gutschein, betrag_cent, …, grund, idempotency_key)` | Leitung | Geld | |
| Sperren / Entsperren | `sperren(grund, sperrgrund_art)` / `entsperren(grund)` | Leitung | Bestätigung | |
| Ersetzen | `ersetzen()` | Leitung | Bestätigung → Ergebnis-Karte | |
| PDF senden | `pdf_senden(empfaenger)` | Team | Undo | |
| Gutschein-Mail erneut | `PH Gutschein Bestellung.codes_erneut_senden()` | Team | Undo | |
| Gutscheinkauf erstatten | `PH Gutschein Bestellung.erstatten(grund, betrag_cent)` | Leitung | Geld | |
| Zahlungslink Anzahlung | `PH Anzahlung.link_senden()` | Team | Undo | |
| Doppelte erstatten | `doppelte_erstatten()` | Leitung | Geld | |
| Eingangsbestätigung | `PH Widerruf.bestaetigung_senden()` | Team | Undo | |
| Zustelldatum übernehmen | `save PH Widerruf.erhalten_am` | Team | Feldwert | |
| Retoure anlegen | `retoure_anlegen()` | Team | Undo | |
| Ware erhalten | `ware_erhalten()` | Team | Undo | |
| Widerruf erstatten | E10: `PH Widerruf.erstatten(betrag_cent, grund)` oder `PH Bestellung.teilerstatten(…)` | Leitung | Geld | |
| Ablehnen (Widerruf/Retoure) | `ablehnen(grund)` | Leitung | Bestätigung | |
| Retoure eingegangen | `eingegangen()` | Team | Undo | |
| Prüfung abschließen | `save erstattungsbetrag_cent` + `pruefung_abschliessen()` | Team | Bestätigung | |
| Retoure erstatten | E10 | Leitung | Geld | |
| Erneut verarbeiten | `PH Stripe Ereignis.erneut_verarbeiten()` | Leitung | Sofort | idempotent |
| Abgleichen | `PH Stripe Auszahlung.abgleichen()` | Leitung | Sofort | idempotent |
| Schlüssel prüfen | `PH Stripe Einstellungen.pruefen()` | Leitung | Sofort | lesend |
| Live schalten / zurück | `save PH Shop Einstellungen.shop_modus` | Leitung | Bestätigung / Undo | |

Technik: Dokumentmethoden über `run_doc_method` (Fundament); jede Action gibt `{ ok, code, message, ergebnis }` zurück und ruft `updateTag("liste:PH Bestellung")`, `kennzahl:shop`, `akte:kunde:<kontakt>`.

### 6.4 Dialoge (T6; alle idempotent über `idempotency_key = shop:<dialog>:<doc>:<uuid>`; Fokus kehrt zum Auslöser zurück; Öffnen 200 ms `--bo-ease-out` scale .98→1, Schließen 160 ms `--bo-ease-in`)

**S1 Zahlung erfassen** (md, ein Schritt)

```
┌ Zahlung erfassen · PH-S-261103-0009 ───────────────────────────── [x] ┐
│ Offen 89,00 €  (bezahlt 50,00 € per Gutschein ····-7K3Q)              │
│ Weg      ((Überweisung eingegangen)) (Zahlungslink senden)            │
│ Betrag   [ 89,00 € ]   Teilbetrag möglich                             │
│ Referenz [ Verwendungszweck / Bankreferenz *        ]                 │
│ Bucht 39,00 € · offen danach 50,00 € · Status bleibt „Reserviert“     │
│ ───────────────────────────────────────────────────────────────────── │
│ [receipt] Bar oder Karte? An der Kassa kassieren →                    │
│                                   [Abbrechen]  [39,00 € buchen ⌘↵]    │
└───────────────────────────────────────────────────────────────────────┘
```

- Weg „Überweisung eingegangen“: Betrag Standard = offen, max offen, immer explizit als `betrag_cent`; Referenz Pflicht; Live-Satz `aria-live="polite"`; Primärknopf trägt den Betrag. Buchungszeitpunkt = jetzt (Methode kennt kein Datum; Bankdatum in die Referenz).
- Weg „Zahlungslink senden“: zeigt gültig-bis (`zahlungslink_gueltig_stunden`), Primär „Link über 89,00 € senden“ → Undo.
- Deaktiviert mit Grund: `zahlung_ausstehend` (Shop-Team), `abholbereit` unbezahlt bis A1 („Noch nicht verfügbar – an der Kassa kassieren“), Fremdwährung.
- Ergebnis-Karte im Dialog (Überblendung 120 ms): Zahlungsnummer, Betrag, „Beleg drucken“, Folgeknopf je Lage („Abholbereit melden“ / „Packen“ / „Übergeben“), „Schließen“. Serverfehler am Feld.

**S2 Gutschein einlösen** (md) – gleiches Muster in Bestellung und Gutscheinakte (N17)
Code-Feld (Scanner `data-scan="ja"`, `autocomplete="off"`, `spellcheck="false"`, `autocapitalize="characters"`, Einfügen erlaubt, tolerant gegen Leerzeichen/Bindestriche/Kleinschreibung; nach Prüfung maskiert, „Code anzeigen“ `eye`) → Prüfung `check_voucher(code)` nach 6 Zeichen bzw. Enter (Spinner nach 300 ms) → Karte „Rest 62,50 € · gültig · Mehrzweck“ oder Fehler am Feld („gesperrt“, „abgelaufen am …“, „Testgutschein im Live-Betrieb“, „nicht gefunden“). Betrag Standard min(Rest, offen). Live-Satz „Löst 62,50 € ein · Rest Gutschein danach 0,00 € · offen danach 26,50 € · gebucht und gesperrt“. Primär „62,50 € einlösen“ – keine zweite Rückfrage. Ergebnis: Vorschlag „Restbetrag erfassen (S1)“ bzw. `AnDieKassa`. Fehlbuchung: Leitung über „Einlösung zurücknehmen“ (§5.3).

**S3 Stornieren & erstatten** (lg, Leitung)

```
┌ Stornieren · PH-S-261104-0012 ──────────────────────────────────────── [x] ┐
│ Grund * [Kundenwunsch] [nicht lieferbar] [Doppelbestellung] [Prüfung] […] │
│ Erstattung (aus erstattung_vorschau)                                        │
│   Stripe-Zahlung PH-ZAH-26-0101   319,00 €  → zurück auf die Karte (2–5 Werktage)│
│   Gutschein ····-7K3Q              50,00 €  → Restwert zurück auf den Gutschein │
│   Summe                           369,00 €                                  │
│ Belege                                                                      │
│   Lieferschein LS-… → Aufgabe „in Logistik stornieren“                      │
│   Rechnung –                                                                │
│ [triangle-alert] Über 1.000 € → Freigabe Geschäftsführung                   │
│                                   [Abbrechen]  [Stornieren] (danger-solid)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Nur in Status nach E7; aus `versendet/abgeholt/abgeschlossen` erscheint stattdessen „Widerruf erfassen“.
- Sperren mit Ersatzweg: Bar-Eingang (E8) → „Erst an der Kassa auszahlen, dann hier ‚Stornieren ohne Erstattung‘“ (Schalter „Zahlung erstatten“ aus, gesperrt); Rechnung vorhanden ohne Schalter `gutschrift` (E9) → Primär deaktiviert „Erst Gutschrift in Faktura anlegen“ + Link.
- Ergebnis-Karte: Gegenbuchungen, Gutschein-Gutschrift, „Freigabe angefordert“ (dann Band in der Akte), „Kunde informieren (E-Mail)“, „Schließen“. Status `storniert` setzt der Server sofort; offene Erstattung bleibt als Band sichtbar (F7).

**S4 Erstatten (Zahlung)** (md, Leitung): Betrag (Standard offen, max `betrag_cent − erstattet_cent`, Fehltext „zwischen 0,01 € und 319,00 €“) · Grund (Pflicht-Chips Widerruf, Retoure, Kulanz, Doppelzahlung, Storno + Freitext) · Weg-Satz je Kanal: Stripe → „Erstattung über Stripe auf die Zahlungsart des Kunden“; Überweisung → „Gegenbuchung – Rücküberweisung bitte im Bankprogramm ausführen“; Gutschein → Restwert-Weg; Bar/Karte/Terminal → Dialog öffnet nicht, `AnDieKassa`-Variante „An der Kassa auszahlen“. Erstattung zu einer Bestellung läuft positionsgenau über S9 (USt-Aufteilung); S4 direkt an der Zahlung ist für Doppelzahlungen und Fälle ohne Bestellung. Vier-Augen-Hinweis im Live-Satz. Primär „319,00 € erstatten“. Ergebnis: Gegenbuchung, Stripe-Erstattung (ID Nebentext) oder „simuliert“, „Erstattungsbeleg drucken“.

**S5 Gutschein ohne Verkauf** (lg 800 px, Leitung; `?neu=1` in Gutscheine)

```
┌ Gutschein ohne Verkauf ─────────────────────────────────────────────────────────── [x] ┐
│ Wert *   [25 €] [50 €] [(100 €)] [200 €] [500 €]  [ anderer Betrag € ]  │ ┌ Vorschau ──────┐ │
│ Grund *  [Kulanz] [Ersatz] [Gewinnspiel] [ Bezug, z. B. Servicefall … ]  │ │ PLATZHIRSCH     │ │
│ Motiv    [schlicht] [(seelicht)] [geweih]                                │ │ Gutschein       │ │
│ Für      [ Oma Rosa ]   Grußtext [ … ] 42/300                            │ │ 100,00 €        │ │
│ ▸ Weitere Angaben (Käufer/Empfänger-Kontakt, Senden an, Test)            │ │ ····-····       │ │
│ Gutscheine verkaufen: an der Kassa.                                      │ └─────────────────┘ │
│                                                 [Abbrechen]  [Ausstellen ⌘↵]                  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

Grenzen `gutschein_min_cent/max_cent` (Feldfehler mit beiden Werten); Art fest Mehrzweck (unsichtbar, explizit gesendet); Gültigkeit aus Einstellungen (Standard unbefristet), nicht im Dialog; Kachel 72×44, Auswahl `accent`-Rand + Haken (120 ms); Vorschau-Überblendung 120 ms nur bei Motivwechsel. Ergebnis-Karte mit Code einmalig (Regeln §5.3), PDF wird serverseitig gespeichert. Shop-Team sieht den Knopf deaktiviert mit „Nur Shop-Leitung – Verkauf an der Kassa“.

**S6 Widerruf vollständig abwickeln:** keine eigene Oberfläche – Primäraktionen und Zeilenknöpfe führen: Eingang (Bestätigung automatisch) → Retoure anlegen → Ware eingegangen (Packtisch oder Akte) → Prüfung → Erstatten.

**S7 Auszahlungen abgleichen** (Leitung): „Alle offenen abgleichen“ – Schleife `abgleichen` über `bezahlt|unterwegs`, Fortschritt n/m, Ergebnisliste mit Differenzen.

**S8 Mehrere Bestellungen stornieren** (Leitung, Massenaktion): gemeinsamer Grund · Schalter „bezahlte Bestellungen erstatten“ (Standard an) · Vorschau-Tabelle je Bestellung aus `erstattung_vorschau` (Betrag, Weg, Hinweise: Lieferschein, Freigabe, **gesperrt** bei Bar-Eingang oder Rechnung mit Grund) · Checkbox „mitnehmen“ · Summe „5 Bestellungen · 1.240,00 € Erstattung · 1 zur Freigabe · 1 gesperrt“ · Primär „4 Bestellungen stornieren“ (`danger-solid`) → sequenziell, Ergebnisliste, „Kunden informieren“ (Composer nacheinander, überspringbar).

**S9 Teilstorno / Teilerstattung** (lg; aus Bestellungsakte „Erstatten …“ bzw. „Teilstorno …“)
Tabelle der Positionen mit Stepper (0 … offene Menge), Zeile „Versandanteil“ (Schalter), Feld „Kulanzbetrag“ (Leitung) · Grund Pflicht · Vorschau live über `erstattung_vorschau(zeilen, versand_cent, kulanz_cent)` (Debounce 300 ms; Betrag, USt je Satz, Verteilung auf Zahlungen; bei unbezahlt „nur Forderung – kein Geld fließt“) · Primär „289,00 € erstatten“ bzw. „2 Positionen stornieren“. Unbezahlter Teilstorno: Undo-Klasse; Hinweis „Offener Zahlungslink passt nicht mehr – neuer Link nötig“ + Folgeknopf „Neuen Zahlungslink senden“. Sperren nach E8/E9.

**S10 Ersatz liefern** (md, Team): Positionen + Menge, Grund Pflicht (Transportschaden · Falschlieferung · Servicefall + Freitext), Bezug optional (Servicefall-Suche ph_service), Lieferart → Undo „Ersatzlieferung 0 € wird angelegt“ → neue Bestellung `bestellart=Ersatz`, Status bezahlt, ohne Bestätigungsmail; Ergebnis-Toast „Öffnen“.

### 6.5 Massenaktionen (Zusammenfassung)

| Liste | Sichtbar (max. 6) | Unter „Mehr“ |
|---|---|---|
| Bestellungen | Packen · Abholbereit melden · Abschließen · Zuständig · Drucken | CSV · Bestätigung senden · Stornieren … (Leitung) |
| Zahlungen | Auszahlung zuordnen · Beleg drucken · CSV | – |
| Gutscheine | PDF senden · Sperren (Leitung) · CSV | – |
| Gutscheinkäufe | Gutschein-Mail erneut senden · CSV | – |
| Widerrufe | Eingangsbestätigung senden · Zuständig · CSV | – |
| Retouren | Eingegangen · Begleitschein drucken · CSV | – |
| Anzahlungen | Zahlungslink senden · CSV | – |
| Stripe-Ereignisse | Erneut verarbeiten | – |
| Auszahlungen | Abgleichen · CSV | – |

Sequenziell je Dokument (keine Sammelmethoden in ph_shop); Mail-/Beleg-Aktionen erst nach dem gemeinsamen 8-s-Fenster; Abbruch nach dem laufenden Dokument über den fokussierten Knopf; Ergebnis-Drawer (Einblenden 240 ms `--bo-ease-out`).

---

## 7. Kennzahlen und Charts

| Kachel / Chip | Quelle | Filter | Sichtbar |
|---|---|---|---|
| Zu packen (Chip) | Count PH Bestellung | `status=bezahlt & lieferart=versand` (live) | alle |
| Abholung (Chip) | Count | `lieferart=abholung & status in reserviert,bezahlt,abholbereit` · Zusatz „n Frist ≤ morgen“ | alle |
| Prüfen (Chip) | Count | `status=pruefen` + Risiko offen | alle (rot ab 1) |
| Widerrufe (Chip) | Count PH Widerruf | `status in Eingegangen, Bestaetigt, Ware erwartet, Ware erhalten` | alle |
| Freigabe (Chip) | Count PH Zahlung | `status=Erstattung angefordert` | Leitung, GF |
| Bestellungen heute | Count PH Bestellung | `angelegt` heute, nicht `checkout_fehler|abgelaufen`, live | alle |
| Zahlung unterwegs | Count | `status in offen, zahlung_ausstehend` · „älteste vor n h“ | alle |
| Eingänge Shop (Monat) | Sum PH Zahlung `betrag_cent` | `art=Eingang`, gebucht, live, `quelle ≠ kassa`, `bezug_doctype in (PH Bestellung, PH Gutschein Bestellung)` · Trend Vormonat | Leitung, GF |
| Gutschein-Restwert | Sum `rest_cent` | §4.6-Regel · Zusatz Anzahl und „davon ohne Verkauf“ | Leitung, GF |
| Stripe (Karte) | Count Ereignis `fehler` 7 Tage · `letzter_abgleich` · Zahlungen ohne Auszahlung > 7 Tage · Zahlungsstreit offen | – | Leitung |
| EU-Versand (Jahr) | §4.11 | Band ab 80 % | Leitung, GF (Bericht) |

Keine Zahl doppelt (Chips = Arbeit, Kacheln = Geld/Trend). „Eingänge“ statt „Umsatz“: Zahlungszufluss, keine Steuergröße; Kassa-Zahlungen zählt der Kassa-Bereich (keine Doppelzählung, B5). Kennzahl ohne Daten „–“; kein Hochzählen.

Charts (nur Leitung/GF, Übersicht unten): **Eingänge je Woche** (Balken, PH Zahlung wie Kachel, Quartal) · **Zahlungen nach Kanal** (waagrechte Balken absteigend). In Berichten: Bestellungen nach Lieferart (Donut, 2 Anteile), Gutscheinausgabe je Monat (Balken, `test=0`), Erstattungen je Monat (Linie). Farben 03 §1.6, Legende als Chips, Daten als `<details>`-Tabelle, Zeitraum-Chips laden neu (Überblendung 160 ms).

---

## 8. Druck / PDF

Weg 05 §10 (`/druck/[doctype]/[name]?format=`, Druckpanel 480 px), Auslöser `⌘/Strg+P` in Akten.

| Dokument | Print Format | Auslöser |
|---|---|---|
| Bestellbestätigung | PH Bestellung Bestätigung | Akte, Massendruck, Band „Bestätigung nicht zugestellt“ (Übergabe als Papier = dauerhafter Datenträger) |
| Gutschein | PH Gutschein (mit QR, Restwert, ggf. GESPERRT) | Ergebnis-Karte S5/Ersetzen; sonst gespeicherte `pdf` |
| Zahlungs-/Erstattungsbeleg | PH Zahlungsbeleg | Zahlungsakte, S1/S4-Ergebnis (Kassa druckt eigenen Bon) |
| Widerrufsbestätigung | PH Widerruf Bestätigung | Widerrufsakte (auch Postversand) |
| Retoure-Begleitschein | PH Retoure Begleitschein | Retourenakte, Massendruck |
| Lieferschein, Etikett | ph_logistik | über Bezug |
| Rechnung | ph_faktura | nach `rechnung_erstellen` |
| Listen | Browser-Druck der DataTable | – |

Testdokumente mit Wasserzeichen „TEST“ (sofern das Format `modus/livemode/test` auswertet – sonst Lücke A20). PDF-Fehler → „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“. Sammeldruck > 50 → Hinweis.

---

## 9. Mobile / iPad / Kiosk

### 9.1 Backoffice am iPad und Telefon (Grenzen nach 02 §11.1)

`≥ 1280` Desktop · `1024–1279` iPad quer (Listen 4 Prioritätsspalten §4.2, rechte Akte-Spalte als letzter Tab, Primäraktion sticky unten 52 px mit `env(safe-area-inset-bottom)`, Toasts **über** der Leiste) · `640–1023` Tablet hoch (Karten) · `< 640` Telefon (Lese-Ansicht + Feldwerte Zuständig, Notiz, Abholfrist; „Positionen bitte am Desktop“). GF-Freigabe am Telefon: Glocke als Bottom-Sheet mit Fokusfalle, Schließen-Knopf ≥ 44 px, Wischen nur zusätzlich (WCAG 2.5.7), Zwei-Klick-Knopf volle Breite 48 px.

### 9.2 Packtisch (Kiosk; ph_logistik baut die Shell, Shop liefert `AbholungKarte`, `AbholungenHeute`, `CodeTastenfeld`, `OhneCodeSuche`)

```
┌ Abholung ─────────────────────────────────────────────────────────────┐
│  [scan-line] Abholcode scannen oder eingeben                          │
│  [ K 7 P 3 _ _ ]                                                      │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┐  Tastenfeld 56 px, 32 Zeichen des Alphabets │
│  │2 │3 │4 │5 │6 │7 │8 │9 │  [delete] [Leeren]                        │
│  │A │B │C │D │E │F │G │H │                                           │
│  │J │K │L │M │N │P │Q │R │                                           │
│  │S │T │U │V │W │X │Y │Z │                                           │
│  └──┴──┴──┴──┴──┴──┴──┴──┘                 [ Ohne Code suchen ] 56 px │
├───────────────────────────────────────────────────────────────────────┤
│  Fam. Huber · PH-S-261103-0009                                        │
│  [img 48] Vase „Fjord“ · 1 Stück                     (Zeilen 56 px)    │
│  [check] Bezahlt          oder   [circle-alert] Offen 89,00 €          │
│  [ Übergeben an Huber ]  64 px primary         ← nur bei offen_cent = 0│
│  [ Kunde zur Kassa schicken ] 56 px secondary  ← bei offen_cent > 0    │
└───────────────────────────────────────────────────────────────────────┘
```

- Eingabe: Scanner, physische Tastatur (`keydown` am Feld trotz `inputmode="none"`) oder Tastenfeld; Suche automatisch nach dem 6. Zeichen über `api.get_pickup_status` (Normalisierung serverseitig korrigiert). Kein Treffer: Feld schüttelt (04 §3.12; ohne bei reduzierter Bewegung) + „Kein Abholcode gefunden.“ + Fokus auf „Ohne Code suchen“.
- **Ohne Code suchen:** Name/Bestellnummer (Bildschirmtastatur, Trefferzeilen 56 px) → Karte mit Hinweis „Ausweis prüfen – kein Abholcode“ → Kästchen 48 px „Ausweis geprüft“ (Pflicht) → „Übergeben“; Kommentar „Übergabe ohne Code, Ausweis geprüft“.
- **Unbezahlt:** „Kunde zur Kassa schicken“ → Karte „Bitte an der Kassa bezahlen · Bestellnummer **PH-S-261103-0009**“ (Mono 32 px) + „Fertig“; mit Schalter `kassaUebergabe` heißt der Knopf „An Kassa übergeben“ und legt die Bestellung in „Offen zum Kassieren“. Kein „Trotzdem übergeben“; die Server Action lehnt `abgeholt_melden` bei `offen_cent > 0` ab (E4).
- **Übergeben:** Tipp → „Übergeben an Fam. Huber“ mit „Rückgängig“ 56 px und Balken 8 s; Commit nach Ablauf oder beim nächsten Scan. Fehltipp nach dem Commit: Leitung „Übergabe zurücknehmen“ (Backoffice-Akte).
- Erfolgskarte bleibt bis zum nächsten Scan oder „Nächster“ (kein Timer, WCAG 2.2.1). Rückmeldung Farbe + Text + Symbol.
- Kachel „Abholungen heute (n)“: `status=abholbereit`, sortiert `abholung_bis`; Realtime-Entfernen nach Übergabe an der Kassa (Polling 60 s, sofort nach eigener Aktion). Kachel „Bezahlte Bestellungen ohne Lieferschein“ ruft `packen()`. Retoure Showroom: Scan Begleitschein-QR → `eingegangen()` + Zustand je Position (Segment, Foto).
- Der Shop belegt keine F-Taste (Tabelle im Logistik-Konzept).

### 9.3 Kassa (Kiosk; ph_kassa baut)

- Gutschein einlösen: `check_voucher` → Betrag min(Rest, Bon) → „Rest danach 37,50 €“ 32 px (auch Kundendisplay) → Kassenbeleg bucht `einloesen(..., zahlung_buchen=False, idempotency_key="kassa:<beleg>:<zeile>")`.
- Gutschein verkaufen: `sell_voucher(wert_cent, beleg_doctype, beleg, idempotency_key, …)` nach Buchung des Kassenbelegs; Bon mit Code einmalig, optional A5-PDF.
- Reservierung/Abholung kassieren: Kassenbeleg bucht die Zahlung mit Bezug PH Bestellung **und** spiegelt `betrag_bezahlt_cent/offen_cent/bezahlt_am/status` (K1); danach „Übergeben“ an der Kassa (bis A11: `abholbereit_melden` + `abgeholt_melden`).
- Erstattungen von Bar/Karte-Anteilen einer Bestellung: Kassa-Auszahlungsbeleg (K3).
- Anzahlung auf Auftrag: ph_kassa/ph_faktura.

### 9.4 Montage/Technik: keine Shop-Funktionen.

---

## 10. Automationen und Erinnerungen

### 10.1 Server (vorhanden, `tasks.py`, Webhook)

| Zeit | Funktion | Sichtbar als |
|---|---|---|
| stündlich | `offene_checkouts_pruefen` (Bezahlvorgang nachlesen → bezahlt oder abgelaufen) | Verlauf „Automatisch abgelaufen – keine Zahlung nach 24 h“ |
| 06:00 | `fristen_pruefen`: Reservierung über Frist ohne `bezahlt_am` → abgelaufen + Mail; Abholfrist überschritten → Aufgabe; Gutschein `gueltig_bis` → Abgelaufen | Glocke, Band |
| 06:00 | `automatisch_abschliessen` nach `auto_abschliessen_tage` (Standard 30) ohne offenen Widerruf | Verlauf „Automatisch abgeschlossen“ |
| 05:00 | `stripe_abgleich` (Auszahlungen, > 7 Tage ohne Auszahlung → Aufgabe) | Stripe-Kopf, Glocke |
| Webhook | Zahlung, Erstattung, Auszahlung, Risiko, Zahlungsstreit (Felder + Aufgabe) | Bänder, Glocke „Zahlungsstreit zu Bestellung PH-S-… – im Stripe-Dashboard öffnen“ |
| Vier-Augen | `rueckerstatten` über Grenze → „Erstattung angefordert“ + Aufgabe GF | Glocke GF mit Zwei-Klick-Knopf |
| Mails | `mails.senden` (Bestätigung mit Rechtstexten bei `freigegeben`, Abholbereit, Versendet, Zahlungslink, Zahlung fehlgeschlagen, Reservierung abgelaufen, Gutschein, Widerruf-Eingang, Anzahlung) | Verlauf-Chip „Mails“; Zustellstatus nur Bestellbestätigung und Widerruf |

### 10.2 Backoffice (ohne App-Änderung, Polling 60 s, keine Selbstbenachrichtigung)

| Auslöser | Erinnerung |
|---|---|
| `bezahlt` ohne Lieferschein > 1 Werktag | Chip „Zu packen 4 · 1 seit gestern“ (orange), „ruht seit“ |
| `abholbereit`/`reserviert` mit `abholung_bis` = morgen | Glocke Team, Chip-Zusatz |
| `pruefen`, Risiko offen | Glocke Leitung hoch |
| Zahlungsstreit mit Frist ≤ 3 Tage | Glocke Leitung hoch |
| Widerruf `erstattung_bis` ≤ 3 Tage, nicht erstattet | Glocke Leitung hoch „Rückzahlungsfrist 17.11.“ |
| Widerruf `mail_status in fehlgeschlagen, limit` | Glocke Team „Eingangsbestätigung nicht zugestellt – drucken und per Post senden“ |
| Reservierung abgelaufen mit Zahlung (`betrag_bezahlt_cent > erstattet_cent`) | Glocke Leitung „Abgelaufen mit Zahlung – erstatten oder verlängern“ |
| Storniert mit offener Erstattung | Glocke Leitung |
| Stripe-Ereignis `fehler`, Auszahlung mit Differenz | Glocke Leitung |
| `shop_modus=live` mit offener Prüfliste | Band Übersicht (Leitung) |
| EU-Versand ≥ 80 % der Schwelle | Glocke Leitung/GF einmal je Schwellenstufe |
| Ausstehende Aktion beim Verlassen ausgeführt/verworfen | Glocke „Für mich“ (§3.1) |

---

## 11. Datenmapping UI → Frappe (Stand v0.2; Spalte „Lücke“ mit gewählter Variante nach E20)

| UI-Funktion | DocType / Methode / Feld | Stand | Lücke → Variante |
|---|---|---|---|
| Liste, Filter, Suche Bestellungen | `getList` PH Bestellung (`status`, `lieferart`, `zahlung`, `bestellart`, `angelegt`, `zugewiesen_an`, `adresse_land`, `modus`, `offen_cent`, `radar_*`) | ✔ | `awb`/`abholcode` nicht in `search_fields` → Suche per `like` je Feld |
| Kanban | `kanban_board.json` PH Bestellungen | ✔ | – |
| Nächster Schritt, Fristen | berechnet (`naechsterSchritt.js`, `fristen.js`) + PH Lieferschein `zugestellt_am` (ph_logistik) | ✔ | – |
| Feldwerte Zuständig, Notiz, Abholfrist | `setValue` | ✔ | – |
| Telefonbestellung / Showroom-Reservierung | `ph_shop.api.backoffice.create_phone_order` | ✔ | ohne E-Mail ✘ → E12 (deaktiviert + Ausweg) |
| Bestätigung verzögert | `bestaetigung_unterdruecken` + `bestaetigung_senden()` | ✔ | – |
| Zahlungslink | `zahlungslink_erstellen(senden)`, `zahlungslink_senden(empfaenger)` | ✔ | – |
| Überweisung erfassen, Teilbetrag | `zahlung_erfassen(kanal, betrag_cent, referenz)` | ✔ | aus `abholbereit` unbezahlt ✘ (B1) → deaktiviert, `AnDieKassa` |
| Bar/Karte im Backoffice | – | bewusst nicht angeboten | Server-Sperre fehlt (A3) |
| Gutschein prüfen/einlösen | `check_voucher`, `gutschein_einloesen` | ✔ | – |
| Abholbereit melden | `abholbereit_melden()` | ✔ | erlaubt `pruefen`, überschreibt Frist ✘ (A2) → UI-Filter, Dialog §6.2 |
| Abholcode erneut senden | `abholcode_erneut_senden()` | ✔ | – |
| Übergeben | `abgeholt_melden()` | ✔ | unbezahlt möglich ✘ (B1) → Server-Action-Prüfung |
| Direkt übergeben aus `bezahlt` | – | ✘ (A11) | Bestätigung + zwei Aufrufe |
| Übergabe zurücknehmen | `abholung_zuruecknehmen(grund)` | ✔ | – |
| Packen, Versendet | `packen()`, `versendet_melden(awb, carrier, benachrichtigen)` | ✔ | Rückmeldung ph_logistik nach Etikett ✘ (L1) → manuell |
| Abschließen, automatisch | `abschliessen()`, `tasks.automatisch_abschliessen` | ✔ | – |
| Rechnung | `rechnung_erstellen()` → Hook | ✘ Hook leer | deaktiviert + Link Faktura |
| Gutschrift bei Erstattung | Hook `ph_shop_gutschrift_erstellen` | ✘ Hook leer | Erstattung bei Rechnung gesperrt (E9) |
| Teilstorno, Teilerstattung, Vorschau | `positionen_stornieren`, `teilerstatten`, `erstattung_vorschau` | ✔ | – |
| Stornieren | `stornieren(grund, erstatten, betrag_cent)` | ✔ | Status-Grenze ✘ (A7) → UI-Grenze E7 |
| Ersatz liefern | `ersatzlieferung_anlegen(…)` | ✔ | – |
| Risiko | `radar_*`, `radar_geprueft(notiz)` | ✔ | – |
| Zahlungsstreit | `PH Zahlung.dispute_*` | ◐ ohne Buchung | Band (A14) |
| Zahlungen, Akte, Erstatten, Freigabe | PH Zahlung, `rueckerstatten`, `erstattung_freigeben`, `erstattung_ablehnen` | ✔ | – |
| Ankündigung stornieren | `ankuendigung_stornieren(grund)` | ✔ | – |
| Auszahlung zuordnen | `auszahlung_zuordnen(auszahlung)` | ✔ | – |
| Gutschein ohne Verkauf | `api.backoffice.issue_voucher` | ✔ | – |
| Gutschein verkaufen | `api.backoffice.sell_voucher` (Kassa) | ✔ | Kassa-Konzept |
| Einlösung zurücknehmen, Restwert gutschreiben | `cancel_voucher_redemption`, `credit_voucher` | ✔ | – |
| Sperren/Entsperren/Ersetzen/PDF | `sperren(grund, sperrgrund_art)`, `entsperren(grund)`, `ersetzen()`, `pdf_senden(…)` | ✔ | – |
| Abgelaufener Gutschein mit Rest | `gueltig_bis` (Feldwert) | ◐ Status bleibt „Abgelaufen“ | Band + „Leitung fragen“ (A12) |
| Gutscheinkauf | `codes_erneut_senden()`, `erstatten(grund, betrag_cent)` | ✔ | – |
| Anzahlung | `link_senden()`, `doppelte_erstatten()`; Anlage in Faktura | ✔ | – |
| Widerruf: Bestätigung, Retoure, Ware erhalten, Ablehnen | `bestaetigung_senden()`, `retoure_anlegen()`, `ware_erhalten()`, `ablehnen(grund)` | ✔ | – |
| Widerruf erstatten | `PH Widerruf.erstatten(betrag_cent, grund)` / `PH Bestellung.teilerstatten` | ◐ | E10 (A5) |
| Widerruf Fristbeginn | `erhalten_am` (`save`) + PH Lieferschein `zugestellt_am` | ◐ | „Zustelldatum übernehmen“ (A6) |
| Absendenachweis | Datei am Widerruf (`uploadFile`) + Kommentar | ✔ (generisch) | Feld folgt (A16) |
| § 18 FAGG, Hinsendekosten-Felder | – | ✘ | Ablehnen-Grund-Text, Berechnung im Client (A16) |
| Retoure Eingang/Prüfung/Erstatten/Ablehnen | `eingegangen()`, `pruefung_abschliessen()`, `erstatten(grund)`, `ablehnen(grund)` | ✔ | Betrag nicht neu berechnet ✘ (A4) → explizit speichern |
| Retoure Grund, Kulanz-Retoure | – | ✘ (A17) | Ersatz/Service-Weg |
| Retourenlabel | – | ✘ (L4) | deaktiviert + Link Logistik |
| Stripe-Ereignisse, Auszahlungen | `erneut_verarbeiten()`, `abgleichen()` | ✔ | – |
| Einstellungen | `save` Single-Docs, `pruefen()` | ✔ | Live-Validierung serverseitig ✘ (A15) → UI-Prüfliste |
| Reports | `getReport` (6) | ✔ | UVA-Logik ✘ (A13) → Band „Entwurf“ |
| EU-Versand-Summe | `getList` PH Bestellung (Summe Client/Server) | ✔ | Schwellenfeld ✘ (A18) → gesetzlicher Wert im Code mit Quelle |
| Löschen | – | in der UI nie | Server-Recht ✘ (A8) |
| Kundendaten Auskunft/Anonymisieren | ph_crm Kundenakte + `ph_shop/ph_shop/kontakt.py` | ✔ | – |
| Audit CSV-Export | – | ✘ (ph_core) | – |

---

## 12. Akzeptanzkriterien (QA)

Prüfung im Mock-Modus (Seed „Fam. Huber“: Versand bezahlt mit Risiko, Showroom-Reservierung unbezahlt mit Frist +20 Tage, Telefonbestellung mit Zahlungslink, Bestellung `pruefen`, `zahlung_ausstehend`, Gutschein teilweise eingelöst + abgelaufener mit Rest, Gutschein-Anrechnung 50 € + Überweisung 39 € auf 89 €, Widerruf mit Retoure (Teilwiderruf 1 von 2), Widerruf ohne Zustellnachweis, Zahlung mit Freigabe-Anforderung, Zahlung mit Zahlungsstreit, Bestellung mit Bar-Eingang aus der Kassa, Stripe-Ereignis `fehler`, Auszahlung mit Differenz, B2B-Bestellung DE mit UID) und auf Frappe-Staging mit `simulation=1`.

1. **Routen/Rechte:** alle Routen laden als Shop-Team; `/shop/stripe`, `/shop/einstellungen` → `/kein-zugriff`; Buchhaltung extern ohne Aktionsknöpfe; `/d/ph-bestellung/<name>` → 307; `/shop/anzahlungen/neu` existiert nicht.
2. **Klickzahlen §1:** jede Zeile im E2E über genau den Weg gemessen; Abweichung = Fehler.
3. **RKSV (E1):** kein Dialog bietet `Bar`, `Karte extern`, `Stripe Terminal`, `Verrechnung` an (grep `backoffice/src/**/shop/**` und DOM aller Dialoge); `AnDieKassa` in S1, S4, Bestellungsakte (reserviert unbezahlt), Packtisch.
4. **Geldprüfung (E4):** Reservierung unbezahlt → kein „Übergeben“ in Akte, Kanban, Packtisch; manipulierter Aufruf der Server Action → `{ok:false, code:"invalid"}`, kein `abgeholt_melden` im Mock-Protokoll; „Abholbereit melden“ für unbezahlte Reservierung deaktiviert mit Grund; Massenaktion überspringt sie mit „erst nach Zahlung“.
5. **Teilzahlung:** Gutschein 50 € + Überweisung 39 € auf 89 € → `betrag_bezahlt_cent=8900`, Status erst danach `bezahlt`; S1 Live-Satz nennt „offen danach“.
6. **Primäraktion:** parametrisierter Test 17 Status × Zahlungsweg (Website-Checkout/Telefon/Showroom) × `offen_cent` (0/>0) gegen Tabelle §5.1; `zahlung_ausstehend` und Website-`offen` ohne Primäraktion, Band sichtbar.
7. **Undo (N1–N3):** Kanban-Zug nach „Versandbereit“, sofort Liste öffnen → Zielstatus mit Ring + „Rückgängig“, Zeilenknopf deaktiviert „Läuft noch“; Mock lässt `packen` scheitern → Toast ohne Ablauf mit Nummer + Glocke; Tab schließen innerhalb 8 s → genau ein Aufruf (Beacon), Glocke beim nächsten Laden; Auswahl 3 → „Packen“ → `Esc` → 0 Aufrufe vor 8 s, Auswahl bereits leer; 4 Züge in 4 s → ein Sammeltoast, Einzel-Undo je Dokument, keine Aufrufe vor Ablauf.
8. **Frist (N5/N6):** Reservierung mit vereinbarter Frist +20 Tage, bezahlt → „Abholbereit melden“ öffnet Bestätigung „Frist verkürzt sich …“; Massenaktion mit `pruefen` → „übersprungen (zuerst prüfen)“.
9. **Neue Bestellung:** Showroom sendet `bestellart=Showroom`, `lieferart=abholung`, `senden=0`, keinen `status`; Telefon erzeugt Zahlungslink, Mail erst nach 8 s; `Z` innerhalb 8 s → kein `zahlungslink_senden`/`bestaetigung_senden`; `gmial.com` zeigt Vorschlag; ohne E-Mail: Auswege sichtbar, kein Absenden; Doppelklick → eine Bestellung.
10. **Storno (E7–E9):** aus `versendet` kein „Stornieren“, stattdessen „Widerruf erfassen“; Bestellung mit Bar-Eingang → Erstattung gesperrt mit Ersatzweg; Bestellung mit Rechnung (Mock) → Primär deaktiviert „Erst Gutschrift in Faktura“; Storno Gutschein + Stripe → Vorschau zeigt beide Wege, Ergebnis mit Gutschein-Gutschrift; über Grenze → Band „wartet auf Freigabe“.
11. **Teilerstattung S9:** 1 von 2 Positionen → Betrag = Zeilenbetrag, USt-Aufteilung angezeigt, `teilerstatten` mit `zeilen` aufgerufen; unbezahlter Teilstorno → Hinweis neuer Zahlungslink.
12. **Widerruf:** Versand 03.11., Zustellung 06.11. (Lieferschein), Widerruf 19.11. → Ampel „fristgerecht ab Zustellung“, „Zustelldatum übernehmen“ setzt `erhalten_am`, Server meldet `fristgerecht=1`; ohne Zustellnachweis kein Ablehnen-Grund „Frist überschritten“; Belehrung nicht nachweisbar → Wertminderung gesperrt; Teilwiderruf → Hinsendekosten 0; Erstatten deaktiviert bis Eingang oder Nachweis; Nachweis > 10 MB → Fehlertext.
13. **Retoure:** Wertminderung 30 € → gespeicherter `erstattungsbetrag_cent` sinkt um 30 € vor `pruefung_abschliessen` (Mock-Protokoll: `save` vor Methode).
14. **Gutscheine:** Klartext-Code nur in Ergebnis-Karte S5/Ersetzen (Response-Bodies geprüft); Esc/außen klicken schließt sie nicht; S5 nur Leitung, sendet `art=Mehrzweck` und `grund`; Gutscheinakte ohne freies „Einlösen“; „Einlösung zurücknehmen“ verlangt Grund; Restwert zählt abgelaufene mit Rest.
15. **Freigabe (N8):** Doppelklick < 300 ms → kein `erstattung_freigeben`; zweiter Klick nach 700 ms → genau ein Aufruf; Hover hält das 10-s-Fenster; Knopfbreite konstant (Pixelvergleich).
16. **Listen/Akten (N10/N11):** Zahlungen und Gutscheine ≤ 5 Reiter + „+“, kein Reiter dupliziert einen Filter; „Testdaten anzeigen“ überall Chip; Zahlungsliste 7 Spalten ohne horizontalen Scroll bei 1180 px; jede Akte hat dokumentunabhängig dieselben Tabs (Snapshot je Akte-Typ mit Freigabe/Doppelt/ohne).
17. **Kürzel (N12):** Einstellung „Einzeltasten-Kürzel aus“ → `z`, `n`, `s`, `e`, `k`, `.`, `1–9`, `Shift+O/R` wirkungslos, `⌘/Strg`-Kürzel weiter; `k` in Bestellungsakte öffnet Kundenakte, in der Liste vorige Zeile; `s` in der Liste öffnet „Nächster Schritt“; `⌘P` öffnet Druckpanel; Registry ohne Doppelbelegung.
18. **Texte (N13):** grep sichtbarer UI-Strings nach „Refund“, „Scheduler“, „PI “, „Payout“, „Dispute“, „Radar“, „Submit“, „DocType“ = 0; keine Badge-Texte mit `ae|oe|ue`-Ersatz; Rollentexte neutral.
19. **Töne (N14):** `storniert`, `widerrufen`, `erstattet`, `abgelaufen` grau mit Icon; rot nur `fehlgeschlagen`, `checkout_fehler`, `pruefen`, Abgelehnt, Fehlgeschlagen (Snapshot der Tonklassen).
20. **Packtisch (N15):** unbezahlt → „Kunde zur Kassa schicken“ mit Nummer 32 px; „Ohne Code suchen“ → Übergabe erst nach „Ausweis geprüft“, Kommentar vorhanden; Code `K7PL3Q` gefunden; physische Tastatur tippt ins Feld; Erfolgskarte ohne Timer.
21. **Rechnung (N16/E6):** „Rechnung erstellen“ ohne Hook deaktiviert mit Satz + Link; vor Versand/Übergabe nicht angeboten; mit Hook (Mock) Bestätigung mit Betrag und Nummernhinweis.
22. **Server-Lücken (N19):** jede Zeile mit Lücke in §11 zeigt genau eine der zwei Varianten (Checkliste je Zeile).
23. **Einstellungen (N20/E18):** `⌘S` ändert `shop_modus` nie; „Live schalten“ nur mit vollständiger Prüfliste; `auto_abschliessen_tage` < 28 (≠ 0) → Feldfehler; Tabs = Route.
24. **Kennzahlen:** „Eingänge Shop“ zählt keine PH Zahlung mit `quelle=kassa`; Shop-Team sieht keine Geldkacheln/Charts; Kachel verzögert → übrige sichtbar; kein Count-up.
25. **Leerzustände (N18):** jeder Leertext aus §4/§5 als Mock-Fall mit Screenshot hell/dunkel.
26. **Barrierefreiheit/Leistung:** axe serious/critical = 0 (Übersicht, Liste, Kanban, Akten, S1–S10, Packtisch) hell und dunkel; 200 % Zoom bei 1280 px → Kartenansicht über Container-Breite; reduzierte Bewegung ohne Shake/Slide; Liste < 400 ms (Mock), Akte-Kopf < 1 s (Frappe); Fokus nach Dialogen zurück am Auslöser.
27. **Löschen:** kein „Löschen“ im DOM einer Shop-Akte oder -Liste (alle Rollen).

---

## 13. Was hier anders ist als in SHD marahplus / typischer Branchensoftware

1. **Stripe als Akte:** jedes Ereignis sichtbar, in Klartext, idempotent nachverarbeitbar; Auszahlungsabgleich mit Gebühr je Zahlung täglich, Differenzen als Aufgabe.
2. **Vier-Augen-Erstattung in der Glocke** mit Zwei-Klick-Knopf und automatischem Protokoll.
3. **Gutschein-Codes nur als Hash;** Verlust → „Ersetzen“ über den Restwert, Code einmalig sichtbar.
4. **Kasse ist die Kasse:** Bargeld und Karte nie am Backoffice-Rechner – das Backoffice reicht an die Kassa weiter; RKSV bleibt sauber, ohne dass jemand die Regel kennen muss.
5. **Widerrufsfristen ab Zustellung aus der Sendungsverfolgung,** Ampel mit Quelle, Rückzahlung positionsgenau mit USt-Aufteilung.
6. **Kanban, das Arbeit auslöst und verzeiht:** Ziehen erzeugt Lieferschein oder Abholcode, 8 Sekunden zurücknehmbar, ausstehende Schritte sind überall sichtbar.
7. **Telefonbestellung mit Zahlungslink in fünf Klicks,** Belehrung in der Linkmail, Bestätigung erst nach dem Undo-Fenster.
8. **Geldfluss-Vorschau vor jeder Erstattung:** Weg je Zahlung, Gutschein-Rückbuchung, Belege, Freigabe – nichts bewegt Geld ohne Vorschau.
9. **Testmodus sichtbar getrennt,** Live schalten nur mit Prüfliste.
10. **Ehrliche Lücken:** fehlt eine Server-Funktion, sagt der Knopf das und zeigt den Ersatzweg.

---

## 14. Anfragen (keine Annahmen im Bau)

### 14.1 ph_shop

| Nr. | Anfrage | Priorität |
|---|---|---|
| A1 | `ist_bezahlt()` auf Beträge: `offen_cent = 0 and (gesamt_cent > 0 or bestellart = "Ersatz")`; `BEZAHLT` ohne `abholbereit` nur für Reports; Test „reserviert → abholbereit → abgeholt_melden wirft“, „zahlung_erfassen aus abholbereit unbezahlt bucht“ | vor Kiosk-Abholung |
| A2 | `abholbereit_melden`: `pruefen` nicht zulassen; vorhandene spätere `abholung_bis` behalten (`max(alt, heute + frist)`) | hoch |
| A3 | `PH Zahlung.validate`: Kanäle `Bar`, `Karte extern`, `Stripe Terminal` nur mit `quelle=kassa` (+ Kassenbeleg-Bezug); Text „Barzahlungen werden an der Kassa gebucht (Registrierkassenpflicht).“; `_geld_zurueck` erstattet Bar-Anteile nicht selbst, sondern meldet „an der Kassa auszahlen“ | vor Livebetrieb |
| A4 | `PH Retoure.validate`: Erstattungsbetrag bis `Geprueft` immer neu rechnen (zurückgegebene Positionen − Wertminderung), manuelle Abweichung nur mit `erstattung_manuell` + Hinweis; `PH Retoure Position.bestellung_position` | hoch |
| A5 | `PH Widerruf.erstatten(zeilen, versand_cent, grund)` und `PH Retoure.erstatten` delegieren an `PH Bestellung.teilerstatten` (alle Zahlungen, USt, Gutschrift-Hook); Bestellstatus `widerrufen` nur bei Vollwiderruf, sonst `teilerstattet`; `PH Widerruf Position.bestellung_position` | hoch (Frist § 14 FAGG) |
| A6 | `PH Widerruf.validate`: `erhalten_am` aus `PH Lieferschein.zugestellt_am`, sonst Versand + Laufzeit nur als Vorschlag; `fristgerecht` im Zweifel 1; `frist_verlaengert` (Belehrung fehlte → + 12 Monate); `widerruf_anlegen` ebenso | hoch |
| A7 | `stornieren` nur aus den Workflow-Status (nicht `versendet`, `abgeholt`, `widerrufen`) | mittel |
| A8 | `delete: 0` für alle Rollen außer System Manager auf allen Shop-DocTypes; `on_trash` wirft, sobald Zahlung, Mail oder Nummer beim Kunden war (§ 131/132 BAO) | vor Livebetrieb |
| A9 | `kunde_email` nicht Pflicht bei `quelle in (backoffice, kassa)` mit neuem `kontaktweg` (`E-Mail · Telefon · Ausdruck`); Druckformat „PH Bestellung Reservierung“ (A5 mit Abholcode); `PH Widerruf.kunde_email` oder `anschrift` Pflicht + `bestaetigung_weg` | mittel |
| A10 | Reservierung mit `betrag_bezahlt_cent > 0` läuft nicht automatisch ab; Aufgabe an Leitung | mittel |
| A11 | `abgeholt_melden` auch aus `bezahlt` bei Abholung (direkte Übergabe ohne Abholbereit-Mail) | mittel |
| A12 | Gutschein: Methode „verlängern/reaktivieren“ (Leitung, Grund); `gutschein_gueltig_jahre` Standard 0; Report „Gutschein Bestand“ zählt alle Status mit Rest; Feld `unentgeltlich` + Grund (statt Kommentar) | mittel |
| A13 | Report USt: Monat = Leistungsdatum (Zustellung/Versand/Übergabe), Abschnitt Vorauszahlungen, Minderung im Erstattungsmonat, Kassa-bezahlte Bestellungen ausgeschlossen (`kassenbeleg`-Link) | vor UVA-Nutzung |
| A14 | Zahlungsstreit buchen: `art=Ausgang` bei Eröffnung/Verlust (Betrag + Gebühr), Gegenbuchung bei `won`; Status-Ergänzung „Zahlungsstreit“ | mittel |
| A15 | `PH Shop Einstellungen.validate`: `live` nur mit `rechtstexte_status=freigegeben` und neuem Feld `ust_freigabe_am` | hoch |
| A16 | `PH Bestellung Position.widerruf_ausgeschlossen` + `ausschluss_grund` (aus PH Produkt); `PH Widerruf.hinsendekosten_cent`, `ruecksendekosten_kunde`, `absendenachweis`, `absendenachweis_am` | mittel |
| A17 | `PH Retoure.grund` (Pflicht); `PH Bestellung.retoure_anlegen(grund)` für Kulanz ohne Widerruf | niedrig |
| A18 | `waehrung=EUR` erzwingen außer `quelle=kassa`; `oss_schwelle_cent`; `uid_geprueft_am`, `uid_ergebnis` | mittel |
| A19 | Teillieferung (`geliefert_menge`, Status `teilversendet`) | niedrig |
| A20 | Mail-Zustellstatus für Abholbereit/Gutschein/Anzahlung; Vorlagen „Abholfrist geändert“, „Reservierung storniert“; QR im Abholbereit-Mail; TEST-Wasserzeichen in allen Formaten; `PH Stripe Auszahlung.gebuehrenbeleg` | niedrig |

### 14.2 ph_faktura

F1 Hooks registrieren: `ph_shop_rechnung_erstellen` (Wrapper um `create_cash_invoice`) und `ph_shop_gutschrift_erstellen` (Gutschrift aus `PH Bestellung Erstattung.satz_json`). F2 `create_cash_invoice`: Leistungsdatum = Zustellung/Versand/Übergabe statt `bezahlt_am`; nicht vor Versand/Übergabe; Rückwärtslink an der Bestellung. F3 Export-Lauf übernimmt PH Zahlung, Gegenbuchungen und Auszahlungen (Geldtransit, Gebühren Reverse Charge).

### 14.3 ph_kassa

K1 Kassenbeleg mit Bezug PH Bestellung spiegelt `betrag_bezahlt_cent`, `offen_cent`, `bezahlt_am`, Status. K2 Liste „Offen zum Kassieren“ (Shop-Bestellungen ohne Kundenwahl) als Ziel von „An Kassa übergeben“. K3 Auszahlung von Bar/Karte-Anteilen einer Shop-Bestellung (Storno/Widerruf) mit Kassenbeleg, danach Shop-Storno ohne Erstattung. K4 Gutscheinverkauf über `sell_voucher`. K5 „Übergeben“ an der Kassa.

### 14.4 ph_logistik

L1 Nach Etikett/Übergabe an den Versanddienst `PH Bestellung.versendet_melden(awb, carrier)` aufrufen. L2 `zugestellt_am` lesbar für Shop-Rollen (PH Lieferschein) – optional Spiegel an PH Bestellung. L3 Bestand je Produkt lesbar (Lager/Showroom) für die Produktsuche; Wareneingang aus Retoure. L4 Retourenlabel aus PH Retoure (setzt „Label gesendet“/„Unterwegs“).

### 14.5 Fundament / UX-Lead

Speicher `ausstehend` + `vormerkenAction/commitAction/verwerfenAction` + Route `/api/undo-commit` (Beacon); Toast-Regeln (Esc nie, Sammeltoast, „Jetzt ausführen“); Zwei-Klick-Knopf als Komponente und Muster in 02 §6.2; Benutzereinstellung „Einzeltasten-Kürzel aus“; Entscheidung `p` vs. `⌘P`; Glocke mit Inline-Aktionen; Side-Peek-Taste; Kürzel-Registry; Container-Query-Kartenansicht in DataTable. ph_core: Audit bei CSV-Export, Protokoll der Palettensuche nach Personendaten.

### 14.6 Steuerberater, Kanzlei, Inhaber

| An | Frage |
|---|---|
| StB | Soll-/Istbesteuerung; Leistungsdatum Versand (Übergabe an Versanddienst oder Zustellung); Freigabe `ust.py`/`teilerstattung.py`; Kulanzgutscheine (Entgeltsminderung); Stripe-Gebühren-Buchung; Ausfuhr im Reiseverkehr für Schweizer Abholkunden; ig. Lieferung an Firmenkunden in DE |
| Kanzlei | Telefonbestellung mit Abholung und Zahlung über Link: Belehrung wie Fernabsatz (heute ja); Showroom-Reservierung: Belehrungstext (heute geht die Fernabsatz-Belehrung mit); Gutscheinbefristung; Liste der § 18-FAGG-Ausnahmen im Sortiment |
| Inhaber | Shop nur in EUR (Vorschlag ja); Bar-/Kartenerstattungen nur an der Kassa (Vorschlag ja); Reservierung ohne E-Mail zulassen mit Ausdruck (Vorschlag ja, nach A9); Vier-Augen-Grenze 1.000 € bestätigen; `auto_abschliessen_tage` 30 bestätigen; Reservierungs- und Abholfrist 7 Tage bestätigen |

---

## 15. Bauauftrag

### 15.1 Dateien und Routen (`backoffice/`)

```
src/app/shop/
  layout.js                       Pills nach Rechten (keine Sitzungsprüfung im Layout)
  page.js  loading.js             Übersicht
  bestellungen/page.js            Liste | Kanban, Dialog ?neu=telefon|showroom
  bestellungen/neu/page.js        redirect → ?neu=telefon
  bestellungen/[name]/page.js     Akte
  zahlungen/page.js  zahlungen/[name]/page.js
  gutscheine/page.js  gutscheine/[name]/page.js  gutscheinkaeufe/[name]/page.js
  widerrufe/page.js  widerrufe/[name]/page.js  retouren/page.js (redirect)  retouren/[name]/page.js
  anzahlungen/page.js  anzahlungen/[name]/page.js
  stripe/page.js  stripe/ereignisse/[name]/page.js  stripe/auszahlungen/[name]/page.js
  berichte/[report]/page.js
  einstellungen/page.js
src/app/api/undo-commit/route.js  nur falls Fundament nicht rechtzeitig liefert (später übergeben)
src/components/Backoffice/Shop/   Komponenten 15.2
src/lib/backoffice/shop/
  actions.js         "use server" – alle Mutationen (15.3)
  daten.js           server-only Lesen (Listen, Akten, Bezüge, Kennzahlen, Zu erledigen)
  status.js          Anzeige/Ton/Icon je DocType (rein)
  primaer.js         Primär-/Sekundär-/⋯-Aktionen je Status × Zahlungsweg × Geld (rein)
  naechsterSchritt.js  Regel §6.1 (rein)
  geld.js            offen, vollBezahlt, barEingang, Rechnung vorhanden (rein)
  fristen.js         Zustellung, Belehrung nachweisbar, Widerrufsfristen, abschliessenAb (rein)
  schalter.js        §2.7 (Meta-Erkennung + Konstanten)
  texte.js           Glossar, Verlaufs-Übersetzung, Toast-/Band-/Leertexte, Erstbesuch
  stripeTypen.js     Ereignisart → Klartext (rein)
  emailTipp.js       Domain-Verdreher (rein)
  kennzahlen.js      Zähler/Kacheln §7 (gleiche Filter wie Listen)
  zuErledigen.js     Zeilen-Bausteine (auch für Zentrale)
src/lib/backoffice/mock/  Seed-Ergänzungen Shop (§12-Fälle) über die bestehende Erweiterungsstelle
tests/unit/backoffice-shop-*.test.mjs   tests/e2e/shop.spec.js   tests/e2e/shop-packtisch.spec.js
```
Einträge: `bereiche.js` (Pills/Unterseiten Shop), `suche.js` (Palette: „> telefonbestellung“, „> reservierung“, „> zahlung erfassen“, Treffer PH Bestellung mit Status + Nächster Schritt), `ROUTEN`-Register, Kürzel-Registry.

### 15.2 Komponenten (`components/Backoffice/Shop/`)

| Komponente | Art | Zweck |
|---|---|---|
| `ShopPills` | Server | Unternavigation mit „Mehr ▾“ |
| `HeuteLeiste`, `ZuErledigen`, `ShopKacheln`, `StripeKarte`, `EinrichtenCheckliste` | Server + Client-Zeilen | §4.1 |
| `BestellListe`, `BestellZeileKnopf`, `BestellPeek` | Client (DataTable) | §4.2 |
| `BestellKanban`, `BestellKarte`, `VerschiebenSheet` | Client (Kanban) | §4.4 |
| `NeueBestellungDialog`, `KundeFeld` (mit `emailTipp`), `ProduktPositionen`, `VersandWahl` | Client | §4.3 |
| `BestellAkte`, `BestellKopf`, `BestellBaender`, `Phasenleiste`, `ZahlungTab`, `PositionenTab`, `KundeLieferungTab`, `VerlaufTab` | Server + Client | §5.1 |
| `AusstehendBadge` | Client | §3.1 (liest `useAusstehend`) |
| `AnDieKassa` | Client | §3.3 |
| `ZahlungErfassenDialog` (S1), `GutscheinEinloesenDialog` (S2), `StornoDialog` (S3), `ErstattenDialog` (S4), `GutscheinOhneVerkaufDialog` (S5), `SammelStornoDialog` (S8), `TeilerstattungDialog` (S9), `ErsatzDialog` (S10), `SollIstDialog`, `VersendetMiniDialog`, `RechnungBestaetigung`, `FristVerkuerztDialog`, `WiderrufErfassenDialog` | Client | §6.4 |
| `EinmalCodeKarte` | Client | §5.3 |
| `ZweiKlickKnopf` | Client | §3.4 (bis Fundament liefert) |
| `ZahlungsListe`, `ZahlungsAkte`, `FreigabeBand`, `StreitBand`, `RisikoBand` | Client/Server | §4.5, §5.2 |
| `GutscheinListe`, `GutscheinAkte`, `GutscheinkaufAkte`, `RestBalken` | Client/Server | §4.6, §5.3, §5.4 |
| `WiderrufRetourenSeite`, `WiderrufKanban`, `FristAmpel`, `WiderrufAkte`, `WiderrufPositionen`, `NachweisUpload`, `RetourenAkte`, `WertminderungFeld` | Client/Server | §4.7, §5.6, §5.7 |
| `AnzahlungListe`, `AnzahlungAkte` | Client/Server | §4.8, §5.5 |
| `StripeSeite`, `EreignisAkte`, `AuszahlungAkte` | Client/Server | §4.9, §5.8 |
| `ShopModusBlock`, `EinstellungenTabs` | Client | §4.10 |
| `ShopBericht`, `EuVersandBericht` | Server | §4.11 |
| `AbholungKarte`, `AbholungenHeute`, `CodeTastenfeld`, `OhneCodeSuche` | Client | §9.2 (Einbindung durch Logistik-Agent in die Packtisch-Shell) |
| `NichtVerfuegbar` | Server/Client | Regel E20 (deaktivierter Knopf + Satz + Ersatzlink) |

Wiederverwendet: `Shell`, `Seitenkopf`, `DataTable`, `Kanban`, `Formular`, `Segment`, `Knopf`, `StatusBadge`, `Kennzahl`, `Charts`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `KioskShell`, `useScanner`, `useTastenkuerzel`, `useDruck`.

### 15.3 Server Actions (`lib/backoffice/shop/actions.js`)

Alle: `requireSession()`, `darfDoc` + Rollenprüfung erneut, Eingaben per zod, Rückgabe `{ ok, code, message, ergebnis?, fehler? }`, `idempotency_key` bei Anlage/Geld, keine Personendaten im Log, danach `updateTag` (§6.3).

| Action | Prüfung (zusätzlich zu Recht) | Frappe |
|---|---|---|
| `vormerkenAction({aktion, doctype, name, args})` | Aktion aus Whitelist, Vorbedingung erfüllt (z. B. Geldprüfung) | – (Token im Server-Store) |
| `commitAction({token})` / `verwerfenAction({token})` | Token gehört Sitzung, einmalig | führt hinterlegte Methode aus |
| `bestellungAnlegenAction({modus, kunde, positionen, lieferart, adresse, versand_cent, notiz_kunde, notiz_intern, abholung_bis?, idempotency})` | E-Mail gültig; Preis = Sortimentspreis außer Leitung; EUR; CH-Versand nein | `call ph_shop.api.backoffice.create_phone_order(senden=0)`; ggf. `setValue notiz_intern`, `abholung_bis` |
| `zahlungErfassenAction({name, betrag_cent, referenz, idempotency})` | `offen_cent ≥ betrag`; Status nicht `zahlung_ausstehend` (außer Leitung), nicht abholbereit-unbezahlt bis A1; EUR | `runDocMethod zahlung_erfassen("Ueberweisung", betrag_cent, referenz)` |
| `zahlungslinkAction({name, senden})` | Status erlaubt | `runDocMethod zahlungslink_erstellen` (+ Commit `zahlungslink_senden`) |
| `gutscheinPruefenAction({code})` | Rate-Limit 10/min je Sitzung | `call ph_shop.api.backoffice.check_voucher` |
| `gutscheinEinloesenAction({name, code, betrag_cent})` | `betrag ≤ min(Rest, offen)` | `runDocMethod gutschein_einloesen` |
| `abholbereitAction` (über Commit) | `lieferart=abholung`, Status `bezahlt|reserviert`, `offen_cent=0` bis A1 | `runDocMethod abholbereit_melden` |
| `uebergebenAction` (über Commit) | `status=abholbereit` (bzw. `bezahlt` bei Direkt), `offen_cent=0`, ohne Code: `ausweisGeprueft=true` | `runDocMethod abholbereit_melden` (nur Direkt) + `abgeholt_melden`; `kommentar` |
| `abholungZuruecknehmenAction({name, grund})` | Leitung | `runDocMethod abholung_zuruecknehmen` |
| `packenAction`, `versendetAction({awb, carrier})`, `abschliessenAction`, `bestaetigungSendenAction`, `abholcodeErneutAction` (über Commit) | Statusregeln §5.1; Packen nicht bei ungeklärtem Steuerfall (außer Leitung) | `runDocMethod packen|versendet_melden(benachrichtigen=1)|abschliessen|bestaetigung_senden|abholcode_erneut_senden` |
| `rechnungAction({name})` | Schalter `rechnung`; Status `versendet|abgeholt|abgeschlossen` | `runDocMethod rechnung_erstellen` |
| `geprueftAction({name})`, `zurueckAufOffenAction` (Commit) | Leitung, `getTransitions` | `workflowAction` |
| `risikoGeprueftAction({doctype, name, notiz})` | – | `runDocMethod radar_geprueft` |
| `erstattungVorschauAction({name, zeilen, versand_cent, kulanz_cent})` | lesend | `runDocMethod erstattung_vorschau` |
| `teilerstattenAction({name, zeilen, versand_cent, kulanz_cent, grund, art, idempotency})` | Leitung; kein Bar-Eingang (E8); Rechnung ⇒ Schalter `gutschrift` (E9) | `runDocMethod teilerstatten` |
| `teilstornoAction({name, zeilen, grund})` | unbezahlt: Team (Commit); bezahlt: wie `teilerstattenAction` | `runDocMethod positionen_stornieren` |
| `stornierenAction({name, grund, erstatten, betrag_cent, idempotency})` | Leitung; Status nach E7; E8/E9 | `runDocMethod stornieren` |
| `sammelStornoAction({namen[], grund, erstatten})` | wie oben je Dokument | sequenziell `stornieren` |
| `ersatzAction({name, zeilen, grund, bezug_doctype, bezug, lieferart})` (Commit) | Grund Pflicht | `runDocMethod ersatzlieferung_anlegen` |
| `widerrufErfassenAction({name, kanal, text})` (Commit) | Status `versendet|abgeholt|abgeschlossen` | `runDocMethod widerruf_anlegen` |
| `rueckerstattenAction({zahlung, betrag_cent, grund, idempotency})` | Leitung; Kanal nicht bar; `betrag ≤ offen` | `runDocMethod PH Zahlung.rueckerstatten` |
| `freigebenAction({zahlung})` / `ablehnenFreigabeAction({zahlung, grund})` | GF; Zwei-Klick-Token (600 ms–10 s) | `erstattung_freigeben` / `erstattung_ablehnen` |
| `ankuendigungStornierenAction({zahlung, grund})` | Leitung | `ankuendigung_stornieren` |
| `alsBezahltBuchenAction({zahlung})` | Team, `docstatus=0` | `submit PH Zahlung` |
| `auszahlungZuordnenAction({zahlungen[], auszahlung})` | – | `runDocMethod auszahlung_zuordnen` je Zahlung |
| `gutscheinOhneVerkaufAction({wert_cent, grund, motiv, empfaenger, grusstext, kaeufer, senden_an, test})` | Leitung; Grenzen; `art="Mehrzweck"` | `call ph_shop.api.backoffice.issue_voucher` |
| `einloesungZuruecknehmenAction({gutschein, beleg_doctype, beleg, grund})` | Leitung | `call …cancel_voucher_redemption` |
| `restwertGutschreibenAction({gutschein, betrag_cent, grund, idempotency})` | Leitung | `call …credit_voucher` |
| `gutscheinSperrenAction`, `gutscheinEntsperrenAction`, `gutscheinErsetzenAction`, `pdfSendenAction` (Commit) | Leitung (außer PDF) | `sperren`, `entsperren`, `ersetzen`, `pdf_senden` |
| `gutscheinGueltigkeitAction({name, gueltig_bis})` | Leitung | `setValue gueltig_bis` |
| `gutscheinkaufMailAction` (Commit), `gutscheinkaufErstattenAction({name, grund, betrag_cent})` | Leitung bei Erstatten | `codes_erneut_senden`, `erstatten` |
| `anzahlungLinkAction` (Commit), `doppelteErstattenAction` | Leitung bei Erstatten | `link_senden`, `doppelte_erstatten` |
| `widerrufBestaetigenAction`, `retoureAnlegenAction`, `wareErhaltenAction` (Commit) | Statusregeln §5.6 | `bestaetigung_senden`, `retoure_anlegen`, `ware_erhalten` |
| `zustelldatumUebernehmenAction({widerruf, datum})` | Datum aus PH Lieferschein (serverseitig neu gelesen) | `save PH Widerruf.erhalten_am` |
| `nachweisHochladenAction({widerruf, datei})` | PDF/JPG ≤ 10 MB | `uploadFile` + `kommentar` |
| `widerrufErstattenAction({widerruf, zeilen, versand_cent, grund, idempotency})` | Leitung; Ware da oder Nachweis; E8/E9; Weg E10 | `PH Widerruf.erstatten(betrag_cent)` **oder** `PH Bestellung.teilerstatten(…)` + `kommentar` am Widerruf |
| `widerrufZuordnenAction({widerruf, bestellung|gutschein_bestellung})` | – | `save PH Widerruf` |
| `ablehnenAction({doctype, name, grund, grundArt})` | Leitung; „Frist“ nur nach §3.7 | `runDocMethod ablehnen` |
| `retoureEingangAction` (Commit), `pruefungAbschliessenAction({name, positionen, belehrungBestaetigt})`, `retoureErstattenAction` | Wertminderung nur mit Belehrung; Betrag explizit | `eingegangen`; `save PH Retoure` (Positionen, `erstattungsbetrag_cent`) + `pruefung_abschliessen`; E10 |
| `aufgabeAction({art, bezug, text})` | – | `insert PH Aufgabe` (Leitung fragen, Wareneingang, Lieferschein stornieren) |
| `ereignisErneutAction`, `abgleichenAction`, `alleAbgleichenAction`, `schluesselPruefenAction` | Leitung | `erneut_verarbeiten`, `abgleichen`, `pruefen` |
| `einstellungenSpeichernAction({doc, modified})` | Leitung; `shop_modus` nie enthalten; `auto_abschliessen_tage` 0 oder ≥ 28 | `save PH Shop Einstellungen` / `PH Stripe Einstellungen` |
| `shopModusAction({ziel})` | Leitung; `live` nur mit vollständiger Prüfliste (serverseitig neu geprüft) | `setValue shop_modus` (zurück auf Test über Commit) |
| `ustFreigabeErfassenAction({datum, kanzlei})` | Leitung | `kommentar PH Shop Einstellungen` |
| `feldwertAction({doctype, name, feld, wert, modified})` | Feld-Whitelist (`zugewiesen_an`, `notiz_intern`, `abholung_bis`, `hinweis`, `datum_bank`, `link_gueltig_bis`, `notiz`) | `setValue` |

### 15.4 Frappe-Aufrufe zum Lesen (`daten.js`)

`getList`/`count`: PH Bestellung, PH Zahlung, PH Gutschein, PH Gutschein Bestellung, PH Widerruf, PH Retoure, PH Anzahlung, PH Stripe Ereignis, PH Stripe Auszahlung, PH Lieferschein (`bestellung`, `zugestellt_am`, ph_logistik), PH Rechnung (Bezug Bestellung, ph_faktura), PH Produkt (ph_sortiment, Produktsuche), PH Kontakt (ph_crm, `searchLink`), PH Aufgabe/ToDo (Glocke). `getDocMitInfo` für Akten (Versionen, Kommentare, Communication). `getTransitions` (Workflow-Knöpfe). `getKanban` PH Bestellungen/Widerrufe/Retouren. `getReport` 6 Reports. `getPdf` Druckformate. `runDocMethod erstattung_vorschau` (lesend). `call ph_shop.api.backoffice.check_voucher`, `ph_shop.api.get_pickup_status` (Packtisch). `getDoc` PH Shop Einstellungen, PH Stripe Einstellungen. ph_core: `recentActivity`, `globalSearch`.

### 15.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Reine Module (`status`, `primaer`, `naechsterSchritt`, `geld`, `fristen`, `schalter`, `texte`, `stripeTypen`, `emailTipp`) + Unit-Tests; Mock-Seed (§12) | Regeln grün |
| 2 | Layout/Pills, Routen, Umleitungen, Rechte, Palette, Kürzel | Navigation |
| 3 | Ausstehende Aktionen (mit Fundament; sonst eigene Route), `AusstehendBadge`, Sammeltoast, `ZweiKlickKnopf`, `AnDieKassa`, `NichtVerfuegbar` | Muster §3 |
| 4 | Bestellliste + Peek + Massenaktionen; Kanban | Tagesgeschäft Packen/Abholung |
| 5 | Bestellungsakte (Kopf, Bänder, Phasen, 5 Tabs, Primärmatrix) | Akte vollständig |
| 6 | Neue Bestellung (Telefon/Showroom), S1, S2, Zahlungslink | Bestellungen ohne Desk |
| 7 | S3, S8, S9, S10, Rechnung-Bestätigung, Widerruf erfassen | Storno/Erstattung |
| 8 | Zahlungen: Liste, Akte, S4, Freigabe-Band, Glocken-Freigabe, Streit/Risiko | Leitung/GF |
| 9 | Gutscheine: Liste, Akte, Gutscheinkauf, S5, Einmal-Code, Einlösung zurücknehmen | – |
| 10 | Widerruf & Retouren: Seite, Kanban, Akten, Fristen, Positionen, Nachweis, Erstatten (E10) | rechtssicherer Widerruf |
| 11 | Anzahlungen, Stripe, Einstellungen (Shop-Modus), Berichte inkl. EU-Versand | – |
| 12 | Übersicht (Heute, Zu erledigen, Kacheln, Charts), Glocken-Einträge §10.2 | Bereichsstart |
| 13 | Packtisch-Karten (Abholung, ohne Code, Kassa-Hinweis) zur Einbindung durch Logistik | Kiosk |
| 14 | Druck, E2E, axe hell/dunkel, Screenshots Leerzustände | Abnahme |
| 15 (Phase B) | Schalter einzeln aktivieren bei Lieferung A1–A20, F1–F3, K1–K5, L1–L4 | volle Funktion |

### 15.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Reine Module + Seed + Unit-Tests | 6 |
| 2 Navigation/Routen/Rechte/Palette | 2 |
| 3 Muster (ausstehend, Toasts, Zwei-Klick, Kassa, Nicht verfügbar) | 5 |
| 4 Liste + Kanban + Massenaktionen | 8 |
| 5 Bestellungsakte | 8 |
| 6 Neue Bestellung, S1, S2, Zahlungslink | 6 |
| 7 Storno/Erstattung S3, S8, S9, S10, Rechnung, Widerruf erfassen | 8 |
| 8 Zahlungen + S4 + Freigabe + Bänder | 6 |
| 9 Gutscheine | 5 |
| 10 Widerruf & Retouren | 9 |
| 11 Anzahlungen, Stripe, Einstellungen, Berichte | 7 |
| 12 Übersicht + Glocke | 4 |
| 13 Packtisch-Karten | 4 |
| 14 Druck, E2E, axe, Screenshots | 8 |
| **Phase A gesamt** | **86** |
| 15 Phase B (je Schalter 0,5–2 h, nach Backend) | 12 |

### 15.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament | `ausstehend`-Speicher, Commit-Route, Toast-Regeln | alle Undo-Aktionen | eigene Route `api/undo-commit` im Bereich, später übergeben |
| Fundament | Zwei-Klick-Knopf, Glocke mit Inline-Aktion | GF-Freigabe in der Glocke | Freigabe in der Zahlungsakte |
| Fundament | Kürzel-Registry + Einzeltasten-Abschalter | QA 17 | lokale Registrierung über `useTastenkuerzel` |
| ph_shop A1 | Geldbasierte Bezahlt-Prüfung | Phasenvariante 3, S1 aus abholbereit | E4 |
| ph_shop A3, A8, A15 | Server-Sperren (RKSV, Löschen, Live) | Livegang Backoffice-Shop | UI-Sperren (gleiche Regeln in Server Actions) |
| ph_shop A5, A6 | Widerruf positionsgenau, Fristbeginn | sauberer Widerrufsstatus | E10, E11 |
| ph_faktura F1/F2 | Rechnung/Gutschrift-Hooks | Rechnung, Erstattung nach Rechnung | E6, E9 |
| ph_kassa K1–K3 | Zahlung spiegeln, Liste, Bar-Erstattung | Kassa-Übergabe, Abholung unbezahlter Reservierungen | Bestellnummer nennen; Leitung prüft manuell |
| ph_logistik L1–L4 | Versand-Rückmeldung, Zustellung, Bestand, Retourenlabel | automatische Schritte | manuell, Aufgabe |
| ph_logistik | Packtisch-Shell, F-Tasten | Einbindung §9.2 | Karten im Mock-Kiosk testbar |
| ph_crm | PH Kontakt, Kundenakte, Datenschutz | Kunde wählen, Auskunft | – (vorhanden) |
| ph_service | Servicefall aus Reklamation | „Reklamation an Service“ | Aufgabe an Service |
| ph_sortiment | Produktsuche, später § 18-Kennzeichen | Positionen | – (vorhanden) |
| Zentrale | Einbindung `zuErledigen`, GF-Kennzahlen | – | Shop-Übersicht |
| StB/Kanzlei/Inhaber §14.6 | Freigaben | UVA-Nutzung, Live-Prüfliste vollständig, Belehrungstexte | Bänder „Entwurf“ / „Prüfliste offen“ |

### 15.8 QA-Checkliste (Abnahme)

**Allgemein:** Primäraktion eindeutig mit `⌘↵` · Filter in URL, Zurück stellt wieder her · Skeleton ab 300 ms, min. 600 ms, CLS 0 · drei Leerzustände je Liste, jeder Leertext aus §4/§5 als Mock-Fall mit Screenshot hell/dunkel · Fehlertexte ohne Technikbegriffe · axe serious/critical = 0 hell und dunkel · Desktop 1440, iPad quer 1180, iPad hoch 820, Telefon 375×667 · Mock-Modus vollständig · ESLint 0 Fehler · Unit-Tests der reinen Module grün.

**Fach und Recht**
1. Kein Bar/Karte/Terminal/Verrechnung in Backoffice-Dialogen; `AnDieKassa` überall, wo Geld vor Ort fließt.
2. Keine Übergabe bei `offen_cent > 0` (Client, Server Action, Packtisch, Kanban).
3. Storno nur aus erlaubten Status; Bar-Eingang und vorhandene Rechnung sperren Erstattung mit Ersatzweg.
4. Teilerstattung/Widerruf positionsgenau mit USt-Anzeige; Hinsendekosten-Regel; Erstatten erst ab Ware oder Nachweis.
5. Widerrufsfrist ab Zustellung, Quelle sichtbar; „Frist überschritten“ nur mit Zustellung und nachweisbarer Belehrung.
6. Wertminderung nur mit Belehrung; Retouren-Betrag explizit gespeichert.
7. Gutschein: Art Mehrzweck, unbefristet als Standard, ohne Verkauf nur Leitung mit Grund, Code einmalig.
8. Live nur mit Prüfliste; UVA-Bericht mit Band „Entwurf“; EU-Versand-Bericht mit Schwelle und Hinweis „nur Shop“.
9. Kein Löschen im DOM; `ip_hash` nirgends sichtbar.
10. Nur EUR; Fremdwährung mit Band und gesperrten Geld-Dialogen.

**Bedienung**
11. Klickzahlen §1 per E2E.
12. Undo: Zustand in Liste/Kanban/Akte, Fehler ohne Ablauf + Glocke, Beacon, `Esc` ohne Wirkung, Sammeltoast.
13. Zwei-Klick-Freigabe: 600 ms Sperre, 10 s Fenster, Hover pausiert, konstante Breite.
14. Akten mit fixen Tabs; Bänder statt bedingter Tabs; ≤ 2 Bänder sichtbar.
15. Listen: ≤ 5 Reiter, Testdaten als Chip, 7 Spalten ohne Scroll bei 1180 px, iPad 4 Spalten, Container-Kartenansicht bei 200 % Zoom.
16. Kürzel: Registry ohne Doppelbelegung, Einzeltasten abschaltbar, `k`/`s`/`e`/`⌘P` wie §2.5.
17. Texte: Glossar-grep = 0, Status mit Umlauten, Töne nach §2.2.
18. Server-Lücken: jede ✘-Zeile §11 genau eine Variante (deaktiviert + Ersatzweg / ausgeblendet).
19. Packtisch: Tastenfeld 32 Zeichen, physische Tastatur, ohne Code mit Ausweis, Kassa-Hinweis 32 px, Erfolgskarte ohne Timer, reduzierte Bewegung ohne Shake.
20. Animationen nur mit Token-Dauern (120/160/200/240 ms) und Easing aus 04; `prefers-reduced-motion` getestet (Kanban-Rückkehr, Zeile ausblenden, Dialog, Drawer).

---

## 16. Änderungsprotokoll

### 16.1 Fassung 3 (2026-11-04) – aus `20-kritik-ux-shop.md` (Runde 2)

| Kritik | Änderung | Abschnitt |
|---|---|---|
| N1 | Ausstehende Aktion als Zustand in allen Sichten (Speicher, Badge mit Ring, deaktivierte Primäraktion, Fehler ohne Ablauf + Glocke, Beacon-Ergebnis) | §3.1, §12.7 |
| N2 | `Esc` berührt Undo-Toasts nie; Esc-Reihenfolge; Auswahl wird bei Start aufgehoben; „Jetzt ausführen“ statt „×“ | §2.5, §3.1 |
| N3 | Sammeltoast statt Verdrängen | §3.1 |
| N4 | Keine „Zahlung erfassen“-Primäraktion bei Stripe-Bestellungen; Bänder „unterwegs“/„nicht abgeschlossen“; Leitung-Weg mit Warnsatz; Test × Zahlungsweg | §5.1, §12.6 |
| N5 | Frist-Vergleich vor „Abholbereit melden“ (Toast mit alt/neu, Dialog bei Verkürzung); Positionsänderung in Reservierung → Band | §6.2, §5.1 |
| N6 | Massenaktion/Zeilenknopf ohne `pruefen` | §4.2, §4.4 |
| N7 | S5-Kassa-Variante gestrichen; Verkauf an der Kassa, im Shop „Gutschein ohne Verkauf“ (Leitung) über vorhandenes `issue_voucher` | E2, §6.4 S5, §1 |
| N8 | Zwei-Klick mit 600 ms Sperre, 10 s Fenster, Pause bei Hover/Fokus, konstante Breite | §3.4 |
| N9 | (a) Ausweg ohne E-Mail; (b) Tippfehler-Prüfung, Adresse fett mit „ändern“, Bestätigung erst nach 8 s; (c) Bestand in der Produktsuche (sobald lesbar); (d) „Leitung fragen“ | §4.3, E12 |
| N10 | Reiter-Regel; Zahlungen 5 Ansichten + 7 Spalten; Gutscheine Alle/Offen/Läuft ab; Test überall Chip | §3.5, §4.5, §4.6 |
| N11 | Fixe Tabs je Akte, Freigabe/Doppelt/Streit als Bänder; Widerrufsakte ohne Tab „Mails“; Gutscheinakte ohne „Gestaltung“ | §3.6, §5 |
| N12 | `k` in Akten, `⌘P` statt `p`, `s`/`e` definiert, `←/→` im Widerrufe-Kanban nur Fokus, Einzeltasten abschaltbar | §2.5, E16 |
| N13 | Glossar ergänzt (Erstattung, Zahlungsstreit, automatisch, Risiko), Anzeige-Spalte je Status, Verlaufstexte übersetzt, grep erweitert | §2.2, §2.6, §12.18 |
| N14 | Storno/Widerruf/Erstattet/Abgelaufen grau mit Icon, Icons für türkise Status | §2.2 |
| N15 | „Kunde zur Kassa schicken“ bis Kassa-Liste; „Ohne Code suchen“ mit Ausweisprüfung | §9.2 |
| N16 | Eine Klasse je Aktion; Rechnung = Bestätigung; Retoure/Ware erhalten/Zurück auf Offen = Undo; Widerruf erfassen = Dialog + Undo | §3.2, §6.3 |
| N17 | Ein Einlöse-Dialog ohne zweite Rückfrage; Korrektur über „Einlösung zurücknehmen“ (jetzt whitelisted) | §6.4 S2, §5.3 |
| N18 | Fehlende Leerzustände ergänzt (Retouren-Positionen, Käufer, Anzahlungen gefiltert, Auszahlung ohne Zeilen, Berichte, Freigabe, Abholbahn) | §4, §5 |
| N19 | Einheitliche Regel für fehlende Server-Funktionen + Schalter-Datei + Variante je Lücke | E20, §2.7, §11 |
| N20 | Tabs = Route (`versand`), Block „Shop-Modus“ mit Prüfliste, `⌘S` ohne `shop_modus` | §4.10 |
| Empf. 3.1 | Zeilenknopf-Sichtbarkeit; Widerrufsliste mit Zeilenknöpfen; Anzahlung im Shop ohne Anlage (Faktura); „Rechnung“ als Bezugstyp entfernt; Abholbahn 3 Spalten + Zahlstand | §3.5, §4.4, §4.5, §4.7, §4.8 |
| Empf. 3.2 | Peek-Fokusfluss; Ziffern im Status-Menü; Phasenpunkte `aria-disabled`; Tastatur am Packtisch | §4, §2.5, §2.3, §9.2 |
| Empf. 3.3 | Container-Kartenansicht; Spinner mit `role=status`; Chip 0 als `span`; Fokus nach Ausblenden; Bottom-Sheet ≥ 44 px | §3.1, §3.5, §4.1, §9.1 |
| Empf. 3.4 | Grenzen nach 02 §11.1; iPad 4 Spalten; Safe-Area und Toasts über der Leiste | §9.1, §4.2 |
| Empf. 3.5 | Übersicht nach Rolle, oben Arbeit; Icons je Status; `<kbd>` nur im Tooltip | §4.1, §2.2, §2.5 |
| Empf. 3.6 | „Reserviert bis“ als Platzhalter; Klickzahl Abholbereit 2 ab `/shop`; Knopftext ohne Fristreset (eigene Methode); Kassa übergibt direkt | §4.3, §1.1, §5.1, §9.3 |
| §5 Leitlinien-Widersprüche | als Anfragen an Fundament/UX-Lead übernommen (Undo-Variante A/B, `Z`+`⌘Z`, 8 s, Esc, Sammeltoast, `⌘P`, `k`, `Alt+1…9`, 2.1.4, Zwei-Klick, Toast unten rechts) | §14.5 |

### 16.2 Fassung 3 – aus `21-kritik-fach-shop.md`

| Kritik | Änderung | Abschnitt |
|---|---|---|
| P1, R1, U7–U9 | Kein Barumsatz im Backoffice; `AnDieKassa`; Bar-Erstattung nur an der Kassa; Server-Sperre angefragt | E1, E8, §3.3, §6.4, A3, K3 |
| P2, B1, U1 | Geldprüfung statt Statusprüfung; Abholbereit bis A1 nur bezahlt; Server Action blockt | E4, §5.1, §9.2, A1 |
| P3, B2 | Im Code behoben → Teilbetrag frei, Tab Zahlung listet alle Eingänge | E3, §5.1, §6.4 S1 |
| P4, B5, R5, U16, F5 | Frist ab Zustellung aus PH Lieferschein, „Zustelldatum übernehmen“ | E11, §3.7, §5.6, A6, L2 |
| P5, R6, U20, F10 | Live nur mit Prüfliste inkl. Rechtstexte und StB-Freigabe; Band bei bestehendem Live-Betrieb | E18, §4.10, A15 |
| P6, B4, U5, U6 | Widerruf positionsgenau über `teilerstatten` (vorhanden), Anzeige „Teilweise widerrufen“ | E10, §5.6, A5 |
| P7, R7 | § 18-FAGG-Grund im Ablehnen-Dialog; Feld angefragt | §5.6, A16 |
| P8, R9 | Hinsendekosten-Regel, Rücksendekosten nur mit Belehrung, Zurückbehaltung bis Ware/Nachweis, Nachweis-Upload | §5.6, A16 |
| P9, R10, U15, F6 | Ausweg ohne E-Mail, Brief-Widerruf über Bestellung; Kontaktweg/Ausdruck angefragt | E12, §4.3, §5.6, A9 |
| P10, B6, B13 (Buchh. B1), U4, U13 | Storno/Erstattung zeigt Verteilung aller Zahlungen; bei Rechnung gesperrt bis Gutschrift-Hook; Storno nach Versand gesperrt | E7, E9, §6.4 S3/S8/S9, A7, F1 |
| P11, B7, R8, U11 | UVA-Bericht als „Entwurf“; Kennzahl „Eingänge“ ohne Kassa | §4.11, §7, A13 |
| P12, B9, U21 | Kein Löschen in der UI; Server-Sperre angefragt | §3.6, A8 |
| P13, R12, B3, U3 | Reklamation → Service, Ersatz → `ersatzlieferung_anlegen`; Retouren-Betrag explizit; Wertminderung nur mit Belehrung | §5.7, S10, A4, A17 |
| P14, R13, R14, B10, U10, U17, Buchh. B6 | Mehrzweck fest, unbefristet Standard, ohne Verkauf nur Leitung mit Grund; Restwert inkl. abgelaufener; „davon ohne Verkauf“ | E2, §4.6, §4.10, §5.3, A12 |
| P15, U19, Buchh. B4 | Zahlungsstreit-Bänder aus `dispute_*`, Ansicht, Glocke; Buchung angefragt | §4.9, §5.1, §5.2, A14 |
| P16, B7 (Buchh.) | Nur EUR | E19, A18 |
| P17, R4 | Bericht EU-Versand mit Schwelle und Band ab 80 %; `oss_aktiv` mit Rückfrage | §4.10, §4.11, A18 |
| P18, R3 | Band „Steuerfall klären“ bei UID + DE, Packen nur Leitung | §5.1, §6.1, A18 |
| P19, U24 | Abschließen ab Zustellung + 28 Tage; `auto_abschliessen_tage` ≥ 28 | §3.7, §4.10, §6.1 |
| P20, R11 | Abschlussweg über vorhandenes `bestellart`; Kanzlei-Frage | E13, §4.3, §14.6 |
| P21, R15, F9 | Datenschutz über Kundenakte (vorhanden), `ip_hash` entfernt | E17, §5.1 |
| P22 | Kulanz über `teilerstatten(kulanz_cent)`, Ersatzlieferung; Kulanz-Retoure angefragt | §6.4 S9/S10, A17 |
| R2, B8, U12, F8 | Rechnung Pflicht-Hinweis bei UID/Wunsch, erst ab Versand/Übergabe, Bestätigung; Rechnungslauf nach Hook | E6, §4.11, §5.1, F2 |
| R16 | Neutrale Rollentexte | Kopf, §1 |
| Buchh. B2, B3 | Gebührenbeleg-Ablage, Export-Lauf als Anfrage | §4.9, F3 |
| Buchh. B5, U14 | Kassa-Zahlungen nicht in Shop-Kennzahlen; Spiegelung angefragt | §7, K1 |
| Buchh. B8, U23 | Kanal „Verrechnung“ entfernt | E1 |
| Buchh. B9 | USt-Aufteilung je Erstattung über `teilerstatten` | §6.4 S9 |
| Buchh. B10, R8 | Anzahlung nur Kontrollansicht, Anlage in Faktura | E14, §4.8 |
| F1 | Teillieferung nicht unterstützt, Anfrage niedrig | A19 |
| F2 | Umtausch = Widerruf + neue Bestellung; Ersatzlieferung für Schäden | §5.7 |
| F3 | Wiedereinlagern → Aufgabe Logistik | §5.7, L3 |
| F4 | Glocke „Abgelaufen mit Zahlung“, Band, Anfrage | §5.1, §10.2, A10 |
| F7 | Band „Storniert – Erstattung offen/wartet auf Freigabe“ | §5.1 |
| U2 | Positionen nur über Teilstorno änderbar | §5.1 |
| U22 | Desk-Knöpfe irrelevant (Frappe unsichtbar) | – |
| Randfälle §6 (Fachkritik) | SEPA-Rückbuchung = Zahlungsstreit-Band; Gutschein-Anrechnung erstatten = Restwert zurück; Gutscheinkauf-Widerruf mit Teil-Einlösung → erstattbar = Rest; Bestätigung fehlgeschlagen → PDF-Druck | §5.1, §5.2, §5.4, §8 |

### 16.3 Aus dem Codestand v0.2 (ohne Kritiknummer)

| Befund | Änderung |
|---|---|
| `create_phone_order`, Zahlungslink, `bestaetigung_unterdruecken` vorhanden | „Neue Reservierung“ wird „Neue Bestellung“ (Telefon/Showroom) mit verzögerter Mail |
| `normalisiere_abhol` korrigiert | Sonderregel Packtisch gestrichen |
| `abholung_zuruecknehmen`, `abholcode_erneut_senden`, `ankuendigung_stornieren`, Versand-Mail, Auto-Abschluss, Rückwärtslink Widerruf vorhanden | aus den Lücken genommen, in Akten eingebaut |
| `radar_*` + `radar_geprueft` | Risiko-Band, Ansicht, Zu erledigen |
| `teilerstatten`, `positionen_stornieren`, `ersatzlieferung_anlegen` | neue Dialoge S9, S10 |

*Ende 10 – Konzept Shop (Fassung 3, final).*
