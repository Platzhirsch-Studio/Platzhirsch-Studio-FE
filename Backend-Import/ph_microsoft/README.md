# Platzhirsch Microsoft 365 (`ph_microsoft`) – App Nr. 14

Inhaber-Entscheidung **Nr. 52** (04.11.2026): „Backoffice muss mit Microsoft-Login gehen und wir verbinden das mit Microsoft Exchange Online.“ Ergänzt durch die verbindliche Präzisierung zur Mail-Übernahme (Abschnitt 4). Frappe v15 (v16-kompatibel), **nur `ph_core` ist Pflicht**; ph_crm, ph_projekte, ph_service, ph_sortiment, ph_ablage werden genutzt, wenn installiert. Kein Microsoft-SDK – nur `requests` und `cryptography` (beide kommen mit Frappe). **Nicht installiert**, nichts wurde gegen Microsoft aufgerufen (alle Tests mit Attrappen).

| Baustein | Datei |
|---|---|
| SSO-Brücke Backoffice ↔ Frappe (ID-Token selbst prüfen, Benutzer zuordnen, Rollen aus Gruppen, `login_as`) | `ph_microsoft/sso.py`, Logik `logik/jwt_pruefung.py`, `logik/gruppen.py` |
| Graph-Client (App-Only, Token-Cache, Retry 429/503 mit Retry-After, Paging, Delta) | `graph/token.py`, `graph/client.py`, Frappe-Anbindung `ph_microsoft/graph_dienst.py` |
| Exchange-Mail ↔ Kundenakte (automatisch nur eindeutig, sonst bleibt alles in Outlook), manuelle Zuordnung, Senden | `ph_microsoft/mail.py`, Regeln `logik/zuordnung.py` |
| Webhooks (Subscriptions, Handshake, clientState) + Delta-Rückfall alle 5 min | `ph_microsoft/abos.py`, `logik/webhook.py`, `api.graph_webhook`, `ph_microsoft/tasks.py` |
| Outlook-Kalender zwei Wege, Teams-Links, Frei/Belegt | `ph_microsoft/kalender.py`, Regeln `logik/kalender_regeln.py` |
| PH Kontakt → Outlook-Kontaktordner (optional) | `ph_microsoft/kontakte.py` |
| Kundenakte-Hooks (Zeitleiste, Auskunft, Anonymisieren, Zusammenführen) | `ph_microsoft/kontakt_hooks.py` |
| Whitelisted API | `api/__init__.py` |

## 1. DocTypes, Desk

| DocType | Zweck | Name |
|---|---|---|
| **PH Microsoft Einstellungen** (Single) | Tenant-ID, Client-ID (Backoffice), Toleranz, SSO-Rate-Limit, Auto-Benutzeranlage, Rollen aus Gruppen, **Gruppen → Rollen** (Kind `PH Microsoft Gruppe Rolle`: Gruppen-Objekt-ID, Rolle, Standort), Webhook-Basis-URL, interne Domains, Schalter Mail/Anhänge/1:1-Kundenmails/Kalender (je Quelle)/Teams/Belegt-Spiegel/Kontakte, Aufbewahrung, Statusfelder. Buttons **Verbindung testen**, **Webhook-Abos jetzt prüfen** | Single |
| **PH Postfach** | Angebundene Benutzer-/Shared-Mailbox: Ordner, Richtung (Beide/Eingang/Ausgang), Webhook ja/nein, **Berechtigte** (Kind `PH Postfach Benutzer`: lesen/zuordnen, senden), Delta-Stand, Fehler. Buttons **Jetzt abholen**, **Delta zurücksetzen** | `field:adresse` |
| **PH Kalender Zuordnung** | Frappe-Benutzer ↔ Outlook-Postfach (Standardkalender), Zwei-Wege oder nur Backoffice → Outlook, Belegt-Spiegel. Buttons **Jetzt abgleichen**, **Delta zurücksetzen** | `field:user` |
| **PH Graph Abo** | Graph-Subscription (Mail/Kalender) mit Ablauf, clientState nur als SHA-256, Zähler. Buttons **Erneuern**, **Bei Microsoft löschen** | hash |
| **PH Sync Protokoll** | Jeder Lauf/jede Zuordnung: Bereich, Aktion, Ergebnis, Bezug, Kontakt (Name), Anzahl – **nie Token, Betreff, Inhalt** | hash |
| **PH Graph Verknuepfung** | Vorgang ↔ Outlook-Objekt (Ereignis, Belegt-Spiegel, Kontakt): Graph-ID, iCalUId, changeKey, Inhalts-Hash, letzte Zeiten, Teams-Link | hash |
| **PH Mail Adresse** | **Weitere E-Mail-Adressen** eines PH Kontakt/PH Lieferant (Art „Zuordnung“) und **Sperrliste** (Art „Sperre“, nie zuordnen) | hash |

