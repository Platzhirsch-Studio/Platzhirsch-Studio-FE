# WhatsApp-Beratung – Vorschlag für die Datenschutzerklärung

Stand 29.10.2026 · Inhaber-Entscheidung Nr. 15 · **Vorschlag für die Kanzlei, keine Rechtsberatung, nicht live.**
Grundlage: der gebaute Kanal (Website `src/lib/whatsapp/*`, `src/components/WhatsApp/*`; Frappe-Paket `platzhirsch-frappe-whatsapp`), Konzept `whatsapp-beratung.md` A3, Prüfberichte `qa-screenshots/whatsapp/qa-recht.md` und `qa-technik-ux.md`.

**Sperre:** Die Website zeigt im Produktions-Build keinen WhatsApp-Einstieg, solange nicht **beide** Variablen gesetzt sind: `WHATSAPP_NUMBER` und `WHATSAPP_PRIVACY_SECTION=1`. Den Schalter setzt der Inhaber erst, wenn die Kanzlei den Abschnitt unten freigegeben hat und er in `src/components/Datenschutz/datenschutz.js` live ist. Der Hinweis vor dem Wechsel verlinkt `/{locale}/datenschutz#whatsapp`.

---

## A. Was technisch passiert (Faktenblatt für die Kanzlei)

| Punkt | Umsetzung |
|---|---|
| Kanal | **WhatsApp Business Platform (Cloud API)**, keine Business-App, kein Firmenhandy. Nachrichten kommen per Webhook in das Backoffice (Frappe CRM) und werden dort von Mitarbeitenden mit eigenem Login beantwortet. |
| Website | Nur ein Link `https://wa.me/<nummer>?text=…`. Er steht erst im Hinweis, der sich nach einem Klick auf „Per WhatsApp schreiben“ öffnet. Kein Skript, Pixel oder Widget von Meta. QR-Code (Desktop) wird lokal im Browser erzeugt. Vor dem Klick auf „Weiter zu WhatsApp“ geht keine Anfrage an Meta. |
| Vorbelegter Text | Nur Seite, Produkt/Marke oder ein Teilen-Link, den der Kunde selbst erzeugt hat (Ideenboard, Ezarri-Mischung). Nie Name, E-Mail, Telefon, Merklisten-Inhalt, Portal-, Upload-, Zahlungs- oder Verwaltungslinks. Der Kunde kann den Text vor dem Senden ändern oder löschen. |
| Klickzählung | `contact_click` (Art: WhatsApp, Seite) nur mit Statistik-Einwilligung an Google Analytics, wie in der DSE unter „Google Analytics“ beschrieben. Die Besucher-Einblicke zählen denselben Klick nur als Ziel „kontakt“ und nur bei offenem Einblicke-Tor (Einwilligung, kein DNT/GPC; `src/lib/einblicke/event.js`). Keine Nachrichteninhalte. |
| Im Backoffice | Neuer Absender → **CRM Lead** (Quelle „WhatsApp“, Nummer, WhatsApp-Profilname, Notiz mit Produktpfad aus dem vorbelegten Text). Bekannte Nummer → Zuordnung zu Lead/Deal/Kontakt. Weiterleitung nach Thema (Schlüsselwörter, keine KI) an die zuständige Person. |
| Automatische Nachrichten | Begrüßung (im Laufe der Öffnungszeiten) bzw. Abwesenheit (außerhalb), feste Texte, freigegeben vom Inhaber, **beide mit Link zur Datenschutzerklärung**. Bestätigung der Abmeldung. Keine KI, keine automatisierte Entscheidung. |
| Spätere Nachrichten von uns | Nur Utility-Vorlagen (Termin, Lieferung, Winterlager, Pflege, Angebot) und nur, wenn für Nummer + Zweck eine **Kanalwahl** mit Wortlaut oder Beleg vorliegt. Marketing-Vorlagen nur mit eigener Einwilligung (Wortlaut, nicht vorangekreuzt, getrennt vom Newsletter) – zum Start nicht aktiv. |
| Abmeldung | „STOPP“ und 18 weitere Wörter/Sätze in DE/EN/FR/IT sperren die Nummer für Vorlagen und widerrufen alle Kanalwahlen. Unklare Fälle markiert das System zur Prüfung; das Team ist geschult (README 7.3). |
| Verschlüsselung | Transport zwischen Kunde und Cloud API verschlüsselt, ruhende Daten bei Meta verschlüsselt; **die Schlüssel auf Seiten der Cloud API verwaltet Meta**. Also **kein** „Ende-zu-Ende bis zu uns“. |
| Speicherung bei Meta | Nachrichten höchstens 30 Tage (Zustellung, Wiederholung). Speicherort laut Meta-Doku Rechenzentren außerhalb der EU; ob eine EU-Region („lokale Speicherung“) möglich ist, klärt der Entwickler vor der Registrierung der Nummer (README Frappe 4.5). |
| Löschfristen im Backoffice | Webhook-Protokolle 30 Tage (an). Gespräche ohne Auftrag und ohne Deal: Nachrichten, Anhänge, Kontaktzustand **und der über WhatsApp angelegte Lead** (ohne Deal, ohne E-Mail/Anruf) nach **[12] Monaten** ohne Kontakt – Schalter aus, bis die Kanzlei die Frist bestätigt. Mit Auftrag: wie Geschäftsbriefe. Kanalwahl-Nachweise **[3] Jahre** nach Widerruf bzw. letzter Nutzung – Schalter aus, bis bestätigt. |
| Kanalwahl-Nachweis | Nach dem Anlegen unveränderlich, nur der Widerruf ist möglich, Versionsverlauf an, Löschen nur durch System Manager bzw. Löschjob. |

