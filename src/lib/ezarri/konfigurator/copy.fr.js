// src/lib/ezarri/konfigurator/copy.fr.js – textes français du configurateur Ezarri
// (01.11.2026). Même structure que ./copy.js (source allemande) ; la fonction
// zusammenfassung() y est remplacée par les gabarits ZUSAMMENFASSUNG (objet
// sérialisable, transmis par le serveur). Vouvoiement, des faits plutôt que des
// adjectifs, pas de superlatifs, pas de prix. Indications du fabricant : « selon
// Ezarri ». Pour la Suisse romande et la France.
//
// UI     = textes de t("allemand", "anglais") dans les composants, clé = allemand.
// UI_TPL = textes avec variables, clé = 4e paramètre de t(), {nom} = variable.
// LISTEN = petites tables des composants (coins, murs, types, légendes, crédits).
//
// Espaces typographiques (avant : ; ? ! et dans « ») : posés par
// frenchTypography() dans copy-intl.js ; ici des espaces normales.
// Pur : aucun import. Serveur, client et node --test.

export const SEITE = Object.freeze({
  crumb: "Configurateur",
  eyebrow: "Ezarri · configurateur",
  title: "Concevoir votre bassin",
  lead: "Choisissez la mosaïque, le mélange, le joint et la forme du bassin et voyez l’eau qui va avec – en 3D, dans le navigateur, sans inscription.",
  metaTitle: "Configurateur de piscine en mosaïque Ezarri",
  metaDescription: "Concevoir un bassin en 3D : dimensions et forme libres, chaque mosaïque Ezarri, mélanges, joints, eau et lumière. Avec quantités et fiche à imprimer.",
  hinweisFarbe: "Les couleurs à l’écran sont une approximation. Le verre change à la lumière du jour et sous l’eau – regardez les échantillons avant de décider.",
  hinweisMessung: "Couleurs des tesselles mesurées sur les photos produit d’Ezarri ; brillance et reflets selon le configurateur Ezarri.",
  hinweisDaten: "Les quantités sont une estimation (facteurs Ezarri, 10 % de réserve). Votre carreleur détermine la quantité définitive sur la base du métré.",
  hinweisVerlegung: "La pose est confiée à une entreprise spécialisée en carrelage.",
  linkUngueltig: "Le lien ne contenait pas de projet valable. Nous affichons le projet de départ.",
  hinweisBrowser: "Le configurateur calcule uniquement dans votre navigateur. Il n’enregistre rien sur nos serveurs ; le projet est contenu dans le lien.",
  stand: "état au",
  planen: "Planifier votre bassin avec nous",
});

export const TABS = Object.freeze([
  { id: "mosaik", label: "Mosaïque" },
  { id: "becken", label: "Bassin" },
  { id: "wasser", label: "Eau et lumière" },
  { id: "mengen", label: "Quantités" },
]);

export const MODI_LABEL = Object.freeze({
  mosaik: { label: "Une mosaïque", sub: "une référence Ezarri" },
  mix: { label: "Votre mélange", sub: "jusqu’à 4 mosaïques avec leurs parts" },
  rezept: { label: "Mélange Ezarri", sub: "recettes prêtes, modifiables" },
  pattern: { label: "Trame de motifs", sub: "20 motifs Ezarri, 2⁠–⁠3 couleurs" },
});

export const SZENEN_LABEL = Object.freeze({
  pool: "Piscine",
  whirlpool: "Spa",
  bad: "Douche et salle de bain",
  kueche: "Crédence de cuisine",
});

export const FORM_LABEL = Object.freeze({
  rechteck: "Rectangle",
  radius: "Angles arrondis",
  rund: "Extrémités arrondies",
  l: "Forme en L",
  kreis: "Rond",
  quadrat: "Carré",
  nische: "Niche de douche",
  rueckwand: "Surface murale",
});

export const TREPPE_LABEL = Object.freeze({
  roemisch: "Escalier romain",
  eck: "Escalier d’angle",
  voll: "Sur toute la largeur",
  keine: "Sans escalier",
});

