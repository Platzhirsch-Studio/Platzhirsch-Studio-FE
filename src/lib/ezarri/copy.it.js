// src/lib/ezarri/copy.it.js – testi italiani della Ezarri-Welt (01.11.2026).
//
// Inhaber-Auftrag 01.11.2026: Ezarri-Welt auch auf Italienisch (Tessin und
// Italien). Mastertext ist copy.js (Deutsch), gegengelesen mit copy.en.js;
// dieselben Export-Namen und dieselbe Struktur wie copy.en.js (ezCopy(locale)
// in lang.js). Fakten nur aus copy.js („secondo Ezarri“), keine Preise, keine
// Superlative. Anrede wie auf den übrigen IT-Seiten: Höflichkeitsform „voi“.
//
// Händler-Aussage: dieselben zwei Schalter wie copy.js; Satz und Titelwort aus
// src/lib/legal/claims.js (dealerStatement, DEALER_TITLE_WORD).
//
// Werkzeuge (Konfigurator, Rechner, Custom Mix, Anfrage) gibt es auf Italienisch
// noch nicht: Links dorthin führen zur englischen Fassung und sagen es im Label
// („in inglese“), Seiten nur auf Deutsch sagen „in tedesco“.
// Typografie: Anführungszeichen « », kein Leerzeichen vor Satzzeichen.
//
// Rein: keine Pakete, keine "@/"-Aliase. Server, Client und node --test.
import { DEALER_TITLE_WORD, dealerStatement, isVerifiedDealerBrand } from "../legal/claims.js";
import { ezarriDealerClaimVisible } from "./config.js";

/** Riga neutra finché non può essere mostrata la dichiarazione di rivenditore. */
export const NEUTRAL_CLAIM = "Mosaico di vetro Ezarri – consulenza e campioni a Lochau";

/** Dichiarazione di rivenditore (solo se documentata E attivata), altrimenti null. */
export function dealerClaim(isPublic) {
  const visible = isPublic === undefined ? ezarriDealerClaimVisible() : ezarriDealerClaimVisible(isPublic);
  if (!visible || !isVerifiedDealerBrand("ezarri")) return null;
  return dealerStatement("ezarri", "it") || null;
}

/** Parola del titolo dalla dichiarazione di rivenditore, null finché non può essere mostrata. */
export function dealerTitleWord(isPublic) {
  return dealerClaim(isPublic) ? DEALER_TITLE_WORD.it : null;
}

/** Riga nel riquadro del marchio: dichiarazione di rivenditore o riga neutra. */
export function dealerLine(isPublic) {
  return dealerClaim(isPublic) ?? NEUTRAL_CLAIM;
}

export const STUDIO = Object.freeze({
  ort: "Showroom-caffè, Landstraße 11, 6911 Lochau, Austria",
  muster: "Ordiniamo i campioni per il vostro appuntamento.",
  laender: "Consegna se lo desiderate: sul Lago di Costanza, nella regione dei tre confini e, su richiesta, anche oltre. Per la Svizzera si aggiungono esportazione e sdoganamento.",
  schweizHref: "/einkaufen-aus-der-schweiz",
});

export const NAV = Object.freeze({
  label: "Mosaico di vetro Ezarri",
  items: [
    { href: "/ezarri", label: "Panoramica", exact: true },
    { href: "/ezarri/mosaike", label: "Mosaici" },
    { href: "/ezarri/kollektionen", label: "Collezioni" },
    { href: "/ezarri/galerie", label: "Galleria" },
    { href: "/ezarri/konfigurator", label: "Configuratore" },
    { href: "/ezarri/rechner", label: "Calcolatore" },
    { href: "/ezarri/technik", label: "Tecnica" },
  ],
  muster: { href: "/ezarri/anfrage?art=muster", label: "Richiedere campioni" },
});

export const LINKS = Object.freeze({
  konfigurator: "/ezarri/konfigurator",
  rechner: "/ezarri/rechner",
  customMix: "/ezarri/custom-mix",
  anfrage: "/ezarri/anfrage",
  muster: (ids = []) => `/ezarri/anfrage?art=muster${ids.length ? `&ref=${ids.map(encodeURIComponent).join(",")}` : ""}`,
  // Pagina di consulenza italiana (src/utils/routing.js: beratung → consulenza).
  beratung: "/consulenza?thema=ezarri",
  katalog: "/ezarri/anfrage?art=muster&thema=katalog",
  outdoor: "/outdoor-gartenplanung",
  kueche: "/kuechen-vorarlberg",
  interior: "/interior-design-vorarlberg",
  merkliste: "/lista-desideri",
});

