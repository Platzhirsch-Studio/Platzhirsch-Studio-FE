// /en/yacht-interior – English page copy (Welle 2, team EN-Yacht-Sofa, 29.10.2026).
// Written from the confirmed German page (src/app/[locale]/yacht-interior/page.js,
// CONTENT) for international owners and Swiss clients: British English, quiet
// tone, same facts – nothing added, nothing promised beyond the German page.
// Same wording rules (Marktresearch/29-geschaeftsfeld-yacht-interior.md §8): no
// "No. 1"/"leading", no dealer or partner claims, no "marine-certified" or
// "flame-retardant", no "project management"/"complete refit", no names of yards
// or upholsterers, no invented references, no prices.
// Trades: Bootssattler = "marine upholsterer", Werft = "boatyard"/"yard",
// Winterlager = "winter storage", Einwassern = "relaunch".
// Pure module (no imports), so node --test can load it.

// texte-seo-ki 31.10.2026: "yacht interior design" is the English search term
// (SISTRIX: UK 40/month, US "yacht interior designer" 30); title 39 + suffix = 65
// (titleWithSuffix limit), description < 150 so clampDescription keeps it whole.
export const META_EN = Object.freeze({
  title: "Yacht Interior Design on Lake Constance",
  description:
    "Yacht interior design on Lake Constance: deck, saloon, cabins and boathouse, drawn by hand. Cushions by a marine upholsterer. Visits on board.",
});