ph_crm hat **keine** Kindtabelle für weitere Adressen am PH Kontakt (geprüft: `ph_kontakt.json` hat nur `email`, `PH Kontakt Adresse` ohne E-Mail). Statt eines Custom Fields an PH Kontakt (würde ph_crm zur Pflicht-App machen) liegen weitere Adressen in **PH Mail Adresse** (Dynamic Link) und erscheinen über den Hook in Zeitleiste und Datenauskunft.

Custom Fields (Fixture, Modul PH Microsoft): `User.ph_microsoft_oid` (unique, stabile Zuordnung), `User.ph_microsoft_sso_gesperrt`, `User.ph_microsoft_letzte_anmeldung`; `Communication.ph_microsoft_postfach`, `…_zuordnung` (automatisch/manuell), `…_zugeordnet_von`, `…_graph_id`.

**Workspace „PH Microsoft“** (sequence 14): Number Cards Sync-Fehler heute, Kalender-Konflikte, Abos abgelaufen/Fehler, aktive Abos, Postfächer mit Fehler, zugeordnete Mails heute; Charts Sync je Tag, nach Ergebnis, nach Bereich; Schnellzugriffe; Report **PH Sync Fehler** (Protokoll-Fehler/Konflikte + gestörte Postfächer, Kalender, Abos, Verknüpfungen). Rechte: System Manager, **PH Backoffice-Admin** (keine neue Rolle), PH Geschäftsführung lesend; PH Mail Adresse zusätzlich PH CRM Mitarbeiter/Leitung.

Scheduler: alle 5 min Mail-Delta und Kalender-Delta (je Postfach/Kalender ein Auftrag mit `job_id`, keine Doppelläufe neben Webhooks), stündlich :07 Abos anlegen/erneuern (Laufzeit 3 Tage, Erneuerung unter 36 h Rest), 03:10 Kalender-Delta-Fenster neu, 03:40 Kontakte-Vollabgleich (falls an), 02:40 Bereinigung Protokoll/Verknüpfungen/Abos (Standard 90 Tage).

## 2. Installation

```bash
bench get-app /pfad/zu/Backend-Import/ph_microsoft
bench --site $SITE install-app ph_microsoft          # nach ph_core (… ph_ablage), legt Standardwerte an
bench --site $SITE migrate
bench --site $SITE run-tests --app ph_microsoft       # Site-Tests mit Graph-Attrappe (frappe.flags.ph_ms_graph_client)
cd Backend-Import/ph_microsoft && PYTHONPATH=. python -I -m unittest discover -s ph_microsoft/tests -t .   # 77 Tests ohne Site
```

Alles bleibt aus, bis im Desk die Schalter gesetzt sind (`sso_aktiv`, `mail_sync_aktiv`, `kalender_sync_aktiv`, `kontakte_sync_aktiv`).

## 3. Einrichtung im Microsoft Entra Admin Center (Inhaber/IT)

Zwei getrennte App-Registrierungen – Anmeldung und Datenzugriff sind getrennt, damit das Backoffice-Login nie Postfachrechte hat.

