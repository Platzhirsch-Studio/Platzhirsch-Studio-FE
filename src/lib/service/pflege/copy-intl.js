// src/lib/service/pflege/copy-intl.js – FR- und IT-Fassung der Seite /[locale]/pflege-service.
//
// Sprachen-Ausbau 01.11.2026 (Gruppe schweiz-service): FR für Romandie und
// Frankreich, IT für Tessin und Italien. Übersetzt aus der deutschen Fassung
// (./copy.js und ./materials.js, Mastertext), gegengelesen mit der englischen.
// Wie EN: kein Foto-Upload nach dem Absenden (lazyHandoff nur DE) → Fotos als
// Antwort auf unsere E-Mail; Ratgeber und Kundenportal sind deutsch (Hinweis
// im Linktext). Dieselben Regeln wie dort: keine Preise, keine Superlative,
// kein Ausrufezeichen, keine Garantie-Zusage für Herstellergarantien.
// Backoffice-Klartext (FORM.backoffice) bleibt DEUTSCH.
//
// Nur serverseitig laden (page.js, PflegePage.js, schema.js): der Client
// (PflegeAnfrage) bekommt nur FORM als Prop, damit FR/IT nicht im Bundle landen.
// Französische Typografie setzt frenchTypography() (Hotel-Modul) beim Laden.
// Keine "@/..."-Importe: node --test lädt die Datei direkt.
import { frenchTypography } from "../../hotel/content-intl.js";
import { pflegeCopy } from "./copy.js";
import { materialCopy } from "./materials.js";

const BACKOFFICE = { thema: "Pflege-Service", context: "Pflege-Service (pflege)" };

