'use client';

import { NextIntlClientProvider } from "next-intl";
import ClientLayout from "./client-layout";

// The page body is ALWAYS rendered (server-side included) so content lives in the
// initial SSR HTML — critical for crawlability and LCP. The intro loader is an
// overlay handled by <RouteLoader> inside ClientLayout; it must never gate the
// children out of the render (the previous `{!showLoader && children}` did exactly
// that, leaving an empty <body> in the SSR HTML site-wide).
export default function LoaderWrapper({ children, messages, locale }) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="Europe/Vienna">
      <ClientLayout>{children}</ClientLayout>
    </NextIntlClientProvider>
  );
}
