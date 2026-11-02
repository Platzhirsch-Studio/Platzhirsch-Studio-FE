// Italienische Ebene über dem Yacht-Ansichtsmodell (src/lib/yacht/model.js →
// buildConcepts) für /it/yacht-interior (01.11.2026). Gleiche Form wie
// concepts-en.js (MODEL, ZONES, CONCEPTS, RENDERS); Produkte, Eignung und
// Regeln bleiben in concepts.json/renders.json (Mastertext Deutsch).
// Produkt-IDs (Schlüssel) sind Herstellernamen und bleiben unverändert.
// Höflichkeitsform „voi“ wie auf den übrigen IT-Seiten. Reines Modul.

const MODEL = {
  kiLabel: "Visualizzazione concettuale generata con l’IA",
  renderLabel: "Visualizzazione (rendering)",
  badge: "Concept di esempio – non un progetto di clienti",
  eignungShort: {
    "aussen-marine-hersteller": "Esterno · il produttore indica lo yachting",
    "aussen-katalog": "Esterno · da catalogo",
    "innen-lose": "Interno · arredo mobile",
  },
  eignungRule: {
    "aussen-marine-hersteller":
      "Il produttore indica in generale l’uso nautico o nello yachting per il proprio marchio. Uso a bordo di questo modello, fissaggio e peso vengono chiariti per iscritto con produttore e cantiere prima dell’offerta.",
    "aussen-katalog":
      "Indicato come outdoor nel catalogo. Per rimessa, pontile, terrazza sul lago e terrazza della houseboat. A bordo solo dopo approvazione scritta del produttore.",
    "innen-lose": "Arredo per la casa. Solo sottocoperta, appoggiato liberamente, all’asciutto, non in ambienti umidi. Nessun fissaggio da parte di Platzhirsch.",
  },
  openZoneException: {
    "In Vitro Unplugged": "Lampada a batteria mobile all’ormeggio – non durante la navigazione.",
  },
  renderNotes: {
    "segelyacht-nordwind-deck": "Nell’immagine l’attrezzatura velica è semplificata.",
  },
};

const ZONES = {
  deck: { label: "Coperta e pozzetto", short: "Coperta", text: "Cuscini del pozzetto, tavolo, ombreggiatura, arredi di coperta mobili." },
  flybridge: { label: "Flybridge", short: "Flybridge", text: "Prendisole, lounge, bar, ombrellone – il soggiorno a cielo aperto." },
  salon: { label: "Salone", short: "Salone", text: "Cuscini delle sedute, rivestimenti, tende, lampade a batteria, plaid." },
  kabine: { label: "Cabina", short: "Cabina", text: "Topper per la cuccetta, biancheria da letto, coperte, luce da lettura." },
  bad: { label: "Bagno", short: "Bagno", text: "Asciugamani, tessili, contenitori – solo mobili e resistenti all’umidità." },
  badeplattform: { label: "Plancetta di poppa", short: "Plancetta", text: "Uscendo dall’acqua: asciugamani, tappetino, cuscino prendisole a poppa." },
  bootshaus: { label: "Pontile e rimessa", short: "Pontile", text: "A terra, non a bordo: lounge, ombra, calore all’ormeggio. Nel modello 3D come pontile accanto alla barca." },
};