const FR = {
  locale: "fr",
  META: {
    title: "Service d’entretien pour cuir, tissu et bois",
    description:
      "Entretien chez vous du mobilier design en cuir, tissu, bois et marbre, selon la notice du fabricant si elle existe. Ponctuel ou abonnement annuel.",
  },
  CRUMBS: [{ label: "Accueil", href: "/" }, { label: "Service d’entretien" }],
  HERO: {
    eyebrow: "Service d’entretien",
    title: "Entretien du cuir, du tissu et du bois.",
    lead: "Nous venons chez vous et entretenons vos meubles selon leur matériau et, lorsqu’elle existe, selon la notice d’entretien du fabricant. Ponctuellement ou une fois par an en abonnement.",
    primary: "Demander un rendez-vous d’entretien",
    secondary: "Lire le guide d’entretien (en allemand)",
  },
  MATERIAL_SECTION: {
    eyebrow: "Ce que nous entretenons",
    title: "Prestations par matériau",
    intro: "Nous définissons l’étendue exacte après avoir vu vos photos. La notice d’entretien du fabricant prime toujours.",
    leistungenLabel: "Prestations",
    grenzenLabel: "Bon à savoir",
  },
  ABLAUF: {
    eyebrow: "Déroulement",
    title: "Comment se déroule un rendez-vous d’entretien",
    steps: [
      { title: "Demande avec photos", text: "Vous indiquez les pièces et les matériaux. Après l’envoi, vous nous transmettez les photos en réponse à notre e-mail." },
      { title: "Évaluation et offre", text: "Nous vérifions le matériau et les indications du fabricant et vous envoyons une offre. Le prix figure dans l’offre." },
      { title: "Rendez-vous chez vous", text: "Nous entretenons les meubles chez vous. Ce que nous ne pouvons pas résoudre sur place, nous vous le disons à l’avance." },
      { title: "Compte rendu et prochain rendez-vous", text: "Vous recevez un court compte rendu d’entretien. Avec l’abonnement, nous convenons avec vous du prochain rendez-vous." },
    ],
  },
  ABO: {
    eyebrow: "Abonnement",
    title: "Une fois par an, planifié d’avance",
    text: "Avec l’abonnement d’entretien, nous planifions chaque année un rendez-vous avec vous. Nous fixons la date, vous veillez simplement à ce que nous ayons accès aux meubles.",
    punkte: [
      "Un rendez-vous d’entretien par an chez vous",
      "Nous convenons à temps avec vous du prochain rendez-vous",
      "Compte rendu et notice d’entretien de chaque pièce dans l’espace client (en allemand)",
      "Produits d’entretien à racheter sur demande",
    ],
    konditionenTitle: "Conditions",
    konditionenHinweis: "La durée, la résiliation et le prix sont fixés de manière ferme dans votre offre.",
  },
  KONDITIONEN: {
    aufAnfrage: "sur demande",
    preisTermin: "Rendez-vous d’entretien",
    preisAbo: "Abonnement annuel",
    anfahrt: "Déplacement",
    einsatzgebiet: "Zone d’intervention",
    ausfuehrung: "Réalisation",
    mindestlaufzeit: "Durée minimale",
    kuendigung: "Résiliation",
  },
  HERSTELLER: {
    eyebrow: "Fabricants et garantie",
    title: "Selon les consignes du fabricant, en tenant compte de votre garantie",
    absaetze: [
      "Lorsque le fabricant prévoit une notice d’entretien, nous la suivons et apportons la notice de votre modèle. Nous n’utilisons pas de produits que le fabricant ne prévoit pas.",
      "De nombreux fabricants excluent de leur garantie les dommages dus à un entretien inadapté ou à des réparations effectuées par des tiers sans leur accord. Poliform l’écrit par exemple dans ses conditions de garantie. C’est pourquoi nous convenons au préalable de toute retouche avec vous et, si nécessaire, avec le fabricant.",
      "La garantie du fabricant et la garantie légale continuent de dépendre de votre contrat d’achat et des conditions du fabricant. Notre rendez-vous d’entretien n’y change rien. Si nous remarquons un défaut possible sur une pièce achetée chez nous, nous vous le signalons et discutons avec vous de la suite.",
    ],
  },
  PRODUKTE: {
    eyebrow: "Produits d’entretien",
    title: "Produits d’entretien à racheter",
    text: "Sur demande, nous nous procurons les produits d’entretien adaptés à votre matériau et vous indiquons le prix à l’avance. Si vous le souhaitez, nous vous rappelons le produit adapté après le rendez-vous d’entretien.",
    listeTitle: "Actuellement sur demande",
  },
  PORTAL: {
    eyebrow: "Pour nos clientes et clients",
    title: "Vos pièces dans l’espace client",
    text: "Dans l’espace client, sous « Meine Stücke & Pflege », vous voyez les meubles achetés, le prochain rendez-vous d’entretien et la notice d’entretien de chaque matériau. L’espace client est en allemand.",
    link: "Vers l’espace client",
  },
  FAQ_TITLE: "Questions fréquentes",
  FAQ: [
    {
      q: "Combien coûte un rendez-vous d’entretien ?",
      a: "Le prix dépend des pièces, du matériau et du travail. Après votre demande, vous recevez une offre à prix fixe. Nous planifions le rendez-vous seulement après votre accord.",
    },
    {
      q: "Entretenez-vous aussi des meubles qui n’ont pas été achetés chez Platzhirsch ?",
      a: "N’hésitez pas à demander. Il nous faut des photos et, si elle existe, la notice d’entretien du fabricant. Nous vous disons alors si et comment nous pouvons vous aider.",
    },
    {
      q: "La garantie du fabricant est-elle maintenue ?",
      a: "Lorsqu’il existe une notice d’entretien du fabricant, nous la suivons. Nous n’intervenons au-delà de l’entretien qu’après concertation. Nous vérifions au préalable si une intervention touche la garantie. Nous ne pouvons pas prendre d’engagement au nom de la garantie du fabricant.",
    },
    {
      q: "Comment fonctionne l’abonnement ?",
      a: "Nous planifions avec vous un rendez-vous par an et vous le rappelons par e-mail quelques semaines avant. La durée et la résiliation figurent dans votre offre. Vous pouvez aussi souscrire l’abonnement seulement après un premier rendez-vous.",
    },
    {
      q: "Comment envoyer des photos ?",
      a: "Répondez à notre e-mail en joignant les photos. Sur la page en allemand, vous pouvez aussi les téléverser depuis votre téléphone après l’envoi de la demande.",
    },
  ],
  USP: {
    text: "Vous préparez un nouvel aménagement ? Harald Menghin dessine d’abord les intérieurs à la main, puis suivent la planification 3D et le rendu.",
    link: "Notre méthode de travail",
  },
  RATGEBER: {
    title: "L’entretien au quotidien",
    text: "Ce dont le cuir, le tissu, le bois et la pierre ont besoin entre deux rendez-vous est expliqué dans notre guide (en allemand).",
    link: "Guide : bien entretenir le mobilier design (en allemand)",
  },
  FORM: {
    eyebrow: "Demande",
    title: "Demander un rendez-vous d’entretien",
    intro: "Indiquez-nous vos pièces. Nous revenons vers vous avec une évaluation et une offre. La demande est sans engagement.",
    terminText: "Vous préférez en parler directement ?",
    terminLink: "Choisir un rendez-vous en ligne",
    materialLegend: "Quels matériaux ?",
    materialOptions: { leder: "Cuir", stoff: "Tissu", holz: "Bois ou placage", stein: "Marbre ou pierre" },
    stueckeLabel: "Quels meubles ?",
    stueckeHint: "Par exemple : canapé en cuir Minotti, table à manger en noyer huilé, table basse en marbre.",
    artLegend: "Ponctuel ou en abonnement ?",
    artOptions: { einmalig: "Rendez-vous ponctuel", abo: "Abonnement annuel" },
    zeitraumLabel: "Période souhaitée",
    zeitraumOptions: {
      "": "Veuillez choisir",
      bald: "dans les 4 prochaines semaines",
      "1-3m": "dans 1 à 3 mois",
      fruehling: "au printemps",
      sommer: "en été",
      herbst: "en automne",
      winter: "en hiver",
      offen: "pas encore défini",
    },
    ortLabel: "Lieu des meubles",
    ortHint: "Le code postal et la localité suffisent.",
    nachrichtLabel: "Message",
    vornameLabel: "Prénom",
    nachnameLabel: "Nom",
    emailLabel: "E-mail",
    telefonLabel: "Téléphone",
    optional: "facultatif",
    fotosHint: "Vous pouvez téléverser des photos depuis votre téléphone après l’envoi.",
    fotosHintNoUpload: "Vous pouvez envoyer des photos en réponse à notre e-mail.",
    nachkaufLabel: "Après le rendez-vous d’entretien, merci de me rappeler par e-mail les produits d’entretien adaptés.",
    nachkaufHint: "Facultatif. Vous pouvez vous désinscrire à tout moment.",
    submit: "Envoyer la demande",
    sending: "Envoi en cours…",
    summaryTitle: "Veuillez vérifier ces indications :",
    errors: {
      material: "Veuillez choisir au moins un matériau.",
      stuecke: "Veuillez indiquer au moins un meuble.",
      art: "Veuillez choisir ponctuel ou abonnement.",
      zeitraum: "Veuillez choisir une période.",
      ort: "Veuillez indiquer le lieu des meubles.",
      vorname: "Veuillez indiquer votre prénom.",
      nachname: "Veuillez indiquer votre nom.",
      email: "Veuillez indiquer une adresse e-mail valide, p. ex. nom@exemple.ch.",
      telefon: "Veuillez utiliser uniquement des chiffres, des espaces et + ( ) -.",
    },
    requestErrors: {
      network: "Pas de connexion. Veuillez vérifier votre réseau et réessayer.",
      rate_limited: "Trop de demandes en peu de temps. Veuillez patienter quelques minutes.",
      timeout: "Cela a pris trop de temps. Veuillez réessayer.",
      default: "La demande n’a pas pu être envoyée. Veuillez nous appeler ou nous écrire un e-mail.",
    },
    successTitle: "Merci, nous avons bien reçu votre demande.",
    successText: "Nous revenons personnellement vers vous avec une évaluation.",
    again: "Faire une autre demande",
    backoffice: BACKOFFICE,
  },
};

