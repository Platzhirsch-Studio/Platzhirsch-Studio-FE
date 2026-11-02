// src/lib/kundenbetreuung/systemMails.js
// Service-Mails außerhalb der Kundenreisen: Empfehlungscode, Dank mit
// Gutschein, Double-Opt-in für Newsletter und Einladungen. Alle sind
// Grundlage V (angefordert bzw. Teil des Programms) und enthalten KEINEN
// Werbeblock. generate-frappe.mjs schreibt sie als Jinja-Vorlagen in die
// Frappe-App. Keine "@/..."-Importe.
import { absatz, knopf, mailHtml } from "./mail.js";

export const SYSTEM_MAILS = Object.freeze([
  {
    id: "empfehlung_code",
    zweck: "Antwort auf die Anfrage „Code anfordern“ (/empfehlen), erst nachdem das Team den Auftrag geprüft hat",
    betreff: "Ihr persönlicher Empfehlungscode",
    preheader: "Code und Link zum Weitergeben.",
    absaetze: [
      "{{ anrede }},",
      "danke, dass Sie uns weiterempfehlen möchten. Ihr persönlicher Code lautet <strong>{{ code }}</strong>.",
      "Am einfachsten geben Sie diesen Link weiter: <a href=\"{{ teilen_url }}\" style=\"color:#30373e\">{{ teilen_url }}</a>. Sie entscheiden, wem Sie ihn geben. Wir schreiben niemanden an.",
      "Wenn eine Person, die Sie empfohlen haben, bei uns zum ersten Mal einen Auftrag erteilt und der Einbeziehung Ihres Codes zugestimmt hat, erhalten Sie nach Ablauf der Rücktrittsfrist einen Gutschein{% if gutschein_wert %} über {{ gutschein_wert }}{% endif %}. Über den Auftrag selbst erfahren Sie nichts.",
      "{% if bedingungen_url %}Die Teilnahmebedingungen finden Sie hier: <a href=\"{{ bedingungen_url }}\" style=\"color:#30373e\">Teilnahmebedingungen</a>.{% endif %}",
    ],
    cta: { label: "Link öffnen", url: "{{ teilen_url }}" },
    gruss: ["Herzliche Grüße", "{{ berater_name }}"],
  },
  {
    id: "empfehlung_danke",
    zweck: "Gutschein an die empfehlende Person, nach erstem Auftrag der empfohlenen Person und Ablauf der Rücktrittsfrist",
    betreff: "Danke für Ihre Empfehlung",
    preheader: "Ihr Gutschein liegt bei.",
    absaetze: [
      "{{ anrede }},",
      "eine Person, der Sie uns empfohlen haben, richtet jetzt mit uns ein. Danke für Ihr Vertrauen.",
      "Wie versprochen erhalten Sie einen Gutschein{% if gutschein_wert %} über {{ gutschein_wert }}{% endif %}. Ihr Gutscheincode: <strong>{{ gutschein_code }}</strong>. Einlösen können Sie ihn im Showroom in Lochau; es gelten unsere Gutscheinbedingungen.",
    ],
    cta: { label: "Gutscheinbedingungen", url: "https://platzhirsch.studio/de/gutscheinbedingungen" },
    gruss: ["Herzlich", "Susanne Messmer"],
  },
  {
    id: "doi_bestaetigen",
    zweck: "Double-Opt-in für Newsletter oder Einladungen (transaktional, keine Werbung)",
    betreff: "Bitte bestätigen Sie Ihre Anmeldung",
    preheader: "Ein Klick, dann ist Ihre Anmeldung abgeschlossen.",
    absaetze: [
      "Guten Tag,",
      "Sie haben sich auf platzhirsch.studio für {{ zweck_text }} angemeldet. Bitte bestätigen Sie das mit einem Klick auf den Knopf unten. Erst dann schicken wir Ihnen Post aus Lochau.",
      "Der Link ist {{ gueltig_stunden }} Stunden gültig.",
      "Falls Sie sich nicht angemeldet haben, ignorieren Sie diese Mail einfach. Dann bekommen Sie von uns nichts.",
    ],
    cta: { label: "Anmeldung bestätigen", url: "{{ bestaetigen_url }}" },
    gruss: ["Platzhirsch Home Living"],
  },
]);

export function systemMailHtml(m) {
  const body = [...m.absaetze.map(absatz), m.cta ? knopf(m.cta) : "", absatz(m.gruss.join("<br>"))].join("\n");
  return mailHtml({ betreff: m.betreff, preheader: m.preheader, inhalt: body, fusszeile: "S" });
}
