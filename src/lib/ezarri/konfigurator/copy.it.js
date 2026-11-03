// src/lib/ezarri/konfigurator/copy.it.js – testi italiani del configuratore Ezarri
// (01.11.2026). Stessa struttura di ./copy.js (fonte tedesca); al posto della
// funzione zusammenfassung() ci sono i modelli ZUSAMMENFASSUNG (oggetto
// serializzabile, passato dal server). Forma «voi», fatti invece di aggettivi,
// niente superlativi, niente prezzi. Dati del produttore: «secondo Ezarri».
// Per il Ticino e l’Italia. Virgolette «».
//
// UI     = testi di t("tedesco", "inglese") nei componenti, chiave = tedesco.
// UI_TPL = testi con variabili, chiave = 4° parametro di t(), {nome} = variabile.
// LISTEN = piccole tabelle dei componenti (angoli, pareti, tipi, legende, crediti).
//
// Puro: nessun import. Server, client e node --test.

export const SEITE = Object.freeze({
  crumb: "Configuratore",
  eyebrow: "Ezarri · configuratore",
  title: "Progettate la vostra vasca",
  lead: "Scegliete mosaico, miscela, fuga e forma della vasca e guardate l’acqua che ne risulta – in 3D, nel browser, senza registrazione.",
  metaTitle: "Configuratore piscina con mosaico Ezarri",
  metaDescription: "Progettare una vasca in 3D: misure e forma libere, ogni mosaico Ezarri, miscele, fughe, acqua e luce. Con quantità e scheda da stampare.",
  hinweisFarbe: "I colori a schermo sono un’approssimazione. Il vetro appare diverso alla luce del giorno e sott’acqua – guardate i campioni prima di decidere.",
  hinweisMessung: "Colori delle tessere misurati sulle foto prodotto di Ezarri; brillantezza e riflessi secondo il configuratore Ezarri.",
  hinweisDaten: "Le quantità sono una stima (fattori Ezarri, 10 % di scorta). La quantità vincolante la stabilisce il vostro piastrellista in base alla misurazione.",
  hinweisVerlegung: "La posa è affidata a un’impresa specializzata in piastrellatura.",
  linkUngueltig: "Il link non conteneva un progetto valido. Mostriamo il progetto iniziale.",
  hinweisBrowser: "Il configuratore calcola solo nel vostro browser. Non salva nulla sui nostri server; il progetto è contenuto nel link.",
  stand: "aggiornato al",
  planen: "Progettare la vasca con noi",
});

export const TABS = Object.freeze([
  { id: "mosaik", label: "Mosaico" },
  { id: "becken", label: "Vasca" },
  { id: "wasser", label: "Acqua e luce" },
  { id: "mengen", label: "Quantità" },
]);

export const MODI_LABEL = Object.freeze({
  mosaik: { label: "Un mosaico", sub: "una referenza Ezarri" },
  mix: { label: "Miscela personalizzata", sub: "fino a 4 mosaici con le loro quote" },
  rezept: { label: "Miscela Ezarri", sub: "ricette pronte, modificabili" },
  pattern: { label: "Trama di motivi", sub: "20 pattern Ezarri, 2⁠–⁠3 colori" },
});

export const SZENEN_LABEL = Object.freeze({
  pool: "Piscina",
  whirlpool: "Idromassaggio",
  bad: "Doccia e bagno",
  kueche: "Paraschizzi cucina",
});

export const FORM_LABEL = Object.freeze({
  rechteck: "Rettangolo",
  radius: "Angoli arrotondati",
  rund: "Estremità arrotondate",
  l: "Forma a L",
  kreis: "Rotonda",
  quadrat: "Quadrata",
  nische: "Nicchia doccia",
  rueckwand: "Superficie a parete",
});

export const TREPPE_LABEL = Object.freeze({
  roemisch: "Scala romana",
  eck: "Scala d’angolo",
  voll: "A tutta larghezza",
  keine: "Senza scala",
});