const IT = {
  locale: "it",
  META: {
    title: "Servizio di cura per pelle, tessuto e legno",
    description:
      "Cura a domicilio di mobili di design in pelle, tessuto, legno e marmo, secondo le istruzioni del produttore se esistono. Una tantum o in abbonamento.",
  },
  CRUMBS: [{ label: "Home", href: "/" }, { label: "Servizio di cura" }],
  HERO: {
    eyebrow: "Servizio di cura",
    title: "Cura di pelle, tessuto e legno.",
    lead: "Veniamo da voi e curiamo i vostri mobili in base al materiale e, dove esistono, secondo le istruzioni di cura del produttore. Una tantum o una volta l’anno in abbonamento.",
    primary: "Richiedete un appuntamento di cura",
    secondary: "Leggete la guida alla cura (in tedesco)",
  },
  MATERIAL_SECTION: {
    eyebrow: "Che cosa curiamo",
    title: "Prestazioni per materiale",
    intro: "L’entità esatta la definiamo dopo aver visto le vostre foto. Fanno sempre fede le istruzioni di cura del produttore.",
    leistungenLabel: "Prestazioni",
    grenzenLabel: "Buono a sapersi",
  },
  ABLAUF: {
    eyebrow: "Svolgimento",
    title: "Come si svolge un appuntamento di cura",
    steps: [
      { title: "Richiesta con foto", text: "Indicate i pezzi e i materiali. Dopo l’invio ci mandate le foto rispondendo alla nostra e-mail." },
      { title: "Valutazione e offerta", text: "Verifichiamo il materiale e le indicazioni del produttore e vi inviamo un’offerta. Il prezzo è indicato nell’offerta." },
      { title: "Appuntamento a casa vostra", text: "Curiamo i mobili a casa vostra. Ciò che non possiamo risolvere sul posto ve lo diciamo prima." },
      { title: "Verbale e prossimo appuntamento", text: "Ricevete un breve verbale di cura. Con l’abbonamento concordiamo con voi il prossimo appuntamento." },
    ],
  },
  ABO: {
    eyebrow: "Abbonamento",
    title: "Una volta l’anno, già in agenda",
    text: "Con l’abbonamento di cura fissiamo ogni anno un appuntamento con voi. La data la pianifichiamo noi, voi vi occupate solo dell’accesso ai mobili.",
    punkte: [
      "Un appuntamento di cura all’anno a casa vostra",
      "Concordiamo per tempo con voi il prossimo appuntamento",
      "Verbale e istruzioni di cura per ogni pezzo nel portale clienti (in tedesco)",
      "Prodotti per la cura da riacquistare su richiesta",
    ],
    konditionenTitle: "Condizioni",
    konditionenHinweis: "Durata, disdetta e prezzo sono indicati in modo vincolante nella vostra offerta.",
  },
  KONDITIONEN: {
    aufAnfrage: "su richiesta",
    preisTermin: "Appuntamento di cura",
    preisAbo: "Abbonamento annuale",
    anfahrt: "Trasferta",
    einsatzgebiet: "Zona di intervento",
    ausfuehrung: "Esecuzione",
    mindestlaufzeit: "Durata minima",
    kuendigung: "Disdetta",
  },
  HERSTELLER: {
    eyebrow: "Produttori e garanzia",
    title: "Secondo le indicazioni del produttore, con riguardo alla vostra garanzia",
    absaetze: [
      "Dove il produttore prevede istruzioni di cura, lavoriamo secondo queste e portiamo le istruzioni per il vostro modello. Non usiamo prodotti che il produttore non prevede.",
      "Molti produttori escludono dalla garanzia i danni dovuti a una cura errata o a riparazioni di terzi senza la loro autorizzazione. Poliform, per esempio, lo scrive nelle sue condizioni di garanzia. Per questo concordiamo prima ogni ritocco con voi e, se necessario, con il produttore.",
      "La garanzia del produttore e la garanzia legale continuano a dipendere dal vostro contratto di acquisto e dalle condizioni del produttore. Il nostro appuntamento di cura non cambia nulla. Se notiamo un possibile difetto su un pezzo acquistato da noi, ve lo diciamo e discutiamo con voi come procedere.",
    ],
  },
  PRODUKTE: {
    eyebrow: "Prodotti per la cura",
    title: "Prodotti per la cura da riacquistare",
    text: "Su richiesta procuriamo i prodotti per la cura adatti al vostro materiale e vi indichiamo prima il prezzo. Se lo desiderate, dopo l’appuntamento di cura vi ricordiamo il prodotto adatto.",
    listeTitle: "Attualmente su richiesta",
  },
  PORTAL: {
    eyebrow: "Per le nostre clienti e i nostri clienti",
    title: "I vostri pezzi nel portale clienti",
    text: "Nel portale clienti, alla voce «Meine Stücke & Pflege», vedete i mobili acquistati, il prossimo appuntamento di cura e le istruzioni di cura per ogni materiale. Il portale è in tedesco.",
    link: "Al portale clienti",
  },
  FAQ_TITLE: "Domande frequenti",
  FAQ: [
    {
      q: "Quanto costa un appuntamento di cura?",
      a: "Il prezzo dipende dai pezzi, dal materiale e dal lavoro. Dopo la vostra richiesta ricevete un’offerta a prezzo fisso. Fissiamo l’appuntamento solo dopo il vostro consenso.",
    },
    {
      q: "Curate anche mobili non acquistati da Platzhirsch?",
      a: "Chiedete pure. Ci servono foto e, se disponibili, le istruzioni di cura del produttore. Vi diciamo poi se e come possiamo aiutarvi.",
    },
    {
      q: "La garanzia del produttore resta valida?",
      a: "Dove esistono istruzioni di cura del produttore, lavoriamo secondo queste. Interventi oltre la cura li eseguiamo solo dopo esserci consultati. Se un intervento tocca la garanzia, lo chiariamo prima. Non possiamo assumere impegni per conto della garanzia del produttore.",
    },
    {
      q: "Come funziona l’abbonamento?",
      a: "Fissiamo con voi un appuntamento all’anno e ve lo ricordiamo via e-mail qualche settimana prima. Durata e disdetta sono indicate nella vostra offerta. Potete anche sottoscrivere l’abbonamento dopo un primo appuntamento.",
    },
    {
      q: "Come invio le foto?",
      a: "Rispondete alla nostra e-mail allegando le foto. Sulla pagina in tedesco potete anche caricarle dal telefono dopo l’invio della richiesta.",
    },
  ],
  USP: {
    text: "State progettando qualcosa di nuovo? Harald Menghin disegna prima gli interni a mano, poi seguono progetto 3D e rendering.",
    link: "Il nostro modo di lavorare",
  },
  RATGEBER: {
    title: "La cura di tutti i giorni",
    text: "Di che cosa hanno bisogno pelle, tessuto, legno e pietra tra due appuntamenti è spiegato nella nostra guida (in tedesco).",
    link: "Guida: curare bene i mobili di design (in tedesco)",
  },
  FORM: {
    eyebrow: "Richiesta",
    title: "Richiedete un appuntamento di cura",
    intro: "Indicateci i vostri pezzi. Vi ricontattiamo con una valutazione e un’offerta. La richiesta non è vincolante.",
    terminText: "Preferite parlarne direttamente?",
    terminLink: "Scegliete un appuntamento online",
    materialLegend: "Quali materiali?",
    materialOptions: { leder: "Pelle", stoff: "Tessuto", holz: "Legno o impiallacciatura", stein: "Marmo o pietra" },
    stueckeLabel: "Quali mobili?",
    stueckeHint: "Per esempio: divano in pelle Minotti, tavolo da pranzo in noce oliato, tavolino in marmo.",
    artLegend: "Una tantum o in abbonamento?",
    artOptions: { einmalig: "Appuntamento singolo", abo: "Abbonamento annuale" },
    zeitraumLabel: "Periodo desiderato",
    zeitraumOptions: {
      "": "Scegliete",
      bald: "nelle prossime 4 settimane",
      "1-3m": "tra 1 e 3 mesi",
      fruehling: "in primavera",
      sommer: "in estate",
      herbst: "in autunno",
      winter: "in inverno",
      offen: "ancora da definire",
    },
    ortLabel: "Luogo dei mobili",
    ortHint: "Bastano codice postale e località.",
    nachrichtLabel: "Messaggio",
    vornameLabel: "Nome",
    nachnameLabel: "Cognome",
    emailLabel: "E-mail",
    telefonLabel: "Telefono",
    optional: "facoltativo",
    fotosHint: "Dopo l’invio potete caricare le foto dal telefono.",
    fotosHintNoUpload: "Potete inviare le foto rispondendo alla nostra e-mail.",
    nachkaufLabel: "Dopo l’appuntamento di cura ricordatemi via e-mail i prodotti per la cura adatti.",
    nachkaufHint: "Facoltativo. Potete annullare l’iscrizione in qualsiasi momento.",
    submit: "Inviate la richiesta",
    sending: "Invio in corso…",
    summaryTitle: "Controllate queste indicazioni:",
    errors: {
      material: "Scegliete almeno un materiale.",
      stuecke: "Indicate almeno un mobile.",
      art: "Scegliete una tantum o abbonamento.",
      zeitraum: "Scegliete un periodo.",
      ort: "Indicate il luogo dei mobili.",
      vorname: "Indicate il vostro nome.",
      nachname: "Indicate il vostro cognome.",
      email: "Indicate un indirizzo e-mail valido, p. es. nome@esempio.ch.",
      telefon: "Usate solo cifre, spazi e + ( ) -.",
    },
    requestErrors: {
      network: "Nessuna connessione. Controllate la rete e riprovate.",
      rate_limited: "Troppe richieste in poco tempo. Attendete qualche minuto.",
      timeout: "L’operazione ha richiesto troppo tempo. Riprovate.",
      default: "Non è stato possibile inviare la richiesta. Chiamateci o scriveteci un’e-mail.",
    },
    successTitle: "Grazie, abbiamo ricevuto la vostra richiesta.",
    successText: "Vi ricontattiamo personalmente con una valutazione.",
    again: "Inviate un’altra richiesta",
    backoffice: BACKOFFICE,
  },
};

