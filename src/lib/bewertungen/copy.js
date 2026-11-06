// src/lib/bewertungen/copy.js – Texte von Formular und Übersicht auf /bewerten
// in vier Sprachen mit denselben Schlüsseln (die Seite selbst ist heute nur
// deutsch, GERMAN_ONLY_FIRST_SEGMENTS; die Texte liegen gleichwertig vor).
// Sie-Form, keine Superlative, keine Aussagen über Zahl oder Inhalt der Bewertungen.
// Platzhalter: {n} Anzahl, {avg} Durchschnitt, {ref} Referenz, {phone}, {email}.
// consentPublish ändern → EINWILLIGUNG_TEXTVERSION in schema.js hochzählen.

const de = {
  formTitle: "Ihre Bewertung direkt an uns",
  formIntro:
    "Sie können uns hier auch direkt bewerten. Jede Rückmeldung kommt im Studio an, unabhängig von der Sternezahl. Veröffentlicht wird sie nur, wenn Sie das unten ausdrücklich erlauben.",
  legendStars: "Wie zufrieden waren Sie insgesamt?",
  starLabel: { 1: "1 von 5 Sternen", 2: "2 von 5 Sternen", 3: "3 von 5 Sternen", 4: "4 von 5 Sternen", 5: "5 von 5 Sternen" },
  starsHint: "Sterne oder Text genügen.",
  labels: { text: "Ihre Rückmeldung", anlass: "Worum ging es?", name: "Ihr Name", email: "E-Mail für Rückfragen" },
  hints: {
    text: "Bitte keine Telefonnummern oder Adressen; Kontaktdaten entfernen wir vor einer Veröffentlichung.",
    name: "Veröffentlicht wird nur der Vorname und der erste Buchstabe des Nachnamens.",
    email: "Wird nicht veröffentlicht. Nur, falls wir zu Ihrer Rückmeldung nachfragen möchten.",
  },
  anlassLeer: "Bitte wählen (freiwillig)",
  anlaesse: { lieferung: "Lieferung", montage: "Montage", abholung: "Abholung", beratung: "Beratung", service: "Service", sonstiges: "Sonstiges" },
  optional: "freiwillig",
  consentPublish:
    "Ja, Sie dürfen meine Bewertung (Sterne, Text, Anlass und gekürzter Name) auf dieser Website veröffentlichen. Ich kann diese Einwilligung jederzeit per E-Mail widerrufen.",
  consentHint: "Ohne dieses Häkchen lesen nur wir Ihre Rückmeldung.",
  privacyVor: "Wie wir mit Ihren Angaben umgehen, lesen Sie in der",
  privacyLink: "Datenschutzerklärung",
  submit: "Bewertung senden",
  sending: "Wird gesendet …",
  done: {
    title: "Danke für Ihre Rückmeldung",
    text: "Ihre Bewertung ist bei uns angekommen.",
    textPublish: "Ihre Bewertung ist bei uns angekommen. Sie erscheint hier, sobald wir sie freigegeben haben.",
    ref: "Referenz: {ref}",
  },
  errors: {
    required: "Bitte wählen Sie Sterne oder schreiben Sie einen Text.",
    choice: "Bitte wählen Sie einen Eintrag aus der Liste.",
    long: "Dieser Text ist zu lang.",
    email: "Bitte prüfen Sie die E-Mail-Adresse.",
    summaryOne: "Bitte prüfen Sie das markierte Feld.",
    summary: "Bitte prüfen Sie die {n} markierten Felder.",
    rateLimited: "Gerade kommen sehr viele Anfragen an. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an: {phone}.",
    generic: "Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut oder schreiben Sie uns an {email}.",
  },
  listTitle: "Bewertungen unserer Kundinnen und Kunden",
  listSummary: "{avg} von 5 Sternen im Durchschnitt aus {n} veröffentlichten Bewertungen",
  listSummaryOne: "{avg} von 5 Sternen aus einer veröffentlichten Bewertung",
  listEmpty: "Hier erscheinen Bewertungen, sobald Kundinnen und Kunden der Veröffentlichung zugestimmt haben.",
  ratingAria: "{n} von 5 Sternen",
  sourceGoogle: "über Google",
  sourceDirekt: "direkt an uns",
  replyLabel: "Antwort von Platzhirsch",
  listNotice:
    "So entstehen die Bewertungen: Wir zeigen direkte Rückmeldungen nur mit Einwilligung der Verfassenden und nach Freigabe durch uns, dazu Google-Bewertungen. Wir wählen nicht nach Sternen aus. Ausgeblendet wird nur bei Rechtsverletzung, Spam, fehlendem Kundenbezug oder Widerruf der Einwilligung. Ob ein Kauf stattfand, prüfen weder wir technisch noch Google.",
};

