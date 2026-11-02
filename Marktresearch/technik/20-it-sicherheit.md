# 20 – IT-Sicherheit: Website, Backoffice, geplante Funktionen

**Stand:** 26.10.2026 · Rolle: IT-Sicherheitsexperte (Expertenrat) · Methode: Code gelesen, `npm audit` (nur Bericht, kein `fix`), Gesetzes- und Advisory-Quellen geprüft. **Es wurde nichts angegriffen, nichts gescannt und nichts im Code geändert.**

> Die Abschnitte zu Pflichten (DSGVO, NISG 2026, PCI DSS) sind fachliche Einschätzungen und **keine Rechtsberatung**. Vertragliche/rechtliche Punkte sind mit [anwaltlich prüfen] markiert. Angaben, die nur das Unternehmen kennt, mit [vom Unternehmen auszufüllen].

---

## 0. Kurzfassung (für den Inhaber)

| # | Befund | Risiko | Aufwand | Wann |
|---|---|---|---|---|
| 1 | **Next.js 16.3.4 + sharp 0.35.4 mit kritischen Lücken** (u. a. Remote Code Execution in der Bildoptimierung bei SVG; die Seite hat `dangerouslyAllowSVG: true`) | **kritisch** | 1–2 h (Update + Test) | **sofort** |
| 2 | **Formular-Endpunkte im Backoffice sind „Gast“-Methoden ohne Bot-Schutz**: kein Rate-Limit, kein Captcha, Honeypot nur beim Newsletter; Next leitet den **ganzen** Request-Body ungefiltert ans Backoffice weiter | hoch (Spam, Lead-Verlust, Datenmüll, mögliche Feldmanipulation) | 1–2 Tage | vor Ads-Start |
| 3 | **Backoffice (Frappe) direkt öffentlich erreichbar**, laut Code-Kommentar teils mit dem Werkzeug-**Entwicklungsserver**; 2FA, Rollen, Backups unbelegt | hoch | 1–3 Tage + Klärung | nächste 4 Wochen |
| 4 | **Keine Content-Security-Policy**, `/api/image` ist ein halboffener Proxy auf das Backend mit Backend-Content-Type und `Access-Control-Allow-Origin: *` | mittel | 1 Tag | nächste 4 Wochen |
| 5 | **Karriere-Formular verschickt nichts** (Bewerbung + Lebenslauf werden nur simuliert, Erfolg wird trotzdem angezeigt) | mittel (Integrität, Vertrauen, Datenschutz-Information falsch) | 2 h (abschalten) | sofort |
| 6 | Geplante Funktionen (KI-Raumplaner-Upload, Gutschein-Shop, Video-Beratung, Kundenportal) brauchen **vorab** ein Sicherheitsgerüst: Upload-Pipeline, gehosteter Checkout, Webhook-Signaturen | hoch, sobald live | in den Feature-Aufwand einrechnen | mit dem jeweiligen Feature |
| 7 | **NIS2/NISG 2026 gilt sehr wahrscheinlich nicht** (kein NIS-Sektor, unter mittlerer Größe) – DSGVO Art. 32/33 gilt aber voll | – | 0,5 Tag Dokumentation | Q4 2026 |
| 8 | **Marken-/Fake-Shop-Schutz** fehlt: kein DMARC-Monitoring belegt, keine Domain-Überwachung, Premium-Marken sind beliebtes Fake-Shop-Ziel | mittel | 1 Tag + laufend 15 min/Monat | Q4 2026 |

Positiv: Revalidate-Webhooks sauber abgesichert (konstanter Vergleich, ohne Secret alles gesperrt), `.env*` und `*.pem` gitignored und **nicht** im Repo, CMS-HTML wird serverseitig per Allowlist bereinigt, `/cmx`-Dateiproxy ist vorbildlich eingeschränkt, Newsletter-Route ist Muster für alle anderen Formulare, Portal-Krypto (HMAC, getrennte Zwecke, `timingSafeEqual`, Pflicht-Secret in Produktion) ist solide.

---

## 1. Umfang und Vorgehen

Gelesen wurden: `src/app/api/*/route.js` (6 Routen), `src/app/revalidate/*`, `src/app/cmx/[...path]/route.js`, `src/lib/revalidateAuth.js`, `src/lib/revalidate.js`, `src/lib/apiBaseUrl.js`, `src/lib/portal/*`, `src/proxy.js`, `next.config.js`, `ecosystem.config.js`, `.gitignore`, `src/app/robots.js`, `src/lib/shop/shopProducts.js` (Sanitizer), die Formular-Clients (`Kontakt`, `AnfrageFormProduct`, `BeratungClient`, `Newsletter`, `AdventsabendForm`, Karriere `jobdetailsclient.js`), außerdem `Marktresearch/digital/06`, `07`, `14`.

Nicht geprüft (kein Zugriff, nur Code): Server-/nginx-Konfiguration, Frappe-Instanz und deren Rollen, Hosting-Vertrag, Mail-DNS (SPF/DKIM/DMARC), tatsächliche Backups. Diese Punkte sind als Fragen an das Unternehmen in Abschnitt 11 gesammelt.

Hosting laut `ecosystem.config.js`: **selbst gehostet** mit PM2 (`next start`, Port 3000, Logs unter `/var/log/`), davor nginx (laut Kommentar in `next.config.js`). Das ist relevant, weil mehrere Next-Advisories ausdrücklich **self-hosted** betreffen.

---

## 2. Abhängigkeiten (npm audit, nur gelesen)

`npm audit --omit=dev` am 26.10.2026:

