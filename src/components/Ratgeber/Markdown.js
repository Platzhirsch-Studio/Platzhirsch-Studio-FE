// Markdown → React for the Ratgeber (Server Component, no client JS).
// Renders the block list from src/lib/ratgeber/article.js. Every string is a
// React text node – there is no dangerouslySetInnerHTML anywhere, so raw HTML
// in an article can never reach the page as markup.
// Written with createElement (no JSX) so the unit test can render it with
// react-dom/server under plain `node --test`.
import { createElement as h, Fragment } from "react";
import { classifyHref, parseInline } from "../../lib/ratgeber/markdown.js";
// QM r3: legalTypo = typoDe + „8,1 Prozent“, „18 Uhr“, „V-ZUG“ unbroken.
import { legalTypo as typoDe } from "../Impressum/legalTypo.js";
// QM content-legal r3 (200 % text, WebKit): soft hyphens at syllable points.
import { hyphenateDe } from "../../lib/text/hyphenateDe.js";

const linkClass =
  "text-text underline decoration-1 underline-offset-4 decoration-line-strong hover:decoration-text transition-colors duration-(--duration-micro)";

function renderInline(nodes, keyPrefix = "i") {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "text":
        // Optik QA: "50 cm", "§ 2", "z. B." never break apart (protected spaces).
        // QM r3: long compounds get soft hyphens (no „Mehrwertsteu/er“ without a hyphen).
        return h(Fragment, { key }, hyphenateDe(typoDe(node.value)));
      case "strong":
        return h("strong", { key, className: "font-semibold text-text" }, renderInline(node.children, key));
      case "em":
        return h("em", { key }, renderInline(node.children, key));
      case "code":
        return h("code", { key, className: "bg-surface-band px-1 text-[0.95em]" }, node.value);
      case "link": {
        const kind = classifyHref(node.href);
        const children = renderInline(node.children, key);
        if (!kind) return h(Fragment, { key }, children);
        if (kind === "external") {
          return h(
            "a",
            { key, href: node.href, rel: "noopener noreferrer", className: linkClass },
            children,
            h("span", { className: "sr-only" }, " (externe Seite)")
          );
        }
        return h("a", { key, href: node.href, className: linkClass }, children);
      }
      default:
        return null;
    }
  });
}

export function Inline({ text }) {
  return h(Fragment, null, renderInline(parseInline(text)));
}

// Soft line breaks inside a paragraph become spaces.
const flat = (text) => String(text ?? "").replace(/\s*\n\s*/g, " ");

const HEADING_CLASS = {
  2: "font-display text-display-m text-text mt-16 mb-6",
  3: "text-title text-text mt-10 mb-4",
  4: "text-lead font-medium text-text mt-8 mb-3",
};

function Heading({ block }) {
  const level = Math.min(Math.max(block.level, 2), 4);
  return h(`h${level}`, { id: block.id, className: HEADING_CLASS[level] }, h(Inline, { text: block.text }));
}

const SCROLL_HINT = [
  "linear-gradient(to right, var(--color-surface) 30%, transparent) left / 2.5rem 100% no-repeat local",
  "linear-gradient(to left, var(--color-surface) 30%, transparent) right / 2.5rem 100% no-repeat local",
  "linear-gradient(to right, var(--color-line-strong), transparent) left / 0.75rem 100% no-repeat scroll",
  "linear-gradient(to left, var(--color-line-strong), transparent) right / 0.75rem 100% no-repeat scroll",
].join(", ");

// QM content-legal r2: on phones (and with 200 % text) the 5-column Jahresplan
// scrolled sideways with two columns fully hidden, and the 3-column stone table
// ran to seven lines per cell. Where the column is narrower than the table needs
// (container query in rem, so it follows the text size), every row becomes a
// small block: row header, then "column: value" lines. Only one of the two
// renderings is displayed at a time (display:none hides the other from AT too).
function StackedTable({ block, caption, wide, narrow }) {
  return h(
    "div",
    { className: `my-8 border-y border-line ${wide ? "@min-[36rem]:hidden" : narrow ? "@min-[20rem]:hidden" : "@min-[26rem]:hidden"}` },
    h("p", { className: "py-3 text-small text-text-soft" }, caption),
    h(
      "ul",
      { className: "divide-y divide-line border-t border-line-strong" },
      block.rows.map((row, r) =>
        h(
          "li",
          { key: r, className: "py-4" },
          h("p", { className: "text-ui font-medium text-text" }, h(Inline, { text: row[0] || "" })),
          h(
            "dl",
            { className: "mt-2 space-y-1 text-small text-text" },
            row.slice(1).map((cell, c) =>
              h(
                "div",
                { key: c },
                h("dt", { className: "inline font-medium text-text-soft" }, h(Inline, { text: block.head[c + 1] || "" }), ": "),
                h("dd", { className: "inline" }, h(Inline, { text: cell }))
              )
            )
          )
        )
      )
    )
  );
}

