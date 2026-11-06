// A14 Einsatz planen (Vollseite, 10-konzept-service §2.4.1, N18): ?fall= oder ?pflege=; ohne Ziel Auswahl der
// Fälle, die einen Einsatz brauchen. Freie Fenster je Tag der Woche (ein Aufruf je Tag, parallel).
import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { verschiebe, wochenStart } from "@/lib/backoffice/datum";
import { ladeSlots, serviceClient, sicht, technikerListe } from "@/lib/backoffice/service/daten";
import { kostenhinweisNoetig } from "@/lib/backoffice/service/regeln";
import { fallTitel } from "@/lib/backoffice/service/zeilen";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import ListeKachel from "@/components/Backoffice/Service/ListeKachel";
import { FallStatus } from "@/components/Backoffice/Service/Teile";
import A14Planen from "@/components/Backoffice/Service/A14Planen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einsatz planen · Service" };

export default async function EinsatzPlanen({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("service", "create", "/service/einsaetze/neu");
  const client = serviceClient(session);
  const s = sicht(session);
  const fallName = sp.fall ? String(sp.fall) : null;
  const pflegeName = sp.pflege ? String(sp.pflege) : null;

  if (!fallName && !pflegeName) {
    const faelle = await client.getList("PH Servicefall", { fields: ["name", "status", "kunde_name", "produkt_name", "art", "fehlercode", "einsatz_ort", "kulanz_freigabe_status"], filters: [["status", "in", ["Geprueft", "Entscheidung", "In Bearbeitung"]]], orderBy: "gemeldet_am asc", limit: 100 });
    return (
      <Shell session={session}>
        <Seitenkopf titel={T.einsaetze.a14.titel} untertitel="Für welchen Fall?" krumen={[{ titel: "Service", href: "/service" }, { titel: "Einsätze", href: "/service/einsaetze" }, { titel: T.einsaetze.a14.titel }]} />
        {faelle.length ? (
          <ListeKachel spalten={[{ titel: "Fall" }, { titel: "Status" }, { titel: "Ort" }]} zeilen={faelle.map((f) => ({ key: f.name, href: `/service/einsaetze/neu?fall=${encodeURIComponent(f.name)}`, titel: fallTitel(f), unter: `${f.name} · ${f.fehlercode || f.art}`, icon: "Wrench", zellen: [<FallStatus key="s" fall={f} groesse="sm" />, f.einsatz_ort || "–"] }))} />
        ) : (
          <Leer art="erledigt" text="Kein Fall wartet auf einen Einsatz." />
        )}
      </Shell>
    );
  }

  const ziel = fallName ? await client.getDoc("PH Servicefall", fallName) : await client.getDoc("PH Pflege Abo", pflegeName);
  const dauer = [60, 120, 240].includes(Number(sp.dauer)) ? Number(sp.dauer) : fallName && ziel.status === "Gemeldet" ? 60 : 120;
  const start = wochenStart(/^\d{4}-\d{2}-\d{2}$/.test(sp.woche || "") ? sp.woche : verschiebe(isoDatum(), { tage: 1 }));
  const tage = Array.from({ length: 5 }, (_, i) => verschiebe(start, { tage: i })).filter((t) => t >= isoDatum());
  const [slots, techniker] = await Promise.all([ladeSlots(client, { tage, dauer }), technikerListe(client)]);
  const basis = (aend) => {
    const q = new URLSearchParams(Object.entries({ fall: fallName || "", pflege: pflegeName || "", woche: sp.woche || "", dauer: String(dauer), ...aend }).filter(([, v]) => v));
    return `/service/einsaetze/neu?${q}`;
  };
  const teile = fallName ? (ziel.ersatzteile || []).filter((t) => ["Eingetroffen", "Aus Bestand", "Bestellt"].includes(t.status)).map((t) => ({ bezeichnung: t.bezeichnung, menge: t.menge || 1 })) : [];
  let hinweis = "";
  if (fallName && ziel.fehlercode) {
    const code = await client.getDoc("PH Fehlercode", ziel.fehlercode).catch(() => null);
    hinweis = code?.pruefhinweis || "";
  }
  const zielDaten = fallName
    ? { art: "fall", name: fallName, titel: `${fallName} · ${fallTitel(ziel)}`, kunde: ziel.kunde_name, ort: [ziel.einsatz_plz, ziel.einsatz_ort].filter(Boolean).join(" "), land: ziel.einsatz_land || "Österreich", email: ziel.kunde_email || "" }
    : { art: "pflege", name: pflegeName, titel: `${pflegeName} · ${ziel.titel}`, kunde: ziel.kunde_name, ort: [ziel.plz, ziel.ort].filter(Boolean).join(" "), land: ziel.land || "Österreich", email: ziel.kontakt_email || "" };

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.einsaetze.a14.titel}
        untertitel={zielDaten.titel}
        krumen={fallName ? [{ titel: "Servicefälle", href: "/service/faelle" }, { titel: fallName, href: `/service/faelle/${encodeURIComponent(fallName)}` }, { titel: T.einsaetze.a14.titel }] : [{ titel: "Verträge", href: "/service/vertraege?art=pflege" }, { titel: pflegeName, href: `/service/vertraege/pflege/${encodeURIComponent(pflegeName)}` }, { titel: T.einsaetze.a14.titel }]}
        zurueck={fallName ? `/service/faelle/${encodeURIComponent(fallName)}` : `/service/vertraege/pflege/${encodeURIComponent(pflegeName)}`}
      />
      {!s.schreiben ? (
        <Leer art="recht" />
      ) : (
        <A14Planen
          ziel={zielDaten}
          tage={tage}
          slots={slots}
          techniker={techniker}
          dauer={dauer}
          art={fallName ? (ziel.status === "Gemeldet" ? "Besichtigung" : ziel.entscheidung === "Austausch" ? "Austausch" : "Reparatur") : ziel.art === "Wartungsvertrag" ? "Wartung" : "Pflege"}
          teile={teile}
          hinweis={hinweis}
          kostenhinweis={fallName ? kostenhinweisNoetig(ziel) : false}
          leitung={s.leitung}
          wochenLinks={{ vor: basis({ woche: verschiebe(start, { tage: 7 }) }), zurueck: basis({ woche: verschiebe(start, { tage: -7 }) }), dauer: { 60: basis({ dauer: "60" }), 120: basis({ dauer: "120" }), 240: basis({ dauer: "240" }) } }}
        />
      )}
      <p className="mt-6 text-[13px] text-bo-text-soft">
        <Link href="/service/einsaetze" className="underline">
          Alle Einsätze
        </Link>
      </p>
    </Shell>
  );
}
