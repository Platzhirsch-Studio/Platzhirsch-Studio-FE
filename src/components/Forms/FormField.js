import { cx } from "@/components/ui";

// Form primitives of the Neuauftritt (Design-Bibel §9 "Formular", §14):
// visible label ABOVE the field, field 52 px high, 16 px text (no iOS zoom),
// pebble border (line-control, 3.14:1), no radius, error AT the field with
// icon + text (aria-invalid, aria-describedby). Server-safe, no state: the
// forms keep their own state and pass `error`.

const LABEL = "block text-ui text-text";
const CONTROL =
  "mt-2 block w-full bg-surface px-4 text-ui font-normal text-text transition-colors duration-(--duration-micro) ease-quiet " +
  "placeholder:text-text-soft disabled:cursor-not-allowed disabled:opacity-60";
// Hover darkens only the normal border; the error border stays red (P3-2).
const BORDER_OK = "border border-line-control hover:border-ink";
const BORDER_ERROR = "border-2 border-error";

/** Field border classes (exported for custom controls). */
export const fieldBorder = (invalid) => (invalid ? BORDER_ERROR : BORDER_OK);

// Labels from older messages carry their own markers ("Name *",
// "Telefon (optional)"); the field renders the markers itself.
const MARKERS = /\s*(\*|\((?:optional|optionnel|facultatif|opzionale|facoltativo)\))\s*$/i;
export function cleanLabel(label) {
  return typeof label === "string" ? label.replace(MARKERS, "").replace(MARKERS, "").trim() : label;
}

export function ErrorIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mt-px flex-none">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7.5v5.5M12 16.25v.25" />
    </svg>
  );
}

// Design-Jury P2-5: the circle stands, only the tick draws itself
// (globals.css .ph-tick > path, stroke-dashoffset 16 → 0 in 400 ms).
export function SuccessIcon({ className = "mt-0.5" } = {}) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={`ph-tick flex-none ${className}`}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M7.75 12.25l2.75 2.75 5.75-6" />
    </svg>
  );
}

/** Error line under a field; id = `${fieldId}-error`. */
export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-small text-error">
      <ErrorIcon />
      <span>{children}</span>
    </p>
  );
}

export function describedBy(id, { hint, error } = {}) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

/**
 * Label + input / textarea / select + hint + error.
 * @param {string} id               required, also the target of the error summary
 * @param {ReactNode} label         visible label (markers "*"/"(optional)" are normalised)
 * @param {boolean} [required]      adds " *" (aria-hidden; `required` itself tells AT)
 * @param {string} [optionalText]   e.g. "optional" → "(optional)" after the label
 * @param {ReactNode} [hint]        help text under the field
 * @param {string} [error]          error text (sets aria-invalid)
 * @param {"input"|"textarea"|"select"} [as="input"]
 * Other props go to the control (name, type, value, onChange, onBlur, autoComplete …).
 */
export default function FormField({
  id,
  label,
  required = false,
  optionalText,
  hint,
  error,
  as = "input",
  className,
  controlClassName,
  children,
  ...props
}) {
  const Control = as;
  const height = as === "textarea" ? "min-h-36 py-3 leading-normal" : "h-13";
  const select =
    as === "select"
      ? "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%2330373e%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px_8px] bg-[position:right_1rem_center] bg-no-repeat pr-10"
      : "";
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={id} className={LABEL}>
        {cleanLabel(label)}
        {required && <span aria-hidden="true"> *</span>}
        {!required && optionalText && <span className="font-normal text-text-soft"> ({optionalText})</span>}
      </label>
      <Control
        id={id}
        required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        className={cx(CONTROL, height, select, fieldBorder(error), controlClassName)}
        {...props}
      >
        {as === "input" ? undefined : children}
      </Control>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-small text-text-soft">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/**
 * Radio cards in a fieldset (Bibel §9 `RadioCard`): the native radio stays
 * visible (own focus ring, arrow keys), the whole card is the label, 64 px.
 * No auto-advance on choice (§14): the form has its own "Weiter".
 * @param {string} id               fieldset id; radios get `${id}-${index}`
 * @param {string} name
 * @param {ReactNode} legend
 * @param {Array<{value: string, label: ReactNode, icon?: ReactNode}>} options
 * @param {string|null} value
 * @param {(value: string) => void} onChange
 * @param {string} [error]
 * @param {"title"|"label"} [legendSize="title"] title = H3-like step question
 */
/**
 * @param {"default"|"fit"} [layout] default: 1 column, 3 from sm (viewport).
 *   fit (QM content-legal r2, Beratung): columns follow the space the cards
 *   really have, measured in rem (container query) – with 200 % text or a
 *   narrow column they drop to 2 or 1 column instead of cutting the labels.
 */
export function RadioCards({ id, name, legend, options, value, onChange, error, required = true, legendSize = "title", className, layout = "default" }) {
  const errorId = `${id}-error`;
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={error ? errorId : undefined} className={cx("min-w-0 focus:outline-none", className)}>
      <legend className={legendSize === "title" ? "text-title text-text" : LABEL}>
        {legend}
        {required && legendSize !== "title" && <span aria-hidden="true"> *</span>}
      </legend>
      {/* QM r3 (iPhone 15, 200 % Text): always a container – in a column under 14 rem
          (only with enlarged text) the decorative icon gives its room to the label. */}
      <div className="@container mt-stack-s">
      <div className={cx("grid grid-cols-1 gap-3", layout === "fit" ? "@min-[30rem]:grid-cols-2 @min-[48rem]:grid-cols-3" : "sm:grid-cols-3")}>
        {options.map((option, index) => {
          const optionId = `${id}-${index}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cx(
                // QM r3: under 14 rem (200 % text on phones) the radio sits above the label – words keep one line.
                "flex min-h-16 cursor-pointer items-center gap-3 bg-surface px-4 py-3 text-ui text-text @max-[14rem]:flex-col @max-[14rem]:items-start @max-[14rem]:gap-2",
                "transition-colors duration-(--duration-micro) ease-quiet",
                "has-checked:bg-surface-raised",
                error ? BORDER_ERROR : "border border-line-control hover:border-ink has-checked:border-ink has-checked:border-2 has-checked:px-[15px]"
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                required={required || undefined}
                className="ph-radio flex-none"
              />
              {option.icon && <span aria-hidden="true" className="flex-none text-text-soft @max-[14rem]:hidden [&>svg]:size-[1.375rem]">{option.icon}</span>}
              <span className="min-w-0 hyphens-auto wrap-break-word">{option.label}</span>
            </label>
          );
        })}
      </div>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}
