// src/lib/service/linkAktionenCopy.js – Texte der Link-Seiten aus Mails:
// /newsletter/bestaetigen, /newsletter/abmelden (DE/EN/FR/IT) und
// /adventsabend/absagen (nur DE: der Adventsabend ist eine deutsche Seite,
// /en|fr|it/adventsabend antwortet 404, src/proxy.js FOREIGN_GATED_404).
// {phone} und {email} füllt fill(). Sie-Form, keine Superlative.

export const LINK_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

export const fill = (text, values = {}) => String(text || "").replace(/\{(\w+)\}/g, (m, k) => (values[k] != null ? String(values[k]) : m));

const DE = {
  common: {
    home: "Zur Startseite",
    contact: "Fragen: {phone} oder {email}",
    error: "Das ist gerade nicht möglich. Bitte versuchen Sie es später noch einmal oder rufen Sie uns an: {phone}.",
    rateLimited: "Zu viele Versuche in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.",
  },
  confirm: {
    metaTitle: "Newsletter bestätigen",
    eyebrow: "Newsletter",
    title: "Anmeldung bestätigen",
    lead: "Bitte bestätigen Sie mit einem Klick, dass Sie den Newsletter von Platzhirsch Home Living erhalten möchten.",
    button: "Anmeldung bestätigen",
    sending: "Wird bestätigt …",
    doneTitle: "Danke, Ihre Anmeldung ist bestätigt.",
    doneText: "Sie erhalten den Newsletter ab der nächsten Ausgabe. Jede Ausgabe enthält einen Link zum Abbestellen.",
    already: "Diese Anmeldung war bereits bestätigt.",
    missing: "In diesem Link fehlt der Bestätigungscode. Bitte öffnen Sie den Link aus der Mail noch einmal vollständig.",
    invalid: "Dieser Bestätigungslink ist ungültig. Vielleicht wurde er schon verwendet oder nicht vollständig kopiert.",
    expired: "Dieser Bestätigungslink ist abgelaufen. Bitte melden Sie sich noch einmal an, Sie erhalten dann einen neuen Link.",
    notAvailable: "Eine Bestätigung ist gerade nicht möglich. Bitte schreiben Sie uns kurz an {email}.",
    again: "Erneut anmelden",
  },
  unsubscribe: {
    metaTitle: "Newsletter abbestellen",
    eyebrow: "Newsletter",
    title: "Newsletter abbestellen",
    lead: "Möchten Sie keine Newsletter mehr von Platzhirsch Home Living erhalten? Ein Klick genügt.",
    button: "Newsletter abbestellen",
    sending: "Wird abgemeldet …",
    emailLead: "Geben Sie die Adresse ein, unter der Sie den Newsletter erhalten. Wir tragen sie aus dem Verteiler aus.",
    emailLabel: "E-Mail-Adresse",
    emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    emailButton: "Abbestellen",
    doneTitle: "Sie sind abgemeldet.",
    doneText: "Sie erhalten keine Newsletter mehr von uns.",
    already: "Diese Adresse erhält bereits keine Newsletter mehr.",
    doneEmail: "Wenn diese Adresse in unserem Verteiler stand, ist sie jetzt ausgetragen.",
    vorgemerkt: "Wir haben Ihre Abmeldung erhalten und tragen Sie aus dem Verteiler aus.",
    invalid: "Dieser Abmeldelink ist ungültig. Sie können sich unten auch mit Ihrer E-Mail-Adresse abmelden.",
  },
  event: {
    metaTitle: "Anmeldung absagen",
    eyebrow: "Adventsabend",
    title: "Anmeldung absagen",
    lead: "Können Sie nicht kommen? Mit einem Klick sagen Sie Ihre Anmeldung ab, damit wir den Platz weitergeben können.",
    button: "Anmeldung absagen",
    sending: "Wird abgesagt …",
    doneTitle: "Ihre Anmeldung ist abgesagt.",
    doneText: "Danke, dass Sie Bescheid geben. Sie können sich jederzeit wieder anmelden, solange Plätze frei sind.",
    already: "Diese Anmeldung war bereits abgesagt.",
    vorgemerkt: "Wir haben Ihre Absage erhalten und tragen sie ein.",
    missing: "In diesem Link fehlt der Absagecode. Bitte öffnen Sie den Link aus der Mail noch einmal vollständig.",
    invalid: "Dieser Absagelink ist ungültig. Bitte rufen Sie uns kurz an: {phone}.",
    back: "Zum Adventsabend",
  },
};

