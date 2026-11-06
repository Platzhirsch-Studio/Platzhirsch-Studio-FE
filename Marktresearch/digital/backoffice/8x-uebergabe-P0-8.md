# 8x – Übergabe Team P0-8 (Auth & Sitzung, Fundament v2)

**Stand:** 2026-11-04. Auftrag laut MASTER § 5 / § 4 G-25: Personen- und Freigabe-Sitzung, Sitzungs-Store-Schnittstelle Redis-fertig (das Commit-Register nutzt sie), Vorlieben je Benutzer (Einzeltasten, Dichte, Theme). Der Microsoft-Login (`auth/microsoft.js`, `auth/oidc.js`) ist unverändert. Ein früherer, abgebrochener Lauf hatte `auth/redis.js` (RESP-Client ohne Paket) angelegt. Den Client habe ich weiterverwendet und einen Fehler darin behoben (siehe C).

Schreibbereich: `src/lib/backoffice/auth/`. Dazu kommen zwei neue Unit-Dateien (Q-M1) und der eigene README-Abschnitt.

## A. Gebaut

| Datei | Inhalt |
|---|---|
| `auth/store.js` | Schnittstelle `SessionStore` als typedef. `MemorySessionStore` hat neu allgemeine Werte: `wertSetzen` (TTL), `wertSetzenWennFrei`, `wertLesen`, `wertNehmen` (atomar, einmalig), `wertLoeschen`, `schluesselListe(praefix)` und `gesundheit()`. Auswahl über `erzeugeStore()`/`sessionStore()`: mit `BACKOFFICE_REDIS_URL` Redis, sonst Speicher. In Produktion ohne Redis gibt es eine Warnung im Server-Log. Dazu kommt `storeArt()`. `get()` liefert jetzt eine Kopie, so wie Redis auch. |
| `auth/store-redis.js` (neu) | `RedisSessionStore` mit derselben Schnittstelle. Schlüssel: `s:<sid>` (JSON, Ablauf = Rest der 10 h), `s:<sid>:t` (lastSeen getrennt, damit `touch` keine `update` überschreibt), `g:<hash>` (12 h), `<ns>:<rest>`. Präfix `BACKOFFICE_REDIS_PREFIX`, Standard `ph-bo:`. GETDEL, auf Redis < 6.2 ersatzweise ein Lua-Skript. SCAN-Schleife. Bei Ausfall `BackofficeError("unavailable")`, also fail-closed. |
| `auth/store-schluessel.js` (neu) | Gemeinsame Schlüssel- und TTL-Regeln, damit kein Importkreis entsteht. |
| `auth/kurzsitzung.js` (neu) | **G-25**: `sitzungMitPin({benutzer, pin, geraetToken, zweck, ttl: 60, sitzung})`, `sitzungMitPasswort(…)` (Rückfall E4), `kurzsitzungEinloesen` (genau einmal, gebunden an Zweck und Arbeitsplatz-Sitzung), `mitKurzsitzung(token, {zweck, sitzung}, fn)` (meldet eine Frappe-sid danach ab, auch bei Fehler), `kurzsitzungVerwerfen`, `freigeben(…, fn)` (ein Schritt), `freigabeArt(zweck)` → `"pin"`/`"passwort"`, `personAlsSitzung(person)` für `backoffice(session)`, `freigabeProtokoll`. Zwecke: `kassa.freigabe`, `logistik.leitungsfreigabe`, `projekte.leitungsfreigabe` (Recht `cancel` im Bereich, Vier-Augen) und `personal.stempeln-fuer` (die Person bestätigt sich selbst). Das Token hat 32 Byte, im Store liegt nur sein SHA-256 (`k:`). Die Frist ist höchstens 300 s. Fehlversuche werden je Person und Arbeitsplatz begrenzt. |
| `auth/vorlieben.js` (neu) | `{theme: system/hell/dunkel, dichte: auto/kompakt/komfortabel, einzeltasten}` im Store unter `v:<user-hash>` (400 Tage), außerdem `vorliebenHtmlAttribute`, `vorliebenSkript` (schreibt die bestehenden localStorage-Schlüssel `ph_bo_dichte` und `ph-bo:einzeltasten`, neu `ph_bo_theme`, und setzt `<html>` vor dem ersten Paint), Cookies `ph_bo_theme`/`ph_bo_dichte`/`ph_bo_einzeltasten`. |
| `auth/vorlieben-aktion.js` (neu) | Server Actions `vorliebeSpeichernAction(patch)` und `vorliebenLadenAction()`. Beide prüfen die Sitzung selbst. Mock und Frappe nehmen denselben Weg über den Store. |
| `auth/dal.js` | Neu `getVorlieben()`, memoisiert je Request. Bei Store-Ausfall nimmt es die Cookies. Sonst unverändert. |
| `auth/texte.js` (neu) | Alle Texte der Kurzsitzung und der Vorlieben. |

**Für P0-3 (Commit-Register):** `planeCommit` → `sessionStore().wertSetzen("c:" + token, absicht, { ttlSekunden })`, `commitAction` → `wertNehmen("c:" + token)` (genau einmal), Sperre → `wertSetzenWennFrei`, Nachlauf → `schluesselListe("c:")`.
**Für P0-7 (Shell/Benutzermenü):** `getVorlieben()` im Layout/Shell, `vorliebenSkript(v)` in den `<head>`, Schalter rufen nach dem lokalen Umschalten `vorliebeSpeichernAction`. Ein Theme-Schalter für das echte Backoffice fehlt noch. Der Entwurf nutzt `lg-theme`, der Store nutzt `ph_bo_theme`.
**Für Kassa/Logistik/Projekte/Personal:** Der Freigabe-Schritt zeigt laut `freigabeArt()` das PIN- oder das Passwortfeld. Die Aktion läuft in `freigeben(…)`. `r.freigabe` geht ins Protokoll.

