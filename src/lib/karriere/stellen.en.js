// Stellentexte Englisch – Übersetzung von stellen.de.js (gleiche Struktur,
// gleiche Schlüssel, gleiche Reihenfolge). Regeln wie dort (GlBG § 9):
// Titel mit „(m/f/d)“, neutrale Formulierungen, keine Superlative, keine
// zusätzlichen Angaben gegenüber dem deutschen Original.
// Rein: keine Pakete, keine "@/"-Aliase.

export const BIETEN = [
  "Workplace at the interior design studio in Lochau, Landstraße 11, on Lake Constance",
  "Working with the international design brands in our showroom",
  "Collaboration in a team of interior design, planning, consulting and installation – projects from a single source",
];

export const STELLEN = {
  "cad-planer": {
    title: "CAD Designer (m/f/d)",
    bereich: "Planning",
    beschreibung:
      "You turn furnishing, kitchen and bathroom concepts into precise plans – from on-site measurement to workshop and installation drawings. In doing so, you work closely with interior design, sales and installation.",
    aufgaben: [
      "Preparing floor plans, elevations and detail drawings for kitchens, bathrooms and furniture",
      "Transferring designs from hand sketches and models into CAD drawings and 3D views",
      "Taking measurements at customers’ premises and checking the installation situation",
      "Preparing workshop and installation drawings for the installation team and the trades involved",
      "Coordinating with manufacturers, suppliers and the installation team",
    ],
    profil: [
      "Completed vocational training or degree in building technology, interior fit-out, joinery or interior architecture, or a comparable qualification",
      "Knowledge of Archicad and/or AutoCAD",
      "Spatial awareness and a precise way of working",
      "Understanding of materials, constructions and installation situations",
      "Enjoyment of working together with planning, sales and installation",
    ],
  },
  innenarchitekt: {
    title: "Interior Architect (m/f/d)",
    bereich: "Interior Design",
    beschreibung:
      "Together with our customers, you develop concepts for living spaces, kitchens and bathrooms and accompany the projects from the first idea through to handover.",
    aufgaben: [
      "Advising on space, materials, lighting and furniture",
      "Designing furnishing concepts with sketches, models and 3D visualisation",
      "Selecting furniture, materials and surfaces from the range of our brands",
      "Preparing presentations, plans and quotations together with sales",
      "Coordinating with CAD planning, installation and the trades involved",
    ],
    profil: [
      "Completed degree or vocational training in interior architecture or interior design, or a comparable qualification",
      "Experience in planning living spaces, kitchens or bathrooms",
      "A feel for proportion, material and colour",
      "Confident use of CAD and visualisation software",
      "Enjoyment of advising and of contact with customers",
    ],
  },
  verkaeufer: {
    title: "Sales Consultant Interior Furnishing (m/f/d)",
    bereich: "Sales and Consulting",
    beschreibung:
      "You advise visitors in our showroom in Lochau and accompany them from the first question through to the order.",
    aufgaben: [
      "Welcoming and advising customers in the showroom",
      "Presenting furniture, lighting and accessories from our design brands",
      "Preparing quotations and order confirmations",
      "Coordinating delivery and assembly with interior design, planning and installation",
      "Looking after the showroom and supporting customers after their purchase",
    ],
    profil: [
      "Completed commercial training or experience in sales, ideally in the furniture or interior sector",
      "Interest in design, materials and living",
      "A friendly manner and enjoyment of customer contact",
      "A structured and reliable way of working",
      "Confident use of common office software",
    ],
  },
  "monteur-tischler": {
    title: "Installer with Joinery Apprenticeship (m/f/d)",
    bereich: "Installation",
    beschreibung:
      "You install kitchens, built-in furniture and design furniture at our customers’ premises and, with your joinery training, ensure a clean, precisely fitting finish.",
    aufgaben: [
      "Installing kitchens, built-in furniture and design furniture at customers’ premises",
      "Carrying out on-site adjustments to furniture and built-in components",
      "Reading and implementing installation and workshop drawings",
      "Checking deliveries and documenting the installation",
      "Coordinating with planning and other trades on site",
    ],
    profil: [
      "Completed apprenticeship as a joiner/carpenter",
      "Experience in furniture or kitchen installation",
      "A careful way of working and an understanding of workshop drawings",
      "Friendly dealings with customers on site",
      "Team spirit and reliability",
      "Driving licence category B (required), category C an advantage",
    ],
  },
  monteur: {
    title: "Installer (m/f/d)",
    bereich: "Installation",
    beschreibung:
      "You deliver and install furniture, lighting and kitchen elements at our customers’ premises, working as part of the installation team.",
    aufgaben: [
      "Delivering and assembling furniture, lighting and kitchen elements",
      "Assisting with the installation of kitchens and built-in furniture",
      "Protecting rooms at customers’ premises and disposing of packaging",
      "Checking goods and reporting damage or missing parts",
      "Working together with joiners, planning and sales",
    ],
    profil: [
      "Manual skills and experience in installation; vocational training in a trade is an advantage",
      "Careful handling of furniture and delicate surfaces",
      "A friendly manner with customers",
      "Team spirit and reliability",
      "Driving licence category B (required), category C an advantage",
    ],
  },
  fliesenleger: {
    title: "Tiler (m/f/d)",
    bereich: "Bathroom and Wellness",
    beschreibung:
      "As part of our installation team, you lay tiles and slabs in bathrooms, kitchens and wellness areas that we plan together with our customers.",
    aufgaben: [
      "Laying wall and floor tiles, slabs and mosaics",
      "Preparing substrates, waterproofing and grouting",
      "Implementing tiling plans in bathrooms, kitchens and wellness areas",
      "Coordinating with planning, plumbing and installation on site",
      "Carefully executing joints and details",
    ],
    profil: [
      "Completed apprenticeship as a tile and slab layer, or a comparable qualification",
      "Experience in laying tiles and slabs",
      "A precise way of working and an eye for clean details",
      "Team spirit and reliability",
    ],
  },
  installateur: {
    title: "Plumbing and Heating Installer (m/f/d)",
    bereich: "Building Services",
    beschreibung:
      "As part of our installation team, you install plumbing and heating systems in the bathrooms, kitchens and wellness areas that we plan and implement.",
    aufgaben: [
      "Installing sanitary fixtures, fittings and pipework",
      "Mounting and connecting heating components",
      "Connecting kitchen appliances to water supply and drainage",
      "Implementing installation plans in coordination with planning and tilers",
      "Commissioning, function testing and documentation",
    ],
    profil: [
      "Completed apprenticeship in installation and building services engineering (plumbing and heating technology), or a comparable qualification",
      "Experience in plumbing and heating installation",
      "A careful and independent way of working",
      "Team spirit and friendly dealings with customers",
    ],
  },
  elektroplaner: {
    title: "Electrical Designer (m/f/d)",
    bereich: "Planning",
    beschreibung:
      "As part of our planning team, you plan the electrical and lighting installation for kitchens, bathrooms and living spaces and coordinate it with interior design and installation.",
    aufgaben: [
      "Planning electrical installations, connections and lighting solutions for kitchens, bathrooms and living spaces",
      "Preparing electrical and lighting plans",
      "Coordinating with interior design, CAD planning and our installation team",
      "Checking appliance connections and manufacturers’ technical specifications",
      "Supervising implementation on site",
    ],
    profil: [
      "Completed training in electrical engineering (e.g. HTL (higher technical college) or apprenticeship with further training), or a comparable qualification",
      "Experience in electrical planning in residential construction or interior fit-out",
      "Knowledge of the relevant standards and regulations (ÖVE/ÖNORM)",
      "Knowledge of Archicad and/or AutoCAD",
      "A precise way of working and enjoyment of teamwork",
    ],
  },
};
