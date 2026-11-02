// Inhalt der Gutschein-Seite (/de/gutscheine) und der Vorschau.
// Server-Komponente; das Formular ist die einzige Client-Insel.
// Ton: Gastgeber, sachlich. Keine Superlative, kein "abgesichert", keine
// Zahlungs- oder Lieferzusagen (Rechtspaket 06 1.4, W5, W14).
import { Heading, Lead, SmartLink } from "@/components/ui";
import { AMOUNT_MIN } from "@/lib/commerce/voucherConfig";
import { voucherPriceLabel, voucherValidityText } from "@/lib/commerce/voucherTerms";
import VoucherPurchaseForm from "@/components/Payments/VoucherPurchaseForm";
import Widerrufsbelehrung from "@/components/Payments/Widerrufsbelehrung";
import VoucherForm from "./VoucherForm";

const overline = "text-overline uppercase text-text-accent";

// Gültigkeit aus voucherTerms.js (offene Inhaberfrage 3), nicht fest im Code.
const validity = voucherValidityText();
const FACTS = [
  { title: validity.factTitle, text: validity.factText },
  { title: "In Teilen einlösbar", text: "Das Restguthaben bleibt erhalten, ohne Gebühren." },
  { title: "Keine Barablöse", text: "Der Gutschein wird im Showroom eingelöst, nicht ausgezahlt." },
];

const STEPS = [
  { title: "Anfrage senden", text: "Betrag, Motiv und Grußtext wählen. Das ist unverbindlich." },
  { title: "Wir melden uns", text: "Persönlich, mit einem Angebot und allen Angaben zu Zustellung und Rücktrittsrecht." },
  { title: "Gutschein erhalten", text: "Erst wenn Sie unser Angebot annehmen, kommt ein Vertrag zustande." },
];

// Online-Kauf (VOUCHER_MODE=stripe).
const STEPS_STRIPE = [
  { title: "Gutschein wählen", text: "Wert, Motiv und Widmung festlegen. Den Gesamtpreis sehen Sie vor dem Kauf." },
  { title: "Bezahlen", text: "Auf der Bezahlseite von Stripe, mit den dort angezeigten Zahlungsarten wie Karte oder Wallet." },
  { title: "PDF per E-Mail", text: "Nach bestätigter Zahlung kommt der Gutschein als PDF. Die Rechnung senden wir gesondert." },
];

/**
 * @param {"anfrage"|"stripe"} [mode="anfrage"]  Anfrage oder Online-Kauf
 * @param {boolean} [mock]        Online-Kauf im Entwicklungs-Mock (keine echte Zahlung)
 * @param {string} [withdrawHref] Ziel der Schaltfläche „Vertrag widerrufen“
 * @param {string} [anchorPrefix] Präfix der Sprungmarken (zwei Abschnitte auf einer Seite)
 * @param {boolean} [demo]        Vorschau: Formular sendet nicht
 * @param {1|2} [titleLevel=1]    Überschriftenebene des Titels (Vorschau: 2)
 * @param {string} [termsHref]    Link auf die Bedingungen
 */
export default function VoucherSection({ demo = false, titleLevel = 1, termsHref = "/gutscheinbedingungen", mode = "anfrage", mock = false, withdrawHref = "/zahlung/widerruf", anchorPrefix = "" }) {
  const a = (name) => `${anchorPrefix}${name}`;
  const sub = titleLevel + 1;
  const online = mode === "stripe";
  const steps = online ? STEPS_STRIPE : STEPS;
  return (
    <div className="mx-auto grid max-w-page gap-y-12 gap-x-grid lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className={overline}>Gutscheine · ab {AMOUNT_MIN} €</p>
        <Heading level={titleLevel} size={titleLevel === 1 ? "display-l" : "display-m"} className="mt-stack-s">
          Ein Gutschein für Einrichtung
        </Heading>
        <Lead className="mt-stack-m">
          Für ein Möbelstück, eine Leuchte oder ein Ausstellungsstück aus unserem Showroom in Lochau. Sie wählen Betrag und Motiv, wir
          kümmern uns um den Rest.
        </Lead>

        <ul className="mt-12 divide-y divide-line border-y border-line">
          {FACTS.map((f) => (
            <li key={f.title} className="py-5">
              <p className="text-ui text-text">{f.title}</p>
              <p className="mt-1 text-body text-text-soft">{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-small text-text-soft">
          Alle Einzelheiten stehen in den{" "}
          <SmartLink href={termsHref} className="text-text underline underline-offset-4 hover:decoration-2">
            Gutscheinbedingungen
          </SmartLink>
          .
        </p>

        <div className="mt-12">
          <Heading level={sub} size="title">
            So geht es
          </Heading>
          <ol className="mt-6 space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span aria-hidden="true" className="w-8 flex-none text-ui text-text-accent tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-ui text-text">{s.title}</p>
                  <p className="mt-1 text-body text-text-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {online ? (
        <div id={a("kaufen")} className="scroll-mt-24 lg:col-span-6 lg:col-start-7">
          <div className="border-t border-line-strong pt-8">
            <Heading level={sub} size="title" className="mb-8">
              Gutschein kaufen
            </Heading>
            <VoucherPurchaseForm mock={mock} demo={demo} priceLabel={voucherPriceLabel()} termsHref={termsHref} withdrawalHref={`#${a("widerrufsbelehrung")}`} />
          </div>
          <details id={a("anfrage")} className="mt-12 scroll-mt-24 border-t border-line pt-6">
            <summary className="flex min-h-11 cursor-pointer items-center text-ui text-text underline underline-offset-4">
              Firmengeschenk oder mehr als zehn Stück? Gutschein anfragen
            </summary>
            <div className="mt-8">
              <VoucherForm demo={demo} />
            </div>
          </details>
        </div>
      ) : (
        <div id={a("anfrage")} className="scroll-mt-24 lg:col-span-6 lg:col-start-7">
          <div className="border-t border-line-strong pt-8">
            <Heading level={sub} size="title" className="mb-8">
              Gutschein anfragen
            </Heading>
            <VoucherForm demo={demo} />
          </div>
        </div>
      )}

      {online && (
        <section id={a("widerrufsbelehrung")} aria-labelledby={a("gs-widerruf")} className="scroll-mt-24 border-t border-line pt-10 lg:col-span-12">
          <div className="max-w-text">
            <Heading level={sub} size="display-m" id={a("gs-widerruf")}>
              Widerrufsbelehrung
            </Heading>
            <div className="mt-6">
              <Widerrufsbelehrung headingLevel={sub + 1} withdrawHref={withdrawHref} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
