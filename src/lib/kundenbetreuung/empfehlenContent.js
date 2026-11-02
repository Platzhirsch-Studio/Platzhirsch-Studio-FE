// src/lib/kundenbetreuung/empfehlenContent.js
// Texte der Seite /[locale]/empfehlen (DE/EN/FR/IT), eigene Content-Datei des
// Teams Kundenbetreuung (Welle 2). Die kurzen Navigations-/Footer-Labels für
// die Integration stehen in Marktresearch/digital/features/
// welle2-kundenbetreuung-messages.json.
//
// Stimme (Design-Bibel §1): Sie-Form, kurze Sätze, keine Superlative, kein
// Ausrufezeichen. Keine Beträge, solange der Inhaber keinen Gutscheinwert
// festgelegt hat ({value} erscheint nur mit REFERRAL.voucherValue).
// Platzhalter: {value} (Gutscheinwert), {link} (Teilen-Link).

const de = {
  meta: {
    title: "Empfehlen Sie uns weiter",
    description:
      "Das Empfehlungsprogramm von Platzhirsch Home Living in Lochau: Sie geben Ihren persönlichen Code weiter. Wird daraus ein Auftrag, bedanken wir uns mit einem Gutschein.",
  },
  breadcrumb: "Empfehlen",
  overline: "Unter Freunden",
  title: "Empfehlen Sie uns weiter",
  lead: "Wer gut wohnt, erzählt davon. Wenn Sie Platzhirsch jemandem empfehlen und daraus ein Auftrag wird, bedanken wir uns bei Ihnen mit einem Gutschein.",
  leadValue: "Wenn Sie Platzhirsch jemandem empfehlen und daraus ein Auftrag wird, bedanken wir uns bei Ihnen mit einem Gutschein über {value}.",
  draftNote: {
    title: "Vorschau im Entwicklungsserver",
    text: "Die Teilnahmebedingungen sind ein Entwurf für die Kanzlei. Öffentlich wird die Seite erst mit der Freigabe.",
  },
  stepsTitle: "So funktioniert es",
  steps: [
    {
      title: "Code anfordern",
      text: "Als Kundin oder Kunde bekommen Sie von uns einen persönlichen Code und einen Link. Sie können ihn unten anfordern.",
    },
    {
      title: "Selbst weitergeben",
      text: "Sie geben Code oder Link an Menschen weiter, denen Sie unsere Arbeit gönnen. Wir schreiben niemanden an, den Sie uns nennen.",
    },
    {
      title: "Kennenlernen",
      text: "Ihre Bekannten melden sich selbst bei uns, im Showroom mit Café in Lochau oder für einen Termin vor Ort. Harald Menghin zeichnet das Konzept zuerst von Hand.",
    },
    {
      title: "Danke sagen",
      text: "Nach dem ersten Auftrag der empfohlenen Person erhalten Sie einen Gutschein. Er gilt für Einrichtung, Leuchten und Ausstellungsstücke im Showroom.",
    },
  ],
  fairTitle: "Fair für alle",
  fair: [
    "Der Gutschein hängt nicht an einer Bewertung. Ob Sie uns bewerten, ist Ihre Sache.",
    "Es zählt ein Auftrag, kein bloßer Kontakt.",
    "Ihre Bekannten entscheiden selbst, ob wir wissen dürfen, wer sie empfohlen hat.",
    "Über den Auftrag selbst erfahren Sie von uns nichts, nur dass es ihn gibt.",
  ],
  termsDraft: "Die Teilnahmebedingungen werden gerade abgestimmt. Wir senden sie Ihnen mit Ihrem Code.",
  termsReleased: "Es gelten die Teilnahmebedingungen, die wir Ihnen mit Ihrem Code senden (Stand {stand}).",
  empfohlen: {
    overline: "Sie wurden empfohlen",
    title: "Schön, dass Sie da sind",
    text: "Jemand, der bei uns eingerichtet hat, hat Ihnen Platzhirsch empfohlen. Erzählen Sie uns kurz, worum es geht. Wir melden uns persönlich.",
    textNoCode: "Sie haben einen Empfehlungscode? Tragen Sie ihn hier ein. Wir melden uns persönlich.",
  },
  empfehler: {
    overline: "Sie sind Kundin oder Kunde",
    title: "Ihren persönlichen Code anfordern",
    text: "Wir prüfen kurz Ihren Auftrag und senden Ihnen Code, Link und die Teilnahmebedingungen per E-Mail.",
  },
  share: {
    title: "Code schon zur Hand?",
    text: "Tragen Sie ihn ein. Dann bekommen Sie Ihren Link zum Weitergeben.",
    codeLabel: "Ihr Empfehlungscode",
    codeHint: "Zum Beispiel EMP-7K3M9Q",
    make: "Link erzeugen",
    invalid: "Bitte prüfen Sie den Code. Er beginnt mit EMP und hat danach sechs Zeichen.",
    linkLabel: "Ihr Link",
    copy: "Link kopieren",
    copied: "Link kopiert.",
    copyFailed: "Kopieren ging nicht. Bitte markieren Sie den Link und kopieren Sie ihn selbst.",
    shareNative: "Teilen …",
    mail: "Aus Ihrem Postfach senden",
    mailSubject: "Eine Empfehlung: Platzhirsch Home Living in Lochau",
    shareText:
      // QA Welle 2 P1-3: kein vorformuliertes Urteil; die Belohnung steht offen dabei (§ 2 Abs. 4 UWG, § 6 ECG).
      "Hier ist der Link zu Platzhirsch Home Living in Lochau: {link}\n\n(Für eine erfolgreiche Empfehlung erhalte ich einen Gutschein.)",
    note: "Sie senden selbst und schreiben in eigenen Worten dazu, was Sie möchten. Der Hinweis auf den Gutschein bleibt bitte stehen. Platzhirsch erfährt nicht, an wen Sie senden.",
  },
  form: {
    required: "Felder mit * brauchen wir für Ihre Anfrage.",
    name: "Name",
    email: "E-Mail",
    telefon: "Telefon",
    optional: "(optional)",
    kundennummer: "Kunden- oder Auftragsnummer",
    kundennummerHint: "Falls zur Hand. Sonst finden wir Sie über Name und E-Mail.",
    nachricht: "Nachricht",
    anliegen: "Worum geht es?",
    anliegenHint: "Zum Beispiel: Wohnzimmer neu einrichten, Küche planen, Terrasse am See.",
    code: "Empfehlungscode",
    codeHint: "Steht im Link oder auf der Karte, zum Beispiel EMP-7K3M9Q.",
    consent:
      "Ich bin einverstanden, dass Platzhirsch meine Anfrage diesem Code zuordnet und der empfehlenden Person nach meinem ersten Auftrag mitteilt, dass sie sich einen Gutschein verdient hat. Details zu meinem Auftrag erfährt sie nicht.",
    consentHint: "Freiwillig. Ohne Häkchen senden wir den Code nicht mit, Ihre Anfrage kommt trotzdem an.",
    submitEmpfehler: "Code anfordern",
    submitEmpfohlen: "Anfrage senden",
    sending: "Wird gesendet …",
    summaryTitle: "Bitte prüfen Sie Ihre Angaben",
    errName: "Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen).",
    errEmail: "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.",
    errTelefon: "Bitte prüfen Sie die Telefonnummer (6 bis 20 Ziffern).",
    errAnliegen: "Bitte beschreiben Sie Ihr Anliegen in ein paar Worten (mindestens 10 Zeichen).",
    errCode: "Bitte prüfen Sie den Code. Er beginnt mit EMP und hat danach sechs Zeichen.",
    errField: "Bitte prüfen Sie diese Angabe.",
    successTitle: "Angekommen",
    successEmpfehler: "Danke, {name}. Wir prüfen Ihren Auftrag und senden Ihnen Code und Link per E-Mail.",
    successEmpfohlen: "Danke, {name}. Ihre Anfrage ist bei uns. Wir melden uns persönlich bei Ihnen.",
    again: "Neue Anfrage",
  },
};