| Paket | Installiert | Betroffen | Schwere | Relevanz für Platzhirsch |
|---|---|---|---|---|
| `next` | **16.3.4** | 16.0.0 – 16.4.0 | **kritisch** | 11 Advisories. Besonders relevant: **GHSA-2464-fhr4-w9xw** – Unauthenticated RCE in Image Optimization bei SVG (CVSS 4.0: 9.5, glibc-Linux; gepatcht in **16.4.1**, Workaround `sharp ≥ 0.35.5`). Die Seite nutzt `next/image` mit `dangerouslyAllowSVG: true` und läuft auf Linux. Außerdem **GHSA-cjq9-62q9-8jv4** (SSRF in Image Optimization), **GHSA-4jqv-mc3x-m676 / GHSA-mcj8-r9mp-w47p** (Cache-Poisoning von SSG/ISR bei self-hosted – die Seite nutzt ISR/Revalidate), **GHSA-vcvr-r3jv-pc5j** (RCE in `next/og`), **GHSA-p3m5-59mp-jv5r** (DoS über Server Actions) |
| `sharp` | 0.35.4 | < 0.35.5 | hoch | librsvg-Lücke (CVE-2026-96889, GHSA-wq5f-xc86-pv6w) – Grundlage des RCE oben |
| `source-map-js` | – | 1.0.0 – 1.2.1 | hoch | Event-Loop-DoS; nur Build-Zeit, gering |

`package.json` erlaubt `"next": "^16.2.9"` – ein `npm install` auf dem Server zieht also nicht automatisch die gepatchte Version, solange `package-lock.json` 16.3.4 festhält.

**Maßnahme M1 (sofort):** `next` auf ≥ 16.4.1 und `sharp` auf ≥ 0.35.5 heben, Build + Sichtprüfung (Bildoptimierung, ISR, Sprachen), deployen. Bis dahin als Übergang `dangerouslyAllowSVG` auf `false` setzen, falls keine SVGs über `next/image` laufen [vom Entwickler zu prüfen].
**Dauerhaft:** Dependabot/Renovate oder wöchentlich `npm audit --omit=dev` im CI; Next-Security-Releases abonnieren (GitHub „Watch → Security alerts“ für `vercel/next.js`).

Quellen: [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), `npm audit`-Ausgabe 26.10.2026, `node_modules/next/package.json` (16.3.4), `node_modules/sharp/package.json` (0.35.4).

---

## 3. API-Routen und Formulare

### 3.1 Bestandsaufnahme

| Route | Validierung | Längen-Limits | Honeypot | Rate-Limit | Captcha | Gibt Backend-Fehler an Browser? | Leitet ganzen Body weiter? |
|---|---|---|---|---|---|---|---|
| `POST /api/kontakt` | Pflichtfelder, E-Mail-Regex, Telefon-Regex, Mindestlänge | **nein** (nur Minimum) | **nein** | **nein** | nein | **ja** (`details: errorData`, `error.message`) | **ja** |
| `POST /api/beratung_anfrage` | Pflichtfelder, E-Mail, Telefon, Mindestlänge | nein | nein | nein | nein | ja | ja |
| `POST /api/anfrage_produkt` | Pflichtfelder, E-Mail, Firmenfelder bei „Geschäft“ | nein | nein | nein | nein | ja (inkl. komplettem `data`) | ja |
| `POST /api/newsletter_subscribe` | Typprüfung, E-Mail ≤ 254, Regex | ja | **ja** (`website`) | nein | nein | **nein** (nur Codes) | **nein** (nur `email`) |
| `GET /api/shop-search` | `q` ≥ 2, Locale-Allowlist | **nein** (q beliebig lang) | – | nein | – | nein | – |
| `GET /api/image` | nur „beginnt mit /“ | – | – | nein | – | – | – |

Zusätzlich `src/app/[locale]/adventsabend/AdventsabendForm.js` → nutzt `/api/kontakt` (gleiche Schwächen).

### 3.2 Befunde

**B1 – Mass Assignment / Feldmanipulation (hoch, unbestätigt).** `kontakt`, `beratung_anfrage` und `anfrage_produkt` schicken `JSON.stringify(body)` – also **jedes** Feld, das ein Angreifer mitsendet – an die Frappe-Methoden `…create_anfrage` / `create_contact`. Ob diese Methoden `frappe.get_doc({...kwargs})` ungefiltert aufrufen, liegt im Backoffice-Code und war nicht einsehbar. Wenn ja, könnten Felder wie `owner`, `status`, `assigned_to`, `docstatus` oder Felder anderer Doctypes gesetzt werden [vom Entwickler im Frappe-Code zu prüfen].
**Gegenmaßnahme:** In Next nur eine **Allowlist** von Feldern weiterleiten (wie beim Newsletter), Typen und Maximallängen prüfen (z. B. mit `zod`, ist in 14 ohnehin vorgesehen). In Frappe ebenfalls nur erlaubte Felder übernehmen.

**B2 – Next-Validierung ist umgehbar (hoch).** Die Frappe-URLs stehen im Klartext im Code (`https://backoffice.platzhirsch.studio/api/method/...create_anfrage`) und sind „allow_guest“. Ein Bot kann sie **direkt** ansprechen und alle Prüfungen in Next überspringen. Rate-Limit und Spam-Schutz müssen deshalb **auch** im Backend/nginx sitzen. Frappe bietet dafür den Decorator `@frappe.rate_limiter.rate_limit(limit=…, seconds=…)` [Version der Instanz prüfen].
**Gegenmaßnahme:** (a) Gast-Methoden auf das Netz des Webservers beschränken (nginx `allow <IP Webserver>; deny all;` für `/api/method/platzhirsch_studio.*create*`) **oder** einen geheimen Header verlangen, den nur der Next-Server kennt (Muster: `revalidateAuth.js` in umgekehrter Richtung); (b) Frappe-`rate_limit`.

**B3 – Kein Bot-Schutz (hoch).** Ohne Honeypot, Rate-Limit oder Captcha sind die Lead-Formulare offen für Spam. Folgen: Lead-Postfach voll, echte Anfragen gehen unter, GA4/Google-Ads-Conversions („generate_lead“, `src/lib/analytics.js`) werden verfälscht – gerade wenn Ads laufen, kostet das bares Geld.
**Gegenmaßnahme, gestaffelt:**
1. Honeypot-Feld + „Zeit bis Absenden ≥ 3 s“ in allen Formularen (wie Newsletter). Barrierefrei, keine Einwilligung nötig.
2. Rate-Limit pro IP: nginx `limit_req_zone $binary_remote_addr zone=forms:10m rate=5r/m;` mit `burst=5` auf `/api/kontakt|beratung_anfrage|anfrage_produkt|newsletter_subscribe`; `/api/shop-search` großzügiger (z. B. 60r/m).
3. Erst bei realem Spam: **Cloudflare Turnstile** (unsichtbar, kein Bild-Captcha, barrierearm). Datenschutz: Drittlandsübermittlung/Einwilligungsfrage [anwaltlich prüfen]; Alternative ohne Drittanbieter: Friendly Captcha (EU) oder Proof-of-Work (ALTCHA, MIT).