const CONCEPTS = {
  "runabout-mahagoni": {
    boatType: "Runabout in legno del lago di Costanza",
    length: "8⁠–⁠10 m",
    area: "Lago di Costanza",
    title: "Mogano e lino",
    motto: "Una serata sul lago in cui brilla solo il legno.",
    mood: "Luce della sera sul Pfänder, legno verniciato, pelle color crema, un plaid per il rientro. Classico, sobrio, senza accenti cromati.",
    palette: [
      ["Mogano verniciato", "Scafo, coperta"],
      ["Pelle avorio", "Cuscini"],
      ["Verde lago", "Accento dei cuscini"],
      ["Ottone spazzolato", "Ferramenta, solo come filo"],
      ["Crepuscolo", "Sfondo, notte"],
    ],
    materials: [
      ["Mogano verniciato", "Esistente, restaurato dal cantiere", "Lavori sul legno solo da parte del cantiere o del maestro d’ascia"],
      ["Similpelle nautica avorio", "Divanetto e cuscino prendisole", "Realizzato dal tappezziere nautico; richiedere la scheda tecnica su UV e infiammabilità"],
      ["Tessuto acrilico tinto in massa", "Telo copribarca, cuscini", "Colore dalla cartella campioni, scheda tecnica del produttore"],
      ["Plaid in cashmere", "Mobile, riposto all’asciutto dopo l’uscita", "Tessile per la casa"],
    ],
    zones: {
      deck: "Nuovi cuscini di seduta e schienale in avorio con profilo verde lago; telo copribarca nel tono del legno.",
      badeplattform: "Cuscino prendisole sul cofano motore (dove la barca lo consente), un set di asciugamani nel gavone.",
      bootshaus: "Un lounge sul pontile per l’arrivo – il vero progetto d’arredo con i runabout.",
    },
    products: {
      Luberon: ["Plaid per l’uscita serale", "Tessile per la casa: solo mobile, riposto all’asciutto dopo l’uscita"],
      "In Vitro Unplugged": ["Lampada a batteria per la serata all’ormeggio", "Mobile, non durante la navigazione; verificare il grado di protezione nella scheda tecnica"],
      "JAZZ lounger": ["Lettino sul pontile", null],
      "Versa UX": ["Ombra sul pontile", "Ancoraggio a terra da parte di un’azienda specializzata"],
      "Bleau Round Side Table": ["Tavolino sul pontile", null],
    },
    sattler: ["Rilievo e realizzazione dei cuscini di seduta e schienale", "Telo copribarca nel tono del legno"],
    werft: ["Verniciatura del legno", "Punti di fissaggio dei cuscini", "Approvazione del peso"],
  },
  "daycruiser-seelicht": {
    boatType: "Day cruiser del lago di Costanza con cabina",
    length: "9⁠–⁠12 m",
    area: "Lago di Costanza",
    title: "Luce di lago",
    motto: "Di giorno una baia per il bagno, di notte una cabina – un solo concept di colori per entrambi.",
    mood: "Lino chiaro, teak color sabbia, un tocco di verde lago. Luce di mezzogiorno sull’acqua, luce calda sottocoperta la sera.",
    palette: [
      ["Carta", "Cuscini, rivestimenti"],
      ["Teak naturale", "Coperta, tavolo"],
      ["Lino", "Tende, cuscini"],
      ["Lago", "Accento"],
      ["Inchiostro", "Profili, scritte"],
    ],
    materials: [
      ["Teak", "Esistente nel pozzetto e sulla plancetta", "Manutenzione da parte del cantiere"],
      ["Tessuto outdoor chiaro", "Cuscini del pozzetto e prendisole", "Realizzati dal tappezziere, espanso a cellule aperte"],
      ["Tessuto outdoor effetto lino", "Cuscini del salone", "Rivestimenti sfoderabili"],
      ["Raso di cotone", "Biancheria della cuccetta di prua", "Tessile per la casa"],
    ],
    zones: {
      deck: "Cuscini chiari del pozzetto con profilo scuro, una copertura per il tavolo, tavolini mobili in porto.",
      badeplattform: "Set di asciugamani, cuscino prendisole a poppa.",
      salon: "Cuscini di seduta rivestiti di nuovo, un plaid, una lampada a batteria sul tavolo.",
      kabine: "Topper su misura per la cuccetta, biancheria da letto, coperta.",
      bad: "Asciugamani e contenitori mobili.",
    },
    products: {
      "Bleau Stacking Side Table": ["Tavolino nel pozzetto (solo in porto)", "Impilabile; riporlo durante la navigazione"],
      Wadi: ["Tappeto outdoor nel pozzetto all’ormeggio", "Concordare con il cantiere le proprietà antiscivolo"],
      "Bellhop Unplugged": ["Lampada da tavolo a batteria", null],
      'Libra "Throw"': ["Plaid", null],
      "Matratzenauflage Riviera": ["Topper sulla cuccetta", "Forma della cuccetta: chiedere al produttore una misura speciale"],
      "Laken aus Baumwollsatin": ["Biancheria da letto", null],
      Moltrasio: ["Coperta", null],
    },
    sattler: ["Cuscini del pozzetto e prendisole", "Nuovo rivestimento dei cuscini del salone", "Materasso della cuccetta su sagoma"],
    werft: ["Manutenzione del teak", "Fissaggi", "Impianto elettrico (nessuna luce fissa da parte di Platzhirsch)"],
  },
  "segelyacht-nordwind": {
    boatType: "Barca a vela",
    length: "12⁠–⁠16 m",
    area: "Lago di Costanza e Adriatico",
    title: "Vento del nord",
    motto: "Quiete sottocoperta, resistenza alle intemperie in coperta – tessili che reggono sbandamento e umidità.",
    mood: "Grigio-blu freddo, bianco lana, legno spazzolato. Nordico ed essenziale – ogni cosa ha il suo posto e nulla scivola.",
    palette: [
      ["Bianco lana", "Cuscini"],
      ["Grigio fiordo", "Rivestimenti"],
      ["Rovere chiaro", "Arredi in legno esistenti"],
      ["Blu tempesta", "Cuscini, telo copribarca"],
      ["Pietra", "Tende"],
    ],
    materials: [
      ["Tessuto nautico grigio-blu da tappezzeria", "Divanetti del salone", "Tappezziere, rivestimenti con cerniera"],
      ["Espanso a freddo con drenaggio", "Cuscini del pozzetto", "Tappezziere"],
      ["Lana e cashmere", "Plaid mobili", "Tenere all’asciutto"],
      ["Raso di cotone", "Cabina di poppa", "Tessile per la casa"],
    ],
    zones: {
      deck: "Cuscini del pozzetto con drenaggio, sprayhood e bimini nel tono del telo copribarca (tappezziere).",
      salon: "Divanetti rivestiti di nuovo, cuscini, tende agli oblò, una lampada a batteria con baricentro basso.",
      kabine: "Cabina armatoriale e cabina ospiti: topper, biancheria da letto, coperte.",
      bad: "Asciugamani, contenitori, niente di fragile.",
    },
    products: {
      "Bon Jour Unplugged": ["Lampada da tavolo a batteria (solo in porto o alla fonda)", "Fissare o riporre durante la navigazione"],
      'Andersen "Throw"': ["Plaid", null],
      "Matratzenauflage Seine": ["Topper per la cuccetta", "Chiedere una misura speciale"],
      Snow: ["Biancheria da letto", null],
      "Region - decor": ["Coperta o cuscino", null],
      "Bleau Stacking Side Table": ["Tavolino alla fonda", "Non sotto vela; riporlo"],
    },
    sattler: ["Cuscini del pozzetto", "Rivestimenti del salone", "Sprayhood, bimini, telo copribarca"],
    werft: ["Attrezzatura e accessori di coperta", "Fissaggi", "Impianto elettrico"],
  },
  "motoryacht-riviera": {
    boatType: "Motoryacht nel Mediterraneo",
    length: "20⁠–⁠30 m",
    area: "Adriatico / Mediterraneo",
    title: "Sera in Riviera",
    motto: "Il flybridge come terrazza, il salone come soggiorno – come a casa sul lago, solo al mare.",
    mood: "Sabbia, terracotta e tabacco. Morbidi lounge outdoor sopra, living italiano nel salone, raso di cotone nella cabina armatoriale.",
    palette: [
      ["Sabbia", "Cuscini del lounge"],
      ["Terracotta", "Cuscini, accento del tappeto"],
      ["Tabacco", "Legno, pelle"],
      ["Noce", "Arredi del salone"],
      ["Carta", "Biancheria da letto, coperte"],
    ],
    materials: [
      ["Intreccio e tessuto outdoor", "Lounge del flybridge", "Confermare con il produttore l’uso a bordo per ogni modello"],
      ["Teak", "Ponte di poppa (esistente)", "Cantiere"],
      ["Tessuti da tappezzeria, bouclé, pelle", "Salone", "Solo all’interno; mobili appoggiati dopo l’approvazione di peso e fissaggio da parte del cantiere"],
      ["Raso di cotone, cashmere", "Cabina armatoriale", "Tessile per la casa"],
    ],
    zones: {
      flybridge: "Divano lounge, tavolo da pranzo e lettini da collezioni outdoor; ombreggiatura solo d’intesa con il cantiere.",
      deck: "Ponte di poppa: tavolo da pranzo con sedie, tappeto, lampade a batteria.",
      salon: "Divano, tavolino, tappeto e plaid della collezione indoor – mobili, fissati dal cantiere.",
      kabine: "Cabina armatoriale con biancheria da letto, coperte, topper.",
      bad: "Asciugamani e tessili.",
      badeplattform: "Lettini e asciugamani per il momento beach club a poppa.",
    },
    products: {
      "Portofino Outdoor Sofa": ["Divano lounge", null],
      "Portofino Outdoor Table": ["Tavolo da pranzo", null],
      Baia: ["Lettino prendisole", null],
      "Bleau Barstool": ["Sgabello al bar del flybridge", null],
      Asira: ["Tappeto outdoor sul ponte di poppa", "Concordare con il cantiere le proprietà antiscivolo"],
      "In Vitro Unplugged": ["Lampada a batteria per la sera", null],
      "Bleau Double Sun Lounge": ["Lettino doppio a poppa", null],
      "Lido (Sofas)": ["Sedute nel salone – collezione Lido, divano o poltrona", "Peso e fissaggio a cura del cantiere"],
      "Libra Coffee Table": ["Tavolino", "Fissato dal cantiere"],
      Wisp: ["Tappeto", "Antiscivolo"],
      Cachemire: ["Plaid", null],
      'Freeman "Duvet"': ["Piumino per la cabina armatoriale", null],
      "Laken aus Baumwollsatin": ["Biancheria da letto", null],
      "Matratzenauflage Riviera": ["Topper per materasso", "Chiedere una misura speciale"],
    },
    sattler: ["Cuscini prendisole a prua", "Rivestimenti delle sedute fisse", "Bimini e telo copribarca"],
    werft: ["Approvazione di peso e stabilità", "Fissaggio degli arredi in coperta e nel salone", "Fissaggio di ombrellone e bimini", "Impianto elettrico, illuminazione fissa"],
  },
  "bootshaus-ufer": {
    boatType: "Houseboat e rimessa",
    length: "Rimessa con pontile, houseboat come casa galleggiante",
    area: "Sponda del lago di Costanza",
    title: "In riva",
    motto: "Dove dorme la barca, comincia la serata: lounge, calore e luce in riva all’acqua.",
    mood: "Legno, pietra, luce sull’acqua. Ampi lounge, un grande tavolo, calore per le lunghe serate di settembre.",
    palette: [
      ["Larice invecchiato", "Facciata, pontile"],
      ["Pietra", "Cuscini"],
      ["Teak", "Tavolo"],
      ["Lago", "Cuscini, accento"],
      ["Inchiostro profondo", "Acciaio, notte"],
    ],
    materials: [
      ["Teak e alluminio", "Tavolo, lettini", "Outdoor da catalogo"],
      ["Tessuto outdoor", "Cuscini del lounge", "Rivestimenti sfoderabili; d’inverno riporre all’asciutto"],
      ["Intreccio", "Canopy, poltrone", "Outdoor da catalogo"],
      ["Rovere, pelle di pecora", "Interni della houseboat", "Arredi per la casa, solo all’interno"],
    ],
    zones: {
      deck: "Pontile e terrazza: lounge, tavolo da pranzo, ombrellone, riscaldatore.",
      salon: "Interni della houseboat: tavolo da pranzo, poltrone, tappeto, lampade a batteria.",
      kabine: "Una zona notte come in un piccolo appartamento.",
      badeplattform: "Gradini verso l’acqua: lettino, asciugamani, una lampada.",
    },
    products: {
      "PLATEAU Arrangement A1": ["Gruppo lounge sulla terrazza", null],
      "CHARLIE Teak Dining Table": ["Tavolo da pranzo in riva all’acqua", null],
      Ketch: ["Elemento lounge", null],
      "Belvedere Canopy": ["Lettino con canopy", null],
      "Eclipsum UX": ["Ombrellone", "Ancoraggio da parte di un’azienda specializzata"],
      "Dome Pendant": ["Riscaldatore", "Allacciamento elettrico da parte di un elettricista"],
      "IC F1 Outdoor H 1350 mm": ["Lampada da terra outdoor", "Allacciamento da parte di un elettricista"],
      "FOXX Lounger": ["Lettino in riva all’acqua", null],
      "Arc Dining Table, Ø120 - Coffee Black Oak": ["Tavolo da pranzo nella houseboat", null],
      "Toe Armchair, Flat - Sheepskin": ["Poltrona", null],
      "Tatou Floor": ["Lampada da terra", "Solo all’interno, allacciamento alla rete"],
    },
    sattler: ["Cuscini per i divanetti fissi della rimessa (se desiderato)"],
    werft: ["Houseboat: struttura, impianto elettrico e gas solo da parte del cantiere o di un’azienda specializzata"],
    gartenbau: ["Progettazione del giardino ed esecuzione da parte di aziende abilitate; Platzhirsch coordina le date"],
  },
};

