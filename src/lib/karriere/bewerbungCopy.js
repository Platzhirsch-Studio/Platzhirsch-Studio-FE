// src/lib/karriere/bewerbungCopy.js – Texte des Bewerbungsformulars (DE/EN/FR/IT).
// Löschfrist sechs Monate nach Absage: Frist für Ansprüche nach § 15 GlBG
// (Gleichbehandlungsgesetz). {mb}, {ref}, {email}, {phone}, {n} füllt fill().

export const fill = (text, values = {}) => String(text || "").replace(/\{(\w+)\}/g, (m, k) => (values[k] != null ? String(values[k]) : m));

const DE = {
  title: "Online bewerben",
  intro: "Senden Sie uns Ihre Bewerbung direkt hier. Lebenslauf und Anschreiben laden Sie als PDF hoch.",
  labels: {
    vorname: "Vorname",
    nachname: "Nachname",
    email: "E-Mail",
    telefon: "Telefon",
    starttermin: "Frühester Starttermin",
    gehalt: "Gehaltsvorstellung",
    nachricht: "Nachricht an uns",
    lebenslauf: "Lebenslauf (PDF)",
    anschreiben: "Anschreiben (PDF)",
  },
  optional: "optional",
  hints: {
    datei: "Nur PDF, höchstens {mb} MB.",
    gehalt: "Zum Beispiel ein Bruttobetrag pro Monat.",
  },
  privacy:
    "Wir verwenden Ihre Angaben und Unterlagen nur für dieses Bewerbungsverfahren. Erhalten Sie eine Absage, löschen wir sie sechs Monate danach. So lange können Ansprüche nach § 15 Gleichbehandlungsgesetz (GlBG) geltend gemacht werden.",
  privacyVor: "Mehr dazu in der",
  privacyLink: "Datenschutzerklärung",
  consent: "Ich habe die Datenschutzinformation zur Bewerbung gelesen.",
  submit: "Bewerbung absenden",
  sending: "Wird gesendet …",
  errors: {
    required: "Bitte füllen Sie dieses Feld aus.",
    email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    phone: "Bitte geben Sie eine gültige Telefonnummer ein.",
    date: "Bitte geben Sie ein gültiges Datum ein.",
    past: "Bitte wählen Sie ein Datum ab heute.",
    long: "Dieser Text ist zu lang.",
    type: "Bitte laden Sie eine PDF-Datei hoch.",
    size: "Die Datei ist größer als {mb} MB.",
    fileRequired: "Bitte laden Sie Ihren Lebenslauf als PDF hoch.",
    consent: "Bitte bestätigen Sie die Datenschutzinformation.",
    summaryOne: "Bitte prüfen Sie 1 Feld.",
    summary: "Bitte prüfen Sie {n} Felder.",
    generic: "Die Bewerbung konnte gerade nicht gesendet werden. Bitte versuchen Sie es später noch einmal oder schicken Sie sie an {email}.",
    rateLimited: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.",
  },
  done: {
    title: "Danke, Ihre Bewerbung ist eingegangen.",
    text: "Wir sehen sie uns an und melden uns per E-Mail bei Ihnen.",
    ref: "Ihre Referenz: {ref}",
    partial: "Eine Unterlage konnte nicht übertragen werden. Bitte senden Sie sie an {email} und nennen Sie Ihre Referenz.",
  },
  orMail: "Lieber per E-Mail?",
};

const EN = {
  title: "Apply online",
  intro: "Send us your application right here. Upload your CV and cover letter as PDF files.",
  labels: {
    vorname: "First name",
    nachname: "Last name",
    email: "E-mail",
    telefon: "Phone",
    starttermin: "Earliest start date",
    gehalt: "Salary expectation",
    nachricht: "Message to us",
    lebenslauf: "CV (PDF)",
    anschreiben: "Cover letter (PDF)",
  },
  optional: "optional",
  hints: {
    datei: "PDF only, up to {mb} MB.",
    gehalt: "For example a gross amount per month.",
  },
  privacy:
    "We use your details and documents only for this application process. If you receive a rejection, we delete them six months later. Until then, claims under section 15 of the Austrian Equal Treatment Act (GlBG) can be asserted.",
  privacyVor: "More in the",
  privacyLink: "privacy policy",
  consent: "I have read the privacy information on applications.",
  submit: "Send application",
  sending: "Sending …",
  errors: {
    required: "Please fill in this field.",
    email: "Please enter a valid e-mail address.",
    phone: "Please enter a valid phone number.",
    date: "Please enter a valid date.",
    past: "Please choose a date from today.",
    long: "This text is too long.",
    type: "Please upload a PDF file.",
    size: "The file is larger than {mb} MB.",
    fileRequired: "Please upload your CV as a PDF file.",
    consent: "Please confirm the privacy information.",
    summaryOne: "Please check 1 field.",
    summary: "Please check {n} fields.",
    generic: "The application could not be sent right now. Please try again later or send it to {email}.",
    rateLimited: "Too many requests in a short time. Please try again in a few minutes.",
  },
  done: {
    title: "Thank you, we have received your application.",
    text: "We will look at it and get back to you by e-mail.",
    ref: "Your reference: {ref}",
    partial: "One document could not be transferred. Please send it to {email} and state your reference.",
  },
  orMail: "Prefer e-mail?",
};