**B4 – Fehlerdetails an den Browser (mittel).** `details: errorData`, `message: error.message` und bei Erfolg das gesamte `data` des Backends gehen an den Client. Frappe-Fehler enthalten oft Tracebacks, Doctype- und Feldnamen. **Gegenmaßnahme:** wie Newsletter – nur `{ success, code }` zurück, Details ins Server-Log.

**B5 – Keine Größenbegrenzung (mittel).** Weder Body-Größe noch Feldlängen sind begrenzt (z. B. 5 MB Text in `ihre_nachricht`). **Gegenmaßnahme:** nginx `client_max_body_size 64k;` für die JSON-Formularrouten; Feldlängen (Name ≤ 100, Nachricht ≤ 5.000, `q` ≤ 100).

**B6 – Kein Timeout bei drei Routen (gering).** `kontakt`, `beratung_anfrage`, `anfrage_produkt` rufen `fetch` ohne `AbortSignal.timeout`. Hängt das Backend, blockieren Verbindungen. Newsletter macht es richtig (15 s).

**B7 – Header-/E-Mail-Injection (gering, Backend-abhängig).** Wenn Frappe aus den Feldern Benachrichtigungs-Mails baut, müssen Zeilenumbrüche in Name/Betreff entfernt werden [vom Entwickler zu prüfen].

**B8 – Karriere-Formular simuliert nur (mittel).** `jobdetailsclient.js` Zeile 119–122: „Simulate API call“ – Bewerbung und Lebenslauf werden **nicht** übertragen, die Seite meldet trotzdem Erfolg. Kein Sicherheitsleck, aber Bewerber verlassen sich darauf, und die Datenschutzerklärung beschreibt womöglich eine Verarbeitung, die nicht stattfindet. **Sofort:** Formular durch „Bewerbung per E-Mail an [vom Unternehmen auszufüllen]“ ersetzen. Später: echter Upload nach dem Muster in Abschnitt 6.

**B9 – Muster-Route vorhanden.** `newsletter_subscribe` zeigt bereits alles Richtige (Honeypot, Allowlist, Timeout, minimale Antworten). Die drei anderen Routen sollten exakt diesem Muster folgen; ein gemeinsamer Helfer `src/lib/forms/forwardToFrappe.js` vermeidet Drift.

---

## 4. Secrets und Env-Handling

| Punkt | Befund | Bewertung |
|---|---|---|
| `.env*` im Repo? | `.gitignore` enthält `.env*` und `*.pem`; `git ls-files` zeigt keine Env-, Key- oder PEM-Dateien | gut |
| Verwendete Variablen | `SERVER`, `API_KEY`, `API_SECRET`, `REVALIDATE_SECRET`, `PORTAL_SESSION_SECRET`, `PORTAL_BASE_URL`, `PORTAL_ADAPTER`, `ALLOWED_LOCAL`, `NODE_ENV` | keine `NEXT_PUBLIC_`-Secrets – gut |
| `src/lib/apiBaseUrl.js` | liest `API_KEY`/`API_SECRET`, aber **ohne** `import "server-only"`. Kein akutes Leck (nicht-`NEXT_PUBLIC`-Variablen sind im Browser `undefined`), aber kein Schutz gegen versehentlichen Client-Import | gering – `import "server-only"` ergänzen |
| Fallback `http://10.30.70.201:8000` | interne Dev-IP als Fallback, wenn `SERVER` fehlt. In Produktion würde ein fehlendes Env still auf unverschlüsseltes HTTP zu einem internen Host wechseln | gering – in Produktion lieber hart abbrechen (wie `sessionSecret()`) |
| Frappe-API-Key-Rechte | Der Key-Nutzer sollte **nur Lesen** auf die benötigten Doctypes haben, kein „System Manager“ | [vom Unternehmen auszufüllen] |
| Rotation | Kein Rotationsprozess belegt. Empfehlung: `API_SECRET`, `REVALIDATE_SECRET` jährlich und bei jedem Personalwechsel mit Serverzugang rotieren | – |
| Ablage | Secrets in einem Passwortmanager mit Teamfreigabe (z. B. Bitwarden Teams, 1Password Business), **nicht** in E-Mails/WhatsApp | [vom Unternehmen auszufüllen] |
| Logs | `console.error` schreibt Backend-Fehler (inkl. evtl. Formularinhalte) nach `/var/log/…`. Log-Rotation und Löschfrist (z. B. 30 Tage) festlegen – das sind personenbezogene Daten | [vom Unternehmen auszufüllen] |

---

## 5. Security-Header, CSP, Proxy-Routen

### 5.1 `next.config.js`

Gesetzt: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS 2 Jahre + `includeSubDomains; preload`, `Permissions-Policy` (Kamera/Mikro aus), `poweredByHeader: false`. Das ist ein guter Grundstock.

Fehlt / verbesserungswürdig:

1. **Keine Content-Security-Policy.** Die wirksamste Verteidigung gegen XSS fehlt. Next 16 beschreibt das Vorgehen in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` (Nonce über `proxy.js`). Empfehlung: **zuerst `Content-Security-Policy-Report-Only`** für 2–4 Wochen, dann scharf. Startwert (an GA4/Consent-Tool, Fonts, Video-Hoster anpassen):
   ```
   default-src 'self';
   script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https://www.googletagmanager.com;
   style-src 'self' 'unsafe-inline';
   img-src 'self' data: blob: https://backoffice.platzhirsch.studio https://www.google-analytics.com;
   connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com;
   frame-src 'self' https://www.google.com https://www.youtube-nocookie.com;
   frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';
   upgrade-insecure-requests
   ```
   Achtung: Nonce-CSP erzwingt dynamisches Rendering; bei ISR-Seiten ist eine **Hash-/Allowlist-CSP ohne Nonce** pragmatischer [Entwickler entscheidet nach Next-Doku].
2. **`dangerouslyAllowSVG: true` ohne `images.contentSecurityPolicy` und `contentDispositionType`.** Die Next-Doku (`03-api-reference/02-components/image.md`, Abschnitt `dangerouslyAllowSVG`) empfiehlt „strongly“ beides. Ergänzen:
   `contentDispositionType: "attachment"`, `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"`.
