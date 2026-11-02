// src/components/Forms/domChoice.js – QM content-legal r3 (iPad hoch /beratung,
// iPhone /termin): a radio tapped BEFORE hydration finished is checked in the
// DOM, but React's state never heard of it ("einen Neubau" visibly chosen,
// "Weiter" said "Bitte wählen Sie eine Möglichkeit"). The wizards adopt such a
// choice on mount and again when "Weiter" finds their state empty.
// Browser only (effects and event handlers).

/**
 * Value of the checked radio named `name` (optionally only among `allowed`).
 * @param {string} name
 * @param {(value: string) => boolean} [allowed]
 * @param {Document|HTMLElement} [root=document]
 * @returns {string|null}
 */
export function domChoice(name, allowed, root) {
  const scope = root || (typeof document !== "undefined" ? document : null);
  if (!scope?.querySelectorAll) return null;
  for (const el of scope.querySelectorAll(`input[type="radio"][name="${name}"]`)) {
    if (el.checked && (!allowed || allowed(el.value))) return el.value;
  }
  return null;
}
