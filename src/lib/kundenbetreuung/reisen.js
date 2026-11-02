// src/lib/kundenbetreuung/reisen.js
// Automatische Kundenbetreuung (Inhaber 29.10.2026, Punkt 8): zeitgesteuerte
// Mails nach dem Kauf. EINE Quelle für Ablauf, Rechtsgrundlage und Text jeder
// Reise. generate-frappe.mjs schreibt daraus die Jinja-Vorlagen und Fixtures
// der Frappe-App (../platzhirsch-frappe-kundenbetreuung), damit Website-Team
// und Frappe-Entwickler nicht zwei Fassungen pflegen.
//
// Textquellen: marketing/email-flows.md 3.1–3.4 und 5, wachstumsrat/
// crm-wiederkauf.md 3.6 (Vorlagen B, C). Stimme: Sie-Form, Gastgeber, kein
// Ausrufezeichen, keine Superlative, keine Preise, keine Rabatte.
// Platzhalter sind Jinja-Variablen der Frappe-App ({{ anrede }} usw.,
// Liste in VARIABLEN). Nur Deutsch; EN-Fassungen folgen, sobald die
// Kanzlei die deutschen Fußzeilen freigegeben hat.
//
// Ablauf-Felder:
//   ausloeser.typ  "datum"     Feld des Auftrags + versatzTage (lieferdatum + 14)
//                  "jaehrlich" Tag/Monat (MM-TT) für alle passenden Kontakte
//                  "jahrestag" Feld des Auftrags, jedes Jahr am selben Tag
//                  "termin"    fester Termin (PH Termin der Frappe-App) + versatzTage
//                  "einwilligung" Zeitpunkt einer Einwilligung + versatzTage[]
//   segment        Filter, den engine.py auf den Auftrag anwendet
// Keine "@/..."-Importe.
import { pruefeReise } from "./rechtsgrundlagen.js";

export const VARIABLEN = Object.freeze({
  anrede: "„Guten Tag Frau Muster“ bzw. „Guten Tag Herr Muster“ (aus Kontakt; ohne Anrede „Guten Tag“)",
  produkt: "kurze Bezeichnung des Hauptstücks aus dem Auftrag, z. B. „Ihr Sofa“",
  berater_name: "zuständige Beraterin / zuständiger Berater (Auftrag)",
  berater_telefon: "Durchwahl der Beraterin / des Beraters",
  pflege_module: "Liste {titel, text} aus den Materialien der Auftragspositionen (PFLEGE_MODULE)",
  bewerten_url: "https://platzhirsch.studio/de/bewerten?utm_source=email&utm_medium=email&utm_campaign=bewertung",
  portal_url: "https://platzhirsch.studio/de/portal",
  termin_titel: "Titel des Termins (PH Termin)",
  termin_datum: "z. B. „Donnerstag, 26. November 2026“",
  termin_uhrzeit: "z. B. „18:00 Uhr“ – leer, solange der Inhaber keine Uhrzeit bestätigt hat",
  termin_url: "Anmeldeseite, z. B. https://platzhirsch.studio/de/adventsabend",
  gemerkte_stuecke: "Liste {name, url} der gemerkten Stücke bzw. des Planer-Stands",
  abmelde_url: "signierter Abmeldelink (frappe.utils.get_signed_params) – nur Werbung",
  einwilligung_datum: "Datum der bestätigten Einwilligung (Fußzeile A)",
});

