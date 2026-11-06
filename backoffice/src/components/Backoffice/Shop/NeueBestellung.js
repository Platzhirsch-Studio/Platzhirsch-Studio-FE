"use client";
// Dialog „Neue Bestellung“ (10-konzept-shop § 4.3, lg 800): Segment Telefon | Showroom-Reservierung, Kunde
// (Suche PH Kontakt + Mini-Formular, E-Mail-Tipp), Positionen aus dem Sortiment (Preis gesperrt), Lieferung,
// Versand-Pauschale, Live-Summe. Senden immer mit senden=0 – Zahlungslink bzw. Bestätigung als Undo 8 s danach.
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/Backoffice/Overlay";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import Bestaetigen from "@/components/Backoffice/Bestaetigen";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useToast } from "@/components/Backoffice/Toast";
import { cent } from "@/lib/backoffice/format";
import { emailTipp } from "@/lib/backoffice/shop/emailTipp";
import { ustAusBrutto } from "@/lib/backoffice/shop/geld";
import { T } from "@/lib/backoffice/shop/texte";
import { bestellungAnlegenAction, kontaktSucheAction, produktSucheAction } from "@/lib/backoffice/shop/actions";
import { idem, Thumb } from "./Dialoge";
import ShopIcon from "./ShopIcon";

function useSuche(fn, q, min = 1) {
  const [treffer, setTreffer] = useState([]);
  const [fehler, setFehler] = useState(null);
  const [laedt, start] = useTransition();
  const zuKurz = q.trim().length < min;
  useEffect(() => {
    if (zuKurz) return;
    const t = setTimeout(() => start(async () => {
      const r = await fn({ q });
      if (r.ok) {
        setTreffer(r.ergebnis);
        setFehler(null);
      } else setFehler(r.message);
    }), 250);
    return () => clearTimeout(t);
  }, [q, fn, zuKurz]);
  return { treffer: zuKurz ? [] : treffer, fehler, laedt };
}

/**
 * @param {{modus:"telefon"|"showroom", basis:string, einstellungen:{versand_pauschale_at_cent:number, versand_pauschale_de_cent:number, versand_frei_ab_cent:number, reservierung_frist_tage:number}, leitung:boolean}} p
 */
