// Unknown, forged or malformed upload token (page.js calls notFound()):
// HTTP 404 (Next adds <meta name="robots" content="noindex">), but the same
// calm upload frame and help text instead of the generic site 404, so a
// customer with a broken QR link still gets phone and e-mail.
import { SITE_NAME } from "@/lib/site";
import { useTranslations } from "next-intl";
import UploadFrame, { UPLOAD_PROBLEM, UploadProblemBody, problemTitle } from "@/components/Upload/UploadFrame";

export default function UploadTokenNotFound() {
  const problem = UPLOAD_PROBLEM.invalid;
  const t = useTranslations();
  return (
    <UploadFrame>
      <div className="mx-auto w-full max-w-5xl flex-1 lg:px-8 lg:pt-10">
        <div className="max-w-[28rem]">
          <div className="px-4 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">{SITE_NAME} · Lochau</p>
            <h1 className="font-display mt-1.5 text-[1.75rem] leading-tight sm:text-3xl">{problemTitle(t, problem)}</h1>
          </div>
          <UploadProblemBody problem={problem} />
        </div>
      </div>
    </UploadFrame>
  );
}