export const RAND_LABEL = Object.freeze({
  skimmer: { label: "Skimmer", sub: "acqua ca. 15 cm sotto il bordo" },
  ueberlauf: { label: "Canale sfioratore", sub: "acqua fino al bordo, canale perimetrale" },
  infinity: { label: "Bordo a sfioro", sub: "l’acqua tracima sul lato profondo" },
});

export const FORMAT_LABEL = Object.freeze({ 25: "25 mm", 50: "50 mm", hexa: "Hexa" });

export const WASSER_LABEL = Object.freeze({
  bewegt: "Mossa",
  ruhig: "Calma",
  leer: "Vuota",
});

export const WASSERTON_LABEL = Object.freeze({
  klar: { label: "Limpida", sub: "impianto a cloro o a sale, ben filtrata" },
  naturpool: { label: "Biopiscina", sub: "filtrazione biologica, più verde" },
  salz: { label: "Acqua di mare", sub: "tono un po’ più freddo" },
});

export const ZEIT_LABEL = Object.freeze({ morgen: "Mattina", mittag: "Mezzogiorno", abend: "Sera", nacht: "Notte" });

export const LED_LABEL = Object.freeze({ aus: "Spenta", weiss: "Bianca", warm: "Bianco caldo", blau: "Blu", tuerkis: "Turchese" });

export const LAGE_LABEL = Object.freeze({
  bahnen: "Segnacorsia sul fondo",
  wasserlinie: "Fascia sulla linea d’acqua",
  stufen: "Bordi dei gradini",
});

export const KAMERA_LABEL = Object.freeze({
  uebersicht: "Panoramica",
  treppe: "Scala",
  wasserlinie: "Linea d’acqua",
  unterwasser: "Sott’acqua",
  vogel: "Dall’alto",
  nah: "Primo piano",
});

export const MASSE_LABEL = Object.freeze({
  pool: { l: "Lunghezza", b: "Larghezza", tFlach: "Profondità minima", tTief: "Profondità massima" },
  whirlpool: { l: "Diametro o lato", b: "Larghezza", tTief: "Profondità dell’acqua" },
  bad: { l: "Larghezza della parete di fondo", b: "Profondità della nicchia", tTief: "Altezza piastrellata" },
  kueche: { l: "Larghezza", tTief: "Altezza tra piano di lavoro e pensile" },
});

export const KANAL_NAMEN = Object.freeze(["Fondo", "Motivo", "Accento"]);

export const HINWEIS_MIX = Object.freeze({
  allein: "Secondo Ezarri questo mosaico non si può miscelare. Ora è da solo.",
  voll: "Una miscela ha al massimo 4 mosaici.",
  vorhanden: "Questo mosaico è già nella miscela.",
  nichtMischbar: "non miscelabile secondo Ezarri – solo da solo",
});

export const AKTIONEN = Object.freeze({
  muster: "Richiedere campioni",
  musterSub: "per il vostro appuntamento a Lochau",
  angebot: "Richiedere un’offerta",
  rechner: "Calcolare con precisione",
  teilen: "Condividere il link",
  kopiert: "Link copiato",
  drucken: "Scheda da stampare o PDF",
  merken: "Salvare nella lista dei desideri",
  gemerkt: "Salvato nella lista dei desideri",
  neu: "Ricominciare",
  neuFrage: "Ripristinare tutte le impostazioni?",
  rueck: "Annulla",
  vor: "Ripeti",
  vorher: "Fissare il «prima»",
  vergleich: "Prima / dopo",
  vergleichEnde: "Terminare il confronto",
  drei: "Vedere in 3D",
  zwei: "Pianta 2D",
  ar: "Vedere nel vostro giardino (AR)",
});

/** Modelli del riepilogo (aria-live); sostituisce zusammenfassung() di copy.js. */
export const ZUSAMMENFASSUNG = Object.freeze({
  pool: "Piscina {l} × {b} m, profondità da {tFlach} a {tTief} m",
  whirlpool: "Idromassaggio {l} m",
  bad: "Nicchia doccia {l} × {b} m, alta {tTief} m",
  kueche: "Paraschizzi cucina {l} × {tTief} m",
  satz: "{ort}. {mixText}. Formato {formatLabel}, fuga {fugeName}.",
});

