"use client";

// Confirmation card for ONE website-agent proposal (architecture §5.2). Nothing
// happens without a click on "Ausführen"; "Nein, danke" is the same size.
// Marked as "KI-Vorschlag" (AI Act Art. 50); the appointment note as
// "KI-Entwurf – bitte prüfen". Navigation: "Wird geöffnet …" until ChatCore
// sees the target page; after 12 s a direct link to the checked target.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { ROUTES } from "@/utils/routing";
import { checkAction } from "@/lib/concierge/actionKinds";
import { fill } from "./texts";
import s from "../panel.module.css";

const SLOW_MS = 12000;

// Readable filter of a catalogue proposal ("Marke: Minotti"); the URL stays hidden.
function filterText(action, t) {
  if (action.kind !== "catalog_filter") return "";
  const parts = [];
  for (const [k, v] of Object.entries(action.params?.filters || {})) {
    if (!Array.isArray(v) || !v.length) continue;
    const vals = v.map((x) => String(x).replace(/-/g, " ").replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase()));
    parts.push(`${t.filterNames?.[k] || k}: ${vals.join(", ")}`);
  }
  return parts.join(" · ");
}

export default function ActionCard({ action, status, t, locale, onRun, onDecline, onUndo, reveal }) {
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);
  const timer = useRef(0);
  const ref = useRef(null);
  const statusRef = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A new proposal scrolls into view inside the log (never the page).
  const fresh = useRef(status === "pending");
  useEffect(() => {
    if (!fresh.current) return;
    fresh.current = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, []);

  // Every later status change (opening, done, failed, undone …): keep the new
  // status line with its buttons/links in view above the composer (QA2 P2-1).
  // ChatCore decides (reveal): only the latest answer, only if the visitor has
  // not scrolled up on purpose.
  const lastStatus = useRef(status);
  useEffect(() => {
    if (lastStatus.current === status) return;
    lastStatus.current = status;
    if (status === "pending") return;
    reveal?.(statusRef.current || ref.current);
  }, [status, reveal]);

  useEffect(() => {
    if (status !== "opening") return undefined;
    const left = SLOW_MS - (Date.now() - (action.since || Date.now()));
    const tm = setTimeout(() => setSlow(true), Math.max(0, left));
    return () => {
      clearTimeout(tm);
      setSlow(false);
    };
  }, [status, action.since]);

  const check = checkAction(action, { locale });
  const href = check.ok ? check.href : null;
  const count = Number.isFinite(action.count) ? (action.count === 1 ? t.piece : fill(t.pieces, { n: action.count })) : "";
  const note = action.kind === "appointment_form" ? action.params?.note : "";
  const active = status === "pending" && check.ok;
  const titleId = `act-${action.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* text stays selectable */
    }
  };

  const statusText =
    status === "done" ? t.done : status === "declined" ? t.declined : status === "failed" || !check.ok ? t.failed : status === "stale" ? t.stale : status === "undone" ? t.undone : "";

  return (
    <section ref={ref} className={s.action} data-status={status} aria-labelledby={titleId}>
      <p className={s.actionEyebrow}>{t.proposal}</p>
      <p id={titleId} className={s.actionTitle}>
        {t.kind[action.kind]}: <strong>{action.label}</strong>
        {count && <span className={s.actionMeta}> – {count}</span>}
      </p>
      {action.summary && action.kind !== "appointment_form" && action.kind !== "catalog_filter" && <p className={s.actionMeta}>{action.summary}</p>}
      {note && (
        <div className={s.draft}>
          <p className={s.draftLabel}>{t.draft}</p>
          <p>{note}</p>
          <button type="button" className={s.textBtn} onClick={copy}>
            <Copy size={14} aria-hidden="true" /> {copied ? t.copied : t.copy}
          </button>
          <p className={s.actionMeta}>{t.formHint}</p>
        </div>
      )}
      {href && (
        <p className={s.actionPath}>
          {t.target}: <span>{decodeURIComponent(href.split(/[?#]/)[0])}</span>
          {filterText(action, t) && ` · ${filterText(action, t)}`}
          {action.deOnly && ` · ${t.deOnly}`}
        </p>
      )}
      {active ? (
        <div className={s.actionButtons}>
          <button type="button" className={s.primary} onClick={onRun}>
            {t.run}
          </button>
          <button type="button" className={s.secondary} onClick={onDecline}>
            {t.decline}
          </button>
        </div>
      ) : status === "running" || status === "opening" ? (
        <div ref={statusRef} className={s.actionDone} aria-busy="true">
          <p className={s.actionStatus} role="status">
            <span className={s.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {status === "opening" ? t.opening : t.wait}
          </p>
          {status === "opening" && slow && href && (
            <p className={s.actionMeta}>
              {t.slow}{" "}
              <a href={href} className={s.tapLink}>
                {t.openDirect}
              </a>
            </p>
          )}
        </div>
      ) : (
        <div ref={statusRef} className={s.actionDone}>
          <p className={s.actionStatus} role="status">
            {status === "done" && <Check size={16} aria-hidden="true" />} {statusText}
          </p>
          {status === "done" && action.kind === "save_to_selection" && (
            <>
              <button type="button" className={s.textBtn} onClick={onUndo}>
                {t.undo}
              </button>
              <Link href={`/${locale}${ROUTES.merkliste[locale] || ROUTES.merkliste.de}`} className={s.tapLink}>
                {t.viewSelection}
              </Link>
            </>
          )}
          {status === "done" && note && <p className={s.actionMeta}>{action.copied ? t.draftCopied : t.draftCopyFailed}</p>}
          {status === "done" && href && <p className={s.actionMeta}>{t.back}</p>}
        </div>
      )}
    </section>
  );
}