const FR = {
  title: "Postuler en ligne",
  intro: "Envoyez-nous votre candidature directement ici. Téléchargez votre CV et votre lettre de motivation au format PDF.",
  labels: {
    vorname: "Prénom",
    nachname: "Nom",
    email: "E-mail",
    telefon: "Téléphone",
    starttermin: "Date de début au plus tôt",
    gehalt: "Prétentions salariales",
    nachricht: "Message",
    lebenslauf: "CV (PDF)",
    anschreiben: "Lettre de motivation (PDF)",
  },
  optional: "facultatif",
  hints: {
    datei: "PDF uniquement, {mb} Mo au maximum.",
    gehalt: "Par exemple un montant brut par mois.",
  },
  privacy:
    "Nous utilisons vos données et documents uniquement pour cette procédure de candidature. En cas de refus, nous les supprimons six mois plus tard. Jusque-là, des droits peuvent être invoqués au titre de l’article 15 de la loi autrichienne sur l’égalité de traitement (GlBG).",
  privacyVor: "Plus d’informations dans la",
  privacyLink: "politique de confidentialité",
  consent: "J’ai lu les informations sur la protection des données relatives à la candidature.",
  submit: "Envoyer la candidature",
  sending: "Envoi en cours …",
  errors: {
    required: "Veuillez remplir ce champ.",
    email: "Veuillez saisir une adresse e-mail valide.",
    phone: "Veuillez saisir un numéro de téléphone valide.",
    date: "Veuillez saisir une date valide.",
    past: "Veuillez choisir une date à partir d’aujourd’hui.",
    long: "Ce texte est trop long.",
    type: "Veuillez télécharger un fichier PDF.",
    size: "Le fichier dépasse {mb} Mo.",
    fileRequired: "Veuillez télécharger votre CV au format PDF.",
    consent: "Veuillez confirmer les informations sur la protection des données.",
    summaryOne: "Veuillez vérifier 1 champ.",
    summary: "Veuillez vérifier {n} champs.",
    generic: "La candidature n’a pas pu être envoyée pour le moment. Veuillez réessayer plus tard ou l’envoyer à {email}.",
    rateLimited: "Trop de demandes en peu de temps. Veuillez réessayer dans quelques minutes.",
  },
  done: {
    title: "Merci, nous avons bien reçu votre candidature.",
    text: "Nous l’examinons et revenons vers vous par e-mail.",
    ref: "Votre référence : {ref}",
    partial: "Un document n’a pas pu être transmis. Veuillez l’envoyer à {email} en indiquant votre référence.",
  },
  orMail: "Vous préférez l’e-mail ?",
};

const IT = {
  title: "Candidarsi online",
  intro: "Ci invii la sua candidatura direttamente qui. Carichi curriculum e lettera di presentazione in formato PDF.",
  labels: {
    vorname: "Nome",
    nachname: "Cognome",
    email: "E-mail",
    telefon: "Telefono",
    starttermin: "Data di inizio più vicina",
    gehalt: "Aspettative di retribuzione",
    nachricht: "Messaggio",
    lebenslauf: "Curriculum (PDF)",
    anschreiben: "Lettera di presentazione (PDF)",
  },
  optional: "facoltativo",
  hints: {
    datei: "Solo PDF, al massimo {mb} MB.",
    gehalt: "Per esempio un importo lordo mensile.",
  },
  privacy:
    "Utilizziamo i suoi dati e documenti solo per questa procedura di selezione. In caso di esito negativo li cancelliamo sei mesi dopo. Fino ad allora possono essere fatti valere diritti ai sensi del § 15 della legge austriaca sulla parità di trattamento (GlBG).",
  privacyVor: "Maggiori informazioni nell’",
  privacyLink: "informativa sulla privacy",
  consent: "Ho letto l’informativa sulla privacy relativa alla candidatura.",
  submit: "Inviare la candidatura",
  sending: "Invio in corso …",
  errors: {
    required: "Compili questo campo.",
    email: "Inserisca un indirizzo e-mail valido.",
    phone: "Inserisca un numero di telefono valido.",
    date: "Inserisca una data valida.",
    past: "Scelga una data a partire da oggi.",
    long: "Questo testo è troppo lungo.",
    type: "Carichi un file PDF.",
    size: "Il file supera {mb} MB.",
    fileRequired: "Carichi il suo curriculum in formato PDF.",
    consent: "Confermi l’informativa sulla privacy.",
    summaryOne: "Controlli 1 campo.",
    summary: "Controlli {n} campi.",
    generic: "Al momento non è stato possibile inviare la candidatura. Riprovi più tardi o la invii a {email}.",
    rateLimited: "Troppe richieste in poco tempo. Riprovi tra qualche minuto.",
  },
  done: {
    title: "Grazie, abbiamo ricevuto la sua candidatura.",
    text: "La esaminiamo e la ricontattiamo per e-mail.",
    ref: "Il suo riferimento: {ref}",
    partial: "Un documento non è stato trasmesso. Lo invii a {email} indicando il riferimento.",
  },
  orMail: "Preferisce l’e-mail?",
};

const COPY = { de: DE, en: EN, fr: FR, it: IT };

export function bewerbungCopy(locale) {
  return COPY[locale] || DE;
}