const en = {
  formTitle: "Your review sent directly to us",
  formIntro:
    "You can also review us directly here. Every response reaches the studio, regardless of the number of stars. It is only published if you expressly allow this below.",
  legendStars: "How satisfied were you overall?",
  starLabel: { 1: "1 of 5 stars", 2: "2 of 5 stars", 3: "3 of 5 stars", 4: "4 of 5 stars", 5: "5 of 5 stars" },
  starsHint: "Stars or text are enough.",
  labels: { text: "Your feedback", anlass: "What was it about?", name: "Your name", email: "Email for follow-up questions" },
  hints: {
    text: "Please do not include phone numbers or addresses; we remove contact details before publication.",
    name: "Only your first name and the first letter of your surname are published.",
    email: "Not published. Only in case we would like to ask about your feedback.",
  },
  anlassLeer: "Please choose (optional)",
  anlaesse: { lieferung: "Delivery", montage: "Assembly", abholung: "Collection", beratung: "Consultation", service: "Service", sonstiges: "Other" },
  optional: "optional",
  consentPublish:
    "Yes, you may publish my review (stars, text, occasion and shortened name) on this website. I can withdraw this consent at any time by email.",
  consentHint: "Without this tick, only we will read your feedback.",
  privacyVor: "How we handle your details is explained in our",
  privacyLink: "privacy policy",
  submit: "Send review",
  sending: "Sending …",
  done: {
    title: "Thank you for your feedback",
    text: "We have received your review.",
    textPublish: "We have received your review. It will appear here once we have approved it.",
    ref: "Reference: {ref}",
  },
  errors: {
    required: "Please choose stars or write a text.",
    choice: "Please choose an entry from the list.",
    long: "This text is too long.",
    email: "Please check the email address.",
    summaryOne: "Please check the highlighted field.",
    summary: "Please check the {n} highlighted fields.",
    rateLimited: "We are receiving a lot of requests right now. Please try again in a few minutes or call us: {phone}.",
    generic: "Unfortunately that did not work. Please try again later or write to us at {email}.",
  },
  listTitle: "Reviews from our customers",
  listSummary: "{avg} of 5 stars on average from {n} published reviews",
  listSummaryOne: "{avg} of 5 stars from one published review",
  listEmpty: "Reviews will appear here once customers have agreed to their publication.",
  ratingAria: "{n} of 5 stars",
  sourceGoogle: "via Google",
  sourceDirekt: "sent directly to us",
  replyLabel: "Reply from Platzhirsch",
  listNotice:
    "How these reviews come about: we show direct feedback only with the authors' consent and after our approval, plus Google reviews. We do not select by stars. Reviews are hidden only in the case of legal violations, spam, no customer relationship or withdrawn consent. Neither we nor Google technically check whether a purchase took place.",
};

