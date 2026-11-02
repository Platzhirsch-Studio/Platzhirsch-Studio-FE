"use client";
// Verwaltung einer geteilten Wunschliste (nur Ersteller, Schlüssel im #Fragment).
// Zeigt: Teilen-Werkzeuge, Stücke mit Reservierung (Name/Notiz, falls
// angegeben), Beiträge zum Gemeinschafts-Gutschein (ohne E-Mail), Aktionen
// Abgleich mit der Merkliste, neuer Link, Widerruf/wieder teilen, Löschen.
// Jede Aktion meldet ihr Ergebnis in einer höflichen Live-Region; Löschen
// braucht eine zweite Bestätigung (Bibel §2 P8: nichts passiert aus Versehen).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Circle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import { ROUTES } from "@/utils/routing";
import { ADMIN_TOKEN_RE } from "@/lib/wunschliste/config";
import { formatAmount, formatDate } from "@/lib/wunschliste/copy";
import { forgetList, postJson, rememberList } from "./client";
import SharePanel from "./SharePanel";
import useWlCopy from "./useWlCopy";

const subscribeHash = (fn) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
const readHash = () => decodeURIComponent(window.location.hash.replace(/^#/, ""));

export default function ManageClient() {
  const { locale, c } = useWlCopy();
  const { cartItems } = useCart();
  const token = useSyncExternalStore(subscribeHash, readHash, () => null);
  const [state, setState] = useState({ phase: "loading" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const headingRef = useRef(null);

  const run = useCallback(
    async (action, payload = {}) => {
      setBusy(true);
      const res = await postJson("/api/wunschliste/verwalten", { token, action, ...payload });
      setBusy(false);
      return res;
    },
    [token]
  );

  const valid = typeof token === "string" && ADMIN_TOKEN_RE.test(token);

  useEffect(() => {
    if (!valid) return undefined;
    let alive = true;
    postJson("/api/wunschliste/verwalten", { token, action: "view" }).then((res) => {
      if (!alive) return;
      if (res.ok) {
        setState({ phase: "ready", ...res });
        rememberList({ token, title: res.list.title, ref: res.list.ref, locale: res.list.locale });
      } else setState({ phase: res.status === 404 ? "notfound" : "error", error: res.error });
    });
    return () => {
      alive = false;
    };
  }, [token, valid]);

  async function act(action, message, payload) {
    setNotice("");
    const res = await run(action, payload);
    if (res.ok && res.deleted) {
      forgetList(token);
      setState({ phase: "deleted" });
      setNotice(c("manage.deleted"));
      headingRef.current?.focus();
      return;
    }
    if (res.ok) {
      setState({ phase: "ready", ...res });
      const kept = res.kept?.length ? ` ${c("manage.syncKept", { names: res.kept.join(", ") })}` : "";
      setNotice(`${message}${kept}`);
    } else setNotice(c(`errors.${["rate_limited", "network", "not_found", "items"].includes(res.error) ? res.error : res.error === "no_items" ? "items" : "generic"}`));
  }

  const merkliste = `/${locale}${ROUTES.merkliste[locale] || ROUTES.merkliste.de}`;

  if (token === null || (valid && state.phase === "loading")) {
    return (
      <p role="status" className="text-body text-text-soft">
        {c("manage.loading")}
      </p>
    );
  }

  const shell = (text) => (
    <div className="max-w-text">
      <Heading level={1} size="display-m" ref={headingRef} tabIndex={-1}>
        {c("manage.title")}
      </Heading>
      <p role="status" className="mt-stack-s text-body text-text">
        {text}
      </p>
      <a href={merkliste} className="mt-6 inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
        {c("manage.back")}
      </a>
    </div>
  );

  if (!valid) return shell(c("manage.missing"));
  if (state.phase === "notfound") return shell(c("manage.notFound"));
  if (state.phase === "deleted") return shell(c("manage.deleted"));
  if (state.phase === "error") return shell(c(`errors.${state.error === "network" ? "network" : "generic"}`));

  const { list, summary, shareUrl, qr } = state;
  const active = list.status === "aktiv";
  const reservedCount = list.items.filter((i) => i.reserved).length;

  return (
    <div>
      <header className="max-w-text">
        <Eyebrow>
          {c("manage.title")} · {c(`occasion.${list.occasion}`)}
        </Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance wrap-break-word" ref={headingRef} tabIndex={-1}>
          {list.title}
        </Heading>
        <p className="mt-4 text-ui text-text-soft">
          <span className="tabular">{list.ref}</span> · {active ? c("manage.statusActive") : c("manage.statusRevoked")} · {c("manage.expires", { date: formatDate(list.expiresAt, locale) })}
        </p>
      </header>

      <p role="status" aria-live="polite" className="mt-6 min-h-6 max-w-measure text-ui text-text">
        {notice}
      </p>

      {active && shareUrl && <SharePanel className="mt-8" shareUrl={shareUrl} qr={qr} title={list.title} />}

      <section aria-labelledby="wl-m-res" className="mt-section">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <Heading level={2} id="wl-m-res">
            {c("manage.reservations")}
          </Heading>
          <p className="tabular text-small text-text-soft">
            {reservedCount} / {list.items.length}
          </p>
        </div>
        {reservedCount === 0 && <p className="mt-4 text-body text-text-soft">{c("manage.noReservations")}</p>}
        <ul className="mt-4 divide-y divide-line">
          {list.items.map((item) => (
            <li key={item.key} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                {item.brand && <p className="text-overline uppercase text-text-soft">{item.brand}</p>}
                <p className="text-ui text-text">{item.name}</p>
                <p className="mt-1 inline-flex items-start gap-2 text-small text-text-soft">
                  {item.reserved ? <Check aria-hidden="true" className="mt-0.5 size-4 flex-none text-text" strokeWidth={1.75} /> : <Circle aria-hidden="true" className="mt-0.5 size-4 flex-none" strokeWidth={1.25} />}
                  <span>
                    {item.reserved ? (item.reservation?.name ? c("manage.reservedBy", { name: item.reservation.name }) : c("manage.reservedAnon")) : c("manage.open")}
                    {item.reservation?.note ? ` – „${item.reservation.note}“` : ""}
                  </span>
                </p>
              </div>
              {item.reserved && (
                <Button variant="ghost" disabled={busy} onClick={() => act("release", c("public.released"), { item: item.key })} aria-label={c("manage.ownerReleaseLabel", { name: item.name })}>
                  {c("manage.ownerRelease")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="wl-m-con" className="mt-section">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <Heading level={2} id="wl-m-con">
            {c("manage.contributions")}
          </Heading>
          {summary.count > 0 && <p className="text-small text-text-soft">{c("manage.summary", { count: summary.count, paid: summary.paidCount })}</p>}
        </div>
        {list.contributions.length === 0 ? (
          <p className="mt-4 text-body text-text-soft">{c("manage.noContributions")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {list.contributions.map((entry) => (
              <li key={entry.id} className="py-4">
                <p className="text-ui text-text">{entry.anonymous || !entry.name ? c("manage.contribAnon") : entry.name}</p>
                <p className="mt-1 text-small text-text-soft">
                  {c(`manage.status.${entry.status}`)}
                  {entry.amount ? ` · ${c("manage.suggested", { amount: formatAmount(entry.amount, locale) })}` : ""} · {formatDate(entry.at, locale)}
                </p>
                {entry.message && <p className="mt-2 max-w-measure whitespace-pre-line text-body text-text wrap-break-word">{entry.message}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 max-w-measure text-small text-text-soft">{c("manage.contribNote")}</p>
      </section>

      <section aria-label={c("manage.title")} className="mt-section grid gap-8 border-t border-line pt-8 md:grid-cols-2">
        {active && (
          <div>
            <Button variant="secondary" disabled={busy || cartItems.length === 0} onClick={() => act("sync", c("manage.synced"), { items: cartItems.map((i) => ({ id: i.id ?? null, name: i.name, category: i.category || "", image: i.image || "", href: i.href || "" })) })}>
              {c("manage.sync")}
            </Button>
            <p className="mt-2 max-w-measure text-small text-text-soft">{c("manage.syncNote")}</p>
          </div>
        )}
        {active && (
          <div>
            <Button variant="secondary" disabled={busy} onClick={() => act("rotate", c("manage.rotated"))}>
              {c("manage.rotate")}
            </Button>
            <p className="mt-2 max-w-measure text-small text-text-soft">{c("manage.rotateNote")}</p>
          </div>
        )}
        <div>
          {active ? (
            <Button variant="secondary" disabled={busy} onClick={() => act("revoke", c("manage.revoked"))}>
              {c("manage.revoke")}
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => act("restore", c("manage.restored"))}>
              {c("manage.restore")}
            </Button>
          )}
          {active && <p className="mt-2 max-w-measure text-small text-text-soft">{c("manage.revokeNote")}</p>}
        </div>
        <div>
          {!confirmDelete ? (
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)} className="text-error">
              {c("manage.delete")}
            </Button>
          ) : (
            <div role="group" aria-label={c("manage.delete")} className="border-l-2 border-error pl-4">
              <p className="text-body text-text">{c("manage.deleteConfirm")}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button disabled={busy} onClick={() => act("delete", c("manage.deleted"))}>
                  {c("manage.deleteYes")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {c("share.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <a href={merkliste} className="mt-12 inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
        {c("manage.back")}
      </a>
    </div>
  );
}
