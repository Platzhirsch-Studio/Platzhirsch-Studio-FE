"use client";
// /[locale]/ideenboard – die Pinnwand der Besucherin (Insel).
// Karten aus dem Browser-Speicher (clientStore), Notiz je Karte, Sortieren per
// Ziehen ODER per Knopf (WCAG 2.5.7), Teilen mit geheimem, widerrufbarem Link,
// „An Termin anhängen“ (Teilen-Link als ?ideenboard=<shareId>) und
// „Auf Pinterest übernehmen“ (Merken-Link je Karte, CSV, Textliste).
// Ein Primärknopf pro Ansicht: „Termin mit Ideenboard buchen“ – NUR wenn die
// Terminbuchung ?ideenboard= übernimmt (terminConnected, IDEENBOARD_TERMIN=on).
// Sonst ehrlicher Weg: Teilen-Link erstellen und in die Anfrage kopieren
// (QA Technik P0).
// Texte: src/messages (pinterest.*, ideenboard.*) als Prop `copy` vom Server.
// Fokus (WCAG 2.4.3): nach dem Verschieben bleibt er am Knopf bzw. springt
// zum Gegenknopf, wenn die Karte am Anfang/Ende landet; nach „Entfernen“ auf
// „Rückgängig“, nach „Rückgängig“ auf den Entfernen-Knopf der Karte. Ziehen
// nur am Griff, damit Text im Notizfeld markierbar bleibt.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Copy, Download, GripVertical, Link2, Plus, Trash2, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import Lead from "@/components/ui/Lead";
import { addToBoard, boardStamp, getBoard, moveInBoard, noteInBoard, removeFromBoard, saveBoard, saveShare, useBoard, useShare } from "@/lib/ideenboard/clientStore";
import { boardAsText, cardSource, cardsFromMerkliste, pinnable, pinterestCsv } from "@/lib/ideenboard/model";
import { LIMITS, RETENTION_MONTHS, TERMIN_PARAM } from "@/lib/ideenboard/config";
import { pinDescription, SITE_URL } from "@/lib/pinterest/url";
import { pinRights } from "@/lib/pinterest/rights";
import { fmt } from "@/lib/pinterest/copy";
import PinterestSave from "./PinterestSave";
import BoardCardMedia from "./BoardCardMedia";
// Rat 9,5 B9 (T2): Ideenboard = Reiter „Ideen“ von „Ihre Auswahl“ (♡).
import SelectionTabs from "@/components/CartPage/SelectionTabs";

const cx = (...p) => p.filter(Boolean).join(" ");
const CTRL = "inline-flex min-h-11 items-center gap-2 px-3 text-small text-text transition-colors duration-(--duration-micro) hover:bg-ink/5 disabled:opacity-50";
const FIELD = "block w-full border border-line-control bg-surface px-3 py-3 text-ui text-text placeholder:text-text-soft focus-visible:border-ink";

async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.code || "error");
    err.status = res.status;
    throw err;
  }
  return data;
}