// Pflege-Module je Material (email-flows.md 3.2, nur die geprüften
// allgemeinen Sätze; Herstellerangaben gehen immer vor). Schlüssel =
// Feld `pflege_kategorie` der Auftragsposition (Frappe Custom Field).
export const PFLEGE_MODULE = Object.freeze({
  stoff: {
    titel: "Stoffbezüge",
    text: "Regelmäßig mit der Polsterdüse absaugen. Flecken sofort mit einem hellen, saugfähigen Tuch abtupfen, nicht reiben. Reinigungsmittel zuerst an einer verdeckten Stelle testen. Direkte Sonne kann Farben mit der Zeit aufhellen.",
  },
  leder: {
    titel: "Leder",
    text: "Mit einem trockenen, weichen Tuch abstauben. Abstand zu Heizkörpern und Kaminen halten und direkte Sonne meiden, beides trocknet Leder aus. Flüssigkeiten sofort abtupfen. Nur Pflegemittel verwenden, die der Hersteller für dieses Leder empfiehlt.",
  },
  holz: {
    titel: "Holz und Lack",
    text: "Mit einem leicht feuchten, gut ausgewrungenen Tuch abwischen und gleich trocknen. Keine scheuernden Mittel oder Schwämme. Untersetzer für heiße und nasse Gläser verwenden. Das Raumklima nicht zu trocken halten.",
  },
  naturstein: {
    titel: "Naturstein",
    text: "Marmor ist empfindlich gegen Säure: Zitrone, Essig, Wein und Kaffee sofort abwischen. Zum Reinigen pH-neutrale Mittel verwenden, keine Entkalker. Ob und wann eine Imprägnierung aufgefrischt werden soll, steht in der Pflegeanleitung.",
  },
  outdoor: {
    titel: "Outdoor-Möbel",
    text: "Kissen nach Regen trocknen lassen oder trocken lagern. Schutzhüllen nur über trockene Möbel ziehen, damit sich kein Schimmel bildet. Sonnenschirme bei starkem Wind schließen; die Windgrenzen stehen in der Anleitung des Herstellers.",
  },
  leuchten: {
    titel: "Leuchten",
    text: "Vor dem Reinigen ausschalten und abkühlen lassen. Nur trocken oder nach Herstellerangabe reinigen. Leuchtmittel und LED-Module nach Herstellerangabe tauschen.",
  },
});

const sig = ["Herzliche Grüße", "{{ berater_name }}", "{% if berater_telefon %}{{ berater_telefon }}{% endif %}"];