const fr = {
  formTitle: "Votre avis directement à nous",
  formIntro:
    "Vous pouvez aussi nous évaluer directement ici. Chaque retour parvient au studio, quel que soit le nombre d'étoiles. Il n'est publié que si vous l'autorisez expressément ci-dessous.",
  legendStars: "Dans l'ensemble, dans quelle mesure étiez-vous satisfait(e) ?",
  starLabel: { 1: "1 étoile sur 5", 2: "2 étoiles sur 5", 3: "3 étoiles sur 5", 4: "4 étoiles sur 5", 5: "5 étoiles sur 5" },
  starsHint: "Des étoiles ou un texte suffisent.",
  labels: { text: "Votre retour", anlass: "De quoi s'agissait-il ?", name: "Votre nom", email: "E-mail pour d'éventuelles questions" },
  hints: {
    text: "Merci de ne pas indiquer de numéros de téléphone ni d'adresses ; nous supprimons les coordonnées avant toute publication.",
    name: "Seuls votre prénom et l'initiale de votre nom sont publiés.",
    email: "N'est pas publié. Uniquement si nous souhaitons vous poser une question sur votre retour.",
  },
  anlassLeer: "Veuillez choisir (facultatif)",
  anlaesse: { lieferung: "Livraison", montage: "Montage", abholung: "Retrait", beratung: "Conseil", service: "Service", sonstiges: "Autre" },
  optional: "facultatif",
  consentPublish:
    "Oui, vous pouvez publier mon avis (étoiles, texte, occasion et nom abrégé) sur ce site. Je peux retirer ce consentement à tout moment par e-mail.",
  consentHint: "Sans cette case cochée, seule notre équipe lit votre retour.",
  privacyVor: "La manière dont nous traitons vos données est décrite dans notre",
  privacyLink: "politique de confidentialité",
  submit: "Envoyer l'avis",
  sending: "Envoi en cours …",
  done: {
    title: "Merci pour votre retour",
    text: "Nous avons bien reçu votre avis.",
    textPublish: "Nous avons bien reçu votre avis. Il apparaîtra ici dès que nous l'aurons validé.",
    ref: "Référence : {ref}",
  },
  errors: {
    required: "Veuillez choisir des étoiles ou écrire un texte.",
    choice: "Veuillez choisir une entrée de la liste.",
    long: "Ce texte est trop long.",
    email: "Veuillez vérifier l'adresse e-mail.",
    summaryOne: "Veuillez vérifier le champ signalé.",
    summary: "Veuillez vérifier les {n} champs signalés.",
    rateLimited: "Nous recevons actuellement beaucoup de demandes. Veuillez réessayer dans quelques minutes ou nous appeler : {phone}.",
    generic: "Cela n'a malheureusement pas fonctionné. Veuillez réessayer plus tard ou nous écrire à {email}.",
  },
  listTitle: "Avis de nos clientes et clients",
  listSummary: "{avg} étoiles sur 5 en moyenne sur {n} avis publiés",
  listSummaryOne: "{avg} étoiles sur 5 sur un avis publié",
  listEmpty: "Les avis apparaîtront ici dès que des clientes et clients auront accepté leur publication.",
  ratingAria: "{n} étoiles sur 5",
  sourceGoogle: "via Google",
  sourceDirekt: "envoyé directement à nous",
  replyLabel: "Réponse de Platzhirsch",
  listNotice:
    "Origine des avis : nous publions les retours directs uniquement avec le consentement de leurs auteurs et après notre validation, ainsi que des avis Google. Nous ne faisons pas de sélection selon les étoiles. Un avis n'est masqué qu'en cas de violation de la loi, de spam, d'absence de lien avec un client ou de retrait du consentement. Ni nous ni Google ne vérifions techniquement si un achat a eu lieu.",
};