3. **`X-XSS-Protection: 1; mode=block`** ist veraltet und kann in alten Browsern selbst Lücken öffnen; auf `0` setzen oder entfernen (OWASP Secure Headers Project).
4. `Permissions-Policy`: `interest-cohort=()` ist obsolet (harmlos). Für Video-Beratung später `camera=(self), microphone=(self)` **nur auf der Beratungsseite** freigeben.
5. HSTS `preload`: nur behalten, wenn **alle** Subdomains (auch `backoffice.`, Mail-Webmail etc.) dauerhaft HTTPS können und die Domain tatsächlich auf hstspreload.org eingetragen werden soll [vom Unternehmen auszufüllen].
6. `Cross-Origin-Opener-Policy: same-origin` ergänzen (Schutz gegen Tab-Übernahme bei Pop-ups, z. B. Zahlungs-Redirects mit `same-origin-allow-popups`).

### 5.2 `/api/image` – halboffener Backend-Proxy (mittel)

- Nimmt **jeden** Pfad und ruft `${SERVER}${path}` – also auch `/api/method/…`, `/app`, `/private/files/…`. Ohne Login sind private Frappe-Dateien zwar geschützt, aber jede **Gast-API** des Backends wird über die öffentliche Domain spiegelbar.
- Der „Herkunftscheck“ greift nur, wenn ein `Origin`-Header da ist; Direktaufrufe (curl, `<img>`) haben keinen → **kein Schutz**.
- Antwortet mit dem **Content-Type des Backends** und `Access-Control-Allow-Origin: *`. Liefert das Backend eine HTML- oder SVG-Datei, läuft sie im Kontext von `platzhirsch.studio` (gespeichertes XSS über eine hochgeladene Datei im Backoffice).
- `robots.js` gibt `/api/image` explizit für Crawler frei; im Code wird die Route **nirgends mehr aufgerufen** (nur in `robots.js` erwähnt).

**Gegenmaßnahme:** Route entfernen, wenn wirklich ungenutzt [Entwickler prüfen, auch externe Links/Newsletter-Mails]; sonst exakt wie `/cmx/[...path]` einschränken (nur `files/…`, Endungs-Allowlist, eigener Content-Type, `nosniff`, SVG `sandbox`, Timeout). `/cmx` ist hier das Vorbild.

### 5.3 Rewrite `/cms/files/:path*` → `backoffice…/files/:path*`

Spiegelt alle öffentlichen Frappe-Dateien inkl. evtl. hochgeladener HTML/SVG unter der Hauptdomain. Gleiche Einschränkung wie `/cmx` empfehlen (oder auf `/cmx` umstellen).

### 5.4 CMS-HTML

`sanitizeCmsHtml` (`src/lib/shop/shopProducts.js`) entfernt Skripte, Event-Handler, `javascript:`-Links per Regex-Allowlist und wird bei Produkt- und Kollektionsseiten genutzt – gut gedacht („ein kompromittiertes Backoffice-Konto darf kein XSS werden“). Regex-Sanitizer sind aber erfahrungsgemäß umgehbar. Empfehlung mittelfristig: bewährte Bibliothek (`sanitize-html`, MIT, nur Server) + CSP als zweite Linie. Die **Preview-Seiten** (`src/app/[locale]/preview/dreilaendereck/produkt/[slug]/page.js`, Z. 123/133) rendern `dangerouslySetInnerHTML` – prüfen, ob dort ebenfalls bereinigter Text ankommt [Entwickler].

### 5.5 Preview-/Labs-Seiten

`/preview/*` hat `robots: NOINDEX`, ist aber **öffentlich erreichbar**, sobald deployt. Prototypen mit Platzhaltertexten, Herstellerbildern oder Markenbehauptungen können Wettbewerbern/Abmahnern auffallen. Empfehlung: in Produktion per HTTP-Basic-Auth (nginx) oder `proxy.js`-Prüfung sperren oder gar nicht deployen.

---

## 6. Revalidate-Webhooks

`src/lib/revalidateAuth.js`: Secret im Header `X-Revalidate-Secret`, Vergleich mit `timingSafeEqual`, ohne gesetzte Variable **alles gesperrt**, Fehlerdetails nur im Log, alle fünf Routen (`karriere`, `marken`, `news`, `produkte`, `team`) nutzen den Wächter. **Gut.**

Hinweise:
- `src/lib/revalidate.js` (alte Variante **ohne** Auth, gibt Fehlermeldungen aus) wird von keiner Route mehr importiert → **löschen**, damit niemand sie versehentlich wiederverwendet.
- Secret ≥ 32 zufällige Zeichen (`openssl rand -base64 32`), nur per HTTPS senden (Frappe-Webhook-URL muss `https://` sein).
- Optional: nginx `limit_req` auf `/revalidate/`, damit ein Fehler im Backoffice keine Revalidate-Schleife auslöst (Cache-Sturm = Last auf Frappe).
- Das Cache-Poisoning-Advisory für self-hosted ISR (Abschnitt 2) betrifft genau diese Seitenart → Update M1 hat Vorrang.

---

## 7. Backoffice (Frappe) und Zugriffsrechte

Aus dem Code ableitbar: `backoffice.platzhirsch.studio` ist öffentlich, Gast-Methoden sind offen, und der Kommentar in `src/app/cmx/[...path]/route.js` sagt: „the backend (**Werkzeug dev server**) sends every file as application/octet-stream“. Läuft die Produktionsinstanz über `bench start` statt über gunicorn + nginx, ist das ein klarer Mangel (der Dev-Server ist laut Werkzeug-Doku nicht für den Produktivbetrieb gedacht; Debugger/Leistung/Stabilität) [vom Entwickler zu klären, betrifft ggf. nur die Dev-Instanz 10.30.70.201].

