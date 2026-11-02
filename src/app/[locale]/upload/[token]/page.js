// /de/upload/<token> — mobile upload page behind the QR code on the inquiry
// success screens. German only; noindex; no referrer (the token is the key).
// Bare site shell (BareShell: wordmark + "Zurück") plus UploadFrame: task, mini footer —
// no site menu.
// While uploadsAccepting() is false (Löschfrist not confirmed, r1-recht-inhalt
// P0-4) or the token secret is missing (r1-technik P0-1), a valid or expired
// link shows the "paused" notice (200, noindex) and takes nothing.
// Status codes: valid link 200 (noindex); expired link 200 (noindex) with the
// "Link abgelaufen" help text; unknown/forged/malformed token -> notFound()
// = HTTP 404 with the same help text (./not-found.js), so a guessed URL never
// answers 200 (QA R2-upload P3).
// Feature doc: Marktresearch/digital/features/handy-upload.md
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { tx } from "@/lib/portal/i18n";
import { headers } from "next/headers";
import { SITE_NAME } from "@/lib/site";
import { openSession, publicSession, UploadError } from "@/lib/upload/service";
import { uploadsAccepting } from "@/lib/upload/config";
import { buildHandoff } from "@/lib/upload/handoff";
import UploadClient from "@/components/Upload/UploadClient";
import UploadFrame, { UPLOAD_PROBLEM, UploadProblemBody, problemTitle } from "@/components/Upload/UploadFrame";
import { portalMetadata } from "@/lib/portal/metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = portalMetadata({
  title: `Unterlagen hochladen | ${SITE_NAME}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
});

export default async function UploadPage({ params }) {
  const { locale, token } = await params;
  if (locale !== "de") notFound();
  const t = await getTranslations();

  let session = null;
  let problem = null;
  try {
    session = publicSession((await openSession(token)).session);
  } catch (e) {
    if (!(e instanceof UploadError)) throw e;
    if (e.code === "unavailable") problem = UPLOAD_PROBLEM.paused;
    else if (e.code === "expired") problem = UPLOAD_PROBLEM.expired;
    else notFound();
  }
  if (!uploadsAccepting()) {
    session = null;
    problem = UPLOAD_PROBLEM.paused;
  }
  // Desktop visitors (lg+) get the QR of this very link next to the form.
  const qr = session ? (await buildHandoff({ token, ref: session.ref, expiresAt: new Date(session.expiresAt) }, await headers())).qr : null;

  return (
    <UploadFrame>
      <div className="mx-auto w-full max-w-5xl flex-1 lg:grid lg:grid-cols-[28rem_1fr] lg:gap-16 lg:px-8 lg:pt-10">
        <div className="min-w-0">
          {/* Labs-Ausbau: calm title block, safe-area aware (landscape notch). */}
          <div className="pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-6">
            <p className="text-overline uppercase text-gold-text">{SITE_NAME} · Lochau</p>
            <h1 className="font-display mt-2 text-[2rem] leading-[1.1] text-balance sm:text-display-m">{problem ? problemTitle(t, problem) : tx(t, "Upload.page.title", "Zeigen Sie uns Ihren Raum")}</h1>
            {session && (
              <p className="mt-3 text-base leading-relaxed text-ink/85 text-pretty">
                {tx(t, "Upload.page.introBefore", "Fotos, Video oder Grundriss zu Ihrer Anfrage")}{" "}
                <span className="whitespace-nowrap border border-line bg-paper px-1.5 py-0.5 text-sm font-medium tabular-nums">{session.ref}</span>{" "}
                {tx(t, "Upload.page.introAfter", "– so beraten wir Sie gezielt.")}
              </p>
            )}
          </div>

          {problem ? <UploadProblemBody problem={problem} /> : <UploadClient token={token} initialSession={session} />}
        </div>

        {qr && (
          <aside className="hidden lg:block lg:pt-24" aria-label={tx(t, "Upload.page.handoffLabel", "Am Handy weitermachen")}>
            <div className="max-w-xs border-l border-line-strong pl-8">
              <p className="font-display text-2xl leading-snug">{tx(t, "Upload.page.handoffTitle", "Am Computer?")}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{tx(t, "Upload.page.handoffText", "Scannen Sie diesen Code mit dem Handy – Fotos und Videos gehen direkt aus der Kamera.")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                width={224}
                height={224}
                alt={tx(t, "Upload.page.qrAlt", "QR-Code dieser Upload-Seite – mit der Handykamera scannen")}
                className="mt-5 size-56 bg-paper ring-1 ring-line"
              />
              <p className="mt-2 text-xs text-ink/80">{tx(t, "Upload.page.qrHint", "Mit der Kamera scannen")}</p>
            </div>
          </aside>
        )}
      </div>
    </UploadFrame>
  );
}