/** @param {{pinterest: object, ideenboard: object}} copy Texte vom Server (getPinCopy), ideenboard.seite ist nicht im Client-Payload */
export default function IdeenboardPage({ copy, locale = "de", terminPath, terminConnected = false, shareAvailable = true }) {
  const t = copy.ideenboard;
  const board = useBoard();
  const share = useShare();
  const router = useRouter();
  const { cartItems } = useCart();
  const [status, setStatus] = useState("");
  const [undo, setUndo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [boardName, setBoardName] = useState(t.export.boardDefault);
  const [dragFrom, setDragFrom] = useState(-1);
  const [dragOver, setDragOver] = useState(-1);
  const focusAfter = useRef(null);
  const cards = board.cards;
  const total = cards.length;

  const say = (msg) => setStatus(msg);

  // Fokus nach Umsortieren/Entfernen/Rückgängig gezielt setzen (nie <body>):
  // erste vorhandene, nicht deaktivierte Fundstelle der Liste.
  useEffect(() => {
    if (!focusAfter.current) return;
    const list = [].concat(focusAfter.current);
    focusAfter.current = null;
    const el = list.map((q) => document.querySelector(q)).find((x) => x && !x.disabled);
    el?.focus();
  }, [board, undo]);

  const fromMerkliste = useMemo(() => {
    const known = new Set(cards.map((c) => c.id));
    return cardsFromMerkliste(cartItems, locale).filter((c) => !known.has(c.id));
  }, [cartItems, cards, locale]);

  const importMerkliste = () => {
    let n = 0;
    for (const c of fromMerkliste) if (addToBoard(c).added) n++;
    say(n ? fmt(t.importDone, { n }) : t.importNone);
  };

  const addNote = (e) => {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    const r = addToBoard({ type: "notiz", title: text.slice(0, 60), note: text, addedAt: new Date().toISOString() });
    if (r.added) {
      setNoteText("");
      say(t.noteCard.added);
    }
  };

  const move = (from, to, dir) => {
    if (to < 0 || to >= total) return;
    const c = cards[from];
    // Landet die Karte am Anfang/Ende, ist der gedrückte Knopf danach
    // deaktiviert: dann Gegenknopf, zuletzt die Karte selbst.
    const other = dir === "up" ? "down" : "up";
    const atEdge = (dir === "up" && to === 0) || (dir === "down" && to === total - 1);
    const card = `[data-card-id="${c.id}"]`;
    focusAfter.current = [`${card} [data-move="${atEdge ? other : dir}"]`, `${card} [data-move="${dir}"]`, `${card} article`];
    moveInBoard(from, to);
    say(fmt(t.card.moved, { title: c.title, pos: to + 1, total }));
  };

  const remove = (idx) => {
    const c = cards[idx];
    focusAfter.current = ["[data-ideenboard-undo]"];
    setUndo({ card: c, idx });
    removeFromBoard(c.id);
    say(fmt(t.card.removed, { title: c.title }));
  };

  const undoRemove = () => {
    if (!undo) return;
    const b = getBoard();
    const list = b.cards.filter((x) => x.id !== undo.card.id);
    list.splice(Math.min(undo.idx, list.length), 0, undo.card);
    focusAfter.current = [`[data-card-id="${undo.card.id}"] [data-card-remove]`, `[data-card-id="${undo.card.id}"] article`];
    saveBoard({ ...b, cards: list });
    say(fmt(t.addedStatus, { title: undo.card.title }));
    setUndo(null);
  };

  // ---- Teilen ------------------------------------------------------------
  const stamp = boardStamp(board);
  const stale = Boolean(share && share.stamp !== stamp);
  const shareUrl = share ? `${window.location.origin}/${locale}/ideenboard/${share.shareId}` : "";

  async function ensureShared() {
    if (share && !stale) return share;
    if (share) {
      await api("/api/ideenboard/manage", { token: share.token, action: "sync", board });
      const next = { ...share, stamp };
      saveShare(next);
      return next;
    }
    const r = await api("/api/ideenboard", { board });
    const next = { token: r.adminToken, shareId: r.shareId, createdAt: r.board.createdAt, stamp };
    saveShare(next);
    return next;
  }

  async function run(fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if (e.status === 404 && share) {
        saveShare(null); // Link gelöscht oder abgelaufen: neu beginnen
      }
      say(e.status === 503 ? t.share.unavailable : t.share.error);
    } finally {
      setBusy(false);
    }
  }

  const doShare = () =>
    run(async () => {
      const had = Boolean(share);
      await ensureShared();
      say(had ? t.share.updated : t.share.created);
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      say(t.share.copied);
    } catch {
      say(shareUrl);
    }
  };

  const revoke = () =>
    run(async () => {
      await api("/api/ideenboard/manage", { token: share.token, action: "delete" });
      saveShare(null);
      say(t.share.revoked);
    });

  const renew = () =>
    run(async () => {
      const r = await api("/api/ideenboard/manage", { token: share.token, action: "renew", board });
      saveShare({ ...share, shareId: r.shareId, stamp });
      say(t.share.updated);
    });

  const attachTermin = () =>
    run(async () => {
      const s = await ensureShared();
      const q = new URLSearchParams({ [TERMIN_PARAM]: s.shareId });
      router.push(`${terminPath}?${q.toString()}`);
    });

  // ---- Pinterest-Übernahme ----------------------------------------------
  const pinCount = cards.filter(pinnable).length;
  // Möbel: subtitle ist die Marke (Merkliste category = brand, src/lib/shop/wishlistItem.js)
  const describe = (c) => pinDescription({ title: c.title, brand: c.type === "moebel" ? c.subtitle : c.quelle === "Ezarri" ? "Ezarri" : undefined, room: c.room, quelle: pinRights(c.image).quelle });

  const downloadCsv = () => {
    const csv = pinterestCsv(board, { boardName: boardName.trim() || t.export.boardDefault, site: SITE_URL, describe });
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ideenboard-pinterest.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const copyList = async () => {
    const text = boardAsText(board, { site: SITE_URL, labels: t.types });
    try {
      await navigator.clipboard.writeText(text);
      say(t.export.copiedList);
    } catch {
      say(t.share.error);
    }
  };

  const dateFmt = (iso) => {
    try {
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-surface text-text" data-ideenboard="">
      <p role="status" aria-live="polite" className="sr-only" data-ideenboard-status="">
        {status}
      </p>
      <Container className="pt-6 md:pt-8">
        <SelectionTabs active="ideen" locale={locale} />
      </Container>
      <Container as="header" className="pt-8 pb-8 md:pt-10 lg:pt-12">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s max-w-[20ch] text-balance">
          {t.title}
        </Heading>
        <Lead className="mt-stack-m max-w-measure">{t.lead}</Lead>
        <p className="mt-4 max-w-measure text-small text-text-soft">{t.privacyLocal}</p>
      </Container>

      <Container className="pb-section">
        {/* Werkzeugleiste: Merkliste holen, Notiz-Karte */}
        <div className="flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-end md:justify-between">
          <p className="text-ui tabular-nums" data-ideenboard-count="" tabIndex={-1}>
            {total === 1 ? t.countOne : fmt(t.count, { n: total })}
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            {fromMerkliste.length > 0 && (
              <Button variant="secondary" onClick={importMerkliste} data-ideenboard-import="">
                {fmt(t.importMerkliste, { n: fromMerkliste.length })}
              </Button>
            )}
            <form onSubmit={addNote} className="flex flex-col gap-1 md:w-96 xl:w-[36rem]" aria-label={t.noteCard.add}>
              <label htmlFor="ib-note-new" className="text-small text-text-soft">
                {t.noteCard.label}
              </label>
              <div className="flex gap-2">
                <input id="ib-note-new" value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={LIMITS.note} placeholder={t.noteCard.placeholder} className={FIELD} />
                <button type="submit" className="ph-press inline-flex min-h-12 shrink-0 items-center gap-2 border border-ink px-4 text-ui transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper" aria-label={t.noteCard.save}>
                  <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  <span className="max-sm:sr-only">{t.noteCard.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {undo && (
          <div className="mt-4 flex flex-wrap items-center gap-3 bg-surface-band px-4 py-2 text-small">
            <span>{fmt(t.card.removed, { title: undo.card.title })}</span>
            <button type="button" onClick={undoRemove} className={cx(CTRL, "underline underline-offset-4")} data-ideenboard-undo="">
              {t.card.undo}
            </button>
            <button
              type="button"
              onClick={() => {
                focusAfter.current = ["[data-card-id] [data-card-remove]", "[data-ideenboard-count]"];
                setUndo(null);
              }}
              className={CTRL}
              aria-label={t.card.dismiss}
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {total === 0 ? (
          <section aria-labelledby="ib-empty" className="mt-10 max-w-measure" data-ideenboard-empty="">
            <Heading id="ib-empty" level={2} size="title">
              {t.empty.title}
            </Heading>
            <p className="mt-stack-s text-body">{t.empty.text}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-ui">
              {locale === "de" && (
                <li>
                  <Link href="/ezarri/galerie" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.empty.ezarri}</Link>
                </li>
              )}
              {locale === "de" && (
                <li>
                  <Link href="/stil-finder" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.empty.stil}</Link>
                </li>
              )}
              <li>
                <Link href="/merkliste" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.empty.merkliste}</Link>
              </li>
            </ul>
          </section>
        ) : (
          <>
            <p className="mt-6 text-small text-text-soft" id="ib-drag-hint">
              {t.card.dragHint}
            </p>
            <ol className="mt-4 grid grid-cols-1 gap-x-grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-describedby="ib-drag-hint" data-ideenboard-cards="">
              {cards.map((c, i) => (
                <li
                  key={c.id}
                  data-card-id={c.id}
                  data-card-type={c.type}
                  onDragOver={(e) => {
                    if (dragFrom < 0) return;
                    e.preventDefault();
                    setDragOver(i);
                  }}
                  onDragLeave={() => setDragOver((v) => (v === i ? -1 : v))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragFrom >= 0 && dragFrom !== i) {
                      moveInBoard(dragFrom, i);
                      say(fmt(t.card.moved, { title: cards[dragFrom].title, pos: i + 1, total }));
                    }
                    setDragFrom(-1);
                    setDragOver(-1);
                  }}
                  onDragEnd={() => {
                    setDragFrom(-1);
                    setDragOver(-1);
                  }}
                  className={cx(
                    "flex flex-col transition-opacity duration-(--duration-micro)",
                    dragFrom === i && "opacity-50",
                    dragOver === i && dragFrom !== i && "outline-2 outline-offset-4 outline-ink"
                  )}
                >
                  <CardBody
                    c={c}
                    i={i}
                    n={total}
                    t={t}
                    onMove={move}
                    onRemove={remove}
                    onDragStart={(e) => {
                      setDragFrom(i);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                      const li = e.currentTarget.closest("li");
                      if (li) e.dataTransfer.setDragImage(li, 24, 24);
                    }}
                    onDragEnd={() => {
                      setDragFrom(-1);
                      setDragOver(-1);
                    }}
                  />
                </li>
              ))}
            </ol>
          </>
        )}

        {total > 0 && (
          <div className="mt-section grid gap-12 border-t border-line pt-10 lg:grid-cols-3 lg:gap-grid">
            {/* Termin */}
            <section aria-labelledby="ib-termin" data-ideenboard-termin="">
              <Heading id="ib-termin" level={2} size="title">
                <span className="inline-flex items-center gap-3">
                  <CalendarDays aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
                  {t.termin.title}
                </span>
              </Heading>
              {terminConnected ? (
                <>
                  <p className="mt-stack-s text-body">{t.termin.text}</p>
                  <Button onClick={attachTermin} arrow className="mt-6 w-full sm:w-auto" disabled={busy || !shareAvailable} data-ideenboard-termin-cta="">
                    {t.termin.cta}
                  </Button>
                  <p className="mt-2 text-small text-text-soft">{shareAvailable ? t.termin.hint : t.share.unavailable}</p>
                </>
              ) : (
                <>
                  <p className="mt-stack-s text-body">{t.termin.textManual}</p>
                  <Link href={terminPath} className="mt-4 inline-flex min-h-11 items-center text-ui underline underline-offset-4" data-ideenboard-termin-link="">
                    {t.termin.linkManual}
                  </Link>
                </>
              )}
            </section>

            {/* Teilen */}
            <section aria-labelledby="ib-share" data-ideenboard-share="">
              <Heading id="ib-share" level={2} size="title">
                <span className="inline-flex items-center gap-3">
                  <Link2 aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
                  {t.share.title}
                </span>
              </Heading>
              <p className="mt-stack-s text-body">{t.share.text}</p>
              {!shareAvailable ? (
                <p className="mt-4 text-small text-text-soft">{t.share.unavailable}</p>
              ) : share ? (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-small text-text-soft">{fmt(t.share.active, { date: dateFmt(share.createdAt || new Date().toISOString()) })}</p>
                  <label htmlFor="ib-share-url" className="sr-only">
                    {t.share.copy}
                  </label>
                  <input id="ib-share-url" readOnly value={shareUrl} className={cx(FIELD, "text-small")} onFocus={(e) => e.target.select()} data-ideenboard-share-url="" />
                  {stale && <p className="text-small text-notice">{t.share.stale}</p>}
                  <div className="-ml-3 flex flex-wrap">
                    <button type="button" onClick={copyLink} className={CTRL}>
                      <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />
                      {t.share.copy}
                    </button>
                    {stale && (
                      <button type="button" onClick={doShare} disabled={busy} className={CTRL} data-ideenboard-update="">
                        {t.share.update}
                      </button>
                    )}
                    <button type="button" onClick={renew} disabled={busy} className={CTRL}>
                      {t.share.renew}
                    </button>
                    <button type="button" onClick={revoke} disabled={busy} className={CTRL} data-ideenboard-revoke="">
                      <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
                      {t.share.revoke}
                    </button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" onClick={doShare} disabled={busy} className="mt-6 w-full sm:w-auto" data-ideenboard-share-create="">
                  {t.share.create}
                </Button>
              )}
              <p className="mt-3 text-small text-text-soft">{fmt(t.share.retention, { months: RETENTION_MONTHS })}</p>
            </section>

            {/* Pinterest */}
            <section aria-labelledby="ib-export" data-ideenboard-export="">
              <Heading id="ib-export" level={2} size="title">
                {t.export.title}
              </Heading>
              <p className="mt-stack-s text-body">{t.export.text}</p>
              <p className="mt-2 text-small text-text-soft tabular-nums">{fmt(t.export.pinnable, { n: pinCount, total })}</p>
              <div className="mt-4 flex flex-col gap-1">
                <label htmlFor="ib-board-name" className="text-small text-text-soft">
                  {t.export.boardName}
                </label>
                <input id="ib-board-name" value={boardName} maxLength={100} onChange={(e) => setBoardName(e.target.value)} className={FIELD} />
              </div>
              <div className="-ml-3 mt-3 flex flex-col items-start">
                <button type="button" onClick={downloadCsv} disabled={!pinCount} className={CTRL} data-ideenboard-csv="">
                  <Download aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  {t.export.csv}
                </button>
                <p className="px-3 text-small text-text-soft">{t.export.csvHint}</p>
                <p className="px-3 text-small text-text-soft" data-ideenboard-rights="">{t.export.rightsHint}</p>
                <button type="button" onClick={copyList} className={cx(CTRL, "mt-2")}>
                  <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  {t.export.copyList}
                </button>
              </div>
            </section>
          </div>
        )}
        <p className="mt-10 max-w-measure text-small text-text-soft">{t.pinterestPrivacy}</p>
      </Container>
    </div>
  );

}

