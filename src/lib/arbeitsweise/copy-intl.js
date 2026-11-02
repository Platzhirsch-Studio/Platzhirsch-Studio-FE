// src/lib/arbeitsweise/copy-intl.js – EN/FR/IT der Seite /arbeitsweise
// (R5-fix P2, gesamtwerk P1-2 / neuland P1-6 / seo P1-4).
//
// Übersetzt aus den bestätigten deutschen Texten in ./copy.js – keine neuen
// Aussagen, keine Dauer, kein „kostenlos“, keine Rolle für Harald, keine
// Preise. Grundlage: der Vorschlag des Teams Arbeitsweise
// (Marktresearch/digital/features/arbeitsweise-messages-vorschlag.json), an
// die heutige deutsche Fassung angeglichen (Termin „anfragen“ statt „wählen“,
// Hinweis ohne „60 Minuten · kostenlos“, Harald ohne Rolle). Schrittnamen wie
// auf der Startseite (src/messages/*.json HomePage.process.steps).
// Anrede: EN neutral, FR vouvoiement, IT voi (recht P1-1).
// Nur Texte; Ids, Pfade und Schalter kommen aus copy.js (arbeitsweiseCopy()).
// Werkzeuge und Seiten, die es nur auf Deutsch gibt (Planer, Bodensee-Licht,
// Yacht, Outdoor), sind im Linktext als deutsch gekennzeichnet.
// Rein, ohne React und ohne Pakete (node --test).

