import Link from "next/link";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import Leer from "../Leer";
import { Icon } from "../icons";
import { cent, datum } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import { kanonischeRoute } from "@/lib/backoffice/bereiche/index";
import { doctypeSlug } from "@/lib/backoffice/format";

// Server-Teile der Karten-Akte: Einkäufe-Tab, Bezüge und Nächster Schritt (rechte Spalte).

export function belegHref(doctype, name) {
  return kanonischeRoute(doctype, name) || `/d/${doctypeSlug(doctype)}/${encodeURIComponent(name)}`;
}

const ZAEHLT = { ja: T.einkaeufe.ja, offen: T.einkaeufe.offen, storniert: T.einkaeufe.storniert, auftrag: T.einkaeufe.auftrag, ueberKarte: T.einkaeufe.hinweisKarte, nein: T.einkaeufe.nein };

export function EinkaeufeTab({ belege = [], einwilligung, betraege, darfSchreiben }) {
  return (
    <div className="flex flex-col gap-4" data-testid="kk-einkaeufe">
      {!einwilligung && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3 text-[14px]">
          <span>{T.einkaeufe.ohneEinwilligung}</span>
          {darfSchreiben && (
            <Knopf size="s" icon="Shield" href="?einwilligung=1">
              {T.akte.einwilligungErfassen}
            </Knopf>
          )}
        </div>
      )}
      {belege.length === 0 ? (
        <Leer art="leer" groesse="karte" titel={T.einkaeufe.leer} text="" icon="Receipt" />
      ) : (
        <div className="bo-dt overflow-x-auto">
          <table className="bo-dt__tabelle min-w-[560px]">
            <caption className="bo-kk-sr">Einkäufe</caption>
            <thead>
              <tr>
                <th scope="col">{T.einkaeufe.spalten.datum}</th>
                <th scope="col">{T.einkaeufe.spalten.art}</th>
                <th scope="col">{T.einkaeufe.spalten.beleg}</th>
                <th scope="col">{T.einkaeufe.spalten.zaehlt}</th>
                {betraege && einwilligung && (
                  <th scope="col" data-rechts="">
                    {T.einkaeufe.spalten.betrag}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {belege.map((b) => (
                <tr key={`${b.doctype}-${b.name}`}>
                  <td className="whitespace-nowrap tabular-nums">{datum(b.datum)}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <Icon name={b.icon} className="size-4 text-bo-text-soft" />
                      {b.art}
                    </span>
                    <span className="bo-kk-unter">{b.ueber === "karte" ? T.einkaeufe.ueberKarte : T.einkaeufe.ueberKontakt}</span>
                  </td>
                  <td>
                    <Link href={belegHref(b.doctype, b.name)} className="bo-kk-mono text-[13px] hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td className="text-[13px]">{ZAEHLT[b.zaehlt.text] || (b.zaehlt.ja ? T.einkaeufe.ja : T.einkaeufe.nein)}</td>
                  {betraege && einwilligung && <td className="whitespace-nowrap text-right tabular-nums">{b.betrag == null ? "–" : cent(b.betrag)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BezuegeKachel({ karte, bezuege }) {
  const zeilen = [
    karte.kontakt ? { icon: "Contact", titel: T.akte.kundenakte, unter: karte.kunde_name, href: `/kunden/${encodeURIComponent(karte.kontakt)}` } : null,
    karte.antrag ? { icon: "Inbox", titel: `Antrag ${karte.antrag}`, unter: "Herkunft der Karte", href: `/kundenkarte/antraege/${encodeURIComponent(karte.antrag)}` } : null,
    bezuege?.auftraege ? { icon: "ScrollText", titel: `${bezuege.auftraege} ${bezuege.auftraege === 1 ? "Auftrag" : "Aufträge"}`, unter: "Auftragsbestätigungen", href: `/d/ph-auftragsbestaetigung?f_kontakt=${encodeURIComponent(karte.kontakt)}` } : null,
    bezuege?.kasse ? { icon: "Receipt", titel: `${bezuege.kasse} ${bezuege.kasse === 1 ? "Kassenkauf" : "Kassenkäufe"}`, unter: "Kassenbelege", href: `/d/ph-kassenbeleg?f_kontakt=${encodeURIComponent(karte.kontakt)}` } : null,
    bezuege?.service ? { icon: "Wrench", titel: `${bezuege.service} ${bezuege.service === 1 ? "Serviceleistung" : "Serviceleistungen"}`, unter: "Serviceaufträge und Pflege", href: `/d/ph-serviceauftrag?f_kontakt=${encodeURIComponent(karte.kontakt)}` } : null,
    bezuege?.aufgabenOffen || bezuege?.aufgabenErledigt ? { icon: "CheckSquare", titel: `Aufgaben ${bezuege.aufgabenOffen || 0} offen`, unter: `${bezuege.aufgabenErledigt || 0} erledigt`, href: `/d/ph-aufgabe?f_referenz_name=${encodeURIComponent(karte.name)}` } : null,
    karte.vorgaenger_karte ? { icon: "CreditCard", titel: `Vorgängerkarte ${karte.vorgaenger_karte}`, unter: "Limits zählen über die Kette", href: `/kundenkarte/karten/${karte.vorgaenger_karte}` } : null,
    karte.nachfolger_karte ? { icon: "CreditCard", titel: `Nachfolgekarte ${karte.nachfolger_karte}`, unter: "gültige Karte", href: `/kundenkarte/karten/${karte.nachfolger_karte}` } : null,
  ].filter(Boolean);
  return (
    <Kachel titel={T.akte.bezuege} testid="kk-bezuege">
      {zeilen.length === 0 ? (
        <p className="text-[14px] text-bo-text-soft">{T.akte.bezuegeLeer}</p>
      ) : (
        <ul className="bo-kk-zeilen -mx-3">
          {zeilen.map((z) => (
            <li key={z.titel} className="bo-kk-zeile">
              <span className="bo-kk-zeile__icon" aria-hidden="true">
                <Icon name={z.icon} className="size-4" />
              </span>
              <span className="bo-kk-zeile__text">
                <Link href={z.href} className="bo-kk-zeile__titel bo-kk-zeile__link block">
                  {z.titel}
                </Link>
                <span className="bo-kk-zeile__unter block">{z.unter}</span>
              </span>
              <Icon name="ChevronRight" className="size-4 text-bo-text-faint" />
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export function NaechsterSchrittKachel({ schritt, karte }) {
  const ziel = schritt
    ? {
        uebergabe: null,
        ersatz: null,
        leitung: null,
        neu: `/kundenkarte/karten/neu?kontakt=${encodeURIComponent(karte.kontakt || "")}`,
        berater: `/kundenkarte/karten/${karte.name}?tab=details#stammdaten`,
        neuberechnen: null,
        anbieten: `/d/ph-aufgabe/neu?referenz_doctype=PH%20Kundenkarte&referenz_name=${encodeURIComponent(karte.name)}`,
      }[schritt.id]
    : null;
  return (
    <Kachel titel={T.akte.naechster} testid="kk-naechster">
      {schritt ? (
        <div className="flex items-center gap-3">
          <span className="bo-kk-zeile__icon" data-ton="cognac" aria-hidden="true">
            <Icon name="ArrowRight" className="size-4" />
          </span>
          <span className="flex-1 text-[15px] font-semibold">{schritt.titel}</span>
          {ziel && <Knopf size="s" href={ziel} icon="ArrowUpRight" label={schritt.titel} />}
        </div>
      ) : (
        <p className="text-[14px] text-bo-text-soft">{T.akte.keinNaechster}</p>
      )}
    </Kachel>
  );
}