export const UI = Object.freeze({
  // Vista AR
  "Das AR-Modell ließ sich auf diesem Gerät nicht erzeugen.": "Non è stato possibile creare il modello AR su questo dispositivo.",
  "Modell wird erzeugt …": "Creazione del modello…",
  "erst in der 3D-Ansicht verfügbar": "disponibile solo nella vista 3D",
  "Becken in Originalgröße": "Vasca a grandezza reale",
  "Ihr Becken in Originalgröße": "La vostra vasca a grandezza reale",
  "Schließen": "Chiudi",
  "Maßstab 1:1. Auf dem Handy erscheint „In AR ansehen“, wenn Ihr Gerät AR unterstützt.": "Scala 1:1. Sullo smartphone compare «Vedi in AR» se il dispositivo supporta la realtà aumentata.",
  // Scheda (immagine)
  "Visualisierung des Beckens aus dem 3D-Konfigurator": "Visualizzazione della vasca dal configuratore 3D",
  "Draufsicht des Beckens mit dem gewählten Mosaik": "Vista dall’alto della vasca con il mosaico scelto",
  "Visualisierung wird erstellt …": "Creazione della visualizzazione…",
  "Visualisierung, Farben angenähert": "Visualizzazione, colori approssimati",
  "Draufsicht (Visualisierung, Farben angenähert)": "Vista dall’alto (visualizzazione, colori approssimati)",
  // Druck 02.11.: Pflichtunterschrift, Fotoansicht und Fußzeile des Druckblatts
  "Visualisierung (Rendering) · Farben angenähert, kein Foto": "Visualizzazione (rendering) · colori approssimati, non una foto",
  "Beispielbecken 8 × 4 m, nicht Ihre Maße": "vasca di esempio 8 × 4 m, non le vostre misure",
  "Ihr Becken": "La vostra vasca",
  "Becken-Entwurf": "Progetto della vasca",
  "Seite": "Pagina",
  "von": "di",
  "Nahansicht des Mosaiks, vergrößert": "Primo piano del mosaico, ingrandito",
  "Nahansicht von Steinen und Fuge (vergrößert)": "Primo piano di tessere e fuga (ingrandito)",
  "Drucken oder als PDF speichern": "Stampare o salvare come PDF",
  // La vostra foto
  "Bitte ein Foto wählen (JPG, PNG, HEIC oder WebP).": "Scegliete una foto (JPG, PNG, HEIC o WebP).",
  "Das Foto ist größer als 25 MB. Bitte ein kleineres wählen.": "La foto supera i 25 MB. Sceglietene una più piccola.",
  "Diese Lage würde die Fläche überkreuzen – die Ecke bleibt, wo sie war.": "Questa posizione incrocerebbe la superficie – l’angolo resta dov’era.",
  "Fläche zurückgesetzt.": "Superficie ripristinata.",
  "Legen Sie das Mosaik probeweise über ein Foto Ihres Beckens oder Bads. Das Foto bleibt in Ihrem Browser: Es wird nicht hochgeladen und nicht gespeichert und ist weg, sobald Sie die Seite schließen.":
    "Provate il mosaico su una foto della vostra vasca o del vostro bagno. La foto resta nel vostro browser: non viene caricata né salvata e scompare appena chiudete la pagina.",
  "Anderes Foto wählen": "Scegliere un’altra foto",
  "Eigenes Foto wählen": "Scegliere una vostra foto",
  "Fläche zurücksetzen": "Ripristinare la superficie",
  "Foto entfernen": "Rimuovere la foto",
  "Foto geladen. Ziehen Sie die vier Ecken der Mosaikfläche auf die Ecken von Boden oder Wand.": "Foto caricata. Trascinate i quattro angoli della superficie a mosaico sugli angoli del pavimento o della parete.",
  "Ihr Foto (nur in diesem Browser)": "La vostra foto (solo in questo browser)",
  "Fotomontage zur Orientierung, kein Rendering: Licht und Farben weichen ab. Die echten Farben zeigen wir Ihnen am Muster in Lochau.":
    "Fotomontaggio per orientarsi, non un rendering: luce e colori differiscono. I colori reali ve li mostriamo sul campione a Lochau.",
  "Ecken ziehen oder antippen und mit den Pfeiltasten verschieben (mit Umschalt in großen Schritten). Ohne Ziehen: Ecke unten wählen und mit den Reglern setzen.":
    "Trascinate o toccate gli angoli e spostateli con i tasti freccia (con Maiusc a passi grandi). Senza trascinare: scegliete un angolo qui sotto e posizionatelo con i cursori.",
  "Ecke wählen": "Scegliere un angolo",
  "Deckkraft": "Opacità",
  // Configuratore
  "Das Sortiment konnte nicht geladen werden. Bitte laden Sie die Seite neu.": "Non è stato possibile caricare la gamma. Ricaricate la pagina.",
  "Motiv-Raster": "Trama di motivi",
  "Mosaik": "Mosaico",
  "Vorher festgehalten. Ändern Sie jetzt Mosaik, Fuge oder Wasser – links sehen Sie den Stand von vorher.": "«Prima» fissato. Ora cambiate mosaico, fuga o acqua – a sinistra vedete lo stato precedente.",
  "Mein Becken mit Ezarri-Mosaik": "La mia vasca con mosaico Ezarri",
  "Ezarri-Konfigurator": "Configuratore Ezarri",
  "Becken-Entwurf": "Progetto di vasca",
  "Neu begonnen. Rückgängig holt den alten Stand zurück.": "Si ricomincia. «Annulla» ripristina lo stato precedente.",
  "ca.": "ca.",
  "Kartons": "scatole",
  "Blätter": "fogli",
  "Einstellungen": "Impostazioni",
  "Wie möchten Sie starten?": "Come volete iniziare?",
  "Einstieg": "Inizio",
  "Ihr Mosaik": "Il vostro mosaico",
  "Mosaik wählen": "Scegliere il mosaico",
  "Anderes Mosaik wählen": "Scegliere un altro mosaico",
  "Ezarri-Mischung": "Miscela Ezarri",
  "Ihre Mischung": "La vostra miscela",
  "Fertige Mischung laut Ezarri": "Miscela pronta secondo Ezarri",
  "Bitte wählen (oder unten verändern)": "Scegliete (o modificate qui sotto)",
  "Rezept laut Ezarri": "Ricetta secondo Ezarri",
  "Nach Produktfoto (Rezept unvollständig oder widersprüchlich)": "Secondo la foto prodotto (ricetta incompleta o contraddittoria)",
  "Mosaik austauschen": "Sostituire il mosaico",
  "Mosaik zur Mischung hinzufügen": "Aggiungere un mosaico alla miscela",
  "Mosaik hinzufügen": "Aggiungere un mosaico",
  "von": "di",
  "Nicht mischbare Mosaike (laut Ezarri) stehen immer allein. Die Verteilung je Stein ist zufällig und bleibt beim Teilen gleich.":
    "I mosaici non miscelabili (secondo Ezarri) restano sempre da soli. La distribuzione per tessera è casuale e resta uguale quando condividete.",
  "Verteilung neu würfeln": "Rimescolare la distribuzione",
  "Raster werden geladen …": "Caricamento delle trame…",
  "Ändern": "Modificare",
  "Patterns laut Ezarri, Steinraster aus den Ezarri-Vorschaubildern abgelesen.": "Pattern secondo Ezarri, trame delle tessere ricavate dalle anteprime Ezarri.",
  "Format und Fuge": "Formato e fuga",
  "Nicht für alle gewählten Mosaike erhältlich": "Non disponibile per tutti i mosaici scelti",
  "Fugenfarbe": "Colore della fuga",
  "Kanäle und Streifen": "Corsie e fasce",
  "Bis zu 3 Streifen mit eigenem Mosaik: Bahnmarkierung, Band an der Wasserlinie oder Stufenkanten.": "Fino a 3 fasce con un proprio mosaico: segnacorsia, fascia sulla linea d’acqua o bordi dei gradini.",
  "Mosaik für den Streifen": "Mosaico per la fascia",
  "Entfernen": "Rimuovere",
  "Lage": "Posizione",
  "Breite": "Larghezza",
  "Streifen hinzufügen": "Aggiungere una fascia",
  "Spezialteile": "Pezzi speciali",
  "Kanten mit Corner-Teilen": "Spigoli con pezzi Corner",
  " (laut Ezarri, Bild fehlt)": " (secondo Ezarri, senza immagine)",
  "Für dieses Mosaik führt Ezarri kein Corner-Teil – wählen Sie ein passendes.": "Per questo mosaico Ezarri non offre un pezzo Corner – sceglietene uno adatto.",
  "Hohlkehlen mit Cove-Teilen": "Sgusci con pezzi Cove",
  "Für dieses Mosaik führt Ezarri kein Cove-Teil – wählen Sie ein passendes.": "Per questo mosaico Ezarri non offre un pezzo Cove – sceglietene uno adatto.",
  "Corner-Teil wählen": "Scegliere un pezzo Corner",
  "Corner wählen": "Scegliere Corner",
  "Cove-Teil wählen": "Scegliere un pezzo Cove",
  "Cove wählen": "Scegliere Cove",
  "Corner deckt Kanten (Beckenkopf, Stufen, Bank), Cove die Kehle zwischen Boden und Wand. Die Längen stehen unter „Mengen“.":
    "Corner copre gli spigoli (bordo vasca, gradini, panca), Cove lo sguscio tra pavimento e parete. Le lunghezze sono sotto «Quantità».",
  "Wo liegt das Mosaik?": "Dove va il mosaico?",
  "Szene": "Scena",
  "Form und Maße": "Forma e misure",
  "Form": "Forma",
  "Der Boden fällt stufenlos von der flachen zur tiefen Seite.": "Il fondo scende in modo continuo dal lato basso al lato profondo.",
  "Standardmaße": "Misure standard",
  "Treppe, Bank und Rand": "Scala, panca e bordo",
  "Treppe": "Scala",
  "Sitzbank unter Wasser": "Panca sommersa",
  "an der Längswand, Sitzfläche 50 cm unter dem Rand": "lungo il lato lungo, seduta 50 cm sotto il bordo",
  "Beckenrand": "Bordo vasca",
  "Ausstattung": "Dotazioni",
  "Umlaufende Sitzbank": "Panca perimetrale",
  "Mit Foto Ihres Beckens vergleichen": "Confrontare con una foto della vostra vasca",
  "Wasser": "Acqua",
  "Zustand": "Stato",
  "Wasserart": "Tipo d’acqua",
  "Licht": "Luce",
  "Tageszeit": "Ora del giorno",
  "Unterwasser-Licht (LED)": "Luce subacquea (LED)",
  "Die Kaustik (Lichtnetz am Boden) wird aus Sonnenstand und Wasserbewegung berechnet. Bei „Bewegung reduzieren“ steht sie still.":
    "Le caustiche (rete di luce sul fondo) sono calcolate dalla posizione del sole e dal movimento dell’acqua. Con «Riduci movimento» restano ferme.",
  "Wasser und Tageslicht gelten für Pool und Whirlpool. Bad und Küche zeigen wir im Innenlicht.": "Acqua e luce del giorno valgono per piscina e idromassaggio. Bagno e cucina li mostriamo con luce interna.",
  "Flächen und Mengen": "Superfici e quantità",
  "Nächste Schritte": "Prossimi passi",
  "Termin mit diesem Plan": "Appuntamento con questo progetto",
  "Bad": "Bagno",
  "Küche": "Cucina",
  "Whirlpool": "Idromassaggio",
  "Pool": "Piscina",
  "Vorschau": "Anteprima",
  "Mosaik, Becken, Wasser und Licht gehen auf den Startentwurf zurück. Mit „Rückgängig“ holen Sie den jetzigen Stand zurück.":
    "Mosaico, vasca, acqua e luce tornano al progetto iniziale. Con «Annulla» ripristinate lo stato attuale.",
  "Oberfläche laut Ezarri nicht angegeben": "superficie non indicata da Ezarri",
  "Wasserwirkung laut Ezarri": "Effetto in acqua secondo Ezarri",
  "Wasserwirkung": "Effetto in acqua",
  "laut Ezarri": "secondo Ezarri",
  "laut Ezarri ohne Angabe": "non indicato da Ezarri",
  "Fotos des Mosaiks": "Foto del mosaico",
  "Projekte und Muster mit Ezarri-Mosaik": "Progetti e campioni con mosaico Ezarri",
  "Abbrechen": "Annulla",
  // Quantità
  "Boden": "Fondo",
  "Treppe (Tritt- und Setzstufen)": "Scala (pedate e alzate)",
  "Sitzbank": "Panca",
  "Rinne bzw. Überlaufkante": "Canale o bordo di sfioro",
  "Flächen": "Superfici",
  "Fläche netto": "Superficie netta",
  "Bestellmenge": "Quantità da ordinare",
  "Blätter (Netze)": "Fogli (reti)",
  "Gewicht Mosaik ca.": "Peso del mosaico ca.",
  "Kleber laut Ezarri": "Adesivo secondo Ezarri",
  "Fugenmasse laut Ezarri": "Stucco per fughe secondo Ezarri",
  "Corner (Kanten)": "Corner (spigoli)",
  "lfm": "m lin.",
  "Cove (Hohlkehlen)": "Cove (sgusci)",
  "Kartons je Mosaik der Mischung": "Scatole per mosaico della miscela",
  // Fascia della miscela
  "Austauschen": "Sostituire",
  // Selezione
  "Auswahl schließen": "Chiudere la selezione",
  "Suche nach Name, Code oder Kollektion": "Ricerca per nome, codice o collezione",
  "Name, Code oder Kollektion": "Nome, codice o collezione",
  "Art": "Tipo",
  "Weitere Filter": "Altri filtri",
  "Kollektion": "Collezione",
  "Alle": "Tutte",
  "nur mischbare Mosaike": "solo mosaici miscelabili",
  "Farbfamilie": "Famiglia di colori",
  "Alle Farben": "Tutti i colori",
  "Sortiment wird geladen …": "Caricamento della gamma…",
  " · in Mischungen nur mischbare Mosaike": " · nelle miscele solo mosaici miscelabili",
  ", rutschhemmend": ", antiscivolo",
  "allein, nicht mischbar": "da solo, non miscelabile",
  // Scena
  "Fotoansicht: Visualisierung eines Beispielbeckens 8 × 4 m": "Vista foto: visualizzazione di una vasca di esempio di 8 × 4 m",
  "Vorschau des Beckens": "Anteprima della vasca",
  "Draufsicht des Beckens": "Vista dall’alto della vasca",
  "Vorher": "Prima",
  "Nachher": "Dopo",
  "Fotoansicht (Beispielbecken 8 × 4 m)": "Vista foto (vasca di esempio di 8 × 4 m)",
  "Foto": "Foto",
  "Strg+Z": "Ctrl+Z",
  "Nichts rückgängig zu machen": "Niente da annullare",
  "Strg+Umschalt+Z": "Ctrl+Maiusc+Z",
  "Nichts zu wiederholen": "Niente da ripetere",
  "Fotoansicht nach dem Vergleich verfügbar": "Vista foto disponibile dopo il confronto",
  "Vorschau, für 3D tippen": "Anteprima, toccate per il 3D",
  "Vorschau, Farben angenähert": "Anteprima, colori approssimati",
  "3D wird geladen …": "Caricamento del 3D…",
  "Die 3D-Ansicht wurde beendet (Grafikspeicher). Sie sehen die 2D-Draufsicht.": "La vista 3D è stata chiusa (memoria grafica). Vedete la pianta 2D.",
  "Ansicht bewegen": "Spostare la vista",
  "Fertig": "Fatto",
  "Näher": "Più vicino",
  "Weiter weg": "Più lontano",
  "Teilung": "Divisione",
  "Teilung Vorher/Nachher in Prozent": "Divisione prima/dopo in percentuale",
  "Ansicht": "Vista",
  "Kamera": "Punto di vista",
  "Fotoansicht wird geladen …": "Caricamento della vista foto…",
  "Nahansicht": "Primo piano",
  "flaches Ende": "lato basso",
  // Scheda da stampare
  "Druckblatt Becken-Entwurf": "Scheda da stampare: progetto di vasca",
  "Ihr Entwurf aus dem Ezarri-Konfigurator zum Drucken oder Speichern als PDF.": "Il vostro progetto dal configuratore Ezarri, da stampare o salvare come PDF.",
  "Maße": "Misure",
  "ja": "sì",
  "nein": "no",
  "Rand": "Bordo",
  "Zurück zum Konfigurator": "Tornare al configuratore",
  "Ihr Becken-Entwurf": "Il vostro progetto di vasca",
  "Stand": "Aggiornato al",
  "ohne Preise": "senza prezzi",
  "Entwurf öffnen": "Aprire il progetto",
  "Fläche": "Superficie",
  "Anteil": "Quota",
  "Safe (rutschhemmend)": "Safe (antiscivolo)",
  "Darstellung nach Produktfoto": "Rappresentazione secondo la foto prodotto",
  "Rezeptangaben von Ezarri widersprüchlich": "dati di ricetta di Ezarri contraddittori",
  "Rezept unvollständig": "ricetta incompleta",
  "Kanal": "Canale",
  "Fuge": "Fuga",
  "Format": "Formato",
  "Streifen": "Fascia",
  "passendes Teil wählen wir mit Ihnen": "il pezzo adatto lo scegliamo con voi",
  "Mengen (Schätzung)": "Quantità (stima)",
  "Bestellmenge (volle Kartons)": "Quantità da ordinare (scatole intere)",
  "Preise nennen wir auf Anfrage.": "Prezzi su richiesta.",
  "Steinfarben gemessen aus Ezarri-Produktbildern · Stand 28.10.2026": "colori delle tessere misurati sulle foto prodotto di Ezarri · aggiornato al 28.10.2026",
  // Calcolatore
  "Summe der Teilflächen": "Somma delle superfici parziali",
  "Volle Kartons": "Scatole intere",
  "Eingaben des Mosaik-Rechners": "Dati del calcolatore di mosaico",
  "Form des Beckens": "Forma della vasca",
  "automatisch": "automatico",
  "Art des Beckenrands": "Tipo di bordo",
  "0,4": "0,4",
  "0,9": "0,9",
  "2,5 kg/m²": "2,5 kg/m²",
  "Stk.": "pz.",
  "und": "e",
  "U": "P",
});

