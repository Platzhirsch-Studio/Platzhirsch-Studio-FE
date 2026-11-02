// src/lib/architekten/copy-intl.js – FR- und IT-Fassung der Seite /<locale>/architekten.
//
// Sprachen-Ausbau 01.11.2026 (Gruppe schweiz-service): FR für Romandie und
// Frankreich, IT für Tessin und Italien. Übersetzt aus der deutschen Fassung
// (./copy.js, Mastertext), gegengelesen mit der englischen. Dieselben Regeln:
// keine Preise, Referenzen, Superlative oder Antwortfristen; Händler-Aussage
// nur über dealerStatement() in der Seite (dealerBrand: "ezarri").
// Begriffe wie auf Hotel & Objekt: FR maquette, rendu, appartement témoin;
// IT modello, rendering, appartamento campione; IT in der Höflichkeitsform „voi“.
// Backoffice-Zeilen (FORM.lines) in der Sprache der Seite wie bei EN.
// QUICK = Texte der zweistufigen Anfrage (sonst ../../components/Architekten/quickLead.js),
// hier serverseitig, damit sie nur als Prop in den Client gehen.
// Französische Typografie setzt frenchTypography() (Hotel-Modul) beim Laden.
//
// Reines Modul (keine "@/..."-Importe, kein React): node --test lädt es.
import { frenchTypography } from "../hotel/content-intl.js";