export const RAND_LABEL = Object.freeze({
  skimmer: { label: "Skimmer", sub: "eau env. 15 cm sous le bord" },
  ueberlauf: { label: "Goulotte de débordement", sub: "eau jusqu’au bord, goulotte tout autour" },
  infinity: { label: "Bord à débordement", sub: "l’eau déborde du côté profond" },
});

export const FORMAT_LABEL = Object.freeze({ 25: "25 mm", 50: "50 mm", hexa: "Hexa" });

export const WASSER_LABEL = Object.freeze({
  bewegt: "Agitée",
  ruhig: "Calme",
  leer: "Vide",
});

export const WASSERTON_LABEL = Object.freeze({
  klar: { label: "Claire", sub: "traitement au chlore ou au sel, bien filtrée" },
  naturpool: { label: "Piscine naturelle", sub: "filtrage biologique, plus verte" },
  salz: { label: "Eau de mer", sub: "teinte un peu plus froide" },
});

export const ZEIT_LABEL = Object.freeze({ morgen: "Matin", mittag: "Midi", abend: "Soir", nacht: "Nuit" });

export const LED_LABEL = Object.freeze({ aus: "Éteint", weiss: "Blanc", warm: "Blanc chaud", blau: "Bleu", tuerkis: "Turquoise" });

export const LAGE_LABEL = Object.freeze({
  bahnen: "Marquage de couloir au fond",
  wasserlinie: "Frise à la ligne d’eau",
  stufen: "Nez de marche",
});

export const KAMERA_LABEL = Object.freeze({
  uebersicht: "Vue d’ensemble",
  treppe: "Escalier",
  wasserlinie: "Ligne d’eau",
  unterwasser: "Sous l’eau",
  vogel: "Vue de dessus",
  nah: "Gros plan",
});

export const MASSE_LABEL = Object.freeze({
  pool: { l: "Longueur", b: "Largeur", tFlach: "Profondeur petit bain", tTief: "Profondeur grand bain" },
  whirlpool: { l: "Diamètre ou côté", b: "Largeur", tTief: "Profondeur d’eau" },
  bad: { l: "Largeur du mur du fond", b: "Profondeur de la niche", tTief: "Hauteur carrelée" },
  kueche: { l: "Largeur", tTief: "Hauteur entre plan de travail et meuble haut" },
});

export const KANAL_NAMEN = Object.freeze(["Fond", "Motif", "Accent"]);

export const HINWEIS_MIX = Object.freeze({
  allein: "Selon Ezarri, cette mosaïque ne se mélange pas. Elle est désormais seule.",
  voll: "Un mélange compte au maximum 4 mosaïques.",
  vorhanden: "Cette mosaïque fait déjà partie du mélange.",
  nichtMischbar: "ne se mélange pas selon Ezarri – uniquement seule",
});

export const AKTIONEN = Object.freeze({
  muster: "Demander des échantillons",
  musterSub: "pour votre rendez-vous à Lochau",
  angebot: "Demander un devis",
  rechner: "Calculer précisément",
  teilen: "Partager le lien",
  kopiert: "Lien copié",
  drucken: "Fiche à imprimer ou PDF",
  merken: "Enregistrer dans la liste de souhaits",
  gemerkt: "Enregistré dans la liste de souhaits",
  neu: "Recommencer",
  neuFrage: "Réinitialiser tous les réglages ?",
  rueck: "Annuler",
  vor: "Rétablir",
  vorher: "Garder l’« avant »",
  vergleich: "Avant / après",
  vergleichEnde: "Terminer la comparaison",
  drei: "Voir en 3D",
  zwei: "Vue en plan 2D",
  ar: "Voir dans votre jardin (RA)",
});

/** Gabarits de la synthèse (aria-live) ; remplace zusammenfassung() de copy.js. */
export const ZUSAMMENFASSUNG = Object.freeze({
  pool: "Piscine {l} × {b} m, profondeur {tFlach} à {tTief} m",
  whirlpool: "Spa {l} m",
  bad: "Niche de douche {l} × {b} m, hauteur {tTief} m",
  kueche: "Crédence de cuisine {l} × {tTief} m",
  satz: "{ort}. {mixText}. Format {formatLabel}, joint {fugeName}.",
});

