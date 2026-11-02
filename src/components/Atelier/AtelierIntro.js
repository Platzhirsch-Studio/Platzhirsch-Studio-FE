// Kopf des Atelierverkaufs (Seite und Vorschau). Server-Komponente.
// Keine Händler-Formulierung, keine Rabatt- oder Knappheitswörter.
import { Heading, Lead } from "@/components/ui";
import { DELIVERY_NOTE, LOCATION_NOTE, VAT_NOTE } from "@/lib/commerce/priceRules";

export default function AtelierIntro({ titleLevel = 1 }) {
  return (
    <div className="max-w-text">
      <p className="text-overline uppercase text-text-accent">Atelierverkauf · Showroom Lochau</p>
      <Heading level={titleLevel} size={titleLevel === 1 ? "display-l" : "display-m"} className="mt-stack-s">
        Ausstellungsstücke aus unserem Showroom
      </Heading>
      <Lead className="mt-stack-m">
        Stücke, die bei uns in Lochau ausgestellt waren. Zu jedem Stück gibt es eine Zustandsbeschreibung mit Fotos, den Preis {VAT_NOTE} und
        auf Wunsch einen Termin, um es vorher anzusehen.
      </Lead>
      <p className="mt-4 text-small text-text-soft">
        Alle Preise {VAT_NOTE}, {DELIVERY_NOTE}. {LOCATION_NOTE}.
      </p>
    </div>
  );
}