const EN = {
  common: {
    home: "To the home page",
    contact: "Questions: {phone} or {email}",
    error: "This is not possible right now. Please try again later or call us: {phone}.",
    rateLimited: "Too many attempts in a short time. Please try again in a few minutes.",
  },
  confirm: {
    metaTitle: "Confirm newsletter",
    eyebrow: "Newsletter",
    title: "Confirm your sign-up",
    lead: "Please confirm with one click that you would like to receive the Platzhirsch Home Living newsletter.",
    button: "Confirm sign-up",
    sending: "Confirming …",
    doneTitle: "Thank you, your sign-up is confirmed.",
    doneText: "You will receive the newsletter from the next issue. Every issue contains a link to unsubscribe.",
    already: "This sign-up had already been confirmed.",
    missing: "The confirmation code is missing from this link. Please open the complete link from the e-mail again.",
    invalid: "This confirmation link is not valid. It may already have been used or was not copied completely.",
    expired: "This confirmation link has expired. Please sign up again and you will receive a new link.",
    notAvailable: "Confirmation is not possible right now. Please send us a short note to {email}.",
    again: "Sign up again",
  },
  unsubscribe: {
    metaTitle: "Unsubscribe from newsletter",
    eyebrow: "Newsletter",
    title: "Unsubscribe from the newsletter",
    lead: "Would you rather not receive newsletters from Platzhirsch Home Living? One click is enough.",
    button: "Unsubscribe",
    sending: "Unsubscribing …",
    emailLead: "Enter the address at which you receive the newsletter. We will remove it from the mailing list.",
    emailLabel: "E-mail address",
    emailInvalid: "Please enter a valid e-mail address.",
    emailButton: "Unsubscribe",
    doneTitle: "You are unsubscribed.",
    doneText: "You will no longer receive newsletters from us.",
    already: "This address no longer receives newsletters.",
    doneEmail: "If this address was on our mailing list, it has now been removed.",
    vorgemerkt: "We have received your request and will remove you from the mailing list.",
    invalid: "This unsubscribe link is not valid. You can also unsubscribe below with your e-mail address.",
  },
};

const FR = {
  common: {
    home: "Vers la page d’accueil",
    contact: "Questions : {phone} ou {email}",
    error: "Ce n’est pas possible pour le moment. Veuillez réessayer plus tard ou nous appeler : {phone}.",
    rateLimited: "Trop de tentatives en peu de temps. Veuillez réessayer dans quelques minutes.",
  },
  confirm: {
    metaTitle: "Confirmer la newsletter",
    eyebrow: "Newsletter",
    title: "Confirmer votre inscription",
    lead: "Veuillez confirmer d’un clic que vous souhaitez recevoir la newsletter de Platzhirsch Home Living.",
    button: "Confirmer l’inscription",
    sending: "Confirmation en cours …",
    doneTitle: "Merci, votre inscription est confirmée.",
    doneText: "Vous recevrez la newsletter à partir du prochain numéro. Chaque numéro contient un lien de désinscription.",
    already: "Cette inscription était déjà confirmée.",
    missing: "Le code de confirmation manque dans ce lien. Veuillez ouvrir à nouveau le lien complet de l’e-mail.",
    invalid: "Ce lien de confirmation n’est pas valide. Il a peut-être déjà été utilisé ou n’a pas été copié en entier.",
    expired: "Ce lien de confirmation a expiré. Veuillez vous inscrire à nouveau, vous recevrez alors un nouveau lien.",
    notAvailable: "La confirmation n’est pas possible pour le moment. Veuillez nous écrire brièvement à {email}.",
    again: "S’inscrire à nouveau",
  },
  unsubscribe: {
    metaTitle: "Se désabonner de la newsletter",
    eyebrow: "Newsletter",
    title: "Se désabonner de la newsletter",
    lead: "Vous ne souhaitez plus recevoir la newsletter de Platzhirsch Home Living ? Un clic suffit.",
    button: "Se désabonner",
    sending: "Désinscription en cours …",
    emailLead: "Saisissez l’adresse à laquelle vous recevez la newsletter. Nous la retirerons de la liste de diffusion.",
    emailLabel: "Adresse e-mail",
    emailInvalid: "Veuillez saisir une adresse e-mail valide.",
    emailButton: "Se désabonner",
    doneTitle: "Vous êtes désabonné(e).",
    doneText: "Vous ne recevrez plus de newsletter de notre part.",
    already: "Cette adresse ne reçoit déjà plus de newsletter.",
    doneEmail: "Si cette adresse figurait sur notre liste de diffusion, elle en a été retirée.",
    vorgemerkt: "Nous avons bien reçu votre demande et vous retirerons de la liste de diffusion.",
    invalid: "Ce lien de désinscription n’est pas valide. Vous pouvez aussi vous désabonner ci-dessous avec votre adresse e-mail.",
  },
};