### 3.1 App „Platzhirsch Backoffice“ (Anmeldung der Mitarbeiter)

1. *Entra Admin Center → Identität → Anwendungen → App-Registrierungen → Neue Registrierung*: Name „Platzhirsch Backoffice“, **Nur Konten in diesem Organisationsverzeichnis** (Single Tenant).
2. *Authentifizierung → Plattform „Web“*, Umleitungs-URIs (Domain laut Inhaber-Entscheidung; beide Vorschläge stehen im Raum):
   - `https://office.platzhirsch.studio/auth/microsoft/callback` **oder** `https://backoffice.platzhirsch.studio/auth/microsoft/callback`
   - `http://localhost:3100/auth/microsoft/callback` (Entwicklung; vor Livegang entfernen, wenn nicht nötig)
   - Implizite Gewährung **aus** (Authorization Code + PKCE; das Backoffice prüft `state` und `nonce`).
3. *Zertifikate & Geheimnisse*: Client-Secret für das Backoffice (Code-Einlösung serverseitig in Next.js) – **nur** in den Env-Variablen des Backoffice, nie in Frappe.
4. *API-Berechtigungen*: Microsoft Graph delegiert `openid`, `profile`, `email` (Standard; `User.Read` darf bleiben) → **Administratorzustimmung erteilen**.
5. *Tokenkonfiguration → Gruppenanspruch hinzufügen*: **Sicherheitsgruppen**, im ID-Token als **Gruppen-ID** (Objekt-ID). Optional „Nur der Anwendung zugewiesene Gruppen“, um den Überlauf (> 200 Gruppen) zu vermeiden. Optionale Ansprüche `email`, `preferred_username`.
6. *Unternehmensanwendungen → Platzhirsch Backoffice → Eigenschaften*: **Zuweisung erforderlich = Ja**; unter *Benutzer und Gruppen* nur die Backoffice-Gruppen zuweisen. MFA über **Bedingten Zugriff** erzwingen (die SSO-Brücke umgeht Frappes eigene 2FA – Microsoft übernimmt sie).
7. Werte in **PH Microsoft Einstellungen**: Tenant-ID (Verzeichnis-ID), Client-ID (Anwendungs-ID) – beide keine Geheimnisse. Gruppen-Objekt-IDs in die Tabelle **Gruppen und Rollen** (z. B. „PH Verkauf“ → PH CRM Mitarbeiter). `sso_aktiv` einschalten.

### 3.2 App „Platzhirsch Graph (App-Only)“ (Postfächer, Kalender, Kontakte)

1. Neue Registrierung „Platzhirsch Graph“, Single Tenant, **keine** Umleitungs-URI.
2. *Zertifikate & Geheimnisse*: bevorzugt **Zertifikat** hochladen (öffentlicher Teil); privater Schlüssel als PEM in `ph_ms_cert_pem`, SHA-1-Fingerabdruck in `ph_ms_cert_thumbprint`. Alternativ Client-Secret → `ph_ms_client_secret` (Ablauf notieren, rechtzeitig erneuern).
3. *API-Berechtigungen → Microsoft Graph → Anwendungsberechtigungen* (minimal):

| Berechtigung | wofür | nötig wenn |
|---|---|---|
| `Mail.Read` | Delta/Webhook, Liste „nicht zugeordnet“, Zuordnen (Inhalt + Anhänge) | Mail-Abgleich |
| `Mail.Send` | `mail_senden` über `sendMail` (kein Entwurf, daher **kein** Mail.ReadWrite) | Senden über Exchange |
| `Calendars.ReadWrite` | Ereignisse anlegen/ändern/löschen, Delta, `getSchedule`, Teams-Link über `isOnlineMeeting` | Kalender |
| `Contacts.ReadWrite` | Kontaktordner „Platzhirsch Kunden“ im Team-Postfach | nur wenn Kontakte-Abgleich an |
| `User.Read.All` | „Verbindung testen“ (Postfach auflösen) | optional |