const en = {
  meta: {
    title: "Recommend us",
    description:
      "The Platzhirsch Home Living referral programme in Lochau: pass on your personal code. If it leads to an order, we thank you with a gift voucher.",
  },
  breadcrumb: "Recommend",
  overline: "Among friends",
  title: "Recommend us",
  lead: "People who live well talk about it. If you recommend Platzhirsch to someone and it leads to an order, we thank you with a gift voucher.",
  leadValue: "If you recommend Platzhirsch to someone and it leads to an order, we thank you with a gift voucher worth {value}.",
  draftNote: {
    title: "Preview on the development server",
    text: "The programme terms are a draft for our lawyers. The page goes public once they are approved.",
  },
  stepsTitle: "How it works",
  steps: [
    { title: "Request your code", text: "As a customer you receive a personal code and link from us. You can request it below." },
    {
      title: "Pass it on yourself",
      text: "You share the code or link with people you think would enjoy working with us. We never write to anyone you name.",
    },
    {
      title: "Getting to know us",
      text: "Your friends contact us themselves, at the showroom with café in Lochau or for a visit on site. Harald Menghin first draws the concept by hand.",
    },
    {
      title: "Our thanks",
      text: "After the first order of the person you recommended, you receive a gift voucher for furniture, lighting and showroom pieces.",
    },
  ],
  fairTitle: "Fair for everyone",
  fair: [
    "The voucher is never tied to a review. Whether you review us is up to you.",
    "What counts is an order, not a mere contact.",
    "Your friends decide themselves whether we may know who recommended them.",
    "We do not tell you anything about the order itself, only that it exists.",
  ],
  termsDraft: "The programme terms are being finalised. We send them to you with your code.",
  termsReleased: "The programme terms we send with your code apply (version of {stand}).",
  empfohlen: {
    overline: "You were recommended",
    title: "Good to have you here",
    text: "Someone who furnished their home with us recommended Platzhirsch to you. Tell us briefly what you have in mind. We will reply personally.",
    textNoCode: "Do you have a referral code? Enter it here. We will reply personally.",
  },
  empfehler: {
    overline: "You are a customer",
    title: "Request your personal code",
    text: "We briefly check your order and e-mail you your code, your link and the programme terms.",
  },
  share: {
    title: "Already have your code?",
    text: "Enter it to get your link for sharing.",
    codeLabel: "Your referral code",
    codeHint: "For example EMP-7K3M9Q",
    make: "Create link",
    invalid: "Please check the code. It starts with EMP followed by six characters.",
    linkLabel: "Your link",
    copy: "Copy link",
    copied: "Link copied.",
    copyFailed: "Copying did not work. Please select the link and copy it yourself.",
    shareNative: "Share …",
    mail: "Send from your own mailbox",
    mailSubject: "A recommendation: Platzhirsch Home Living in Lochau",
    shareText:
      "Here is the link to Platzhirsch Home Living in Lochau: {link}\n\n(I receive a voucher for a successful recommendation.)",
    note: "You send it yourself and add whatever you want to say in your own words. Please keep the note about the voucher. Platzhirsch does not learn to whom you send it.",
  },
  form: {
    required: "We need the fields marked * for your request.",
    name: "Name",
    email: "E-mail",
    telefon: "Phone",
    optional: "(optional)",
    kundennummer: "Customer or order number",
    kundennummerHint: "If you have it at hand. Otherwise we find you by name and e-mail.",
    nachricht: "Message",
    anliegen: "What is it about?",
    anliegenHint: "For example: refurnishing a living room, planning a kitchen, a terrace by the lake.",
    code: "Referral code",
    codeHint: "It is in the link or on the card, for example EMP-7K3M9Q.",
    consent:
      "I agree that Platzhirsch links my request to this code and, after my first order, tells the person who recommended me that they have earned a voucher. They will not learn any details of my order.",
    consentHint: "Voluntary. Without the tick we do not send the code; your request still reaches us.",
    submitEmpfehler: "Request code",
    submitEmpfohlen: "Send request",
    sending: "Sending …",
    summaryTitle: "Please check your details",
    errName: "Please enter your name (at least 2 characters).",
    errEmail: "Please check the e-mail address, for example name@example.com.",
    errTelefon: "Please check the phone number (6 to 20 digits).",
    errAnliegen: "Please describe your request in a few words (at least 10 characters).",
    errCode: "Please check the code. It starts with EMP followed by six characters.",
    errField: "Please check this entry.",
    successTitle: "Received",
    successEmpfehler: "Thank you, {name}. We will check your order and e-mail you your code and link.",
    successEmpfohlen: "Thank you, {name}. Your request has reached us. We will get back to you personally.",
    again: "New request",
  },
};