export const UI = Object.freeze({
  // Vue RA
  "Das AR-Modell ließ sich auf diesem Gerät nicht erzeugen.": "Le modèle RA n’a pas pu être créé sur cet appareil.",
  "Modell wird erzeugt …": "Création du modèle…",
  "erst in der 3D-Ansicht verfügbar": "disponible uniquement dans la vue 3D",
  "Becken in Originalgröße": "Bassin en taille réelle",
  "Ihr Becken in Originalgröße": "Votre bassin en taille réelle",
  "Schließen": "Fermer",
  "Maßstab 1:1. Auf dem Handy erscheint „In AR ansehen“, wenn Ihr Gerät AR unterstützt.": "Échelle 1:1. Sur le téléphone, « Voir en RA » apparaît si votre appareil prend en charge la RA.",
  // Fiche (image)
  "Visualisierung des Beckens aus dem 3D-Konfigurator": "Visualisation du bassin issue du configurateur 3D",
  "Draufsicht des Beckens mit dem gewählten Mosaik": "Vue de dessus du bassin avec la mosaïque choisie",
  "Visualisierung wird erstellt …": "Création de la visualisation…",
  "Visualisierung, Farben angenähert": "Visualisation, couleurs approximatives",
  "Draufsicht (Visualisierung, Farben angenähert)": "Vue de dessus (visualisation, couleurs approximatives)",
  // Druck 02.11.: Pflichtunterschrift, Fotoansicht und Fußzeile des Druckblatts
  "Visualisierung (Rendering) · Farben angenähert, kein Foto": "Visualisation (rendu) · couleurs approximatives, pas une photo",
  "Beispielbecken 8 × 4 m, nicht Ihre Maße": "bassin d’exemple de 8 × 4 m, pas vos dimensions",
  "Ihr Becken": "Votre bassin",
  "Becken-Entwurf": "Projet de bassin",
  "Seite": "Page",
  "von": "sur",
  "Nahansicht des Mosaiks, vergrößert": "Gros plan de la mosaïque, agrandi",
  "Nahansicht von Steinen und Fuge (vergrößert)": "Gros plan des tesselles et du joint (agrandi)",
  "Drucken oder als PDF speichern": "Imprimer ou enregistrer en PDF",
  // Votre photo
  "Bitte ein Foto wählen (JPG, PNG, HEIC oder WebP).": "Veuillez choisir une photo (JPG, PNG, HEIC ou WebP).",
  "Das Foto ist größer als 25 MB. Bitte ein kleineres wählen.": "La photo dépasse 25 Mo. Veuillez en choisir une plus petite.",
  "Diese Lage würde die Fläche überkreuzen – die Ecke bleibt, wo sie war.": "Cette position croiserait la surface – le coin reste où il était.",
  "Fläche zurückgesetzt.": "Surface réinitialisée.",
  "Legen Sie das Mosaik probeweise über ein Foto Ihres Beckens oder Bads. Das Foto bleibt in Ihrem Browser: Es wird nicht hochgeladen und nicht gespeichert und ist weg, sobald Sie die Seite schließen.":
    "Posez la mosaïque à l’essai sur une photo de votre bassin ou de votre salle de bain. La photo reste dans votre navigateur : elle n’est ni envoyée ni enregistrée et disparaît dès que vous fermez la page.",
  "Anderes Foto wählen": "Choisir une autre photo",
  "Eigenes Foto wählen": "Choisir votre photo",
  "Fläche zurücksetzen": "Réinitialiser la surface",
  "Foto entfernen": "Retirer la photo",
  "Foto geladen. Ziehen Sie die vier Ecken der Mosaikfläche auf die Ecken von Boden oder Wand.": "Photo chargée. Faites glisser les quatre coins de la surface en mosaïque sur les coins du sol ou du mur.",
  "Ihr Foto (nur in diesem Browser)": "Votre photo (uniquement dans ce navigateur)",
  "Fotomontage zur Orientierung, kein Rendering: Licht und Farben weichen ab. Die echten Farben zeigen wir Ihnen am Muster in Lochau.":
    "Photomontage pour vous orienter, pas un rendu : lumière et couleurs diffèrent. Les vraies couleurs, nous vous les montrons sur échantillon à Lochau.",
  "Ecken ziehen oder antippen und mit den Pfeiltasten verschieben (mit Umschalt in großen Schritten). Ohne Ziehen: Ecke unten wählen und mit den Reglern setzen.":
    "Faites glisser ou touchez les coins et déplacez-les avec les flèches (avec Maj par grands pas). Sans glisser : choisissez un coin ci-dessous et placez-le avec les curseurs.",
  "Ecke wählen": "Choisir un coin",
  "Deckkraft": "Opacité",
  // Configurateur
  "Das Sortiment konnte nicht geladen werden. Bitte laden Sie die Seite neu.": "La gamme n’a pas pu être chargée. Veuillez recharger la page.",
  "Motiv-Raster": "Trame de motifs",
  "Mosaik": "Mosaïque",
  "Vorher festgehalten. Ändern Sie jetzt Mosaik, Fuge oder Wasser – links sehen Sie den Stand von vorher.": "« Avant » enregistré. Modifiez maintenant la mosaïque, le joint ou l’eau – à gauche, vous voyez l’état précédent.",
  "Mein Becken mit Ezarri-Mosaik": "Mon bassin en mosaïque Ezarri",
  "Ezarri-Konfigurator": "Configurateur Ezarri",
  "Becken-Entwurf": "Projet de bassin",
  "Neu begonnen. Rückgängig holt den alten Stand zurück.": "Nouveau départ. « Annuler » rétablit l’état précédent.",
  "ca.": "env.",
  "Kartons": "cartons",
  "Blätter": "plaques",
  "Einstellungen": "Réglages",
  "Wie möchten Sie starten?": "Comment souhaitez-vous commencer ?",
  "Einstieg": "Départ",
  "Ihr Mosaik": "Votre mosaïque",
  "Mosaik wählen": "Choisir une mosaïque",
  "Anderes Mosaik wählen": "Choisir une autre mosaïque",
  "Ezarri-Mischung": "Mélange Ezarri",
  "Ihre Mischung": "Votre mélange",
  "Fertige Mischung laut Ezarri": "Mélange prêt selon Ezarri",
  "Bitte wählen (oder unten verändern)": "Veuillez choisir (ou modifier ci-dessous)",
  "Rezept laut Ezarri": "Recette selon Ezarri",
  "Nach Produktfoto (Rezept unvollständig oder widersprüchlich)": "D’après la photo produit (recette incomplète ou contradictoire)",
  "Mosaik austauschen": "Remplacer la mosaïque",
  "Mosaik zur Mischung hinzufügen": "Ajouter une mosaïque au mélange",
  "Mosaik hinzufügen": "Ajouter une mosaïque",
  "von": "sur",
  "Nicht mischbare Mosaike (laut Ezarri) stehen immer allein. Die Verteilung je Stein ist zufällig und bleibt beim Teilen gleich.":
    "Les mosaïques qui ne se mélangent pas (selon Ezarri) restent toujours seules. La répartition par tesselle est aléatoire et reste identique lors du partage.",
  "Verteilung neu würfeln": "Redistribuer au hasard",
  "Raster werden geladen …": "Chargement des trames…",
  "Ändern": "Modifier",
  "Patterns laut Ezarri, Steinraster aus den Ezarri-Vorschaubildern abgelesen.": "Motifs selon Ezarri, trames de tesselles relevées sur les aperçus Ezarri.",
  "Format und Fuge": "Format et joint",
  "Nicht für alle gewählten Mosaike erhältlich": "Pas disponible pour toutes les mosaïques choisies",
  "Fugenfarbe": "Couleur du joint",
  "Kanäle und Streifen": "Couloirs et bandes",
  "Bis zu 3 Streifen mit eigenem Mosaik: Bahnmarkierung, Band an der Wasserlinie oder Stufenkanten.": "Jusqu’à 3 bandes avec leur propre mosaïque : marquage de couloir, frise à la ligne d’eau ou nez de marche.",
  "Mosaik für den Streifen": "Mosaïque pour la bande",
  "Entfernen": "Retirer",
  "Lage": "Position",
  "Breite": "Largeur",
  "Streifen hinzufügen": "Ajouter une bande",
  "Spezialteile": "Pièces spéciales",
  "Kanten mit Corner-Teilen": "Arêtes avec pièces Corner",
  " (laut Ezarri, Bild fehlt)": " (selon Ezarri, sans image)",
  "Für dieses Mosaik führt Ezarri kein Corner-Teil – wählen Sie ein passendes.": "Ezarri ne propose pas de pièce Corner pour cette mosaïque – choisissez-en une qui convient.",
  "Hohlkehlen mit Cove-Teilen": "Gorges avec pièces Cove",
  "Für dieses Mosaik führt Ezarri kein Cove-Teil – wählen Sie ein passendes.": "Ezarri ne propose pas de pièce Cove pour cette mosaïque – choisissez-en une qui convient.",
  "Corner-Teil wählen": "Choisir une pièce Corner",
  "Corner wählen": "Choisir Corner",
  "Cove-Teil wählen": "Choisir une pièce Cove",
  "Cove wählen": "Choisir Cove",
  "Corner deckt Kanten (Beckenkopf, Stufen, Bank), Cove die Kehle zwischen Boden und Wand. Die Längen stehen unter „Mengen“.":
    "Corner couvre les arêtes (margelle, marches, banquette), Cove la gorge entre sol et mur. Les longueurs figurent sous « Quantités ».",
  "Wo liegt das Mosaik?": "Où se trouve la mosaïque ?",
  "Szene": "Scène",
  "Form und Maße": "Forme et dimensions",
  "Form": "Forme",
  "Der Boden fällt stufenlos von der flachen zur tiefen Seite.": "Le fond descend en pente continue du petit au grand bain.",
  "Standardmaße": "Dimensions standard",
  "Treppe, Bank und Rand": "Escalier, banquette et bord",
  "Treppe": "Escalier",
  "Sitzbank unter Wasser": "Banquette immergée",
  "an der Längswand, Sitzfläche 50 cm unter dem Rand": "le long du grand côté, assise 50 cm sous le bord",
  "Beckenrand": "Bord du bassin",
  "Ausstattung": "Équipement",
  "Umlaufende Sitzbank": "Banquette sur tout le pourtour",
  "Mit Foto Ihres Beckens vergleichen": "Comparer avec une photo de votre bassin",
  "Wasser": "Eau",
  "Zustand": "État",
  "Wasserart": "Type d’eau",
  "Licht": "Lumière",
  "Tageszeit": "Moment de la journée",
  "Unterwasser-Licht (LED)": "Éclairage subaquatique (LED)",
  "Die Kaustik (Lichtnetz am Boden) wird aus Sonnenstand und Wasserbewegung berechnet. Bei „Bewegung reduzieren“ steht sie still.":
    "Les caustiques (réseau de lumière au fond) sont calculées à partir de la position du soleil et du mouvement de l’eau. Avec « Réduire les animations », elles restent immobiles.",
  "Wasser und Tageslicht gelten für Pool und Whirlpool. Bad und Küche zeigen wir im Innenlicht.": "L’eau et la lumière du jour s’appliquent à la piscine et au spa. Salle de bain et cuisine sont montrées en lumière intérieure.",
  "Flächen und Mengen": "Surfaces et quantités",
  "Nächste Schritte": "Étapes suivantes",
  "Termin mit diesem Plan": "Rendez-vous avec ce plan",
  "Bad": "Salle de bain",
  "Küche": "Cuisine",
  "Whirlpool": "Spa",
  "Pool": "Piscine",
  "Vorschau": "Aperçu",
  "Mosaik, Becken, Wasser und Licht gehen auf den Startentwurf zurück. Mit „Rückgängig“ holen Sie den jetzigen Stand zurück.":
    "Mosaïque, bassin, eau et lumière reviennent au projet de départ. « Annuler » rétablit l’état actuel.",
  "Oberfläche laut Ezarri nicht angegeben": "surface non indiquée par Ezarri",
  "Wasserwirkung laut Ezarri": "Effet dans l’eau selon Ezarri",
  "Wasserwirkung": "Effet dans l’eau",
  "laut Ezarri": "selon Ezarri",
  "laut Ezarri ohne Angabe": "non indiqué par Ezarri",
  "Fotos des Mosaiks": "Photos de la mosaïque",
  "Projekte und Muster mit Ezarri-Mosaik": "Projets et échantillons en mosaïque Ezarri",
  "Abbrechen": "Annuler",
  // Quantités
  "Boden": "Fond",
  "Treppe (Tritt- und Setzstufen)": "Escalier (marches et contremarches)",
  "Sitzbank": "Banquette",
  "Rinne bzw. Überlaufkante": "Goulotte ou bord de débordement",
  "Flächen": "Surfaces",
  "Fläche netto": "Surface nette",
  "Bestellmenge": "Quantité à commander",
  "Blätter (Netze)": "Plaques (trames)",
  "Gewicht Mosaik ca.": "Poids de la mosaïque env.",
  "Kleber laut Ezarri": "Colle selon Ezarri",
  "Fugenmasse laut Ezarri": "Mortier de joint selon Ezarri",
  "Corner (Kanten)": "Corner (arêtes)",
  "lfm": "m lin.",
  "Cove (Hohlkehlen)": "Cove (gorges)",
  "Kartons je Mosaik der Mischung": "Cartons par mosaïque du mélange",
  // Bande de mélange
  "Austauschen": "Remplacer",
  // Sélecteur
  "Auswahl schließen": "Fermer la sélection",
  "Suche nach Name, Code oder Kollektion": "Recherche par nom, code ou collection",
  "Name, Code oder Kollektion": "Nom, code ou collection",
  "Art": "Type",
  "Weitere Filter": "Autres filtres",
  "Kollektion": "Collection",
  "Alle": "Toutes",
  "nur mischbare Mosaike": "uniquement les mosaïques mélangeables",
  "Farbfamilie": "Famille de couleurs",
  "Alle Farben": "Toutes les couleurs",
  "Sortiment wird geladen …": "Chargement de la gamme…",
  " · in Mischungen nur mischbare Mosaike": " · dans les mélanges, uniquement les mosaïques mélangeables",
  ", rutschhemmend": ", antidérapante",
  "allein, nicht mischbar": "seule, ne se mélange pas",
  // Scène
  "Fotoansicht: Visualisierung eines Beispielbeckens 8 × 4 m": "Vue photo : visualisation d’un bassin d’exemple de 8 × 4 m",
  "Vorschau des Beckens": "Aperçu du bassin",
  "Draufsicht des Beckens": "Vue de dessus du bassin",
  "Vorher": "Avant",
  "Nachher": "Après",
  "Fotoansicht (Beispielbecken 8 × 4 m)": "Vue photo (bassin d’exemple de 8 × 4 m)",
  "Foto": "Photo",
  "Strg+Z": "Ctrl+Z",
  "Nichts rückgängig zu machen": "Rien à annuler",
  "Strg+Umschalt+Z": "Ctrl+Maj+Z",
  "Nichts zu wiederholen": "Rien à rétablir",
  "Fotoansicht nach dem Vergleich verfügbar": "Vue photo disponible après la comparaison",
  "Vorschau, für 3D tippen": "Aperçu, touchez pour la 3D",
  "Vorschau, Farben angenähert": "Aperçu, couleurs approximatives",
  "3D wird geladen …": "Chargement de la 3D…",
  "Die 3D-Ansicht wurde beendet (Grafikspeicher). Sie sehen die 2D-Draufsicht.": "La vue 3D a été fermée (mémoire graphique). Vous voyez la vue en plan 2D.",
  "Ansicht bewegen": "Déplacer la vue",
  "Fertig": "Terminé",
  "Näher": "Plus près",
  "Weiter weg": "Plus loin",
  "Teilung": "Séparation",
  "Teilung Vorher/Nachher in Prozent": "Séparation avant/après en pourcentage",
  "Ansicht": "Vue",
  "Kamera": "Point de vue",
  "Fotoansicht wird geladen …": "Chargement de la vue photo…",
  "Nahansicht": "Gros plan",
  "flaches Ende": "petit bain",
  // Fiche à imprimer
  "Druckblatt Becken-Entwurf": "Fiche à imprimer : projet de bassin",
  "Ihr Entwurf aus dem Ezarri-Konfigurator zum Drucken oder Speichern als PDF.": "Votre projet issu du configurateur Ezarri, à imprimer ou à enregistrer en PDF.",
  "Maße": "Dimensions",
  "ja": "oui",
  "nein": "non",
  "Rand": "Bord",
  "Zurück zum Konfigurator": "Retour au configurateur",
  "Ihr Becken-Entwurf": "Votre projet de bassin",
  "Stand": "État au",
  "ohne Preise": "sans prix",
  "Entwurf öffnen": "Ouvrir le projet",
  "Fläche": "Surface",
  "Anteil": "Part",
  "Safe (rutschhemmend)": "Safe (antidérapant)",
  "Darstellung nach Produktfoto": "Représentation d’après la photo produit",
  "Rezeptangaben von Ezarri widersprüchlich": "données de recette d’Ezarri contradictoires",
  "Rezept unvollständig": "recette incomplète",
  "Kanal": "Canal",
  "Fuge": "Joint",
  "Format": "Format",
  "Streifen": "Bande",
  "passendes Teil wählen wir mit Ihnen": "nous choisissons avec vous la pièce adaptée",
  "Mengen (Schätzung)": "Quantités (estimation)",
  "Bestellmenge (volle Kartons)": "Quantité à commander (cartons entiers)",
  "Preise nennen wir auf Anfrage.": "Prix sur demande.",
  "Steinfarben gemessen aus Ezarri-Produktbildern · Stand 28.10.2026": "couleurs des tesselles mesurées sur les photos produit d’Ezarri · état au 28.10.2026",
  // Calculateur
  "Summe der Teilflächen": "Somme des surfaces partielles",
  "Volle Kartons": "Cartons entiers",
  "Eingaben des Mosaik-Rechners": "Saisies du calculateur de mosaïque",
  "Form des Beckens": "Forme du bassin",
  "automatisch": "automatique",
  "Art des Beckenrands": "Type de bord",
  "0,4": "0,4",
  "0,9": "0,9",
  "2,5 kg/m²": "2,5 kg/m²",
  "Stk.": "pce",
  "und": "et",
  "U": "P",
});

