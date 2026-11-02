// src/components/Beratung/confirmationCopy.js
// Runde 5 (ux P1-1): the first "So geht es weiter" step follows the contact
// way the visitor gave. With a phone number we call, without one we answer by
// e-mail – before, the page promised a call to people who left no number.
// No reply deadline (Inhaber-offen Nr. 23): no "innerhalb von …", no "so bald
// wie möglich". Local copy module (src/messages belongs to the i18n package);
// IT in the voi form. No "@/..." imports: tested with `node --test`
// (tests/unit/r9-p3-confirmation.test.mjs).

export const CONFIRMATION_STEP1 = {
  de: {
    beratung: {
      phone: "Wir rufen Sie an und stimmen den Termin mit Ihnen ab, Dienstag bis Samstag.",
      email: "Wir melden uns per E-Mail und stimmen den Termin mit Ihnen ab.",
    },
    kontakt: {
      phone: "Wir lesen Ihre Nachricht und rufen Sie persönlich zurück.",
      email: "Wir lesen Ihre Nachricht und melden uns per E-Mail bei Ihnen.",
    },
  },
  en: {
    beratung: {
      phone: "We call you to arrange the appointment, Tuesday to Saturday.",
      email: "We get back to you by e-mail to arrange the appointment.",
    },
    kontakt: {
      phone: "We read your message and call you back personally.",
      email: "We read your message and get back to you by e-mail.",
    },
  },
  fr: {
    beratung: {
      phone: "Nous vous appelons pour fixer le rendez-vous, du mardi au samedi.",
      email: "Nous vous répondons par e-mail pour fixer le rendez-vous.",
    },
    kontakt: {
      phone: "Nous lisons votre message et vous rappelons personnellement.",
      email: "Nous lisons votre message et vous répondons par e-mail.",
    },
  },
  it: {
    beratung: {
      phone: "Vi chiamiamo per fissare l’appuntamento, dal martedì al sabato.",
      email: "Vi rispondiamo per e-mail per fissare l’appuntamento.",
    },
    kontakt: {
      phone: "Leggiamo il vostro messaggio e vi richiamiamo personalmente.",
      email: "Leggiamo il vostro messaggio e vi rispondiamo per e-mail.",
    },
  },
};

/** First next step: call variant with a phone number, e-mail variant without. */
export function confirmationStep1(locale, { kind = "beratung", phone = "" } = {}) {
  const table = CONFIRMATION_STEP1[locale] || CONFIRMATION_STEP1.de;
  const group = table[kind === "kontakt" ? "kontakt" : "beratung"];
  return String(phone || "").trim() ? group.phone : group.email;
}

// Runde 5 (ux P2-4): the city the visitor came from (?ort=) is shown as a
// context line above step 1 and as its own row of the confirmation, instead
// of a prefilled sentence in the visitor's own message field.
export const CITY_CONTEXT = {
  de: { note: "Ihre Anfrage von der Seite für {ort}", label: "Stadtseite" },
  en: { note: "Your enquiry from the page for {ort}", label: "City page" },
  fr: { note: "Votre demande depuis la page consacrée à {ort}", label: "Page de la ville" },
  it: { note: "La vostra richiesta dalla pagina dedicata a {ort}", label: "Pagina della città" },
};

/** "note" | "label" text for the city context, {ort} filled. */
export function cityContext(locale, key, ort = "") {
  const table = CITY_CONTEXT[locale] || CITY_CONTEXT.de;
  return String(table[key] || "").replace("{ort}", ort);
}