export const CONTENT_EN = {
  hero: {
    crumb: "Yacht interiors",
    eyebrow: "Boats · Yachts · Boathouses",
    title: "Yacht interiors on Lake Constance",
    motto: "Take a seat – on board.",
    lead: "Life on the lake, on board as well. We design the cockpit, deck, saloon and cabins of your boat – and your boathouse – with outdoor furniture, fabrics and light.",
    secondary: { href: "#werfthalle", label: "See the boat in 3D" },
    // Kern-USP (Inhaber-Entscheidung Nr. 8), on the first screen on phones
    usp: "We come aboard. Harald Menghin draws the concept by hand; 3D planning and rendering follow.",
  },
  intro: {
    eyebrow: "A boat is a living space with its own rules",
    heading: "Between the upholsterer's craft and the design concept",
    paragraphs: [
      "Little space, a lot of sun, damp air – and every kilo counts. We bring our experience in interior and outdoor furnishing on board: one concept for colours, fabrics, cushions, light and loose furnishings that suits your boat and the way you like to live.",
      "Measuring, making and fitting are done by specialists – a marine upholsterer and your boatyard. We agree the work with them, so that design and craft fit together.",
    ],
    rules: [
      { name: "Weight", text: "Every kilo counts. We state the weights with our quotation; the yard approves them." },
      { name: "Damp and sun", text: "Outside, only what the maker intends for outdoor use. Home textiles stay below deck and dry." },
      { name: "Movement", text: "Anything loose must stand securely: stowed before you cast off, or secured by the yard." },
    ],
  },
  werfthalle: {
    eyebrow: "The boat shed",
    heading: "Walk through your boat, room by room",
    text: "In winter storage the boat stands ashore and is open to view. Choose a type of boat and a zone: the camera moves there, and for saloon, cabin and bathroom the deck is cut away. Next to it you see what we suggest for that zone.",
    note: "The 3D model is a diagram, not your boat. Furniture appears in it as simplified shapes in the colours of the concept – no replicas of designer pieces. The real products are shown alongside with the maker's own image.",
    initial: "motoryacht-riviera",
  },
  concepts: {
    eyebrow: "Example concepts",
    heading: "From runabout to boathouse",
    text: "Each concept has a guiding line, a colour world, materials and products from our range, zone by zone. They are examples – not client projects.",
    aiNote:
      "The images in the example concepts are concept visualisations. Some are rendered in Blender and captioned “Visualisation (rendering)”; the others are AI-generated (Art. 50 EU AI Act): created on our own computer in Lochau and marked as AI images on the image and in their image data. They show a mood – no real boats, no client projects and no products from our range. The product images come from the makers.",
  },
  materials: {
    eyebrow: "Samples and materials",
    heading: "Made for sun, water and wind",
    text: "On board, other demands apply than in a living room. For every product we check what the maker states about use outdoors and on board. You can see and feel fabrics, teak samples and finishes in the original – in our showroom or on board.",
    items: [
      { swatch: "teak", name: "Teak", text: "Hard-wearing and pleasant underfoot. Left unoiled, it turns silver-grey over time." },
      { swatch: "weave", name: "Solution-dyed acrylic", text: "Very colourfast and quick to dry. The values are on the maker's data sheet." },
      { swatch: "foam", name: "Open-cell foam", text: "Lets water drain away – for cockpit and sun cushions." },
      { swatch: "leather", name: "Marine faux leather", text: "Easy care for seating. We obtain UV and flammability details as a data sheet." },
      { swatch: "steel", name: "Stainless steel and aluminium", text: "For frames and fittings. Alloy and finish for your waters are agreed with maker and yard." },
      { swatch: "linen", name: "Linen and cotton sateen", text: "For saloon and cabin. Home textiles – below deck and dry." },
    ],
  },
  course: {
    eyebrow: "A course through winter storage",
    heading: "From September to relaunch",
    text: "The best time for a new interior is winter storage: planning and making run while the boat is ashore. Speak to us early, so that upholsterer and yard can schedule the work. Deck furniture, textiles and boathouses are possible during the season, too.",
    months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    items: [
      { from: 0, to: 1, when: "September – October", title: "First conversation after the season", us: "Appointment, photos and any existing plans", sattler: "–", werft: "Berth in winter storage" },
      { from: 2, to: 2, when: "November", title: "Visit on board", us: "How you use the boat, your style, the zones", sattler: "Measuring and templates", werft: "Access, notes on fixings and weight" },
      { from: 2, to: 3, when: "November – December", title: "Concept", us: "Colour world, materials and a product list per zone – with a clear note of who does what", sattler: "Feasibility of the cushions", werft: "Approval of weight and stability" },
      { from: 3, to: 4, when: "December – January", title: "Samples", us: "Samples in the Lochau showroom or on board, ordering the loose furnishings", sattler: "Choice of fabric and foam with data sheets", werft: "–" },
      { from: 4, to: 6, when: "January – March", title: "Making", us: "Agreeing dates, preparing delivery", sattler: "Cushions, boat cover, bimini", werft: "Paint, wood, fixing points, electrics" },
      { from: 6, to: 7, when: "March – April", title: "Fitting and relaunch", us: "Handover of the loose furnishings", sattler: "Fitting the cushions", werft: "Fitting, drilling, final inspection" },
    ],
  },
  roles: {
    eyebrow: "Who does what",
    heading: "Three parties, clearly separated",
    text: "We design and supply the furnishings. Everything that concerns the safety and engineering of your boat stays with the yard. We set this down in writing in every quotation.",
    columns: [
      { title: "Platzhirsch", items: ["Concept, colours, fabrics", "Furniture, textiles, battery lamps, accessories", "Delivery of the loose furnishings", "Agreeing dates with upholsterer and yard"] },
      { title: "Marine upholsterer", items: ["Measuring and templates", "Cushions, covers, boat cover and bimini", "Choice of fabric and foam with data sheets", "Fitting the cushions on board"] },
      { title: "Boatyard", items: ["Work on structure and hull", "Electrics, gas, ventilation", "Drilling and fixings", "Approval of weight and stability"] },
    ],
  },
  brands: {
    eyebrow: "Brands from our range",
    heading: "Chosen for outdoors and the water",
    text: "We only recommend collections that the maker intends for that particular use. Whether a model can be used on board, we clarify in writing with the maker before every quotation.",
    groups: [
      {
        title: "On deck",
        items: [
          { name: "Paola Lenti", slug: "paola-lenti", text: "Outdoor furniture, rugs and its own outdoor fabrics – the maker also shows projects in yachting." },
          { name: "Tuuci", slug: "tuuci", text: "Outdoor furniture from the Bleau collection. Tuuci names marine and yachting settings as a field of use for the brand; parasols on request." },
        ],
      },
      {
        title: "Below deck – loose and dry",
        items: [
          { name: "Minotti", slug: "minotti", featured: ["Lido (Sofas)", "Libra Coffee Table"], text: "Sofas, tables, rugs and textiles from the living collection for the saloon – loose, and secured by the yard." },
          { name: "Flos", slug: "flos", text: "Battery lamps such as Bellhop or Bon Jour Unplugged – no fixed connection." },
          { name: "Treca", slug: "treca", text: "Mattress toppers. For berths we ask the maker for made-to-measure sizes." },
          { name: "Alonpi", slug: "alonpi", text: "Bed linen, blankets and throws for cabin and saloon." },
        ],
      },
      {
        title: "Boathouse, jetty & lake terrace",
        items: [
          { name: "Solpuri", slug: "solpuri", text: "Outdoor furniture: tables, chairs, lounge pieces and loungers." },
          { name: "Umbrosa", slug: "umbrosa", text: "Parasols and shade sails from Belgium." },
          { name: "Heatsail", slug: "heatsail", text: "Warmth for evenings by the water – so the season lasts longer." },
          { name: "Poliform", slug: "poliform", text: "Outdoor pieces such as the Ketch lounge for terrace and boathouse." },
          { name: "Sifas", slug: "sifas", text: "Outdoor furniture, daybeds and lounge pieces for terrace and jetty." },
          { name: "Livintwist", slug: "livintwist", text: "Woven outdoor loungers and canopies." },
        ],
      },
    ],
  },
  area: {
    eyebrow: "Home waters",
    heading: "At home on Lake Constance – and under way in the Mediterranean",
    regions: [
      {
        title: "Lake Constance",
        text: "Harbours and winter storage on the Austrian, German and Swiss shores – from Lochau, Bregenz and Hard to Lindau and Friedrichshafen, Rorschach and Romanshorn. We arrange visits on board directly with you.",
      },
      {
        title: "Mediterranean",
        text: "Is your boat on the Adriatic or another Mediterranean coast? We are glad to discuss planning and samples in Lochau. Delivery and fitting on site are agreed for each project individually.",
      },
    ],
    showroom: "Our showroom is at Landstraße 11, 6911 Lochau, right on Lake Constance where Austria, Germany and Switzerland meet. Tuesday to Friday 10 am–6 pm, Saturday 10 am–2 pm – for advice on your boat we recommend an appointment.",
  },
  cta: {
    heading: "An appointment on board or in the showroom",
    text: "Tell us about your boat or boathouse. We come to the harbour or to winter storage – or you visit us in Lochau and see fabrics and materials in the original.",
    primaryLabel: "Request an appointment",
    mailSubject: "Enquiry: yacht interior",
    // Same wizard topic as the German page (?thema=yacht pre-selects "Yacht").
    href: "/consultation?thema=yacht",
  },
  // Benchmark fix-02: the path for the trades (yard, upholsterer, skipper / yacht management).
  trade: {
    eyebrow: "For professionals on the water",
    heading: "Yard, upholsterer, skipper: working on one boat together",
    text: "Many projects begin not with the owner but with you – in winter storage, at the measuring or at the handover. We bring design, brands from our range and the showroom in Lochau. Craft and engineering stay with you.",
    paths: [
      { title: "Boatyards", text: "An owner would like a new interior along with the refit? We supply the concept and the loose furnishings. Work on the boat, fixings and the approval of weight and stability stay with your yard.", subject: "Cooperation boatyard – yacht interior", label: "Write to us as a yard" },
      { title: "Marine upholsterers", text: "You make the cushions, covers and bimini. We work out the colour world and the choice of fabrics with the owner – measuring, templates and making stay with you.", subject: "Cooperation marine upholsterer – yacht interior", label: "Write to us as an upholsterer" },
      { title: "Skippers and yacht management", text: "You look after a boat for its owner – on Lake Constance or in the Mediterranean? We agree dates on board with you; planning and samples we discuss in Lochau or by video.", subject: "Skipper / yacht management – yacht interior", label: "Arrange a date" },
    ],
  },
  schema: {
    serviceName: "Yacht and boat interiors",
    serviceType: "Interior design and furnishing of boats, yachts and boathouses",
    description:
      "Design and furnishing of deck, saloon, cabins and boathouses with outdoor furniture, fabrics and light. Measuring, making and fitting are done by marine upholsterers and boatyards; Platzhirsch coordinates the dates.",
    areaServed: ["Lake Constance", "Vorarlberg", "Bavaria", "Baden-Württemberg", "Eastern Switzerland", "Mediterranean"],
    alternateName: ["Yacht interior design", "Boat furnishing"],
    audience: ["Boat and yacht owners", "Boatyards", "Marine upholsterers"],
  },
  faq: {
    name: "yacht-faq",
    heading: "Questions about yacht interiors and boat cushions",
    items: [
      {
        q: "Do you make boat cushions yourselves?",
        a: "No. We take care of the design and the advice on fabrics and colours. Measuring and making the cushions is done by a marine upholsterer from the region. We coordinate the dates and set out in the quotation who provides which service.",
      },
      // texte-seo-ki 31.10.2026: same four added questions as the German page.
      {
        q: "Which fabric and foam are suitable for boat cushions?",
        a: "On cockpit and deck, usually solution-dyed acrylic or marine faux leather, over open-cell foam that lets water drain away. Below deck, linen and cotton sateen work as long as they stay dry. Values for UV resistance, colourfastness and flammability are on the maker's data sheet – we obtain it before the quotation and choose fabric and foam together with the marine upholsterer. You can see samples in the Lochau showroom or on board.",
      },
      {
        q: "Which boats is the service intended for?",
        a: "Mainly motorboats and sailing yachts with a cabin or flybridge, as they are common on Lake Constance and in the Mediterranean, and boathouses. Do ask us about other boats as well – we will tell you honestly whether we can help.",
      },
      {
        q: "Do you also work for boatyards and marine upholsterers?",
        a: "Yes. When an owner would like a design for saloon, cabins or deck, we take care of the concept, the advice on colours and fabrics and the loose furnishings – with a product list that includes weights and the maker's details. Measuring, making, fitting and any work on the boat stay with you. We are glad to visit you at the yard or in winter storage.",
      },
      {
        q: "When is the best time for a new interior?",
        a: "Winter storage, from November to February. The boat is then ashore, and there is time for planning and making before the relaunch in spring. Speak to us early, so that upholsterer and yard can schedule the work. Deck furniture, textiles and boathouses are possible during the season, too.",
      },
      {
        q: "What does a new interior for my boat cost?",
        a: "That depends on the size of the boat, the number of zones and the products chosen, so we do not quote flat rates. After the visit on board you receive a written quotation for the concept and the loose furnishings. Cushions and work on the boat are quoted separately by the marine upholsterer and the yard; the quotation states who provides which service.",
      },
      {
        q: "Do you also build furniture into the boat?",
        a: "Work on structure, electrics, gas or ventilation, as well as drilling and fixings, is always done by the yard. We concentrate on design and loose furnishings. That way responsibility for the engineering of your boat stays in the right hands.",
      },
      {
        q: "Are the furniture and fabrics suitable for use on board?",
        a: "We only choose products that the maker intends for outdoor use, and before the quotation we clarify with the maker whether a model can be used on board. Details on weight, care and material properties come with the quotation.",
      },
      {
        q: "Can I use Minotti furniture on my boat?",
        a: "Below deck, yes: sofas, tables, rugs and textiles from the living collection, placed loose, secured by the yard and kept dry. On deck and in the cockpit we only consider collections the maker intends for outdoor use. Whether a model can be used on board, we clarify in writing with the maker before the quotation. How Minotti furniture looks on a yacht is shown by the Custom Line Navetta 42 reference on this page – it was not furnished by Platzhirsch.",
      },
      {
        q: "Is the 3D boat on this page my boat?",
        a: "No. The 3D model is a diagram for several types of boat. It shows which zones there are on board and what we suggest for them. Furniture appears as simplified shapes; the real products are shown with the maker's image. For your boat we begin with a visit on board.",
      },
      {
        q: "Are the images of the example concepts real projects?",
        a: "No. They are concept visualisations – some rendered in Blender (captioned “Visualisation (rendering)”), some AI-generated and labelled as such. They show a mood – no real boats, no client projects and no products from our range. We only show real photos once the owners have given written consent.",
      },
      {
        q: "Do you also plan the boathouse, jetty and lakeside garden?",
        a: "Yes. For boathouse, jetty, lake terrace and garden we combine the furnishings with our outdoor planning. Garden planning and the work itself are carried out by licensed specialists, for example landscape gardeners; we coordinate them for you.",
      },
      {
        q: "Do you also look after boats in the Mediterranean?",
        a: "Yes, gladly. We discuss planning and samples in Lochau or by video. How delivery and fitting at the berth are organised, we agree for each project individually.",
      },
    ],
  },
};