// Materialien (Leistungen, Grenzen, Alltagspflege) – aus materials.js übersetzt.
const MATERIALS_FR = {
  leder: {
    title: "Cuir",
    intro: "Cuir lisse, cuir aniline et semi-aniline, nubuck.",
    leistungen: [
      "Nettoyage avec un produit adapté au type de cuir",
      "Entretien du cuir lisse et aniline pour qu’il ne se dessèche pas",
      "Le nubuck et le daim ne sont pas crémés, mais brossés et protégés",
    ],
    ausbesserung: "Ravivage de la couleur sur demande, après vérification du type de cuir",
    grenzen: "Les rayures profondes et les déchirures ne se réparent pas par l’entretien. Nous vous le disons avant le rendez-vous.",
    alltag: [
      "Dépoussiérer chaque semaine avec un chiffon doux et sec.",
      "Tamponner immédiatement les liquides, ne pas frotter.",
      "Jamais de solvants ni de produits abrasifs.",
      "Garder environ 30 cm de distance par rapport aux radiateurs, humidité de l’air de 40 à 60 pour cent.",
      "Tester tout nouveau produit d’entretien sur un endroit caché.",
    ],
  },
  stoff: {
    title: "Tissu",
    intro: "Tissus d’ameublement comme la laine, le lin, le bouclé et le velours, ainsi que les tapis.",
    leistungen: [
      "Nettoyage en profondeur si l’étiquette d’entretien ou la fiche du fabricant du tissu autorise le nettoyage humide",
      "Traitement des taches adapté à la tache et au tissu",
      "Imprégnation si le fabricant du tissu l’autorise",
    ],
    grenzen: "Si l’étiquette d’entretien n’autorise pas le nettoyage humide, le tissu est seulement aspiré et brossé. Nous ne lavons pas les housses amovibles en machine.",
    alltag: [
      "Aspirer régulièrement avec un embout adapté, aussi le long des coutures.",
      "Tamponner aussitôt les taches, de l’extérieur vers l’intérieur.",
      "Pas de détergents concentrés, pas d’eau de Javel, pas d’ammoniaque.",
      "Vérifier l’étiquette d’entretien avant tout nettoyage.",
    ],
  },
  holz: {
    title: "Bois et placage",
    intro: "Bois massif huilé et laqué, placage.",
    leistungen: [
      "Entretien des surfaces huilées avec l’huile prévue par le fabricant",
      "Nettoyage des surfaces laquées",
    ],
    ausbesserung: "Petites retouches, comme de légères traces d’eau sur les surfaces huilées, après concertation",
    grenzen: "Nous ne ponçons pas le placage. Les dommages plus importants relèvent de l’ébéniste, nous en convenons d’abord avec vous.",
    alltag: [
      "Essuyer le bois huilé à sec ou à peine humide.",
      "Surfaces huilées : pas de chiffons en microfibre, pas de nettoyants dégraissants. Jamais de nettoyeur vapeur, quel que soit le bois.",
      "Huiler à nouveau selon les indications du fabricant, souvent tous les un à deux ans.",
      "Après usage, rincer puis jeter les chiffons imbibés d’huile (risque d’auto-inflammation).",
    ],
  },
  stein: {
    title: "Marbre et pierre naturelle",
    intro: "Plateaux et piètements en marbre, travertin ou granit.",
    leistungen: [
      "Nettoyage avec un produit au pH neutre",
      "Imprégnation selon les indications du fabricant",
    ],
    ausbesserung: "Petites retouches après concertation",
    grenzen: "Les auréoles mates dues aux acides et les rayures profondes relèvent du marbrier. Nous vous le disons franchement à l’avance.",
    alltag: [
      "Le marbre contient du calcaire : pas de vinaigre, pas de citron, pas de nettoyants acides.",
      "Utiliser des sous-verres et essuyer aussitôt ce qui a coulé.",
      "Nettoyer avec un produit au pH neutre.",
    ],
  },
};