Keine UI-Bausteine, deshalb keine Demo und keine Screenshots. Die sichtbaren Teile (Freigabe-Schritt, Benutzermenü) bauen andere Teams im Lounge-Stil.

## B. Tests

| Prüfung | Ergebnis |
|---|---|
| `node --test "tests/unit/**/*.test.mjs"` | **130/130 grün** (vorher 106, neu 24) |
| neu `tests/unit/backoffice-auth-store.test.mjs` | 14/14: gleicher Vertrag für Speicher und Redis gegen einen RESP-Testserver über node:net, mit Ablauf, AUTH/SELECT, Lua-Rückfall, Ausfall fail-closed, Auswahl über Env |
| neu `tests/unit/backoffice-auth-kurzsitzung.test.mjs` | 10/10: PIN, Recht, Vier-Augen, Fehlversuchssperre, Einmaligkeit, Bindung an Zweck und Sitzung, Frist, Passwort-Rückfall samt Login-Arten-Schalter, Vorlieben mit Skript im Browser-Ersatz |
| ESLint `src/lib/backoffice/auth/` + neue Tests | 0 Befunde |
| E2E `backoffice.spec.js` | **nicht gelaufen**: Der Dev-Server antwortet auf jede Seite mit 500 „Module not found: ./ereignisse“ in `Shell/Glocke.js`. Das ist der laufende Shell-Umbau eines anderen Teams. Die Datei liegt inzwischen vor, aber Turbopack hat den Stand nicht neu aufgelöst. Ich habe den Server laut Auftrag nicht neu gestartet und auch nicht in fremde Dateien geschrieben. |

## C. Abweichungen / Befunde

- **Fehler in `auth/redis.js` behoben** (früherer Lauf): Nach einem Verbindungsfehler konnte das verspätete `close`-Ereignis der alten Verbindung die neue Verbindung abbrechen. Der nächste Befehl blieb dann für immer hängen. Jetzt gelten Ereignisse nur noch für die eigene Verbindung, und `bereit` wird auch bei `close` vor dem Verbinden abgelehnt.
- `MemorySessionStore.get()` liefert jetzt eine Kopie statt des lebenden Objekts, so wie Redis. Alle bestehenden Aufrufer (dal, Microsoft-Callback/-Abmelden, geraet) sind damit vereinbar, die Tests sind grün.
- Den Bedienerwechsel (Kassa) habe ich bewusst **nicht** in die Kurzsitzung gelegt. Er ist ein vollständiger Sitzungswechsel und läuft weiter über `bedienerWechselAction`/`anmeldenMitPin`.
- `personal.stempeln-fuer` verlangt kein Bereichsrecht: Jede Person mit PIN bestätigt sich selbst. Der Personal-Bereich prüft, ob es zu ihr einen Mitarbeiter-Datensatz gibt.
- Env-Namen `BACKOFFICE_REDIS_URL` und `BACKOFFICE_REDIS_PREFIX` sind nur in `STORE_ENV` (store.js) und im README eingetragen. `.env.example` gehört nicht zu meinem Schreibbereich, bitte trägt P0-9/L0 sie nach.
- Das Rate-Limit (`rateLimit.js`) gilt weiter nur je Prozess. Bei mehreren Instanzen sollte es auf die Store-Werte umziehen (siehe D).

## D. Offen

1. **ph_core P9 `sitzung_mit_pin`** (Kassa E4, Backend-Lücke): Bis dahin verlangt `freigabeArt()` im Frappe-Modus für Leitungsfreigaben das Passwort. Bei `BACKOFFICE_LOGIN_ARTEN=microsoft` (Produktions-Standard) ist das Passwort abgeschaltet. Leitungsfreigaben sind im Echtbetrieb dann nur per Bedienerwechsel möglich (Frage 90 Nr. 45). Sobald P9 da ist: Aufruf in `sitzungMitPin` ergänzen, `pinSitzung: true` setzen.
2. **Backend-Feld für Vorlieben** (Anfrage ph_core, z. B. JSON-Feld am User): Heute ist der Store die Quelle. Mit Redis gilt das geräteübergreifend, ohne Redis ist es nach einem Neustart weg (die Cookies bleiben als Rückfall).
3. **Redis im Betrieb** (RI-16, Frage 90 Nr. 44). Der Store ist bereit, er ist aber noch nie gegen einen echten Redis gelaufen, nur gegen den RESP-Testserver.
4. Rate-Limit auf den Store umstellen, wenn mehrere Instanzen laufen.
5. E2E-Lauf nachholen, sobald der Dev-Server wieder fehlerfrei lädt.

## E. Fähigkeiten-Stand

Keine neue Fähigkeit registriert. `freigabeArt()` entscheidet anhand des Modus und zeigt nie einen Knopf, der mit einem Fehler endet.

## F. Fragen

- Inhaber: 90 Nr. 44 (Redis), Nr. 45 (Freigabe ohne P9 bei Microsoft-Login), Nr. 46 (Vorlieben je Person oder je Gerät).
- Steuerberater: keine.
