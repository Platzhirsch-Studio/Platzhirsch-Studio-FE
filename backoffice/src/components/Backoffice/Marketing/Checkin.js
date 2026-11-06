"use client";
// Event-Check-in am Eingang (10-konzept-marketing § 7.1, Kiosk): Suche filtert ab dem ersten Zeichen (lokale Liste),
// „Da“ lässt die Zeile an ihrer Stelle stehen („Da · 18:04“, linker Salbei-Balken, Knopf wird „Rückgängig“),
// Suchfeld wird geleert und fokussiert; neu sortiert erst bei leerer Suche nach 10 s Ruhe – ohne Animation.
// Verzögerter Commit (Kiosk 6 s). Code scannen (Fähigkeit S4), Gast ohne Anmeldung (Zähler, beim „Fertig“ als
// Kommentar), Personen … (Stepper), Offline-Hinweis, Dimmen nach 5 min, „Fertig“ fragt nach Nicht-Erschienenen.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ScanLine, UserPlus, Check } from "lucide-react";
import KioskShell from "../Kiosk/KioskShell";
import Knopf from "../Knopf";
import { Dialog } from "../Overlay";
import KameraScan from "../Eingabe/KameraScan";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { checkinFertigAction, codeEincheckenAction, eincheckenAction } from "@/lib/backoffice/marketing/actions";
import { checkinListe, checkinSuche, personenVon, uhrzeit } from "@/lib/backoffice/marketing/regeln";
import { CHECKIN } from "@/lib/backoffice/marketing/texte";
import "./marketing.css";

const jetztZeit = () => new Date().toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });

export default function Checkin({ ev, geraet, benutzer, codeFaehig, heute }) {
  const router = useRouter();
  const [zeilen, setZeilen] = useState(() => checkinListe(ev.anmeldungen || []));
  const [lokal, setLokal] = useState({}); // name → { status, zeit, vorgang }
  const [q, setQ] = useState("");
  const [gaeste, setGaeste] = useState(0);
  const [fertig, setFertig] = useState(false);
  const [personen, setPersonen] = useState(null);
  const [kamera, setKamera] = useState(false);
  const [dimmen, setDimmen] = useState(false);
  const suche = useRef(null);
  const ruhe = useRef(null);
  const dimm = useRef(null);

  const ansicht = useMemo(() => checkinSuche(zeilen, q).map((z) => ({ ...z, ...(lokal[z.name] || {}) })), [zeilen, q, lokal]);
  const istDa = (z) => z.status === "erschienen" || lokal[z.name]?.status === "erschienen";
  const daPersonen = zeilen.reduce((s, z) => s + (istDa(z) ? personenVon({ personen: lokal[z.name]?.personen || z.personen }) : 0), 0);
  const gesamt = zeilen.reduce((s, z) => s + personenVon(z), 0);

  // Neu sortieren erst, wenn die Suche leer ist und die Liste 10 s ruht (ohne Animation).
  const ruheStarten = useCallback(() => {
    clearTimeout(ruhe.current);
    ruhe.current = setTimeout(() => setZeilen((alt) => checkinListe(alt.map((z) => (lokal[z.name]?.status ? { ...z, status: lokal[z.name].status, erschienen_am: lokal[z.name].zeit || z.erschienen_am } : z)))), 10_000);
  }, [lokal]);
  useEffect(() => () => clearTimeout(ruhe.current), []);

  // Dimmen nach 5 min ohne Eingabe (40 %), ein Tipp weckt ohne PIN.
  useEffect(() => {
    const wecke = () => {
      setDimmen(false);
      clearTimeout(dimm.current);
      dimm.current = setTimeout(() => setDimmen(true), 5 * 60_000);
    };
    wecke();
    for (const e of ["pointerdown", "keydown"]) window.addEventListener(e, wecke);
    return () => {
      clearTimeout(dimm.current);
      for (const e of ["pointerdown", "keydown"]) window.removeEventListener(e, wecke);
    };
  }, []);

  return (
    <KioskShell
      titel={`${ev.titel} · ${uhrzeit(ev.uhrzeit_von) || ""}`}
      geraet={geraet}
      benutzer={benutzer}
      kontext="Event-Check-in"
      idleMs={heute ? 0 : 15 * 60_000}
      zurueckHref={`/marketing/events/${encodeURIComponent(ev.name)}?tab=anmeldungen`}
      toastAnker="oben-mitte"
      kopfSlot={<span className="bo-mar-checkin__zaehler" data-testid="checkin-zaehler" aria-live="off">{CHECKIN.zaehler(daPersonen, gesamt)}</span>}
    >
      <CheckinInhalt
        ev={ev}
        ansicht={ansicht}
        q={q}
        setQ={(v) => {
          setQ(v);
          if (!v) ruheStarten();
        }}
        suche={suche}
        lokal={lokal}
        setLokal={setLokal}
        istDa={istDa}
        gaeste={gaeste}
        setGaeste={setGaeste}
        codeFaehig={codeFaehig}
        setKamera={setKamera}
        setPersonen={setPersonen}
        setFertig={setFertig}
        ruheStarten={ruheStarten}
        dimmen={dimmen}
      />
      {kamera && <ScanDialog ev={ev} onSchliessen={() => setKamera(false)} onErgebnis={(r) => r?.zeile && setLokal((l) => ({ ...l, [r.zeile]: { status: "erschienen", zeit: jetztZeit() } }))} />}
      {personen && <PersonenDialog zeile={personen} onSchliessen={() => setPersonen(null)} onWahl={(n) => setLokal((l) => ({ ...l, [personen.name]: { ...(l[personen.name] || {}), personen: n } }))} />}
      {fertig && <FertigDialog ev={ev} zeilen={zeilen} istDa={istDa} daPersonen={daPersonen} gesamt={gesamt} gaeste={gaeste} onSchliessen={() => setFertig(false)} onFertig={() => router.push(`/marketing/events/${encodeURIComponent(ev.name)}?tab=anmeldungen`)} />}
    </KioskShell>
  );
}