const it = {
  formTitle: "La sua recensione direttamente a noi",
  formIntro:
    "Può anche valutarci direttamente qui. Ogni riscontro arriva allo studio, indipendentemente dal numero di stelle. Viene pubblicato solo se lei lo autorizza espressamente qui sotto.",
  legendStars: "Quanto è rimasto soddisfatto/a nel complesso?",
  starLabel: { 1: "1 stella su 5", 2: "2 stelle su 5", 3: "3 stelle su 5", 4: "4 stelle su 5", 5: "5 stelle su 5" },
  starsHint: "Bastano le stelle o un testo.",
  labels: { text: "Il suo riscontro", anlass: "Di cosa si trattava?", name: "Il suo nome", email: "E-mail per eventuali domande" },
  hints: {
    text: "La preghiamo di non indicare numeri di telefono o indirizzi; rimuoviamo i dati di contatto prima di una pubblicazione.",
    name: "Vengono pubblicati solo il nome e l'iniziale del cognome.",
    email: "Non viene pubblicata. Solo nel caso in cui desiderassimo chiederle qualcosa sul suo riscontro.",
  },
  anlassLeer: "Scelga (facoltativo)",
  anlaesse: { lieferung: "Consegna", montage: "Montaggio", abholung: "Ritiro", beratung: "Consulenza", service: "Assistenza", sonstiges: "Altro" },
  optional: "facoltativo",
  consentPublish:
    "Sì, potete pubblicare la mia recensione (stelle, testo, occasione e nome abbreviato) su questo sito. Posso revocare questo consenso in qualsiasi momento via e-mail.",
  consentHint: "Senza questa spunta, il suo riscontro lo leggiamo solo noi.",
  privacyVor: "Come trattiamo i suoi dati è spiegato nella nostra",
  privacyLink: "informativa sulla privacy",
  submit: "Invia recensione",
  sending: "Invio in corso …",
  done: {
    title: "Grazie per il suo riscontro",
    text: "Abbiamo ricevuto la sua recensione.",
    textPublish: "Abbiamo ricevuto la sua recensione. Comparirà qui non appena l'avremo approvata.",
    ref: "Riferimento: {ref}",
  },
  errors: {
    required: "Scelga le stelle o scriva un testo.",
    choice: "Scelga una voce dall'elenco.",
    long: "Questo testo è troppo lungo.",
    email: "Verifichi l'indirizzo e-mail.",
    summaryOne: "Verifichi il campo evidenziato.",
    summary: "Verifichi i {n} campi evidenziati.",
    rateLimited: "Al momento riceviamo molte richieste. Riprovi tra qualche minuto o ci chiami: {phone}.",
    generic: "Purtroppo non ha funzionato. Riprovi più tardi o ci scriva a {email}.",
  },
  listTitle: "Recensioni delle nostre clienti e dei nostri clienti",
  listSummary: "{avg} stelle su 5 in media da {n} recensioni pubblicate",
  listSummaryOne: "{avg} stelle su 5 da una recensione pubblicata",
  listEmpty: "Le recensioni compariranno qui non appena clienti avranno acconsentito alla pubblicazione.",
  ratingAria: "{n} stelle su 5",
  sourceGoogle: "tramite Google",
  sourceDirekt: "inviata direttamente a noi",
  replyLabel: "Risposta di Platzhirsch",
  listNotice:
    "Come nascono le recensioni: mostriamo i riscontri diretti solo con il consenso di chi li ha scritti e dopo la nostra approvazione, oltre alle recensioni Google. Non selezioniamo in base alle stelle. Una recensione viene nascosta solo in caso di violazione di legge, spam, assenza di rapporto con un cliente o revoca del consenso. Né noi né Google verifichiamo tecnicamente se è avvenuto un acquisto.",
};

export const BEWERTUNG_COPY = Object.freeze({ de, en, fr, it });
export const bewertungCopy = (locale) => BEWERTUNG_COPY[locale] || BEWERTUNG_COPY.de;

/** Durchschnitt im Format der Sprache (4,6 / 4.6). */
export function formatAverage(avg, locale = "de") {
  if (typeof avg !== "number" || !Number.isFinite(avg)) return "";
  const tag = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" }[locale] || "de-AT";
  return new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(avg);
}