function Table(props) {
  const wide = props.block.head.length > 3;
  // QM r3 (200 % text): the 2-column "Rechenbeispiel" cut its Betrag column off –
  // two columns stack below 20 rem (only at large text sizes on phones).
  const narrow = props.block.head.length < 3;
  return h(
    "div",
    { className: "@container" },
    h(StackedTable, { ...props, wide, narrow }),
    h("div", { className: wide ? "hidden @min-[36rem]:block" : narrow ? "hidden @min-[20rem]:block" : "hidden @min-[26rem]:block" }, h(TableGrid, props))
  );
}

function TableGrid({ block, caption, index }) {
  const captionId = `tabelle-${index}`;
  // QM r3 (200 % text): the caption stands ABOVE the scrolling box – inside it,
  // it scrolled away with the columns („Rechenbeispiel:“ cut off). The real
  // <caption> stays for assistive tech (sr-only), the visible line is aria-hidden.
  return h(
    "figure",
    { className: "my-8" },
    h("p", { "aria-hidden": "true", className: "border-t border-line py-3 text-small text-text-soft" }, caption),
    h(
    "div",
    {
      role: "region",
      "aria-labelledby": captionId,
      tabIndex: 0,
      className: "max-w-full overflow-x-auto border-b border-line focus-visible:outline-2",
      // Optik QA: when a wide table scrolls sideways, a soft edge shadow shows
      // that more columns follow (CSS only: the cover gradients scroll along).
      style: { background: SCROLL_HINT },
    },
    h(
      "table",
      // Three columns fit 350 px wrapped; only four and more need the scroll.
      // QM: four+ columns stay at text-small on every width – at text-body the
      // 5-column Jahresplan overflowed the ~690 px reading column on laptops.
      // QM r3 (iPad): one size for every table (two tables in one article were 14 and 17 px).
      { className: `w-full ${block.head.length > 3 ? "min-w-[34rem]" : ""} border-collapse text-left text-small tabular` },
      h("caption", { id: captionId, className: "sr-only" }, caption),
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          // QM r3 (WebKit): the rule sits on the cells – a row border was drawn
          // strong under the first column only.
          block.head.map((cell, i) =>
            h("th", { key: i, scope: "col", className: "border-b border-line-strong py-3 pr-4 align-bottom font-semibold text-text" }, h(Inline, { text: cell }))
          )
        )
      ),
      h(
        "tbody",
        null,
        block.rows.map((row, r) =>
          h(
            "tr",
            { key: r, className: "group/row" },
            row.map((cell, c) =>
              c === 0
                ? h("th", { key: c, scope: "row", className: "border-b border-line py-3 pr-4 align-top font-medium text-text group-last/row:border-b-0" }, h(Inline, { text: cell }))
                : h("td", { key: c, className: "border-b border-line py-3 pr-4 align-top text-text group-last/row:border-b-0" }, h(Inline, { text: cell }))
            )
          )
        )
      )
    )
    )
  );
}

function Faq({ block }) {
  return h(
    "div",
    { className: "mt-2" },
    block.items.map((item) =>
      h(
        "div",
        { key: item.id, className: "border-t border-line py-6" },
        h("h3", { id: item.id, className: "text-title text-text" }, h(Inline, { text: item.q })),
        item.a.map((p, i) => h("p", { key: i, className: "mt-3 text-body text-text" }, h(Inline, { text: flat(p) })))
      )
    )
  );
}

function Block({ block, context }) {
  switch (block.type) {
    case "heading":
      return h(Heading, { block });
    case "paragraph":
      return h("p", { className: "my-5 text-body text-text" }, h(Inline, { text: flat(block.text) }));
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      return h(
        tag,
        {
          className: `my-5 space-y-2 pl-[22px] text-body text-text marker:text-text-soft ${block.ordered ? "list-decimal" : "list-disc"}`,
          ...(block.ordered && block.start !== 1 ? { start: block.start } : {}),
        },
        block.items.map((item, i) => h("li", { key: i, className: "pl-[2px]" }, h(Inline, { text: flat(item) })))
      );
    }
    case "table":
      return h(Table, { block, caption: context.caption, index: context.index });
    case "quote":
      return h(
        "blockquote",
        { className: "my-8 border-l-2 border-line-strong bg-surface-raised px-[16px] py-4 sm:px-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" },
        h(Blocks, { blocks: block.children })
      );
    case "faq":
      return h(Faq, { block });
    case "hr":
      return h("hr", { className: "my-12 border-0 border-t border-line" });
    default:
      return null;
  }
}

// Renders a block list. Table captions name the section they belong to.
export function Blocks({ blocks }) {
  let section = null;
  let tables = 0;
  return h(
    Fragment,
    null,
    blocks.map((block, i) => {
      if (block.type === "heading" && block.level <= 3) section = block.text;
      let context = {};
      if (block.type === "table") {
        tables += 1;
        context = { caption: section ? `Tabelle: ${section.replace(/[*`]/g, "")}` : "Tabelle", index: `${i}-${tables}` };
      }
      return h(Block, { key: i, block, context });
    })
  );
}

export default Blocks;