**Mindeststandard Backoffice:**

| Maßnahme | Detail |
|---|---|
| Produktions-Setup | `bench setup production` (gunicorn + nginx + supervisor), `developer_mode: 0`, kein Werkzeug |
| Login-Oberfläche | `/app` und `/login` nur aus Büro-IP/VPN (nginx `allow/deny`) oder zumindest 2FA erzwingen |
| 2FA | Frappe-Systemeinstellung „Enable Two Factor Auth“ für alle Rollen; TOTP-App |
| Rollen | Pro Person eigenes Konto, **kein geteiltes Admin-Konto**; „System Manager“ nur 1–2 Personen; Verkauf sieht Anfragen, Marketing nur Inhalte; API-Nutzer der Website nur Lesen |
| Passwort-Richtlinie | Frappe „Minimum Password Score“ ≥ 3, Sperre nach Fehlversuchen |
| Offboarding | Checkliste: Konto deaktivieren, API-Keys widerrufen, Secrets rotieren, Mail/Telefon/Social-Zugänge |
| Updates | Frappe/ERPNext Minor-Releases monatlich, Security-Releases innerhalb 7 Tagen |
| Protokolle | Frappe „Access Log“/„Activity Log“ aktiv; wer hat Anfragen exportiert? |
| Verzeichnis | Liste „wer hat wo welchen Zugang“ (Server-SSH, Frappe, Domain-Registrar, DNS, Google Ads/GA4/Search Console, Meta Business, E-Mail, Zahlungsanbieter) [vom Unternehmen auszufüllen] |

Die Kundenanfragen im Backoffice sind personenbezogene Daten (Name, Adresse, Telefon, Projektbeschreibung, bei Firmen UID). DSGVO Art. 32 verlangt dem Risiko angemessene technische und organisatorische Maßnahmen, u. a. Zugriffskontrolle, Verschlüsselung und Wiederherstellbarkeit.

---

## 8. Backups und Wiederherstellung

Kein Backup-Konzept im Repo oder in Marktresearch belegt [vom Unternehmen auszufüllen]. Empfehlung nach **3-2-1-Regel** (BSI IT-Grundschutz, Baustein CON.3 Datensicherungskonzept):

| Was | Wie | Häufigkeit | Aufbewahrung |
|---|---|---|---|
| Frappe-Datenbank + Dateien | `bench --site … backup --with-files`, verschlüsselt (`--encrypt` bzw. age/GPG) auf externen EU-Objektspeicher **mit Object Lock** (Schutz gegen Ransomware) | täglich | 30 Tage täglich, 12 Monate monatlich |
| Website-Code | Git-Remote (GitHub/GitLab, privat), Schutz des `main`-Branch | bei jeder Änderung | dauerhaft |
| Env-Dateien/Secrets | Passwortmanager (nicht im Backup-Bucket im Klartext) | bei Änderung | – |
| Server-Konfiguration (nginx, PM2) | im Repo `infra/` oder dokumentiert | bei Änderung | – |
| Kundenfotos (KI-Raumplaner) | **nicht** ins Langzeit-Backup – Löschfrist 30 Tage (siehe 14, F14) | – | – |

**Restore-Test** halbjährlich auf einer Testinstanz; Ergebnis (Dauer bis lauffähig) notieren. Ziel [Schätzung, aus Teamgröße und Leadvolumen abgeleitet]: Wiederherstellung Website ≤ 4 h, Backoffice ≤ 1 Arbeitstag, Datenverlust ≤ 24 h.

---

## 9. Geplante Funktionen – Sicherheitsvorgaben vorab

### 9.1 KI-Raumplaner / Foto-Upload (Kundenfotos)

Architektur wie in `digital/06` (Presigned PUT in EU-Objektspeicher). Sicherheitsregeln dazu:

1. **Upload-URL nur nach Prüfung ausgeben**: Rate-Limit (z. B. 10 Fotos/IP/Stunde), Honeypot, bei Bedarf Turnstile; Presigned URL mit **max. 10 Minuten** Gültigkeit, fester Objektschlüssel (UUID, **nie** Dateiname des Kunden), `Content-Type`-Bedingung, `content-length-range` 10 kB – 15 MB (Presigned **POST** mit Policy erlaubt die Größengrenze; reines PUT nicht).
2. **Bucket privat**, kein öffentliches Listing, kein öffentlicher Lesezugriff; Ausgabe nur über kurzlebige signierte GET-URLs an das Team.
3. **Serverseitig nachprüfen** (nicht dem Browser glauben): Magic Bytes (JPEG/PNG/HEIC/WebP), Pixelmaße ≤ 50 MP (Dekompressionsbomben), **keine SVG, keine PDF, kein HTML**. Danach mit `sharp` (gepatchte Version!) **neu kodieren** – das entfernt eingeschleuste Nutzlasten – und **EXIF/GPS entfernen**.
4. **Quarantäne-Präfix** `incoming/` → nach Prüfung `clean/`; Lifecycle-Regel löscht `incoming/` nach 24 h, alles nach 30 Tagen (Löschfrist laut 14).
5. Optional Virenscan (ClamAV) bei Dateiarten außer Bildern; bei reinem Re-Encoding von Bildern entbehrlich.
6. **Verschlüsselung** at rest (Server-Side-Encryption des Anbieters) und Zugriffsschlüssel mit Minimalrechten (nur `PutObject` auf `incoming/`).
7. **Lokale GPU-Werkstatt** (06): Fotos per signiertem Download holen, nach Bearbeitung lokal löschen; der Büro-PC wird **nie** öffentlich erreichbar (kein Port-Forwarding, kein ComfyUI im Internet – ComfyUI hat keine Authentifizierung).
8. **KI-Anbieter (Stufe Selbstbedienung)**: Vertrag „keine Nutzung für Training“, EU-Region, AVV (Art. 28 DSGVO) [anwaltlich prüfen]; Prompt-Injection: Kundentext nie ungefiltert als Systemanweisung.
9. DSFA (Art. 35 DSGVO) ist in 14 bereits gefordert – IT-Sicherheit liefert dafür die obigen Maßnahmen als TOM-Liste.

