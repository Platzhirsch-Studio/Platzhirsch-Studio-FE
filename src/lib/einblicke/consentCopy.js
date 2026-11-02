// src/lib/einblicke/consentCopy.js – Einwilligungstexte der Besucher-Einblicke
// (eigene Heatmap) für das Cookie-Banner, in vier Sprachen.
//
// Gleiche Texte wie src/messages/*.json → Cookies.einblicke (Quelle; Gleichstand
// prüft tests/unit/einblicke.test.mjs). Sie stehen NICHT in den Client-Messages
// (clientMessages.js SERVER_ONLY_SUBKEYS): Das Banner lädt dieses Modul als
// eigenen Chunk und nur, solange NEXT_PUBLIC_EINBLICKE die Funktion einschaltet
// (services.js EINBLICKE_ACTIVE) – sonst kostet es keine Seite ein Byte.
// Texte ändern: in src/messages ändern, dann hier gleich ziehen.
export const EINBLICKE_CONSENT_COPY = {
  "de": {
    "banner": "Mit Ihrer Einwilligung messen wir außerdem mit einer eigenen Heatmap, wo auf unseren Seiten geklickt und gescrollt wird – ohne Drittanbieter, ohne Aufzeichnung.",
    "bannerTextShort": "Karte (Google Maps), Statistik (Google Analytics) und eigene Heatmap nur mit Ihrer Einwilligung; Google-Daten teils in die USA.",
    "statistics": "Google Analytics: Wir zählen Besuche und sehen, welche Seiten gelesen werden. Besucher-Einblicke (eigene Heatmap): Wir sehen, wo geklickt, gescrollt und abgebrochen wird – auf unserem eigenen Server, ohne Drittanbieter, ohne Aufzeichnung und ohne IP-Adresse. Beide Dienste lassen sich unter „Details anzeigen“ einzeln wählen.",
    "description": "Eigene Heatmap: wo geklickt, gescrollt und abgebrochen wird. Kein Drittanbieter, keine Aufzeichnung, keine Eingaben.",
    "purpose": "Wir möchten verstehen, wie unsere Seiten genutzt werden, und sie verbessern. Erfasst werden nur: Klickposition und angeklicktes Element, Mausbewegung in einem groben 40-px-Raster (nur am Desktop), Scrolltiefe, Sichtzeit je Abschnitt, die Namen berührter Formularfelder (nie deren Inhalt, keine Tastatureingaben), Validierungs- und Programmfehler (nur der Typ), erreichte Ziele wie Termin oder Anfrage, Schritte in unseren Planern, der Herkunftskanal (z. B. „Organisch“), die Gerätegruppe und die Fensterbreite. Es gibt keine Sitzungsaufzeichnung, keine IP-Adresse, kein Fingerprinting und keine Weitergabe an Dritte. Eine zufällige Sitzungskennung liegt 30 Minuten im sessionStorage Ihres Browsers. Rohdaten löschen wir nach höchstens 14 Tagen; danach bleiben nur zusammengefasste Tageswerte (mindestens 5 Besuche je Seite) in unserem eigenen Backoffice. Do-Not-Track und Global Privacy Control werden beachtet.",
    "sessionStorage": "Session Storage",
    "minuteOne": "# Minute",
    "minuteOther": "# Minuten",
    "noThirdCountry": "keine – Verarbeitung nur auf unserem eigenen Server"
  },
  "en": {
    "banner": "With your consent we also use our own heatmap to see where people click and scroll on our pages – no third party, no recording.",
    "bannerTextShort": "Map (Google Maps), statistics (Google Analytics) and our own heatmap only with your consent; Google data partly goes to the USA.",
    "statistics": "Google Analytics: we count visits and see which pages are read. Visitor insights (own heatmap): we see where people click, scroll and drop off – on our own server, without third parties, without recording and without IP address. Both services can be chosen separately under “Show details”.",
    "description": "Our own heatmap: where people click, scroll and drop off. No third party, no recording, no input.",
    "purpose": "We want to understand how our pages are used and improve them. We only record: click position and clicked element, mouse movement in a coarse 40 px grid (desktop only), scroll depth, viewing time per section, the names of form fields you touched (never their content, no keystrokes), validation and script errors (type only), goals reached such as an appointment or enquiry, steps in our planners, the traffic channel (e.g. “Organic”), the device group and the window width. There is no session recording, no IP address, no fingerprinting and no disclosure to third parties. A random session ID stays in your browser's sessionStorage for 30 minutes. We delete raw data after 14 days at the latest; after that only summarised daily figures (at least 5 visits per page) remain in our own back office. Do Not Track and Global Privacy Control are respected.",
    "sessionStorage": "Session storage",
    "minuteOne": "# minute",
    "minuteOther": "# minutes",
    "noThirdCountry": "none – processed only on our own server"
  },
  "fr": {
    "banner": "Avec votre consentement, nous mesurons aussi avec notre propre carte de chaleur où l’on clique et fait défiler nos pages – sans tiers, sans enregistrement.",
    "bannerTextShort": "Carte (Google Maps), statistiques (Google Analytics) et carte de chaleur propre seulement avec votre accord ; données Google en partie aux États-Unis.",
    "statistics": "Google Analytics : nous comptons les visites et voyons quelles pages sont lues. Aperçu des visites (carte de chaleur propre) : nous voyons où l’on clique, fait défiler et abandonne – sur notre propre serveur, sans tiers, sans enregistrement et sans adresse IP. Les deux services peuvent être choisis séparément sous « Afficher les détails ».",
    "description": "Notre propre carte de chaleur : où l’on clique, fait défiler et abandonne. Sans tiers, sans enregistrement, sans saisies.",
    "purpose": "Nous voulons comprendre comment nos pages sont utilisées et les améliorer. Nous enregistrons seulement : la position du clic et l'élément cliqué, le mouvement de la souris dans une grille grossière de 40 px (ordinateur seulement), la profondeur de défilement, le temps de visibilité par section, les noms des champs de formulaire touchés (jamais leur contenu, aucune frappe), les erreurs de validation et de script (type seulement), les objectifs atteints comme un rendez-vous ou une demande, les étapes de nos planificateurs, le canal d'arrivée (p. ex. « Organique »), le type d'appareil et la largeur de la fenêtre. Pas d'enregistrement de session, pas d'adresse IP, pas d'empreinte numérique, aucune transmission à des tiers. Un identifiant de session aléatoire reste 30 minutes dans le sessionStorage de votre navigateur. Nous supprimons les données brutes au plus tard après 14 jours ; ensuite, seules des valeurs journalières agrégées (au moins 5 visites par page) restent dans notre propre back-office. Do Not Track et Global Privacy Control sont respectés.",
    "sessionStorage": "Stockage de session",
    "minuteOne": "# minute",
    "minuteOther": "# minutes",
    "noThirdCountry": "aucun – traitement seulement sur notre propre serveur"
  },
  "it": {
    "banner": "Con il vostro consenso misuriamo inoltre con una nostra mappa di calore dove si clicca e si scorre sulle nostre pagine – senza terzi, senza registrazione.",
    "bannerTextShort": "Mappa (Google Maps), statistiche (Google Analytics) e mappa di calore propria solo con il vostro consenso; dati Google in parte negli Stati Uniti.",
    "statistics": "Google Analytics: contiamo le visite e vediamo quali pagine vengono lette. Approfondimenti sulle visite (mappa di calore propria): vediamo dove si clicca, si scorre e si abbandona – sul nostro server, senza terzi, senza registrazione e senza indirizzo IP. I due servizi si possono scegliere separatamente in «Mostrate i dettagli».",
    "description": "La nostra mappa di calore: dove si clicca, si scorre e si abbandona. Nessun terzo, nessuna registrazione, nessun inserimento.",
    "purpose": "Vogliamo capire come vengono usate le nostre pagine e renderle più semplici da usare. Registriamo solo: posizione del clic ed elemento cliccato, movimento del mouse in una griglia grossolana di 40 px (solo desktop), profondità di scorrimento, tempo di visualizzazione per sezione, i nomi dei campi del modulo toccati (mai il contenuto, nessuna digitazione), errori di convalida e di script (solo il tipo), obiettivi raggiunti come un appuntamento o una richiesta, i passi nei nostri configuratori, il canale di provenienza (ad es. «Organico»), il tipo di dispositivo e la larghezza della finestra. Nessuna registrazione della sessione, nessun indirizzo IP, nessun fingerprinting e nessuna trasmissione a terzi. Un identificativo di sessione casuale resta 30 minuti nel sessionStorage del browser. Cancelliamo i dati grezzi al più tardi dopo 14 giorni; dopo restano solo valori giornalieri aggregati (almeno 5 visite per pagina) nel nostro back office. Do Not Track e Global Privacy Control vengono rispettati.",
    "sessionStorage": "Session storage",
    "minuteOne": "# minuto",
    "minuteOther": "# minuti",
    "noThirdCountry": "nessuno – trattamento solo sul nostro server"
  }
};

/** Texte für `locale` (de als Rückfall). */
export const einblickeCopy = (locale) => EINBLICKE_CONSENT_COPY[locale] || EINBLICKE_CONSENT_COPY.de;
