"use client";
// Produktliste (§ 3.2): Tabelle in Kachel mit Produktbild, Status + höchstens ein zweites Merkmal, Preis mit Stand,
// Bildzustand; Auswahl per Haken (Leertaste/X), Massenaktionen als Material-Kapsel unten, Seitenblick als Sheet
// (Lounge-Vorschau-Panel). Workflow-Übergänge laufen als verzögerter Commit (Q-C3), Veröffentlichen mit Vorprüfung.
import { useMemo, useState } from "react";
import Link from "next/link";
import { PanelRight } from "lucide-react";
import Knopf from "../Knopf";
import Sheet from "../Overlay/Sheet";
import { Pille } from "../StatusBadge";
import { BilderZelle, PreisZelle, ProduktBild, Status } from "./Bausteine";
import WorkflowDialog from "./WorkflowDialog";
import useAktion from "./useAktion";
import { useRouter } from "next/navigation";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { websiteAktualisierenAction } from "@/lib/backoffice/sortiment/actions";
import { bilderZustand, aufWebsite, produktUebergaenge } from "@/lib/backoffice/sortiment/regeln";
import { anzeigeWert, GLOSSAR, PRODUKTE, WORKFLOW_TOAST, AKTE_PRODUKT } from "@/lib/backoffice/sortiment/texte";
import { relativ, datum } from "@/lib/backoffice/format";

function zweitesMerkmal(p) {
  if (p.preisstand_alt) return { text: PRODUKTE.veraltetChip, material: "eiche" };
  if (p.verkauf_online) return { text: PRODUKTE.imShop, material: "see" };
  if (p.website_sichtbar === 0) return { text: PRODUKTE.ausgeblendet, material: "stein" };
  if (p.abverkauf) return { text: PRODUKTE.abverkauf, material: "messing" };
  return null;
}

/**
 * @param {{zeilen:object[], leitung:boolean, darfSchreiben:boolean, kopfzeile?:any}} p
 */