const MATERIALS_IT = {
  leder: {
    title: "Pelle",
    intro: "Pelle liscia, anilina e semianilina, nabuk.",
    leistungen: [
      "Pulizia con un prodotto adatto al tipo di pelle",
      "Cura della pelle liscia e anilina perché non si secchi",
      "Nabuk e scamosciato non vengono trattati con crema, ma spazzolati e protetti",
    ],
    ausbesserung: "Ravvivatura del colore su richiesta, dopo aver verificato il tipo di pelle",
    grenzen: "Graffi profondi e strappi non si eliminano con la cura. Ve lo diciamo prima dell’appuntamento.",
    alltag: [
      "Spolverare ogni settimana con un panno morbido e asciutto.",
      "Tamponare subito i liquidi, non strofinare.",
      "Mai solventi né detergenti abrasivi.",
      "Tenere circa 30 cm di distanza dai termosifoni, umidità tra il 40 e il 60 per cento.",
      "Provare ogni nuovo prodotto per la cura in un punto nascosto.",
    ],
  },
  stoff: {
    title: "Tessuto",
    intro: "Tessuti per imbottiti come lana, lino, bouclé e velluto, anche tappeti.",
    leistungen: [
      "Pulizia profonda se l’etichetta di manutenzione o la scheda del produttore del tessuto consente il lavaggio a umido",
      "Trattamento delle macchie in base alla macchia e al tessuto",
      "Impregnazione se il produttore del tessuto la consente",
    ],
    grenzen: "Se l’etichetta di manutenzione non consente il lavaggio a umido, il tessuto viene solo aspirato e spazzolato. Le fodere sfoderabili non le laviamo in lavatrice.",
    alltag: [
      "Aspirare regolarmente con una bocchetta adatta, anche lungo le cuciture.",
      "Tamponare subito le macchie, dall’esterno verso l’interno.",
      "Niente detersivi concentrati, niente candeggina, niente ammoniaca.",
      "Controllare l’etichetta di manutenzione prima di ogni pulizia.",
    ],
  },
  holz: {
    title: "Legno e impiallacciatura",
    intro: "Legno massello oliato e laccato, impiallacciatura.",
    leistungen: [
      "Cura delle superfici oliate con l’olio indicato dal produttore",
      "Pulizia delle superfici laccate",
    ],
    ausbesserung: "Piccoli ritocchi, come leggere macchie d’acqua sulle superfici oliate, dopo esserci consultati",
    grenzen: "Non carteggiamo l’impiallacciatura. I danni più gravi richiedono l’intervento di un falegname: lo chiariamo prima con voi.",
    alltag: [
      "Pulire il legno oliato asciutto o appena umido.",
      "Superfici oliate: niente panni in microfibra, niente detergenti sgrassanti. In generale niente pulitori a vapore.",
      "Oliare di nuovo secondo le indicazioni del produttore, spesso ogni uno o due anni.",
      "Dopo l’uso sciacquare e smaltire i panni imbevuti d’olio (rischio di autocombustione).",
    ],
  },
  stein: {
    title: "Marmo e pietra naturale",
    intro: "Piani e basi in marmo, travertino o granito.",
    leistungen: [
      "Pulizia con un prodotto a pH neutro",
      "Impregnazione secondo le indicazioni del produttore",
    ],
    ausbesserung: "Piccoli ritocchi dopo esserci consultati",
    grenzen: "Aloni opachi da corrosione acida e graffi profondi richiedono l’intervento di un marmista. Ve lo diciamo onestamente in anticipo.",
    alltag: [
      "Il marmo contiene calcare: niente aceto, niente limone, niente detergenti acidi.",
      "Usare sottobicchieri e asciugare subito ciò che si versa.",
      "Pulire con un prodotto a pH neutro.",
    ],
  },
};

const INTL = Object.freeze({ fr: frenchTypography(FR), it: IT });
const MATERIALS_INTL = Object.freeze({ fr: frenchTypography(MATERIALS_FR), it: MATERIALS_IT });

/** Seitentexte in allen vier Sprachen (DE/EN aus copy.js). Nur serverseitig. */
export function pflegeCopyAll(locale = "de") {
  return INTL[locale] || pflegeCopy(locale);
}

/** Material-Texte in allen vier Sprachen (DE/EN aus materials.js). Nur serverseitig. */
export function materialCopyAll(locale = "de") {
  return MATERIALS_INTL[locale] || materialCopy(locale);
}

export { INTL as PFLEGE_INTL, MATERIALS_INTL as PFLEGE_MATERIALS_INTL };