export const UI_TPL = Object.freeze({
  "ar.alt": "Vasca {l} × {b} m con il mosaico scelto",
  "foto.ecke": "Angolo {ecke}: {x} % da sinistra, {y} % dall’alto",
  "foto.eckeX": "Angolo {ecke} – in orizzontale",
  "foto.eckeY": "Angolo {ecke} – in verticale",
  "rezept.widerspruch": "Rappresentazione secondo la foto prodotto: i dati di ricetta di Ezarri per «{name}» qui sono contraddittori, mostriamo la referenza finita secondo la foto prodotto.",
  "rezept.unvollstaendig": "Ricetta incompleta, rappresentazione secondo la foto prodotto: per «{name}» Ezarri indica componenti che mancano nella gamma del suo configuratore. Mostriamo quindi la referenza finita con i colori della foto Ezarri, non come miscela modificabile.",
  "raster.aria": "Trama {name}, {n} colori",
  "bild.nah": "Ezarri {name}, mosaico di vetro, primo piano",
  "bild.becken": "Vasca con Ezarri {name}",
  reserve: "con {p} % di scorta",
  "mix.grenze": "Confine tra {a} e {b}",
  "mix.weniger": "{name}: 5 percento in meno",
  "mix.mehr": "{name}: 5 percento in più",
  "mix.austauschen": "Sostituire {name}",
  "mix.entfernen": "Rimuovere {name} dalla miscela",
  "picker.mehr": "Mostrare altri {n}",
  "picker.treffer1": "{n} risultato",
  "picker.trefferN": "{n} risultati",
  "stage.aria3d": "Vista 3D della vasca. I tasti freccia ruotano, più e meno zoomano, le cifre da 1 a {n} scelgono il punto di vista, 0 ripristina la vista.",
  "stage.keinWebglVorschau": "Il vostro browser non mostra WebGL. Vedete un’anteprima con colori approssimati; quantità, link, scheda da stampare e richiesta funzionano come sempre.",
  "stage.keinWebgl2d": "Il vostro browser non mostra WebGL. Vedete la pianta 2D; quantità, link, scheda da stampare e richiesta funzionano come sempre.",
  "stage.fotoAlt": "Visualizzazione: vasca di esempio di 8 × 4 m con {name}, {view}, luce {licht}",
  "ctl.weniger": "Ridurre {label}",
  "ctl.mehr": "Aumentare {label}",
  "ctl.schieber": "{label} (cursore)",
  "blatt.fotoAlt": "Visualizzazione: vasca di esempio 8 × 4 m con {name}",
  "blatt.massePool": "{l} × {b} m, profondità da {tf} a {tt} m",
  "blatt.masseWhirl": "{l} m, profondità {tt} m",
  "blatt.masseBad": "{l} × {b} m, altezza piastrellata {tt} m",
  "blatt.menge": "{m2} · {k} scatole · {b} fogli",
  "blatt.davon": "di cui {name} ({p} %)",
  "rr.proKarton": "{m2} m² ciascuna",
  "rr.jeKarton": "{n} per scatola",
  "rr.paletten": "{p} pieni + {k} scatole",
  "rr.kartonFormel": "{mitMarge} ÷ {m2} m² per scatola, arrotondato = {n} scatole",
});

