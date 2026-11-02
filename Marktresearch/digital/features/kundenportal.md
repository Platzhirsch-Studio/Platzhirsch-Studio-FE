# Kundenportal „Mein Platzhirsch“

## Abschnitt 1 – Fundament (Entwickler 1)

Status: lauffähig im Dev mit Mock-Daten. Seiten: `/de/portal` (Dashboard) und `/de/portal/login` (+ `/gesendet`, `/bestaetigen`, `/dev`). Alles `noindex, nofollow`, nur Locale `de` (andere Locales → 404).

### Was gebaut wurde

- **Login per Magic Link** ohne Passwort. Ablauf:
  1. `/de/portal/login`: Formular (funktioniert ohne JavaScript) → `POST /api/portal/auth/request`.
  2. Kunde wird per E-Mail gesucht. Ist er bekannt, wird ein Einmal-Token erzeugt (32 Byte zufällig, 15 Min. gültig, nur als HMAC-Digest gespeichert). Die Antwort ist immer gleich, damit niemand herausfinden kann, ob eine Adresse existiert. → `/de/portal/login/gesendet`.
  3. Der Link aus der Mail führt auf `/de/portal/login/bestaetigen?token=…`. Erst der Button „Jetzt anmelden“ schickt `POST /api/portal/auth/verify`. So können Mail-Scanner, die Links vorab aufrufen, den Token nicht verbrauchen.
  4. Der Token wird atomar eingelöst (Einmalnutzung). Danach wird das Session-Cookie gesetzt → 303 auf `/de/portal` oder auf `next`.
- **Dev ohne Mailversand:** Der Link steht in der Server-Konsole (`[portal] Magic Link …`) und auf `/de/portal/login/dev` (Dev-Postausgang). In Produktion antwortet diese Seite mit 404.
- **Session:** zustandsloses Cookie `ph_portal_session` = base64url(JSON `{v,sub,sid,iat,exp}`) + HMAC-SHA256. Attribute: HttpOnly, SameSite=Lax, Secure in Produktion, 30 Tage gültig. Inhalt nur die Kunden-ID, keine weiteren personenbezogenen Daten.
- **Absicherung ohne Middleware** (`src/proxy.js` bleibt unverändert), nach dem DAL-Muster aus `node_modules/next/dist/docs/01-app/02-guides/authentication.md`: Das Layout prüft nicht (Layouts laufen bei Client-Navigation nicht erneut). Jede Seite holt ihre Daten über `getPortal()`. Das leitet ohne gültige Session auf den Login um und bindet alle Datenzugriffe an die Kunden-ID der Session.
- **CSRF:** Alle POST-Routen prüfen `Origin` bzw. `Sec-Fetch-Site`; zusätzlich gilt SameSite=Lax.
- **Rate-Limit:** 5 Anfragen pro E-Mail-Adresse und 20 pro IP in 15 Minuten (im Speicher, gilt pro Prozess).
- **Dashboard:** Begrüßung nach Tageszeit, Kennzahlen, aktuelles Projekt mit Status-Zeitleiste (Anfrage → Planung → Angebot → Auftrag → Bestellung beim Hersteller → Lieferung → Montage → Übergabe), Positionen, Gewerke, weitere Projekte, neue Dokumente, nächste Termine, Nachrichten und Kontakt im Studio. Bei aktivem Mock-Adapter zeigt ein Hinweis „Demo-Daten“.
- **Navigation:** Am Desktop eine Tab-Leiste, mobil (< 768 px) eine feste Bottom-Bar mit 5 Zielen. Sie berücksichtigt die Safe Area, ist 60 px hoch, liegt über der `MobileCtaBar` der Website (z-45 > z-40) und zeigt einen Zähler für ungelesene Nachrichten. Geprüft bei 375 px: kein horizontales Scrollen.
- **Zeitleiste:** Mobil zeigt sie den aktuellen Schritt, einen Balken aus 8 Segmenten und alle Schritte aufklappbar über `<details>`; ab md einen horizontalen Stepper. `aria-current="step"`, die Animation läuft nur bei `motion-safe`.

### Dateien

| Bereich | Dateien |
|---|---|
| Seiten | `src/app/[locale]/portal/layout.js`, `page.js`, `login/page.js`, `login/gesendet/page.js`, `login/bestaetigen/page.js`, `login/dev/page.js` |
| Auth-API | `src/app/api/portal/auth/request/route.js`, `verify/route.js`, `logout/route.js`, `session/route.js` |
| Datenschicht | `src/lib/portal/dal.js` (**Einstieg**), `config.js`, `crypto.js`, `session.js`, `magicLink.js`, `mailer.js`, `http.js`, `rateLimit.js`, `store.js`, `schemas.js`, `constants.js`, `format.js` |
| Adapter | `src/lib/portal/adapters/interface.js` (Vertrag + JSDoc-Typen), `index.js`, `mock.js`, `mockSeed.js`, `frappe.js` (dokumentierter Stub) |
| UI | `src/components/Portal/Core/PortalHeader.js` (inkl. `LogoutButton`), `PortalNav.js` (Client), `navItems.js`, `StatusTimeline.js`, `Dashboard.js`, `ui.js` (`Card`, `CardHeading`, `Badge`, `Empty`, `Notice`, `Overline`, `PrimaryButton`, `AuthPanel`) |
| Lokaler Speicher (gitignored) | `.data/portal/demo.json` (Demo-Daten, beim ersten Zugriff erzeugt; zum Neu-Erzeugen löschen), `magic-links.json`, `dev-outbox.json` |

### So bauen Entwickler 2 und 3 darauf auf

```js
// Seite, z. B. src/app/[locale]/portal/dokumente/page.js
import { getPortal } from "@/lib/portal/dal";
export const metadata = { title: "Dokumente", robots: { index: false, follow: false } };
export default async function Page({ searchParams }) {
  const portal = await getPortal("/de/portal/dokumente"); // leitet ohne Session auf den Login um
  const docs = await portal.listDocuments({ type: "rechnung" });
  …
}

// Route Handler, z. B. src/app/api/portal/feedback/route.js
import { requireApiSession } from "@/lib/portal/dal";
import { isSameOrigin } from "@/lib/portal/http";
export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Ungültige Herkunft" }, { status: 403 });
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;            // 401
  const res = await auth.portal.addFeedback(await request.json()); // zod-validiert im Adapter
  return Response.json(res);
}
```

Regeln:
- Adapter nie direkt aus Seiten aufrufen. Immer über `getPortal()` oder `requireApiSession()` gehen, damit nur Daten des angemeldeten Kunden geladen werden.
- Unterseiten erben Layout und `noindex` vom Layout; trotzdem eigene `metadata` mit `robots` setzen.
- UI-Bausteine aus `@/components/Portal/Core/ui` wiederverwenden. Navigationsziele stehen in `navItems.js`: `/de/portal/projekte`, `/dokumente`, `/termine`, `/nachrichten`. Diese Seiten sind noch nicht gebaut; das Dashboard verlinkt schon auf `/de/portal/projekte/[id]` und `/de/portal/dokumente?typ=…#<id>`.
- Dokument-PDFs und Renderings liegen nur serverseitig (`file.storageKey`, `image`). Ausliefern nur über eine authentifizierte Route, nie über `public/`.

### Adapter-Interface

Jede Methode außer `findCustomerByEmail` bekommt als erstes Argument die `customerId` der geprüften Session. In `getPortal()` ist sie bereits gebunden.

