# R3-recht-vorschau – Bericht

Stand 26.10.2026 · Branch `feature/neuauftritt` (nichts committet).

## Ergebnis

Vier Rechtstexte als gerenderte Anwalts-Vorschau im Neuauftritt (ui-Bausteine, Inhaltsverzeichnis mit Ankern, sticky ab `lg`, Dokument-Umschalter, Prüfkasten, Liste aller offenen Stellen):

- `/de/preview/recht` (Übersicht), `/de/preview/recht/{datenschutz,impressum,agb,barrierefreiheit}`
- Nur Dev oder `LEGAL_PREVIEW=1` (Muster `/de/preview/fehler`, `force-dynamic`, Schalter zur Laufzeit), sonst 404. Immer `noindex, nofollow, nocache`. Nicht in der Sitemap. Nur `de`.
- Texte wortgetreu aus `Marktresearch/recht/01`, `02`, `04`. Eckige Klammern werden automatisch als offene Stellen markiert (Typ anwaltlich / Unternehmen / prüfen) und gezählt; jeder Abschnitt trägt „[anwaltlich prüfen] · n offene Stellen“.
- Datenschutz neu ergänzt: 5.18 Kundenportal, 5.19 Uploads, 5.20 Online-Planer (Feature-Dokus + Werte aus `src/lib/portal/privacy.js`, `src/lib/upload/config.js`), 5.10 KI-Concierge mit Hinweis auf die Abweichung Labs-Code ↔ Entwurf (`RETENTION_DAYS` aus `src/lib/concierge/config.js`). Die 5 bekannten Fehler (D1, D2 Privacy Shield, D3, D5, D8) stehen im Prüfkasten.
- Firmendaten (Landstraße 11, Telefon, E-Mail, Profile) nur aus `src/lib/site.js`. Registerdaten aus Entwurf 04 in `LegalDrafts/company.js`.
- Beschlüsse des Rechtspakets (W1, W6–W10, W12–W15) als Kästen an der jeweiligen Stelle.
- Mappe: `Marktresearch/recht/anwalt-vorschau.md` (Links, 5 Fehler, Prüfliste je Abschnitt).

Offene Stellen: Datenschutz 89 (22 anwaltlich), Impressum 28 (5), AGB 112 (37), Barrierefreiheit 11 (3).

## Dateien

- `src/app/[locale]/preview/recht/page.js`, `src/app/[locale]/preview/recht/[doc]/page.js`
- `src/components/LegalDrafts/{index,inline,Prose,LegalDraftPage,company}.js`, `docs/{datenschutz,impressum,agb,barrierefreiheit}.js`
- `tests/unit/r3-recht.test.mjs` (8 Tests), `tests/e2e/r3-recht.spec.js` (7 Tests; mit `LEGAL_PREVIEW_EXPECT=off BASE_URL=…:3100` prüft er 404+noindex in Produktion)
- `Marktresearch/recht/anwalt-vorschau.md`
- QA: `qa-screenshots/teamleiter/r3-R3-recht-vorschau/selbst/` (shoot.mjs), `qa-screenshots/teamleiter/r3-recht-vorschau/details.mjs` + `details/` (Ankeransichten, axe, Überlauf)

Live-Seiten `/datenschutz`, `/impressum` unverändert. Keine Messages, keine npm-Pakete.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| shoot.mjs, 4 Seiten × iPhone/Android/iPad/Desktop | 16× 200, Bilder angesehen. Konsolenfehler nur fremd (HMR `src/lib/seo/llms.js` im ersten Lauf, React-Warnung eines Client-Bausteins der Shell) |
| Nachbesserung nach Sichtung | H1 brach in WebKit ohne Trennstrich („Datenschutzerkl/ärung“) → weiche Trennung an der Fuge; Meta-Hinweise mit Klammern wurden als offene Stellen gezählt → umformuliert; `[MODUL]` als Etikett statt offene Stelle; kurze Platzhalter ([14], [3 Jahre]) als „vom Unternehmen“ |
| axe WCAG 2.2 AA (`details.mjs`, 4 Geräte × 4 Seiten) | 0 Verstöße; Überlauf 0 px auf allen Geräten |
| e2e `r3-recht.spec.js --project=desktop` | 7/7 grün (200, noindex, 1 H1, Anker, axe, 404 für `/en` und Unbekanntes, nicht in Sitemaps) |
| Unit `r3-recht.test.mjs` | 8/8 grün (Schalter, Markup, Zählung, neue Abschnitte, 5 Fehler, site.js-Adresse, keine „Landstraße 9“, kein „abgesichert“, `findClaims` leer) |
| curl Dev | 4× 200 mit `noindex, nofollow, nocache`; `/en/preview/recht/agb` 404 mit `noindex`; `sitemap-static.xml` ohne `preview` |
| curl Produktion | **nicht gelaufen**: kein Prod-Server auf :3100, Build im Repo verboten. Schalter per Unit-Test belegt (`NODE_ENV=production` → aus), 404-Pfad identisch mit Dev-404 (noindex). Lauf mit dem e2e-Modus `LEGAL_PREVIEW_EXPECT=off` an R3-release übergeben |
| eslint eigene Dateien | 0 Meldungen |
| check:claims | keine Funde in eigenen Dateien (30 bestehende Funde anderer Pakete) |

