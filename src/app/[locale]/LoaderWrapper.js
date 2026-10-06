'use client';

import { NextIntlClientProvider } from "next-intl";
import ClientLayout from "./client-layout";

// The page body is ALWAYS rendered (server-side included) so content lives in the
// initial SSR HTML — critical for crawlability and LCP. Never gate the children
// out of the render (a former `{!showLoader && children}` did exactly that,
// leaving an empty <body> in the SSR HTML site-wide). The intro loader overlay
// was removed: it hid the finished page for 2.5 s on every first visit.
export default function LoaderWrapper({ children, messages, locale, activeCategoryKeys }) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="Europe/Vienna">
      <ClientLayout activeCategoryKeys={activeCategoryKeys}>{children}</ClientLayout>
    </NextIntlClientProvider>
  );
}
