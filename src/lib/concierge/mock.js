// src/lib/concierge/mock.js
// Mock mode (CONCIERGE_MOCK=1, or the dev-only button in the UI): fixed sample
// answers picked by keyword, streamed like the real model. Product cards come
// from the REAL catalogue tools (read-only), so the UI path is the same as
// live – nothing here is an invented product, price or reference.
//
// Sitewide (env.surface === "site"): the website-agent proposals are shown
// with fixed examples, built by the SAME server code as live (runTool →
// actions.js: zod, catalogue check, signature), so tests cover the real check:
//   "Minotti Sofas"        → propose_catalog_filter (sofas-couches, marke=minotti)
//   "… merken"             → cards + propose_save_to_selection (first card)
//   "… öffnen"             → cards + propose_open_product (first card)
//   "Termin"               → propose_appointment_form (draft to copy, never sent)
//   "Maße" (product page)  → propose_scroll_to_section (section "masse…")
//   "zum Showroom"         → propose_navigation(kontakt)
import "server-only";
import { FEATURED_BRANDS } from "@/lib/content/brands";
import { runTool } from "./tools";
import { OPENING_HOURS } from "./showroom";
import { ADDRESS, DIRECTIONS_URL, PHONE_DISPLAY } from "@/lib/site";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function streamText(text, emit, signal) {
  const parts = text.match(/\S+\s*/g) || [];
  for (const part of parts) {
    if (signal?.aborted) return;
    emit({ type: "text", delta: part });
    await sleep(18);
  }
}

const CATEGORY_HINTS = [
  { re: /sofa|couch/, key: "sofas-couches", de: "Sofas", en: "sofas" },
  { re: /sessel|armchair|hocker/, key: "armchairs-stools", de: "Sessel und Hocker", en: "armchairs" },
  { re: /bett|bed/, key: "beds", de: "Betten", en: "beds" },
  { re: /barhocker|bar stool/, key: "bar-stools", de: "Barhocker", en: "bar stools" },
];

function isEnglish(text) {
  return /\b(the|hello|hi|what|which|do you|looking for|please|thanks|show me|open|save)\b/i.test(text);
}

const textOf = (m) => (typeof m?.content === "string" ? m.content : (m?.content || []).map((b) => b.text || "").pop() || "");

