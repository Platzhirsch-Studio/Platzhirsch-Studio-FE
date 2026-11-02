// Stellentexte Italienisch – Übersetzung von stellen.de.js (gleiche Struktur,
// gleiche Schlüssel, gleiche Reihenfolge). Regeln wie dort (GlBG § 9):
// Titel mit „(m/f/d)“, neutrale Formulierungen, keine Superlative, keine
// zusätzlichen Angaben gegenüber dem deutschen Original.
// Rein: keine Pakete, keine "@/"-Aliase.

export const BIETEN = [
  "Luogo di lavoro presso lo studio di arredamento a Lochau, Landstraße 11, sul Lago di Costanza",
  "Lavoro con i marchi di design internazionali del nostro showroom",
  "Collaborazione in un team di interior design, progettazione, consulenza e montaggio – progetti seguiti dallo stesso team dall’inizio alla fine",
];

export const STELLEN = {
  "cad-planer": {
    title: "Progettista CAD (m/f/d)",
    bereich: "Progettazione",
    beschreibung:
      "Trasforma concetti di arredamento, cucine e bagni in piani precisi – dal rilievo delle misure fino ai disegni esecutivi e di montaggio. Lavora a stretto contatto con interior design, vendita e montaggio.",
    aufgaben: [
      "Redigere piante, prospetti e disegni di dettaglio per cucine, bagni e mobili",
      "Trasferire progetti da schizzi a mano e modelli in disegni CAD e viste 3D",
      "Rilevare le misure presso i clienti e verificare la situazione di installazione",
      "Elaborare disegni esecutivi e di montaggio per il montaggio e le imprese coinvolte",
      "Coordinarsi con produttori, fornitori e il team di montaggio",
    ],
    profil: [
      "Formazione professionale o studi conclusi in tecnica edilizia, finiture d’interni, falegnameria o architettura d’interni, oppure qualifica equivalente",
      "Conoscenza di Archicad e/o AutoCAD",
      "Capacità di visione spaziale e metodo di lavoro preciso",
      "Comprensione di materiali, costruzioni e situazioni di installazione",
      "Piacere di collaborare con progettazione, vendita e montaggio",
    ],
  },
  innenarchitekt: {
    title: "Architetto/a d’interni (m/f/d)",
    bereich: "Interior design",
    beschreibung:
      "Insieme ai nostri clienti sviluppa concetti per spazi abitativi, cucine e bagni e accompagna i progetti dalla prima idea fino alla consegna.",
    aufgaben: [
      "Consulenza su spazio, materiali, luce e mobili",
      "Ideare concetti di arredamento con schizzi, modelli e visualizzazioni 3D",
      "Scegliere mobili, materiali e superfici dall’assortimento dei nostri marchi",
      "Preparare presentazioni, piani e offerte insieme alla vendita",
      "Coordinamento con la progettazione CAD, il montaggio e le imprese coinvolte",
    ],
    profil: [
      "Studi o formazione conclusi in architettura d’interni o interior design, oppure qualifica equivalente",
      "Esperienza nella progettazione di spazi abitativi, cucine o bagni",
      "Sensibilità per proporzioni, materiali e colori",
      "Buona padronanza di programmi CAD e di visualizzazione",
      "Piacere per la consulenza e per il contatto con i clienti",
    ],
  },
  verkaeufer: {
    title: "Addetto/a alla vendita e consulenza d’arredamento (m/f/d)",
    bereich: "Vendita e consulenza",
    beschreibung:
      "Offre consulenza ai visitatori del nostro showroom a Lochau e li accompagna dalla prima domanda fino all’ordine.",
    aufgaben: [
      "Accoglienza e consulenza dei clienti nello showroom",
      "Presentare mobili, lampade e accessori dei nostri marchi di design",
      "Redigere offerte e conferme d’ordine",
      "Coordinamento con interior design, progettazione e montaggio per consegna e installazione",
      "Cura dello showroom e assistenza ai clienti dopo l’acquisto",
    ],
    profil: [
      "Formazione commerciale conclusa o esperienza nella vendita, preferibilmente nel settore del mobile o dell’arredamento",
      "Interesse per design, materiali e abitare",
      "Modi cordiali e piacere per il contatto con i clienti",
      "Metodo di lavoro strutturato e affidabile",
      "Buona padronanza dei comuni programmi Office",
    ],
  },
  "monteur-tischler": {
    title: "Montatore/trice con apprendistato da falegname (m/f/d)",
    bereich: "Montaggio",
    beschreibung:
      "Monta cucine, mobili su misura e mobili di design presso i nostri clienti e, grazie alla formazione da falegname, garantisce un’esecuzione pulita e precisa.",
    aufgaben: [
      "Montaggio di cucine, mobili su misura e mobili di design presso i clienti",
      "Lavori di adattamento su mobili ed elementi a incasso in loco",
      "Leggere e attuare disegni di montaggio ed esecutivi",
      "Controllare le consegne e documentare il montaggio",
      "Coordinamento con la progettazione e le altre imprese in cantiere",
    ],
    profil: [
      "Apprendistato concluso come falegname",
      "Esperienza nel montaggio di mobili o cucine",
      "Metodo di lavoro accurato e comprensione dei disegni esecutivi",
      "Modi cordiali con i clienti in loco",
      "Spirito di squadra e affidabilità",
      "Patente B (requisito), patente C costituisce un vantaggio",
    ],
  },
  monteur: {
    title: "Montatore/trice (m/f/d)",
    bereich: "Montaggio",
    beschreibung:
      "Consegna e monta mobili, lampade ed elementi da cucina presso i nostri clienti, lavorando nel team di montaggio.",
    aufgaben: [
      "Consegna e montaggio di mobili, lampade ed elementi da cucina",
      "Collaborazione al montaggio di cucine e mobili su misura",
      "Protezione degli ambienti presso i clienti e smaltimento degli imballaggi",
      "Controllare la merce e segnalare danni o parti mancanti",
      "Collaborazione con falegnami, progettazione e vendita",
    ],
    profil: [
      "Manualità ed esperienza nel montaggio; una formazione in un mestiere artigianale costituisce un vantaggio",
      "Cura nel maneggiare mobili e superfici delicate",
      "Modi cordiali con i clienti",
      "Spirito di squadra e affidabilità",
      "Patente B (requisito), patente C costituisce un vantaggio",
    ],
  },
  fliesenleger: {
    title: "Piastrellista (m/f/d)",
    bereich: "Bagno e wellness",
    beschreibung:
      "Nel nostro team di montaggio posa piastrelle e lastre in bagni, cucine e aree wellness che progettiamo insieme ai nostri clienti.",
    aufgaben: [
      "Posare piastrelle per pareti e pavimenti, lastre e mosaici",
      "Preparare i sottofondi, impermeabilizzare e stuccare le fughe",
      "Attuare i piani di posa in bagno, cucina e area wellness",
      "Coordinamento con progettazione, impiantistica e montaggio in cantiere",
      "Eseguire con cura raccordi e dettagli",
    ],
    profil: [
      "Apprendistato concluso come piastrellista o qualifica equivalente",
      "Esperienza nella posa di piastrelle e lastre",
      "Metodo di lavoro preciso e cura per i dettagli",
      "Spirito di squadra e affidabilità",
    ],
  },
  installateur: {
    title: "Installatore/trice idraulico/a e termotecnico/a (m/f/d)",
    bereich: "Impiantistica",
    beschreibung:
      "Nel nostro team di montaggio installa impianti sanitari e di riscaldamento nei bagni, nelle cucine e nelle aree wellness che progettiamo e realizziamo.",
    aufgaben: [
      "Installare sanitari, rubinetteria e tubazioni",
      "Montare e collegare componenti di riscaldamento",
      "Collegare gli elettrodomestici da cucina all’acqua e agli scarichi",
      "Attuare i piani di installazione in coordinamento con la progettazione e i piastrellisti",
      "Messa in funzione, verifica di funzionamento e documentazione",
    ],
    profil: [
      "Apprendistato concluso in tecnica degli impianti e degli edifici (impianti sanitari e di riscaldamento) o qualifica equivalente",
      "Esperienza nell’installazione di impianti sanitari e di riscaldamento",
      "Metodo di lavoro accurato e autonomo",
      "Spirito di squadra e modi cordiali con i clienti",
    ],
  },
  elektroplaner: {
    title: "Progettista di impianti elettrici (m/f/d)",
    bereich: "Progettazione",
    beschreibung:
      "Nel nostro team di progettazione progetta l’impianto elettrico e l’illuminazione per cucine, bagni e spazi abitativi e li coordina con l’interior design e il montaggio.",
    aufgaben: [
      "Progettare impianti elettrici, allacciamenti e soluzioni di illuminazione per cucina, bagno e spazi abitativi",
      "Redigere piani elettrici e di illuminazione",
      "Coordinamento con interior design, progettazione CAD e il nostro team di montaggio",
      "Verificare gli allacciamenti degli apparecchi e le specifiche tecniche dei produttori",
      "Seguire la realizzazione in cantiere",
    ],
    profil: [
      "Formazione conclusa in elettrotecnica (ad es. HTL, istituto tecnico superiore austriaco, o apprendistato con formazione continua) o qualifica equivalente",
      "Esperienza nella progettazione elettrica in edilizia residenziale o finiture d’interni",
      "Conoscenza delle norme e prescrizioni pertinenti (ÖVE/ÖNORM)",
      "Conoscenza di Archicad e/o AutoCAD",
      "Metodo di lavoro preciso e piacere di lavorare in team",
    ],
  },
};
