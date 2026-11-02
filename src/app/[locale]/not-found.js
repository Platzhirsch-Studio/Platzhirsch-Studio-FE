import { useLocale } from "next-intl";
import NotFoundContent from "@/components/NotFound/NotFoundContent";

// Unknown paths under a locale (e.g. /en/old-link, via [...rest] or notFound()):
// rendered inside the locale layout, so Navbar, Footer and translations apply.
// Tempo & A11y (Konsolidierung): a Server Component now. As a client component
// its chunk (NotFoundContent, links, icons) was part of the locale layout's
// boundary and so downloaded and evaluated on EVERY page, before hydration.
// NotFoundContent itself has no client state; the global 404
// (NotFoundLocales, client) still bundles it on its own route only.
export default function NotFound() {
  return <NotFoundContent locale={useLocale()} />;
}
