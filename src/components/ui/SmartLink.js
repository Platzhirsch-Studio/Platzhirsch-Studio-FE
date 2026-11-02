import { Link } from "@/i18n/navigation";
import { splitLocalePrefix } from "./localePrefix";

export { splitLocalePrefix };

// Internal paths ("/produkte") go through next-intl's Link (locale prefix,
// client navigation); absolute URLs, mailto:, tel: and #anchors stay plain <a>.
// A path with an explicit language ("/en/hotel-objekt") keeps that language
// (ui/localePrefix.js) instead of getting a second prefix.
export function isExternal(href) {
  return typeof href === "string" && /^(https?:|mailto:|tel:|#|\/\/)/.test(href);
}

export default function SmartLink({ href, children, ...rest }) {
  if (isExternal(href)) {
    const blank = rest.target === "_blank";
    return (
      <a href={href} rel={blank ? "noopener noreferrer" : rest.rel} {...rest}>
        {children}
      </a>
    );
  }
  const prefixed = !rest.locale && splitLocalePrefix(href);
  if (prefixed) {
    return (
      <Link hrefLang={prefixed.locale} {...rest} href={prefixed.href} locale={prefixed.locale}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