`OnlineMeetings.ReadWrite.All` ist **nicht** nötig: Teams-Besprechungen entstehen über das Kalenderereignis (`isOnlineMeeting`, `onlineMeetingProvider = teamsForBusiness`); im Teams Admin Center muss für die Benutzer „Teams-Besprechungen aus Outlook“ erlaubt sein. Danach **Administratorzustimmung erteilen**.
4. **Zugriff auf die angebundenen Postfächer beschränken** (Pflicht – sonst darf die App jedes Postfach des Tenants lesen). Exchange Online PowerShell:

```powershell
# E-Mail-aktivierte Sicherheitsgruppe mit genau den Postfächern aus PH Postfach / PH Kalender Zuordnung
New-DistributionGroup -Name "PH Graph Postfaecher" -Type Security -PrimarySmtpAddress ph-graph-postfaecher@platzhirsch.studio
Add-DistributionGroupMember -Identity "PH Graph Postfaecher" -Member info@platzhirsch.studio
# Variante A (bewährt): Application Access Policy
New-ApplicationAccessPolicy -AppId <Client-ID Platzhirsch Graph> -PolicyScopeGroupId ph-graph-postfaecher@platzhirsch.studio -AccessRight RestrictAccess -Description "Platzhirsch Backoffice"
Test-ApplicationAccessPolicy -Identity info@platzhirsch.studio -AppId <Client-ID>     # → Granted
Test-ApplicationAccessPolicy -Identity geschaeftsfuehrung@… -AppId <Client-ID>        # → Denied
# Variante B (von Microsoft empfohlener Nachfolger): RBAC for Applications mit Management Scope
#   New-ManagementScope + New-ManagementRoleAssignment -App <ServicePrincipal> -Role "Application Mail.Read" …
```

Neue Mitarbeiter-Postfächer (Kalender) und Shared Mailboxes immer zuerst in diese Gruppe aufnehmen, dann in PH Postfach / PH Kalender Zuordnung anlegen.
5. Webhooks: `webhook_basis_url` = öffentliche HTTPS-Adresse des Frappe-Servers (z. B. `https://backend.platzhirsch.studio`). Der Reverse-Proxy muss **nur** den Pfad `/api/method/ph_microsoft.api.graph_webhook` aus dem Internet zulassen (Microsoft ruft von wechselnden Adressen; Rest von `backend.` bleibt auf Website/Backoffice/Admin-IPs beschränkt). Ohne URL arbeitet der Delta-Abgleich alle 5 min allein.
6. In `site_config.json` setzen (Abschnitt 5) und im Desk **Verbindung testen**.

## 4. Exchange-Mail – Regeln (verbindlich, Präzisierung des Inhabers 04.11.2026)

