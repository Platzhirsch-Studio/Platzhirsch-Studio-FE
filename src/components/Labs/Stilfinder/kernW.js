// Bodoni Moda has no kerning pairs for "W" + lowercase ("W elcher", "W ie").
// Local optical kern for Stil-Finder display headings until the global
// display fix lands (R2 P2-3). The span stays inside the word, so screen
// readers and copy/paste still get the plain text.
export const W_KERN = "tracking-[-0.085em]";

export function kernW(text) {
  if (typeof text !== "string" || !/W\p{Ll}/u.test(text)) return text;
  return text.split(/(W(?=\p{Ll}))/u).map((part, i) =>
    part === "W" ? (
      <span key={i} className={W_KERN}>
        W
      </span>
    ) : (
      part
    )
  );
}