const fr = {
  meta: {
    title: "Recommandez-nous",
    description:
      "Le programme de recommandation de Platzhirsch Home Living à Lochau : transmettez votre code personnel. S’il aboutit à une commande, nous vous remercions par un bon d’achat.",
  },
  breadcrumb: "Recommander",
  overline: "Entre amis",
  title: "Recommandez-nous",
  lead: "Quand on est bien chez soi, on en parle. Si vous recommandez Platzhirsch et que cela aboutit à une commande, nous vous remercions par un bon d’achat.",
  leadValue: "Si vous recommandez Platzhirsch et que cela aboutit à une commande, nous vous remercions par un bon d’achat de {value}.",
  draftNote: {
    title: "Aperçu sur le serveur de développement",
    text: "Les conditions de participation sont un projet soumis à notre cabinet d’avocats. La page sera publiée après leur validation.",
  },
  stepsTitle: "Comment cela fonctionne",
  steps: [
    { title: "Demander votre code", text: "En tant que client, vous recevez de notre part un code et un lien personnels. Vous pouvez les demander ci-dessous." },
    {
      title: "Le transmettre vous-même",
      text: "Vous transmettez le code ou le lien aux personnes à qui vous souhaitez faire découvrir notre travail. Nous n’écrivons jamais aux personnes que vous nous citez.",
    },
    {
      title: "Faire connaissance",
      text: "Vos proches nous contactent eux-mêmes, au showroom avec café à Lochau ou pour un rendez-vous sur place. Harald Menghin dessine d’abord le concept à la main.",
    },
    {
      title: "Vous remercier",
      text: "Après la première commande de la personne recommandée, vous recevez un bon d’achat valable pour le mobilier, les luminaires et les pièces d’exposition.",
    },
  ],
  fairTitle: "Équitable pour tous",
  fair: [
    "Le bon d’achat ne dépend jamais d’un avis. Laisser un avis reste votre choix.",
    "Seule une commande compte, pas un simple contact.",
    "Vos proches décident eux-mêmes si nous pouvons savoir qui les a recommandés.",
    "Nous ne vous communiquons rien sur la commande elle-même, seulement qu’elle existe.",
  ],
  termsDraft: "Les conditions de participation sont en cours de finalisation. Nous vous les envoyons avec votre code.",
  termsReleased: "Les conditions de participation envoyées avec votre code s’appliquent (version du {stand}).",
  empfohlen: {
    overline: "On vous a recommandé",
    title: "Bienvenue",
    text: "Une personne qui a aménagé son intérieur avec nous vous a recommandé Platzhirsch. Dites-nous en quelques mots ce que vous envisagez. Nous vous répondons personnellement.",
    textNoCode: "Vous avez un code de recommandation ? Saisissez-le ici. Nous vous répondons personnellement.",
  },
  empfehler: {
    overline: "Vous êtes client",
    title: "Demander votre code personnel",
    text: "Nous vérifions brièvement votre commande et vous envoyons par e-mail votre code, votre lien et les conditions de participation.",
  },
  share: {
    title: "Vous avez déjà votre code ?",
    text: "Saisissez-le pour obtenir votre lien à partager.",
    codeLabel: "Votre code de recommandation",
    codeHint: "Par exemple EMP-7K3M9Q",
    make: "Créer le lien",
    invalid: "Veuillez vérifier le code. Il commence par EMP suivi de six caractères.",
    linkLabel: "Votre lien",
    copy: "Copier le lien",
    copied: "Lien copié.",
    copyFailed: "La copie n’a pas fonctionné. Veuillez sélectionner le lien et le copier vous-même.",
    shareNative: "Partager …",
    mail: "Envoyer depuis votre messagerie",
    mailSubject: "Une recommandation : Platzhirsch Home Living à Lochau",
    shareText:
      "Voici le lien vers Platzhirsch Home Living à Lochau : {link}\n\n(Je reçois un bon d’achat pour une recommandation réussie.)",
    note: "C’est vous qui envoyez et ajoutez vos propres mots si vous le souhaitez. Merci de laisser la mention du bon d’achat. Platzhirsch ne sait pas à qui vous envoyez.",
  },
  form: {
    required: "Les champs marqués * sont nécessaires à votre demande.",
    name: "Nom",
    email: "E-mail",
    telefon: "Téléphone",
    optional: "(facultatif)",
    kundennummer: "Numéro de client ou de commande",
    kundennummerHint: "Si vous l’avez sous la main. Sinon, nous vous retrouvons grâce à votre nom et votre e-mail.",
    nachricht: "Message",
    anliegen: "De quoi s’agit-il ?",
    anliegenHint: "Par exemple : réaménager un salon, planifier une cuisine, une terrasse au bord du lac.",
    code: "Code de recommandation",
    codeHint: "Il figure dans le lien ou sur la carte, par exemple EMP-7K3M9Q.",
    consent:
      "J’accepte que Platzhirsch associe ma demande à ce code et, après ma première commande, informe la personne qui m’a recommandé qu’elle a gagné un bon d’achat. Elle n’apprendra aucun détail de ma commande.",
    consentHint: "Facultatif. Sans la case cochée, nous n’envoyons pas le code ; votre demande nous parvient quand même.",
    submitEmpfehler: "Demander le code",
    submitEmpfohlen: "Envoyer la demande",
    sending: "Envoi en cours …",
    summaryTitle: "Veuillez vérifier vos informations",
    errName: "Veuillez indiquer votre nom (au moins 2 caractères).",
    errEmail: "Veuillez vérifier l’adresse e-mail, par exemple nom@exemple.fr.",
    errTelefon: "Veuillez vérifier le numéro de téléphone (6 à 20 chiffres).",
    errAnliegen: "Veuillez décrire votre demande en quelques mots (au moins 10 caractères).",
    errCode: "Veuillez vérifier le code. Il commence par EMP suivi de six caractères.",
    errField: "Veuillez vérifier cette information.",
    successTitle: "Bien reçu",
    successEmpfehler: "Merci, {name}. Nous vérifions votre commande et vous envoyons votre code et votre lien par e-mail.",
    successEmpfohlen: "Merci, {name}. Votre demande nous est parvenue. Nous vous répondons personnellement.",
    again: "Nouvelle demande",
  },
};