1. **Automatisch** übernommen wird eine Mail **nur**, wenn die Gegenadresse (Eingang: Absender; Ausgang: An/Cc) **eindeutig** einem bestehenden PH Kontakt oder PH Lieferanten gehört – Haupt-E-Mail (`PH Kontakt.email`, `PH Lieferant.bestell_email`, Ansprechpartner) oder weitere Adresse aus **PH Mail Adresse**. Dann: Frappe `Communication` mit Zeitleisten-Link am Kontakt (ph_crm zeigt sie in der Kundenakte und setzt „letzter Kontakt“); erkennt der Betreff/Text eine **Vorgangsnummer** (Muster aus `ph_core NUMMERNKREISE`: PH-ANF-, PH-PRJ-, PH-SRV-, PH-TER-, AN-, AB-, RE-, PH-MON-, PH-SRE-, PH-S-, …) und gehört der Vorgang zu diesem Kontakt/Lieferanten, hängt sie zusätzlich am Vorgang. Anhänge nur mit Schalter, bis `anhang_max_mb`, privat an der Communication; danach Hook `ph_microsoft_anhang_ablegen` (ph_ablage).
2. **Alle anderen Mails bleiben in Outlook** – keine Kopie, kein Betreff, kein Inhalt, kein Protokolleintrag mit Inhalt. Für unbekannte Absender wird nicht einmal der Nachrichtentext geladen.
3. **Manuell** aus der flüchtigen Liste `mails_unzugeordnet` (live per Graph, nur eigene Postfächer/Shared-Mailboxen mit Recht, nur Absender/Betreff/Datum + Vorschläge): `mail_zuordnen` (Kunde, Projekt, Servicefall … – erst jetzt gespeichert), Option **Adresse merken** (PH Mail Adresse → künftige Mails automatisch), `kontakt_aus_mail` (neuer PH Kontakt), `adresse_sperren` („nie zuordnen“ – Werbung, Privates).
4. **Vertraulich/privat** (Outlook-Sensitivity `private`/`confidential`) → nie automatisch, nur manuell.
5. **Mehrdeutig** (Adresse bei mehreren Kontakten) → nicht automatisch, in die Liste mit Vorschlägen.
6. **Rückgängig**: `mail_zuordnung_aufheben` löscht Communication und Anhänge im Backoffice (bleibt in Outlook), protokolliert in PH Sync Protokoll.
Zusätzlich ignoriert: interne Mails (nur `interne_domains`/eigene Postfächer), Newsletter/Verteiler/Automaten (`List-Unsubscribe`, `List-Id`, `Precedence: bulk`, `Auto-Submitted`, unbekannte `noreply@…`). Eine **bekannte** no-reply-Adresse eines Lieferanten (AB-System) bleibt zuordenbar.

**Senden** (`mail_senden`): Graph `sendMail` aus dem Postfach des angemeldeten Benutzers oder einer Shared-Mailbox mit Senderecht (PH Postfach Benutzer „senden“); Testmodus von ph_core → Umleitung an `team_email`, Betreff `[TEST]`. Die gesendete Mail wird sofort als Communication am Vorgang/Kontakt gespeichert (Kopfzeile `X-PH-Mail-Id` verhindert eine zweite Kopie aus „Gesendete Elemente“). **`ph_core.utils.mail.sende` bleibt unverändert**: Transaktions- und Newsletter-Mails laufen weiter über Resend. Für persönliche 1:1-Kundenmails bietet ph_microsoft den Hook `ph_mail_einzelversand` an (Schalter „1:1-Kundenmails über Exchange“):

```python
# in einer Fach-App, z. B. PH Kontakt.mail_senden / Angebot senden (Anfrage an die jeweilige App):
for pfad in frappe.get_hooks("ph_mail_einzelversand") or []:
    erg = frappe.get_attr(pfad)(empfaenger, betreff, html, anhaenge=anhaenge, bezug_doctype=doc.doctype, bezug_name=doc.name)
    if erg:
        break                      # über Exchange gesendet und abgelegt
else:
    sende(empfaenger, betreff, html, anhaenge=anhaenge)   # ph_core/Resend wie bisher
```

**Outlook-Add-in (nur vorbereitet):** Ein Add-in „Platzhirsch zuordnen“ ruft dieselben Methoden auf: `Office.context.mailbox.item.itemId` → `Office.context.mailbox.convertToRestId(…, v2_0)` = `message_id`, `Office.context.mailbox.userProfile.emailAddress` = `postfach`; Anmeldung über Nested App Authentication gegen die App „Platzhirsch Backoffice“ und dieselbe SSO-Brücke. Kein Code im Repo.

## 5. `site_config.json` – Schlüssel (nur Namen)