**Rollen (Vorschlag):**
- **Platzhirsch** (MW Immobilienverwaltungs GmbH) ist Verantwortlicher für die Kommunikation über die Business-Nummer und die Ablage im Backoffice.
- **WhatsApp Ireland Limited** verarbeitet die Nachrichten für die Cloud API als **Auftragsverarbeiter** (WhatsApp Business Data Processing Terms, Art. 28 DSGVO). Unterauftragsverarbeiter: Meta Platforms, Inc. und WhatsApp LLC (USA) u. a. laut Liste von Meta.
- Für das WhatsApp-Konto des Kunden (Nummer, Profil, Metadaten, Nutzung der App) ist **WhatsApp eigener Verantwortlicher** nach den Bedingungen und der Datenschutzrichtlinie von WhatsApp.

---

## B. Abschnitt für die Datenschutzerklärung (Deutsch, gilt für alle vier Sprachfassungen)

Die freigegebene DSE ist auf allen vier Sprachseiten deutsch (`src/components/Datenschutz/datenschutz.js`, Kopfkommentar). Der Abschnitt gehört deshalb **einmal auf Deutsch** hinein, als `<h2 id="whatsapp">` direkt nach „Anfragen per Formular, E-Mail und Telefon“ (`id="anfragen"`). Übersetzungen EN/FR/IT stehen in Teil C, falls die Kanzlei lokalisierte Fassungen möchte.

Platzhalter in eckigen Klammern legt die Kanzlei fest.

