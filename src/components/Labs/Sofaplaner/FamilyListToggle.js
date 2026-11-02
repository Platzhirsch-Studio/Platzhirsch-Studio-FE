"use client";
import { useState } from "react";
import s from "./sofaplaner.module.css";

// Client part of FamilyList.js (Tempo fix2): only the open/closed state lives
// here, every text arrives resolved from the server. countText keeps its
// "{n}" placeholder and is filled per row (same rule as makeT's fill()).
export default function FamilyListToggle({ items, locale, modelWord, summary, countText, outdoorText = "Outdoor" }) {
  const [open, setOpen] = useState(false);
  return (
    <details className={s.more} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{summary}</summary>
      {open && (
        <ul className={s.familyList}>
          {items.map(([slug, name, count, , outdoor]) => (
            <li key={slug}>
              <a href={`/${locale}/sofaplaner?m=${slug}`}>{modelWord} {name}</a>
              <span className={s.muted}>
                {" "}
                · {String(countText).replace(/\{n\}/g, String(count))}{outdoor ? ` · ${outdoorText}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
