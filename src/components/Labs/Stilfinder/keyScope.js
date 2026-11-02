// Stil-Finder – keyboard scope of the quiz shortcuts (1–5 choose, ← / Backspace
// back). Plain module, no React, no DOM globals: StilfinderQuiz.js passes the
// quiz root, the unit test passes stubs.
//
// WCAG 2.2 SC 2.1.4 (Character Key Shortcuts, A): a single-character shortcut
// must be "active only on focus" of the component. The listener sits on
// window, so it has to ignore keys whose target is outside the quiz – the
// KI-Concierge chat, the cookie banner, the header search – and every text
// field, also inside the quiz (the optional scope question has none today).

const TEXT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * True when a quiz shortcut may act on a keydown with this target.
 * @param {EventTarget|null} target  event.target
 * @param {{contains: (n: unknown) => boolean}|null} root  the #stilfinder section
 */
export function quizOwnsKey(target, root) {
  if (!target) return true;
  const doc = target.ownerDocument;
  // Nothing focused (focus on <body>/<html>): the quiz is the page's tool.
  if (doc && (target === doc.body || target === doc.documentElement)) return true;
  if (TEXT_TAGS.has(target.tagName) || target.isContentEditable) return false;
  return !!root && typeof root.contains === "function" && root.contains(target);
}

/** Accessible name of a question heading: position + question text. */
// `tpl` (optional, Mehrsprachigkeit): "Question {n} of {total}: {title}".
export const questionLabel = (index, total, title, tpl = "Frage {n} von {total}: {title}") =>
  tpl.replace("{n}", String(index + 1)).replace("{total}", String(total)).replace("{title}", title);