export const HUB = Object.freeze({
  crumb: "Mosaico di vetro Ezarri",
  eyebrow: "Ezarri · mosaico in vetro riciclato",
  title: "Mosaico di vetro Ezarri per piscina, bagno e spa",
  lead: (st) =>
    `${st.mosaike} mosaici in ${st.kollektionen} collezioni, oltre a Safe-Steps e pezzi speciali – ordinati secondo ciò che vedrete alla fine: luogo, colore dell’acqua, superficie. Progettate la vostra vasca nel browser e guardate i campioni da noi a Lochau.`,
  description: (st) =>
    `Mosaico di vetro Ezarri per piscina, bagno, spa e cucina: ${st.mosaike} mosaici, ${st.kollektionen} collezioni, configuratore 3D, campioni e consulenza a Lochau.`,
  heroAlt: "Piscina in Ezarri Celestite, mosaico di vetro turchese",
  primary: { label: "Progettare la vasca", sub: "3D nel browser · senza registrazione" },
  secondary: "Richiedere campioni",
  weiche: {
    eyebrow: "Impiego",
    title: "Dove andrà posato il mosaico?",
    text: "Secondo le schede tecniche, quasi tutti i mosaici Ezarri sono adatti a pareti, piscine e aree wellness, all’interno come all’esterno. Sotto ogni ambito trovate quanti mosaici sono adatti e quanti Ezarri ne mostra in progetti di questo tipo.",
  },
  kachel: (n, mitBild) => [`${n} mosaici adatti`, mitBild ? `${mitBild} con foto di progetto` : null].filter(Boolean).join(" · "),
  wasser: {
    eyebrow: "Colore dell’acqua",
    title: "Di che colore sarà la vostra acqua?",
    text: "Il mosaico determina l’aspetto dell’acqua. Il bianco la fa apparire azzurro cielo, il grigio e il nero piuttosto come un lago di montagna. L’abbinamento è di Ezarri e dipende anche dal livello dell’acqua e dalla luce del sole.",
    alle: "Tutti i colori dell’acqua a confronto",
  },
  kollektionen: {
    eyebrow: "Assortimento",
    title: (st) => `${st.kollektionen}\u00a0collezioni e ${st.sonderanfertigungen}\u00a0linee su misura`,
    alle: "Tutte le collezioni",
  },
  konfigurator: {
    eyebrow: "Configuratore",
    title: "La vostra vasca, la vostra miscela",
    text: "Misure proprie, fino a quattro mosaici miscelati, sette colori di fuga, ora del giorno e luce subacquea. Il configuratore calcola subito anche le quantità.",
    link: "Aprire il configuratore",
    rechner: "Calcolare la quantità",
    customMix: "Miscela o motivo personalizzato (in inglese)",
  },
  technik: { eyebrow: "Tecnica", title: "Posare, curare, approfondire" },
  marke: {
    eyebrow: "Il marchio",
    text: "Ezarri produce mosaico di vetro a Lazkao (Gipuzkoa, Spagna). Secondo Ezarri, il vetro è composto al 100% da vetro riciclato, confermato secondo ISO 14021; nel mosaico finito la quota è di almeno il 96%, il resto sono coloranti e i punti di incollaggio (JointPoint).",
    website: "Sito web di Ezarri",
  },
  gastgeber: {
    eyebrow: "Showroom-caffè a Lochau",
    title: "Prendere in mano il mosaico",
    text: "Il vetro appare diverso alla luce del giorno e sullo schermo. Portate planimetrie o foto, disponiamo i campioni sul tavolo – con vista sul Lago di Costanza.",
    termin: "Richiedere un appuntamento",
  },
  // Blocco USP (Inhaber-Entscheidung Nr. 8): solo materiale reale come lavoro di Harald.
  usp: {
    eyebrow: "Progettare con Platzhirsch",
    title: "La vostra piscina, prima disegnata a mano.",
    text: "Il mosaico rivela il suo effetto solo alla luce e sul posto. Veniamo a vedere la vostra piscina o il vostro bagno. Harald Menghin disegna a mano motivi, sfumature di colore e passaggi. Poi progettiamo in 3D e vi mostriamo un rendering con i colori Ezarri prima di qualsiasi ordine.",
    arbeitsweise: "Come lavoriamo",
    licht: "Vedere il sole sulla vasca (in tedesco)",
  },
  teaserAlt: "Piscina privata con mosaico di vetro Ezarri",
  schweiz: "Acquistare dalla Svizzera",
  oeffnet: "(apre ezarri.com)",
  referenzen: (n) => `${n} referenze`,
});

/**
 * Ambiti d’impiego (§3.2). Stessi id, filtri e immagini di copy.js; solo i
 * testi sono in italiano. I link verso pagine solo in tedesco lo indicano.
 */
