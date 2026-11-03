import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName, publicOrigin } from "@/lib/portal/config";
import { idSchema } from "@/lib/portal/schemas";
import { formatDate } from "@/lib/portal/format";
import { Badge, Card } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import { PassRequestForm } from "@/components/Portal/Docs/Forms";
import { ITEM_STATUS, PASS_REQUESTS, focusRing } from "@/components/Portal/Docs/labels";
import { addMonths, getPassEntry } from "@/components/Portal/Docs/server/passes";
import PassVisual from "@/components/Portal/Docs/PassVisual";
import { portalMetadata } from "@/lib/portal/metadata";
import { ADDRESS, PHONE_DISPLAY, SITE_NAME } from "@/lib/site";

export const generateMetadata = portalMetadata({
  title: "Produktpass",
  robots: { index: false, follow: false },
});

const FOLGT = <span className="text-ink/75">folgt bei Übergabe</span>;

function Row({ label, children }) {
  // Druck 02.11.: im Ausdruck Flex statt Grid (Beschriftung 180 px, Wert daneben) und `break-after: auto` auf dem dt –
  // die globale Druckregel „dt bleibt bei seinem Wert“ (break-after: avoid) kettete in Chromium alle Zeilen aneinander,
  // die Stammdaten-Karte wurde unteilbar und rutschte komplett auf Seite 2 (Seite 1 blieb fast leer).
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4 print:flex print:gap-4">
      <dt className="text-[13px] font-semibold text-ink/70 print:w-[180px] print:shrink-0 print:break-after-auto!">{label}</dt>
      <dd className="text-[15px] text-ink">{children}</dd>
    </div>
  );
}