### 9.2 Gutschein-Shop, Outlet mit Preisen, Zahlungen

- **Gehosteter Checkout** (Stripe Checkout oder Mollie Hosted Checkout, wie in 14 empfohlen): Kartendaten berühren den eigenen Server nie → PCI DSS **SAQ A** statt SAQ A-EP/D. Keine eingebetteten Kartenfelder bauen.
- **Preis immer serverseitig** aus dem Backoffice laden, nie aus dem Browser übernehmen (sonst „Gutschein 500 € für 1 €“).
- **Webhook** `/api/checkout/webhook`: Signatur prüfen (`stripe.webhooks.constructEvent` mit Roh-Body bzw. Mollie: Zahlung per API nachladen), **idempotent** (Event-ID speichern), erst nach `paid` Gutschein erzeugen.
- **Gutscheincodes**: ≥ 16 Zeichen aus `crypto.randomBytes` (z. B. Base32, ~80 Bit), nie fortlaufend; Einlösung serverseitig, mit Rate-Limit gegen Durchprobieren und Restwert-Buchung (Teil-Einlösung, siehe 14). Code nur in der Bestätigungsmail und im Kundenportal, nicht in URL-Parametern (Referrer/Analytics-Leck).
- **Anzahlungen für Möbel/Küchen** (große Beträge): Zahlungsanweisung ausschließlich auf der Rechnung **und** telefonisch bestätigt; Hinweis auf jeder Rechnung „Wir ändern unsere Bankverbindung nie per E-Mail“ → Schutz gegen **Business E-Mail Compromise** (gefälschte Rechnungen mit geänderter IBAN, eine der häufigsten Betrugsformen bei hohen Einzelaufträgen).
- Stripe Radar / Mollie-Fraud-Regeln aktiv, 3-D Secure (PSD2 SCA) Standard.

### 9.3 Online-Terminbuchung, Video-Beratung

- Fremdanbieter (Cal.com, Calendly, Microsoft Bookings) statt Eigenbau; EU-Hosting/AVV [anwaltlich prüfen].
- Video: Links pro Termin einmalig, Warteraum/Lobby an, keine öffentlichen Dauer-Räume. `Permissions-Policy` nur auf der Beratungsseite für Kamera/Mikro öffnen.

### 9.4 Kundenportal „Mein Platzhirsch“ (`src/lib/portal/`)

Bereits gut: HMAC-SHA256 mit Zweck-Trennung, `timingSafeEqual`, Token-Digest statt Klartext, Magic-Link 15 min, Pflicht-Secret ≥ 32 Zeichen in Produktion, Origin aus `PORTAL_BASE_URL` statt Host-Header. Ergänzen bevor live:
- Magic-Link **einmalig** verwendbar (nach Einlösung löschen) und Rate-Limit auf „Link anfordern“ (z. B. 3/E-Mail/Stunde, 10/IP/Stunde), immer gleiche Antwort („Falls die Adresse bekannt ist …“) gegen Konto-Ausforschung.
- Session 30 Tage ist lang; für Bereiche mit Dokumenten/Rechnungen 7 Tage oder Re-Auth beim Download.
- Cookie `HttpOnly; Secure; SameSite=Lax`, Logout invalidiert serverseitig (Session-Version im Store).
- Der Mock-Store unter `/.data/portal` ist gitignored – in Produktion **nicht** verwenden (`PORTAL_ADAPTER=frappe`).

### 9.5 KI-Concierge

- Kein Zugriff auf Kundendaten ohne Login; Tool-Aufrufe nur lesend (Produkte, Öffnungszeiten).
- Rate-Limit + Kostenlimit beim Anbieter (Tages-Budget), sonst kann ein Bot die API-Rechnung hochtreiben.
- Ausgaben nie als HTML rendern (XSS über Modellantwort); keine Händlerbehauptungen (Systemprompt + Allowlist aus 14).

### 9.6 Google/Meta Ads, Newsletter

- Konten mit 2FA/Passkeys, mindestens zwei Admins aus dem Unternehmen (nicht nur Agentur), Agentur nur mit eigener Rolle.
- Newsletter-Tool: Double-Opt-in (rechtlich ohnehin), API-Schlüssel nur serverseitig.

---

## 10. NIS2 / NISG 2026 – Relevanz

**Rechtslage AT:** NISG 2026, BGBl. I Nr. 94/2025, Anwendung ab **1.10.2026**; erfasst Einrichtungen, die in einem Sektor der Anlagen 1 oder 2 tätig sind **und** mindestens mittlere Größe haben (EU-KMU-Empfehlung 2003/361/EG: ≥ 50 Beschäftigte oder > 10 Mio. € Umsatz und > 10 Mio. € Bilanzsumme); Registrierung binnen 3 Monaten. Quellen: WKO NIS-FAQ, KPMG, Deloitte-Infoblatt (siehe unten).

**Einschätzung:** Möbel-/Küchenhandel mit Café ist **kein NIS-Sektor**. „Herstellung von Möbeln“ fällt unter die Sektoren der Anlage 2 („verarbeitendes Gewerbe“) nur bei Herstellung, nicht bei Handel; Online-Marktplätze sind „digitale Anbieter“ nur, wenn Dritte dort verkaufen. Ein eigener Shop ist **kein Online-Marktplatz**. Außerdem ist Platzhirsch (Team ~5 Personen) **deutlich unter mittlerer Größe**. → **NISG 2026 gilt sehr wahrscheinlich nicht** [anwaltlich prüfen, v. a. falls die künftige Handels-GmbH konzernrechtlich mit größeren Einheiten verbunden ist – Partner-/verbundene Unternehmen werden bei der Größe zusammengerechnet; ebenso falls Platzhirsch selbst Küchen fertigen lässt und als „Hersteller“ auftritt (Binni-Linie, 26)].