export const WELTEN = Object.freeze([
  {
    id: "pool",
    label: "Piscina",
    title: "Mosaico di vetro per piscine",
    seoTitle: "Mosaico di vetro per piscina, Lago di Costanza",
    description: "Mosaico Ezarri per piscina: scegliere il colore dell’acqua, Safe-Steps antiscivolo, Corner e Cove per gli spigoli. Campioni e consulenza a Lochau.",
    lead: "In una piscina non conta solo il colore: fuga, resistenza allo scivolamento su gradini e bordi, angoli puliti. Qui vedete ciò che conta e i mosaici che Ezarri prevede per le piscine.",
    filter: { einsatz: ["pool"] },
    galerie: ["pool-privat", "pool-oeffentlich"],
    bild: { galerie: "anw-6-terrazzo-teal-50-ezarri-mosaics-pool-home", alt: "Piscina interna stretta con vista sul mare, vasca in Ezarri Terrazzo Teal 50" },
    hinweise: [
      ["Fuga", "Per le piscine Ezarri raccomanda una fuga epossidica di classe RG. Secondo Ezarri, le fughe cementizie vanno rifatte dopo circa 5–6 anni."],
      ["Gradini e bordo", "Per gradini, panche e bordo vasca esistono versioni Safe antiscivolo con valori testati secondo DIN EN 16165."],
      ["Spigoli", "I pezzi Corner rifiniscono gli spigoli esterni, i pezzi Cove formano la sguscia tra parete e pavimento."],
      ["Colore dell’acqua", "I mosaici chiari rendono l’acqua luminosa e turchese, quelli scuri le danno un aspetto profondo e naturale."],
    ],
    platzhirsch: { title: "Piscina, terrazza e giardino in un unico progetto", text: "Piscina, arredi, ombra e luce devono funzionare insieme. Progettiamo il concept outdoor e ci coordiniamo con le imprese specializzate che incaricate.", href: "/outdoor-gartenplanung", label: "Progettazione outdoor" },
  },
  {
    id: "wellness",
    label: "Spa",
    title: "Mosaico di vetro per wellness e spa",
    seoTitle: "Mosaico di vetro per wellness, sauna e spa",
    description: "Mosaico di vetro Ezarri per idromassaggi, bagni turchi e spa: superfici, resistenza allo scivolamento e fughe in sintesi. Campioni a Lochau.",
    lead: "Idromassaggio, bagno turco, doccia spa: qui il mosaico riveste superfici curve, sott’acqua e nel vapore. Secondo Ezarri, il vetro non assorbe acqua ed è resistente ai comuni detergenti.",
    filter: { einsatz: ["wellness"] },
    galerie: ["wellness"],
    bild: { galerie: "anw-alexande-gold-carrara-gold-mosaic-spa-wellness-ezarri-4", alt: "Bagno turco con panca, pareti in mosaico di vetro scuro con tessere dorate, Ezarri Carrara Gold 25" },
    hinweise: [
      ["Curve", "Secondo Ezarri, l’incollaggio a punti (JointPoint) segue anche raggi stretti, per esempio su panche e idromassaggi."],
      ["Pavimento", "I pavimenti bagnati richiedono una versione antiscivolo. I valori sono indicati su ogni pagina del mosaico."],
      ["Luce", "Le superfici madreperlate e metalliche reagiscono molto alla luce. Valutatele su un campione, non solo sullo schermo."],
    ],
    platzhirsch: { title: "Progettare il wellness a casa", text: "Dall’area spa alla sala relax: progettiamo insieme arredi, luce e materiali.", href: "/interior-design-vorarlberg", label: "Interior design" },
  },
  {
    id: "bad",
    label: "Bagno",
    title: "Mosaico di vetro per bagno e doccia",
    seoTitle: "Mosaico di vetro per bagno e doccia, antiscivolo",
    description: "Mosaico di vetro Ezarri per docce, pareti del bagno e piatti doccia: versioni antiscivolo, formati, fughe. Campioni e consulenza a Lochau.",
    lead: "In bagno il mosaico interviene dove le grandi piastrelle arrivano al limite: nella pendenza di una doccia a filo pavimento, nelle nicchie e sulle curve. Per il pavimento della doccia scegliete una versione antiscivolo.",
    filter: { einsatz: ["bad"] },
    galerie: ["bad"],
    bild: { galerie: "anw-ezarri-mosaics-gemma-collection-lace-25", alt: "Bagno con pareti curve, doccia aperta e vasca freestanding, tutto in Ezarri Lace 25 verde chiaro" },
    hinweise: [
      ["Pavimento doccia", "I formati piccoli seguono la pendenza. Le versioni Safe antiscivolo sono pensate per i pavimenti bagnati."],
      ["Fuga", "Il colore della fuga cambia molto l’effetto. Nel configuratore potete provare tutti e sette i colori di fuga."],
    ],
    platzhirsch: { title: "Progettare tutto il bagno", text: "Mosaico, arredi, rubinetteria e luce in un unico concept – ne parliamo nello showroom di Lochau.", href: "/interior-design-vorarlberg", label: "Interior design" },
  },
  {
    id: "kueche",
    label: "Cucina",
    title: "Mosaico di vetro per la cucina",
    seoTitle: "Mosaico di vetro come paraschizzi in cucina",
    description: "Mosaico di vetro Ezarri come paraschizzi in cucina: superfici, colori e formati in sintesi. Progettazione della cucina e campioni a Lochau.",
    lead: "Come paraschizzi dietro piano cottura e lavello, il mosaico di vetro si pulisce facilmente. Metallo, madreperla e aspetti pietra opachi creano accenti propri tra frontali e piano di lavoro.",
    filter: { einsatz: ["kueche"] },
    galerie: ["kueche"],
    bild: { galerie: "anw-perla-hexa-mosaic-iridescent-collection-ezarri-kitchen", alt: "Cucina chiara con isola, pareti in mosaico madreperlato bianco Ezarri Perla Hexa" },
    hinweise: [
      ["Superficie", "I paraschizzi sono di solito stretti e lunghi. Il calcolatore indica la quantità in scatole."],
      ["Abbinamento", "Scegliete il mosaico insieme a frontale e piano di lavoro, con i campioni uno accanto all’altro."],
    ],
    platzhirsch: { title: "Cucina e paraschizzi da un unico progetto", text: "Progettiamo cucine a Lochau e abbiniamo il paraschizzi a frontali e piano di lavoro.", href: "/kuechen-vorarlberg", label: "Progettazione cucine" },
  },
  {
    id: "fassade",
    label: "Facciata",
    title: "Mosaico di vetro per facciate e pareti esterne",
    seoTitle: "Mosaico di vetro per facciate e pareti esterne",
    description: "Mosaico di vetro Ezarri per pareti esterne e facciate: indicazioni delle schede tecniche, formati e colori. Progettazione con l’impresa di facciate.",
    lead: "Secondo le schede tecniche, le collezioni Ezarri sono adatte a pareti e soffitti, all’interno come all’esterno, su superfici regolari e irregolari. Ezarri non ha pubblicato foto di progetti di facciate. Per questo mostriamo una parete interna interamente rivestita e le indicazioni delle schede tecniche.",
    filter: { einsatz: ["wand-innen-aussen"] },
    galerie: [],
    bild: { galerie: "anw-moonstone-hexa-mosaic-gemma-collection-ezarri-espacio", alt: "Ambiente con ampia apertura, pareti e sguancio interamente rivestiti in Ezarri Moonstone Hexa" },
    hinweise: [
      ["Progettazione", "Sottofondo, adesivo e fuga vengono definiti dalla vostra impresa di facciate. Noi forniamo mosaico, schede tecniche e campioni."],
      ["Gelo e luce", "Secondo Ezarri, il vetro non assorbe praticamente acqua (assorbimento d’acqua 0,1% da scheda tecnica) e non sbiadisce."],
    ],
    platzhirsch: { title: "Casa e giardino in un unico progetto", text: "Facciata, terrazza e piscina: progettiamo il concept outdoor con arredi, ombra e luce.", href: "/outdoor-gartenplanung", label: "Progettazione outdoor" },
  },
]);

export const WASSER = Object.freeze({
  crumb: "Colore dell’acqua",
  eyebrow: "Colore dell’acqua",
  title: "Di che colore sarà la vostra acqua?",
  seoTitle: "Colore della piscina: come il mosaico colora l’acqua",
  description: "Sei colori dell’acqua a confronto, dall’azzurro cielo al lago di montagna, con i mosaici Ezarri corrispondenti e le foto dei progetti realizzati.",
  lead: "L’acqua non ha un colore proprio: lo prende dalla vasca. Ezarri assegna i suoi mosaici a sei effetti dell’acqua. L’intensità dell’effetto dipende dalla profondità dell’acqua, dalla posizione del sole e dall’ambiente.",
  texte: {
    himmelblau: "Mosaici bianchi e molto chiari. L’acqua appare luminosa, limpida e leggermente azzurra.",
    tuerkisblau: "Toni azzurri e turchesi. Il classico colore da piscina, soprattutto nelle zone poco profonde.",
    blau: "Toni di blu da medio a scuro. Più il mosaico è scuro, più il blu appare profondo.",
    gruen: "Secondo Ezarri, i toni beige, sabbia e rosa danno all’acqua un verde trasparente.",
    graugruen: "I mosaici grigi danno all’acqua un grigio con riflessi blu o verdi.",
    natur: "Mosaici neri e verde scuro. L’acqua sembra un lago di montagna o un fiume.",
  },
  quelle: "Abbinamento dei colori dell’acqua: Ezarri (filtro della galleria e FAQ), aggiornato al 28.10.2026.",
  zahlen: {
    title: "Mosaici e progetti per colore dell’acqua",
    caption: "Numero di mosaici e di foto di progetti per effetto dell’acqua secondo Ezarri",
    wirkung: "Effetto dell’acqua",
    mosaike: "Mosaici",
    projekte: "Foto di progetti",
  },
});