export const LISTEN = Object.freeze({
  ecken: { ol: "in alto a sinistra", or: "in alto a destra", ur: "in basso a destra", ul: "in basso a sinistra" },
  waende: {
    "Längswände": "Lati lunghi",
    "Stirnwand flach": "Lato corto, lato basso",
    "Stirnwand tief": "Lato corto, lato profondo",
    "Rückwand": "Parete di fondo",
    "Seitenwand links": "Parete laterale sinistra",
    "Seitenwand rechts": "Parete laterale destra",
    "Rückwand Küche": "Paraschizzi",
    Wand: "Parete",
  },
  typ: { mosaik: "Mosaici", safe: "Antiscivolo (Safe)", corner: "Corner (spigolo)", cove: "Cove (sguscio)" },
  treppeLegende: { roemisch: "Semicerchi a sinistra: scala romana", eck: "Quarto di cerchio a sinistra: scala d’angolo", voll: "Fascia a sinistra: scala a tutta larghezza" },
  fotoView: { hero: "Panoramica", wasserlinie: "Linea d’acqua", draufsicht: "Vista dall’alto" },
  fotoLicht: { morgen: "Mattina", abend: "Sera" },
  fotoLichtAlt: { morgen: "del mattino", abend: "della sera" },
  fotoCaption: "Visualizzazione (rendering), verificate l’effetto dei colori sul campione",
  fotoDekorHinweis: "Solo colore di fondo del motivo, senza il disegno.",
  fotoHinweis: "Vista foto disponibile come vasca di esempio di 8 × 4 m per i colori singoli",
  credit: { bild: "Immagine: Ezarri, ezarri.com", daten: "Dati: Ezarri, ezarri.com" },
  farbfamilien: { weiss: "Bianco", grau: "Grigio", schwarz: "Nero", blau: "Blu", gruen: "Verde", gelb: "Giallo", braun: "Marrone", rosa: "Rosa", rot: "Rosso" },
  wasserwirkung: { himmelblau: "Azzurro cielo", tuerkisblau: "Turchese", blau: "Blu intenso", gruen: "Verde", graugruen: "Verde grigio", natur: "Naturale, come un lago di montagna" },
  oberflaeche: { "glänzend": "lucido", matt: "opaco", satiniert: "satinato", phosphoreszierend: "fosforescente", "glänzend, matt": "lucido, opaco" },
  datum: "it-IT",
});
