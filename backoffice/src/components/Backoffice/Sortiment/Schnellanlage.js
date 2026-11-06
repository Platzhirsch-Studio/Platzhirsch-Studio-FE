"use client";
// Schnellanlage „Neues Produkt“ (§ 3.3, Dialog md 560): Marke, Kategorie, Bezeichnung als Pflicht, Art.-Nr.,
// „Weitere Angaben“ eingeklappt. Live: Händler-/Markenstatus, geerbter USt-Satz, Web-Adresse, Dublettenhinweis.
// „Anlegen“ bleibt in der Liste, „Anlegen und öffnen“ (Strg/⌘+Enter) springt in die Akte. Vor „Anlegen“ entsteht nichts.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Info } from "lucide-react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { dubletteAction, produktAnlegenAction } from "@/lib/backoffice/sortiment/actions";
import { eanGueltig, produktSlug, ustSatz, webAdresse } from "@/lib/backoffice/sortiment/regeln";
import { anzeigeWert, SCHNELLANLAGE } from "@/lib/backoffice/sortiment/texte";

const LEER = { marke: "", kategorie: "", bezeichnung: "", artikelnr: "", ean: "", collection: "", serie: "", designer: "" };

/**
 * @param {{marken:object[], kategorien:object[], knopf?:boolean}} p
 * Öffnet bei ?neu=produkt oder über den eigenen Knopf (Primäraktion der Produktliste).
 */
