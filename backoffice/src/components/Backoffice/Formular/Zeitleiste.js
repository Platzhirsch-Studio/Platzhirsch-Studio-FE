"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import { kommentarAction } from "@/lib/backoffice/actions";
import { anzeige } from "@/lib/backoffice/labels";
import { VERLAUF } from "./texte";
import "./formular.css";

const INTERN = new Set(["name", "workflow_state", "owner", "creation", "modified", "modified_by", "docstatus", "idx", "naming_series", "amended_from", "_assign", "_comments", "_liked_by", "_user_tags"]);
const ICON = { Version: "History", Workflow: "ArrowRight", Attachment: "Paperclip", Comment: "MessageSquare" };

/**
 * Verlauf im Lounge-Stil (lounge.md §6 „Zeitleiste“; Team P0-5b): Kachel ohne Rahmen, je Eintrag ein
 * Symbolkreis in Materialfläche (Kommentar Cognac, Änderung See, Anhang Eiche), Titel + Zeit rechts,
 * Text, Urheber klein mit Avatar. Kommentarfeld als eingelassene Fläche. Änderungen zeigen Feld-Labels
 * statt technischer Feldnamen (`feldLabels`: fieldname → Label).
 * @param {{doctype:string, name:string, docinfo:{comments?:object[], versions?:object[], attachments?:object[]}, darfSchreiben:boolean, feldLabels?:Record<string,string>}} props
 */
export default function Zeitleiste({ doctype, name, docinfo = {}, darfSchreiben, feldLabels = {} }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const eintraege = [
    ...(docinfo.comments || []).map((c) => ({ art: c.comment_type === "Workflow" ? "Workflow" : "Comment", text: String(c.content || "").replace(/<[^>]*>/g, ""), von: c.owner, zeit: c.creation, key: `k-${c.name}` })),
    ...(docinfo.versions || []).map((v) => {
      let data = v.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {
        data = {};
      }
      // Interne Felder (Name, Workflow-Zustand neben dem Status, Systemfelder) erscheinen nicht; leere Werte als „–“.
      const sichtbar = (data?.changed || []).filter(([f]) => !INTERN.has(f));
      const leer = (w) => w === null || w === undefined || w === "";
      const wert = (w) => (leer(w) ? "–" : `„${w}“`);
      const nurNeu = sichtbar.length > 0 && sichtbar.every(([, a]) => leer(a));
      const changed = nurNeu ? [] : sichtbar.map(([f, a, b]) => `${feldLabels[f] || anzeige(f)}: ${wert(a)} → ${wert(b)}`);
      return { art: "Version", text: changed.length ? changed.join(" · ") : VERLAUF.angelegt, von: v.owner, zeit: v.creation, key: `v-${v.name}` };
    }),
    ...(docinfo.attachments || []).map((a) => ({ art: "Attachment", text: VERLAUF.datei(a.file_name), von: a.owner, zeit: a.creation, key: `a-${a.name}`, href: a.file_url })),
  ].sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));

  const senden = () =>
    start(async () => {
      const r = await kommentarAction({ doctype, name, text });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      setText("");
      router.refresh();
    });

  return (
    <section aria-labelledby="bo-zeitleiste" className="bo-kachel min-w-0">
      <div className="bo-kachel__kopf">
        <div className="min-w-0">
          <h2 id="bo-zeitleiste" className="bo-kachel__titel">
            {VERLAUF.titel}
          </h2>
          <p className="bo-kachel__unter">{VERLAUF.unter}</p>
        </div>
      </div>
      {darfSchreiben && (
        <div className="mb-6 flex min-w-0 items-end gap-2 rounded-bo-karte bg-bo-surface-2 p-2">
          <label className="sr-only" htmlFor="bo-kommentar">
            {VERLAUF.kommentar}
          </label>
          <textarea id="bo-kommentar" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={VERLAUF.platzhalter} className="min-h-12 w-full min-w-0 resize-y rounded-[14px] bg-transparent px-3 py-2 text-[15px] leading-[22px] text-bo-text outline-none placeholder:text-bo-text-faint focus-visible:bg-bo-surface focus-visible:shadow-[0_0_0_2px_var(--color-bo-focus)]" />
          <Knopf variant="primary" icon="ArrowUp" onClick={senden} disabled={pending || !text.trim()} laedt={pending}>
            {VERLAUF.senden}
          </Knopf>
        </div>
      )}
      <ol className="flex flex-col gap-5">
        {eintraege.length === 0 && <li className="text-[15px] text-bo-text-soft">{VERLAUF.leer}</li>}
        {eintraege.map((e) => (
          <li key={e.key} className="bo-fo-verlauf__i">
            <span aria-hidden="true" className="bo-fo-verlauf__ico" data-art={e.art}>
              <Icon name={ICON[e.art] || "MessageSquare"} className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="truncate text-[15px] leading-[22px] font-semibold">{VERLAUF.arten[e.art] || VERLAUF.arten.Comment}</span>
                <time dateTime={e.zeit} title={datumZeit(e.zeit)} suppressHydrationWarning className="shrink-0 text-[13px] tabular-nums text-bo-text-soft">
                  {relativ(e.zeit)}
                </time>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-5 text-bo-text-soft">
                {e.href ? (
                  <a href={`/api/datei?url=${encodeURIComponent(e.href)}`} className="inline-flex items-center gap-2 rounded-[14px] bg-bo-surface-2 px-3 py-2 font-medium text-bo-text hover:bg-bo-fill-2">
                    <Icon name="FileText" className="size-4" />
                    {e.text}
                  </a>
                ) : (
                  e.text
                )}
              </p>
              {e.von && (
                <p className="mt-1.5 flex min-w-0 items-center gap-2 text-[12px] text-bo-text-soft">
                  <Avatar name={String(e.von).split("@")[0]} groesse={20} ring={false} dekorativ />
                  <span className="truncate">{e.von}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
