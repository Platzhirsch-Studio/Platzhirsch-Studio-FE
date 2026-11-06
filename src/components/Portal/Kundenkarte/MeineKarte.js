// „Meine Kundenkarte“ im Kundenportal (/de/portal/kundenkarte). Server-Komponente.
// Zeigt Karte (CSS-Visual), Stufe, nächste Stufe (ohne Betrag – die Schwellen
// legt der Inhaber noch fest), Vorteile mit genutzt/verfügbar, Einlösungen und
// die Wallet-Knöpfe (deaktiviert, „in Vorbereitung“, bis das Backend signiert).
// Daten: PortalCard (src/lib/kundenkarte/adapters/interface.js). Keine Beträge in Euro.
import Link from "next/link";
import { Check, Minus, Smartphone } from "lucide-react";
import KartenVisual from "@/components/Kundenkarte/KartenVisual";
import { Badge, Card, CardHeading, Empty } from "@/components/Portal/Core/ui";
import { focusRing } from "@/components/Portal/Docs/labels";
import { formatDate } from "@/lib/portal/format";
import { STUFEN, kundenkarteCopy } from "@/lib/kundenkarte/copy";

const T = {
  stufe: "Ihre Stufe",
  seit: "seit",
  naechste: "Nächste Stufe",
  naechsteText: "Den Aufstieg nach Jahresumsatz zeigen wir hier an, sobald die Schwellen festgelegt sind.",
  hoechste: "Sie sind in der höchsten Stufe.",
  vorteile: "Ihre Vorteile",
  verfuegbar: "verfügbar",
  nichtEnthalten: "in Ihrer Stufe nicht enthalten",
  genutzt: "genutzt",
  proJahr: "pro Jahr",
  einloesungen: "Genutzte Vorteile",
  keineEinloesungen: "Noch keine Vorteile genutzt.",
  wallet: "Karte in der Wallet",
  walletText: "Apple Wallet und Google Wallet sind in Vorbereitung. Sobald die Karte dort verfügbar ist, können Sie sie hier hinzufügen.",
  inVorbereitung: "in Vorbereitung",
  apple: "Zu Apple Wallet",
  google: "Zu Google Wallet",
  kuendigen: "Sie können die Karte jederzeit kündigen oder Ihre Einwilligungen widerrufen – per Nachricht an Ihr Team.",
  nachricht: "Nachricht schreiben",
  keineKarte: "Für Ihr Konto liegt noch keine Kundenkarte vor.",
  beantragen: "Kundenkarte beantragen",
};

function WalletButton({ children, enabled }) {
  return (
    <button type="button" disabled={!enabled} aria-disabled={!enabled || undefined} className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink/20 bg-white px-5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50">
      <Smartphone size={16} aria-hidden="true" />
      {children}
      {!enabled && <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">{T.inVorbereitung}</span>}
    </button>
  );
}

export default function MeineKarte({ card, customer }) {
  if (!card) {
    return (
      <Empty>
        {T.keineKarte}{" "}
        <Link href="/de/kundenkarte#anmeldung" className={`underline underline-offset-4 ${focusRing}`}>
          {T.beantragen}
        </Link>
      </Empty>
    );
  }
  const stufe = STUFEN.find((s) => s.name === card.stufe.name) || STUFEN[0];
  const labels = kundenkarteCopy("de").hero;
  const name = customer?.displayName || [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");
  const verfuegbar = card.vorteile.filter((v) => v.verfuegbar);
  const uebrige = card.vorteile.filter((v) => !v.verfuegbar);

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6" data-portal-kundenkarte="">
      <div className="space-y-5 lg:col-span-2 lg:space-y-6">
        <Card aria-labelledby="kk-karte">
          <CardHeading id="kk-karte" title={T.stufe} />
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <KartenVisual stufe={stufe.key} name={name} nummer={card.kartennummer} seit={card.stufe.seit.slice(0, 4)} labels={labels} example={false} />
            <div>
              <p className="font-display text-2xl text-ink">{card.stufe.name}</p>
              <p className="mt-1 text-sm text-ink/70">
                {T.seit} {formatDate(card.stufe.seit)}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{T.naechste}</p>
              {card.naechste_stufe ? (
                <>
                  <p className="mt-1 text-ink">{card.naechste_stufe.name}</p>
                  <p className="mt-1 text-sm text-ink/70">{T.naechsteText}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink/70">{T.hoechste}</p>
              )}
            </div>
          </div>
        </Card>

        <Card aria-labelledby="kk-vorteile">
          <CardHeading id="kk-vorteile" title={T.vorteile} />
          <ul className="divide-y divide-ink/10">
            {[...verfuegbar, ...uebrige].map((v) => (
              <li key={v.titel} className="flex items-start gap-3 py-3" data-vorteil-verfuegbar={v.verfuegbar ? "1" : "0"}>
                {v.verfuegbar ? <Check size={18} aria-hidden="true" className="mt-1 shrink-0 text-success" /> : <Minus size={18} aria-hidden="true" className="mt-1 shrink-0 text-ink/40" />}
                <div className="min-w-0 flex-1">
                  {/* ≥ 4.5:1 auf Weiß (axe color-contrast): nicht enthaltene Vorteile nur leicht abgesetzt. */}
                  <p className={v.verfuegbar ? "text-ink" : "text-ink/75"}>{v.titel}</p>
                  <p className="text-sm text-ink/70">{v.beschreibung}</p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  {v.verfuegbar ? (
                    v.einloesbar_pro_jahr ? (
                      <Badge tone={v.genutzt >= v.einloesbar_pro_jahr ? "neutral" : "gold"}>
                        {v.genutzt}/{v.einloesbar_pro_jahr} {T.genutzt} {T.proJahr}
                      </Badge>
                    ) : (
                      <Badge tone="gold">{T.verfuegbar}</Badge>
                    )
                  ) : (
                    <Badge>{T.nichtEnthalten}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-5 lg:space-y-6">
        <Card aria-labelledby="kk-wallet">
          <CardHeading id="kk-wallet" title={T.wallet} />
          <p className="text-sm text-ink/75">{T.walletText}</p>
          <div className="mt-4 flex flex-col gap-2">
            <WalletButton enabled={card.wallet?.apple === true}>{T.apple}</WalletButton>
            <WalletButton enabled={card.wallet?.google === true}>{T.google}</WalletButton>
          </div>
        </Card>

        <Card aria-labelledby="kk-einloesungen">
          <CardHeading id="kk-einloesungen" title={T.einloesungen} />
          {card.einloesungen?.length ? (
            <ul className="space-y-3 text-sm">
              {card.einloesungen.map((e, i) => (
                <li key={`${e.datum}-${i}`} className="border-l-2 border-gold/60 pl-3">
                  <p className="text-ink">{e.vorteil}</p>
                  <p className="text-ink/70">
                    {formatDate(e.datum)}
                    {e.notiz ? ` · ${e.notiz}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{T.keineEinloesungen}</Empty>
          )}
        </Card>

        <p className="text-sm text-ink/70">
          {T.kuendigen}{" "}
          <Link href="/de/portal/nachrichten" className={`underline underline-offset-4 ${focusRing}`}>
            {T.nachricht}
          </Link>
        </p>
      </div>
    </div>
  );
}
