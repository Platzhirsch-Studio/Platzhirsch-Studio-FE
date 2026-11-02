// src/lib/content/homeSeo.js
// Editorial SEO copy for the homepage, per market/language. Written against the
// query clusters SISTRIX shows demand for (2026-10): brand terms (minotti,
// poliform, rimadesio …), "designermöbel" in AT/CH, "mobili di design" in IT,
// and the local cluster (Vorarlberg, Bodensee, Bregenz, Lindau, Ostschweiz).
// Wording follows the UWG audit (Marktresearch/recht/03-uwg-werbe-audit.md):
// only a selection of brands is claimed as physically on display ("unter
// anderem"); no fixed brand count (only the live count on the brands page, R6-i18n)
// (H11); delivery and assembly are offered "auf Wunsch" (L2); Germany and
// Switzerland only on request. No superlatives, no dealer claims.
// Runde 2, Fix-Team P2 (recht, Entscheidung Nr. 3): no blanket country promise
// ("ganz Österreich") – delivery and assembly "auf Wunsch", clarified per
// address; the Kern-USP (Nr. 8) in the text and as FAQ (USP plan 1.4/1.5).
// R5-fix P2 (recht P1-1): Italian in the voi form throughout (vi, vostro,
// descrivete, vedete), as everywhere else on the site. The FAQ also
// feeds the FAQPage JSON-LD, so every change here is a structured-data change.
export const HOME_SEO = {
  de: {
    title: "Designermöbel am Bodensee: Einrichtungshaus für Vorarlberg, Süddeutschland und die Ostschweiz",
    paragraphs: [
      "Platzhirsch Home Living ist ein Einrichtungsstudio für Designermöbel, Küchen und Leuchten in Lochau bei Bregenz. Auf unserer Ausstellungsfläche stehen unter anderem Originalstücke von Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti und Tréca – zum Probesitzen, Anfassen und Vergleichen. Dazu planen wir mit weiteren internationalen Designmarken – was aktuell ausgestellt ist, sagen wir Ihnen gern vorab.",
      "Wir planen Wohnzimmer, Schlafzimmer, Küchen, Außenbereiche und Lichtkonzepte für Privathäuser, Wohnungen und gewerbliche Räume. Jedes Stück planen wir maßgenau für Ihren Raum. Harald Menghin zeichnet das Konzept von Hand, danach planen wir in 3D. Lieferung und Montage übernehmen wir auf Wunsch; für Projekte in Süddeutschland und der Schweiz klären wir sie für Ihre Adresse. Der Showroom liegt wenige Minuten von Bregenz, Lindau und der Schweizer Grenze.",
    ],
    faq: [
      { q: "Welche Designermarken finde ich im Showroom in Lochau?", a: "Unter anderem Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti, Tom Dixon, Eichholtz, Gloster, Tonon, next125 und Tréca. Dazu kommen weitere internationale Designmarken für Wohnen, Schlafen, Küche, Licht und Outdoor; einen Teil davon zeigen wir mit Mustern und Katalogen." },
      { q: "Liefern und montieren Sie auch nach Deutschland und in die Schweiz?", a: "Lieferung und Montage übernehmen wir auf Wunsch; was für Ihre Adresse möglich ist, klären wir mit Ihnen persönlich. Das gilt auch für Projekte in Deutschland und der Schweiz. Der Showroom liegt direkt an der Grenze, wenige Minuten von Bregenz und Lindau." },
      { q: "Wie läuft eine Einrichtungsberatung ab?", a: "Sie beschreiben uns Ihr Vorhaben, wir treffen uns im Showroom oder bei Ihnen zu Hause. Harald Menghin zeichnet das Konzept von Hand, danach folgen 3D-Planung und Rendering. Wir kümmern uns um die Bestellung, auf Wunsch auch um Lieferung und Montage." },
      { q: "Zeichnen Sie Einrichtungskonzepte wirklich von Hand?", a: "Ja. Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand und baut bei Bedarf ein Raummodell. Danach planen wir in 3D, und Sie sehen ein fotorealistisches Rendering, bevor etwas bestellt wird." },
      { q: "Wann hat der Showroom geöffnet?", a: "Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr, Landstraße 11, 6911 Lochau. Termine außerhalb der Öffnungszeiten vereinbaren wir gerne." },
    ],
  },
  en: {
    title: "Designer furniture on Lake Constance: an interior studio for Austria, southern Germany and eastern Switzerland",
    paragraphs: [
      "Platzhirsch Home Living is an interior studio for designer furniture, kitchens and lighting in Lochau near Bregenz, Austria. The showroom presents original pieces by Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti and Tréca, among others – to sit on, touch and compare. We also plan with further international design brands; we are happy to tell you in advance what is currently on display.",
      "We plan living rooms, bedrooms, kitchens, outdoor areas and lighting for private homes, apartments and commercial spaces. We plan every piece to measure for your room. Harald Menghin draws the concept by hand, then we plan in 3D. Delivery and assembly are available on request; for projects in southern Germany and Switzerland we clarify them for your address. The showroom is minutes from Bregenz, Lindau and the Swiss border.",
    ],
    faq: [
      { q: "Which design brands can I see in the Lochau showroom?", a: "Among others Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti, Tom Dixon, Eichholtz, Gloster, Tonon, next125 and Tréca. On top of these come further international design brands for living, sleeping, kitchen, lighting and outdoor; some of them we present with samples and catalogues." },
      { q: "Do you deliver and assemble in Germany and Switzerland?", a: "Delivery and assembly are available on request; we clarify with you personally what is possible for your address. This also applies to projects in Germany and Switzerland. The showroom sits right on the border, minutes from Bregenz and Lindau." },
      { q: "How does an interior consultation work?", a: "You describe your project, we meet in the showroom or at your home. Harald Menghin draws the concept by hand, followed by 3D planning and rendering. We handle the order and, on request, delivery and assembly." },
      { q: "Do you really draw interior concepts by hand?", a: "Yes. Harald Menghin sketches floor plan, perspectives and moods by hand and, if needed, builds a room model. Then we plan in 3D, and you see a photorealistic rendering before anything is ordered." },
      { q: "When is the showroom open?", a: "Tuesday to Friday 10:00–18:00 and Saturday 10:00–14:00 at Landstraße 11, 6911 Lochau, Austria. Appointments outside opening hours are welcome." },
    ],
  },
  fr: {
    title: "Mobilier design au bord du lac de Constance : studio d'aménagement pour l'Autriche, le sud de l'Allemagne et la Suisse orientale",
    paragraphs: [
      "Platzhirsch Home Living est un studio d'aménagement pour mobilier design, cuisines et luminaires à Lochau près de Bregenz, en Autriche. Le showroom présente entre autres des pièces originales de Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti et Tréca – à essayer, toucher et comparer. Nous travaillons aussi avec d'autres marques de design internationales ; nous vous indiquons volontiers à l'avance ce qui est actuellement exposé.",
      "Nous planifions salons, chambres, cuisines, espaces extérieurs et éclairages pour maisons, appartements et espaces professionnels. Nous planifions chaque pièce sur mesure pour votre espace. Harald Menghin dessine le concept à la main, puis nous planifions en 3D. Livraison et montage sur demande ; pour les projets dans le sud de l'Allemagne et en Suisse, nous les clarifions pour votre adresse. Le showroom est à quelques minutes de Bregenz, de Lindau et de la frontière suisse.",
    ],
    faq: [
      { q: "Quelles marques de design puis-je voir au showroom de Lochau ?", a: "Entre autres Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti, Tom Dixon, Eichholtz, Gloster, Tonon, next125 et Tréca. S'y ajoutent d'autres marques de design internationales pour le salon, la chambre, la cuisine, l'éclairage et l'extérieur ; certaines sont présentées sous forme d'échantillons et de catalogues." },
      { q: "Livrez-vous et montez-vous en Allemagne et en Suisse ?", a: "Livraison et montage sur demande ; nous clarifions avec vous ce qui est possible pour votre adresse. Cela vaut aussi pour les projets en Allemagne et en Suisse. Le showroom se trouve à la frontière, à quelques minutes de Bregenz et de Lindau." },
      { q: "Comment se déroule un conseil en aménagement ?", a: "Vous nous décrivez votre projet, nous nous rencontrons au showroom ou chez vous. Harald Menghin dessine le concept à la main, puis viennent la planification en 3D et le rendu. Nous nous occupons de la commande et, sur demande, de la livraison et du montage." },
      { q: "Dessinez-vous vraiment les concepts d'aménagement à la main ?", a: "Oui. Harald Menghin esquisse le plan, les perspectives et les ambiances à la main et construit si besoin une maquette. Ensuite, nous planifions en 3D, et vous voyez un rendu photoréaliste avant toute commande." },
      { q: "Quels sont les horaires du showroom ?", a: "Du mardi au vendredi de 10 h à 18 h et le samedi de 10 h à 14 h, Landstraße 11, 6911 Lochau, Autriche. Rendez-vous possibles en dehors des horaires." },
    ],
  },
  it: {
    title: "Mobili di design in Austria: showroom sul Lago di Costanza per Vorarlberg, Germania meridionale e Svizzera orientale",
    paragraphs: [
      "Platzhirsch Home Living è uno studio d'arredamento per mobili di design, cucine e illuminazione a Lochau, vicino a Bregenz, in Austria. Lo showroom presenta, tra gli altri, pezzi originali di Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti e Tréca – da provare, toccare e confrontare. Progettiamo anche con altri marchi di design internazionali; vi diciamo volentieri in anticipo che cosa è esposto al momento.",
      "Progettiamo soggiorni, camere, cucine, spazi esterni e illuminazione per case, appartamenti e spazi commerciali. Progettiamo ogni pezzo su misura per il vostro ambiente. Harald Menghin disegna il progetto a mano, poi progettiamo in 3D. Consegna e montaggio su richiesta; per progetti nella Germania meridionale e in Svizzera li chiariamo per il vostro indirizzo. Lo showroom è a pochi minuti da Bregenz, Lindau e dal confine svizzero.",
    ],
    faq: [
      { q: "Quali marchi di design trovate nello showroom di Lochau?", a: "Tra gli altri Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti, Tom Dixon, Eichholtz, Gloster, Tonon, next125 e Tréca. A questi si aggiungono altri marchi di design internazionali per living, notte, cucina, luce e outdoor; alcuni li presentiamo con campioni e cataloghi." },
      { q: "Consegnate e montate anche in Germania e Svizzera?", a: "Consegna e montaggio su richiesta; chiariamo con voi che cosa è possibile per il vostro indirizzo. Vale anche per progetti in Germania e Svizzera. Lo showroom si trova proprio al confine, a pochi minuti da Bregenz e Lindau." },
      { q: "Come funziona una consulenza d'arredo?", a: "Ci descrivete il vostro progetto, ci incontriamo in showroom o a casa vostra. Harald Menghin disegna il progetto a mano, poi seguono progettazione in 3D e rendering. Ci occupiamo dell'ordine e, su richiesta, di consegna e montaggio." },
      { q: "Disegnate davvero a mano i progetti d'arredo?", a: "Sì. Harald Menghin schizza a mano pianta, prospettive e atmosfere e, se serve, costruisce un plastico. Poi progettiamo in 3D, e vedete un rendering fotorealistico prima di ordinare." },
      { q: "Quando è aperto lo showroom?", a: "Da martedì a venerdì dalle 10 alle 18 e sabato dalle 10 alle 14, Landstraße 11, 6911 Lochau, Austria. Su richiesta anche fuori orario." },
    ],
  },
};

export function homeSeo(locale) {
  return HOME_SEO[locale] || HOME_SEO.de;
}
