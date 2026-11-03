import { Fragment, cloneElement, createElement, isValidElement } from "react";
import { Container } from "@/components/ui";
import { legalTypo, mapStrings } from "./legalTypo";

// Typography frame for legal texts (Impressum, Datenschutz): 18 px body,
// max. 68 characters per line, H2 in Instrument (title), links underlined in
// ink (no gold on light, Bibel §4). Only the presentation – the texts stay
// exactly as they were until the legal drafts are approved.
const PROSE = [
  // QM r2 (200 % text): long compounds ("Unternehmensgesetzbuch") wrap instead of
  // being cut off at the right edge (phones also hyphenate, globals.css).
  // QM content-legal r3 (iPad quer): 68ch gave 90–95 characters a line (ch = width of
  // "0", wider than the average letter) – 56ch is about 75 characters.
  "max-w-[56ch] text-body text-text wrap-break-word",
  "[&_p]:mt-4 [&_p:first-child]:mt-0",
  "[&_h2]:mt-12 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-8 [&_h2]:text-title [&_h2]:text-text",
  // Druck 02.11.: Paragraphenabstand auf Papier etwas enger (AGB: Schlusszeile rutschte allein auf ein 23. Blatt).
  "print:[&_h2]:mt-8 print:[&_h2]:pt-5",
  "[&_h2+p]:mt-3",
  "[&_strong]:font-medium",
  "[&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_a]:break-words",
].join(" ");

export default function LegalProse({ children }) {
  return (
    // Druck 02.11.: Papier bleibt weiß.
    <section className="bg-surface pb-section print:bg-white">
      {/* QM content-legal r2 (iPad quer): page container, the text column (max. 68
          characters) starts on the grid line of logo and breadcrumb instead of centred. */}
      <Container size="page">
        {/* The legal texts exist in German only: lang="de" on every locale
            (WCAG 3.1.2, r3-recht-inhalt P1-2). On EN/FR/IT the header above
            says so in the page language (Legal/GermanOnlyNotice.js). */}
        <div lang="de" data-legal-body="" className={PROSE}>
          {/* QM r3: protected spaces in citations („Art. 6 Abs. 1“, „§ 165“) – presentation only. */}
          {/* Spread as arguments: static children need no keys (an array would). */}
          {createElement(Fragment, null, ...[].concat(mapStrings(children, legalTypo, { cloneElement, isValidElement, createElement, Fragment })))}
        </div>
      </Container>
    </section>
  );
}