export default function NeueBestellung({ modus: start = "telefon", basis = "/shop/bestellungen", einstellungen = {}, leitung = false }) {
  const router = useRouter();
  const { starte } = useVerzoegerterCommit();
  const { zeige } = useToast();
  const [modus, setModus] = useState(start === "showroom" ? "showroom" : "telefon");
  const [kunde, setKunde] = useState(null);
  const [neuKunde, setNeuKunde] = useState(false);
  const [kq, setKq] = useState("");
  const [nk, setNk] = useState({ name: "", email: "", telefon: "" });
  const [pq, setPq] = useState("");
  const [pos, setPos] = useState([]);
  const [lieferart, setLieferart] = useState("versand");
  const [adr, setAdr] = useState({ strasse: "", hausnr: "", plz: "", ort: "", land: "AT" });
  const [notiz, setNotiz] = useState("");
  const [intern, setIntern] = useState("");
  const [fehler, setFehler] = useState({});
  const [allg, setAllg] = useState(null);
  const [laeuft, startSenden] = useTransition();
  const [verwerfen, setVerwerfen] = useState(false);
  const schluessel = useMemo(() => idem(), []);
  const id = useId();
  const kontakte = useSuche(kontaktSucheAction, kq, 2);
  const produkte = useSuche(produktSucheAction, pq, 1);
  const showroom = modus === "showroom";
  const la = showroom ? "abholung" : lieferart;
  const k = neuKunde ? { ...nk, kontakt: "" } : kunde;
  const mailTipp = k?.email ? emailTipp(k.email) : null;
  const waren = pos.reduce((s, p) => s + p.preis_cent * p.menge, 0);
  const versand = la === "versand" ? (waren >= Number(einstellungen.versand_frei_ab_cent || Infinity) ? 0 : adr.land === "DE" ? Number(einstellungen.versand_pauschale_de_cent || 0) : Number(einstellungen.versand_pauschale_at_cent || 0)) : 0;
  const summe = waren + versand;
  const geaendert = !!(kunde || nk.name || pos.length || notiz);
  const schliessen = () => (geaendert ? setVerwerfen(true) : router.replace(basis, { scroll: false }));
  const wahlKunde = (t) => {
    setKunde({ name: t.anzeige, email: t.email, telefon: t.telefon, kontakt: t.name });
    setAdr((a) => ({ ...a, strasse: t.strasse || a.strasse, plz: t.plz || a.plz, ort: t.ort || a.ort }));
    setKq("");
  };
  const wahlProdukt = (p) => {
    if (p.aufAnfrage && !leitung) return setAllg("Preis auf Anfrage – Leitung fragen.");
    setPos((alt) => (alt.some((x) => x.produkt === p.name) ? alt.map((x) => (x.produkt === p.name ? { ...x, menge: x.menge + 1 } : x)) : [...alt, { produkt: p.name, bezeichnung: p.titel, marke: p.marke, preis_cent: p.preis_cent, menge: 1, bild: p.bild, slug: p.slug }]));
    setPq("");
  };
  const senden = () =>
    startSenden(async () => {
      setFehler({});
      setAllg(null);
      const r = await bestellungAnlegenAction({ modus, kunde: k, positionen: pos.map((p) => ({ produkt: p.produkt, bezeichnung: p.bezeichnung, marke: p.marke, menge: p.menge, einzel_cent: p.preis_cent, bild: p.bild, slug: p.slug })), lieferart: la, adresse: adr, versand_cent: versand, notiz_kunde: notiz, notiz_intern: intern, idempotency: schluessel });
      if (!r.ok) {
        setFehler(r.fehler || {});
        setAllg(r.message);
        return;
      }
      if (r.commit) starte(r.commit.text, { token: r.commit.token, ms: r.commit.ms, objekt: r.commit.objekt, gruppe: "shop.neu", fehlerText: `Senden ${r.ergebnis.name}`, onVerworfen: () => zeige(T.toast.nichtsGesendet, { art: "info" }) });
      router.push(`/shop/bestellungen/${encodeURIComponent(r.ergebnis.name)}`);
    });
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        senden();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  const ohneEmail = (neuKunde && nk.name && !nk.email) || (kunde && !kunde.email);
  return (
    <>
      <Dialog offen titel={showroom ? T.dialoge.neuShowroom : T.dialoge.neuTelefon} groesse="lg" onSchliessen={schliessen} testid="dialog-neu"
        kopf={<Segment label="Art" wert={modus} onWechsel={setModus} groesse="s" optionen={[{ wert: "telefon", titel: "Telefon" }, { wert: "showroom", titel: "Showroom-Reservierung" }]} />}
        fuss={
          <div className="flex w-full flex-col gap-2">
            {k?.email && <p className="text-[13px] text-bo-text-soft">{showroom ? "Reservierungsbestätigung" : "Zahlungslink und Bestätigung"} gehen an <strong className="text-bo-text">{k.email}</strong></p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Knopf variant="ghost" onClick={schliessen} disabled={laeuft}>Abbrechen</Knopf>
              <Knopf variant="primary" onClick={senden} laedt={laeuft} disabled={!k?.name || !k?.email || !pos.length} kuerzel="Strg+Enter" data-testid="neu-senden">{showroom ? "Reservieren" : "Anlegen und Link senden"}</Knopf>
            </div>
          </div>
        }>
        <div className="flex flex-col gap-5">
          <p className="text-[13px] text-bo-text-soft">{T.erstbesuch.neu}</p>
          {/* Kunde */}
          <div className="bo-shop-feld">
            <span className="bo-shop-label">Kunde *</span>
            {k && !neuKunde ? (
              <div className="bo-shop-flaeche flex items-center justify-between gap-3">
                <span className="min-w-0"><strong className="block truncate">{k.name}</strong><span className="bo-shop-unter">{[k.email || "keine E-Mail", k.telefon].filter(Boolean).join(" · ")}</span></span>
                <Knopf size="s" variant="ghost" onClick={() => setKunde(null)}>Ändern</Knopf>
              </div>
            ) : neuKunde ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input className="bo-shop-input" placeholder="Vor- und Nachname" aria-label="Name" value={nk.name} onChange={(e) => setNk({ ...nk, name: e.target.value })} />
                <input className="bo-shop-input" placeholder="E-Mail" aria-label="E-Mail" type="email" value={nk.email} onChange={(e) => setNk({ ...nk, email: e.target.value })} aria-invalid={fehler.email ? "true" : undefined} data-testid="neu-email" />
                <input className="bo-shop-input" placeholder="Telefon" aria-label="Telefon" value={nk.telefon} onChange={(e) => setNk({ ...nk, telefon: e.target.value })} />
              </div>
            ) : (
              <div className="flex gap-2">
                <input id={`${id}-k`} className="bo-shop-input" placeholder="Name, E-Mail, Telefon …" aria-label="Kunde suchen" value={kq} onChange={(e) => setKq(e.target.value)} autoComplete="off" data-testid="neu-kunde" />
                <Knopf onClick={() => setNeuKunde(true)} icon="UserPlus">Neu</Knopf>
              </div>
            )}
            {!k && kontakte.treffer.length > 0 && (
              <div className="bo-shop-treffer" role="listbox" aria-label="Kontakte">
                {kontakte.treffer.map((t) => (
                  <button key={t.name} type="button" role="option" aria-selected="false" onClick={() => wahlKunde(t)}>
                    <ShopIcon name="User" /><span className="min-w-0 flex-1 truncate">{t.anzeige}</span><span className="text-[12px] text-bo-text-soft">{t.email || "ohne E-Mail"}</span>
                  </button>
                ))}
              </div>
            )}
            {mailTipp?.vorschlag && (
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-bo-eiche-text" role="status" data-testid="email-tipp">
                <ShopIcon name="TriangleAlert" /> Meinten Sie {mailTipp.vorschlag.split("@")[1]}?
                <Knopf size="s" variant="ghost" onClick={() => (neuKunde ? setNk({ ...nk, email: mailTipp.vorschlag }) : setKunde({ ...kunde, email: mailTipp.vorschlag }))}>Übernehmen</Knopf>
              </p>
            )}
            {(ohneEmail || fehler.email) && (
              <div className="bo-shop-flaeche flex flex-col gap-2" data-ton="warn" role="alert" data-testid="ohne-email">
                <p>{fehler.email && fehler.email !== T.dialoge.ohneEmailFehler ? fehler.email : T.dialoge.ohneEmailFehler}</p>
                <span className="flex flex-wrap gap-2">
                  <Knopf size="s" href="/kassa">An der Kassa direkt verkaufen</Knopf>
                  <Knopf size="s" variant="ghost" href="/shop/bestellungen">Leitung fragen</Knopf>
                </span>
              </div>
            )}
            {fehler.kunde && <p className="bo-shop-fehler">{fehler.kunde}</p>}
          </div>

          {/* Lieferung */}
          {!showroom ? (
            <div className="bo-shop-feld">
              <span className="bo-shop-label">Lieferung</span>
              <Segment label="Lieferung" wert={lieferart} onWechsel={setLieferart} groesse="s" optionen={[{ wert: "versand", titel: "Versand" }, { wert: "abholung", titel: "Abholung" }]} />
              {lieferart === "versand" && (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-6">
                  <input className="bo-shop-input sm:col-span-3" placeholder="Straße" aria-label="Straße" value={adr.strasse} onChange={(e) => setAdr({ ...adr, strasse: e.target.value })} />
                  <input className="bo-shop-input" placeholder="Nr." aria-label="Hausnummer" value={adr.hausnr} onChange={(e) => setAdr({ ...adr, hausnr: e.target.value })} />
                  <input className="bo-shop-input" placeholder="PLZ" aria-label="PLZ" value={adr.plz} onChange={(e) => setAdr({ ...adr, plz: e.target.value })} />
                  <select className="bo-shop-input" aria-label="Land" value={adr.land} onChange={(e) => setAdr({ ...adr, land: e.target.value })}>
                    <option value="AT">Österreich</option><option value="DE">Deutschland</option><option value="CH">Schweiz</option>
                  </select>
                  <input className="bo-shop-input col-span-2 sm:col-span-6" placeholder="Ort" aria-label="Ort" value={adr.ort} onChange={(e) => setAdr({ ...adr, ort: e.target.value })} />
                </div>
              )}
              {adr.land === "CH" && lieferart === "versand" && <p className="bo-shop-fehler">Versand in die Schweiz wird nicht angeboten – Abholung möglich.</p>}
              {fehler.adresse && <p className="bo-shop-fehler">{fehler.adresse}</p>}
            </div>
          ) : (
            <p className="bo-shop-flaeche text-[14px]">Abholung im Showroom · reserviert bis {einstellungen.reservierung_frist_tage || 14} Tage nach Anlage · Zahlung an der Kassa.</p>
          )}

          {/* Positionen */}
          <div className="bo-shop-feld">
            <span className="bo-shop-label">Positionen *</span>
            {pos.map((p, i) => (
              <div key={p.produkt} className="flex items-center gap-3" data-testid="neu-position">
                <Thumb bild={p.bild} />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.bezeichnung}</span><span className="bo-shop-unter">{p.marke} · <ShopIcon name="Lock" className="inline size-3" /> Preis aus Sortiment</span></span>
                <span className="bo-shop-stepper" role="group" aria-label={`Menge ${p.bezeichnung}`}>
                  <button type="button" aria-label="weniger" onClick={() => setPos((a) => a.map((x, j) => (j === i ? { ...x, menge: Math.max(1, x.menge - 1) } : x)))}><ShopIcon name="Minus" /></button>
                  <output>{p.menge}</output>
                  <button type="button" aria-label="mehr" onClick={() => setPos((a) => a.map((x, j) => (j === i ? { ...x, menge: x.menge + 1 } : x)))}><ShopIcon name="Plus" /></button>
                </span>
                <span className="bo-shop-betrag w-24">{cent(p.preis_cent * p.menge)}</span>
                <Knopf size="s" variant="ghost" icon="X" label={`${p.bezeichnung} entfernen`} onClick={() => setPos((a) => a.filter((_, j) => j !== i))} />
              </div>
            ))}
            <input className="bo-shop-input" placeholder="Produkt, Marke, EAN …" aria-label="Produkt suchen" value={pq} onChange={(e) => setPq(e.target.value)} autoComplete="off" data-testid="neu-produkt"
              onKeyDown={(e) => { if (e.key === "Enter" && !(e.metaKey || e.ctrlKey) && produkte.treffer[0]) { e.preventDefault(); wahlProdukt(produkte.treffer[0]); } }} />
            {produkte.fehler && <p className="bo-shop-fehler">Produktsuche nicht verfügbar – Eingaben bleiben.</p>}
            {pq && !produkte.laedt && !produkte.treffer.length && <p className="bo-shop-hinweis">Kein Produkt gefunden.</p>}
            {produkte.treffer.length > 0 && (
              <div className="bo-shop-treffer" role="listbox" aria-label="Produkte">
                {produkte.treffer.map((p) => (
                  <button key={p.name} type="button" role="option" aria-selected="false" onClick={() => wahlProdukt(p)}>
                    <Thumb bild={p.bild} klein /><span className="min-w-0 flex-1 truncate">{p.titel} <span className="text-bo-text-soft">· {p.marke}</span></span>
                    <span className="tabular-nums">{p.aufAnfrage ? "auf Anfrage" : cent(p.preis_cent)}</span>
                  </button>
                ))}
              </div>
            )}
            {fehler.positionen && <p className="bo-shop-fehler">{fehler.positionen}</p>}
          </div>

          <div className="bo-shop-flaeche flex flex-wrap items-baseline justify-between gap-3" aria-live="polite">
            <span className="text-[14px] text-bo-text-soft">{la === "versand" ? `Versand ${versand ? cent(versand) : "frei"} (Pauschale ${adr.land})` : "Abholung"}</span>
            <span className="text-[17px] font-semibold tabular-nums">Summe {cent(summe)} <span className="text-[13px] font-normal text-bo-text-soft">· enth. USt {cent(ustAusBrutto(summe, 2000))} (20 %)</span></span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="bo-shop-feld"><span className="bo-shop-label">Notiz an Kunden</span><textarea className="bo-shop-input" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} maxLength={500} /></label>
            <label className="bo-shop-feld"><span className="bo-shop-label">Interne Notiz</span><textarea className="bo-shop-input" rows={2} value={intern} onChange={(e) => setIntern(e.target.value)} maxLength={1000} /></label>
          </div>
          {allg && <p className="bo-shop-fehler" role="alert">{allg}</p>}
        </div>
      </Dialog>
      <Bestaetigen offen={verwerfen} titel="Entwurf verwerfen?" text="Die Eingaben gehen verloren." bestaetigen="Verwerfen" gefaehrlich onAbbrechen={() => setVerwerfen(false)} onBestaetigen={() => router.replace(basis, { scroll: false })} />
    </>
  );
}
