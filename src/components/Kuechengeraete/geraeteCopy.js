// src/components/Kuechengeraete/geraeteCopy.js
// Inhaber-Entscheidung Nr. 18: Texte der Seite /<locale>/kuechengeraete
// („Geräte, die wir einplanen“). Vorschlag für src/messages/*.json unter
// kuechengeraete.* in Marktresearch/digital/features/geraete-messages.json –
// bis zur Übernahme liest geraeteText() zuerst die Messages (t.has) und fällt
// sonst auf diese Tabelle zurück.
//
// Wortregeln (Verstoß = unbrauchbar, geprüft in tests/unit/kuechengeraete.test.mjs):
// Inhaber-Entscheidung Nr. 24 (31.10.2026): Platzhirsch ist Händler der sechs
// Marken – der Händlersatz kommt aber NUR aus dem Claim-Register
// (dealerStatementList/dealerStatement in src/lib/legal/claims.js) und steht
// deshalb NICHT in diesen Texten. Hier weiterhin kein Händler-/Partner-/
// „offiziell“-/„autorisiert“-Wort, keine Superlative, keine Preise, keine
// Kennzahlen, keine Referenzen oder Zitate, KEINE Aussage, dass Geräte im
// Showroom stehen. Sie-Form, ruhig. alt.<marke> = Alt-Text des Herstellerbilds
// (nur für Marken mit Bild, src/lib/kueche/geraete.js).
// Keine "@/..."-Importe (node --test).