export default function Schnellanlage({ marken, kategorien, knopf = true }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const { zeige } = useToast();
  const perUrl = sp.get("neu") === "produkt";
  const [offen, setOffen] = useState(false);
  const [werte, setWerte] = useState(LEER);
  const [fehler, setFehler] = useState({});
  const [laeuft, setLaeuft] = useState(false);
  const [dublette, setDublette] = useState([]);
  const [fragen, setFragen] = useState(false);
  const erstes = useRef(null);
  const sichtbar = offen || perUrl;

  const marke = marken.find((m) => m.name === werte.marke);
  const kategorie = kategorien.find((k) => k.name === werte.kategorie);
  const adresse = webAdresse({ kategorie: kategorie?.label_de || werte.kategorie, marke: werte.marke, bezeichnung: werte.bezeichnung });
  const befuellt = Object.values(werte).some((v) => String(v).trim());

  useEffect(() => {
    if (!sichtbar || (!werte.artikelnr && !werte.bezeichnung)) return undefined;
    const t = setTimeout(async () => {
      const r = await dubletteAction({ marke: werte.marke, artikelnr: werte.artikelnr, slug: werte.marke && werte.bezeichnung ? produktSlug({ marke: werte.marke, bezeichnung: werte.bezeichnung }) : "" });
      setDublette(r?.ok ? r.treffer : []);
    }, 400);
    return () => clearTimeout(t);
  }, [sichtbar, werte.marke, werte.artikelnr, werte.bezeichnung]);

  const schliessen = (bestaetigt = false) => {
    if (befuellt && !bestaetigt) {
      setFragen(true);
      return;
    }
    setFragen(false);
    setOffen(false);
    setWerte(LEER);
    setFehler({});
    setDublette([]);
    if (perUrl) {
      const p = new URLSearchParams(sp.toString());
      p.delete("neu");
      router.replace(p.size ? `${pfad}?${p}` : pfad, { scroll: false });
    }
  };

  const setze = (k) => (e) => setWerte((w) => ({ ...w, [k]: e.target.value }));

  async function anlegen(oeffnen) {
    const f = {};
    if (!werte.marke) f.marke = SCHNELLANLAGE.pflicht;
    if (!werte.kategorie) f.kategorie = SCHNELLANLAGE.pflicht;
    if (!werte.bezeichnung.trim()) f.bezeichnung = SCHNELLANLAGE.pflicht;
    if (!eanGueltig(werte.ean)) f.ean = SCHNELLANLAGE.eanFalsch;
    setFehler(f);
    if (Object.keys(f).length) {
      document.getElementById(`sa-${Object.keys(f)[0]}`)?.focus();
      return;
    }
    setLaeuft(true);
    const r = await produktAnlegenAction(werte);
    setLaeuft(false);
    if (!r?.ok) {
      if (r?.fehler) setFehler(r.fehler);
      zeige(r?.code === "conflict" ? SCHNELLANLAGE.gibtEsSchon : r?.message || "Nicht angelegt.", { art: "warnung" });
      return;
    }
    zeige(SCHNELLANLAGE.angelegt(r.titel), { art: "ok", aktion: oeffnen ? undefined : { titel: SCHNELLANLAGE.oeffnen, onClick: () => router.push(`/sortiment/produkte/${encodeURIComponent(r.name)}`) } });
    setWerte(LEER);
    setOffen(false);
    if (oeffnen) router.push(`/sortiment/produkte/${encodeURIComponent(r.name)}`);
    else schliessen(true);
    router.refresh();
  }

  const markenOptionen = useMemo(() => marken.filter((m) => m.status !== "Inaktiv"), [marken]);

  return (
    <>
      {knopf && (
        <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} data-testid="produkt-neu">
          {`${SCHNELLANLAGE.titel.replace("Neues ", "")}`}
        </Knopf>
      )}
      <Dialog
        offen={sichtbar}
        onSchliessen={() => schliessen(false)}
        titel={SCHNELLANLAGE.titel}
        groesse="md"
        sperren={laeuft}
        testid="schnellanlage"
        fuss={
          fragen ? (
            <>
              <span className="mr-auto self-center text-[14px] font-medium">{SCHNELLANLAGE.verwerfen}</span>
              <Knopf variant="secondary" onClick={() => setFragen(false)}>
                Weiter bearbeiten
              </Knopf>
              <Knopf variant="danger" onClick={() => schliessen(true)}>
                Verwerfen
              </Knopf>
            </>
          ) : (
            <>
              <Knopf variant="ghost" onClick={() => schliessen(false)}>
                {SCHNELLANLAGE.abbrechen}
              </Knopf>
              <Knopf variant="secondary" onClick={() => anlegen(false)} laedt={laeuft}>
                {SCHNELLANLAGE.anlegen}
              </Knopf>
              <Knopf variant="primary" onClick={() => anlegen(true)} laedt={laeuft} kuerzel="Strg+Enter" data-testid="schnellanlage-oeffnen">
                {SCHNELLANLAGE.anlegenOeffnen}
              </Knopf>
            </>
          )
        }
      >
        <form
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            anlegen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              anlegen(true);
            }
          }}
        >
          <Feld id="sa-marke" label={SCHNELLANLAGE.marke} fehler={fehler.marke} hinweis={marke ? `${anzeigeWert("haendlerstatus", marke.haendlerstatus)} · ${anzeigeWert("markeStatus", marke.status)}${marke.status !== "Aktiv" ? ` – ${SCHNELLANLAGE.markeNichtAktiv}` : ""}` : null}>
            <select ref={erstes} id="sa-marke" className="bo-sor-eingabe" value={werte.marke} onChange={setze("marke")} aria-invalid={fehler.marke ? "true" : undefined} required>
              <option value="">{SCHNELLANLAGE.waehlen}</option>
              {markenOptionen.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </Feld>
          <Feld id="sa-kategorie" label={SCHNELLANLAGE.kategorie} fehler={fehler.kategorie} hinweis={kategorie ? (ustSatz(kategorie.ust_klasse) === null ? SCHNELLANLAGE.ustFehlt : `USt ${ustSatz(kategorie.ust_klasse)} % · Grundpreis ${kategorie.grundpreis_pflicht ? "Pflicht" : "nein"}`) : null}>
            <select id="sa-kategorie" className="bo-sor-eingabe" value={werte.kategorie} onChange={setze("kategorie")} aria-invalid={fehler.kategorie ? "true" : undefined} required>
              <option value="">{SCHNELLANLAGE.waehlen}</option>
              {kategorien.filter((k) => k.status !== "Inaktiv").map((k) => (
                <option key={k.name} value={k.name}>
                  {k.label_de || k.name}
                </option>
              ))}
            </select>
          </Feld>
          <Feld id="sa-bezeichnung" label={SCHNELLANLAGE.bezeichnung} fehler={fehler.bezeichnung}>
            <input id="sa-bezeichnung" className="bo-sor-eingabe" value={werte.bezeichnung} onChange={setze("bezeichnung")} maxLength={140} autoComplete="off" aria-invalid={fehler.bezeichnung ? "true" : undefined} required />
          </Feld>
          <Feld id="sa-artikelnr" label={SCHNELLANLAGE.artikelnr}>
            <input id="sa-artikelnr" className="bo-sor-eingabe" value={werte.artikelnr} onChange={setze("artikelnr")} maxLength={60} autoComplete="off" />
          </Feld>
          {dublette.length > 0 && (
            <p className="flex items-start gap-2 rounded-[14px] bg-bo-fill px-3 py-2.5 text-[14px]" role="status">
              <Info className="mt-0.5 size-4 shrink-0 text-bo-text-soft" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {SCHNELLANLAGE.dublette}{" "}
                {dublette.map((d, i) => (
                  <span key={d.name}>
                    {i > 0 && ", "}
                    <Link className="font-medium underline underline-offset-2" href={`/sortiment/produkte/${encodeURIComponent(d.name)}`}>
                      {d.marke} {d.titel}
                    </Link>{" "}
                    ({anzeigeWert("produktStatus", d.status)})
                  </span>
                ))}
              </span>
            </p>
          )}
          <details className="group rounded-[16px] bg-bo-fill px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-medium text-bo-text-soft">{SCHNELLANLAGE.weitere}</summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Feld id="sa-ean" label={SCHNELLANLAGE.ean} fehler={fehler.ean}>
                <input id="sa-ean" className="bo-sor-eingabe" inputMode="numeric" value={werte.ean} onChange={setze("ean")} maxLength={14} aria-invalid={fehler.ean ? "true" : undefined} />
              </Feld>
              <Feld id="sa-collection" label={SCHNELLANLAGE.collection}>
                <input id="sa-collection" className="bo-sor-eingabe" value={werte.collection} onChange={setze("collection")} maxLength={140} />
              </Feld>
              <Feld id="sa-serie" label={SCHNELLANLAGE.serie}>
                <input id="sa-serie" className="bo-sor-eingabe" value={werte.serie} onChange={setze("serie")} maxLength={140} />
              </Feld>
              <Feld id="sa-designer" label={SCHNELLANLAGE.designer}>
                <input id="sa-designer" className="bo-sor-eingabe" value={werte.designer} onChange={setze("designer")} maxLength={140} />
              </Feld>
            </div>
          </details>
          <p className="bo-sor-klein">
            {SCHNELLANLAGE.webAdresse}: <span className="font-medium text-bo-text">{adresse || "–"}</span>
          </p>
          <button type="submit" className="sr-only" tabIndex={-1}>
            {SCHNELLANLAGE.anlegenOeffnen}
          </button>
        </form>
      </Dialog>
    </>
  );
}

function Feld({ id, label, fehler, hinweis, children }) {
  return (
    <div className="bo-sor-feld">
      <label htmlFor={id}>
        {label}
        {[SCHNELLANLAGE.marke, SCHNELLANLAGE.kategorie, SCHNELLANLAGE.bezeichnung].includes(label) && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {fehler ? <span className="bo-sor-feld__fehler">{fehler}</span> : hinweis ? <span className="bo-sor-feld__hinweis">{hinweis}</span> : null}
    </div>
  );
}
