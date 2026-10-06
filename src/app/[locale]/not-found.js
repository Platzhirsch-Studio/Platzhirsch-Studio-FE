"use client";
import { useLocale } from "next-intl";
import NotFoundContent from "@/components/NotFound/NotFoundContent";

// Unknown paths under a locale (e.g. /en/old-link, via [...rest] or notFound()):
// rendered inside the locale layout, so Navbar, Footer and translations apply.
export default function NotFound() {
  return <NotFoundContent locale={useLocale()} />;
}