const FR = {
  META: {
    title: "Architectes et promoteurs | Platzhirsch Home Living",
    description:
      "Données des fabricants, échantillons, appartement témoin et home staging : Platzhirsch à Lochau travaille avec architectes et promoteurs.",
  },
  CRUMBS: [{ label: "Accueil", href: "/" }, { label: "Architectes et promoteurs" }],
  HERO: {
    overline: "Pour bureaux d’architecture, promoteurs et agents immobiliers",
    title: "Votre projet. Notre aménagement.",
    lead: "Nous planifions mobilier, cuisine, lumière et extérieurs pour vos projets, obtenons les données de planification des fabricants et envoyons des échantillons. Un interlocuteur de notre équipe accompagne votre projet du premier plan jusqu’au montage.",
    cta: "Présenter un projet",
    ctaNote: "Prix de projet sur demande",
    staging: "Home staging et appartement témoin",
  },
  ANGEBOT: {
    overline: "Ce que nous vous apportons",
    title: "Quatre choses qui facilitent votre planification",
    items: [
      { id: "daten", title: "Données de planification via le fabricant", text: "Nous demandons au fabricant les plans CAO, objets BIM, fiches techniques et conseils d’entretien, dans la mesure où il les fournit, et vous les transmettons regroupés." },
      { id: "muster", title: "Échantillons de matériaux et échantillons Ezarri", text: "Tissu, cuir, bois, pierre et finitions en échantillons pour votre choix de matériaux, ainsi que des échantillons de mosaïque de verre Ezarri.", dealerBrand: "ezarri" },
      { id: "preise", title: "Prix de projet sur demande", text: "Pour les projets comportant plusieurs unités, nous établissons une offre spécifique. Nous indiquons les prix une fois les quantités et l’exécution arrêtées." },
      { id: "person", title: "Un interlocuteur pour votre projet", text: "Une personne de notre équipe connaît votre projet et reste joignable pour les questions, rendez-vous et échantillons." },
    ],
    contactRole: "Interlocuteur pour bureaux d’architecture et promoteurs",
    contactFallback: "Notre première réponse vous indique qui suivra votre projet.",
    contactMail: "E-mail à {name}",
  },
  ABLAUF: {
    overline: "Collaboration",
    title: "Du croquis à la main à l’appel d’offres",
    lead: "Harald Menghin dessine aménagements et concepts à la main. Le croquis est la langue commune entre votre bureau, le maître d’ouvrage et nous. Ensuite seulement, nous planifions en 3D.",
    steps: [
      { title: "Entretien et plans", text: "Vous nous envoyez plans, coupes et votre idée. Nous en parlons au showroom de Lochau, en visioconférence ou sur le chantier." },
      { title: "Croquis à la main", text: "Harald esquisse à la main l’ameublement, les axes de vue et les ambiances, directement sur vos plans. Cela permet de se coordonner tôt et rapidement." },
      { title: "Maquette", text: "Si le projet le demande, il construit une maquette à l’échelle que l’on peut toucher et réagencer ensemble." },
      { title: "Planification 3D et rendu", text: "Nous planifions avec des cotes, produits et matériaux exacts et réalisons des rendus photoréalistes, pour votre présentation ou la commercialisation." },
      { title: "Appel d’offres", text: "Nous fournissons des listes de produits avec dimensions, matériaux et données des fabricants comme base pour votre descriptif." },
      { title: "Livraison et montage", text: "Livraison, montage sur demande et coordination avec les autres corps de métier sur le chantier. La direction des travaux reste de votre ressort." },
    ],
    processLink: "Notre méthode de travail en détail",
  },
  BAUTRAEGER: {
    overline: "Pour les promoteurs",
    title: "Appartement témoin et lignes d’équipement",
    lead: "Un appartement aménagé montre aux acheteurs comment habiter le plan. Pour les acheteurs eux-mêmes, nous concevons des lignes d’équipement parmi lesquelles ils peuvent choisir.",
    items: [
      { title: "Appartement témoin", text: "Nous concevons et aménageons un appartement témoin adapté au public visé, au plan et à la lumière du projet." },
      { title: "Lignes d’équipement", text: "Deux ou trois lignes coordonnées pour la cuisine, le séjour et la chambre, que les acheteurs peuvent commander avec leur logement." },
      { title: "Conseil à l’emménagement", text: "Les acheteurs obtiennent un rendez-vous au showroom et une planification pour leur logement, sur demande avec cuisine et extérieur." },
    ],
  },
  STAGING: {
    overline: "Pour promoteurs et agents immobiliers",
    title: "Home staging et appartements témoins",
    lead: "Nous aménageons pour une durée déterminée un appartement témoin ou un bien à vendre, puis le vidons à la fin de la phase de vente.",
    steps: [
      { title: "Planification avec croquis", text: "Harald esquisse l’aménagement selon le plan, la lumière et le profil des acheteurs. Vous voyez la proposition avant toute livraison." },
      { title: "Livraison et installation", text: "Nous livrons, installons et finalisons les pièces jusqu’aux photos et aux visites." },
      { title: "Phase de vente", text: "L’aménagement reste en place pour la durée convenue. Nous sommes joignables si quelque chose doit être ajusté." },
      { title: "Démontage", text: "Après la phase de vente, nous démontons et reprenons le mobilier." },
    ],
    buyer: { title: "Pour les acheteurs", text: "Les acheteurs peuvent reprendre le mobilier ou repenser le logement avec nous. Nous convenons de ces deux options avec vous avant de les leur proposer." },
    note: "Durée, étendue et coûts sont convenus pour chaque bien.",
    cta: "Demander un home staging",
  },
  MUSTER: {
    overline: "Demande d’échantillons",
    title: "Composer vos échantillons",
    lead: "Choisissez les échantillons dont vous avez besoin. La liste nous parvient avec votre demande. Sans prix, sans compte client.",
    groups: [
      { id: "stoff", label: "Échantillons de tissus d’ameublement" },
      { id: "leder", label: "Échantillons de cuir" },
      { id: "holz", label: "Bois et placage" },
      { id: "stein", label: "Pierre et céramique pour plans de travail" },
      { id: "oberflaeche", label: "Métal et surfaces laquées" },
      { id: "outdoor", label: "Tissus et matériaux d’extérieur" },
      { id: "ezarri", label: "Mosaïque de verre Ezarri" },
    ],
    ezarriLink: "Échantillons Ezarri avec choix des couleurs (en allemand)",
    merkliste: "Joindre les pièces de ma liste de souhaits ({count})",
    count: "{count} échantillons choisis",
    none: "Aucun échantillon choisi pour l’instant",
    clear: "Vider la liste",
  },
  FORM: {
    overline: "Demande",
    title: "Parlez-nous de votre projet",
    lead: "Plus nous en savons sur la phase et vos besoins, plus notre première réponse sera précise.",
    anliegen: {
      legend: "De quoi s’agit-il ?",
      options: {
        architekt: "Planification pour un projet de mon bureau",
        bautraeger: "Appartement témoin ou ligne d’équipement",
        staging: "Home staging temporaire",
        muster: "Uniquement échantillons ou données de planification",
      },
    },
    buero: "Bureau ou entreprise",
    projektart: { label: "Type de projet", options: ["Maison individuelle", "Ensemble résidentiel", "Hôtel ou restaurant", "Bureau ou cabinet", "Chalet ou appartement de vacances", "Autre"] },
    phase: { label: "Phase du projet", options: ["Avant-projet", "Projet et demande de permis", "Plans d’exécution", "Appel d’offres", "Chantier en cours", "Achèvement et vente"] },
    bedarf: { label: "De quoi avez-vous besoin ?", hint: "Par exemple l’ameublement de 12 logements, des cuisines, des données de planification pour certains produits, un rendez-vous." },
    choose: "Veuillez choisir",
    vorname: "Prénom",
    nachname: "Nom",
    email: "E-mail",
    telefon: "Téléphone",
    optional: "facultatif",
    submit: "Envoyer la demande",
    sending: "Envoi en cours…",
    errors: {
      required: "Veuillez remplir ce champ.",
      choose: "Veuillez choisir une option.",
      email: "Veuillez indiquer une adresse e-mail valide.",
      phone: "Veuillez vérifier le numéro de téléphone.",
      bedarf: "Veuillez décrire votre besoin en 10 caractères au moins.",
      summary: "Veuillez vérifier {count} indications.",
    },
    success: { title: "Merci, nous avons bien reçu votre demande.", text: "Nous revenons vers vous en vous indiquant votre interlocuteur et les prochaines étapes." },
    lines: {
      kontext: "Demande via la page pour architectes et promoteurs",
      buero: "Bureau",
      phase: "Phase du projet",
      muster: "Échantillons souhaités",
      merkliste: "De la liste de souhaits",
      bedarf: "Besoin",
    },
  },
  FAQ: {
    overline: "Questions",
    title: "Questions fréquentes des bureaux d’architecture",
    items: [
      { q: "Obtenons-nous des données CAO et BIM ?", a: "Nous demandons les données au fabricant. Ce qui existe dépend du fabricant et du produit. Nous vous disons franchement lorsqu’il n’existe pas de données pour un produit." },
      { q: "Combien coûtent les échantillons ?", a: "Cela dépend du fabricant et de la quantité. Nous vous l’indiquons avant l’envoi. Les échantillons Ezarri se commandent via notre demande d’échantillons Ezarri." },
      { q: "Qui facture, qui dirige le chantier ?", a: "Nous facturons nos propres livraisons et prestations. La direction des travaux et les prestations des autres corps de métier restent de votre ressort ou de celui du maître d’ouvrage." },
      { q: "Travaillez-vous aussi en Suisse, en Allemagne et au Liechtenstein ?", a: "Oui, nous planifions depuis Lochau pour des projets au Vorarlberg et dans les pays voisins. Livraison et montage sont convenus pour chaque projet." },
    ],
  },
  QUICK: {
    name: "Prénom et nom",
    vorhaben: "Votre projet en une phrase",
    details: "Compléter les détails",
    detailsHint: "Facultatif : objet de la demande, type de projet, phase et téléphone nous aident à préparer notre première réponse.",
    notGiven: "non précisé",
    errors: { nameBoth: "Veuillez indiquer prénom et nom, par exemple Anne Dupont." },
  },
};

