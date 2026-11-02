// src/lib/kuechenplaner/copy/druck.js – Druckansicht /<locale>/kuechenplaner/druck
// (nur Server, geht NICHT an den Client). Zeile = [Deutsch, Englisch, Französisch, Italienisch].

export const DRUCK_ROWS = [
  ["Küchenplanung – Druckansicht", "Kitchen plan – print view", "Projet de cuisine – version imprimable", "Progetto di cucina – versione stampabile"],
  ["Zurück zum Planer", "Back to the planner", "Retour au planificateur", "Tornare al configuratore"],
  ["Drucken / als PDF speichern", "Print / save as PDF", "Imprimer / enregistrer en PDF", "Stampare / salvare come PDF"],
  ["Küchenplanung · Platzhirsch Home Living", "Kitchen planning · Platzhirsch Home Living", "Projet de cuisine · Platzhirsch Home Living", "Progettazione cucina · Platzhirsch Home Living"],
  ["Ihre Küche – Planungsübersicht", "Your kitchen – plan overview", "Votre cuisine – vue d’ensemble du projet", "La vostra cucina – panoramica del progetto"],
  ["Stand {v} · Vorplanung im Browser, kein Angebot. Maße prüfen wir beim Aufmaß.", "As of {v} · preliminary plan made in the browser, not a quote. We check all dimensions during the site survey.", "État au {v} · avant-projet réalisé dans le navigateur, sans valeur d’offre. Nous vérifions les cotes lors du relevé.", "Aggiornato al {v} · progetto preliminare nel browser, non è un’offerta. Le misure le verifichiamo durante il rilievo."],
  ["Beispielplanung", "Sample plan", "Projet d’exemple", "Progetto di esempio"],
  ["Zusammenfassung", "Summary", "Récapitulatif", "Riepilogo"],
  ["Grundriss mit Maßen", "Floor plan with dimensions", "Plan coté", "Pianta con misure"],
  ["Grundriss mit Maßketten", "Floor plan with dimension lines", "Plan avec cotes", "Pianta con quote"],
  ["Ansichten", "Elevations", "Élévations", "Prospetti"],
  ["Preise nennen wir persönlich nach Beratung und Aufmaß. Geräte nach Wahl; Nischenmaße laut Herstellerangaben, Geräte ohne Quelle sind als „Maß fehlt“ markiert.", "We quote prices in person after consultation and site survey. Appliances of your choice; niche sizes according to manufacturer data, appliances without a source are marked “dimension missing”.", "Nous indiquons les prix en personne après conseil et relevé sur place. Appareils au choix ; cotes de niche selon les données des fabricants, les appareils sans source sont marqués « cote manquante ».", "I prezzi li comunichiamo di persona dopo consulenza e rilievo in loco. Elettrodomestici a scelta; misure delle nicchie secondo i dati dei produttori, gli apparecchi senza fonte sono contrassegnati «misura mancante»."],
  ["„Italienische Premiumküche“ ist eine Gestaltungsrichtung, keine Planung eines Herstellers.", "“Italian premium kitchen” is a design direction, not a manufacturer’s plan.", "« Cuisine italienne haut de gamme » désigne une orientation stylistique, pas le projet d’un fabricant.", "«Cucina italiana di fascia alta» indica un indirizzo stilistico, non il progetto di un produttore."],
  ["Ihre Geräteauswahl", "Your appliance selection", "Votre sélection d’appareils", "La vostra scelta di elettrodomestici"],
  ["passt nicht: {x}", "does not fit: {x}", "ne convient pas : {x}", "non adatto: {x}"],
  ["So geht es weiter", "Next steps", "La suite", "I prossimi passi"],
  ["Termin im Studio in Lochau vereinbaren – telefonisch unter +43 5574 46255 oder online auf platzhirsch.studio.", "Book an appointment at the studio in Lochau – by phone on +43 5574 46255 or online at platzhirsch.studio.", "Prenez rendez-vous au studio de Lochau – par téléphone au +43 5574 46255 ou en ligne sur platzhirsch.studio.", "Fissate un appuntamento in studio a Lochau – al telefono +43 5574 46255 oppure online su platzhirsch.studio."],
  ["Diese Übersicht mitbringen, dazu – wenn vorhanden – Grundriss und Fotos des Raums.", "Bring this overview and, if available, a floor plan and photos of the room.", "Apportez cette vue d’ensemble et, si vous en avez, le plan et des photos de la pièce.", "Portate questa panoramica e, se disponibili, la pianta e alcune foto della stanza."],
  ["Wir prüfen Ihre Planung, messen auf Wunsch vor Ort auf, und Harald Menghin zeichnet Ihr Konzept von Hand.", "We check your plan, measure on site if you wish, and Harald Menghin draws your concept by hand.", "Nous vérifions votre projet, effectuons sur demande un relevé sur place, et Harald Menghin dessine votre concept à la main.", "Verifichiamo il vostro progetto, su richiesta facciamo il rilievo in loco e Harald Menghin disegna il vostro concept a mano."],
  ["Diese Planung online öffnen", "Open this plan online", "Ouvrir ce projet en ligne", "Aprire questo progetto online"],
  ["Planung öffnen:", "Open plan:", "Ouvrir le projet :", "Aprire il progetto:"],
];