export const GERAETE_TEXT = {
  de: {
    meta: {
      title: "Gaggenau, Miele, BORA & Quooker in Vorarlberg | Platzhirsch",
      description:
        "Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker bei Platzhirsch in Lochau: in Ihre Küche eingeplant, geliefert und montiert.",
    },
    crumbKueche: "Küchen",
    crumb: "Küchengeräte",
    eyebrow: "Küchenplanung · Lochau",
    title: "Einbaugeräte von Gaggenau bis Quooker",
    lead: "Backofen, Kochfeld, Kühlen, Spülen und Wasser gehören von Anfang an zur Planung. Geräte von Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker beziehen Sie bei uns – in Ihre Küche eingeplant, geliefert und montiert aus einer Hand.",
    planerCta: "In meine Küchenplanung aufnehmen",
    beratungCta: "Beratung anfragen",
    german: "auf Deutsch",
    jumpLabel: "Marken auf dieser Seite",
    marken: {
      eyebrow: "Sechs Marken",
      title: "Ausgewählt für die Planung",
      text: "Welche Geräte zu Ihrer Küche passen, hängt davon ab, wie Sie kochen und wie der Raum genutzt wird. Geräte dieser Marken liefern wir und stimmen sie in der Planung mit Fronten, Nischen und Anschlüssen ab.",
    },
    herkunft: "Herkunft",
    gruppenLabel: "Produktgruppen",
    gruppen: {
      backofen: "Backöfen",
      dampfgarer: "Dampfgarer",
      kochfeld: "Kochfelder",
      weinklima: "Weinklimageräte",
      einbau: "Einbaugeräte",
      geschirrspueler: "Geschirrspüler",
      kuehlen: "Kühlgeräte",
      gefrieren: "Gefriergeräte",
      kochfeldAbzug: "Kochfelder mit integriertem Abzug nach unten",
      kochendWasser: "Armatur für kochendes Wasser",
    },
    laender: { DE: "Deutschland", CH: "Schweiz", NL: "Niederlande" },
    marke: {
      gaggenau: { text: "Backöfen, Dampfgarer, Kochfelder und Weinklimageräte aus Deutschland. Wir planen sie so ein, dass Höhen, Fugen und Fronten zur übrigen Küche passen." },
      miele: { text: "Einbaugeräte aus Deutschland, vom Geschirrspüler bis zum Dampfgarer. In der Planung achten wir auf Arbeitshöhen, Laufwege und den Platz rund um die Spüle." },
      vzug: { text: "Dampfgarer, Backöfen und Kühlgeräte aus der Schweiz. Nischen, Anschlüsse und Bedienhöhe stimmen wir mit Ihnen gemeinsam ab." },
      bora: { text: "Kochfelder mit integriertem Abzug, der den Dunst nach unten zieht. Über dem Kochfeld bleibt der Raum frei – das verändert, wie wir Kochinsel und Oberschränke planen." },
      liebherr: { text: "Kühl-, Gefrier- und Weinklimageräte. Wir klären mit Ihnen, ob sie hinter Möbelfronten verschwinden oder bewusst sichtbar bleiben, und planen Platz und Lüftung ein." },
      quooker: { text: "Eine Armatur aus den Niederlanden, die neben kaltem und warmem auch kochendes Wasser liefert. Den Platz im Unterschrank und den Anschluss planen wir mit ein." },
    },
    ablauf: {
      eyebrow: "So planen wir Geräte ein",
      title: "Technik, die zur Gestaltung passt",
      step1Title: "Im Gespräch",
      step1Text: "Wir fragen, wie Sie kochen, wie viele Personen mitessen und was Ihnen im Alltag wichtig ist. Daraus ergibt sich, welche Geräte in Ihre Küche gehören.",
      step2Title: "Von Hand gezeichnet",
      step2Text: "Harald Menghin zeichnet Ihre Küche zuerst von Hand: Wege, Arbeitsdreieck, Stauraum und Licht – und dabei den Platz für jedes Gerät.",
      step3Title: "Geplant, geliefert, montiert",
      step3Text: "In der 3D-Planung kommen Maße und Anschlüsse dazu. Geräte und Küche liefern und montieren wir aus einer Hand.",
      kueche: "Die Geräte fügen sich in die Küchen ein, die wir planen – etwa von next125 (Schüller) oder Poliform.",
      tausch: "Ihre Küche bleibt, ein Gerät soll neu? Wir liefern und montieren Geräte dieser Marken auch einzeln – etwa zum Tausch in Ihrer bestehenden Küche. Bringen Sie die Maße der Nische oder das bisherige Modell mit.",
      schauraum: "In unserem Showroom in Lochau stehen mehrere Schauküchen mit Geräten einiger dieser Marken. Welche Sie dort sehen, sagen wir Ihnen gern vor Ihrem Besuch.",
      kuecheLink: "Mehr zur Küchenplanung",
      armaturen: "Küchenarmaturen planen wir mit Dornbracht ein.",
      armaturenLink: "Dornbracht auf der Seite Bad & Wellness",
    },
    bildQuelle: "Bild: {marke}",
    alt: {
      gaggenau: "Gaggenau: Einbau-Backofen in Edelstahl, flächenbündig in eine grüne Marmorwand eingelassen",
      liebherr: "Liebherr: drei Einbau-Kühl-Gefrierkombinationen mit geöffneten Türen in einer dunkelblauen Schrankwand",
      quooker: "Quooker: Armatur Fusion Round in Edelstahl an einer Kücheninsel mit Holzarbeitsplatte",
    },
    hinweis: {
      title: "Gut zu wissen",
      preise: "Online zeigen wir keine Preise. Geräte und Ausführung stellen wir nach der Planung in Ihrem Angebot zusammen.",
      // QM R1: Katalog zeigt Herstellerpreise (Inhaber-Entscheidungen Nr. 26/27/34) – der alte Satz
      // „keine Preise online“ widersprach den Kacheln. Eigener Schlüssel (nicht in den Messages).
      preiseKatalog: "Bei einzelnen Geräten im Katalog nennen wir den Herstellerpreis zur Orientierung. Ihren Preis mit Lieferung, Einbau und Montage stellen wir nach der Planung in Ihrem Angebot zusammen.",
      marken: "Die genannten Namen sind Marken ihrer jeweiligen Inhaber. Die Produktbilder stammen von den Herstellern.",
    },
    closing: {
      title: "Planen wir Ihre Küche samt Geräten",
      text: "Bringen Sie Grundriss oder Maße mit – wir besprechen Küche und Geräte gemeinsam im Studio in Lochau.",
    },
    schemaName: "Küchengeräte bei Platzhirsch Home Living",
  },
  en: {
    meta: {
      title: "Gaggenau, Miele, BORA & Quooker appliances | Platzhirsch",
      description:
        "Gaggenau, Miele, V-ZUG, BORA, Liebherr and Quooker at Platzhirsch in Lochau: planned into your kitchen, delivered and installed.",
    },
    crumbKueche: "Kitchens",
    crumb: "Kitchen appliances",
    eyebrow: "Kitchen planning · Lochau",
    title: "Built-in appliances from Gaggenau to Quooker",
    lead: "Oven, hob, cooling, dishwashing and water are part of the plan from the start. You can get appliances from Gaggenau, Miele, V-ZUG, BORA, Liebherr and Quooker through us – planned into your kitchen, delivered and installed from one source.",
    planerCta: "Add to my kitchen plan",
    beratungCta: "Request a consultation",
    german: "in German",
    jumpLabel: "Brands on this page",
    marken: {
      eyebrow: "Six brands",
      title: "Selected for planning",
      text: "Which appliances suit your kitchen depends on how you cook and how the room is used. We supply appliances from these brands and match them to fronts, niches and connections in the plan.",
    },
    herkunft: "Origin",
    gruppenLabel: "Product groups",
    gruppen: {
      backofen: "Ovens",
      dampfgarer: "Steam ovens",
      kochfeld: "Hobs",
      weinklima: "Wine climate cabinets",
      einbau: "Built-in appliances",
      geschirrspueler: "Dishwashers",
      kuehlen: "Refrigerators",
      gefrieren: "Freezers",
      kochfeldAbzug: "Hobs with integrated downdraft extraction",
      kochendWasser: "Boiling-water tap",
    },
    laender: { DE: "Germany", CH: "Switzerland", NL: "Netherlands" },
    marke: {
      gaggenau: { text: "Ovens, steam ovens, hobs and wine climate cabinets from Germany. We plan them so that heights, gaps and fronts match the rest of the kitchen." },
      miele: { text: "Built-in appliances from Germany, from the dishwasher to the steam oven. In the plan we pay attention to working heights, walkways and the space around the sink." },
      vzug: { text: "Steam ovens, ovens and refrigerators from Switzerland. We agree niches, connections and operating height together with you." },
      bora: { text: "Hobs with integrated extraction that draws the vapour downwards. The space above the hob stays free – this changes how we plan the island and the wall cabinets." },
      liebherr: { text: "Refrigerators, freezers and wine climate cabinets. We decide with you whether they disappear behind furniture fronts or stay deliberately visible, and plan space and ventilation." },
      quooker: { text: "A tap from the Netherlands that delivers boiling water alongside cold and hot. We plan the space in the base cabinet and the connection." },
    },
    ablauf: {
      eyebrow: "How we plan appliances in",
      title: "Technology that fits the design",
      step1Title: "In conversation",
      step1Text: "We ask how you cook, how many people eat with you and what matters to you day to day. This shows which appliances belong in your kitchen.",
      step2Title: "Drawn by hand",
      step2Text: "Harald Menghin first draws your kitchen by hand: walkways, work triangle, storage and light – and the space for every appliance.",
      step3Title: "Planned, delivered, installed",
      step3Text: "The 3D plan adds exact dimensions and connections. We deliver and install appliances and kitchen from one source.",
      kueche: "The appliances fit into the kitchens we plan – for example from next125 (Schüller) or Poliform.",
      tausch: "Keeping your kitchen but replacing an appliance? We also supply and install appliances from these brands on their own – for example as a replacement in your existing kitchen. Just bring the niche dimensions or your current model.",
      schauraum: "Our showroom in Lochau has several display kitchens with appliances from some of these brands. We are happy to tell you before your visit which ones you will see there.",
      kuecheLink: "More on kitchen planning",
      armaturen: "We plan kitchen taps by Dornbracht into the design.",
      armaturenLink: "Dornbracht on the bath & wellness page",
    },
    bildQuelle: "Image: {marke}",
    alt: {
      gaggenau: "Gaggenau: built-in stainless steel oven set flush into a green marble wall",
      liebherr: "Liebherr: three built-in fridge-freezers with open doors in a dark blue run of tall cabinets",
      quooker: "Quooker: Fusion Round tap in stainless steel on a kitchen island with a wooden worktop",
    },
    hinweis: {
      title: "Good to know",
      preise: "We do not show prices online. We put appliances and specification together in your quote after the planning.",
      // QM R1: Katalog zeigt Herstellerpreise (Inhaber-Entscheidungen Nr. 26/27/34) – der alte Satz
      // „keine Preise online“ widersprach den Kacheln. Eigener Schlüssel (nicht in den Messages).
      preiseKatalog: "For some appliances in the catalogue we state the manufacturer’s price as a guide. Your price including delivery, installation and fitting follows in your quote after the planning.",
      marken: "The names mentioned are trademarks of their respective owners. The product images are provided by the manufacturers.",
    },
    closing: {
      title: "Let us plan your kitchen, appliances included",
      text: "Bring a floor plan or measurements – we discuss kitchen and appliances together at the studio in Lochau.",
    },
    schemaName: "Kitchen appliances at Platzhirsch Home Living",
  },
  fr: {
    meta: {
      title: "Gaggenau, Miele, BORA et Quooker à Lochau | Platzhirsch",
      description:
        "Gaggenau, Miele, V-ZUG, BORA, Liebherr et Quooker chez Platzhirsch à Lochau : intégrés à votre cuisine, livrés et montés.",
    },
    crumbKueche: "Cuisines",
    crumb: "Électroménager",
    eyebrow: "Conception de cuisine · Lochau",
    title: "Électroménager encastrable, de Gaggenau à Quooker",
    lead: "Four, table de cuisson, froid, lave-vaisselle et eau font partie du projet dès le départ. Les appareils Gaggenau, Miele, V-ZUG, BORA, Liebherr et Quooker, vous les obtenez chez nous – intégrés à votre cuisine, livrés et montés d’une seule main.",
    planerCta: "Ajouter à mon projet de cuisine",
    beratungCta: "Demander un conseil",
    german: "en allemand",
    jumpLabel: "Marques sur cette page",
    marken: {
      eyebrow: "Six marques",
      title: "Choisies pour la conception",
      text: "Les appareils qui conviennent à votre cuisine dépendent de votre façon de cuisiner et de l’usage de la pièce. Nous fournissons les appareils de ces marques et, dans le projet, les accordons aux façades, niches et raccordements.",
    },
    herkunft: "Origine",
    gruppenLabel: "Gammes de produits",
    gruppen: {
      backofen: "Fours",
      dampfgarer: "Fours vapeur",
      kochfeld: "Tables de cuisson",
      weinklima: "Caves à vin",
      einbau: "Appareils encastrables",
      geschirrspueler: "Lave-vaisselle",
      kuehlen: "Réfrigérateurs",
      gefrieren: "Congélateurs",
      kochfeldAbzug: "Tables de cuisson avec aspiration intégrée vers le bas",
      kochendWasser: "Robinet d’eau bouillante",
    },
    laender: { DE: "Allemagne", CH: "Suisse", NL: "Pays-Bas" },
    marke: {
      gaggenau: { text: "Fours, fours vapeur, tables de cuisson et caves à vin d’Allemagne. Nous les intégrons de sorte que hauteurs, joints et façades s’accordent avec le reste de la cuisine." },
      miele: { text: "Appareils encastrables d’Allemagne, du lave-vaisselle au four vapeur. Dans le projet, nous veillons aux hauteurs de travail, aux circulations et à l’espace autour de l’évier." },
      vzug: { text: "Fours vapeur, fours et réfrigérateurs de Suisse. Nous définissons avec vous niches, raccordements et hauteur d’utilisation." },
      bora: { text: "Tables de cuisson avec aspiration intégrée qui attire les vapeurs vers le bas. L’espace au-dessus de la table reste libre – cela change la conception de l’îlot et des meubles hauts." },
      liebherr: { text: "Réfrigérateurs, congélateurs et caves à vin. Nous décidons avec vous s’ils disparaissent derrière des façades de meubles ou restent visibles, et prévoyons place et ventilation." },
      quooker: { text: "Un robinet des Pays-Bas qui fournit de l’eau bouillante en plus de l’eau froide et chaude. Nous prévoyons la place dans le meuble bas et le raccordement." },
    },
    ablauf: {
      eyebrow: "Comment nous intégrons les appareils",
      title: "Une technique au service du design",
      step1Title: "En conversation",
      step1Text: "Nous vous demandons comment vous cuisinez, combien de personnes partagent vos repas et ce qui compte pour vous au quotidien. Les appareils adaptés en découlent.",
      step2Title: "Dessiné à la main",
      step2Text: "Harald Menghin dessine d’abord votre cuisine à la main : circulations, triangle de travail, rangements et lumière – et la place de chaque appareil.",
      step3Title: "Conçu, livré, monté",
      step3Text: "Le plan en 3D ajoute les dimensions exactes et les raccordements. Nous livrons et montons appareils et cuisine d’une seule main.",
      kueche: "Les appareils s’intègrent aux cuisines que nous concevons – par exemple de next125 (Schüller) ou de Poliform.",
      tausch: "Vous gardez votre cuisine mais souhaitez remplacer un appareil ? Nous livrons et installons aussi les appareils de ces marques séparément – par exemple en remplacement dans votre cuisine existante. Apportez simplement les dimensions de la niche ou le modèle actuel.",
      schauraum: "Notre showroom à Lochau compte plusieurs cuisines d’exposition avec des appareils de certaines de ces marques. Nous vous indiquons volontiers avant votre visite lesquels vous y verrez.",
      kuecheLink: "En savoir plus sur la conception",
      armaturen: "Nous intégrons les robinetteries de cuisine Dornbracht.",
      armaturenLink: "Dornbracht sur la page Bain & bien-être",
    },
    bildQuelle: "Image : {marke}",
    alt: {
      gaggenau: "Gaggenau : four encastrable en inox intégré à fleur dans un mur en marbre vert",
      liebherr: "Liebherr : trois réfrigérateurs-congélateurs encastrables, portes ouvertes, dans un mur d’armoires bleu foncé",
      quooker: "Quooker : robinet Fusion Round en inox sur un îlot de cuisine avec plan de travail en bois",
    },
    hinweis: {
      title: "Bon à savoir",
      preise: "Nous n’affichons pas de prix en ligne. Nous rassemblons appareils et finitions dans votre offre après la conception.",
      // QM R1: Katalog zeigt Herstellerpreise (Inhaber-Entscheidungen Nr. 26/27/34) – der alte Satz
      // „keine Preise online“ widersprach den Kacheln. Eigener Schlüssel (nicht in den Messages).
      preiseKatalog: "Pour certains appareils du catalogue, nous indiquons le prix du fabricant à titre indicatif. Votre prix avec livraison, encastrement et montage figure dans votre offre après la conception.",
      marken: "Les noms cités sont des marques de leurs propriétaires respectifs. Les images des produits proviennent des fabricants.",
    },
    closing: {
      title: "Concevons votre cuisine, appareils compris",
      text: "Apportez un plan ou des mesures – nous parlons ensemble de la cuisine et des appareils au studio de Lochau.",
    },
    schemaName: "Électroménager chez Platzhirsch Home Living",
  },
  it: {
    meta: {
      title: "Gaggenau, Miele, BORA e Quooker a Lochau | Platzhirsch",
      description:
        "Gaggenau, Miele, V-ZUG, BORA, Liebherr e Quooker da Platzhirsch a Lochau: inseriti nella vostra cucina, consegnati e montati.",
    },
    crumbKueche: "Cucine",
    crumb: "Elettrodomestici",
    eyebrow: "Progettazione cucine · Lochau",
    title: "Elettrodomestici da incasso, da Gaggenau a Quooker",
    lead: "Forno, piano cottura, frigorifero, lavastoviglie e acqua fanno parte del progetto fin dall’inizio. Gli elettrodomestici di Gaggenau, Miele, V-ZUG, BORA, Liebherr e Quooker li trovate da noi – inseriti nella vostra cucina, consegnati e montati a cura nostra.",
    planerCta: "Aggiungere al mio progetto di cucina",
    beratungCta: "Richiedere una consulenza",
    german: "in tedesco",
    jumpLabel: "Marchi in questa pagina",
    marken: {
      eyebrow: "Sei marchi",
      title: "Scelti per la progettazione",
      text: "Quali elettrodomestici sono adatti alla vostra cucina dipende da come cucinate e da come usate lo spazio. Forniamo gli elettrodomestici di questi marchi e nel progetto li accordiamo con frontali, nicchie e allacciamenti.",
    },
    herkunft: "Provenienza",
    gruppenLabel: "Gruppi di prodotti",
    gruppen: {
      backofen: "Forni",
      dampfgarer: "Forni a vapore",
      kochfeld: "Piani cottura",
      weinklima: "Cantinette per vino",
      einbau: "Elettrodomestici da incasso",
      geschirrspueler: "Lavastoviglie",
      kuehlen: "Frigoriferi",
      gefrieren: "Congelatori",
      kochfeldAbzug: "Piani cottura con aspirazione integrata verso il basso",
      kochendWasser: "Rubinetto per acqua bollente",
    },
    laender: { DE: "Germania", CH: "Svizzera", NL: "Paesi Bassi" },
    marke: {
      gaggenau: { text: "Forni, forni a vapore, piani cottura e cantinette per vino dalla Germania. Li progettiamo in modo che altezze, fughe e frontali si accordino con il resto della cucina." },
      miele: { text: "Elettrodomestici da incasso dalla Germania, dalla lavastoviglie al forno a vapore. Nel progetto curiamo altezze di lavoro, percorsi e lo spazio intorno al lavello." },
      vzug: { text: "Forni a vapore, forni e frigoriferi dalla Svizzera. Definiamo insieme a voi nicchie, allacciamenti e altezza d’uso." },
      bora: { text: "Piani cottura con aspirazione integrata che porta i vapori verso il basso. Lo spazio sopra il piano resta libero – questo cambia il modo in cui progettiamo isola e pensili." },
      liebherr: { text: "Frigoriferi, congelatori e cantinette per vino. Decidiamo con voi se scompaiono dietro i frontali dei mobili o restano volutamente visibili, e prevediamo spazio e ventilazione." },
      quooker: { text: "Un rubinetto dai Paesi Bassi che, oltre all’acqua fredda e calda, eroga acqua bollente. Prevediamo lo spazio nel mobile base e l’allacciamento." },
    },
    ablauf: {
      eyebrow: "Come inseriamo gli elettrodomestici",
      title: "Tecnica al servizio del design",
      step1Title: "Nel colloquio",
      step1Text: "Vi chiediamo come cucinate, quante persone mangiano con voi e che cosa conta nella vita di tutti i giorni. Da qui capiamo quali elettrodomestici servono alla vostra cucina.",
      step2Title: "Disegnato a mano",
      step2Text: "Harald Menghin disegna prima la vostra cucina a mano: percorsi, triangolo di lavoro, contenimento e luce – e lo spazio per ogni elettrodomestico.",
      step3Title: "Progettato, consegnato, montato",
      step3Text: "Il progetto in 3D aggiunge misure esatte e allacciamenti. Elettrodomestici e cucina li consegniamo e montiamo noi, insieme.",
      kueche: "Gli elettrodomestici si inseriscono nelle cucine che progettiamo – per esempio di next125 (Schüller) o Poliform.",
      tausch: "La cucina resta, ma un elettrodomestico va sostituito? Forniamo e montiamo gli elettrodomestici di questi marchi anche singolarmente – per esempio in sostituzione nella vostra cucina esistente. Portate le misure della nicchia o il modello attuale.",
      schauraum: "Nel nostro showroom a Lochau ci sono diverse cucine espositive con elettrodomestici di alcuni di questi marchi. Prima della vostra visita vi diciamo volentieri quali potrete vedere.",
      kuecheLink: "Di più sulla progettazione delle cucine",
      armaturen: "Pianifichiamo la rubinetteria da cucina Dornbracht.",
      armaturenLink: "Dornbracht nella pagina Bagno & benessere",
    },
    bildQuelle: "Immagine: {marke}",
    alt: {
      gaggenau: "Gaggenau: forno da incasso in acciaio inox inserito a filo in una parete di marmo verde",
      liebherr: "Liebherr: tre frigocongelatori da incasso con ante aperte in una parete di colonne blu scuro",
      quooker: "Quooker: rubinetto Fusion Round in acciaio inox su un’isola cucina con piano di lavoro in legno",
    },
    hinweis: {
      title: "Buono a sapersi",
      preise: "Online non mostriamo prezzi. Elettrodomestici ed esecuzione li riuniamo nella vostra offerta dopo la progettazione.",
      // QM R1: Katalog zeigt Herstellerpreise (Inhaber-Entscheidungen Nr. 26/27/34) – der alte Satz
      // „keine Preise online“ widersprach den Kacheln. Eigener Schlüssel (nicht in den Messages).
      preiseKatalog: "Per alcuni elettrodomestici del catalogo indichiamo il prezzo del produttore come orientamento. Il vostro prezzo con consegna, incasso e montaggio è nella vostra offerta dopo la progettazione.",
      marken: "I nomi citati sono marchi dei rispettivi titolari. Le immagini dei prodotti sono dei produttori.",
    },
    closing: {
      title: "Progettiamo la vostra cucina, elettrodomestici compresi",
      text: "Portate una pianta o le misure – parliamo insieme di cucina ed elettrodomestici nello studio di Lochau.",
    },
    schemaName: "Elettrodomestici da Platzhirsch Home Living",
  },
};

/** Wert unter "a.b.c" in einem Objekt (oder undefined). */
function pick(obj, key) {
  return String(key)
    .split(".")
    .reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

/**
 * Text der Seite: zuerst die Messages (kuechengeraete.<key>, sobald übernommen),
 * sonst die Tabelle der Sprache, sonst Deutsch.
 * @param {string} locale
 * @param {string} key   z. B. "marken.title" oder "marke.vzug.text"
 * @param {{has?: Function, raw?: Function}} [t]  next-intl-Übersetzer OHNE Namespace
 *   (useTranslations() / getTranslations({ locale })) – der Namespace
 *   "kuechengeraete" existiert vor der Übernahme noch nicht.
 */
export const GERAETE_NS = "kuechengeraete";

export function geraeteText(locale, key, t) {
  const full = `${GERAETE_NS}.${key}`;
  try {
    if (t && typeof t.has === "function" && t.has(full)) {
      const v = t.raw(full);
      if (typeof v === "string" && v) return v;
    }
  } catch {
    // Messages ohne diesen Schlüssel: Tabelle.
  }
  const v = pick(GERAETE_TEXT[locale] || GERAETE_TEXT.de, key);
  return typeof v === "string" ? v : pick(GERAETE_TEXT.de, key) ?? "";
}