export default function ProduktListe({ zeilen, leitung, darfSchreiben, kopfzeile }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // { aktion, namen }
  const [blick, setBlick] = useState(null);
  const [ausstehend, setAusstehend] = useState(() => new Map());
  const { sofort } = useAktion();
  const router = useRouter();
  const [aktivZeile, setAktivZeile] = useState(null);
  useKuerzel("liste@sortiment", {
    "sortiment.preis-erfassen": () => {
      const ziel = aktivZeile || [...gewaehlt][0];
      if (ziel && darfSchreiben) router.push(`/sortiment/produkte/${encodeURIComponent(ziel)}?tab=preise&preis=erfassen`);
    },
    "sortiment.bestellvorschlag": () => router.push("/sortiment/bestellvorschlaege"),
  });

  const sichtbar = useMemo(() => zeilen.map((z) => (ausstehend.has(z.name) ? { ...z, status: ausstehend.get(z.name), _laeuft: true } : z)), [zeilen, ausstehend]);
  const auswahl = sichtbar.filter((z) => gewaehlt.has(z.name));
  const alle = sichtbar.length > 0 && gewaehlt.size === sichtbar.length;

  const umschalten = (name) =>
    setGewaehlt((alt) => {
      const n = new Set(alt);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  const ziel = { "Prüfen": "Geprueft", "Veröffentlichen": "Aktiv", Pausieren: "Pausiert", Reaktivieren: "Aktiv", "Zurück auf Entwurf": "Entwurf" };
  const geplant = (aktion) => (namen) => {
    setAusstehend((alt) => new Map([...alt, ...namen.map((n) => [n, ziel[aktion]])]));
    setGewaehlt(new Set());
  };
  const verworfen = () => setAusstehend(new Map());

  const moeglicheAktionen = useMemo(() => {
    const status = new Set(auswahl.map((a) => a.status));
    const hat = (s) => status.has(s);
    return [
      hat("Entwurf") && { aktion: "Prüfen", titel: PRODUKTE.masse.pruefen },
      leitung && hat("Geprueft") && { aktion: "Veröffentlichen", titel: PRODUKTE.masse.veroeffentlichen },
      hat("Aktiv") && { aktion: "Pausieren", titel: PRODUKTE.masse.pausieren },
      leitung && hat("Pausiert") && { aktion: "Reaktivieren", titel: PRODUKTE.masse.reaktivieren },
    ].filter(Boolean);
  }, [auswahl, leitung]);

  const tastatur = (e, name, i) => {
    if (e.target.closest("input,button,select,textarea")) return;
    if (e.key === " " && !e.shiftKey) {
      e.preventDefault();
      setBlick(sichtbar[i]);
    } else if (e.key.toLowerCase() === "x" && darfSchreiben) {
      e.preventDefault();
      umschalten(name);
    } else if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      e.currentTarget.nextElementSibling?.focus();
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      e.currentTarget.previousElementSibling?.focus();
    } else if (e.key === "Enter") {
      e.currentTarget.querySelector("a.bo-sor-link--zeile")?.click();
    }
  };

  return (
    <section className="bo-kachel bo-sor-liste min-w-0" aria-label={PRODUKTE.titel} data-testid="produkt-liste">
      <div className="bo-sor-liste__kopf">
        <span className="tabular-nums">{kopfzeile}</span>
        {darfSchreiben && sichtbar.length > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="size-4 accent-current" checked={alle} onChange={() => setGewaehlt(alle ? new Set() : new Set(sichtbar.map((z) => z.name)))} />
            <span>Alle auswählen</span>
          </label>
        )}
      </div>
      <div className="bo-sor-tabelle-huelle overflow-x-auto">
        <table className="bo-sor-tabelle">
          <thead>
            <tr>
              {darfSchreiben && (
                <th scope="col" className="w-8">
                  <span className="sr-only">Auswahl</span>
                </th>
              )}
              <th scope="col">{PRODUKTE.spalten.produkt}</th>
              <th scope="col" className="max-xl:hidden">{PRODUKTE.spalten.kategorie}</th>
              <th scope="col">{PRODUKTE.spalten.status}</th>
              <th scope="col" className="r">{PRODUKTE.spalten.preis}</th>
              <th scope="col" className="max-lg:hidden">{PRODUKTE.spalten.bilder}</th>
              <th scope="col" className="max-xl:hidden">{PRODUKTE.spalten.geaendert}</th>
              <th scope="col">
                <span className="sr-only">{PRODUKTE.vorschau}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((p, i) => {
              const zwei = zweitesMerkmal(p);
              const href = `/sortiment/produkte/${encodeURIComponent(p.name)}`;
              return (
                <tr key={p.name} tabIndex={-1} onFocus={() => setAktivZeile(p.name)} onKeyDown={(e) => tastatur(e, p.name, i)} data-gewaehlt={gewaehlt.has(p.name) ? "true" : undefined} aria-busy={p._laeuft ? "true" : undefined} data-testid="produkt-zeile">
                  {darfSchreiben && (
                    <td>
                      <input type="checkbox" className="size-4 accent-current" checked={gewaehlt.has(p.name)} onChange={() => umschalten(p.name)} aria-label={`${p.titel || p.name} auswählen`} />
                    </td>
                  )}
                  <td>
                    <div className="flex min-w-0 items-center gap-3">
                      <ProduktBild src={p.bild_hauptbild} alt="" groesse={48} zustand={bilderZustand(p).art} />
                      <div className="min-w-0">
                        <Link href={href} className="bo-sor-link bo-sor-link--zeile bo-sor-titel line-clamp-1">
                          {p.titel || p.name_herstellerbezeichnung}
                        </Link>
                        <p className="bo-sor-unter truncate">{[p.marke, p.hersteller_artikelnr].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-xl:hidden bo-sor-unter">{p.kategorie || "–"}</td>
                  <td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Status gruppe="produkt" wert={p.status} />
                      {zwei && <Pille material={zwei.material} groesse="sm">{zwei.text}</Pille>}
                    </span>
                  </td>
                  <td className="r">
                    <PreisZelle produkt={p} />
                  </td>
                  <td className="max-lg:hidden">
                    <BilderZelle produkt={p} />
                  </td>
                  <td className="max-xl:hidden bo-sor-unter whitespace-nowrap" title={datum(p.modified)}>
                    <span suppressHydrationWarning>{relativ(p.modified)}</span>
                  </td>
                  <td className="w-12">
                    <button type="button" className="bo-rund bo-rund--s bo-tip" data-tip={PRODUKTE.vorschau} aria-label={`${PRODUKTE.vorschau}: ${p.titel}`} onClick={() => setBlick(p)}>
                      <PanelRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="bo-sor-karten" data-testid="karten-liste">
        {sichtbar.map((p) => (
          <li key={p.name} className="bo-sor-karte-zeile">
            <ProduktBild src={p.bild_hauptbild} alt="" groesse={56} zustand={bilderZustand(p).art} />
            <div className="min-w-0 flex-1">
              <Link href={`/sortiment/produkte/${encodeURIComponent(p.name)}`} className="bo-sor-link bo-sor-link--zeile bo-sor-titel line-clamp-1">
                {p.titel}
              </Link>
              <p className="bo-sor-unter truncate">{p.marke}</p>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <Status gruppe="produkt" wert={p.status} groesse="sm" />
              </span>
            </div>
            <PreisZelle produkt={p} />
          </li>
        ))}
      </ul>

      {darfSchreiben && auswahl.length > 0 && (
        <div className="bo-sor-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen" data-testid="massenaktionen">
          <span className="bo-sor-auswahl__zahl">{PRODUKTE.auswahl(auswahl.length)}</span>
          {moeglicheAktionen.map((a) => (
            <Knopf key={a.aktion} size="s" variant={a.aktion === "Veröffentlichen" ? "primary" : "secondary"} onClick={() => setDialog({ aktion: a.aktion, namen: auswahl.filter((x) => produktUebergaenge(x.status, { leitung }).some((t) => t.aktion === a.aktion)).map((x) => x.name) })}>
              {a.titel}
            </Knopf>
          ))}
          <Knopf size="s" variant="ghost" onClick={() => sofort(() => websiteAktualisierenAction({ produkt: auswahl[0].name }), { ok: (r) => (r.status === "gedrosselt" ? WORKFLOW_TOAST.websiteGedrosselt : WORKFLOW_TOAST.website), neuLaden: false })}>
            {PRODUKTE.masse.website}
          </Knopf>
          <Knopf size="s" variant="ghost" icon="X" label={PRODUKTE.auswahlAufheben} onClick={() => setGewaehlt(new Set())} />
        </div>
      )}

      {dialog && <WorkflowDialog offen namen={dialog.namen} aktion={dialog.aktion} onSchliessen={() => setDialog(null)} onGeplant={geplant(dialog.aktion)} onVerworfen={verworfen} />}

      <Sheet offen={!!blick} onSchliessen={() => setBlick(null)} titel={blick?.titel || ""} unter={blick ? [blick.marke, blick.kategorie].filter(Boolean).join(" · ") : ""} groesse="md" vollseite={blick ? `/sortiment/produkte/${encodeURIComponent(blick.name)}` : undefined} fuss={blick ? <Knopf variant="primary" href={`/sortiment/produkte/${encodeURIComponent(blick.name)}`} iconRechts="ArrowRight">{PRODUKTE.oeffnen}</Knopf> : null}>
        {blick && (
          <div className="flex flex-col gap-5">
            <ProduktBild src={blick.bild_hauptbild} alt={blick.titel} fuellen className="aspect-[4/3] w-full !rounded-[20px]" />
            <div className="flex flex-wrap items-center gap-2">
              <Status gruppe="produkt" wert={blick.status} />
              {zweitesMerkmal(blick) && <Pille material={zweitesMerkmal(blick).material}>{zweitesMerkmal(blick).text}</Pille>}
            </div>
            <div className="rounded-[16px] bg-bo-surface-2 p-4">
              <p className="bo-sor-klein">{AKTE_PRODUKT.preis}</p>
              <div className="mt-1">
                <PreisZelle produkt={blick} rechts={false} />
              </div>
            </div>
            <dl className="bo-sor-fakten">
              <div>
                <dt>{AKTE_PRODUKT.lieferzeit}</dt>
                <dd>{blick.sofort_lieferbar ? AKTE_PRODUKT.sofort : AKTE_PRODUKT.lieferzeitWochen(blick.lieferzeit_wochen_von, blick.lieferzeit_wochen_bis)}</dd>
              </div>
              <div>
                <dt>{PRODUKTE.spalten.bilder}</dt>
                <dd>
                  <BilderZelle produkt={blick} />
                </dd>
              </div>
              <div>
                <dt>Welt</dt>
                <dd>{anzeigeWert("welt", blick.welt)}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>{aufWebsite(blick) ? "sichtbar" : "nicht sichtbar"}</dd>
              </div>
            </dl>
            <p className="bo-sor-klein">{GLOSSAR.typ[blick.typ] || ""}</p>
          </div>
        )}
      </Sheet>
    </section>
  );
}
