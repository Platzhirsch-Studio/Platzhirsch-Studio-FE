// /marketing/social – Redaktionsplan (10-konzept-marketing § 2.9): Kalender (Standard, T4) · Kanban (T3, einziges
// Kanban des Bereichs) · Liste (T2). Filter Kanal/Zuständig in der URL. Keine Ideenleiste, solange das Datum Pflicht ist (S11).
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { NeuerBeitragKnopf, SocialKalender, SocialKanban, SocialListe } from "@/components/Backoffice/Marketing/Social";
import { marketingKontext, socialListe } from "@/lib/backoffice/marketing/daten";
import { isoTag, kalenderwoche, plusTage, wochenStart } from "@/lib/backoffice/marketing/regeln";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { ERSTBESUCH, SOCIAL, SOCIAL_KANAELE, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Social") };

export default async function SocialSeite({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/social", doctype: "PH Social Beitrag" });
  const ansicht = ["kanban", "liste"].includes(params.ansicht) ? params.ansicht : "kalender";
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const kanaele = params.kanal ? [params.kanal] : [];
  const mo = wochenStart(new Date());
  const von = ansicht === "kalender" ? isoTag(plusTage(mo, -42)) : null;
  const bis = ansicht === "kalender" ? isoTag(plusTage(mo, 70)) : null;
  const { zeilen, events } = await socialListe(ctx.client, { von, bis, kanaele, status: ansicht === "liste" ? status : [], zustaendig: params.zustaendig, q: params.q });
  const sichtbar = zeilen.filter((z) => ansicht === "liste" || z.status !== "Verworfen");
  const basis = (a) => `/marketing/social?${new URLSearchParams({ ...(a !== "kalender" ? { ansicht: a } : {}), ...(params.kanal ? { kanal: params.kanal } : {}) })}`;
  const zaehler = {};
  for (const z of zeilen) zaehler[z.anzeigeStatus] = (zaehler[z.anzeigeStatus] || 0) + 1;

  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.social, route: "/marketing/social" }}>
      <Seitenkopf
        titel={SOCIAL.titel}
        untertitel={`${SOCIAL.untertitel} · KW ${kalenderwoche(new Date())}`}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: SOCIAL.titel }]}
        kennzahlen={[{ wert: zaehler.Wartet || 0, text: STATUS_TEXT.social.Wartet }, { wert: zaehler.Geplant || 0, text: STATUS_TEXT.social.Geplant }]}
        aktionen={
          <>
            <StatusChips label="Ansicht" testid="social-ansicht" aktiv={ansicht} optionen={[{ wert: "kalender", titel: SOCIAL.ansichten.kalender, href: basis("kalender") }, { wert: "kanban", titel: SOCIAL.ansichten.kanban, href: basis("kanban") }, { wert: "liste", titel: SOCIAL.ansichten.liste, href: basis("liste") }]} />
            {ctx.team && <NeuerBeitragKnopf auto={params.neu === "beitrag"} />}
          </>
        }
      />
      <div className="bo-mar-werkzeuge">
        {ansicht === "liste" ? (
          <StatusChips aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"} optionen={[{ wert: "alle", titel: "Alle", href: basis("liste") }, ...CHIP_REIHE.social.map((s) => ({ wert: s, titel: STATUS_TEXT.social[s], anzahl: zaehler[s] || 0, href: `${basis("liste")}&status=${encodeURIComponent(s)}` }))]} />
        ) : (
          <span className="bo-mar-unter">Ziehen setzt nur das Datum. Ein Klick auf einen freien Tag legt einen Beitrag an.</span>
        )}
        <FilterForm basis="/marketing/social" params={params} behalten={["ansicht", "status"]} suche={ansicht === "liste" ? { name: "q", platzhalter: "Titel" } : undefined} auswahl={[{ name: "kanal", label: "Kanal", alle: "Alle Kanäle", optionen: SOCIAL_KANAELE.map((k) => ({ wert: k, titel: k })) }]} zuruecksetzen={basis(ansicht)} />
      </div>
      {ansicht === "kalender" && <SocialKalender beitraege={sichtbar} events={events} datum={isoTag(new Date())} darf={ctx.team} />}
      {ansicht === "kanban" && (sichtbar.length ? <SocialKanban beitraege={sichtbar} leitung={ctx.leitung} darf={ctx.team} /> : <Leer text={SOCIAL.leerWoche} />)}
      {ansicht === "liste" &&
        (sichtbar.length ? (
          <ListeKachel label={SOCIAL.titel} kopf={<span className="tabular-nums">{sichtbar.length} Beiträge</span>}>
            <SocialListe beitraege={sichtbar} darf={ctx.team} />
          </ListeKachel>
        ) : (
          <Leer art={status.length || params.kanal || params.q ? "gefiltert" : "leer"} text={status.length || params.kanal ? SOCIAL.gefiltert : SOCIAL.leerWoche} zuruecksetzenHref={basis("liste")} />
        ))}
    </Rahmen>
  );
}
