// src/components/ui/icons.js – the few line icons of the page shell, without
// lucide-react (Tempo-Runde Shell, qa-screenshots/tempo/shell.md).
//
// Header, footer, CTA bar and the ui primitives (Button, LinkArrow) are on
// every page. With lucide-react, its runtime (Icon, createLucideIcon,
// defaultAttributes, class helpers) sat in the shell chunks of EVERY page – in
// two chunks at once (konsolidierung/tempo.md §5). These components render the
// SAME markup as lucide-react 0.539 (same attributes, same classes
// "lucide lucide-<name> …", same path data, aria-hidden="true" when no
// aria-*/role/title prop and no children), so design, CSS hooks and tests stay
// unchanged. Server-safe (no hooks, no "use client"), no JSX: node --test can
// import it (tests/unit/tempo-shell.test.mjs).
//
// Page modules may keep using lucide-react; its runtime then loads with those
// pages only. A new shell icon: copy __iconNode from
// node_modules/lucide-react/dist/esm/icons/<name>.js.
import { createElement } from "react";

const hasA11yProp = (props) => Object.keys(props).some((k) => k.startsWith("aria-") || k === "role" || k === "title");

function shellIcon(name, nodes) {
  function Icon({ size = 24, strokeWidth = 2, color = "currentColor", absoluteStrokeWidth, className, children, ...rest }) {
    return createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: ["lucide", `lucide-${name}`, className].filter((c) => c && String(c).trim()).join(" "),
        ...(!children && !hasA11yProp(rest) ? { "aria-hidden": "true" } : {}),
        ...rest,
      },
      ...nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
      children
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const ArrowRight = shellIcon("arrow-right", [
  ["path", { d: "M5 12h14" }],
  ["path", { d: "m12 5 7 7-7 7" }],
]);
export const ArrowUpRight = shellIcon("arrow-up-right", [
  ["path", { d: "M7 7h10v10" }],
  ["path", { d: "M7 17 17 7" }],
]);
export const CalendarDays = shellIcon("calendar-days", [
  ["path", { d: "M8 2v4" }],
  ["path", { d: "M16 2v4" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
  ["path", { d: "M3 10h18" }],
  ["path", { d: "M8 14h.01" }],
  ["path", { d: "M12 14h.01" }],
  ["path", { d: "M16 14h.01" }],
  ["path", { d: "M8 18h.01" }],
  ["path", { d: "M12 18h.01" }],
  ["path", { d: "M16 18h.01" }],
]);
export const ChevronDown = shellIcon("chevron-down", [["path", { d: "m6 9 6 6 6-6" }]]);
export const Heart = shellIcon("heart", [
  [
    "path",
    {
      d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
    },
  ],
]);
export const LayoutGrid = shellIcon("layout-grid", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
]);
export const Menu = shellIcon("menu", [
  ["path", { d: "M4 12h16" }],
  ["path", { d: "M4 18h16" }],
  ["path", { d: "M4 6h16" }],
]);
export const MessageCircle = shellIcon("message-circle", [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
    },
  ],
]);
export const Minus = shellIcon("minus", [["path", { d: "M5 12h14" }]]);
export const Phone = shellIcon("phone", [
  [
    "path",
    {
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
    },
  ],
]);
export const Plus = shellIcon("plus", [
  ["path", { d: "M5 12h14" }],
  ["path", { d: "M12 5v14" }],
]);
export const Search = shellIcon("search", [
  ["path", { d: "m21 21-4.34-4.34" }],
  ["circle", { cx: "11", cy: "11", r: "8" }],
]);
export const ShoppingBag = shellIcon("shopping-bag", [
  ["path", { d: "M16 10a4 4 0 0 1-8 0" }],
  ["path", { d: "M3.103 6.034h17.794" }],
  ["path", { d: "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" }],
]);
export const X = shellIcon("x", [
  ["path", { d: "M18 6 6 18" }],
  ["path", { d: "m6 6 12 12" }],
]);
