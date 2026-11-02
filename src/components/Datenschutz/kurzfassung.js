import React from "react";
import { Container } from "@/components/ui";
import { ADDRESS, EMAIL, EMAIL_HREF, LEGAL_NAME, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";

// Kurzfassung der Datenschutzerklärung auf EN/FR/IT (Rat 9,5, Maßnahme A16;
// QA Recht −0,1, Art. 12 DSGVO für die Zielgruppe in CH, IT und FR).
//
// Inhalt: nur Aussagen, die in der freigegebenen deutschen Fassung stehen
// (src/components/Datenschutz/datenschutz.js), übersetzt und gekürzt. Keine
// neuen Tatsachen. Maßgeblich bleibt der deutsche Volltext darunter; das sagt
// die Kurzfassung selbst. Gegencheck der Übersetzung durch die Kanzlei: offen
// (Marktresearch/recht/07-dse-ergaenzungen-rat95.md, Punkt Kurzfassung).
//
// Texte hier statt in src/messages: Rechtstext im Besitz des Teams Recht
// (gleiches Muster wie Legal/GermanOnlyNotice.js).

export const DSE_HEADER = Object.freeze({
  en: { title: "Privacy policy", lead: "Summary in English. The full privacy policy below is in German; the German version is authoritative." },
  fr: {
    title: "Protection des données",
    lead: "Résumé en français. La déclaration complète ci-dessous est en allemand ; la version allemande fait foi.",
  },
  it: {
    title: "Informativa sulla privacy",
    lead: "Sintesi in italiano. L’informativa completa qui sotto è in tedesco; fa fede la versione tedesca.",
  },
});

const COPY = Object.freeze({
  en: {
    heading: "Summary",
    country: "Austria",
    controller: "Controller",
    contact: "Questions about data protection and requests regarding your rights:",
    sections: [
      {
        h: "What we process and why",
        items: [
          "Website visits: our server processes technically necessary data (IP address, time, page, browser) to deliver the site, for security and troubleshooting (Art. 6(1)(f) GDPR). Fonts come from our own server.",
          "Enquiries by form, e-mail or phone: name, contact details, your message and project details, to answer your enquiry and prepare an offer (Art. 6(1)(b) GDPR). We keep them until the enquiry is settled and as long as follow-up questions are likely; if an order follows, statutory retention periods apply (7 years in Austria).",
          "Newsletter: only your e-mail address and your consent, confirmed by a link (double opt-in). You can unsubscribe at any time.",
          "Applications by e-mail: to carry out the application process; without employment we delete the documents 7 months after the process ends.",
        ],
      },
      {
        h: "Cookies and consent",
        items: [
          "We only use cookies and similar techniques when they are strictly necessary for a function you request or when you have consented (§ 165(3) TKG 2021). “Continue without consent” is as easy as “Accept all”.",
          "Google Maps and Google Analytics load only with your consent. Data may then be transferred to Google LLC in the USA (EU-US Data Privacy Framework). You can change or withdraw your choice at any time under “Privacy settings” at the foot of every page.",
        ],
      },
      {
        h: "Further functions",
        items: [
          "The AI concierge is an AI system (Claude by Anthropic PBC, USA), not a person. It only starts with your consent; we only store the conversation if you agree.",
          "Customer portal, uploads of photos and plans, online planners and the style finder are described section by section in the German text below.",
        ],
      },
      {
        h: "Your rights",
        items: [
          "You have the right of access, rectification, erasure, restriction of processing, data portability and objection, and you can withdraw consent at any time (Art. 15–21 and Art. 7(3) GDPR). We reply within one month.",
          "You can lodge a complaint with a supervisory authority, in Austria the Österreichische Datenschutzbehörde, Barichgasse 40–42, 1030 Vienna, or with the authority in your country of residence.",
        ],
      },
    ],
    full: "Full privacy policy (German, authoritative)",
  },
  fr: {
    heading: "Résumé",
    country: "Autriche",
    controller: "Responsable du traitement",
    contact: "Questions sur la protection des données et demandes relatives à vos droits :",
    sections: [
      {
        h: "Ce que nous traitons et pourquoi",
        items: [
          "Visite du site : notre serveur traite les données techniquement nécessaires (adresse IP, heure, page, navigateur) pour afficher le site, pour la sécurité et la recherche d’erreurs (art. 6, par. 1, point f RGPD). Les polices proviennent de notre propre serveur.",
          "Demandes par formulaire, e-mail ou téléphone : nom, coordonnées, votre message et les détails du projet, pour répondre à votre demande et préparer une offre (art. 6, par. 1, point b RGPD). Nous les conservons jusqu’au traitement de la demande, puis tant que des questions sont probables ; en cas de commande, les délais légaux de conservation s’appliquent (7 ans en Autriche).",
          "Newsletter : uniquement votre adresse e-mail et votre consentement, confirmé par un lien (double opt-in). Désinscription possible à tout moment.",
          "Candidatures par e-mail : pour mener la procédure de recrutement ; sans embauche, nous supprimons les documents 7 mois après la fin de la procédure.",
        ],
      },
      {
        h: "Cookies et consentement",
        items: [
          "Nous utilisons des cookies et techniques similaires uniquement s’ils sont strictement nécessaires à une fonction que vous demandez ou si vous y avez consenti (§ 165, al. 3 TKG 2021). « Continuer sans consentement » est aussi simple que « Tout accepter ».",
          "Google Maps et Google Analytics ne se chargent qu’avec votre consentement. Des données peuvent alors être transférées à Google LLC aux États-Unis (EU-US Data Privacy Framework). Vous pouvez modifier ou retirer votre choix à tout moment sous « Paramètres de confidentialité » en bas de chaque page.",
        ],
      },
      {
        h: "Autres fonctions",
        items: [
          "Le concierge IA est un système d’intelligence artificielle (Claude d’Anthropic PBC, États-Unis), pas une personne. Il ne démarre qu’avec votre consentement ; la conversation n’est enregistrée que si vous l’acceptez.",
          "L’espace client, l’envoi de photos et de plans, les outils de planification en ligne et le Style finder sont décrits section par section dans le texte allemand ci-dessous.",
        ],
      },
      {
        h: "Vos droits",
        items: [
          "Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité et d’opposition, et vous pouvez retirer votre consentement à tout moment (art. 15 à 21 et art. 7, par. 3 RGPD). Nous répondons dans un délai d’un mois.",
          "Vous pouvez introduire une réclamation auprès d’une autorité de contrôle, en Autriche l’Österreichische Datenschutzbehörde, Barichgasse 40–42, 1030 Vienne, ou auprès de l’autorité de votre pays de résidence.",
        ],
      },
    ],
    full: "Déclaration complète (en allemand, fait foi)",
  },
  it: {
    heading: "Sintesi",
    country: "Austria",
    controller: "Titolare del trattamento",
    contact: "Domande sulla protezione dei dati e richieste relative ai vostri diritti:",
    sections: [
      {
        h: "Che cosa trattiamo e perché",
        items: [
          "Visita del sito: il nostro server tratta i dati tecnicamente necessari (indirizzo IP, ora, pagina, browser) per mostrare il sito, per la sicurezza e la ricerca di errori (art. 6, par. 1, lett. f GDPR). I caratteri provengono dal nostro server.",
          "Richieste tramite modulo, e-mail o telefono: nome, recapiti, il vostro messaggio e i dettagli del progetto, per rispondere alla richiesta e preparare un’offerta (art. 6, par. 1, lett. b GDPR). Li conserviamo fino alla conclusione della richiesta e finché sono probabili domande; in caso di ordine valgono i termini legali di conservazione (7 anni in Austria).",
          "Newsletter: solo il vostro indirizzo e-mail e il vostro consenso, confermato tramite un link (double opt-in). Potete disiscrivervi in qualsiasi momento.",
          "Candidature via e-mail: per svolgere la procedura di selezione; senza assunzione cancelliamo i documenti 7 mesi dopo la fine della procedura.",
        ],
      },
      {
        h: "Cookie e consenso",
        items: [
          "Usiamo cookie e tecniche simili solo se strettamente necessari per una funzione che richiedete o se avete dato il consenso (§ 165, comma 3 TKG 2021). «Continua senza consenso» è semplice quanto «Accetta tutto».",
          "Google Maps e Google Analytics si caricano solo con il vostro consenso. I dati possono allora essere trasferiti a Google LLC negli Stati Uniti (EU-US Data Privacy Framework). Potete modificare o revocare la scelta in qualsiasi momento in «Impostazioni privacy» in fondo a ogni pagina.",
        ],
      },
      {
        h: "Altre funzioni",
        items: [
          "Il concierge IA è un sistema di intelligenza artificiale (Claude di Anthropic PBC, USA), non una persona. Si avvia solo con il vostro consenso; la conversazione viene salvata solo se siete d’accordo.",
          "Area clienti, invio di foto e piante, strumenti di progettazione online e lo Style finder sono descritti sezione per sezione nel testo tedesco qui sotto.",
        ],
      },
      {
        h: "I vostri diritti",
        items: [
          "Avete diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità e opposizione, e potete revocare il consenso in qualsiasi momento (artt. 15–21 e art. 7, par. 3 GDPR). Rispondiamo entro un mese.",
          "Potete proporre reclamo a un’autorità di controllo, in Austria all’Österreichische Datenschutzbehörde, Barichgasse 40–42, 1030 Vienna, o all’autorità del vostro paese di residenza.",
        ],
      },
    ],
    full: "Informativa completa (in tedesco, fa fede)",
  },
});

/** Kopfzeilen (H1, Lead) in der Seitensprache, null auf Deutsch. */
export function dseHeader(locale) {
  return locale && locale !== "de" ? DSE_HEADER[locale] || DSE_HEADER.en : null;
}

/** Text der Kurzfassung, null auf Deutsch. */
export function dseSummary(locale) {
  return locale && locale !== "de" ? COPY[locale] || COPY.en : null;
}

const PROSE = [
  "max-w-measure text-body text-text",
  "[&_h2]:text-title [&_h2]:text-text",
  "[&_h3]:mt-8 [&_h3]:text-lead [&_h3]:font-medium [&_h3]:text-text",
  "[&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_a]:break-words",
].join(" ");

/** Kurzfassung über dem deutschen Volltext (nur EN/FR/IT). */
export default function DseKurzfassung({ locale }) {
  const c = dseSummary(locale);
  if (!c) return null;
  return (
    <section className="bg-surface pb-8" aria-labelledby="dse-kurzfassung" data-dse-summary={locale}>
      <Container size="page">
        <div lang={locale} className={PROSE}>
          <h2 id="dse-kurzfassung">{c.heading}</h2>
          <h3>{c.controller}</h3>
          <p className="mt-3">
            {LEGAL_NAME} (Platzhirsch Home Living), {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}, {c.country}
          </p>
          <p className="mt-2">
            {c.contact} <a href={EMAIL_HREF}>{EMAIL}</a>, <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
          </p>
          {c.sections.map((s) => (
            <div key={s.h}>
              <h3>{s.h}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-text-soft">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-10 border-t border-line pt-8 text-small text-text-soft">{c.full}</p>
        </div>
      </Container>
    </section>
  );
}