export const KOLLEKTIONEN = Object.freeze({
  crumb: "Collezioni",
  eyebrow: "Assortimento",
  title: "Collezioni",
  seoTitle: "Collezioni Ezarri: Premium, Classic, Custom",
  description: (st) =>
    `Tutte le ${st.kollektionen} collezioni Ezarri e ${st.sonderanfertigungen} linee su misura: Gea, Zen, Iridescent, Niebla, Lisa e altre. Formati, superfici e schede tecniche.`,
  lead: "Premium, Classic e Custom: ogni collezione ha le proprie superfici e i propri formati. Per le linee su misura Ezarri produce la miscela o il motivo per il vostro progetto.",
  sonder: "Su misura",
  sonderN: (n) => (n === 1 ? "1 linea su misura" : `${n} linee su misura`),
  linien: {
    Premium: "Aspetti pietra, madreperla, metallo, oro e vetro fosforescente.",
    Classic: "I colori di base per piscine, in tinta unita o come miscela pronta.",
    Custom: "Miscele proprie, motivi stampati e pixel, sfumature.",
  },
  custom: "Questa collezione è un servizio. La miscela o il motivo viene realizzato per il vostro progetto.",
  customLink: "Progettare la vostra miscela (in inglese)",
  alt: "Schede tecniche di collezioni precedenti",
  altHinweis: "Ezarri non presenta più queste collezioni sul suo sito. Scheda tecnica: Ezarri, ezarri.com",
  konfigurator: "Aprire nel configuratore",
  datenblatt: "Scheda tecnica (PDF, in inglese)",
  datenblattVon: (name) => `${name} – scheda tecnica (PDF, in inglese)`,
  ausfuehrungen: "Safe-Steps, Corner e Cove",
  anwendung: "Esempio d’impiego",
  anwendungen: "Esempi d’impiego",
  anwendungsbild: (name) => `Ezarri ${name}, foto d’impiego`,
  beispiel: (name) => `Ezarri ${name}, esempio`,
  projektMit: (name) => `Progetto con Ezarri ${name}`,
  mosaike: "Mosaici",
  fakten: "Secondo la scheda tecnica",
  formate: "Formati",
  formateCaption: (name) => `Formati della collezione ${name} secondo la scheda tecnica`,
  spalten: { format: "Formato", stein: "Tessera", blatt: "Foglio", dicke: "Spessore", verklebung: "Unione" },
  patternFarben: (n) => `${n} colori`,
  patternAlt: (name, n) => `Ezarri ${name}, motivo con ${n} colori`,
  leerService: "Per questo servizio Ezarri non mostra referenze singole. Progettiamo la miscela con voi –",
  herstellerTitel: "Ezarri descrive la collezione",
  muster: "Richiedere campioni",
  service: {
    "custom-mix": "La vostra miscela (strumento in inglese)",
    "custom-pixel": "Richiedere un mosaico pixel dalla vostra immagine",
    "custom-printed": "Progettare con noi un motivo stampato",
    "standard-printed": "Scegliere con noi motivi stampati",
    "standard-pixel": "Scegliere con noi motivi pixel",
    patterns: "Scegliere con noi i pattern",
    "fading-out": "Progettare con noi una sfumatura",
  },
  h1: (name) => `${name} – mosaico di vetro Ezarri`,
  metaTitle: (name, linie) => `Ezarri ${name} – mosaico di vetro ${linie}`.replace(/\s+/g, " ").trim(),
});

export const MOSAIKE = Object.freeze({
  crumb: "Mosaici",
  eyebrow: "Tutti i mosaici",
  title: "Mosaici",
  seoTitle: "Mosaico di vetro Ezarri: tutti i mosaici",
  description: "Filtrate tutti i mosaici Ezarri per impiego, colore dell’acqua, colore, formato e collezione. Confrontare, salvare, richiedere campioni a Lochau.",
  lead: "Filtrate per effetto dell’acqua, colore, formato e foto di progetti. Confrontate fino a quattro mosaici e salvate la vostra selezione.",
  suche: "Nome o codice",
  sucheLabel: "Cerca",
  filter: "Filtri",
  mehrFilter: "Altri filtri",
  anwenden: "Applicare i filtri",
  zuruecksetzen: "Rimuovere tutti i filtri",
  treffer: (n) => (n === 1 ? "1 mosaico" : `${n} mosaici`),
  weitere: (n) => `Caricare altri ${n}`,
  seite: (p, ps) => `Pagina ${p} di ${ps}`,
  leer: {
    title: "Nessun mosaico corrisponde a tutti i filtri",
    text: "Togliete un filtro, cercate un colore simile – oppure chiedete a noi. Troveremo il mosaico adatto a voi.",
    aehnlich: "Cercare un colore simile",
    anfrage: "Lo cerchiamo noi per voi",
  },
  farbe: { label: "Scegliere un colore", hinweis: "Ordinati per somiglianza al colore scelto", entfernen: "Rimuovere il colore" },
  safe: "Solo antiscivolo",
  spezial: "Con Corner o Cove",
  sortNaehe: "per somiglianza di colore",
  filterKnopf: (n) => (n ? `Filtri (${n})` : "Filtri"),
  filterTitel: "Filtrare i mosaici",
  anzeigen: (n) => (n === 1 ? "Mostrare 1 mosaico" : `Mostrare ${n} mosaici`),
  schliessen: "Chiudere i filtri",
  projektbild: { legend: "Foto di progetto", hinweis: "Mosaici che Ezarri mostra in progetti di questo tipo." },
  eignung:
    "Secondo le schede tecniche, quasi tutti i mosaici Ezarri sono adatti a pareti e pavimenti, piscine e aree wellness, all’interno come all’esterno, quindi anche a bagni e cucine. Per pavimenti bagnati e gradini scegliete «Solo antiscivolo».",
  weitereArten: (n) => `${n} Safe-Steps e pezzi speciali sotto «Tipo»`,
  alleArten: "Mostrare anche Safe-Steps e pezzi speciali",
  sortLabel: "Ordina",
  sortierung: [
    { id: "empfohlen", label: "Consigliati" },
    { id: "name", label: "Nome A–Z" },
    { id: "kollektion", label: "Collezione" },
    { id: "hell", label: "Colore chiaro → scuro" },
  ],
});

export const KARTE = Object.freeze({
  imWasser: "In acqua:",
  vergleichen: "Confrontare",
  verglichen: "Nel confronto",
  merken: (name) => `Salvare: Ezarri ${name}`,
  vollerVergleich: "Al massimo 4 mosaici nel confronto",
});