| Methode (über `getPortal()`) | Rückgabe | Hinweise |
|---|---|---|
| `customer` (Feld) | `Customer` | `displayName`, `advisor{name,email,phone}`, Adresse |
| `listProjects()` | `Project[]` | sortiert nach `updatedAt`, absteigend |
| `getProject(projectId)` | `Project \| null` | `steps[8]{key,state:erledigt\|aktiv\|offen,date}`, `items[]`, `trades[]` |
| `listDocuments({type?, projectId?})` | `PortalDocument[]` | `type`: `angebot \| auftragsbestaetigung \| lieferschein \| rechnung`; `amount` ist immer `null`, `amountNote` = „[Preis vom Inhaber festzulegen]“ |
| `listAppointments({projectId?, from?})` | `Appointment[]` | `from` als ISO-Datum mit Offset; sortiert nach Start |
| `getProductPass(productPassId)` | `ProductPass \| null` | Materialien, Pflege, Garantie, Anhänge |
| `listRenderings(projectId)` | `Rendering[]` | `aiGenerated: true` → als „KI-generiert“ kennzeichnen (AI Act Art. 50) |
| `listMessages({projectId?})` | `Message[]` | `from: studio \| kunde`, `read` |
| `addFeedback(input)` | `{id, createdAt}` | zod `feedbackSchema`: `projectId`, `target{kind,id?}`, `rating?` 1–5, `message` |
| `requestPlanning(input)` | `{id, createdAt}` | zod `planningRequestSchema`: `projectId?`, `room`, `message`, `preferredContact`, `preferredDates[≤3]` |

Die genauen Felder stehen als JSDoc-Typen in `src/lib/portal/adapters/interface.js`, die Konstanten (Schritte, Dokumenttypen, Gewerke, Termin-Arten) in `src/lib/portal/constants.js`.

### Demo-Daten (Mock)

- Demo-Kunde: Familie Muster, `demo@kunde.example`. Kontakt im Studio: „Ihr Platzhirsch-Beratungsteam“ mit Telefonnummer und E-Mail des Studios.
- `PRJ-2026-014` „Wohnzimmer am See“, Status *Bestellung beim Hersteller*: Sofa Connery (Minotti), Teppich nach Maß (Paola Lenti), Bogenleuchte Arco (Flos), je mit Produktpass.
- `PRJ-2026-021` „Binni Stein-Küche“, Status *Angebot*: Gewerke Tischler, Elektriker, Installateur und Steinmetz, jeweils als „Partnerbetrieb (Name folgt)“ (keine erfundenen Firmen). Zwei Renderings, eines davon als KI-generiert markiert, ohne Bild.
- 4 Dokumente (2 Angebote, 1 Auftragsbestätigung, 1 Anzahlungsrechnung) ohne Beträge, 3 Termine, 3 Nachrichten. Alle Daten liegen relativ zum Zeitpunkt der Erzeugung.

### Spätere Anbindung an Frappe/ERPNext

Umschalten mit `PORTAL_ADAPTER=frappe`. Die Zuordnung steht in `src/lib/portal/adapters/frappe.js` (heute ein Stub, der Fehler wirft):

| Portal | ERPNext |
|---|---|
| Kunde und Login-Abgleich | `Customer`, `Contact` (Contact Email) mit Dynamic Link auf Customer; alternativ `Customer.portal_users` bzw. Frappe Website User |
| Projekte, Zeitleiste | `Project` + Custom Fields `ph_portal_step`, Child-Tabelle `ph_portal_steps`, Gewerke als `ph_trades` (Supplier) |
| Angebot / AB / Lieferschein / Rechnung | `Quotation` / `Sales Order` / `Delivery Note` / `Sales Invoice` (docstatus=1); PDF über `frappe.utils.print_format.download_pdf`, durchgereicht von einer authentifizierten Route |
| Termine | `Event` mit Event Participants (Customer); interne Aufgaben als `ToDo` |
| Produktpass | neuer Doctype `PH Product Pass` + `Serial No` + `File` |
| Renderings | `File` (is_private=1, attached_to Project) + `ph_ai_generated` |
| Nachrichten | `Communication` (reference Project) |
| Feedback / Planungswunsch | `Comment` bzw. `PH Portal Feedback`; `Opportunity` oder `ToDo` für den Berater |
| Login-Mail | whitelisted Methode, z. B. `platzhirsch_studio.api.portal_send_login_link` → `frappe.sendmail` |

Der Server greift mit dem API-Key eines eigenen Integrations-Users zu (`FRAPPE_API_KEY`, `FRAPPE_API_SECRET`). Die Portal-Session bleibt unsere eigene. Frappes eigenes `/me`-Portal wird bewusst nicht genutzt, weil es sich nicht an die Gestaltung der Website anpassen lässt.

### Umgebungsvariablen

- `PORTAL_SESSION_SECRET` (mind. 32 Zeichen): in Produktion **Pflicht**, sonst wirft der Login einen Fehler. Im Dev gibt es einen festen Fallback mit Warnung in der Konsole.
- `PORTAL_BASE_URL`: öffentliche Adresse für Links und Redirects in Produktion; dem Host-Header wird nicht vertraut.
- `PORTAL_ADAPTER`: `mock` (Standard) oder `frappe`.

### Offene Punkte

1. Mailversand in Produktion: Code steht seit Runde 2 (siehe Abschnitt 4), es fehlt nur noch die Konfiguration der Umgebungsvariablen.
2. **Sessions lassen sich nicht serverseitig widerrufen.** Logout löscht nur das Cookie im Browser. Für „überall abmelden“ braucht es eine `sessionVersion` am Kunden.
3. Rate-Limit und Token-Speicher gelten nur pro Prozess bzw. als JSON-Datei. Bei mehreren Instanzen auf Redis oder einen Frappe-Doctype umstellen.
4. Unterseiten (Projekte, Dokumente samt PDF-Route, Termine, Nachrichten, Produktpass, Renderings) bauen Entwickler 2 und 3.
5. Preise: `amount` bleibt `null`, bis der Inhaber Preise freigibt.
6. Der Portal-Einstieg ist noch nirgends auf der Website verlinkt (Navbar/Footer gehören anderen Teams).

### Rechtliches

- Datenschutzhinweis auf der Login-Seite: Zweck (Anmeldelink, Zuordnung zum Kundenkonto), technisch notwendiges Session-Cookie (30 Tage) und Link auf `/de/datenschutz`. Rechtsgrundlage ist die Vertragsanbahnung bzw. -erfüllung (Art. 6 Abs. 1 lit. b DSGVO); eine Einwilligung ist nicht nötig. **Die Datenschutzerklärung muss um den Abschnitt „Kundenportal“ ergänzt werden** (Session-Cookie, Login-Token, Speicherdauer, später Frappe als Auftragsverarbeiter bzw. Hosting).
- Ein Session-Cookie ist nach § 165 Abs. 3 TKG 2021 technisch notwendig; ein Consent-Banner ist dafür nicht erforderlich.
- Kundendaten liegen nur in `.data/` (gitignored) bzw. später im ERP, nie in `public/`.
- KI-Kennzeichnung: Das Feld `Rendering.aiGenerated` ist verpflichtend; die UI der Unterseiten muss es anzeigen.
- Es gibt keine erfundenen Preise, Firmen oder Referenzen. Gewerke erscheinen als „Partnerbetrieb (Name folgt)“.

## Abschnitt 2 – Dokumente, Termine, Produktpass, Gewerke, Anfragen (Entwickler 2)

Stand: 26.10.2026. Alle Bereiche laufen im Dev mit dem Mock-Adapter und nutzen ausschließlich das Adapter-Interface aus Abschnitt 1 (`getPortal()` bzw. `requireApiSession()`). Am Fundament wurde nichts geändert.

### Was gebaut wurde