## Offene Punkte

1. Prod-curl (404/noindex ohne `LEGAL_PREVIEW`) im Prod-Check von R3-release: `LEGAL_PREVIEW_EXPECT=off BASE_URL=http://localhost:3100 npx playwright test r3-recht.spec.js --project=desktop`.
2. Registerdaten (FN, UID, Geschäftsführung) gehören nach `src/lib/legal/company.js` (Besitz R3-marken-seo); dann in `LegalDrafts/company.js` nur importieren.
3. Widersprüche für die Kanzlei: KI-Concierge (Entwurf lit b/30 Tage vs. Code Einwilligung/90 Tage), Upload/Planer (Einwilligung vs. lit b), AGB-Zahlungsplan vs. W6, AGB 14.3 vs. W7, Verweis AGB 8.3 → § 13 statt § 16; Upload-GPS nur bei JPEG entfernt.
4. Barrierefreiheit hat keinen Textentwurf; die Seite ist nur das Gerüst nach § 14 BaFG.
5. Cookie-Banner verdeckt in den Screenshots mobil den unteren Rand (R3-shell).

## Nachbesserung nach QM-Feedback (26.10.2026, Note vorher 8,5)

| Punkt | Stand |
|---|---|
| P2-2 Zählung AGB (112 vs. 118/124) | **behoben.** Zählregel festgelegt: eine offene Stelle = eine **äußere** Klammer; innere Klammern sind Teil dieser Stelle (`parts`), werden punktiert statt hinterlegt dargestellt und tragen kein `data-open-point`. Ursache der 118: die 6 inneren Klammern der AGB waren als eigene `<mark data-open-point>` gerendert (112 + 6); die Schlussliste rendert jetzt ebenfalls ohne innere Marks. Zusätzlich gefunden: der Kopf (Fassung/Vorbemerkung) hatte offene Stellen ohne Badge (Datenschutz 2, AGB 3) → Badge ergänzt. Kanzlei-Kasten nennt die Regel und „6 innere Klammern, nicht gesondert gezählt“. Jetzt gilt in allen 4 Texten: Kasten = Summe der Badges = Marks im Text = Einträge der Schlussliste (Datenschutz 89, Impressum 28, AGB 112, Barrierefreiheit 11). Mappe `Marktresearch/recht/anwalt-vorschau.md` um die Zählregel ergänzt. |
| P2-1 Produktions-404 | **teilweise.** Zusätzliche Sperre: `VERCEL_ENV=production` schaltet die Vorschau auch mit `LEGAL_PREVIEW=1` aus (Unit-Test). `LEGAL_PREVIEW` ist im Repo nirgends gesetzt (keine `.env*`, keine Vercel-Konfiguration; nur in Paketdateien referenziert). Hosting-Umgebung von hier nicht einsehbar. Prod-Lauf weiter offen, weil kein Server auf :3100 läuft und Build im Repo verboten ist → R3-release: `LEGAL_PREVIEW_EXPECT=off BASE_URL=http://localhost:3100 npx playwright test tests/e2e/r3-recht.spec.js --project=desktop`. |
| P3 X-Robots-Tag, Registerdaten nach `src/lib/legal`, Cookie-Banner | offen, fremde Dateien (`next.config.js`/proxy, `src/lib/legal` = R3-marken-seo, Banner = R3-shell). |
| P3 Sammelliste Widersprüche | offen (inline-Hinweise bleiben; Liste siehe „Offene Punkte“ Nr. 3). |

Prüfung nach Fix:
- Unit `r3-recht.test.mjs`: 10/10 (neu: Vercel-Produktion aus; Zählregel mit festen Zahlen inkl. AGB 6 innere Klammern, Liste = Summe).
- e2e `r3-recht.spec.js --project=desktop` gegen :3000: 7/7 (neu je Dokument: Kasten = Badges = Marks im Text = Listeneinträge, 0 verschachtelte `data-open-point`, 0 Marks in der Liste; axe ohne serious/critical).
- shoot.mjs `qa-screenshots/teamleiter/r3-recht-vorschau/fix/`: 5 Seiten × 4 Geräte 200, 0 Konsolenfehler, kein Überlauf; Detailbilder `agb-zaehlregel--*`, `agb-innere-klammer--*`, `agb-kopf--*` (Skript `fix/detail.mjs`) angesehen.
- eslint eigene Dateien: 0 Meldungen.