export const UI_TPL = Object.freeze({
  "ar.alt": "Bassin {l} × {b} m avec la mosaïque choisie",
  "foto.ecke": "Coin {ecke} : {x} % depuis la gauche, {y} % depuis le haut",
  "foto.eckeX": "Coin {ecke} – horizontal",
  "foto.eckeY": "Coin {ecke} – vertical",
  "rezept.widerspruch": "Représentation d’après la photo produit : les données de recette d’Ezarri pour « {name} » sont contradictoires ici ; nous montrons la référence finie d’après la photo produit.",
  "rezept.unvollstaendig": "Recette incomplète, représentation d’après la photo produit : pour « {name} », Ezarri cite des composants absents de la gamme de son configurateur. Nous montrons donc la référence finie avec les couleurs de la photo Ezarri, et non comme un mélange modifiable.",
  "raster.aria": "Trame {name}, {n} couleurs",
  "bild.nah": "Ezarri {name}, mosaïque de verre, gros plan",
  "bild.becken": "Bassin en Ezarri {name}",
  reserve: "avec {p} % de réserve",
  "mix.grenze": "Limite entre {a} et {b}",
  "mix.weniger": "{name} : 5 pour cent de moins",
  "mix.mehr": "{name} : 5 pour cent de plus",
  "mix.austauschen": "Remplacer {name}",
  "mix.entfernen": "Retirer {name} du mélange",
  "picker.mehr": "Afficher {n} de plus",
  "picker.treffer1": "{n} résultat",
  "picker.trefferN": "{n} résultats",
  "stage.aria3d": "Vue 3D du bassin. Les flèches font pivoter, plus et moins zooment, les chiffres de 1 à {n} choisissent le point de vue, 0 réinitialise la vue.",
  "stage.keinWebglVorschau": "Votre navigateur n’affiche pas WebGL. Vous voyez un aperçu aux couleurs approximatives ; quantités, lien, fiche à imprimer et demande fonctionnent comme d’habitude.",
  "stage.keinWebgl2d": "Votre navigateur n’affiche pas WebGL. Vous voyez la vue en plan 2D ; quantités, lien, fiche à imprimer et demande fonctionnent comme d’habitude.",
  "stage.fotoAlt": "Visualisation : bassin d’exemple de 8 × 4 m avec {name}, {view}, lumière du {licht}",
  "ctl.weniger": "Diminuer {label}",
  "ctl.mehr": "Augmenter {label}",
  "ctl.schieber": "{label} (curseur)",
  "blatt.fotoAlt": "Visualisation : bassin d’exemple de 8 × 4 m avec {name}",
  "blatt.massePool": "{l} × {b} m, profondeur {tf} à {tt} m",
  "blatt.masseWhirl": "{l} m, profondeur {tt} m",
  "blatt.masseBad": "{l} × {b} m, hauteur carrelée {tt} m",
  "blatt.menge": "{m2} · {k} cartons · {b} plaques",
  "blatt.davon": "dont {name} ({p} %)",
  "rr.proKarton": "{m2} m² chacun",
  "rr.jeKarton": "{n} par carton",
  "rr.paletten": "{p} pleines + {k} cartons",
  "rr.kartonFormel": "{mitMarge} ÷ {m2} m² par carton, arrondi = {n} cartons",
});

