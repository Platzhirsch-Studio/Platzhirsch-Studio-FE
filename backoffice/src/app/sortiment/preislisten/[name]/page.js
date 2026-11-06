import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { AkteGeruest, AkteKopf, Band } from "@/components/Backoffice/Akte";
import { Fakten, Schritte, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import PreislisteLauf from "@/components/Backoffice/Sortiment/PreislisteLauf";
import { sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, PREISLISTEN } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Preislisten` };
}

export default async function PreislisteAkte({ params }) {
  const name = decodeURIComponent((await params).name);
  const pfad = `/sortiment/preislisten/${encodeURIComponent(name)}`;
  const { session, client, meta, leitung } = await sortimentKontext({ pfad, doctype: "PH Preisliste Import" });
  let l;
  try {
    l = await client.getDoc("PH Preisliste Import", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const schritt = { Hochgeladen: 2, Geprueft: 3, Uebernommen: 4, Verworfen: 4 }[l.status] || 1;
  const schritte = PREISLISTEN.schritte.map((t, i) => ({ id: t, titel: t, zustand: l.status === "Verworfen" ? (i < 2 ? "erledigt" : "uebersprungen") : i + 1 < schritt ? "erledigt" : i + 1 === schritt ? (l.status === "Uebernommen" ? "erledigt" : "aktuell") : "offen" }));
  return (
    <Shell session={session}>
      <AkteGeruest
        vorgangOben
        kopf={<AkteKopf className="bo-sor-kopf" zurueck={{ href: "/sortiment/preislisten", titel: PREISLISTEN.titel }} krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: PREISLISTEN.titel, href: "/sortiment/preislisten" }, { titel: l.name }]} titel={`${l.marke} · ${GLOSSAR.preisartKurz[l.preisart] || l.preisart}`} nummer={`${l.name} · Stand ${datum(l.stand)}`} status={<Status gruppe="preisliste" wert={l.status} />} betrag={{ text: String(l.zeilen_anzahl || (l.zeilen || []).length), unter: "Zeilen" }} />}
        vorgang={
          <div className="bo-kachel bo-kachel--dicht">
            <Schritte schritte={schritte} label="Ablauf Preisliste" />
          </div>
        }
        band={l.preisart === "UVP" ? <Band ton="info" titel="UVP" text={PREISLISTEN.uvpSperre} /> : null}
        rechts={
          <Kachel titel="Details">
            <Fakten
              spalten={1}
              eintraege={[
                { label: "Lieferant", wert: l.lieferant || "–" },
                { label: "Quelle", wert: l.quelle || "–" },
                { label: "Schwelle", wert: `${l.schwelle_prozent || 15} %` },
                { label: "Abgeglichen", wert: l.geprueft_am ? datumZeit(l.geprueft_am) : "–" },
                { label: "Übernommen", wert: l.uebernommen_am ? datumZeit(l.uebernommen_am) : "–" },
              ]}
            />
          </Kachel>
        }
      >
        <Kachel titel="Zeilen" unter={PREISLISTEN.zeilen((l.zeilen || []).length, l.zeilen_auffaellig || 0)}>
          {(l.zeilen || []).length === 0 ? <Leer groesse="karte" titel="Noch keine Zeilen" text="Die Datei wird am Server eingelesen; danach folgt der Abgleich." icon="Receipt" /> : <PreislisteLauf liste={l} leitung={leitung} darfSchreiben={darfDoc(session, meta, "write")} />}
        </Kachel>
      </AkteGeruest>
    </Shell>
  );
}