function CheckinInhalt({ ev, ansicht, q, setQ, suche, lokal, setLokal, istDa, gaeste, setGaeste, codeFaehig, setKamera, setPersonen, setFertig, ruheStarten, dimmen }) {
  const { starte, rueckgaengig } = useVerzoegerterCommit();
  const { zeige } = useToast();
  const [sperre, setSperre] = useState(null);

  const da = async (z) => {
    if (sperre === z.name) return;
    setSperre(z.name);
    setTimeout(() => setSperre(null), 300); // Ghost-Tap-Schutz (Q-J5)
    const r = await eincheckenAction({ event: ev.name, zeile: z.name, personen: lokal[z.name]?.personen });
    if (!r?.ok) {
      if (r?.code === "conflict") setLokal((l) => ({ ...l, [z.name]: { status: "erschienen", zeit: String(r.erschienen_am || "").slice(11, 16), fremd: true } }));
      else zeige(r?.message || CHECKIN.ungueltig, { art: "fehler" });
      return;
    }
    const zeit = jetztZeit();
    const id = starte(`${z.name_person}: ${CHECKIN.da}`, {
      token: r.token,
      ms: r.ms,
      objekt: r.objekt,
      gruppe: "marketing.checkin",
      sammel: (n) => `${n} Gäste eingecheckt`,
      fehlerText: `Check-in ${z.name_person}`,
      onVerworfen: () => setLokal((l) => ({ ...l, [z.name]: { ...(l[z.name] || {}), status: undefined, zeit: undefined, vorgang: undefined } })),
      onFehler: () => setLokal((l) => ({ ...l, [z.name]: { ...(l[z.name] || {}), status: undefined, vorgang: undefined } })),
    });
    setLokal((l) => ({ ...l, [z.name]: { ...(l[z.name] || {}), status: "erschienen", zeit, vorgang: id } }));
    setQ("");
    suche.current?.focus();
    ruheStarten();
  };

  useKuerzel("kiosk-mobil@marketing", {
    "marketing.checkin-suche": () => suche.current?.focus(),
    "marketing.checkin-code": () => codeFaehig && setKamera(true),
    "marketing.checkin-gast": () => setGaeste((g) => g + 1),
  });

  return (
    <div className="bo-mar-checkin" data-dimmen={dimmen ? "true" : undefined} data-testid="checkin">
      <h1 className="sr-only">{CHECKIN.titel}: {ev.titel}</h1>
      <div className="bo-mar-checkin__werkzeuge">
        <label className="bo-mar-checkin__suche">
          <Search className="size-6 shrink-0 text-(--color-bo-text-soft)" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{CHECKIN.suche}</span>
          <input
            ref={suche}
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ansicht[0] && !istDa(ansicht[0])) {
                e.preventDefault();
                da(ansicht[0]);
              }
            }}
            placeholder={CHECKIN.suche}
            data-testid="checkin-suche"
            data-scan="nein"
          />
        </label>
        {codeFaehig && (
          <button type="button" className="bo-knopf bo-knopf--secondary inline-flex min-h-16 items-center gap-2 rounded-full px-6 text-[17px]" onClick={() => setKamera(true)} data-testid="code-scannen">
            <ScanLine className="size-5" strokeWidth={1.75} aria-hidden="true" />
            {CHECKIN.codeScannen}
          </button>
        )}
        <button type="button" className="bo-knopf bo-knopf--secondary inline-flex min-h-16 items-center gap-2 rounded-full px-6 text-[17px]" onClick={() => setGaeste((g) => g + 1)} data-testid="gast-ohne">
          <UserPlus className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {CHECKIN.gastOhne(gaeste)}
        </button>
      </div>
      {ansicht.length === 0 ? (
        <p className="rounded-[20px] bg-(--color-bo-surface-2) p-6 text-[17px]">{CHECKIN.keinTreffer}</p>
      ) : (
        <ul className="bo-mar-checkin__liste" data-testid="checkin-liste">
          {ansicht.map((z) => {
            const daJetzt = istDa(z);
            const zeit = lokal[z.name]?.zeit || String(z.erschienen_am || "").slice(11, 16);
            const p = personenVon({ personen: lokal[z.name]?.personen || z.personen });
            return (
              <li key={z.name} className="bo-mar-checkin__zeile" data-da={daJetzt ? "true" : undefined} data-testid="checkin-zeile">
                <button type="button" className="min-w-0 text-left" onClick={() => !daJetzt && setPersonen(z)} aria-label={`${z.name_person}, ${p} ${p === 1 ? "Person" : "Personen"}${daJetzt ? "" : " – Personen ändern"}`}>
                  <span className="bo-mar-checkin__name block">{z.name_person}</span>
                  <span className="bo-mar-checkin__neben block">
                    {p} {p === 1 ? "Person" : "Personen"}
                    {z.nachricht ? ` · „${z.nachricht}“` : ""}
                    {daJetzt ? ` · ${lokal[z.name]?.fremd ? CHECKIN.schonDa(zeit) : CHECKIN.daSeit(zeit)}` : ""}
                  </span>
                </button>
                {daJetzt ? (
                  lokal[z.name]?.vorgang ? (
                    <button type="button" className="bo-mar-checkin__da" data-art="rueck" onClick={() => rueckgaengig(lokal[z.name].vorgang)} data-testid="checkin-rueckgaengig">
                      {CHECKIN.rueckgaengig}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 text-[17px] font-semibold text-(--color-bo-salbei-text)">
                      <Check className="size-5" aria-hidden="true" />
                      {CHECKIN.da}
                    </span>
                  )
                ) : (
                  <button type="button" className="bo-mar-checkin__da" onClick={() => da(z)} data-testid="checkin-da">
                    <Check className="size-5" strokeWidth={2} aria-hidden="true" />
                    {CHECKIN.da}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="bo-mar-unter text-[15px]">{CHECKIN.wartelisteAbgesagt((ev.anmeldungen || []).filter((a) => a.status === "warteliste").length, (ev.anmeldungen || []).filter((a) => a.status === "abgesagt").length)}</span>
        <Knopf size="kiosk" variant="primary" onClick={() => setFertig(true)} data-testid="checkin-fertig">
          {CHECKIN.fertig}
        </Knopf>
      </div>
    </div>
  );
}

function PersonenDialog({ zeile, onSchliessen, onWahl }) {
  const [n, setN] = useState(personenVon(zeile));
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={CHECKIN.personenTitel(zeile.name_person)} groesse="sm" fuss={<><Knopf size="kiosk" onClick={onSchliessen}>Abbrechen</Knopf><Knopf size="kiosk" variant="primary" onClick={() => { onWahl(n); onSchliessen(); }}>Übernehmen</Knopf></>}>
      <div className="flex items-center justify-center gap-6 py-4">
        <Knopf size="kiosk" icon="Minus" label="Weniger" onClick={() => setN(Math.max(1, n - 1))} />
        <span className="min-w-12 text-center text-[32px] font-semibold tabular-nums">{n}</span>
        <Knopf size="kiosk" icon="Plus" label="Mehr" onClick={() => setN(Math.min(personenVon(zeile), n + 1))} />
      </div>
    </Dialog>
  );
}

function ScanDialog({ ev, onSchliessen, onErgebnis }) {
  const { zeige } = useToast();
  return (
    <KameraScan
      offen
      onSchliessen={onSchliessen}
      onScan={async (code) => {
        const r = await codeEincheckenAction({ event: ev.name, code });
        if (r?.status === "ok") {
          zeige(`${r.name}: ${CHECKIN.da}`, { art: "ok" });
          onErgebnis(r);
        } else if (r?.status === "bereits") zeige(CHECKIN.schonDa(String(r.erschienen_am || "").slice(11, 16)), { art: "info" });
        else zeige(CHECKIN.ungueltig, { art: "warnung" });
        onSchliessen();
      }}
    />
  );
}

function FertigDialog({ ev, zeilen, istDa, daPersonen, gesamt, gaeste, onSchliessen, onFertig }) {
  const offen = zeilen.filter((z) => !istDa(z));
  const { zeige } = useToast();
  const { flush } = useVerzoegerterCommit();
  const [laeuft, setLaeuft] = useState(false);
  const los = async (markieren) => {
    setLaeuft(true);
    await flush();
    const r = await checkinFertigAction({ event: ev.name, nichtErschienen: markieren ? offen.map((z) => z.name) : [], ohneAnmeldung: gaeste });
    setLaeuft(false);
    if (!r?.ok) return zeige(r?.message || "Nicht gespeichert.", { art: "fehler" });
    onFertig();
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={CHECKIN.fertigTitel(daPersonen, gesamt)}
      text={offen.length ? CHECKIN.fertigFrage(offen.length) : CHECKIN.fertigToast}
      groesse="sm"
      testid="checkin-fertig-dialog"
      fuss={
        <>
          <Knopf size="kiosk" onClick={() => los(false)} disabled={laeuft}>
            {CHECKIN.offenLassen}
          </Knopf>
          <Knopf size="kiosk" variant="primary" onClick={() => los(true)} laedt={laeuft} disabled={laeuft || !offen.length} data-testid="checkin-markieren">
            {CHECKIN.markieren}
          </Knopf>
        </>
      }
    >
      {gaeste > 0 && <p className="bo-mar-unter">{CHECKIN.gaesteKommentar(gaeste)} werden am Event vermerkt.</p>}
    </Dialog>
  );
}