DE (NIS2UmsuCG/BSIG) und CH (ISG, Meldepflicht für Cyberangriffe nur für kritische Infrastrukturen seit 1.4.2025) sind aus den gleichen Gründen nicht einschlägig [anwaltlich prüfen].

**Was trotzdem gilt:**
- **DSGVO Art. 32** (Sicherheit der Verarbeitung) und **Art. 33/34** (Meldung einer Datenpanne binnen **72 Stunden** an die Datenschutzbehörde, ggf. Information der Betroffenen). In CH analog **revDSG Art. 24** („so rasch als möglich“ an den EDÖB).
- Mittelbar: Zahlungsanbieter (PCI DSS), Versicherer (Cyberpolizze) und große B2B-Kunden (Hotels, Bauträger, die selbst NIS2-pflichtig sind) können Sicherheitsnachweise verlangen → ein schlankes Sicherheitskonzept ist ein Verkaufsargument im Contract-Geschäft.

**Empfehlung:** Ein-Seiten-Notfallplan „Datenpanne“ (wer entscheidet, wer meldet, Vorlage Meldung DSB, Kontakte Hoster/Entwickler/Anwalt) [vom Unternehmen auszufüllen].

---

## 11. Phishing- und Fake-Shop-Schutz der Marke

Premium-Möbelmarken (Minotti, Poliform, Flos, ClassiCon …) sind in DACH ein häufiges Ziel von Fake-Shops mit „bis −70 %“ und Vorkasse. Die Watchlist Internet (Österreich) führt laufend Fake-Shops im Möbel- und Designbereich [Quelle: watchlist-internet.at, Kategorie Fake-Shops; Einzelfälle nicht neu geprüft]. Ein Fake-Shop, der „Platzhirsch“ kopiert, würde direkt den Ruf schädigen.

| Maßnahme | Konkret | Aufwand |
|---|---|---|
| **E-Mail-Authentifizierung** | SPF, DKIM für alle Absender (eigener Mailserver, Newsletter-Tool, Backoffice-Mails, Buchungstool); **DMARC** zuerst `p=none; rua=mailto:dmarc@…` für 4 Wochen auswerten, dann `p=quarantine`, Ziel `p=reject` | 0,5–1 Tag |
| Absender-Disziplin | Rechnungen/IBAN nur aus einem Absender, Hinweis „IBAN ändert sich nie per Mail“ | 1 h |
| **Domain-Varianten** | prüfen/registrieren: `platzhirsch-studio.at`, `.de`, `.ch`, `.com`, `platzhirschstudio.*`, `platzhirsch-home.*` [vom Unternehmen auszufüllen – welche gehören schon?] | 1 h + Gebühren |
| Domain-Überwachung | Certificate-Transparency-Alarm (z. B. crt.sh-Abfrage monatlich oder kostenloser Dienst wie „Cert Spotter“) auf „platzhirsch“ | 15 min/Monat |
| Registrar-Konto | 2FA, Registrar-Lock, Domain auf die (künftige) Handels-GmbH, nicht auf eine Privatperson/Agentur | 1 h |
| Marke | Wort-/Bildmarke „Platzhirsch Home Living“ (AT/EU, ggf. CH) – Voraussetzung für schnelle Takedowns bei Registraren und Meta/Google [anwaltlich prüfen, Kollision mit bestehenden „Platzhirsch“-Marken wahrscheinlich] | extern |
| Echtheits-Seite | `/de/sicher-einkaufen`: offizielle Domain, Bankverbindung, Kontakt, „Wir verkaufen nie über Marktplätze/Instagram-DMs mit Vorkasse auf fremde Konten“; Link im Footer | 0,5 Tag |
| Meldewege | Fake-Funde an Watchlist Internet, Ombudsstelle/Internet Ombudsmann, Registrar-Abuse, Google Safe Browsing Report, Meta-IP-Formular | bei Bedarf |
| Social Accounts | Instagram/Facebook verifizieren, Business-Manager mit 2FA; Impressum-Link im Profil | 1 h |

Wichtig für die Glaubwürdigkeit: Keine Händler-Behauptungen ohne Beleg (siehe 14 – nur ClassiCon belegt). Eine Echtheits-Seite, die selbst übertreibt, wäre kontraproduktiv.

---

## 12. Priorisierter Maßnahmenplan

| Prio | Maßnahme | Verantwortlich | Aufwand | Abhängigkeit |
|---|---|---|---|---|
| **P0 (diese Woche)** | M1: `next` ≥ 16.4.1, `sharp` ≥ 0.35.5, deployen; Übergang `dangerouslyAllowSVG:false` prüfen | Entwickler | 1–2 h | Freigabe Deployment |
| P0 | Karriere-Formular durch E-Mail-Hinweis ersetzen | Entwickler | 1 h | Bewerbungs-Adresse |
| P0 | Frappe-Instanz: läuft Produktion auf Werkzeug? 2FA an, geteilte Konten auflösen | Entwickler + Inhaber | 0,5–1 Tag | Serverzugang |
| P0 | Prüfen, ob ein Backup existiert und wiederherstellbar ist | Hoster/Entwickler | 2 h | – |
| **P1 (vor Ads-Start / 4 Wochen)** | Formularrouten auf Newsletter-Muster: Feld-Allowlist, Längen, Honeypot, Timeout, minimale Antworten | Entwickler | 1 Tag | – |
| P1 | nginx: `limit_req` für Formulare/Suche/Revalidate, `client_max_body_size`; Gast-Methoden nur vom Webserver | Hoster | 0,5 Tag | Serverzugang |
| P1 | Frappe: `rate_limit` auf Gast-Methoden, Feld-Allowlist in `create_anfrage`/`create_contact` | Backoffice-Entwickler | 0,5 Tag | – |
| P1 | `/api/image` entfernen oder wie `/cmx` einschränken; `/cms/files`-Rewrite einschränken | Entwickler | 2 h | Prüfung externer Links |
| P1 | `images.contentSecurityPolicy` + `contentDispositionType`; `X-XSS-Protection: 0`; COOP | Entwickler | 1 h | – |
| P1 | Backup 3-2-1 mit Object Lock + erster Restore-Test | Hoster | 1 Tag | Speicheranbieter |
| P1 | DMARC `p=none` + Auswertung; Domain-Varianten prüfen; Registrar-2FA | Inhaber/IT | 1 Tag | DNS-Zugang |
| **P2 (Q1 2027)** | CSP Report-Only → scharf | Entwickler | 1–2 Tage | Consent-Tool-Liste |
| P2 | Zugriffsverzeichnis + Offboarding-Checkliste + Notfallplan Datenpanne | Inhaber | 0,5 Tag | – |
| P2 | `src/lib/revalidate.js` löschen, `server-only` in `apiBaseUrl.js`, Prod-Abbruch statt Dev-IP-Fallback | Entwickler | 30 min | – |
| P2 | Dependabot/Renovate + `npm audit` im CI; Preview-Routen in Prod sperren | Entwickler | 2 h | Git-Hosting |
| P2 | Regex-Sanitizer → `sanitize-html` | Entwickler | 2 h | – |
| **Mit Feature** | Upload-Pipeline (9.1), Hosted Checkout + Webhook-Signatur + Gutscheincodes (9.2), Portal-Härtung (9.4), KI-Kostenlimit (9.5) | Entwickler | im Feature | jeweilige Verträge/AVV |
| Optional | Externer Pentest (Black-Box, 2–3 Tage) **nach** Shop-Start | extern | [Schätzung: 3.000–6.000 €, übliche Tagessätze 1.200–2.000 € × 2–3 Tage] | Shop live |
| Optional | Cyber-Versicherung prüfen (deckt BEC/Ransomware teils ab) | Inhaber | – | Fragebogen erfordert P0/P1 |