const IT = {
  META: {
    title: "Per architetti e costruttori | Platzhirsch Home Living",
    description:
      "Dati di progetto dai produttori, campioni, appartamento campione e home staging: Platzhirsch a Lochau lavora con studi di architettura e costruttori.",
  },
  CRUMBS: [{ label: "Home", href: "/" }, { label: "Architetti e costruttori" }],
  HERO: {
    overline: "Per studi di progettazione, costruttori e agenti immobiliari",
    title: "Il vostro progetto. Il nostro arredo.",
    lead: "Progettiamo mobili, cucina, luce e outdoor per i vostri progetti, procuriamo i dati di progetto dei produttori e inviamo campioni. Una persona di riferimento del nostro team segue il vostro progetto dalla prima pianta al montaggio.",
    cta: "Presentate il progetto",
    ctaNote: "Prezzi di progetto su richiesta",
    staging: "Home staging e appartamento campione",
  },
  ANGEBOT: {
    overline: "Che cosa ricevete da noi",
    title: "Quattro cose che semplificano la vostra progettazione",
    items: [
      { id: "daten", title: "Dati di progetto tramite il produttore", text: "Richiediamo al produttore disegni CAD, oggetti BIM, schede tecniche e indicazioni per la cura, se li mette a disposizione, e ve li trasmettiamo tutti insieme." },
      { id: "muster", title: "Campioni di materiali e campioni Ezarri", text: "Tessuto, pelle, legno, pietra e superfici come campioni per la vostra campionatura, insieme ai campioni di mosaico in vetro Ezarri.", dealerBrand: "ezarri" },
      { id: "preise", title: "Prezzi di progetto su richiesta", text: "Per progetti con più unità prepariamo un’offerta dedicata. Indichiamo i prezzi solo quando quantità ed esecuzione sono definite." },
      { id: "person", title: "Una persona di riferimento per il vostro progetto", text: "Una persona del nostro team conosce il vostro progetto ed è raggiungibile per domande, appuntamenti e campioni." },
    ],
    contactRole: "Referente per studi di progettazione e costruttori",
    contactFallback: "Con la nostra prima risposta saprete chi segue il vostro progetto.",
    contactMail: "E-mail a {name}",
  },
  ABLAUF: {
    overline: "Collaborazione",
    title: "Dallo schizzo a mano al capitolato",
    lead: "Harald Menghin disegna arredi e concept a mano. Lo schizzo è il linguaggio comune tra il vostro studio, la committenza e noi. Solo dopo progettiamo in 3D.",
    steps: [
      { title: "Colloquio e piante", text: "Ci inviate piante, sezioni e la vostra idea. Ne parliamo nello showroom di Lochau, in videochiamata o in cantiere." },
      { title: "Schizzo a mano", text: "Harald schizza a mano arredo, assi visivi e atmosfere, direttamente sulle vostre piante. Così ci si coordina fin dall’inizio, in modo rapido." },
      { title: "Modello", text: "Se il progetto lo richiede, costruisce un modello in scala che si può toccare e riorganizzare insieme." },
      { title: "Progetto 3D e rendering", text: "Progettiamo con misure, prodotti e materiali esatti e realizziamo rendering fotorealistici, per la vostra presentazione o per la vendita." },
      { title: "Capitolato", text: "Forniamo elenchi di prodotti con misure, materiali e dati dei produttori come base per il vostro computo metrico." },
      { title: "Consegna e montaggio", text: "Consegna, montaggio su richiesta e coordinamento con le altre imprese in cantiere. La direzione lavori resta di vostra competenza." },
    ],
    processLink: "Il nostro modo di lavorare nel dettaglio",
  },
  BAUTRAEGER: {
    overline: "Per i costruttori",
    title: "Appartamento campione e linee di finitura",
    lead: "Un appartamento arredato mostra agli acquirenti come si può vivere la pianta. Per gli acquirenti stessi progettiamo linee di finitura tra cui scegliere.",
    items: [
      { title: "Appartamento campione", text: "Progettiamo e arrediamo un appartamento campione, calibrato su target, pianta e luce del progetto." },
      { title: "Linee di finitura", text: "Due o tre linee coordinate per cucina, zona giorno e zona notte, che gli acquirenti possono ordinare insieme all’appartamento." },
      { title: "Consulenza al primo ingresso", text: "Gli acquirenti ricevono un appuntamento in showroom e un progetto per il loro appartamento, su richiesta con cucina e outdoor." },
    ],
  },
  STAGING: {
    overline: "Per costruttori e agenti immobiliari",
    title: "Home staging e appartamenti campione",
    lead: "Arrediamo per un periodo definito un appartamento campione o un immobile in vendita e lo liberiamo al termine della fase di vendita.",
    steps: [
      { title: "Progetto con schizzo", text: "Harald schizza l’arredo in base a pianta, luce e target di acquirenti. Vedete la proposta prima di qualsiasi consegna." },
      { title: "Consegna e allestimento", text: "Consegniamo, montiamo e completiamo gli ambienti fino alle fotografie e alle visite." },
      { title: "Fase di vendita", text: "L’arredo resta per il periodo concordato. Siamo raggiungibili se qualcosa va sistemato." },
      { title: "Smontaggio", text: "Al termine della fase di vendita smontiamo e ritiriamo i mobili." },
    ],
    buyer: { title: "Per gli acquirenti", text: "Gli acquirenti possono rilevare i mobili o riprogettare l’appartamento con noi. Concordiamo entrambe le cose con voi prima di proporle agli acquirenti." },
    note: "Durata, entità e costi si concordano per ogni immobile.",
    cta: "Richiedete un home staging",
  },
  MUSTER: {
    overline: "Richiesta campioni",
    title: "Componete i vostri campioni",
    lead: "Scegliete i campioni che vi servono. L’elenco ci arriva con la vostra richiesta. Senza prezzi, senza account cliente.",
    groups: [
      { id: "stoff", label: "Campioni di tessuto per imbottiti" },
      { id: "leder", label: "Campioni di pelle" },
      { id: "holz", label: "Legno e impiallacciatura" },
      { id: "stein", label: "Pietra e ceramica per piani di lavoro" },
      { id: "oberflaeche", label: "Metallo e superfici laccate" },
      { id: "outdoor", label: "Tessuti e materiali outdoor" },
      { id: "ezarri", label: "Mosaico in vetro Ezarri" },
    ],
    ezarriLink: "Campioni Ezarri con scelta del colore (in tedesco)",
    merkliste: "Allegare i pezzi della mia lista dei desideri ({count})",
    count: "{count} campioni scelti",
    none: "Nessun campione ancora scelto",
    clear: "Svuotate l’elenco",
  },
  FORM: {
    overline: "Richiesta",
    title: "Raccontateci il vostro progetto",
    lead: "Più sappiamo su fase ed esigenze, più precisa sarà la nostra prima risposta.",
    anliegen: {
      legend: "Di che cosa si tratta?",
      options: {
        architekt: "Progettazione per un progetto del mio studio",
        bautraeger: "Appartamento campione o linea di finitura",
        staging: "Home staging temporaneo",
        muster: "Solo campioni o dati di progetto",
      },
    },
    buero: "Studio o azienda",
    projektart: { label: "Tipo di progetto", options: ["Casa unifamiliare", "Complesso residenziale", "Hotel o ristorante", "Ufficio o studio professionale", "Chalet o appartamento per vacanze", "Altro"] },
    phase: { label: "Fase del progetto", options: ["Progetto preliminare", "Progetto e domanda di costruzione", "Progetto esecutivo", "Capitolato e gara", "Cantiere in corso", "Completamento e vendita"] },
    bedarf: { label: "Di che cosa avete bisogno?", hint: "Per esempio l’arredo di 12 appartamenti, cucine, dati di progetto per determinati prodotti, un appuntamento." },
    choose: "Scegliete",
    vorname: "Nome",
    nachname: "Cognome",
    email: "E-mail",
    telefon: "Telefono",
    optional: "facoltativo",
    submit: "Inviate la richiesta",
    sending: "Invio in corso…",
    errors: {
      required: "Compilate questo campo.",
      choose: "Scegliete un’opzione.",
      email: "Indicate un indirizzo e-mail valido.",
      phone: "Controllate il numero di telefono.",
      bedarf: "Descrivete la vostra esigenza in almeno 10 caratteri.",
      summary: "Controllate {count} indicazioni.",
    },
    success: { title: "Grazie, abbiamo ricevuto la vostra richiesta.", text: "Vi ricontatteremo indicandovi la vostra persona di riferimento e i prossimi passi." },
    lines: {
      kontext: "Richiesta dalla pagina per architetti e costruttori",
      buero: "Studio",
      phase: "Fase del progetto",
      muster: "Campioni richiesti",
      merkliste: "Dalla lista dei desideri",
      bedarf: "Esigenza",
    },
  },
  FAQ: {
    overline: "Domande",
    title: "Domande frequenti dagli studi di progettazione",
    items: [
      { q: "Riceviamo dati CAD e BIM?", a: "Richiediamo i dati al produttore. Che cosa esiste dipende dal produttore e dal prodotto. Vi diciamo apertamente se per un prodotto non ci sono dati." },
      { q: "Quanto costano i campioni?", a: "Dipende dal produttore e dalla quantità. Ve lo diciamo prima della spedizione. I campioni Ezarri si ordinano tramite la nostra richiesta campioni Ezarri." },
      { q: "Chi fattura, chi dirige il cantiere?", a: "Fatturiamo le nostre forniture e prestazioni. La direzione lavori e le prestazioni delle altre imprese restano di competenza vostra o della committenza." },
      { q: "Lavorate anche in Svizzera, Germania e Liechtenstein?", a: "Sì, progettiamo da Lochau per progetti in Vorarlberg e nei Paesi vicini. Consegna e montaggio si concordano per ogni progetto." },
    ],
  },
  QUICK: {
    name: "Nome e cognome",
    vorhaben: "Il vostro progetto in una frase",
    details: "Aggiungete dettagli",
    detailsHint: "Facoltativo: tipo di richiesta, tipo di progetto, fase e telefono ci aiutano a preparare la prima risposta.",
    notGiven: "non indicato",
    errors: { nameBoth: "Indicate nome e cognome, per esempio Anna Rossi." },
  },
};

/** FR- und IT-Texte der Seite (FR mit französischer Typografie). */
export const ARCHITEKTEN_INTL = Object.freeze({ fr: frenchTypography(FR), it: IT });
