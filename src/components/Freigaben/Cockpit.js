// src/components/Freigaben/Cockpit.js — Freigabe-Cockpit (R6-uebergabe).
// Server Components only, no client JavaScript, no form, no write function.
// Shows what still needs a release and WHERE the release is set technically.
// Design: Bibel §4 (Rollen-Tokens), §5 (Bodoni erst ab display-*), §9 (Badge
// nur sachlich), §14 (Status nie nur über Farbe: jeder Status steht als Text).
import { Badge, Container, Eyebrow, Heading, Lead, SmartLink } from "@/components/ui";
import { COPY_STATUS, countBy, ratgeberReviewLabel } from "./model";

const SECTIONS = [
  ["#schalter", "Schalter"],
  ["#ratgeber", "Ratgeber"],
  ["#produkttexte", "Produkttexte"],
  ["#bilder", "Bilder"],
  ["#recht", "Rechtstexte"],
  ["#commerce", "Gutschein und Atelier"],
  ["#schweiz", "Schweiz-Hub"],
];

const linkCls = "underline decoration-line-strong underline-offset-4 hover:decoration-current";

function Code({ children }) {
  return <code className="break-all font-mono text-small">{children}</code>;
}

function Where({ label = "Freigabe technisch", children }) {
  return (
    <p className="mt-4 max-w-measure text-small text-text-soft">
      <span className="font-medium text-text">{label}:</span> <Code>{children}</Code>
    </p>
  );
}

function SectionShell({ id, eyebrow, title, owner, children, raised = false }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`scroll-mt-24 border-t border-line py-12 md:py-16 ${raised ? "bg-surface-raised" : ""}`}>
      <Container>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2} id={`${id}-h`} className="mt-stack-s">
          {title}
        </Heading>
        {owner ? (
          <p className="mt-3 text-small text-text-soft">
            <span className="font-medium text-text">Gibt frei:</span> {owner}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="border-t border-line-strong pt-4">
      <dt className="text-small text-text-soft">{label}</dt>
      <dd className="mt-1 text-title text-text tabular-nums">{value}</dd>
      {note ? <dd className="mt-1 text-small text-text-soft">{note}</dd> : null}
    </div>
  );
}

function Summary({ data }) {
  const rg = data.ratgeber;
  const pc = countBy(data.produkte, "status");
  const heldBack = data.bilder.filter((b) => !b.released).length;
  const legalOpen = data.recht.reduce((n, r) => n + r.total, 0);
  const markers = rg.reduce((n, r) => n + r.markers.length, 0);
  return (
    <dl className="mt-12 grid grid-cols-1 gap-x-grid gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Ratgeber freigegeben" value={`${rg.filter((r) => r.freigegeben).length} von ${rg.length}`} note={`${markers} offene Prüfstellen im Text`} />
      <Stat label="Produkttexte ganz freigegeben" value={`${pc.freigegeben || 0} von ${data.produkte.length}`} note={`teilweise ${pc.teilweise || 0}, veraltet ${pc.veraltet || 0}`} />
      <Stat label="Hero-Fotos zurückgehalten" value={`${heldBack} von ${data.bilder.length}`} note="Landingseiten im Bildregister" />
      <Stat
        label="Rechtstexte"
        value={`${data.rechtLive.rows.filter((r) => r.state === "live").length} live`}
        note={`Kanzlei-Freigabe ${data.rechtLive.approval.approvedAt.split("-").reverse().join(".")} · ${legalOpen} Stellen in den Kanzlei-Fassungen`}
      />
      <Stat
        label="Gutscheinbedingungen"
        value={data.commerce.termsReleased ? "freigegeben" : "Entwurf"}
        note={`Gutschein ${data.commerce.voucher}, Atelier ${data.commerce.atelier}`}
      />
      <Stat label="Schweiz-Hub" value="Entwurf, noindex" note={`${data.schweiz.length} Stellen ohne Beleg`} />
    </dl>
  );
}

