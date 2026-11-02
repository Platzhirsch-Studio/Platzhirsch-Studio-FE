"use client";
// „Als Wunschliste teilen“ unter der Merkliste (Service 10).
// Ein ruhiger zweiter Abschnitt nach der Auswahl: Erklärung, sekundärer Knopf
// (die primäre Handlung der Seite bleibt „Auswahl anfragen“, Bibel §2 P2),
// darunter klappt das Formular auf (kein Modal: einfacher für Tastatur und
// Screenreader, nichts verdeckt die Seite). Nach dem Erstellen: Teilen-Link,
// WhatsApp/E-Mail/QR und der Verwaltungslink (auf diesem Gerät gemerkt).
// Felder: Anlass (Radiokarten), Titel (Vorschlag je Anlass), Datum optional,
// Nachricht optional, Hinweis aktiv bestätigen (nie vorangekreuzt).
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Gift } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import FormField, { FieldError, RadioCards } from "@/components/Forms/FormField";
import { FormAlert } from "@/components/Forms/FormAlert";
import Honeypot from "@/components/Forms/Honeypot";
import { focusField, useHydrated } from "@/components/Forms/useFormGuard";
import { LIMITS, OCCASIONS } from "@/lib/wunschliste/config";
import { Link } from "@/i18n/navigation";
import { forgetList, postJson, rememberList, savedLists } from "./client";
import SharePanel from "./SharePanel";
import useWlCopy from "./useWlCopy";

const ORDER = ["occasion", "title", "date", "message", "understood"];

// localStorage als externer Speicher (kein setState im Effekt).
const listeners = new Set();
let snapshot = null;
const listStore = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    if (snapshot === null) snapshot = savedLists();
    return snapshot;
  },
  server: () => EMPTY,
  refresh() {
    snapshot = savedLists();
    listeners.forEach((fn) => fn());
  },
};
const EMPTY = [];