| Schlüssel | Zweck |
|---|---|
| `ph_ms_tenant_id` | Tenant-ID für die Graph-App (App-Only) |
| `ph_ms_client_id` | Anwendungs-ID „Platzhirsch Graph“ |
| `ph_ms_client_secret` | Client-Secret – **oder** |
| `ph_ms_cert_pem`, `ph_ms_cert_thumbprint` | Zertifikat (privater Schlüssel PEM, SHA-1-Fingerabdruck Hex) – empfohlen |
| `ph_ms_sso_bridge_secret` | optional; gesetzt → `sso_sitzung` verlangt Header `X-PH-Backoffice-Key` (Standard aus, Abstimmung mit dem Backoffice) |

Tenant-/Client-ID des **Backoffice-Logins** stehen in PH Microsoft Einstellungen (keine Geheimnisse). Das Client-Secret des Backoffice-Logins liegt nur im Backoffice (Env), nie in Frappe.

## 6. Schnittstelle für das Backoffice (Next.js)

Alle Methoden `POST /api/method/ph_microsoft.api.<name>` (Listen auch GET). Fehlerbild wie ph_core: `{"code", "message", …}` mit HTTP-Status. Außer `sso_sitzung`/`graph_webhook` immer mit der **Frappe-sid des Mitarbeiters** (Rechte je Postfach/Vorgang). Protokoll in PH API Protokoll **ohne Parameter** (eigener Decorator `ms_api`, auch wenn `api_protokoll_nutzdaten` an ist).

| Methode | Parameter | Antwort | Fehler |
|---|---|---|---|
| `sso_sitzung` (Gast, Rate-Limit 10/min je IP) | `id_token`, `nonce?` | `{user, name, kurzname, roles[], standort, sid, neu_angelegt}` | `invalid_token` 401 (Signatur, iss, aud, exp/nbf ±5 min, nonce, wiederverwendet), `forbidden` 403 (fremder Tenant, Benutzer deaktiviert/gesperrt, andere oid, kein System User, Administrator) `{gesperrt?}`, `not_found` 404 (kein Frappe-User, Auto-Anlage aus/keine gemappte Gruppe), `rate_limited` 429, `unavailable` 503 (SSO aus, JWKS nicht abrufbar) |
| `mails_unzugeordnet` | `postfach?`, `tage?=14` (≤ 31) | `[{message_id, postfach, richtung, absender, absender_name, gegenadresse, betreff, datum, grund (unbekannt/mehrdeutig/vertraulich), vertraulich, vorschlaege:[{doctype, name, titel}]}]` – nicht gespeichert | `forbidden` 403 (Postfach), `unavailable` 503 (Graph) |
| `mail_zuordnen` | `message_id, postfach, bezug_doctype, bezug_name, adresse_merken?=0, idempotency_key?` | `{communication, bezug_doctype, bezug_name, adresse_gemerkt}` | `invalid` 400, `forbidden` 403, `not_found` 404 |
| `kontakt_aus_mail` | `message_id, postfach, idempotency_key?` | `{kontakt, communication}` | `conflict` 409 `{vorschlaege}` (Adresse bekannt), `unavailable` 503 (ph_crm fehlt) |
| `mail_zuordnung_aufheben` | `communication` | `{ok, communication}` | `forbidden` 403, `not_found` 404 |
| `adresse_sperren` / `adresse_entsperren` | `adresse, notiz?` / `adresse` | `{ok, adresse, eintrag}` / `{ok, adresse, entfernt}` | `invalid` 400, `forbidden` 403 |
| `mail_senden` | `an, betreff, html, von?, cc?, bcc?, anhaenge? (file_url-Liste oder [{fname, fcontent base64}], ≤ 3 MB), bezug_doctype?, bezug_name?, idempotency_key?` | `{ok, communication, von, testmodus}` | `invalid` 400, `forbidden` 403 (kein Senderecht, Graph/Access Policy), `not_found` 404, `unavailable` 503 |
| `meine_postfaecher` | – | `{lesen: [...], senden: [...]}` | – |
| `frei_belegt` | `benutzer (Liste), von, bis` (≤ 62 Tage) | `{user: [{start, ende, status}]}` | `invalid` 400, `unavailable` 503 |
| `kalender_abgleichen` | `doctype, name` | `{ok, verknuepfungen:[{user, status, teams_link}]}` | `forbidden` 403 |
| `status` | – | Zeitpunkte letzter Läufe, Fehler/Konflikte 24 h, Abos aktiv/laufen ab/gestört, Postfächer, Kalender | `forbidden` 403 |
| `graph_webhook` (Gast, nur Microsoft) | `validationToken` / `{value:[…]}` | 200 text/plain (Handshake) bzw. 202 | – |