function CardBody({ c, i, n, t, onMove, onRemove, onDragStart, onDragEnd }) {
  const noteId = `ib-note-${c.id}`;
  const rights = c.image ? pinRights(c.image) : null;
  const source = cardSource(c);
  // Merken nur mit Bildrecht UND eigenem Ziel (sonst zeigte der Pin auf das
  // leere, noindex-Board dieses Browsers – QA Technik P2-1).
  const canPinHere = pinnable(c) && Boolean(c.href);
  const maker = rights?.grund === "hersteller" || c.type === "moebel" || /^\/(?:cmx|cms)\//.test(c.image || "");
  const [draft, setDraft] = useState(c.note || "");
  // Notiz speichern beim Verlassen des Feldes (Bibel §9: Validierung/Speichern on blur)
  const commit = () => {
    if ((c.note || "") !== draft) noteInBoard(c.id, draft);
  };
  return (
    <article aria-labelledby={`ib-title-${c.id}`} className="relative flex h-full flex-col" tabIndex={-1}>
      {/* Ziehgriff nur für Maus/Stift (pointer-fine); Tastatur und Touch nutzen
          die Pfeil-Knöpfe (WCAG 2.5.7). */}
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title={t.card.dragHandle}
        aria-hidden="true"
        data-drag-handle=""
        className="absolute top-2 left-2 z-10 hidden size-11 cursor-grab items-center justify-center bg-paper/90 text-text active:cursor-grabbing pointer-fine:inline-flex"
      >
        <GripVertical className="size-5" strokeWidth={1.5} />
      </span>
      <BoardCardMedia card={c} />
      <p className="mt-3 text-overline uppercase text-text-accent">
        {t.types[c.type] || c.type}
        <span className="sr-only">, {fmt(t.card.position, { pos: i + 1, total: n })}</span>
      </p>
      <h2 id={`ib-title-${c.id}`} className={c.type === "notiz" ? "sr-only" : "mt-1 text-title text-text"}>
        {c.href ? (
          <a href={c.href} className="underline-offset-4 hover:underline">
            {c.title}
          </a>
        ) : (
          c.title
        )}
      </h2>
      {c.subtitle && <p className="mt-1 text-small text-text-soft">{c.subtitle}</p>}
      {source && <p className="mt-1 text-small text-text-soft">{fmt(t.card.source, { quelle: source })}</p>}
      {c.type === "notiz" ? null : (
        <div className="mt-3">
          <label htmlFor={noteId} className="text-small text-text-soft">
            {t.card.note}
          </label>
          <textarea
            id={noteId}
            value={draft}
            maxLength={LIMITS.note}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={t.card.notePlaceholder}
            className={cx(FIELD, "mt-1 resize-y text-body")}
          />
        </div>
      )}
      <div className="-ml-3 mt-2 flex flex-wrap items-center">
        <button type="button" data-move="up" onClick={() => onMove(i, i - 1, "up")} disabled={i === 0} className={CTRL} aria-label={fmt(t.card.upAria, { title: c.title })}>
          <ArrowUp aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="max-sm:sr-only">{t.card.up}</span>
        </button>
        <button type="button" data-move="down" onClick={() => onMove(i, i + 1, "down")} disabled={i === n - 1} className={CTRL} aria-label={fmt(t.card.downAria, { title: c.title })}>
          <ArrowDown aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="max-sm:sr-only">{t.card.down}</span>
        </button>
        <button type="button" onClick={() => onRemove(i)} className={CTRL} aria-label={fmt(t.card.removeAria, { title: c.title })} data-card-remove="">
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="max-sm:sr-only">{t.card.remove}</span>
        </button>
        {canPinHere && (
          <PinterestSave
            url={c.href}
            media={c.image}
            title={c.title}
            brand={c.type === "moebel" ? c.subtitle : c.quelle === "Ezarri" ? "Ezarri" : undefined}
            room={c.room}
            compact
          />
        )}
      </div>
      {c.image && !pinnable(c) && (
        <p className="text-small text-text-soft" data-card-nopin="">
          {maker ? t.card.noPin : t.card.noPinOther}
        </p>
      )}
    </article>
  );
}