> ### WhatsApp {#whatsapp}
>
> Sie können uns über WhatsApp schreiben. Wir nutzen dafür die WhatsApp Business Platform („Cloud API“) und beantworten Ihre Nachrichten in unserem Backoffice, nicht über private Handys.
>
> - **Anbieter und Rollen:** Den Dienst stellt die WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland, bereit. Für die Übermittlung und Zustellung unserer Nachrichten handelt WhatsApp in unserem Auftrag (Auftragsverarbeitung, Art. 28 DSGVO). Für Ihr eigenes WhatsApp-Konto, also Ihre Nummer, Ihr Profil und die Nutzung der App, ist WhatsApp selbst verantwortlich. Dafür gelten die Bedingungen und die Datenschutzrichtlinie von WhatsApp.
> - **Daten:** Ihre Telefonnummer, Ihr WhatsApp-Profilname, Ihre Nachrichten und was Sie mitschicken (etwa Fotos, Videos, Pläne, Sprachnachrichten oder Links), Zeitpunkte und der Zustellstatus. Schicken Sie uns Fotos Ihres Raums, gilt dafür dasselbe wie im Abschnitt „Fotos, Videos und Pläne zu Ihrer Anfrage“. Bitte senden Sie keine Aufnahmen von Personen ohne deren Einverständnis.
> - **Vorbereiteter Text:** Über die Website öffnet sich WhatsApp mit einem vorbereiteten Text, etwa dem Namen des Produkts und dem Link zur Seite. Teilen Sie uns so Ihr Ideenboard oder eine Ezarri-Mischung, enthält der Text den Link dazu; wer den Link kennt, kann das Board bzw. die Mischung ansehen. Sie können den Text vor dem Senden ändern oder löschen.
> - **Zweck und Rechtsgrundlage:** Wir nutzen Ihre Nachrichten, um Ihre Anfrage zu bearbeiten, und legen sie dazu in unserem Kundensystem ab: als Anfrage („Lead“) mit Ihrer Nummer und Ihrem Profilnamen, zugewiesen an die Person im Team, die für Ihr Thema zuständig ist (Art. 6 Abs. 1 lit. b DSGVO). Haben Sie gewählt, Termin-, Liefer- oder Service-Nachrichten per WhatsApp zu erhalten, senden wir sie auf dieser Grundlage. Werbung per WhatsApp, etwa Einladungen oder Neuheiten, senden wir nur mit Ihrer eigenen, ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021), getrennt vom Newsletter.
> - **Automatische Antworten:** Auf Ihre erste Nachricht antwortet das System mit einer festen Begrüßung oder, außerhalb der Öffnungszeiten, mit einer Abwesenheitsnachricht. Beide verweisen auf diese Erklärung. Danach antworten Menschen aus unserem Team. Wir setzen dabei keine künstliche Intelligenz ein und treffen keine automatisierten Entscheidungen.
> - **Abmelden und Widerruf:** Schreiben Sie „STOPP“ (oder sinngemäß, dass Sie keine Nachrichten mehr wünschen), senden wir Ihnen keine Termin-, Service- oder Werbenachrichten mehr; Ihre Einwilligungen gelten dann als widerrufen. Das geht auch per E-Mail an [info@platzhirsch.studio] oder telefonisch. Die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt. Auf Fragen, die Sie uns danach schreiben, antworten wir weiterhin.
> - **Übermittlung in Drittländer:** WhatsApp gibt Daten an die WhatsApp LLC und die Meta Platforms, Inc. in den USA weiter. Diese sind nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss der Europäischen Kommission, Durchführungsbeschluss (EU) 2023/1795, Art. 45 DSGVO); ergänzend gelten Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Für Personen in der Schweiz gilt das Swiss-U.S. Data Privacy Framework (Art. 16 revDSG).
> - **Speicherung bei WhatsApp und Verschlüsselung:** WhatsApp speichert Nachrichten für die Zustellung höchstens 30 Tage. Die Übertragung und die gespeicherten Daten sind verschlüsselt. Die Schlüssel auf Seiten der Business Platform verwaltet Meta; eine Ende-zu-Ende-Verschlüsselung bis in unser Backoffice besteht deshalb nicht. *[Nur wenn Meta eine EU-Region bestätigt: „Die Nachrichten werden bei WhatsApp in der EU gespeichert.“]*
> - **Speicherdauer bei uns:** Gespräche, aus denen kein Auftrag wird, löschen wir [12 Monate] nach dem letzten Kontakt, samt Fotos und der über WhatsApp angelegten Anfrage. Wird ein Auftrag daraus, bewahren wir die geschäftlich relevanten Nachrichten wie Geschäftsbriefe auf (in Österreich 7 Jahre, § 132 BAO, § 212 UGB). Technische Protokolle löschen wir nach 30 Tagen. Den Nachweis Ihrer Kanalwahl oder Einwilligung bewahren wir [3 Jahre] nach Widerruf bzw. letzter Nutzung auf, um ihn belegen zu können (Art. 6 Abs. 1 lit. c und f DSGVO).
> - **Statistik:** Den Klick auf „Weiter zu WhatsApp“ zählen wir nur mit Ihrer Statistik-Einwilligung, ohne Nachrichteninhalt (Abschnitt „Google Analytics“). Die Website lädt keine Inhalte von Meta, bevor Sie auf diesen Link klicken.
> - **Ohne WhatsApp:** Sie erreichen uns genauso per Telefon [+43 5574 46255], per E-Mail an [info@platzhirsch.studio] oder über das Kontaktformular.