Ablauf Login: Backoffice `/auth/microsoft/callback` (Code + PKCE, `state`/`nonce` geprüft) → `sso_sitzung({id_token})` ohne Service-Token → `sid` serverseitig im Session-Store (wie beim Passwort-Login, PLAN-NEXT-BACKOFFICE §3) → Arbeitsplatzwahl. Rollenabgleich: nur Rollen aus der Zuordnungstabelle werden hinzugefügt/entfernt, nie System Manager/Administrator; bei Gruppen-Überlauf bleibt alles unverändert (Hinweis im Protokoll). Benutzerzuordnung: `ph_microsoft_oid` → sonst `preferred_username`/`email` = User-Name/E-Mail (oid wird dann gesetzt). Token-`uti` wird 70 min gesperrt (keine Wiederverwendung). JWKS-Cache 24 h, Neuladen bei unbekannter `kid` höchstens alle 5 min.

## 7. Kalender

- **Backoffice → Outlook**: PH Termin (Berater), PH Montageauftrag (Montageleiter + Team), PH Serviceeinsatz (Techniker, Techniker 2) → je Mitarbeiter mit aktiver PH Kalender Zuordnung ein Ereignis im Standardkalender: Betreff/Ort/Kurztext (Vorgangsnummer), Kategorie „Platzhirsch“, `transactionId` (deterministisch, keine Doppelanlage), Erweiterungseigenschaft `PHReferenz = DocType|Name`. Storniert/Abgebrochen oder Mitarbeiter entfernt → Ereignis gelöscht. **Terminart Video** → Teams-Besprechung, `joinUrl` in `PH Termin.meet_url` (wenn leer).
- **Outlook → Backoffice** (Delta alle 5 min + Webhook): Konfliktregel – **Backoffice gewinnt beim Inhalt** (Betreff/Ort/Text werden zurückgeschrieben), **Outlook gewinnt bei Zeitverschiebung** durch den Mitarbeiter (Vorgang wird angepasst, **Rückmeldung als PH Aufgabe** an den Ersteller, sonst ToDo); beide Seiten verschieden geändert → Backoffice gewinnt + Konflikt-Aufgabe; Vorgang lehnt die neue Zeit ab (Validierung) → Backoffice-Zeit wird zurückgeschrieben + Aufgabe. In Outlook gelöscht → Verknüpfung „Konflikt“ + Aufgabe, Vorgang bleibt.
- **Frei/Belegt**: fremde Outlook-Termine (busy/oof/tentative) der Mitarbeiter werden als **private Frappe-Events „Belegt (Outlook)“ ohne Betreff/Inhalt** gespiegelt – ph_crm zählt Events der Berater bereits als belegt (`kalender.event_belegungen`), die Website-Terminbuchung berücksichtigt Outlook also ohne Änderung an ph_crm. Live-Abfrage `frei_belegt` (getSchedule) und Hook `ph_crm_belegungen` stehen zusätzlich bereit.

## 8. OneDrive/SharePoint für ph_ablage

ph_ablage hat einen eigenen Adapter `speicher/onedrive.py` mit eigenen Schlüsseln (`ph_ablage_ms_*`) – **unverändert**. Wer nur eine App-Registrierung pflegen will, kann den Token aus ph_microsoft nehmen (gleiche App „Platzhirsch Graph“ zusätzlich mit `Sites.Selected` bzw. `Files.ReadWrite.All` berechtigen):

