"use client";
import { forwardRef } from "react";
import cx from "@/components/ui/cx";
import { ErrorIcon, SuccessIcon } from "./FormField";
import { focusField } from "./useFormGuard";

/**
 * Status area of a form: ONE polite live region that is always in the DOM
 * (a region that appears together with its text is often not announced).
 * Shows either the error summary (links to the fields, Bibel §14) or a
 * request error (translated `code`). Focus is NOT moved here: the form
 * moves it to the first invalid field; the region only announces.
 * @param {{ type: "summary", title: string, items: Array<{id: string, text: string}> }
 *        | { type: "error", text: string } | null} status
 */
export function FormAlert({ status, className }) {
  const active = status && (status.type === "error" || status.type === "summary");
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={cx(active && "border-l-2 border-error bg-surface-raised px-[16px] py-4 sm:px-5", className)}>
      {active && (
        <>
          <p className="flex items-start gap-2 text-ui text-error">
            <ErrorIcon />
            <span>{status.type === "summary" ? status.title : status.text}</span>
          </p>
          {status.type === "summary" && status.items?.length > 0 && (
            <ul className="mt-2 space-y-1 pl-[24px] text-small text-text">
              {status.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      focusField(item.id);
                    }}
                    className="inline-flex min-h-6 items-center underline underline-offset-4"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Inline confirmation after a successful submit (Bibel §9 `InlineConfirmation`).
 * The form it replaces is gone, so the form focuses this box (tabIndex -1);
 * role="status" announces it politely as well.
 */
export const FormSuccess = forwardRef(function FormSuccess({ title, children, className }, ref) {
  return (
    <div ref={ref} tabIndex={-1} role="status" className={cx("ph-arrive border-t-2 border-success bg-surface-raised p-6 sm:p-8 focus-visible:outline-none", className)}>
      <p className="flex items-start gap-3 text-ui text-success">
        <SuccessIcon />
        <span>{title}</span>
      </p>
      {children && <div className="mt-4 text-body text-text">{children}</div>}
    </div>
  );
});