| Bereich | URL | Inhalt |
|---|---|---|
| Dokumente | `/de/portal/dokumente` | Liste aller Angebote, Auftragsbestätigungen, Lieferscheine und Rechnungen. Filter als Links, die auch ohne JS funktionieren: Dokumentart (`?typ=`), Zahlungsstatus offen/bezahlt (`?zahlung=`), Projekt (`?projekt=`). Status-Badges; als Betrag steht immer „[Preis vom Inhaber festzulegen]“. PDF-Vorschau (Desktop: `<dialog>` mit iframe; Mobil: neuer Tab) und Download über eine geschützte Route. Die Dashboard-Links `?typ=…#<id>` springen auf das Dokument und heben es hervor (`:target`). |
| Termine | `/de/portal/termine` | Kommende und vergangene Termine, Filter Aufmaß/Lieferung/Montage/Service (`?art=`). Kalender-Export als `.ics`, je Termin und gesamt, mit Erinnerung einen Tag vorher und Status CONFIRMED/TENTATIVE. Änderungswunsch je Termin (aufklappbar): Grund, bis zu 3 Wunschtermine, Nachricht. |
| Produktpass | `/de/portal/pass`, `/de/portal/pass/[id]` | Je gekauftem Stück: Marke, Modell, Ausführung, Material/Bezug, Maße, Menge, Kaufdatum (erste Auftragsbestätigung des Projekts), Lieferdatum, Seriennummer, Foto/Unterlagen, Herstellergarantie mit Hinweis zur gesetzlichen Gewährleistung, Pflegeanleitung. Formular für Service, Neubezug oder Inzahlungnahme (`?anfrage=neubezug` wählt vor). QR-Code zum Pass (z. B. als Aufkleber am Möbel) und JSON-Export nach der Struktur des EU-Digitalen Produktpasses. Fehlende Angaben erscheinen als „folgt bei Übergabe“ und werden nie erfunden. |
| Gewerke | `/de/portal/gewerke` | Je Projekt alle koordinierten Gewerke mit Betrieb, Umfang, Status (Fortschritt in 4 Stufen: offen → geplant → in Arbeit → erledigt), verknüpftem Termin und Ansprechpartner. Solange die Partner nicht bestätigt sind, läuft die Koordination über das Beratungsteam. |
| Neue Planung | `/de/portal/anfragen` | Neue Planung oder Erweiterung eines Projekts (`?projekt=<id>` wählt vor). Raum (Auswahlliste oder freie Eingabe), Budgetrahmen und Zeitraum optional, Beschreibung, Wunschtermine, Kontaktweg. Hinweis: Fotos und Grundrisse kommen erst danach über einen geschützten Upload-Link. |

Für alle Seiten gilt: `getPortal()` ist die erste Datenabfrage (ohne Session → Login mit `next=`), jede Seite hat eigene `metadata.robots` mit noindex, nur `de` (über das Layout), Server Components. Client-Code gibt es nur für die Formulare (`Forms.js`) und die PDF-Vorschau (`PdfPreview.js`). Produktpass, Gewerke und Neue Planung stehen nicht in `navItems.js`. Deshalb verbindet eine eigene Bereichsnavigation (umbrechende Chips) die fünf Bereiche.

### Dateien

| Zweck | Pfad |
|---|---|
| Seiten | `src/app/[locale]/portal/dokumente/page.js`, `termine/page.js`, `pass/page.js`, `pass/[id]/page.js`, `gewerke/page.js`, `anfragen/page.js` |
| Geschützte Routen | `src/app/api/portal/dokumente/[id]/route.js` (PDF, `?download=1`), `src/app/api/portal/dokumente/kalender/route.js` (`.ics`, `?termin=<id>`), `src/app/api/portal/dokumente/pass/[id]/route.js` (JSON-LD, `?download=1`, `?anhang=<n>`) |
| UI | `src/components/Portal/Docs/SectionNav.js` (Kopf, Bereichsnavigation, Filter-Chips), `Forms.js` (Client), `PdfPreview.js` (Client), `labels.js` (Labels, Status, Räume, Budgets) |
| Server Actions | `src/components/Portal/Docs/actions.js` (`requestAppointmentChange`, `requestPassService`, `startPlanning`) |
| Server-Helfer | `src/components/Portal/Docs/server/passes.js` (Pässe sammeln, DPP-JSON), `files.js` (Dateien laden), `pdf.js` (Demo-PDF), `ics.js` (iCalendar) |

### Architektur und Sicherheit