```python
# Vorschlag für ph_ablage (deren Agent entscheidet), z. B. in OneDriveSpeicher._zugriff():
if frappe.conf.get("ph_ablage_ms_token_von_ph_microsoft") and "ph_microsoft" in frappe.get_installed_apps():
    from ph_microsoft.graph import graph_token
    return graph_token()          # App-Only, Redis-Cache, nie protokollieren
```

`ph_microsoft.graph.graph_client()` liefert zusätzlich Retry/Paging/Delta. Mail-Anhänge an die Ablage: ph_ablage trägt in seine `hooks.py` `ph_microsoft_anhang_ablegen = ["ph_ablage.…"]` ein (Signatur `fn(datei, bezug_doctype, bezug_name, kontakt, quelle)`).

## 9. Sicherheit und Datenschutz

- **Minimale Rechte** (Abschnitt 3.2), Postfachzugriff per Application Access Policy/RBAC auf die angebundenen Postfächer begrenzt; Admins im Backoffice sehen fremde Postfächer nicht (nur Besitzer/Berechtigte je PH Postfach).
- **Keine Tokens, Mailinhalte, Betreffs oder Anhangnamen in Logs**: PH Sync Protokoll speichert nur Bereich/Aktion/Ergebnis/Bezug; Fehlertexte werden von Token-Mustern bereinigt; PH API Protokoll ohne Parameter; Graph-Fehler nur mit Code/Status. clientState nur als Hash, Graph-Token nur im Redis-Cache.
- **Datensparsamkeit**: nicht zugeordnete Mails werden nie gespeichert; die Liste „nicht zugeordnet“ ist flüchtig. Belegt-Spiegel ohne Betreff.
- **Aufbewahrung**: Communications unterliegen den Regeln von ph_crm (Kundenakte, DSGVO-Auskunft, Löschplan, § 132 BAO für Geschäftsbriefe); PH Sync Protokoll/Verknüpfungen/abgelaufene Abos 90 Tage (einstellbar). Hooks liefern Auskunft/Anonymisierung (PH Mail Adresse löschen, Outlook-Kontakt entfernen, Protokoll-Kontaktbezug leeren).
- **AVV**: Microsoft 365 wird Auftragsverarbeiter – Microsoft Products and Services Data Protection Addendum (DPA) gilt mit dem Vertrag; Tenant-Datenstandort EU prüfen und **EU Data Boundary** (Microsoft 365, für EU-Tenants Standard) im Verarbeitungsverzeichnis vermerken; Hinweis in der Datenschutzerklärung (E-Mail-Kommunikation über Microsoft 365). Mitarbeiter-Information (Kalender-/Mailabgleich, Belegt-Spiegel) über die Betriebsvereinbarung/Information nach Art. 13 DSGVO.

## 10. Anfragen an andere Apps / offene Punkte

- **ph_crm**: `kalender.freie_slots` könnte `frappe.get_hooks("ph_crm_belegungen")` lesen (zusätzlich zu `event_belegungen`) – heute nicht nötig, solange der Belegt-Spiegel an ist. `PH Kontakt.mail_senden` könnte den Hook `ph_mail_einzelversand` nutzen.
- **ph_ablage**: Eintrag `ph_microsoft_anhang_ablegen` und optional `graph_token()` (Abschnitt 8).
- **Backoffice (Next.js)**: Login-Knopf „Mit Microsoft anmelden“, Seite „Nicht zugeordnete Mails“ (mails_unzugeordnet + Aktionen), Senden-Dialog am Vorgang (mail_senden). Redirect-Domain office./backoffice. laut Inhaber-Entscheidung.
- Gruppen-Überlauf (> 200 Gruppen): Rollen werden dann nicht abgeglichen; Abhilfe in Entra „nur zugewiesene Gruppen“ im Token (3.1 Punkt 5).
- Delta auf `calendarView` nutzt den Standardkalender; weitere Kalender je Mitarbeiter sind nicht vorgesehen.