**Umsetzung (nach Freigabe):** als JSX-Block in `datenschutz.js` mit `<h2 id="whatsapp">` und der Liste wie bei „Anfragen“ (`className={ul}`), Telefon und E-Mail über `PHONE_HREF`/`EMAIL_HREF` aus `src/lib/site.js`. Wenn die Frist von 12 Monaten bzw. 3 Jahren abweicht: dieselben Werte in Frappe (`gespraeche_monate`, `nachweise_jahre`) eintragen, `frist_bestaetigt_am` setzen, Schalter einschalten. Erst dann `WHATSAPP_PRIVACY_SECTION=1`.

**GA4-Abschnitt:** Dort steht bereits `contact_click` „Klick auf Telefon-, E-Mail- oder WhatsApp-Link“. Keine Änderung nötig.

---

## C. Übersetzungen (optional, falls die Kanzlei lokalisierte Fassungen möchte)

Gleicher Inhalt, gleiche Platzhalter. Rechtsbegriffe bitte von der Kanzlei prüfen.

### EN – WhatsApp

You can message us on WhatsApp. We use the WhatsApp Business Platform ("Cloud API") and answer your messages in our back office, not on private phones.

- **Provider and roles:** The service is provided by WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Ireland. For transmitting and delivering our messages, WhatsApp acts on our behalf (processor, Art. 28 GDPR). WhatsApp itself is responsible for your own WhatsApp account, i.e. your number, your profile and your use of the app, under WhatsApp's terms and privacy policy.
- **Data:** your phone number, your WhatsApp profile name, your messages and anything you attach (photos, videos, plans, voice messages, links), timestamps and delivery status.
- **Prepared text:** From the website, WhatsApp opens with a prepared text, such as the product name and the page link. If you share your idea board or an Ezarri mix this way, the text contains its link; anyone with the link can view it. You can change or delete the text before sending.
- **Purpose and legal basis:** We use your messages to handle your enquiry and store them in our customer system for this purpose, as an enquiry ("lead") with your number and profile name, assigned to the team member responsible for your topic (Art. 6(1)(b) GDPR). If you have chosen to receive appointment, delivery or service messages on WhatsApp, we send them on this basis. We only send advertising on WhatsApp with your separate, explicit consent (Art. 6(1)(a) GDPR, § 174 TKG 2021), separate from the newsletter.
- **Automatic replies:** Your first message receives a fixed welcome or, outside opening hours, an out-of-office message. Both refer to this policy. After that, people from our team reply. No artificial intelligence, no automated decisions.
- **Opting out:** Write "STOP" (or tell us in your own words that you no longer want messages) and we will no longer send you appointment, service or advertising messages; your consents are then withdrawn. You can also do this by e-mail or phone. We will still answer questions you send us.
- **Transfers:** WhatsApp shares data with WhatsApp LLC and Meta Platforms, Inc. in the USA, which are certified under the EU-US Data Privacy Framework (adequacy decision (EU) 2023/1795, Art. 45 GDPR), supplemented by standard contractual clauses; for Switzerland the Swiss-U.S. Data Privacy Framework applies.
- **Storage at WhatsApp and encryption:** WhatsApp stores messages for delivery for no more than 30 days. Transmission and stored data are encrypted; Meta manages the keys on the Business Platform side, so there is no end-to-end encryption all the way into our back office.
- **Retention with us:** conversations that do not lead to an order are deleted [12 months] after the last contact, including photos and the enquiry created from WhatsApp; order-related messages are kept like business letters (7 years in Austria). Technical logs: 30 days. Proof of your channel choice or consent: [3 years] after withdrawal or last use.
- **Statistics:** the click on "Continue to WhatsApp" is only counted with your statistics consent, without message content. The website loads nothing from Meta before you click that link.
- **Without WhatsApp:** phone, e-mail or the contact form.

