import { Fragment } from "react";
import { cx } from "@/components/ui";
import { kindOf, plain, tokenize } from "./inline";

// Rendering of the draft blocks. Server component, no state.
// Open points are <mark> with a dashed underline in "notice" (ink text on
// stone, 10.6:1) – visible without colour too, because the brackets stay.

const KIND_LABEL = {
  anwalt: "anwaltlich prüfen",
  inhaber: "vom Unternehmen auszufüllen",
  pruefen: "prüfen",
};

export const MARK_CLASS =
  "bg-stone text-text [box-decoration-break:clone] px-0.5 underline decoration-notice decoration-dashed decoration-2 underline-offset-4";

// Counting rule (Kanzlei, QM P2): one open point = one OUTERMOST bracket.
// A bracket inside another one (e.g. "[nur nach Vereinbarung, höchstens
// [3–5] % …]") is part of that point and is settled with it: it renders as a
// sub-mark without data-open-point, so the DOM count equals badges and list.
export const PART_CLASS = "font-medium underline decoration-notice decoration-dotted decoration-2 underline-offset-2";

function Tokens({ tokens, inMark = false }) {
  return tokens.map((tk, i) => {
    switch (tk.t) {
      case "b":
        return (
          <strong key={i} className="font-medium">
            <Tokens tokens={tk.c} inMark={inMark} />
          </strong>
        );
      case "i":
        return (
          <em key={i}>
            <Tokens tokens={tk.c} inMark={inMark} />
          </em>
        );
      case "code":
        return (
          <code key={i} className="break-words bg-surface-band px-1 font-mono text-[0.9em]">
            {tk.v}
          </code>
        );
      case "link": {
        const external = /^https?:/.test(tk.href);
        return (
          <a
            key={i}
            href={tk.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="break-words underline decoration-line-strong underline-offset-4 hover:decoration-current"
          >
            <Tokens tokens={tk.c} inMark={inMark} />
          </a>
        );
      }
      case "label":
        return (
          <span key={i} className="mx-0.5 inline-block border border-line-strong px-1.5 text-small font-medium">
            {tk.v}
          </span>
        );
      case "mark": {
        if (inMark) {
          return (
            <span key={i} className={PART_CLASS} data-open-point-part="">
              [<Tokens tokens={tk.c} inMark />]
            </span>
          );
        }
        const kind = kindOf(plain(tk.c));
        return (
          <mark key={i} className={MARK_CLASS} data-open-point={kind} title={`Offene Stelle: ${KIND_LABEL[kind]}`}>
            [<Tokens tokens={tk.c} inMark />]
          </mark>
        );
      }
      default:
        return <Fragment key={i}>{tk.v}</Fragment>;
    }
  });
}

/** `inMark`: the text already belongs to one open point (list entry), so inner brackets render as parts. */
export function Inline({ text, inMark = false }) {
  if (typeof text !== "string") return text ?? null;
  return <Tokens tokens={tokenize(text)} inMark={inMark} />;
}

const LIST = "mt-4 space-y-2 pl-5 marker:text-text-soft";

/** One block of a section (see docs/*.js for the shapes). */
export function Block({ block }) {
  if (typeof block === "string") {
    return (
      <p className="mt-4 first:mt-0">
        <Inline text={block} />
      </p>
    );
  }
  if (block.h) {
    return (
      <h4 className="mt-8 text-ui font-medium text-text">
        <Inline text={block.h} />
      </h4>
    );
  }
  if (block.ul || block.ol) {
    const Tag = block.ol ? "ol" : "ul";
    return (
      <Tag className={cx(LIST, block.ol ? "list-decimal" : "list-disc")}>
        {(block.ul || block.ol).map((item, i) => (
          <li key={i} className="pl-1">
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
  }
  if (block.address) {
    return (
      <address className="mt-4 not-italic">
        {block.address.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            <Inline text={line} />
          </Fragment>
        ))}
      </address>
    );
  }
  if (block.table) {
    const { caption, head, rows } = block.table;
    return (
      <div role="region" aria-label={caption} tabIndex={0} className="mt-6 overflow-x-auto border-y border-line focus-visible:outline-2 focus-visible:outline-focus">
        <table className="w-full min-w-[36rem] border-collapse text-left text-small">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th key={i} scope="col" className="border-b border-line-strong px-3 py-2 align-bottom font-medium">
                  <Inline text={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-line last:border-b-0">
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row" className="px-3 py-2 align-top font-medium">
                      <Inline text={cell} />
                    </th>
                  ) : (
                    <td key={c} className="px-3 py-2 align-top">
                      <Inline text={cell} />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.note) {
    // Notes of the draft for the law firm ("Anmerkung") or the build status
    // ("Stand der Umsetzung") – not part of the published text.
    return (
      <aside className="mt-6 border-l-2 border-notice bg-surface-raised px-4 py-3 text-small" aria-label={block.label || "Anmerkung des Entwurfs"}>
        <p className="text-overline uppercase text-text-soft">{block.label || "Anmerkung des Entwurfs – nicht Teil des Textes"}</p>
        {[].concat(block.note).map((n, i) => (
          <p key={i} className="mt-2">
            <Inline text={n} />
          </p>
        ))}
      </aside>
    );
  }
  return null;
}

export { KIND_LABEL };