export const LISTEN = Object.freeze({
  ecken: { ol: "en haut à gauche", or: "en haut à droite", ur: "en bas à droite", ul: "en bas à gauche" },
  waende: {
    "Längswände": "Grands côtés",
    "Stirnwand flach": "Petit côté, petit bain",
    "Stirnwand tief": "Petit côté, grand bain",
    "Rückwand": "Mur du fond",
    "Seitenwand links": "Mur latéral gauche",
    "Seitenwand rechts": "Mur latéral droit",
    "Rückwand Küche": "Crédence",
    Wand: "Mur",
  },
  typ: { mosaik: "Mosaïques", safe: "Antidérapant (Safe)", corner: "Corner (arête)", cove: "Cove (gorge)" },
  treppeLegende: { roemisch: "Demi-cercles à gauche : escalier romain", eck: "Quart de cercle à gauche : escalier d’angle", voll: "Bande à gauche : escalier sur toute la largeur" },
  fotoView: { hero: "Vue d’ensemble", wasserlinie: "Ligne d’eau", draufsicht: "Vue de dessus" },
  fotoLicht: { morgen: "Matin", abend: "Soir" },
  fotoLichtAlt: { morgen: "matin", abend: "soir" },
  fotoCaption: "Visualisation (rendu), veuillez vérifier l’effet des couleurs sur échantillon",
  fotoDekorHinweis: "Couleur de fond du motif seulement, sans le dessin.",
  fotoHinweis: "Vue photo disponible comme bassin d’exemple de 8 × 4 m pour les couleurs unies",
  credit: { bild: "Image : Ezarri, ezarri.com", daten: "Données : Ezarri, ezarri.com" },
  farbfamilien: { weiss: "Blanc", grau: "Gris", schwarz: "Noir", blau: "Bleu", gruen: "Vert", gelb: "Jaune", braun: "Brun", rosa: "Rose", rot: "Rouge" },
  wasserwirkung: { himmelblau: "Bleu ciel", tuerkisblau: "Turquoise", blau: "Bleu profond", gruen: "Vert", graugruen: "Gris-vert", natur: "Naturel, comme un lac de montagne" },
  oberflaeche: { "glänzend": "brillant", matt: "mat", satiniert: "satiné", phosphoreszierend: "phosphorescent", "glänzend, matt": "brillant, mat" },
  datum: "fr-FR",
});