### FR – WhatsApp

Vous pouvez nous écrire sur WhatsApp. Nous utilisons la WhatsApp Business Platform (« Cloud API ») et répondons depuis notre back-office, pas depuis des téléphones privés.

- **Prestataire et rôles :** WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irlande, transmet et distribue nos messages pour notre compte (sous-traitant, art. 28 RGPD). Pour votre propre compte WhatsApp (numéro, profil, utilisation de l'application), WhatsApp est responsable selon ses conditions et sa politique de confidentialité.
- **Données :** numéro, nom de profil WhatsApp, messages et pièces jointes (photos, vidéos, plans, messages vocaux, liens), horodatage, statut de distribution.
- **Texte préparé :** depuis le site, WhatsApp s'ouvre avec un texte préparé (nom du produit, lien de la page ; le cas échéant le lien de votre tableau d'idées ou de votre mélange Ezarri, visible par toute personne disposant du lien). Vous pouvez le modifier ou le supprimer avant l'envoi.
- **Finalité et base juridique :** nous utilisons votre message pour traiter votre demande et l'enregistrons à cette fin dans notre système clients (demande attribuée à la personne compétente ; art. 6, par. 1, point b RGPD). Messages de rendez-vous, de livraison ou de service uniquement si vous avez choisi WhatsApp ; publicité uniquement avec votre consentement exprès et distinct (art. 6, par. 1, point a RGPD, § 174 TKG 2021).
- **Réponses automatiques :** accueil ou message d'absence avec renvoi à la présente déclaration ; ensuite, des personnes de notre équipe répondent. Pas d'intelligence artificielle, pas de décision automatisée.
- **Désinscription :** « STOP » (ou toute formulation équivalente), aussi par e-mail ou téléphone.
- **Transferts :** WhatsApp LLC et Meta Platforms, Inc. (États-Unis), certifiées EU-US Data Privacy Framework (décision (UE) 2023/1795), clauses contractuelles types en complément ; Suisse : Swiss-U.S. Data Privacy Framework.
- **Conservation chez WhatsApp et chiffrement :** 30 jours au maximum ; données chiffrées, clés gérées par Meta côté Business Platform – pas de chiffrement de bout en bout jusqu'à notre back-office.
- **Conservation chez nous :** sans commande, suppression [12 mois] après le dernier contact ; avec commande, comme la correspondance commerciale (7 ans en Autriche) ; journaux techniques 30 jours ; preuves de consentement [3 ans].
- **Statistiques :** le clic sur « Continuer vers WhatsApp » n'est compté qu'avec votre consentement statistique. Rien n'est chargé depuis Meta avant ce clic.
- **Sans WhatsApp :** téléphone, e-mail ou formulaire.

### IT – WhatsApp

Potete scriverci su WhatsApp. Usiamo la WhatsApp Business Platform („Cloud API“) e rispondiamo dal nostro back office, non da telefoni privati.