---

## 13. Was der Inhaber entscheiden oder liefern muss

1. **Freigabe für das Sicherheitsupdate** (Next/sharp) und wer deployt (Entwickler/Hoster) – sofort.
2. **Wer betreibt den Server und das Backoffice?** Hoster, Vertrag, Notfallkontakt, SSH-Zugänge [vom Unternehmen auszufüllen].
3. **Backups**: Gibt es welche, wo, verschlüsselt, wann zuletzt wiederhergestellt? Budget für EU-Objektspeicher mit Object Lock [Schätzung: 5–20 €/Monat bei < 200 GB, Listenpreise Hetzner/Exoscale].
4. **Zugriffsliste**: Wer hat Admin-Rechte in Frappe, Domain, DNS, Google, Meta, E-Mail? Geteilte Logins abschaffen; 2FA-Pflicht beschließen.
5. **Bewerbungsweg**: E-Mail-Adresse für Bewerbungen, bis ein echter Upload existiert.
6. **Domains und Marke**: welche Domains gehören dem Unternehmen, auf welchen Rechtsträger; Markenanmeldung ja/nein [anwaltlich prüfen].
7. **Zahlungsanbieter** (Stripe oder Mollie) – Entscheidung vor dem Gutschein-Shop.
8. **Datenpanne-Verantwortliche/r** benennen (wer meldet binnen 72 h).
9. **Konzernstruktur der künftigen Handels-GmbH** an den Anwalt geben, damit die NISG-Negativ-Einschätzung bestätigt werden kann.

---

## 14. Quellen

- `npm audit`, 26.10.2026; installierte Versionen aus `node_modules/next/package.json` (16.3.4) und `node_modules/sharp/package.json` (0.35.4)
- GitHub Advisory GHSA-2464-fhr4-w9xw – Next.js Unauthenticated RCE in Image Optimization (SVG), gepatcht 16.4.1: https://github.com/advisories/GHSA-2464-fhr4-w9xw (weitere IDs siehe Abschnitt 2, aus `npm audit`)
- Next.js-Doku im Projekt: `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`, `…/data-security.md`, `…/self-hosting.md`, `…/03-api-reference/02-components/image.md` (`dangerouslyAllowSVG`, Z. 922–950)
- DSGVO (VO (EU) 2016/679) Art. 28, 32, 33, 34, 35: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- NISG 2026, BGBl. I Nr. 94/2025 (Gesetzestext: RIS, https://www.ris.bka.gv.at); Sekundär: WKO NIS-FAQ https://www.wko.at/it-sicherheit/nis-faq, KPMG https://kpmg.com/at/de/insights/2025/12/nisg-2026.html, Deloitte-Infoblatt https://www.deloitte.com/content/dam/assets-zone2/at/de/docs/studien/2026/infoblatt-nisg.pdf, Secjur https://www.secjur.com/blog/nisg-2026
- EU-KMU-Definition, Empfehlung 2003/361/EG: https://eur-lex.europa.eu/eli/reco/2003/361/oj
- Richtlinie (EU) 2022/2555 (NIS2), Anhänge I/II: https://eur-lex.europa.eu/eli/dir/2022/2555/oj
- CH: revDSG Art. 24 (fedlex SR 235.1); ISG Meldepflicht seit 1.4.2025 (fedlex SR 128) [Fundstelle anwaltlich bestätigen]
- BSI IT-Grundschutz-Kompendium, Baustein CON.3 Datensicherungskonzept; APP.3.1 Webanwendungen
- OWASP Secure Headers Project (X-XSS-Protection, COOP): https://owasp.org/www-project-secure-headers/ ; OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html ; OWASP Mass Assignment Cheat Sheet
- PCI DSS v4.0.1, SAQ A (Hosted Payment Page): https://www.pcisecuritystandards.org
- Stripe Webhook-Signaturen: https://docs.stripe.com/webhooks#verify-events
- Frappe Rate Limiting (`frappe.rate_limiter.rate_limit`) und Two-Factor-Auth: https://docs.frappe.io
- DMARC RFC 7489: https://www.rfc-editor.org/rfc/rfc7489
- Watchlist Internet (Fake-Shops): https://www.watchlist-internet.at
- Projektdokumente: `Marktresearch/digital/06-ki-raumplaner-gpu.md`, `07-ecommerce-architektur.md`, `14-recht-compliance-digital.md`
