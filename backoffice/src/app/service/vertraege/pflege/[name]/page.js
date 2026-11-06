// Pflege-/Wartungsvertrag (10-konzept-service §2.9): Primär „Nächsten Termin planen“, Einwilligung (Widerruf = 0, R-05),
// Konditionen ohne eigene Zahlen (Laufzeit-Hinweis Kanzlei), Protokolle.
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { personen, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { mockMethode } from "@/lib/backoffice/service/mock";
import { PFLEGE_PHASEN, PFLEGE_STATUS, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { datumLang, euro, personName, tagKurz, zeitpunkt } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Fakten, Status } from "@/components/Backoffice/Service/Teile";
import { PflegeAktionen } from "@/components/Backoffice/Service/VertragAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Vertrag` };
}

export default async function PflegeAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = await searchParams;
  const session = await requireRecht("service", "read", `/service/vertraege/pflege/${encodeURIComponent(name)}`);
  const client = serviceClient(session);
  const s = sicht(session);
  let a;
  try {
    a = await client.getDoc("PH Pflege Abo", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const p = await personen(client);
  let termine = [];
  try {
    termine = client.modus === "frappe" ? await client.runDocMethod("PH Pflege Abo", name, "geplante_termine", { anzahl: 6 }) : await mockMethode(client, "PH Pflege Abo", name, "geplante_termine", { anzahl: 6 }).catch(() => []);
  } catch {
    termine = [];
  }
  const tab = ["vertrag", "konditionen", "einwilligung", "protokolle"].includes(sp.tab) ? sp.tab : "vertrag";
  const phase = PFLEGE_PHASEN.indexOf(a.status === "Pausiert" ? "Aktiv" : a.status);
  const hinweis = Number(a.ueberfaellig) ? T.vertraege.ueberfaellig(datumLang(a.naechster_termin)) : !Number(a.preis_cent) ? T.vertraege.aufAnfrage : null;
  const inhalt =
    tab === "vertrag" ? (
      <div className="grid gap-(--bo-bento-gap) lg:grid-cols-2">
        <Kachel titel="Vertrag">
          <Fakten eintraege={[{ label: "Art", wert: a.art }, { label: "Bereich", wert: a.bereich }, { label: "Intervall", wert: a.intervall_monate ? `${a.intervall_monate} Monate` : "einmalig" }, { label: "Beginn", wert: datumLang(a.startdatum) }, { label: "Nächster Termin", wert: datumLang(a.naechster_termin) }, { label: "Techniker", wert: personName(a.techniker, p) }]} />
          <p className="bo-svc-zitat mt-5">{a.leistungen || "–"}</p>
        </Kachel>
        <Kachel titel="Geplante Termine" unter="Vorschau aus dem Intervall">
          {termine.length ? (
            <ul className="grid gap-2 text-[14px] tabular-nums">
              {termine.map((t) => (
                <li key={t} className="bo-svc-karte">
                  {tagKurz(t)} {String(t).slice(0, 4)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-bo-text-soft">Kein Intervall – Termine einzeln planen.</p>
          )}
        </Kachel>
      </div>
    ) : tab === "konditionen" ? (
      <Kachel titel={T.vertraege.tabs.konditionen}>
        <Fakten eintraege={[{ label: "Preis", wert: Number(a.preis_cent) ? euro(a.preis_cent) : T.vertraege.aufAnfrage }, { label: "Abrechnung", wert: anzeigeText(a.abrechnung) }, { label: "Mindestlaufzeit", wert: a.mindestlaufzeit_monate ? `${a.mindestlaufzeit_monate} Monate` : null }, { label: "Kündigungsfrist", wert: a.kuendigungsfrist_monate ? `${a.kuendigungsfrist_monate} Monate` : null }, { label: "Bedingungen", wert: a.bedingungen_version }, { label: "Gekündigt zum", wert: datumLang(a.kuendigung_zum) }]} />
        {Number(a.mindestlaufzeit_monate) > 12 && <p className="bo-svc-hinweis mt-4" data-ton="warn">{T.vertraege.laufzeitHinweis}</p>}
        <p className="bo-svc-hinweis mt-4">{T.vertraege.rechnungFaktura}: Abrechnung je Termin über Faktura (Anfrage A-S8).</p>
      </Kachel>
    ) : tab === "einwilligung" ? (
      <Kachel titel={T.vertraege.einwilligung} unter="Nachkauf-Hinweise (Pflegemittel)">
        <p className="text-[15px]">{Number(a.nachkauf_einwilligung) ? T.vertraege.eingewilligt(zeitpunkt(a.nachkauf_einwilligung_am)) : a.nachkauf_widerrufen_am ? T.vertraege.widerrufen(zeitpunkt(a.nachkauf_widerrufen_am)) : T.vertraege.keineEinwilligung}</p>
        {a.nachkauf_textversion && <p className="mt-2 text-[13px] text-bo-text-soft">Textversion {a.nachkauf_textversion}</p>}
        <p className="bo-svc-hinweis mt-4">Die Einwilligung ist nie als Häkchen änderbar; Widerruf über „Weitere Aktionen“. Neue Einwilligung nur mit Nachweis (Anfrage A-S17).</p>
      </Kachel>
    ) : (
      <Kachel titel={T.vertraege.tabs.protokolle}>
        {(a.protokolle || []).length ? (
          <ul className="bo-svc-zeilen -mx-3">
            {[...a.protokolle].reverse().map((x, i) => (
              <li key={i} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                <span className="min-w-0">
                  <span className="bo-svc-zeile__titel">{datumLang(x.datum)}</span>
                  <span className="bo-svc-zeile__unter">{x.leistungen}</span>
                </span>
                <span className="bo-svc-zeile__rechts">{Number(x.im_portal) ? <Pille material="salbei">im Portal</Pille> : null}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-bo-text-soft">{T.vertraege.leerProtokolle}</p>
        )}
      </Kachel>
    );
  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/vertraege", titel: "Verträge" }}
          krumen={[{ titel: "Service", href: "/service" }, { titel: "Verträge", href: "/service/vertraege" }, { titel: name }]}
          titel={a.kunde_name}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span>
                {name} · {a.art} · {a.bereich}
              </span>
              <Status wert={a.status} map={PFLEGE_STATUS} />
              {!a.kontakt_email && <Pille material="eiche">{T.vertraege.ohneEmail}</Pille>}
            </span>
          }
          aktionen={<PflegeAktionen abo={a} leitung={s.leitung} darf={s.schreiben} />}
        />
        {hinweis && <Band ton={Number(a.ueberfaellig) ? "warnung" : "info"} titel={hinweis} />}
        <Kachel dicht>
          <ol className="bo-svc-phasen" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }} aria-label="Phasen">
            {PFLEGE_PHASEN.map((ph, i) => {
              const z = i < phase ? "erledigt" : i === phase ? "aktuell" : "offen";
              return (
                <li key={ph} className="bo-svc-phase" data-zustand={z} aria-current={z === "aktuell" ? "step" : undefined}>
                  <span className="bo-svc-phase__linie" aria-hidden="true" />
                  <span className="bo-svc-phase__punkt" aria-hidden="true" />
                  <span className="bo-svc-phase__text">{PFLEGE_STATUS[ph].text}{ph === "Aktiv" && a.status === "Pausiert" ? " (pausiert)" : ""}</span>
                </li>
              );
            })}
          </ol>
        </Kachel>
        <AkteTabs tabs={Object.entries(T.vertraege.tabs).map(([id, titel]) => ({ id, titel, anzahl: id === "protokolle" ? (a.protokolle || []).length || undefined : undefined }))} aktiv={tab} basis={`/service/vertraege/pflege/${encodeURIComponent(name)}`} />
        {inhalt}
      </div>
    </Shell>
  );
}
