// src/lib/data/designerBios.js
// Runde 9, Fix-Team P5 (r5-recht-inhalt P1-3): the 17 "About the brand" /
// "About the designer" bios of src/lib/data/staticShopProducts.js were
// English on every locale. These are faithful DE/FR/IT translations of the
// text the English page shows today, i.e. AFTER the claim filter
// (filterInfoBio: sentences with superlatives or "luxury" are already gone –
// they are not translated either). No new facts; „the first to …“ (Cassina)
// is left out as a sole-position claim (UWG § 2). Product/brand names stay as
// written by the manufacturers. A locale without a text here shows no bio
// (never the English one) – see getDesignerInfo/getBrandInfo.
//
// Pure module without imports: runs in server components and in node --test.

export const BIO_I18N = Object.freeze({
  // --- Brands (BRAND_INFO) -------------------------------------------------
  Minotti: {
    de: "1948 von Alberto Minotti in Meda (Italien) gegründet, begann das Unternehmen als kleine Handwerkswerkstatt für traditionelle Holzmöbel. In mehr als siebzig Jahren ist daraus ein etablierter Name des zeitgenössischen italienischen Designs geworden, bekannt für eine feine, zurückhaltende Ästhetik und sorgfältige Verarbeitung. Heute fertigt Minotti Möbel für innen und außen und arbeitet mit bekannten Designern zusammen.",
    fr: "Fondée en 1948 à Meda, en Italie, par Alberto Minotti, l’entreprise a commencé comme un petit atelier artisanal de meubles traditionnels en bois. En plus de soixante-dix ans, elle est devenue un nom établi du design italien contemporain, connue pour une esthétique raffinée et sobre et un travail soigné. Aujourd’hui, Minotti fabrique du mobilier d’intérieur et d’extérieur et travaille avec des designers reconnus.",
    it: "Fondata nel 1948 a Meda da Alberto Minotti, l’azienda nacque come piccola bottega artigiana di mobili tradizionali in legno. In oltre settant’anni è diventata un nome affermato del design italiano contemporaneo, nota per un’estetica raffinata e sobria e per una lavorazione accurata. Oggi Minotti produce arredi per interni ed esterni e collabora con designer noti.",
  },
  Poliform: {
    de: "Poliform, ein italienisches Möbelunternehmen, 1970 in Inverigo bei Como gegründet, wurde zunächst mit präzise konstruierten Kleiderschrank- und Stauraumsystemen bekannt. Seitdem ist daraus eine vollständige Wohnkollektion geworden, geschätzt für modulare Konstruktion, sorgfältige Verbindungen und eine Formensprache, die ruhige, architektonische Strenge der Dekoration vorzieht.",
    fr: "Maison italienne de mobilier fondée en 1970 à Inverigo, près de Côme, Poliform s’est d’abord fait connaître par des systèmes d’armoires et de rangement conçus avec précision. Elle s’est depuis élargie à une collection complète pour la maison, reconnue pour son architecture modulaire, ses assemblages soignés et un langage formel qui préfère une rigueur calme et architecturale à la décoration.",
    it: "Azienda italiana di arredamento fondata nel 1970 a Inverigo, vicino a Como, Poliform si è fatta conoscere inizialmente per sistemi di armadi e contenitori progettati con precisione. Da allora si è estesa a una collezione completa per la casa, apprezzata per l’architettura modulare, le giunzioni accurate e un linguaggio formale che preferisce un rigore calmo e architettonico alla decorazione.",
  },
  Flexform: {
    de: "Flexform ist seit 1959 in Meda tätig, im Zentrum des Möbelbezirks Brianza, und bekannt für zeitloses, auf Komfort ausgerichtetes Design, das im traditionellen italienischen Polsterhandwerk wurzelt. Die Kollektionen setzen auf weiche, umhüllende Volumen und natürliche Materialien statt auf Trends und sind dafür gemacht, über Jahrzehnte in einem Zuhause gut zu altern.",
    fr: "Installée depuis 1959 à Meda, au cœur du district du meuble de la Brianza, Flexform est connue pour un design intemporel, centré sur le confort et ancré dans l’artisanat traditionnel italien du rembourrage. Ses collections privilégient des volumes doux et enveloppants et des matériaux naturels plutôt que les effets de mode, et sont faites pour bien vieillir dans une maison pendant des décennies.",
    it: "Attiva dal 1959 a Meda, nel cuore del distretto del mobile della Brianza, Flexform è nota per un design senza tempo, orientato al comfort e radicato nella tradizione artigianale italiana dell’imbottito. Le sue collezioni privilegiano volumi morbidi e avvolgenti e materiali naturali rispetto alle mode, pensati per invecchiare bene in casa nel corso dei decenni.",
  },
  "B&B Italia": {
    de: "B&B Italia, seit 1966 ein italienisches Designunternehmen, hat das zeitgenössische Wohnen mit technisch fortschrittlichen, forschungsbasierten Möbeln geprägt, die in eigenen Labors entwickelt werden. Das Unternehmen gehörte zu den ersten Möbelherstellern, die Polsterungen aus Polyurethanschaum industriell fertigten, und verbindet diese Ingenieurskultur bis heute mit internationalen Architekten und Designern.",
    fr: "Entreprise italienne de design depuis 1966, B&B Italia a marqué l’habitat contemporain avec des meubles technologiquement avancés, issus de la recherche et développés dans ses propres laboratoires. Elle a été parmi les premiers fabricants de meubles à industrialiser le rembourrage en mousse de polyuréthane et continue d’associer cette culture de l’ingénierie à des architectes et designers internationaux.",
    it: "Azienda italiana di design dal 1966, B&B Italia ha segnato l’abitare contemporaneo con arredi tecnologicamente avanzati, frutto della ricerca e sviluppati nei propri laboratori interni. È stata tra le prime aziende di arredamento a industrializzare l’imbottitura in schiuma di poliuretano e continua ad abbinare questa cultura ingegneristica ad architetti e designer internazionali.",
  },
  Cassina: {
    de: "Cassina, gegründet 1927, gehört zu den traditionsreichen italienischen Möbelherstellern und brachte die industrielle Fertigung in die feine Möbeltischlerei.",
    fr: "Fondée en 1927, Cassina compte parmi les fabricants italiens de meubles riches en tradition et a introduit la fabrication industrielle dans l’ébénisterie fine.",
    it: "Fondata nel 1927, Cassina è tra i produttori italiani di mobili di lunga tradizione e ha portato la produzione industriale nella falegnameria di pregio.",
  },
  "Living Divani": {
    de: "Living Divani wurde 1969 gegründet und wird seit Langem von Art Director Piero Lissoni geprägt. Die Marke ist bekannt für zurückhaltende, forschungsbasierte Sitzmöbel, die ruhige Eleganz dem Ornament vorziehen. Ihre Kollektionen bestimmen klare Geometrie, sanfte Farbpaletten und eine bewusste Zurückhaltung, die Proportion und Material das Design tragen lässt.",
    fr: "Fondée en 1969 et guidée depuis longtemps par le directeur artistique Piero Lissoni, Living Divani est connue pour des assises sobres, issues de la recherche, qui préfèrent une élégance calme à l’ornement. Ses collections se définissent par une géométrie nette, des palettes douces et une retenue délibérée qui laisse les proportions et la matière porter le design.",
    it: "Fondata nel 1969 e guidata a lungo dall’art director Piero Lissoni, Living Divani è nota per sedute sobrie, frutto della ricerca, che preferiscono un’eleganza discreta all’ornamento. Le sue collezioni sono definite da una geometria pulita, palette morbide e una misura voluta che lascia a proporzioni e materiali il compito di portare il design.",
  },
  "Molteni&C": {
    de: "Molteni&C, seit 1934 ein italienisches Familienunternehmen, ist bekannt dafür, die Tradition feiner Möbeltischlerei mit zeitgenössischem Design zu verbinden.",
    fr: "Entreprise familiale italienne depuis 1934, Molteni&C est connue pour associer la tradition de l’ébénisterie fine au design contemporain.",
    it: "Azienda italiana a conduzione familiare dal 1934, Molteni&C è nota per unire la tradizione della falegnameria di pregio al design contemporaneo.",
  },
  Rimadesio: {
    de: "Rimadesio, 1956 bei Como gegründet, ist auf architektonische Schiebetüren, begehbare Kleiderschränke und Raumteilersysteme aus Glas und Aluminium spezialisiert. Seit den 1980er-Jahren prägt der langjährige Art Director Giuseppe Bavuso die Marke; seine präzise, technische Formensprache macht die Konstruktion zum sichtbaren Gestaltungselement, statt sie zu verbergen.",
    fr: "Fondée en 1956 près de Côme, Rimadesio est spécialisée dans les portes coulissantes architecturales, les dressings et les systèmes de séparation en verre et en aluminium. Depuis les années 1980, son identité est marquée par son directeur artistique de longue date, Giuseppe Bavuso, dont le langage précis et technique fait de la structure un élément visible du design au lieu de la cacher.",
    it: "Fondata nel 1956 vicino a Como, Rimadesio è specializzata in porte scorrevoli architettoniche, cabine armadio e sistemi divisori in vetro e alluminio. Dagli anni Ottanta la sua identità è segnata dall’art director di lunga data Giuseppe Bavuso, il cui linguaggio preciso e tecnico trasforma la struttura in un elemento visibile del design invece di nasconderla.",
  },
  Flos: {
    de: "Flos, seit 1962 ein italienischer Leuchtenhersteller, hat bekannte Leuchten des 20. und 21. Jahrhunderts hervorgebracht, in Zusammenarbeit mit Designern von Achille Castiglioni bis Philippe Starck. Viele seiner Entwürfe gehören zu den ständigen Sammlungen von Designmuseen, darunter das MoMA in New York.",
    fr: "Fabricant italien de luminaires depuis 1962, Flos a produit des lampes connues des XXe et XXIe siècles, avec des designers allant d’Achille Castiglioni à Philippe Starck. Beaucoup de ses pièces figurent dans les collections permanentes de musées du design, dont le MoMA de New York.",
    it: "Azienda italiana di illuminazione dal 1962, Flos ha prodotto lampade note del XX e XXI secolo, lavorando con designer da Achille Castiglioni a Philippe Starck. Molti suoi pezzi fanno parte delle collezioni permanenti di musei del design, tra cui il MoMA di New York.",
  },
  // --- Designers (DESIGNER_INFO) -------------------------------------------
  "Rodolfo Dordoni": {
    de: "Rodolfo Dordoni, 1954 in Mailand geboren, studierte Architektur, bevor er sich dem Produkt- und Möbeldesign zuwandte. Seine Arbeit umfasst Möbel, Leuchten und Interior Design für mehrere italienische Designhäuser.",
    fr: "Né à Milan en 1954, Rodolfo Dordoni a suivi une formation d’architecte avant de se tourner vers le design de produits et de mobilier. Son travail couvre le mobilier, l’éclairage et l’aménagement intérieur pour plusieurs maisons de design italiennes.",
    it: "Nato a Milano nel 1954, Rodolfo Dordoni si è formato come architetto prima di dedicarsi al design di prodotto e di arredo. Il suo lavoro comprende arredi, illuminazione e interior design per diverse aziende italiane del design.",
  },
  "Patricia Urquiola": {
    de: "Patricia Urquiola, 1961 in Oviedo (Spanien) geboren und seit den 1990er-Jahren in Mailand ansässig, ist bekannt für skulpturale, forschungsbasierte Möbel, die sie für italienische Designmarken entwickelt. Ihre Arbeit verbindet technisches Experimentieren – neue Materialien, Web- und Formtechniken – mit einem emotionalen, handwerklichen Gespür.",
    fr: "Née à Oviedo, en Espagne, en 1961 et installée à Milan depuis les années 1990, Patricia Urquiola est connue pour des meubles sculpturaux, issus de la recherche, conçus pour des marques de design italiennes. Son travail associe l’expérimentation technique – nouveaux matériaux, techniques de tissage et de moulage – à une sensibilité émotionnelle et artisanale.",
    it: "Nata a Oviedo, in Spagna, nel 1961 e attiva a Milano dagli anni Novanta, Patricia Urquiola è nota per arredi scultorei, frutto della ricerca, sviluppati per marchi italiani del design. Il suo lavoro unisce la sperimentazione tecnica – nuovi materiali, tecniche di intreccio e di stampaggio – a una sensibilità emotiva e artigianale.",
  },
  "Vincent Van Duysen": {
    de: "Vincent Van Duysen, belgischer Architekt und Designer, geboren 1962, ist bekannt für einen zurückhaltenden, materialgerechten Ansatz in Architektur und Möbeldesign. Seit 2016 ist er zudem Creative Director von Molteni&C und überträgt seine minimalistische Architektursprache auf die Möbelkollektionen der Marke.",
    fr: "Architecte et designer belge né en 1962, Vincent Van Duysen est connu pour une approche sobre et fidèle aux matériaux, en architecture comme en design de mobilier. Depuis 2016, il est aussi directeur de la création de Molteni&C et prolonge son langage architectural minimaliste dans les collections de meubles de la marque.",
    it: "Architetto e designer belga nato nel 1962, Vincent Van Duysen è noto per un approccio sobrio e rispettoso dei materiali, in architettura come nel design d’arredo. Dal 2016 è anche direttore creativo di Molteni&C e porta il suo linguaggio architettonico minimalista nelle collezioni di arredo del marchio.",
  },
  "Achille Castiglioni": {
    de: "Achille Castiglioni entwarf ab den 1960er-Jahren zahlreiche Leuchten für Flos; Modelle wie Arco und Taraxacum werden bis heute produziert.",
    fr: "Achille Castiglioni a beaucoup dessiné pour Flos à partir des années 1960, et des pièces comme les lampes Arco et Taraxacum sont toujours produites aujourd’hui.",
    it: "Achille Castiglioni ha disegnato molto per Flos a partire dagli anni Sessanta, e pezzi come le lampade Arco e Taraxacum sono ancora oggi in produzione.",
  },
  "Giuseppe Bavuso": {
    de: "Giuseppe Bavuso, italienischer Architekt und seit den 1980er-Jahren Art Director von Rimadesio, ist bekannt für präzise, minimalistische Systeme aus Glas und Metall. Seine Arbeit bestimmt die gesamte Produktsprache der Marke, von Schiebetüren bis zu modularen begehbaren Kleiderschränken und Bücherregalen.",
    fr: "Architecte italien et directeur artistique de Rimadesio depuis les années 1980, Giuseppe Bavuso est connu pour des systèmes précis et minimalistes en verre et en métal. Son travail a défini tout le langage produit de la marque, des portes coulissantes aux dressings modulaires et aux bibliothèques.",
    it: "Architetto italiano e art director di Rimadesio dagli anni Ottanta, Giuseppe Bavuso è noto per sistemi precisi e minimali in vetro e metallo. Il suo lavoro ha definito l’intero linguaggio di prodotto del marchio, dalle porte scorrevoli alle cabine armadio modulari e alle librerie.",
  },
  "Jean-Marie Massaud": {
    de: "Jean-Marie Massaud, französischer Designer und Architekt, geboren 1966, ist bekannt für organische, skulpturale Formen in Möbeln, Yachten und Architektur. Sein Büro, Studio Massaud, arbeitet in allen Maßstäben – vom kleinen Objekt bis zum ganzen Gebäude – und kehrt dabei immer zu einer fließenden, von der Natur inspirierten Formensprache zurück.",
    fr: "Designer et architecte français né en 1966, Jean-Marie Massaud est connu pour des formes organiques et sculpturales, en mobilier, en yachts et en architecture. Son agence, Studio Massaud, travaille à toutes les échelles – du petit objet au bâtiment entier – en revenant toujours à un vocabulaire formel fluide, inspiré de la nature.",
    it: "Designer e architetto francese nato nel 1966, Jean-Marie Massaud è noto per forme organiche e scultoree in arredi, yacht e architettura. Il suo studio, Studio Massaud, lavora a tutte le scale – dal piccolo oggetto all’intero edificio – tornando sempre a un vocabolario formale fluido, ispirato alla natura.",
  },
  "Antonio Citterio": {
    de: "Antonio Citterio, italienischer Architekt und Designer, geboren 1950, hat mit zurückhaltendem, alltagstauglichem Design die Identität mehrerer großer italienischer Möbelmarken geprägt. Neben dem Produktdesign arbeitet sein Büro Antonio Citterio Patricia Viel international an Architektur und Innenräumen für Hotels, Büros und Wohngebäude.",
    fr: "Architecte et designer italien né en 1950, Antonio Citterio a marqué l’identité de plusieurs grandes marques italiennes de mobilier par un design sobre et agréable à vivre. Outre le design de produits, son agence Antonio Citterio Patricia Viel travaille à l’international sur l’architecture et les intérieurs d’hôtels, de bureaux et de bâtiments résidentiels.",
    it: "Architetto e designer italiano nato nel 1950, Antonio Citterio ha segnato l’identità di diversi importanti marchi italiani dell’arredo con un design sobrio e vivibile. Oltre al design di prodotto, il suo studio Antonio Citterio Patricia Viel lavora a livello internazionale su architetture e interni per hotel, uffici ed edifici residenziali.",
  },
  "Piero Lissoni": {
    de: "Piero Lissoni, italienischer Architekt und Designer, geboren 1956, ist bekannt für eine minimalistische, monochrome Ästhetik in Möbeldesign und Interior Design. Als langjähriger Art Director von Living Divani und der Outdoor-Linie von B&B Italia hat er eine betont ruhige, zeitgenössische Richtung des italienischen Designs mitgeprägt.",
    fr: "Architecte et designer italien né en 1956, Piero Lissoni est connu pour une esthétique minimaliste et monochrome, en mobilier comme en design d’intérieur. Directeur artistique de longue date de Living Divani et de la ligne outdoor de B&B Italia, il a contribué à définir un courant calme et contemporain du design italien.",
    it: "Architetto e designer italiano nato nel 1956, Piero Lissoni è noto per un’estetica minimalista e monocromatica nell’arredo e nell’interior design. Come art director di lunga data di Living Divani e della linea outdoor di B&B Italia, ha contribuito a definire un filone del design italiano decisamente quieto e contemporaneo.",
  },
});

/**
 * Bio text for `name` in `locale`: the English source on /en, the checked
 * translation on de/fr/it, otherwise null (the card shows no bio – never the
 * English text on a German, French or Italian page).
 */
export function localizedBio(name, englishBio, locale = "de") {
  if (locale === "en") return englishBio || null;
  return BIO_I18N[name]?.[locale] || null;
}