- **Fornitore e ruoli:** WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irlanda, trasmette e recapita i nostri messaggi per nostro conto (responsabile del trattamento, art. 28 GDPR). Per il vostro account WhatsApp (numero, profilo, uso dell'app) WhatsApp è titolare autonomo secondo i propri termini e la propria informativa.
- **Dati:** numero, nome del profilo WhatsApp, messaggi e allegati (foto, video, piante, messaggi vocali, link), orari, stato di consegna.
- **Testo preparato:** dal sito WhatsApp si apre con un testo preparato (nome del prodotto, link alla pagina; se lo condividete, il link alla vostra bacheca di idee o al mix Ezarri, visibile a chi ha il link). Potete modificarlo o cancellarlo prima dell'invio.
- **Finalità e base giuridica:** usiamo il vostro messaggio per gestire la vostra richiesta e a questo scopo lo registriamo nel nostro sistema clienti (richiesta assegnata alla persona competente; art. 6, par. 1, lett. b GDPR). Messaggi su appuntamenti, consegne o servizi solo se avete scelto WhatsApp; pubblicità solo con consenso espresso e separato (art. 6, par. 1, lett. a GDPR, § 174 TKG 2021).
- **Risposte automatiche:** benvenuto o messaggio di assenza con rinvio alla presente informativa; poi rispondono persone del nostro team. Nessuna intelligenza artificiale, nessuna decisione automatizzata.
- **Disiscrizione:** „STOP“ (o una formulazione equivalente), anche per e-mail o telefono.
- **Trasferimenti:** WhatsApp LLC e Meta Platforms, Inc. (USA), certificate EU-US Data Privacy Framework (decisione (UE) 2023/1795), clausole contrattuali tipo a integrazione; Svizzera: Swiss-U.S. Data Privacy Framework.
- **Conservazione presso WhatsApp e cifratura:** al massimo 30 giorni; dati cifrati, chiavi gestite da Meta lato Business Platform – nessuna cifratura end-to-end fino al nostro back office.
- **Conservazione presso di noi:** senza ordine, cancellazione [12 mesi] dopo l'ultimo contatto; con ordine, come la corrispondenza commerciale (7 anni in Austria); log tecnici 30 giorni; prove del consenso [3 anni].
- **Statistiche:** il clic su „Continua su WhatsApp“ viene contato solo con il consenso statistico. Nulla viene caricato da Meta prima di quel clic.
- **Senza WhatsApp:** telefono, e-mail o modulo.

---

## D. Erste Ebene (Hinweis vor dem Wechsel) – zur Freigabe mit

Texte aus `src/messages/*.json`, Namespace `whatsapp` (DE):

- **Titel:** „Sie wechseln zu WhatsApp (Meta)“
- **Text:** „WhatsApp ist ein Dienst von Meta. Ihre Nachricht und Ihre Nummer laufen über Server von Meta, auch in den USA. Wir nutzen Ihre Nachricht, um Ihre Anfrage zu bearbeiten, und legen sie dazu in unserem Kundensystem ab. Für Ihr WhatsApp-Konto gelten die Bedingungen von WhatsApp.“
- „Der Text ist vorbereitet. Sie können ihn vor dem Senden ändern oder löschen.“
- Öffnungszeiten, Knopf „Weiter zu WhatsApp“, „Lieber ohne WhatsApp: Telefon · E-Mail · Formular“, „Mehr dazu in der Datenschutzerklärung“ → `/{locale}/datenschutz#whatsapp`.

Schnellantwort `/datenschutz` im Chat (DE): „Ihre Nachrichten nutzen wir, um Ihre Anfrage zu bearbeiten, und legen sie dazu in unserem Kundensystem ab. Termin- oder Lieferinfos schicken wir hier nur, wenn Sie das gewählt haben. WhatsApp gehört zu Meta, das die Nachrichten für uns überträgt, auch über Server in den USA. Details: platzhirsch.studio/datenschutz. …“

Begrüßung und Abwesenheit (Frappe `standard.json`) enden beide mit „Hinweise zum Datenschutz: platzhirsch.studio/datenschutz“ (EN: „Privacy information: platzhirsch.studio/en/datenschutz“). Das Einstellungsformular lässt die Freigabe der Texte ohne diesen Link nicht zu.

---

## E. Eintrag ins Verarbeitungsverzeichnis (Art. 30 DSGVO) – Vorlage

| Feld | Inhalt |
|---|---|
| Bezeichnung | WhatsApp-Beratung (Kundenkommunikation über die WhatsApp Business Platform) |
| Verantwortlicher | MW Immobilienverwaltungs GmbH (Platzhirsch Home Living), Landstraße 11, 6911 Lochau |
| Zwecke | Bearbeitung von Anfragen; Termin-, Liefer- und Servicenachrichten nach Kanalwahl; Werbung nur nach Einwilligung (zum Start nicht aktiv) |
| Betroffene | Interessenten und Kunden, die über WhatsApp schreiben |
| Datenkategorien | Telefonnummer, WhatsApp-Profilname, Nachrichteninhalte, Medien, Zeitpunkte, Zustellstatus, Thema/Zuständigkeit, Kanalwahl- und Einwilligungsnachweise |
| Rechtsgrundlagen | Art. 6 Abs. 1 lit. b (Anfrage, Utility); lit. a + § 174 TKG 2021 (Marketing); lit. c/f (Nachweise) |
| Empfänger | Mitarbeitende mit Frappe-Login (rollenbasiert); Auftragsverarbeiter **WhatsApp Ireland Ltd.** (WhatsApp Business Data Processing Terms, angenommen am [Datum] im Konto [Business-Portfolio-ID]); Unterauftragsverarbeiter Meta Platforms, Inc., WhatsApp LLC u. a. laut Liste von Meta |
| Drittland | USA – EU-US DPF, ergänzend SCC (Business Data Transfer Addendum, angenommen am [Datum]); CH: Swiss-U.S. DPF |
| Löschfristen | Meta ≤ 30 Tage; Webhook-Protokolle 30 Tage; Gespräche + Lead ohne Auftrag [12] Monate nach letztem Kontakt; mit Auftrag 7 Jahre (§ 132 BAO, § 212 UGB); Kanalwahl-Nachweise [3] Jahre nach Widerruf/letzter Nutzung |
| TOM (Art. 32) | Webhook-Signatur HMAC-SHA256 (falsch → 403), Rate-Limit, Secret nur in `site_config.json`, Zugriff nur über Frappe-Login mit Rollen, keine privaten Geräte, Versionsverlauf der Nachweise, Testmodus, automatische Texte erst nach Freigabe, tägliche Löschjobs |

Datum und Konto der Vertragsannahme liefert der Frappe-Entwickler (README Frappe 4, Schritt 9).

---

## F. Entwurf 5.9 in `LegalDrafts` ist überholt

`src/components/LegalDrafts/docs/datenschutz.js`, Abschnitt `id: "whatsapp"` (5.9), beschreibt die **Business-App**: „eigenes Geschäftsgerät, ohne Adressbuchabgleich“, „Inhalte sind Ende-zu-Ende-verschlüsselt“, WhatsApp nur als eigener Verantwortlicher. Das passt **nicht** zum gebauten Kanal (Cloud API, Meta als Auftragsverarbeiter, Ablage in Frappe CRM, Vorlagen mit Kanalwahl, Löschjobs). Dieser Entwurf darf nicht übernommen werden. Maßgeblich ist Teil B dieses Vorschlags. Der Code des Entwurfs bleibt unverändert, weil die Rechtstexte freigegeben sind und dort nur die Kanzlei ändert. Bei der Übernahme von Teil B den Block 5.9 im Entwurf durch Teil B ersetzen oder löschen.

---

## G. Offene Punkte für die Kanzlei

1. **Rollenmodell** bestätigen (Auftragsverarbeitung für die Cloud API, eigener Verantwortlicher für das Konto des Kunden).
2. **Fristen:** Gespräche ohne Auftrag [12 Monate]; Kanalwahl-Nachweise [3 Jahre]; ob für WhatsApp-Geschäftskorrespondenz § 212 UGB (7 Jahre) passt.
3. **Speicherort bei Meta:** Satz zur EU-Region nur, wenn Meta sie bestätigt.
4. **Ideenboard-/Mischungslink** im vorbereiteten Text: Hinweis wie in Teil B ausreichend?
5. **Sprachfassungen:** Die DSE ist auf allen Sprachseiten deutsch. Reicht der deutsche Abschnitt, oder sollen EN/FR/IT (Teil C) ergänzt werden? Vorlagen im Chat gibt es nur auf DE/EN; Kunden mit FR/IT erhalten EN.
6. **Impressum im WhatsApp-Profil:** Links auf `/impressum` und `/datenschutz` im Unternehmensprofil (README Frappe 4, Schritt 8). Reicht das für § 5 ECG, § 25 MedienG und Art. 3 Abs. 1 lit. s UWG (CH)?
7. **Utility-Kanalwahl ohne Website-Haken:** Bis die Checkbox kommt, tragen Mitarbeitende Kanalwahlen mit Wortlaut oder Beleg ein (Pflichtfeld). Reicht ein dokumentiertes Telefonat als Nachweis?
