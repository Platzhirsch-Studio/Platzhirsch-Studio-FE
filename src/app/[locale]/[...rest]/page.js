import { notFound } from "next/navigation";

// Catch-all for any unknown route under a locale (e.g. /de/old/removed/link).
// Triggering notFound() here renders [locale]/not-found.js *inside* the locale
// layout, so the Navbar, Footer and NextIntlClientProvider (translations) apply.
export default function CatchAllNotFound() {
    notFound();
}