export function validateShare(form) {
  const errors = {};
  if (!OCCASIONS.includes(form.occasion)) errors.occasion = "title";
  if (form.title.trim().length < 2) errors.title = "title";
  if (form.date && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = "date";
  if (!form.understood) errors.understood = "understood";
  return errors;
}

export default function ShareFromMerkliste({ retentionMonths }) {
  const { cartItems } = useCart();
  const { locale, c } = useWlCopy();
  const uid = useId();
  const id = (name) => `${uid}-wl-${name}`;
  const hydrated = useHydrated();
  const saved = useSyncExternalStore(listStore.subscribe, listStore.get, listStore.server);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ occasion: "einzug", title: "", titleTouched: false, date: "", message: "", understood: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const successRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (created) successRef.current?.focus();
  }, [created]);

  const count = cartItems.length;
  if (count === 0 && saved.length === 0) return null;

  const title = form.titleTouched ? form.title : form.title || c(`defaultTitle.${form.occasion}`);
  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value, ...(name === "title" ? { titleTouched: true } : {}) }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const errorText = (name) => (errors[name] ? c(`errors.${errors[name]}`) : undefined);

  async function onSubmit(event) {
    event.preventDefault();
    const values = { ...form, title };
    const found = validateShare(values);
    setErrors(found);
    const invalid = ORDER.filter((k) => found[k]);
    if (invalid.length) {
      setStatus({ type: "summary", title: c("share.summaryTitle"), items: invalid.map((k) => ({ id: id(k), text: c(`errors.${found[k]}`) })) });
      focusField(id(invalid[0]));
      return;
    }
    setBusy(true);
    setStatus(null);
    const website = formRef.current?.elements?.namedItem?.("website")?.value || "";
    const res = await postJson("/api/wunschliste", {
      locale,
      occasion: values.occasion,
      title: values.title.trim(),
      date: values.date || "",
      message: values.message,
      understood: true,
      website,
      items: cartItems.map((i) => ({ id: i.id ?? null, name: i.name, category: i.category || "", image: i.image || "", href: i.href || "" })),
    });
    setBusy(false);
    if (!res.ok || !res.shareUrl) {
      const code = res.error === "invalid" ? (res.fields?.includes("items") ? "items" : "generic") : res.error;
      setStatus({ type: "error", text: c(`errors.${["rate_limited", "unavailable", "network", "items"].includes(code) ? code : "generic"}`) });
      return;
    }
    rememberList({ token: res.adminToken, title: values.title.trim(), ref: res.ref, locale });
    listStore.refresh();
    setCreated({ ...res, title: values.title.trim() });
    setOpen(false);
  }

  const manageHref = (token) => `/${locale}/wunschliste/verwalten#${token}`;

  return (
    <section aria-labelledby={id("heading")} className="bg-surface-band py-section" data-wunschliste-teilen>
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Gift aria-hidden="true" className="size-6 text-text-soft" strokeWidth={1.25} />
            <Heading level={2} size="display-m" id={id("heading")} className="mt-4 text-balance">
              {c("share.heading")}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-text-soft text-pretty">{c("share.openNote")}</p>
          </div>

          <div className="min-w-0 lg:col-span-7">
            {created ? (
              <div ref={successRef} tabIndex={-1} role="status" className="ph-arrive focus-visible:outline-none">
                <p className="text-title text-text">{c("share.created")}</p>
                <SharePanel className="mt-6" shareUrl={created.shareUrl} qr={created.qr} manageUrl={created.manageUrl} title={created.title} />
                <div className="mt-8 flex flex-wrap gap-3">
                  {/* absolute URL → einfaches <a> (voller Seitenaufruf, Schlüssel im #Fragment) */}
                  <Button href={created.manageUrl} arrow>
                    {c("share.adminOpen")}
                  </Button>
                  {count > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCreated(null);
                        setForm({ occasion: "einzug", title: "", titleTouched: false, date: "", message: "", understood: false });
                        setOpen(true);
                      }}
                    >
                      {c("share.newList")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              count > 0 && (
                <>
                  {!open && (
                    <Button variant="secondary" onClick={() => setOpen(true)} aria-expanded="false" aria-controls={id("form")} className="w-full sm:w-auto">
                      {c("share.open")}
                    </Button>
                  )}
                  {open && (
                    <form id={id("form")} ref={formRef} method="post" noValidate onSubmit={onSubmit} className="relative space-y-8" aria-labelledby={id("heading")}>
                      <Honeypot id={id("website")} />
                      <p className="text-small text-text-soft">{c("share.pieces", { count })}</p>
                      <RadioCards
                        id={id("occasion")}
                        name="occasion"
                        legend={c("share.occasionLegend")}
                        legendSize="label"
                        options={OCCASIONS.map((o) => ({ value: o, label: c(`occasion.${o}`) }))}
                        value={form.occasion}
                        onChange={(v) => set("occasion", v)}
                        error={errorText("occasion")}
                        className="[&>div]:sm:grid-cols-2"
                      />
                      <FormField
                        id={id("title")}
                        name="title"
                        label={c("share.title")}
                        required
                        maxLength={LIMITS.title}
                        value={title}
                        onChange={(e) => set("title", e.target.value)}
                        hint={c("share.titleHint")}
                        error={errorText("title")}
                        autoComplete="off"
                      />
                      <FormField
                        id={id("date")}
                        name="date"
                        type="date"
                        label={c("share.date")}
                        optionalText={c("share.optional")}
                        value={form.date}
                        onChange={(e) => set("date", e.target.value)}
                        hint={c("share.dateHint", { months: retentionMonths })}
                        error={errorText("date")}
                        className="max-w-xs"
                      />
                      <FormField
                        id={id("message")}
                        name="message"
                        as="textarea"
                        label={c("share.message")}
                        optionalText={c("share.optional")}
                        maxLength={LIMITS.message}
                        value={form.message}
                        onChange={(e) => set("message", e.target.value)}
                        hint={c("share.messageHint")}
                      />
                      <div id={id("understood")} tabIndex={-1} className="focus:outline-none">
                        <label htmlFor={id("understood-box")} className="flex cursor-pointer items-start gap-3 text-body text-text">
                          <input
                            id={id("understood-box")}
                            type="checkbox"
                            name="understood"
                            checked={form.understood}
                            onChange={(e) => set("understood", e.target.checked)}
                            aria-invalid={errors.understood ? true : undefined}
                            aria-describedby={errors.understood ? `${id("understood")}-error` : undefined}
                            required
                            className="mt-1 size-5 flex-none accent-ink"
                          />
                          <span>{c("share.understood")}</span>
                        </label>
                        <FieldError id={`${id("understood")}-error`}>{errorText("understood")}</FieldError>
                      </div>
                      <p className="max-w-measure text-small text-text-soft">
                        {c("share.privacy")}{" "}
                        <Link href="/datenschutz" className="underline underline-offset-4">
                          {c("share.privacyLink")}
                        </Link>
                      </p>
                      <FormAlert status={status} />
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button type="submit" disabled={!hydrated || busy} aria-busy={busy || undefined} className="w-full sm:w-auto">
                          {c("share.submit")}
                        </Button>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                          {c("share.cancel")}
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )
            )}

            {saved.length > 0 && (
              <div className="mt-12 border-t border-line pt-6">
                <h3 className="text-ui text-text">{c("share.yourLists")}</h3>
                <p className="text-small text-text-soft">{c("share.yourListsNote")}</p>
                <ul className="mt-3 divide-y divide-line">
                  {saved.map((entry) => (
                    <li key={entry.token} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <a href={manageHref(entry.token)} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
                        {entry.title || entry.ref}
                      </a>
                      <span className="flex items-center gap-2">
                        <span className="tabular text-small text-text-soft">{entry.ref}</span>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            forgetList(entry.token);
                            listStore.refresh();
                          }}
                          aria-label={`${c("manage.forget")}: ${entry.title || entry.ref}`}
                        >
                          {c("manage.forget")}
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