export const VERGLEICH = Object.freeze({
  crumb: "Confronto",
  title: "Confrontare mosaici",
  seoTitle: "Confrontare mosaici Ezarri",
  leiste: (n) => `Confronto (${n})`,
  oeffnen: "Vedere il confronto",
  leeren: "Svuotare il confronto",
  leer: "Nella panoramica dei mosaici scegliete fino a quattro mosaici con «Confrontare».",
  zurUebersicht: "Alla panoramica dei mosaici",
  unterschied: "diverso",
  gleich: "uguale",
  nurUnterschiede: "Mostrare solo le differenze",
  entfernen: (name) => `Rimuovere ${name} dal confronto`,
  konfigurator: "Questa miscela nel configuratore",
  muster: "Richiedere tutti i campioni",
  nichtMischbar: "Secondo Ezarri, almeno un mosaico non può essere miscelato.",
  zeilen: {
    kollektion: "Collezione",
    format: "Formato",
    oberflaeche: "Superficie",
    wasser: "Effetto dell’acqua",
    rutsch: "Resistenza allo scivolamento",
    spezial: "Corner / Cove",
    blatt: "Foglio",
    steine: "Tessere per foglio",
    m2karton: "m² per scatola",
    kgm2: "kg per m²",
    einsatz: "Impiego",
    mischbar: "Miscelabile nel configuratore",
  },
});

