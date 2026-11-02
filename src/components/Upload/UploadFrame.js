// Shared frame of /de/upload/<token>: task area and mini footer.
// Used by the page itself and by its not-found.js (unknown/invalid token,
// served with HTTP 404 so it can never be indexed as an empty upload page).
//
// R4-portal-labs: the site shell renders this route bare (client-layout.js ->
// Reusable/BareShell: header[data-shell="bare"] with wordmark and "Zurück zur
// Website"; no menu, site footer, CTA bar or consent bar). The former
// FocusShell (fixed cover + `inert` on everything outside <main>) is gone:
// no second scroll container, no second logo, normal page scroll, and the
// shell's "Zurück" link is reachable by keyboard again. The frame keeps its
// own legal nav ("Rechtliches", with the phone number); BareShell hides its
// one-line legal footer when it finds it (globals.css, :has()).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { tx } from "@/lib/portal/i18n";
import { Mail, Phone } from "lucide-react";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";

// key: Upload.problem.<key>.* (messages-r5-portal.json); title/text bleiben der DE-Fallback.
export const UPLOAD_PROBLEM = {
  expired: {
    key: "expired",
    title: "Link abgelaufen",
    text: "Dieser Upload-Link ist abgelaufen. Aus Datenschutzgründen ist jeder Link nur begrenzt gültig.",
  },
  // r1-recht-inhalt P0-4 / r1-technik P0-1: the upload takes nothing (Löschfrist
  // not confirmed, or no UPLOAD_TOKEN_SECRET). Same calm frame, other channels.
  paused: {
    key: "paused",
    title: "Upload im Moment nicht möglich",
    text: "Über diesen Link nehmen wir im Moment keine Dateien an. Ihre Anfrage ist bei uns, daran ändert sich nichts.",
  },
  invalid: {
    key: "invalid",
    title: "Link unvollständig",
    text: "Dieser Upload-Link ist unvollständig oder ungültig. Bitte scannen Sie den QR-Code erneut oder öffnen Sie den Link aus Ihrer E-Mail.",
  },
};

const btn =
  "inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[15px] font-medium tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/** Title of a problem in the current language (R5: Upload.problem.<key>.title, fallback DE). */
export function problemTitle(t, problem) {
  return tx(t, `Upload.problem.${problem.key}.title`, problem.title);
}

/** Text and the two alternative channels (phone, e-mail) for a link that cannot be used. */
export function UploadProblemBody({ problem }) {
  const t = useTranslations();
  return (
    <div className="px-4 pb-16 pt-4 text-[15px] leading-relaxed text-ink/85">
      <p>{tx(t, `Upload.problem.${problem.key}.text`, problem.text)}</p>
      <p className="mt-4">{tx(t, "Upload.problem.alternatives", "Sie können uns Ihre Unterlagen auch per E-Mail senden oder uns anrufen.")}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a href={PHONE_HREF} className={`${btn} bg-ink text-white hover:bg-ink-deep`}>
          <Phone size={18} aria-hidden="true" /> {tx(t, "Upload.problem.call", "Anrufen")} · {PHONE_DISPLAY}
        </a>
        <a href={EMAIL_HREF} className={`${btn} border border-ink/30 bg-white text-ink hover:border-ink`}>
          <Mail size={18} aria-hidden="true" /> {tx(t, "Upload.problem.mail", "E-Mail an {email}", { email: EMAIL })}
        </a>
      </div>
    </div>
  );
}

export default function UploadFrame({ children }) {
  const t = useTranslations();
  return (
      <div data-upload-frame="" className="flex min-h-[calc(100dvh-4rem)] flex-col bg-bone text-ink">
        {children}

        <footer className="mt-10 border-t border-stone/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-center text-xs text-ink/80">
          {/* aria-label bleibt wörtlich "Rechtliches": globals.css blendet die Shell-Fußzeile über
              nav[aria-label="Rechtliches"] aus (und r4-portal.test prüft es). Upload ist DE-only;
              vor einer EN-Freigabe auf ein data-Attribut umstellen, dann Upload.frame.legal lesen. */}
          <nav aria-label="Rechtliches" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/de/impressum" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              {tx(t, "Upload.frame.imprint", "Impressum")}
            </Link>
            <Link href="/de/datenschutz" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              {tx(t, "Upload.frame.privacy", "Datenschutz")}
            </Link>
            <a href={PHONE_HREF} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              {PHONE_DISPLAY}
            </a>
          </nav>
        </footer>
      </div>
  );
}