export const REISEN = Object.freeze([
  {
    id: "danke",
    name: "Danke nach dem Kauf",
    ziel: "Beziehung, Vertrauen nach der Lieferung",
    ausloeser: { typ: "datum", feld: "lieferdatum", versatzTage: 1 },
    segment: {},
    absender: "berater",
    rechtsgrundlage: ["V"],
    werbung: false,
    abmeldelink: false,
    stopp: ["storniert"],
    quelle: "email-flows.md 3.1",
    vorlage: {
      betreff: "Willkommen zuhause",
      preheader: "Danke und ein paar Hinweise für die ersten Wochen.",
      absaetze: [
        "{{ anrede }},",
        "gestern haben wir {{ produkt }} zu Ihnen gebracht. Danke, dass Sie sich für Platzhirsch entschieden haben.",
        "Für die ersten Wochen: Neue Polster setzen sich anfangs etwas, das ist normal. Gerüche von Verpackung und Fertigung verfliegen mit Lüften meist nach wenigen Tagen. Die Pflegeanleitung des Herstellers ist maßgeblich, bitte heben Sie sie auf.",
        "Wenn etwas nicht passt, ein Kratzer, eine Schraube, eine offene Frage: Melden Sie sich bitte direkt bei mir. Dafür sind wir da.",
        "Ihre Unterlagen und Termine finden Sie auch im Kundenportal.",
      ],
      cta: { label: "Zum Kundenportal", url: "{{ portal_url }}" },
      gruss: sig,
    },
  },
  {
    id: "pflege",
    name: "Pflegetipps nach zwei Wochen",
    ziel: "Service: das Stück bleibt lange schön (Material aus dem Auftrag)",
    ausloeser: { typ: "datum", feld: "lieferdatum", versatzTage: 14 },
    segment: { mitPflegekategorie: true },
    absender: "berater",
    rechtsgrundlage: ["V"],
    werbung: false,
    abmeldelink: false,
    stopp: ["storniert", "reklamation_offen_bis_erledigt"],
    quelle: "email-flows.md 3.2",
    vorlage: {
      betreff: "So bleibt {{ produkt }} lange schön",
      preheader: "Unsere Pflegehinweise für Ihre Materialien, kurz zusammengefasst.",
      absaetze: [
        "{{ anrede }},",
        "{{ produkt }} ist jetzt zwei Wochen bei Ihnen. Hier sind die Hinweise, die wir zu Ihren Materialien am häufigsten mitgeben. Maßgeblich ist immer die Pflegeanleitung des Herstellers.",
        "{% for m in pflege_module %}<strong>{{ m.titel }}</strong><br>{{ m.text }}{% if not loop.last %}<br><br>{% endif %}{% endfor %}",
        "Wenn Sie unsicher sind, ob ein Mittel geeignet ist: Fragen Sie uns lieber vorher.",
      ],
      cta: null,
      gruss: sig,
    },
  },
  {
    id: "bewertung",
    name: "Zufriedenheit und Bewertung nach sechs Wochen",
    ziel: "Rückmeldung und ehrliche Google-Bewertung, an ALLE Kunden, ohne Filter und ohne Anreiz",
    ausloeser: { typ: "datum", feld: "lieferdatum", versatzTage: 42 },
    segment: {},
    absender: "berater",
    // BGH VI ZR 225/17: Eine Feedback-Bitte per Mail ist Werbung, also nicht V.
    // Ob sie unter „eigene, ähnliche Produkte“ (B) fällt, klärt die Kanzlei.
    // Bis dahin NUR mit Einwilligung (QA Welle 2 P2-9); die Einwilligung
    // „rueckmeldung“ wird beim Kauf mit eigenem Häkchen eingeholt (noch nicht gebaut).
    rechtsgrundlage: ["E"],
    zweck: "rueckmeldung",
    nurEinwilligung: true,
    werbung: true,
    abmeldelink: true,
    ecgAbgleich: true,
    voraussetzung: "Einwilligung zweck=rueckmeldung (eigenes, nicht vorangekreuztes Häkchen beim Kauf) – noch nicht gebaut; Kanzlei klärt, ob B genügt",
    einmalig: true,
    stopp: ["widerspruch", "ecg_liste", "storniert"],
    // Reklamation verschiebt die Bitte nur bis zur Erledigung (sonst Gating),
    // Frist legt die Kanzlei fest.
    hinweis: "Keine Erinnerung, kein Anreiz, kein Mitarbeitername, nicht an das Empfehlungsprogramm koppeln (Google-Richtlinie, UWG Anh. Nr. 23b/c).",
    quelle: "email-flows.md 3.3",
    vorlage: {
      betreff: "Wie wohnt es sich mit {{ produkt }}?",
      preheader: "Ihre ehrliche Meinung hilft anderen bei der Entscheidung.",
      absaetze: [
        "{{ anrede }},",
        "seit einigen Wochen steht {{ produkt }} bei Ihnen. Wir hoffen, Sie fühlen sich damit so wohl, wie wir es bei der Planung mit Ihnen gehofft haben.",
        "Wie war es mit uns, von der Beratung bis zur Lieferung? Wenn Sie mögen, teilen Sie Ihre Erfahrung auf Google. Ehrliche Bewertungen helfen anderen, die vor derselben Entscheidung stehen. Das dauert etwa zwei Minuten.",
        "Und falls etwas nicht passt: Antworten Sie einfach auf diese Mail. Ich kümmere mich persönlich darum.",
      ],
      cta: { label: "Bewertung schreiben", url: "{{ bewerten_url }}" },
      gruss: sig,
    },
  },
  {
    id: "outdoor",
    name: "Outdoor im Frühling",
    ziel: "Saisonstart: Pflege nach dem Winter, Probesitzen im Garten vor dem Showroom",
    ausloeser: { typ: "jaehrlich", tag: "03-10" },
    segment: { mitOutdoor: true, oderInteresse: "outdoor" },
    absender: "gastgeberin",
    // QA Welle 2 P1-5: B nur an Käufer eines Outdoor-Stücks (eng: „ähnliche
    // Produkte“); wer nur Interesse an Outdoor angegeben hat, nur über E.
    rechtsgrundlage: ["B", "E"],
    bNurMitKauf: "outdoor",
    zweck: "newsletter",
    werbung: true,
    abmeldelink: true,
    aehnlicheProdukte: "Outdoor-Möbel und Pflege aus dem eigenen Sortiment, passend zum gekauften Outdoor-Stück",
    ecgAbgleich: true,
    stopp: ["widerspruch", "ecg_liste", "reklamation_offen", "anfrage_offen", "frequenzgrenze"],
    quelle: "crm-wiederkauf.md 3.6 Vorlage C",
    vorlage: {
      betreff: "Die Terrasse wartet",
      preheader: "Was Ihre Outdoor-Möbel nach dem Winter brauchen.",
      absaetze: [
        "{{ anrede }},",
        "am See werden die Abende länger. Zeit, die Terrasse aufzuwecken.",
        "Drei Handgriffe für den Saisonstart: Gestelle mit einem weichen Tuch und klarem Wasser abwischen, bevor die Kissen draufkommen. Kissen vor dem ersten Gebrauch gut lüften, Feuchtigkeit aus dem Winterlager ist der häufigste Grund für Flecken. Sonnenschirme vor dem Öffnen auf Schäden prüfen; die Windgrenzen stehen in der Anleitung des Herstellers.",
        "{% if neuheiten %}Neu im Garten vor dem Showroom: {{ neuheiten }}.{% endif %} Wer die Terrasse ergänzen möchte, kann im Frühling in Ruhe Probe sitzen, am liebsten an einem sonnigen Nachmittag mit einem Kaffee im Café.",
      ],
      cta: { label: "Termin zum Probesitzen", url: "https://platzhirsch.studio/de/beratung?thema=outdoor&utm_source=email&utm_medium=email&utm_campaign=outdoor-fruehling" },
      gruss: ["Herzliche Grüße", "Susanne Messmer"],
    },
  },
  {
    id: "advent",
    name: "Einladung zum Adventsabend",
    ziel: "Besuch im Showroom und Café, persönliche Begegnung",
    ausloeser: { typ: "termin", termin: "adventsabend-2026", versatzTage: -21 },
    segment: { region: ["AT", "DE", "CH", "FL"] },
    absender: "gastgeberin",
    // B nur mit Bestätigung der Kanzlei, dass eine Einladung ins eigene
    // Geschäft „Werbung für eigene ähnliche Produkte“ ist (email-flows 0.1).
    // Ohne Bestätigung: nur E, alle anderen per Brief (Grundlage P, außerhalb dieser App).
    rechtsgrundlage: ["E", "B"],
    zweck: "einladungen",
    werbung: true,
    abmeldelink: true,
    aehnlicheProdukte: "Abend im eigenen Showroom mit dem eigenen Sortiment [Kanzlei bestätigt]",
    ecgAbgleich: true,
    bKanzleiPruefen: true,
    stopp: ["widerspruch", "ecg_liste", "reklamation_offen", "frequenzgrenze", "bereits_angemeldet"],
    quelle: "email-flows.md 5.1",
    vorlage: {
      betreff: "Einladung: {{ termin_titel }}",
      preheader: "Ein Abend im Showroom und Café in Lochau.",
      absaetze: [
        "{{ anrede }},",
        "am {{ termin_datum }}{% if termin_uhrzeit %} ab {{ termin_uhrzeit }}{% endif %} laden wir Sie in den Showroom und ins Café nach Lochau ein. Nehmen Sie Platz, mit Zeit für ein Gespräch und einen Blick auf die Stücke, die gerade bei uns stehen.",
        "{% if termin_programm %}{{ termin_programm }}{% endif %}",
        "Damit wir gut planen können, bitten wir um eine kurze Anmeldung.",
      ],
      cta: { label: "Platz reservieren", url: "{{ termin_url }}" },
      gruss: ["Herzlich", "Susanne Messmer"],
    },
  },
  {
    id: "jahrestag",
    name: "Ein Jahr zuhause",
    ziel: "Bindung: Gruß zum Jahrestag der Lieferung, Pflegehinweis, Besuch im Café",
    ausloeser: { typ: "jahrestag", feld: "lieferdatum" },
    segment: {},
    absender: "gastgeberin",
    rechtsgrundlage: ["B", "E"],
    zweck: "newsletter",
    werbung: true,
    abmeldelink: true,
    aehnlicheProdukte: "Hinweis auf eine weitere Planung im eigenen Kundenportal (eigene Leistung)",
    ecgAbgleich: true,
    stopp: ["widerspruch", "ecg_liste", "reklamation_offen", "frequenzgrenze"],
    quelle: "crm-wiederkauf.md 3.6 Vorlage B",
    vorlage: {
      betreff: "Ein Jahr mit {{ produkt }}",
      preheader: "Ein kleiner Gruß aus Lochau.",
      absaetze: [
        "{{ anrede }},",
        "heute vor einem Jahr haben wir {{ produkt }} zu Ihnen gebracht. Wir denken gern an diesen Tag zurück.",
        "{% if pflege_module %}Für das zweite Jahr ein Hinweis: {{ pflege_module[0].text }}{% endif %}",
        "Falls Sie über einen weiteren Raum nachdenken: Im Kundenportal finden Sie unter „Neue Planung“ den kürzesten Weg zu uns. Und wenn Sie wieder einmal am Bodensee unterwegs sind: Schauen Sie auf einen Kaffee bei uns in Lochau vorbei.",
      ],
      cta: { label: "Zum Kundenportal", url: "{{ portal_url }}" },
      gruss: ["Herzlich", "Susanne Messmer"],
    },
  },
  {
    id: "merkliste",
    name: "Erinnerung an Merkliste oder Planer",
    ziel: "Wer gemerkte Stücke oder einen Planer-Stand per Mail gesichert und eingewilligt hat, bekommt höchstens zwei Erinnerungen",
    ausloeser: { typ: "einwilligung", zweck: ["merkliste_erinnerung", "planer_erinnerung"], versatzTage: [3, 14] },
    segment: {},
    absender: "gastgeberin",
    rechtsgrundlage: ["E"],
    zweck: "merkliste_erinnerung",
    nurEinwilligung: true,
    werbung: true,
    abmeldelink: true,
    stopp: ["widerruf", "anfrage_gestellt", "termin_gebucht", "max_2_erinnerungen"],
    quelle: "crm-wiederkauf.md 3.1 Trigger 14, 3.5 D3",
    // Website-Voraussetzung (offen): „Auswahl per E-Mail sichern“ mit eigenem,
    // nicht vorangekreuztem Häkchen auf /merkliste und in den Planern.
    voraussetzung: "Merkliste/Planer senden zweck + textversion + quelle an PH Einwilligung (noch nicht gebaut)",
    vorlage: {
      betreff: "Ihre Auswahl liegt bereit",
      preheader: "Die Stücke, die Sie sich gemerkt haben, auf einen Blick.",
      absaetze: [
        "{{ anrede }},",
        "Sie haben sich bei uns ein paar Stücke gemerkt. Hier ist Ihre Auswahl, falls Sie im Alltag nicht dazugekommen sind:",
        "{% for s in gemerkte_stuecke %}<a href=\"{{ s.url }}\">{{ s.name }}</a>{% if not loop.last %}<br>{% endif %}{% endfor %}",
        "Im Showroom in Lochau können Sie Probe sitzen und Materialien in die Hand nehmen. Harald Menghin zeichnet Ihr Konzept anschließend von Hand.",
      ],
      cta: { label: "Termin vereinbaren", url: "https://platzhirsch.studio/de/beratung?utm_source=email&utm_medium=email&utm_campaign=merkliste" },
      gruss: ["Herzliche Grüße", "Susanne Messmer"],
    },
  },
]);

/** Fehlerliste aller Reisen (leer = alle Regeln erfüllt). */
export function pruefeAlleReisen(reisen = REISEN) {
  return reisen.flatMap((r) => pruefeReise(r).map((f) => `${r.id}: ${f}`));
}

export const reiseById = (id) => REISEN.find((r) => r.id === id) || null;
