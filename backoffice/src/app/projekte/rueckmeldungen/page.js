import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Rueckmeldungen from "@/components/Backoffice/Projekte/Rueckmeldungen";
import { heuteIso, ladeRueckmeldungen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rückmeldungen · Projekte" };

/** Rückmeldungen (Inbox, § 5.7) – Zahl identisch zu Pill, Kennzahl und Glocke (§ 3.6). */
export default async function RueckmeldungenSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/rueckmeldungen");
  const client = projekteClient(session);
  const heute = heuteIso();
  const [liste, projekte, renderings] = await Promise.all([
    ladeRueckmeldungen(client, { heute, projekt: sp.projekt || null }),
    client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => []),
    client.getList("PH Rendering", { fields: ["name", "bild"], limit: 500 }).catch(() => []),
  ]);
  const bild = Object.fromEntries(renderings.map((r) => [r.name, r.bild]));
  const eintraege = liste.map((e) => ({ ...e, bild: e.rendering ? bild[e.rendering] || "" : "" }));
  const ueber = liste.filter((e) => e.ueberfaellig).length;
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={TEXTE.rueckmeldungen.titel}
        untertitel={TEXTE.rueckmeldungen.unter}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: TEXTE.rueckmeldungen.titel }]}
        kennzahlen={[{ wert: liste.length, text: TEXTE.rueckmeldungen.offen, testid: "rueck-zahl" }, { wert: ueber, text: "über der Erinnerungsgrenze" }]}
      />
      <Rueckmeldungen eintraege={eintraege} projekte={Object.fromEntries(projekte.map((p) => [p.name, { titel: p.titel, kunde: p.kunde_name }]))} start={sp.eintrag ? `PH Rendering Feedback:${sp.eintrag}` : null} />
    </Shell>
  );
}