function Switches({ rows }) {
  return (
    <SectionShell id="schalter" eyebrow="Umgebung" title="Schalter" owner="Betrieb setzt die Variablen, nach Freigabe durch die genannte Stelle">
      <p className="max-w-measure text-body">
        Gezeigt wird nur der wirksame Zustand auf diesem Server, nie der Wert einer Variablen. Zweck und Reihenfolge stehen in der
        Übergabemappe (<Code>Marktresearch/digital/uebergabe/00-uebergabe.md</Code>).
      </p>
      <ul className="mt-8 border-t border-line">
        {rows.map((r) => (
          <li key={r.name} className="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,3fr)] md:gap-6">
            <Code>{r.name}</Code>
            <span className="text-ui text-text">
              <Badge tone={r.warn ? "band" : r.on ? "inverse" : "neutral"}>{r.state}</Badge>
            </span>
            <span className="text-small text-text-soft">{r.note}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function Ratgeber({ rows, where }) {
  return (
    <SectionShell id="ratgeber" eyebrow="Inhalt" title="Ratgeber" owner="Inhaber nach fachlicher Prüfung jeder [prüfen]-Stelle" raised>
      <p className="max-w-measure text-body">
        Alle Artikel sind noindex und stehen weder in der Sitemap noch in llms.txt. Erst <Code>freigegeben: true</Code> und ein Name in{" "}
        <Code>reviewedBy</Code> machen einen Artikel indexierbar. Stellen mit [prüfen] werden auf der Seite nie gezeigt.
      </p>
      <Where>{where.ratgeber}</Where>
      <ul className="mt-8 border-t border-line">
        {rows.map((r) => (
          <li key={r.slug} className="border-b border-line py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <Heading level={3} size="title">
                <a href={r.href} className={linkCls}>
                  {r.title}
                </a>
              </Heading>
              <Badge tone={r.freigegeben ? "inverse" : "band"}>{r.freigegeben ? "freigegeben" : "nicht freigegeben"}</Badge>
            </div>
            <p className="mt-2 text-small text-text-soft">
              {r.rubrik} · {ratgeberReviewLabel(r)}
            </p>
            {r.file ? (
              <p className="mt-1 text-small text-text-soft">
                Schalter: <Code>{`${r.file}:${r.freigabeLine ?? "?"}`}</Code>, Prüfer: <Code>{`${r.file}:${r.reviewedByLine ?? "?"}`}</Code>
              </p>
            ) : null}
            {r.markers.length ? (
              <details className="mt-3">
                <summary className="inline-flex min-h-11 cursor-pointer items-center text-ui text-text">{r.markers.length} offene Prüfstellen anzeigen</summary>
                <ul className="mt-2 space-y-1 text-small">
                  {r.markers.map((m, i) => (
                    <li key={`${m.line}-${i}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                      <span className="tabular-nums text-text-soft">Zeile {m.line}</span>
                      <span className="break-words">{m.text}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <p className="mt-3 text-small">Keine offenen Prüfstellen.</p>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function CopyRow({ r }) {
  return (
    <li className="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)] md:gap-6">
      <span>
        {r.start ? <span className="mr-2 text-small tabular-nums text-text-soft">{r.start}.</span> : null}
        {r.href ? (
          <a href={r.href} className={`text-ui ${linkCls}`}>
            {r.brand} {r.productName}
          </a>
        ) : (
          <span className="text-ui">
            {r.brand} {r.productName}
          </span>
        )}
        <span className="block break-all font-mono text-small text-text-soft">{r.key}</span>
      </span>
      <span>
        <Badge tone={r.status === "freigegeben" ? "inverse" : r.status === "offen" ? "neutral" : "band"}>{COPY_STATUS[r.status]}</Badge>
      </span>
      <span className="text-small text-text-soft">
        Felder: {r.fields.length ? r.fields.join(", ") : "keins"} · FAQ {r.faqApproved}/{r.faqTotal}
        {r.stale.length ? ` · veraltet: ${r.stale.length}` : ""}
      </span>
    </li>
  );
}

function Produkttexte({ rows, where }) {
  const start = rows.filter((r) => r.start);
  const rest = rows.filter((r) => !r.start);
  return (
    <SectionShell id="produkttexte" eyebrow="Inhalt" title="Produkttexte" owner="Inhaber, je Text nach dem Lesen">
      <p className="max-w-measure text-body">
        Die Freigabe gilt für genau den gelesenen Text (Text-Hash). Ändert sich der Text, ist er wieder verborgen, bis er neu freigegeben wird. Der Link
        öffnet die Produktseite mit dem Entwurf; das funktioniert nur im Dev-Server.
      </p>
      <Where label="Freigabe per Befehl">{where.produkte}</Where>
      <p className="mt-1 max-w-measure text-small text-text-soft">
        Schreibt in <Code>{where.produkteData}</Code>, geprüft in <Code>{where.produkteCheck}</Code>.
      </p>
      <Heading level={3} size="title" className="mt-10">
        Startliste, empfohlene Lesereihenfolge
      </Heading>
      <ul className="mt-4 border-t border-line">
        {start.map((r) => (
          <CopyRow key={r.key} r={r} />
        ))}
      </ul>
      {rest.length ? (
        <details className="mt-8">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-ui text-text">Weitere {rest.length} Produkttexte anzeigen</summary>
          <ul className="mt-2 border-t border-line">
            {rest.map((r) => (
              <CopyRow key={r.key} r={r} />
            ))}
          </ul>
        </details>
      ) : null}
    </SectionShell>
  );
}

function Bilder({ rows, where }) {
  return (
    <SectionShell id="bilder" eyebrow="Bildrechte" title="Hero-Fotos der Landingseiten" owner="Inhaber, mit schriftlicher Freigabe des Rechteinhabers" raised>
      <p className="max-w-measure text-body">
        Ein zurückgehaltenes Foto wird nicht gezeigt, die Seite hat dann einen typografischen Hero. Das vollständige Register aller Bilddateien mit
        Rechteinhaber und Umfang ist <Code>Marktresearch/recht/bildrechte.csv</Code>.
      </p>
      <Where>{where.bilder}</Where>
      <ul className="mt-8 border-t border-line">
        {rows.map((r) => (
          <li key={r.path} className="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,3fr)] md:gap-6">
            <a href={r.href} className={`text-ui ${linkCls}`}>
              {r.path}
            </a>
            <span>
              <Badge tone={r.released ? "neutral" : "band"}>{r.released ? "wird gezeigt" : "zurückgehalten"}</Badge>
            </span>
            <span className="text-small text-text-soft">
              <span className="break-all font-mono">{r.src}</span>
            </span>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function Recht({ rows, live, legalPreview, where }) {
  const date = live.approval.approvedAt.split("-").reverse().join(".");
  return (
    <SectionShell id="recht" eyebrow="Recht" title="Rechtstexte" owner="Kanzlei (freigegeben); Angaben des Unternehmens trägt der Inhaber wörtlich ein">
      <p className="max-w-measure text-body">
        Die Kanzlei hat die Rechtstexte am {date} freigegeben. Live ist ein Text erst, wenn keine Angabe des Unternehmens mehr fehlt; fehlende Fakten werden
        nicht geschätzt. Liste für den Inhaber: <Code>Marktresearch/digital/teamleiter/freigaben-recht.md</Code>.
      </p>
      <Where label="Status">{where.rechtLive}</Where>
      <Where label="Impressum: WKO-Auszug">{where.impressumFields}</Where>
      <Where label="Impressum: Blattlinie">{where.blattlinie}</Where>
      <ul className="mt-8 border-t border-line">
        {live.rows.map((r) => (
          <li key={r.id} data-legal-live={r.id} className="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,3fr)] md:gap-6">
            <span className="text-ui">
              {r.livePath && r.state === "live" ? (
                <a href={`/de${r.livePath}`} className={linkCls}>
                  {r.title}
                </a>
              ) : (
                r.title
              )}
            </span>
            <span>
              <Badge tone={r.state === "live" ? "inverse" : "band"}>{r.label}</Badge>
            </span>
            <span className="text-small text-text-soft">{r.ownerFills}</span>
          </li>
        ))}
      </ul>
      <Heading level={3} size="title" className="mt-12">
        Kanzlei-Fassungen (Vorschau)
      </Heading>
      <p className="mt-3 max-w-measure text-body">
        Die Vorschau zeigt die Fassungen mit allen Stellen aus der Kanzleirunde.
        {legalPreview ? "" : " Die Vorschau-Links liefern auf diesem Server 404, weil LEGAL_PREVIEW nicht aktiv ist."}
      </p>
      <Where label="Ort der Texte">{where.recht}</Where>
      <ul className="mt-8 grid gap-x-grid border-t border-line md:grid-cols-2">
        {rows.map((r) => (
          <li key={r.slug} className="border-b border-line py-5">
            <Heading level={3} size="title">
              <a href={r.href} className={linkCls}>
                {r.title}
              </a>
            </Heading>
            <p className="mt-2 text-small text-text-soft">
              {r.total} offene Stellen: anwaltlich {r.anwalt}, Inhaber {r.inhaber}, prüfen {r.pruefen}
            </p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function Commerce({ c, where }) {
  return (
    <SectionShell id="commerce" eyebrow="Kundengeld" title="Gutschein und Atelierverkauf" owner="Inhaber (Entscheidung Nr. 46, 03.11.2026); Steuerberater bestätigt Mehrzweckgutschein" raised>
      <p className="max-w-measure text-body">
        Gutscheinverkauf online ist seit 03.11.2026 vom Inhaber freigegeben (Bedingungen und Widerrufsbelehrung „freigegeben“). VOUCHER_MODE=stripe
        wirkt erst mit Stripe-Schlüsseln und Mail-Dienst auf dem Server; der Atelierverkauf nimmt weiter kein Geld an.
      </p>
      <dl className="mt-8 max-w-text border-t border-line text-small">
        <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
          <dt className="text-text-soft">Gutscheinbedingungen</dt>
          <dd className="sm:col-span-2">
            {c.termsReleased ? "freigegeben" : "Entwurf"} ({c.termsStand}) · offen: {c.termsOpen.map((o) => `${o.marker} ${o.n}`).join(", ")}
          </dd>
        </div>
        <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
          <dt className="text-text-soft">Angaben des Unternehmens</dt>
          <dd className="sm:col-span-2">
            {c.termsFieldsOpen} von {c.termsFields.length} offen, eintragen in <Code>{where.gutscheinFields}</Code>
            <ul className="mt-2 space-y-1">
              {c.termsFields.map((f) => (
                <li key={f.id}>
                  {f.filled ? "eingetragen" : "offen"}: {f.section} – {f.label}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
          <dt className="text-text-soft">Gutschein wirksam</dt>
          <dd className="sm:col-span-2">{c.voucher === c.voucherRequested ? c.voucher : `${c.voucherRequested}, wirksam ${c.voucher}`}</dd>
        </div>
        <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
          <dt className="text-text-soft">Atelier wirksam</dt>
          <dd className="sm:col-span-2">{c.atelier}</dd>
        </div>
        <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
          <dt className="text-text-soft">Vorschau</dt>
          <dd className="sm:col-span-2">
            {c.previewOn ? (
              <SmartLink href="/preview/commerce" prefetch={false} className={linkCls}>
                /de/preview/commerce
              </SmartLink>
            ) : (
              "aus (COMMERCE_PREVIEW nicht gesetzt)"
            )}
          </dd>
        </div>
      </dl>
      <Where>{where.gutscheinTerms}</Where>
      <p className="mt-1 max-w-measure text-small text-text-soft">
        Schalter gelesen in <Code>{where.voucherMode}</Code> und <Code>{where.atelierMode}</Code>.
      </p>
    </SectionShell>
  );
}

function Schweiz({ rows, where }) {
  return (
    <SectionShell id="schweiz" eyebrow="Schweiz" title="Schweiz-Hub" owner="Steuerberater und Zollspediteur; Entscheidungen zum Ablauf trifft der Inhaber">
      <p className="max-w-measure text-body">
        Die Seite{" "}
        <SmartLink href="/einkaufen-aus-der-schweiz" prefetch={false} className={linkCls}>
          /de/einkaufen-aus-der-schweiz
        </SmartLink>{" "}
        ist ein Entwurf: noindex, ohne Canonical, nicht in Sitemap, llms.txt oder Navigation. Stellen ohne Beleg stehen nur im Code und werden nicht
        gezeigt.
      </p>
      <Where>{where.schweizRobots}</Where>
      <ul className="mt-8 border-t border-line">
        {rows.map((r, i) => (
          <li key={`${r.block}-${i}`} className="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-6">
            <span className="font-mono text-small text-text-soft">{r.block}</span>
            <span className="text-small">
              <span className="text-text">{r.label}</span>
              <span className="block text-text-soft">Offen: {r.pruefen}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-small text-text-soft">
        Texte: <Code>{where.schweizContent}</Code>
      </p>
    </SectionShell>
  );
}

export default function Cockpit({ data }) {
  return (
    <div className="bg-surface pb-section text-text">
      <div role="note" aria-labelledby="fc-banner" className="border-b border-line-strong bg-stone">
        <Container className="py-5">
          <p id="fc-banner" className="text-ui text-text">
            Vorschau, nicht öffentlich und nicht indexiert
          </p>
          <p className="mt-1 max-w-measure text-small text-text">
            Diese Seite liest den Stand nur aus dem Code. Sie hat kein Formular und ändert nichts. Freigaben werden an der jeweils genannten Stelle gesetzt. Nur auf Deutsch: Der Sprachumschalter führt hier auf eine 404-Seite.
          </p>
        </Container>
      </div>

      <Container className="pt-10 md:pt-14">
        <Eyebrow>Übergabe · noindex</Eyebrow>
        <Heading level={1} className="mt-stack-s">
          Freigaben
        </Heading>
        <Lead className="mt-stack-m">
          Was noch freigegeben werden muss, wer es freigibt und an welcher Stelle im Code die Freigabe wirkt. Projekte mit Freigabe: {data.projekte}.
        </Lead>
        <nav aria-label="Abschnitte" className="mt-stack-m">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-ui">
            {SECTIONS.map(([href, label]) => (
              <li key={href}>
                <a href={href} className={`inline-flex min-h-11 items-center ${linkCls}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Summary data={data} />
      </Container>

      <div className="mt-16">
        <Switches rows={data.switches} />
        <Ratgeber rows={data.ratgeber} where={data.where} />
        <Produkttexte rows={data.produkte} where={data.where} />
        <Bilder rows={data.bilder} where={data.where} />
        <Recht rows={data.recht} live={data.rechtLive} legalPreview={data.legalPreview} where={data.where} />
        <Commerce c={data.commerce} where={data.where} />
        <Schweiz rows={data.schweiz} where={data.where} />
      </div>
    </div>
  );
}
