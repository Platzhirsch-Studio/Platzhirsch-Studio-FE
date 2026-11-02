// Sofaplaner FR/IT – Seitentexte und SEO-Texte als reine Daten (Sprachen-Welle
// FR/IT, 01.11.2026). Ohne "@/…"-Importe, damit node --test sie prüfen kann
// (tests/unit/sofaplaner-fr-it.test.mjs); Metadaten/JSON-LD baut ./page-intl.js.
// FR mit frenchTypography(), IT mit «». Keine Preise, keine Superlative, keine
// neuen Fakten: jede Aussage steht schon auf der deutschen bzw. englischen Seite.
import { MINOTTI_DATA_CONSENT } from "../consent.js";
import { frenchTypography } from "./typo.js";

const FR = frenchTypography({
  seo: {
    minotti: {
      title: "Configurateur de canapé Minotti en ligne | Platzhirsch",
      description:
        "Composez votre canapé Minotti, d’angle ou modulaire, avec ses véritables éléments et les cotes du fabricant, dans votre plan. Aperçu 3D, prix sur demande.",
    },
    neutral: {
      title: "Configurateur de canapé : canapé modulaire | Platzhirsch",
      description:
        "Canapé d’angle, en U ou avec chaise longue : planifiez-le en modules dans votre plan – passages, aperçu 3D, liste des éléments. Modèles au showroom.",
    },
    ogAlt: "Configurateur de canapé : canapé d’angle sur le plan d’une pièce, avec dimensions",
    home: "Accueil",
  },
  page: {
    handLine: "Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main.",
    startCta: "Commencer la planification",
    unknownModel: "Le modèle « {m} » est introuvable. Veuillez choisir un modèle dans la liste.",
    badShare: "Le plan partagé est introuvable ou le lien n’est pas valable. Vous voyez une proposition de départ.",
    sharedLoaded: "Plan partagé « {name} » chargé. Les modifications ne concernent que votre affichage.",
    sharedDropped: " Éléments qui ne figurent plus au catalogue : {n}.",
    asideLabel: "Exemple : canapé en vue de face et sur plan",
    heroTitle: "{model} {name} en vue de face",
    heroCaption: "{model} « {name} », vue de face · profondeur {depth} cm, hauteur {height} cm",
    tipsTitle: "Ce qui compte lors de la planification",
    tips: [
      ["Passages :", "laissez {min}–{ideal} cm devant le canapé et entre les meubles ; pour les passages principaux vers les portes, plutôt {ideal} cm ou plus."],
      ["Raccord à gauche/à droite :", "les éléments d’extrémité existent avec accoudoir à gauche ou à droite, vu de face. Le configurateur choisit lui-même le bon côté lors du raccordement."],
      ["Fenêtres :", "comparez la hauteur du dossier et l’allège – si l’allège est plus basse, le dossier dépasse dans la fenêtre."],
      ["Accès de livraison :", "mesurez à l’avance la cage d’escalier, la largeur des portes et l’ascenseur – les éléments modulaires entrent un par un dans la maison."],
    ],
  },
});

const IT = {
  seo: {
    minotti: {
      title: "Configuratore divano Minotti online | Platzhirsch",
      description:
        "Configurate il vostro divano Minotti angolare o modulare con veri elementi e misure del produttore nella vostra pianta. Anteprima 3D, prezzi su richiesta.",
    },
    neutral: {
      title: "Configuratore divano: divano modulare | Platzhirsch",
      description:
        "Divano angolare, a U o con chaise longue: progettatelo a moduli nella vostra pianta – passaggi, anteprima 3D, distinta elementi. Modelli nello showroom.",
    },
    ogAlt: "Configuratore divano: divano angolare nella pianta di un ambiente, con misure",
    home: "Home",
  },
  page: {
    handLine: "Iniziate online – poi Harald Menghin disegna a mano il vostro concept.",
    startCta: "Iniziare la progettazione",
    unknownModel: "Il modello «{m}» non è stato trovato. Scegliete un modello dall’elenco.",
    badShare: "Il progetto condiviso non è stato trovato o il link non è valido. State vedendo una proposta iniziale.",
    sharedLoaded: "Progetto condiviso «{name}» caricato. Le modifiche riguardano solo la vostra visualizzazione.",
    sharedDropped: " Elementi non più a catalogo: {n}.",
    asideLabel: "Esempio: divano in vista frontale e in pianta",
    heroTitle: "{model} {name} in vista frontale",
    heroCaption: "{model} «{name}», vista frontale · profondità {depth} cm, altezza {height} cm",
    tipsTitle: "Cosa conta nella progettazione",
    tips: [
      ["Passaggi:", "lasciate {min}–{ideal} cm davanti al divano e tra i mobili; per i passaggi principali verso le porte meglio {ideal} cm o più."],
      ["Collegamento a sinistra/destra:", "gli elementi terminali esistono con bracciolo a sinistra o a destra, guardando il divano di fronte. Il configuratore sceglie da sé il lato giusto durante il collegamento."],
      ["Finestre:", "confrontate l’altezza dello schienale con il davanzale – se il davanzale è più basso, lo schienale sporge nella finestra."],
      ["Percorso di consegna:", "misurate in anticipo vano scale, larghezza delle porte e ascensore – gli elementi modulari entrano in casa uno alla volta."],
    ],
  },
};

export const SOFA_PAGE_COPY = Object.freeze({ fr: FR, it: IT });
const COPY = SOFA_PAGE_COPY;

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

/** Seitentexte (Strings/Arrays) einer Zusatzsprache oder null. */
export function sofaPageIntl(locale) {
  const c = COPY[locale];
  if (!c) return null;
  const p = c.page;
  return {
    ...p,
    unknownModel: (m) => fill(p.unknownModel, { m }),
    sharedLoaded: (name, dropped) => fill(p.sharedLoaded, { name }) + (dropped ? fill(p.sharedDropped, { n: dropped }) : ""),
    heroTitle: (model, name) => fill(p.heroTitle, { model, name }),
    heroCaption: (model, name, depth, height) => fill(p.heroCaption, { model, name, depth, height }),
    tips: (min, ideal) => p.tips.map(([k, v]) => [k, fill(v, { min, ideal })]),
  };
}

/** SEO-Texte (Titel ≤ 60, Description 120–155) je Sprache und Datenquelle. */
export function sofaSeoIntl(locale) {
  const c = COPY[locale];
  if (!c) return null;
  return { ...(MINOTTI_DATA_CONSENT ? c.seo.minotti : c.seo.neutral), ogAlt: c.seo.ogAlt, home: c.seo.home };
}