export const INTL = {
  en: {
    META: {
      title: "Interior planning: hand drawing, model, 3D · Platzhirsch",
      description:
        "We look at your rooms on site, Harald Menghin draws by hand and builds a model. Then 3D planning and rendering. Showroom in Lochau on Lake Constance.",
      ogTitle: "From hand drawing to rendering",
    },
    crumbs: { house: "The house", page: "How we work" },
    STEPS: ["Getting to know you", "On site", "Hand drawing", "Model", "3D planning", "Rendering", "Realisation"],
    stepWord: "Step",
    APPOINTMENT: {
      label: "Request an appointment",
      note: "In the showroom with café or at your home",
      noteClosing: "Tuesday to Saturday, at your home on request",
    },
    HERO: {
      overline: "How we work",
      title: "From hand drawing to rendering.",
      lead: "We get to know your rooms before we plan. Harald Menghin draws your concept by hand and builds a model. Then we plan in 3D, and you see your room photorealistically before anything is ordered.",
      stepsLink: "See the seven steps",
      sheet: { a: "Paper.", b: "Model.", c: "Room.", line: "First the line. Then your room." },
    },
    HALTUNG: {
      overline: "What defines us",
      title: "We are designers. We take our time.",
      paragraphs: [
        "With us, furnishing a home does not start in a catalogue but with you: with your rooms, your light and your everyday life.",
        "That is why we come to you. If your project needs it, we also stay on site for a day or two.",
        "What we see there, Harald Menghin draws by hand. The drawing becomes a model, the model an exact 3D plan. So the first idea stays intact until the finished room.",
      ],
      pillars: [
        { word: "Place", text: "Light, climate and routes, before any piece of furniture is named." },
        { word: "Hand", text: "Drawing and model, which you work on with us." },
        { word: "Precision", text: "3D planning with dimensions and a rendering before the order." },
      ],
    },
    UEBERSICHT: {
      overline: "How your room comes about",
      title: "Seven steps, from the first conversation to moving in.",
      note: "Not every project needs every step at full length. What makes sense, we discuss in the first appointment.",
      grafikNote: "The line graphics on this page are digital diagrams by the studio. They show the process, not Harald’s drawings.",
    },
    VOR_ORT: {
      overline: "Steps 01 and 02",
      title: "First, we look around.",
      steps: {
        1: "We talk in the showroom in Lochau, over a coffee in the café if you like, or at your home. You tell us how you live and what should change. Floor plans, photos and measurements help, but are not required.",
        2: "A room is more than its floor plan. We look at how the light moves during the day, how the room feels in summer and in winter, and which paths you take every day. If your project needs it, we also stay for a day or two.",
      },
      listTitle: "What we look at on site",
      list: [
        "Light in the morning, at midday and in the evening",
        "Climate, sun, wind and view",
        "Routes, doors and passages",
        "What stays: furniture, pictures, keepsakes",
        "How you live: cooking, guests, children, quiet",
      ],
      cta: "Request an appointment on site",
      ctaNote: "Whether and to what extent we work on site, we discuss with you beforehand.",
      lichtLabel: "How the light falls in winter: Bodensee-Licht (in German)",
    },
    VON_HAND: {
      overline: "Steps 03 and 04",
      title: "The first design is made on paper.",
      steps: {
        3: "Harald Menghin sketches floor plan, perspectives and moods by hand. On paper, variants can be compared quickly, and you see early on where things are heading. The drawing does not show every detail, but the idea.",
        4: "Then Harald builds a scale model of the room, as you know it from architects and developers. You can touch it, look at it from all sides and rearrange it together with us. Many questions are settled faster at the table than on a screen.",
      },
    },
    STRICH_ZUM_RAUM: {
      overline: "Steps 05 and 06",
      title: "Then it gets precise.",
      steps: {
        5: "We transfer drawing and model into a digital plan with exact dimensions and the selected products and materials. Now it shows whether every door opens, every drawer has room and every sofa fits through the stairwell.",
        6: "The plan becomes a photorealistic image of your room. You see how fabrics, wood and light work together before anything is ordered. You give your feedback in conversation or in the customer portal, also by voice message.",
      },
      renderingLabel: "Visualisation from the plan, not a photo.",
      beispiel: {
        caption: "Example from our kitchen planner, not a client project.",
        alt: "Floor plan of an L-shaped kitchen with dimension lines in centimetres and the work triangle between sink, fridge and hob",
        link: "Try the kitchen planner",
      },
    },
    WIRKLICHKEIT: {
      overline: "Step 07",
      title: "Until you have moved in.",
      text: "We order, coordinate the delivery and, on request, the assembly. If several trades are involved, we coordinate the dates. And we accompany your project until everything stands as it was drawn.",
    },
    HARALD: {
      overline: "Who draws",
      text: "Harald thinks with a pencil. Before he plans on screen, he draws. Then he builds the model you keep working on together with us. With us, he accompanies your project from the first sketch to the plan.",
      teamLabel: "Meet the whole team",
      does: [
        { word: "Draws", text: "Floor plan, perspectives and moods by hand." },
        { word: "Builds", text: "A scale model of the room that you can touch." },
        { word: "Accompanies", text: "Conversations at your home, in the showroom and at the model." },
      ],
      doesLabel: "What Harald Menghin does in your project",
    },
    HANDWERK_LABELS: { werkzeug: "Tools", massstab: "Scale", material: "Material", modellDauer: "Duration" },
    KETTE: {
      overline: "From the first line to the finished room",
      title: "One project, step by step.",
      text: "This is how a room looked before the planning, how Harald drew it, how it stood in the model, in the visualisation and today.",
      groupLabel: "Choose a stage of the project",
      stations: [
        { label: "Before", kind: "Photo before the planning" },
        { label: "Sketch", kind: "Hand drawing by Harald Menghin" },
        { label: "Model", kind: "Photo of the model" },
        { label: "Rendering", kind: "Rendering" },
        { label: "Today", kind: "Photo of the realisation" },
      ],
      factLabels: { region: "Region", typologie: "Type", flaeche: "Area", dauer: "Duration" },
      consent: "Published with the consent of the client.",
      placeholder: "Project sequence to follow: before · sketch · model · rendering · today",
    },
    ONLINE: {
      overline: "Begin online",
      title: "Start online. Harald keeps drawing.",
      lead: "Would you like to try things out yourself first? Our online planners are a good start. If you then plan with us, Harald takes your result to the drawing table.",
      onlineLabel: "Online",
      studioLabel: "Then in the studio",
      cards: [
        {
          title: "Kitchen planner",
          online: "Lay out floor plan, runs and appliances in 3D.",
          studio: "Harald continues drawing your kitchen by hand, and we check dimensions and connections on site.",
          link: "Plan a kitchen online",
        },
        {
          title: "Sofa planner",
          online: "Put together model, modules and cover.",
          studio: "Try it out in Lochau, and we draw how the sofa stands in your room.",
          link: "Put together a sofa",
        },
        {
          title: "Style finder",
          online: "Find your style in a few picture questions.",
          studio: "Your result becomes the first sketch for your rooms.",
          link: "Find your style",
        },
      ],
      note: "The online planners are non-binding and do not replace planning on site.",
    },
    FAQ: {
      overline: "Questions",
      title: "Questions about how we work",
      items: [
        {
          q: "Does Harald really draw every concept by hand?",
          a: "Yes, our furnishing concepts begin with a hand drawing, and then Harald builds a model. How many sketches there are and how detailed the model becomes depends on the project. We discuss this in the first appointment.",
        },
        {
          q: "Why a model when there are 3D renderings?",
          a: "You can pick up a model and rearrange it together. Many questions about proportions and routes can be settled faster this way. The 3D planning follows and makes everything accurate to the millimetre.",
        },
        {
          q: "Do you come to my home?",
          a: "Yes. We look at your rooms on site, in Vorarlberg, around Lake Constance and in the neighbouring regions. If your project needs it, we also stay a day or two to get to know light, climate and routines.",
        },
        {
          q: "What does planning with hand drawing and model cost?",
          a: "That depends on the scope. In the first appointment we clarify what your project needs. We discuss the costs with you before we continue planning.",
        },
        {
          q: "When will I see what my room will look like?",
          a: "The hand drawing already shows the idea. With the photorealistic rendering you see your room with materials and light before anything is ordered.",
        },
        {
          q: "Can I bring in changes?",
          a: "Yes, at every step. At the model, in conversation or in the customer portal, also by voice message.",
        },
        {
          q: "I have already planned in the kitchen or sofa planner. Do I start from scratch?",
          a: "No. Bring your result or send us the link. We continue planning from there, and Harald continues your concept by hand.",
        },
        {
          q: "Do you also plan hotels, holiday apartments or boats?",
          a: "Yes. The process is the same, from the appointment on site to the realisation. The specifics have their own pages: Yacht interior, Outdoor.",
          links: [{ label: "Yacht interior" }, { label: "Outdoor" }],
        },
      ],
    },
    ABSCHLUSS: {
      line: "Designs that live.",
      title: "Tell us about your rooms.",
      text: "We listen, look at them and begin with the first line.",
      trustLabel: "How we work",
      trust: [
        "Appointment on site if your project needs it",
        "Hand drawing and model before the 3D planning",
        "Your room as a rendering before anything is ordered",
      ],
    },
    UI: {
      placeholderOverline: "Image to follow",
      placeholderKind: {
        hero: "Harald at the drawing table",
        kennenlernen: "Conversation in the showroom, step 01",
        vorOrt: "Appointment on site, step 02",
        handzeichnung: "Hand drawing by Harald Menghin, step 03",
        modell: "Photo of the model, step 04",
        planung3d: "3D planning, step 05",
        rendering: "Rendering, step 06",
        portal: "Customer portal, step 06",
        umsetzung: "Photo of the realisation, step 07",
        portrait: "Portrait of Harald Menghin",
      },
    },
  },

  fr: {
    META: {
      title: "Aménagement intérieur : dessin, maquette, 3D · Platzhirsch",
      description:
        "Nous voyons vos pièces sur place, Harald Menghin dessine à la main et construit une maquette. Puis plan 3D et rendu. Showroom à Lochau.",
      ogTitle: "Du dessin à la main au rendu",
    },
    crumbs: { house: "La maison", page: "Notre méthode" },
    STEPS: ["Faire connaissance", "Sur place", "Dessin à la main", "Maquette", "Planification 3D", "Rendu", "Réalisation"],
    stepWord: "Étape",
    APPOINTMENT: {
      label: "Demander un rendez-vous",
      note: "Au showroom avec café ou chez vous",
      noteClosing: "Du mardi au samedi, chez vous sur demande",
    },
    HERO: {
      overline: "Notre méthode",
      title: "Du dessin à la main au rendu.",
      lead: "Nous apprenons à connaître vos pièces avant de planifier. Harald Menghin dessine votre concept à la main et construit une maquette. Ensuite, nous planifions en 3D, et vous voyez votre pièce de façon photoréaliste avant toute commande.",
      stepsLink: "Voir les sept étapes",
      sheet: { a: "Papier.", b: "Maquette.", c: "Espace.", line: "D’abord la ligne. Puis votre espace." },
    },
    HALTUNG: {
      overline: "Ce qui nous définit",
      title: "Nous sommes designers. Nous prenons le temps.",
      paragraphs: [
        "Chez nous, un aménagement ne commence pas dans un catalogue, mais chez vous : avec vos pièces, votre lumière et votre quotidien.",
        "C’est pourquoi nous venons chez vous. Si votre projet le demande, nous restons aussi un ou deux jours sur place.",
        "Ce que nous y voyons, Harald Menghin le dessine à la main. Le dessin devient une maquette, la maquette un plan 3D exact. Ainsi, l’idée première reste intacte jusqu’à la pièce terminée.",
      ],
      pillars: [
        { word: "Lieu", text: "Lumière, climat et circulations, avant de nommer le moindre meuble." },
        { word: "Main", text: "Dessin et maquette, auxquels vous participez." },
        { word: "Précision", text: "Plan 3D avec cotes et rendu avant la commande." },
      ],
    },
    UEBERSICHT: {
      overline: "Comment naît votre espace",
      title: "Sept étapes, du premier échange à l’emménagement.",
      note: "Tous les projets n’ont pas besoin de chaque étape dans toute sa durée. Ce qui est utile, nous en parlons lors du premier rendez-vous.",
      grafikNote: "Les graphiques linéaires de cette page sont des schémas numériques du studio. Ils montrent le déroulement, pas les dessins de Harald.",
    },
    VOR_ORT: {
      overline: "Étapes 01 et 02",
      title: "D’abord, nous regardons autour de nous.",
      steps: {
        1: "Nous échangeons au showroom de Lochau, volontiers autour d’un café, ou chez vous. Vous nous racontez comment vous vivez et ce qui doit changer. Plans, photos et mesures aident, mais ne sont pas indispensables.",
        2: "Une pièce est plus que son plan. Nous observons comment la lumière se déplace au fil de la journée, comment la pièce se ressent en été et en hiver, et quels chemins vous empruntez chaque jour. Si votre projet le demande, nous restons aussi un ou deux jours.",
      },
      listTitle: "Ce que nous observons sur place",
      list: [
        "La lumière le matin, à midi et le soir",
        "Climat, soleil, vent et vue",
        "Circulations, portes et passages",
        "Ce qui reste : meubles, tableaux, souvenirs",
        "Votre façon de vivre : cuisine, invités, enfants, calme",
      ],
      cta: "Demander un rendez-vous sur place",
      ctaNote: "Si et dans quelle mesure nous travaillons sur place, nous en discutons avec vous au préalable.",
      lichtLabel: "Comment la lumière tombe en hiver : Bodensee-Licht (en allemand)",
    },
    VON_HAND: {
      overline: "Étapes 03 et 04",
      title: "Le premier projet naît sur papier.",
      steps: {
        3: "Harald Menghin esquisse à la main le plan, les perspectives et les ambiances. Sur papier, les variantes se comparent vite, et vous voyez tôt la direction. Le dessin ne montre pas chaque détail, mais l’idée.",
        4: "Harald construit ensuite une maquette de la pièce à l’échelle, comme on la connaît chez les architectes et les promoteurs. Vous pouvez la toucher, la regarder sous tous les angles et la réagencer avec nous. Beaucoup de questions se règlent plus vite à la table qu’à l’écran.",
      },
    },
    STRICH_ZUM_RAUM: {
      overline: "Étapes 05 et 06",
      title: "Ensuite, tout devient précis.",
      steps: {
        5: "Nous transposons dessin et maquette dans un plan numérique aux dimensions exactes, avec les produits et matériaux choisis. On voit alors si chaque porte s’ouvre, si chaque tiroir a sa place et si chaque canapé passe par la cage d’escalier.",
        6: "Du plan naît une image photoréaliste de votre pièce. Vous voyez comment tissus, bois et lumière s’accordent avant toute commande. Vous donnez votre avis lors d’un échange ou dans l’espace client, aussi par message vocal.",
      },
      renderingLabel: "Visualisation issue du plan, pas une photo.",
      beispiel: {
        caption: "Exemple tiré de notre planificateur de cuisine, pas un projet client.",
        alt: "Plan d’une cuisine en L avec cotes en centimètres et le triangle de travail entre évier, réfrigérateur et plaque de cuisson",
        link: "Essayer le planificateur de cuisine",
      },
    },
    WIRKLICHKEIT: {
      overline: "Étape 07",
      title: "Jusqu’à votre emménagement.",
      text: "Nous commandons, coordonnons la livraison et, sur demande, le montage. Si plusieurs corps de métier interviennent, nous coordonnons les dates. Et nous accompagnons votre projet jusqu’à ce que tout soit en place, comme dessiné.",
    },
    HARALD: {
      overline: "Qui dessine",
      text: "Harald pense avec le crayon. Avant de planifier à l’écran, il dessine. Puis il construit la maquette sur laquelle vous continuez à travailler avec nous. Chez nous, il accompagne votre projet de la première esquisse jusqu’au plan.",
      teamLabel: "Découvrir toute l’équipe",
      does: [
        { word: "Dessine", text: "Plan, perspectives et ambiances à la main." },
        { word: "Construit", text: "Une maquette de la pièce à l’échelle, que vous pouvez toucher." },
        { word: "Accompagne", text: "Les échanges chez vous, au showroom et autour de la maquette." },
      ],
      doesLabel: "Ce que fait Harald Menghin dans votre projet",
    },
    HANDWERK_LABELS: { werkzeug: "Outils", massstab: "Échelle", material: "Matériau", modellDauer: "Durée" },
    KETTE: {
      overline: "Du premier trait à la pièce terminée",
      title: "Un projet, étape par étape.",
      text: "Voici la pièce avant la planification, telle que Harald l’a dessinée, telle qu’elle était dans la maquette, dans la visualisation et aujourd’hui.",
      groupLabel: "Choisir une étape du projet",
      stations: [
        { label: "Avant", kind: "Photo avant la planification" },
        { label: "Esquisse", kind: "Dessin à la main de Harald Menghin" },
        { label: "Maquette", kind: "Photo de la maquette" },
        { label: "Rendu", kind: "Rendu" },
        { label: "Aujourd’hui", kind: "Photo de la réalisation" },
      ],
      factLabels: { region: "Région", typologie: "Typologie", flaeche: "Surface", dauer: "Durée" },
      consent: "Publié avec l’accord du maître d’ouvrage.",
      placeholder: "Séquence du projet à venir : avant · esquisse · maquette · rendu · aujourd’hui",
    },
    ONLINE: {
      overline: "Commencer en ligne",
      title: "Commencer en ligne. Harald continue de dessiner.",
      lead: "Vous souhaitez d’abord essayer vous-même ? Nos planificateurs en ligne sont un bon début. Si vous planifiez ensuite avec nous, Harald emporte votre résultat à sa table à dessin.",
      onlineLabel: "En ligne",
      studioLabel: "Ensuite au studio",
      cards: [
        {
          title: "Planificateur de cuisine",
          online: "Créer en 3D le plan, les linéaires et les appareils.",
          studio: "Harald poursuit le dessin de votre cuisine à la main, et nous vérifions cotes et raccordements sur place.",
          link: "Planifier une cuisine en ligne",
        },
        {
          title: "Planificateur de canapé",
          online: "Composer modèle, modules et revêtement.",
          studio: "Essai à Lochau, et nous dessinons la place du canapé dans votre pièce.",
          link: "Composer un canapé",
        },
        {
          title: "Stil-Finder",
          online: "Trouver votre style en quelques questions en images.",
          studio: "Votre résultat devient la première esquisse pour vos pièces.",
          link: "Trouver votre style",
        },
      ],
      note: "Les planificateurs en ligne sont sans engagement et ne remplacent pas une planification sur place.",
    },
    FAQ: {
      overline: "Questions",
      title: "Questions sur notre méthode",
      items: [
        {
          q: "Harald dessine-t-il vraiment chaque concept à la main ?",
          a: "Oui, nos concepts d’aménagement commencent par un dessin à la main, puis Harald construit une maquette. Le nombre d’esquisses et le niveau de détail de la maquette dépendent du projet. Nous en parlons lors du premier rendez-vous.",
        },
        {
          q: "Pourquoi une maquette alors qu’il existe des rendus 3D ?",
          a: "Une maquette se prend en main et se réagence ensemble. Beaucoup de questions de proportions et de circulations se règlent ainsi plus vite. Le plan 3D suit et donne à tout ses cotes exactes.",
        },
        {
          q: "Venez-vous chez moi ?",
          a: "Oui. Nous découvrons vos pièces sur place, au Vorarlberg, autour du lac de Constance et dans les régions voisines. Si votre projet le demande, nous restons aussi un ou deux jours pour connaître lumière, climat et habitudes.",
        },
        {
          q: "Combien coûte la planification avec dessin à la main et maquette ?",
          a: "Cela dépend de l’ampleur. Lors du premier rendez-vous, nous clarifions ce dont votre projet a besoin. Nous discutons des coûts avec vous avant de poursuivre la planification.",
        },
        {
          q: "Quand verrai-je à quoi ressemblera ma pièce ?",
          a: "Le dessin à la main montre déjà l’idée. Avec le rendu photoréaliste, vous voyez votre pièce avec matériaux et lumière avant toute commande.",
        },
        {
          q: "Puis-je apporter des modifications ?",
          a: "Oui, à chaque étape. Sur la maquette, lors d’un échange ou dans l’espace client, aussi par message vocal.",
        },
        {
          q: "J’ai déjà planifié avec le planificateur de cuisine ou de canapé. Dois-je tout recommencer ?",
          a: "Non. Apportez votre résultat ou envoyez-nous le lien. Nous poursuivons la planification à partir de là, et Harald continue votre concept à la main.",
        },
        {
          q: "Planifiez-vous aussi des hôtels, des appartements de vacances ou des bateaux ?",
          a: "Oui. Le déroulement est le même, du rendez-vous sur place à la réalisation. Les particularités ont leurs propres pages : Aménagement de yachts, Extérieur.",
          links: [{ label: "Aménagement de yachts" }, { label: "Extérieur" }],
        },
      ],
    },
    ABSCHLUSS: {
      line: "Des intérieurs qui vivent.",
      title: "Parlez-nous de vos pièces.",
      text: "Nous écoutons, nous les regardons et commençons par le premier trait.",
      trustLabel: "Notre méthode",
      trust: [
        "Rendez-vous sur place si votre projet le demande",
        "Dessin à la main et maquette avant le plan 3D",
        "Votre pièce en rendu avant toute commande",
      ],
    },
    UI: {
      placeholderOverline: "Image à venir",
      placeholderKind: {
        hero: "Harald à sa table à dessin",
        kennenlernen: "Échange au showroom, étape 01",
        vorOrt: "Rendez-vous sur place, étape 02",
        handzeichnung: "Dessin à la main de Harald Menghin, étape 03",
        modell: "Photo de la maquette, étape 04",
        planung3d: "Plan 3D, étape 05",
        rendering: "Rendu, étape 06",
        portal: "Espace client, étape 06",
        umsetzung: "Photo de la réalisation, étape 07",
        portrait: "Portrait de Harald Menghin",
      },
    },
  },

  it: {
    META: {
      title: "Progettazione d’interni: disegno, modello, 3D · Platzhirsch",
      description:
        "Vediamo i vostri spazi sul posto, Harald Menghin disegna a mano e costruisce un modello. Poi progetto 3D e rendering. Showroom a Lochau.",
      ogTitle: "Dal disegno a mano al rendering",
    },
    crumbs: { house: "La casa", page: "Il nostro metodo" },
    STEPS: ["Conoscersi", "Sul posto", "Disegno a mano", "Modello", "Progetto 3D", "Rendering", "Realizzazione"],
    stepWord: "Passo",
    APPOINTMENT: {
      label: "Richiedete un appuntamento",
      note: "Nello showroom con caffè o a casa vostra",
      noteClosing: "Da martedì a sabato, su richiesta a casa vostra",
    },
    HERO: {
      overline: "Il nostro metodo",
      title: "Dal disegno a mano al rendering.",
      lead: "Conosciamo i vostri spazi prima di progettare. Harald Menghin disegna il vostro concept a mano e costruisce un modello. Poi progettiamo in 3D, e vedete il vostro ambiente in modo fotorealistico prima di ordinare qualsiasi cosa.",
      stepsLink: "Guardate i sette passi",
      sheet: { a: "Carta.", b: "Modello.", c: "Spazio.", line: "Prima la linea. Poi il vostro spazio." },
    },
    HALTUNG: {
      overline: "Cosa ci contraddistingue",
      title: "Siamo designer. Ci prendiamo il tempo.",
      paragraphs: [
        "Da noi un arredamento non comincia in un catalogo, ma da voi: dai vostri spazi, dalla vostra luce e dalla vostra quotidianità.",
        "Per questo veniamo da voi. Se il vostro progetto lo richiede, restiamo sul posto anche uno o due giorni.",
        "Ciò che vediamo lì, Harald Menghin lo disegna a mano. Il disegno diventa un modello, il modello un progetto 3D esatto. Così l’idea iniziale resta intatta fino all’ambiente finito.",
      ],
      pillars: [
        { word: "Luogo", text: "Luce, clima e percorsi, prima di nominare un mobile." },
        { word: "Mano", text: "Disegno e modello, a cui lavorate con noi." },
        { word: "Precisione", text: "Progetto 3D con misure e un rendering prima dell’ordine." },
      ],
    },
    UEBERSICHT: {
      overline: "Come nasce il vostro spazio",
      title: "Sette passi, dal primo colloquio al trasloco.",
      note: "Non ogni progetto ha bisogno di ogni passo per intero. Che cosa ha senso, lo vediamo insieme al primo appuntamento.",
      grafikNote: "Le grafiche a linee di questa pagina sono schemi digitali dello studio. Mostrano il processo, non i disegni di Harald.",
    },
    VOR_ORT: {
      overline: "Passi 01 e 02",
      title: "Prima ci guardiamo intorno.",
      steps: {
        1: "Parliamo nello showroom di Lochau, magari con un caffè, oppure a casa vostra. Ci raccontate come vivete e che cosa deve cambiare. Piante, foto e misure aiutano, ma non sono indispensabili.",
        2: "Un ambiente è più della sua pianta. Osserviamo come si muove la luce durante la giornata, come si vive lo spazio d’estate e d’inverno e quali percorsi fate ogni giorno. Se il vostro progetto lo richiede, restiamo anche uno o due giorni.",
      },
      listTitle: "Che cosa osserviamo sul posto",
      list: [
        "La luce al mattino, a mezzogiorno e la sera",
        "Clima, sole, vento e vista",
        "Percorsi, porte e passaggi",
        "Che cosa resta: mobili, quadri, ricordi",
        "Come vivete: cucinare, ospiti, bambini, tranquillità",
      ],
      cta: "Richiedete un appuntamento sul posto",
      ctaNote: "Se e in che misura lavoriamo sul posto, lo concordiamo con voi in anticipo.",
      lichtLabel: "Come cade la luce in inverno: Bodensee-Licht (in tedesco)",
    },
    VON_HAND: {
      overline: "Passi 03 e 04",
      title: "Il primo progetto nasce su carta.",
      steps: {
        3: "Harald Menghin schizza a mano pianta, prospettive e atmosfere. Su carta le varianti si confrontano in fretta, e vedete presto in che direzione si va. Il disegno non mostra ogni dettaglio, ma l’idea.",
        4: "Poi Harald costruisce un modello in scala dell’ambiente, come lo conoscete da architetti e costruttori. Potete toccarlo, guardarlo da ogni lato e riorganizzarlo insieme a noi. Molte domande si chiariscono più in fretta al tavolo che sullo schermo.",
      },
    },
    STRICH_ZUM_RAUM: {
      overline: "Passi 05 e 06",
      title: "Poi diventa preciso.",
      steps: {
        5: "Trasferiamo disegno e modello in un progetto digitale con misure esatte e i prodotti e materiali scelti. Si vede allora se ogni porta si apre, se ogni cassetto trova posto e se ogni divano passa per le scale.",
        6: "Dal progetto nasce un’immagine fotorealistica del vostro ambiente. Vedete come tessuti, legno e luce si accordano prima di ordinare qualsiasi cosa. Il vostro riscontro lo date a voce o nel portale clienti, anche con un messaggio vocale.",
      },
      renderingLabel: "Visualizzazione dal progetto, non una foto.",
      beispiel: {
        caption: "Esempio dal nostro planner per cucine, non un progetto di un cliente.",
        alt: "Pianta di una cucina a L con quote in centimetri e il triangolo di lavoro tra lavello, frigorifero e piano cottura",
        link: "Provate il planner per cucine",
      },
    },
    WIRKLICHKEIT: {
      overline: "Passo 07",
      title: "Fino al vostro trasloco.",
      text: "Ordiniamo, coordiniamo la consegna e, su richiesta, il montaggio. Se intervengono più imprese, coordiniamo le date. E seguiamo il vostro progetto finché tutto è come era disegnato.",
    },
    HARALD: {
      overline: "Chi disegna",
      text: "Harald pensa con la matita. Prima di progettare allo schermo, disegna. Poi costruisce il modello su cui continuate a lavorare con noi. Da noi accompagna il vostro progetto dal primo schizzo fino al progetto.",
      teamLabel: "Conoscete tutto il team",
      does: [
        { word: "Disegna", text: "Pianta, prospettive e atmosfere a mano." },
        { word: "Costruisce", text: "Un modello in scala dell’ambiente, da toccare." },
        { word: "Accompagna", text: "I colloqui da voi, nello showroom e al modello." },
      ],
      doesLabel: "Che cosa fa Harald Menghin nel vostro progetto",
    },
    HANDWERK_LABELS: { werkzeug: "Strumenti", massstab: "Scala", material: "Materiale", modellDauer: "Durata" },
    KETTE: {
      overline: "Dal primo tratto all’ambiente finito",
      title: "Un progetto, passo dopo passo.",
      text: "Così era un ambiente prima del progetto, così l’ha disegnato Harald, così era nel modello, così nella visualizzazione e così oggi.",
      groupLabel: "Scegliete una fase del progetto",
      stations: [
        { label: "Prima", kind: "Foto prima del progetto" },
        { label: "Schizzo", kind: "Disegno a mano di Harald Menghin" },
        { label: "Modello", kind: "Foto del modello" },
        { label: "Rendering", kind: "Rendering" },
        { label: "Oggi", kind: "Foto della realizzazione" },
      ],
      factLabels: { region: "Regione", typologie: "Tipologia", flaeche: "Superficie", dauer: "Durata" },
      consent: "Pubblicato con il consenso del committente.",
      placeholder: "Sequenza del progetto in arrivo: prima · schizzo · modello · rendering · oggi",
    },
    ONLINE: {
      overline: "Iniziare online",
      title: "Iniziate online. Harald continua a disegnare.",
      lead: "Volete prima provare da soli? I nostri configuratori online sono un buon inizio. Se poi progettate con noi, Harald porta il vostro risultato al tavolo da disegno.",
      onlineLabel: "Online",
      studioLabel: "Poi nello studio",
      cards: [
        {
          title: "Configuratore cucina",
          online: "Impostare in 3D pianta, composizioni ed elettrodomestici.",
          studio: "Harald continua a disegnare a mano la vostra cucina, e verifichiamo misure e allacciamenti sul posto.",
          link: "Progettate una cucina online",
        },
        {
          title: "Configuratore divano",
          online: "Comporre modello, moduli e rivestimento.",
          studio: "Provatelo a Lochau, e disegniamo come sta il divano nel vostro ambiente.",
          link: "Componete un divano",
        },
        {
          title: "Stil-Finder",
          online: "Trovare il vostro stile con poche domande per immagini.",
          studio: "Il vostro risultato diventa il primo schizzo per i vostri spazi.",
          link: "Trovate il vostro stile",
        },
      ],
      note: "I configuratori online non sono vincolanti e non sostituiscono la progettazione sul posto.",
    },
    FAQ: {
      overline: "Domande",
      title: "Domande sul nostro metodo",
      items: [
        {
          q: "Harald disegna davvero ogni concept a mano?",
          a: "Sì, da noi i concept d’arredo iniziano con un disegno a mano, poi Harald costruisce un modello. Quanti schizzi e quanto dettagliato sarà il modello dipende dal progetto. Ne parliamo al primo appuntamento.",
        },
        {
          q: "Perché un modello, se esistono i rendering 3D?",
          a: "Un modello si prende in mano e si riorganizza insieme. Molte domande su proporzioni e percorsi si chiariscono così più in fretta. Il progetto 3D segue e rende tutto esatto nelle misure.",
        },
        {
          q: "Venite a casa mia?",
          a: "Sì. Vediamo i vostri spazi sul posto, in Vorarlberg, sul Lago di Costanza e nelle regioni vicine. Se il vostro progetto lo richiede, restiamo anche uno o due giorni per conoscere luce, clima e abitudini.",
        },
        {
          q: "Quanto costa la progettazione con disegno a mano e modello?",
          a: "Dipende dall’entità. Al primo appuntamento chiariamo di che cosa ha bisogno il vostro progetto. I costi li concordiamo con voi prima di proseguire la progettazione.",
        },
        {
          q: "Quando vedrò come sarà il mio ambiente?",
          a: "Il disegno a mano mostra già l’idea. Con il rendering fotorealistico vedete il vostro ambiente con materiali e luce prima di ordinare qualsiasi cosa.",
        },
        {
          q: "Posso apportare modifiche?",
          a: "Sì, a ogni passo. Sul modello, a voce o nel portale clienti, anche con un messaggio vocale.",
        },
        {
          q: "Ho già progettato con il configuratore cucina o divano. Devo ricominciare da capo?",
          a: "No. Portate il vostro risultato o inviateci il link. Proseguiamo da lì, e Harald continua a mano il vostro concept.",
        },
        {
          q: "Progettate anche hotel, case vacanza o barche?",
          a: "Sì. Il processo è lo stesso, dall’appuntamento sul posto alla realizzazione. Per le particolarità ci sono pagine dedicate: Interni yacht, Outdoor.",
          links: [{ label: "Interni yacht" }, { label: "Outdoor" }],
        },
      ],
    },
    ABSCHLUSS: {
      line: "Progetti che vivono.",
      title: "Raccontateci dei vostri spazi.",
      text: "Ascoltiamo, li osserviamo e iniziamo dal primo tratto.",
      trustLabel: "Il nostro metodo",
      trust: [
        "Appuntamento sul posto, se il vostro progetto lo richiede",
        "Disegno a mano e modello prima del progetto 3D",
        "Il vostro ambiente in rendering prima di ordinare",
      ],
    },
    UI: {
      placeholderOverline: "Immagine in arrivo",
      placeholderKind: {
        hero: "Harald al tavolo da disegno",
        kennenlernen: "Colloquio nello showroom, passo 01",
        vorOrt: "Appuntamento sul posto, passo 02",
        handzeichnung: "Disegno a mano di Harald Menghin, passo 03",
        modell: "Foto del modello, passo 04",
        planung3d: "Progetto 3D, passo 05",
        rendering: "Rendering, passo 06",
        portal: "Portale clienti, passo 06",
        umsetzung: "Foto della realizzazione, passo 07",
        portrait: "Ritratto di Harald Menghin",
      },
    },
  },
};