const it = {
  meta: {
    title: "Consigliateci",
    description:
      "Il programma di passaparola di Platzhirsch Home Living a Lochau: condividete il vostro codice personale. Se ne nasce un ordine, vi ringraziamo con un buono.",
  },
  breadcrumb: "Consigliare",
  overline: "Tra amici",
  title: "Consigliateci",
  lead: "Chi abita bene ne parla. Se consigliate Platzhirsch a qualcuno e ne nasce un ordine, vi ringraziamo con un buono.",
  leadValue: "Se consigliate Platzhirsch a qualcuno e ne nasce un ordine, vi ringraziamo con un buono da {value}.",
  draftNote: {
    title: "Anteprima sul server di sviluppo",
    text: "Le condizioni di partecipazione sono una bozza per il nostro studio legale. La pagina sarà pubblica dopo l’approvazione.",
  },
  stepsTitle: "Come funziona",
  steps: [
    { title: "Richiedere il codice", text: "Come clienti ricevete da noi un codice e un link personali. Potete richiederli qui sotto." },
    {
      title: "Condividerlo voi stessi",
      text: "Date il codice o il link alle persone a cui volete far conoscere il nostro lavoro. Non scriviamo mai alle persone che ci indicate.",
    },
    {
      title: "Conoscersi",
      text: "I vostri conoscenti ci contattano direttamente, nello showroom con caffè a Lochau o per un appuntamento sul posto. Harald Menghin disegna prima il progetto a mano.",
    },
    {
      title: "Il nostro grazie",
      text: "Dopo il primo ordine della persona consigliata ricevete un buono valido per arredamento, lampade e pezzi da esposizione.",
    },
  ],
  fairTitle: "Corretto per tutti",
  fair: [
    "Il buono non dipende mai da una recensione. Lasciarne una è una vostra scelta.",
    "Conta un ordine, non un semplice contatto.",
    "I vostri conoscenti decidono se possiamo sapere chi li ha consigliati.",
    "Non vi comunichiamo nulla sull’ordine stesso, solo che esiste.",
  ],
  termsDraft: "Le condizioni di partecipazione sono in fase di definizione. Ve le inviamo insieme al codice.",
  termsReleased: "Valgono le condizioni di partecipazione inviate con il codice (versione del {stand}).",
  empfohlen: {
    overline: "Vi hanno consigliato",
    title: "Benvenuti",
    text: "Una persona che ha arredato casa con noi vi ha consigliato Platzhirsch. Raccontateci in breve di cosa si tratta. Vi rispondiamo personalmente.",
    textNoCode: "Avete un codice di passaparola? Inseritelo qui. Vi rispondiamo personalmente.",
  },
  empfehler: {
    overline: "Siete nostri clienti",
    title: "Richiedere il codice personale",
    text: "Verifichiamo brevemente il vostro ordine e vi inviamo per e-mail codice, link e condizioni di partecipazione.",
  },
  share: {
    title: "Avete già il codice?",
    text: "Inseritelo per ottenere il link da condividere.",
    codeLabel: "Il vostro codice",
    codeHint: "Per esempio EMP-7K3M9Q",
    make: "Crea link",
    invalid: "Controllate il codice. Inizia con EMP seguito da sei caratteri.",
    linkLabel: "Il vostro link",
    copy: "Copia link",
    copied: "Link copiato.",
    copyFailed: "La copia non è riuscita. Selezionate il link e copiatelo voi.",
    shareNative: "Condividi …",
    mail: "Invia dalla vostra casella",
    mailSubject: "Un consiglio: Platzhirsch Home Living a Lochau",
    shareText:
      "Ecco il link a Platzhirsch Home Living a Lochau: {link}\n\n(Per una segnalazione andata a buon fine ricevo un buono.)",
    note: "Inviate voi e aggiungete con parole vostre ciò che desiderate. Vi preghiamo di lasciare l’indicazione del buono. Platzhirsch non sa a chi inviate.",
  },
  form: {
    required: "I campi con * ci servono per la richiesta.",
    name: "Nome",
    email: "E-mail",
    telefon: "Telefono",
    optional: "(facoltativo)",
    kundennummer: "Numero cliente o d’ordine",
    kundennummerHint: "Se lo avete a portata di mano. Altrimenti vi troviamo tramite nome ed e-mail.",
    nachricht: "Messaggio",
    anliegen: "Di cosa si tratta?",
    anliegenHint: "Per esempio: arredare di nuovo il soggiorno, progettare una cucina, una terrazza sul lago.",
    code: "Codice di passaparola",
    codeHint: "Si trova nel link o sulla cartolina, per esempio EMP-7K3M9Q.",
    consent:
      "Acconsento che Platzhirsch associ la mia richiesta a questo codice e, dopo il mio primo ordine, comunichi alla persona che mi ha consigliato che ha ottenuto un buono. Non saprà nulla dei dettagli del mio ordine.",
    consentHint: "Facoltativo. Senza la spunta non inviamo il codice; la vostra richiesta ci arriva comunque.",
    submitEmpfehler: "Richiedi codice",
    submitEmpfohlen: "Invia richiesta",
    sending: "Invio in corso …",
    summaryTitle: "Controllate i vostri dati",
    errName: "Indicate il vostro nome (almeno 2 caratteri).",
    errEmail: "Controllate l’indirizzo e-mail, per esempio nome@esempio.it.",
    errTelefon: "Controllate il numero di telefono (da 6 a 20 cifre).",
    errAnliegen: "Descrivete la richiesta in poche parole (almeno 10 caratteri).",
    errCode: "Controllate il codice. Inizia con EMP seguito da sei caratteri.",
    errField: "Controllate questo dato.",
    successTitle: "Ricevuto",
    successEmpfehler: "Grazie, {name}. Verifichiamo il vostro ordine e vi inviamo codice e link per e-mail.",
    successEmpfohlen: "Grazie, {name}. La vostra richiesta ci è arrivata. Vi rispondiamo personalmente.",
    again: "Nuova richiesta",
  },
};

export const EMPFEHLEN_COPY = Object.freeze({ de, en, fr, it });
export const EMPFEHLEN_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Texte einer Sprache (Fallback Deutsch). */
export function empfehlenCopy(locale) {
  return EMPFEHLEN_COPY[locale] || EMPFEHLEN_COPY.de;
}

/** "{name}" usw. ersetzen (ohne ICU). */
export function fill(template, vars = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