const RENDERS = {
  "runabout-mahagoni-deck": [
    "Mogano e lino – pozzetto",
    "Pozzetto di un classico runabout in mogano con un divanetto avorio trapuntato in lunghezza e profilo scuro, un volante in legno e pagliolato in teak, dietro un lago calmo nella luce della sera",
  ],
  "runabout-mahagoni-steg": [
    "Mogano e lino – pontile",
    "Lettino in legno con cuscino crema e ombrellone in tessuto color sabbia su un pontile in legno, lago calmo e sponda boscosa in una calda luce serale",
  ],
  "daycruiser-seelicht-cockpit": [
    "Luce di lago – pozzetto",
    "Pozzetto coperto di un day cruiser con divano angolare bianco su base in legno, due poltrone bianche, cuscini a quadri verde petrolio, un tavolo in legno e un tappeto chiaro, oltre il lago con una cittadina e il suo campanile sotto un cielo coperto",
  ],
  "daycruiser-seelicht-kabine": [
    "Luce di lago – cabina",
    "Cabina di un day cruiser con letto matrimoniale in biancheria bianca, runner grigio-verde, cuscino a quadri verde petrolio e testiera imbottita scura davanti a una parete in rovere chiaro, due lampade da comodino, una stretta finestratura e un tappeto chiaro su pavimento in legno nella luce della sera",
  ],
  "daycruiser-seelicht-salon": [
    "Luce di lago – salone",
    "Salone di un day cruiser con divano bianco su base in legno chiaro, cuscini a quadri verde petrolio, due poltrone bianche su struttura in acciaio inox, un tavolino rotondo chiaro e un tappeto bianco, un’ampia finestratura con vista sul lago e una parete in rovere chiaro a destra alla luce del giorno",
  ],
  "segelyacht-nordwind-salon": [
    "Vento del nord – salone",
    "Salone di una barca a vela con divanetto a U grigio-blu, cuscini bianco lana e tavolo da pranzo in legno chiaro, luce dalle finestrature di scafo e coperta",
  ],
  "segelyacht-nordwind-deck": [
    "Vento del nord – in coperta",
    "Coperta di una barca a vela al tramonto con pagliolato in teak, cuscini blu petrolio e chiari davanti all’albero, una baia calma sullo sfondo",
  ],
  "motoryacht-riviera-flybridge": [
    "Sera in Riviera – flybridge",
    "Lounge coperto sul flybridge di un motoryacht con divano angolare bianco crema, due poltrone su base in legno scuro, cuscini a quadri color terracotta, un tavolo in legno e un tappeto terracotta, oltre un lago calmo e colline nella luce velata della sera",
  ],
  "motoryacht-riviera-salon": [
    "Sera in Riviera – salone",
    "Salone di un motoryacht con divano bianco crema su base scura, cuscini a quadri color terracotta, due poltrone su struttura in acciaio inox, un tavolino rotondo e un tappeto rosa terracotta, una lunga finestratura sul muro del porto e boiserie scura a destra nella luce della sera",
  ],
  "motoryacht-riviera-kabine": [
    "Sera in Riviera – cabina armatoriale",
    "Cabina armatoriale di un motoryacht con letto matrimoniale in biancheria bianca su base scura, runner e cuscino color terracotta, testiera imbottita davanti a una parete in legno scuro, due lampade da comodino e una stretta finestratura, un tappeto chiaro su pavimento in legno bruno-rossiccio",
  ],
  "bootshaus-ufer-terrasse": [
    "In riva – terrazza",
    "Moderna rimessa in legno su un lago di montagna al crepuscolo, una terrazza con un lounge basso grigio pietra, luce calda negli interni aperti, cime innevate sulla sponda opposta",
  ],
  "bootshaus-ufer-wohnraum": [
    "In riva – soggiorno",
    "Soggiorno di una houseboat con un divano grigio, due poltrone con pelli di pecora e un tavolino rotondo, vetrate a tutta altezza su un lago liscio come uno specchio",
  ],
};

/** Italienische Ebene (gleiche Form wie die englische in concepts-en.js). */
export const LAYER_IT = Object.freeze({ model: MODEL, zones: ZONES, concepts: CONCEPTS, renders: RENDERS });
