import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cx } from "@/components/ui";
import { formCopy } from "./useFormText";

/**
 * Short note under every lead form: where to read how the data is processed.
 * Deliberately NOT a legal text of its own (no purposes, no legal basis, no
 * promise like "only for …"): the privacy policy says that. Neutral wording
 * from src/lib/forms/i18n.js (`privacyBefore`/`privacyLink`/`privacyAfter`),
 * later from `forms.*` in the messages.
 * The link is inside running text, so WCAG 2.5.8's inline exception applies.
 * Server-safe (no "use client", no async).
 * @param {string} [id] e.g. to reference it from the form with aria-describedby
 * @param {"light"|"dark"} [tone="light"]
 */
export default function FormPrivacyNote({ id, tone = "light", className }) {
  const locale = useLocale();
  const t = useTranslations("forms");
  const get = (key) => formCopy(locale, t, key);
  const dark = tone === "dark";
  return (
    <p id={id} className={cx("max-w-measure text-small", dark ? "text-text-inverse-soft" : "text-text-soft", className)}>
      {get("privacyBefore")}
      <Link
        href="/datenschutz"
        className={cx(
          "underline underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-2",
          dark ? "text-text-inverse" : "text-text"
        )}
      >
        {get("privacyLink")}
      </Link>
      {get("privacyAfter")}
    </p>
  );
}