export default async function PassDetailPage({ params, searchParams }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const portal = await getPortal(`/de/portal/pass/${encodeURIComponent(id)}`);
  if (!idSchema.safeParse(id).success) notFound();
  const entry = await getPassEntry(portal, id);
  if (!entry) notFound();

  const { pass, item, project, purchasedAt } = entry;
  const passUrl = `${publicOrigin()}/de/portal/pass/${encodeURIComponent(pass.id)}`;
  const qr = await QRCode.toString(passUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#30373e", light: "#ffffff" } });
  const warrantyEnd = addMonths(pass.deliveredAt, pass.warranty?.months);
  const requestKind = Object.keys(PASS_REQUESTS).includes(sp?.anfrage) ? sp.anfrage : "service";
  const photos = (pass.attachments || []).map((a, i) => ({ ...a, href: `/api/portal/dokumente/pass/${encodeURIComponent(pass.id)}?anhang=${i}` }));

  return (
    <>
      {/* Druck 02.11.: Kopfzeile des Ausdrucks – Studio, Pass-Nr., Druckdatum, Adresse des Passes. Der Demo-Hinweis
          bleibt klein stehen, solange die Daten Demo-Daten sind (Mock-Adapter). */}
      <p className="hidden border-b border-ink/10 pb-3 text-[13px] text-ink/70 print:block" data-pass-print-head="">
        {SITE_NAME} · {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city} · {PHONE_DISPLAY} · Produktpass {pass.id} · Stand {formatDate(new Date().toISOString().slice(0, 10))} · {passUrl}
      </p>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader back={{ href: "/de/portal/pass", label: "Alle Produktpässe" }} overline={pass.brand} title={pass.product} intro={item.variant}>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{ITEM_STATUS[item.status] || item.status}</Badge>
          <Badge tone="gold">Pass-Nr. {pass.id}</Badge>
        </div>
      </DocsPageHeader>

      <PassVisual pass={pass} item={item} hero className="mb-5 border border-ink/10 sm:aspect-[16/7] lg:mb-6" />

      {/* Druck 02.11.: Karten untereinander, Zeilen und Überschriften nicht über den Seitenumbruch (ganze Karten zu
          meiden schob die Stammdaten auf Seite 2); Formular, Platzhalter und Download bleiben am Bildschirm. */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6 print:block [&>div>section]:print:mb-4 [&_dl>div]:print:break-inside-avoid [&_h2]:print:break-after-avoid">
        <div className="space-y-5 lg:col-span-2 lg:space-y-6 print:block print:space-y-0">
          <Card aria-labelledby="pass-daten">
            <h2 id="pass-daten" className="font-display text-xl text-ink sm:text-2xl">
              Stammdaten
            </h2>
            <dl className="mt-2 divide-y divide-ink/10">
              <Row label="Marke">{pass.brand}</Row>
              <Row label="Modell">{pass.model || pass.product}</Row>
              <Row label="Ausführung">{item.variant || FOLGT}</Row>
              <Row label="Material / Bezug">
                {pass.materials?.length ? (
                  <ul className="space-y-0.5">
                    {pass.materials.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  FOLGT
                )}
              </Row>
              <Row label="Maße">{pass.dimensions || FOLGT}</Row>
              <Row label="Menge">{item.quantity}</Row>
              <Row label="Kaufdatum">{purchasedAt ? formatDate(purchasedAt) : FOLGT}</Row>
              <Row label="Geliefert am">{pass.deliveredAt ? formatDate(pass.deliveredAt) : FOLGT}</Row>
              <Row label="Seriennummer">{pass.serialNumber ? <span className="font-mono text-sm">{pass.serialNumber}</span> : FOLGT}</Row>
              <Row label="Projekt">{project.title.toLowerCase().includes(String(project.room).toLowerCase()) ? project.title : `${project.title} · ${project.room}`}</Row>
            </dl>
          </Card>

          <Card aria-labelledby="pass-garantie">
            <h2 id="pass-garantie" className="font-display text-xl text-ink sm:text-2xl">
              Garantie und Gewährleistung
            </h2>
            <dl className="mt-2 divide-y divide-ink/10">
              <Row label="Herstellergarantie">
                {pass.warranty?.months ? `${pass.warranty.months} Monate` : "lt. Hersteller"}
                {warrantyEnd && <span className="block text-sm text-ink/70">bis {formatDate(warrantyEnd)}</span>}
                {pass.warranty?.note && <span className="block text-sm text-ink/70">{pass.warranty.note}</span>}
              </Row>
              <Row label="Gesetzliche Gewährleistung">
                Nach dem Recht Ihres Landes ab Übergabe (für Verbraucher in Österreich und Deutschland in der Regel zwei Jahre). Maßgeblich ist Ihre Auftragsbestätigung.
              </Row>
            </dl>
          </Card>

          <Card aria-labelledby="pass-pflege">
            <h2 id="pass-pflege" className="font-display text-xl text-ink sm:text-2xl">
              Pflegeanleitung
            </h2>
            {pass.care?.length ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/90">
                {pass.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink/70">Die Pflegeanleitung des Herstellers ergänzen wir bei der Übergabe.</p>
            )}
          </Card>

          <Card aria-labelledby="pass-anfrage" id="anfrage" className="scroll-mt-32 print:hidden">
            <h2 id="pass-anfrage" className="font-display text-xl text-ink sm:text-2xl">
              Service, Neubezug oder Inzahlungnahme
            </h2>
            <p className="mt-1 mb-5 text-sm text-ink/70">Ihr Anliegen landet direkt bei Ihrem Beratungsteam – mit allen Daten dieses Passes.</p>
            <PassRequestForm passId={pass.id} defaultKind={requestKind} />
          </Card>
        </div>

        <div className="space-y-5 lg:space-y-6 print:block print:space-y-0">
          <Card aria-labelledby="pass-fotos" className={photos.length ? "" : "print:hidden"}>
            <h2 id="pass-fotos" className="font-display text-xl text-ink">
              Fotos und Unterlagen
            </h2>
            {photos.length ? (
              <ul className="mt-3 space-y-2">
                {photos.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} target="_blank" rel="noopener" className={`flex min-h-11 items-center gap-2 text-sm text-ink underline underline-offset-4 ${focusRing}`}>
                      {/\.(jpe?g|png|webp)$/i.test(p.storageKey) ? <ImageIcon size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 flex aspect-[4/3] items-center justify-center bg-bone text-center text-sm text-ink/75">
                <span>
                  <ImageIcon size={28} className="mx-auto mb-2" aria-hidden="true" />
                  Foto und Typenschild
                  <br />
                  ergänzen wir bei der Übergabe
                </span>
              </div>
            )}
          </Card>

          <Card aria-labelledby="pass-dpp">
            <h2 id="pass-dpp" className="font-display text-xl text-ink">
              Digitaler Produktpass
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              Die EU führt mit der Ökodesign-Verordnung (EU) 2024/1781 schrittweise digitale Produktpässe ein. Für Möbel stehen die Details noch aus – dieser Pass ist bereits
              so aufgebaut, dass er später übernommen werden kann.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="size-28 shrink-0 border border-ink/10 bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
                role="img"
                aria-label="QR-Code zu diesem Produktpass"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <p className="text-[13px] leading-relaxed text-ink/70">Führt zu diesem Pass (Anmeldung nötig) – z. B. für einen Aufkleber unter dem Möbel.</p>
            </div>
            <a
              href={`/api/portal/dokumente/pass/${encodeURIComponent(pass.id)}?download=1`}
              className={`mt-4 inline-flex min-h-11 items-center gap-2 border border-ink/20 px-4 text-sm text-ink hover:border-ink print:hidden ${focusRing}`}
            >
              <Download size={16} aria-hidden="true" /> Daten herunterladen (JSON)
            </a>
          </Card>

          {/* Druck 02.11.: Kontaktkarte im Ausdruck hell (dunkle Fläche spart Toner, Text bleibt lesbar). */}
          <Card tone="dark" aria-labelledby="pass-kontakt" className="print:border-ink/10 print:bg-white print:text-ink">
            <h2 id="pass-kontakt" className="font-display text-xl">
              Fragen zu diesem Stück?
            </h2>
            <p className="mt-1 text-sm text-white/80 print:text-ink/70">{portal.customer.advisor?.name}</p>
            <p className="mt-3 text-sm">
              <a href={`tel:${portal.customer.advisor?.phone?.replace(/\s/g, "")}`} className={`inline-flex min-h-11 items-center hover:underline ${focusRing}`}>
                {portal.customer.advisor?.phone}
              </a>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