export async function runMock({ history, plain, emit, signal, env = {} }) {
  const lastMsg = (plain || history)[(plain || history).length - 1];
  const last = String(textOf(lastMsg));
  const q = last.toLowerCase();
  const en = isEnglish(last);
  const site = env.surface === "site";
  env.round = { count: 0 };
  let text = "";
  const productIds = [];
  const say = async (t) => {
    text += t;
    await streamText(t, emit, signal);
  };
  const tool = (name, input) => runTool(name, input, env);
  const propose = async (name, input) => {
    const r = await tool(name, input);
    if (r.action) emit(r.action);
    return r;
  };

  await sleep(350);

  const brand = FEATURED_BRANDS.find((b) => q.includes(b.name.toLowerCase()));
  const cat = CATEGORY_HINTS.find((c) => c.re.test(q));

  if (/preis|kost|rabatt|günstig|teuer|€|eur|chf|price|cost|discount/.test(q)) {
    await say(en
      ? "I can't give prices or discounts – I don't have reliable figures, and they depend on configuration, fabric and finish. Our team will gladly prepare a personal offer for you."
      : "Preise und Rabatte nenne ich bewusst nicht – sie hängen von Ausführung, Bezug und Maßen ab, und verlässliche Zahlen habe ich nicht. Unser Team erstellt Ihnen gerne ein persönliches Angebot.");
    await addHandoff(en ? "Offer request" : "Angebot", tool, emit);
  } else if (/zoll|steuer|mwst|mehrwert|schweiz|liechtenstein|einfuhr|customs|tax|vat|switzerland/.test(q)) {
    await say(en
      ? "Questions about VAT, customs or delivery to Switzerland and Liechtenstein depend on your individual case, so I'd rather not guess. Our team explains the options in a personal consultation."
      : "Fragen zu Mehrwertsteuer, Zoll oder Lieferung in die Schweiz und nach Liechtenstein hängen vom Einzelfall ab – da möchte ich nichts Falsches sagen. Unser Team erklärt Ihnen die Möglichkeiten gerne in einer persönlichen Beratung.");
    await addHandoff(en ? "Delivery abroad" : "Lieferung ins Ausland", tool, emit);
  } else if (/termin|beratung|besuch|rückruf|appointment|visit|consult/.test(q)) {
    if (site) {
      await say(en
        ? "With pleasure. I can open the appointment form and draft your request – you paste it, check it and send it yourself:"
        : "Sehr gerne. Ich kann das Formular für die Terminanfrage öffnen und Ihr Anliegen vorbereiten – Sie prüfen es und senden selbst:");
      await propose("propose_appointment_form", {
        topic: en ? "Showroom appointment" : "Termin im Showroom",
        note: en
          ? "I would like to see sofas and fabrics in person and get advice on proportions."
          : "Ich möchte Sofas und Bezugsstoffe im Showroom ansehen und mich zu Proportionen beraten lassen.",
      });
    } else {
      await say(en
        ? "With pleasure – a personal consultation in our showroom in Lochau is the best way to see materials and proportions. You can request an appointment here:"
        : "Sehr gerne – im Showroom in Lochau sehen und fühlen Sie Materialien und Proportionen am besten. Hier können Sie einen Termin anfragen:");
      await addHandoff(en ? "Showroom appointment" : "Termin im Showroom", tool, emit);
    }
  } else if (site && /\b(ma(ß|ss)e|abmessung|dimension|abschnitt)/.test(q)) {
    const sections = env.sections || [];
    const target = sections.find((s) => /mass|masse|dimension/.test(s.id)) || sections[0];
    if (target) {
      await say(en ? "The dimensions are further down on this page – shall I take you there?" : "Die Maße stehen weiter unten auf dieser Seite – soll ich Sie hinführen?");
      await propose("propose_scroll_to_section", { section_id: target.id });
    } else {
      await say(en
        ? "This page has no section with dimensions. Open a product page and ask again – or our team gives you exact measurements."
        : "Auf dieser Seite gibt es keinen Abschnitt mit Maßen. Öffnen Sie eine Produktseite und fragen Sie dort noch einmal – oder unser Team nennt Ihnen die genauen Maße.");
    }
  } else if (site && /(zum showroom|zur kontaktseite|kontaktseite|kontakt öffnen|go to contact|contact page)/.test(q)) {
    await say(en ? "The contact page has the address, opening hours and directions:" : "Auf der Kontaktseite finden Sie Adresse, Öffnungszeiten und Anfahrt:");
    await propose("propose_navigation", { route: "kontakt", reason: en ? "Address and directions" : "Adresse und Anfahrt" });
  } else if (site && /yacht/.test(q)) {
    await say(en ? "Our yacht interior page shows how we plan interiors on board:" : "Auf unserer Seite zu Yacht-Interieur zeigen wir, wie wir Einrichtungen an Bord planen:");
    await propose("propose_navigation", { route: "yacht-interior" });
  } else if (site && /(merk|speicher|auswahl|save|wishlist)/.test(q)) {
    const r = brand
      ? await tool("search_products", { query: brand.name, limit: 3 })
      : await tool("products_in_category", { category_key: (cat || CATEGORY_HINTS[0]).key, limit: 3 });
    productIds.push(...emitProducts(r, emit));
    if (r.products?.length) {
      await say(en ? "Shall I put the first piece on your selection? You decide with one click." : "Soll ich das erste Stück auf Ihre Auswahl legen? Sie entscheiden mit einem Klick.");
      await propose("propose_save_to_selection", { product_ids: [r.products[0].id] });
    } else {
      await say(en ? "The catalogue isn't reachable right now." : "Der Katalog ist gerade nicht erreichbar.");
    }
  } else if (site && /(öffne|öffnen|produktseite|\bopen\b)/.test(q)) {
    const r = await tool("search_products", { query: (brand || FEATURED_BRANDS[0]).name, limit: 3 });
    productIds.push(...emitProducts(r, emit));
    if (r.products?.length) {
      await say(en ? "I can open the product page of the first piece for you:" : "Ich kann die Produktseite des ersten Stücks für Sie öffnen:");
      await propose("propose_open_product", { product_id: r.products[0].id });
    } else {
      await say(en ? "The catalogue isn't reachable right now." : "Der Katalog ist gerade nicht erreichbar.");
    }
  } else if (/öffnungs|offen|adresse|anfahrt|parken|café|cafe|wo finde|opening|address|where/.test(q)) {
    emit({ type: "status", label: "Showroom-Infos …" });
    await tool("showroom_info", {});
    const hours = OPENING_HOURS.map((h) => `- ${h.days}: ${h.time}`).join("\n");
    await say(`${en ? "You'll find our showroom with café at" : "Sie finden unseren Showroom mit Café in der"} **${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}**.\n\n${hours}\n\n${en ? "Phone" : "Telefon"}: ${PHONE_DISPLAY}\n\n[${en ? "Plan your route" : "Route planen"}](${DIRECTIONS_URL})`);
  } else if (site && brand && cat) {
    emit({ type: "status", label: "Katalog wird gefiltert …" });
    const r = await tool("products_in_category", { category_key: cat.key, brand: brand.name, limit: 6 });
    await say(en
      ? `Here are ${cat.en} by **${brand.name}** from our catalogue. I can also open the catalogue filtered to them:\n\n`
      : `Hier ${cat.de} von **${brand.name}** aus unserem Katalog. Ich kann Ihnen den Katalog auch gleich gefiltert öffnen:\n\n`);
    productIds.push(...emitProducts(r, emit));
    const p = await propose("propose_catalog_filter", { category_key: cat.key, brand: [brand.name] });
    if (p.isError) await say(en ? "There is no matching filter right now." : "Dafür gibt es gerade keinen passenden Filter.");
  } else if (brand) {
    await say(en ? `Here is a selection from **${brand.name}** in our catalogue:\n\n` : `Hier eine Auswahl von **${brand.name}** aus unserem Katalog:\n\n`);
    emit({ type: "status", label: "Katalog wird durchsucht …" });
    const r = await tool("search_products", { query: brand.name, limit: 6 });
    productIds.push(...emitProducts(r, emit));
    await say(r.products?.length
      ? (en ? "Shall I narrow it down by room or material?" : "Soll ich nach Raum oder Material eingrenzen?")
      : (en ? "The catalogue isn't reachable right now – our team can help directly." : "Der Katalog ist gerade nicht erreichbar – unser Team hilft Ihnen gerne direkt weiter."));
  } else if (cat) {
    await say(en
      ? `For ${cat.en}, proportions and seat depth matter most – ideally test them in person. A first selection:\n\n`
      : `Bei ${cat.de} entscheiden Proportion und Sitzgefühl – am besten probieren Sie sie im Showroom aus. Eine erste Auswahl:\n\n`);
    emit({ type: "status", label: "Kollektion wird zusammengestellt …" });
    const r = await tool("products_in_category", { category_key: cat.key, limit: 6 });
    productIds.push(...emitProducts(r, emit));
    await say(en ? "Do you prefer a calm, light look or something with more contrast?" : "Mögen Sie es eher ruhig und hell oder lieber mit mehr Kontrast?");
  } else if (site) {
    await say(en
      ? "Hello, I'm the digital concierge of Platzhirsch – an AI assistant. I can show you products and brands, filter the catalogue, save pieces or prepare an appointment request. I only suggest; you confirm every step."
      : "Guten Tag, ich bin der digitale Concierge von Platzhirsch – ein KI-Assistent. Ich zeige Ihnen Produkte und Marken, filtere den Katalog, merke Stücke oder bereite eine Terminanfrage vor. Ich schlage nur vor – jeden Schritt bestätigen Sie selbst.");
  } else {
    await say(en
      ? "Hello, I'm the digital concierge of Platzhirsch – an AI assistant. I can show you products and brands from our catalogue, give interior tips and help you book a consultation. What are you planning?"
      : "Guten Tag, ich bin der digitale Concierge von Platzhirsch – ein KI-Assistent. Ich zeige Ihnen Produkte und Marken aus unserem Katalog, gebe Einrichtungstipps und helfe Ihnen zu einem Beratungstermin. Was planen Sie gerade?");
  }
  return { text, productIds };
}

function emitProducts(result, emit) {
  if (!result.products?.length) return [];
  emit({ type: "products", items: result.products });
  return result.products.map((p) => p.id);
}

async function addHandoff(topic, tool, emit) {
  const r = await tool("request_appointment", { topic });
  if (r.handoff) emit({ type: "handoff", ...r.handoff });
}