export const DETAIL = Object.freeze({
  preis: "Prezzo su richiesta",
  preisHinweis: "Vi indichiamo il prezzo con quantità, modalità di consegna e tempi.",
  muster: "Richiedere campioni",
  konfigurator: "Vedere nel configuratore",
  rechner: "Calcolare la quantità",
  merken: "Salvare",
  gemerkt: "Salvato",
  ausfuehrungen: "Versioni",
  formate: "Formato",
  safe: "Antiscivolo",
  spezial: "Pezzi speciali",
  aufDieserSeite: "in questa pagina",
  massTitle: "Misure del foglio",
  massLegende: (stein, fuge) => `Una tessera ${stein}, fuga ${fuge}. Disegno non in scala sullo schermo.`,
  fakten: "Dati tecnici",
  verpackung: "Imballaggio",
  luecke: "non indicato da Ezarri",
  rutschKorrigiert: "Nella scheda tecnica i valori a piedi nudi e con calzature sono invertiti; qui sono assegnati correttamente.",
  aehnlich: "Mosaici simili",
  passtZu: "Dalla stessa collezione:",
  projekte: "Progetti con questo mosaico",
  verlegung: "Posa in piscina",
  datenblatt: "Scheda tecnica della collezione",
  ezarriSeite: "Pagina prodotto sul sito Ezarri",
  fuge: "Fuga consigliata",
  labels: {
    code: "Codice",
    kollektion: "Collezione",
    linie: "Linea",
    typ: "Tipo",
    format: "Formato",
    stein: "Tessera",
    blatt: "Foglio",
    steine: "Tessere per foglio",
    dicke: "Spessore",
    fugeMm: "Larghezza della fuga",
    oberflaeche: "Superficie",
    farbe: "Colore",
    einsatz: "Impiego",
    wasser: "Effetto dell’acqua",
    rutschBarfuss: "Piedi nudi (DIN EN 16165 A)",
    rutschSchuh: "Con calzature (DIN EN 16165 B)",
    rutschPendel: "Pendolo (UNE-EN 16165 C)",
    blattKarton: "Fogli per scatola",
    m2Karton: "m² per scatola",
    m2Palette: "m² per pallet",
    kgm2: "Peso",
    mischbar: "Miscelabile",
  },
  mischbarJa: "sì, miscelabile nel configuratore",
  mischbarNein: "no, nel configuratore selezionabile solo singolarmente",
  lautEzarri: "secondo Ezarri",
  keinBild: "Nessuna immagine disponibile sul sito Ezarri",
  ohneSeite: "(sul sito Ezarri; qui non ancora con una pagina propria)",
  blattmass: "Misura del foglio",
  verpackungCaption: "Imballaggio per formato",
  verpackungSpalten: { format: "Formato", blatt: "Fogli/scatola", m2: "m²/scatola", palette: "m²/pallet", kg: "kg/m²" },
  datenblattPdf: (name) => `Scheda tecnica della collezione ${name ?? ""} (PDF, in inglese)`.replace(/\s+\(/, " ("),
  video: (name) => `Video di ${name} su YouTube`,
  oeffnetEzarri: "(apre ezarri.com)",
  oeffnetYoutube: "(apre youtube.com)",
  stand: "aggiornato al",
  herstellerTitel: "Secondo Ezarri",
  lead: ({ name, kollektion, fmt, oberflaeche, wasser, others }) =>
    [
      `${name} è un mosaico di vetro della collezione Ezarri ${kollektion}${fmt ? `, qui nella versione ${fmt}` : ""}${oberflaeche ? `, superficie: ${oberflaeche}` : ""}.`,
      wasser ? `Effetto dell’acqua secondo Ezarri: ${wasser}.` : null,
      others.length ? `La stessa famiglia esiste anche come ${others.join(", ")}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
  metaDescription: ({ name, code, kollektion, facts }) => `Mosaico di vetro Ezarri ${name} (${code}), collezione ${kollektion}. ${facts ? `${facts}. ` : ""}Campioni e consulenza a Lochau.`,
  metaFormat: (fmt) => `formato ${fmt}`,
  metaWasser: (w) => `effetto dell’acqua ${w}`,
  heading: { typ: "Mosaico", kollektion: (name) => `collezione ${name}` },
});

export const MISCHUNG = Object.freeze({
  title: "Miscela secondo Ezarri",
  balken: "Quote della miscela",
  ohneSeite: "nessuna pagina prodotto propria sul sito Ezarri",
  quelle: "Ricetta: Ezarri, pagina prodotto",
  quelleKonfigurator: "Ricetta: Ezarri, configuratore (pagina prodotto incompleta)",
  quelleLink: "Vedere sul sito Ezarri",
  konfigurator: "Questa miscela nel configuratore",
  konfiguratorFertig: "Miscela pronta nel configuratore",
  konfiguratorHinweis: "Il configuratore parte da questa ricetta. Lì potete modificare le quote.",
  muster: "Richiedere campioni dei singoli colori",
  nurFertig: "Nel configuratore selezionabile solo come miscela pronta",
  zeile: "Miscela",
});

export const GALERIE = Object.freeze({
  crumb: "Galleria",
  eyebrow: "Progetti con mosaico Ezarri",
  title: "Galleria",
  seoTitle: "Progetti con mosaico di vetro Ezarri: galleria",
  description: "Oltre 1.000 foto di progetti con mosaico di vetro Ezarri: piscine, spa, bagni e cucine. Filtri per impiego, colore dell’acqua e collezione.",
  lead: "Foto di progetti di Ezarri, ciascuna con il mosaico utilizzato.",
  diesesMosaik: (name) => `Mosaico: ${name}`,
  filterTitel: "Filtrare la galleria",
  einsatz: [
    { id: "pool-privat", label: "Piscina privata" },
    { id: "pool-oeffentlich", label: "Piscina pubblica e hotel" },
    { id: "wellness", label: "Wellness e spa" },
    { id: "bad", label: "Bagno" },
    { id: "kueche", label: "Cucina" },
  ],
  anzeigen: (n) => (n === 1 ? "Mostrare 1 foto" : `Mostrare ${n} foto`),
  laedt: "Caricamento …",
  videos: {
    link: (n) => `Video (${n})`,
    title: "Video di prodotto di Ezarri",
    text: "Brevi filmati su singoli mosaici, non su progetti. Si aprono su YouTube.",
  },
  video: "Guardare il video su YouTube",
  videoHinweis: "Apre youtube.com in una nuova scheda.",
  oeffnen: "Ingrandire la foto",
  schliessen: "Chiudere",
  vor: "Foto successiva",
  zurueck: "Foto precedente",
  leer: "Per questi filtri non ci sono foto di progetti.",
  treffer: (n) => (n === 1 ? "1 foto di progetto" : `${n} foto di progetti`),
});

export const TECHNIK = Object.freeze({
  crumb: "Tecnica",
  eyebrow: "Tecnica",
  title: "Informazioni tecniche e posa",
  seoTitle: "Mosaico Ezarri: dati tecnici, posa, manutenzione",
  description: "JointPoint, posa per tipo di vasca, manutenzione, domande frequenti e tutte le schede tecniche e i certificati Ezarri in formato PDF.",
  lead: "Informazioni del produttore Ezarri, riassunte con parole nostre. La posa è eseguita da un’impresa di piastrellatura specializzata.",
  bereiche: [
    { href: "/ezarri/technik/jointpoint", title: "JointPoint", text: "Come le tessere restano unite senza carta né rete." },
    { href: "/ezarri/technik/verlegung", title: "Posa", text: "Passaggi per tipo di vasca: calcestruzzo, acciaio, polistirene, polipropilene, poliestere." },
    { href: "/ezarri/technik/pflege", title: "Manutenzione", text: "Pulizia, calcare, residui di fuga, prodotti chimici." },
    { href: "/ezarri/technik/fragen", title: "Domande frequenti", text: "18 risposte, dal materiale ai tempi di consegna." },
    { href: "/ezarri/technik/downloads", title: "Download", text: "Schede tecniche, certificati e garanzia in PDF." },
    { href: "/ezarri/rechner", title: "Calcolatore del mosaico", text: "m², scatole, adesivo e fuga per la vostra vasca." },
  ],
  fachbetrieb: "La posa è eseguita da un’impresa di piastrellatura specializzata. Noi forniamo mosaico, schede tecniche e campioni e coordiniamo le date.",
});

export const JOINTPOINT = Object.freeze({
  crumb: "JointPoint",
  title: "JointPoint: punti di colla invece di carta e rete",
  seoTitle: "Ezarri JointPoint spiegato",
  description: "Come JointPoint unisce le tessere Ezarri: incollaggio a punti, 92% del retro libero, secondo Ezarri fino al 25% di tempo di posa in meno.",
  lead: "In molti mosaici le tessere sono tenute insieme da carta sul fronte o da una rete sul retro. Ezarri unisce invece le tessere con piccoli punti di incollaggio flessibili sui bordi.",
  punkte: [
    ["Più superficie di incollaggio", "Secondo Ezarri, il 92% del retro resta libero per l’adesivo. Tra tessera e adesivo non ci sono né carta né rete."],
    ["Posa più rapida", "Secondo Ezarri, fino al 25% di tempo di posa in meno rispetto ai mosaici su carta, perché non c’è carta da rimuovere."],
    ["Flessibile", "Il foglio segue le curve, per esempio su gradini, panche e idromassaggi, e si taglia facilmente."],
    ["Umidità", "Secondo Ezarri, i punti non si gonfiano con l’umidità, non si ritirano e non si rompono."],
  ],
  grafik: {
    title: "Il retro a confronto",
    netz: "Rete: fibre tra tessera e adesivo",
    papier: "Carta: fronte incollato, da rimuovere",
    joint: "JointPoint: punti sui bordi, retro libero",
  },
});

/** Posa per tipo di vasca. Fonte: ezarri.com/en/installation e sottopagine, 28.10.2026. */
export const VERLEGUNG = Object.freeze({
  crumb: "Posa",
  title: "Posa per tipo di vasca",
  seoTitle: "Posare mosaico di vetro in piscina: i passaggi",
  description: "Posare il mosaico di vetro Ezarri: passaggi per vasche in calcestruzzo, acciaio, polistirene, polipropilene e poliestere secondo il produttore.",
  lead: "Scegliete il vostro tipo di vasca. I passaggi riassumono la guida di posa di Ezarri. Il vostro piastrellista sceglie adesivo e fuga secondo le schede tecniche dei produttori.",
  waehlen: "Tipo di vasca",
  hinweisKelle: "Nella guida di posa per il calcestruzzo Ezarri indica una spatola dentata da 6 mm, nelle FAQ una spatola dentata da 3 mm. Il vostro piastrellista segue la scheda tecnica dell’adesivo.",
  typen: [
    {
      id: "beton",
      label: "Calcestruzzo",
      schritte: [
        ["Preparare il sottofondo", "Piano, pulito, portante e asciutto: umidità residua inferiore al 3%."],
        ["Scegliere l’adesivo", "Adesivo cementizio almeno di classe C2TE (EN 12004)."],
        ["Stendere l’adesivo", "Distribuire in modo uniforme con spatola dentata, 6 mm secondo la guida di posa."],
        ["Posare i fogli", "Collocare i fogli JointPoint e premerli."],
        ["Allineare", "Raddrizzare le fughe con un frattazzo di gomma."],
        ["Scegliere la fuga", "Fuga epossidica di classe RG. In alternativa una fuga cementizia di qualità CG2, che secondo Ezarri va rifatta dopo circa 5–6 anni."],
        ["Stuccare", "Lavorare con un frattazzo di gomma morbida, togliere l’eccesso."],
        ["Pulire", "Pulire con acqua e frattazzo a spugna."],
        ["Pulizia finale", "Dopo 24 ore, pulire di nuovo con un detergente di fine cantiere."],
      ],
    },
    {
      id: "stahl",
      label: "Acciaio zincato",
      schritte: [
        ["Impermeabilizzare le pareti", "Applicare membrane impermeabilizzanti autoadesive sulle pareti in acciaio."],
        ["Sigillare i giunti delle pareti", "Chiudere i giunti con nastro impermeabile e un adesivo adatto."],
        ["Impermeabilizzare il fondo", "Applicare membrane su tutta la platea in calcestruzzo, sovrapposte di 5 cm, e incollare le sovrapposizioni."],
        ["Raccordo fondo-parete", "Sigillare con lo stesso nastro flessibile e lo stesso adesivo."],
        ["Sigillare i passanti", "Collegare skimmer, fari e bocchette alla membrana con un sigillante speciale."],
        ["Posare il mosaico", "Con l’adesivo e la fuga consigliati, come per una vasca in calcestruzzo."],
      ],
    },
    {
      id: "polystyrol",
      label: "Polistirene",
      schritte: [
        ["Impermeabilizzare la vasca", "Posare una membrana impermeabilizzante adatta, sovrapposta di 5 cm."],
        ["Chiudere le sovrapposizioni", "Incollare con il prodotto consigliato da Ezarri."],
        ["Sigillare i passanti", "Collegare skimmer, fari e bocchette alla membrana con sigillante."],
        ["Posare il mosaico", "Con l’adesivo e la fuga consigliati."],
      ],
    },
    {
      id: "polypropylen",
      label: "Polipropilene",
      schritte: [
        ["Impermeabilizzare le pareti", "Applicare membrane impermeabilizzanti autoadesive sulle pareti."],
        ["Sigillare i giunti delle pareti", "Con nastro impermeabile e un adesivo adatto."],
        ["Impermeabilizzare il fondo", "Applicare membrane sulla platea in calcestruzzo, sovrapposte di 5 cm, e incollare le sovrapposizioni."],
        ["Raccordo fondo-parete", "Con lo stesso nastro flessibile e lo stesso adesivo."],
        ["Sigillare i passanti", "Collegare skimmer, fari e bocchette con sigillante."],
        ["Posare il mosaico", "Con l’adesivo e la fuga consigliati."],
      ],
    },
    {
      id: "polyester",
      label: "Poliestere",
      schritte: [
        ["Carteggiare", "Carteggiare tutta la superficie della vasca."],
        ["Togliere la polvere", "Rimuovere polvere di carteggiatura e sporco con acetone."],
        ["Scegliere l’adesivo", "Adesivo a base di resina reattiva poliuretanica o epossidica, che assorbe i movimenti."],
        ["Stendere l’adesivo", "Distribuire con una spatola dentata da 3 mm."],
        ["Posare i fogli", "Collocare con JointPoint e premere."],
        ["Stuccare", "Con fuga epossidica."],
        ["Pulizia finale", "Dopo 24 ore, pulire di nuovo con un detergente di fine cantiere."],
      ],
    },
  ],
  schritte: "Passaggi",
  quelle: "Passaggi secondo la guida di posa di Ezarri (ezarri.com/en/installation), riassunti con parole nostre.",
});

export const PFLEGE = Object.freeze({
  crumb: "Manutenzione",
  title: "Curare il mosaico di vetro",
  seoTitle: "Pulire e curare il mosaico di vetro",
  description: "Pulire il mosaico di vetro: residui di fuga, calcare, prodotti per piscina, bagno e taglio. Indicazioni basate sui temi di manutenzione di Ezarri.",
  lead: "Il vetro è compatto e facile da curare. La maggior parte delle domande riguarda la fuga e i residui della posa. Provate sempre prima i detergenti su una zona poco visibile e seguite le indicazioni dei produttori di detergenti e fughe.",
  themen: [
    ["Rimuovere i residui di epossidico", "I residui freschi si tolgono con acqua e frattazzo a spugna. La patina indurita si rimuove con un detergente per epossidici indicato dal produttore della fuga."],
    ["Perché la fuga epossidica", "Le fughe epossidiche sono compatte e più resistenti ai prodotti chimici della piscina rispetto a quelle cementizie. Secondo Ezarri, in piscina le fughe cementizie vanno rifatte dopo circa 5–6 anni."],
    ["Rimuovere il calcare", "Staccare gli aloni di calcare sulla linea dell’acqua con un detergente acido adatto, poi risciacquare bene con acqua. La fuga deve essere compatibile con il detergente."],
    ["Prodotti chimici e vetro", "Secondo Ezarri, il vetro resiste ai comuni prodotti per la cura della piscina ed è adatto all’elettrolisi del sale. La fuga è di solito la parte più delicata."],
    ["Residui di fuga cementizia", "Dopo l’indurimento, rimuovere la patina di cemento con un detergente adatto. Non graffiare né strofinare il vetro."],
    ["Riempire la piscina", "Una piscina con mosaico si riempie solo quando adesivo e fuga sono induriti secondo i rispettivi produttori."],
    ["Pulire il bagno", "Bastano un detergente delicato e un panno morbido. Abrasivi e lana d’acciaio graffiano superfici come madreperla o metallo."],
    ["Tagliare il mosaico", "I fogli JointPoint si dividono tra le tessere. Le singole tessere si tagliano con la tenaglia per mosaico di vetro."],
  ],
  quelle: "Temi basati sulla sezione manutenzione di Ezarri (ezarri.com/en/maintenance-of-mosaic). I testi sono un nostro riassunto, non testi del produttore.",
});

/** 18 domande, risposte nostre. Fatti: ezarri.com (28.10.2026). */
export const FRAGEN = Object.freeze({
  crumb: "Domande frequenti",
  title: "Domande frequenti sul mosaico Ezarri",
  seoTitle: "Mosaico di vetro Ezarri: domande frequenti",
  description: "Materiale, vetro riciclato, JointPoint, colore dell’acqua, adesivo e fuga, tempi di consegna e acquisto: risposte sul mosaico di vetro Ezarri.",
  liste: [
    ["Che cos’è JointPoint?", "Il sistema di Ezarri per unire le tessere: piccoli punti di incollaggio flessibili sui bordi invece di carta o rete. Secondo Ezarri, così il 92% del retro resta libero per l’adesivo."],
    ["Perché JointPoint è adatto a piscine e spa?", "Perché tra tessera e adesivo non c’è nulla. Secondo Ezarri, fa risparmiare fino al 25% del tempo di posa rispetto alla carta ed è resistente a umidità e prodotti chimici."],
    ["Di che cosa è fatto il vetro?", "Secondo Ezarri, di vetro riciclato al 100% come materia prima, confermato secondo ISO 14021. Il mosaico finito contiene almeno il 96% di vetro post-consumo, il resto sono coloranti e i punti di incollaggio."],
    ["Che cosa dice il certificato ambientale?", "L’autodichiarazione secondo ISO 14021 attesta la quota di riciclato. Il PDF si trova sotto Download."],
    ["Dove viene prodotto il mosaico?", "A Lazkao (Gipuzkoa, Spagna). Lì si trovano anche la produzione e il magazzino centrale. Ezarri indica sedi logistiche a Castellón, Sassuolo e Miami."],
    ["È tutto prodotto in Spagna?", "Secondo Ezarri sì, tutti i mosaici vengono da Lazkao. Circa il 70% della produzione è destinato all’esportazione."],
    ["Quanto dura il mosaico in piscina?", "Secondo Ezarri, il vetro non assorbe acqua, è chimicamente inerte e resiste agli sbalzi di temperatura. Posato correttamente non sbiadisce. La fuga è la parte che richiede cura."],
    ["Come influisce il mosaico sul colore dell’acqua?", "Il bianco dà un’acqua da azzurro cielo a turchese, beige e rosa un verde trasparente, il grigio un grigio con riflessi blu o verdi, nero e verde scuro un tono da lago di montagna. Il blu scuro fa sembrare l’acqua più profonda. Maggiori informazioni sotto Colore dell’acqua."],
    ["Come si posa?", "Sottofondo liscio, pulito e asciutto, adesivo flessibile C2TE, premere e allineare i fogli, stuccare con epossidico, togliere i residui. I passaggi per tipo di vasca sono sotto Posa."],
    ["Quali adesivi e quali fughe?", "Adesivo almeno C2TE secondo EN 12004. Come fuga Ezarri raccomanda l’epossidico (RG), in alternativa una fuga cementizia di qualità (CG2)."],
    ["Il mosaico si può posare su vasche in poliestere o prefabbricate?", "Sì, con un adesivo elastico a base di resina reattiva (epossidica o poliuretanica) che assorbe i movimenti. Prima la superficie viene carteggiata."],
    ["Quanto dura una fuga cementizia in piscina?", "Secondo Ezarri circa 5–6 anni, poi va rifatta. Le fughe epossidiche durano di più."],
    ["Perché le piastrelle si staccano in piscina?", "Di solito per una cattiva preparazione del sottofondo, un adesivo sbagliato o carta e rete tra tessera e adesivo. Con JointPoint in mezzo non c’è nulla."],
    ["Quanto dura la consegna?", "Secondo Ezarri, il 95% dei mosaici è disponibile a magazzino e gli ordini vengono preparati in 24–48 ore. Vi indichiamo la data di consegna a Lochau o da voi con l’offerta."],
    ["Quali formati esistono?", "Quadrato 25 mm e 50 mm, Hexa da 33,4 × 33,4 mm, più i pezzi speciali Corner e Cove. I formati di ogni mosaico sono indicati nella sua pagina."],
    ["Dove posso vedere i campioni?", "Da noi nello showroom-caffè di Lochau. Scegliete fino a sei mosaici, ordiniamo i campioni per il vostro appuntamento."],
    ["Come acquistare mosaico Ezarri da noi", "Ezarri non vende direttamente ai privati. Da Platzhirsch ricevete consulenza, campioni, calcolo delle quantità e offerta. Inviateci la vostra selezione o un link del configuratore."],
    ["La disponibilità è visibile online?", "Ezarri mostra le giacenze solo sul proprio sito. Verifichiamo la quantità per il vostro progetto con l’offerta."],
  ],
});

export const DOWNLOADS = Object.freeze({
  crumb: "Download",
  title: "Schede tecniche e certificati",
  seoTitle: "Schede tecniche e certificati Ezarri (PDF)",
  description: "Tutte le schede tecniche Ezarri per collezione, ISO 9001, ISO 14021 e la garanzia in PDF. Cataloghi su richiesta presso il nostro showroom a Lochau.",
  lead: "I PDF provengono da Ezarri. Le schede tecniche sono in inglese.",
  datenblaetter: "Schede tecniche per collezione",
  zertifikate: "Certificati e garanzia",
  alt: "Schede tecniche di collezioni precedenti",
  altHinweis: "Ezarri non presenta più queste collezioni sul suo sito.",
  kataloge: { title: "Cataloghi", text: "Ezarri fornisce i suoi otto cataloghi (tra cui Pool & Home, Gea, Terrazzo, Gold, Aquarelle, Gemma) solo su richiesta.", link: "Richiedere un catalogo (in inglese)" },
  quelleLink: "Originale sul sito Ezarri",
  zertifikatListe: [
    { datei: "calidad_de_ISO9001.pdf", title: "Gestione della qualità ISO 9001", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/calidad/de/ISO9001.pdf" },
    { datei: "medioambientales_de_ISO-14021.pdf", title: "ISO 14021, quota di vetro riciclato", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/medioambientales/de/ISO-14021.pdf" },
    { datei: "certificaciones_garantia-mosaicos_Ezarri_-_Warranty_on_mosaics_-_EN-2025.pdf", title: "Garanzia sui mosaici (2025)", sprache: "englisch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/garantia-mosaicos/Ezarri%20-%20Warranty%20on%20mosaics%20-%20EN-2025.pdf" },
  ],
});

export const SCHLUSS = Object.freeze({
  title: "Vedere i campioni, progettare la vasca",
  text: "Nello showroom-caffè di Lochau disponiamo i mosaici uno accanto all’altro e calcoliamo la quantità per il vostro progetto.",
  primary: "Richiedere un appuntamento",
  secondary: "Richiedere campioni",
});

/** Etichette per tipo, superficie ecc. (visualizzazione, non id dei filtri). */
export const TYP_LABEL = Object.freeze({ mosaik: "Mosaico", "safe-step": "Safe-Step, antiscivolo", corner: "Corner, spigolo esterno", cove: "Cove, sguscia" });
export const LINIE_LABEL = Object.freeze({ Premium: "Premium", Classic: "Classic", Custom: "Custom" });

/** Testi alternativi (concept §6.3). */
export const alt = {
  mosaik: (name, format, oberflaeche) => ["Ezarri " + name, format ? `mosaico di vetro ${format}` : "mosaico di vetro", oberflaeche].filter(Boolean).join(", "),
  anwendung: (name, wasser) => [name ? `Progetto con Ezarri ${name}` : "Progetto con mosaico di vetro Ezarri", wasser].filter(Boolean).join(", "),
};