- **Besitzprüfung über den Adapter:** Jede Route und jede Action lädt Datensätze nur über die kundengebundenen Methoden (`listDocuments()`, `listAppointments()`, `getProductPass()` …). Eine fremde ID bekommt dieselbe 404-Antwort wie eine unbekannte. Vorher wird jede ID mit `idSchema` geprüft.
- **Routen:** `requireApiSession()` gibt ohne Session 401 zurück. Alle Antworten tragen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` und `X-Robots-Tag: noindex`. PDFs bekommen zusätzlich `Content-Security-Policy: frame-ancestors 'self'`, damit die Vorschau im eigenen iframe funktioniert. Die globale `X-Frame-Options: DENY` aus `next.config.js` bleibt bestehen; moderne Browser werten `frame-ancestors` vorrangig. Inline ausgeliefert werden nur PDF und JPEG/PNG/WebP, alles andere kommt als Download. Dateinamen werden bereinigt, Speicherpfade gegen Path Traversal geprüft.
- **Server Actions:** Jede Action ruft selbst `getPortal()` auf. Next prüft bei Actions den Origin (CSRF). Validiert wird mit zod; Wunschtermine müssen ein ISO-Datum sein, dürfen nicht in der Vergangenheit liegen, höchstens 3. Pro Kunde gilt ein Rate-Limit von 10 Anfragen pro Stunde (`rateLimit` aus dem Fundament). Die Formulare funktionieren schon vor der Hydration (Progressive Enhancement) und haben Labels, `aria-invalid`/`aria-describedby` und eine Live-Region.
- **Schreiben ohne neue Interface-Methoden:**
  - Terminänderung → `addFeedback({projectId, target:{kind:"projekt"}, message:"[Terminänderung TER-…] …"})`. Termine ohne Projekt laufen über `requestPlanning({room:"Terminänderung"})`.
  - Service, Neubezug, Inzahlungnahme → `addFeedback({target:{kind:"position", id:itemId}, message:"[Service PASS-…] …"})`.
  - Neue Planung → `requestPlanning()`. Das Schema hat keine Felder für Budget und Zeitraum, deshalb werden beide an `message` angehängt.
- **Produktpass-Liste:** Es gibt kein `listProductPasses()`. Die Pässe werden deshalb über `Project.items[].productPassId` gefunden und mit `getProductPass()` geladen.

### Datenmodell – Vorschläge für die Erweiterung des Interfaces (an Entwickler 1)

1. Eigene Methoden `requestAppointmentChange(input)` und `requestService(input)` mit eigenem Schema statt Präfixe in `addFeedback`. Ziel in Frappe: `ToDo` bzw. `Warranty Claim`.
2. `planningRequestSchema` um `budget` und `timeframe` ergänzen; heute stehen beide nur als Freitext in `message`.
3. `ProductPass` optional erweitern um `model`, `dimensions`, `purchasedAt`, `gtin`, `manufacturer`, `countryOfOrigin`, `recycling`, `dppId`. Die UI liest diese Felder schon und zeigt sonst „folgt bei Übergabe“.
4. `Trade.contact {name, phone, email}`: Die UI zeigt den Kontakt an, sobald ein Partnerbetrieb bestätigt ist.
5. Termin-Art `service` in `APPOINTMENT_KINDS` aufnehmen. Das Label steht schon in `Docs/labels.js`.
6. `navItems.js`: Produktpass und ggf. Gewerke verlinken. Die mobile Leiste ist mit 5 Plätzen voll, daher eher als Kachel auf dem Dashboard.
7. `listDocuments` sollte für Rechnungen `dueDate` und `outstanding` (ERPNext `outstanding_amount`) liefern, sobald Beträge freigegeben sind.

### Anbindung Frappe/ERPNext (zusätzlich zu Abschnitt 1)

| Funktion | ERPNext |
|---|---|
| PDF eines Dokuments | `GET /api/method/frappe.utils.print_format.download_pdf?doctype=<Quotation / Sales Order / Delivery Note / Sales Invoice>&name=<id>&format=<Druckformat>`. Einbau in `Docs/server/files.js` → `loadDocumentFile()`, gestreamt mit dem Token des Integrations-Users. Heute gibt der Frappe-Zweig `null` zurück (404 „noch keine Datei“). |
| Zahlungsstatus | `Sales Invoice.status` (`Paid` / `Unpaid` / `Overdue` / `Partly Paid`) → `bezahlt` / `offen` |
| Fotos und Unterlagen zum Pass | `File` (is_private=1, attached_to_doctype=`PH Product Pass`), durchgereicht über `loadAttachment()` |
| Seriennummer | `Serial No` (item_code, warranty_expiry_date, delivery_date) |
| Terminänderung, Service | `ToDo` für den Berater bzw. `Warranty Claim` (ERPNext, Modul Support) mit `serial_no` |
| Planungsanfrage | `Opportunity` (opportunity_from=Customer), Budget im Custom Field `ph_budget_range` |
| Kontakt zum Gewerk | `Supplier` → `Contact` (Dynamic Link) |

### Lokaler Speicher

- Anfragen landen über den Mock-Adapter in `.data/portal/demo.json` (`feedback[]`, `planningRequests[]`).
- Echte PDFs und Fotos für Tests lassen sich unter `.data/portal/files/<storageKey>` ablegen, z. B. `demo/SAL-QTN-2026-00031.pdf`. Fehlt die Datei, erzeugt der Server ein deutlich markiertes Demo-PDF ohne Betrag („DEMO-DOKUMENT – kein rechtsgültiger Beleg“).

### Tests (curl und Playwright, 26.10.2026)

- 200 für `/de/portal/dokumente` (auch mit `?typ=rechnung&zahlung=offen`), `/termine` (auch mit `?art=montage`), `/pass`, `/pass/PASS-014-1`, `/gewerke` und `/anfragen`. 404 für `/pass/PASS-XXX` und `/en/portal/dokumente`.
- Routen mit Session: PDF 200 `application/pdf` (xref geprüft), `.ics` gesamt und einzeln 200 `text/calendar`, Pass-JSON 200. Ein unbekanntes Dokument gibt 404. Ohne Session leiten die Seiten mit 307 auf den Login (mit `next=`) um, die Routen antworten mit 401.
- Playwright: Bei 375 px scrollt keine der 6 Seiten horizontal. Planungsanfrage (Fehler- und Erfolgsfall), Terminänderung und Neubezug-Anfrage zeigen jeweils eine Vorgangsnummer. Die PDF-Vorschau öffnet sich und schließt mit Esc. Keine Konsolenfehler, eslint ist sauber.

### Offene Punkte

1. Die Frappe-Anbindung für PDFs und Anhänge fehlt (siehe oben). Mit `PORTAL_ADAPTER=frappe` antworten die Dateirouten heute mit 404.
2. Änderungs- und Servicewünsche liegen nur in `demo.json` bzw. später in ERPNext. Eine Benachrichtigung an den Berater (E-Mail) fehlt, wie der Mailversand insgesamt.
3. Der Upload-Link für Fotos (Planung, Service) wird nur angekündigt. Die Anbindung an das Upload-Team (`/de/upload`) mit einem signierten Token pro Anfrage ist offen.
4. Bei Menge > 1 (z. B. 6 Stühle) gibt es heute nur einen Pass pro Position. Nötig wäre ein Pass pro Stück mit eigener Seriennummer.
5. Die Gewährleistung ist als allgemeiner Hinweis formuliert (AT/DE in der Regel 2 Jahre). Für Kunden in CH und FL sollte das juristisch geprüft werden.
6. Der Produktpass ist für die ESPR nur **vorbereitet**. Für Möbel gibt es noch keinen delegierten Rechtsakt mit Pflichtfeldern, Datenträger und Register. Sobald er kommt: Felder angleichen, eindeutige ID (`dppId`) vergeben und den öffentlichen Teil des Passes ohne Login ausgeben.

### Rechtliches

- Jedes Formular hat einen Datenschutzhinweis mit Zweck, Rechtsgrundlage (Art. 6 Abs. 1 lit. b DSGVO, Vertrag bzw. Vertragsanbahnung) und Link auf `/de/datenschutz`. In diesem Teil gibt es keine Uploads, Sprachnachrichten oder Chats, daher ist keine Einwilligung nötig. Der Abschnitt „Kundenportal“ der Datenschutzerklärung (siehe Abschnitt 1) muss auch Anfragen, Terminänderungen und Serviceanfragen nennen.
- Dokumente, Pässe und Kalenderdateien werden nur nach Anmeldung und ohne Caching ausgeliefert, nie aus `public/`.
- Keine erfundenen Preise: Die Budgetstufen in der Planungsanfrage sind Angaben des Kunden, keine Preise des Studios. Keine erfundenen Garantiezeiten: Die Herstellergarantie kommt aus dem Datensatz, sonst steht „lt. Hersteller“.
- Dieser Teil erzeugt keine KI-Inhalte. Für Renderings gilt die Kennzeichnung aus Abschnitt 1.
- Das Demo-PDF ist sichtbar als „kein rechtsgültiger Beleg“ gekennzeichnet.


## Abschnitt 3 – Projekte & Planung (Entwickler 3)

### Was gebaut ist
- **/de/portal/projekte**: Projektliste mit Vorschau der neuesten Planung, Status, Anzahl der Varianten und Freigabe-Badge.
- **/de/portal/projekte/[id]**: Projektdetail mit Status-Timeline (aus dem Core), Positionen und dem Planungsbereich:
  - **Planungs-Galerie**: Varianten A/B/C (= Renderings nach Version) und Vollbild-Lightbox mit Zoom und Pan (Pinch, Mausrad, Tasten + / − / 0 / Pfeile).
  - **Vorher/Nachher-Slider** (Bestand gegen Variante) und **Variantenvergleich**: zwei frei wählbare Varianten im Slider, darunter alle Varianten als Karten mit Daumen hoch/runter.
  - **3D-Ansicht**: prozeduraler Raum mit R3F in derselben Palette wie das 2D-Bild. Sie lädt erst nach einem Klick, über `next/dynamic` mit ssr:false. Ohne WebGL erscheint stattdessen das Bild, und bei prefers-reduced-motion entfällt das Damping.
  - **Annotationen**: Der Kunde tippt einen Punkt aufs Bild und kommentiert ihn. Ohne Maus setzt die Schaltfläche den Punkt in die Bildmitte, die Pfeiltasten verschieben ihn. Die Pins sind nummeriert, „Im Bild zeigen“ springt vom Verlauf zum Pin.
  - **Daumen hoch/runter** je Variante: optimistisch, die letzte Bewertung gilt, „none“ nimmt sie zurück.
  - **Sprachnachricht**: MediaRecorder mit Live-Wellenform (AnalyserNode) und Timer, höchstens 3 min bzw. 5 MB. Vor dem Senden lässt sich die Aufnahme anhören. Gesendet wird nur mit Einwilligungs-Checkbox, die auf die Datenschutzerklärung verlinkt.
  - **Kommentar / Vorschlag**, wahlweise zur Variante oder zum ganzen Projekt.
  - **Verlauf**: Thread mit Antworten des Teams (Demo-Texte), Antworten eine Ebene tief, Filter „nur Variante X“, Sprachnachrichten direkt abspielbar.
  - **Freigabe**: „Gefällt mir – bitte Angebot“ öffnet einen Bestätigungsdialog. Er stellt klar, dass das noch keine Bestellung ist, und erlaubt eine optionale Anmerkung. Danach zeigt die Seite ein Banner und die Variante ein Badge.
- Demo: Alle Renderings haben `image: null`. Deshalb zeigt `RoomVisual` eine vektorielle Platzhalter-Visualisierung (Küche/Wohnen, 3 Paletten plus Bestand), sichtbar als „Platzhalter-Visualisierung“ gekennzeichnet. KI-Renderings (`aiGenerated`) tragen überall das Badge „KI-generiert“ (AI Act Art. 50).

### Dateien
- `src/app/[locale]/portal/projekte/page.js`, `projekte/[id]/page.js`: Server Components mit `getPortal()`. Bei fremden oder unbekannten IDs und bei Locale ≠ de folgt `notFound()`.
- `src/app/api/portal/feedback/route.js`: POST für Kommentar, Vorschlag, Annotation, Vote und Freigabe
- `src/app/api/portal/feedback/voice/route.js`: POST-Upload (multipart)
- `src/app/api/portal/feedback/voice/[id]/route.js`: GET-Audio mit Range-Support, nur für den Besitzer
- `src/app/api/portal/feedback/rendering/[id]/route.js`: GET-Rendering in voller Auflösung, an die Session gebunden, nie aus /public
- `src/components/Portal/Planung/`: `PlanungWorkspace.js` (Client-Hauptteil), `AnnotatableImage.js`, `BeforeAfter.js`, `Lightbox.js`, `Viewer3D.js` + `Scene3D.js`, `VoiceRecorder.js`, `Thread.js`, `VariantImage.js`, `RoomVisual.js`, `scenes.js`, `schemas.js` (zod), `client.js`
- `src/components/Portal/Planung/server/`: `planungData.js` (View-Model aus Core-Adapter und Feature-Store), `planungStore.js` (Feature-Adapter), `planungSeed.js` (Demo, nur bei `PORTAL_ADAPTER=mock`)

### Architektur und Datenmodell
- Projekt und Renderings kommen ausschließlich aus dem Core (`portal.getProject`, `portal.listRenderings`) und sind über `getPortal`/`requireApiSession` an den Kunden gebunden. Im Mock-Modus ergänzt `planungSeed` Demo-Varianten (REN-021-3, REN-014-1/2) und einen Team-Thread. `mockSeed.js` bleibt dabei unverändert.
- Strukturierte Rückmeldungen liegen in `.data/portal/planung.json` (über `store.js`), Audiodateien in `.data/portal/feedback/VO-<uuid>.<ext>`. Jeder Eintrag geht zusätzlich als Klartext über `portal.addFeedback()` an den Core-Kanal, später also an ERPNext. Scheitert der Adapter, wird das geloggt und der Eintrag bleibt trotzdem gespeichert.
- Eintrag `PlanningFeedback`: `{ id, projectId, renderingId?, parentId?, kind: kommentar|vorschlag|annotation|vote|freigabe|sprachnachricht, from: kunde|studio, author, body, point?{x,y in %}, vote?, audio?{id,mime,size,durationSec,file}, consentAt?, adapterFeedbackId?, createdAt }`. `customerId` und `audio.file` verlassen den Server nie.
- Sicherheit:
  - zod-Validierung (discriminated union)
  - Same-Origin-Prüfung (sonst 403) und Session-Pflicht (sonst 401)
  - Rate-Limit: 60 Einträge pro 10 min, 20 Sprachnachrichten pro Stunde
  - Abgleich, dass `renderingId` und `parentId` zum Projekt des Kunden gehören
  - Audio: MIME-Whitelist, Größenlimit und Prüfung der Datei-Signatur (EBML/OggS/ftyp/ID3/RIFF)

### Tests (curl / Playwright, 375 px)
- Seiten: Mit Session liefern `/de/portal/projekte`, `/de/portal/projekte/PRJ-2026-021` und `-014` den Status 200. Eine unbekannte ID gibt 404, ohne Session folgt 307 auf den Login mit `next`, `/en/...` gibt 404.
- API:
  - Gültige Einträge: 201.
  - Fehlendes `confirm`: 400. Fremde Variante oder fremdes Projekt: 404.
  - Ohne Session: 401. Fremder Origin: 403.
  - Sprachnachricht ohne Einwilligung: 400. Falsche Signatur oder falscher Typ: 415.
  - Abspielen: 200 bzw. 206, ohne Session 401.
- Playwright bei 375 px: kein horizontales Scrollen. Annotation, Vergleich, 3D-Canvas, Freigabe-Dialog und Mikrofon-UI funktionieren, keine Konsolenfehler. Die Testeinträge wurden danach aus `.data/` entfernt.

### Offene Punkte
- **Blocker Sprachaufnahme**: `next.config.js` setzt global `Permissions-Policy: microphone=()`, deshalb verweigert der Browser das Mikrofon. Die UI erkennt das und verweist aufs Textfeld. Zur Behebung muss der Owner von `next.config.js` einen Header-Eintrag **nach** dem globalen ergänzen, etwa `{ source: "/de/portal/projekte/:path*", headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" }] }`.
- Echte Renderings: Die Route ist fertig, es fehlen nur die Bilder. Im Dev gehören die Dateien nach `.data/portal/renderings/<storageKey>`, in Frappe sind sie private `File`s.
- Für Antworten des Teams gibt es noch keine eigene Studio-Oberfläche. Sie kommen später aus dem ERPNext Desk.
- Für Sprachnachrichten fehlt eine Aufbewahrungsfrist. Vorschlag: Löschung 12 Monate nach der Projektübergabe, in der Datenschutzerklärung zu nennen.

### Anbindung Frappe/ERPNext
- **Renderings**: `File` mit `attached_to_doctype="Project"` und `is_private=1`, dazu die Custom Fields `ph_variant_version` und `ph_ai_generated`. Ausgeliefert werden sie über einen Server-Proxy auf `/api/method/frappe.utils.file_manager.download_file`; das API-Token bleibt dabei auf dem Server.
- **Feedback**: neuer Custom Doctype **`PH Planning Feedback`** mit den Feldern von oben, Links auf `Project` und `Customer` sowie dem Self-Link `parent_feedback`. Kunden schreiben über die API-Route, das Team antwortet im Desk (`from=studio`).
- **Sprachnachrichten**: als privates `File`, angehängt an `PH Planning Feedback`.
- **Freigabe**: Ein Server Script auf `PH Planning Feedback` mit `kind=freigabe` legt für den Berater ein ToDo „Angebot erstellen“ an und setzt optional `Project.status`.
- **Votes**: Feld `vote` im selben Doctype, optional als Aggregat in einem Custom Field am Rendering.

### Rechtliches
- Sprachnachrichten haben eine Pflicht-Checkbox mit Einwilligungstext und Link auf `/de/datenschutz`, der Zeitpunkt steht in `consentAt`. Beim Textfeld gibt es einen Datenschutzhinweis.
- Die Datenschutzerklärung braucht einen Abschnitt „Kundenportal: Rückmeldungen und Sprachnachrichten“ mit diesen Angaben:
  - Zweck und Rechtsgrundlage: Vertragsanbahnung und -durchführung, Art. 6 Abs. 1 lit. b DSGVO
  - Speicherdauer
  - Empfänger: das Beratungsteam
- KI-Kennzeichnung nach AI Act Art. 50 an jedem Bild mit `aiGenerated`.
- Die Freigabe ist ausdrücklich keine Bestellung, das verbindliche Angebot kommt separat. Preise werden nicht angezeigt.
- Kundendaten und Audio liegen nur in `.data/` (gitignored), nie in `/public`.

## Abschnitt 4 – Nachbesserung nach QA Runde 1 (26.10.2026)

Grundlage ist `qa-screenshots/kundenportal/feedback-runde1.md` (Note 6,5). Umgesetzt sind alle P1- und P2-Punkte, soweit sie in den Portal-Dateien liegen, dazu 8 von 10 P3-Punkten. Zwei Punkte brauchen eine Änderung in `next.config.js` und bleiben deshalb für dessen Verantwortlichen offen. Das Snippet dazu steht unten.

### Was behoben wurde

| QA-Punkt | Lösung | Dateien |
|---|---|---|
| P1-1 Nachrichten 404 | Neue Seite **/de/portal/nachrichten** mit Verlauf (neueste zuerst). Ungelesene Nachrichten tragen das Badge „Neu“ und einen Goldrahmen und werden beim Öffnen als gelesen markiert. Es gibt einen Leerzustand und ein Antwortfeld (Server Action, zod, Rate-Limit, Projekt optional, Datenschutzhinweis). Neue Adapter-Methoden: `markMessagesRead`, `sendMessage`. | `portal/nachrichten/page.js`, `components/Portal/Messages/*`, `lib/portal/adapters/*`, `dal.js`, `schemas.js` |
| P1-2 Begrüßung | `viennaHour()` liest die Stunde über `formatToParts`. Der Unit-Test prüft 06, 12 und 20 Uhr in Winter- und Sommerzeit (`node --test src/lib/portal/format.test.mjs`, grün). | `lib/portal/format.js`, `format.test.mjs` |
| P1-3 Sprachnachricht | `next.config.js` ist nicht unsere Datei, deshalb greift der Fallback: Das Mikrofon wird vor dem Tippen geprüft (`permissionsPolicy`/`featurePolicy`, `MediaRecorder`). Ist es gesperrt, wird der Chip „Sprachnachricht“ nicht angezeigt. Er erscheint automatisch wieder, sobald der Header gesetzt ist. | `Planung/client.js`, `PlanungWorkspace.js` |
| P1-4 Datenschutz | Eigene Seite **/de/portal/datenschutz** nach Art. 13 DSGVO, öffentlich ohne Login. Inhalt: Verantwortlicher, Rechtsgrundlagen (lit. b; lit. a für Audio; lit. f für das Rate-Limit), Magic Link (15 Min., einmalig, nur Digest gespeichert), Cookie `ph_portal_session` (30 Tage, HttpOnly, technisch notwendig), Speicherdauer, Empfänger, KI-Kennzeichnung, Betroffenenrechte samt JSON-Export und Beschwerderecht bei der DSB. Alle Portal-Formulare und der Login verlinken dorthin. Fristen und Empfänger stehen zentral in `lib/portal/privacy.js`. | `portal/datenschutz/page.js`, `lib/portal/privacy.js` |
| P1-5 Login-Mails | Der Mailer versendet in Produktion über `fetch` (kein neues Paket). `PORTAL_MAIL_PROVIDER` wählt zwischen `resend`, `postmark`, `frappe` (whitelisted Methode, Mailkonto des Backoffice) und `webhook` (HMAC-signiert). Die Mail kommt als Text und HTML, mit Hinweis auf 15 Minuten Gültigkeit und einmalige Nutzung, „nicht angefordert? ignorieren“ und ohne Tracking. Fehlt die Konfiguration, antwortet der Login bei jeder Adresse mit dem Fehler „technik“ (503). So erscheint keine falsche Erfolgsseite, und es gibt keine Adress-Enumeration. | `lib/portal/mailer.js`, `api/portal/auth/request/route.js` |
| P2-1 Navigation | Es gibt nur noch eine Navigation (`navItems.js`). Auf dem Desktop: 7 Tabs und „Neue Planung“ als Button. Mobil: 4 Ziele und „Mehr“, ein `<dialog>`-Sheet mit Nachrichten, Produktpass, Gewerke und Neue Planung samt Ungelesen-Badge. Die Pill-Navigation ist entfernt. Das Dashboard hat eine Kachelzeile Produktpass · Gewerke · Neue Planung. | `Core/navItems.js`, `Core/PortalNav.js`, `Core/Dashboard.js`, `Docs/SectionNav.js`, `Docs/labels.js` |
| P2-2 Leerraum oben | Der Site-Header ist jetzt sticky im Fluss (56/72 px). Darauf abgestimmt:<br>• Layout-Abstand `pt-4 md:pt-8 lg:pt-12` statt `pt-28/lg:pt-52`<br>• Portal-Header mobil `mb-4`<br>• Demo-Hinweis kompakt<br>• Zurück-Link und Overline in einer Zeile<br>• Filter-Chips mobil einzeilig scrollbar mit Fade<br>Die H1 steht auf dem iPhone jetzt im ersten Bildschirm. | `portal/layout.js`, `PortalHeader.js`, `SectionNav.js`, `projekte/[id]/page.js` |
| P2-3 Touch-Ziele | Pins haben 44×44 Trefferfläche (Punkt weiter 32 px), die neue Markierung 44 px, „Markierung schließen“ `size-11`. | `AnnotatableImage.js`, `PlanungWorkspace.js` |
| P2-4 Kontrast | „folgt bei Übergabe“ und der Foto-Platzhalter stehen jetzt in `text-ink/75`. Die Stufenlabels sind auf 12 px und `/75` angehoben, ebenso alle Planungs-Texte mit `/60` und `/65`. | `pass/[id]/page.js`, `gewerke/page.js`, `PlanungWorkspace.js`, `BeforeAfter.js` |
| P2-5 Vollbild öffnet wieder | Die Lightbox öffnet sich beim Mount einmal. Jedes native `close`/`cancel` meldet sie über `addEventListener` an den Parent, der sie nur rendert, solange `lightbox` gesetzt ist. `probe-pin.mjs desktop 1` liefert jetzt 0. | `Lightbox.js`, `PlanungWorkspace.js` |
| P2-6 Mikrofon-Meldung | Die Prüfung läuft beim Mount. Die Meldung widerspricht der Oberfläche nicht mehr und bietet den Button „Stattdessen schreiben“: Er schaltet auf „Kommentar“ um und setzt den Fokus ins Textfeld. Nach einer Ablehnung gibt es zusätzlich „Erneut versuchen“. | `VoiceRecorder.js` |
| P2-7 Speicher unter Windows | Das Umbenennen wiederholt sich bei EPERM, EBUSY und EACCES (5×, 20–200 ms). Danach greift ein Fallback mit `writeFile`, das tmp wird immer gelöscht, und auch Lesen wird wiederholt. Fehler kommen als 500 „Nicht gespeichert …“ in der API an, im Mock auch wenn nur die `addFeedback`-Spiegelung scheitert. | `lib/portal/store.js`, `api/portal/feedback/route.js`, `feedback/voice/route.js` |
| P2-8 Produktpass-Bilder | `PassVisual` zeigt auf den Karten ein Bild im Format 4:3 und im Detail ein Hero mit der Marke als Overline. Ist `pass.image.src` gesetzt, erscheint das Herstellerbild. Sonst steht dort eine Platzhalter-Grafik (Wortmarke, Linienicon, Label „Platzhalter · Herstellerbild folgt“). Die Projektzeile ist entdoppelt. | `Docs/PassVisual.js`, `pass/*` |
| P2-9 PDF auf iOS | Bei `pointer: coarse`: „PDF öffnen“ in neuem Tab und „PDF herunterladen“. Mit Maus: Dialog mit Fallback-Zeile. `X-Frame-Options` kann der Route Handler nicht überschreiben, weil der globale Header gewinnt (per curl geprüft, siehe Offen). | `Docs/PdfPreview.js` |
| P3 | • Overlines „Ihre Vorhaben“ und „Ihre Termine“, Cover-Label „Platzhalter“<br>• `CardHeading` bricht um<br>• Timeline zeigt kein abgelaufenes Plandatum mehr, sondern „in Vorbereitung“<br>• Dokumente ab `lg` zweispaltig, Betrag „siehe PDF“ außerhalb des Demo-Modus<br>• Datenschutz-Links `py-1`<br>• Einwilligung zur Sprachnachricht mit Löschfrist und Widerruf<br>• Testdaten und `.tmp`-Dateien entfernt<br>• `/projekte/demo` und `/projekte/aktuell` leiten auf das aktuelle Projekt um | diverse |

### Prüfung

- ESLint auf allen Portal-Pfaden: 0 Fehler. Der Unit-Test ist grün.
- curl mit Session: alle 11 Portalseiten liefern 200, `/projekte/demo` liefert 307 auf das aktuelle Projekt. Ohne Session: Datenschutz 200, Nachrichten 307 auf den Login.
- Playwright:
  - iPhone: Das „Mehr“-Sheet öffnet sich und schließt nach der Navigation. Eine Nachricht lässt sich senden und erscheint im Verlauf. Pins sind 44×44, kein seitliches Scrollen.
  - Desktop: Alle 8 Navigationsziele liefern 200, die Lightbox bleibt zu.
- Screenshots in `qa-screenshots/kundenportal/fix/` (8 Seiten × 4 Geräte, mit Session über `shoot-auth.mjs`): 0 Konsolenfehler, kein Überlauf. `tools/qa/shoot.mjs` kann kein Session-Cookie setzen und fotografiert ohne Login nur die Anmeldeseite.

### Offen (nicht in Portal-Dateien lösbar)

1. **`next.config.js`**: Nach dem globalen Eintrag ergänzen, danach die Aufnahme auf einem echten iPhone und einem Android-Gerät testen:
   ```js
   { source: "/de/portal/projekte/:path*", headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()" }] },
   ```
   Für `/api/portal/dokumente/:path*` muss `X-Frame-Options: DENY` entfallen. Dafür den globalen Eintrag mit `source: "/((?!api/portal/dokumente).*)"` einschränken.
2. Allgemeine Datenschutzerklärung (anderes Team): einen Kurzabschnitt „Kundenportal“ mit Link auf `/de/portal/datenschutz` ergänzen.
3. Der Inhaber bestätigt Fristen und Empfänger in `src/lib/portal/privacy.js` und setzt dann `OWNER_CONFIRMED = true`.
4. Für Produktion diese Werte setzen und danach eine echte Login-Mail testen:
   - `PORTAL_SESSION_SECRET` (≥ 32 Zeichen)
   - `PORTAL_BASE_URL`
   - `PORTAL_MAIL_FROM`
   - `PORTAL_MAIL_PROVIDER` samt Schlüssel
   - bei `frappe` zusätzlich die Methode `platzhirsch_studio.api.portal_send_login_link`
   - SPF und DKIM für die Absenderdomain
5. Der Cookie-Banner verdeckt mobil die Bottom-Bar (P3-9, anderes Team).
6. Anbindung an Frappe: `markMessagesRead` auf `Communication.seen`, `sendMessage` auf `Communication` (Received, Referenz auf das Project), `pass.image` auf `Item.image`. Das Mapping steht in `adapters/frappe.js`.

## Abschnitt 5 – Runde 3: Auflagen N1–N5 und Header (26.10.2026)

| Punkt | Umsetzung | Nachweis |
|---|---|---|
| N1 (P1) Vollbild | `Planung/Lightbox.js`: Der Cleanup ruft kein `close()` mehr auf; `onClose` nur, wenn der Dialog wirklich geschlossen und noch im Dokument ist (`!d.open && d.isConnected`). StrictMode-sicher | `qa-screenshots/kundenportal/r3/probe3-{desktop,iphone}.log`: `dialog[open]` nach 1 s, nach Esc 0, zweites Öffnen 1 |
| N2 iPad-Tabs | 768–1023 px: „Neue Planung“ nur als Icon (Name per `aria-label`), Tab-Abstand 16 px; ab `lg` wie bisher | `r3/n2-n3-axe.log`: 768/834/900/1024 px ohne Abschneiden |
| N3 Kontrast | Metazeile der Team-Einträge (`Thread.js`, auf `#f4efe8`) `ink/80` ≈ 6,3:1 | axe 0 Befunde auf 12 Portalseiten |
| N4 Overline | Datenschutzseite: „Rechtliches“ | `r3/shots/de-portal-datenschutz--iphone.png` |
| N5 Platzhalter | `PassVisual.js`: ruhige Fläche, kein Verlauf, keine Linie durch den Namen, Strichzeichnung klein in der Ecke, Label ohne Radius | `r3/shots/de-portal-pass-PASS-014-1--android.png` |
| A2 Header | `next.config.js`: `microphone=(self)` nur für `/de/portal/projekte/:id`; `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` nur für `/api/portal/dokumente/:id` (ohne `kalender`, `pass`). Global unverändert | curl (siehe `teamleiter/r3-R3-portal-upload.md`), Unit `tests/unit/r3-portal-upload.test.mjs`, e2e `tests/e2e/r3-portal-upload.spec.js` |

Offen: Sprachaufnahme auf echtem iPhone/Android testen (A2-Rest). A3–A5 unverändert (Inhaber, Betrieb, Cookie-Banner). N6 (Filter-Chips) nicht in diesem Paket. Die Portal-Oberfläche selbst nutzt noch Radien und Schatten (vor dem Neuauftritt gebaut).

## Abschnitt 6 – Runde 4: Neuauftritt-Optik, Prod-Header, Ablehnungspfad Mikrofon (26.10.2026)

- **Radien/Schatten (Design-Bibel §6):** Alle `rounded-*` in Portal-Seiten und -Komponenten entfernt. Die Pille bleibt nur bei Avataren, beim Ungelesen-Zähler, bei kleinen Status-Punkten und den Markierungs-Pins der Planung. Schatten gibt es nur noch auf schwebenden Ebenen: Menü-Sheet, PDF-Dialog und Bedienelemente über Bild oder 3D. Absicherung: `tests/unit/r3-portal-flat.test.mjs` (Quelltext) und `tests/e2e/r3-portal-voice.spec.js` (berechneter `border-radius` der Karten und Buttons auf 3 Seiten).
- **Ohne `PORTAL_SESSION_SECRET` in Produktion** gab es bei vorhandenem Cookie bisher einen 500er. Jetzt gilt: `hasSessionSecret()` (config.js) → `readSessionValue` liefert `null`, das Portal leitet zum Login. Dort steht der Hinweis „Anmeldung gerade nicht verfügbar“ mit Telefonnummer statt des Formulars. Test: `tests/unit/r3-portal-config.test.mjs`.
- **Termine:** Die Termin-Art („Planungsgespräch“) wird in der Datumsspalte jetzt umbrochen statt abgeschnitten (`w-20`, `hyphens-auto`).
- **Prod-Header:** Mit `next build` + `next start` (tools/qa/prod-check.mjs, Kopie außerhalb des Repos) per curl und e2e geprüft. Das Ergebnis ist identisch mit dem Dev-Server. Beleg: `qa-screenshots/kundenportal/r3/prod-headers.log`.
- **Mikrofon abgelehnt:** Der Ablehnungspfad (NotAllowedError) ist per e2e geprüft: Hinweis, „Erneut versuchen“ ruft getUserMedia erneut auf, „Stattdessen schreiben“ fokussiert das Textfeld. Ein Test auf echtem iPhone und Android steht weiter aus.

## Abschnitt 7 – Paket R4-portal-labs (26.10.2026)

| Punkt | Umsetzung | Nachweis |
|---|---|---|
| **N6** Drei Chip-Reihen bei Dokumenten | Nur noch eine Chip-Reihe (Dokumentart). Zahlung und Projekt stehen als zwei Auswahlfelder in einer Zeile (`Docs/FilterSelects.js`), mobil zwei Spalten nebeneinander. Mit JavaScript filtert die Auswahl sofort (`router.replace`, ohne Sprung), ohne JavaScript ist es ein GET-Formular mit „Anwenden“ (`<noscript>`). Gleiche URL-Parameter wie bisher, der Server prüft alle Werte. Flach: `appearance-none`, Radius 0. | `tests/unit/r4-portal.test.mjs`, e2e `r4-portal-labs.spec.js` (N6), Bilder `qa-screenshots/kundenportal/r4/shots/` |
| **A5** Cookie-Leiste verdeckt die mobile Portal-Leiste | Die Leiste sitzt auf `bottom: var(--ph-consent-h)`: Solange die Cookie-Leiste offen ist, steht die Portal-Leiste direkt darüber, danach wieder am Rand. Der Banner selbst bleibt unverändert (gehört R4-recht-consent). | `r4/shots/de-portal--iphone.png`, e2e „A5“ |
| P3-5 Betrag | War bereits umgesetzt: In Produktion steht „siehe PDF“, nur der Demo-Modus zeigt den Platzhalter. | `portal/dokumente/page.js` |

**Weiter offen (Inhaber/Betrieb, nicht im Code lösbar):**
- **A3:** Abschnitt „Kundenportal“ in `/de/datenschutz` mit Link auf `/de/portal/datenschutz` (Live-Rechtstext, Anwalt) und Bestätigung der Fristen in `src/lib/portal/privacy.js` → dann `OWNER_CONFIRMED = true`.
- **A4:** `PORTAL_SESSION_SECRET` (≥ 32 Zeichen), `PORTAL_BASE_URL`, `PORTAL_MAIL_FROM`, `PORTAL_MAIL_PROVIDER` + Schlüssel, SPF/DKIM; danach eine echte Login-Mail testen.
- **A2-Rest:** Sprachaufnahme auf echtem iPhone und Android.
- **N7:** React-Warnung „Router action dispatched before initialization“ tritt im Dev-Modus unter Last auf (auch außerhalb des Portals), weiter beobachten.

## Abschnitt 8 – Paket R5-portal-labs (26.10.2026): Texte über t()

- `src/lib/portal/i18n.js → tx(t, key, fallback, values)`: liest den Schlüssel, wenn `t.has(key)`, sonst den bisherigen DE-Text. Damit funktioniert jede Seite vor und nach der Übernahme der Messages.
- Umgestellt: Portal-Navigation (`navItems.js` mit `key`, `PortalNav.js`: Tabs, mobile Leiste, „Mehr“-Sheet, aria-Labels) und Dokument-Filter (`FilterSelects.js`, `dokumente/page.js`: `Portal.docs.*`, von R5-i18n bereits übernommen). Neue Schlüssel `Portal.nav.*` in `Marktresearch/digital/teamleiter/messages-r5-portal.json` (4 Sprachen).
- Das Portal bleibt DE-only (Layout liefert für en/fr/it 404), bis alle Portal-Texte Schlüssel haben. Nur die Leser sind vorbereitet.

## Abschnitt 9 – Paket R6-portal-labs (26.10.2026): Demo-Hinweis N7, Leiste mobil, Rate-Limit der Server Actions

- **N7 Demo-Hinweis:** `DevDataNotice` (`Portal/Docs/SectionNav.js`) holt den Text aus `src/lib/portal/demoNotice.js` über `tx()`. Auf dem Dev-Server (`next dev`) heißt er weiter „Demo-Daten aus der lokalen Entwicklungsumgebung …“. Ein Produktions-Build mit Demo-Sitzung (Mock-Adapter) zeigt neutral „Demo-Zugang mit Beispieldaten – keine echten Kundendaten, keine Preise.“ Die Schlüssel `Portal.demo.dev` und `Portal.demo.access` stehen in 4 Sprachen in `Marktresearch/digital/teamleiter/messages-r6-portal.json`, IT in tu-Form.
- **Portal-Leiste mobil bei offener Cookie-Leiste:** Die Leiste bleibt auf `bottom: var(--ph-consent-h)` und liegt damit über der Cookie-Leiste. Solange die Cookie-Leiste offen ist (`--ph-consent-h` gesetzt, über `useSyncExternalStore` und einen MutationObserver gelesen), wird sie kompakt: 44 statt 60 px, Symbol 18 statt 22 px, gleiche Beschriftungen, Ziele weiter 44 px. Nach der Entscheidung hat sie wieder die volle Höhe. Die Texte der Cookie-Leiste sind unverändert. Gemessen mit Demo-Sitzung: iPhone 15 Pro (659 px) 31,3 % → 28,8 %, Pixel 7 (839 px) 24,6 % → 22,6 %. Die Grenze von 25 % ist erst ab etwa 756 px Viewport-Höhe erreichbar. Grund: Die Cookie-Leiste allein hat 145 px, also 22 % von 659 px. Für eine Portal-Leiste mit 44-px-Zielen bleiben dann nur 20 px. Der Rest liegt bei der Cookie-Leiste bzw. bei der Freigabe kürzerer Texte durch die Kanzlei.
- **Rate-Limit der Server Actions:** `src/lib/portal/actionLimit.js` nutzt dieselbe Speicher-Abstraktion wie der Concierge und `/cmx` (`lib/concierge/limiter.js` über `limitStore.js`; Arbeitsspeicher als Standard, `setStore(createSharedStore(exec, { prefix: "portal:rl:" }))` für Redis-kompatible Speicher). Stufe 1 zählt je IP **vor** `getPortal()` jeden Aufruf: 20 pro Minute, 200 pro Stunde, einstellbar über `PORTAL_ACTION_RATE_PER_MIN` und `PORTAL_ACTION_RATE_PER_HOUR`. Stufe 2 zählt je Kunde nach der Sitzungsprüfung, mit den bisherigen Grenzen: Dokumente, Termine, Pass und Anfragen 10 pro Stunde, Nachrichten 20 pro Stunde. Betroffen sind `Portal/Docs/actions.js` (3 Actions) und `Portal/Messages/actions.js`. Das bremst Fluten von Action-Anfragen, bis Next 16.4.1 oder neuer eingespielt ist. Den DoS im Framework selbst (Parsen der Anfrage vor dem Action-Code) behebt nur dieses Update. **Das Portal bleibt bis dahin aus.** `lib/portal/rateLimit.js` bleibt für die API-Routen (Login, Feedback) bestehen.
- Tests: `tests/unit/r6-portal-labs.test.mjs` (Limit je IP und je Kunde, Speicherwechsel und Ausfall, Reihenfolge IP → getPortal → Kunde in den Actions, N7 in 4 Sprachen, kompakte Leiste).
