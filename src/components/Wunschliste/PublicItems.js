"use client";
// Stücke einer geteilten Wunschliste mit „Reservieren“ (Service 10).
// Öffentlich: Bild, Marke, Name, „Reserviert“ (Icon + Text, nie nur Farbe,
// WCAG 1.4.1). Keine Preise. Reservieren klappt je Stück ein kleines Formular
// auf (Name/Notiz optional, nur für den Ersteller sichtbar). Eigene
// Reservierungen erkennt das Gerät am Storno-Schlüssel im localStorage und
// kann sie wieder aufheben. Doppelte verhindert der Server (409).
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import FormField from "@/components/Forms/FormField";
import { FormAlert } from "@/components/Forms/FormAlert";
import Honeypot from "@/components/Forms/Honeypot";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import { useHydrated } from "@/components/Forms/useFormGuard";
import { localizeProductsHref } from "@/utils/routing";
import { LIMITS } from "@/lib/wunschliste/config";
import { forgetReservation, postJson, rememberReservation, reservationsOf } from "./client";
import useWlCopy from "./useWlCopy";

// Eigene Reservierungen (Storno-Schlüssel im localStorage) als externer Speicher.
const listeners = new Set();
const cache = new Map();
const EMPTY = {};
const ownStore = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get(shareId) {
    if (!cache.has(shareId)) cache.set(shareId, reservationsOf(shareId));
    return cache.get(shareId);
  },
  refresh(shareId) {
    cache.set(shareId, reservationsOf(shareId));
    listeners.forEach((fn) => fn());
  },
};

function ReserveForm({ shareId, item, onDone, onCancel }) {
  const { c } = useWlCopy();
  const uid = useId();
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const headingRef = useRef(null);
  useEffect(() => headingRef.current?.focus(), []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const website = formRef.current?.elements?.namedItem?.("website")?.value || "";
    const res = await postJson(`/api/wunschliste/${shareId}/reservieren`, { item: item.key, name, note, website });
    setBusy(false);
    if (res.ok && res.cancel) {
      rememberReservation(shareId, item.key, res.cancel);
      onDone(res.items, "reserved");
      return;
    }
    if (res.error === "already_reserved") {
      onDone(null, "taken");
      return;
    }
    setStatus({ type: "error", text: c(`errors.${["rate_limited", "network", "not_found"].includes(res.error) ? res.error : "generic"}`) });
  }

  return (
    <form ref={formRef} method="post" noValidate onSubmit={submit} className="relative mt-4 space-y-4 border-t border-line pt-4 print:hidden">
      <Honeypot id={`${uid}-hp`} />
      <p ref={headingRef} tabIndex={-1} className="text-ui text-text focus-visible:outline-none">
        {c("public.reserveHeading", { name: item.name })}
      </p>
      <p className="text-small text-text-soft">{c("public.reserveText")}</p>
      {/* QA Recht P2: Absprache unter Schenkenden, keine Reservierung beim Studio. */}
      <p className="text-small text-text-soft">{c("public.reserveDisclaimer")}</p>
      <FormField id={`${uid}-name`} label={c("public.reserveName")} optionalText={c("share.optional")} value={name} maxLength={LIMITS.name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
      <FormField id={`${uid}-note`} as="textarea" label={c("public.reserveNote")} optionalText={c("share.optional")} value={note} maxLength={LIMITS.note} onChange={(e) => setNote(e.target.value)} controlClassName="min-h-24" />
      <FormPrivacyNote />
      <FormAlert status={status} />
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={!hydrated || busy} aria-busy={busy || undefined} fullWidth>
          {c("public.reserveConfirm")}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {c("share.cancel")}
        </Button>
      </div>
    </form>
  );
}

export default function PublicItems({ shareId, items: initial }) {
  const { locale, c } = useWlCopy();
  const [items, setItems] = useState(initial);
  const [openKey, setOpenKey] = useState(null);
  const [notice, setNotice] = useState("");
  const own = useSyncExternalStore(ownStore.subscribe, () => ownStore.get(shareId), () => EMPTY);

  const apply = (states) => {
    if (!Array.isArray(states)) return;
    const map = new Map(states.map((s) => [s.key, s.reserved]));
    setItems((list) => list.map((i) => (map.has(i.key) ? { ...i, reserved: map.get(i.key) } : i)));
  };

  async function release(item) {
    const res = await postJson(`/api/wunschliste/${shareId}/freigeben`, { item: item.key, cancel: own[item.key] });
    if (res.ok || res.error === "not_reserved") {
      forgetReservation(shareId, item.key);
      ownStore.refresh(shareId);
      if (res.ok) apply(res.items);
      setNotice(c("public.released"));
    } else setNotice(c(`errors.${res.error === "network" ? "network" : "generic"}`));
  }

  return (
    <section aria-labelledby="wl-items" className="mt-section">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <Heading level={2} size="display-m" id="wl-items">
          {c("public.itemsHeading")}
        </Heading>
        <p className="tabular text-small text-text-soft">{c("public.count", { count: items.length })}</p>
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-ui text-text print:hidden">
        {notice}
      </p>
      {/* Druck 02.11.: drei Stücke je Reihe, keine Karte über den Seitenumbruch; Knöpfe und Formular
          bleiben am Bildschirm, der Reservierungsstatus steht als Text. */}
      <ul className="mt-6 grid grid-cols-1 gap-x-grid gap-y-12 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-y-6">
        {items.map((item, index) => {
          const isMine = Boolean(own[item.key]);
          const href = item.href ? localizeProductsHref(item.href, locale) : null;
          return (
            <li key={item.key} className="flex flex-col print:break-inside-avoid">
              <div className="relative aspect-[3/2] overflow-hidden bg-surface-raised">
                {item.image && (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    className="object-contain p-4 mix-blend-multiply sm:p-6"
                    priority={index === 0}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-1 flex-col gap-1">
                {item.brand && <p className="text-overline uppercase text-text-soft">{item.brand}</p>}
                <h3 className="text-ui text-text">{item.name}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 print:mt-1">
                  {item.reserved ? (
                    <p className="inline-flex min-h-11 items-center gap-2 text-ui text-text print:min-h-0">
                      <Check aria-hidden="true" className="size-4" strokeWidth={1.75} />
                      {isMine ? c("public.reservedByYou") : c("public.reserved")}
                    </p>
                  ) : (
                    openKey !== item.key && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setNotice("");
                          setOpenKey(item.key);
                        }}
                        aria-label={c("public.reserveLabel", { name: item.name })}
                        className="print:hidden"
                      >
                        {c("public.reserve")}
                      </Button>
                    )
                  )}
                  {item.reserved && isMine && (
                    <Button variant="link" onClick={() => release(item)} className="print:hidden">
                      {c("public.release")}
                    </Button>
                  )}
                  {href && (
                    <Link href={href} className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current print:hidden" aria-label={c("public.viewLabel", { name: item.name })}>
                      {c("public.view")}
                    </Link>
                  )}
                </div>
                {openKey === item.key && !item.reserved && (
                  <ReserveForm
                    shareId={shareId}
                    item={item}
                    onCancel={() => setOpenKey(null)}
                    onDone={(states, result) => {
                      setOpenKey(null);
                      if (result === "taken") {
                        setItems((list) => list.map((i) => (i.key === item.key ? { ...i, reserved: true } : i)));
                        setNotice(c("errors.already_reserved"));
                      } else {
                        apply(states);
                        ownStore.refresh(shareId);
                        setNotice(c("public.reserveDone"));
                      }
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-12 max-w-measure text-small text-text-soft">{c("public.buyNote")}</p>
    </section>
  );
}
