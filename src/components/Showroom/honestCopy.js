// Ehrlicher Zustand der Seite /showroom ohne echte Aufnahme (R8, gesamtwerk
// P1-6, neuland P1-3): solange nur die synthetische Testszene da ist
// (tour.test), verspricht die Seite keinen „Rundgang“ – weder im Kopf noch
// auf dem Poster, im Knopf, in der Video-Zeile oder im Terminwunsch. Die
// Seite bleibt noindex (preview) bzw. 404 in Produktion (src/lib/showroom/config.js).
// Diese Texte überschreiben nur für tour.test die Schlüssel aus
// src/lib/showroom/copy.js; mit echter Aufnahme gilt wieder copy.js.
// Rein, ohne React: Server- und Client-Komponenten importieren es.
import { showroomCopy } from "@/lib/showroom/copy";

const HONEST = {
  de: {
    meta: {
      title: "Showroom Lochau | Platzhirsch Home Living",
      description: "Unsere Ausstellung in Lochau am Bodensee: Wohnen, Küche, Café und Outdoor. Probe sitzen und Stoffe fühlen im Showroom mit Café, Termin auf Anfrage.",
    },
    eyebrow: "Showroom Lochau",
    h1: "Unsere Ausstellung in Lochau.",
    lead: "Eine begehbare Aufnahme unserer Ausstellung gibt es noch nicht. Die Szene unten ist eine synthetische Testszene für die Entwicklung, nicht unser Showroom. Die echte Ausstellung zeigen wir Ihnen gern vor Ort.",
    start: "Testszene starten",
    beenden: "Testszene beenden",
    video: "Testszene als Video",
    videoTitel: "Synthetische Testszene, nicht der Showroom",
    posterAlt: "Synthetische Testszene eines Wohnraums, nicht der Showroom Lochau",
    videoText: "Das Video zeigt dieselbe synthetische Testszene.",
    terminPrefix: "Showroom Lochau",
    besuchText: "Probe sitzen, Stoffe fühlen, beim Kaffee planen: Wir nehmen uns Zeit für Sie.",
    technikText: "Die Testszene lädt erst nach Ihrem Klick und nur von unserem eigenen Server. Sie setzt keine Cookies. Messungen zur Nutzung gibt es nur mit Ihrer Einwilligung.",
  },
  en: {
    meta: {
      title: "Lochau showroom | Platzhirsch Home Living",
      description: "Our showroom in Lochau on Lake Constance: living, kitchen, café and outdoor. Try pieces in person in the showroom with café, appointments on request.",
    },
    eyebrow: "Lochau showroom",
    h1: "Our showroom in Lochau.",
    lead: "There is no walk-through recording of our showroom yet. The scene below is a synthetic test scene for development, not our showroom. We are happy to show you the real showroom in person.",
    start: "Start the test scene",
    beenden: "End the test scene",
    video: "Test scene as video",
    videoTitel: "Synthetic test scene, not the showroom",
    posterAlt: "Synthetic test scene of a living room, not the Lochau showroom",
    videoText: "The video shows the same synthetic test scene.",
    terminPrefix: "Lochau showroom",
    besuchText: "Try the seating, feel the fabrics, plan over a coffee: we take our time for you.",
    technikText: "The test scene loads only after your click and only from our own server. It sets no cookies. Usage is measured only with your consent.",
  },
  fr: {
    meta: {
      title: "Showroom de Lochau | Platzhirsch Home Living",
      description: "Notre showroom à Lochau au bord du lac de Constance : séjour, cuisine, café et extérieur. Essayer sur place, rendez-vous sur demande.",
    },
    eyebrow: "Showroom de Lochau",
    h1: "Notre showroom à Lochau.",
    lead: "Il n’existe pas encore de visite enregistrée de notre showroom. La scène ci-dessous est une scène de test synthétique pour le développement, pas notre showroom. Nous vous montrons volontiers le vrai showroom sur place.",
    start: "Lancer la scène de test",
    beenden: "Quitter la scène de test",
    video: "Scène de test en vidéo",
    videoTitel: "Scène de test synthétique, pas le showroom",
    posterAlt: "Scène de test synthétique d’un séjour, pas le showroom de Lochau",
    videoText: "La vidéo montre la même scène de test synthétique.",
    terminPrefix: "Showroom de Lochau",
    besuchText: "S’asseoir, toucher les tissus, planifier autour d’un café : nous prenons le temps pour vous.",
    technikText: "La scène de test ne se charge qu’après votre clic et uniquement depuis notre propre serveur. Elle ne dépose aucun cookie. Les mesures d’usage n’ont lieu qu’avec votre consentement.",
  },
  it: {
    meta: {
      title: "Showroom di Lochau | Platzhirsch Home Living",
      description: "Il nostro showroom a Lochau sul Lago di Costanza: living, cucina, caffè e outdoor. Provare dal vivo nello showroom, appuntamento su richiesta.",
    },
    eyebrow: "Showroom di Lochau",
    h1: "Il nostro showroom a Lochau.",
    lead: "Non esiste ancora una ripresa percorribile del nostro showroom. La scena qui sotto è una scena di prova sintetica per lo sviluppo, non il nostro showroom. Vi mostriamo volentieri lo showroom vero di persona.",
    start: "Avviare la scena di prova",
    beenden: "Chiudere la scena di prova",
    video: "Scena di prova come video",
    videoTitel: "Scena di prova sintetica, non lo showroom",
    posterAlt: "Scena di prova sintetica di un soggiorno, non lo showroom di Lochau",
    videoText: "Il video mostra la stessa scena di prova sintetica.",
    terminPrefix: "Showroom di Lochau",
    besuchText: "Provare le sedute, toccare i tessuti, progettare davanti a un caffè: ci prendiamo tempo per voi.",
    technikText: "La scena di prova si carica solo dopo il vostro clic e solo dal nostro server. Non imposta cookie. L’uso viene misurato solo con il vostro consenso.",
  },
};

/** Texte der Seite: copy.js, für die Testszene (`test`) mit den ehrlichen Fassungen überschrieben. */
export function pageCopy(locale, test) {
  const t = showroomCopy(locale);
  if (!test) return t;
  const h = HONEST[locale] || HONEST.de;
  const { besuchText, technikText, ...rest } = h;
  return { ...t, ...rest, abschnitte: { ...t.abschnitte, besuchText, technikText } };
}