const IT = {
  common: {
    home: "Alla pagina iniziale",
    contact: "Domande: {phone} o {email}",
    error: "Al momento non è possibile. La preghiamo di riprovare più tardi o di chiamarci: {phone}.",
    rateLimited: "Troppi tentativi in poco tempo. Riprovi tra qualche minuto.",
  },
  confirm: {
    metaTitle: "Confermare la newsletter",
    eyebrow: "Newsletter",
    title: "Confermi l’iscrizione",
    lead: "La preghiamo di confermare con un clic che desidera ricevere la newsletter di Platzhirsch Home Living.",
    button: "Confermare l’iscrizione",
    sending: "Conferma in corso …",
    doneTitle: "Grazie, la sua iscrizione è confermata.",
    doneText: "Riceverà la newsletter a partire dal prossimo numero. Ogni numero contiene un link per annullare l’iscrizione.",
    already: "Questa iscrizione era già confermata.",
    missing: "In questo link manca il codice di conferma. Apra di nuovo il link completo dell’e-mail.",
    invalid: "Questo link di conferma non è valido. Forse è già stato usato o non è stato copiato per intero.",
    expired: "Questo link di conferma è scaduto. Si iscriva di nuovo e riceverà un nuovo link.",
    notAvailable: "Al momento la conferma non è possibile. Ci scriva brevemente a {email}.",
    again: "Iscriversi di nuovo",
  },
  unsubscribe: {
    metaTitle: "Annullare la newsletter",
    eyebrow: "Newsletter",
    title: "Annullare l’iscrizione alla newsletter",
    lead: "Non desidera più ricevere la newsletter di Platzhirsch Home Living? Basta un clic.",
    button: "Annullare l’iscrizione",
    sending: "Annullamento in corso …",
    emailLead: "Inserisca l’indirizzo con cui riceve la newsletter. Lo toglieremo dalla lista di distribuzione.",
    emailLabel: "Indirizzo e-mail",
    emailInvalid: "Inserisca un indirizzo e-mail valido.",
    emailButton: "Annullare",
    doneTitle: "L’iscrizione è annullata.",
    doneText: "Non riceverà più newsletter da parte nostra.",
    already: "Questo indirizzo non riceve già più newsletter.",
    doneEmail: "Se questo indirizzo era nella nostra lista di distribuzione, ora è stato tolto.",
    vorgemerkt: "Abbiamo ricevuto la sua richiesta e la toglieremo dalla lista di distribuzione.",
    invalid: "Questo link non è valido. Può annullare l’iscrizione anche qui sotto con il suo indirizzo e-mail.",
  },
};

const COPY = { de: DE, en: EN, fr: FR, it: IT };

/** Texte einer Sprache (Fallback Deutsch). Das Event gibt es nur auf Deutsch. */
export function linkCopy(locale) {
  const c = COPY[locale] || DE;
  return { ...c, event: DE.event, locale: COPY[locale] ? locale : "de" };
}
